/**
 * Optimize Supabase Storage image URL with size and quality parameters
 * Uses Supabase's built-in image transformation feature
 * 
 * @param url - Original image URL
 * @param size - Target size (width = height for square logos)
 * @param quality - Image quality (1-100)
 * @returns Optimized URL or original URL if not Supabase Storage
 */
export const getOptimizedImageUrl = (
  url: string | null | undefined,
  size = 64,
  quality = 75
): string | null => {
  if (!url) return null;

  // Check if it's a Supabase Storage URL
  if (url.includes('supabase.co/storage/') && url.includes('/object/')) {
    // Replace /object/ with /render/image/ and add transformation params
    return (
      url.replace('/object/', '/render/image/') +
      `?width=${size}&quality=${quality}&resize=contain`
    );
  }

  return url;
};

/**
 * Get optimized logo URL for tag display
 * Small size (64px) for chips and lists
 */
export const getTagLogoUrl = (url: string | null | undefined): string | null => {
  return getOptimizedImageUrl(url, 64, 75);
};

/**
 * Get optimized logo URL for small tag chips (40x40)
 * Used in TagOrderModal and similar compact displays
 */
export const getTagSmallLogoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  return `${url}?width=40&height=40&resize=cover&quality=60`;
};

/**
 * Get optimized logo URL for tag header (larger display)
 * Larger size (256px) for tag detail page header to avoid pixelation
 */
export const getTagHeaderLogoUrl = (url: string | null | undefined): string | null => {
  return getOptimizedImageUrl(url, 256, 85);
};

// ============ Logo sizes for different use cases ============
export const LOGO_SIZE = 256; // Logo is stored at 256px, displayed sizes are handled by Supabase transform
export const MAX_HEADER_WIDTH = 1200;
export const MAX_HEADER_HEIGHT = 400;

/**
 * Crop image to square (center crop) and convert to WebP
 * @param file - Source image file
 * @param targetSize - Target size for the square output
 * @param quality - WebP quality (0-1)
 */
export const cropToSquareWebP = (
  file: File,
  targetSize: number,
  quality = 0.9
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context not available'));
        return;
      }

      const { width, height } = img;
      const size = Math.min(width, height);
      const sx = (width - size) / 2;
      const sy = (height - size) / 2;

      // Use smaller of targetSize or actual size to avoid upscaling
      const finalSize = Math.min(targetSize, size);
      canvas.width = finalSize;
      canvas.height = finalSize;

      ctx.drawImage(img, sx, sy, size, size, 0, 0, finalSize, finalSize);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp',
            }));
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Process logo image: crop to square and convert to WebP
 */
export const processLogoImage = async (file: File): Promise<File> => {
  return cropToSquareWebP(file, LOGO_SIZE, 0.9);
};

