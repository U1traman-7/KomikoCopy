import fs from 'node:fs';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export async function uploadToGeminiFromBase64(base64Data: string) {
  const base64Content = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;
  const mimeType = base64Data.includes('data:')
    ? base64Data.split(';')[0].split(':')[1]
    : 'image/png';

  const tempFilePath = `/tmp/vvst_${Date.now()}.${mimeType.split('/')[1]}`;
  fs.writeFileSync(tempFilePath, Buffer.from(base64Content, 'base64'));
  try {
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: `vvst_${Date.now()}.${mimeType.split('/')[1]}`,
    });
    const file = uploadResult.file;
    fs.unlinkSync(tempFilePath);
    return file; // { uri, mimeType }
  } catch (e) {
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}
    throw e;
  }
}

// Helper function to convert URL to base64
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to convert URL to base64: ${error}`);
  }
}