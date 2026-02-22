import React from 'react';
import { CommentItem } from './CommentItem';
import { Comment } from '../../state';
import { useTranslation } from 'react-i18next';

interface CommentListProps {
  comments: Comment[];
  onReply: (
    parentCommentId: number,
    content: string,
    replyToCommentId?: number,
    replyToUserId?: string,
  ) => void;
  onLike: (commentId: number) => void;
  onFocusReply?: (parentCommentId: number, replyToCommentId?: number) => void; // Focus on bottom input field callback
  replyingToCommentId?: number; // Currently replying to comment ID
  replyingToNestedCommentId?: number; // Currently replying to nested comment ID
  onToggleReply?: (commentId: number) => void; // Toggle reply state
  onVote?: (commentId: number) => void; // Comment vote handler
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  onReply,
  onLike,
  onFocusReply,
  replyingToCommentId,
  replyingToNestedCommentId,
  onToggleReply,
  onVote,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className='comment-list space-y-3'>
      {comments.map((comment, index) => (
        <CommentItem
          key={comment.id ?? index}
          comment={comment}
          onReply={onReply}
          onLike={onLike}
          onFocusReply={onFocusReply}
          isReplying={replyingToCommentId === comment.id}
          onToggleReply={onToggleReply}
          onVote={onVote}
          replyingToCommentId={replyingToNestedCommentId}
          replyingToParentCommentId={replyingToCommentId}
        />
      ))}
      {comments.length > 0 && (
        <div className='flex justify-center items-center mt-5 mb-5 w-full text-base text-default-500'>
          {t('post_card.the_end_dash')}
        </div>
      )}
    </div>
  );
};
