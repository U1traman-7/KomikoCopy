import React, { useState } from 'react';
import { Button, Input } from '@nextui-org/react';
import { Send, X } from 'lucide-react';

interface CommentReplyProps {
  parentCommentId: number;
  onReply: (content: string) => void;
  onCancel: () => void;
}

export const CommentReply: React.FC<CommentReplyProps> = ({
  parentCommentId,
  onReply,
  onCancel
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onReply(content.trim());
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        variant="bordered"
        size="sm"
        className="flex-1"
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        color="primary"
        size="sm"
        isDisabled={!content.trim() || isSubmitting}
        isLoading={isSubmitting}
        isIconOnly
      >
        {!isSubmitting && <Send size={16} />}
      </Button>
      <Button
        type="button"
        variant="light"
        size="sm"
        onClick={onCancel}
        isDisabled={isSubmitting}
        isIconOnly
      >
        <X size={16} />
      </Button>
    </form>
  );
};
