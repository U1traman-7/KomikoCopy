/**
 * Browser-side image stitching using Canvas API
 * More reliable than server-side Sharp processing in Vercel serverless environment
 */

interface StitchImagesParams {
  imageUrls: string[];
  imageNames?: string[];
  aspectRatio: string;
}

interface GridLayout {
  rows: number;
  cols: number;
}

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Calculate grid layout based on image count and aspect ratio
 */
function calculateGridLayout(count: number, aspectRatio: string): GridLayout {
  if (count === 1) return { rows: 1, cols: 1 };

  // Portrait ratios: 9:16, 3:4, 9:21 (height > width)
  const isPortrait = ['9:16', '3:4', '9:21'].includes(aspectRatio);

  if (isPortrait) {
    // Portrait: stack vertically (rows)
    return { rows: count, cols: 1 };
  } else {
    // Landscape or square: arrange horizontally (columns)
    return { rows: 1, cols: count };
  }
}

/**
 * Calculate target dimensions based on aspect ratio
 */
function calculateTargetDimensions(aspectRatio: string): Dimensions {
  const ratioMap: Record<string, Dimensions> = {
    // Landscape ratios
    '21:9': { width: 2520, height: 1080 },
    '16:9': { width: 1920, height: 1080 },
    '4:3': { width: 1440, height: 1080 },
    // Square
    '1:1': { width: 1080, height: 1080 },
    // Portrait ratios
    '3:4': { width: 1080, height: 1440 },
    '9:16': { width: 1080, height: 1920 },
    '9:21': { width: 1080, height: 2520 },
  };

  return ratioMap[aspectRatio] || ratioMap['16:9'];
}

/**
 * Load image from URL with CORS support
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Draw text with automatic font size adjustment
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number = 36,
): void {
  // Detect CJK characters
  const isCJK = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);
  const charWidthRatio = isCJK ? 0.7 : 0.6;

  let fontSize = baseFontSize;
  let estimatedWidth = text.length * fontSize * charWidthRatio;

  // Reduce font size if text is too wide
  while (estimatedWidth > maxWidth && fontSize > 24) {
    fontSize -= 2;
    estimatedWidth = text.length * fontSize * charWidthRatio;
  }

  // Set font
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text
  ctx.fillText(text, x, y, maxWidth);
}

/**
 * Stitch multiple images into a single image using Canvas API
 * @returns Blob of the stitched image (JPEG format)
 */
export async function stitchImagesInBrowser(
  params: StitchImagesParams,
): Promise<Blob> {
  const { imageUrls, imageNames, aspectRatio } = params;

  // If only one image, fetch and return it directly
  if (imageUrls.length === 1) {
    const response = await fetch(imageUrls[0]);
    return await response.blob();
  }

  // Calculate layout
  const { rows, cols } = calculateGridLayout(imageUrls.length, aspectRatio);
  const targetDimensions = calculateTargetDimensions(aspectRatio);

  const labelHeight = 80; // Height reserved for text labels
  const cellWidth = Math.floor(targetDimensions.width / cols);
  const cellHeight = Math.floor(targetDimensions.height / rows);
  const imageHeight = cellHeight - labelHeight;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetDimensions.width;
  canvas.height = targetDimensions.height;
  const ctx = canvas.getContext('2d', {
    alpha: false, // No transparency for better JPEG compression
    willReadFrequently: false,
  });

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Enable high-quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load all images  
  const images = await Promise.all(imageUrls.map(url => loadImage(url)));

  // Draw images
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const row = Math.floor(i / cols);
    const col = i % cols;

    const x = col * cellWidth;
    const y = row * cellHeight;

    // Calculate scaling to fit image in cell while maintaining aspect ratio
    const scale = Math.min(cellWidth / img.width, imageHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Center image in cell
    const offsetX = (cellWidth - scaledWidth) / 2;
    const offsetY = (imageHeight - scaledHeight) / 2;

    // Draw image
    ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
  }

  // Draw labels if provided
  if (imageNames && imageNames.length > 0) {
    for (let i = 0; i < Math.min(images.length, imageNames.length); i++) {
      const name = imageNames[i];
      if (!name || name.trim() === '') continue;

      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = col * cellWidth;
      const y = row * cellHeight + imageHeight;

      // Draw white background for label
      ctx.fillStyle = 'white';
      ctx.fillRect(x, y, cellWidth, labelHeight);

      // Draw text centered in label area
      const textX = x + cellWidth / 2;
      const textY = y + labelHeight / 2;
      const maxTextWidth = cellWidth * 0.95;

      drawText(ctx, name, textX, textY, maxTextWidth);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      0.95, // Higher quality for sharper images
    );
  });
}



