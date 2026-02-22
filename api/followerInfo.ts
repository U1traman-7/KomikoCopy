import { createSupabase, getAuthUserId, success } from './_utils/index.js';
import withHandler from './_utils/withHandler.js';

const supabase = createSupabase();
const handler = async (request: Request) => {
  let userId = await getAuthUserId(request);
  
  const url = new URL(request.url);
  const userUniqId = url.searchParams.get('uniqId');
  
  if (userUniqId && userUniqId !== 'undefined' && userUniqId.trim() !== '') {
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .eq('user_uniqid', userUniqId)
      .single();

    if (!error && data) {
      userId = data.id;
    } else {
      // User not found with the provided uniqId
      return new Response(
        JSON.stringify({ 
          code: 0, 
          message: 'User not found',
          error: 'User not found',
          data: { follower_count: 0, following_count: 0 }
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
  
  // If userId is still null/undefined after processing uniqId, return error
  if (!userId) {
    return new Response(
      JSON.stringify({ 
        code: 0, 
        message: 'User not authenticated',
        error: 'User not authenticated',
        data: { follower_count: 0, following_count: 0 }
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 并行执行两个查询
  const [followerResult, followingResult] = await Promise.all([
    // 获取关注我的人的数量 (follower_count)
    supabase
      .from('AppFollows')
      .select('*', { count: 'exact', head: true })
      .eq('following', userId),

    // 获取我关注的人的数量 (following_count)
    supabase
      .from('AppFollows')
      .select('*', { count: 'exact', head: true })
      .eq('follower', userId),
  ]);
  if (followerResult.error) {
    console.error(followerResult.error);
  }

  if (followingResult.error) {
    console.error(followingResult.error);
  }

  return success({
    follower_count: followerResult?.count || 0,
    following_count: followingResult?.count || 0,
  });
};

export const GET = withHandler(handler, []);
