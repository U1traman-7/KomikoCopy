/* eslint-disable */
import { Tooltip, Image, Checkbox } from '@nextui-org/react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { HiOutlineQuestionMarkCircle } from 'react-icons/hi';
import { v4 as uuidv4 } from 'uuid';
import { DrawAction } from '../constants';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface DrawingNode {
  child?: DrawingNode[];
}

// 客户端安全的图片节点检查
const isImageNode = (node: any): boolean => {
  if (!node || typeof window === 'undefined') return false;
  // 检查节点是否有图片节点的特征
  return (
    node.className === 'Image' ||
    node._name === 'Image' ||
    (node.attrs && node.attrs.image !== undefined)
  );
};

export const compressImage = (
  imageSrc: string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 1,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context.'));
        return;
      }

      let width = img.width;
      let height = img.height;

      // 计算图片的新宽高
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height *= maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width *= maxHeight / height));
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 压缩图片质量并返回Blob
      canvas.toBlob(
        blob => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader result is not a string.'));
              }
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Image compression failed.'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image.'));
  });
};

const cropImageToAspectRatio = (
  imageSrc: string,
  aspectRatioWidth = 9,
  aspectRatioHeight = 16,
  quality = 1,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context.'));
        return;
      }

      const originalWidth = img.width;
      const originalHeight = img.height;

      // 计算目标宽高比
      const targetAspectRatio = aspectRatioWidth / aspectRatioHeight;
      let cropWidth = originalWidth;
      let cropHeight = originalHeight;

      // 计算裁剪区域的宽高
      if (originalWidth / originalHeight > targetAspectRatio) {
        cropWidth = originalHeight * targetAspectRatio;
      } else {
        cropHeight = originalWidth / targetAspectRatio;
      }

      // 计算裁剪区域的起始位置，居中裁剪
      const cropX = (originalWidth - cropWidth) / 2;
      const cropY = (originalHeight - cropHeight) / 2;

      // 设置 canvas 的宽高为目标宽高比
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      // 压缩图片质量并返回 Blob
      canvas.toBlob(
        blob => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                // 确保前缀为 'data:image/jpeg;base64,' 格式
                const base64DataUrl = reader.result;
                resolve(base64DataUrl);
              } else {
                reject(new Error('FileReader result is not a string.'));
              }
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Image cropping failed.'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image.'));
  });
};

interface SimpleImageUploaderProps {
  referenceImage: string | null;
  setReferenceImage: any;
  compress?: boolean;
  crop?: boolean;
  width?: number;
  height?: number;
  setImageFile?: any;
}

export function SimpleImageUploader({
  referenceImage,
  setReferenceImage,
  compress,
  crop,
  width,
  height,
  setImageFile,
}: SimpleImageUploaderProps) {
  const { t } = useTranslation('toast');
  const maxSize = 5 * 1024 * 1024;

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxSize: maxSize,
    onDrop: acceptedFiles => {
      acceptedFiles.forEach(file => {
        console.log(file);

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            let imageUrl = reader.result;
            if (compress) {
              imageUrl = await compressImage(reader.result as string);
            } else if (crop) {
              imageUrl = await cropImageToAspectRatio(
                reader.result as string,
                9,
                16,
              );
            }
            setReferenceImage(imageUrl);

            if (setImageFile) {
              // 将 Base64 URL 转换为 Blob
              const blob = await (await fetch(imageUrl as string)).blob();
              // 创建新的 File 对象，保留原来的 name, type, lastModified
              const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified,
              });
              setImageFile(croppedFile); // 重新设置为裁剪后的文件
            }
          } catch (error) {
            console.error('Error compressing image:', error);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    onDropRejected: rejectedFiles => {
      rejectedFiles.forEach(({ errors }) => {
        errors.forEach(error => {
          if (error.code === 'file-too-large') {
            toast.error(t('error.imageIsLargerThan5MB'), {
              position: 'top-center',
            });
          } else {
            toast.error(error.message, {
              position: 'top-center',
            });
          }
        });
      });
    },
  });
  return (
    <div
      className='relative'
      style={{ width: width ?? 116, height: height ?? 116 }}>
      <div
        {...getRootProps({ className: 'dropzone' })}
        className='flex justify-center items-center mb-4 rounded-md border-2 border-border border-dashed cursor-pointer'
        style={{ width: width ?? 116, height: height ?? 116 }}>
        {!referenceImage && (
          <div className='text-center text-muted-foreground text-[26px]'>+</div>
        )}
        <input {...getInputProps()} />
        {referenceImage && (
          <img
            src={referenceImage}
            className='object-contain overflow-hidden w-full h-full rounded-md'
          />
        )}
      </div>

      {referenceImage && (
        <button
          className='flex absolute top-0 right-0 justify-center items-center w-6 h-6 text-foreground bg-card rounded-full border-2 border-foreground z-100'
          onClick={() => setReferenceImage(null)}>
          <b>×</b>
        </button>
      )}
    </div>
  );
}

