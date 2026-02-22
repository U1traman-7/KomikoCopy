import { atom } from 'jotai';

// 已举报的帖子 ID 列表（用于客户端乐观更新过滤）
export const reportedPostIdsAtom = atom<number[]>([]);

// 检查某帖子是否已被当前用户举报
export const isPostReportedAtom = atom(get => {
  const reportedPostIds = get(reportedPostIdsAtom);
  return (postId: number) => reportedPostIds.includes(postId);
});
