import { GoogleGenerativeAI } from '@google/generative-ai';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { supabase, isGlobalAdmin } from './_handlers/utils.js';
import { LANGUAGES } from '../_constants.js';

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
      maxOutputTokens: 256,
      responseMimeType: 'text/plain',
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const prompt = `Translate the following button text to ${target}. If the text is already in ${target}, just return it. Return only the translated text with no commentary. Keep special symbols and formatting unchanged.

-----
${text}`;
  const result = await model.generateContent(prompt);
  const out = result.response.candidates?.[0]?.content.parts?.[0]?.text || '';
  return out.trim();
}

/**
 * POST /api/tag/translate-cta-text
 * Translate CTA button text for a tag (Moderator or Admin only)
 * Body: {
 *   tagId: number,
 *   text: string,
 *   target_langs?: string[]
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tagId, text, target_langs } = body;

    if (!tagId) {
      return new Response(JSON.stringify({ error: 'Tag ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let currentUserId: string;
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token?.id) {
        throw new Error('Invalid token');
      }
      currentUserId = token.id as string;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if current user is admin or tag moderator
    const isAdmin = await isGlobalAdmin(currentUserId);

    if (!isAdmin) {
      // Check if user is a moderator for this tag
      const { data: modCheck } = await supabase
        .from('tag_moderators')
        .select('id, role')
        .eq('tag_id', tagId)
        .eq('user_id', currentUserId)
        .single();

      if (!modCheck) {
        return new Response(
          JSON.stringify({
            error: 'Only moderators or admins can translate CTA text',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    const API_KEY = process.env.GEMINI_API_KEY!;
    const genAI = new GoogleGenerativeAI(API_KEY);

    const langs =
      target_langs && target_langs.length > 0
        ? target_langs
        : LANGUAGES.filter(l => l !== 'en');

    const translations: Record<string, string> = {
      en: text, // Keep original text as English
    };

    for (const lang of langs) {
      try {
        const translated = await translateText(genAI, text, lang);
        if (translated) {
          translations[lang] = translated;
        }
      } catch (e) {
        // Continue on failure for specific language
        console.error('Translate error for', lang, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        translations,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Translate CTA text error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
