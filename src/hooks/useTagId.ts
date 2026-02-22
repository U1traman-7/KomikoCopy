import { useState, useEffect, useRef } from 'react';

/**
 * useTagId - 根据 tag 名称查找对应的 tag ID
 *
 * 支持传入多个候选名称（主名称 + 备选名称），并行查询所有候选，
 * 返回第一个匹配到的 tag ID。
 *
 * 内置竞态条件防护：当 tagName 快速变化时，旧的请求结果不会覆盖新的结果。
 *
 * @param tagName - 主 tag 名称（通常是模板英文名）
 * @param alternativeTagNames - 备选 tag 名称数组（如 displayName 等）
 * @returns { tagId, isLoading }
 */
export function useTagId(
  tagName: string | undefined,
  alternativeTagNames?: string[],
): { tagId: number | null; isLoading: boolean } {
  const [tagId, setTagId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 防止并发请求竞争
  const fetchIdRef = useRef(0);

  // 稳定化 alternativeTagNames：将数组序列化为字符串作为依赖，
  // 避免每次渲染创建新数组引用导致 useEffect 不必要地重新执行
  const altTagNamesKey = JSON.stringify(alternativeTagNames || []);

  useEffect(() => {
    const currentFetchId = ++fetchIdRef.current;

    const fetchTagId = async () => {
      if (!tagName) {
        setTagId(null);
        return;
      }

      setIsLoading(true);

      try {
        // 从稳定的字符串 key 还原备用名称数组
        const altNames: string[] = altTagNamesKey
          ? JSON.parse(altTagNamesKey)
          : [];

        // 合并并去重所有候选 tag 名称
        const allTagNames = [tagName, ...altNames].filter(
          (name, index, arr) => name && arr.indexOf(name) === index,
        );

        // 并行查询所有 tag 名称，取第一个成功的结果
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

        // 找到第一个有效的 tag ID
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value?.tag?.id) {
            setTagId(result.value.tag.id);
            return;
          }
        }

        // 没有找到匹配的 tag
        setTagId(null);
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) {
          return;
        }
        console.error('Error fetching tag ID:', err);
        setTagId(null);
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchTagId();
  }, [tagName, altTagNamesKey]);

  return { tagId, isLoading };
}
