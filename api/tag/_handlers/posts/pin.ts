/**
 * Pin/unpin post handler
 */
import { supabase, canManageTag, jsonResponse, errorResponse } from '../utils.js';

export async function handlePin(
  userId: string,
  tagId: number,
  postId: number,
  action: 'pin' | 'unpin'
): Promise<Response> {
  // Check permissions
  const canManage = await canManageTag(userId, tagId);
  if (!canManage) {
    return errorResponse('Only tag moderators or admins can pin posts', 403);
  }

  // Check if post-tag relationship exists
  let { data: postTag, error: postTagError } = await supabase
    .from('post_tags')
    .select('id')
    .eq('tag_id', tagId)
    .eq('post_id', postId)
    .single();

  // If relationship doesn't exist, create it (for moderators pinning posts to their tag)
  if (postTagError || !postTag) {
    if (action === 'pin') {
      // Create the post-tag relationship
      const { data: newPostTag, error: createError } = await supabase
        .from('post_tags')
        .insert({ tag_id: tagId, post_id: postId })
        .select('id')
        .single();

      if (createError || !newPostTag) {
        console.error('Error creating post-tag relationship:', createError);
        return errorResponse('Failed to associate post with tag', 500);
      }
      postTag = newPostTag;
    } else {
      // Can't unpin if relationship doesn't exist
      return errorResponse('Post is not associated with this tag', 404);
    }
  }

  if (action === 'pin') {
    // Get max sort order for this tag's pinned posts
    const { data: maxOrderData } = await supabase
      .from('post_tags')
      .select('pin_sort_order')
      .eq('tag_id', tagId)
      .eq('is_pinned', true)
      .order('pin_sort_order', { ascending: false })
      .limit(1)
      .single();

    const newSortOrder = (maxOrderData?.pin_sort_order || 0) + 1;

    const { error: updateError } = await supabase
      .from('post_tags')
      .update({
        is_pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: userId,
        pin_sort_order: newSortOrder,
      })
      .eq('id', postTag.id);

    if (updateError) {
      console.error('Error pinning post:', updateError);
      return errorResponse(updateError.message, 500);
    }

    return jsonResponse({ message: 'Post pinned successfully', is_pinned: true });
  } else {
    // Unpin
    const { error: updateError } = await supabase
      .from('post_tags')
      .update({
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
        pin_sort_order: 0,
      })
      .eq('id', postTag.id);

    if (updateError) {
      console.error('Error unpinning post:', updateError);
      return errorResponse(updateError.message, 500);
    }

    return jsonResponse({ message: 'Post unpinned successfully', is_pinned: false });
  }
}

export async function handlePinSortOrder(
  userId: string,
  tagId: number,
  postId: number,
  sortOrder: number
): Promise<Response> {
  const canManage = await canManageTag(userId, tagId);
  if (!canManage) {
    return errorResponse('Only tag moderators or admins can reorder pinned posts', 403);
  }

  const { error: updateError } = await supabase
    .from('post_tags')
    .update({ pin_sort_order: sortOrder })
    .eq('tag_id', tagId)
    .eq('post_id', postId)
    .eq('is_pinned', true);

  if (updateError) {
    console.error('Error updating pin sort order:', updateError);
    return errorResponse(updateError.message, 500);
  }

  return jsonResponse({ message: 'Pin sort order updated successfully' });
}

export async function checkCanPin(userId: string | null, tagId: number): Promise<Response> {
  // Get pinned post IDs for this tag
  const { data: pinnedPosts, error: pinnedError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tagId)
    .eq('is_pinned', true)
    .order('pin_sort_order', { ascending: false });

  const pinnedPostIds = pinnedError ? [] : pinnedPosts?.map((p) => p.post_id) || [];

  if (!userId) {
    return jsonResponse({ can_pin: false, pinned_post_ids: pinnedPostIds });
  }

  const canManage = await canManageTag(userId, tagId);
  return jsonResponse({ can_pin: canManage, pinned_post_ids: pinnedPostIds });
}

