import {
  Button,
  Modal,
  ModalContent,
  Tooltip,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@nextui-org/react';
import { addWatermark, downloadURI, shareLink } from '../utilities';
import toast from 'react-hot-toast';
import { HiOutlineDownload } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { IconShare3, IconCopy, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/router';

import { memo, useRef, useEffect, useState } from 'react';
import { ToolsButtonGroup } from '../Components/ToolsPage/ResultCard';

interface ModalVideoProps {
  activeVideoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  prompt?: string;
  model?: string;
  tool?: string;
  videoId?: number;
  onDelete?: (videoId: number) => void;
}

function ModalVideo({
  activeVideoUrl,
  isOpen,
  onClose,
  prompt = '',
  model = '',
  tool = '',
  videoId,
  onDelete,
}: ModalVideoProps) {
  const { t } = useTranslation(['common', 'profile']);

  // 工具名称映射函数
  const getToolDisplayName = (toolName: string): string => {
    const toolKey = `profile:tools.${toolName}`;
    const translatedName = t(toolKey);

    // 如果翻译键不存在，返回原始名称的格式化版本
    if (translatedName === toolKey) {
      return toolName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return translatedName;
  };
  const router = useRouter();
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 检查是否应该隐藏 prompt（针对特定工具和模型组合）
  const shouldHidePrompt = (): boolean => {
    if (tool === 'video-effect' && model) {
      const modelLower = model.toLowerCase();
      return modelLower.includes('sora') && modelLower.includes('text');
    }
    return false;
  };
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const copyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      toast.success(t('common:success.copy'));
    }
  };

  // 当modal打开时配置视频
  useEffect(() => {
    if (isOpen && modalVideoRef.current) {
      modalVideoRef.current.muted = false;
      modalVideoRef.current.volume = 0.7;
      modalVideoRef.current.controls = true;

      modalVideoRef.current.play().catch(err => {
        console.error('Failed to auto-play modal video:', err);
        if (err.name === 'NotAllowedError' && modalVideoRef.current) {
          modalVideoRef.current.muted = true;
          modalVideoRef.current
            .play()
            .catch(e =>
              console.error('Still failed to play even with mute:', e),
            );
        }
      });
    }
  }, [isOpen]);

  const downloadVideo = async () => {
    try {
      const response = await fetch(activeVideoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KomikoAI-video.mp4';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('profile:downloadSuccess'));
    } catch (error) {
      console.error('Failed to download video:', error);
      toast.error(t('common:error.downloadFailed'));
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoId || !onDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/deleteVideo?id=${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok) {
        onDelete(videoId);
        onDeleteModalClose();
        onClose();
        toast.success(t('profile:deleteVideoSuccess'));
      } else {
        console.error('Failed to delete video:', result.error);
        toast.error(t('profile:deleteVideoError'));
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error(t('profile:deleteVideoError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        size='2xl'
        isOpen={isOpen}
        onClose={onClose}
        closeButton
        placement='center'
        className='z-[101]'
        scrollBehavior='inside'
        classNames={{
          closeButton:
            'top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-50 backdrop-blur-sm border border-white/20',
        }}>
        <ModalContent className='max-h-[90vh] overflow-y-auto'>
          <div className='flex flex-col w-full h-full md:flex-row'>
            <div className='md:w-1/2' onClick={e => e.stopPropagation()}>
              <video
                ref={modalVideoRef}
                src={activeVideoUrl}
                controls
                className='w-full max-h-[30vh] md:max-h-[60vh] object-contain rounded-lg'
                autoPlay
                playsInline
                preload='auto'
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className='flex flex-col justify-between p-5 h-auto md:w-1/2'>
              <div className='flex flex-col gap-4'>
                {tool && (
                  <div>
                    <h3 className='mb-2 text-lg font-semibold'>
                      {t('profile:modal.tool')}
                    </h3>
                    <p className='text-muted-foreground'>
                      {getToolDisplayName(tool)}
                    </p>
                  </div>
                )}

                {model && (
                  <div>
                    <h3 className='mb-2 text-lg font-semibold'>
                      {t('profile:modal.model')}
                    </h3>
                    <p className='text-muted-foreground'>{model}</p>
                  </div>
                )}

                {prompt && !shouldHidePrompt() && (
                  <div>
                    <h3 className='mb-2 text-lg font-semibold'>
                      {t('profile:modal.prompt')}
                    </h3>
                    <div className='flex gap-2 items-start'>
                      <p className='flex-1 text-muted-foreground'>
                        {prompt.split(', best quality, 4k')[0]}
                      </p>
                      <Button isIconOnly variant='light' onClick={copyPrompt}>
                        <IconCopy className='w-5 h-5' />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tool buttons */}
                <div>
                  <h3 className='mb-2 text-lg font-semibold'>
                    {t('common:result_card.tools.title')}
                  </h3>
                  <ToolsButtonGroup
                    type='video'
                    mediaUrl={activeVideoUrl}
                    prompt={prompt}
                    showPublish={false}
                    buttonSize='sm'
                    responsive={false}
                    className='flex justify-start'
                  />
                </div>
              </div>

              <div className='flex gap-2 mt-4 border-t pt-4 border-border'>
                <Tooltip content={t('common:actions.download')}>
                  <Button
                    isIconOnly
                    className='bg-transparent'
                    onClick={downloadVideo}>
                    <HiOutlineDownload className='w-5 h-5' />
                  </Button>
                </Tooltip>
                <Tooltip content={t('common:actions.share')}>
                  <Button
                    isIconOnly
                    className='bg-transparent'
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          const response = await fetch(activeVideoUrl);
                          const blob = await response.blob();
                          const file = new File([blob], 'KomikoAI-video.mp4', {
                            type: blob.type,
                          });

                          await navigator.share({
                            files: [file],
                          });
                          console.log('Video shared successfully');
                        } catch (error) {
                          console.error('Error sharing video:', error);
                          shareLink(
                            activeVideoUrl,
                            t('profile:modal.shareText'),
                            '',
                          );
                        }
                      } else {
                        shareLink(
                          activeVideoUrl,
                          t('profile:modal.shareText'),
                          '',
                        );
                      }
                    }}>
                    <IconShare3 stroke={1.75} className='w-5 h-5' />
                  </Button>
                </Tooltip>
                {videoId && onDelete && (
                  <Tooltip content={t('profile:deleteVideo')}>
                    <Button
                      isIconOnly
                      className='bg-transparent text-danger'
                      onClick={onDeleteModalOpen}>
                      <IconTrash className='w-5 h-5' />
                    </Button>
                  </Tooltip>
                )}
                <Button
                  color='primary'
                  className='w-full'
                  onClick={() => {
                    const queryParams = new URLSearchParams();
                    queryParams.append('mediaType', 'video');
                    queryParams.append('source', 'modal');
                    queryParams.append('mediaUrl', activeVideoUrl);
                    if (prompt) {
                      queryParams.append('prompt', prompt);
                    }
                    router.push(`/publish?${queryParams.toString()}`);
                  }}>
                  {t('profile:modal.postButton')}
                </Button>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        size='sm'
        placement='center'>
        <ModalContent>
          <ModalHeader>
            <h3 className='text-lg font-semibold'>
              {t('profile:confirmDeleteVideo')}
            </h3>
          </ModalHeader>
          <ModalBody>
            <p>{t('profile:confirmDeleteVideoMessage')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={onDeleteModalClose}
              disabled={isDeleting}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              color='danger'
              onPress={handleDeleteVideo}
              isLoading={isDeleting}>
              {t('profile:deleteVideo')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default memo(ModalVideo);
