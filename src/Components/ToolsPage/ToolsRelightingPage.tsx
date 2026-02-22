/* eslint-disable */
import React, { memo, useEffect, useRef, useState } from 'react';

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
} from '@nextui-org/react';
import FAQ from '@/components/FAQ';
import { BiSolidZap } from 'react-icons/bi';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import { RELIGHTING } from '../../../api/tools/_zaps';
import { getValidImageDimensions, toastError, toastWarn } from '@/utils/index';
import { useBtnText } from 'hooks/useBtnText';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { getCreateYoursData } from '../../utilities/tools';
import { useRouter } from 'next/router';

type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any; // 允许其他可选参数
};
interface ImagesResponse {
  data: ImageData[];
}

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

const getImageSize = (
  image: string,
): Promise<{ width: number; height: number }> => {
  const img = new Image();
  img.src = image;
  return new Promise((resolve, reject) => {
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
  });
};

const relightingAPI = async (
  image: string,
  prompt: string,
  backgroundImage: string,
): Promise<{ output: string; error?: string; error_code?: number }> => {
  const imageSize = await getImageSize(image);
  const validImageDimensions = getValidImageDimensions(
    imageSize.height,
    imageSize.width / imageSize.height,
  );

  const params: { [key: string]: any } = {
    prompt: prompt || '',
    subject_image: image,
    background_image: backgroundImage,
    width: validImageDimensions.width,
    height: validImageDimensions.height,
  };

  const response = await fetch('/api/tools/relighting', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    // throw new Error(`API request failed: ${response.status}`);
    return { error: 'API request failed', output: '' };
  }

  const data = await response.json();
  if (!data) {
    throw new Error('No output from relighting API');
  }
  return data;
};

