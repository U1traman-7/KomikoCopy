import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(request: Request) {
    try {
      // Parse cookies from the request headers
      const cookies = parse(request.headers.get('cookie') || '');
      const sessionToken = cookies['next-auth.session-token'];

      if (!sessionToken) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token) {
        return new Response(JSON.stringify({ error: 'Invalid login status' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userId = token.id;

      // Get collected characters with original character data
      const { data: collectedCharacters, error } = await supabase
        .from('CollectedCharacters')
        .select(
          `
                id,
                collected_at,
                character_uniqid,
                original_owner_id,
                CustomCharacters (
                    character_uniqid,
                    character_name,
                    character_pfp,
                    character_description,
                    num_collected,
                    User (
                        user_name,
                        image
                    )
                )
            `,
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('collected_at', { ascending: false });

      if (error) {
        console.error('Error fetching collected characters:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch collected characters' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Transform the data to match the expected format
      // Only include essential fields to reduce payload size
      const transformedData = collectedCharacters
        .map((collection: any) => {
          const character = collection.CustomCharacters;
          if (!character) {
            return null; // Character was deleted
          }

          return {
            // Collection metadata
            collection_id: collection.id,
            collected_at: collection.collected_at,

            // Character data (essential fields only)
            character_uniqid: character.character_uniqid,
            character_name: character.character_name,
            character_pfp: character.character_pfp,
            character_description: character.character_description,
            num_collected: character.num_collected,

            // Original owner data
            user_name: character.User?.user_name,
            user_image: character.User?.image,
            authUserId: collection.original_owner_id,

            // Additional fields for compatibility
            name: `@${character.character_uniqid}`,
            simple_name: character.character_name,
            image: character.character_pfp,
            is_collected: true,
          };
        })
        .filter(Boolean); // Remove null entries (deleted characters)

      return new Response(JSON.stringify(transformedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
        console.error('Error in getCollectedCharacters:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 