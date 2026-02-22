import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { FeedPageSize, MAX_OC_TAGS } from './_constants.js';
import geoip from 'geoip-lite';
import {
  normalizeTagNameForLookup,
  fetchCharacterInfoForTags,
  getTagDetail,
  type TagMetaInfo,
} from './tag/_handlers/utils.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple in-memory cache for high-traffic queries
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds cache
const MAX_CACHE_SIZE = 1000;

// Request rate limiting per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// 获取客户端IP地址，考虑Cloudflare代理
function getClientIP(request: Request): string | null {
  const clientIP = request.headers.get('x-custom-real-client-ip');
  if (clientIP) {
    return clientIP;
  }
  // Cloudflare会通过CF-Connecting-IP传递真实IP
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 备用方案：x-forwarded-for（第一个IP是真实IP）
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 最后尝试x-real-ip
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}

// 检查是否为中国的IP地址
function isChinaIP(ip: string | null): boolean {
  if (!ip) {
    return false;
  }

  try {
    const geo = geoip.lookup(ip);
    return geo?.country === 'CN';
  } catch (error) {
    console.error('Error looking up IP:', error);
    return false;
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

function getCacheKey(params: any): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): any | null {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  queryCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  // Clean old entries if cache is too large
  if (queryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) {
      queryCache.delete(oldestKey);
    }
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

// Helper function to mix posts with ratio 4:1 (free:paid)
function mixPosts(freePosts: any[], paidPosts: any[]): any[] {
  const mixedPosts: any[] = [];
  const freeLength = freePosts.length;
  const paidLength = paidPosts.length;

  let freeIndex = 0;
  let paidIndex = 0;
  const step = Math.ceil(FeedPageSize.FREE / FeedPageSize.PAID);

  while (freeIndex < freeLength || paidIndex < paidLength) {
    // Add 4 free posts
    for (let i = 0; i < step && freeIndex < freeLength; i++) {
      mixedPosts.push(freePosts[freeIndex++]);
    }

    // Add 1 paid post
    if (paidIndex < paidLength) {
      mixedPosts.push(paidPosts[paidIndex++]);
    }
  }

  return mixedPosts;
}

export type MediaType = 'image' | 'video' | 'text';

// Content filter mode for NSFW toggle
export enum Mode {
  SFW = 'sfw', // Only show SFW content
  NSFW = 'nsfw', // Only show NSFW content
}

// Define the types for the post and user data
export interface Post {
  id: number;
  uniqid: string;
  user_uniqid: string;
  authUserId: string;
  created_at: string;
  views: number;
  rizz: number;
  title: string;
  content: string;
  media: string[];
  votes: number;
  liked: boolean;
  comments: Comment[];
  followed: boolean;
  generations: string[];
  media_type: MediaType;
  post_tags: {
    tags: {
      id: number;
      name: string;
      logo_url?: string | null;
      i18n?: Record<string, string> | null;
    };
  }[];
  PinAppPost: { post_id: number }[];
  oc_id?: string | null;
  custom_characters_image_generations?: { character_uniqid: string }[];
}

export interface Comment {
  id?: number;
  postid: number;
  content: string;
  votes: number;
  user_name: string;
  user_uniqid?: string;
  user_id?: string;
  image: string;
  created_at: string;
  children: Comment[];
}

export interface Generation {
  post_id: number;
  image_id: number;
  image_created_at: Date;
  prompt: string;
  model: string;
  url_path: string;
  meta_data?: string;
}

export interface User {
  id: string;
  user_name: string;
  image: string;
  user_uniqid: string;
  is_cpp?: boolean;
  plan?: string;
}

interface VoteCount {
  postid: number;
  postId: number;
  count: number;
}

interface RizzCount {
  postid: number;
  rizz: number;
}

interface QueryParams {
  sortby: string;
  useronly: string;
  postonly: string;
  mainfeedonly: string;
  tagsonly: string;
  mediaType: string;
  auth_user_id: string;
  followingUserIds: string[];
  collectedOCPostIds: number[]; // Post IDs that contain collected OC tags
  offset: number;
  limit: number;
}

async function updateRefCode(
  authUserId: string,
  newRefCode: string,
): Promise<void> {
  supabase
    .rpc('update_ref_code', {
      authuserid: authUserId,
      new_ref_code: newRefCode,
    })
    .then(({ error }) => {
      if (error) {
        console.error('Error updating ref_code:', error);
      } else {
        console.log('Ref_code update function called successfully');
      }
    });
}

// Function to process posts with all the necessary data from Supabase
export async function postProcessPosts(
  postsData: Post[],
  auth_user_id: string,
): Promise<any[]> {
  if (!postsData || postsData.length === 0) {
    return [];
  }

  const tagMetaInfos: TagMetaInfo[] = postsData.flatMap(post =>
    (post?.post_tags || [])
      .map(tag => {
        const originalName = tag?.tags?.name;
        if (!originalName) {
          return null;
        }
        return {
          originalName,
          normalizedName: normalizeTagNameForLookup(originalName),
        } as TagMetaInfo;
      })
      .filter((meta): meta is TagMetaInfo => !!meta),
  );
  const characterInfoMap = await fetchCharacterInfoForTags(
    supabase,
    tagMetaInfos,
  );

  // ! FETCH USER DATA (always needed)
  const userIds = postsData.map(post => post.authUserId);
  const fetchUserData = supabase
    .from('User')
    .select('id, user_name, image, user_uniqid, is_cpp')
    .in('id', userIds)
    .returns<User[]>();

  // ! FETCH USER SUBSCRIPTION DATA
  // const tableName = process.env.MODE === 'development' ? 'Subscriptions_test' : 'Subscriptions';
  const fetchSubscriptionData = supabase
    .from('Subscriptions')
    .select('user_id, plan')
    .in('user_id', userIds)
    .gt('expires', Math.floor(Date.now() / 1000))
    .order('expires', { ascending: false });

  const postIds = postsData.map(post => post.id);

  // ! FETCH LIKE DATA
  const fetchVotesData = supabase
    .from('AppVotes')
    .select('authUserId, postId')
    .in('postId', postIds)
    .in('authUserId', [auth_user_id])
    .returns<{ authUserId: string; postId: number }[]>();

  // ! FETCH FOLLOW DATA
  const fetchFollowData = supabase
    .from('AppFollows')
    .select('follower, following')
    .in('following', userIds)
    .in('follower', [auth_user_id])
    .returns<{ follower: string; following: string }[]>();

  // ! FETCH COMMENTS
  const fetchCommentsData = supabase
    .rpc('get_all_comments_by_post_without_blocked_users_v3', {
      post_ids: postIds,
      current_user_id: auth_user_id,
    })
    .returns<Comment[]>();

  console.log(
    'fetchCommentsData:',
    'get_all_comments_by_post_without_blocked_users_v3',
    fetchCommentsData,
  );

  const isOfficialAccount =
    process.env.OFFICIAL_ACCOUNT_ID &&
    auth_user_id &&
    auth_user_id === process.env.OFFICIAL_ACCOUNT_ID;

  let fetchPinData;
  // ! FETCH PIN STATUS if user is official account
  if (isOfficialAccount) {
    fetchPinData = supabase
      .from('PinAppPost')
      .select('post_id')
      .in('post_id', postIds)
      .eq('is_active', true);
  } else {
    // Provide a default promise that resolves to empty data
    fetchPinData = Promise.resolve({ data: null, error: null });
  }

  // ! FETCH IMAGE GENERATIONS
  // const fetchGeneratinsData = Promise.resolve<{
  //   data: Generation[];
  //   error: any;
  // }>({
  //   data: [],
  //   error: null,
  // });
  const fetchGeneratinsData = new Promise(resolve => {
    const posts = postsData.map(post => ({
      id: post.id,
      media_type: post.media_type,
    }));
    const videoPosts = posts.filter(post => post.media_type === 'video');
    const imagePosts = posts.filter(post => post.media_type === 'image');
    const imageGenerations = supabase
      .from('app_posts_image_generations')
      .select(
        'post_id, ImageGeneration(id,prompt,model,tool,url_path,meta_data), hide_prompt',
      )
      .in(
        'post_id',
        imagePosts.map(post => post.id),
      );
    const videoGenerations = supabase
      .from('app_posts_video_generations')
      .select(
        'post_id, VideoGeneration(id,prompt,model,tool,video_url,meta_data),hide_prompt',
      )
      .in(
        'post_id',
        videoPosts.map(post => post.id),
      );
    resolve(Promise.all([imageGenerations, videoGenerations]));
  }).then(([imageGenerations, videoGenerations]: any) => {
    if (imageGenerations.error) {
      console.error(
        'Error fetching image generations:',
        imageGenerations.error,
      );
    }
    if (videoGenerations.error) {
      console.error(
        'Error fetching video generations:',
        videoGenerations.error,
      );
    }
    const data =
      imageGenerations?.data?.map(item => ({
        post_id: item.post_id,
        ...(item.ImageGeneration ?? {}),
        prompt: item.hide_prompt ? '' : item.ImageGeneration?.prompt,
      })) || [];
    const data2 =
      videoGenerations?.data?.map(item => ({
        post_id: item.post_id,
        ...(item.VideoGeneration ?? {}),
        url_path: item.VideoGeneration?.video_url,
        prompt: item.hide_prompt ? '' : item.VideoGeneration?.prompt,
      })) || [];
    const generationsData = [...data, ...data2];
    return { data: generationsData, error: null };
  });

  // Execute read-only requests concurrently first
  const [
    { data: usersData, error: usersError },
    { data: subscriptionsData },
    { data: votesData, error: votesError },
    { data: followsData, error: followsError },
    { data: commentsData, error: commentsError },
    { data: pinData },
    { data: generationsData, error: generationsError },
  ] = await Promise.all([
    fetchUserData,
    fetchSubscriptionData,
    fetchVotesData,
    fetchFollowData,
    fetchCommentsData,
    fetchPinData,
    fetchGeneratinsData,
  ]);

  // Execute write operations sequentially to avoid deadlocks
  // ! FETCH VOTES COUNT DATA (with retry logic)
  let votesCountData, votesCountError;
  let commentVotesCountData, commentVotesCountError;
  let rizzCountData, rizzError;

  try {
    // Execute vote count update first with timeout
    const votesPromise = supabase
      .rpc('count_votes_for_posts_v2', { post_ids: postIds })
      .returns<VoteCount[]>();

    const votesResult = (await Promise.race([
      votesPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC timeout')), 10000),
      ),
    ])) as any;

    votesCountData = votesResult.data;
    votesCountError = votesResult.error;
    // console.log('votesCountData:', votesCountData, postIds);

    // Update comment votes if we have comments data
    if (
      commentsData &&
      Array.isArray(commentsData) &&
      commentsData.length > 0
    ) {
      // Extract all comment IDs (including nested children)
      const extractCommentIds = (comments: Comment[]): number[] => {
        const ids: number[] = [];
        for (const comment of comments) {
          if (comment.id) {
            ids.push(comment.id);
          }
          if (comment.children && comment.children.length > 0) {
            ids.push(...extractCommentIds(comment.children));
          }
        }
        return ids;
      };

      const commentIds = extractCommentIds(commentsData);

      if (commentIds.length > 0) {
        const commentVotesPromise = supabase
          .rpc('count_and_update_votes_for_comments', {
            comment_ids: commentIds,
          })
          .returns<{ commentid: number; count: number }[]>();

        const commentVotesResult = (await Promise.race([
          commentVotesPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Comment votes RPC timeout')),
              10000,
            ),
          ),
        ])) as any;

        commentVotesCountData = commentVotesResult.data;
        commentVotesCountError = commentVotesResult.error;
      }
    }

    // Only update rizz if votes update succeeded and we have data
    if (!votesCountError && postIds.length > 0) {
      const rizzPromise = supabase
        .rpc('update_trending_score_new', { post_ids: postIds })
        .returns<RizzCount[]>();

      const rizzResult = (await Promise.race([
        rizzPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RPC timeout')), 10000),
        ),
      ])) as any;

      rizzCountData = rizzResult.data;
      rizzError = rizzResult.error;
    }
  } catch (error) {
    console.error('Error in sequential RPC execution:', error);

    // Enhanced fallback: try to get current vote counts without update
    if (!votesCountData) {
      try {
        const fallbackVotes = await supabase
          .from('AppVotes')
          .select('postId')
          .in('postId', postIds);

        if (fallbackVotes.data) {
          const voteCountMap = fallbackVotes.data.reduce(
            (acc, vote) => {
              acc[vote.postId] = (acc[vote.postId] || 0) + 1;
              return acc;
            },
            {} as { [key: number]: number },
          );

          votesCountData = Object.entries(voteCountMap).map(
            ([postid, count]) => ({
              postid: parseInt(postid),
              count,
            }),
          ) as VoteCount[];
        }
      } catch (fallbackError) {
        console.error('Fallback vote count failed:', fallbackError);
        // Use empty array as last resort
        votesCountData = [];
      }
    }

    // For rizz, use existing values from posts if RPC failed
    if (!rizzCountData) {
      rizzCountData = postsData.map(post => ({
        postid: post.id,
        rizz: post.rizz || 0,
      }));
    }
  }

  // Handle errors if any
  if (
    usersError ||
    votesError ||
    votesCountError ||
    commentVotesCountError ||
    rizzError ||
    commentsError ||
    followsError ||
    generationsError
  ) {
    console.error(
      'Error processing posts:',
      usersError ||
        votesError ||
        votesCountError ||
        rizzError ||
        commentsError ||
        followsError ||
        generationsError,
    );
    return [];
  }

  // ! MAP DATA TO RESPONSE
  // Map votes to posts
  const votesMap =
    votesData?.reduce<{ [key: number]: { [key: string]: boolean } }>(
      (acc, vote) => {
        if (!acc[vote.postId]) {
          acc[vote.postId] = {};
        }
        acc[vote.postId][vote.authUserId] = true;
        return acc;
      },
      {},
    ) || {};

  // Map vote count to posts
  const voteCountMap =
    votesCountData?.reduce(
      (acc: { [key: number]: number }, voteCount: VoteCount) => {
        // rpc 返回的数据全变成postId了，兼容一下
        acc[voteCount.postid || voteCount.postId] = voteCount.count;
        return acc;
      },
      {} as { [key: number]: number },
    ) || {};

  // Map follow to posts
  const followMap =
    followsData?.reduce<{ [key: string]: boolean }>((acc, follow) => {
      acc[follow.following] = true;
      return acc;
    }, {}) || {};

  // Map subscriptions to users
  const subscriptionsMap: { [key: string]: string } =
    subscriptionsData?.reduce<{ [key: string]: string }>(
      (acc: { [key: string]: string }, sub: any) => {
        acc[sub.user_id] = sub.plan;
        return acc;
      },
      {},
    ) || {};

  // Map user names to posts
  const usersMap: {
    [key: string]: {
      user_name: string;
      image: string;
      user_uniqid: string;
      plan: string;
    };
  } =
    usersData?.reduce<{
      [key: string]: {
        user_name: string;
        image: string;
        user_uniqid: string;
        plan: string;
      };
    }>((acc, user: User) => {
      const userPlan = user.is_cpp
        ? 'CPP'
        : subscriptionsMap[user.id] || 'Free';

      acc[user.id] = {
        user_name: user.user_name,
        image: user.image,
        user_uniqid: user.user_uniqid,
        plan: userPlan,
      };
      return acc;
    }, {}) || {};

  // MAP COMMENTS TO POSTS
  const commentsMap =
    (Array.isArray(commentsData) ? commentsData : [])?.reduce<{
      [key: number]: Comment[];
    }>((acc, comment) => {
      if (!acc[comment.postid]) {
        acc[comment.postid] = [];
      }
      // Use the id directly from the stored procedure
      acc[comment.postid].push(comment);
      return acc;
    }, {}) || {};

  // MAP GENERATIONS TO POSTS
  const generationsMap =
    (Array.isArray(generationsData) ? generationsData : [])?.reduce<{
      [key: number]: Generation[];
    }>((acc, generation) => {
      if (!acc[generation.post_id]) {
        acc[generation.post_id] = [];
      }
      acc[generation.post_id].push(generation);
      return acc;
    }, {}) || {};

  // MAP PIN STATUS TO POSTS
  let pinMap;
  if (isOfficialAccount) {
    pinMap =
      pinData?.reduce(
        (acc, pin) => {
          acc[pin.post_id] = true;
          return acc;
        },
        {} as { [key: number]: boolean },
      ) || {};
  }
  // console.log('voteCountMap:', voteCountMap);
  return postsData.map(post => ({
    ...post,
    user_name: usersMap[post.authUserId]?.user_name || '',
    image: usersMap[post.authUserId]?.image || null,
    user_uniqid: usersMap[post.authUserId]?.user_uniqid || '',
    user_plan: usersMap[post.authUserId]?.plan || 'Free',
    post_tags:
      post?.post_tags
        ?.map(tag => {
          if (!tag?.tags) {
            return null;
          }
          const charInfo = characterInfoMap[tag.tags.name];
          // Priority: DB logo_url > CustomCharacters.character_pfp (fallback)
          return {
            ...tag.tags,
            logo_url: tag.tags.logo_url || charInfo?.logo_url || null,
            display_name: charInfo?.display_name || null,
          };
        })
        .filter(Boolean) || [],
    liked: !!votesMap[post.id]?.[auth_user_id],
    followed: followMap[post.authUserId] || false,
    votes: voteCountMap[post.id] || 0,
    comments: commentsMap[post.id] || [],
    generations: generationsMap[post.id] || [],
    isPinned: isOfficialAccount && pinMap ? !!pinMap[post.id] : false,
    post_pinned: post?.PinAppPost?.length > 0,
    oc_id:
      post?.oc_id ||
      post?.custom_characters_image_generations?.[0]?.character_uniqid ||
      null,
  }));
}

