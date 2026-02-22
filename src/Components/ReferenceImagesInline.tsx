import { useState } from 'react';
import { Button, Card, Tooltip } from '@nextui-org/react';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlineArrowRight } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';
import { FaImage } from 'react-icons/fa';

// ReferenceItem type definition - stores File object before upload
export type ReferenceItem = {
  id: string;
  file: File; // Store File object instead of URL
  name: string;
  previewUrl: string; // Local preview URL (blob URL)
};

interface ReferenceImagesInlineProps {
  referenceItems: ReferenceItem[];
  setReferenceItems: (
    items: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[]),
  ) => void;
  onInsertName?: (name: string) => void;
  isPremium?: boolean;
  onUpgradeRequired?: () => void;
}

export function ReferenceImagesInline({
  referenceItems,
  setReferenceItems,
  onInsertName,
  isPremium = false,
  onUpgradeRequired,
}: ReferenceImagesInlineProps) {
  const { t } = useTranslation(['common', 'toast']);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    // Check premium limit - trigger upgrade modal for non-premium users
    if (!isPremium && referenceItems.length + files.length > 1) {
      onUpgradeRequired?.();
      return;
    }

    // Check max count
    if (referenceItems.length + files.length > 9) {
      toast.error(t('toast:error.maximumImagesAllowed', { max: 9 }));
      return;
    }

    // Validate file types
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(
      file => !validFormats.includes(file.type),
    );

    if (invalidFiles.length > 0) {
      toast.error(t('toast:error.unsupportedFormat'));
      return;
    }

    // Check file sizes (25MB per file, 50MB total)
    const MAX_SINGLE_FILE_SIZE = 25 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

    if (files.some(f => f.size > MAX_SINGLE_FILE_SIZE)) {
      toast.error(t('toast:error.someFilesTooLarge', { max: '25MB' }));
      return;
    }

    const currentTotalSize = referenceItems.reduce(
      (sum, item) => sum + item.file.size,
      0,
    );
    const newTotalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (currentTotalSize + newTotalSize > MAX_TOTAL_SIZE) {
      toast.error(t('toast:error.totalSizeTooLarge', { max: '50MB' }));
      return;
    }

    try {
      // Store File objects with preview URLs (no upload yet)
      const newItems = files.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name.replace(/\.[^/.]+$/, ''),
        previewUrl: URL.createObjectURL(file),
      }));

      setReferenceItems(prev => [...prev, ...newItems]);
      toast.success(t('toast:success.imagesAdded', { count: files.length }));
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error(
        t('toast:error.processingFailed') || 'Failed to process files',
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container itself
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
    await processFiles(files);
  };

  const handleRemoveImage = (id: string) => {
    setReferenceItems(prev => prev.filter(i => i.id !== id));
    toast.success(t('toast:success.imageRemoved'));
  };

  const handleUpdateName = (id: string, newName: string) => {
    setReferenceItems(prev =>
      prev.map(i => (i.id === id ? { ...i, name: newName } : i)),
    );
  };

  const handleInsert = (name: string) => {
    if (!name) {
      toast.error(t('toast.error.pleaseEnterNameFirst'));
      return;
    }
    // Insert name without {{}} wrapper
    onInsertName?.(name);
    toast.success(t('toast:success.inserted'), {
      position: 'top-center',
      duration: 2000,
    });
  };

  return (
    <div className='space-y-3'>
      {/* Info and Limits */}
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>
          {t('common:referenceImage.info', {
            count: referenceItems.length,
            max: 9,
          })}
        </span>
        {referenceItems.length > 0 && (
          <Button
            size='sm'
            variant='light'
            color='danger'
            className='py-1'
            onPress={() => {
              setReferenceItems([]);
              toast.success(t('toast:success.allReferencesCleared'));
            }}>
            {t('common:referenceImage.clearAll')}
          </Button>
        )}
      </div>

      {/* Reference Images Container */}
      <div
        className='overflow-x-auto overflow-y-hidden'
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
        <div className='flex gap-3 pb-2 pt-1'>
          {/* Add Image Card */}
          <div className='flex-shrink-0 w-36 md:w-40'>
            <label className='cursor-pointer block'>
              <input
                type='file'
                multiple
                accept='image/jpeg,image/jpg,image/png,image/webp'
                className='hidden'
                onChange={handleFileUpload}
              />
              <Card
                className={`relative overflow-hidden border-[1.5px] border-dashed transition-all duration-200 shadow-sm rounded-xl w-full h-40 md:h-44 bg-card ${
                  isDragging
                    ? 'border-primary-500 bg-accent'
                    : 'border-default-300 hover:border-primary-400'
                }`}>
                <div className='w-full h-full flex flex-col items-center justify-center text-muted-foreground'>
                  <span className='text-4xl mb-2'>
                    <FaImage
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isDragging
                          ? 'text-primary-500'
                          : 'text-muted-foreground group-hover:text-indigo-500'
                      }`}
                    />
                  </span>
                  <span className='text-xs'>
                    {isDragging
                      ? t('common:referenceImage.dropHere')
                      : t('common:referenceImage.add')}
                  </span>
                </div>
              </Card>
            </label>
          </div>

          {/* Reference Image Cards */}
          {referenceItems.map(item => (
            <div key={item.id} className='flex-shrink-0 w-36 md:w-40'>
              <Card className='rounded-xl border shadow-sm overflow-hidden bg-card h-40 md:h-44 flex flex-col'>
                {/* Image Section */}
                <div className='relative group flex-1 bg-muted overflow-hidden'>
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className='object-contain w-full h-full p-1'
                  />
                  {/* Delete button */}
                  <Button
                    isIconOnly
                    size='sm'
                    color='danger'
                    variant='flat'
                    className='absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
                    onPress={() => handleRemoveImage(item.id)}>
                    <HiOutlineTrash className='w-5 h-5' />
                  </Button>
                </div>

                {/* Name Input Section */}
                <div className='px-2.5 py-2.5 border-t bg-muted flex-shrink-0'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    {t('common:referenceImage.imageName')}
                  </div>
                  <div className='flex items-center gap-1 bg-card rounded-lg border border-border px-2 py-1.5 pr-1'>
                    <input
                      type='text'
                      value={item.name}
                      onChange={e => handleUpdateName(item.id, e.target.value)}
                      className='flex-1 text-xs text-foreground bg-transparent border-none outline-none min-w-0'
                      placeholder={t('common:referenceImage.placeholder')}
                    />
                    <Tooltip
                      content={t('common:referenceImages.modal.insertTooltip')}
                      showArrow={true}>
                      <button
                        type='button'
                        onClick={() => handleInsert(item.name)}
                        className='shrink-0 w-6 h-6 flex items-center justify-center text-primary-500 hover:text-primary-600 hover:bg-accent rounded transition-colors'>
                        <HiOutlineArrowRight className='w-4 h-4' />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
