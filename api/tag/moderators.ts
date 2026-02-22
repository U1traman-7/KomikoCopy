/**
 * Unified Tag Moderators API
 * Combines: moderators management, apply, apply-approve
 *
 * GET /api/tag/moderators
 *   - ?tagId=X - List moderators for a tag
 *   - ?tagId=X&check=application - Get user's application status
 *   - ?action=approve-application&id=X&secret=X - Approve application (from Feishu)
 *   - ?action=reject-application&id=X&secret=X - Reject application (from Feishu)
 *
 * POST /api/tag/moderators
 *   - { action: 'add', tagId, userId?, email?, role? } - Add moderator
 *   - { action: 'apply', tagId, preferredName?, reason?, contactInfo? } - Submit application
 *
 * DELETE /api/tag/moderators?tagId=X&userId=X - Remove moderator
 */
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { errorResponse } from './_handlers/utils.js';
import {
  getModerators,
  addModerator,
  removeModerator,
} from './_handlers/moderators/manage.js';
import {
  submitApplication,
  getApplicationStatus,
} from './_handlers/moderators/apply.js';
import { handleApproval } from './_handlers/moderators/approve.js';

/**
 * Authenticate user from request
 */
async function getUserId(request: Request): Promise<string | null> {
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];

  if (!sessionToken) return null;

  try {
    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });
    return (token?.id as string) || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');
    const check = url.searchParams.get('check');
    const action = url.searchParams.get('action');

    // Handle approval from Feishu webhook
    if (action === 'approve-application' || action === 'reject-application') {
      const applicationId = url.searchParams.get('id');
      const secret = url.searchParams.get('secret');

      if (!applicationId || !secret) {
        return new Response(
          '<!DOCTYPE html><html><body><h1>缺少必要参数</h1></body></html>',
          { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        );
      }

      return handleApproval(
        parseInt(applicationId),
        action === 'approve-application' ? 'approve' : 'reject',
        secret,
      );
    }

    if (!tagId) {
      return errorResponse('Tag ID is required');
    }

    const tagIdNum = parseInt(tagId);

    // Check application status
    if (check === 'application') {
      const userId = await getUserId(request);
      if (!userId) {
        return new Response(JSON.stringify({ application: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return getApplicationStatus(userId, tagIdNum);
    }

    // Default: list moderators
    return getModerators(request, tagIdNum);
  } catch (error) {
    console.error('Moderators GET error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, tagId } = body;

    // Authenticate user
    const userId = await getUserId(request);
    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    if (!tagId) {
      return errorResponse('Tag ID is required');
    }

    switch (action) {
      case 'add': {
        const { userId: targetUserId, email } = body;
        if (!targetUserId && !email) {
          return errorResponse('User ID or email is required');
        }
        return addModerator(userId, tagId, targetUserId, email);
      }

      case 'apply': {
        const { preferredName, reason, contactInfo } = body;
        return submitApplication(userId, tagId, preferredName, reason, contactInfo);
      }

      default:
        return errorResponse('Invalid action. Use: add, apply');
    }
  } catch (error) {
    console.error('Moderators POST error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');
    const targetUserId = url.searchParams.get('userId');

    if (!tagId || !targetUserId) {
      return errorResponse('Tag ID and User ID are required');
    }

    // Authenticate user
    const userId = await getUserId(request);
    if (!userId) {
      return errorResponse('Authentication required', 401);
    }

    return removeModerator(userId, parseInt(tagId), targetUserId);
  } catch (error) {
    console.error('Moderators DELETE error:', error);
    return errorResponse('Internal server error', 500);
  }
}
