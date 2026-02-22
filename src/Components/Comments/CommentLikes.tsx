import React, { useState } from 'react';
import { Button } from '@nextui-org/react';
import { Heart } from 'lucide-react';

interface CommentLikesProps {
  commentId: number;
  likesCount: number;
  onLike: (commentId: number) => void;
}

export const CommentLikes: React.FC<CommentLikesProps> = ({
  commentId,
  likesCount,
  onLike
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(likesCount);

  const handleLike = async () => {
    try {
      // Use existing vote API with commentId
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          value: isLiked ? -1 : 1,
        }),
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setCount(prev => isLiked ? prev - 1 : prev + 1);
        onLike(commentId);
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  return (
    <div 
      className="flex items-center gap-1 cursor-pointer hover:bg-muted p-1 rounded"
      onClick={handleLike}
    >
      <Heart 
        size={16} 
        fill={isLiked ? '#ef4444' : 'none'} 
        stroke={isLiked ? '#ef4444' : '#6b7280'}
        className="transition-colors"
      />
      {count > 0 && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </div>
  );
};
