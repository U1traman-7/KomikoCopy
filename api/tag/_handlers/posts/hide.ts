/**
 * Hide/unhide post handler
 */
import { supabase, canManageTag, jsonResponse, errorResponse } from '../utils.js';

export async function handleHide(
  userId: string,
  tagId: number,
  postId: number,
  action: 'hide' | 'unhide'
): Promise<Response> {
  // Check permissions
  const canManage = await canManageTag(userId, tagId);
  if (!canManage) {
    return errorResponse('Only tag moderators or admins can hide posts', 403);
  }

  // Check if post-tag relationship exists
  const { data: postTag, error: postTagError } = await supabase
    .from('post_tags')
    .select('id')
    .eq('tag_id', tagId)
    .eq('post_id', postId)
    .single();

  if (postTagError || !postTag) {
    return errorResponse('Post is not associated with this tag', 404);
  }

  const isHidden = action === 'hide';
  const { error: updateError } = await supabase
    .from('post_tags')
    .update({
      is_hidden: isHidden,
      hidden_at: isHidden ? new Date().toISOString() : null,
      hidden_by: isHidden ? userId : null,
    })
    .eq('id', postTag.id);

  if (updateError) {
    console.error('Error updating post visibility:', updateError);
    return errorResponse(updateError.message, 500);
  }

  return jsonResponse({
    message: isHidden ? 'Post hidden successfully' : 'Post unhidden successfully',
    is_hidden: isHidden,
  });
}

export async function getHiddenPosts(userId: string, tagId: number): Promise<Response> {
  // Check permission
  const canManage = await canManageTag(userId, tagId);
  if (!canManage) {
    return errorResponse('No permission to view hidden posts', 403);
  }

  // Fetch hidden posts for this tag
  const { data: hiddenPosts, error } = await supabase
    .from('post_tags')
    .select(
      `
      post_id,
      hidden_at,
      hidden_by,
      posts:AppPosts(
        id,
        uniqid,
        title,
        media,
        authUserId,
        user:User(user_name, image)
      )
    `
    )
    .eq('tag_id', tagId)
    .eq('is_hidden', true)
    .order('hidden_at', { ascending: false });

  if (error) {
    console.error('Error fetching hidden posts:', error);
    return errorResponse(error.message, 500);
  }

  // Transform data to expected format
  const posts =
    hiddenPosts?.map((item) => ({
      post_id: item.post_id,
      hidden_at: item.hidden_at,
      hidden_by: item.hidden_by,
      post: item.posts,
    })) || [];

  return jsonResponse({ posts });
}

