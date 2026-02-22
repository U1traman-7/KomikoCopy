/**
 * Moderator application handlers
 * - Submit application
 * - Get application status
 */
import { supabase, jsonResponse, errorResponse } from '../utils.js';

// Feishu/Lark webhook for moderator application notifications
const LARK_MOD_APPLICATION_WEBHOOK = process.env.LARK_MOD_APPLICATION_WEBHOOK;

// Base URL for approval links
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://komiko.app';

/**
 * Send notification to Feishu/Lark when a new application is submitted
 */
async function sendLarkNotification(application: {
  id: number;
  userUniqid: string;
  userName: string;
  userEmail?: string;
  tagName: string;
  tagId: number;
  preferredName?: string;
  reason?: string;
  contactInfo?: string;
}) {
  if (!LARK_MOD_APPLICATION_WEBHOOK) {
    console.error('LARK_MOD_APPLICATION_WEBHOOK is not set');
    return;
  }

  const modApproveSecret = process.env.MOD_APPROVE_SECRET;
  if (!modApproveSecret) {
    console.error(
      'MOD_APPROVE_SECRET is not set - approval links will not be generated',
    );
    return;
  }

  const approveUrl = `${BASE_URL}/api/tag/moderators?action=approve-application&id=${application.id}&secret=${modApproveSecret}`;
  const rejectUrl = `${BASE_URL}/api/tag/moderators?action=reject-application&id=${application.id}&secret=${modApproveSecret}`;

  const message = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: {
          content: '🎯 New Tag Moderator Application',
          tag: 'plain_text',
        },
        template: 'blue',
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**User Name**: ${application.userName}\n**User Email**: ${application.userEmail}\n**Tag Name**: #${application.tagName} (ID: ${application.tagId})\n`,
            tag: 'lark_md',
          },
        },
        {
          tag: 'div',
          text: {
            content: `**Preferred Name**: ${application.preferredName || ''}`,
            tag: 'lark_md',
          },
        },
        {
          tag: 'div',
          text: {
            content: `**Application Reason**:\n${application.reason || ''}`,
            tag: 'lark_md',
          },
        },
        {
          tag: 'div',
          text: {
            content: `**Discord / Email address**: \n ${application.contactInfo || ''}`,
            tag: 'lark_md',
          },
        },
        { tag: 'hr' },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { content: '✅ Approve', tag: 'plain_text' },
              type: 'primary',
              url: approveUrl,
            },
            {
              tag: 'button',
              text: { content: '❌ Reject', tag: 'plain_text' },
              type: 'danger',
              url: rejectUrl,
            },
            {
              tag: 'button',
              text: { content: 'View User Profile', tag: 'plain_text' },
              type: 'default',
              url: `${BASE_URL}/user/${application.userUniqid}`,
            },
          ],
        },
      ],
    },
  };

  try {
    await fetch(LARK_MOD_APPLICATION_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send Lark notification:', error);
    // Don't throw - notification failure shouldn't block the application
  }
}

/**
 * Submit a moderator application
 */
export async function submitApplication(
  userId: string,
  tagId: number,
  preferredName?: string,
  reason?: string,
  contactInfo?: string,
): Promise<Response> {
  // Check if user already has a pending application for this tag
  const { data: existingApp } = await supabase
    .from('moderator_applications')
    .select('id')
    .eq('tag_id', tagId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (existingApp) {
    return errorResponse('You already have a pending application for this tag');
  }

  // Check if user is already a moderator for this tag
  const { data: existingMod } = await supabase
    .from('tag_moderators')
    .select('id')
    .eq('tag_id', tagId)
    .eq('user_id', userId)
    .single();

  if (existingMod) {
    return errorResponse('You are already a moderator for this tag');
  }

  // Get tag info
  const { data: tagData, error: tagError } = await supabase
    .from('tags')
    .select('id, name')
    .eq('id', tagId)
    .single();

  if (tagError || !tagData) {
    return errorResponse('Tag not found', 404);
  }

  // Get user info
  const { data: userData } = await supabase
    .from('User')
    .select('user_name, email, user_uniqid')
    .eq('id', userId)
    .single();


  // Insert application (always as 'moderator' role)
  const { data: application, error: insertError } = await supabase
    .from('moderator_applications')
    .insert({
      user_id: userId,
      tag_id: tagId,
      applied_role: 'moderator',
      application_reason: reason || null,
      contact_info: contactInfo || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating application:', insertError);
    return errorResponse('Failed to submit application', 500);
  }

  // Send notification to Feishu/Lark
  await sendLarkNotification({
    id: application.id,
    userUniqid: userData?.user_uniqid || userId,
    userName: userData?.user_name || 'Anonymous',
    userEmail: userData?.email,
    tagName: tagData.name,
    tagId: tagData.id,
    preferredName: preferredName,
    reason: reason,
    contactInfo: contactInfo,
  });

  return jsonResponse({
    message: 'Application submitted successfully',
    application: {
      id: application.id,
      status: application.status,
      created_at: application.created_at,
    },
  });
}

/**
 * Get user's application status for a tag
 */
export async function getApplicationStatus(
  userId: string,
  tagId: number,
): Promise<Response> {
  // Get user's latest application for this tag
  const { data, error } = await supabase
    .from('moderator_applications')
    .select('id, status, applied_role, created_at, reviewed_at')
    .eq('tag_id', tagId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching application:', error);
  }

  return jsonResponse({ application: data || null });
}