// Helper function to build query for free/paid posts
async function buildPostQuery(
  isFree: boolean,
  params: QueryParams,
  allowNSFW: boolean = false,
  mode: Mode | null = null,
): Promise<{ data: any; error: any }> {
  const viewName = isFree ? 'free_app_posts_view' : 'paid_app_posts_view';
  const selectFields =
    'id, uniqid, authUserId, created_at, views, rizz, title, content, media, votes, tags, media_type, translation, oc_id, post_tags(tags(id,name,logo_url,i18n)),PinAppPost(post_id)';

  let query = supabase.from(viewName).select(selectFields);

  const isOwnProfileRequest =
    params.useronly === 'True' && !!params.auth_user_id;

  // Content filtering logic based on mode parameter
  // Skip NSFW filtering when accessing a specific post directly (postonly)
  if (params.postonly !== 'None') {
    // When accessing a specific post via direct link, don't apply NSFW filtering
    // The post should be accessible regardless of mode
  } else if (mode === Mode.NSFW) {
    // NSFW only mode: only query NSFW posts
    query = query.eq('is_private', true);
  } else if (mode === Mode.SFW) {
    // SFW only mode: only query SFW posts
    query = query.eq('is_private', false);
  } else if (!isOwnProfileRequest) {
    // Default behavior: profile/main feeds are SFW-only unless explicitly in NSFW mode.
    // Exception: the authenticated user's own profile should include both SFW+NSFW.
    query = query.eq('is_private', false);
  } else {
    // Own profile request: include both SFW+NSFW (no is_private filter).
  }

  // Apply sorting
  if (params.sortby === 'Trending') {
    query = query
      .order('rizz', { ascending: false })
      .order('created_at', { ascending: false });
  } else if (params.sortby === 'Most Likes') {
    query = query
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    // Default: Newest
    query = query.order('created_at', { ascending: false });
  }

  // Apply filters
  if (params.mainfeedonly !== 'None') {
    query = query.not('hide_main_feed', 'is', true);
  }

  if (params.useronly !== 'None') {
    if (params.useronly === 'True') {
      query = query.eq('authUserId', params.auth_user_id);
    } else {
      const { data: queryUserId, error: queryUserError } = await supabase
        .from('User')
        .select('id')
        .eq('user_uniqid', params.useronly)
        .single();

      if (queryUserError) {
        return { data: null, error: queryUserError };
      }
      query = query.eq('authUserId', queryUserId.id);
    }
  }
  console.log(
    'params.useronly, params.postonly',
    params.useronly,
    params.postonly,
  );
  if (params.useronly !== 'True' && params.postonly === 'None') {
    query = query.not('banned', 'is', true);
  }

  if (params.postonly !== 'None') {
    query = query.eq('uniqid', params.postonly);
  }

  if (params.tagsonly !== 'None') {
    const tags = params.tagsonly.split(',');
    query = query.overlaps('tags', tags);
  }

  if (params.mediaType === 'video' || params.mediaType === 'image') {
    query = query.eq('media_type', params.mediaType);
  }

  // Apply following filter
  if (params.sortby === 'Following') {
    // Sanitize IDs before building query to prevent injection
    const sanitizedFollowingIds = params.followingUserIds.filter(
      id => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id),
    );
    const sanitizedPostIds = params.collectedOCPostIds.filter(
      id => typeof id === 'number' && Number.isInteger(id) && id > 0,
    );

    // Build OR condition: posts from following users OR posts containing collected OC tags
    const hasFollowing = sanitizedFollowingIds.length > 0;
    const hasOCPosts = sanitizedPostIds.length > 0;

    if (hasFollowing && hasOCPosts) {
      // Both conditions: use .or() to combine them
      // Filter by authUserId for following users OR by post id for OC posts
      const orCondition = `authUserId.in.(${sanitizedFollowingIds.join(',')}),id.in.(${sanitizedPostIds.join(',')})`;
      query = query.or(orCondition);
    } else if (hasFollowing) {
      // Only following users
      query = query.in('authUserId', sanitizedFollowingIds);
    } else if (hasOCPosts) {
      // Only posts with collected OC tags
      query = query.in('id', sanitizedPostIds);
    }
    // If neither, the request would have returned empty earlier
  }

  // Apply pagination
  // if (params.postonly === 'None' && params.useronly !== 'True') {
  //   query = query.not('is_private', 'is', true);
  // }
  query.range(params.offset, params.offset + params.limit - 1);

  return query.returns<Post[]>();
}

