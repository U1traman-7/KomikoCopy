// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: Request) {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];
  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
    });
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
  if (!userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
    });
  }

  try {
    const url = new URL(request.url);
    const uniqid = url.searchParams.get('uniqid');
    const postId = url.searchParams.get('post_id');
    const { data: characterData, error } = await supabase
      .from('CustomCharacters')
      .select('*, User (user_name, image, user_uniqid)')
      .eq('character_uniqid', uniqid?.toString())
      .single();
    if (error) {
      throw error;
    }
    if (!characterData) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
      });
    }
    characterData.user_name = characterData.User?.user_name;
    characterData.user_image = characterData.User?.image;
    characterData.user_uniqid = characterData.User?.user_uniqid;

    // Check hide_prompt settings
    const isOwner = characterData.authUserId === userId;

    // If no postId is provided or invalid
    const parsedPostId = postId ? parseInt(postId, 10) : null;
    const isValidPostId = parsedPostId !== null && !isNaN(parsedPostId);

    if (!isValidPostId) {
      // Owner can always see their own prompts
      if (!isOwner) {
        characterData.character_description = '';
        characterData.prompt = '';
      }
      // If owner, keep prompts visible
    }
    // If postId is valid, check hide_prompt setting
    else {
      const { data: mappingData } = await supabase
        .from('custom_characters_image_generations')
        .select('hide_prompt')
        .eq('post_id', parsedPostId)
        .eq('character_uniqid', uniqid?.toString())
        .single();

      // If hide_prompt is explicitly set to true, hide prompts (for everyone including owner)
      if (mappingData?.hide_prompt === true) {
        characterData.character_description = '';
        characterData.prompt = '';
      }
      // Otherwise (hide_prompt is false or not set), show prompts (default behavior)
    }

    return new Response(JSON.stringify(characterData), { status: 200 });
  } catch (error) {
    console.error('Error retrieving character:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve character' }),
      { status: 500 },
    );
  }
}
