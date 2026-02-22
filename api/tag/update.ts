import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { supabase, isGlobalAdmin } from './_handlers/utils.js';

interface TagUpdateData {
  logo_url?: string | null;
  header_image?: string | null;
  description?: string | null;
  is_nsfw?: boolean;
  cta_link?: string | null;
  character_category?: string | null;
  allow_media_types?: 'all' | 'image' | 'video' | null;
  cta_text_translation?: Record<string, string> | null;
}

/**
 * PUT /api/tag/update
 * Update tag information (Moderator or Admin only)
 * Body: {
 *   tagId: number,
 *   logo_url?: string,
 *   header_image?: string,
 *   description?: string,
 *   is_nsfw?: boolean
 * }
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { tagId, ...updateFields } = body;

    if (!tagId) {
      return new Response(JSON.stringify({ error: 'Tag ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate update fields
    const allowedFields = [
      'logo_url',
      'header_image',
      'description',
      'is_nsfw',
      'cta_link',
      'character_category',
      'allow_media_types',
      'cta_text_translation',
    ];

    const updateData: TagUpdateData = {};

    for (const field of allowedFields) {
      if (field in updateFields) {
        (updateData as any)[field] = updateFields[field];
      }
    }

    // Check if there are any valid fields to update (fail-fast before auth)
    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Verify authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let currentUserId: string;
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token?.id) {
        throw new Error('Invalid token');
      }
      currentUserId = token.id as string;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify tag exists
    const { data: tagExists, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('id', tagId)
      .single();

    if (tagError || !tagExists) {
      return new Response(JSON.stringify({ error: 'Tag not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if current user is admin or tag moderator
    const isAdmin = await isGlobalAdmin(currentUserId);

    if (!isAdmin) {
      // Check if user is a moderator for this tag
      const { data: modCheck } = await supabase
        .from('tag_moderators')
        .select('id, role')
        .eq('tag_id', tagId)
        .eq('user_id', currentUserId)
        .single();

      if (!modCheck) {
        return new Response(
          JSON.stringify({
            error: 'Only moderators or admins can update tag information',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // Update the tag
    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', tagId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tag:', error);
      return new Response(JSON.stringify({ error: 'Failed to update tag' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ message: 'Tag updated successfully', tag: data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Update tag error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET /api/tag/update
 * Check if current user can update a tag
 * Query params:
 *   - tagId: tag ID (required)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');

    if (!tagId) {
      return new Response(JSON.stringify({ error: 'Tag ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify authentication
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ can_edit: false, reason: 'Not authenticated' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let currentUserId: string;
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token?.id) {
        throw new Error('Invalid token');
      }
      currentUserId = token.id as string;
    } catch {
      return new Response(
        JSON.stringify({ can_edit: false, reason: 'Invalid authentication' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Check if admin
    const isAdmin = await isGlobalAdmin(currentUserId);
    if (isAdmin) {
      return new Response(JSON.stringify({ can_edit: true, role: 'admin' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if moderator
    const { data: modCheck } = await supabase
      .from('tag_moderators')
      .select('role')
      .eq('tag_id', parseInt(tagId))
      .eq('user_id', currentUserId)
      .single();

    if (modCheck) {
      return new Response(
        JSON.stringify({ can_edit: true, role: modCheck.role }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ can_edit: false, reason: 'Not a moderator' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Check edit permission error:', error);
    return new Response(
      JSON.stringify({ can_edit: false, reason: 'Error checking permissions' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
