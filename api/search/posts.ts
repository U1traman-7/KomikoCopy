import { createSupabase, failed, success } from '../_utils/index.js';
import { waitUntil } from '@vercel/functions';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { Post, postProcessPosts } from '../fetchFeed.js';

export async function GET(request: Request) {
  try {
    const supabase = createSupabase();
    const url = new URL(request.url);

    const searchQuery = url.searchParams.get('q') || '';
    const sortBy = url.searchParams.get('sort') || 'newest';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const mediaType = url.searchParams.get('mediaType') || '';
    const mode = url.searchParams.get('mode') || ''; // 'sfw' or 'nsfw'
    const offset = (page - 1) * limit;

    if (!searchQuery || !searchQuery.trim()) {
      return success({ posts: [], total: 0, page, limit });
    }

    let authUserId = '';
    const cookies = parse(request.headers.get('cookie') || '');
    const sessionToken = cookies['next-auth.session-token'];
    if (sessionToken) {
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (token?.id && typeof token.id === 'string') {
        authUserId = token.id;
      }
    }

    // Validate mode parameter - only allow nsfw mode if user has permission
    const hasNsfwPermission = cookies['relax_content'] === 'true';
    const contentMode =
      mode === 'nsfw' && hasNsfwPermission
        ? 'nsfw'
        : mode === 'sfw'
          ? 'sfw'
          : null;

    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery && trimmedQuery.length <= 20) {
      waitUntil(
        (async () => {
          try {
            const { error } = await supabase.rpc('record_search_term', {
              p_term: trimmedQuery,
            });
            if (error) {
              console.error('Failed to record search term:', error);
            }
          } catch (err) {
            console.error('Error in record_search_term:', err);
          }
        })(),
      );
    }

    const { data: searchResults, error: searchError } = await supabase.rpc(
      'search_posts',
      {
        search_term: trimmedQuery,
        sort_by: sortBy,
        media_type_filter: mediaType || null,
        page_limit: limit,
        page_offset: offset,
        content_mode: contentMode,
      },
    );

    if (searchError) {
      console.error('[API /search/posts] Search RPC error:', searchError);
      return failed('Failed to search posts');
    }

    if (!searchResults || searchResults.length === 0) {
      return success({ posts: [], total: 0, page, limit });
    }

    // Fetch post_tags for the search results
    const postIds = searchResults.map((post: any) => post.id);
    const { data: postTagsData } = await supabase
      .from('post_tags')
      .select('post_id, tags(id, name, logo_url, i18n)')
      .in('post_id', postIds);

    // Map post_tags to posts
    const postTagsMap: { [key: number]: any[] } = {};
    if (postTagsData) {
      for (const item of postTagsData) {
        if (!postTagsMap[item.post_id]) {
          postTagsMap[item.post_id] = [];
        }
        postTagsMap[item.post_id].push(item);
      }
    }

    // Add post_tags to search results
    const postsWithTags = searchResults.map((post: any) => ({
      ...post,
      post_tags: postTagsMap[post.id] || [],
    }));

    const posts = await postProcessPosts(postsWithTags as Post[], authUserId);

    let total = posts.length;

    const { data: countResult } = await supabase.rpc('count_search_posts', {
      search_term: trimmedQuery,
      media_type_filter: mediaType || null,
      content_mode: contentMode,
    });
    if (countResult) {
      total = countResult;
    }

    return success({ posts, total, page, limit });
  } catch (error) {
    console.error('[API /search/posts] Unexpected error:', error);
    return failed(
      `Internal server error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
