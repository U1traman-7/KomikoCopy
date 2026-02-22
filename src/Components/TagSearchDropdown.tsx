import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
  useMemo,
} from 'react';
import { Input, Button, Spinner } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { IconSearch, IconX } from '@tabler/icons-react';

interface Tag {
  id: number;
  name: string;
  popularity: number;
  logo_url?: string | null;
  is_nsfw?: boolean;
}

interface TagSearchDropdownProps {
  className?: string;
  placeholder?: string;
  maxRows?: number; // 最大显示行数，默认 3
}

// 安全的 useLayoutEffect，在 SSR 时使用 useEffect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const TagSearchDropdown: React.FC<TagSearchDropdownProps> = ({
  className = '',
  placeholder,
  maxRows = 3,
}) => {
  const router = useRouter();
  const { t } = useTranslation(['search', 'common', 'feed']);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const tagButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [popularTags, setPopularTags] = useState<Tag[]>([]); // 热门 tags（固定，只显示 SFW）
  const [searchResults, setSearchResults] = useState<Tag[]>([]); // 搜索结果（包含所有匹配的 tags）
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hasNsfwPermission, setHasNsfwPermission] = useState(false);
  const [measuredTagWidths, setMeasuredTagWidths] = useState<
    Map<number, number>
  >(new Map());
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Check NSFW permission from cookie on mount
  useEffect(() => {
    const checkNsfwPermission = () => {
      const hasPermission = document.cookie.includes('relax_content=true');
      setHasNsfwPermission(hasPermission);
    };
    checkNsfwPermission();
  }, []);

  // 提前计算这些值，避免在 useEffect 中使用未定义的变量
  const hasSearchText = searchText.trim().length > 0;
  // Filter out NSFW tags when user doesn't have NSFW permission
  // 使用 === true 来确保只有明确标记为 NSFW 的 tag 才会被过滤
  // 因为数据库中 is_nsfw 可能是 null/undefined，这种情况应该视为 SFW
  const filteredPopularTags = hasNsfwPermission
    ? popularTags
    : popularTags.filter(tag => tag.is_nsfw !== true);
  const filteredSearchResults = hasNsfwPermission
    ? searchResults
    : searchResults.filter(tag => tag.is_nsfw !== true);

  const allTags = hasSearchText ? filteredSearchResults : filteredPopularTags;
  const isLoadingAny = isLoading || isSearching;

  const fetchPopularTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        '/api/tags?size=40&current=0&sort_by=popularity',
      );
      if (!response.ok) {
        setPopularTags([]);
        return;
      }
      const result = await response.json();
      setPopularTags(result?.data || result || []);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      setPopularTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchTags = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/tags?search_text=${encodeURIComponent(trimmed)}&current=0&size=20`,
      );
      if (!response.ok) {
        setSearchResults([]);
        return;
      }
      const result = await response.json();
      setSearchResults(result?.data || result || []);
    } catch (error) {
      console.error('Error searching tags:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Fetch popular tags when dropdown opens
  useEffect(() => {
    if (isOpen && popularTags.length === 0) {
      fetchPopularTags();
    }
  }, [isOpen, fetchPopularTags, popularTags.length]);

  // Monitor container width for calculating full rows
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 当热门 tags 加载完成且 dropdown 打开时，触发测量
  // 重要：使用 filteredPopularTags.length，确保只在有可显示的 tag 时才触发测量
  useEffect(() => {
    if (isOpen && filteredPopularTags.length > 0 && !hasSearchText) {
      setIsMeasuring(true);
    }
  }, [isOpen, filteredPopularTags.length, hasSearchText]);

  // 使用 useLayoutEffect 在 DOM 更新后立即测量
  useIsomorphicLayoutEffect(() => {
    if (!isMeasuring || !measureContainerRef.current) {
      return;
    }

    // 等待下一帧确保 DOM 已渲染
    requestAnimationFrame(() => {
      const widths = new Map<number, number>();
      tagButtonRefs.current.forEach((button, tagId) => {
        if (button) {
          // 使用 getBoundingClientRect 获取精确宽度
          const rect = button.getBoundingClientRect();
          widths.set(tagId, rect.width);
        }
      });

      if (widths.size > 0) {
        setMeasuredTagWidths(widths);
      }
      setIsMeasuring(false);
    });
  }, [isMeasuring]);

  // 当容器宽度变化时，重新测量
  // 重要：使用 filteredPopularTags.length，确保只在有可显示的 tag 时才触发测量
  useEffect(() => {
    if (
      isOpen &&
      filteredPopularTags.length > 0 &&
      containerWidth > 0 &&
      !hasSearchText
    ) {
      // 清除旧的测量数据，强制重新测量
      setMeasuredTagWidths(new Map());
      setIsMeasuring(true);
    }
  }, [containerWidth, isOpen, filteredPopularTags.length, hasSearchText]);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      searchTags(searchText);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchText, searchTags]);

  // Close on click outside or ESC key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTagClick = useCallback(
    (tagName: string) => {
      setIsOpen(false);
      setSearchText('');
      router.push(`/tags/${encodeURIComponent(tagName)}`);
    },
    [router],
  );

  const handleClearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const defaultPlaceholder = t('feed:search_tags_placeholder', {
    defaultValue: 'Search tags...',
  });

  // 根据真实测量的宽度计算要显示的 tags
  const displayTags = useMemo(() => {
    // 搜索结果显示全部
    if (hasSearchText) {
      return allTags;
    }

    // 没有 tags 或没有容器宽度时返回空
    if (allTags.length === 0 || containerWidth === 0) {
      return allTags;
    }

    // 如果正在测量或还没有测量数据，返回空数组（让测量容器渲染）
    if (isMeasuring || measuredTagWidths.size === 0) {
      return [];
    }

    const GAP = 8; // gap-2 = 8px
    const DROPDOWN_PADDING = 32; // p-4 = 16px * 2
    const MIN_ROW_FILL_RATIO = 0.85; // 最后一行至少要填满 85% 才显示

    const availableWidth = containerWidth - DROPDOWN_PADDING;

    // 使用真实测量的宽度构建行
    const rows: { indices: number[]; width: number }[] = [];
    let currentRow: number[] = [];
    let currentRowWidth = 0;

    for (let i = 0; i < allTags.length; i++) {
      const tag = allTags[i];
      const tagWidth = measuredTagWidths.get(tag.id);

      // 如果没有测量数据，跳过这个 tag
      if (tagWidth === undefined) {
        continue;
      }

      const widthNeeded = currentRow.length === 0 ? tagWidth : tagWidth + GAP;

      if (currentRowWidth + widthNeeded > availableWidth) {
        // 当前 tag 放不下，开始新行
        if (currentRow.length > 0) {
          rows.push({ indices: currentRow, width: currentRowWidth });
        }
        currentRow = [i];
        currentRowWidth = tagWidth;
      } else {
        currentRow.push(i);
        currentRowWidth += widthNeeded;
      }
    }

    // 不要忘记最后一行
    if (currentRow.length > 0) {
      rows.push({ indices: currentRow, width: currentRowWidth });
    }

    if (rows.length === 0) {
      return [];
    }

    // 确定要显示多少行（最多 maxRows 行）
    const rowsAvailable = Math.min(rows.length, maxRows);

    // 检查最后一行是否"足够满"
    let rowsToShow = rowsAvailable;
    if (rowsToShow > 0) {
      const lastRow = rows[rowsToShow - 1];
      const fillRatio = lastRow.width / availableWidth;

      // 如果最后一行不够满且有多于 1 行，移除最后一行
      if (fillRatio < MIN_ROW_FILL_RATIO && rowsToShow > 1) {
        rowsToShow--;
      }
    }

    // 获取要显示的所有 tag 索引
    const indicesToShow = rows.slice(0, rowsToShow).flatMap(row => row.indices);
    return indicesToShow.map(i => allTags[i]);
  }, [
    allTags,
    containerWidth,
    hasSearchText,
    maxRows,
    measuredTagWidths,
    isMeasuring,
  ]);

  // 设置 tag button ref 的回调
  const setTagButtonRef = useCallback(
    (tagId: number, element: HTMLButtonElement | null) => {
      if (element) {
        tagButtonRefs.current.set(tagId, element);
      } else {
        tagButtonRefs.current.delete(tagId);
      }
    },
    [],
  );

  // 判断是否需要显示测量容器
  // 重要：使用 filteredPopularTags.length 而不是 popularTags.length
  // 这样当所有 popular tags 都是 NSFW 且用户没有权限时，不会显示空的测量容器
  const shouldShowMeasureContainer =
    !hasSearchText &&
    isOpen &&
    filteredPopularTags.length > 0 &&
    (isMeasuring || measuredTagWidths.size === 0);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <Input
        ref={inputRef}
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || defaultPlaceholder}
        size='lg'
        radius='full'
        classNames={{
          input: 'text-base',
          inputWrapper:
            'h-12 bg-card shadow-md border-2 border-primary-200 hover:border-primary-300 focus-within:border-primary-400 transition-colors',
        }}
        startContent={
          <IconSearch size={24} className='text-primary-400 flex-shrink-0' />
        }
        endContent={
          searchText && (
            <button
              type='button'
              onClick={handleClearSearch}
              className='p-1 hover:bg-default-100 rounded-full transition-colors flex-shrink-0'
              aria-label='Clear search'>
              <IconX size={18} className='text-default-400' />
            </button>
          )
        }
      />

      {isOpen && (
        <div className='absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-xl border border-default-200 z-50 p-4 max-h-[400px] overflow-y-auto'>
          <h3 className='text-sm font-semibold text-default-600 mb-3'>
            {hasSearchText
              ? t('search:search_results', { defaultValue: 'Search results' })
              : t('search:popular_tags', { defaultValue: 'Popular tags' })}
          </h3>

          {/* 隐藏的测量容器 - 用于测量所有 tag 按钮的实际宽度 */}
          {/* 重要：必须使用 filteredPopularTags 而不是 popularTags，确保 NSFW tag 不会被渲染 */}
          {shouldShowMeasureContainer && (
            <div
              ref={measureContainerRef}
              className='flex flex-wrap gap-2'
              style={{
                position: 'absolute',
                visibility: 'hidden',
                pointerEvents: 'none',
                top: 0,
                left: 16, // 对应 p-4
                right: 16,
              }}
              aria-hidden='true'>
              {filteredPopularTags.map(tag => (
                <Button
                  key={`measure-${tag.id}`}
                  ref={el => setTagButtonRef(tag.id, el)}
                  radius='full'
                  size='sm'
                  variant='flat'
                  color='default'
                  className='capitalize md:text-sm text-xs bg-default-50'>
                  #{tag.name}
                </Button>
              ))}
            </div>
          )}

          {isLoadingAny && (
            <div className='flex justify-center items-center py-8'>
              <Spinner size='md' color='primary' />
            </div>
          )}

          {!isLoadingAny &&
            displayTags.length === 0 &&
            !shouldShowMeasureContainer && (
              <div className='flex justify-center items-center py-8 text-default-400 text-sm'>
                {hasSearchText
                  ? t('search:no_matching_tags', {
                      defaultValue: 'No matching tags',
                    })
                  : t('search:no_results', { defaultValue: 'No results' })}
              </div>
            )}

          {/* 测量中显示 loading */}
          {!isLoadingAny && shouldShowMeasureContainer && (
            <div className='flex justify-center items-center py-8'>
              <Spinner size='sm' color='primary' />
            </div>
          )}

          {!isLoadingAny && displayTags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {displayTags.map(tag => (
                <Button
                  key={tag.id}
                  onPress={() => handleTagClick(tag.name)}
                  radius='full'
                  size='sm'
                  variant='flat'
                  color='default'
                  className='capitalize md:text-sm text-xs bg-default-50 hover:bg-primary-100 transition-colors'>
                  #{tag.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSearchDropdown;
