import { ERROR_CODES } from '../_constants.js';
import Roles from '../_models/roles.js';
import {
  createSupabase,
  failedWithCode,
  getUserId,
  success,
  unauthorized,
} from '../_utils/index.js';
import {
  authMiddleware,
  bindParamsMiddleware,
} from '../_utils/middlewares/index.js';
import withHandler from '../_utils/withHandler.js';

const supabase = createSupabase();

async function handler(request: RequestImproved) {
  const params = request.params;
  const { post_id } = params;
  const userId = getUserId(request);

  if (!post_id) {
    return failedWithCode(ERROR_CODES.POST_NOT_FOUND, 'Post ID is required');
  }

  if (!userId) {
    return unauthorized('Unauthorized');
  }

  const roles = new Roles(userId);
  await roles.getRoles();
  // console.log('roles', roles);
  const isAdmin = roles.isAdmin();
  if (!isAdmin) {
    return failedWithCode(ERROR_CODES.POST_OPERATION_FORBIDDEN, 'Forbidden');
  }

  const { error } = await supabase
    .from('AppPosts')
    .update({ banned: true })
    .eq('id', post_id);
  if (error) {
    console.error('Error banning post:', error, post_id);
    return failedWithCode(ERROR_CODES.POST_NOT_FOUND, 'Post ID is required');
  }

  return success(null);
}

export const POST = withHandler(handler, [
  authMiddleware,
  bindParamsMiddleware,
]);
