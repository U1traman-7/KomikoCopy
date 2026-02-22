import { supabase, isGlobalAdmin } from './_handlers/utils.js';

/**
 * GET /api/tag/characters
 * Get characters associated with a tag (paginated)
 * Includes characters from:
 *   1. The tag's linked character_category (official characters from that category)
 *   2. Explicit character_tag_bindings
 * Query params:
 *   - tagId: tag ID (required)
 *   - page: page number (default: 1)
 *   - pageSize: items per page (default: 20, max: 50)
 *   - official: filter by official status (optional, 'true' or 'false')
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20')));
    const officialParam = url.searchParams.get('official');

    if (!tagId) {
      return new Response(
        JSON.stringify({ error: 'Tag ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tagIdNum = parseInt(tagId);

    // First, check if the tag has a linked character_category
    const { data: tagData } = await supabase
      .from('tags')
      .select('character_category')
      .eq('id', tagIdNum)
      .single();

    const characterCategory = tagData?.character_category;
    let categoryCharacters: any[] = [];
    let categoryCharacterIds = new Set<string>();

    // If tag has a character_category, fetch official characters from that category
    if (characterCategory && officialParam !== 'false') {
      const { data: catChars, error: catError } = await supabase
        .from('CustomCharacters')
        .select(`
          id,
          character_uniqid,
          character_name,
          character_description,
          character_pfp,
          rizz,
          num_collected,
          num_gen
        `)
        .eq('normalized_category', characterCategory)
        .eq('is_official', true)
        .order('num_gen', { ascending: false });

      if (!catError && catChars) {
        categoryCharacters = catChars.map((char: any) => ({
          ...char,
          is_official: true,
          is_from_category: true, // Flag to identify category-sourced characters
          bound_at: null,
          binding_id: null,
        }));
        categoryCharacterIds = new Set(catChars.map((c: any) => c.character_uniqid));
      }
    }

    // Build query for explicit bindings
    let query = supabase
      .from('character_tag_bindings')
      .select(`
        id,
        is_official,
        created_at,
        character:CustomCharacters!character_uniqid (
          id,
          character_uniqid,
          character_name,
          character_description,
          character_pfp,
          rizz,
          num_collected,
          num_gen
        )
      `, { count: 'exact' })
      .eq('tag_id', tagIdNum);

    // Filter by official status if specified
    if (officialParam === 'true') {
      query = query.eq('is_official', true);
    } else if (officialParam === 'false') {
      query = query.eq('is_official', false);
    }

    // Order by official first, then by creation date
    query = query
      .order('is_official', { ascending: false })
      .order('created_at', { ascending: false });

    const { data: bindingData, error: bindingError, count: bindingCount } = await query;

    if (bindingError) {
      console.error('Error fetching tag characters:', bindingError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch characters' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform binding data and filter out duplicates (characters already in category)
    const bindingCharacters = (bindingData || [])
      .map((binding: any) => ({
        binding_id: binding.id,
        is_official: binding.is_official,
        bound_at: binding.created_at,
        is_from_category: false,
        ...binding.character,
      }))
      .filter((char: any) => !categoryCharacterIds.has(char.character_uniqid));

    // Merge: category characters first, then binding characters
    const allCharacters = [...categoryCharacters, ...bindingCharacters];
    const totalCount = categoryCharacters.length + (bindingCount || 0) - 
      // Subtract duplicates (bindings that are also in category)
      (bindingData || []).filter((b: any) => categoryCharacterIds.has(b.character?.character_uniqid)).length;

    // Apply pagination to merged list
    const offset = (page - 1) * pageSize;
    const paginatedCharacters = allCharacters.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(totalCount / pageSize);

    return new Response(
      JSON.stringify({
        characters: paginatedCharacters,
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
        // Include category info for debugging/UI
        character_category: characterCategory || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get tag characters error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/tag/characters
 * Bind a character to a tag (Admin or Moderator only)
 * Body: { tagId: number, characterId: number, is_official?: boolean }
 */
export async function POST(request: Request) {
  try {
    const { tagId, characterId, is_official = false } = await request.json();

    if (!tagId || !characterId) {
      return new Response(
        JSON.stringify({ error: 'Tag ID and Character ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import auth utilities
    const { parse } = await import('cookie');
    const { decode } = await import('next-auth/jwt');

    // Verify authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin or moderator
    const isAdmin = await isGlobalAdmin(currentUserId);

    if (!isAdmin) {
      const { data: modCheck } = await supabase
        .from('tag_moderators')
        .select('id')
        .eq('tag_id', tagId)
        .eq('user_id', currentUserId)
        .single();

      if (!modCheck) {
        return new Response(
          JSON.stringify({ error: 'Only moderators or admins can bind characters' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if binding already exists
    const { data: existing } = await supabase
      .from('character_tag_bindings')
      .select('id')
      .eq('tag_id', tagId)
      .eq('character_uniqid', characterId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Character is already bound to this tag' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if trying to add NSFW character to non-NSFW tag
    const { data: tagData } = await supabase
      .from('tags')
      .select('is_nsfw')
      .eq('id', tagId)
      .single();

    const { data: characterData } = await supabase
      .from('CustomCharacters')
      .select('is_nsfw')
      .eq('character_uniqid', characterId)
      .single();

    if (characterData?.is_nsfw && !tagData?.is_nsfw) {
      return new Response(
        JSON.stringify({ error: 'Cannot add NSFW character to a tag that does not allow NSFW content' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create binding
    const { data, error } = await supabase
      .from('character_tag_bindings')
      .insert({
        tag_id: tagId,
        character_uniqid: characterId,
        is_official,
      })
      .select()
      .single();

    if (error) {
      console.error('Error binding character:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to bind character' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Character bound successfully', binding: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bind character error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/tag/characters
 * Unbind a character from a tag (Admin or Moderator only)
 * Query params:
 *   - tagId: tag ID (required)
 *   - characterId: character ID (required)
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');
    const characterId = url.searchParams.get('characterId');

    if (!tagId || !characterId) {
      return new Response(
        JSON.stringify({ error: 'Tag ID and Character ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Import auth utilities
    const { parse } = await import('cookie');
    const { decode } = await import('next-auth/jwt');

    // Verify authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin or moderator
    const isAdmin = await isGlobalAdmin(currentUserId);

    if (!isAdmin) {
      const { data: modCheck } = await supabase
        .from('tag_moderators')
        .select('id')
        .eq('tag_id', parseInt(tagId))
        .eq('user_id', currentUserId)
        .single();

      if (!modCheck) {
        return new Response(
          JSON.stringify({ error: 'Only moderators or admins can unbind characters' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check if this is an official character binding
    const { data: bindingData } = await supabase
      .from('character_tag_bindings')
      .select('id, is_official')
      .eq('tag_id', parseInt(tagId))
      .eq('character_uniqid', characterId)
      .single();

    if (!bindingData) {
      return new Response(
        JSON.stringify({ error: 'Character binding not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Official character bindings cannot be removed
    if (bindingData.is_official) {
      return new Response(
        JSON.stringify({ error: 'No permission' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete binding
    const { error } = await supabase
      .from('character_tag_bindings')
      .delete()
      .eq('tag_id', parseInt(tagId))
      .eq('character_uniqid', characterId);

    if (error) {
      console.error('Error unbinding character:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to unbind character' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Character unbound successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unbind character error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

