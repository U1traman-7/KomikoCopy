/* eslint-disable */
import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { pushMessage } from './message.js';
import { BROAD_TYPES, CONTENT_TYPES } from './_constants.js';
import { checkBadgesByType } from './badges/check.js';
import { waitUntil } from '@vercel/functions';
import { trackServerEvent } from './_utils/posthog.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const updatePostVoteCount = async (postId: string, incOrDec: 'inc' | 'dec') => {
  const { data: postData, error: postError } = await supabase
    .from('AppPosts')
    .select('votes')
    .eq('id', postId)
    .single();
  if (postError) {
    console.error('Error fetching post vote count:', postError);
    return false;
  }
  // 确保 votes 不会变成负数
  const count =
    incOrDec === 'inc' ? postData.votes + 1 : Math.max(0, postData.votes - 1);
  const { error: updateError } = await supabase
    .from('AppPosts')
    .update({ votes: count })
    .eq('id', postId);
  if (updateError) {
    console.error('Error updating post vote count:', updateError);
    return false;
  }
  console.log('Updated post vote count for postId:', postId, 'to', count);
  return true;
};

export async function POST(request: Request) {
  try {
    let { postId, commentId, authUserId, value } = await request.json();

    if (
      (postId === undefined && commentId === undefined) ||
      value === undefined
    ) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    //! FETCH COOKIE IF USER ID NOT PROVIDED
    if (!authUserId) {
      // Parse cookies from the request headers
      const cookies = parse(request.headers.get('cookie') || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Log in to vote' }), {
          status: 401,
        });
      }
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token) {
        return new Response(JSON.stringify({ error: 'Invalid login status' }), {
          status: 401,
        });
      }
      authUserId = token.id;
    }

    console.log('running vote request');
    console.log(authUserId);

    //! CHECK EXISTING VOTE
    // Check if a vote already exists with the same authUserId, postId or commentId, and value
    let existingVoteQuery = supabase
      .from('AppVotes')
      .select('*')
      .eq('authUserId', authUserId);

    if (postId !== undefined) {
      existingVoteQuery = existingVoteQuery.eq('postId', postId);
    } else if (commentId !== undefined) {
      existingVoteQuery = existingVoteQuery.eq('commentId', commentId);
    }

    const { data: existingVotes, error: existingVoteError } =
      await existingVoteQuery;

    if (existingVoteError) {
      throw existingVoteError;
    }

    if (existingVotes.length > 0) {
      const existingVote = existingVotes[0];

      // If vote value is -1 and there is an existing entry with value 1, delete the existing entry
      if (value === -1 && existingVote.value === 1) {
        const { error: deleteError } = await supabase
          .from('AppVotes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          throw deleteError;
        }

        await Promise.all([
          updatePostVoteCount(postId, 'dec'),
        ]);

        return new Response(JSON.stringify({ message: 'Vote removed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If the exact same vote already exists, do nothing
      if (existingVote.value === value) {
        return new Response(
          JSON.stringify({ message: 'Vote already exists' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
    } else if (value === -1) {
      // If no existing vote and the value is -1, do not insert a new row
      return new Response(JSON.stringify({ message: 'No vote to remove' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    //! Insert a row into AppVotes table
    const { data: voteData, error: voteError } = await supabase
      .from('AppVotes')
      .insert([{ postId, commentId, authUserId, value }])
      .select('id')
      .single();
    if (voteError) {
      throw voteError;
    }

    const isCommentLike =
      typeof commentId !== 'undefined' && commentId !== null;
    pushMessage(
      {
        content_type: isCommentLike
          ? CONTENT_TYPES.COMMENT_LIKES
          : CONTENT_TYPES.LIKES,
        content_id: voteData.id,
        host_content_id: isCommentLike ? commentId : postId,
        need_aggregate: true,
        broad_type: BROAD_TYPES.MESSAGE,
      },
      authUserId,
    );

    // Award credits for first upvote of the day (only for posts, not comments)
    if (postId !== undefined) {
      let { data: dateData, error: dateError } = await supabase
        .from('User')
        .select('date_like, credit')
        .eq('id', authUserId)
        .single();
      // console.log(dateData);
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      if (dateData && !dateError && dateData?.date_like !== todayString) {
        let { data: userData, error: userError } = await supabase
          .from('User')
          .update({ date_like: new Date(), credit: dateData.credit + 20 })
          .eq('id', authUserId);
        if (userError) {
          console.error('Error updating User dateLike:', userError);
        } else {
          waitUntil(
            trackServerEvent('dispatch_credit', authUserId, {
              credit: 20,
              reason: 'first_upvote_of_the_day',
            }),
          );
        }
      }
      await updatePostVoteCount(postId, 'inc');

      // TODO: 暂时注释掉非VIP徽章检查
      // // 触发徽章检查
      // try {
      //   await checkBadgesByType(authUserId, 'like').catch(error => {
      //     console.error('Error checking badges for liker:', error);
      //   });

      //   if (postId) {
      //     const { data: postData, error: postError } = await supabase
      //       .from('AppPosts')
      //       .select('authUserId')
      //       .eq('id', postId)
      //       .single();

      //     if (!postError && postData && postData.authUserId !== authUserId) {
      //       await checkBadgesByType(postData.authUserId, 'like_received').catch(
      //         error => {
      //           console.error('Error checking badges for post author:', error);
      //         },
      //       );
      //     }
      //   }
      // } catch (error) {
      //   console.error('Error checking badges after vote:', error);
      // }
    }

    return new Response(JSON.stringify({ message: 'success' }), {
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
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
