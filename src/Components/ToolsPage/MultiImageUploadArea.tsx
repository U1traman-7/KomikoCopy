import React, { memo, useRef, useState, useCallback } from 'react';
import {
  FaTrash,
  FaImage,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAtom } from 'jotai';
import { authAtom, loginModalAtom } from 'state';
import { useTranslation } from 'react-i18next';

export interface MultiImageItem {
  id: string;
  url: string;
  name: string;
  file?: File;
}

export interface MultiImageUploadAreaProps {
  images: MultiImageItem[];
  onImagesChange: (images: MultiImageItem[]) => void;
  minCount?: number;
  maxCount?: number;
  accept?: string;
  className?: string;
  needAuth?: boolean;
  /** Render function for extra actions on each image card (e.g., Import Character button) */
  renderImageActions?: (
    image: MultiImageItem,
    index: number,
  ) => React.ReactNode;
}

const ImagePreviewCard = memo(
  ({
    image,
    index,
    onRemove,
    onRename,
    renderActions,
  }: {
    image: MultiImageItem;
    index: number;
    onRemove: (id: string) => void;
    onRename: (id: string, name: string) => void;
    renderActions?: (image: MultiImageItem, index: number) => React.ReactNode;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(image.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
      const trimmedName = editName.trim();
      if (trimmedName) {
        onRename(image.id, trimmedName);
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditName(image.name);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    return (
      <div className='relative group aspect-square bg-muted rounded-lg overflow-hidden border border-border'>
        <img
          src={image.url}
          alt={image.name}
          className='w-full h-full object-cover'
        />

        {/* Index badge */}
        <div className='absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded'>
          {index + 1}
        </div>

        {/* Remove button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onRemove(image.id);
          }}
          className='absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600'
          type='button'>
          <FaTrash className='w-2.5 h-2.5' />
        </button>

        {/* Extra action buttons (e.g., Import Character) */}
        {renderActions && (
          <div className='absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity'>
            {renderActions(image, index)}
          </div>
        )}

        {/* Name label with edit functionality */}
        <div className='absolute bottom-0 left-0 right-0 bg-black/60 p-1.5'>
          {isEditing ? (
            <div className='flex items-center gap-1'>
              <input
                ref={inputRef}
                type='text'
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                className='flex-1 text-xs bg-card text-foreground px-1 py-0.5 rounded min-w-0'
                autoFocus
              />
              <button
                onClick={handleSave}
                className='p-1 bg-green-500 text-white rounded hover:bg-green-600'
                type='button'>
                <FaCheck className='w-2 h-2' />
              </button>
              <button
                onClick={handleCancel}
                className='p-1 bg-muted-foreground text-primary-foreground rounded hover:bg-muted-foreground/80'
                type='button'>
                <FaTimes className='w-2 h-2' />
              </button>
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              <span className='text-white text-xs truncate flex-1'>
                {image.name}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className='p-1 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity'
                type='button'>
                <FaEdit className='w-2.5 h-2.5' />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

ImagePreviewCard.displayName = 'ImagePreviewCard';

const MultiImageUploadArea = memo(
  ({
    images,
    onImagesChange,
    minCount = 1,
    maxCount = 3,
    accept = '.png,.jpg,.jpeg,.webp',
    className = '',
    needAuth = true,
    renderImageActions,
  }: MultiImageUploadAreaProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isAuth] = useAtom(authAtom);
    const [loginModalState] = useAtom(loginModalAtom);
    const { t } = useTranslation('common');

    const canAddMore = images.length < maxCount;

    const isValidFile = useCallback(
      (file: File): boolean => {
        if (accept) {
          const fileName = file.name;
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          const acceptedExtensions = accept
            .split(',')
            .map(ext =>
              ext.trim().startsWith('.')
                ? ext.trim().substring(1).toLowerCase()
                : ext.trim().toLowerCase(),
            );

          if (!acceptedExtensions.includes(fileExtension)) {
            toast.error(t('uploadFile.errors.invalidExtension', { accept }), {
              position: 'top-center',
            });
            return false;
          }
        }

        if (!file.type.startsWith('image')) {
          toast.error(t('uploadFile.errors.selectImage'), {
            position: 'top-center',
          });
          return false;
        }

        return true;
      },
      [accept, t],
    );

    const processFiles = useCallback(
      (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const remainingSlots = maxCount - images.length;

        if (fileArray.length > remainingSlots) {
          toast.error(
            t('multiImage.maxReached', { max: maxCount }) ||
              `Maximum ${maxCount} images allowed`,
            { position: 'top-center' },
          );
        }

        const filesToProcess = fileArray.slice(0, remainingSlots);
        const validFiles = filesToProcess.filter(isValidFile);

        if (validFiles.length === 0) {
          return;
        }

        const newImages: MultiImageItem[] = validFiles.map((file, index) => {
          const url = URL.createObjectURL(file);
          const nameWithoutExt =
            file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          return {
            id: `${Date.now()}-${Math.random()}-${index}`,
            url,
            name: nameWithoutExt,
            file,
          };
        });

        onImagesChange([...images, ...newImages]);
      },
      [images, maxCount, isValidFile, onImagesChange, t],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
          return;
        }

        processFiles(files);

        // Reset input
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      },
      [processFiles],
    );

    const handleClick = useCallback(() => {
      if (needAuth && !isAuth) {
        loginModalState.onOpen?.();
        return;
      }
      if (!canAddMore) {
        toast.error(
          t('multiImage.maxReached', { max: maxCount }) ||
            `Maximum ${maxCount} images allowed`,
          { position: 'top-center' },
        );
        return;
      }
      inputRef.current?.click();
    }, [needAuth, isAuth, loginModalState, canAddMore, maxCount, t]);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        if (needAuth && !isAuth) {
          loginModalState.onOpen?.();
          return;
        }
        if (!canAddMore) {
          toast.error(
            t('multiImage.maxReached', { max: maxCount }) ||
              `Maximum ${maxCount} images allowed`,
            { position: 'top-center' },
          );
          return;
        }

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          processFiles(files);
        }
      },
      [
        needAuth,
        isAuth,
        loginModalState,
        canAddMore,
        maxCount,
        processFiles,
        t,
      ],
    );

    const handleRemove = useCallback(
      (id: string) => {
        const imageToRemove = images.find(img => img.id === id);
        if (imageToRemove?.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageToRemove.url);
        }
        onImagesChange(images.filter(img => img.id !== id));
      },
      [images, onImagesChange],
    );

    const handleRename = useCallback(
      (id: string, name: string) => {
        onImagesChange(
          images.map(img => (img.id === id ? { ...img, name } : img)),
        );
      },
      [images, onImagesChange],
    );

    // Calculate grid columns based on max count
    const getGridCols = () => {
      if (maxCount <= 2) {
        return 'grid-cols-2';
      }
      if (maxCount <= 4) {
        return 'grid-cols-2 md:grid-cols-4';
      }
      return 'grid-cols-3 md:grid-cols-4';
    };

    return (
      <div
        className={`relative w-full rounded-lg border-2 border-dashed cursor-pointer hover:border-indigo-400 ${className}`}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}>
        {images.length === 0 ? (
          // Empty state
          <div
            className='flex flex-col justify-center items-center h-36 md:h-48'
            onClick={handleClick}>
            <FaImage className='w-12 h-12 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
            <p className='mt-2 text-muted-foreground text-sm md:text-base transition-colors duration-200 group-hover:text-indigo-600 px-2 text-center'>
              {t('multiImage.uploadPrompt', { min: minCount, max: maxCount }) ||
                `Upload ${minCount}-${maxCount} images`}
            </p>
            <p className='mt-1 text-muted-foreground text-xs'>
              {t('multiImage.dragDropHint') || 'Click or drag & drop'}
            </p>
          </div>
        ) : (
          // Grid view with images
          <div className='p-3'>
            <div className={`grid ${getGridCols()} gap-3`}>
              {images.map((image, index) => (
                <ImagePreviewCard
                  key={image.id}
                  image={image}
                  index={index}
                  onRemove={handleRemove}
                  onRename={handleRename}
                  renderActions={renderImageActions}
                />
              ))}

              {/* Add more button */}
              {canAddMore && (
                <div
                  className='aspect-square bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors'
                  onClick={handleClick}>
                  <FaPlus className='w-6 h-6 text-muted-foreground' />
                  <span className='mt-1 text-xs text-muted-foreground'>
                    {t('multiImage.addMore') || 'Add more'}
                  </span>
                </div>
              )}
            </div>

            {/* Info text */}
            <p className='mt-2 text-xs text-muted-foreground text-center'>
              {images.length}/{maxCount}{' '}
              {t('multiImage.imagesUploaded') || 'images'}
              {images.length < minCount && (
                <span className='text-orange-500 ml-1'>
                  (
                  {t('multiImage.minRequired', { min: minCount }) ||
                    `min ${minCount} required`}
                  )
                </span>
              )}
            </p>
          </div>
        )}

        <input
          type='file'
          accept={accept}
          ref={inputRef}
          className='hidden'
          onChange={handleChange}
          multiple
        />
      </div>
    );
  },
);

MultiImageUploadArea.displayName = 'MultiImageUploadArea';

export default MultiImageUploadArea;
