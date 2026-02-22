import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { FeedPageSize } from './_constants.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/fetchLikedFeed?page=1
 * Fetches posts that the authenticated user has liked
 */
export const GET = async (req: Request) => {
  try {
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    // 使用与主 Feed 相同的每页数量：FREE + PAID
    const pageSize = FeedPageSize.FREE + FeedPageSize.PAID;

    // Get authenticated user ID
    let auth_user_id: string | null = null;
    try {
      const cookies = parse(req.headers.get('cookie') || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (sessionToken) {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        auth_user_id = token?.id as string;
      }
    } catch (e) {
      console.error('[API /fetchLikedFeed] Error decoding token:', e);
    }

    if (!auth_user_id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    const { data: votes, error: votesError } = await supabase
      .from('AppVotes')
      .select('postId')
      .eq('authUserId', auth_user_id)
      .gt('value', 0)
      .not('postId', 'is', null) 
      .order('id', { ascending: false })
      .range(startIndex, endIndex);

    if (votesError) {
      console.error('[API /fetchLikedFeed] Error fetching votes:', votesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch liked posts' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!votes || votes.length === 0) {
      return new Response(JSON.stringify({ posts: [], hasMore: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const likedPostIds = votes.map((v: any) => v.postId);

    // Step 2: Fetch the actual posts for these IDs
    const { data: posts, error: postsError } = await supabase
      .from('AppPosts')
      .select('*, User!inner(user_name, image, user_uniqid)')
      .in('id', likedPostIds)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('[API /fetchLikedFeed] Error fetching posts:', postsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform posts to include user info and liked flag
    const transformedPosts = (posts || []).map((post: any) => {
      const result = { ...post };
      if (post.User) {
        result.user_name = post.User.user_name;
        result.user_image = post.User.image;
        result.user_uniqid = post.User.user_uniqid;
      }
      // All posts in this feed are liked by definition
      result.liked = true;
      return result;
    });

    const hasMore = votes.length === pageSize;

    return new Response(
      JSON.stringify({
        posts: transformedPosts,
        hasMore,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[API /fetchLikedFeed] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

