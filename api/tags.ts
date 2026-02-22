import { createSupabase, success, failed } from './_utils/index.js';
import withHandler from './_utils/withHandler.js';
import geoip from 'geoip-lite';
import { parse } from 'cookie';
import {
  isCharacterTag,
  normalizeTagNameForLookup,
  sanitizeTagDisplayName,
} from './tag/_handlers/utils.js';

// 获取客户端IP地址，考虑Cloudflare代理
function getClientIP(request: Request): string | null {
  // Cloudflare会通过CF-Connecting-IP传递真实IP
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 备用方案：x-forwarded-for（第一个IP是真实IP）
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 最后尝试x-real-ip
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}

// 检查是否为中国的IP地址
function isChinaIP(ip: string | null): boolean {
  if (!ip) {
    return false;
  }

  try {
    const geo = geoip.lookup(ip);
    console.log('geo', geo, ip);
    return geo?.country === 'CN';
  } catch (error) {
    console.error('Error looking up IP:', error);
    return false;
  }
}

type TagMetaInfo = {
  tagId: number;
  originalName: string;
  normalizedName: string | null;
  displayName: string | null;
  displayNameLower: string | null;
};

const fetchCharacterLogos = async (
  supabase: ReturnType<typeof createSupabase>,
  tagMetas: TagMetaInfo[],
) => {
  const logoMap: Record<string, string> = {};

  const normalizedNames = Array.from(
    new Set(
      tagMetas
        .map(meta => meta.normalizedName)
        .filter((name): name is string => !!name),
    ),
  );

  if (normalizedNames.length > 0) {
    const { data, error } = await supabase
      .from('CustomCharacters')
      .select('character_uniqid, character_pfp')
      .in('character_uniqid', normalizedNames);

    if (error) {
      console.error('Error fetching character logos for tags:', error);
    } else {
      for (const meta of tagMetas) {
        if (!meta.normalizedName || logoMap[meta.originalName]) {
          continue;
        }
        const match = data?.find(
          row =>
            row.character_uniqid &&
            row.character_uniqid.toLowerCase() === meta.normalizedName,
        );
        if (match?.character_pfp) {
          logoMap[meta.originalName] = match.character_pfp;
        }
      }
    }
  }

  return logoMap;
};

const attachTagLogos = async (
  supabase: ReturnType<typeof createSupabase>,
  tagList: any[],
) => {
  // Only process character tags that don't have a logo_url set
  // Regular tags (like #Ship, #Furry) should have logo set by moderators
  const tagsNeedingLogo = tagList.filter(
    tag => !tag.logo_url && tag.name && isCharacterTag(tag.name),
  );

  if (tagsNeedingLogo.length === 0) {
    return tagList;
  }

  const tagMetas: TagMetaInfo[] = tagsNeedingLogo
    .map(tag => {
      const originalName = tag?.name;
      const tagId = tag?.id;
      if (!originalName || !tagId) {
        return null;
      }
      const displayName = sanitizeTagDisplayName(originalName);
      return {
        tagId,
        originalName,
        normalizedName: normalizeTagNameForLookup(originalName),
        displayName,
        displayNameLower: displayName?.toLowerCase() || null,
      } as TagMetaInfo;
    })
    .filter((meta): meta is TagMetaInfo => !!meta);

  if (!tagMetas.length) {
    return tagList;
  }

  // Fetch character logos for tags that don't have a custom logo (real-time)
  const logoMap = await fetchCharacterLogos(supabase, tagMetas);

  // Priority: tags.logo_url (from DB) > character image (from CustomCharacters)
  return tagList.map(tag => ({
    ...tag,
    // Keep existing logo_url if set, otherwise use character logo
    logo_url: tag?.logo_url || (tag?.name ? logoMap[tag.name] || null : null),
  }));
};

