import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/**
 * GET /api/character/adopters
 * Get users who have collected/adopted a character
 * Query params:
 * - character_uniqid: The unique ID of the character
 * - limit: Number of adopters to return (default: 20)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const characterUniqid = url.searchParams.get('character_uniqid');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!characterUniqid) {
      return new Response(
        JSON.stringify({ error: 'character_uniqid is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get current user ID (optional, for checking if current user is in the list)
    let currentUserId: string | null = null;
    try {
      const cookies = parse(request.headers.get('cookie') || '');
      const sessionToken =
        cookies['next-auth.session-token'] ||
        cookies['__Secure-next-auth.session-token'];

      if (sessionToken) {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        currentUserId = token?.id as string;
      }
    } catch (e) {
      // User not authenticated, continue without user ID
    }

    // Get adopters (users who collected this character)
    const {
      data: adopters,
      error,
      count,
    } = await supabase
      .from('CollectedCharacters')
      .select(
        `
        user_id,
        User!fk_collector (
          user_uniqid,
          user_name,
          image
        )
      `,
        { count: 'exact' },
      )
      .eq('character_uniqid', characterUniqid)
      .eq('is_active', true)
      .order('collected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching character adopters:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch adopters' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get following status for current user
    let followingSet = new Set<string>();
    if (currentUserId && adopters && adopters.length > 0) {
      const adopterIds = adopters.map((a: any) => a.user_id);
      const { data: followingData } = await supabase
        .from('AppFollows')
        .select('following')
        .eq('follower', currentUserId)
        .in('following', adopterIds);

      if (followingData) {
        followingSet = new Set(followingData.map(f => f.following));
      }
    }

    // Transform data to flatten User object
    const transformedAdopters = (adopters || []).map((adopter: any) => ({
      user_id: adopter.user_id,
      user_uniqid: adopter.User.user_uniqid,
      user_name: adopter.User.user_name,
      image: adopter.User.image,
      is_current_user: currentUserId === adopter.user_id,
      following: followingSet.has(adopter.user_id),
    }));

    return new Response(
      JSON.stringify({
        code: 1,
        data: {
          adopters: transformedAdopters,
          total: count || 0,
          limit,
          offset,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in character adopters API:', error);
    return new Response(
      JSON.stringify({
        error:
          'Internal server error: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