interface ImageUploaderProps {
  currentSelectedShape:
    | {
        type: DrawAction;
        id: string;
        node: any;
        originTargetAttrs?: DrawingNode;
      }
    | undefined;
  images: any[];
  setImages: (images: any) => void;
  selectedIds: string[];
  setSelectedIds: (func: any) => void;
  label: string;
  hint: string;
}

export const ImageUploader = ({
  currentSelectedShape,
  images,
  setImages,
  selectedIds,
  setSelectedIds,
  label,
  hint,
}: ImageUploaderProps) => {
  const onDrop = useCallback(
    async (acceptedFiles: any) => {
      const processFiles = async (files: any[]) => {
        const filePromises = files.map((file: any) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onabort = () => console.error('file reading was aborted');
            reader.onerror = () => {
              console.error('file reading has failed');
              reject(reader.error);
            };
            reader.onload = () => {
              const blob = new Blob([reader.result!], { type: file.type });
              resolve(
                Object.assign(file, {
                  id: uuidv4(),
                  preview: URL.createObjectURL(file),
                  blob: blob,
                }),
              );
            };
            reader.readAsArrayBuffer(file);
          });
        });

        return Promise.all(filePromises);
      };

      const newFiles: any = await processFiles(acceptedFiles);
      setImages((charImages: any) => {
        handleSelectImage(newFiles[0].id);
        return charImages.concat(newFiles);
      });
    },
    [setImages],
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png', '.jpg', '.jpeg'],
    },
  });

  const handleRemoveImage = (id: string) => {
    setImages((prevImages: any) => {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((i: string) => i !== id));
      }
      const newImages = prevImages.filter((image: any) => image.id !== id);
      return newImages;
    });
  };

  const handleSelectImage = (id: string) => {
    setSelectedIds((prevIds: any) => {
      if (prevIds.includes(id)) {
        return prevIds.filter((i: string) => i !== id);
      } else {
        return [id];
      }
      // const newIds = prevIds.filter((id: string) => !ids.includes(id));
      // return newIds.concat(ids.filter((id: string) => !prevIds.includes(id)));
    });
  };

  return (
    <div>
      <Tooltip content={hint}>
        <div className='flex items-center mb-2'>
          <div className='text-sm'>
            <b>{label}</b>
          </div>
          <HiOutlineQuestionMarkCircle className='ml-1' />
        </div>
      </Tooltip>
      {images.length > 0 && (
        <div className='overflow-x-auto mb-3 w-full'>
          <div className='flex space-x-2'>
            {images.map((image, index) => (
              <div
                key={index}
                className={
                  'overflow-hidden relative flex-none p-1 rounded-xl z-1 w-[150px] h-[150px]'
                }>
                <Image
                  isZoomed
                  src={image.preview}
                  alt={image.name}
                  className='object-cover w-full h-full rounded-xl z-1'
                  width={150}
                  height={150}
                  style={{ aspectRatio: '1/1' }}
                  onClick={() => handleSelectImage(image.id)}
                />
                <Checkbox
                  isDisabled={!isImageNode(currentSelectedShape?.node)}
                  className='absolute top-3 left-3 z-10'
                  size='lg'
                  isSelected={selectedIds.includes(image.id)}
                  onChange={() => handleSelectImage(image.id)}
                />
                <button
                  className='absolute top-[-0px] right-[-0px] z-50 pb-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-border bg-card text-foreground'
                  onClick={() => handleRemoveImage(image.id)}>
                  <b>×</b>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        {...getRootProps({ className: 'dropzone' })}
        className='flex justify-center items-center p-2 h-11 text-sm text-center text-muted-foreground bg-muted rounded-xl border-border border-dashed border-1'>
        <input {...getInputProps()} />
        <p>Upload {label.toLowerCase()}</p>
      </div>
    </div>
  );
};
