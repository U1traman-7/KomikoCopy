/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { FaVideo, FaTrash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
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
import {
  filterValidVideo,
  mergeMediaData,
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
  getVideoDuration,
} from './utils';
import { ResultCard } from './ResultCard';
import { VideoData, uploadVideo } from './utils';
import FAQ from '@/components/FAQ';
import { VIDEO_UPSCALE, VIDEO_UPSCALE_UNIT } from '../../../api/tools/_zaps';
import { BiSolidZap } from 'react-icons/bi';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { calculateVideoUpscaleCost } from '../../../api/tools/_zaps';
import { useBtnText } from 'hooks/useBtnText';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { toastWarn } from '@/utils/index';
import { ERROR_CODES, ModelIds } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { useVideos } from 'hooks/useVideos';
import { getCreateYoursData } from '../../utilities/tools';
import { useRouter } from 'next/router';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';

const getId = genId();

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

// 1. 调用 video Upscale API
const videoUpscaleAPI = async (
  input_video: string,
  resolution: string,
  duration: number,
): Promise<string | { error: string; error_code: number }> => {
  // Ensure video_path is a public URL, or blob URL
  if (
    !input_video.startsWith('http://') &&
    !input_video.startsWith('https://') &&
    !input_video.startsWith('blob:')
  ) {
    throw new Error(
      'Video URL must be a valid HTTP/HTTPS URL, base64 data, or blob URL',
    );
  }

  const params: { [key: string]: any } = {
    video_path: input_video, // 直接使用原始URL，不再编码
    resolution: resolution, // 默认 FHD 2k 4k
    duration: duration,
  };

  const response = await fetch('/api/tools/video-upscale', {
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
  if (data.output) {
    return data.output;
  }
  return { error: 'no output', error_code: 0 };
};

// 2. 上传视频到 Supabase

// Add this constant before the component
const faqs = [
  {
    id: 1,
    question: 'faq.question1',
    answer: 'faq.answer1',
  },
  {
    id: 2,
    question: 'faq.question2',
    answer: 'faq.answer2',
  },
  {
    id: 3,
    question: 'faq.question3',
    answer: [
      'faq.answer3.point1',
      'faq.answer3.point2',
      'faq.answer3.point3',
      'faq.answer3.point4',
    ],
  },
  {
    id: 4,
    question: 'faq.question4',
    answer: 'faq.answer4',
  },
  {
    id: 5,
    question: 'faq.question5',
    answer: 'faq.answer5',
  },
  {
    id: 6,
    question: 'faq.question6',
    answer: 'faq.answer6',
  },
];

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation(['video-upscaling', 'toast']);
  const { t: tc } = useTranslation('common');

  const {
    inputImage: videoInput,
    setInputImage: setVideoInput,
    hasMedia,
    mediaItem,
    isFromTool,
  } = useProcessInitialImage();

  // 在组件中定义状态
  const [resolution, setResolution] = useState('FHD');

  const { resultVideos, setResultVideos, addTaskId, submitTask } = useVideos(
    'video-upscale',
    'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm',
  );
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const [videoHeights, setVideoHeights] = useState<number[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  // last video添加 ref
  const lastVideoRef = useRef<HTMLDivElement>(null);
  const isAuth = useAtomValue(authAtom);

  const [loading, setLoading] = useState(false);
  const [changeId, setChangeId] = useState(0);
  const oldIdRef = useRef(0);

  const [profile, setProfile] = useAtom(profileAtom);

  const [duration, setDuration] = useState(0);

  const [cost, setCost] = useState(VIDEO_UPSCALE);
  const { submit: openModal } = useOpenModal();
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

  useEffect(() => {
    if (videoInput) {
      getVideoDuration(videoInput).then(duration => {
        setDuration(duration);
        setCost(calculateVideoUpscaleCost(duration));
      });
    }
  }, [videoInput]);

  // 第二个 useEffect：监听 resultVideos 变化并滚动
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
          tool: 'video-upscale',
          id: videoToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteVideo success');
          deleteMediaData(setResultVideos, videoToDelete); // 使用deleteMediaData
          toast.success(t('toast:video.upscale.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteVideo failed');
          toast.error(t('toast:video.upscale.deleteFailed'), {
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
        toast.error(t('toast:video.upscale.deleteFailed'), {
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
      toast.error(t('toast:video.upscale.downloadFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  const handleChange = (url: string) => {
    if (url) {
      setVideoInput(url);
      setChangeId(id => ++id);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (profile.credit < cost) {
      openModal('pricing');
      return;
    }
    const isChanged = changeId !== oldIdRef.current;
    if (isChanged) {
      setLoading(true);
    }

    try {
      if (profile.credit < cost) {
        toast.error(t('toast:video.upscale.purchaseMoreZaps'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        return;
      }

      // 确保videoInput是有效的URL或blob URL
      if (
        !videoInput ||
        (!videoInput.startsWith('http://') &&
          !videoInput.startsWith('https://') &&
          !videoInput.startsWith('blob:'))
      ) {
        toast.error(t('toast:video.upscale.invalidVideoUrl'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        setLoading(false);
        return;
      }

      let finalVideoUrl = videoInput;
      let should_delete_media = false;

      if (!videoInput.includes('supabase.co')) {
        should_delete_media = true;
        try {
          finalVideoUrl = await uploadVideo(videoInput);
          if (!finalVideoUrl) {
            throw new Error('Failed to upload video');
          }
          if (
            !finalVideoUrl.startsWith('http://') &&
            !finalVideoUrl.startsWith('https://')
          ) {
            throw new Error('Invalid video URL format');
          }
        } catch (uploadError) {
          toast.error(t('toast:video.upscale.uploadFailed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
          setLoading(false);
          return;
        }
      } else {
        should_delete_media = false;
      }

      const params = {
        video_path: finalVideoUrl, // 直接使用原始URL，不再编码
        resolution: resolution, // 默认 FHD 2k 4k
        duration: duration,
        target_model: ModelIds.VIDEO_UPSCALE,
        tool: 'video-upscale',
        should_delete_media,
      };

      const taskId = await submitTask(params).catch();
      if (!taskId) {
        setLoading(false);
        return;
      }
      setLoading(false);
      setResultVideos([
        {
          id: taskId,
          video_url: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultVideos.filter(d => d.id !== -1),
      ]);

      addTaskId(taskId);
    } catch (error) {
      console.error('video upscale failed:', error);
      if ((error as any).message === 'no zaps') {
        toast.error(t('toast:video.upscale.noZaps'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        return;
      }
      toast.error(t('toast:video.upscale.upscaleFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  return (
    // Add min-h-screen to ensure minimum screen height, overflow-y-auto to allow vertical scrolling
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen bg-background'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        <h1 className='mt-2 mb-3 text-2xl font-bold text-center text-heading md:text-4xl lg:text-5xl'>
          {t('title')}
        </h1>
        <p className='px-2 mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
          {t('description')}
        </p>
        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Left input area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-5'>
            <Card className='bg-card p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-lg font-bold text-primary-600 md:text-2xl'>
                  {t('input.title')}
                </h2>
              </div>
              {/* 如果视频来自其他页面的传递，显示来源信息 */}
              {/* {isFromTool && hasMedia && (
                                <div className="p-2 mb-4 text-sm text-blue-700 bg-blue-50 rounded-lg">
                                    <p>{tc('from_other_tools', {
                                        input_type: tc('input_types.video'),
                                        tools: tc(`tools.${mediaItem.source || 'unknown'}`),
                                    })}</p>
                                </div>
                            )} */}
              {/* First video upload */}
              <div className='mb-6'>
                {videoInput ? (
                  <div className='relative w-full h-48 rounded-lg border-2 border-dashed cursor-pointer'>
                    <div className='relative w-full h-full'>
                      <video
                        src={videoInput}
                        className='object-contain w-full h-full rounded-lg'
                        controls
                        autoPlay
                        muted
                        onLoadedMetadata={e => {
                          const video = e.target as HTMLVideoElement;
                          const videoDuration = Math.ceil(video.duration);
                          setDuration(videoDuration);
                          setCost(calculateVideoUpscaleCost(videoDuration));
                        }}
                      />
                      {!loading && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setVideoInput('');
                            setDuration(0);
                            setCost(VIDEO_UPSCALE);
                          }}
                          className='absolute top-2 right-2 p-1 text-primary-foreground bg-red-500 rounded-full hover:bg-red-600'
                          type='button'>
                          <FaTrash className='w-3 h-3' />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <UploadFile
                    onChange={handleChange}
                    type='video'
                    limit={4.5}
                    style={{
                      opacity: loading ? 0.5 : 1,
                      pointerEvents: loading ? 'none' : 'auto',
                    }}>
                    <FaVideo className='w-12 h-12 text-muted-foreground transition-colors duration-200 group-hover:text-indigo-500' />
                    <p className='mt-2 text-muted-foreground'>
                      {t('input.uploadPrompt')}
                    </p>
                  </UploadFile>
                )}
              </div>

              {/* 选项组 */}
              <div className='flex justify-around mb-6'>
                <label className='flex items-center cursor-pointer'>
                  <input
                    type='radio'
                    name='resolution'
                    value='FHD'
                    checked={resolution === 'FHD'}
                    onChange={() => setResolution('FHD')}
                    className='mr-2'
                  />
                  FHD
                </label>
                <label className='flex items-center cursor-pointer'>
                  <input
                    type='radio'
                    name='resolution'
                    value='2k'
                    checked={resolution === '2k'}
                    onChange={() => setResolution('2k')}
                    className='mr-2'
                  />
                  2k
                </label>
                <label className='flex items-center cursor-pointer'>
                  <input
                    type='radio'
                    name='resolution'
                    value='4k'
                    checked={resolution === '4k'}
                    onChange={() => setResolution('4k')}
                    className='mr-2'
                  />
                  4k
                </label>
              </div>

              <Button
                isLoading={loading}
                color='primary'
                className='w-full mt-2'
                size='lg'
                onClick={handleSubmit}
                isDisabled={!videoInput}>
                {t('upscale_video')}
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-card'>
                    -{cost}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='bg-card p-6 h-full'>
              <h2 className='mb-6 text-lg font-bold text-primary-600 md:text-2xl'>
                {t('results.title')}
              </h2>
              <div className='w-full max-h-[calc(416px-7rem)] flex flex-col'>
                <div className='overflow-y-auto flex-1'>
                  {resultVideos?.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6'>
                      {resultVideos.map((video, index) => (
                        <ResultCard
                          key={video.id}
                          type='video'
                          index={index}
                          data={video}
                          handleDelete={handleDeleteClick}
                          handleDownload={handleDownload}
                          handleLoadedMetadata={handleLoadedMetadata}
                          videoRefs={videoRefs}
                          showPrompt={!!video.prompt}
                          totalCount={resultVideos.length}
                          isExample={video.id === -1}
                          tool='video-upscale'></ResultCard>
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground'>
                      {t('results.emptyState')}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Add SEO Section */}
        <div className='flex flex-col justify-center items-center mb-8'>
          <div className='col-span-12'>
            <h2 className='mt-16 mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('seo.transformTitle')}
            </h2>
            <p className='px-2 mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('seo.transformDescription')}
            </p>

            <div className='grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4'>
              {[
                {
                  step: 1,
                  title: t('steps.step1.title'),
                  content: t('steps.step1.content'),
                },
                {
                  step: 2,
                  title: t('steps.step2.title'),
                  content: t('steps.step2.content'),
                },
                {
                  step: 3,
                  title: t('steps.step3.title'),
                  content: t('steps.step3.content'),
                },
                {
                  step: 4,
                  title: t('steps.step4.title'),
                  content: t('steps.step4.content'),
                },
              ].map((step: any) => (
                <div
                  key={step.title}
                  className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                    {step.step}
                  </div>
                  <div className='flex-grow'>
                    <h3 className='mb-3 text-lg font-bold text-primary-600 md:text-xl'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='grid grid-cols-12 gap-4 mt-8 mb-8'>
              <div className='col-span-12'>
                <h2 className='mt-16 mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
                  {t('examples.title')}
                </h2>
                <p className='px-2 mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                  {t('examples.description')}
                </p>
                <div className='grid grid-cols-12 gap-4'>
                  {/* Example input video */}
                  <div className='flex flex-col col-span-5 items-center'>
                    <div className='overflow-hidden mt-8 mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm' // 替换为实际的示例视频路径
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        {t('examples.browserNotSupported')}
                      </video>
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.inputLabel')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col col-span-7 items-center'>
                    <div className='overflow-hidden mb-2 w-full h-64 rounded-lg'>
                      <video
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/477b0e98-6295-41c6-9162-cdbd7e06eba4.webm'
                        controls
                        playsInline
                        autoPlay
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        {t('examples.browserNotSupported')}
                      </video>
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='py-14 md:py-16 bg-gradient-to-b from-white rounded-xl to-primary-100'>
              <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
                {t('benefits.title')}
              </h2>
              <p className='px-2 mx-auto mb-4 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('benefits.description')}
              </p>
              <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                {[
                  {
                    title: t('benefits.feature1.title'),
                    content: t('benefits.feature1.content'),
                  },
                  {
                    title: t('benefits.feature2.title'),
                    content: t('benefits.feature2.content'),
                  },
                  {
                    title: t('benefits.feature3.title'),
                    content: t('benefits.feature3.content'),
                  },
                  {
                    title: t('benefits.feature4.title'),
                    content: t('benefits.feature4.content'),
                  },
                  {
                    title: t('benefits.feature5.title'),
                    content: t('benefits.feature5.content'),
                  },
                  {
                    title: t('benefits.feature6.title'),
                    content: t('benefits.feature6.content'),
                  },
                ].map(feature => (
                  <div
                    key={feature.title}
                    className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <h3 className='mb-2 text-lg font-semibold text-primary-600 md:text-xl'>
                      {feature.title}
                    </h3>
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

            <h2 className='mt-16 mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('guide.title')}
            </h2>
            <p className='px-2 mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('guide.description')}
            </p>

            <div className='flex justify-center'>
              <div className='max-w-[1000px] w-full'>
                <FAQ
                  faqs={faqs.map(faq => ({
                    ...faq,
                    question: t(faq.question),
                    answer: Array.isArray(faq.answer)
                      ? faq.answer.map(item => t(item))
                      : t(faq.answer),
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 确认对话框 */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}>
          <ModalContent>
            <ModalHeader>{t('modal.deleteTitle')}</ModalHeader>
            <ModalBody>{t('modal.deleteConfirmation')}</ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
                {t('modal.cancel')}
              </Button>
              <Button color='danger' onPress={handleConfirmDelete}>
                {t('modal.delete')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
