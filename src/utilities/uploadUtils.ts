import { v4 as uuidv4 } from 'uuid';
import { uploadImage as uploadImageApi } from '@/api/upload';
import { uploadFile } from '@/utils/index';

/**
 * Upload image from URL to Supabase storage (using uploadImageApi)
 * @param imageUrl - The URL of the image to upload
 * @returns The public URL of the uploaded image
 */
export const uploadImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    // 1. Fetch blob from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image URL');
    }
    const blob = await response.blob();

    // 2. Create file
    const file = new File([blob], `${uuidv4()}.jpg`, { type: 'image/jpeg' });

    // 3. Upload to Supabase
    const imagePath = `app_media/${file.name}`;
    const form = new FormData();
    form.append('file', file);
    form.append('imagePath', imagePath);
    const result = await uploadImageApi(form);

    if (!result || result.error) {
      throw new Error(`Upload failed: ${result.error}`);
    }

    if (!result.data) {
      throw new Error('Failed to get public URL');
    }

    return result.data;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
};

/**
 * Upload image from URL to Supabase storage (using uploadFile)
 * Supports auto-detection of image extension
 * @param imageUrl - The URL of the image to upload
 * @returns The public URL of the uploaded image
 */
export const uploadImageFromUrlWithFile = async (
  imageUrl: string,
  userId?: string,
): Promise<string> => {
  try {
    // 1. Fetch blob from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image URL');
    }
    const ext = imageUrl.match(/image\/(.+?);/)?.[1] || 'jpg';
    const blob = await response.blob();
    const date = new Date().toISOString().split('T')[0];
    const uuid = uuidv4();
    // 2. Create file
    const file = new File([blob], `${date}-${uuid}.${ext}`, {
      type: `image/${ext}`,
    });

    // 3. Upload to Supabase
    const imagePath = `app_media/${userId || 'anonymous'}/${date}-${uuid}.${ext}`;
    const url = await uploadFile(imagePath, file);
    return url;
  } catch (error) {
    console.error('Failed to upload image:', error);
    return '';
  }
};
