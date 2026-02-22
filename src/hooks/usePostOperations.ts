import { useState, useCallback, useRef } from 'react';
import { Post, Profile } from '../state';
import { ROLES } from '@/components/Feed';
import toast from 'react-hot-toast';

interface UsePostOperationsProps {
  profile: Profile;
  isAuth: boolean;
  openLoginModal: () => void;
  setList?: React.Dispatch<React.SetStateAction<Post[]>>;
}

export function usePostOperations({
  profile,
  isAuth,
  openLoginModal,
  setList,
}: UsePostOperationsProps) {
  // 评论状态
  const [comment, setComment] = useState('');
  const canCallRef = useRef(true);

  // 检查用户是否为admin
  const isAdmin = profile?.roles?.includes(ROLES.ADMIN) || false;

  // 判断是否显示更多选项：如果是自己的post或者是admin用户
  const shouldShowMore = useCallback(
    (item: Post) => item.authUserId === profile?.id || isAdmin,
    [profile?.id, isAdmin],
  );

  // 判断是否显示删除按钮：只有自己的post才能删除
  const shouldShowDelete = useCallback(
    (item: Post) => item.authUserId === profile?.id,
    [profile?.id],
  );

  // 处理点赞
  const handleLike = useCallback(
    (id: number) => {
      if (!isAuth) {
        openLoginModal();
        return;
      }

      if (!setList) {
        return;
      }

      setList(prevList =>
        prevList.map(item => {
          if (item.id === id) {
            const updatedItem = {
              ...item,
              liked: !item.liked,
              votes: item.liked ? item.votes - 1 : item.votes + 1,
            };
            const voteValue = item.liked ? -1 : 1;

            // Make API call to update like count on the server
            fetch('/api/vote', {
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
        }),
      );
    },
    [isAuth, openLoginModal, setList],
  );

  // 处理关注
  const handleFollow = useCallback(
    (id: number) => {
      if (!isAuth) {
        openLoginModal();
        return;
      }

      if (!setList) {
        return;
      }

      setList(prevList =>
        prevList.map(item => {
          if (item.id === id) {
            const updatedItem = { ...item, followed: !item.followed };
            const followValue = item.followed ? -1 : 1;

            // Make API call to update follow
            fetch('/api/follow', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                followingUserId: item.authUserId,
                value: followValue,
              }),
            });
            return updatedItem;
          }
          return item;
        }),
      );
    },
    [isAuth, openLoginModal, setList],
  );

  // 处理隐藏帖子
  const handleHidePost = useCallback(
    (postId: number) => {
      if (!setList) {
        return;
      }
      setList(prevList => prevList.filter(post => post.id !== postId));
    },
    [setList],
  );

  // 处理评论输入变化
  const handleCommentChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setComment(event.target.value);
    },
    [],
  );

  // 处理评论提交
  const handleComment = useCallback(
    async (
      id: number,
      parentCommentId?: number,
      replyToUserId?: string,
      replyToCommentId?: number,
    ) => {
      if (!isAuth) {
        openLoginModal();
        return;
      }

      if (!canCallRef.current) {
        console.log('Cooldown active. Please wait.');
        return;
      }

      if (!comment.trim()) {
        console.log('Empty comment. Skipping.');
        return;
      }

      if (!setList) {
        return;
      }

      canCallRef.current = false;
      setTimeout(() => {
        canCallRef.current = true;
      }, 3000);

      // 使用函数式更新来获取当前列表并更新
      setList(prevList => {
        // 异步更新评论
        (async () => {
          const updatedList = await Promise.all(
            prevList.map(async item => {
              if (item.id === id) {
                try {
                  const response = await fetch('/api/comment', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      postId: item.id,
                      parentCommentId,
                      replyToUserId,
                      content: comment,
                      item,
                      replyToCommentId,
                    }),
                  });

                  const new_comments = await response.json();
                  if (!response.ok) {
                    toast.error(new_comments.error || 'Failed to post comment');
                    return item;
                  }

                  return {
                    ...item,
                    comments: new_comments,
                  };
                } catch (error) {
                  toast.error('Failed to post comment');
                  return item;
                }
              }
              return item;
            }),
          );

          // 更新列表
          setList(updatedList);
          // 清空评论
          setComment('');
        })();

        // 先返回当前列表，异步更新会在之后处理
        return prevList;
      });
    },
    [isAuth, openLoginModal, setList, comment],
  );

  return {
    isAdmin,
    shouldShowMore,
    shouldShowDelete,
    handleLike,
    handleFollow,
    handleHidePost,
    handleComment,
    handleCommentChange,
    comment,
    setComment,
  };
}
