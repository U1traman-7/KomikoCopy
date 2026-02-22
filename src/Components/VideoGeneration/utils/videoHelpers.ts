import { v4 as uuidv4 } from 'uuid';
import {
  ImageToVideoModel,
  TextToVideoModel,
} from '../../../../api/tools/_zaps';
import { ModelIds } from '../../../../api/_constants';
import { uploadFile } from '@/utils/index';

type ModelId = (typeof ModelIds)[keyof typeof ModelIds];

// Convert model enum to ModelId
// 用于兼容旧ID
export const convertModel = (
  model: ImageToVideoModel | TextToVideoModel,
  hasImage: boolean,
  multiImageCount?: number,
): ModelId => {
  if (hasImage) {
    if (
      model === ImageToVideoModel.ANISORA ||
      model === ImageToVideoModel.FRAME_PACK
    ) {
      return model === ImageToVideoModel.ANISORA
        ? ModelIds.ANISORA
        : ModelIds.FRAME_PACK;
    }

    switch (model) {
      case ImageToVideoModel.KLING_V2:
      case TextToVideoModel.KLING_V2:
        return ModelIds.KLING_V2;
      case ImageToVideoModel.VIDU_Q2:
      case TextToVideoModel.VIDU_Q2:
        // Auto-select API based on image count
        if (multiImageCount && multiImageCount >= 2) {
          return ModelIds.VIDU_Q2_REFERENCE_TO_VIDEO; // Multi-image API
        }
        return ModelIds.VIDU_Q2; // Single-image API
      case ImageToVideoModel.VIDU_Q2_MULTI:
        return ModelIds.VIDU_Q2_REFERENCE_TO_VIDEO;
      case ImageToVideoModel.VIDU_Q2_PRO:
        return ModelIds.VIDU_Q2_PRO;
      case ImageToVideoModel.VEO:
      case TextToVideoModel.VEO:
        return ModelIds.VEO3;
      case ImageToVideoModel.WAN:
      case TextToVideoModel.WAN:
        return ModelIds.WAN;
      case ImageToVideoModel.RAY:
      case TextToVideoModel.RAY:
        return ModelIds.RAY;
      case ImageToVideoModel.VIDU:
      case TextToVideoModel.VIDU:
        return ModelIds.VIDU;
      case ImageToVideoModel.SEEDANCE:
      case TextToVideoModel.SEEDANCE:
        return ModelIds.SEEDANCE;
      case ImageToVideoModel.SORA_PRO:
      case TextToVideoModel.SORA_PRO:
        return ModelIds.SORA_PRO;
      case ImageToVideoModel.SORA:
      case TextToVideoModel.SORA:
        return ModelIds.SORA;
      case ImageToVideoModel.SORA_STABLE:
      case TextToVideoModel.SORA_STABLE:
        return ModelIds.SORA_STABLE;
      case ImageToVideoModel.SORA_PRO_STABLE:
      case TextToVideoModel.SORA_PRO_STABLE:
        return ModelIds.SORA_PRO_STABLE;
      case ImageToVideoModel.MINIMAX:
      case TextToVideoModel.MINIMAX:
        return ModelIds.MINIMAX;
      case ImageToVideoModel.WAN_22_TURBO:
      case TextToVideoModel.WAN_22_TURBO:
        return ModelIds.WAN_22_TURBO_IMAGE_TO_VIDEO;
      default:
        return model as any;
    }
  } else {
    switch (model) {
      case ImageToVideoModel.MINIMAX:
      case TextToVideoModel.MINIMAX:
        return ModelIds.MINIMAX_TEXT_TO_VIDEO;
      case ImageToVideoModel.RAY:
      case TextToVideoModel.RAY:
        return ModelIds.RAY_TEXT_TO_VIDEO;
      case ImageToVideoModel.KLING_V2:
      case TextToVideoModel.KLING_V2:
        return ModelIds.KLING_V2_TEXT_TO_VIDEO;
      case ImageToVideoModel.WAN:
      case TextToVideoModel.WAN:
        return ModelIds.WAN_TEXT_TO_VIDEO;
      case ImageToVideoModel.VIDU_Q2:
      case TextToVideoModel.VIDU_Q2:
        return ModelIds.VIDU_Q2_TEXT_TO_VIDEO;
      case ImageToVideoModel.SEEDANCE:
      case TextToVideoModel.SEEDANCE:
        return ModelIds.SEEDANCE_TEXT_TO_VIDEO;
      case ImageToVideoModel.VIDU:
      case TextToVideoModel.VIDU:
        return ModelIds.VIDU_TEXT_TO_VIDEO;
      case ImageToVideoModel.VEO:
      case TextToVideoModel.VEO:
        return ModelIds.VEO3_TEXT_TO_VIDEO;
      case ImageToVideoModel.SORA_PRO:
      case TextToVideoModel.SORA_PRO:
        return ModelIds.SORA_PRO_TEXT_TO_VIDEO;
      case ImageToVideoModel.SORA:
      case TextToVideoModel.SORA:
        return ModelIds.SORA_TEXT_TO_VIDEO;
      case ImageToVideoModel.SORA_STABLE:
      case TextToVideoModel.SORA_STABLE:
        return ModelIds.SORA_STABLE_TEXT_TO_VIDEO;
      case ImageToVideoModel.SORA_PRO_STABLE:
      case TextToVideoModel.SORA_PRO_STABLE:
        return ModelIds.SORA_PRO_STABLE_TEXT_TO_VIDEO;
      case ImageToVideoModel.WAN_22_TURBO:
      case TextToVideoModel.WAN_22_TURBO:
        return ModelIds.WAN_22_TURBO_TEXT_TO_VIDEO;
      default:
        return model as any;
    }
  }
};

