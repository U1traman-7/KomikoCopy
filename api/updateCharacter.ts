import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import { ERROR_CODES } from './_constants.js';
import { failedWithCode, isUserSubscribed } from './_utils/index.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function PUT(request: Request) {
  try {
    const {
      character_uniqid,
      name,
      age,
      profession,
      personality,
      interests,
      intro,
      gender,
      is_public,
    } = await request.json();

    if (!character_uniqid) {
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
      .select('authUserId, is_public')
      .eq('character_uniqid', character_uniqid)
      .single();

    if (fetchError) {
      console.error('Error fetching character:', fetchError);
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
      });
    }

    if (characterData.authUserId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to update this character' }),
        { status: 403 },
      );
    }

    const isPublicProvided = typeof is_public === 'boolean';
    const wantsPrivate = isPublicProvided && is_public === false;
    const wasPrivate = characterData?.is_public === false;
    if (wantsPrivate && !wasPrivate) {
      const isSubscribed = await isUserSubscribed(String(userId));
      let isCppUser = false;
      if (!isSubscribed) {
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('is_cpp')
          .eq('id', userId)
          .single();
        if (userError) {
          console.error('Error fetching user cpp status:', userError);
        }
        isCppUser = userData?.is_cpp || false;
      }
      if (!isSubscribed && !isCppUser) {
        return failedWithCode(
          ERROR_CODES.VIP_STYLE_REQUIRES_SUBSCRIPTION,
          'VIP style requires a subscription',
        );
      }
    }

    // Update the character
    const updates = {
      ...(name && { character_name: name }),
      ...(age && { age }),
      ...(profession && { profession }),
      ...(personality && { personality }),
      ...(interests && { interests }),
      ...(intro && { intro }),
      ...(gender && { gender }),
      updated_at: new Date().toISOString(),
      ...(isPublicProvided && { is_public }),
    };

    const { data, error: updateError } = await supabase
      .from('CustomCharacters')
      .update(updates)
      .eq('character_uniqid', character_uniqid)
      .select();

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify(data[0]), { status: 200 });
  } catch (error) {
    console.error('Error updating character:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update character' }),
      { status: 500 },
    );
  }
}
