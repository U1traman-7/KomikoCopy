import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Spinner,
  Image,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { IconEyeOff, IconEye, IconExternalLink } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface HiddenPost {
  post_id: number;
  hidden_at: string;
  hidden_by: string;
  post?: {
    id: number;
    uniqid: string;
    title: string;
    media: string[];
    authUserId: string;
    user?: {
      user_name: string;
      image: string;
    };
  };
}

interface HiddenPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: number;
  tagName: string;
  onUnhide?: () => void;
}

export const HiddenPostsModal: React.FC<HiddenPostsModalProps> = ({
  isOpen,
  onClose,
  tagId,
  tagName,
  onUnhide,
}) => {
  const { t } = useTranslation('tags');
  const [hiddenPosts, setHiddenPosts] = useState<HiddenPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unhidingPostId, setUnhidingPostId] = useState<number | null>(null);

  const fetchHiddenPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tag/posts?tagId=${tagId}&check=hidden`);
      const data = await response.json();
      if (response.ok && data.posts) {
        setHiddenPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching hidden posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tagId]);

  useEffect(() => {
    if (isOpen) {
      fetchHiddenPosts();
    }
  }, [isOpen, fetchHiddenPosts]);

  const handleUnhide = async (postId: number) => {
    setUnhidingPostId(postId);
    try {
      const response = await fetch('/api/tag/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          tagId,
          action: 'unhide',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to unhide post');
        return;
      }

      toast.success(t('hiddenPosts.unhideSuccess'));
      setHiddenPosts(prev => prev.filter(p => p.post_id !== postId));
      onUnhide?.();
    } catch (error) {
      toast.error('Failed to unhide post');
    } finally {
      setUnhidingPostId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 border-b-[1px]">
          <IconEyeOff size={20} />
          {t('hiddenPosts.title')}
          <span className="text-sm font-normal text-default-500">#{tagName}</span>
        </ModalHeader>
        <ModalBody className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : hiddenPosts.length === 0 ? (
            <div className="text-center py-8 text-default-400">
              {t('hiddenPosts.empty')}
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenPosts.map((item) => (
                <div
                  key={item.post_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors"
                >
                  {/* Clickable area - Thumbnail + Post info */}
                  <Link
                    href={`/post/${item.post?.uniqid || item.post_id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    target="_blank"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-default-200">
                      {item.post?.media?.[0] && (
                        <Image
                          src={item.post.media[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Post info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">
                        {item.post?.title || `Post #${item.post_id}`}
                        <IconExternalLink size={12} className="text-default-400 flex-shrink-0" />
                      </p>
                      <p className="text-xs text-default-400">
                        {item.post?.user?.user_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-default-400">
                        {t('hiddenPosts.hiddenAt')}: {new Date(item.hidden_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>

                  {/* Unhide button */}
                  <Button
                    size="sm"
                    variant="flat"
                    color="success"
                    startContent={<IconEye size={16} />}
                    isLoading={unhidingPostId === item.post_id}
                    onPress={() => handleUnhide(item.post_id)}
                  >
                    {t('hiddenPosts.unhide')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default HiddenPostsModal;