// Upload image to Supabase with automatic white background for transparent images
export const uploadImage = async (imageUrl: string): Promise<string> => {
  try {
    // Check if image has transparency
    const hasAlpha = await new Promise<boolean>(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(false);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Check if any pixel has alpha < 255
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 255) {
              resolve(true);
              return;
            }
          }

          resolve(false);
        } catch (error) {
          console.warn('Failed to check transparency:', error);
          resolve(false);
        }
      };

      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });

    // If image has transparency, add white background
    let processedImageUrl = imageUrl;
    if (hasAlpha) {
      processedImageUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              resolve(imageUrl);
              return;
            }

            // Keep original dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw image on top
            ctx.drawImage(img, 0, 0);

            // Convert to base64
            resolve(canvas.toDataURL('image/jpeg', 0.95));
          } catch (error) {
            console.warn('Failed to add white background:', error);
            resolve(imageUrl);
          }
        };

        img.onerror = () => resolve(imageUrl);
        img.src = imageUrl;
      });
    }

    const response = await fetch(processedImageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image URL');
    }
    const ext = processedImageUrl.match(/image\/(.+?);/)?.[1] || 'jpg';
    const blob = await response.blob();

    const file = new File([blob], `${uuidv4()}.${ext}`, { type: 'image/jpeg' });
    const imagePath = `app_media/${file.name}`;
    const url = await uploadFile(imagePath, file);
    return url;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return '';
  }
};

// Upload audio to Supabase
export const uploadAudio = async (audioFile: File): Promise<string> => {
  try {
    const ext = audioFile.name.split('.').pop() || 'mp3';
    const fileName = `${uuidv4()}.${ext}`;
    const audioPath = `app_media/${fileName}`;

    const url = await uploadFile(audioPath, audioFile);
    return url;
  } catch (error) {
    console.error('Failed to upload audio:', error);
    return '';
  }
};


// Get closest aspect ratio from a list based on image dimensions
export const getClosestAspectRatioFromList = (
  width: number,
  height: number,
  availableRatios: string[],
): string => {
  const ratio = width / height;
  const aspectRatioMap: { [key: string]: number } = {
    '1:1': 1,
    '16:9': 16 / 9,
    '9:16': 9 / 16,
    '4:3': 4 / 3,
    '3:4': 3 / 4,
    '21:9': 21 / 9,
  };

  let closestRatio = availableRatios[0];
  let minDifference = Math.abs(ratio - aspectRatioMap[availableRatios[0]]);

  for (const ar of availableRatios) {
    const difference = Math.abs(ratio - aspectRatioMap[ar]);
    if (difference < minDifference) {
      minDifference = difference;
      closestRatio = ar;
    }
  }

  return closestRatio;
};



