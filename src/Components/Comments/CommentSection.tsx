import React, { useState, useEffect } from 'react';
import { CommentList } from './CommentList';
import { Comment } from '../../state';

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  onCommentSubmit: (
    content: string,
    parentCommentId?: number,
    replyToCommentId?: number,
    replyToUserId?: string,
  ) => Promise<void>;
  onFocusReply?: (parentCommentId: number, replyToCommentId?: number) => void; // Focus on bottom input field callback
  onVote?: (commentId: number) => void; // Comment vote handler
  shouldClearCommentSection?: number; // Signal to clear comment section state
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onCommentSubmit,
  onFocusReply,
  onVote,
  shouldClearCommentSection,
}) => {
  const [replyingToCommentId, setReplyingToCommentId] = useState<
    number | undefined
  >();
  const [replyingToNestedCommentId, setReplyingToNestedCommentId] = useState<
    number | undefined
  >();
  const [activeParentCommentId, setActiveParentCommentId] = useState<
    number | undefined
  >(); // Track parent when replying to nested

  // Listen for clear signal from parent
  useEffect(() => {
    if (shouldClearCommentSection && shouldClearCommentSection > 0) {
      setReplyingToCommentId(undefined);
      setReplyingToNestedCommentId(undefined);
      setActiveParentCommentId(undefined);
    }
  }, [shouldClearCommentSection]);

  const handleToggleReply = (commentId: number) => {
    setReplyingToCommentId(
      replyingToCommentId === commentId ? undefined : commentId,
    );
  };

  const handleFocusReply = (
    parentCommentId: number,
    replyToCommentId?: number,
  ) => {
    if (parentCommentId === 0) {
      // Cancel reply - clear the state
      setReplyingToCommentId(undefined);
      setReplyingToNestedCommentId(undefined);
      setActiveParentCommentId(undefined);
      onFocusReply?.(parentCommentId);
    } else {
      // If replying to a nested comment (second-level), only track the nested ID
      // If replying to a first-level comment, only track the parent ID
      if (replyToCommentId) {
        // Replying to a nested (second-level) comment
        setReplyingToCommentId(undefined); // Don't show cancel on parent
        setReplyingToNestedCommentId(replyToCommentId);
        setActiveParentCommentId(parentCommentId); // Track parent for API call
      } else {
        // Replying to a first-level comment
        setReplyingToCommentId(parentCommentId);
        setReplyingToNestedCommentId(undefined); // Clear any nested reply
        setActiveParentCommentId(undefined);
      }

      if (onFocusReply) {
        onFocusReply(parentCommentId, replyToCommentId);
      }
    }
  };

  return (
    <div className='comment-section'>
      <div className='mt-1'>
        <CommentList
          comments={comments}
          onReply={async (
            parentCommentId,
            content,
            replyToCommentId,
            replyToUserId,
          ) => {
            try {
              await onCommentSubmit(
                content,
                parentCommentId,
                replyToCommentId,
                replyToUserId,
              );

              // Clear reply state after successful submission
              setReplyingToCommentId(undefined);
              setReplyingToNestedCommentId(undefined);
              setActiveParentCommentId(undefined);

              // Also notify PostCard to clear its state by calling onFocusReply with 0
              if (onFocusReply) {
                onFocusReply(0);
              }
            } catch (error) {
              // Error is already handled in onCommentSubmit
              console.error('Error submitting comment:', error);
            }
          }}
          onLike={commentId => {
            // Handle like action - the actual API call is in CommentLikes component
          }}
          onFocusReply={handleFocusReply}
          replyingToCommentId={replyingToCommentId}
          replyingToNestedCommentId={replyingToNestedCommentId}
          onToggleReply={handleToggleReply}
          onVote={onVote}
        />
      </div>
    </div>
  );
};
