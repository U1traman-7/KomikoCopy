import { createSupabase, failed, success } from './_utils/index.js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { interactionNotificationEmail } from './_utils/email.js';
import { waitUntil } from '@vercel/functions';
import { BROAD_TYPES, CONTENT_TYPES } from './_constants.js';
import { deleteMessage, pushMessage } from './message.js';

// Security: Whitelist of allowed fields to prevent SQL injection
const ALLOWED_SELECT_FIELDS = [
  'character_uniqid',
  'character_name',
  'character_pfp',
  'character_description',
  'num_collected',
  'num_gen',
  'is_official',
  'category',
  'created_at',
  'alt_prompt',
  'is_public',
];

// Security: Validate and sanitize field selection
const validateSelectFields = (fieldsParam: string | null): string => {
  if (!fieldsParam) {
    return '*, User (user_name, image)';
  }

  // Parse the fields parameter
  const requestedFields = fieldsParam
    .split(',')
    .map(f => f.trim())
    .filter(Boolean);

  // Check if requesting all fields
  if (requestedFields.includes('*')) {
    return '*, User (user_name, image)';
  }

  // Validate each field against whitelist
  const validFields = requestedFields.filter(field => {
    // Allow User relation with specific fields
    if (field.startsWith('User')) {
      return field === 'User (user_name, image)';
    }
    return ALLOWED_SELECT_FIELDS.includes(field);
  });

  if (validFields.length === 0) {
    return '*, User (user_name, image)';
  }

  return validFields.join(', ');
};

