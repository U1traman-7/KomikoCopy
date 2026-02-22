import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { interactionNotificationEmail } from './_utils/email.js';
import { waitUntil } from '@vercel/functions';
import { pushMessage } from './message.js';
import { BROAD_TYPES, CONTENT_TYPES } from './_constants.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const fetchNumFollowers = async (authUserId: string) => {
  const { data, error } = await supabase.rpc('update_follow_counts', {
    authuserid: authUserId,
  });

  if (error) {
    console.error('Error fetching follower count:', error);
    return null;
  }

  return data;
};

export async function POST(request: Request) {
  try {
    let { followingUserId, authUserId, value } = await request.json();

    if (followingUserId === undefined || value === undefined) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ! FETCH COOKIE IF USER ID NOT PROVIDED
    if (!authUserId) {
      // Parse cookies from the request headers
      const cookies = parse(request.headers.get('cookie') || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Log in to continue' }), {
          status: 401,
        });
      }
      let token: any = null;
      try {
        token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        return new Response(JSON.stringify({ error: 'Log in to continue' }), {
          status: 401,
        });
      }
      if (!token) {
        return new Response(JSON.stringify({ error: 'Invalid login status' }), {
          status: 401,
        });
      }
      authUserId = token.id;
    }

    console.log('running follow request');
    console.log(authUserId, ' > ', followingUserId);

    if (authUserId === followingUserId) {
      return new Response(
        JSON.stringify({ message: 'You cannot follow yourself' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // ! CHECK EXISTING VOTE
    // Check if a vote already exists with the same authUserId, postId or commentId, and value
    const existingFollowQuery = supabase
      .from('AppFollows')
      .select('*')
      .eq('follower', authUserId)
      .eq('following', followingUserId);

    const { data: existingFollows, error: existingFollowError } =
      await existingFollowQuery;

    if (existingFollowError) {
      return new Response(
        JSON.stringify({
          error: existingFollowError.message,
          trigger: 'check existing followers',
        }),
        { status: 500 },
      );
    }

    // ! Unfollow
    if (existingFollows.length > 0) {
      const existingFollow = existingFollows[0];

      // Remove follow entry
      if (value === -1) {
        const { error: deleteError } = await supabase
          .from('AppFollows')
          .delete()
          .eq('id', existingFollow.id);

        if (deleteError) {
          throw deleteError;
        }

        await Promise.all([
          fetchNumFollowers(authUserId).catch(),
          fetchNumFollowers(followingUserId).catch(),
        ]);

        return new Response(JSON.stringify({ message: 'Follow removed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'follow success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (value === -1) {
      // No need to remove follow entry
      return new Response(JSON.stringify({ message: 'No follow to remove' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ! Insert a row into AppFollows table
    const { data: voteData, error: voteError } = await supabase
      .from('AppFollows')
      .insert([
        {
          follower: authUserId,
          following: followingUserId,
        },
      ])
      .select('id')
      .single();

    if (voteError) {
      throw voteError;
    }

    pushMessage(
      {
        content_type: CONTENT_TYPES.FOLLOW,
        content_id: voteData.id,
        host_content_id: 0,
        user_id: followingUserId,
        broad_type: BROAD_TYPES.MESSAGE,
      },
      authUserId,
    );

    await fetchNumFollowers(authUserId);
    await fetchNumFollowers(followingUserId);

    waitUntil(
      interactionNotificationEmail(authUserId, 'follow', {
        userId: followingUserId,
      }),
    );

    return new Response(JSON.stringify({ message: 'follow success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
