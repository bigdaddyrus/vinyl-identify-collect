import { GoogleGenerativeAI } from '@google/generative-ai';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { AnalysisResult, CapturedImage, ExtendedDetailSection } from '@/types';
import { appConfig } from '@/config/appConfig';
import { normalizeOrigin } from '@/data/countryCoordinates';
import { analysisResponseSchema } from './analysisSchema';
import type { DiscogsResult } from './discogs';

const API_TIMEOUT_MS = 30_000;

function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

/**
 * Sanitize and normalize the extendedDetails structure coming from the AI.
 * Ensures we only return well-formed sections with string items, so the UI
 * can safely call section.items.map(...).
 */
function sanitizeExtendedDetails(
  raw: unknown
): ExtendedDetailSection[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const sanitizedSections: ExtendedDetailSection[] = [];

  for (const section of raw) {
    if (!section || typeof section !== 'object') {
      continue;
    }

    // Use a loose type to safely inspect properties without trusting shape.
    const anySection = section as Record<string, unknown>;

    const titleValue = anySection.title ?? anySection.name ?? anySection.heading;
    const itemsValue = anySection.items;

    if (!Array.isArray(itemsValue)) {
      continue;
    }

    const items: { label: string; value: string }[] = [];
    for (const item of itemsValue) {
      if (item == null || typeof item !== 'object') continue;
      const anyItem = item as Record<string, unknown>;
      const label = anyItem.label != null ? String(anyItem.label).trim() : '';
      const value = anyItem.value != null ? String(anyItem.value).trim() : '';
      if (label && value) {
        items.push({ label, value });
      }
    }

    if (items.length === 0) {
      continue;
    }

    const title =
      titleValue == null || String(titleValue).trim().length === 0
        ? 'Details'
        : String(titleValue);

    const icon = typeof anySection.icon === 'string' ? anySection.icon : undefined;

    sanitizedSections.push({ title, items, ...(icon ? { icon } : {}) });
  }

  return sanitizedSections.length > 0 ? sanitizedSections : undefined;
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return cleaned.trim();
}

const PAIRING_INSTRUCTIONS = `
"vibePairing": "A short, evocative recommendation of when/where/how to listen to this record (e.g. 'Late-night drive with the windows down', 'Sunday morning coffee on the porch'). Max 100 characters.",
"foodPairing": "A specific food that pairs with the mood/genre/era of this record (e.g. 'Slow-smoked brisket with cornbread', 'Fresh oysters with mignonette'). Max 100 characters.",
"drinkPairing": "A specific drink that pairs with the mood/genre/era of this record (e.g. 'Bourbon old fashioned', 'Espresso martini', 'Chilled sake'). Max 100 characters."`;

function buildDiscogsEnrichedPrompt(discogsData: DiscogsResult, basePrompt: string, hasImages: boolean): string {
  const tracklistStr = discogsData.tracklist.length > 0
    ? discogsData.tracklist.slice(0, 10).map((t) => `${t.position} ${t.title}`.trim()).join(', ')
    : 'N/A';

  const stylesStr = discogsData.styles.length > 0
    ? discogsData.styles.join(', ')
    : 'N/A';

  const instruction = hasImages
    ? 'Using this reference data and the attached images, confirm or refine the identification, assess the physical condition of the vinyl and sleeve, estimate the market value for this specific pressing, and write pairing recommendations.'
    : 'Using this reference data (no images provided), provide your best identification, estimate the market value for this specific pressing based on known data, and write pairing recommendations. Since no images are available, set condition to "Uncertain".';

  return `The following record has been identified via barcode lookup:
Artist: ${discogsData.artist}
Title: ${discogsData.title}
Year: ${discogsData.year}
Label: ${discogsData.label}
Genre: ${discogsData.genre}
Styles: ${stylesStr}
Cat#: ${discogsData.catNo}
Country: ${discogsData.country}
Formats: ${discogsData.formats.join(', ')}
Tracklist: ${tracklistStr}

${instruction}

${basePrompt}

IMPORTANT: Also include these fields in your JSON response:
${PAIRING_INSTRUCTIONS}`;
}

