import { memo } from 'react';
import { MdClose } from 'react-icons/md';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@nextui-org/react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { ImagePlus } from 'lucide-react';
import { getModelConfig } from '../config/modelConfig';

interface ReferenceImage {
  id: string;
  url: string;
  name: string;
  file?: File;
  characterId?: string;
  isCharacter?: boolean;
}

interface ImageUploadAreaProps {
  supportsMultipleImages: boolean;
  requiresImage: boolean;
  inputImage: string;
  referenceImages: ReferenceImage[];
  endFrameImage: string;
  supportsEndFrame: boolean;
  selectedModel: any; // ImageToVideoModel | TextToVideoModel
  onImageChange: (url: string) => void;
  onInputImageRemove: () => void;
  onReferenceImagesAdd: (files: File[]) => void;
  onReferenceImageRemove: (id: string) => void;
  onReferenceImageRename: (id: string, name: string) => void;
  onEndFrameChange: (url: string) => void;
  onEndFrameRemove: () => void;
  t: any;
  compact?: boolean;
}

export const ImageUploadArea = memo(
  ({
    referenceImages,
    endFrameImage,
    selectedModel,
    requiresImage,
    onReferenceImagesAdd,
    onReferenceImageRemove,
    onReferenceImageRename,
    onEndFrameChange,
    onEndFrameRemove,
    t,
    compact = false,
  }: ImageUploadAreaProps) => {
    // Get max reference images from model config
    const config = getModelConfig(selectedModel);
    const maxReferenceImages = config.maxReferenceImages || 7;
    const { t: tCommon } = useTranslation('common');

    // For models with stitching (like Sora with max 3), allow uploading up to 7 images
    // The parent component will auto-switch to Vidu when 4+ images are uploaded
    const effectiveMaxImages =
      maxReferenceImages === 3 ? 7 : maxReferenceImages;

    // Size classes based on compact mode
    const uploadBtnSize = compact ? 'w-14 h-14' : 'w-20 h-20';
    const thumbSize = compact ? 'w-12 h-12' : 'w-16 h-16';
    const thumbContainerWidth = compact ? 'w-12' : 'w-16';
    const iconSize = compact ? 'w-5 h-5' : 'w-6 h-6';

    return (
      <div className={cn('overflow-x-auto px-2 py-2')}>
        <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-3')}>
          {/* Case 1: No images - show initial upload button */}
          {referenceImages.length === 0 && (
            <label
              className='cursor-pointer block flex-shrink-0'
              onDrop={e => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files).filter(file =>
                  file.type.startsWith('image/'),
                );
                if (files.length > 0) {
                  onReferenceImagesAdd(files);
                }
              }}
              onDragOver={e => e.preventDefault()}>
              <input
                type='file'
                accept='image/jpeg,image/jpg,image/png,image/webp'
                multiple
                className='hidden'
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    onReferenceImagesAdd(files);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <div
                className={cn(
                  uploadBtnSize,
                  'relative rounded-lg border-1 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors px-1.5 py-1',
                )}>
                <ImagePlus className={iconSize} />
                <span
                  className={cn(
                    'mt-1 text-center leading-tight',
                    compact ? 'text-[8px]' : 'text-xs',
                  )}>
                  {requiresImage
                    ? t('ui.input.image.label.imageRequired')
                    : t('ui.input.image.label.image')}
                </span>
              </div>
            </label>
          )}

          {referenceImages.map((img, index) => (
            <div
              key={img.id}
              className={cn(
                'flex flex-col items-center gap-1 flex-shrink-0',
                thumbContainerWidth,
              )}>
              <Popover placement='top'>
                <PopoverTrigger>
                  <div className='relative cursor-pointer'>
                    <img
                      src={img.url}
                      alt={img.name}
                      className={cn(
                        thumbSize,
                        'rounded-lg object-contain border border-border bg-muted',
                      )}
                    />
                    <Button
                      isIconOnly
                      size='sm'
                      color='danger'
                      variant='solid'
                      className='absolute -top-1.5 -right-1.5 z-10 w-5 h-5 min-w-5 opacity-100'
                      onPress={() => onReferenceImageRemove(img.id)}>
                      <MdClose className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className='p-1'>
                    <img
                      src={img.url}
                      alt={img.name}
                      className='max-w-xs max-h-xs object-contain'
                    />
                    <p className='text-center text-sm font-medium mt-1'>
                      {img.name}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              {endFrameImage && index === 0 ? (
                <span className='text-xs text-muted-foreground text-center'>
                  {t('ui.image.label.firstFrame', 'First Frame')}
                </span>
              ) : (
                <input
                  type='text'
                  value={img.name}
                  onChange={e => {
                    if (!img.isCharacter) {
                      onReferenceImageRename(img.id, e.target.value);
                    }
                  }}
                  disabled={img.isCharacter}
                  className={cn(
                    'w-full text-xs text-center text-foreground rounded px-1 py-0.5 outline-none',
                    img.isCharacter
                      ? 'bg-muted cursor-not-allowed'
                      : 'bg-muted focus:ring-1 focus:ring-primary-500',
                  )}
                  placeholder='Image name'
                />
              )}
            </div>
          ))}

          {/* End frame upload - show in second position when there's exactly 1 reference image */}
          {!endFrameImage && referenceImages.length === 1 && (
            <label
              className='cursor-pointer block flex-shrink-0'
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith('image/')) {
                  const url = URL.createObjectURL(file);
                  onEndFrameChange(url);
                }
              }}
              onDragOver={e => e.preventDefault()}>
              <input
                type='file'
                accept='image/jpeg,image/jpg,image/png,image/webp'
                className='hidden'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    onEndFrameChange(url);
                  }
                }}
              />
              <div
                className={cn(
                  uploadBtnSize,
                  'relative rounded-lg border-1 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors px-1.5 py-1',
                )}>
                <ImagePlus className={iconSize} />
                <span
                  className={cn(
                    'mt-1 text-center leading-tight',
                    compact ? 'text-[10px]' : 'text-xs',
                  )}>
                  {t('ui.input.image.label.endFrame')}
                </span>
              </div>
            </label>
          )}

          {/* Display end frame if uploaded */}
          {endFrameImage && (
            <div
              className={cn(
                'flex flex-col items-center gap-1 flex-shrink-0',
                thumbContainerWidth,
              )}>
              <Popover placement='top'>
                <PopoverTrigger>
                  <div className='relative cursor-pointer'>
                    <img
                      src={endFrameImage}
                      alt='End Frame'
                      className={cn(
                        thumbSize,
                        'rounded-lg object-contain border border-border bg-muted',
                      )}
                    />
                    <Button
                      isIconOnly
                      size='sm'
                      color='danger'
                      variant='solid'
                      className='absolute -top-1.5 -right-1.5 z-10 w-5 h-5 min-w-5 opacity-100'
                      onPress={onEndFrameRemove}>
                      <MdClose className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className='p-1'>
                    <img
                      src={endFrameImage}
                      alt='End frame preview'
                      className='max-w-xs max-h-xs object-contain'
                    />
                    <p className='text-center text-sm font-medium mt-1'>
                      {tCommon('endFrame')}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <span className='text-xs text-muted-foreground text-center w-full'>
                {tCommon('endFrame')}
              </span>
            </div>
          )}

          {/* Upload more images button - show after end frame or after first image */}
          {referenceImages.length < effectiveMaxImages &&
            !endFrameImage &&
            referenceImages.length > 0 && (
              <label
                className='cursor-pointer block flex-shrink-0'
                onDrop={e => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(file =>
                    file.type.startsWith('image/'),
                  );
                  if (files.length > 0) {
                    onReferenceImagesAdd(files);
                  }
                }}
                onDragOver={e => e.preventDefault()}>
                <input
                  type='file'
                  accept='image/jpeg,image/jpg,image/png,image/webp'
                  multiple
                  className='hidden'
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      onReferenceImagesAdd(files);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <div
                  className={cn(
                    uploadBtnSize,
                    'relative rounded-lg border-1 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors px-1.5 py-1',
                  )}>
                  <ImagePlus className={iconSize} />
                  <span
                    className={cn(
                      'mt-1 text-center leading-tight',
                      compact ? 'text-[10px]' : 'text-xs',
                    )}>
                    {t('ui.input.image.label.more')}
                  </span>
                </div>
              </label>
            )}
        </div>
      </div>
    );
  },
);

ImageUploadArea.displayName = 'ImageUploadArea';
