/* eslint-disable */
import React, { memo, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaDownload } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import UploadFile from '../UploadFile';
import { uploadImage as uploadImageApi } from '@/api/upload';
import {
  filterValidImage,
  genId,
  ImageData,
  GenerationStatus,
  deleteMediaData,
  mergeMediaData,
  dispatchGenerated,
  preloadImage,
} from './utils';
import { ResultCard } from './ResultCard';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CardBody,
  Link,
  Image as NextUIImage,
  AccordionItem,
  Accordion,
  Chip,
  Switch,
  Select,
  SelectItem,
  Tooltip,
} from '@nextui-org/react';
import FAQ from '@/components/FAQ';
import { BiSolidZap } from 'react-icons/bi';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import {
  BACKGROUND_REMOVAL,
  calculateLineArtColorizeCost,
  ToolsModel,
  ToolsModelType,
} from '../../../api/tools/_zaps';
import { proxyImageUrl, toastError, toastWarn } from '@/utils/index';
import { BsInfoCircleFill } from 'react-icons/bs';
import { MdOutlineAnimation } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { getCreateYoursData } from '../../utilities/tools';
import { useRouter } from 'next/router';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';

type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any; // 允许其他可选参数
};
interface ImagesResponse {
  data: ImageData[];
}

type LayerResult = { blob: Blob; filename: string };

async function imageBitmapFromFile(file: File) {
  const arrayBuf = await file.arrayBuffer();
  const blob = new Blob([arrayBuf], { type: file.type || 'image/png' });
  return await createImageBitmap(blob);
}

function getImageDataFromBitmap(bmp: ImageBitmap) {
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);
  return ctx.getImageData(0, 0, bmp.width, bmp.height);
}

function splitByAlphaCC(
  img: globalThis.ImageData,
  alphaThreshold = 0,
): {
  labels: Int32Array; // 0=背景，其余是组件编号
  count: number; // 组件数量（不含背景）
} {
  const { width: w, height: h, data } = img;
  const labels = new Int32Array(w * h); // 默认为0
  let comp = 0;
  const queueX = new Int32Array(w * h);
  const queueY = new Int32Array(w * h);

  const getA = (idx: number) => data[idx * 4 + 3];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (labels[idx] !== 0) continue;
      if (getA(idx) <= alphaThreshold) continue;

      // BFS flood fill
      comp++;
      let qh = 0,
        qt = 0;
      queueX[qt] = x;
      queueY[qt] = y;
      qt++;
      labels[idx] = comp;

      while (qh < qt) {
        const cx = queueX[qh],
          cy = queueY[qh];
        qh++;
        const base = cy * w + cx;

        // 8邻域
        // 为了速度，这里手写邻域，比 neighbors8() 少了函数开销
        for (let ny = cy - 1; ny <= cy + 1; ny++) {
          for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx === cx && ny === cy) continue;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const nidx = ny * w + nx;
            if (labels[nidx] !== 0) continue;
            if (getA(nidx) <= alphaThreshold) continue;
            labels[nidx] = comp;
            queueX[qt] = nx;
            queueY[qt] = ny;
            qt++;
          }
        }
      }
    }
  }
  return { labels, count: comp };
}

// 新增：将 layers 打包成 zip 文件
async function exportLayersAsZip(
  img: globalThis.ImageData,
  labels: Int32Array,
  count: number,
  minArea = 50,
): Promise<Blob> {
  const { width: w, height: h, data } = img;

  // 预计算每个组件的 bbox 和面积
  const minX = new Int32Array(count + 1).fill(w);
  const minY = new Int32Array(count + 1).fill(h);
  const maxX = new Int32Array(count + 1).fill(-1);
  const maxY = new Int32Array(count + 1).fill(-1);
  const area = new Int32Array(count + 1);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const lab = labels[idx];
      if (lab === 0) continue;
      area[lab]++;
      if (x < minX[lab]) minX[lab] = x;
      if (x > maxX[lab]) maxX[lab] = x;
      if (y < minY[lab]) minY[lab] = y;
      if (y > maxY[lab]) maxY[lab] = y;
    }
  }

  const { default: JSZip } = await import('jszip');

  const zip = new JSZip();

  for (let lab = 1; lab <= count; lab++) {
    if (area[lab] < minArea) continue;
    const x0 = minX[lab],
      y0 = minY[lab];
    const x1 = maxX[lab],
      y1 = maxY[lab];
    const cw = x1 - x0 + 1,
      ch = y1 - y0 + 1;

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const sub = ctx.createImageData(cw, ch);

    // 拷贝该组件像素，其余透明
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const si = yy * w + xx;
        if (labels[si] !== lab) continue;
        const di = (yy - y0) * cw + (xx - x0);
        sub.data[di * 4 + 0] = data[si * 4 + 0];
        sub.data[di * 4 + 1] = data[si * 4 + 1];
        sub.data[di * 4 + 2] = data[si * 4 + 2];
        sub.data[di * 4 + 3] = data[si * 4 + 3];
      }
    }
    ctx.putImageData(sub, 0, 0);

    // 将 canvas 转换为 blob 并添加到 zip
    const blob = await new Promise<Blob>(res =>
      canvas.toBlob(b => res(b!), 'image/png'),
    );

    const filename = `layer_${lab.toString().padStart(2, '0')}.png`;
    zip.file(filename, blob);
  }

  // 生成 zip 文件
  return await zip.generateAsync({ type: 'blob' });
}

