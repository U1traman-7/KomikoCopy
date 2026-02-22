import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { supabase } from './_handlers/utils.js';

/**
 * GET /api/tag/detail
 * Get tag detail with aggregated data (using RPC for single query)
 * Query params:
 *   - id: tag ID (number)
 *   - name: tag name (string) - alternative to id
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tagIdParam = url.searchParams.get('id');
    const tagName = url.searchParams.get('name');

    if (!tagIdParam && !tagName) {
      return new Response(
        JSON.stringify({ error: 'Tag ID or name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID if authenticated (optional)
    let userId: string | null = null;
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    
    if (sessionToken) {
      try {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        userId = (token?.id as string) || null;
      } catch {
        // Ignore auth errors - user just won't see follow status
      }
    }

    let tagId: number;

    // If name provided, look up the tag ID first (case-insensitive)
    if (tagName) {
      // Escape ILIKE wildcards to prevent wildcard injection (e.g. name=% matching all tags)
      const escapedName = tagName.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const { data: tagResults, error: lookupError } = await supabase
        .from('tags')
        .select('id')
        .ilike('name', escapedName)
        .limit(1);

      const tagData = tagResults?.[0];
      if (lookupError || !tagData) {
        return new Response(
          JSON.stringify({ error: 'Tag not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      tagId = tagData.id;
    } else {
      tagId = parseInt(tagIdParam!);
    }

    // Call the RPC function for aggregated data
    const { data, error } = await supabase.rpc('get_tag_detail', {
      p_tag_id: tagId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching tag detail:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tag detail' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data || !data.tag) {
      return new Response(
        JSON.stringify({ error: 'Tag not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If tag doesn't have a logo_url, try to get character image
    if (!data.tag.logo_url) {
      const tagNameForLookup = data.tag.name;
      // Try to match character tag format: #@id, @id, or <id>
      const characterId = extractCharacterId(tagNameForLookup);
      
      if (characterId) {
        const { data: charData } = await supabase
          .from('CustomCharacters')
          .select('character_pfp')
          .eq('character_uniqid', characterId)
          .single();
        
        if (charData?.character_pfp) {
          data.tag.logo_url = charData.character_pfp;
        }
      }
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Tag detail error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Extract character ID from tag name
 * Supports formats: #@character-id, @character-id, <character-id>
 */
function extractCharacterId(tagName: string): string | null {
  if (!tagName) return null;
  
  // New format: #@character-id
  if (tagName.startsWith('#@')) {
    return tagName.slice(2).trim();
  }
  
  // Simple format: @character-id
  if (tagName.startsWith('@')) {
    return tagName.slice(1).trim();
  }
  
  // Legacy format: <character-id>
  if (tagName.startsWith('<') && tagName.endsWith('>')) {
    return tagName.slice(1, -1).trim();
  }
  
  return null;
}