function addPairingsToPrompt(basePrompt: string): string {
  return `${basePrompt}

IMPORTANT: Also include these fields in your JSON response:
${PAIRING_INSTRUCTIONS}`;
}

/**
 * Analyzes multiple images using Google Gemini Vision API.
 * Accepts a cart of captured images (front, back, label).
 * Optionally accepts Discogs metadata for barcode-enriched analysis.
 * Returns an AnalysisResult with generated ID and timestamp.
 */
export async function analyzeImages(
  capturedImages: CapturedImage[],
  discogsData?: DiscogsResult | null,
  barcode?: string,
): Promise<AnalysisResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to .env.local and restart Metro with --clear.'
    );
  }

  const { model, systemPrompt, maxTokens, temperature } = appConfig.ai;

  console.log('[Discogs] Received discogsData for analysis:', discogsData);
  console.log('[Gemini] Starting multi-image analysis...');
  console.log('[Gemini] Model:', model);
  console.log('[Gemini] Images:', capturedImages.map((img) => `${img.type}: ${img.uri}`));

  // Read all images as base64 in parallel
  const imageParts = await Promise.all(
    capturedImages.map(async (img) => {
      const base64 = await readAsStringAsync(img.uri, {
        encoding: EncodingType.Base64,
      });
      const mimeType = getMimeType(img.uri);
      console.log(`[Gemini] ${img.type} - MIME: ${mimeType}, Base64 length: ${base64.length}`);
      return {
        inlineData: {
          mimeType,
          data: base64,
        },
      };
    })
  );

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  // Build the prompt: enrich with Discogs data (Scenario A) or add vibe pairing only (Scenario B)
  const hasImages = capturedImages.length > 0;
  const prompt = discogsData
    ? buildDiscogsEnrichedPrompt(discogsData, systemPrompt, hasImages)
    : addPairingsToPrompt(systemPrompt);

  console.log('[Gemini] Prompt scenario:', discogsData ? 'A (Discogs-enriched)' : 'B (visual-only)');

  // Build content: text prompt + all image parts
  console.log('[Gemini] Sending request to API with', imageParts.length, 'images...');
  const apiCall = genModel.generateContent([
    { text: prompt },
    ...imageParts,
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Analysis timed out. Please check your connection and try again.')), API_TIMEOUT_MS)
  );

  const response = await Promise.race([apiCall, timeoutPromise]);

  console.log('[Gemini] Received response from API');

  const candidate = response.response.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.length) {
    const blockReason = response.response.promptFeedback?.blockReason;
    console.error('[Gemini] No valid candidate. Block reason:', blockReason);
    console.error('[Gemini] Full response:', JSON.stringify(response.response, null, 2));
    if (blockReason) {
      throw new Error('The image could not be analyzed due to content safety filters. Please try a different image.');
    }
    throw new Error('No response received from the AI model. Please try again.');
  }

  const rawText = candidate.content.parts
    .map((part: { text?: string }) => part.text || '')
    .join('');

  console.log('[Gemini] Raw AI response (length:', rawText.length, 'chars):');
  console.log('─────────────────────────────────────');
  console.log('FIRST 300 chars:', rawText.substring(0, 300));
  console.log('...');
  console.log('LAST 300 chars:', rawText.substring(rawText.length - 300));
  console.log('─────────────────────────────────────');

  const jsonText = stripMarkdownFences(rawText);

  console.log('[Gemini] After stripping markdown (length:', jsonText.length, 'chars):');
  console.log('─────────────────────────────────────');
  console.log('FIRST 300 chars:', jsonText.substring(0, 300));
  console.log('...');
  console.log('LAST 300 chars:', jsonText.substring(jsonText.length - 300));
  console.log('─────────────────────────────────────');

  // Check if JSON looks complete
  const openBraces = (jsonText.match(/{/g) || []).length;
  const closeBraces = (jsonText.match(/}/g) || []).length;
  console.log('[Gemini] Brace check - Open:', openBraces, 'Close:', closeBraces);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
    console.log('[Gemini] Successfully parsed JSON:', parsed);
  } catch (parseError) {
    console.error('[Gemini] JSON parse error:', parseError);
    console.error('[Gemini] Failed to parse text (first 500 chars):');
    console.error(jsonText.substring(0, 500));
    throw new Error(
      `Failed to parse AI response. Raw: ${rawText.substring(0, 200)}`
    );
  }

  // Validate with Zod (graceful defaults for partial responses)
  let parseResult = analysisResponseSchema.safeParse(parsed);

  if (!parseResult.success) {
    console.warn('[Gemini] Zod validation issues:', parseResult.error.issues);
    // Merge fallback defaults first, then overlay parsed so valid values win;
    // then re-run safeParse so Zod coercions are applied to the merged object.
    const fallback = analysisResponseSchema.parse({});
    const merged = { ...fallback, ...parsed };
    parseResult = analysisResponseSchema.safeParse(merged);
  }

  // If still invalid after merging, fall back to a fully-default object.
  // analysisResponseSchema.parse({}) is safe here because every field has a .default().
  const validated = parseResult.success ? parseResult.data : analysisResponseSchema.parse({});

  // Sanitize extended details (Zod validates shape but we also clean the content)
  const extendedDetails = sanitizeExtendedDetails(validated.extendedDetails);

  const result: AnalysisResult = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: validated.name,
    origin: normalizeOrigin(validated.origin),
    year: validated.year,
    estimatedValue: validated.estimatedValue || 0,
    ...(validated.estimatedValueLow != null && validated.estimatedValueLow > 0 && { estimatedValueLow: validated.estimatedValueLow }),
    ...(validated.estimatedValueHigh != null && validated.estimatedValueHigh > 0 && { estimatedValueHigh: validated.estimatedValueHigh }),
    confidence: Math.min(100, Math.max(0, Math.round(validated.confidence || 0))),
    description: validated.description,
    ...(validated.rarity && { rarity: validated.rarity }),
    ...(validated.label && { label: validated.label }),
    ...(validated.genre && { genre: validated.genre }),
    ...(validated.condition && { condition: validated.condition }),
    ...(validated.vibePairing && { vibePairing: validated.vibePairing }),
    ...(validated.foodPairing && { foodPairing: validated.foodPairing }),
    ...(validated.drinkPairing && { drinkPairing: validated.drinkPairing }),
    ...(barcode && { barcode }),
    ...(validated.albumArtQuery && { albumArtQuery: validated.albumArtQuery }),
    ...(extendedDetails && { extendedDetails }),
    imageUri: (capturedImages.find((img) => img.type === 'front') ?? capturedImages[0])?.uri,
    images: capturedImages.map((img) => img.uri),
    createdAt: Date.now(),
    // Merge Discogs enrichment data when available
    ...(discogsData && {
      ...(discogsData.thumbnail && { discogsThumbnail: discogsData.thumbnail }),
      ...(discogsData.primaryImage && { discogsImage: discogsData.primaryImage }),
      ...(discogsData.discogsImages.length > 0 && { discogsImages: discogsData.discogsImages }),
      ...(discogsData.styles.length > 0 && { styles: discogsData.styles }),
      ...(discogsData.weight && { weight: discogsData.weight }),
      ...(discogsData.tracklist.length > 0 && { discogsTracklist: discogsData.tracklist }),
      ...(discogsData.companies.length > 0 && { companies: discogsData.companies }),
      ...(discogsData.extraArtists.length > 0 && { extraArtists: discogsData.extraArtists }),
      ...(discogsData.discogsUrl && { discogsUrl: discogsData.discogsUrl }),
      ...(discogsData.discogsId && { discogsId: discogsData.discogsId }),
      ...(discogsData.lowestPrice != null && { lowestPrice: discogsData.lowestPrice }),
      ...(discogsData.numForSale != null && { numForSale: discogsData.numForSale }),
      ...(discogsData.community && {
        communityHave: discogsData.community.have,
        communityWant: discogsData.community.want,
      }),
    }),
  };

  console.log('[Gemini] ✅ Analysis complete:', {
    name: result.name,
    value: result.estimatedValue,
    confidence: result.confidence,
  });

  return result;
}

/**
 * Backward-compatible single-image analysis wrapper.
 */
export async function analyzeImage(imageUri: string): Promise<AnalysisResult> {
  return analyzeImages([{ type: 'front', uri: imageUri }], null);
}
