/* eslint-disable */
import { Button, Modal, ModalContent, Tooltip } from '@nextui-org/react';
import { downloadURI, shareLink } from '../utilities';
import { addWatermark } from '../utilities/watermark';
import toast from 'react-hot-toast';
import { HiOutlineDownload, HiOutlineTrash } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { IconShare3, IconCopy } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { exportImageAtom, postGeneratedImageUrlsAtom } from 'state';
import { useAtom } from 'jotai';
import React, { memo, useState } from 'react';
import { ToolsButtonGroup } from '../Components/ToolsPage/ResultCard';

interface ModalImageProps {
  activeImageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  model?: string;
  generationId?: number | string;
  type?: 'image' | 'ai-anime-generator';
  onDelete?: () => void;
}

function ModalImage({
  activeImageUrl,
  isOpen,
  onClose,
  prompt,
  model,
  generationId,
  type = 'image',
  onDelete,
}: ModalImageProps) {
  const { t } = useTranslation(['common', 'profile_gallery']);
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      toast.success(t('common:success.copy'));
    }
  };

  const handleDelete = async () => {
    if (!generationId) {
      toast.error('Missing required data for deletion');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/tools/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'deleteImage',
          id: generationId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t('common:success.delete'));
        setShowDeleteConfirm(false);
        onDelete?.();
        onClose();
      } else {
        toast.error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        size='4xl'
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
              <img
                className='w-full h-auto max-h-[40vh] md:max-h-[70vh] object-contain'
                src={activeImageUrl}
                alt={t('common:alt.generated_image')}
                onClick={e => e.stopPropagation()}
              />
            </div>
            <div className='flex flex-col justify-between p-5 h-auto md:w-1/2'>
              <div className='flex flex-col gap-4'>
                <div>
                  <h3 className='mb-2 text-lg font-semibold'>
                    {t('profile_gallery:modal.model')}
                  </h3>
                  <p className='text-muted-foreground'>{model || ''}</p>
                </div>
                <div>
                  <h3 className='mb-2 text-lg font-semibold'>
                    {t('profile_gallery:modal.prompt')}
                  </h3>
                  <div className='flex gap-2 items-start'>
                    <p className='flex-1 text-muted-foreground'>
                      {prompt?.split?.(', best quality, 4k')?.[0]}
                    </p>
                    <Button isIconOnly variant='light' onClick={copyPrompt}>
                      <IconCopy className='w-5 h-5' />
                    </Button>
                  </div>
                </div>

                {/* Tool buttons */}
                <div>
                  <h3 className='mb-2 text-lg font-semibold'>
                    {t('common:result_card.tools.title')}
                  </h3>
                  <ToolsButtonGroup
                    type={type || 'image'}
                    mediaUrl={activeImageUrl}
                    prompt={prompt}
                    showPublish={false}
                    buttonSize='sm'
                    responsive={false}
                    className='flex justify-start'
                  />
                </div>
              </div>
              <div className='flex gap-2 pt-4 mt-4 border-t border-border'>
                <Tooltip content={t('common:actions.download')}>
                  <Button
                    isIconOnly
                    className='bg-transparent w-[30px] min-w-[30px]'
                    onClick={async () => {
                      const watermarkedImage =
                        type !== 'ai-anime-generator'
                          ? await addWatermark(activeImageUrl)
                          : activeImageUrl;
                      const ext = watermarkedImage.split('.').pop() || 'jpg';
                      downloadURI(watermarkedImage, `KomikoAI.${ext}`);
                      toast.success(t('profile_gallery:modal.downloadSuccess'));
                    }}>
                    <HiOutlineDownload className='w-5 h-5' />
                  </Button>
                </Tooltip>
                {generationId && (
                  <Tooltip content={t('common:actions.delete')}>
                    <Button
                      isIconOnly
                      className='bg-transparent text-red-500 hover:text-red-700 w-[30px] min-w-[30px]'
                      onClick={() => setShowDeleteConfirm(true)}>
                      <HiOutlineTrash className='w-5 h-5' />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content={t('common:actions.share')}>
                  <Button
                    isIconOnly
                    className='bg-transparent w-[30px] min-w-[30px]'
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          const response = await fetch(
                            await addWatermark(activeImageUrl),
                          );
                          const blob = await response.blob();
                          const file = new File([blob], 'Komiko.jpg', {
                            type: blob.type,
                          });

                          await navigator.share({
                            files: [file],
                          });
                          console.log('Image shared successfully');
                        } catch (error) {
                          console.error('Error sharing image:', error);
                        }
                      } else {
                        shareLink(
                          activeImageUrl,
                          t('profile_gallery:modal.shareText'),
                          '',
                        );
                      }
                    }}>
                    <IconShare3 stroke={1.75} className='w-5 h-5' />
                  </Button>
                </Tooltip>
                <Button
                  color='primary'
                  className='w-full'
                  onClick={() => {
                    // 使用URL参数传递数据，与ResultCard保持一致
                    const queryParams = new URLSearchParams();
                    queryParams.append('mediaType', 'image');
                    queryParams.append('source', 'modal');
                    queryParams.append('mediaUrl', activeImageUrl);
                    queryParams.append(
                      'generationId',
                      (generationId ?? '') + '',
                    );
                    if (prompt) {
                      queryParams.append('prompt', prompt);
                    }
                    router.push(`/publish?${queryParams.toString()}`);
                  }}>
                  {t('profile_gallery:modal.postButton')}
                </Button>
              </div>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size='sm'
        placement='center'>
        <ModalContent>
          <div className='p-6'>
            <h3 className='text-lg font-semibold mb-4'>
              {t('common:actions.confirm_delete')}
            </h3>
            <p className='text-muted-foreground mb-6'>
              {t('common:actions.delete_warning')}
            </p>
            <div className='flex gap-2 justify-end'>
              <Button
                variant='light'
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                color='danger'
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}>
                {t('common:actions.delete')}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

export default memo(ModalImage);
