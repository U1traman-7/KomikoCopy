import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey,
});

export interface GPTEditImageProps {
  prompt: string;
  images: string[];
  quality: 'high' | 'medium' | 'low' | 'auto',
  imageSize: '1024x1536' | '1536x1024' | '1024x1536' | 'auto'
}


export const urlToImageFiles = async (images: string[]) => {
  const imageFiles = await Promise.all(images.map(async (image, index) => {
    if (image.startsWith('data:')) {
      // Handle base64 image
      const [header, data] = image.split(',');
      const contentType = header!.match(/:(.*?);/)![1];
      const extension = contentType.split('/')[1];
      const byteCharacters = Buffer.from(data, 'base64');
      const blob = new Blob([byteCharacters], { type: contentType });
      return new File([blob], `image${index}.${extension}`, { type: contentType });
    } else {
      // Handle URL image
      const response = await fetch(image);
      const blob = await response.blob();
      const extension = image.split('.').pop() || blob.type.split('/')[1];
      return new File([blob], `image${index}.${extension}`, { type: blob.type });
    }
  }));
  return imageFiles;
}

export const gptEditImage = async ({
  prompt,
  images,
  imageSize,
  quality
}: GPTEditImageProps) => {

  const imageFiles = await urlToImageFiles(images);
  const editResponse = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFiles as any,
    prompt: prompt,
    n: 1,
    size: imageSize as any,
    quality,
  });

  if (!editResponse.data[0].b64_json) {
    return { error: "Image generation failed" };
  }

  return `data:image/png;base64,${editResponse.data[0].b64_json}`;
}