// Helper function to build tag query for free/paid posts
async function buildTagQuery({
  isFree,
  tag,
  params,
  allowNSFW = false,
  mode = null,
}: {
  isFree: boolean;
  tag: number;
  params: QueryParams;
  allowNSFW?: boolean;
  mode?: Mode | null;
}): Promise<{ data: any; error: any }> {
  const viewName = isFree ? 'free_post_ids_by_tag' : 'paid_post_ids_by_tag';

  let query = supabase
    .from(viewName)
    .select(
      'id, rizz, created_at, votes, "authUserId", hide_main_feed, is_private, is_hidden, media_type, PinAppPost(post_id)',
    )
    .not('banned', 'is', true)
    .eq('tag_id', tag)
    // Filter out posts hidden for this tag
    .not('is_hidden', 'is', true);

  // Apply sorting
  if (params.sortby === 'Trending') {
    query = query
      .order('rizz', { ascending: false })
      .order('created_at', { ascending: false });
  } else if (params.sortby === 'Most Likes') {
    query = query
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false });
  } else if (params.sortby === 'Following') {
    // Sanitize IDs before building query to prevent injection
    const sanitizedFollowingIds = params.followingUserIds.filter(
      id => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id),
    );
    const sanitizedPostIds = params.collectedOCPostIds.filter(
      id => typeof id === 'number' && Number.isInteger(id) && id > 0,
    );

    // Build OR condition: posts from following users OR posts containing collected OC tags
    // This keeps consistency with buildPostQuery
    const hasFollowing = sanitizedFollowingIds.length > 0;
    const hasOCPosts = sanitizedPostIds.length > 0;

    if (hasFollowing && hasOCPosts) {
      // Both conditions: use .or() to combine them
      const orCondition = `"authUserId".in.(${sanitizedFollowingIds.join(',')}),id.in.(${sanitizedPostIds.join(',')})`;
      query = query.or(orCondition);
    } else if (hasFollowing) {
      query = query.in('"authUserId"', sanitizedFollowingIds);
    } else if (hasOCPosts) {
      query = query.in('id', sanitizedPostIds);
    }

    query = query.order('created_at', { ascending: false });
  } else {
    // Default: Newest
    query = query.order('created_at', { ascending: false });
  }

  // Apply filters
  if (params.mainfeedonly !== 'None') {
    query = query.not('hide_main_feed', 'is', true);
  }

  if (params.useronly !== 'None') {
    if (params.useronly === 'True') {
      query = query.eq('"authUserId"', params.auth_user_id);
    } else {
      const { data: queryUserId, error: queryUserError } = await supabase
        .from('User')
        .select('id')
        .eq('user_uniqid', params.useronly)
        .single();

      if (queryUserError) {
        return { data: null, error: queryUserError };
      }
      query = query.eq('"authUserId"', queryUserId.id);
    }
  }

  // Content filtering logic based on mode parameter
  const isOwnProfileRequest =
    params.useronly === 'True' && !!params.auth_user_id;
  if (mode === Mode.NSFW) {
    // NSFW only mode: only query NSFW posts
    query = query.eq('is_private', true);
  } else if (mode === Mode.SFW) {
    // SFW only mode: only query SFW posts
    query = query.eq('is_private', false);
  } else if (!isOwnProfileRequest) {
    // Default behavior: tag feeds are SFW-only unless explicitly in NSFW mode.
    // Exception: the authenticated user's own profile should include both SFW+NSFW.
    query = query.eq('is_private', false);
  } else {
    // Own profile request: include both SFW+NSFW (no is_private filter).
  }

  // Media type filtering
  if (params.mediaType === 'video' || params.mediaType === 'image') {
    query = query.eq('media_type', params.mediaType);
  }

  query = query.range(params.offset, params.offset + params.limit - 1);

  const result = await query;
  return result;
}

