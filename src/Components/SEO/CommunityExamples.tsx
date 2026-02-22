import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Skeleton } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { Feed } from '@/Components/Feed';

interface CommunityExamplesProps {
  // 模板显示名称，用于标题
  templateDisplayName: string;
  // 用于筛选 posts 的 tag 名称（模板的英文名）
  tagName: string;
  // 可选：备用 tag 名称（用于兼容旧格式，如 displayName）
  alternativeTagNames?: string[];
  // 可选：自定义标题
  title?: string;
  // 可选：自定义描述
  description?: string;
  // 可选：没有 posts 时显示的模板封面 URL
  fallbackImageUrl?: string;
  // 可选：模板类型，用于判断 fallback 是图片还是视频
  templateType?: 'image' | 'video' | 'expression' | 'dance' | 'mixed';
}

/**
 * CommunityExamples 组件
 * 展示使用特定模板/效果创建的社区作品
 * 当有 posts 时使用 Feed 组件展示（和 home 页一致）
 * 当没有 posts 时显示 fallback 模板封面
 */
function CommunityExamples({
  templateDisplayName,
  tagName,
  alternativeTagNames,
  title,
  description,
  fallbackImageUrl,
  templateType,
}: CommunityExamplesProps) {
  const { t } = useTranslation('effects');
  // tagId 用于传给 Feed 组件
  const [tagId, setTagId] = useState<number | null>(null);
  // hasPosts: null=加载中, true=有帖子, false=无帖子
  const [hasPosts, setHasPosts] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 稳定化 alternativeTagNames：将数组序列化为字符串作为依赖，
  // 避免父组件每次渲染创建新数组引用导致 useCallback/useEffect 无限循环
  const altTagNamesKey = JSON.stringify(alternativeTagNames || []);

  // 防止并发请求竞争
  const fetchIdRef = useRef(0);

  // 通过 tag 名称查找 tag ID，再检查是否有帖子
  const fetchTagId = useCallback(async () => {
    if (!tagName) {
      setIsLoading(false);
      return;
    }

    const currentFetchId = ++fetchIdRef.current;

    setIsLoading(true);

    try {
      // 从稳定的字符串 key 还原备用名称数组
      const altNames: string[] = altTagNamesKey
        ? JSON.parse(altTagNamesKey)
        : [];
      const allTagNames = [tagName, ...altNames].filter(
        (name, index, arr) => name && arr.indexOf(name) === index,
      );

      // 并行查询所有 tag 名称，取第一个成功的结果
      let foundTagId: number | null = null;

      const results = await Promise.allSettled(
        allTagNames.map(name =>
          fetch(`/api/tag/detail?name=${encodeURIComponent(name)}`).then(
            res => {
              if (!res.ok) {
                return null;
              }
              return res.json();
            },
          ),
        ),
      );

      // 如果这个请求已经被更新的请求取代，丢弃结果
      if (currentFetchId !== fetchIdRef.current) {
        return;
      }

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value?.tag?.id) {
          foundTagId = result.value.tag.id;
          break;
        }
      }

      if (!foundTagId) {
        setTagId(null);
        setHasPosts(false);
        return;
      }

      // 保存 tagId 以供 Feed 组件使用
      setTagId(foundTagId);

      // 快速检查该 tag 下是否有帖子（只请求第 1 页，看是否有数据）
      const feedRes = await fetch(
        `/api/fetchFeed?tag=${foundTagId}&sortby=Trending&page=1`,
      );

      // 再次检查是否被更新的请求取代
      if (currentFetchId !== fetchIdRef.current) {
        return;
      }

      if (!feedRes.ok) {
        setHasPosts(false);
        return;
      }

      const feedData = await feedRes.json();
      const feedPosts = Array.isArray(feedData) ? feedData : [];
      setHasPosts(feedPosts.length > 0);
    } catch (err) {
      if (currentFetchId !== fetchIdRef.current) {
        return;
      }
      console.error('Error fetching community tag:', err);
      setHasPosts(false);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [tagName, altTagNamesKey]);

  useEffect(() => {
    fetchTagId();
  }, [fetchTagId]);

  // 如果没有 tagName，不渲染组件
  if (!tagName) {
    return null;
  }

  // 加载完成，没有 posts 且没有 fallback 图片，不渲染组件
  if (!isLoading && hasPosts === false && !fallbackImageUrl) {
    return null;
  }

  const sectionTitle =
    title ||
    t('communityExamples.title', '{{name}} Effect Examples', {
      name: templateDisplayName,
    });

  const sectionDescription =
    description ||
    t(
      'communityExamples.description',
      'All creations made with the {{name}} effect by the KomikoAI community.',
      { name: templateDisplayName },
    );

  return (
    <section>
      <h2 className='mb-4 text-xl font-bold text-center text-primary-900 md:text-3xl'>
        {sectionTitle}
      </h2>
      <p className='mx-auto max-w-3xl text-center text-muted-foreground text-sm md:text-base mb-8'>
        {sectionDescription}
      </p>

      {/* 加载中：显示骨架屏 */}
      {isLoading && (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={`skeleton-${index}`}
              className='rounded-xl'
              disableAnimation>
              <div
                className='rounded-xl bg-default-300'
                style={{ height: '200px' }}
              />
            </Skeleton>
          ))}
        </div>
      )}

      {/* 有帖子时：使用 Feed 组件展示（和 home 页一致） */}
      {!isLoading && hasPosts && tagId && (
        <Feed
          tagId={tagId}
          prerenderedPosts={false}
          compact
          hideTagFilters
          sortBy='Trending'
        />
      )}

      {/* 没有帖子时：显示缩小的 fallback 模板封面 */}
      {!isLoading && hasPosts === false && fallbackImageUrl && (
        <div className='flex justify-center items-center'>
          <div className='w-full max-w-xs md:max-w-sm'>
            {templateType === 'video' || templateType === 'dance' ? (
              <video
                src={`${fallbackImageUrl}#t=0.001`}
                className='w-full h-auto rounded-xl shadow-md object-cover'
                controls
                muted
                playsInline
                preload='metadata'
                loop
              />
            ) : (
              <img
                src={fallbackImageUrl}
                alt={templateDisplayName}
                className='w-full h-auto rounded-xl shadow-md object-cover'
                loading='lazy'
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(CommunityExamples);
