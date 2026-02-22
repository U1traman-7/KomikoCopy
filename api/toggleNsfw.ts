import { ERROR_CODES } from './_constants.js';
import Roles from './_models/roles.js';
import {
  createSupabase,
  failedWithCode,
  getUserId,
  success,
  unauthorized,
} from './_utils/index.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from './_utils/middlewares/index.js';
import withHandler from './_utils/withHandler.js';

const supabase = createSupabase();
const NSFW_TAG_ID = 2;

async function handler(request: RequestImproved) {
  const params = request.params;
  const { id } = params;
  const userId = getUserId(request);

  if (!id) {
    return failedWithCode(ERROR_CODES.POST_NOT_FOUND, 'Post ID is required');
  }

  if (!userId) {
    return unauthorized('Unauthorized');
  }

  const roles = new Roles(userId);
  await roles.getRoles();
  const isAdmin = roles.isAdmin();
  if (!isAdmin) {
    return failedWithCode(ERROR_CODES.POST_OPERATION_FORBIDDEN, 'Forbidden');
  }

  try {
    const { data: postData, error: postError } = await supabase
      .from('AppPosts')
      .select('is_private')
      .eq('id', id)
      .single();

    if (postError || !postData) {
      console.error('Error fetching post:', postError);
      return failedWithCode(ERROR_CODES.POST_NOT_FOUND, 'Post not found');
    }

    const nextIsPrivate = !postData.is_private;

    const { error: updateError } = await supabase
      .from('AppPosts')
      .update({ is_private: nextIsPrivate })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating post privacy:', updateError);
      return failedWithCode(
        ERROR_CODES.POST_NOT_FOUND,
        'Failed to update NSFW status',
      );
    }

    if (nextIsPrivate) {
      const { data: existingTag } = await supabase
        .from('post_tags')
        .select('id')
        .eq('post_id', id)
        .eq('tag_id', NSFW_TAG_ID)
        .single();

      if (!existingTag) {
        const { error: tagError } = await supabase
          .from('post_tags')
          .insert([{ tag_id: NSFW_TAG_ID, post_id: id }]);

        if (tagError) {
          console.error('Error adding NSFW tag:', tagError);
          return failedWithCode(
            ERROR_CODES.POST_NOT_FOUND,
            'Failed to add NSFW tag',
          );
        }
      }
    } else {
      const { error: removeError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id)
        .eq('tag_id', NSFW_TAG_ID);

      if (removeError) {
        console.error('Error removing NSFW tag:', removeError);
        return failedWithCode(
          ERROR_CODES.POST_NOT_FOUND,
          'Failed to remove NSFW tag',
        );
      }
    }

    const { data: updatedPostTags } = await supabase
      .from('post_tags')
      .select(
        `
        tag_id,
        tags (
          id,
          name
        )
      `,
      )
      .eq('post_id', id);

    const formattedPostTags =
      updatedPostTags?.map((pt: any) => ({
        id: pt.tags.id,
        name: pt.tags.name,
      })) || [];

    return success({
      id,
      post_tags: formattedPostTags,
    });
  } catch (error) {
    console.error('Error toggling NSFW status:', error);
    return failedWithCode(
      ERROR_CODES.POST_NOT_FOUND,
      'Failed to update NSFW status',
    );
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);