export default function RelightingPage({ isMobile }: any) {
  const { t } = useTranslation(['image-relighting', 'toast']);
  const router = useRouter();
  // State management
  const [prompt, setPrompt] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const [inputImage, setInputImage] = useState<string>('');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const [isPublic, setIsPublic] = useState(true);
  // video results list
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: '/images/examples/image-relighting/output2.webp',
      prompt: t('common:exampleResult'),
    },
  ]);
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  // Add new state for reference image
  const [referenceImage, setReferenceImage] = useState<string>('');
  const { submit: openModal } = useOpenModal();

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
  //     const filename = await getHistoryImage(id, TaskType.RELIGHTING);
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
        tool: 'relighting',
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
            resultImages,
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
      toast.error(t('toast:error.fetchImages'), {
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
    isAuth && fetchImages();
  }, [isAuth]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // set prompt
        if (generation.prompt) {
          setPrompt(generation.prompt);
        }

        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

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
          tool: 'relighting',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteImage success');
          deleteMediaData(setResultImages, imageToDelete);
          toast.success(t('toast:success.delete'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteImage failed');
          toast.error(t('toast:error.delete'), {
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
        toast.error(t('toast:error.delete'), {
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
      toast.error(t('toast:error.download'), {
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

  const handleBackgroundChange = async (url: string) => {
    if (!url) {
      setBackgroundImage('');
      return;
    }
    const base64 = await urlToBase64(url);
    setBackgroundImage(base64);
  };
  // const initTaskPipe = async () => {
  //   console.log('initTaskPipe');
  //   // 如果已经有活跃连接，直接返回
  //   if (taskPipeRef.current && taskPipeRef.current.readyState === EventSource.OPEN) {
  //     return;
  //   }

  //   // 如果有旧连接，先关闭
  //   if (taskPipeRef.current) {
  //     taskPipeRef.current.close();
  //     taskPipeRef.current = null;
  //   }

  //   const taskPipe = createTaskPipe();

  //   taskPipe.addEventListener('message', updateImages);

  //   // 添加错误处理
  //   taskPipe.addEventListener('error', (error) => {
  //     console.error('TaskPipe error:', error);
  //     // 可以在这里添加重连逻辑或错误提示
  //     taskPipe.close();
  //   });

  //   taskPipeRef.current = taskPipe;
  // };

  // 添加清理函数
  // useEffect(() => {
  //   return () => {
  //     // 组件卸载时关闭连接
  //     if (taskPipeRef.current) {
  //       taskPipeRef.current.close();
  //       taskPipeRef.current = null;
  //     }
  //   };
  // }, []);

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
    if (profile.credit < RELIGHTING) {
      // toast.error(t('toast:error.insufficientZaps'), {
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

    const processedBackground = await processImage(backgroundImage);
    const processedSketch = await processImage(inputImage);
    try {
      // setLoading(true);
      const result = await relightingAPI(
        processedSketch,
        prompt,
        processedBackground,
      );

      if (result.error) {
        if (result.error === 'no zaps') {
          // toastError(t('toast:common.noZaps'))
          openModal('pricing');
          removeGeneration(id);
          return;
        } else if (result.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          toastWarn(t('toast:common.rateLimitExceeded'));
          removeGeneration(id);
          return;
        }
        toast.error(result.error, {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        removeGeneration(id);
        return;
      }

      setProfile(profile => {
        return {
          ...profile,
          credit: profile.credit - RELIGHTING,
        };
      });
      // 3. 调用 API 处理两张图片

      const returnUrl = result.output;
      await refreshList(id, returnUrl);
      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'relighting',
        url_path: returnUrl,
        prompt,
        id: null,
        model: 'Image Relighting',
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
        toast.success(t('toast:success.colorizeImage'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.error(t('toast:error.colorizeImage'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('create image failed:', error);
      removeGeneration(id);
      if ((error as any).message === 'no zaps') {
        // toast.error(t('toast:error.noZaps'), {
        //     position: "top-center",
        //     style: {
        //         background: '#555',
        //         color: '#fff',
        //     }
        // });
        openModal('pricing');
        return;
      }
      toast.error(t('toast:error.createImage'), {
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

  const faqs = [
    {
      id: 1,
      question: t('faq.question1'),
      answer: t('faq.answer1'),
    },
    {
      id: 2,
      question: t('faq.question2'),
      answer: (
        <div>
          <p>{t('faq.answer2.intro')}</p>
          <ul className='pl-5 mt-2 list-decimal'>
            <li>{t('faq.answer2.step1')}</li>
            <li>{t('faq.answer2.step2')}</li>
            <li>{t('faq.answer2.step3')}</li>
            <li>{t('faq.answer2.step4')}</li>
            <li>{t('faq.answer2.step5')}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 0,
      question: t('faq.question3'),
      answer: t('faq.answer3'),
    },
    {
      id: 3,
      question: t('faq.question4'),
      answer: (
        <div>
          There are numerous benefits to using AI for relighting in anime and
          comics:
          <li>
            <b>{t('faq.answer4.benefit1')}</b>
          </li>
          <li>
            <b>{t('faq.answer4.benefit2')}</b>
          </li>
          <li>
            <b>{t('faq.answer4.benefit3')}</b>
          </li>
          <li>
            <b>{t('faq.answer4.benefit4')}</b>
          </li>
        </div>
      ),
    },
    {
      id: 4,
      question: t('faq.question5'),
      answer: (
        <div>
          AI Relighting works well with a variety of images, but the best
          results are typically achieved with:
          <li>
            <b>{t('faq.answer5.benefit1')}</b>
          </li>
          <li>
            <b>{t('faq.answer5.benefit2')}</b>
          </li>
          <li>
            <b>{t('faq.answer5.benefit3')}</b>
          </li>
          <li>
            <b>{t('faq.answer5.benefit4')}</b>
          </li>
        </div>
      ),
    },
    {
      id: 5,
      question: t('faq.question6'),
      answer: t('faq.answer6'),
    },
    {
      id: 6,
      question: t('faq.question7'),
      answer: t('faq.answer7'),
    },
    {
      id: 7,
      question: t('faq.question8'),
      answer: t('faq.answer8'),
    },
    {
      id: 8,
      question: t('faq.question9'),
      answer: t('faq.answer9'),
    },
    {
      id: 9,
      question: t('faq.question10'),
      answer: (
        <div>
          While AI Image Relighting is a powerful tool, it has some limitations:
          <li>
            <b>{t('faq.answer10.limitation1')}</b>
          </li>
          <li>
            <b>{t('faq.answer10.limitation2')}</b>
          </li>
          <li>
            <b>{t('faq.answer10.limitation3')}</b>
          </li>
          Despite these limitations, AI relighting can significantly enhance
          your artwork and speed up your creative process.
        </div>
      ),
    },
    {
      id: 10,
      question: t('faq.question11'),
      answer: t('faq.answer11'),
    },
    {
      id: 11,
      question: t('faq.question12'),
      answer: (
        <div>
          To maintain consistency across multiple panels, follow these tips:
          <li>
            <b>{t('faq.answer12.tip1')}</b>
          </li>
          <li>
            <b>{t('faq.answer12.tip2')}</b>
          </li>
          <li>
            <b>{t('faq.answer12.tip3')}</b>
          </li>
          <li>
            <b>{t('faq.answer12.tip4')}</b>
          </li>
        </div>
      ),
    },
    {
      id: 12,
      question: t('faq.question13'),
      answer: t('faq.answer13'),
    },
    {
      id: 13,
      question: t('faq.question14'),
      answer: t('faq.answer14'),
    },
    {
      id: 14,
      question: t('faq.question15'),
      answer: t('faq.answer15'),
    },
    {
      id: 15,
      question: t('faq.question16'),
      answer: t('faq.answer16'),
    },
    {
      id: 16,
      question: t('faq.question17'),
      answer: t('faq.answer17'),
    },
    {
      id: 17,
      question: t('faq.question18'),
      answer: t('faq.answer18'),
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

  return (
    // Add min-h-screen to ensure minimum screen height, overflow-y-auto to allow vertical scrolling
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-2xl font-bold text-center text-heading md:text-4xl lg:text-5xl'>
            {t('title')}
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
            {t('description')}
          </p>
        </div>

        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Left input area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-5'>
            <Card className='bg-card p-4 md:px-6 md:pt-4 md:pb-6'>
              <div className='flex justify-between items-center mb-4 md:mb-6'>
                <h2 className='text-lg font-bold text-primary-600 md:text-2xl'>
                  {t('inputSection.title')}
                </h2>
              </div>

              <div className='mb-6'>
                <p className='mb-2 font-bold text-foreground text-sm'>
                  {t('inputSection.subjectImage.title')}
                </p>
                <p className='mb-2 text-xs text-muted-foreground md:text-sm'>
                  {t('inputSection.subjectImage.description')}
                </p>
                <UploadFile onChange={handleChange}></UploadFile>
              </div>

              {/* Add reference image upload section */}
              <div className='mb-6'>
                <p className='mb-2 font-bold text-foreground text-sm'>
                  {t('inputSection.backgroundImage.title')}
                </p>
                <p className='mb-2 text-xs text-muted-foreground md:text-sm'>
                  {t('inputSection.backgroundImage.description')}
                </p>
                <UploadFile onChange={handleBackgroundChange}></UploadFile>
              </div>

              {/* Prompt input */}
              <div className='mb-6'>
                <p className='mb-2 font-bold text-foreground text-sm'>
                  {t('inputSection.prompt.title')}
                </p>
                <p className='mb-2 text-xs text-muted-foreground md:text-sm'>
                  {t('inputSection.prompt.description')}
                </p>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={t('inputSection.prompt.placeholder')}
                  className='p-3 w-full rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary'
                  rows={2}
                />
              </div>

              <div className='mb-2'>
                <PublicVisibilityToggle
                  isPublic={isPublic}
                  onToggle={setIsPublic}
                  label={t('common:publicVisibility.label')}
                  tooltip={t('common:publicVisibility.tooltip')}
                  variant='section'
                />
              </div>

              {/* Submit button */}
              <Button
                isLoading={loading}
                color='primary'
                className='w-full mt-2'
                size='lg'
                onClick={handleSubmit}
                isDisabled={!inputImage || !backgroundImage}>
                {t('relight_image')}
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-card'>
                    -{RELIGHTING}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='bg-card p-4 md:pb-6 md:px-6 md:pt-4 h-full'>
              <h2 className='mb-4 md:mb-6 text-lg font-bold text-primary-600 md:text-2xl'>
                {t('outputSection.title')}
              </h2>
              <div className='w-full max-h-[calc(856.5px-7rem)] flex flex-col'>
                <div className='overflow-y-auto flex-1'>
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
                          tool='relighting'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground text-sm'>
                      {t('outputSection.emptyState')}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* SEO Section */}
        <div className='flex flex-col justify-center items-center mb-8'>
          <div className='col-span-12'>
            <h2 className='pt-10 md:pt-16 mt-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('seoSection.whatIs.title')}
            </h2>
            <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm'>
              {t('seoSection.whatIs.description')}
            </p>

            <h2 className='mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('seoSection.howTo.title')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm'>
              {t('seoSection.howTo.description')}
            </p>

            <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
              {[
                {
                  step: 1,
                  title: t('seoSection.steps.step1.title'),
                  content: t('seoSection.steps.step1.content'),
                },
                {
                  step: 2,
                  title: t('seoSection.steps.step2.title'),
                  content: t('seoSection.steps.step2.content'),
                },
                {
                  step: 3,
                  title: t('seoSection.steps.step3.title'),
                  content: t('seoSection.steps.step3.content'),
                },
                {
                  step: 4,
                  title: t('seoSection.steps.step4.title'),
                  content: t('seoSection.steps.step4.content'),
                },
              ].map((step: any) => (
                <div
                  key={step.title}
                  className='flex flex-col p-4 md:p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <div className='flex justify-center items-center mb-3 md:mb-4 w-10 h-10 md:w-14 md:h-14 text-lg font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                    {step.step}
                  </div>
                  <div className='flex-grow text-center md:text-left'>
                    <h3 className='mb-2 md:mb-3 text-base font-bold text-primary-600 md:text-xl'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className='py-8 md:py-16 mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('seoSection.examples.title')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm'>
              {t('seoSection.examples.description')}
            </p>

            <div className='flex justify-center mb-4 px-4'>
              <div className='grid grid-cols-1 gap-6 justify-center items-center max-w-[1000px] md:grid-cols-3 md:gap-10'>
                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/foreground2.avif'
                      alt={t('seoSection.examples.example1.subjectAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example1.subjectCaption')}
                  </p>
                </div>

                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/background2.webp'
                      alt={t('seoSection.examples.example1.backgroundAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example1.backgroundCaption')}
                  </p>
                </div>

                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/output2.webp'
                      alt={t('seoSection.examples.example1.outputAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example1.outputCaption')}
                  </p>
                </div>
              </div>
            </div>

            <div className='flex justify-center mb-4 px-4'>
              <div className='grid grid-cols-1 gap-6 justify-center items-center max-w-[1000px] md:grid-cols-3 md:gap-10'>
                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/foreground3.webp'
                      alt={t('seoSection.examples.example2.subjectAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example2.subjectCaption')}
                  </p>
                </div>

                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/background3.jpg'
                      alt={t('seoSection.examples.example2.backgroundAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example2.backgroundCaption')}
                  </p>
                </div>

                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/output3.webp'
                      alt={t('seoSection.examples.example2.outputAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example2.outputCaption')}
                  </p>
                </div>
              </div>
            </div>

            <div className='flex justify-center mb-4 px-4'>
              <div className='grid grid-cols-1 gap-6 justify-center items-center max-w-[1000px] md:grid-cols-3 md:gap-10'>
                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/foreground4.jpg'
                      alt={t('seoSection.examples.example3.subjectAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example3.subjectCaption')}
                  </p>
                </div>

                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/background3.jpg'
                      alt={t('seoSection.examples.example3.backgroundAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example3.backgroundCaption')}
                  </p>
                </div>

                <div className='flex flex-col items-center max-w-full'>
                  <div className='w-full aspect-square mb-2'>
                    <NextUIImage
                      src='/images/examples/image-relighting/output4.webp'
                      alt={t('seoSection.examples.example3.outputAlt')}
                      className='object-cover w-full h-full rounded-lg'
                    />
                  </div>
                  <p className='mt-2 text-center text-muted-foreground text-xs md:text-sm'>
                    {t('seoSection.examples.example3.outputCaption')}
                  </p>
                </div>
              </div>
            </div>

            <h2 className='pt-10 md:pt-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('seoSection.benefits.title')}
            </h2>
            <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm'>
              {t('seoSection.benefits.description')}
            </p>
            <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[
                {
                  title: t('seoSection.benefits.benefit1.title'),
                  content: t('seoSection.benefits.benefit1.content'),
                },
                {
                  title: t('seoSection.benefits.benefit2.title'),
                  content: t('seoSection.benefits.benefit2.content'),
                },
                {
                  title: t('seoSection.benefits.benefit3.title'),
                  content: t('seoSection.benefits.benefit3.content'),
                },
                {
                  title: t('seoSection.benefits.benefit4.title'),
                  content: t('seoSection.benefits.benefit4.content'),
                },
                {
                  title: t('seoSection.benefits.benefit5.title'),
                  content: t('seoSection.benefits.benefit5.content'),
                },
                {
                  title: t('seoSection.benefits.benefit6.title'),
                  content: t('seoSection.benefits.benefit6.content'),
                },
                {
                  title: t('seoSection.benefits.benefit7.title'),
                  content: t('seoSection.benefits.benefit7.content'),
                },
                {
                  title: t('seoSection.benefits.benefit8.title'),
                  content: t('seoSection.benefits.benefit8.content'),
                },
                {
                  title: t('seoSection.benefits.benefit9.title'),
                  content: t('seoSection.benefits.benefit9.content'),
                },
              ].map(feature => (
                <div
                  key={feature.title}
                  className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                  <h3 className='mb-3 text-lg font-semibold text-primary-600 md:text-xl'>
                    {feature.title}
                  </h3>
                  <p className='text-muted-foreground text-sm'>{feature.content}</p>
                </div>
              ))}
            </div>

            <div className='my-12 md:my-16'>
              <MoreAITools category='illustration' />
            </div>

            <h2 className='pt-12 pb-2 md:py-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('seoSection.faq.title')}
            </h2>
            <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm'>
              {t('seoSection.faq.description')}
            </p>

            <div className='flex justify-center'>
              <div className='max-w-[1000px] w-full px-4'>
                <FAQ faqs={faqs} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 确认对话框 */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader>{t('deleteModal.title')}</ModalHeader>
          <ModalBody>{t('deleteModal.message')}</ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              {t('deleteModal.cancelButton')}
            </Button>
            <Button color='danger' onPress={handleConfirmDelete}>
              {t('deleteModal.deleteButton')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
