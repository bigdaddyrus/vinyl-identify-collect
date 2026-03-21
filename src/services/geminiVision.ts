import { GoogleGenerativeAI } from '@google/generative-ai';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { AnalysisResult, ExtendedDetailSection } from '@/types';
import { appConfig } from '@/config/appConfig';
import { normalizeOrigin } from '@/data/countryCoordinates';

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

/**
 * Analyzes an image using Google Gemini Vision API.
 * Returns an AnalysisResult with generated ID and timestamp.
 */
export async function analyzeImage(imageUri: string): Promise<AnalysisResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to .env.local and restart Metro with --clear.'
    );
  }

  const { model, systemPrompt, maxTokens, temperature } = appConfig.ai;

  console.log('[Gemini] Starting image analysis...');
  console.log('[Gemini] Model:', model);
  console.log('[Gemini] Image URI:', imageUri);

  // Read image as base64
  const base64 = await readAsStringAsync(imageUri, {
    encoding: EncodingType.Base64,
  });

  const mimeType = getMimeType(imageUri);
  console.log('[Gemini] MIME type:', mimeType);
  console.log('[Gemini] Base64 length:', base64.length);

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  // Call API with timeout
  console.log('[Gemini] Sending request to API...');
  const apiCall = genModel.generateContent([
    { text: systemPrompt },
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Analysis timed out. Please check your connection and try again.')), API_TIMEOUT_MS)
  );

  const response = await Promise.race([apiCall, timeoutPromise]);

  console.log('[Gemini] Received response from API');

  const candidate = response.response.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.length) {
    // Check for content safety block
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

  // Validate required fields
  const requiredFields = appConfig.ai.responseSchema.fields;
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      console.error('[Gemini] Missing required field:', field);
      console.error('[Gemini] Available fields:', Object.keys(parsed));
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  // Parse optional extended fields
  const estimatedValueLow = parsed.estimatedValueLow != null ? Number(parsed.estimatedValueLow) : undefined;
  const estimatedValueHigh = parsed.estimatedValueHigh != null ? Number(parsed.estimatedValueHigh) : undefined;
  const rarity = parsed.rarity ? String(parsed.rarity) : undefined;
  const extendedDetails = sanitizeExtendedDetails(parsed.extendedDetails);

  const result: AnalysisResult = {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: String(parsed.name),
    origin: normalizeOrigin(String(parsed.origin)),
    year: String(parsed.year),
    estimatedValue: Number(parsed.estimatedValue) || 0,
    ...(estimatedValueLow != null && estimatedValueLow > 0 && { estimatedValueLow }),
    ...(estimatedValueHigh != null && estimatedValueHigh > 0 && { estimatedValueHigh }),
    confidence: Math.min(100, Math.max(0, Math.round(Number(parsed.confidence) || 0))),
    description: String(parsed.description),
    ...(rarity && { rarity }),
    ...(extendedDetails && { extendedDetails }),
    imageUri,
    createdAt: Date.now(),
  };

  console.log('[Gemini] ✅ Analysis complete:', {
    name: result.name,
    value: result.estimatedValue,
    confidence: result.confidence,
  });

  return result;
}
