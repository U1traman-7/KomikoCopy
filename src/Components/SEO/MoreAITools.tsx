import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { ToolItem, aiTools } from '../../constants';
import { Link, Button } from '@nextui-org/react';
import { ToolCard } from '../../pages';
import { templateDataManager } from '../../utils/templateCache';
import { resolveTemplateName } from '../../utils/resolveTemplateName';

// 根据窗口宽度计算 grid 列数
const useGridColumns = () => {
  const [columns, setColumns] = useState(6);

  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        return 6;
      } // xl
      if (width >= 1024) {
        return 5;
      } // lg
      if (width >= 768) {
        return 4;
      } // md
      if (width >= 640) {
        return 3;
      } // sm
      return 2; // default
    };

    const handleResize = () => {
      setColumns(calculateColumns());
    };

    // 初始计算
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columns;
};

// 根据列数计算显示数量（20 或 24，选择能整除的）
const getDisplayCount = (columns: number): number => {
  // 优先选择 24，如果不能整除则选 20
  if (24 % columns === 0) {
    return 24;
  }
  if (20 % columns === 0) {
    return 20;
  }
  // 兜底：选择最接近 20-24 且能整除的数
  for (let count = 24; count >= 18; count--) {
    if (count % columns === 0) {
      return count;
    }
  }
  return 20;
};

// ============================================
// 类型定义
// ============================================

// API 返回的 Tag 数据结构
interface TagItem {
  id: number;
  name: string;
  post_count: number;
  logo_url?: string;
  popularity?: number;
  is_nsfw?: boolean;
}

// API 返回的 Character 衍生类型
interface CharacterVariant {
  type: string;
  url: string;
}

// API 返回的 Character 数据结构
interface CharacterItem {
  character_id: string;
  character_name: string;
  character_pfp?: string;
  is_nsfw?: boolean;
  variants: CharacterVariant[];
}

// Effect 模板数据结构
interface EffectTemplate {
  id: string;
  urlSlug: string;
  displayName: string;
  type: string;
  name_key: string;
  display_url?: string;
  is_trending?: boolean;
  i18n?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  } | null;
}

// 统一的 Link Item 结构（用于合并四个数据源）
interface LinkItem {
  id: number;
  path: string;
  title: string;
  title_key?: string;
  image_url?: string;
  source: 'ai_tool' | 'tag' | 'character' | 'effect';
  derivative?: boolean;
  is_nsfw?: boolean; // 用于 NSFW 过滤
  i18n?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  } | null;
}

// ============================================
// 简化卡片组件 - 用于衍生工具、Tag、Character 和 Effect 展示
// ============================================

/**
 * 将字符串转换为 Title Case（首字母大写）
 */
const toTitleCase = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * 统一尺寸的简化卡片，用于展示衍生工具和 Tag
 * - 固定尺寸确保所有方块大小一致
 * - 文字居中显示
 * - Tag 类型显示为 "${Tag} AI" 格式
 */
const SimpleToolCard = ({
  item,
  t,
}: {
  item: LinkItem;
  t: (key: string) => string; // eslint-disable-line no-unused-vars
}) => {
  // 根据 source 类型决定显示文本
  const displayText = (() => {
    if (item.source === 'tag') {
      // Tag 类型显示为 "${Tag} AI" 格式，Tag 名称首字母大写
      return `${toTitleCase(item.title)} AI`;
    }
    if (item.source === 'effect') {
      // Effect 类型：优先使用 resolveTemplateName 进行 i18n，然后加上 "AI" 后缀
      // 确保 title_key 是字符串类型
      const nameKey = typeof item.title_key === 'string' ? item.title_key : '';
      const baseName = nameKey
        ? resolveTemplateName(t, nameKey, item.title, item.i18n)
        : item.title;
      return `${baseName} AI`;
    }
    // 工具类型和 Character 类型：使用 title_key 翻译或直接使用 title
    return item.title_key ? t(item.title_key) : item.title;
  })();

  return (
    <a href={item.path} title={displayText} rel='dofollow' className='block'>
      <div className='w-full aspect-[4/3] flex items-center justify-center p-2 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer'>
        <span className='text-xs sm:text-sm font-bold text-foreground text-center break-all leading-snug [overflow-wrap:anywhere] [hyphens:auto]'>
          {displayText}
        </span>
      </div>
    </a>
  );
};

