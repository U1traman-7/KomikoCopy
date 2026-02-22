import React, { memo, useRef, useState, useEffect } from "react";
import { FaCloudUploadAlt, FaTrash, FaMusic } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAtom } from 'jotai';
import { authAtom, loginModalAtom } from 'state';
import { useTranslation } from 'react-i18next';

export interface UploadAudioProps {
  onChange?: (file: File) => void;
  onRemove?: () => void;
  needAuth?: boolean;
  removable?: boolean;
  accept?: string;
  limit?: number;
  enforceLimit?: boolean;
  style?: React.CSSProperties;
  className?: string;
  initialAudio?: File | null;
}

const UploadAudio = memo(({
  onChange,
  onRemove,
  needAuth = true,
  removable = false,
  accept = ".mp3,.wav,.mpeg",
  limit,
  enforceLimit,
  style,
  className,
  initialAudio
}: UploadAudioProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(initialAudio || null);
  const [isAuth] = useAtom(authAtom);
  const [loginModalState] = useAtom(loginModalAtom);
  const { t } = useTranslation('common');

  useEffect(() => {
    if (initialAudio !== selectedFile) {
      setSelectedFile(initialAudio || null);
    }
  }, [initialAudio]);

  const isValid = (file: File) => {
    if (accept) {
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
      const acceptedExtensions = accept.split(',').map(ext =>
        ext.trim().startsWith('.') ? ext.trim().substring(1).toLowerCase() : ext.trim().toLowerCase()
      );

      if (!acceptedExtensions.includes(fileExtension)) {
        toast.error(t('uploadFile.errors.invalidExtension', { accept }) || `Please select a file with extension: ${accept}`, {
          position: 'top-center',
        });
        return false;
      }
    }

    if (!file.type.startsWith('audio')) {
      toast.error(t('uploadFile.errors.selectAudio') || 'Please select an audio file', {
        position: 'top-center',
      });
      return false;
    }
    return true
  }

  const handleChange = (e: React.ChangeEvent) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    if (!isValid(file)) {
      return;
    }
    if (limit && file.size > limit * 1024 * 1024) {
      if (enforceLimit) {
        // 严格限制：阻止选择
        toast.error(t('uploadFile.errors.audioSize', { limit }) || `File size exceeds ${limit}MB`, {
          position: 'top-center',
        });
        return;
      } else {
        // 宽松模式：显示警告但允许选择
        toast(t('uploadFile.warnings.audioTooLarge', { limit }) || `Audio file exceeds ${limit}MB`, {
          position: 'top-center',
          duration: 3000,
        });
      }
    }

    setSelectedFile(file);
    onChange?.(file);
  }

  const fileInputClick = () => {
    if (needAuth) {
      if (!isAuth) {
        loginModalState.onOpen?.();
        return;
      }
    }
    inputRef.current?.click();
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (needAuth) {
      if (!isAuth) {
        loginModalState.onOpen?.();
        return;
      }
    }
    const file = e.dataTransfer.files[0];
    if (!isValid(file)) {
      return;
    }
    if (limit && file.size > limit * 1024 * 1024) {
      if (enforceLimit) {
        // 严格限制：阻止选择
        toast.error(t('uploadFile.errors.fileSize', { limit }) || `File size exceeds ${limit}MB`, {
          position: 'top-center',
        });
        return;
      } else {
        // 宽松模式：显示警告但允许选择
        toast(t('uploadFile.warnings.audioTooLarge', { limit }) || `Audio file exceeds ${limit}MB`, {
          position: 'top-center',
          duration: 3000,
        });
      }
    }

    setSelectedFile(file);
    onChange?.(file);
  }

  return (
    <div
      className={`relative w-full rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 h-32 md:h-36  hover:bg-muted ${className || ''}`}
      onClick={fileInputClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {selectedFile ? (
        <div className="flex flex-col justify-center items-center h-full">
          <div className="flex items-center justify-center w-10 h-10">
            <FaMusic className="w-8 h-8 text-primary-500 mb-2 shrink-0" />
          </div>
          <p className="text-foreground font-medium">{selectedFile.name}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
          {removable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                onRemove?.();
              }}
              className="absolute top-2 right-2 p-1 text-primary-foreground bg-red-500 rounded-full hover:bg-red-600 text-sm md:text-base"
              type="button"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex absolute inset-0 flex-col justify-center items-center">
          <FaCloudUploadAlt className="w-10 h-10 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground text-sm md:text-base">{t('uploadFile.dragAudio')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('uploadFile.supportedAudio')} ({t('uploadFile.errors.maxDuration', { duration: 2 })})</p>
        </div>
      )}
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
});

export default UploadAudio; 