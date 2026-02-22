import { GoogleGenerativeAI } from '@google/generative-ai';
import Roles from '../_models/roles.js';
import {
  createSupabase,
  failed,
  success,
  unauthorized,
} from '../_utils/index.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';
import { LANGUAGES } from '../_constants.js';

// Temporary type declaration to fix compilation
// eslint-disable-next-line @typescript-eslint/ban-types
type RequestImproved<P = any> = Request & {
  params?: P;
};

const toLanguageName: Record<string, string> = {
  en: 'English',
  'zh-CN': 'Chinese Simplified',
  'zh-TW': 'Chinese Traditional',
  ja: 'Japanese',
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
  id: 'Indonesian',
  hi: 'Hindi',
  th: 'Thai',
  vi: 'Vietnamese',
};

async function translateText(
  genAI: GoogleGenerativeAI,
  text: string,
  targetLangCode: string,
): Promise<string> {
  if (!text) {
    return '';
  }
  const target = toLanguageName[targetLangCode] || targetLangCode;

  const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-preview',
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
      responseMimeType: 'text/plain',
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const prompt = `Translate the following text to ${target}. If the text is already in ${target}, just return it. Return only the translated text with no commentary. Keep special symbols like < and > unchanged.

-----
${text}`;
  const result = await model.generateContent(prompt);
  const out = result.response.candidates?.[0]?.content.parts?.[0]?.text || '';
  return out.trim();
}

async function handler(request: RequestImproved) {
  const params = request.params as {
    post_id?: number;
    target_langs?: string[];
  };
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return unauthorized('Unauthorized');
  }

  const supabase = createSupabase();
  const roles = new Roles(userId);
  await roles.getRoles();
  if (!roles.isAdmin()) {
    return unauthorized('Forbidden');
  }

  const postId = params?.post_id;
  if (!postId) {
    return failed('post_id is required');
  }

  const { data: post, error: postError } = await supabase
    .from('AppPosts')
    .select('id, title, content, translation')
    .eq('id', postId)
    .single();
  if (postError || !post) {
    return failed('Post not found');
  }

  const API_KEY = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(API_KEY);

  const langs = (
    params?.target_langs && params.target_langs.length > 0
      ? params.target_langs
      : LANGUAGES
  ).filter(l => l !== 'en');

  const nextTranslation: Record<string, { title?: string; content?: string }> =
    { ...(post.translation || {}) } as any;

  for (const lang of langs) {
    try {
      const [tTitle, tContent] = await Promise.all([
        translateText(genAI, post.title || '', lang),
        translateText(genAI, post.content || '', lang),
      ]);
      nextTranslation[lang] = {
        ...(nextTranslation[lang] || {}),
        ...(tTitle ? { title: tTitle } : {}),
        ...(tContent ? { content: tContent } : {}),
      };
    } catch (e) {
      // Continue on failure for specific language
      console.error('Translate error for', lang, e);
    }
  }

  const { error: updateError } = await supabase
    .from('AppPosts')
    .update({ translation: nextTranslation })
    .eq('id', postId);

  if (updateError) {
    console.error('Failed to update translation', updateError);
    return failed('Failed to update translation');
  }

  return success({
    post_id: postId,
    translated_langs: Object.keys(nextTranslation),
  });
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);