const removeBackground = async (url: string) => {
  const response = await fetch('/api/tools/background-removal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: url, reverse: false }),
  });
  if (!response.ok) {
    return '';
  }
  const data = await response.json();
  if (data.error) {
    return '';
  }
  if (data.output) {
    return data.output;
  }
  return '';
};

const getId = genId();
// 调用视频生成API
const imagesAPI = async (params: ImageApiParams): Promise<ImagesResponse> => {
  const response = await fetch('/api/tools/image-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// 1. 检查并调整图片尺寸 1024*1024 和 格式
const processImage = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 1024;
      let width = img.width;
      let height = img.height;

      // 计算缩放比例
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // 创建 canvas 进行缩放
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // 转换为 base64
      resolve(canvas.toDataURL('image/jpeg', 1));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// 3. 调用 inbetween API
const LayerSplitterAPI = async (
  image: string,
  prompt: string,
  referenceImage?: string,
  white_bg = false,
  model: ToolsModelType = ToolsModel.BASIC,
): Promise<{ output: string; error?: string; error_code?: number }> => {
  const params: { [key: string]: any } = {
    user_prompt: prompt || '',
    sketch_b64: image,
    negative_prompt: '',
    // ipadapter_b64: referenceImage,
    white_bg,
    model,
  };

  if (referenceImage) {
    params.ipadapter_b64 = referenceImage;
  }

  const response = await fetch('/api/tools/layer-splitter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  // if(data.error &&data.error === 'no zaps') {
  //   toast.error(data.error);
  //   throw new Error('no zaps');
  // }else if(data.error){
  //   throw new Error(data.error);
  // }
  if (data.error) {
    return { error: data.error, error_code: data.error_code, output: '' };
  }
  if (data) {
    return data;
  }
  return { error: 'No output from LayerSplitter API', output: '' };
};

const faqs = [
  {
    id: 1,
    question: 'What is AI layer splitting?',
    answer:
      "AI layer splitting is a process that uses artificial intelligence to automatically separate an image into individual component layers. Komiko's AI layer splitter tool analyzes your artwork and identifies different elements like characters, backgrounds, and objects, creating separate layers that can be edited independently.",
  },
  {
    id: 2,
    question: 'How to split images into layers with AI?',
    answer: (
      <div>
        <p>You can split your images with Komiko AI in two easy steps:</p>
        <ul className='pl-5 mt-2 list-decimal'>
          <li>Upload your image to the AI layer splitter</li>
          <li>Click the 'Split Image' button to start the splitting process</li>
        </ul>
      </div>
    ),
  },
  {
    id: 0,
    question: 'Can I use AI to separate elements in my images?',
    answer:
      "Yes, you can use AI to separate elements in your images. Komiko's AI layer splitter tool can analyze your images and identify different components, creating individual layers for each element. This makes it easy to edit specific parts of your image without affecting the whole composition.",
  },
  {
    id: 3,
    question: 'How does AI layer splitting work?',
    answer:
      'AI layer splitting uses advanced deep learning models trained on millions of images to recognize different elements within an image. The AI analyzes patterns, edges, colors, and context to determine which pixels belong to which objects, then creates separate layers for each identified component.',
  },
  {
    id: 4,
    question: 'What are the benefits of AI layer splitting?',
    answer: (
      <div>
        There are various benefits of splitting images with AI:
        <li>Saves time compared to manual masking and selection.</li>
        <li>
          Produces clean, high-quality layers with precise edge detection.
        </li>
        <li>Enables easy editing of individual components.</li>
        <li>Perfect for creating game assets and animation elements.</li>
      </div>
    ),
  },
  {
    id: 5,
    question: 'Can I use AI split layers for commercial purposes?',
    answer:
      "Yes, you can use AI-generated split layers for personal and commercial purposes. This makes it ideal for game development, design projects, and professional artwork. However, ensure you comply with Komiko's terms of service.",
  },
  {
    id: 6,
    question: 'What formats and sizes are supported?',
    answer:
      "The AI supports images in JPG and PNG formats. Output layers will maintain the original image's resolution for maximum quality.",
  },
  {
    id: 7,
    question: 'Is the AI layer splitter free to use?',
    answer:
      'Komiko offers free zaps (credits) for you to try out the tool. You can also purchase paid plans for more zaps if you need more usage, as well as advanced features like faster processing and higher resolutions.',
  },
  {
    id: 8,
    question: 'Do I need to add any prompts for layer splitting?',
    answer:
      "Unlike some AI tools, our layer splitter doesn't require detailed prompts. The AI is trained to intelligently identify and separate image components automatically. Just upload your image and let the AI do the work.",
  },
  {
    id: 9,
    question: 'What are the limitations of AI layer splitting?',
    answer: (
      <div>
        While AI layer splitting is a powerful tool, it has some limitations:
        <li>
          Complex Scenes: Very busy or complex images might result in some
          elements being grouped together.
        </li>
        <li>
          Transparency: Some fine details like hair or fur might be challenging
          to separate perfectly.
        </li>
        <li>
          Overlapping Objects: Elements that significantly overlap may be
          difficult to completely separate.
        </li>
        Despite these limitations, AI layer splitting can significantly speed up
        workflows for artists, designers, and developers.
      </div>
    ),
  },
  {
    id: 10,
    question: 'Do I need design skills to use AI layer splitting?',
    answer: (
      <div>
        No, you don't need advanced design skills to use AI layer splitting.
        <li>
          For Designers: If you're a professional, this tool can dramatically
          speed up your workflow.
        </li>
        <li>
          For Beginners: You can easily separate image elements without needing
          to master complex selection techniques.
        </li>
        This tool is designed to be user-friendly for everyone, whether you're
        an experienced designer or just starting out.
      </div>
    ),
  },
  {
    id: 11,
    question: 'What types of images work best with AI layer splitting?',
    answer: (
      <div>
        The AI layer splitter works well with various types of images:
        <li>Game assets and character designs</li>
        <li>Illustrations and artwork</li>
        <li>Photos with distinct foreground and background elements</li>
        <li>Product images</li>
        <li>Cartoon and anime style images</li>
        <li>Digital artwork with clear components</li>
        For best results, use images with good contrast between different
        elements.
      </div>
    ),
  },
  {
    id: 12,
    question: 'How can I get the best results from AI layer splitting?',
    answer: (
      <div>
        Follow these tips for optimal layer separation:
        <li>Use images with good contrast between elements</li>
        <li>Ensure your image has sufficient resolution</li>
        <li>Images with clear boundaries between elements work best</li>
        <li>Avoid extremely cluttered or complex scenes when possible</li>
        <li>Use PNG format for best quality results</li>
      </div>
    ),
  },
  {
    id: 13,
    question: 'How does AI layer splitting compare to manual separation?',
    answer:
      "AI layer splitting offers significant time savings compared to manual masking and selection, reducing hours of work to minutes. While it may not fully replace professional techniques for the most complex projects, it's an excellent tool for rapid asset creation, game development, and design workflows. The AI understands object boundaries and can create clean separations that would take considerable time and skill to achieve manually.",
  },
  {
    id: 14,
    question: 'Can I edit the AI-split layers?',
    answer:
      'Yes, you can further edit and refine the AI-generated layers using your preferred design software. The AI-generated layers serve as an excellent starting point that you can enhance with additional details or corrections as needed.',
  },
  {
    id: 15,
    question: 'What are some creative ways to use AI layer splitting?',
    answer: (
      <div>
        AI layer splitting can be used for:
        <li>
          Game development - creating separate character sprites and backgrounds
        </li>
        <li>Animation - preparing elements for motion graphics</li>
        <li>Graphic design - isolating components for creative composition</li>
        <li>Photo editing - separating subjects from backgrounds</li>
        <li>UI/UX design - creating layered interface elements</li>
        <li>Digital art - preparing artwork for dynamic effects</li>
      </div>
    ),
  },
  {
    id: 16,
    question: 'How accurate is the AI layer splitting technology?',
    answer:
      "Komiko's AI layer splitter uses state-of-the-art computer vision technology to accurately identify and separate image components. The technology is particularly effective with images that have distinct elements and good contrast. While no AI system is perfect, our technology delivers professional-quality results for most common use cases, saving significant time compared to manual processes.",
  },
  {
    id: 17,
    question: 'Can I use AI layer splitting for animation projects?',
    answer: (
      <div>
        Yes, AI layer splitting is perfect for animation projects:
        <li>
          Easily separate characters from backgrounds for independent animation
        </li>
        <li>Create movable parts like limbs, facial features, or objects</li>
        <li>
          Prepare existing artwork for animation without starting from scratch
        </li>
        <li>Generate layered files ready for import into animation software</li>
        This capability is especially valuable for animators looking to bring
        static artwork to life or to streamline their production pipeline.
      </div>
    ),
  },
];

const urlToBase64 = async (url: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(url);
    const blob = await response.blob();

    // Create a FileReader to convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        // const base64 = base64String.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

export default function LayerSplitterPage({ isMobile }: any) {
  const { t } = useTranslation('layer-splitter');
  const router = useRouter();
  // State management
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ToolsModelType>(
    ToolsModel.BASIC,
  );
  const [cost, setCost] = useState(
    calculateLineArtColorizeCost(false, ToolsModel.BASIC),
  );

  const [loading, setLoading] = useState(false);

  const [inputImage, setInputImage] = useState<string>('');
  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const { submit: openModal } = useOpenModal();
  const [isPublic, setIsPublic] = useState(() => {
    return profile.plan === 'Free';
  });

  // video results list
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: '/images/examples/layer-splitter/s1.png',
      prompt: t('common:exampleResult'),
    },
  ]);
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  // Add new state for reference image
  const [referenceImage, setReferenceImage] = useState<string>('');

  const [whiteBg, setWhiteBg] = useState(false);

  // Update cost calculation based on model
  useEffect(() => {
    setCost(calculateLineArtColorizeCost(whiteBg, selectedModel));
  }, [selectedModel, whiteBg]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;
      if (!generation) return;

      // get model
      const model = generation.model;
      if (model === 'Advanced') {
        setSelectedModel(ToolsModel.ADVANCED);
      } else {
        setSelectedModel(ToolsModel.BASIC);
      }

      // clear query
      router.replace({
        pathname: router.pathname,
        query: {},
      });
    }
  }, [router.isReady, router.query.generationId]);
  // const taskPipeRef = useRef<EventSource | null>(null);

  // const updateImages = async (event: { data: string }) => {
  //   try {
  //     const data = JSON.parse(event.data);
  //     if (data.type !== 'progress') {
  //       return;
  //     }
  //     if (data.data.max !== data.data.value) {
  //       return;
  //     }
  //     const id = data.data.prompt_id;
  //     const filename = await getHistoryImage(id, TaskType.LINE_ART_COLORIZE);
  //     // imagesAPI({ method: "generateImage", tool: "colorize-line-art", url_path: proxyImageUrl(filename), prompt, id: null });
  //     const imageUrl = proxyImageUrl(filename);

  //     setResultImages((resultImages) => {
  //       const index = resultImages.findIndex(d => d.id === id);
  //       if (index < 0) {
  //         return resultImages;
  //       }
  //       resultImages[index] = {
  //         ...resultImages[index],
  //         url_path: imageUrl,
  //       };
  //       return [...resultImages];
  //     });
  //   } catch (error) {
  //     console.error('Error parsing event data:', error);
  //   }
  // };

  // 从 Supabase 加载 视频
  const fetchImages = async (needMerge?: boolean) => {
    try {
      const response = await imagesAPI({
        method: 'getImages',
        tool: 'layer-splitter',
      });
      if (response.data) {
        const subs = await filterValidImage(response.data);
        if (!subs.length) {
          return;
        }
        if (!needMerge) {
          setResultImages(subs);
          return;
        }
        setResultImages(resultImages => {
          const oldData = mergeMediaData(
            resultImages.filter(d => d.id !== -1),
            subs,
            'url_path',
          ) as ImageData[];
          return [...oldData];
        });
      }
    } catch (error: any) {
      console.error('fetchImages failed', error);
      if (error.message.indexOf('401')) {
        return;
      }
      toast.error('Fetch images failed', {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };
  /* ******************************  初始更新状态    *****************************  */
  // 初始加载数据
  useEffect(() => {
    fetchImages();
  }, []);

  // useEffect(() => {
  //   if(resultImages.length <= 0) {
  //     return;
  //   }
  //   resultImages.some(resultImage => {
  //     if (resultImage.status !== GenerationStatus.GENERATING || !resultImage.url_path) {
  //       return false;
  //     }
  //     preloadImage(resultImage.url_path)
  //       .then(() => dispatchGenerated(resultImage.id))
  //       .then(() => {
  //         return imagesAPI({ method: "generateImage", tool: "colorize-line-art", url_path: resultImage.url_path, prompt: resultImage.prompt, id: null });
  //       })
  //       .then((response) => {
  //         if (!response.data || response.data.length <= 0) {
  //           return;
  //         }
  //         const id = response.data[0].id;
  //         setResultImages(resultImages => {
  //           const index = resultImages.findIndex(d => d.id === resultImage.id);
  //           if (index < 0) {
  //             return resultImages;
  //           }
  //           resultImages[index] = {
  //             ...resultImages[index],
  //             id,
  //             status: GenerationStatus.DONE,
  //           };
  //           return [...resultImages];
  //         });
  //       })

  // }, [resultImages])

  /* ******************************  点击删除视频相关    *****************************  */
  // 点击删除按钮时保存视频 ID
  const handleDeleteClick = (imageId: number) => {
    if (typeof imageId === 'number' && imageId < 0) {
      setResultImages(resultImages =>
        resultImages.filter(d => d.id !== imageId),
      );
      return;
    }
    setImageToDelete(imageId);
    setDeleteModalOpen(true);
  };

  // 确认删除时使用保存的 ID
  const handleConfirmDelete = async () => {
    setDeleteModalOpen(false);
    if (imageToDelete) {
      try {
        const response = await imagesAPI({
          method: 'deleteImage',
          tool: 'layer-splitter',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteImage success');
          deleteMediaData(setResultImages, imageToDelete);
          toast.success('Delete success', {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteImage failed');
          toast.error('Delete failed', {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setImageToDelete(null); // 清除保存的 ID
      } catch (error) {
        console.error('deleteImage failed', error);
        toast.error('Delete failed', {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    }
  };

  /* ******************************  下载短视频   *****************************  */
  // 下载图片按键
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `image-${Date.now()}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // 释放 URL 对象
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed', {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  /* ******************************   图片上传生成视频相关    *****************************  */

  const handleChange = async (url: string) => {
    const base64 = await urlToBase64(url);
    setInputImage(base64);
  };

  // Add reference image change handler
  const handleReferenceChange = async (url: string) => {
    if (!url) {
      setReferenceImage('');
      return;
    }
    const base64 = await urlToBase64(url);
    setReferenceImage(base64);
  };

  const refreshList = async (id: number, resultUrl: string) => {
    await dispatchGenerated(id);
    await preloadImage(resultUrl);
    setResultImages(resultImages => {
      const index = resultImages.findIndex(d => d.id === id);
      if (index < 0) {
        return resultImages;
      }
      resultImages[index] = {
        ...resultImages[index],
        url_path: resultUrl,
        status: GenerationStatus.DONE,
      };
      return [...resultImages];
    });
  };

  const removeGeneration = (id: number) => {
    setResultImages(resultImages => {
      const index = resultImages.findIndex(d => d.id === id);
      if (index < 0) {
        return resultImages;
      }
      const newResultImages = [...resultImages];
      newResultImages.splice(index, 1);
      return newResultImages;
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    // TODO: Handle image submission and get result
    console.log('Processing images...');
    if (profile.credit < cost) {
      // toast.error('Please purchase more zaps', {
      //     position: "top-center",
      //     style: {
      //         background: '#555',
      //         color: '#fff',
      //     }
      // });
      openModal('pricing');
      return;
    }

    const id = getId();
    setResultImages([
      {
        id,
        url_path: '',
        prompt,
        status: GenerationStatus.GENERATING,
      },
      ...resultImages.filter(d => d.id !== -1),
    ]);

    const processedReference = referenceImage
      ? await processImage(referenceImage)
      : undefined;
    const processedSketch = await processImage(inputImage);
    try {
      // setLoading(true);
      const result = await LayerSplitterAPI(
        processedSketch,
        '',
        undefined, // Add reference image URL to API call
        false,
        selectedModel,
      );
      // setLoading(false);
      // initTaskPipe()

      if (result.error) {
        if (result.error === 'no zaps') {
          // toastError(t('toast:common.noZaps'))
          openModal('pricing');
        } else if (result.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          toastWarn(t('toast:common.rateLimitExceeded'));
        } else {
          toast.error(result.error, {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        removeGeneration(id);
        return;
      }

      setProfile(profile => {
        return {
          ...profile,
          credit: profile.credit - cost,
        };
      });
      // 3. 调用 API 处理两张图片

      const returnUrl = !result.output?.includes('http')
        ? proxyImageUrl(result.output)
        : result.output;
      await refreshList(id, returnUrl);
      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'layer-splitter',
        url_path: returnUrl,
        prompt,
        id: null,
        model: selectedModel === ToolsModel.ADVANCED ? 'Advanced' : 'Basic',
      });
      if (response.data && response.data.length > 0) {
        setResultImages(resultImages => {
          const index = resultImages.findIndex(d => d.id === id);
          if (index < 0) {
            return resultImages;
          }
          resultImages[index] = {
            ...resultImages[index],
            id: response.data[0].id,
            status: GenerationStatus.DONE,
          };
          return [...resultImages];
        });
        toast.success('split image success', {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.error('split image failed', {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('split image failed:', error);
      removeGeneration(id);
      if ((error as any).message === 'no zaps') {
        // toast.error('no zaps', {
        //     position: "top-center",
        //     style: {
        //         background: '#555',
        //         color: '#fff',
        //     }
        // });
        openModal('pricing');
        return;
      }
      toast.error('split image failed', {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  async function splitImage(
    fileUrl: string,
    opts?: { alphaThreshold?: number; minArea?: number },
  ) {
    setIsDownloading(true);
    try {
      const backgroundUrl = await removeBackground(fileUrl);
      if (!backgroundUrl) {
        setIsDownloading(false);
        toastError(t('toast:error.downloadLayersFailed'));
        return;
      }

      setProfile(profile => {
        return {
          ...profile,
          credit: profile.credit - BACKGROUND_REMOVAL,
        };
      });

      const fileBlob = await fetch(backgroundUrl).then(res => res.blob());
      const file = new File([fileBlob], 'image.png', { type: 'image/png' });
      const bmp = await imageBitmapFromFile(file);
      const img = getImageDataFromBitmap(bmp);
      const { labels, count } = splitByAlphaCC(img, opts?.alphaThreshold ?? 0);

      // 使用新的打包函数
      const zipBlob = await exportLayersAsZip(
        img,
        labels,
        count,
        opts?.minArea ?? 50,
      );

      // 下载 zip 文件
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `layers_${Date.now()}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('split image failed:', error);
      toastError(t('toast:error.downloadLayersFailed'));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className='overflow-y-auto items-stretch pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-2xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-4xl lg:text-5xl'>
            {t('hero.title')}
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
            {t('hero.description')}
          </p>
        </div>

        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Left input area */}
          <div className='flex flex-col col-span-12 h-full md:col-span-6 lg:col-span-5'>
            <Card className='p-4 md:px-6 md:pt-4 md:pb-6 flex flex-col h-full md:transition-all duration-300 shadow-md md:shadow-2xl border-1.5 border-primary-200 bg-card rounded-xl'>
              <div className='flex overflow-y-auto flex-col flex-1'>
                <div className='flex justify-between items-center mb-3 md:mb-4'>
                  <h2 className='text-lg font-bold text-primary-800 dark:text-primary-400 md:text-2xl'>
                    {t('input.title')}
                  </h2>
                  <Tooltip content={t('input.upload.tooltip')} color='primary'>
                    <span>
                      <BsInfoCircleFill className='text-primary-500' />
                    </span>
                  </Tooltip>
                </div>

                {/* Upload image area */}
                <div className='flex flex-col flex-1'>
                  <label className='block mb-2 font-bold text-foreground text-sm md:text-base'>
                    {t('input.upload.label')}
                  </label>
                  <div className='flex-1 min-h-[300px] max-h-[450px]'>
                    <UploadFile
                      onChange={handleChange}
                      accept='.png,.jpg,.jpeg,.webp'
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </div>

                {/* Add Model selection */}
                <div className='mt-4 mb-4'>
                  <p className='block mb-1 font-bold text-foreground text-sm md:text-base'>
                    {t('line-art-colorization:input.model.label', {
                      defaultValue: 'Model',
                    })}
                  </p>
                  <div className='mb-2 text-xs text-muted-foreground md:text-sm'>
                    <Chip size='sm' color='primary' className='mr-0.5'>
                      {t('common.new', { defaultValue: 'New' })}
                    </Chip>{' '}
                    {t('input.model.description', {
                      defaultValue:
                        'Advanced model provides better quality but costs more zaps',
                    })}
                  </div>
                  <Select
                    placeholder={t(
                      'line-art-colorization:input.model.placeholder',
                      { defaultValue: 'Select model' },
                    )}
                    defaultSelectedKeys={[ToolsModel.BASIC + '']}
                    selectedKeys={[selectedModel + '']}
                    className='w-full'
                    onSelectionChange={keys => {
                      const selected = +Array.from(keys)[0] as ToolsModelType;
                      setSelectedModel(selected);
                    }}
                    aria-label={t(
                      'line-art-colorization:input.model.ariaLabel',
                      { defaultValue: 'Select model' },
                    )}
                    classNames={{
                      trigger:
                        'border-gray-300 hover:border-primary-500 transition-all duration-300',
                    }}>
                    <SelectItem key={ToolsModel.BASIC} value={ToolsModel.BASIC}>
                      {t('line-art-colorization:input.model.options.basic', {
                        defaultValue: 'Basic',
                      })}
                    </SelectItem>
                    <SelectItem
                      key={ToolsModel.ADVANCED}
                      value={ToolsModel.ADVANCED}>
                      {t('line-art-colorization:input.model.options.advanced', {
                        defaultValue: 'Advanced',
                      })}
                    </SelectItem>
                  </Select>
                </div>
              </div>

              {/* Submit button */}
              <div className='mt-2'>
                <Button
                  isLoading={loading}
                  color='primary'
                  className='w-full transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                  size='lg'
                  onClick={handleSubmit}
                  isDisabled={!inputImage}>
                  {t('buttons.split')}
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-white'>
                    -{cost}/{profile.credit}
                  </Chip>
                </Button>
              </div>
            </Card>
          </div>

          {/* Right output area */}
          <div className='flex flex-col col-span-12 h-full md:col-span-6 lg:col-span-7'>
            <Card className='p-4 md:pb-6 md:px-6 md:pt-4 flex flex-col h-full shadow-md shadow-gray-200 md:shadow-2xl border-1.5 border-primary-50 bg-card rounded-xl max-h-[750px]'>
              <h2 className='flex items-center mb-4 md:mb-6 text-lg font-bold text-primary-800 dark:text-primary-400 md:text-2xl'>
                <FaDownload className='mr-2 text-primary-600' />
                {t('output.title')}
              </h2>
              <div className='flex overflow-hidden flex-col flex-1 w-full'>
                <div className='overflow-y-auto flex-1 rounded-lg'>
                  {resultImages?.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6'>
                      {resultImages.map((img, index) => (
                        <ResultCard
                          showPrompt
                          key={img.id}
                          index={index}
                          type='image'
                          data={img}
                          handleDownload={handleDownload}
                          handleDelete={handleDeleteClick}
                          isExample={img.id === -1}
                          toolButtons={
                            <Tooltip
                              content={t('common:actions.download_layers')}
                              placement='top'>
                              <Button
                                isIconOnly
                                size='sm'
                                variant='light'
                                aria-label='Download'
                                color='primary'
                                isLoading={isDownloading}
                                className='hover:text-primary hover:bg-transparent'
                                onClick={() => splitImage(img.url_path)}>
                                <FaDownload />
                              </Button>
                            </Tooltip>
                          }
                          tool='layer-splitter'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                      <MdOutlineAnimation
                        size={48}
                        className='mb-4 text-primary-300'
                      />
                      <p className='text-center text-sm md:text-base'>
                        {t('output.empty.title')}
                      </p>
                      <p className='mt-2 text-xs text-center md:text-sm'>
                        {t('output.empty.subtitle')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Tutorial Section */}
        <div className='flex flex-col justify-center items-center mb-8'>
          <div className='col-span-12'>
            <h2 className='pt-10 md:pt-16 mt-12 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mt-16 md:text-3xl'>
              {t('tutorial.title')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('tutorial.description')}
            </p>

            <div className='grid grid-cols-1 gap-4 mt-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {[
                {
                  step: 1,
                  title: t('tutorial.steps.1.title'),
                  content: t('tutorial.steps.1.content'),
                },
                {
                  step: 2,
                  title: t('tutorial.steps.2.title'),
                  content: t('tutorial.steps.2.content'),
                },
              ].map(step => (
                <div
                  key={step.title}
                  className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-white bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                    {step.step}
                  </div>
                  <div className='flex-grow'>
                    <h3 className='mb-3 text-lg font-bold text-primary-800 dark:text-primary-400 md:text-xl'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='pt-12 text-center md:pt-16'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mb-6 md:text-3xl'>
                {t('examples.title')}
              </h2>
              <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('examples.description')}
              </p>
            </div>

            <div className='grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2'>
              {/* Example 1 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/layer-splitter/o1.png'
                        alt={t('examples.labels.original')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('examples.labels.original')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/layer-splitter/s1.png'
                        alt={t('examples.labels.split')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('examples.labels.split')}
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 dark:bg-primary-900/20'>
                  <p className='font-medium text-primary-800 dark:text-primary-400'>
                    {t('examples.captions.1')}
                  </p>
                </div>
              </div>

              {/* Example 2 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/layer-splitter/o2.png'
                        alt={t('examples.labels.original')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('examples.labels.original')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/layer-splitter/s2.png'
                        alt={t('examples.labels.split')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('examples.labels.split')}
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 dark:bg-primary-900/20'>
                  <p className='font-medium text-primary-800 dark:text-primary-400'>
                    {t('examples.captions.2')}
                  </p>
                </div>
              </div>
            </div>

            {/* Example with reference image */}
            <div className='mt-8'>
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-3 gap-4 p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <NextUIImage
                        src='/images/examples/layer-splitter/o3.jpg'
                        alt={t('examples.labels.original')}
                        className='object-contain w-full h-auto'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('examples.labels.original')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <NextUIImage
                        src='/images/examples/layer-splitter/s3.png'
                        alt={t('examples.labels.split')}
                        className='object-contain w-full h-auto'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('examples.labels.split')}
                    </p>
                  </div>
                </div>
                <div className='p-4 bg-primary-50 dark:bg-primary-900/20'>
                  <p className='font-medium text-primary-800 dark:text-primary-400'>
                    {t('examples.captions.3')}
                  </p>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className='py-10 md:py-16 mt-10 bg-gradient-to-b from-background dark:from-gray-900 rounded-xl to-primary-100 dark:to-gray-800'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                {t('features.title')}
              </h2>
              <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('features.description')}
              </p>
              <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                {[
                  {
                    title: t('features.items.precise.title'),
                    content: t('features.items.precise.content'),
                    icon: '🎨',
                  },
                  {
                    title: t('features.items.timeSaving.title'),
                    content: t('features.items.timeSaving.content'),
                    icon: '⏱️',
                  },
                  {
                    title: t('features.items.flexible.title'),
                    content: t('features.items.flexible.content'),
                    icon: '🖌️',
                  },
                  {
                    title: t('features.items.gameAssets.title'),
                    content: t('features.items.gameAssets.content'),
                    icon: '🎮',
                  },
                  {
                    title: t('features.items.animation.title'),
                    content: t('features.items.animation.content'),
                    icon: '📱',
                  },
                  {
                    title: t('features.items.quality.title'),
                    content: t('features.items.quality.content'),
                    icon: '✨',
                  },
                  {
                    title: t('features.items.workflow.title'),
                    content: t('features.items.workflow.content'),
                    icon: '💫',
                  },
                  {
                    title: t('features.items.background.title'),
                    content: t('features.items.background.content'),
                    icon: '🖼️',
                  },
                  {
                    title: t('features.items.creative.title'),
                    content: t('features.items.creative.content'),
                    icon: '🔄',
                  },
                ].map(feature => (
                  <div
                    key={feature.title}
                    className='p-6 bg-card rounded-xl border border-primary-100 border-border shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <div className='flex items-center mb-4'>
                      <span className='mr-3 text-xl md:text-2xl'>
                        {feature.icon}
                      </span>
                      <h3 className='text-lg font-semibold text-primary-800 dark:text-primary-400 md:text-xl'>
                        {feature.title}
                      </h3>
                    </div>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {feature.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className='my-12 md:my-16'>
              <MoreAITools category='animation' />
            </div>

            <h2 className='mt-12 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mt-16 md:text-3xl'>
              {t('faq.title')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('faq.description')}
            </p>

            <div className='flex justify-center items-center'>
              <div className='w-full md:w-[1000px]'>
                <FAQ
                  faqs={Object.entries(
                    t('faq.questions', { returnObjects: true }),
                  ).map(([key, value]: [string, any]) => ({
                    id: parseInt(key),
                    question: value.question,
                    answer: value.answer,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-sm',
          base: 'border border-primary-200',
        }}>
        <ModalContent>
          <ModalHeader className='text-primary-800 dark:text-primary-400'>
            {t('delete.title')}
          </ModalHeader>
          <ModalBody>
            <p>{t('delete.message')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              {t('delete.cancel')}
            </Button>
            <Button color='danger' onPress={handleConfirmDelete}>
              {t('delete.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
