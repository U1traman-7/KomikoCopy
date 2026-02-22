import { loadKonva } from './konva-loader';

export const WATERMARK_IMAGE = '/images/watermark_3.webp';

export async function addWatermark(dataURL: string): Promise<string> {
  // 动态加载 Konva
  const Konva = await loadKonva();
  if (!Konva) {
    throw new Error('Konva not available on server side');
  }

  // TODO: get plan from user need to be optimized
  let planCodes = [];
  let isCPP = false;
  try {
    const profile = await fetch('/api/fetchProfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ method: 'profile' }),
    });
    const profileData = await profile.json();
    planCodes = profileData.plan_codes;
    isCPP = profileData.is_cpp;
  } catch (e) {}
  return new Promise((resolve, reject) => {
    const tempContainer = document.createElement('div');
    tempContainer.style.display = 'none';
    document.body.appendChild(tempContainer);

    // 创建一个新的 Konva.Stage 来处理图像
    const imageObj = new Image();
    imageObj.crossOrigin = 'anonymous';
    imageObj.onload = () => {
      const stage = new Konva.Stage({
        container: tempContainer,
        width: imageObj.width,
        height: imageObj.height,
      });
      const layer = new Konva.Layer();
      stage.add(layer);

      const konvaImage = new Konva.Image({
        image: imageObj,
        width: imageObj.width,
        height: imageObj.height,
      });
      layer.add(konvaImage);

      // 加载水印图片
      const watermarkObj = new Image();
      watermarkObj.crossOrigin = 'anonymous';
      watermarkObj.onload = () => {
        console.log(planCodes, isCPP, 'planCodes, isCPP');
        if (!planCodes?.length && !isCPP) {
          const watermarkImage = new Konva.Image({
            image: watermarkObj,
            width: 320, // 调整水印图片的宽度
            height: 120, // 调整水印图片的高度
            x: imageObj.width - 360, // 调整位置
            y: imageObj.height - 140, // 调整位置
          });
          layer.add(watermarkImage);
        }

        layer.draw();

        // 生成带水印的图像
        const finalUri = stage.toDataURL();

        // 清理
        stage.destroy();
        document.body.removeChild(tempContainer);

        resolve(finalUri);
      };
      watermarkObj.onerror = reject;
      watermarkObj.src = WATERMARK_IMAGE;
    };
    imageObj.onerror = reject;
    imageObj.src = dataURL;
    imageObj.crossOrigin = 'Anonymous';
  });
}

export async function generateWatermarkedImage(
  uri: string,
  format = 'png',
): Promise<string> {
  // 动态加载 Konva
  const Konva = await loadKonva();
  if (!Konva) {
    throw new Error('Konva not available on server side');
  }

  // TODO: get plan from user need to be optimized
  let plan = 'Free';
  let isCPP = false;
  let planCodes = [];
  try {
    const profile = await fetch('/api/fetchProfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ method: 'profile' }),
    });
    const profileData = await profile.json();
    plan = profileData.plan;
    planCodes = profileData.plan_codes;
    isCPP = profileData.is_cpp;
  } catch (e) {}
  return new Promise((resolve, reject) => {
    // Load the original image
    const imageObj = new Image();
    imageObj.crossOrigin = 'Anonymous';
    imageObj.onload = () => {
      // Append a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      // Create a new Konva.Stage to handle the image
      const imageStage = new Konva.Stage({
        container: tempContainer,
        width: imageObj.width,
        height: imageObj.height,
      });
      const imageLayer = new Konva.Layer();
      imageStage.add(imageLayer);

      const konvaImage = new Konva.Image({
        image: imageObj,
        width: imageStage.width(),
        height: imageStage.height(),
      });
      imageLayer.add(konvaImage);

      // Load the watermark image
      const watermarkObj = new Image();
      watermarkObj.crossOrigin = 'anonymous';
      const watermarkScale = imageStage.width() / 1024;

      watermarkObj.onload = () => {
        if (!planCodes?.length && !isCPP) {
          const watermarkImage = new Konva.Image({
            image: watermarkObj,
            width: watermarkScale * 400, // Adjust watermark width
            height: watermarkScale * 150, // Adjust watermark height
            x: imageStage.width() - watermarkScale * 420, // Adjust position
            y: imageStage.height() - watermarkScale * 170, // Adjust position
          });

          imageLayer.add(watermarkImage);
        }

        imageLayer.draw();

        // Generate the final image with the watermark
        const finalUri = imageStage.toDataURL({
          mimeType: `image/${format}`,
          quality: 1.0,
        });

        // Cleanup
        imageStage.destroy();
        tempContainer.remove();

        // Resolve the Promise with the final URI
        resolve(finalUri);
      };

      watermarkObj.onerror = reject;
      watermarkObj.src = WATERMARK_IMAGE;
    };

    imageObj.onerror = reject;
    imageObj.src = uri;
  });
}
