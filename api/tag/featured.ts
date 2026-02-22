import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { supabase } from './_handlers/utils.js';

// Simple in-memory cache for featured posts
const featuredCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds cache for featured posts
const MAX_CACHE_SIZE = 100;

function getCacheKey(params: any): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): any | null {
  const cached = featuredCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  featuredCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  if (featuredCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = featuredCache.keys().next().value;
    if (oldestKey) {
      featuredCache.delete(oldestKey);
    }
  }
  featuredCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Get featured posts for a specific tag
 * Featured posts are sorted by:
 * 1. feature_sort_order (DESC) - manually set priority
 * 2. featured_at (DESC) - most recently featured first
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Parse URL parameters
    const url = new URL(request.url);
    const tagIdParam = url.searchParams.get('tagId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const sortBy = url.searchParams.get('sortBy') || 'featured'; // 'featured' or 'newest'

    if (!tagIdParam) {
      return new Response(
        JSON.stringify({ error: 'tagId parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const tagId = parseInt(tagIdParam, 10);
    if (isNaN(tagId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tagId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get auth user ID
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    let authUserId = '';

    if (sessionToken) {
      try {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        authUserId = (token?.id as string) || '';
      } catch (error) {
        console.error('Error decoding session token:', error);
      }
    }

    // Check NSFW permission
    const allowNSFW = cookies['relax_content'] === 'true';

    // Get tag details to check if it's NSFW
    const { data: tagData } = await supabase
      .from('tags')
      .select('id, name, is_nsfw')
      .eq('id', tagId)
      .single();

    if (!tagData) {
      return new Response(JSON.stringify({ error: 'Tag not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Create cache key
    const cacheKey = getCacheKey({
      tagId,
      page,
      limit,
      sortBy,
      allowNSFW,
      authUserId: authUserId || 'guest',
    });

    // Check cache
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log('Returning cached featured posts');
      return new Response(JSON.stringify(cachedResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query for featured posts
    let query = supabase
      .from('post_tags')
      .select(
        `
        post_id,
        feature_sort_order,
        featured_at,
        AppPosts!inner(
          id,
          uniqid,
          authUserId,
          created_at,
          views,
          rizz,
          title,
          content,
          media,
          votes,
          tags,
          media_type,
          translation,
          hide_main_feed,
          is_private,
          banned,
          post_tags(tags(id, name, i18n))
        )
      `,
      )
      .eq('tag_id', tagId)
      .eq('is_featured', true)
      .not('AppPosts.banned', 'is', true);

    // Apply NSFW filter
    if (!allowNSFW || !tagData.is_nsfw) {
      query = query.not('AppPosts.is_private', 'eq', true);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order('AppPosts(created_at)', { ascending: false });
    } else {
      // Default: sort by featured order
      query = query
        .order('feature_sort_order', { ascending: false })
        .order('featured_at', { ascending: false, nullsFirst: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching featured posts:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform data to match feed format
    const posts = (data || []).map((item: any) => ({
      ...item.AppPosts,
      post_tags: item.AppPosts.post_tags?.map((pt: any) => pt.tags) || [],
      featured_at: item.featured_at,
      feature_sort_order: item.feature_sort_order,
    }));

    // Get user data for posts
    const userIds = posts.map((post: any) => post.authUserId);
    const { data: usersData } = await supabase
      .from('User')
      .select('id, user_name, image, user_uniqid, is_cpp')
      .in('id', userIds);

    // Get subscription data
    const { data: subscriptionsData } = await supabase
      .from('Subscriptions')
      .select('user_id, plan')
      .in('user_id', userIds)
      .gt('expires', Math.floor(Date.now() / 1000))
      .order('expires', { ascending: false });

    // Map user data
    const usersMap: Record<string, any> = {};
    const subscriptionsMap: Record<string, string> = {};

    subscriptionsData?.forEach((sub: any) => {
      subscriptionsMap[sub.user_id] = sub.plan;
    });

    usersData?.forEach((user: any) => {
      usersMap[user.id] = {
        user_name: user.user_name,
        image: user.image,
        user_uniqid: user.user_uniqid,
        plan: user.is_cpp ? 'CPP' : subscriptionsMap[user.id] || 'Free',
      };
    });

    // Get like data for auth user
    const postIds = posts.map((post: any) => post.id);
    let likesMap: Record<number, boolean> = {};

    if (authUserId && postIds.length > 0) {
      const { data: votesData } = await supabase
        .from('AppVotes')
        .select('postId')
        .in('postId', postIds)
        .eq('authUserId', authUserId);

      votesData?.forEach((vote: any) => {
        likesMap[vote.postId] = true;
      });
    }

    // Get follow data for auth user
    let followsMap: Record<string, boolean> = {};

    if (authUserId && userIds.length > 0) {
      const { data: followsData } = await supabase
        .from('AppFollows')
        .select('following')
        .in('following', userIds)
        .eq('follower', authUserId);

      followsData?.forEach((follow: any) => {
        followsMap[follow.following] = true;
      });
    }

    // Combine all data
    const result = posts.map((post: any) => ({
      ...post,
      user_name: usersMap[post.authUserId]?.user_name || '',
      image: usersMap[post.authUserId]?.image || null,
      user_uniqid: usersMap[post.authUserId]?.user_uniqid || '',
      user_plan: usersMap[post.authUserId]?.plan || 'Free',
      liked: !!likesMap[post.id],
      followed: !!followsMap[post.authUserId],
      comments: [], // Comments can be loaded separately if needed
      generations: [], // Generations can be loaded separately if needed
    }));

    const totalTime = Date.now() - startTime;
    console.log(
      `Featured posts query: ${totalTime}ms, tag: ${tagId}, posts: ${result.length}`,
    );

    // Cache the result
    setCache(cacheKey, result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in featured posts API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