export const handler = async (request: Request) => {
  const supabase = createSupabase();
  const url = new URL(request.url);
  const searchText = url.searchParams.get('search_text');
  const random = url.searchParams.get('random') === 'true';
  const current = parseInt(url.searchParams.get('current') || '0');
  const size = parseInt(url.searchParams.get('size') || '20');
  const ids = url.searchParams.get('include_ids');
  const tagsParams = url.searchParams.get('include_tags');
  const mode = url.searchParams.get('mode') || ''; // 'nsfw' or 'sfw'
  const sortBy = url.searchParams.get('sort_by') || ''; // 'popularity' - skip preset_order and sort by popularity only

  // Check NSFW permission from cookie
  const cookies = parse(request.headers.get('cookie') || '');
  const hasNsfwPermission = cookies['relax_content'] === 'true';
  const isNsfwMode = mode === 'nsfw' && hasNsfwPermission;

  try {
    const idsArray = ids ? ids.split(',').map(id => parseInt(id)) : [];
    const tagArray = tagsParams ? tagsParams.split(',').map(tag => tag) : [];

    let presetOrderTags: any[] = [];
    // 首先获取指定的ids对应的tags
    let requiredTags: any[] = [];
    // Extended fields for tag sub-community feature
    // pinned_order: tags with pinned_order > 0 will be shown after the separator, regardless of user subscription
    const tagSelectFields =
      'id, name, popularity, preset_order, logo_url, header_image, description, follower_count, post_count, is_nsfw, pinned_order, allow_media_types, cta_text_translation, i18n';

    // When sort_by=popularity, skip preset_order logic and return tags sorted by popularity only
    const sortByPopularity = sortBy === 'popularity';

    if (!searchText && !sortByPopularity) {
      const { data: presetOrderData, error: preset_orderError } = await supabase
        .from('tags')
        .select(tagSelectFields)
        .gt('preset_order', 0)
        .order('preset_order', { ascending: false });

      if (!preset_orderError) {
        presetOrderTags = presetOrderData || [];
      } else {
        console.error('Error fetching preset_order tags:', preset_orderError);
      }
    }

    // Helper to merge tags without duplicates
    const mergeTags = (target: any[], source: any[]) => {
      for (const tag of source) {
        if (!target.find(t => t.id === tag.id)) {
          target.push(tag);
        }
      }
    };

    if (idsArray.length > 0) {
      const { data: requiredData, error: requiredError } = await supabase
        .from('tags')
        .select(tagSelectFields)
        .in('id', idsArray);

      if (requiredError) {
        console.error('Error fetching required tags:', requiredError);
        return failed('Failed to fetch required tags');
      }
      requiredTags = [...(requiredData || [])];
      mergeTags(requiredTags, presetOrderTags);
    } else {
      requiredTags = [...presetOrderTags];
    }

    if (tagArray.length > 0) {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select(tagSelectFields)
        .in('name', tagArray);

      if (tagError) {
        console.error('Error fetching tags:', tagError);
        return failed('Failed to fetch tags');
      }
      requiredTags = [...(tagData || []), ...requiredTags];
      mergeTags(requiredTags, presetOrderTags);
    }

    // 构建主查询
    let query = supabase.from('tags').select(tagSelectFields);

    // 如果没有任何筛选条件，则只返回热度大于0的标签
    // 但如果 sort_by=popularity，则返回所有 popularity > 0 的标签
    if (idsArray.length <= 0 && tagArray.length <= 0 && !searchText) {
      if (sortByPopularity) {
        query = query.gt('popularity', 0);
      } else {
        query = query.gt('preset_order', 0);
      }
    }

    if (searchText) {
      query = query.ilike('name', `%${searchText}%`);
    }

    // NSFW 过滤逻辑：
    // - 有搜索词时：返回所有匹配的 tags（不过滤 NSFW，让用户能搜到 NSFW tag）
    // - 无搜索词时：根据 isNsfwMode 过滤
    if (!searchText) {
      if (isNsfwMode) {
        query = query.eq('is_nsfw', true);
      } else {
        query = query.eq('is_nsfw', false);
      }
    }
    // 当有 searchText 时，不添加 is_nsfw 过滤，返回所有匹配的 tags

    // 如果是随机获取
    if (random) {
      query = query.order('random()', { ascending: true });
    } else {
      query = query.order('popularity', { ascending: false });
    }

    // 排除已经包含的ids，避免重复
    if (idsArray.length > 0) {
      query = query.not('id', 'in', `(${idsArray.join(',')})`);
    }

    if (tagArray.length > 0) {
      query = query.not('name', 'in', `(${tagArray.join(',')})`);
    }

    // 计算分页偏移量
    const offset = current;
    query = query.range(offset, offset + size - 1);

    const { data: tags, error } = await query;

    if (error) {
      console.error('Error fetching tags:', error);
      return failed('Failed to fetch tags');
    }

    // Merge results: required tags first, then query results
    const allTags = [...requiredTags];
    mergeTags(allTags, tags || []);

    // 如果是中国用户，过滤掉NSFW标签（id为2）
    const clientIP = getClientIP(request);
    const isChina = isChinaIP(clientIP);
    const filteredTags = isChina
      ? allTags.filter(tag => tag.id !== 2)
      : allTags;

    const tagsWithLogos = await attachTagLogos(supabase, filteredTags);

    return success(tagsWithLogos);
  } catch (error) {
    console.error('Unexpected error:', error);
    return failed('Internal server error');
  }
};

export const GET = withHandler(handler);
