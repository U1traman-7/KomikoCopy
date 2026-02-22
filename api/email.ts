import {
  createSupabase,
  failed,
  getAuthUserId,
  success,
  unauthorized,
} from './_utils/index.js';
import { authMiddleware } from './_utils/middlewares/index.js';
import withHandler from './_utils/withHandler.js';

const supabase = createSupabase();
const handler = async (request: Request) => {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return unauthorized('Unauthorized');
  }
  const { data, error } = await supabase
    .from('User')
    .select('email')
    .eq('id', userId)
    .single();
  if (error) {
    console.error(error);
    return failed('Failed to fetch user');
  }
  return success(data);
};

export const GET = withHandler(handler, [authMiddleware]);
