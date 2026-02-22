/**
 * Feature/unfeature post handler
 */
import { supabase, canManageTag, jsonResponse, errorResponse } from '../utils.js';

export async function handleFeature(
  userId: string,
  tagId: number,
  postId: number,
  action: 'feature' | 'unfeature'
): Promise<Response> {
  // Check permissions
  const canManage = await canManageTag(userId, tagId);
  if (!canManage) {
    return errorResponse('Only tag moderators or admins can feature posts', 403);
  }

  // Check if post-tag relationship exists
  const { data: postTag, error: postTagError } = await supabase
    .from('post_tags')
    .select('id, is_featured')
    .eq('tag_id', tagId)
    .eq('post_id', postId)
    .single();

  if (postTagError || !postTag) {
    return errorResponse('Post is not associated with this tag', 404);
  }

  if (action === 'feature') {
    // Get max sort order for this tag's featured posts
    const { data: maxOrderData } = await supabase
      .from('post_tags')
      .select('feature_sort_order')
      .eq('tag_id', tagId)
      .eq('is_featured', true)
      .order('feature_sort_order', { ascending: false })
      .limit(1)
      .single();

    const newSortOrder = (maxOrderData?.feature_sort_order || 0) + 1;

    const { error: updateError } = await supabase
      .from('post_tags')
      .update({
        is_featured: true,
        featured_at: new Date().toISOString(),
        featured_by: userId,
        feature_sort_order: newSortOrder,
      })
      .eq('id', postTag.id);

    if (updateError) {
      console.error('Error featuring post:', updateError);
      return errorResponse(updateError.message, 500);
    }

    return jsonResponse({ message: 'Post featured successfully', is_featured: true });
  } else {
    // Unfeature
    const { error: updateError } = await supabase
      .from('post_tags')
      .update({
        is_featured: false,
        featured_at: null,
        featured_by: null,
        feature_sort_order: 0,
      })
      .eq('id', postTag.id);

    if (updateError) {
      console.error('Error unfeaturing post:', updateError);
      return errorResponse(updateError.message, 500);
    }

    return jsonResponse({ message: 'Post unfeatured successfully', is_featured: false });
  }
}

export async function handleFeatureSortOrder(
  userId: string,
  tagId: number,
  postId: number,
  sortOrder: number
): Promise<Response> {
  const canManage = await canManageTag(userId, tagId);
  if (!canManage) {
    return errorResponse('Only tag moderators or admins can reorder featured posts', 403);
  }

  const { error: updateError } = await supabase
    .from('post_tags')
    .update({ feature_sort_order: sortOrder })
    .eq('tag_id', tagId)
    .eq('post_id', postId)
    .eq('is_featured', true);

  if (updateError) {
    console.error('Error updating sort order:', updateError);
    return errorResponse(updateError.message, 500);
  }

  return jsonResponse({ message: 'Sort order updated successfully' });
}

export async function checkCanFeature(userId: string | null, tagId: number): Promise<Response> {
  // Get featured post IDs for this tag
  const { data: featuredPosts, error: featuredError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tagId)
    .eq('is_featured', true)
    .order('feature_sort_order', { ascending: false });

  const featuredPostIds = featuredError ? [] : featuredPosts?.map((p) => p.post_id) || [];

  if (!userId) {
    return jsonResponse({ can_feature: false, featured_post_ids: featuredPostIds });
  }

  const canManage = await canManageTag(userId, tagId);
  return jsonResponse({ can_feature: canManage, featured_post_ids: featuredPostIds });
}

