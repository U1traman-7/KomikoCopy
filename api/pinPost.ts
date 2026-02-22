import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type MediaType = 'image' | 'video' | 'text';

// Define the types for the post and user data
interface Post {
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
    tags: { id: number; name: string; i18n?: Record<string, any> | null };
  }[];
}

interface Comment {
  id?: number;
  postid: number;
  content: string;
  votes: number;
  user_name: string;
  user_uniqid?: string;
  image: string;
  created_at: string;
  children?: Comment[];
}

interface User {
  id: string;
  user_name: string;
  image: string;
  user_uniqid: string;
  is_cpp?: boolean;
  plan?: string;
}

interface VoteCount {
  postid: number;
  count: number;
}

interface RizzCount {
  postid: number;
  rizz: number;
}

// Import the post processing function from fetchFeed
async function postProcessPosts(
  postsData: any[],
  auth_user_id: string,
  knownPinnedPosts?: Set<number>,
): Promise<any[]> {
  if (!postsData || postsData.length === 0) {
    return [];
  }

  // ! FETCH USER DATA (always needed)
  const userIds = postsData.map(post => post.authUserId);
  const fetchUserData = supabase
    .from('User')
    .select('id, user_name, image, user_uniqid, is_cpp')
    .in('id', userIds);

  // ! FETCH USER SUBSCRIPTION DATA
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
    .in('authUserId', [auth_user_id]);

  // ! FETCH FOLLOW DATA
  const fetchFollowData = supabase
    .from('AppFollows')
    .select('follower, following')
    .in('following', userIds)
    .in('follower', [auth_user_id]);

  // ! FETCH COMMENTS
  const fetchCommentsData = supabase.rpc(
    'get_all_comments_by_post_without_blocked_users_v3',
    {
      post_ids: postIds,
      current_user_id: auth_user_id,
    },
  );

  // ! FETCH PIN STATUS - 只有在不知道置顶状态时才查询
  const fetchPinData = knownPinnedPosts
    ? Promise.resolve({ data: [], error: null })
    : supabase
        .from('PinAppPost')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_active', true);

  // Execute read-only requests concurrently first
  const [
    { data: usersData, error: usersError },
    { data: subscriptionsData, error: subscriptionsError },
    { data: votesData, error: votesError },
    { data: followsData, error: followsError },
    { data: commentsData, error: commentsError },
    { data: pinData, error: pinError },
  ] = await Promise.all([
    fetchUserData,
    fetchSubscriptionData,
    fetchVotesData,
    fetchFollowData,
    fetchCommentsData,
    fetchPinData,
  ]);

  // Execute write operations sequentially to avoid deadlocks
  let votesCountData, votesCountError;
  let commentVotesCountData, commentVotesCountError;
  let rizzCountData, rizzError;

  try {
    // Add jitter to reduce thundering herd effect
    const jitter = Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, jitter));

    // Execute vote count update first with timeout
    const votesPromise = supabase.rpc('count_votes_for_posts_v2', {
      post_ids: postIds,
    });

    const votesResult = (await Promise.race([
      votesPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC timeout')), 10000),
      ),
    ])) as any;

    votesCountData = votesResult.data;
    votesCountError = votesResult.error;

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
        // Add small delay to reduce lock contention
        await new Promise(resolve =>
          setTimeout(resolve, 25 + Math.random() * 25),
        );

        const commentVotesPromise = supabase
          .rpc('count_and_update_votes_for_comments', {
            comment_ids: commentIds,
          })
          .returns<{ commentid: number; count: number }[]>();

        const commentVotesResult = await Promise.race([
          commentVotesPromise,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Comment votes RPC timeout')),
              10000,
            ),
          ),
        ]);

        commentVotesCountData = commentVotesResult.data;
        commentVotesCountError = commentVotesResult.error;
      }
    }

    // Only update rizz if votes update succeeded and we have data
    if (!votesCountError && postIds.length > 0) {
      // Add another small delay to reduce lock contention
      await new Promise(resolve =>
        setTimeout(resolve, 50 + Math.random() * 50),
      );

      const rizzPromise = supabase.rpc('update_trending_score', {
        post_ids: postIds,
      });

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
          );
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
    pinError
  ) {
    console.error(
      'Error processing posts:',
      usersError ||
        votesError ||
        votesCountError ||
        rizzError ||
        commentsError ||
        followsError ||
        pinError,
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
      (acc: { [key: number]: number }, voteCount: any) => {
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
    }>((acc, user: any) => {
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
      [key: number]: any[];
    }>((acc, comment) => {
      if (!acc[comment.postid]) {
        acc[comment.postid] = [];
      }
      acc[comment.postid].push(comment);
      return acc;
    }, {}) || {};

  // MAP PIN STATUS TO POSTS
  const pinMap = knownPinnedPosts
    ? Array.from(knownPinnedPosts).reduce<{ [key: number]: boolean }>(
        (acc, postId) => {
          acc[postId] = true;
          return acc;
        },
        {},
      )
    : pinData?.reduce<{ [key: number]: boolean }>((acc, pin) => {
        acc[pin.post_id] = true;
        return acc;
      }, {}) || {};

  return postsData.map(post => ({
    ...post,
    user_name: usersMap[post.authUserId]?.user_name || '',
    image: usersMap[post.authUserId]?.image || null,
    user_uniqid: usersMap[post.authUserId]?.user_uniqid || '',
    user_plan: usersMap[post.authUserId]?.plan || 'Free',
    post_tags: post?.post_tags?.map((tag: any) => tag.tags) || [],
    liked: !!votesMap[post.id]?.[auth_user_id],
    followed: followMap[post.authUserId] || false,
    votes: voteCountMap[post.id] || 0,
    comments: commentsMap[post.id] || [],
    generations: [], // Empty for now, as in fetchFeed
    isPinned: !!pinMap[post.id],
    translation: post.translation || {},
  }));
}

// const OFFICIAL_ACCOUNT_ID = 'fcf52fda-bcd0-48ed-b89b-51b47731f280';
const OFFICIAL_ACCOUNT_ID = process.env.OFFICIAL_ACCOUNT_ID || '';

export async function POST(request: Request) {
  try {
    const { action, postId } = await request.json();

    // Parse cookies from the request headers
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token || !token.id) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = token.id as string;
    console.log(userId, 'userId');
    console.log(OFFICIAL_ACCOUNT_ID, 'OFFICIAL_ACCOUNT_ID');

    // Check if user is the official account
    //  using test_account_id for testing
    if (userId !== OFFICIAL_ACCOUNT_ID) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Only official account can pin posts',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!postId || !action) {
      return new Response(
        JSON.stringify({ error: 'postId and action are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Verify the post exists
    const { data: postExists, error: postError } = await supabase
      .from('AppPosts')
      .select('id, authUserId')
      .eq('id', postId)
      .single();

    if (postError || !postExists) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'pin') {
      // Check if post is already pinned
      const { data: existingPin } = await supabase
        .from('PinAppPost')
        .select('id')
        .eq('post_id', postId)
        .eq('is_active', true)
        .single();

      if (existingPin) {
        return new Response(
          JSON.stringify({ error: 'Post is already pinned' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Pin the post
      const { data, error } = await supabase
        .from('PinAppPost')
        .insert([
          {
            post_id: postId,
            pinned_by: userId,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error pinning post:', error);
        return new Response(JSON.stringify({ error: 'Failed to pin post' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ message: 'Post pinned successfully', data }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    if (action === 'unpin') {
      // Unpin the post by setting is_active to false
      const { data, error } = await supabase
        .from('PinAppPost')
        .update({ is_active: false })
        .eq('post_id', postId)
        .eq('is_active', true)
        .select()
        .single();

      if (error) {
        console.error('Error unpinning post:', error);
        return new Response(JSON.stringify({ error: 'Failed to unpin post' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Post is not currently pinned' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(
        JSON.stringify({ message: 'Post unpinned successfully', data }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "pin" or "unpin"' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Pin/unpin error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET method to get pinned posts or check if a specific post is pinned
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const action = url.searchParams.get('action') || 'check'; // 'check' or 'list'

    // Parse cookies from the request headers for authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    let auth_user_id = '' as string;

    if (sessionToken) {
      try {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        if (token && token.id) {
          auth_user_id = token.id as string;
        }
      } catch (error) {
        console.error('Error decoding session token:', error);
        auth_user_id = '' as string;
      }
    }

    if (action === 'list') {
      // Get all pinned posts
      const { data: pinnedData, error: pinnedError } = await supabase
        .from('PinAppPost')
        .select(
          `
          post_id,
          pinned_at,
          pinned_by,
          AppPosts!inner (
            id, uniqid, authUserId, created_at, views, rizz, title, content, media, votes, tags, media_type, translation, post_tags(tags(id,name,i18n))
          )
        `,
        )
        .eq('is_active', true)
        .order('pinned_at', { ascending: false });

      if (pinnedError) {
        console.error('Error fetching pinned posts:', pinnedError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch pinned posts' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (!pinnedData || pinnedData.length === 0) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Transform the data to match the Post interface and prepare for postProcessPosts
      const rawPosts = pinnedData.map((pin: any) => ({
        ...pin.AppPosts,
        isPinned: true,
        pinned_at: pin.pinned_at,
        pinned_by: pin.pinned_by,
      }));

      // 创建已知置顶帖子的ID集合
      const knownPinnedPosts = new Set(rawPosts.map(post => post.id));

      // Process posts using the same logic as fetchFeed
      const processedPosts = await postProcessPosts(
        rawPosts,
        auth_user_id,
        knownPinnedPosts,
      );

      return new Response(JSON.stringify(processedPosts), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if a specific post is pinned
    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'postId is required for check action' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { data, error } = await supabase
      .from('PinAppPost')
      .select('id, pinned_at, pinned_by')
      .eq('post_id', postId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking pin status:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to check pin status' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        isPinned: !!data,
        pinData: data || null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Check pin status error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