// Security: Sanitize search query to prevent SQL injection
const sanitizeSearchQuery = (query: string | null): string | null => {
  if (!query || query.trim().length === 0) {
    return null;
  }

  // Remove potentially dangerous characters and patterns
  const sanitized = query
    .trim()
    // Remove SQL operators and special characters that could be used for injection
    .replace(/[;'"\\]/g, '')
    // Remove PostgREST operators
    .replace(
      /\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|ov|sl|sr|nxr|nxl|adj)\./gi,
      '',
    )
    // Limit length to prevent DoS
    .slice(0, 100);

  return sanitized.length > 0 ? sanitized : null;
};

export const GET = async (req: Request) => {
  try {
    const supabase = createSupabase();
    const searchParams = new URL(req.url).searchParams;
    const getCollections = searchParams.get('collections') === 'true';
    const idsParam = searchParams.get('ids');
    const fieldsParam = searchParams.get('fields');
    const userUniqidParam = searchParams.get('user_uniqid');

    // Handle fetch by user_uniqid: GET /api/characters?user_uniqid=xxx
    if (userUniqidParam) {
      // Get current user ID for permission check and NSFW permission
      let currentUserId: string | null = null;
      let hasNsfwPermission = false;
      try {
        const cookies = parse(req.headers.get('cookie') || '');
        hasNsfwPermission = cookies['relax_content'] === 'true';
        const sessionToken = cookies['next-auth.session-token'];
        if (sessionToken) {
          const token = await decode({
            token: sessionToken,
            secret: process.env.NEXTAUTH_SECRET!,
          });
          currentUserId = token?.id as string;
        }
      } catch (e) {
        // User not authenticated
        console.error('[API /characters] Error decoding session token:', e);
      }

      // Check mode parameter for NSFW filtering
      const mode = searchParams.get('mode') || '';
      const isNsfwMode = mode === 'nsfw' && hasNsfwPermission;

      // First, resolve the target user's internal ID from their user_uniqid
      const { data: targetUser, error: userError } = await supabase
        .from('User')
        .select('id')
        .eq('user_uniqid', userUniqidParam)
        .single();

      if (userError || !targetUser) {
        console.error('[API /characters] User not found:', userError);
        return failed('User not found');
      }

      const targetUserId = targetUser.id;
      const isOwner = currentUserId === targetUserId;

      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');

      // Build query for characters
      let query = supabase
        .from('CustomCharacters')
        .select('*, User!inner(user_name, image, user_uniqid)', {
          count: 'exact',
        })
        .eq('authUserId', targetUserId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // If not the owner, only show public characters
      // NSFW filtering: show NSFW only if in NSFW mode with permission
      if (!isOwner) {
        query = query.eq('is_public', true);
      }

      if (isNsfwMode) {
        query = query.eq('is_nsfw', true);
      } else {
        query = query.eq('is_nsfw', false);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error(
          '[API /characters] Error fetching user characters:',
          error,
        );
        return failed('Failed to fetch characters');
      }

      // Transform data to match expected format
      const transformedData = (data || []).map((char: any) => {
        const result = { ...char };
        if (char.User) {
          result.user_name = char.User.user_name;
          result.user_image = char.User.image;
          result.user_uniqid = char.User.user_uniqid;
        }
        return result;
      });

      return success({
        characters: transformedData,
        total: count || 0,
        isOwner,
      });
    }

    // Handle batch fetch by IDs: GET /api/characters?ids=id1,id2,id3
    if (idsParam) {
      const characterIds = idsParam.split(',').filter(Boolean);

      if (characterIds.length === 0) {
        return failed('No character IDs provided');
      }

      // Get current user ID for permission check
      let currentUserId: string | null = null;
      try {
        const cookies = parse(req.headers.get('cookie') || '');
        const sessionToken = cookies['next-auth.session-token'];
        if (sessionToken) {
          const token = await decode({
            token: sessionToken,
            secret: process.env.NEXTAUTH_SECRET!,
          });
          currentUserId = token?.id as string;
        }
      } catch (e) {
        // User not authenticated, can only access public characters
      }

      // Security: Validate and sanitize field selection
      const selectFields = validateSelectFields(fieldsParam);

      const { data, error } = await supabase
        .from('CustomCharacters')
        .select(selectFields)
        .in('character_uniqid', characterIds);

      if (error) {
        console.error(
          '[API /characters GET] Error fetching characters by IDs:',
          error,
        );
        return failed('Failed to fetch characters');
      }

      // Filter: only return public characters OR user's own characters
      const filteredData = (data as any[])?.filter((char: any) => {
        // Official characters are always accessible
        if (char.is_official) {
          return true;
        }
        // User's own characters are always accessible
        if (currentUserId && char.authUserId === currentUserId) {
          return true;
        }
        // Other user-created characters must be public
        return char.is_public === true;
      });

      // Transform data to include user info
      const transformedData = filteredData?.map((char: any) => {
        const result = { ...char };
        if (char.User) {
          result.user_name = char.User.user_name;
          result.user_image = char.User.image;
        }
        return result;
      });

      return success(transformedData);
    }

    // Handle collections endpoint: GET /api/characters?collections=true
    if (getCollections) {
      try {
        const { data: categoryCounts, error } = await supabase.rpc(
          'get_category_counts',
        );

        if (error) {
          console.error('Error fetching category counts:', error);
          return failed('Failed to fetch collections');
        }

        if (!categoryCounts || categoryCounts.length === 0) {
          return success({ collections: [] });
        }

        const categoryMap = new Map<string, { count: number; name: string }>();

        categoryCounts.forEach((item: any) => {
          const category = item.category;
          const count = parseInt(item.character_count) || 0;

          if (category && count > 0) {
            // Normalize to slug (same as frontend does)
            const slug = category
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '');

            const existing = categoryMap.get(slug);
            if (existing) {
              // Merge counts, keep the shorter/cleaner name
              existing.count += count;
              if (category.length < existing.name.length) {
                existing.name = category;
              }
            } else {
              categoryMap.set(slug, { count, name: category });
            }
          }
        });

        // Transform to collection format
        const collections = Array.from(categoryMap.entries())
          .map(([slug, { name, count }]) => ({
            id: slug,
            name,
            slug,
            key: slug,
            character_count: count,
            is_safe: true,
            type: 'ip' as const,
          }))
          .filter(col => col.character_count > 0)
          .sort(
            (a, b) =>
              // Sort by character count descending only
              b.character_count - a.character_count,
          );

        // Move "Spot Zero" to second position if it exists
        // Use case-insensitive search to handle different capitalizations
        const spotZeroIndex = collections.findIndex(
          col => col.name.toLowerCase() === 'spot zero',
        );

        if (
          spotZeroIndex >= 0 &&
          spotZeroIndex !== 1 &&
          collections.length >= 2
        ) {
          const spotZero = collections.splice(spotZeroIndex, 1)[0];
          collections.splice(1, 0, spotZero);
        }

        return success({ collections });
      } catch (error) {
        console.error('Error in collections API:', error);
        return failed('Internal server error');
      }
    }

    // Handle regular character listing
    const official = searchParams.get('official');
    const sortBy = searchParams.get('sort') || 'popular';
    const searchQueryRaw = searchParams.get('search'); // Add search parameter
    const mode = searchParams.get('mode') || ''; // 'nsfw' or 'sfw'

    // Check NSFW permission from cookie
    const cookies = parse(req.headers.get('cookie') || '');
    const hasNsfwPermission = cookies['relax_content'] === 'true';

    // Security: Limit results for popular and recent sorts
    let maxLimit = 200;
    if (sortBy === 'popular') {
      maxLimit = 100; // Popular only needs top 100
    } else if (sortBy === 'recent') {
      maxLimit = 100; // Recent only needs last 100
    }

    const requestedLimit = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(requestedLimit, maxLimit); // Cap at maxLimit
    const offset = parseInt(searchParams.get('offset') || '0');
    const ipCollection = searchParams.get('ip_collection');

    let query = supabase
      .from('CustomCharacters')
      .select('*, User (user_name, image)', { count: 'exact' });

    if (official === 'false') {
      query = query.eq('is_official', false);
      query = query.eq('is_public', true);
    } else {
      query = query.eq('is_official', true);
    }

    const isNsfwMode = mode === 'nsfw' && hasNsfwPermission;
    if (isNsfwMode) {
      query = query.eq('is_nsfw', true);
    } else {
      query = query.eq('is_nsfw', false);
    }

    // Security: Sanitize and filter by search query
    const searchQuery = sanitizeSearchQuery(searchQueryRaw);
    if (searchQuery) {
      // Use parameterized query methods instead of string interpolation
      query = query.or(
        `character_name.ilike.%${searchQuery}%,character_uniqid.ilike.%${searchQuery}%`,
      );
    }

    if (ipCollection) {
      query = query.eq('normalized_category', ipCollection);
    }

    // Apply sorting and filtering based on sort type
    switch (sortBy) {
      case 'popular':
        // For popular, only show characters with at least some activity
        // BUT: Don't filter when searching - show all matching results
        if (!searchQuery && !ipCollection) {
          query = query.or('num_gen.gt.0,num_collected.gt.0');
        }
        query = query.order('num_gen', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'name':
        query = query.order('character_name', { ascending: true });
        break;
      default:
        query = query.order('num_gen', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[API /characters] Database error:', error);
      return failed('fetch characters failed');
    }

    // Transform data to include user info
    const transformedData = (data as any[])?.map((char: any) => ({
      ...char,
      user_name: char.User?.user_name,
      user_image: char.User?.image,
    }));

    return success({
      characters: transformedData,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return failed(
      `Internal server error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
};

export const POST = async (req: Request) => {
  const supabase = createSupabase();

  try {
    const { character_uniqid, action } = await req.json();

    if (!character_uniqid || !action) {
      return failed('Missing required parameters');
    }

    if (!['collect', 'uncollect'].includes(action)) {
      return failed('Invalid action');
    }

    // Parse cookies from the request headers
    const cookies = parse(req.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return failed('Authentication required');
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    if (!token) {
      return failed('Invalid login status');
    }

    const userId = token.id as string;

    // Check if character exists and get owner info
    const { data: characterData, error: charError } = await supabase
      .from('CustomCharacters')
      .select('character_uniqid, authUserId')
      .eq('character_uniqid', character_uniqid)
      .single();

    if (charError || !characterData) {
      return failed('Character not found');
    }

    // Prevent users from collecting their own characters
    if (characterData.authUserId === userId) {
      return failed('Cannot collect your own character');
    }

    if (action === 'collect') {
      const { data: existing } = await supabase
        .from('CollectedCharacters')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('character_uniqid', character_uniqid)
        .single();

      if (existing) {
        if (existing.is_active) {
          return failed('Character already collected');
        }
        // Reactivate the existing record atomically
        const { data: updatedData, error: updateError } = await supabase
          .from('CollectedCharacters')
          .update({
            is_active: true,
            collected_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('character_uniqid', character_uniqid)
          .eq('is_active', false)
          .select();

        if (updateError) {
          console.error(
            'Error reactivating character collection:',
            updateError,
          );
          return failed('Failed to collect character');
        }

        if (!updatedData || updatedData.length === 0) {
          return failed('Character already collected');
        }
      } else {
        // Add new collection record
        const { data: collectedData, error: insertError } = await supabase
          .from('CollectedCharacters')
          .insert({
            user_id: userId,
            character_uniqid,
            original_owner_id: characterData.authUserId,
            collected_at: new Date().toISOString(),
            is_active: true,
          })
          .select('id,CustomCharacters(id)')
          .single();

        if (insertError) {
          console.error('Error collecting character:', insertError);
          return failed('Failed to collect character');
        }
        waitUntil(
          interactionNotificationEmail(userId, 'collect', {
            characterUniqId: character_uniqid,
          }),
        );
        pushMessage(
          {
            content_type: CONTENT_TYPES.OC_COLLECTED,
            content_id: collectedData.id,
            host_content_id: (collectedData as any).CustomCharacters.id,
            user_id: characterData.authUserId,
            broad_type: BROAD_TYPES.MESSAGE,
          },
          userId,
        );
      }

      // Update collection count
      const { error: updateError } = await supabase.rpc(
        'increment_collection_count',
        {
          character_id: character_uniqid,
        },
      );

      if (updateError) {
        console.error('Error updating collection count:', updateError);
        // Don't fail the request if count update fails
      }

      return success({ message: 'Character collected successfully' });
    }
    if (action === 'uncollect') {
      // Remove from collection (soft delete)
      const { data: updatedData, error: deleteError } = await supabase
        .from('CollectedCharacters')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('character_uniqid', character_uniqid)
        .eq('is_active', true)
        .select();

      if (deleteError) {
        console.error('Error uncollecting character:', deleteError);
        return failed('Failed to uncollect character');
      }

      if (!updatedData || updatedData.length === 0) {
        return failed('Character not collected');
      }

      // Update collection count
      const { error: updateError } = await supabase.rpc(
        'decrement_collection_count',
        {
          character_id: character_uniqid,
        },
      );

      if (updateError) {
        console.error('Error updating collection count:', updateError);
        // Don't fail the request if count update fails
      }

      return success({ message: 'Character uncollected successfully' });
    }

    // This should never be reached due to validation above
    return failed('Invalid action');
  } catch (error) {
    console.error('Error in character collection:', error);
    return failed('Internal server error');
  }
};
