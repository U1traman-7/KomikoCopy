import { BROAD_TYPES, CONTENT_TYPES, ERROR_CODES } from './_constants.js';
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
import { pushMessage } from './message.js';

const supabase = createSupabase();

async function handler(request: RequestImproved) {
  const params = request.params;
  const { id, featured } = params;
  const userId = getUserId(request);

  if (!id) {
    return failedWithCode(ERROR_CODES.POST_NOT_FOUND, 'Post ID is required');
  }

  if (featured === undefined || featured === null) {
    return failedWithCode(
      ERROR_CODES.INVALID_PARAMS,
      'Featured parameter is required',
    );
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

  // Convert featured parameter to boolean
  const featuredValue = featured === 'true' || featured === true;

  const FEATURED_TAG_ID = 57349;

  try {
    if (featuredValue) {
      // Add Featured tag
      // First check if the tag already exists for this post
      const { data: existingTag } = await supabase
        .from('post_tags')
        .select('*')
        .eq('post_id', id)
        .eq('tag_id', FEATURED_TAG_ID)
        .single();

      if (!existingTag) {
        // Insert the Featured tag
        const { data: tagData, error: tagError } = await supabase
          .from('post_tags')
          .insert([{ tag_id: FEATURED_TAG_ID, post_id: id }])
          .select('id, AppPosts(authUserId)')
          .single();

        if (tagError) {
          console.error('Error adding Featured tag:', tagError);
          return failedWithCode(
            ERROR_CODES.POST_NOT_FOUND,
            'Failed to add Featured tag',
          );
        }
        pushMessage({
          content_type: CONTENT_TYPES.FEATURED,
          content_id: tagData.id,
          host_content_id: id,
          user_id: (tagData as any).AppPosts.authUserId,
          broad_type: BROAD_TYPES.MESSAGE,
        });
      }
    } else {
      // Remove Featured tag
      const { error: removeError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', id)
        .eq('tag_id', FEATURED_TAG_ID);

      if (removeError) {
        console.error('Error removing Featured tag:', removeError);
        return failedWithCode(
          ERROR_CODES.POST_NOT_FOUND,
          'Failed to remove Featured tag',
        );
      }
    }

    // 获取更新后的 post_tags
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

    // 格式化 post_tags 数据
    const formattedPostTags =
      updatedPostTags?.map((pt: any) => ({
        id: pt.tags.id,
        name: pt.tags.name,
      })) || [];

    return success({
      id,
      featured: featuredValue,
      post_tags: formattedPostTags,
    });
  } catch (error) {
    console.error('Error managing Featured tag:', error);
    return failedWithCode(
      ERROR_CODES.POST_NOT_FOUND,
      'Failed to update featured status',
    );
  }
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);
