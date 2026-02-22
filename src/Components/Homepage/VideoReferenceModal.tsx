/**
 * VideoReferenceModal - Reference images modal for AI Video in QuickCreatePanel
 * Supports multiple reference images and first/end frame upload
 * No premium user restrictions
 */
import React, { memo, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Input,
  cn,
} from '@nextui-org/react';
import { HiOutlinePhotograph, HiOutlineTrash } from 'react-icons/hi';
import { MdDeleteSweep } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { FaImage } from 'react-icons/fa';
import { ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';

export interface VideoReferenceItem {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
}

interface VideoReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: VideoReferenceItem[];
  setReferences: React.Dispatch<React.SetStateAction<VideoReferenceItem[]>>;
  // End frame support
  endFrameImage?: string;
  onEndFrameChange?: (url: string) => void;
  onEndFrameRemove?: () => void;
  supportsEndFrame?: boolean;
  maxImages?: number;
}

export const VideoReferenceModal = memo(
  ({
    isOpen,
    onClose,
    references,
    setReferences,
    endFrameImage = '',
    onEndFrameChange,
    onEndFrameRemove,
    supportsEndFrame = true,
    maxImages = 7,
  }: VideoReferenceModalProps) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toast');
    const { t: tVideo } = useTranslation('video');
    const [isDragging, setIsDragging] = useState(false);

    // File size limits
    const MAX_SINGLE_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file

    const addFiles = async (files: File[]) => {
      // Check max image count
      if (references.length + files.length > maxImages) {
        toast.error(
          tToast('error.maximumImagesAllowed', { max: maxImages }) ||
            `Maximum ${maxImages} images allowed`,
        );
        return;
      }

      // Filter out files that are too large
      const validFiles = files.filter(file => {
        if (file.size > MAX_SINGLE_FILE_SIZE) {
          toast.error(
            tToast('error.someFilesTooLarge', { max: '25MB' }) ||
              'Some files are too large (max 25MB)',
          );
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Add files
      setReferences(prev => {
        const newRefs = [...prev];
        validFiles.forEach((file, index) => {
          const idx = newRefs.length + 1;
          const derivedName = file.name.replace(/\.[^/.]+$/, '');
          newRefs.push({
            id: `${Date.now()}-${idx}-${index}`,
            file,
            name: derivedName,
            previewUrl: URL.createObjectURL(file),
          });
        });
        return newRefs;
      });
    };

    const handleEndFrameUpload = (file: File) => {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        toast.error(
          tToast('error.someFilesTooLarge', { max: '25MB' }) ||
            'File is too large (max 25MB)',
        );
        return;
      }
      const url = URL.createObjectURL(file);
      onEndFrameChange?.(url);
    };

    const remove = (id: string) => {
      setReferences(prev => prev.filter(i => i.id !== id));
    };

    const removeAll = () => {
      setReferences(() => []);
      onEndFrameRemove?.();
      toast.success(t('referenceImages.modal.allDeleted', 'All images deleted'));
    };

    const updateName = (id: string, name: string) => {
      setReferences(prev => prev.map(i => (i.id === id ? { ...i, name } : i)));
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget === e.target) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      // Check supported formats
      const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const imageFiles = files.filter(file => validFormats.includes(file.type));

      if (imageFiles.length === 0) {
        toast.error(
          t('referenceImages.modal.unsupportedFormat', 'Only JPEG, PNG, and WebP formats are supported'),
        );
        return;
      }

      await addFiles(imageFiles);
    };

    // Show end frame upload option when there's exactly 1 reference image and no end frame yet
    const showEndFrameUpload = supportsEndFrame && references.length === 1 && !endFrameImage;
    // Show end frame preview when it's uploaded
    const showEndFramePreview = supportsEndFrame && endFrameImage;

    return (
      <Modal
        size='xl'
        scrollBehavior='inside'
        classNames={{ base: 'w-full sm:max-w-2xl max-h-[80vh]' }}
        isOpen={isOpen}
        onOpenChange={open => {
          if (!open) onClose();
        }}>
        <ModalContent>
          {onCloseModal => (
            <>
              <ModalHeader className='flex items-center justify-between text-base font-bold py-2'>
                <div className='flex items-center gap-2'>
                  {t('referenceImages.modal.title', 'Reference Images')}
                  {(references.length > 0 || endFrameImage) && (
                    <Chip size='sm' variant='flat'>
                      {references.length + (endFrameImage ? 1 : 0)}
                    </Chip>
                  )}
                </div>
              </ModalHeader>
              <ModalBody
                className='pt-0 gap-2'
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}>
                <p className='text-xs text-muted-foreground'>
                  {t('videoReference.description', 'Upload reference images for video generation. You can upload a single image, multiple images, or a first frame with an end frame.')}
                </p>

                {/* Limits info */}
                <div className='text-xs text-muted-foreground bg-muted p-2 rounded-lg'>
                  {t('videoReference.limits', {
                    defaultValue: `Max ${maxImages} images • Max 25MB per file • Formats: JPEG, PNG, WebP`,
                    maxImages,
                    current: references.length,
                  })}
                </div>

                {/* Drag overlay */}
                {isDragging && (
                  <div className='fixed inset-0 z-50 flex items-center justify-center bg-primary-500/10 backdrop-blur-sm pointer-events-none'>
                    <div className='bg-card rounded-2xl shadow-2xl p-8 border-4 border-dashed border-primary-500'>
                      <FaImage className='w-16 h-16 text-primary-500 mx-auto mb-4' />
                      <p className='text-xl font-bold text-primary-600'>
                        {t('referenceImages.modal.dropHere', 'Drop images here')}
                      </p>
                    </div>
                  </div>
                )}

                <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                  {/* Add new reference image button */}
                  {references.length < maxImages && !endFrameImage && (
                    <div className='rounded-xl border overflow-hidden bg-card p-1 border-[1.5px] border-dashed border-border hover:border-primary-400 transition-all duration-200 shadow-sm'>
                      <label className='cursor-pointer block w-full h-full group'>
                        <input
                          type='file'
                          multiple
                          accept='image/jpeg,image/jpg,image/png,image/webp'
                          className='hidden'
                          onChange={async e => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;

                            const validFormats = [
                              'image/jpeg',
                              'image/jpg',
                              'image/png',
                              'image/webp',
                            ];
                            const imageFiles = files.filter(file =>
                              validFormats.includes(file.type),
                            );

                            if (imageFiles.length === 0) {
                              toast.error(
                                t('referenceImages.modal.unsupportedFormat', 'Unsupported format'),
                              );
                              return;
                            }

                            await addFiles(imageFiles);
                            e.target.value = '';
                          }}
                        />
                        <div className='h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted hover:bg-muted transition-colors rounded-xl group-hover:text-indigo-500 py-6'>
                          <ImagePlus className='w-8 h-8 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                          <div className='mt-2 text-sm font-bold'>
                            {t('referenceImages.modal.addNew.title', 'Add Images')}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {t('referenceImages.modal.addNew.subtitle', 'Click or drag to upload')}
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Existing reference images */}
                  {references.map((ref, index) => (
                    <div
                      key={ref.id}
                      className='rounded-xl border shadow-sm overflow-hidden bg-card relative'>
                      <div className='relative group h-28 bg-muted'>
                        <img
                          src={ref.previewUrl}
                          alt={ref.name}
                          className='object-contain w-full h-full p-1'
                        />
                        <Button
                          isIconOnly
                          size='sm'
                          variant='flat'
                          color='danger'
                          className='absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
                          onPress={() => remove(ref.id)}
                          aria-label='Remove'>
                          <HiOutlineTrash className='w-4 h-4' />
                        </Button>
                      </div>
                      <div className='px-2 py-2 border-t bg-muted'>
                        {/* Show "First Frame" label when end frame exists */}
                        {endFrameImage && index === 0 ? (
                          <div className='text-xs text-muted-foreground text-center font-medium'>
                            {t('videoReference.firstFrame', 'First Frame')}
                          </div>
                        ) : (
                          <Input
                            value={ref.name}
                            onValueChange={val => updateName(ref.id, val)}
                            placeholder={t('referenceImages.modal.imageName.placeholder', 'reference')}
                            size='sm'
                            variant='flat'
                            classNames={{
                              inputWrapper: 'h-7 bg-card',
                              input: 'text-xs',
                            }}
                            startContent={
                              <HiOutlinePhotograph className='w-3.5 h-3.5 text-muted-foreground' />
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* End frame upload button - show when there's exactly 1 reference image */}
                  {showEndFrameUpload && (
                    <div className='rounded-xl border overflow-hidden bg-card p-1 border-[1.5px] border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 shadow-sm'>
                      <label className='cursor-pointer block w-full h-full group'>
                        <input
                          type='file'
                          accept='image/jpeg,image/jpg,image/png,image/webp'
                          className='hidden'
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const validFormats = [
                                'image/jpeg',
                                'image/jpg',
                                'image/png',
                                'image/webp',
                              ];
                              if (!validFormats.includes(file.type)) {
                                toast.error(
                                  t('referenceImages.modal.unsupportedFormat', 'Unsupported format'),
                                );
                                return;
                              }
                              handleEndFrameUpload(file);
                            }
                            e.target.value = '';
                          }}
                        />
                        <div className='h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors rounded-xl group-hover:text-purple-600 dark:group-hover:text-purple-400 py-6'>
                          <ImagePlus className='w-8 h-8 text-purple-400 dark:text-purple-500 transition-colors duration-200 group-hover:text-purple-500 dark:group-hover:text-purple-400' />
                          <div className='mt-2 text-sm font-bold text-purple-600 dark:text-purple-400'>
                            {t('videoReference.addEndFrame', 'Add End Frame')}
                          </div>
                          <div className='text-xs text-purple-400 dark:text-purple-500'>
                            {t('videoReference.endFrameHint', 'For first/last frame animation')}
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* End frame preview */}
                  {showEndFramePreview && (
                    <div className='rounded-xl border shadow-sm overflow-hidden bg-card relative border-purple-200 dark:border-purple-800'>
                      <div className='relative group h-28 bg-purple-50 dark:bg-purple-900/20'>
                        <img
                          src={endFrameImage}
                          alt='End Frame'
                          className='object-contain w-full h-full p-1'
                        />
                        <Button
                          isIconOnly
                          size='sm'
                          variant='flat'
                          color='danger'
                          className='absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
                          onPress={() => onEndFrameRemove?.()}
                          aria-label='Remove'>
                          <HiOutlineTrash className='w-4 h-4' />
                        </Button>
                      </div>
                      <div className='px-2 py-2 border-t bg-purple-50 dark:bg-purple-900/20'>
                        <div className='text-xs text-purple-600 dark:text-purple-400 text-center font-medium'>
                          {t('endFrame', 'End Frame')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hint about first/end frame */}
                {supportsEndFrame && references.length === 1 && !endFrameImage && (
                  <div className='text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg'>
                    {t('videoReference.endFrameInfo', 'Tip: You can add an end frame to create a first-to-last frame animation. Models supporting this feature will be auto-selected.')}
                  </div>
                )}
              </ModalBody>
              <ModalFooter
                className={cn(
                  'flex items-start',
                  (references.length > 0 || endFrameImage) ? 'justify-between' : 'justify-end',
                )}>
                {(references.length > 0 || endFrameImage) && (
                  <Button
                    size='sm'
                    variant='light'
                    color='danger'
                    startContent={<MdDeleteSweep className='w-4 h-4' />}
                    onPress={removeAll}>
                    {t('referenceImages.modal.deleteAll', 'Delete All')}
                  </Button>
                )}

                <Button size='sm' color='primary' onPress={onCloseModal}>
                  {t('videoReference.done', 'Done')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  },
);

VideoReferenceModal.displayName = 'VideoReferenceModal';

export default VideoReferenceModal;
