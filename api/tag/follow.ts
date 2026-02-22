/**
 * Unified Tag Follow API
 * Combines: follow, reorder, initialize
 *
 * POST /api/tag/follow - Follow/unfollow a tag OR reorder followed tags
 *   Body: { tagId, action: 'follow'|'unfollow' }
 *   Body: { action: 'reorder', tagOrders: Array<{ tagId, sortOrder }> }
 *   Body: { action: 'initialize' } - Initialize default tag follows for new user
 *
 * GET /api/tag/follow - Get followed tags or check follow status
 *   Query: ?tagId=X (optional, check specific tag)
 *   Returns: { followed_tags, default_tags, is_initialized }
 */
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import {
  authenticateUser,
  supabase,
  jsonResponse,
  errorResponse,
} from './_handlers/utils.js';

type FollowAction = 'follow' | 'unfollow' | 'reorder' | 'initialize';

interface TagOrder {
  tagId: number;
  sortOrder: number;
}

// Special tags that cannot be unfollowed
const SPECIAL_TAG_IDS = [
  57349, // FEATURED
  57360, // ALL_POSTS
  87327, // TEMPLATES
  21544, // ANIMATION
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: FollowAction };

    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth.authenticated || !auth.userId) {
      return auth.error!;
    }

    // Handle reorder action
    if (action === 'reorder') {
      return handleReorder(auth.userId, body.tagOrders);
    }

    // Handle initialize action - initialize user with default tag follows
    if (action === 'initialize') {
      return handleInitialize(auth.userId);
    }

    // Handle follow/unfollow
    const { tagId } = body as { tagId: number; action: 'follow' | 'unfollow' };

    if (!tagId || !['follow', 'unfollow'].includes(action)) {
      return errorResponse(
        'Invalid input. Required: tagId, action (follow|unfollow|reorder)',
      );
    }

    // Verify the tag exists
    const { data: tagExists, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tagId)
      .single();

    if (tagError || !tagExists) {
      return errorResponse('Tag not found', 404);
    }

    if (action === 'follow') {
      // Check if already following
      const { data: existing } = await supabase
        .from('tag_follows')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('tag_id', tagId)
        .single();

      if (existing) {
        return jsonResponse({
          message: 'Already following this tag',
          is_following: true,
        });
      }

      // Insert follow record (trigger will update follower_count)
      const { error: insertError } = await supabase
        .from('tag_follows')
        .insert({ user_id: auth.userId, tag_id: tagId });

      if (insertError) {
        console.error('Error following tag:', insertError);
        return errorResponse('Failed to follow tag', 500);
      }

      return jsonResponse({
        message: 'Successfully followed tag',
        is_following: true,
      });
    } else {
      // Check if this is a special tag that cannot be unfollowed
      if (SPECIAL_TAG_IDS.includes(tagId)) {
        return errorResponse('This tag cannot be unfollowed', 400);
      }

      // Unfollow - delete record (trigger will update follower_count)
      const { error: deleteError } = await supabase
        .from('tag_follows')
        .delete()
        .eq('user_id', auth.userId)
        .eq('tag_id', tagId);

      if (deleteError) {
        console.error('Error unfollowing tag:', deleteError);
        return errorResponse('Failed to unfollow tag', 500);
      }

      return jsonResponse({
        message: 'Successfully unfollowed tag',
        is_following: false,
      });
    }
  } catch (error) {
    console.error('Tag follow error:', error);
    return errorResponse('Internal server error', 500);
  }
}

/**
 * Handle reorder action - update sort order of followed tags
 */
async function handleReorder(
  userId: string,
  tagOrders: TagOrder[],
): Promise<Response> {
  if (!tagOrders || !Array.isArray(tagOrders)) {
    return errorResponse('Invalid input. Required: tagOrders array');
  }

  // Format tag orders for the RPC function
  const formattedOrders = tagOrders.map(item => ({
    tag_id: item.tagId,
    sort_order: item.sortOrder,
  }));

  // Call the RPC function to update sort orders
  const { data, error } = await supabase.rpc('update_tag_follow_order', {
    p_user_id: userId,
    p_tag_orders: formattedOrders,
  });

  if (error) {
    console.error('Error updating tag order:', error);
    return errorResponse('Failed to update tag order', 500);
  }

  return jsonResponse({
    success: true,
    message: 'Tag order updated successfully',
    ...data,
  });
}

/**
 * Handle initialize action - initialize user with default tag follows
 */
async function handleInitialize(userId: string): Promise<Response> {
  // Call the RPC function to initialize default tags
  const { data, error } = await supabase.rpc('initialize_user_default_tags', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error initializing default tags:', error);
    return errorResponse('Failed to initialize default tags', 500);
  }

  return jsonResponse({
    success: true,
    message: 'Default tags initialized successfully',
    ...data,
  });
}

/**
 * GET /api/tag/follow
 * Get user's followed tags or check if following a specific tag
 * Query params:
 *   - tagId: (optional) check if following specific tag
 *   - Without tagId: returns list of all followed tags
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');

    // Parse cookies to get user ID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let userId: string;
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token?.id) {
        throw new Error('Invalid token');
      }
      userId = token.id as string;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (tagId) {
      // Check if following a specific tag
      const { data: follow } = await supabase
        .from('tag_follows')
        .select('id')
        .eq('user_id', userId)
        .eq('tag_id', parseInt(tagId))
        .single();

      return new Response(JSON.stringify({ is_following: !!follow }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('get_user_tags_with_defaults', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching followed tags:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch followed tags' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Data is already in the format: { followed_tags, default_tags, is_initialized }
    return new Response(
      JSON.stringify(
        data || { followed_tags: [], default_tags: [], is_initialized: false },
      ),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Get followed tags error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
