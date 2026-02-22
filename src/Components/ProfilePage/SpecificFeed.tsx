/* @deprecated 组件已经废弃, 请使用Feed组件*/
/* eslint-disable */
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  ChangeEventHandler,
} from 'react';
import { Button, useDisclosure, Spinner } from '@nextui-org/react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import useInfiniteScroll from '../Feed/useInfiniteScroll'; // adjust the path as necessary
import PostCard from '../Feed/PostCard';
import VideoCard from '../Feed/VideoCard';
import SkeletonCard from '../Feed/SkeletonCard';
import {
  authAtom,
  isMobileAtom,
  profileAtom,
  Post,
  Comment,
} from '../../state';
import mixpanel from 'mixpanel-browser';
import { useAtom, useAtomValue } from 'jotai';
import { useRouter } from 'next/router';
import Masonry from 'react-masonry-css';
import { ROLES } from '../../../api/_constants';

// Use Post type from state instead of custom ListItem
type ListItem = Post;

const tags = ['Newest', 'Trending', 'Most Likes'];

function formatRelativeTime(timestamp: string) {
  const date = parseISO(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

interface SpecificFeedProps {
  purpose?: string;
  user_uniqid?: string; // Define the expected type for user_uniqid, e.g., string
  showMore?: boolean;
  needLogin?: boolean;
}

const SpecificFeed = ({
  purpose = 'profile',
  user_uniqid = 'True',
  showMore = false,
  needLogin = false,
}: SpecificFeedProps) => {
  const { t } = useTranslation('feed');
  const [list, setList] = useState<ListItem[]>([]);
  const [isMobile, setIsMobile] = useAtom(isMobileAtom);
  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string>(tags[0]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const router = useRouter();
  const profile = useAtomValue(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadComplete = useRef(false);
  const isComicGenerator = purpose === 'meme';

  // 添加一个状态用于初始加载的skeleton
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  // 添加空页计数器
  const emptyPagesCounter = useRef(0);
  const maxEmptyPagesAllowed = 3; // 最多允许连续3个空页才终止加载
  // 添加初始加载尝试标记
  const hasAttemptedInitialLoad = useRef(false);
  // 分离初始加载错误和后续加载错误
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  const onHidePost = (postId: number) => {
    setList(prevList => prevList.filter(item => item.id !== postId));
  };

  // 添加简单的缓存机制
  const cacheRef = useRef<{
    [key: string]: { data: ListItem[]; timestamp: number };
  }>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  // 添加请求去重机制
  const activeRequestsRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时取消所有进行中的请求
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
      activeRequestsRef.current.clear();
    };
  }, []);

  // 修改fetchMoreData，改进错误处理，保护已有数据
  const fetchMoreData = useCallback(
    async (isInitial = false, retryCount = 0) => {
      const newPage = isInitial ? 1 : page;
      let url = '';
      if (purpose === 'profile') {
        url = `/api/fetchFeed?page=${newPage}&sortby=${selectedTag}&useronly=${user_uniqid}`;
      } else if (purpose === 'meme') {
        url = `/api/fetchFeed?page=${newPage}&sortby=${selectedTag}&tagsonly=Meme,Comic`;
      }
      const requestKey = `${url}_${isInitial}`;

      try {
        // 如果是初始加载，但已经完成过初始加载，则跳过
        if (isInitial && initialLoadComplete.current) {
          console.log('Initial load already completed, skipping');
          return;
        }

        // 如果没有更多数据或正在加载，不执行任何操作
        if ((!hasMore && !isInitial) || (!isInitial && isLoading)) {
          return;
        }

        // 请求去重检查
        if (activeRequestsRef.current.has(requestKey)) {
          console.log('Request already in progress, skipping:', requestKey);
          return;
        }

        // 标记请求开始
        activeRequestsRef.current.add(requestKey);

        setIsLoading(true);
        if (isInitial) {
          setInitialLoading(true);
          hasAttemptedInitialLoad.current = true;
          // 重置空页计数器
          emptyPagesCounter.current = 0;
          setInitialLoadError(null); // 清除初始加载错误
          setPaginationError(null); // 清除分页错误
        } else {
          setLoadingNextPage(true);
          setPaginationError(null); // 清除之前的分页错误
        }

        // 检查缓存（仅对第一页进行缓存）
        const cacheKey = `${purpose}_${selectedTag}_${newPage}`;
        if (isInitial && newPage === 1 && cacheRef.current[cacheKey]) {
          const cached = cacheRef.current[cacheKey];
          const now = Date.now();
          if (now - cached.timestamp < CACHE_DURATION) {
            console.log(`Using cached data for: ${cacheKey}`);
            setList(cached.data);
            initialLoadComplete.current = true;
            hasAttemptedInitialLoad.current = true;
            setInitialLoadError(null);
            setPaginationError(null);
            setError(null);
            activeRequestsRef.current.delete(requestKey); // 清理请求标记
            return;
          }
        }

        // 创建新的AbortController
        const controller = new AbortController();
        abortControllersRef.current.set(requestKey, controller);

        // 添加超时控制 - 增加到20秒，因为第一次加载可能需要更多时间
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时

        const response = await fetch(url, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        abortControllersRef.current.delete(requestKey); // 清理controller

        if (!response) {
          throw new Error(
            t('errors.noResponse', 'Failed to fetch data: No response'),
          );
        }

        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => t('errors.unknownError', 'Unknown error'));
          console.error(`API error (${response.status}): ${errorText}`);
          throw new Error(
            t('errors.serverError', 'Server error {{status}}: {{statusText}}', {
              status: response.status,
              statusText: response.statusText,
            }),
          );
        }

        const newData = await response.json();
        console.log(
          `Fetched page ${newPage}, got ${newData ? newData.length : 0} items`,
        );

        // 改进的空页处理逻辑
        if (!newData || !Array.isArray(newData) || newData.length === 0) {
          // 增加空页计数
          emptyPagesCounter.current++;

          if (isInitial) {
            if (list.length === 0) {
              setList([]);
            }
            initialLoadComplete.current = true;
            setHasMore(false);
            console.log('Initial load returned empty, marking as no content');
          } else if (emptyPagesCounter.current >= maxEmptyPagesAllowed) {
            // 连续收到多个空页，才认为真的没有更多内容
            console.log(
              `Reached ${maxEmptyPagesAllowed} empty pages, stopping pagination`,
            );
            setHasMore(false);
          } else {
            // 不足最大空页数，尝试跳到下一页
            console.log('Skipping empty page, trying next page');
            // 增加页码，下次会获取下一页
            setPage(prev => prev + 1);

            // 延迟一点再尝试下一页
            setTimeout(() => {
              if (hasMore) {
                fetchMoreData(false);
              }
            }, 500);
          }
        } else {
          // 收到有效数据，重置空页计数
          emptyPagesCounter.current = 0;

          // 处理数据，添加去重逻辑
          if (isInitial) {
            setList(newData);
            initialLoadComplete.current = true;
            console.log(
              `Initial load successful, loaded ${newData.length} items`,
            );

            // 缓存第一页数据
            if (newPage === 1) {
              cacheRef.current[cacheKey] = {
                data: newData,
                timestamp: Date.now(),
              };
            }
          } else {
            setList(prevList => {
              // 使用Set来跟踪已有的ID
              const existingIds = new Set(prevList.map(item => item.id));
              // 过滤掉已有的项
              const uniqueNewItems = newData.filter(
                item => !existingIds.has(item.id),
              );
              console.log(`Added ${uniqueNewItems.length} new items to list`);
              return [...prevList, ...uniqueNewItems];
            });

            // 只有成功获取数据后才增加页码
            setPage(prev => prev + 1);
          }
        }

        // 成功后清除所有错误
        setInitialLoadError(null);
        setPaginationError(null);
        setError(null); // 保持向后兼容
      } catch (err) {
        console.error('Error fetching data:', err);

        // 改进错误处理，不清除已有数据
        let errorMessage = t('errors.loadFailed', 'Failed to load feed');
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = t(
              'errors.timeout',
              'Request timeout. Please try again.',
            );
          } else {
            errorMessage = err.message;
          }
        }

        // 添加重试机制，最多重试2次
        if (
          retryCount < 2 &&
          err instanceof Error &&
          err.name === 'AbortError'
        ) {
          console.log(`Retrying request (attempt ${retryCount + 1}/2)...`);
          setTimeout(
            () => {
              fetchMoreData(isInitial, retryCount + 1);
            },
            1000 * (retryCount + 1),
          ); // 递增延迟：1秒，2秒
          return;
        }

        if (isInitial) {
          // 初始加载失败，只有在没有任何数据时才设置错误状态
          if (list.length === 0) {
            setInitialLoadError(errorMessage);
            setError(errorMessage); // 保持向后兼容
          }
          initialLoadComplete.current = true;
          console.log('Initial load failed:', errorMessage);
        } else {
          // 分页加载失败，设置分页错误，但保持现有数据
          setPaginationError(errorMessage);
          console.log('Pagination load failed:', errorMessage);
        }
      } finally {
        setIsLoading(false);
        setIsFetching(false);
        setInitialLoading(false);
        setLoadingNextPage(false);
        // 清理请求标记
        activeRequestsRef.current.delete(requestKey);
        abortControllersRef.current.delete(requestKey);
      }
    },
    [hasMore, isLoading, page, purpose, selectedTag, user_uniqid, list.length],
  );

  // 使用增强的 InfiniteScroll hook，进一步增大检测范围
  const [lastElementRef, isFetching, setIsFetching] = useInfiniteScroll(
    () => {
      if (hasMore && !isLoading && initialLoadComplete.current) {
        fetchMoreData(false);
      }
    },
    {
      rootMargin: '0px 0px 1200px 0px', // 大幅增大检测范围
      threshold: 0.01, // 降低阈值，使内容更早开始加载
    },
  );

  //! HANDLE TAG
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setList([]); // Clear the list
    setPage(1); // Reset to the first page when the tag changes
    setHasMore(true); // 重置hasMore状态
    initialLoadComplete.current = false; // 重置初始加载状态
    hasAttemptedInitialLoad.current = false; // 重置初始加载尝试标记
    setError(null); // 清除错误
    setInitialLoadError(null); // 清除初始加载错误
    setPaginationError(null); // 清除分页错误

    // 触发新数据加载
    setTimeout(() => {
      fetchMoreData(true);
    }, 100);
  };

  //! HANDLE LIKE
  const handleLike = async (id: number) => {
    const updatedList = list.map(item => {
      if (item.id === id) {
        console.log(item);
        const updatedItem = {
          ...item,
          liked: !item.liked,
          votes: item.liked ? item.votes - 1 : item.votes + 1,
        };
        let voteValue = 0;
        if (item.liked) {
          voteValue = -1;
        } else {
          voteValue = 1;
        }

        console.log(
          JSON.stringify({
            postId: item.id,
            parentCommentId: null,
            authUserId: null,
            value: voteValue,
          }),
        );
        // Make API call to update like count on the server
        fetch(`/api/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: item.id,
            parentCommentId: null,
            authUserId: null,
            value: voteValue,
          }),
        });
        return updatedItem;
      }
      return item;
    });
    setList(updatedList);
  };

  //! HANDLE COMMENT
  const handleCommentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setComment(event.target.value);
  };

  let canCall = true;
  const handleComment = async (
    id: number,
    parentCommentId?: number,
    replyToUserId?: string,
    replyToCommentId?: number,
  ) => {
    if (!canCall) {
      console.log('Cooldown active. Please wait.');
      return;
    }

    if (!comment.trim()) {
      console.log('Empty comment. Skipping.');
      return;
    }

    canCall = false;

    setTimeout(() => {
      canCall = true;
    }, 3000);

    const updatedList = await Promise.all(
      list.map(async item => {
        if (item.id === id) {
          console.log(`postid ${item.id}`);

          console.log(
            JSON.stringify({
              postId: item.id,
              commentId: null,
              authUserId: null,
              content: comment,
              replyToUserId,
            }),
          );
          // Make API call to update like count on the server
          const response = await fetch(`/api/comment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: item.id,
              parentCommentId,
              replyToUserId,
              content: comment,
              item: item,
              replyToCommentId,
            }),
          });

          const new_comments = await response.json();
          if (!response.ok) {
            throw new Error(new_comments.error || 'Failed to post comment');
          }

          const updatedItem = {
            ...item,
            comments: new_comments,
          };
          return updatedItem;
        }
        return item;
      }),
    );
    setList(updatedList);
    setComment('');
  };

  const checkIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  //! HANDLE MODAL
  const handleBeforeUnload = () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    console.log('beforeunload setting scroll position');
  };

  const handleOpen = (id: number, uniqid: string) => {
    try {
      mixpanel.track('click.home.open_post');
    } catch (error) {}
    if (isMobile) {
      handleBeforeUnload();
      router.push(`/post/${uniqid}`);
    } else {
      setActiveItemId(id);
      onOpen();
    }
  };

  const handleClose = () => {
    setActiveItemId(null);
    onClose();
  };

  // 初始加载数据
  useEffect(() => {
    // 避免重复触发初始加载
    if (hasAttemptedInitialLoad.current) {
      return;
    }

    // 如果不需要登录，直接加载数据
    if (!needLogin && !initialLoadComplete.current && !isLoading) {
      console.log('Loading feed without login check');
      // 添加小延迟确保组件完全挂载
      setTimeout(() => {
        fetchMoreData(true);
      }, 100);
    }
    // 如果需要登录，则检查登录状态
    else if (
      needLogin &&
      isAuth &&
      !initialLoadComplete.current &&
      !isLoading
    ) {
      console.log('Loading feed with login check');
      setTimeout(() => {
        fetchMoreData(true);
      }, 100);
    }
  }, [isAuth, selectedTag, needLogin, isLoading, user_uniqid]);

  // 使用 ref 来跟踪上一个 user_uniqid 值，避免无限循环
  const prevUserUniqidRef = useRef(user_uniqid);

  // 处理 user_uniqid 变化时重新加载数据
  useEffect(() => {
    // 只有当 user_uniqid 真正改变且不是默认值且已经完成过初始加载时才重新加载
    if (
      user_uniqid !== 'True' &&
      user_uniqid !== prevUserUniqidRef.current &&
      initialLoadComplete.current
    ) {
      console.log('user_uniqid changed, reloading feed:', user_uniqid);

      // 更新 ref
      prevUserUniqidRef.current = user_uniqid;

      // 重置状态
      setList([]);
      setPage(1);
      setHasMore(true);
      initialLoadComplete.current = false;
      hasAttemptedInitialLoad.current = false;
      setError(null);
      setInitialLoadError(null);
      setPaginationError(null);

      // 重新加载数据
      setTimeout(() => {
        fetchMoreData(true);
      }, 100);
    } else if (user_uniqid !== prevUserUniqidRef.current) {
      // 更新 ref 即使不需要重新加载
      prevUserUniqidRef.current = user_uniqid;
    }
  }, [user_uniqid]); // 移除 fetchMoreData 依赖，避免无限循环

  // 添加自动预加载下一页功能
  useEffect(() => {
    // 当初始页面加载完成且内容少于一定量时，自动加载下一页
    if (
      initialLoadComplete.current &&
      list.length > 0 &&
      list.length < 12 &&
      hasMore &&
      !isLoading &&
      !isFetching
    ) {
      console.log('Auto-preloading next page due to limited content');
      const timer = setTimeout(() => {
        fetchMoreData(false);
      }, 500); // 短暂延迟后加载下一页

      return () => clearTimeout(timer);
    }
  }, [
    initialLoadComplete.current,
    list.length,
    hasMore,
    isLoading,
    isFetching,
  ]);

  //! HANDLE MODAL SIZE
  const adjustHeight = useCallback(() => {
    const img = document.getElementById('leftElement');
    const rightElement = document.getElementById('rightElement');
    if (img && rightElement) {
      rightElement.style.height = `${img.offsetHeight - 1}px`;
      console.log('adjusting height');
      console.log(`${img.offsetHeight}px`);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', adjustHeight);

    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, [adjustHeight]);

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure the modal content has rendered
      setTimeout(adjustHeight, 10);
      setTimeout(adjustHeight, 100);
      setTimeout(adjustHeight, 250);
      setTimeout(adjustHeight, 500);
    }
  }, [isOpen, adjustHeight]);

  //! HANDLE SHARE
  const handleCopy = (uniqid: string) => {
    const textToCopy = `${window.location.origin}/post/${uniqid}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(t('actions.linkCopied', 'Sharing link copied!'));
    });
  };

  // 渲染Skeleton卡片的函数
  const renderSkeletons = () => {
    // 为不同的加载状态显示不同数量的skeleton
    const count = initialLoading ? 8 : 4;
    const skeletonCards: JSX.Element[] = []; // 明确类型为JSX.Element数组

    for (let i = 0; i < count; i++) {
      // 使用固定模式避免SSR水合错误：每4个中有1个video
      const isVideo = i % 4 === 0;
      skeletonCards.push(
        <SkeletonCard key={`skeleton-${i}`} isVideo={isVideo} />,
      );
    }

    return skeletonCards;
  };

  return (
    <div
      className={`relative w-full flex-grow lg:px-6 2xl:px-16 overflow-hidden ${isComicGenerator ? 'comic-feed' : ''}`}>
      {initialLoading ||
      (!hasAttemptedInitialLoad.current && list.length === 0) ? (
        <Masonry
          breakpointCols={{
            default: 4,
            1200: 3,
            640: 2,
          }}
          className='flex gap-4 md:mx-2 min-h-screen w-full'
          columnClassName='my-masonry-grid_column'>
          {renderSkeletons()}
        </Masonry>
      ) : (initialLoadError || error) && list.length === 0 ? (
        <div className='flex justify-center items-center h-64 text-center'>
          <div>
            <p className='text-danger mb-4'>{initialLoadError || error}</p>
            {(initialLoadError || error)?.includes('timeout') && (
              <p className='text-muted-foreground text-sm mb-4'>
                {t(
                  'errors.serverSlow',
                  'Server response is slow, please try again later. If the problem persists, please refresh the page.',
                )}
              </p>
            )}
            <Button
              className='bg-primary text-primary-foreground px-4 py-2 rounded-lg'
              isLoading={isLoading}
              onClick={() => {
                // 完全重置所有状态
                setList([]);
                setPage(1);
                setHasMore(true);
                setError(null);
                setInitialLoadError(null);
                setPaginationError(null);
                hasAttemptedInitialLoad.current = false;
                initialLoadComplete.current = false;
                emptyPagesCounter.current = 0;

                // 延迟一点再触发加载，确保状态重置完成
                setTimeout(() => {
                  fetchMoreData(true);
                }, 100);
              }}>
              {t('actions.tryAgain', 'Try Again')}
            </Button>
          </div>
        </div>
      ) : list.length === 0 &&
        hasAttemptedInitialLoad.current &&
        initialLoadComplete.current ? (
        <div className='flex justify-center items-center h-64'>
          <div className='text-center'>
            <p className='text-muted-foreground text-lg mb-4'>
              {t('states.noPostsFound', 'No posts found')}
            </p>
            <Button
              className='bg-primary text-primary-foreground px-4 py-2 rounded-lg'
              onClick={() => {
                // 完全重置所有状态
                setList([]);
                setPage(1);
                setHasMore(true);
                setError(null);
                setInitialLoadError(null);
                setPaginationError(null);
                hasAttemptedInitialLoad.current = false;
                initialLoadComplete.current = false;
                emptyPagesCounter.current = 0;

                // 延迟一点再触发加载，确保状态重置完成
                setTimeout(() => {
                  fetchMoreData(true);
                }, 100);
              }}>
              {t('actions.refresh', 'Refresh')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Masonry
            breakpointCols={{
              default: 4,
              1200: 3,
              640: 2,
            }}
            className='flex gap-4 md:mx-2 min-h-screen'
            columnClassName='my-masonry-grid_column'>
            {list.map((item, index) => {
              return item.media_type === 'video' ? (
                <VideoCard
                  key={`post-${item.id}-${item.uniqid}`}
                  item={item}
                  handleOpen={handleOpen}
                  handleLike={handleLike}
                  handleComment={handleComment}
                  handleCommentChange={handleCommentChange}
                  comment={comment}
                  isOpen={isOpen && activeItemId === item.id}
                  handleClose={handleClose}
                  showMore={item.authUserId === profile?.id}
                  shouldShowDelete={item.authUserId === profile?.id}
                />
              ) : (
                <PostCard
                  key={`post-${item.id}-${item.uniqid}`}
                  item={item}
                  handleOpen={handleOpen}
                  handleLike={handleLike}
                  handleComment={handleComment}
                  handleCommentChange={handleCommentChange}
                  comment={comment}
                  isOpen={isOpen && activeItemId === item.id}
                  handleClose={handleClose}
                  showMore={
                    item.authUserId === profile?.id ||
                    profile?.roles?.includes(ROLES.ADMIN)
                  }
                  hideVipRing={true}
                  shouldShowDelete={item.authUserId === profile?.id}
                  onHidePost={onHidePost}
                />
              );
            })}

            {/* 在加载下一页时，显示更多占位符 */}
            {loadingNextPage && renderSkeletons()}
          </Masonry>
        </>
      )}

      {/* 分页错误提示 - 显示在内容底部，不影响已有内容 */}
      {paginationError && list.length > 0 && (
        <div className='flex justify-center items-center mt-4 mb-4'>
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center max-w-md'>
            <p className='text-red-600 dark:text-red-400 mb-2 text-sm'>{paginationError}</p>
            <Button
              size='sm'
              className='bg-red-500 text-primary-foreground'
              onClick={() => {
                setPaginationError(null);
                fetchMoreData(false);
              }}>
              {t('actions.retry', 'Retry')}
            </Button>
          </div>
        </div>
      )}

      {!isLoading &&
        !error &&
        !paginationError &&
        list.length > 0 &&
        hasMore && (
          <>
            {/* 添加两个触发器元素，一个在列表中间，一个在底部 */}
            <div
              style={{ height: 2 }}
              className='opacity-0 pointer-events-none absolute top-[65%]'
              ref={node => {
                if (node && hasMore && !isLoading && !isFetching) {
                  const observer = new IntersectionObserver(
                    entries => {
                      if (entries[0].isIntersecting) {
                        console.log('Mid-page trigger activated');
                        fetchMoreData(false);
                      }
                    },
                    { rootMargin: '0px', threshold: 0.1 },
                  );
                  observer.observe(node);
                  // Store observer for cleanup - don't return from callback ref
                  (node as any).__observer = observer;
                } else if (node && (node as any).__observer) {
                  // Cleanup previous observer
                  (node as any).__observer.disconnect();
                  (node as any).__observer = null;
                }
              }}
            />

            <div ref={lastElementRef} style={{ height: 20 }} className='mt-10'>
              {isFetching && (
                <div className='flex justify-center mt-4'>
                  <Spinner size='sm' color='secondary' />
                </div>
              )}
            </div>
          </>
        )}

      {!isLoading &&
        !error &&
        !paginationError &&
        list.length > 0 &&
        hasMore &&
        isComicGenerator && (
          <div className='flex justify-center mt-4 mb-8'>
            <Button
              color='secondary'
              onClick={() => fetchMoreData(false)}
              disabled={isFetching}
              className='shadow-md'>
              {isFetching ? (
                <Spinner size='sm' color='current' />
              ) : (
                t('actions.loadMore', 'Load More')
              )}
            </Button>
          </div>
        )}

      {!hasMore && list.length > 0 && (
        <div className='flex justify-center mt-8 mb-8'>
          <p className='text-muted-foreground'>
            {t('states.noMorePosts', 'No more posts to load')}
          </p>
        </div>
      )}

      {/* 添加调试信息(开发环境) */}
      {process.env.NODE_ENV === 'development' && (
        <div className='fixed bottom-0 right-0 bg-black bg-opacity-50 text-primary-foreground p-2 text-xs z-50'>
          <div>
            Page: {page} | Items: {list.length} | hasMore: {String(hasMore)}
          </div>
          <div>
            EmptyPages: {emptyPagesCounter.current}/{maxEmptyPagesAllowed}
          </div>
          <div>
            InitialLoading: {String(initialLoading)} | Attempted:{' '}
            {String(hasAttemptedInitialLoad.current)}
          </div>
          <div>InitialComplete: {String(initialLoadComplete.current)}</div>
          {initialLoadError && (
            <div className='text-red-300'>InitError: {initialLoadError}</div>
          )}
          {paginationError && (
            <div className='text-yellow-300'>PageError: {paginationError}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpecificFeed;
