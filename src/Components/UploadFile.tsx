import React, { memo, useRef, useState, useEffect } from 'react';
import { FaTrash, FaImage, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAtom } from 'jotai';
import { authAtom, loginModalAtom } from 'state';
import { useTranslation } from 'react-i18next';
import { getVideoDuration } from './ToolsPage/utils';
import { isSafariBrowser } from '../hooks/useBrowserDetection';

export interface UploadFileProps {
  onChange?: (url: string) => void;
  onRemove?: () => void;
  type?: 'image' | 'video';
  children?: React.ReactNode;
  needAuth?: boolean;
  removable?: boolean;
  accept?: string;
  limit?: number;
  enforceLimit?: boolean;
  style?: React.CSSProperties;
  className?: string;
  initialImage?: string;
}
const Preview = ({ url, type }: { url: string; type: 'video' | 'image' }) => {
  if (!url || url === '' || url === 'undefined' || url === 'null') {
    return null;
  }

  if (type === 'image') {
    return (
      <img
        src={url}
        alt={'Upload image'}
        className='object-contain w-full h-full rounded-lg'
        onError={e => {
          const img = e.target as HTMLImageElement;
          img.src = '';
          img.style.display = 'none';
        }}
      />
    );
  }
  if (type === 'video') {
    return (
      <video
        src={url}
        className='object-contain w-full h-full rounded-lg'
        controls
      />
    );
  }
  return null;
};
const UploadFile = memo(
  ({
    onChange,
    onRemove,
    type = 'image',
    children,
    needAuth = true,
    removable = false,
    accept,
    limit,
    enforceLimit,
    style,
    className,
    initialImage,
  }: UploadFileProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [url, setUrl] = useState(initialImage || '');
    const [isAuth] = useAtom(authAtom);
    const [loginModalState] = useAtom(loginModalAtom);
    const { t } = useTranslation('common');

    useEffect(() => {
      if (initialImage !== url) {
        setUrl(initialImage || '');
      }
    }, [initialImage]);

    const isValid = async (type: string, file: File): Promise<boolean> => {
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

      if (type === 'image' && !file.type.startsWith('image')) {
        toast.error(t('uploadFile.errors.selectImage'), {
          position: 'top-center',
        });
        return false;
      }
      if (type === 'video' && !file.type.startsWith('video')) {
        toast.error(t('uploadFile.errors.selectVideo'), {
          position: 'top-center',
        });
        return false;
      }

      // Safari video duration check
      if (type === 'video') {
        if (isSafariBrowser()) {
          try {
            const duration = await getVideoDuration(file);
            if (duration > 15) {
              toast.error(t('toast:video.styleTransfer.safariVideoTooLong'));
              return false;
            }
          } catch (error) {
            console.warn('Failed to get video duration:', error);
            // 如果无法获取时长，允许继续上传，后续会有其他检查
          }
        }
      }

      return true;
    };

    const handleChange = async (e: React.ChangeEvent) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      const isValidFile = await isValid(type, file);
      if (!isValidFile) {
        return;
      }

      if (limit && file.size > limit * 1024 * 1024) {
        if (enforceLimit) {
          // 严格限制：阻止选择
          toast.error(t('uploadFile.errors.fileSize', { limit }), {
            position: 'top-center',
          });
          return;
        }
        // 宽松模式：允许选择但显示警告
        if (type === 'image') {
          toast(
            t('uploadFile.warnings.imageWillCompress', { limit }) ||
              `Image exceeds ${limit}MB and will be compressed`,
            {
              position: 'top-center',
              duration: 3000,
            },
          );
        } else {
          toast.error(t('uploadFile.errors.fileSize', { limit }), {
            position: 'top-center',
          });
          return;
        }
      }

      const url = URL.createObjectURL(file);
      setUrl(url);
      onChange?.(url);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const fileInputClick = () => {
      if (needAuth) {
        if (!isAuth) {
          loginModalState.onOpen?.();
          return;
        }
      }
      inputRef.current?.click();
    };

    const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      if (needAuth) {
        if (!isAuth) {
          loginModalState.onOpen?.();
          return;
        }
      }
      const file = e.dataTransfer.files[0];

      const isValidFile = await isValid(type, file);
      if (!isValidFile) {
        return;
      }

      if (limit && file.size > limit * 1024 * 1024) {
        if (enforceLimit) {
          // 严格限制：阻止选择
          toast.error(t('uploadFile.errors.fileSize', { limit }), {
            position: 'top-center',
          });
          return;
        }
        // 宽松模式：允许选择但显示警告
        if (type === 'image') {
          toast(
            t('uploadFile.warnings.imageWillCompress', { limit }) ||
              `Image exceeds ${limit}MB and will be compressed`,
            {
              position: 'top-center',
              duration: 3000,
            },
          );
        } else {
          toast.error(t('uploadFile.errors.fileSize', { limit }), {
            position: 'top-center',
          });
          return;
        }
      }

      const url = URL.createObjectURL(file);
      setUrl(url);
      onChange?.(url);
    };

    return (
      <div
        className={`relative w-full h-36 md:h-48 rounded-lg border border-dashed cursor-pointer group hover:border-indigo-400 border-2 ${className || ''}`}
        onClick={fileInputClick}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={style}>
        {url ? (
          <div className='relative w-full h-full'>
            <Preview url={url} type={type} />
            {removable && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setUrl('');
                  if (inputRef.current) {
                    inputRef.current.value = '';
                  }
                  onRemove?.();
                }}
                className='absolute top-2 right-2 p-1 text-primary-foreground bg-red-500 rounded-full hover:bg-red-600'
                type='button'>
                <FaTrash className='w-3 h-3' />
              </button>
            )}
          </div>
        ) : (
          <div className='flex absolute inset-0 flex-col justify-center items-center'>
            {children ? (
              children
            ) : (
              <>
                {type === 'image' ? (
                  <FaImage className='w-12 h-12 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                ) : (
                  <FaVideo className='w-12 h-12 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                )}
                <p className='mt-2 text-muted-foreground text-sm md:text-base transition-colors duration-200 group-hover:text-indigo-600 px-2 md:hidden'>
                  {t('uploadFile.tapToUpload')}
                </p>
                <p className='mt-2 text-muted-foreground text-sm md:text-base transition-colors duration-200 group-hover:text-indigo-600 px-2 hidden md:block'>
                  {t('uploadFile.clickToUpload')}
                </p>
              </>
            )}
          </div>
        )}
        <input
          type='file'
          accept={
            accept ||
            (type === 'image'
              ? 'image/*'
              : type === 'video'
                ? 'video/*'
                : 'image/*,video/*')
          }
          ref={inputRef}
          className='hidden'
          onChange={handleChange}
        />
      </div>
    );
  },
);

export default UploadFile;
