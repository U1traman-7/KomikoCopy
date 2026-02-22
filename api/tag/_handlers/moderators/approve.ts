/**
 * Application approval handlers (called from Feishu webhook)
 */
import { supabase } from '../utils.js';
import { pushMessage } from '../../../message.js';
import { BROAD_TYPES, CONTENT_TYPES } from '../../../_constants.js';
import { sendEmail } from '../../../_utils/email.js';
import {
  generateEmailContent,
  getTranslationFile,
  getUserLanguage,
  attrVariables,
} from '../../../_utils/template.js';

// Secret for approving/rejecting applications (simple security for webhook links)
const MOD_APPROVE_SECRET = process.env.MOD_APPROVE_SECRET;

// Feishu/Lark webhook for result notifications
const LARK_MOD_APPLICATION_WEBHOOK = process.env.LARK_MOD_APPLICATION_WEBHOOK;

/**
 * Send approval email to the user
 */
async function sendApprovalEmail(params: {
  userId: string;
  userEmail: string;
  tagName: string;
}) {
  const { userId, userEmail, tagName } = params;

  if (!userEmail) {
    console.log('No email found for user, skipping approval email');
    return;
  }

  try {
    // Get user's language preference
    const userLanguage = await getUserLanguage(userId);
    const translations = getTranslationFile(userLanguage);

    const payload = {
      tag_name: tagName,
      email: userEmail,
    };

    // Apply variable substitution to translations
    const processedTranslations = attrVariables(translations, payload);

    // Generate email content
    const emailContent = generateEmailContent('moderator_approved', {
      ...payload,
      ...processedTranslations,
    });

    // Send the email
    await sendEmail(
      userEmail,
      processedTranslations.moderator_approved_title ||
        'Your moderator application has been approved!',
      emailContent,
    );

    console.log(`Approval email sent to ${userEmail} for tag #${tagName}`);
  } catch (error) {
    console.error('Failed to send approval email:', error);
    // Don't throw - email failure shouldn't block the approval
  }
}

/**
 * Send result notification to Feishu/Lark
 */
async function sendResultNotification(result: {
  action: 'approve' | 'reject';
  userName: string;
  tagName: string;
  userEmail: string;
}) {
  const isApproved = result.action === 'approve';
  const message = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title: isApproved
            ? '✅ Moderator Application Approved'
            : '❌ Moderator Application Rejected',
          content: [
            [
              {
                tag: 'text',
                text: `Tag: #${result.tagName}\nUser: ${result.userName}\nUser Email: ${result.userEmail}\n`,
              },
            ],
          ],
        },
      },
    },
  };

  if (!LARK_MOD_APPLICATION_WEBHOOK) {
    console.error('LARK_MOD_APPLICATION_WEBHOOK is not set');
    return;
  }

  try {
    await fetch(LARK_MOD_APPLICATION_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send result notification:', error);
  }
}

/**
 * Generate a simple HTML response page
 */
function generateHtmlResponse(
  type: 'success' | 'error' | 'info',
  message: string,
): string {
  const config = {
    success: {
      color: '#10b981',
      icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    },
    error: {
      color: '#ef4444',
      icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    },
    info: {
      color: '#3b82f6',
      icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    },
  };
  const { color, icon } = config[type];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Komiko</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
    }
    .container { text-align: center; max-width: 360px; }
    .icon { color: ${color}; margin-bottom: 24px; }
    .message { font-size: 16px; line-height: 1.6; color: #1f2937; margin-bottom: 32px; }
    .hint { font-size: 13px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <p class="message">${message}</p>
    <p class="hint">You can close this page</p>
  </div>
</body>
</html>`;
}

/**
 * Approve or reject a moderator application (called from Feishu button)
 */
export async function handleApproval(
  applicationId: number,
  action: 'approve' | 'reject',
  secret: string,
): Promise<Response> {
  // Validate secret
  if (secret !== MOD_APPROVE_SECRET) {
    return new Response(generateHtmlResponse('error', '无效的授权'), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Get application details (include email for approval notification)
  const { data: application, error: fetchError } = await supabase
    .from('moderator_applications')
    .select(
      `
      id,
      user_id,
      tag_id,
      applied_role,
      status,
      User:user_id (user_name, email, unsubscribe),
      tags:tag_id (name)
    `,
    )
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    return new Response(generateHtmlResponse('error', '申请不存在'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (application.status !== 'pending') {
    return new Response(
      generateHtmlResponse(
        'info',
        `This application has been processed (status: ${application.status})`,
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  const userName = (application.User as any)?.user_name || 'Anonymous';
  const userEmail = (application.User as any)?.email;
  const userUnsubscribed = (application.User as any)?.unsubscribe;
  const tagName = (application.tags as any)?.name || 'Unknown';
  const officialAccountId = process.env.OFFICIAL_ACCOUNT_ID;

  if (action === 'approve') {
    // Update application status
    const { error: updateError } = await supabase
      .from('moderator_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return new Response(generateHtmlResponse('error', '更新申请状态失败'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Add user as moderator
    const { error: modError } = await supabase.from('tag_moderators').insert({
      user_id: application.user_id,
      tag_id: application.tag_id,
    });

    if (modError && modError.code !== '23505') {
      // Ignore unique constraint violation
      console.error('Error adding moderator:', modError);
      // Still continue - application is approved
    }

    // Send Lark notification
    await sendResultNotification({
      action: 'approve',
      userName,
      userEmail,
      tagName,
    });

    // Send approval email to user (if not unsubscribed)
    if (userEmail && !userUnsubscribed) {
      await sendApprovalEmail({
        userId: application.user_id,
        userEmail,
        tagName,
      });
    }

    if (officialAccountId) {
      pushMessage(
        {
          content_type: CONTENT_TYPES.TAG_REQUEST,
          content_id: application.id,
          host_content_id: 0,
          need_aggregate: false,
          broad_type: BROAD_TYPES.MESSAGE,
          user_id: application.user_id,
          payload: {
            version: 1,
            tagName,
            tagId: application.tag_id,
          },
        },
        officialAccountId,
      ).catch(error => {
        console.error('Failed to push tag request approval message:', error);
      });
    }

    return new Response(
      generateHtmlResponse(
        'success',
        `The application for ${userName} to be a moderator of #${tagName} has been approved`,
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
  // Reject application
  const { error: updateError } = await supabase
    .from('moderator_applications')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (updateError) {
    console.error('Error updating application:', updateError);
    return new Response(generateHtmlResponse('error', '更新申请状态失败'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Send notification
  await sendResultNotification({
    action: 'reject',
    userName,
    tagName,
    userEmail,
  });

  return new Response(
    generateHtmlResponse(
      'success',
      `The application for ${userName} to be a moderator of #${tagName} has been rejected`,
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}
