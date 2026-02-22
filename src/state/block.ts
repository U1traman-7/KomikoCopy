import { atom } from 'jotai';

// 被屏蔽用户 ID 列表（用于快速查找）
export const blockedUserIdsAtom = atom<string[]>([]);

// 检查某用户是否被当前用户屏蔽
export const isUserBlockedAtom = atom(get => {
  const blockedUserIds = get(blockedUserIdsAtom);
  return (userId: string) => blockedUserIds.includes(userId);
});

// 屏蔽用户详细信息
export interface BlockedUserInfo {
  id: string;
  user_name: string;
  image: string;
  user_uniqid: string;
  blocked_at: string;
}

// 屏蔽用户详细列表（用于设置页面展示）
export const blockedUsersListAtom = atom<BlockedUserInfo[]>([]);
