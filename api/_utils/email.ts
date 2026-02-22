import { Resend } from 'resend';
import { createSupabase } from './index.js';
import { waitUntil } from '@vercel/functions';
import {
  attrVariables,
  generateEmailContent,
  getTranslationFile,
  getUserLanguage,
} from './template.js';

const supabase = createSupabase();

export const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  identifier: string,
  authSubject: string,
  emailContent: string,
) => {
  console.log('identifier:', identifier);
  console.log('authSubject:', authSubject);
  // console.log('emailContent:', emailContent);
  const result = await resend.emails.send({
    // todo check
    from: `KomikoAI <${process.env.RESEND_FROM}>`,
    to: identifier,
    subject: authSubject,
    // react: emailContent,
    html: emailContent,
    // Set this to prevent Gmail from threading emails.
    // More info: https://resend.com/changelog/custom-email-headers
    headers: {
      'X-Entity-Ref-ID': `${new Date().getTime()}`,
    },
  });
  console.log('result:', result);
  return result;
};

const getProcessedTranslation = (
  language: string,
  payload: Record<string, string>,
) => {
  const translations = getTranslationFile(language);
  return attrVariables(translations, payload);
};

type InteractionType = 'collect' | 'follow' | 'comment' | 'reply';
export const interactionNotificationEmail = async (
  userId: string,
  type: InteractionType,
  payload: {
    characterUniqId?: string;
    userId?: string;
    postId?: number;
    commentContent?: string;
    parentCommentId?: number;
    replyToCommentId?: number;
    replyContent?: string;
  },
) => {
  if (!userId) {
    return false;
  }
  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('user_name,user_uniqid')
    .eq('id', userId);
  if (userError) {
    console.error('userError:', userError);
    return false;
  }

  const fromUserName = userData?.[0]?.user_name || 'one user';
  const fromUserUniqId = userData?.[0]?.user_uniqid;

  if (type === 'collect') {
    const { characterUniqId } = payload;
    if (!characterUniqId) {
      return false;
    }
    const { data, error } = await supabase
      .from('CustomCharacters')
      .select('authUserId, character_name, User(email,unsubscribe)')
      .eq('character_uniqid', characterUniqId);
    if (error) {
      console.error('error:', error);
      return false;
    }
    if (!data || data.length === 0) {
      return false;
    }
    const { authUserId, User, character_name } = data[0];
    if (!authUserId || !User) {
      return false;
    }
    const { email, unsubscribe } = User as unknown as {
      email: string;
      unsubscribe: boolean;
    };
    if (!email) {
      return false;
    }
    if (unsubscribe) {
      return true;
    }

    // 获取目标用户的语言
    const targetUserLanguage = await getUserLanguage(authUserId);
    const newPayload = {
      character_name,
      username: fromUserName,
      character_uniqid: characterUniqId,
      email,
    };
    const translations = getProcessedTranslation(
      targetUserLanguage,
      newPayload as Record<string, string>,
    );

    waitUntil(
      sendEmail(
        email,
        translations.collect_title,
        generateEmailContent('collect', {
          ...newPayload,
          ...translations,
        }),
      ),
    );
    return true;
  }

  if (type === 'comment') {
    const { postId } = payload;
    if (!postId) {
      return false;
    }
    const { data, error } = await supabase
      .from('AppPosts')
      .select('title,content,uniqid,User(id,email,unsubscribe)')
      .eq('id', postId);
    if (error) {
      console.error('error:', error);
      return false;
    }
    if (!data || data.length === 0) {
      return false;
    }
    const { User, title, content, uniqid } = data[0];
    if (!User) {
      return false;
    }
    const {
      email,
      unsubscribe,
      id: postUserId,
    } = User as unknown as {
      email: string;
      unsubscribe: boolean;
      id: string;
    };
    if (!email) {
      return false;
    }
    if (unsubscribe) {
      return true;
    }
    if (postUserId === userId) {
      return true;
    }

    // 获取目标用户的语言
    const targetUserLanguage = await getUserLanguage(postUserId);
    const newPayload = {
      post_title: title,
      post_content: content,
      username: fromUserName,
      comment_content: payload.commentContent,
      post_id: uniqid,
      email,
    };
    const translations = getProcessedTranslation(
      targetUserLanguage,
      newPayload as Record<string, string>,
    );

    waitUntil(
      sendEmail(
        email,
        translations.comment_title,
        generateEmailContent('comment', {
          ...newPayload,
          ...translations,
        }),
      ),
    );
    return true;
  }

  if (type === 'follow') {
    const { userId } = payload;
    if (!userId) {
      return false;
    }
    const { data: followingUsers, error } = await supabase
      .from('User')
      .select('email,unsubscribe')
      .eq('id', userId);
    if (error) {
      console.error('error:', error);
      return false;
    }
    if (!followingUsers || followingUsers.length === 0) {
      return false;
    }
    const { email, unsubscribe } = followingUsers[0];
    if (!email) {
      return false;
    }
    if (unsubscribe) {
      return true;
    }

    // 获取目标用户的语言
    const targetUserLanguage = await getUserLanguage(userId);
    const newPayload = {
      username: fromUserName,
      user_id: fromUserUniqId,
      email,
    };
    const translations = getProcessedTranslation(
      targetUserLanguage,
      newPayload as Record<string, string>,
    );

    waitUntil(
      sendEmail(
        email,
        translations.follow_title,
        generateEmailContent('follow', {
          ...newPayload,
          ...translations,
        }),
      ),
    );
    return true;
  }

  if (type === 'reply') {
    const { postId, parentCommentId, replyToCommentId, replyContent } = payload;
    
    if (!postId || !parentCommentId) {
      return false;
    }

    // Determine which user to send email to
    let targetUserId: string;
    
    if (replyToCommentId) {
      // If replying to a second-level comment, send email to that comment's author
      const { data: replyToComment, error: replyToError } = await supabase
        .from('AppComments')
        .select('authUserId')
        .eq('id', replyToCommentId)
        .single();

      if (replyToError || !replyToComment) {
        return false;
      }
      
      targetUserId = replyToComment.authUserId;
    } else {
      // If replying to a first-level comment, send email to that comment's author
      const { data: parentComment, error: parentError } = await supabase
        .from('AppComments')
        .select('authUserId')
        .eq('id', parentCommentId)
        .single();

      if (parentError || !parentComment) {
        return false;
      }
      
      targetUserId = parentComment.authUserId;
    }
    
    // Get target user information
    const { data: targetUser, error: userError } = await supabase
      .from('User')
      .select('email,unsubscribe')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return false;
    }
    
    const { email, unsubscribe } = targetUser;

    // Skip email if user has no email, unsubscribed, or replying to self
    if (!email || unsubscribe || targetUserId === userId) {
      return true;
    }

    // Get post information
    const { data: postData, error: postError } = await supabase
      .from('AppPosts')
      .select('title,content,uniqid')
      .eq('id', postId)
      .single();

    if (postError || !postData) {
      return false;
    }

    // Get target user's language preference
    const targetUserLanguage = await getUserLanguage(targetUserId);
    
    // Prepare email payload with reply content mapped to comment_content for template compatibility
    const newPayload = {
      post_title: postData.title,
      post_content: postData.content,
      username: fromUserName,
      comment_content: replyContent, // Map reply content to comment_content for template compatibility
      post_id: postData.uniqid,
      email,
    };

    // Get translations for target user's language
    const translations = getProcessedTranslation(
      targetUserLanguage,
      newPayload as Record<string, string>,
    );

    // Send reply notification email
    waitUntil(
      sendEmail(
        email,
        translations.reply_title,
        generateEmailContent('reply', {
          ...newPayload,
          ...translations,
        }),
      ),
    );
    
    return true;
  }
};
