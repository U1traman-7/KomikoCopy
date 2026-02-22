/**
 * GET /api/explore/character-variants
 *
 * 获取官方 Characters 及其衍生页面列表（带随机性）
 * 用于 MoreAITools 组件的推荐数据源
 *
 * 注意：此 API 用于公开展示区域，强制过滤所有 NSFW 内容，不依赖用户 Cookie
 *
 * Query Parameters:
 *   - limit: 返回 Character 数量限制，默认 100，最大 200
 *   - variants: 衍生类型，逗号分隔，默认 'fanart,pfp,pictures,wallpaper,oc'
 *
 * Response:
 *   {
 *     code: 1,
 *     message: 'success',
 *     data: [
 *       {
 *         character_id: string,
 *         character_name: string,
 *         character_pfp: string | null,
 *         is_nsfw: boolean,
 *         variants: [
 *           { type: string, url: string }
 *         ]
 *       }
 *     ]
 *   }
 */
import { createSupabase, success, failed } from '../_utils/index.js';
import { shuffleArray } from '../_utils/array.js';
import withHandler from '../_utils/withHandler.js';

// 支持的衍生页面类型
const VARIANT_TYPES = ['fanart', 'pfp', 'pictures', 'wallpaper', 'oc'] as const;
type VariantType = (typeof VARIANT_TYPES)[number];

// 最大和默认限制
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;
// 查询池倍数：从更大的池中随机选择，增加多样性
const POOL_MULTIPLIER = 3;

const handler = async (request: Request) => {
  try {
    const supabase = createSupabase();
    const url = new URL(request.url);

    // 解析 limit 参数
    let limit = parseInt(
      url.searchParams.get('limit') || String(DEFAULT_LIMIT),
    );
    if (isNaN(limit) || limit < 1) {
      limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    // 解析 variants 参数，过滤出有效的类型
    const variantsParam =
      url.searchParams.get('variants') || VARIANT_TYPES.join(',');
    const requestedVariants = variantsParam
      .split(',')
      .map(v => v.trim().toLowerCase())
      .filter((v): v is VariantType =>
        VARIANT_TYPES.includes(v as VariantType),
      );

    // 如果没有有效的 variants，使用默认值
    const variants =
      requestedVariants.length > 0 ? requestedVariants : [...VARIANT_TYPES];

    // 查询更大的池以增加随机性
    const poolSize = Math.min(limit * POOL_MULTIPLIER, 500);

    // 构建查询：获取官方且激活的 Characters
    // 注意：强制过滤 NSFW 内容，此 API 用于公开展示区域
    // 不指定 .order()：结果会被 shuffleArray 随机打乱，排序无意义
    // 原先使用 .order('popularity') 但该列不存在；后改为 created_at 也非本意
    const { data: characters, error } = await supabase
      .from('CustomCharacters')
      .select(
        'character_uniqid, character_name, character_pfp, is_nsfw',
      )
      .eq('is_official', true)
      .eq('is_active', true)
      .eq('is_nsfw', false) // 强制只返回 SFW 内容
      .limit(poolSize);

    if (error) {
      console.error('Error fetching character variants:', error);
      return failed('Failed to fetch character variants');
    }

    // 随机打乱结果，然后取前 limit 个
    const shuffledCharacters = shuffleArray(characters || []).slice(0, limit);

    // 为每个 Character 生成衍生页面数据
    const characterVariants = shuffledCharacters.map(char => ({
      character_id: char.character_uniqid,
      character_name: char.character_name,
      character_pfp: char.character_pfp,
      is_nsfw: char.is_nsfw,
      variants: variants.map(variantType => ({
        type: variantType,
        // URL 编码 character_id 以处理特殊字符
        url: `/character/${encodeURIComponent(char.character_uniqid)}/${variantType}`,
      })),
    }));

    return success(characterVariants);
  } catch (error) {
    console.error('Unexpected error in character-variants:', error);
    return failed('Internal server error');
  }
};

export const GET = withHandler(handler);