// ============================================
// 辅助函数
// ============================================

/**
 * 判断当前页面是否为 Character 页面
 */
function isCharacterPage(pathname: string): boolean {
  return pathname.startsWith('/character/');
}

/**
 * 判断当前页面是否为 Tag 页面
 */
function isTagPage(pathname: string): boolean {
  return pathname.startsWith('/tags/');
}

/**
 * 判断当前页面是否为 Effect 页面
 */
function isEffectPage(pathname: string): boolean {
  return pathname.startsWith('/effects/');
}

/**
 * 从路径中提取 Character ID
 * @param pathname 路径，如 /character/Ganyu_(Genshin_Impact)/fanart
 * @returns Character ID，如 Ganyu_(Genshin_Impact)，未找到返回 null
 */
function extractCharacterIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/character\/([^/]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * 从路径中提取 Tag 名称
 * @param pathname 路径，如 /tags/yuri
 * @returns Tag 名称，如 yuri，未找到返回 null
 */
function extractTagNameFromPath(pathname: string): string | null {
  const match = pathname.match(/\/tags\/([^/?#]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * 从路径中提取 Effect slug
 * @param pathname 路径，如 /effects/3d-cartoon-video
 * @returns Effect slug，如 3d-cartoon-video，未找到返回 null
 */
function extractEffectSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/\/effects\/([^/?#]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * 生成唯一 ID（用于 Character 衍生页面）
 * 使用 character_id 的 hash 加上 variant 类型的 index
 */
function generateCharacterVariantId(
  characterId: string,
  variantType: string,
): number {
  // 简单的字符串哈希
  let hash = 0;
  const str = `${characterId}-${variantType}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  // 使用无符号右移确保为正数，避免 Math.abs() 导致的哈希冲突
  // （例如 hash=100 和 hash=-100 经过 Math.abs 会变成相同的值）
  // >>> 0 将有符号 32 位整数转换为无符号整数
  return (hash >>> 0) + 200000;
}

/**
 * 生成唯一 ID（用于 Effect 模板页面）
 * 使用 template.id 的 hash 确保稳定性
 */
function generateEffectId(templateId: string): number {
  let hash = 0;
  for (let i = 0; i < templateId.length; i++) {
    hash = (hash << 5) - hash + templateId.charCodeAt(i);
    hash &= hash; // Convert to 32bit integer
  }
  return (hash >>> 0) + 300000;
}

// ============================================
// 主组件
// ============================================

export const MoreAITools = ({ category }: { category: string }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const gridColumns = useGridColumns();
  const displayCount = getDisplayCount(gridColumns);

  // 新数据源状态
  const [tags, setTags] = useState<TagItem[]>([]);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [effects, setEffects] = useState<EffectTemplate[]>([]);

  // 客户端渲染标记
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 获取新数据源（Tags 和 Characters）
  useEffect(() => {
    if (!isClient) {
      return;
    }

    const fetchAdditionalData = async () => {
      try {
        // 并行请求两个 API 和加载模板数据
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        const [tagsRes, charsRes, /* loadAllData 仅填充缓存，无需返回值 */ _] =
          await Promise.all([
            fetch('/api/explore/popular-tags?limit=200').catch(() => null),
            fetch('/api/explore/character-variants?limit=100').catch(
              () => null,
            ),
            templateDataManager.loadAllData().catch(() => null),
          ]);

        // 处理 Tags 响应
        if (tagsRes && tagsRes.ok) {
          try {
            const tagsData = await tagsRes.json();
            if (tagsData.code === 1 && Array.isArray(tagsData.data)) {
              setTags(tagsData.data);
            }
          } catch (e) {
            console.error('Failed to parse tags response:', e);
          }
        }

        // 处理 Characters 响应
        if (charsRes && charsRes.ok) {
          try {
            const charsData = await charsRes.json();
            if (charsData.code === 1 && Array.isArray(charsData.data)) {
              setCharacters(charsData.data);
            }
          } catch (e) {
            console.error('Failed to parse characters response:', e);
          }
        }

        // 处理 Effect 模板
        try {
          const allTemplates = templateDataManager.getAllTemplates();
          if (allTemplates && Array.isArray(allTemplates)) {
            // 从所有分类中提取模板，展平成一维数组
            const flatTemplates: EffectTemplate[] = [];
            allTemplates.forEach((templateCategory: any) => {
              if (
                templateCategory.templates &&
                Array.isArray(templateCategory.templates)
              ) {
                templateCategory.templates.forEach((template: any) => {
                  if (template.urlSlug && template.displayName) {
                    flatTemplates.push({
                      id: template.id,
                      urlSlug: template.urlSlug,
                      displayName: template.displayName,
                      type: template.type,
                      name_key: template.name_key,
                      display_url: template.display_url,
                      is_trending: template.is_trending,
                      i18n: template.i18n,
                    });
                  }
                });
              }
            });
            setEffects(flatTemplates);
          }
        } catch (e) {
          console.error('Failed to load effect templates:', e);
        }
      } catch (error) {
        // 降级处理：API 失败不影响现有 AI Tools 展示
        console.error('Failed to fetch additional data:', error);
      }
    };

    fetchAdditionalData();
  }, [isClient]);

  // 获取指定 category 的工具集（保持原有逻辑）
  const categoryToolSets = useMemo(
    () => aiTools.filter(toolSet => toolSet.category === category),
    [category],
  );

  /**
   * 将所有数据源转换为统一的 LinkItem 数组
   */
  const convertToLinkItems = (): LinkItem[] => {
    const items: LinkItem[] = [];

    // 1. 添加 AI Tools（仅衍生工具）- 保持原有逻辑
    categoryToolSets.forEach(toolSet => {
      toolSet.entries
        .filter(tool => tool.derivative)
        .forEach(tool => {
          items.push({
            id: tool.id,
            path: tool.path,
            title: tool.title,
            title_key: tool.title_key,
            image_url: tool.image_url,
            source: 'ai_tool',
            derivative: true,
          });
        });
    });

    // 2. 添加 Tags（ID 偏移 100000 避免冲突）
    tags.forEach(tag => {
      items.push({
        id: tag.id + 100000,
        path: `/tags/${encodeURIComponent(tag.name)}`,
        title: tag.name,
        title_key: undefined, // Tags 没有 i18n key，直接使用 title
        image_url: tag.logo_url || undefined,
        source: 'tag',
        derivative: true,
        is_nsfw: tag.is_nsfw, // 传递 NSFW 标记用于前端过滤
      });
    });

    // 3. 添加 Character 衍生页面
    characters.forEach(char => {
      char.variants.forEach(variant => {
        items.push({
          id: generateCharacterVariantId(char.character_id, variant.type),
          path: variant.url,
          title: `${char.character_name} ${variant.type}`,
          title_key: undefined, // Character 衍生页面没有 i18n key
          image_url: char.character_pfp || undefined,
          source: 'character',
          derivative: true,
          is_nsfw: char.is_nsfw, // 传递 NSFW 标记用于前端过滤
        });
      });
    });

    // 4. 添加 Effect 模板页面（使用模板 ID 的哈希确保稳定性）
    effects.forEach(template => {
      // 确保 name_key 是字符串类型
      const nameKey =
        typeof template.name_key === 'string' ? template.name_key : undefined;
      items.push({
        id: generateEffectId(template.id),
        path: `/effects/${template.urlSlug}`,
        title: template.displayName,
        title_key: nameKey, // 模板有 name_key 可以用于 i18n
        image_url: template.display_url || undefined,
        source: 'effect',
        derivative: true,
        is_nsfw: false, // Effect 模板没有 NSFW 标记，默认为 false
        i18n: template.i18n, // 传递 i18n 数据用于多语言支持
      });
    });

    return items;
  };

  /**
   * 对衍生工具进行页面特定的随机化
   * 保持原有的确定性随机化逻辑，扩展为支持 LinkItem
   */
  const getShuffledDerivativeItems = (): LinkItem[] => {
    const allItems = convertToLinkItems();

    // 如果没有任何项目，返回空数组
    if (allItems.length === 0) {
      return [];
    }

    const today = new Date().toDateString();
    const fullPath = router.asPath || router.pathname;

    // 生成确定性种子（保持原有逻辑）
    const pathSeed = fullPath
      ? fullPath.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
      : 0;
    const dateSeed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const hourSeed = new Date().getHours();
    const pathLengthSeed = fullPath.length * 31;
    const baseSeed = dateSeed + pathSeed + hourSeed + pathLengthSeed;

    // 过滤函数：排除 NSFW 相关的项目
    // 双重保护：1. 检查 is_nsfw 字段 2. 检查标题关键词
    const isNSFWItem = (item: LinkItem): boolean => {
      // 如果数据源标记为 NSFW，直接过滤
      if (item.is_nsfw === true) {
        return true;
      }
      // 关键词过滤作为额外保护
      const title =
        typeof item.title === 'string' ? item.title.toLowerCase() : '';
      const path = typeof item.path === 'string' ? item.path.toLowerCase() : '';
      const nsfwKeywords = [
        'nsfw',
        'porn',
        'erotic',
        'adult',
        'nude',
        'hentai',
        'xxx',
        'sex',
      ];
      return nsfwKeywords.some(
        keyword => title.includes(keyword) || path.includes(keyword),
      );
    };

    // 强制过滤所有 NSFW 项目 - 此区域不允许任何 NSFW 内容
    const filteredItems = allItems.filter(item => !isNSFWItem(item));

    const shuffled = [...filteredItems];

    // 首先用多重哈希预排序（保持原有算法）
    shuffled.sort((a, b) => {
      const aHash1 = (baseSeed + a.id * 9301 + 49297) % 233280;
      const bHash1 = (baseSeed + b.id * 9301 + 49297) % 233280;
      const aHash2 = (baseSeed * 7 + a.id * 1619 + 31397) % 179424;
      const bHash2 = (baseSeed * 7 + b.id * 1619 + 31397) % 179424;
      const aHash3 = (baseSeed * 13 + a.id * 4001 + 15485) % 312459;
      const bHash3 = (baseSeed * 13 + b.id * 4001 + 15485) % 312459;
      const aHash4 = (baseSeed * 23 + a.id * 8191 + 65537) % 524287;
      const bHash4 = (baseSeed * 23 + b.id * 8191 + 65537) % 524287;

      const aFinal = (aHash1 + aHash2 + aHash3 + aHash4) % 10000000;
      const bFinal = (bHash1 + bHash2 + bHash3 + bHash4) % 10000000;
      return aFinal - bFinal;
    });

    // 再用改进的 Fisher-Yates 洗牌进一步增强随机性（保持原有算法）
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomSeed = (baseSeed + i * 2971 + 14741) % 2147483647;
      const j = randomSeed % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 扩展的过滤逻辑
    const currentPath = router.asPath || router.pathname;
    const currentCharId = extractCharacterIdFromPath(currentPath);
    const currentTagName = extractTagNameFromPath(currentPath);
    const currentEffectSlug = extractEffectSlugFromPath(currentPath);
    const isCharPage = isCharacterPage(currentPath);
    const isTagPageFlag = isTagPage(currentPath);
    const isEffectPageFlag = isEffectPage(currentPath);

    const finalItems = shuffled.filter(item => {
      // 1. 排除完全相同的路径（保持原有逻辑）
      if (item.path === currentPath) {
        return false;
      }

      // 2. Character 页面：排除同 Character 的所有 variants
      if (isCharPage && currentCharId && item.source === 'character') {
        const itemCharId = extractCharacterIdFromPath(item.path);
        if (itemCharId && itemCharId === currentCharId) {
          return false;
        }
      }

      // 3. Tag 页面：排除同 Tag 的链接
      if (isTagPageFlag && currentTagName && item.source === 'tag') {
        // 比较 tag 名称（忽略大小写），防御 item.title 非字符串
        const itemTitle =
          typeof item.title === 'string' ? item.title.toLowerCase() : '';
        if (itemTitle === currentTagName.toLowerCase()) {
          return false;
        }
      }

      // 4. Effect 页面：排除当前 Effect 的链接
      if (isEffectPageFlag && currentEffectSlug && item.source === 'effect') {
        const itemEffectSlug = extractEffectSlugFromPath(item.path);
        if (itemEffectSlug && itemEffectSlug === currentEffectSlug) {
          return false;
        }
      }

      return true;
    });

    // 平衡四种数据源的比例（AI Tool 50%，Tag/Character/Effect 各约 15%）
    const aiToolItems = finalItems.filter(item => item.source === 'ai_tool');
    const tagItems = finalItems.filter(item => item.source === 'tag');
    const characterItems = finalItems.filter(
      item => item.source === 'character',
    );
    const effectItems = finalItems.filter(item => item.source === 'effect');

    // 计算各类型应该取的数量
    // AI Tool 50%（20个），Tag/Character/Effect 各 15%（6个），剩余由补充逻辑填充
    const targetCount = 40; // 返回足够多的项目
    const aiToolCount = Math.ceil(targetCount * 0.5); // AI Tool 占 50% = 20
    const otherCount = Math.floor((targetCount - aiToolCount) / 3); // 剩余 50% 平分 = 6

    // 从每种类型中取相应数量
    const selectedAiTools = aiToolItems.slice(0, aiToolCount);
    const selectedTags = tagItems.slice(0, otherCount);
    const selectedCharacters = characterItems.slice(0, otherCount);
    const selectedEffects = effectItems.slice(0, otherCount);

    // 合并所有类型
    let balancedItems = [
      ...selectedAiTools,
      ...selectedTags,
      ...selectedCharacters,
      ...selectedEffects,
    ];

    // 如果总数不足目标数量，用剩余项目补充（保持随机性）
    if (balancedItems.length < targetCount) {
      const usedIds = new Set(balancedItems.map(item => item.id));
      const remainingItems = finalItems.filter(item => !usedIds.has(item.id));
      const needed = targetCount - balancedItems.length;
      balancedItems = [...balancedItems, ...remainingItems.slice(0, needed)];
    }

    // 对合并后的结果再次洗牌，确保混合显示
    for (let i = balancedItems.length - 1; i > 0; i--) {
      const randomSeed = (baseSeed + i * 1237 + 56789) % 2147483647;
      const j = randomSeed % (i + 1);
      [balancedItems[i], balancedItems[j]] = [
        balancedItems[j],
        balancedItems[i],
      ];
    }

    return balancedItems;
  };

  // 服务端不渲染
  if (!isClient) {
    return null;
  }

  const shuffledItems = getShuffledDerivativeItems();

  return (
    <section className='flex flex-col items-center w-full'>
      <h2 className='text-xl md:text-3xl font-bold text-center text-heading'>
        {t('result_card.more_ai_tools.title')}
      </h2>
      <p className='max-w-3xl mb-6 text-center text-muted-foreground text-md'>
        {t('result_card.more_ai_tools.description')}
      </p>

      {/* 有图片的工具 (非衍生工具) - 保持原有渲染 */}
      <div className='mb-4 md:mb-6 w-full px-2 sm:px-4'>
        {categoryToolSets.map((toolSet, idx) => (
          <div key={`toolset-${idx}`} className='w-full'>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mx-auto max-w-6xl'>
              {toolSet.entries
                .filter(tool => !tool.derivative)
                .map((tool: ToolItem) => (
                  <ToolCard key={`with-image-${tool.id}`} tool={tool} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* 衍生工具和 Tags - 混合显示，Tag 带 # 前缀，根据屏幕宽度显示整数行 */}
      {shuffledItems.length > 0 && (
        <div className='mb-4 md:mb-6 w-full px-2 sm:px-4'>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mx-auto max-w-6xl'>
            {shuffledItems.slice(0, displayCount).map((item: LinkItem) => (
              <SimpleToolCard
                key={`${item.source}-${item.id}`}
                item={item}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      <div className='mt-2'>
        <Link href='/ai-apps'>
          <Button
            variant='flat'
            radius='lg'
            color='primary'
            className='px-10 transform transition-all duration-300 hover:scale-[1.02]'
            size='lg'>
            {t('result_card.more_ai_tools.view_more')}
          </Button>
        </Link>
      </div>
    </section>
  );
};
