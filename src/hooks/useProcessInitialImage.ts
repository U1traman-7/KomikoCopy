import { useState, useEffect } from 'react';
import { useMediaFromNavigation, MediaData } from './useMediaFromNavigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

interface UseProcessInitialImageOptions {
  onImageProcessed?: (imageUrl: string) => void;
}


export function useProcessInitialImage(options: UseProcessInitialImageOptions = {}): {
  inputImage: string;
  setInputImage: (url: string, fromTool?: boolean) => void;
  hasMedia: boolean;
  mediaItem: MediaData;
  isFromTool: boolean;
} {
  const { onImageProcessed } = options;
  const [inputImage, setInputImage] = useState<string>("");
  const [autoProcessed, setAutoProcessed] = useState<boolean>(false);
  const [isFromTool, setIsFromTool] = useState<boolean>(false);
  const router = useRouter();
  
  const { t } = useTranslation('common');
  const mediaItem = useMediaFromNavigation();
  const hasMedia = !!mediaItem?.url;

  // 清除URL查询参数但保持状态
  const clearUrlQuery = async () => {
    const { pathname, query } = router;
    if (Object.keys(query).length > 0) {
      await router.replace(pathname, undefined, { shallow: true });
    }
  };

  // 包装setInputImage，跟踪图片来源
  const updateInputImage = (url: string, fromTool: boolean = false) => {
    setInputImage(url);
    setIsFromTool(fromTool);
  };

  useEffect(() => {
    const processInitialImage = async () => {
      if (autoProcessed) return;

      if (mediaItem?.url) {
        try {
          const imageUrl = mediaItem.url;
          updateInputImage(imageUrl, true); // 标记为来自工具
          setAutoProcessed(true);
          
          if (onImageProcessed) {
            onImageProcessed(imageUrl);
          }

          // 显示成功提示
          toast.success(t('from_other_tools', {
            input_type: t('input_types.image'),
            tools: t(`tools.${mediaItem.source}`),
          }), {
            position: "top-center",
            duration: 3000,
            style: {
              background: '#4CAF50',
              color: '#fff',
            }
          });

          // 处理完成后清除URL查询参数
          await clearUrlQuery();
          return;
        } catch (error) {
          console.error('处理MediaNavigation图像失败:', error);
        }
      }
    };

    processInitialImage();
  }, [autoProcessed, mediaItem, onImageProcessed]);

  return {
    inputImage,
    setInputImage: updateInputImage,
    hasMedia,
    mediaItem,
    isFromTool
  };
} 