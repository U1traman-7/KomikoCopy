import { initImage, loadTempImage } from "../Components/InfCanva/utils"
import { CNode, CNodeType } from "../state"
import { useListenTransform } from "./useListenTransform"

function getCrop(image: HTMLImageElement, size: { width: number, height: number }, clipPosition = 'center-middle') {
  const width = size.width;
  const height = size.height;
  const aspectRatio = width / height;

  let newWidth;
  let newHeight;

  const imageRatio = image.width / image.height;

  if (aspectRatio >= imageRatio) {
    newWidth = image.width;
    newHeight = image.width / aspectRatio;
  } else {
    newWidth = image.height * aspectRatio;
    newHeight = image.height;
  }

  let x = 0;
  let y = 0;
  if (clipPosition === 'left-top') {
    x = 0;
    y = 0;
  } else if (clipPosition === 'left-middle') {
    x = 0;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'left-bottom') {
    x = 0;
    y = image.height - newHeight;
  } else if (clipPosition === 'center-top') {
    x = (image.width - newWidth) / 2;
    y = 0;
  } else if (clipPosition === 'center-middle') {
    x = (image.width - newWidth) / 2;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'center-bottom') {
    x = (image.width - newWidth) / 2;
    y = image.height - newHeight;
  } else if (clipPosition === 'right-top') {
    x = image.width - newWidth;
    y = 0;
  } else if (clipPosition === 'right-middle') {
    x = image.width - newWidth;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'right-bottom') {
    x = image.width - newWidth;
    y = image.height - newHeight;
  }

  return {
    cropX: x,
    cropY: y,
    cropWidth: newWidth,
    cropHeight: newHeight,
  };
}

function applyCrop(img: any, pos: string) {
  // img.setAttr('lastCropUsed', pos);
  const crop = getCrop(
    img.image() as HTMLImageElement,
    { width: img.width(), height: img.height() },
    pos
  );
  console.log('applyCrop', crop)
  img.setAttrs(crop);
}

export const useCreateComicImage = () => {
    const listenTransform = useListenTransform()
    return async (cnode: CNode): Promise<any> => {
      // 服务端安全检查
      if (typeof window === 'undefined') {
        return null;
      }

      const Konva = (await import('konva')).default;
      const loadImage = await initImage(cnode.imageUrl!)

      const useCoverMode = !!cnode.attrs.useCoverMode
      if (useCoverMode) {
        // 获取容器尺寸
        const containerWidth = cnode.attrs.width
        const containerHeight = cnode.attrs.height

        // 创建Konva图像
        const konvaImage = new Konva.Image({
          ...cnode.attrs,
          cType: CNodeType.COMIC_IMAGE,
          image: loadImage,
          width: containerWidth,
          height: containerHeight,
        })
        applyCrop(konvaImage, 'center-top')
        listenTransform(konvaImage)
        return konvaImage
      } else {
        // 原有的图像创建逻辑
        const konvaImage = new Konva.Image({
          ...cnode.attrs,
          cType: CNodeType.COMIC_IMAGE,
          image: loadImage
        })
        listenTransform(konvaImage)
        return konvaImage
      }
    }
  }
