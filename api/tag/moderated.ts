/**
 * GET /api/tag/user-mod-tags
 * Get tags that a user is moderating
 * Query params:
 *   - userId: user ID (string) - required
 *   - userUniqid: user unique ID (string) - alternative to userId
 */
import { supabase, jsonResponse, errorResponse } from './_handlers/utils.js';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    console.log(userId)
    // Get tags that this user is moderating
    const { data: modTags, error } = await supabase
      .from('tag_moderators')
      .select(`
        id,
        role,
        created_at,
        tags:tag_id (
          id,
          name,
          logo_url,
          is_nsfw
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log(modTags)

    if (error) {
      console.error('Error fetching user mod tags:', error);
      return errorResponse('Failed to fetch mod tags', 500);
    }

    // Transform and filter out null tags
    const tags = (modTags || [])
      .filter((mod: any) => mod.tags)
      .map((mod: any) => ({
        id: mod.tags.id,
        name: mod.tags.name,
        logo_url: mod.tags.logo_url,
        is_nsfw: mod.tags.is_nsfw,
        role: mod.role,
        moderator_since: mod.created_at,
      }));

    return jsonResponse({ tags });
  } catch (error) {
    console.error('User mod tags error:', error);
    return errorResponse('Internal server error', 500);
  }
}
