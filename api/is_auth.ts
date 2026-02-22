/* eslint-disable */
import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createSupabase } from './_utils/index.js';
import { waitUntil } from '@vercel/functions';

const updateRefCode = async (refCode: string, userId: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.rpc('update_ref_code', {
    authuserid: userId,
    new_ref_code: refCode,
  });

  if (error) {
    console.error('Error updating invitation relation:', error);
    return false;
  }
  return true;
};

export const updateUserLanguage = async (userId: string, language: string) => {
  const supabase = createSupabase();
  const { error } = await supabase
    .from('user_language')
    .upsert({ user_id: userId, language: language }, { onConflict: 'user_id' });
  if (error) {
    console.error('Error updating user language:', error);
    return false;
  }
  return true;
};

export async function GET(request: Request) {
  try {
    //! FETCH COOKIE IF USER ID NOT PROVIDED
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    const refCode = cookies['ref'];
    const language = request.headers.get('Accept-Language') || 'en';

    if (!sessionToken) {
      return new Response(JSON.stringify({ is_auth: false }), { status: 200 });
    }

    let token: any = null;
    try {
      token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return new Response(JSON.stringify({ is_auth: false }), { status: 200 });
    }
    if (!token) {
      return new Response(JSON.stringify({ is_auth: false }), { status: 200 });
    }
    const headers = {};
    if (refCode) {
      const isUpdated = await updateRefCode(refCode, token.id);
      console.log('refCode', refCode, isUpdated);
      headers['Set-Cookie'] = `ref=; Path=/; Max-Age=0`;
    }

    if (!cookies['langset']) {
      console.log('updating language', language);
      const isUpdated = await updateUserLanguage(token.id, language);
      if (isUpdated) {
        headers['Set-Cookie'] = `langset=1; Path=/; Max-Age=31536000`;
      }
    }
    return new Response(
      JSON.stringify({ is_auth: true, auth_user_id: token.id }),
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
