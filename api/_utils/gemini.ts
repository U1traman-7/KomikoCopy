import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadToGeminiFromBase64, urlToBase64 } from './file.js';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

const GEMINI_MODEL_ID = 'gemini-3-pro-preview';
// Maximum length for generated prompts to prevent excessive token usage
const MAX_PROMPT_LENGTH = 7500;

export async function generateWithGemini(
  prompt: string,
  imageUrl?: string,
): Promise<string> {
  try {
    const parts: any[] = [];

    // Handle image if provided
    if (imageUrl) {
      // Convert URL to base64 if needed
      let base64Data = imageUrl;
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        base64Data = await urlToBase64(imageUrl);
      }

      // Upload the input image to Gemini Files API
      const inputFile = await uploadToGeminiFromBase64(base64Data);

      parts.push(
        {
          text: 'Reference image:\n```',
        },
        {
          fileData: {
            mimeType: inputFile.mimeType,
            fileUri: inputFile.uri,
          },
        },
        { text: '```\n\n' },
      );
    }

    // Add the text prompt
    parts.push({ text: prompt });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'text/plain',
    };

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL_ID,
      generationConfig,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const candidate = result.response.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidates returned from Gemini');
    }

    const text = candidate.content?.parts?.find((p: any) => p.text)?.text;
    if (!text) {
      throw new Error('No text returned from Gemini');
    }

    const trimmedText = text.trim();

    // Truncate to max length to prevent excessively long prompts
    if (trimmedText.length > MAX_PROMPT_LENGTH) {
      console.warn(
        `Gemini generated prompt was truncated from ${trimmedText.length} to ${MAX_PROMPT_LENGTH} characters`,
      );
      return trimmedText.substring(0, MAX_PROMPT_LENGTH);
    }

    return trimmedText;
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw error;
  }
}
