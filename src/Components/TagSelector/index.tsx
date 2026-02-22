import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { Input, Button } from '@nextui-org/react';
import { debounce } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { authAtom } from '@/state';
import { TagChip } from '../TagChip';

export interface Tag {
  id: number;
  name: string;
  popularity?: number;
  logo_url?: string | null;
  is_followed?: boolean;
}

interface FollowedTag {
  tag_id: number;
  tag_name: string;
  tag_logo?: string | null;
  tag_popularity?: number;
}

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

export const excludeTags = ['Animation', 'Templates', 'All Posts', 'Featured'];

// Helper function for case-insensitive tag name comparison
const tagNamesEqual = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();
export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  maxTags = 15,
  placeholder,
  className = '',
}) => {
  const { t } = useTranslation('publish');
  const [inputValue, setInputValue] = useState('');
  const [recommendedTags, setRecommendedTags] = useState<Tag[]>([]);
  const [followedTags, setFollowedTags] = useState<Tag[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 10;
  const loadMoreSize = 3;
  const clickedRecommendedCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAuth = useAtomValue(authAtom);

  // Fetch user's followed tags
  const fetchFollowedTags = async () => {
    if (!isAuth) {
      return;
    }

    try {
      const response = await fetch('/api/tag/follow');
      const result = await response.json();

      if (result.followed_tags && Array.isArray(result.followed_tags)) {
        const tags: Tag[] = result.followed_tags.map((ft: FollowedTag) => ({
          id: ft.tag_id,
          name: ft.tag_name,
          logo_url: ft.tag_logo,
          popularity: ft.tag_popularity,
          is_followed: true,
        }));
        setFollowedTags(tags.filter(tag => !excludeTags.includes(tag.name)));
      }
    } catch (error) {
      console.error('Failed to fetch followed tags:', error);
    }
  };

  // Fetch followed tags on mount
  useEffect(() => {
    fetchFollowedTags();
  }, [isAuth]);

  // 获取推荐标签的函数
  const fetchRecommendedTags = async (
    keyword?: string,
    offset = 0,
    size = pageSize,
    append = false,
  ) => {
    const params = new URLSearchParams();
    if (keyword) {
      params.set('search_text', keyword);
    }
    params.set('current', offset.toString());
    params.set('size', size.toString());

    try {
      const response = await fetch(`/api/tags?${params.toString()}`);
      const result = await response.json();

      if (result.data) {
        // 过滤掉已经选中的标签
        const filtered = result.data.filter(
          (tag: Tag) =>
            !selectedTags.some(selected => selected.name === tag.name) &&
            !excludeTags.includes(tag.name),
        );

        // 判断是否还有更多数据
        if (result.data.length < size) {
          setHasMoreData(false);
        }

        if (append) {
          setRecommendedTags(prev => [...prev, ...filtered]);
        } else {
          setRecommendedTags(filtered);
        }

        // 更新偏移量
        setCurrentOffset(offset + result.data.length);
      } else {
        // 没有数据返回，说明没有更多数据
        setHasMoreData(false);
        if (!append) {
          setRecommendedTags([]);
        }
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      if (!append) {
        setRecommendedTags([]);
      }
    }
  };

  // 防抖搜索
  const debouncedFetchTags = debounce((keyword?: string) => {
    setCurrentOffset(0);
    setHasMoreData(true); // 重置数据状态
    fetchRecommendedTags(keyword, 0, pageSize, false);
  }, 300);

  useEffect(() => {
    const keyword = inputValue.trim().replace('#', '');
    debouncedFetchTags(keyword);
    return () => {
      debouncedFetchTags.cancel();
    };
  }, [inputValue]);

  useEffect(() => {
    setCurrentOffset(0);
    setHasMoreData(true);
    clickedRecommendedCount.current = 0;
    // fetchRecommendedTags(undefined, 0, pageSize, false);
  }, []);

  const tags = useMemo(() => {
    if (inputValue.trim().replace('#', '').length > 0) {
      return recommendedTags;
    }
    // Only show followed tags, filter out already selected tags (case-insensitive)
    const filteredFollowed = followedTags.filter(
      tag =>
        !selectedTags.some(selected => tagNamesEqual(selected.name, tag.name)),
    );

    return filteredFollowed;
  }, [selectedTags, followedTags, recommendedTags, inputValue]);

  useEffect(() => {
    if (selectedTags.every(tag => tag.id > 0)) {
      return;
    }

    if (selectedTags.length > 0) {
      let changed = false;
      const newTags = selectedTags.map(tag => {
        if (tag.id >= 0) {
          return tag;
        }
        // Case-insensitive lookup for matching followed tag
        const found = followedTags.find(t => tagNamesEqual(t.name, tag.name));
        if (found) {
          changed = true;
          return { name: found.name, id: found.id };
        }
        return tag;
      });
      if (changed) {
        onTagsChange(newTags);
      }
    }
  }, [selectedTags, followedTags, onTagsChange]);

  // 加载更多推荐标签
  const loadMoreTags = () => {
    if (!hasMoreData) {
      return;
    }

    const keyword = inputValue.trim().replace('#', '');
    clickedRecommendedCount.current = 0;
    fetchRecommendedTags(
      keyword || undefined,
      currentOffset,
      loadMoreSize,
      true,
    );
  };

  // 添加标签
  const addTag = (tag: string | Tag) => {
    let newTag: Tag;

    if (typeof tag === 'string') {
      // 自定义标签
      const cleanTag = tag.trim().replace('#', '');
      if (!cleanTag) {
        return;
      }

      // 检查是否已存在 (case-insensitive)
      if (selectedTags.some(t => tagNamesEqual(t.name, cleanTag))) {
        return;
      }

      newTag = {
        id: -1,
        name: cleanTag,
      };
    } else {
      // 推荐标签 (case-insensitive)
      if (selectedTags.some(t => tagNamesEqual(t.name, tag.name))) {
        return;
      }
      newTag = tag;

      // 增加点击推荐标签的计数
      clickedRecommendedCount.current += 1;

      // 当点击了推荐标签后，检查当前推荐标签数是否小于7，且还有更多数据时才加载
      if (
        tags.length < 7 &&
        hasMoreData &&
        clickedRecommendedCount.current >= 1
      ) {
        loadMoreTags();
      }
    }

    if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, newTag]);
      setInputValue('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: Tag) => {
    clickedRecommendedCount.current = Math.max(
      0,
      clickedRecommendedCount.current - 1,
    );
    onTagsChange(selectedTags.filter(tag => tag.name !== tagToRemove.name));
  };

  // 处理输入
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  // 处理添加按钮点击
  const handleAddClick = () => {
    addTag(inputValue);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 已选择的标签 */}
      <div className='space-y-2'>
        <div className='text-sm text-muted-foreground font-bold'>
          {t('tagCount', { current: selectedTags.length, max: maxTags })}
        </div>
        {selectedTags.length > 0 && (
          <div className='flex flex-wrap gap-1.5 min-h-8'>
            {selectedTags.map(tag => (
              <TagChip
                key={tag.name}
                tag={tag}
                onClose={() => removeTag(tag)}
                isSelected={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* 输入框和添加按钮 */}
      <div className='flex gap-2 items-center mt-0'>
        <div className='flex-1'>
          <Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder || t('tagPlaceholder')}
            maxLength={20}
            variant='bordered'
            size='sm'
            disabled={selectedTags.length >= maxTags}
            endContent={
              <span className='text-xs text-muted-foreground'>
                {inputValue.length}/20
              </span>
            }
          />
        </div>
        <Button
          size='sm'
          color='primary'
          variant='solid'
          onPress={handleAddClick}
          isDisabled={!inputValue.trim() || selectedTags.length >= maxTags}
          className='min-w-16'>
          {t('addTags')}
        </Button>
      </div>

      {/* 推荐标签 */}
      {/* {recommendedTags.length > 0 && (
        <div className='space-y-2'>
          <div className='text-sm font-medium text-foreground'>
            {t('recommendedTags')}
          </div>
          <div className='flex flex-wrap gap-2'>
            {recommendedTags.map((tag, index) => (
              <Button
                key={index}
                size='sm'
                variant='bordered'
                color='primary'
                onPress={() => addTag(tag)}
                className='text-sm h-8'
                isDisabled={selectedTags.length >= maxTags}>
                #{tag.name}
              </Button>
            ))}
          </div>
        </div>
      )} */}

      {/* Followed Tags - unified list with PostContent.tsx styling */}
      {tags.length > 0 && (
        <div className='space-y-2'>
          <div className='flex flex-wrap gap-1.5 min-h-10 max-h-20 overflow-y-auto'>
            {tags.map((tag, index) => {
              const isTagSelected = selectedTags.some(selected =>
                tagNamesEqual(selected.name, tag.name),
              );
              const isDisabled =
                isTagSelected || selectedTags.length >= maxTags;

              return (
                <TagChip
                  key={`tag-${index}`}
                  tag={tag}
                  onClick={() => {
                    if (!isDisabled) {
                      addTag(tag);
                    }
                  }}
                  className={
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }
                  disabled={isDisabled}
                  isSelected={isTagSelected}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TagSelector);