export async function GET(request: Request) {
  const startTime = Date.now();

  // Rate limiting check
  const clientIP = getClientIP(request);
  const clientIPForRateLimit = clientIP || 'unknown';
  if (isRateLimited(clientIPForRateLimit)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 检查是否为中国的IP地址
  const isChina = isChinaIP(clientIP);

  // ! FETCH AUTHID
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];
  let auth_user_id = '' as string;
  if (!sessionToken) {
    auth_user_id = '' as string;
  } else {
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token) {
        auth_user_id = '' as string;
      } else {
        auth_user_id = token.id as string;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      auth_user_id = '' as string;
    }
  }

  const refCode = cookies['ref'];
  if (refCode) {
    console.log('found ref code:', refCode);
    updateRefCode(auth_user_id, refCode);
  }

  console.log('fetching feed:', auth_user_id);

  // 获取双向屏蔽用户列表（用于过滤 Feed）
  let blockedUserIds: string[] = [];
  // 获取用户举报的帖子 ID 列表（用于对举报者隐藏）
  let reportedPostIds: number[] = [];
  if (auth_user_id) {
    try {
      const [blockedResult, reportedResult] = await Promise.all([
        supabase.rpc('get_blocked_users', {
          input_user_id: auth_user_id,
        }),
        supabase
          .from('post_reports')
          .select('post_id')
          .eq('reporter_user_id', auth_user_id),
      ]);

      blockedUserIds =
        blockedResult.data?.map((u: { user_id: string }) => u.user_id) || [];
      reportedPostIds =
        reportedResult.data?.map((r: { post_id: number }) => r.post_id) || [];
    } catch (error) {
      console.error('Error fetching blocked users / reported posts:', error);
    }
  }

  // ! PAGINATION
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const sortby = url.searchParams.get('sortby') || 'Newest';
  const useronly = url.searchParams.get('useronly') || 'None';
  const postonly = url.searchParams.get('postonly') || 'None';
  const mainfeedonly = url.searchParams.get('mainfeedonly') || 'None';
  const tagsonly = url.searchParams.get('tagsonly') || 'None';
  const mediaType = url.searchParams.get('mediaType') || 'None';
  const tagParam = url.searchParams.get('tag') || '';
  let tag = tagParam ? parseInt(tagParam) : null;
  // All Posts tag (id: 57360) 特殊处理，显示所有的post
  if (tag === 57360) {
    tag = null;
  }

  const allowNSFW = cookies['relax_content'] === 'true';
  const isOwnProfileRequest = useronly === 'True' && !!auth_user_id;

  // Parse content filter mode from URL params
  const modeParam = url.searchParams.get('mode');
  const mode: Mode | null =
    modeParam === Mode.NSFW
      ? Mode.NSFW
      : modeParam === Mode.SFW
        ? Mode.SFW
        : null;

  const tagData = tag
    ? await getTagDetail(supabase, tag)
    : { id: tag, name: '', is_nsfw: false };

  // Calculate offsets for free and paid posts
  const freeOffset = (page - 1) * FeedPageSize.FREE;
  const paidOffset = (page - 1) * FeedPageSize.PAID;

  // Create cache key for this request (exclude auth_user_id for public feeds)
  // 注意：isChina会影响返回结果（是否过滤NSFW），所以需要包含在cache key中
  const cacheParams = {
    page,
    sortby,
    useronly,
    postonly,
    mainfeedonly,
    tagsonly,
    mediaType,
    tag,
    isChina, // 包含isChina以确保中国用户和非中国用户的缓存分开
    mode, // 包含mode以确保不同内容模式的缓存分开
    // Only include auth_user_id in cache key if it affects the result
    ...(useronly === 'True' || sortby === 'following' ? { auth_user_id } : {}),
  };
  const cacheKey = getCacheKey(cacheParams);

  // Check cache for public feeds (not user-specific data)
  if (
    useronly === 'None' &&
    postonly === 'None' &&
    sortby !== 'Following' &&
    !auth_user_id
  ) {
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log('Returning cached result');
      return new Response(JSON.stringify(cachedResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle following filter - get following users first
  let followingUserIds: string[] = [];
  let collectedOCPostIds: number[] = [];
  if (sortby === 'Following') {
    if (!auth_user_id) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch both following users and collected OCs in parallel
    const [followingResult, collectedOCResult] = await Promise.all([
      supabase
        .from('AppFollows')
        .select('following')
        .eq('follower', auth_user_id),
      supabase
        .from('CollectedCharacters')
        .select('character_uniqid')
        .eq('user_id', auth_user_id)
        .eq('is_active', true),
    ]);

    const { data: followingData, error: followingError } = followingResult;
    const { data: collectedOCData, error: collectedOCError } =
      collectedOCResult;

    if (followingError) {
      console.error('Error fetching following data:', followingError);
      return new Response(JSON.stringify({ error: followingError.message }), {
        status: 500,
      });
    }

    if (collectedOCError) {
      console.error('Error fetching collected OCs:', collectedOCError);
      // Don't fail the request if OC fetch fails, just log the error
    }

    // Get following user IDs
    followingUserIds = followingData?.map(follow => follow.following) || [];

    // Get collected OC tags (support multiple tag formats for matching in tags table)
    // Limit to MAX_OC_TAGS to prevent performance issues with large collections
    if (collectedOCData && collectedOCData.length > 0) {
      const limitedOCData = collectedOCData.slice(0, MAX_OC_TAGS);
      const collectedOCTags = limitedOCData.flatMap(oc => [
        `@${oc.character_uniqid}`, // Simple format: @character-id
        `<${oc.character_uniqid}>`, // Legacy format: <character-id>
      ]);

      // Fetch post IDs that have these OC tags
      // Step 1: Get tag IDs for the OC tags from the tags table
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', collectedOCTags);

      if (tagError) {
        console.error('Error fetching tag IDs:', tagError);
      }

      if (tagData && tagData.length > 0) {
        const tagIds = tagData.map(t => t.id);

        // Step 2: Get post IDs that have these tags from post_tags table
        const { data: postTagData, error: postTagError } = await supabase
          .from('post_tags')
          .select('post_id')
          .in('tag_id', tagIds);

        if (postTagError) {
          console.error(
            'Error fetching post IDs from post_tags:',
            postTagError,
          );
        }

        if (postTagData && postTagData.length > 0) {
          // Get unique post IDs
          collectedOCPostIds = Array.from(
            new Set(postTagData.map(pt => pt.post_id)),
          );
        }
      }
    }

    // If user has no following and no collected OC posts, return empty
    if (followingUserIds.length === 0 && collectedOCPostIds.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  let freePosts: Post[] = [];
  let paidPosts: Post[] = [];
  let mixedPosts: Post[] = [];

  if (tag) {
    let effectiveMediaType = mediaType;
    if (!mediaType || mediaType === 'None') {
      const { data: tagSettings } = await supabase
        .from('tags')
        .select('allow_media_types')
        .eq('id', tag)
        .single();

      if (
        tagSettings?.allow_media_types &&
        tagSettings.allow_media_types !== 'all'
      ) {
        effectiveMediaType = tagSettings.allow_media_types;
      }
    }

    // Query posts by tag using separate views
    const queryParams: QueryParams = {
      sortby,
      useronly,
      postonly,
      mainfeedonly,
      tagsonly,
      mediaType: effectiveMediaType,
      auth_user_id,
      followingUserIds,
      collectedOCPostIds,
      offset: 0,
      limit: 0,
    };

    // Determine if NSFW content should be shown based on user preference
    // User must have relax_content cookie set to view NSFW content
    const shouldShowNsfw = allowNSFW;

    let freePostIds: number[] = [];
    let paidPostIds: number[] = [];

    const [freeTagResult, paidTagResult] = await Promise.all([
      buildTagQuery({
        isFree: true,
        tag,
        params: {
          ...queryParams,
          offset: freeOffset,
          limit: FeedPageSize.FREE,
        },
        allowNSFW: shouldShowNsfw,
        mode,
      }),
      buildTagQuery({
        isFree: false,
        tag,
        params: {
          ...queryParams,
          offset: paidOffset,
          limit: FeedPageSize.PAID,
        },
        allowNSFW: shouldShowNsfw,
        mode,
      }),
    ]);

    if (freeTagResult.error) {
      console.error('Error fetching free posts with tag:', freeTagResult.error);
      return new Response(
        JSON.stringify({ error: freeTagResult.error.message }),
        {
          status: 500,
        },
      );
    }

    if (paidTagResult.error) {
      console.error('Error fetching paid posts with tag:', paidTagResult.error);
      return new Response(
        JSON.stringify({ error: paidTagResult.error.message }),
        {
          status: 500,
        },
      );
    }

    freePostIds = freeTagResult.data?.map((item: any) => item.id) || [];
    paidPostIds = paidTagResult.data?.map((item: any) => item.id) || [];

    // Fetch full post data for free posts
    if (freePostIds.length > 0) {
      const { data: freePostsData, error: freePostsError } = await supabase
        .from('AppPosts')
        .select(
          'id, uniqid, authUserId, created_at, views, rizz, title, content, media, votes, tags, media_type, translation, post_tags(tags(id,name,logo_url,i18n))',
        )
        .in('id', freePostIds)
        .order('created_at', { ascending: false })
        .returns<Post[]>();

      if (freePostsError) {
        console.error('Error fetching free posts data:', freePostsError);
      } else {
        freePosts = freePostsData || [];
      }
    }

    // Fetch full post data for paid posts
    if (paidPostIds.length > 0) {
      const { data: paidPostsData, error: paidPostsError } = await supabase
        .from('AppPosts')
        .select(
          'id, uniqid, authUserId, created_at, views, rizz, title, content, media, votes, tags, media_type, translation, post_tags(tags(id,name,logo_url,i18n))',
        )
        .in('id', paidPostIds)
        .order('created_at', { ascending: false })
        .returns<Post[]>();

      if (paidPostsError) {
        console.error('Error fetching paid posts data:', paidPostsError);
      } else {
        paidPosts = paidPostsData || [];
      }
    }
    // console.log('freePosts', freePostIds);
    // console.log('paidPosts', paidPostIds);
  } else {
    // Query posts directly from views
    const queryParams: QueryParams = {
      sortby,
      useronly,
      postonly,
      mainfeedonly,
      tagsonly,
      mediaType,
      auth_user_id,
      followingUserIds,
      collectedOCPostIds,
      offset: 0,
      limit: 0,
    };

    const [freeResult, paidResult] = await Promise.all([
      buildPostQuery(
        true,
        {
          ...queryParams,
          offset: freeOffset,
          limit: FeedPageSize.FREE,
        },
        allowNSFW,
        mode,
      ),
      buildPostQuery(
        false,
        {
          ...queryParams,
          offset: paidOffset,
          limit: FeedPageSize.PAID,
        },
        allowNSFW,
        mode,
      ),
    ]);

    if (freeResult.error) {
      console.error('Error fetching free posts:', freeResult.error);
      return new Response(JSON.stringify({ error: freeResult.error.message }), {
        status: 500,
      });
    }

    if (paidResult.error) {
      console.error('Error fetching paid posts:', paidResult.error);
      return new Response(JSON.stringify({ error: paidResult.error.message }), {
        status: 500,
      });
    }

    freePosts = freeResult.data || [];
    paidPosts = paidResult.data || [];
  }

  if (
    freePosts.length === 0 &&
    paidPosts.length === 0 &&
    mixedPosts.length === 0
  ) {
    console.warn('No data found in posts.');
    const totalTime = Date.now() - startTime;
    console.log(`Query performance: ${totalTime}ms (total)`);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Mix posts with 4:1 ratio (free:paid)
  if (freePosts.length > 0 || paidPosts.length > 0) {
    mixedPosts = mixPosts(freePosts, paidPosts);
  }

  // Process posts using the shared function
  const processStartTime = Date.now();
  const responseData = await postProcessPosts(mixedPosts, auth_user_id);
  const processTime = Date.now() - processStartTime;

  // 过滤掉NSFW内容（标签id为2）- 根据用户权限和内容模式
  // Skip filtering when accessing a specific post directly (postonly)
  let filteredData = responseData;
  if (postonly !== 'None') {
    // When accessing a specific post via direct link, don't apply NSFW filtering
    // The post should be accessible regardless of mode
  } else if (isOwnProfileRequest) {
    // Own profile should always show all of the user's posts (SFW+NSFW),
    // regardless of relax_content cookie or region-based filtering.
  } else if (allowNSFW && mode === Mode.NSFW) {
    // NSFW only mode: only keep posts with NSFW tag
    filteredData = responseData.filter(post =>
      post.post_tags?.some((tag: any) => tag.id === 2),
    );
  } else if (isChina || !allowNSFW || mode === Mode.SFW) {
    // SFW mode: filter out posts with NSFW tag
    filteredData = responseData.filter(
      post =>
        !post.post_tags || !post.post_tags.some((tag: any) => tag.id === 2),
    );
  }
  // else: mixed mode (existing behavior when allowNSFW=true and no mode)

  // 过滤被屏蔽用户的帖子（仅在非个人主页、非特定帖子场景下应用）
  if (blockedUserIds.length > 0 && useronly === 'None' && postonly === 'None') {
    const blockedSet = new Set(blockedUserIds);
    filteredData = filteredData.filter(
      (post: any) => !blockedSet.has(post.authUserId),
    );
  }

  // 过滤举报者已举报的帖子（仅对举报者自己隐藏，不影响其他用户）
  if (
    reportedPostIds.length > 0 &&
    useronly === 'None' &&
    postonly === 'None'
  ) {
    const reportedSet = new Set(reportedPostIds);
    filteredData = filteredData.filter(
      (post: any) => !reportedSet.has(post.id),
    );
  }

  const totalTime = Date.now() - startTime;
  console.log(
    `Query performance: ${processTime}ms (process), ${totalTime}ms (total), ${mixedPosts.length} posts (${freePosts.length} free, ${paidPosts.length} paid), isChina: ${isChina}, filtered: ${responseData.length} -> ${filteredData.length}`,
  );

  // Cache the result
  setCache(cacheKey, filteredData);

  return new Response(JSON.stringify(filteredData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
