/**
 * Moderator management handlers
 * - GET: List moderators for a tag
 * - Add moderator
 * - Remove moderator
 */
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { supabase, jsonResponse, errorResponse, isGlobalAdmin } from '../utils.js';

/**
 * GET handler - List moderators for a tag
 */
export async function getModerators(request: Request, tagId: number): Promise<Response> {
  // Check if current user is global admin to determine if email should be returned
  let isAdmin = false;
  const cookies = parse(request.headers.get('cookie') || '');
  const sessionToken = cookies['next-auth.session-token'];

  if (sessionToken) {
    try {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (token?.id) {
        isAdmin = await isGlobalAdmin(token.id as string);
      }
    } catch {
      // Ignore auth errors, just don't return email
    }
  }

  const { data, error } = await supabase
    .from('tag_moderators')
    .select(`
      id,
      user_id,
      role,
      created_at,
      User:user_id (
        user_name,
        image,
        user_uniqid,
        email
      )
    `)
    .eq('tag_id', tagId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching moderators:', error);
    return errorResponse('Failed to fetch moderators', 500);
  }

  // Transform the data to flatten User info
  // Only include email if current user is global admin
  const moderators = (data || []).map((mod: any) => ({
    id: mod.id,
    user_id: mod.user_id,
    role: mod.role,
    created_at: mod.created_at,
    user_name: mod.User?.user_name,
    user_image: mod.User?.image,
    user_uniqid: mod.User?.user_uniqid,
    ...(isAdmin && { email: mod.User?.email }),
  }));

  return jsonResponse({ moderators });
}

/**
 * Add a moderator to a tag
 */
export async function addModerator(
  currentUserId: string,
  tagId: number,
  targetUserId: string | null,
  email: string | null,
): Promise<Response> {
  // If email is provided, find user by email
  let finalUserId = targetUserId;
  if (!finalUserId && email) {
    const { data: userByEmail, error: emailError } = await supabase
      .from('User')
      .select('id, user_name, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (emailError || !userByEmail) {
      return errorResponse(`User with email "${email}" not found`, 404);
    }
    finalUserId = userByEmail.id;
  }

  if (!finalUserId) {
    return errorResponse('User ID or email is required');
  }

  // Only global admins can add moderators
  const isAdmin = await isGlobalAdmin(currentUserId);

  if (!isAdmin) {
    return errorResponse('Only admins can add moderators', 403);
  }

  // Verify user exists (only if not already found by email)
  if (targetUserId && !email) {
    const { data: userExists, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('id', finalUserId)
      .single();

    if (userError || !userExists) {
      return errorResponse('User not found', 404);
    }
  }

  // Check if already a moderator
  const { data: existing } = await supabase
    .from('tag_moderators')
    .select('id')
    .eq('tag_id', tagId)
    .eq('user_id', finalUserId)
    .single();

  if (existing) {
    return errorResponse('User is already a moderator for this tag');
  }

  // Insert moderator (always as 'moderator' role)
  const { data, error } = await supabase
    .from('tag_moderators')
    .insert({
      tag_id: tagId,
      user_id: finalUserId,
      role: 'moderator',
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding moderator:', error);
    return errorResponse('Failed to add moderator', 500);
  }

  return jsonResponse({ message: 'Moderator added successfully', moderator: data });
}

/**
 * Remove a moderator from a tag
 */
export async function removeModerator(
  currentUserId: string,
  tagId: number,
  targetUserId: string,
): Promise<Response> {
  // Only global admins can remove moderators
  const isAdmin = await isGlobalAdmin(currentUserId);

  if (!isAdmin) {
    return errorResponse('Only admins can remove moderators', 403);
  }

  // Delete moderator
  const { error } = await supabase
    .from('tag_moderators')
    .delete()
    .eq('tag_id', tagId)
    .eq('user_id', targetUserId);

  if (error) {
    console.error('Error removing moderator:', error);
    return errorResponse('Failed to remove moderator', 500);
  }

  return jsonResponse({ message: 'Moderator removed successfully' });
}
