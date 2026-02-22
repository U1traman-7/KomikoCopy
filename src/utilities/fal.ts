import { fal } from '@fal-ai/client';
import { compressImage } from '@/Components/ImageUploader';

fal.config({
  proxyUrl: '/api/fal/proxy',
});

type MediaType = 'image' | 'video';

interface MediaConfig {
  type: MediaType;
  defaultExtension: string;
  defaultMimeType: string;
  validateMimeType: (mimeType: string) => boolean;
}

const mediaConfigs: Record<MediaType, MediaConfig> = {
  image: {
    type: 'image',
    defaultExtension: 'jpg',
    defaultMimeType: 'image/jpeg',
    validateMimeType: (mimeType: string) => mimeType.startsWith('image/'),
  },
  video: {
    type: 'video',
    defaultExtension: 'mp4',
    defaultMimeType: 'video/mp4',
    validateMimeType: (mimeType: string) =>
      mimeType.startsWith('video/') || mimeType === 'application/octet-stream',
  },
};

/**
 * Generic function to upload media files to FAL storage
 */
const uploadMediaToFal = async (
  mediaFile: File | Blob | string,
  mediaType: MediaType,
  userId?: string,
): Promise<string> => {
  const config = mediaConfigs[mediaType];

  try {
    let fileToUpload: File;

    // Handle different input types
    if (typeof mediaFile === 'string') {
      // If it's a URL, fetch it and convert to File
      const response = await fetch(mediaFile);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${mediaType} URL: ${response.status} ${response.statusText}`,
        );
      }
      const blob = await response.blob();

      // Validate blob type
      if (!config.validateMimeType(blob.type)) {
        throw new Error(`Invalid ${mediaType} blob type: ${blob.type}`);
      }

      fileToUpload = new File(
        [blob],
        `${mediaType}.${config.defaultExtension}`,
        {
          type: blob.type || config.defaultMimeType,
        },
      );
    } else if (mediaFile instanceof Blob) {
      // Convert Blob to File
      fileToUpload = new File(
        [mediaFile],
        `${mediaType}.${config.defaultExtension}`,
        {
          type: mediaFile.type || config.defaultMimeType,
        },
      );
    } else {
      // Already a File
      fileToUpload = mediaFile;
    }

    // console.log(`Uploading ${mediaType} to FAL storage...`, {
    //   fileName: fileToUpload.name,
    //   fileSize: fileToUpload.size,
    //   fileType: fileToUpload.type,
    //   userId,
    // });

    // Upload to FAL storage
    const url = await fal.storage.upload(fileToUpload);

    // console.log(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} upload to FAL successful:`, { url, userId });

    return url;
  } catch (error) {
    console.error(`FAL ${mediaType} upload failed:`, error);

    // Enhanced error reporting
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          `Network error: Failed to fetch ${mediaType} for upload`,
        );
      } else if (error.message.includes(`Invalid ${mediaType} blob type`)) {
        throw error; // Re-throw validation errors as-is
      } else {
        throw new Error(`FAL upload failed: ${error.message}`);
      }
    }

    throw new Error(`Unknown error occurred during FAL ${mediaType} upload`);
  }
};

/**
 * Upload a video file to FAL storage using client-side upload
 */
export const uploadVideoToFal = async (
  videoFile: File | Blob | string,
  userId?: string,
): Promise<string> => {
  return uploadMediaToFal(videoFile, 'video', userId);
};

/**
 * Process image to add white background if it has transparency
 * @param imageFile File, Blob, or URL string
 * @returns Processed File with white background if needed
 */
const processImageWithWhiteBackground = async (
  imageFile: File | Blob | string,
): Promise<File | Blob | string> => {
  try {
    // If it's a string URL, fetch and convert to blob
    let blob: Blob;
    let fileName = 'image.jpg';
    let imageUrl: string;

    if (typeof imageFile === 'string') {
      imageUrl = imageFile;
      const response = await fetch(imageFile);
      if (!response.ok) {
        // If fetch fails, return original
        return imageFile;
      }
      blob = await response.blob();
    } else if (imageFile instanceof File) {
      blob = imageFile;
      fileName = imageFile.name;
      imageUrl = URL.createObjectURL(blob);
    } else {
      blob = imageFile;
      imageUrl = URL.createObjectURL(blob);
    }

    // Check if image has transparency by examining pixels
    const hasTransparency = await new Promise<boolean>(resolve => {
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

    // If no transparency, return original
    if (!hasTransparency) {
      if (typeof imageFile !== 'string' && !(imageFile instanceof File)) {
        URL.revokeObjectURL(imageUrl);
      }
      return imageFile;
    }

    // Create canvas to process image with white background
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          if (typeof imageFile !== 'string' && !(imageFile instanceof File)) {
            URL.revokeObjectURL(imageUrl);
          }
          resolve(imageFile);
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

        // Convert to blob (JPEG to remove transparency)
        canvas.toBlob(
          processedBlob => {
            if (typeof imageFile !== 'string' && !(imageFile instanceof File)) {
              URL.revokeObjectURL(imageUrl);
            }
            if (processedBlob) {
              // Create new file with processed blob
              const processedFile = new File(
                [processedBlob],
                fileName.replace(/\.png$/i, '.jpg'),
                { type: 'image/jpeg' },
              );
              resolve(processedFile);
            } else {
              resolve(imageFile);
            }
          },
          'image/jpeg',
          0.95,
        );
      };

      img.onerror = () => {
        if (typeof imageFile !== 'string' && !(imageFile instanceof File)) {
          URL.revokeObjectURL(imageUrl);
        }
        resolve(imageFile);
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.warn('Failed to process image with white background:', error);
    return imageFile;
  }
};

export const uploadImageToFal = async (
  imageFile: File | Blob | string,
  userId?: string,
): Promise<string> => {
  // Convert to string if needed for compressImage
  let imageUrl: string;
  if (typeof imageFile === 'string') {
    imageUrl = imageFile;
  } else if (imageFile instanceof File || imageFile instanceof Blob) {
    imageUrl = URL.createObjectURL(imageFile);
  } else {
    imageUrl = imageFile;
  }

  const compressedImage = await compressImage(imageUrl, 1024, 1024, 0.85);
  const processedImage = await processImageWithWhiteBackground(compressedImage);
  const result = await uploadMediaToFal(processedImage, 'image', userId);
  return result;
};

export const getFalClient = () => fal;

export const configureFal = (config: {
  proxyUrl?: string;
  credentials?: string;
}) => {
  fal.config(config);
};
