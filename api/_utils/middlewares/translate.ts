import { OpenAI } from 'openai';

// const apiKey = process.env.OPENAI_API_KEY;
const apiKey = process.env.OPEN_ROUTER_API_KEY;

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey,
  defaultHeaders: {
    'HTTP-Referer': 'https://komiko.app', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'KomikoAI', // Optional. Site title for rankings on openrouter.ai.
  },
});

// Type declaration to fix compilation
type RequestImproved<P = any> = Request & {
  params?: P;
  log?: {
    cost?: number;
    tool?: string;
    model?: string;
    generationResult?: 0 | 2 | 4;
  };
};

export const translate = async (
  text: string,
  targetLanguage: string = 'english',
) => {
  const prompt = `Translate the following text to ${targetLanguage}: "${text}". if the text is already in ${targetLanguage}, just return the text. return only the translated text, no other text.Do not remove or change special symbols, for example: "<", ">" and so on. Do not ignore the '<xx-xx>' and keep the character id.`;
  const response = await openai.chat.completions.create({
    model: 'x-ai/grok-4-fast',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  return response.choices[0].message.content;
};

export const translateMiddleware = async (request: RequestImproved) => {
  const noTranslate = request.params?.no_translate;
  if (noTranslate) {
    console.log('no translate');
    return { success: true };
  }
  const prompt = request.params?.prompt;
  const userPrompt = request.params?.user_prompt;
  const acceptLanguage = request.headers.get('Accept-Language');

  if (acceptLanguage?.match(/^en/)) {
    console.log('no translate');
    return { success: true };
  }

  // Handle prompt field
  if (prompt) {
    const translatedPrompt = await translate(prompt);
    console.log('original prompt', prompt);
    console.log('translatedPrompt', translatedPrompt);
    // Preserve negative_prompt when updating params
    const { negative_prompt, ...rest } = request.params;
    Object.assign(request.params, {
      prompt: translatedPrompt,
      originalPrompt: prompt,
      negative_prompt, // Ensure negative_prompt is preserved
    });
  }

  // Handle user_prompt field
  if (userPrompt) {
    const translatedUserPrompt = await translate(userPrompt);
    console.log('original user_prompt', userPrompt);
    console.log('translatedUserPrompt', translatedUserPrompt);
    Object.assign(request.params, {
      user_prompt: translatedUserPrompt,
      originalUserPrompt: userPrompt,
    });
  }

  return { success: true };
};
