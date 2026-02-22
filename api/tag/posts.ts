/**
 * Unified Tag Posts API
 * Combines: feature, hide, pin, hidden-posts
 *
 * POST /api/tag/posts - Perform action on post
 *   Body: { tagId, postId, action: 'feature'|'unfeature'|'hide'|'unhide'|'pin'|'unpin' }
 *
 * PUT /api/tag/posts - Update sort order
 *   Body: { tagId, postId, sortOrder, type: 'feature'|'pin' }
 *
 * GET /api/tag/posts - Check permissions or get hidden posts
 *   Query: ?tagId=X&check=feature|pin|hidden
 */
import { authenticateUser, errorResponse } from './_handlers/utils.js';
import { handleFeature, handleFeatureSortOrder, checkCanFeature } from './_handlers/posts/feature.js';
import { handleHide, getHiddenPosts } from './_handlers/posts/hide.js';
import { handlePin, handlePinSortOrder, checkCanPin } from './_handlers/posts/pin.js';

type PostAction = 'feature' | 'unfeature' | 'hide' | 'unhide' | 'pin' | 'unpin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tagId, postId, action } = body as { tagId: number; postId: number; action: PostAction };

    if (!tagId || !postId || !action) {
      return errorResponse('tagId, postId, and action are required');
    }

    const validActions: PostAction[] = ['feature', 'unfeature', 'hide', 'unhide', 'pin', 'unpin'];
    if (!validActions.includes(action)) {
      return errorResponse(`action must be one of: ${validActions.join(', ')}`);
    }

    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth.authenticated || !auth.userId) {
      return auth.error!;
    }

    // Route to appropriate handler
    switch (action) {
      case 'feature':
      case 'unfeature':
        return handleFeature(auth.userId, tagId, postId, action);
      case 'hide':
      case 'unhide':
        return handleHide(auth.userId, tagId, postId, action);
      case 'pin':
      case 'unpin':
        return handlePin(auth.userId, tagId, postId, action);
      default:
        return errorResponse('Invalid action');
    }
  } catch (error) {
    console.error('Unexpected error in tag posts API:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tagId, postId, sortOrder, type } = body as {
      tagId: number;
      postId: number;
      sortOrder: number;
      type: 'feature' | 'pin';
    };

    if (!tagId || !postId || sortOrder === undefined || !type) {
      return errorResponse('tagId, postId, sortOrder, and type are required');
    }

    if (!['feature', 'pin'].includes(type)) {
      return errorResponse('type must be "feature" or "pin"');
    }

    // Authenticate user
    const auth = await authenticateUser(request);
    if (!auth.authenticated || !auth.userId) {
      return auth.error!;
    }

    if (type === 'feature') {
      return handleFeatureSortOrder(auth.userId, tagId, postId, sortOrder);
    } else {
      return handlePinSortOrder(auth.userId, tagId, postId, sortOrder);
    }
  } catch (error) {
    console.error('Unexpected error in tag posts sort API:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tagIdParam = url.searchParams.get('tagId') || url.searchParams.get('tag_id');
    const check = url.searchParams.get('check');

    if (!tagIdParam) {
      return errorResponse('tagId is required');
    }

    const tagId = parseInt(tagIdParam);

    // Get user ID (optional for some checks)
    const auth = await authenticateUser(request, false);
    const userId = auth.userId || null;

    switch (check) {
      case 'feature':
        return checkCanFeature(userId, tagId);
      case 'pin':
        return checkCanPin(userId, tagId);
      case 'hidden':
        // Hidden posts require authentication
        if (!userId) {
          return errorResponse('Authentication required', 401);
        }
        return getHiddenPosts(userId, tagId);
      default:
        // Default: return both can_feature and can_pin
        const [featureResult, pinResult] = await Promise.all([
          checkCanFeature(userId, tagId),
          checkCanPin(userId, tagId),
        ]);
        const featureData = await featureResult.json();
        const pinData = await pinResult.json();
        return new Response(
          JSON.stringify({
            can_feature: featureData.can_feature,
            featured_post_ids: featureData.featured_post_ids,
            can_pin: pinData.can_pin,
            pinned_post_ids: pinData.pinned_post_ids,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error in tag posts check API:', error);
    return errorResponse('Internal server error', 500);
  }
}

