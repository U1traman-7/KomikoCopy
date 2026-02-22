import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Spinner } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import Masonry from 'react-masonry-css';
import { PostCard } from '../Feed/PostCard';
import { useRouter } from 'next/router';
import type { Post } from '../../state';

/**
 * LikedFeed - Shows posts that the user has liked
 */
export const LikedFeed: React.FC = () => {
  const { t } = useTranslation(['profile', 'common']);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchLikedPosts = useCallback(async (pageNum: number) => {
    try {
      const response = await fetch(`/api/fetchLikedFeed?page=${pageNum}`);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          setLoading(false);
          return { posts: [], hasMore: false };
        }
        throw new Error('Failed to fetch liked posts');
      }

      const data = await response.json();
      return {
        posts: data.posts || [],
        hasMore: data.hasMore || false,
      };
    } catch (err) {
      console.error('Error fetching liked posts:', err);
      setError('Failed to load liked posts');
      return { posts: [], hasMore: false };
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialPosts = async () => {
      setLoading(true);
      const { posts: newPosts, hasMore: more } = await fetchLikedPosts(1);
      setPosts(newPosts);
      setHasMore(more);
      setLoading(false);
    };

    loadInitialPosts();
  }, [fetchLikedPosts]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const { posts: newPosts, hasMore: more } = await fetchLikedPosts(nextPage);

    setPosts(prev => [...prev, ...newPosts]);
    setHasMore(more);
    setPage(nextPage);
    setLoadingMore(false);
  }, [page, hasMore, loadingMore, fetchLikedPosts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, loadMore]);

  // Handle like/unlike
  const handleLike = async (id: number) => {
    setPosts(prev => {
      return prev
        .map(item => {
          if (item.id !== id) return item;
          const isLiked = !!item.liked;
          const voteValue = isLiked ? -1 : 1;
          const updatedItem = {
            ...item,
            liked: !isLiked,
            votes: (item.votes || 0) + (isLiked ? -1 : 1),
          };

          // fire and forget, same为其它地方的 /api/vote 调用
          fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: item.id,
              parentCommentId: null,
              authUserId: null,
              value: voteValue,
            }),
          }).catch(err => console.error('Failed to update like status', err));

          return updatedItem;
        })
        .filter(item => item.liked); // 在 Liked 里，如被取消点赞就从列表移除
    });
  };

  const handleCommentChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    // Liked 页只是展示，不在这里发评论
  };

  const handleComment = async (_id: number, _parentCommentId?: number) => {
    // no-op in liked tab
  };

  const handleOpen = (id: number, uniqid: string) => {
    router.push(`/post/${uniqid}`);
  };

  const handleClose = () => {
    // Liked 不弹 modal，这里留空即可
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Spinner size='lg' color='default' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <p className='text-muted-foreground'>{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center'>
          <svg
            className='w-12 h-12 text-muted-foreground'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
            />
          </svg>
        </div>
        <p className='text-muted-foreground text-lg'>{t('profile:noLikedPosts')}</p>
        <p className='text-muted-foreground text-sm mt-2'>
          {t('profile:noLikedPostsMessage')}
        </p>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={{
          default: 4,
          1200: 3,
          640: 2,
        }}
        className='flex gap-2 md:gap-4 min-h-screen'
        columnClassName='my-masonry-grid_column'>
        {posts.map(post => (
          <PostCard
            key={`post-${post.id}-${post.uniqid}`}
            item={post as any}
            handleOpen={handleOpen}
            handleLike={handleLike}
            handleComment={handleComment}
            handleCommentChange={handleCommentChange}
            comment={''}
            isOpen={false}
            handleClose={handleClose}
            useAnchor
          />
        ))}
      </Masonry>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className='flex justify-center py-4'>
          {loadingMore && <Spinner size='md' />}
        </div>
      )}

      {/* End message */}
      {!hasMore && posts.length > 0 && (
        <p className='text-center text-muted-foreground py-4'>
          {t('profile:noMorePosts')}
        </p>
      )}
    </>
  );
};
