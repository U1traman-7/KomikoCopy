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
  Tooltip,
  Checkbox,
  cn,
} from '@nextui-org/react';
import {
  HiOutlineArrowRight,
  HiOutlinePhotograph,
  HiOutlineTrash,
} from 'react-icons/hi';
import { MdSelectAll, MdDeselect, MdDeleteSweep } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useOpenModal } from 'hooks/useOpenModal';

export type ReferenceItem = {
  id: string;
  file: File; // Store File object instead of URL
  name: string;
  previewUrl: string; // Local preview URL (blob URL)
};

interface ReferenceImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  references: ReferenceItem[];
  setReferences: (updater: (prev: ReferenceItem[]) => ReferenceItem[]) => void;
  onInsertName: (name: string) => void;
  onDeleteImage?: (item: ReferenceItem) => void; // Callback when an image is deleted
}

export const ReferenceImagesModal = memo(
  ({
    isOpen,
    onClose,
    references,
    setReferences,
    onInsertName,
    onDeleteImage,
  }: ReferenceImagesModalProps) => {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toast');
    const profile = useAtomValue(profileAtom) as any;
    const { submit: openModal } = useOpenModal();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);

    const isPremium = !!profile?.plan_codes?.length;

    // Gemini API limits
    const MAX_IMAGES = 9; // Maximum 9 images supported
    const MAX_SINGLE_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

    // Calculate total size of current references (bytes)
    const calculateTotalSize = () =>
      references.reduce((total, ref) => total + ref.file.size, 0);

    const addNew = async (file: File) => {
      // Check if user is trying to add more than one reference without premium
      if (!isPremium && references.length >= 1) {
        toast.error(tToast('error.multipleReferenceImages'));
        openModal('pricing');
        return;
      }

      // Check max image count (9 images maximum)
      if (references.length >= MAX_IMAGES) {
        toast.error(tToast('error.maximumImagesAllowed', { max: MAX_IMAGES }));
        return;
      }

      try {
        // Size checks (bytes)
        if (file.size > MAX_SINGLE_FILE_SIZE) {
          toast.error(tToast('error.someFilesTooLarge', { max: '25MB' }));
          return;
        }
        const currentTotalSize = calculateTotalSize();
        if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
          toast.error(tToast('error.someFilesTooLarge', { max: '50MB' }));
          return;
        }

        // Store File object with preview URL (no upload yet)
        setReferences(prev => {
          const idx = prev.length + 1;
          const derivedName = file.name
            ? file.name.replace(/\.[^/.]+$/, '')
            : `reference${idx}`;
          return prev.concat({
            id: `${Date.now()}-${idx}`,
            file,
            name: derivedName,
            previewUrl: URL.createObjectURL(file),
          });
        });
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(
          tToast('error.processingFailed') || 'Failed to process file',
        );
      }
    };

    const addMultiple = async (files: File[]) => {
      // Check premium limit
      if (!isPremium && references.length + files.length > 1) {
        toast.error(tToast('error.multipleReferenceImages'));
        openModal('pricing');
        return;
      }

      // Check max image count
      if (references.length + files.length > MAX_IMAGES) {
        toast.error(tToast('error.maximumImagesAllowed', { max: MAX_IMAGES }));
        return;
      }

      try {
        // Size checks
        const currentTotalSize = calculateTotalSize();
        const batchTotal = files.reduce((sum, f) => sum + f.size, 0);
        if (files.some(f => f.size > MAX_SINGLE_FILE_SIZE)) {
          toast.error(tToast('error.someFilesTooLarge', { max: '25MB' }));
          return;
        }
        if (currentTotalSize + batchTotal > MAX_TOTAL_SIZE) {
          toast.error(tToast('error.someFilesTooLarge', { max: '50MB' }));
          return;
        }

        // Store File objects with preview URLs (no upload yet)
        setReferences(prev => {
          const newRefs = [...prev];
          files.forEach((file, index) => {
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
      } catch (error) {
        console.error('Error processing files:', error);
        toast.error(
          tToast('error.processingFailed') || 'Failed to process files',
        );
      }
    };

    const remove = (id: string) => {
      // Find the item before removing it
      const itemToRemove = references.find(i => i.id === id);

      setReferences(prev => prev.filter(i => i.id !== id));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      // Notify parent if this is a character image
      if (itemToRemove && onDeleteImage) {
        onDeleteImage(itemToRemove);
      }
    };

    const removeSelected = () => {
      if (selectedIds.size === 0) {
        return;
      }

      // Find items to remove before removing them
      const itemsToRemove = references.filter(i => selectedIds.has(i.id));

      setReferences(prev => prev.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      toast.success(
        t('referenceImages.modal.deleted', { count: selectedIds.size }),
      );

      // Notify parent for each character image
      if (onDeleteImage) {
        itemsToRemove.forEach(item => onDeleteImage(item));
      }
    };

    const removeAll = () => {
      // Notify parent for each character image before removing
      if (onDeleteImage) {
        references.forEach(item => onDeleteImage(item));
      }

      setReferences(() => []);
      setSelectedIds(new Set());
      toast.success(t('referenceImages.modal.allDeleted'));
    };

    const updateName = (id: string, name: string) => {
      setReferences(prev => prev.map(i => (i.id === id ? { ...i, name } : i)));
    };

    const toggleSelection = (id: string) => {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };

    const selectAll = () => {
      if (selectedIds.size === references.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(references.map(r => r.id)));
      }
    };

    const handleInsert = (name: string) => {
      if (!name) {
        return;
      }
      onInsertName(name);
      toast.success(
        tToast('success.inserted', {
          name,
        }),
        { position: 'top-center' },
      );
    };

    const handleBulkInsert = () => {
      if (selectedIds.size === 0) {
        toast.error(tToast('error.noSelection'));
        return;
      }

      const selectedRefs = references.filter(ref => selectedIds.has(ref.id));
      const names = selectedRefs.map(ref => ref.name).filter(name => name);

      if (names.length === 0) {
        toast.error(tToast('error.noValidNames'));
        return;
      }

      // Join names with comma and space - no wrapper needed
      const joinedNames = names.join(', ');
      onInsertName(joinedNames);

      toast.success(
        t('referenceImages.modal.bulkInsertSuccess', {
          count: names.length,
        }),
        { position: 'top-center' },
      );

      setSelectedIds(new Set());
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set dragging to false if we're leaving the modal body itself
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
      if (files.length === 0) {
        return;
      }

      // Check supported formats
      const validFormats = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      const invalidFiles = files.filter(
        file => !validFormats.includes(file.type),
      );

      if (invalidFiles.length > 0) {
        toast.error(t('referenceImages.modal.unsupportedFormat'));
        return;
      }

      if (files.length === 1) {
        await addNew(files[0]);
      } else {
        await addMultiple(files);
      }
    };

    return (
      <>
        <Modal
          size='xl'
          scrollBehavior='inside'
          classNames={{ base: 'w-full sm:max-w-3xl max-h-[90vh]' }}
          isOpen={isOpen}
          onOpenChange={open => {
            if (!open) {
              onClose();
            }
          }}>
          <ModalContent>
            {onClose => (
              <>
                <ModalHeader className='flex items-center justify-between text-base md:text-lg font-bold py-2'>
                  <div className='flex items-center gap-2'>
                    {t('referenceImages.modal.title')}
                    {references.length > 0 && (
                      <Chip size='sm' variant='flat'>
                        {references.length}
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
                  <p className='text-xs md:text-sm text-muted-foreground'>
                    {t('referenceImages.modal.description')}
                  </p>

                  {/* Limits info */}
                  <div className='text-xs text-muted-foreground bg-muted p-2 rounded-lg'>
                    {t('referenceImages.modal.limits', {
                      maxImages: MAX_IMAGES,
                      maxSingleSize: '25MB',
                      maxTotalSize: '50MB',
                      formats: 'JPEG, PNG, WebP',
                      current: references.length,
                    })}
                  </div>

                  {/* Drag overlay */}
                  {isDragging && (
                    <div className='fixed inset-0 z-50 flex items-center justify-center bg-primary-500/10 backdrop-blur-sm pointer-events-none'>
                      <div className='bg-card rounded-2xl shadow-2xl p-8 border-4 border-dashed border-primary-500'>
                        <FaImage className='w-16 h-16 text-primary-500 mx-auto mb-4' />
                        <p className='text-xl font-bold text-primary-600'>
                          {t('referenceImages.modal.dropHere')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Toolbar */}
                  {references.length > 0 && (
                    <div className='flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Button
                          size='sm'
                          variant='light'
                          color='primary'
                          startContent={
                            selectedIds.size === references.length ? (
                              <MdDeselect className='w-4 h-4' />
                            ) : (
                              <MdSelectAll className='w-4 h-4' />
                            )
                          }
                          onPress={selectAll}>
                          {selectedIds.size === references.length
                            ? t('referenceImages.modal.deselectAll')
                            : t('referenceImages.modal.selectAll')}
                        </Button>

                        {selectedIds.size > 0 && (
                          <>
                            <Button
                              size='sm'
                              color='primary'
                              variant='flat'
                              startContent={
                                <HiOutlineArrowRight className='w-4 h-4' />
                              }
                              onPress={handleBulkInsert}>
                              {t('referenceImages.modal.insertSelected')} (
                              {selectedIds.size})
                            </Button>
                            <Button
                              size='sm'
                              variant='flat'
                              color='danger'
                              startContent={
                                <RiDeleteBin6Line className='w-4 h-4' />
                              }
                              onPress={removeSelected}>
                              {t('referenceImages.modal.deleteSelected')} (
                              {selectedIds.size})
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                    {/* Add new - with multiple file support */}
                    {references.length < MAX_IMAGES && (
                      <div className='rounded-xl border shadow-sm overflow-hidden bg-card p-1 relative overflow-hidden border-[1.5px] border-dashed border-border hover:border-primary-400 transition-all duration-200 shadow-sm rounded-xl w-full'>
                        <label className='cursor-pointer block w-full h-full group'>
                          <input
                            type='file'
                            multiple
                            accept='image/jpeg,image/jpg,image/png,image/webp'
                            className='hidden'
                            onChange={async e => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) {
                                return;
                              }

                              // Check supported formats
                              const validFormats = [
                                'image/jpeg',
                                'image/jpg',
                                'image/png',
                                'image/webp',
                              ];
                              const invalidFiles = files.filter(
                                file => !validFormats.includes(file.type),
                              );

                              if (invalidFiles.length > 0) {
                                toast.error(
                                  t('referenceImages.modal.unsupportedFormat'),
                                );
                                return;
                              }

                              if (files.length === 1) {
                                await addNew(files[0]);
                              } else {
                                await addMultiple(files);
                              }

                              // Reset input to allow re-selecting same files
                              e.target.value = '';
                            }}
                          />
                          <div className='h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted hover:bg-muted transition-colors rounded-xl group-hover:text-indigo-500 py-4'>
                            {/* Image Icon */}
                            <FaImage className='w-6 h-6 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                            <div className='mt-2 text-sm md:text-base font-bold'>
                              {t('referenceImages.modal.addNew.title')}
                            </div>
                            <div className='text-xs'>
                              {t('referenceImages.modal.addNew.subtitle')}
                            </div>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Existing references */}
                    {references.map(ref => (
                      <div
                        key={ref.id}
                        className={cn(
                          'rounded-xl border shadow-sm overflow-hidden bg-card relative',
                          selectedIds.has(ref.id) && 'ring-2 ring-primary-400',
                        )}>
                        <Checkbox
                          isSelected={selectedIds.has(ref.id)}
                          onValueChange={() => toggleSelection(ref.id)}
                          className='absolute top-2 left-2 z-10'
                          size='sm'
                        />
                        <div className='relative group h-32 md:h-36 bg-muted'>
                          <img
                            src={ref.previewUrl}
                            className='object-contain w-full h-full p-1'
                          />
                          <Button
                            isIconOnly
                            size='sm'
                            variant='flat'
                            color='danger'
                            className='absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
                            onPress={() => remove(ref.id)}
                            aria-label={
                              t('referenceImages.modal.remove') as string
                            }>
                            <HiOutlineTrash className='w-5 h-5' />
                          </Button>
                        </div>
                        <div className='px-2.5 py-2.5 border-t bg-muted'>
                          <div className='text-xs text-muted-foreground mb-1'>
                            {t('referenceImages.modal.imageName.label')}
                          </div>
                          <Input
                            value={ref.name}
                            onValueChange={val => updateName(ref.id, val)}
                            placeholder={t(
                              'referenceImages.modal.imageName.placeholder',
                            )}
                            size='sm'
                            variant='flat'
                            classNames={{
                              inputWrapper: 'h-8 bg-card pr-0',
                              input: 'pr-0',
                              innerWrapper: 'pr-0',
                            }}
                            startContent={
                              <HiOutlinePhotograph className='w-4 h-4 text-muted-foreground' />
                            }
                            endContent={
                              <Tooltip
                                content={t(
                                  'referenceImages.modal.insertTooltip',
                                )}
                                showArrow={true}>
                                <Button
                                  isIconOnly
                                  size='sm'
                                  variant='light'
                                  className='shrink-0 text-primary p-1'
                                  onPress={() => handleInsert(ref.name)}>
                                  <HiOutlineArrowRight className='w-4 h-4' />
                                </Button>
                              </Tooltip>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ModalBody>
                <ModalFooter
                  className={cn(
                    'flex items-start',
                    references.length > 0 ? 'justify-between' : 'justify-end',
                  )}>
                  {references.length > 0 && (
                    <Button
                      size='sm'
                      variant='light'
                      color='danger'
                      className='self-start sm:self-auto'
                      startContent={<MdDeleteSweep className='w-4 h-4' />}
                      onPress={removeAll}>
                      {t('referenceImages.modal.deleteAll')}
                    </Button>
                  )}

                  <Button
                    size='sm'
                    color='primary'
                    onPress={() => {
                      onClose();
                    }}>
                    {t('referenceImages.modal.close')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  },
);

export default ReferenceImagesModal;
