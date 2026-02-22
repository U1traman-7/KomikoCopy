/**
 * Lark (Feishu) Webhook 通知工具
 * 用于向 Lark 群组发送举报通知等消息
 */

export interface ReportNotificationData {
  postId: number;
  postUniqid: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  postContent?: string;
  postImageUrl?: string;
}

/**
 * 发送帖子举报通知到 Lark 群组
 * 构造 Interactive Card 消息，包含帖子信息和操作按钮
 */
export async function sendReportNotification(
  data: ReportNotificationData,
): Promise<void> {
  const webhookUrl = process.env.LARK_POST_REPORT_WEBHOOK;

  if (!webhookUrl) {
    console.error('LARK_POST_REPORT_WEBHOOK not configured');
    return;
  }

  // 始终使用生产环境 URL，避免本地开发时发送 localhost 链接
  const appUrl = 'https://komiko.app';
  const postLink = `${appUrl}/post/${data.postUniqid}`;
  const hideLink = `${appUrl}/api/lark/report-callback?postId=${data.postId}&action=hide`;

  // 构造内容摘要
  const contentPreview = data.postContent
    ? `\n**Content:** ${data.postContent.substring(0, 100)}${data.postContent.length > 100 ? '...' : ''}`
    : '';

  const card = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: 'New Post Report',
        },
        template: 'red',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**Post ID:** ${data.postId}\n**Post Link:** [View Post](${postLink})\n**Reporter:** ${data.reporterName} (${data.reporterEmail})\n**Reason:** ${data.reason}\n**Time:** ${new Date().toISOString()}${contentPreview}`,
          },
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: 'View Post',
              },
              type: 'primary',
              url: postLink,
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: 'Hide Post',
              },
              type: 'danger',
              url: hideLink,
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Lark notification:', errorText);
    }
  } catch (error) {
    console.error('Error sending Lark notification:', error);
  }
}
