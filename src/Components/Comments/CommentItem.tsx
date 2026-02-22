import React, { useState } from 'react';
import { Avatar, Button } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { Comment } from '../../state';

interface CommentItemProps {
  comment: Comment;
  onReply: (
    parentCommentId: number,
    content: string,
    replyToCommentId?: number,
  ) => void;
  onLike: (commentId: number) => void;
  onFocusReply?: (parentCommentId: number, replyToCommentId?: number) => void; // Focus on bottom input field callback
  isReplying?: boolean; // Whether currently replying to this comment
  onToggleReply?: (commentId: number) => void; // Toggle reply state
  onVote?: (commentId: number) => void; // Comment vote handler
  replyingToCommentId?: number; // Which specific comment is being replied to (for second-level)
  replyingToParentCommentId?: number; // The parent comment ID if replying to a nested comment
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onFocusReply,
  isReplying = false,
  onToggleReply,
  onVote,
  replyingToCommentId,
  replyingToParentCommentId,
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [showAllReplies, setShowAllReplies] = useState(false);

  const repliesCount = comment.children?.length || 0;

  const handleAvatarClick = () => {
    // Navigate to user profile page using user_uniqid if available, fallback to user_name
    const userIdentifier = comment.user_uniqid || comment.user_name;
    router.push(`/user/${userIdentifier}`);
  };

  const handleReplyClick = () => {
    if (isReplying) {
      // Cancel state - clear the reply
      if (onFocusReply) {
        onFocusReply(0); // Pass 0 to indicate cancel
      }
    } else {
      // Reply state - focus on this first-level comment
      if (onFocusReply && comment.id) {
        onFocusReply(comment.id, undefined); // Pass undefined for replyToCommentId to indicate first-level
      }
    }
  };

  const handleRepliesClick = () => {
    setShowAllReplies(!showAllReplies);
  };

  const handleVote = () => {
    if (onVote && comment.id) {
      onVote(comment.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return t('time.just_now');
    }
    if (minutes < 60) {
      return t('time.minutes_ago', { count: minutes });
    }
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return t('time.hours_ago', { count: hours });
    }
    const days = Math.floor(minutes / 1440);
    return t('time.days_ago', { count: days });
  };

  return (
    <div className='comment-item'>
      {/* Main comment */}
      <div className='flex gap-2 items-start'>
        <Avatar
          src={comment.image}
          name={comment.user_name}
          size='sm'
          className='cursor-pointer flex-shrink-0'
          onClick={handleAvatarClick}
        />

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            <span
              className='text-sm text-muted-foreground hover:text-blue-500 cursor-pointer transition-colors'
              onClick={handleAvatarClick}>
              {comment.user_name}
            </span>
            <span className='text-xs text-muted-foreground'>
              {formatTime(comment.created_at)}
            </span>
          </div>

          <div className='text-sm text-foreground'>{comment.content}</div>

          {/* Reply and Replies buttons for first-level comments */}
          <div className='flex items-center gap-4 text-sm flex-wrap mt-0.5'>
            <button
              onClick={handleReplyClick}
              className={`text-muted-foreground hover:text-foreground transition-colors ${
                isReplying ? 'text-blue-500' : ''
              }`}>
              {isReplying ? t('post_card.cancel') : t('post_card.reply')}
            </button>

            {repliesCount > 0 && (
              <button
                onClick={handleRepliesClick}
                className='text-muted-foreground hover:text-foreground transition-colors'>
                {repliesCount === 1
                  ? t('post_card.reply1')
                  : t('post_card.replies', { count: repliesCount })}
              </button>
            )}
          </div>
        </div>

        {/* Like icon on the far right */}
        <div className='flex-shrink-0 mt-1'>
          <button
            onClick={handleVote}
            className='flex items-center gap-1 text-sm'>
            {comment.liked ? (
              <AiFillHeart className='text-red-500' />
            ) : (
              <AiOutlineHeart className='text-muted-foreground' />
            )}
            <span
              className={
                comment.liked ? 'text-red-500' : 'text-muted-foreground'
              }>
              {comment.votes}
            </span>
          </button>
        </div>
      </div>

      {/* Child comments - based on image structure */}
      {comment.children && comment.children.length > 0 && showAllReplies && (
        <div className='ml-8 mt-3 space-y-2'>
          {comment.children.map((reply, index) => (
            <div key={reply.id || index} className='flex gap-2 items-start'>
              <Avatar
                src={reply.image}
                name={reply.user_name}
                size='sm'
                className='cursor-pointer flex-shrink-0'
                onClick={() => {
                  const userIdentifier = reply.user_uniqid || reply.user_name;
                  router.push(`/user/${userIdentifier}`);
                }}
              />

              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  {/* eslint-disable-next-line */}
                  <span
                    className='text-sm text-muted-foreground hover:text-blue-500 cursor-pointer transition-colors'
                    onClick={() => {
                      const userIdentifier =
                        reply.user_uniqid || reply.user_name;
                      router.push(`/user/${userIdentifier}`);
                    }}>
                    {reply.user_name}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {formatTime(reply.created_at)}
                  </span>
                </div>

                <div className='text-sm text-foreground'>
                  {reply.reply_to_user_name ? (
                    <span className='text-muted-foreground'>
                      @{reply.reply_to_user_name} &nbsp;
                    </span>
                  ) : (
                    ''
                  )}
                  {reply.content}
                </div>

                {/* Reply button for second-level comments */}
                <div>
                  <button
                    onClick={() => {
                      // When replying to a second-level comment
                      if (replyingToCommentId === reply.id) {
                        // Cancel reply - clear the state
                        if (onFocusReply) {
                          onFocusReply(0);
                        }
                      } else {
                        // Start replying to this nested comment
                        // Use the original parent comment ID
                        // This ensures the reply appears under the first-level comment
                        // But also pass the reply-to comment ID for email notification
                        if (onFocusReply && comment.id) {
                          onFocusReply(comment.id, reply.id);
                        }
                      }
                    }}
                    className={`text-muted-foreground hover:text-foreground transition-colors text-sm ${
                      replyingToCommentId === reply.id ? 'text-blue-500' : ''
                    }`}>
                    {replyingToCommentId === reply.id
                      ? t('post_card.cancel')
                      : t('post_card.reply')}
                  </button>
                </div>
              </div>

              {/* Like icon on the far right */}
              <div className='flex-shrink-0 mt-1'>
                <button
                  onClick={() => reply.id && onVote?.(reply.id)}
                  className='flex items-center gap-1 text-sm'>
                  {reply.liked ? (
                    <AiFillHeart className='text-red-500' />
                  ) : (
                    <AiOutlineHeart className='text-muted-foreground' />
                  )}
                  <span
                    className={
                      reply.liked ? 'text-red-500' : 'text-muted-foreground'
                    }>
                    {reply.votes}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
