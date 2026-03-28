import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { readAsStringAsync, EncodingType, writeAsStringAsync, cacheDirectory } from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { AnalysisResult } from '@/types';
import { appConfig } from '@/config/appConfig';
import { getDisplayName } from '@/data/countryCoordinates';

const { currencySymbol, labels } = appConfig.result;

function formatValue(value: number): string {
  return `${currencySymbol}${value.toLocaleString()}`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

async function getBase64Image(uri: string): Promise<string | null> {
  try {
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    const ext = uri.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Generates and shares a collection book PDF containing all items
 */
export async function exportCollectionToPDF(items: AnalysisResult[]): Promise<string> {
  // Build base64 images for all items that have imageUri
  const imageDataMap = new Map<string, string>();
  await Promise.all(
    items.map(async (item) => {
      if (item.imageUri) {
        const data = await getBase64Image(item.imageUri);
        if (data) {
          imageDataMap.set(item.id, data);
        }
      }
    })
  );

  const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
  const generatedDate = formatDate(Date.now());

  const itemPages = items
    .map((item) => {
      const imageData = imageDataMap.get(item.id);
      const imageHtml = imageData
        ? `<div class="item-image"><img src="${imageData}" /></div>`
        : '';

      return `
        <div class="item-page">
          ${imageHtml}
          <div class="item-name">${item.name}</div>
          <div class="item-meta">
            <span>${labels.origin}: ${getDisplayName(item.origin)}</span>
            <span>${labels.year}: ${item.year}</span>
          </div>
          <div class="item-value-box">
            <div class="item-value-label">${labels.estimatedValue}</div>
            <div class="item-price">${formatValue(item.estimatedValue)}</div>
          </div>
          <div class="item-confidence">
            <span class="confidence-badge">${item.confidence}% ${labels.confidence}</span>
          </div>
          <div class="item-description">
            <div class="desc-label">${labels.description}</div>
            <div class="desc-text">${item.description}</div>
          </div>
          <div class="item-date">Added: ${formatDate(item.createdAt)}</div>
          <hr class="separator" />
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            padding: 40px;
            color: #1A1A1A;
          }
          .cover {
            text-align: center;
            padding: 60px 0 40px;
            border-bottom: 3px solid #2C5F2D;
            margin-bottom: 40px;
          }
          .cover .app-name {
            font-size: 28px;
            color: #2C5F2D;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .cover .book-title {
            font-size: 22px;
            color: #666;
            margin-bottom: 30px;
          }
          .cover-stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
          }
          .cover-stat {
            text-align: center;
          }
          .cover-stat .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #D4AF37;
            font-family: 'Georgia', serif;
          }
          .cover-stat .stat-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .cover-date {
            margin-top: 24px;
            font-size: 12px;
            color: #999;
          }
          .item-page {
            margin-bottom: 20px;
          }
          .item-image {
            text-align: center;
            margin-bottom: 16px;
          }
          .item-image img {
            max-width: 100%;
            max-height: 250px;
            border-radius: 8px;
            object-fit: contain;
          }
          .item-name {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .item-meta {
            font-size: 14px;
            color: #666;
            margin-bottom: 16px;
          }
          .item-meta span {
            margin-right: 20px;
          }
          .item-value-box {
            background: #FFF9E6;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 12px;
          }
          .item-value-label {
            font-size: 11px;
            color: #D4AF37;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .item-price {
            font-size: 30px;
            color: #D4AF37;
            font-weight: 700;
            font-family: 'Georgia', serif;
          }
          .item-confidence {
            margin-bottom: 12px;
          }
          .confidence-badge {
            background: #E8F5E9;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            color: #28A745;
          }
          .item-description {
            margin-bottom: 12px;
          }
          .desc-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .desc-text {
            font-size: 14px;
            line-height: 1.6;
            color: #333;
          }
          .item-date {
            font-size: 11px;
            color: #999;
            margin-bottom: 8px;
          }
          .separator {
            border: none;
            border-top: 1px solid #E0E0E0;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E0E0E0;
            text-align: center;
            font-size: 11px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="cover">
          <div class="app-name">${appConfig.appName}</div>
          <div class="book-title">Collection Book</div>
          <div class="cover-stats">
            <div class="cover-stat">
              <div class="stat-value">${items.length}</div>
              <div class="stat-label">Items</div>
            </div>
            <div class="cover-stat">
              <div class="stat-value">${formatValue(totalValue)}</div>
              <div class="stat-label">Total Value</div>
            </div>
          </div>
          <div class="cover-date">Generated on ${generatedDate}</div>
        </div>

        ${itemPages}

        <div class="footer">
          Powered by ${appConfig.appName} &bull; ${generatedDate}
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${appConfig.appName} - Collection Book`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }

  return uri;
}

/**
 * Exports collection items as a JSON file and shares it
 */
export async function exportCollectionToJSON(items: AnalysisResult[]): Promise<string> {
  const data = items.map((item) => ({
    id: item.id,
    name: item.name,
    origin: getDisplayName(item.origin),
    year: item.year,
    estimatedValue: item.estimatedValue,
    confidence: item.confidence,
    rarity: item.rarity,
    condition: item.condition,
    label: item.label,
    genre: item.genre,
    description: item.description,
    createdAt: new Date(item.createdAt).toISOString(),
  }));

  const json = JSON.stringify(data, null, 2);
  const uri = `${cacheDirectory}collection-export.json`;
  await writeAsStringAsync(uri, json);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: `${appConfig.appName} - Collection JSON`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }

  return uri;
}

/**
 * Exports collection item images as a ZIP file and shares it
 */
export async function exportCollectionImages(items: AnalysisResult[]): Promise<string> {
  const zip = new JSZip();

  await Promise.all(
    items.map(async (item, index) => {
      if (!item.imageUri) return;
      try {
        const base64 = await readAsStringAsync(item.imageUri, {
          encoding: EncodingType.Base64,
        });
        const ext = item.imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const safeName = item.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
        zip.file(`${String(index + 1).padStart(2, '0')}_${safeName}.${ext}`, base64, { base64: true });
      } catch {
        // Skip items whose images can't be read
      }
    })
  );

  const content = await zip.generateAsync({ type: 'base64' });
  const uri = `${cacheDirectory}collection-images.zip`;
  await writeAsStringAsync(uri, content, { encoding: EncodingType.Base64 });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/zip',
      dialogTitle: `${appConfig.appName} - Collection Images`,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }

  return uri;
}
