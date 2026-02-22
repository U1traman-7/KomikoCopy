import { GetServerSidePropsContext } from 'next';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';

// 从请求中获取客户端IP地址，考虑Cloudflare代理
function getClientIPFromRequest(
  req: GetServerSidePropsContext['req'],
): string | null {
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const forwardedIPs = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedIPs.split(',')[0].trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return null;
}

const getPosts = async (
  tag?: number,
  variant?: string,
  req?: GetServerSidePropsContext['req'],
) => {
  const origin = process.env.NEXT_PUBLIC_API_URL;

  // 构建headers，传递客户端IP信息
  const headers: HeadersInit = {};
  if (req) {
    const clientIP = getClientIPFromRequest(req);
    headers['x-client-ip'] = clientIP || '';
    headers['x-forwarded-for'] = clientIP || '';
    headers['x-real-ip'] = clientIP || '';
    headers['x-custom-real-client-ip'] = clientIP || '';
    headers['cookie'] = req.headers.cookie || '';
  }

  const variantParam = variant ? `&variant=${variant}` : '';
  const res = await fetch(
    `${origin}/api/fetchFeed?page=1&sortby=Trending&mainfeedonly=True${
      tag ? `&tag=${tag}` : ''
    }${variantParam}`,
    { headers },
  ).catch();

  const text = await res?.text();
  try {
    const data = JSON.parse(text);
    return data;
  } catch {
    return [];
  }
};

export async function getTagVariantProps(context: GetServerSidePropsContext) {
  const { tag: rawTag, variant } = context.params || {};
  const { req } = context;

  // Decode URL-encoded tag name
  const tag = typeof rawTag === 'string' ? decodeURIComponent(rawTag) : rawTag;

  // Validate variant
  const validVariants = ['fanart', 'oc', 'pfp', 'wallpaper', 'pictures'];
  if (!variant || !validVariants.includes(variant as string)) {
    return {
      notFound: true,
    };
  }

  // If no tag provided, return empty
  if (!tag) {
    return {
      props: {
        tag_id: 0,
        tag_name: '',
        posts: [],
      },
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  try {
    // Fetch tag with extended fields
    const { data: tagResults, error } = await supabase
      .from('tags')
      .select(
        'id, name, is_nsfw, logo_url, header_image, description, follower_count, post_count, popularity, tag_type, i18n',
      )
      .eq('name', tag as string)
      .limit(1);

    const tagData = tagResults?.[0];

    if (error || !tagData) {
      console.error('Tag query error:', error, 'tag:', tag);
      console.error('Available tags query result:', tagResults);

      // For debugging: try to find any tag with similar name
      const { data: debugTags } = await supabase
        .from('tags')
        .select('id, name, post_count')
        .ilike('name', `%${tag}%`)
        .limit(5);
      console.error('Debug - Similar tags found:', debugTags);

      return {
        props: {
          tag_id: 0,
          tag_name: tag || '',
          posts: [],
          debug: {
            searchedTag: tag,
            similarTags: debugTags,
            error: error?.message,
          },
        },
      };
    }

    // Only 'ip', 'descriptor', or high-traffic tags (post_count > 100) have variant pages
    const hasVariantAccess =
      tagData.tag_type === 'ip' ||
      tagData.tag_type === 'descriptor' ||
      tagData.post_count > 100;

    if (!hasVariantAccess) {
      return {
        notFound: true,
      };
    }

    // Parse token early for parallel queries
    let userId: string | null = null;
    try {
      const cookies = parse(req.headers.cookie || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (sessionToken) {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        userId = (token?.id as string) || null;
      }
    } catch {
      // User not authenticated
    }

    // Define async fetchers
    const fetchModerators = async () => {
      try {
        const { data: modData } = await supabase
          .from('tag_moderators')
          .select(
            `
            id,
            user_id,
            role,
            User:user_id (
              user_name,
              image,
              user_uniqid
            )
          `,
          )
          .eq('tag_id', tagData.id);

        if (modData) {
          return modData.map((mod: any) => ({
            id: mod.id,
            user_id: mod.user_id,
            role: mod.role,
            user_name: mod.User?.user_name,
            user_image: mod.User?.image,
            user_uniqid: mod.User?.user_uniqid,
          }));
        }
        return [];
      } catch (e) {
        console.error('Error fetching moderators:', e);
        return [];
      }
    };

    const fetchFollowStatus = async () => {
      if (!userId) return false;
      try {
        const { data: followData } = await supabase
          .from('tag_follows')
          .select('id')
          .eq('user_id', userId)
          .eq('tag_id', tagData.id)
          .single();
        return !!followData;
      } catch {
        return false;
      }
    };

    const fetchPosts = async () => {
      try {
        return await getPosts(tagData.id, variant as string, req);
      } catch (e) {
        console.error(
          'Error fetching posts for tag variant:',
          tagData.id,
          variant,
          e,
        );
        return [];
      }
    };

    // Run all queries in parallel
    const [moderatorsResult, followResult, postsResult] = await Promise.all([
      fetchModerators(),
      fetchFollowStatus(),
      fetchPosts(),
    ]);

    return {
      props: {
        tag_id: tagData.id || 1,
        tag_name: tagData.name || tag || '',
        is_nsfw_tag: tagData.is_nsfw || false,
        logo_url: tagData.logo_url || null,
        header_image: tagData.header_image || null,
        description: tagData.description || null,
        i18n: tagData.i18n || null,
        follower_count: tagData.follower_count || 0,
        post_count: tagData.post_count || 0,
        popularity: tagData.popularity || 100,
        moderators: moderatorsResult,
        posts: postsResult,
        is_following: followResult,
      },
    };
  } catch (e) {
    console.error('Error in getTagVariantProps:', e);
    return {
      props: {
        tag_id: 0,
        tag_name: tag || '',
        posts: [],
      },
    };
  }
}
