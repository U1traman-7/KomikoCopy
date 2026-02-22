/* eslint-disable */
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

interface Comment {
  postid: number;
  content: string;
  votes: number;
  user_name: string;
  image: string;
  created_at: string;
}

export async function POST(request: Request) {
  try {
    let {
      postId,
      parentCommentId,
      replyToCommentId,
      authUserId,
      content,
      item,
      replyToUserId,
    } = await request.json();

    if (
      (postId === undefined && parentCommentId === undefined) ||
      content === undefined
    ) {
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
        return new Response(
          JSON.stringify({ error: 'Log in to generate images' }),
          { status: 401 },
        );
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

    console.log('running comment request');
    console.log(authUserId);

    const { data: blockedData, error: blockedError } = await supabase
      .from('blocked_users')
      .select('user_id')
      .eq('user_id', authUserId)
      .single();

    if (blockedError || !blockedData) {
      console.error('Error checking blocked user:', blockedError);
    }

    if (blockedData?.user_id) {
      return new Response(JSON.stringify({ error: 'User is blocked' }), {
        status: 403,
      });
    }

    const votes = 0;
    // ! Insert a row into AppComments table
    const { data: commentData, error: commentError } = await supabase
      .from('AppComments')
      .insert([
        {
          postId,
          parentCommentId,
          authUserId,
          content,
          votes,
          reply_to_user_id: replyToUserId,
        },
      ])
      .select('id')
      .single();

    if (commentError) {
      return new Response(
        JSON.stringify({
          error: commentError.message,
          trigger: 'insert_comment',
        }),
        { status: 500 },
      );
    }

    const isReply = !!parentCommentId;
    pushMessage(
      {
        content_type: isReply
          ? CONTENT_TYPES.REPLY_COMMENT
          : CONTENT_TYPES.COMMENT,
        content_id: commentData.id,
        host_content_id: isReply ? parentCommentId : postId,
        user_id: undefined,
        broad_type: BROAD_TYPES.MESSAGE,
        reply_to_user_id: replyToUserId,
      },
      authUserId,
    );

    if (replyToUserId) {
      pushMessage(
        {
          content_type: CONTENT_TYPES.REPLY_COMMENT,
          content_id: commentData.id,
          host_content_id: parentCommentId,
          user_id: replyToUserId,
          broad_type: BROAD_TYPES.MESSAGE,
        },
        authUserId,
      );
    }

    // Send notification email
    const notificationType = parentCommentId ? 'reply' : 'comment';
    const notificationPayload = parentCommentId
      ? {
          postId,
          parentCommentId,
          replyToCommentId,
          replyContent: content,
        }
      : {
          postId,
          commentContent: content,
        };

    waitUntil(
      interactionNotificationEmail(
        authUserId,
        notificationType,
        notificationPayload,
      ),
    );

    // ! FETCH COMMENTS
    const { data: commentsData, error: commentsError } = await supabase
      .rpc('get_all_comments_by_post_without_blocked_users_v3', {
        post_ids: Array([postId]),
        current_user_id: authUserId,
      })
      .returns<Comment[]>();

    if (commentsError) {
      return new Response(
        JSON.stringify({
          error: commentsError.message,
          trigger: 'fetch_comments',
        }),
        { status: 500 },
      );
    }

    return new Response(JSON.stringify(commentsData), {
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
