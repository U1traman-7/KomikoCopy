import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FollowUser {
  id: string;
  user_name: string;
  user_uniqid?: string;
  image: string;
  num_followers: number;
  num_following: number;
  isFollowedByMe?: boolean;
  isFollowingMe?: boolean;
}

interface SupabaseUserData {
  id: string;
  user_name: string;
  user_uniqid?: string;
  image: string;
  num_followers: number;
  num_following: number;
}

export async function GET(request: Request) {
  try {
    // 获取认证用户ID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Log in to continue' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let authUserId: string;
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      
      if (!token || !token.id || typeof token.id !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid login status' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      authUserId = token.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return new Response(JSON.stringify({ error: 'Invalid login status' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取URL参数
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'followers' 或 'following'
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const targetUserId = url.searchParams.get('userId'); // 目标用户ID，如果为空则使用当前用户
    const offset = (page - 1) * limit;

    if (!type || !['followers', 'following'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid type parameter. Must be "followers" or "following"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 根据类型确定查询参数
    const isFollowers = type === 'followers';
    const selectColumn = isFollowers ? 'follower' : 'following';
    const filterColumn = isFollowers ? 'following' : 'follower';
    const filterValue = targetUserId || authUserId; // 使用目标用户ID，如果为空则使用当前用户

    // 获取关注关系数据
    const { data: followData, error: followError } = await supabase
      .from('AppFollows')
      .select(selectColumn)
      .eq(filterColumn, filterValue)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (followError) {
      console.error(`Error fetching ${type}:`, followError);
      return new Response(JSON.stringify({ error: followError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取用户IDs
    const userIds = followData?.map(item => item[selectColumn]).filter(Boolean) || [];
    
    let followUsers: FollowUser[] = [];
    
    if (userIds.length > 0) {
      // 根据用户IDs查询用户信息
      const { data: usersData, error: usersError } = await supabase
        .from('User')
        .select('id, user_name, user_uniqid, image, num_followers, num_following')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching user data:', usersError);
        return new Response(JSON.stringify({ error: usersError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 检查当前用户是否关注了这些用户（用于关注列表）
      const { data: followStatusData, error: followStatusError } = await supabase
        .from('AppFollows')
        .select('following')
        .eq('follower', authUserId)
        .in('following', userIds);

      const followedUserIds = new Set(followStatusData?.map(item => item.following) || []);

      // 检查这些用户是否关注了当前用户（用于粉丝列表）
      const { data: followingStatusData, error: followingStatusError } = await supabase
        .from('AppFollows')
        .select('follower')
        .eq('following', authUserId)
        .in('follower', userIds);

      const followingUserIds = new Set(followingStatusData?.map(item => item.follower) || []);

      followUsers = (usersData as SupabaseUserData[])?.map(user => ({
        id: user.id,
        user_name: user.user_name,
        user_uniqid: user.user_uniqid,
        image: user.image,
        num_followers: user.num_followers,
        num_following: user.num_following,
        isFollowedByMe: followedUserIds.has(user.id),
        isFollowingMe: followingUserIds.has(user.id),
      })) || [];
    }

    // 获取总数用于分页
    const { count, error: countError } = await supabase
      .from('AppFollows')
      .select('*', { count: 'exact', head: true })
      .eq(filterColumn, filterValue);
    
    const totalCount = countError ? 0 : (count || 0);

    return new Response(JSON.stringify({
      data: followUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetchFollow:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
