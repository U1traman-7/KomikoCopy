/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { FaDownload, FaPlus, FaTrash, FaMinus } from 'react-icons/fa'; // 在文件顶部导入图标
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from '@nextui-org/react';
import UploadFile from '../UploadFile';
import { uploadImageFromUrl } from '@/utils/uploadUtils';
import {
  filterValidVideo,
  mergeMediaData,
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
} from './utils';
import { ResultCard } from './ResultCard';
import { VideoData } from './utils';
import { Accordion, AccordionItem } from '@nextui-org/react';
import Link from 'next/link';
import FAQ from '@/components/FAQ';
import { BiSolidZap } from 'react-icons/bi';
import { IN_BETWEEN } from '../../../api/tools/_zaps';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { useBtnText } from 'hooks/useBtnText';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { toastError, toastWarn } from '@/utils/index';
import { ERROR_CODES, ModelIds } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVideos } from 'hooks/useVideos';
import { useRouter } from 'next/router';
import { getCreateYoursData } from '../../utilities/tools';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';

type VideoApiParams = {
  method: 'getVideos' | 'generateVideo' | 'deleteVideo';
  tool: string;
  [key: string]: any; // 允许其他可选参数
};

interface VideosResponse {
  data: VideoData[];
}
// 调用视频生成API
const videosAPI = async (params: VideoApiParams): Promise<VideosResponse> => {
  const response = await fetch('/api/tools/video-generation', {
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

// 1. 检查并调整图片尺寸 512*512 和 格式
const processImage = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 512;
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
const inbetweenAPI = async (
  images: string[],
  prompt: string,
): Promise<string | { error?: string; error_code?: number }> => {
  const params: { [key: string]: any } = {
    prompt: prompt,
    max_width: 512,
    max_height: 512,
    loop: false,
    interpolate: false,
    negative_prompt: '',
    color_correction: true,
  };

  images.slice(0, 5).forEach((image, index) => {
    params[`image_${index + 1}`] = image;
  });

  const response = await fetch('/api/tools/inbetween', {
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
  if (data.error) {
    // toast.error(data.error);
    // throw new Error('no zaps');
    return { error: data.error, error_code: data.error_code };
  }
  if (data.output && data.output.length > 0) {
    return data.output[0];
  }
  return '';
};

const getId = genId();

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation('inbetween');
  const rourter = useRouter();
  const { submit: openModal } = useOpenModal();
  const router = useRouter();
  // State management
  const [prompt, setPrompt] = useState<string>('');

  const [inputImages, setInputImages] = useState<string[]>(['', '']);

  const { resultVideos, setResultVideos, submitTask } = useVideos(
    'inbetween',
    'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm',
  );
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);

  const [videoHeights, setVideoHeights] = useState<number[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isAuth = useAtomValue(authAtom);
  // last video添加 ref
  const lastVideoRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useAtom(profileAtom);
  const [isPublic, setIsPublic] = useState(() => {
    return profile.plan === 'Free';
  });

  // 计算视频高度
  const handleLoadedMetadata = (index: number) => {
    const videoElement = videoRefs.current[index];
    if (videoElement) {
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      const containerWidth = videoElement.parentElement?.offsetWidth || 0;
      const newHeight = 12 + containerWidth / aspectRatio;
      setVideoHeights(prevHeights => {
        const updatedHeights = [...prevHeights];
        updatedHeights[index] = newHeight;
        return updatedHeights;
      });
    }
  };
  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;

    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;
      if (generation) {
        //  get prompt
        const prompt = generation.prompt;
        if (prompt) {
          setPrompt(prompt);
        }

        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

  useEffect(() => {
    if (resultVideos.length > 0) {
      lastVideoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resultVideos]);

  /* ******************************  点击删除视频相关    *****************************  */
  // 点击删除按钮时保存视频 ID
  const handleDeleteClick = (videoId: number) => {
    if (typeof videoId === 'number' && videoId < 0) {
      setResultVideos(resultVideos =>
        resultVideos.filter(d => d.id !== videoId),
      );
      return;
    }
    setVideoToDelete(videoId);
    setDeleteModalOpen(true);
  };

  // 确认删除时使用保存的 ID
  const handleConfirmDelete = async () => {
    setDeleteModalOpen(false);
    if (videoToDelete) {
      try {
        const response = await videosAPI({
          method: 'deleteVideo',
          tool: 'inbetween',
          id: videoToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteVideo success');
          // await fetchVideos();  // 重新加载视频列表
          deleteMediaData(setResultVideos, videoToDelete); // 使用deleteMediaData
          toast.success(t('toasts.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteVideo failed');
          toast.error(t('toasts.deleteFailed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setVideoToDelete(null); // 清除保存的 ID
      } catch (error) {
        console.error('deleteVideo failed', error);
        toast.error(t('toasts.deleteFailed'), {
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
  // 下载短视频按键
  const handleDownload = async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${Date.now()}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // 释放 URL 对象
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toasts.downloadFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  /* ******************************   图片上传生成视频相关    *****************************  */

  // 减少一个图片输入
  const handleMinusClick = () => {
    // 减少图片或其他逻辑
    console.log('Minus button clicked');
    if (inputImages.length > 2) {
      // 确保至少保留两个元素
      setInputImages(prevImages => prevImages.slice(0, -1));
      toast.success(t('toasts.removeInput'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };
  // 增加一个图片输入
  const handlePlusClick = () => {
    // 增加图片或其他逻辑
    console.log('Plus button clicked');
    if (inputImages.length < 5) {
      // 限制最多6个元素
      setInputImages(prevImages => [...prevImages, '']);
      toast.success(t('toasts.addInput'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  const handleChange = (index: number) => (url: string) => {
    const newImages = [...inputImages];
    newImages[index] = url;
    setInputImages(newImages);
  };

  // Handle submission
  const handleSubmit = async () => {
    const imageCount = inputImages.length - 1;
    if (profile.credit < IN_BETWEEN * imageCount) {
      openModal('pricing');
      return;
    }

    setLoading(true);

    try {
      // 1. 并行处理 inputImages 中的所有图片
      const processedImages = await Promise.all(
        inputImages.map(image => processImage(image)),
      );
      // 2. 并行上传处理后的图片
      const uploadedUrls = await Promise.all(
        processedImages.map(image => uploadImageFromUrl(image)),
      );

      const taskId = await submitTask({
        target_model: ModelIds.IN_BETWEEN,
        images: uploadedUrls,
        prompt: prompt,
        tool: 'inbetween',
        should_delete_media: true,
      });
      if (!taskId) {
        return;
      }

      setResultVideos([
        {
          id: taskId,
          video_url: '',
          prompt: prompt,
          status: GenerationStatus.GENERATING,
        },
        ...resultVideos,
      ]);
    } catch (error) {
      console.error('create video failed:', error);
      if ((error as any).message === 'no zaps') {
        toast.error(t('toasts.noZaps'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        return;
      }
      toast.error(t('toasts.createVideoFailed'), {
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
      id: 2,
      question: t('faq.question1'),
      answer: (
        <div>
          <p>{t('faq.answer1.intro')}</p>
          <ul className='pl-5 mt-2 list-decimal'>
            <li>{t('faq.answer1.step1')}</li>
            <li>{t('faq.answer1.step2')}</li>
            <li>{t('faq.answer1.step3')}</li>
            <li>{t('faq.answer1.step4')}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 3,
      question: t('faq.question2'),
      answer: (
        <div>
          <p>{t('faq.answer2.intro')}</p>
          <ul className='pl-5 mt-2 list-decimal'>
            <li>{t('faq.answer2.benefit1')}</li>
            <li>{t('faq.answer2.benefit2')}</li>
            <li>{t('faq.answer2.benefit3')}</li>
            <li>{t('faq.answer2.benefit4')}</li>
            <li>{t('faq.answer2.benefit5')}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 4,
      question: t('faq.question3'),
      answer: (
        <div>
          <p>{t('faq.answer3.intro')}</p>
          <ul className='pl-5 mt-2 list-decimal'>
            <li>{t('faq.answer3.format1')}</li>
            <li>{t('faq.answer3.format2')}</li>
            <li>{t('faq.answer3.format3')}</li>
            <li>{t('faq.answer3.format4')}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 5,
      question: t('faq.question4'),
      answer: t('faq.answer4'),
    },
    {
      id: 6,
      question: t('faq.question5'),
      answer: (
        <div>
          <p>{t('faq.answer5.intro')}</p>
          <ul className='pl-5 mt-2 list-decimal'>
            <li>{t('faq.answer5.step1')}</li>
            <li>{t('faq.answer5.step2')}</li>
            <li>{t('faq.answer5.step3')}</li>
            <li>{t('faq.answer5.step4')}</li>
            <li>{t('faq.answer5.step5')}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 7,
      question: t('faq.question6'),
      answer: (
        <div>
          <p>{t('faq.answer6.intro')}</p>
          <ul className='pl-5 mt-2 list-decimal'>
            <li>{t('faq.answer6.limit1')}</li>
            <li>{t('faq.answer6.limit2')}</li>
            <li>{t('faq.answer6.limit3')}</li>
            <li>{t('faq.answer6.limit4')}</li>
          </ul>
        </div>
      ),
    },
    {
      id: 8,
      question: t('faq.question7'),
      answer: t('faq.answer7'),
    },
  ];

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen bg-background'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6 text-center'>
          <h1 className='mt-2 mb-3 text-2xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-4xl lg:text-5xl'>
            {t('title')}
          </h1>
          <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
            {t('description')}
          </p>
        </div>

        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Left input area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-5'>
            <Card className='p-4 md:px-6 md:pt-4 md:pb-6 md:transition-all duration-300 shadow-md md:shadow-2xl border-1.5 border-primary-200 bg-card rounded-xl'>
              <div className='flex justify-between items-center mb-4 md:mb-6'>
                <h2 className='text-lg font-bold md:text-2xl text-primary-800 dark:text-primary-400'>
                  {t('inputImages.title')}
                </h2>
                <div className='flex gap-2'>
                  <Button
                    isIconOnly
                    size='sm'
                    variant='bordered'
                    className='border-dashed border-default-300 hover:border-default-400 border-1'
                    onClick={() => handleMinusClick()}>
                    <FaMinus className='text-xl text-muted-foreground hover:text-foreground' />
                  </Button>
                  <Button
                    isIconOnly
                    size='sm'
                    variant='bordered'
                    className='border-dashed border-default-300 hover:border-default-400 border-1'
                    onClick={() => handlePlusClick()}>
                    <FaPlus className='text-xl text-muted-foreground hover:text-foreground' />
                  </Button>
                </div>
              </div>
              {inputImages.map((image, index) => (
                <div className='mb-4 md:mb-6' key={index}>
                  <p className='mb-2 font-bold text-foreground text-sm md:text-base'>
                    {t('inputImages.imageLabel')} {index + 1}
                  </p>
                  <UploadFile onChange={handleChange(index)}></UploadFile>
                </div>
              ))}

              {/* Prompt input */}
              <div className='mb-4 md:mb-6'>
                <p className='mb-2 font-bold text-foreground text-sm md:text-base'>
                  {t('prompt.label')}
                </p>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={t('prompt.placeholder')}
                  className='p-3 w-full rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary'
                  rows={1}
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
                className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                size='lg'
                onClick={handleSubmit}
                isDisabled={
                  inputImages.length <= 1 || inputImages.some(image => !image)
                }>
                <span className='mr-2'>{t('button.submit')}</span>

                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-white'>
                    -{IN_BETWEEN * (inputImages.length - 1)}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='p-4 md:pb-6 md:px-6 md:pt-4 h-full flex flex-col shadow-md shadow-gray-200 md:shadow-2xl border-1.5 border-primary-50 bg-card rounded-xl'>
              <h2 className='mb-4 md:mb-6 text-lg font-bold md:text-2xl text-primary-800 dark:text-primary-400'>
                {t('results.title')}
              </h2>
              <div className='w-full max-h-[calc(760.5-7rem)] flex flex-col'>
                <div className='overflow-y-auto flex-1'>
                  {resultVideos?.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6'>
                      {resultVideos.map((video, index) => (
                        <ResultCard
                          index={index}
                          key={video.id}
                          type='video'
                          data={video}
                          handleDelete={handleDeleteClick}
                          handleDownload={handleDownload}
                          handleLoadedMetadata={handleLoadedMetadata}
                          videoRefs={videoRefs}
                          showPrompt
                          isExample={video.id === -1}
                          tool='inbetween'></ResultCard>
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground text-sm md:text-base'>
                      {t('results.empty')}
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
            <div className='grid grid-cols-12 gap-4 mt-8 mb-8'>
              <div className='col-span-12'>
                <h2 className='pt-10 md:pt-16 mt-2 md:mt-16 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                  {t('sections.whatIs.title')}
                </h2>
                <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                  {t('sections.whatIs.description')}
                </p>
              </div>
            </div>
            <h2 className='mt-16 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
              {t('sections.howTo.title')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('sections.howTo.description')}
            </p>

            {/* How It Works Section */}
            <div className='pt-10 md:pt-16  md:pb-16 bg-card'>
              <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
                {(
                  t('sections.howTo.steps', {
                    returnObjects: true,
                  }) as Array<{
                    step: number;
                    title: string;
                    content: string;
                  }>
                ).map((step, i) => (
                  <div
                    key={step.title}
                    className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                    <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-white bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                      {i + 1}
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
            </div>
            <div className='grid grid-cols-12 gap-4 mt-8 mb-8'>
              <div className='col-span-12'>
                <h2 className='mt-16 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                  {t('sections.examples.title')}
                </h2>
                <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                  {t('sections.examples.description')}
                </p>
                <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                  {/* Example image 1 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_media/f61ee1e0-c754-44f4-a8ea-12dff437dfee.webp'
                        alt='Example Input 1'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input1')}
                    </p>
                  </div>

                  {/* Example image 2 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_media/72e0aae9-9454-4a47-9c79-6b9466d490c3.webp'
                        alt='Example Input 2'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input2')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm'
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.output')}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                  {/* Example image 1 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/01showcase/72109_125.mp4_00-00.png'
                        alt='Example Input 1'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input1')}
                    </p>
                  </div>

                  {/* Example image 2 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/01showcase/72109_125.mp4_00-01.png'
                        alt='Example Input 2'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input2')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://doubiiu.github.io/projects/ToonCrafter/01showcase/72109_125.mp4'
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.output')}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                  {/* Example image 1 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/03application/sketch_interpolation/Japan_v2_3_119235_s2/frame0001.png'
                        alt='Example Input 1'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input1')}
                    </p>
                  </div>

                  {/* Example image 2 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/03application/sketch_interpolation/Japan_v2_3_119235_s2/frame0016.png'
                        alt='Example Input 2'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input2')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://doubiiu.github.io/projects/ToonCrafter/03application/sketch_interpolation/Japan_v2_3_119235_s2.mp4'
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.output')}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                  {/* Example image 1 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/02comparison/Japan_v2_1_121331_s3_frame1.png'
                        alt='Example Input 1'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input1')}
                    </p>
                  </div>

                  {/* Example image 2 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/02comparison/Japan_v2_1_121331_s3_frame3.png'
                        alt='Example Input 2'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input2')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://doubiiu.github.io/projects/ToonCrafter/02comparison/Japan_v2_1_121331_s3_frame1/Japan_v2_1_121331_s3_frame1_Ours.mp4'
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.output')}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 mb-6 md:grid-cols-3'>
                  {/* Example image 1 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/01showcase/73172(31)_609.mp4_00-00.png'
                        alt='Example Input 1'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input1')}
                    </p>
                  </div>

                  {/* Example image 2 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://doubiiu.github.io/projects/ToonCrafter/01showcase/73172(31)_609.mp4_00-01.png'
                        alt='Example Input 2'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.input2')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://doubiiu.github.io/projects/ToonCrafter/01showcase/73172(31)_609.mp4'
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('sections.examples.output')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className='py-10 md:py-16 bg-gradient-to-b from-background dark:from-gray-900 rounded-xl to-primary-100 dark:to-gray-800'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                {t('sections.whyChoose.title')}
              </h2>
              <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('sections.whyChoose.description')}
              </p>
              <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                {(
                  t('sections.whyChoose.features', {
                    returnObjects: true,
                  }) as Array<{ title: string; content: string }>
                ).map(feature => (
                  <div
                    key={feature.title}
                    className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <div className='flex items-center mb-4'>
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

            {/* Other AI Tools */}
            <div className='my-12 md:my-16'>
              <MoreAITools category='animation' />
            </div>

            {/* FAQ Section */}
            <div className='pt-14 md:py-16'>
              <h2 className='mb-2 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                {t('sections.faqSection.title')}
              </h2>
              <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('sections.faqSection.description')}
              </p>

              <div className='flex justify-center'>
                <div className='max-w-[1000px] w-full'>
                  <FAQ faqs={faqs} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 确认对话框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-sm',
          base: 'border border-primary-200',
        }}>
        <ModalContent>
          <ModalHeader className='text-primary-800'>
            {t('deleteModal.title')}
          </ModalHeader>
          <ModalBody>
            <p>{t('deleteModal.message')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              {t('deleteModal.cancel')}
            </Button>
            <Button color='danger' onPress={handleConfirmDelete}>
              {t('deleteModal.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
