import { createSupabase, failed, success } from '../_utils/index.js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

interface SupabaseUser {
  id: string;
  user_name: string | null;
  user_uniqid: string | null;
  image: string | null;
  num_followers: number | null;
  num_following: number | null;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabase();
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (!searchQuery || !searchQuery.trim()) {
      return success({
        users: [],
        total: 0,
        limit,
        offset,
      });
    }

    let authUserId: string | null = null;
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (sessionToken) {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (token?.id && typeof token.id === 'string') {
        authUserId = token.id;
      }
    }
    const trimmedQuery = searchQuery.trim();
    const query = supabase
      .from('User')
      .select(
        'id, user_name, user_uniqid, image, num_followers, num_following, created_at',
        { count: 'exact' },
      )
      .or(`user_name.ilike.%${trimmedQuery}%`)
      .order('num_followers', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      // PGRST103: offset exceeds total rows - return empty array instead of error
      if (error.code === 'PGRST103') {
        return success({
          users: [],
          total: count || 0,
          limit,
          offset,
        });
      }
      console.error('[API /search/users] Database error:', error);
      return failed('Failed to search users');
    }

    const userData = (data || []) as SupabaseUser[];
    const userIds = userData.map(user => user.id);

    // 如果已登录，查询当前用户对搜索结果用户的关注状态
    let followedUserIds = new Set<string>();
    if (authUserId && userIds.length > 0) {
      const { data: followData } = await supabase
        .from('AppFollows')
        .select('following')
        .eq('follower', authUserId)
        .in('following', userIds);

      followedUserIds = new Set(followData?.map(item => item.following) || []);
    }

    const users = userData.map(user => ({
      id: user.id,
      user_name: user.user_name || '',
      user_uniqid: user.user_uniqid || '',
      image: user.image || '',
      num_followers: user.num_followers || 0,
      num_following: user.num_following || 0,
      created_at: user.created_at,
      is_followed: followedUserIds.has(user.id),
    }));

    return success({
      users,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API /search/users] Unexpected error:', error);
    return failed(
      'Internal server error: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    );
  }
}
