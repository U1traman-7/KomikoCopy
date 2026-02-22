// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Basic fields for list/selector views
const BASIC_OWNED_FIELDS =
  'character_uniqid, character_name, character_pfp, profession, alt_prompt';
const BASIC_COLLECTED_FIELDS = `
  id,
  collected_at,
  character_uniqid,
  original_owner_id,
  CustomCharacters (
    character_uniqid,
    character_name,
    character_pfp,
    profession,
    alt_prompt
  )
`;

// Full fields including intro, description, etc.
const FULL_OWNED_FIELDS =
  'character_uniqid, character_name, character_pfp, character_description, intro, alt_prompt, num_collected, is_official, profession, User (user_name, image)';
const FULL_COLLECTED_FIELDS = `
  id,
  collected_at,
  character_uniqid,
  original_owner_id,
  CustomCharacters (
    character_uniqid,
    character_name,
    character_pfp,
    character_description,
    intro,
    alt_prompt,
    num_collected,
    profession,
    User (
      user_name,
      image
    )
  )
`;

export async function GET(request: Request) {
  try {
    // Parse query params
    const url = new URL(request.url);
    const fields = url.searchParams.get('fields'); // 'full' for all fields
    const isFull = fields === 'full';

    // Parse cookies from the request headers
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Log in to proceed' }), {
        status: 401,
      });
    }
    let token: any = null;
    try {
      token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    }
    if (!token) {
      return new Response(JSON.stringify({ error: 'Invalid login status' }), {
        status: 401,
      });
    }
    const userId = token.id;

    // Get owned characters
    const { data: ownedData, error: ownedError } = await supabase
      .from('CustomCharacters')
      .select(isFull ? FULL_OWNED_FIELDS : BASIC_OWNED_FIELDS)
      .eq('authUserId', userId);

    if (ownedError) {
      throw ownedError;
    }

    // Get collected characters
    const { data: collectedData, error: collectedError } = await supabase
      .from('CollectedCharacters')
      .select(isFull ? FULL_COLLECTED_FIELDS : BASIC_COLLECTED_FIELDS)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('collected_at', { ascending: false });

    if (collectedError) {
      console.error('Error fetching collected characters:', collectedError);
      // Continue with only owned characters if collected characters fetch fails
    }

    // Transform owned characters
    const ownedCharacters = (ownedData as any[]).map((character: any) => {
      const base = {
        character_uniqid: character.character_uniqid,
        character_name: character.character_name,
        character_pfp: character.character_pfp,
        profession: character.profession,
        alt_prompt: character.alt_prompt,
        is_owned: true,
        is_collected: false,
      };

      if (!isFull) return base;

      return {
        ...base,
        character_description: character.character_description,
        intro: character.intro,
        num_collected: character.num_collected,
        is_official: character.is_official,
        user_name: character.User?.user_name,
        user_image: character.User?.image,
      };
    });

    // Transform collected characters
    const collectedCharacters =
      collectedData
        ?.map((collection: any) => {
          const character = collection.CustomCharacters;
          if (!character) {
            return null; // Character was deleted
          }

          const base = {
            character_uniqid: character.character_uniqid,
            character_name: character.character_name,
            character_pfp: character.character_pfp,
            profession: character.profession,
            alt_prompt: character.alt_prompt,
            is_owned: false,
            is_collected: true,
          };

          if (!isFull) return base;

          return {
            ...base,
            character_description: character.character_description,
            intro: character.intro,
            num_collected: character.num_collected || 0,
            authUserId: collection.original_owner_id,
            user_name: character.User?.user_name,
            user_image: character.User?.image,
            collection_id: collection.id,
            collected_at: collection.collected_at,
          };
        })
        .filter(Boolean) || [];

    // Combine owned and collected characters
    const allCharacters = [...ownedCharacters, ...collectedCharacters];

    return new Response(JSON.stringify(allCharacters), { status: 200 });
  } catch (error) {
    console.error('Error retrieving character:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve character' }),
      { status: 500 },
    );
  }
}
