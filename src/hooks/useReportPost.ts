import { useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { reportedPostIdsAtom } from '../state/report';
import { authAtom } from '../state';

/**
 * 帖子举报功能 hook
 * 提供举报帖子、检查举报状态等功能
 */
export function useReportPost() {
  const { t } = useTranslation('common');
  const isAuth = useAtomValue(authAtom);
  const [reportedPostIds, setReportedPostIds] = useAtom(reportedPostIdsAtom);

  // 检查某帖子是否已被举报
  const isReported = useCallback(
    (postId: number) => reportedPostIds.includes(postId),
    [reportedPostIds],
  );

  // 举报帖子
  const reportPost = useCallback(
    async (postId: number, reason?: string): Promise<boolean> => {
      if (!isAuth) {
        toast.error(t('toasts.loginRequired'));
        return false;
      }

      try {
        const response = await fetch('/api/post/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            postId,
            reason: reason || 'inappropriate',
          }),
        });

        if (!response.ok) {
          toast.error(t('toasts.reportFailed'));
          return false;
        }

        const data = await response.json();

        if (data.code === 1) {
          // 乐观更新本地状态
          setReportedPostIds(prev => {
            if (prev.includes(postId)) {
              return prev;
            }
            return [...prev, postId];
          });
          toast.success(t('toasts.postReported'));
          return true;
        }

        // 处理已举报的情况
        if (data.error === 'You have already reported this post') {
          toast.error(t('toasts.alreadyReported'));
          // 确保本地状态一致
          setReportedPostIds(prev => {
            if (prev.includes(postId)) {
              return prev;
            }
            return [...prev, postId];
          });
          return false;
        }

        toast.error(data.error || t('toasts.reportFailed'));
        return false;
      } catch (error) {
        console.error('Error reporting post:', error);
        toast.error(t('toasts.reportFailed'));
        return false;
      }
    },
    [isAuth, setReportedPostIds, t],
  );

  return {
    reportedPostIds,
    isReported,
    reportPost,
  };
}
