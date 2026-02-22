import { useCallback, useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { blockedUserIdsAtom } from '../state/block';
import { authAtom, profileAtom } from '../state';

/**
 * 用户屏蔽功能 hook
 * 提供屏蔽/取消屏蔽用户、检查屏蔽状态、初始化屏蔽列表等功能
 */
export function useBlockUser() {
  const { t } = useTranslation('common');
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);
  const [blockedUserIds, setBlockedUserIds] = useAtom(blockedUserIdsAtom);

  // 初始化屏蔽用户列表
  const fetchBlockedUsers = useCallback(async () => {
    if (!isAuth || !profile?.id) {
      return;
    }

    try {
      const response = await fetch('/api/user/blocked-list', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch blocked users: HTTP', response.status);
        return;
      }

      const data = await response.json();

      if (data.code === 1 && data.data?.blockedUsers) {
        const ids = data.data.blockedUsers.map(
          (user: { id: string }) => user.id,
        );
        setBlockedUserIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
    }
  }, [isAuth, profile?.id, setBlockedUserIds]);

  // 使用 Set 提升查找性能（O(1) vs O(n)）
  const blockedSet = useMemo(() => new Set(blockedUserIds), [blockedUserIds]);

  // 检查某用户是否被屏蔽
  const isBlocked = useCallback(
    (userId: string) => blockedSet.has(userId),
    [blockedSet],
  );

  // 屏蔽用户
  const blockUser = useCallback(
    async (targetUserId: string, targetUserName?: string) => {
      if (!isAuth) {
        toast.error(t('toasts.loginRequired'));
        return false;
      }

      if (targetUserId === profile?.id) {
        toast.error(t('toasts.cannotBlockSelf'));
        return false;
      }

      try {
        const response = await fetch('/api/user/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            targetUserId,
            action: 'block',
          }),
        });

        if (!response.ok) {
          toast.error(t('toasts.blockFailed'));
          return false;
        }

        const data = await response.json();

        if (data.code === 1) {
          // 乐观更新本地状态
          setBlockedUserIds(prev => {
            if (prev.includes(targetUserId)) {
              return prev;
            }
            return [...prev, targetUserId];
          });
          toast.success(
            targetUserName
              ? t('toasts.userBlockedName', { name: targetUserName })
              : t('toasts.userBlocked'),
          );
          return true;
        }
        toast.error(data.error || t('toasts.blockFailed'));
        return false;
      } catch (error) {
        console.error('Error blocking user:', error);
        toast.error(t('toasts.blockFailed'));
        return false;
      }
    },
    [isAuth, profile?.id, setBlockedUserIds, t],
  );

  // 取消屏蔽用户
  const unblockUser = useCallback(
    async (targetUserId: string, targetUserName?: string) => {
      if (!isAuth) {
        toast.error(t('toasts.loginRequired'));
        return false;
      }

      try {
        const response = await fetch('/api/user/block', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            targetUserId,
            action: 'unblock',
          }),
        });

        if (!response.ok) {
          toast.error(t('toasts.unblockFailed'));
          return false;
        }

        const data = await response.json();

        if (data.code === 1) {
          // 乐观更新本地状态
          setBlockedUserIds(prev => prev.filter(id => id !== targetUserId));
          toast.success(
            targetUserName
              ? t('toasts.userUnblockedName', { name: targetUserName })
              : t('toasts.userUnblocked'),
          );
          return true;
        }
        toast.error(data.error || t('toasts.unblockFailed'));
        return false;
      } catch (error) {
        console.error('Error unblocking user:', error);
        toast.error(t('toasts.unblockFailed'));
        return false;
      }
    },
    [isAuth, setBlockedUserIds, t],
  );

  return {
    blockedUserIds,
    isBlocked,
    blockUser,
    unblockUser,
    fetchBlockedUsers,
  };
}
