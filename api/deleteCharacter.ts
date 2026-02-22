import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { trackServerEvent } from './_utils/posthog.js';
import { waitUntil } from '@vercel/functions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function DELETE(request: Request) {
  try {
    // Get the character uniqid from the URL
    const url = new URL(request.url);
    const uniqid = url.searchParams.get('uniqid');

    if (!uniqid) {
      return new Response(
        JSON.stringify({ error: 'Character ID is required' }),
        { status: 400 },
      );
    }

    // Parse cookies from the request headers
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 },
      );
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return new Response(JSON.stringify({ error: 'Invalid login status' }), {
        status: 401,
      });
    }
    const userId = token.id;

    // First check if the user owns this character
    const { data: characterData, error: fetchError } = await supabase
      .from('CustomCharacters')
      .select('authUserId')
      .eq('character_uniqid', uniqid)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
      });
    }

    if (characterData.authUserId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this character' }),
        { status: 403 },
      );
    }

    // Delete the character
    const { error: deleteError } = await supabase
      .from('CustomCharacters')
      .delete()
      .eq('character_uniqid', uniqid);

    if (deleteError) {
      throw deleteError;
    }
    waitUntil(
      trackServerEvent('character_deleted', userId as string, {}).catch(),
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting character:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete character' }),
      { status: 500 },
    );
  }
}
