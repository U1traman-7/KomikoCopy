/**
 * Image stitching utilities for multi-image video generation
 *
 * NOTE: Image stitching is now done in the browser (frontend) using Canvas API.
 * This file only contains the prompt generation function used by the backend.
 *
 * See: src/utils/stitchImagesInBrowser.ts for browser-side stitching implementation
 */

/**
 * Generate multi-image prompt for video generation
 *
 * This function is used by the backend to generate a special prompt when the frontend
 * stitches multiple character images into a single image and sends it to the backend.
 *
 * The generated prompt instructs the AI model to:
 * 1. Recognize that the input contains multiple characters
 * 2. Generate a video with multiple shots featuring these characters
 * 3. Immediately transition from the input image to the first shot
 *
 * @param imageNames Array of image names (can be in any language: Chinese, Japanese, Korean, etc.)
 * @param userPrompt User's original prompt
 * @returns Combined prompt with multi-image description prefix + user's original prompt
 *
 * @example
 * generateMultiImagePrompt(['Alice', 'Bob'], 'Create a video of them talking')
 * // Returns: "The input images include the image of Alice, the image of Bob.
 * //           Generate a video based on these images including multiple shots,
 * //           the input image should immediately vanish and the entire frame
 * //           cut into the first shot.\n\nCreate a video of them talking"
 */
export function generateMultiImagePrompt(
  imageNames: string[],
  userPrompt: string,
): string {
  if (!imageNames || imageNames.length === 0) {
    return userPrompt;
  }

  const imageList = imageNames.map(name => `the image of ${name}`).join(', ');

  const prefix = `The input images include ${imageList}. Generate a video based on these images including multiple shots, the input image should immediately vanish and the entire frame cut into the first shot.\n\n`;
  return prefix + userPrompt;
}
