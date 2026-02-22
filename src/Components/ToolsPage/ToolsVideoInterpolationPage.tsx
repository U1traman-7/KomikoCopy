/*eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaDownload, FaTrash } from 'react-icons/fa';
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
  uploadVideo as originalUploadVideo,
} from './utils';
import { ResultCard } from './ResultCard';
import { VideoData, getVideoDuration } from './utils';
import FAQ from '@/components/FAQ';
import { BiSolidZap } from 'react-icons/bi';
import { VIDEO_INTERPOLATION } from '../../../api/tools/_zaps';
import { authAtom, profileAtom } from 'state';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { useRouter } from 'next/router';
import { toastWarn, hasError } from '@/utils/index';
import { ERROR_CODES, ModelIds } from '../../../api/_constants';
import { useVideos } from 'hooks/useVideos';
import { useAtomValue } from 'jotai';
import { getCreateYoursData } from '../../utilities/tools';

type VideoApiParams = {
  method: 'getVideos' | 'generateVideo' | 'deleteVideo';
  tool: string;
  [key: string]: any; // 允许其他可选参数
};
// 定义视频数据接口
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

// 1. 调用 frame interpolation API
const videoInterpolationAPI = async (
  input_video: string,
  frames_per_second: number,
  interpolate_steps: number,
  duration: number,
): Promise<string | string[] | { error?: string; error_code?: number }> => {
  if (!input_video) {
    console.error(
      '[DEBUG-API] No video path provided to videoInterpolationAPI',
    );
    throw new Error('No video path provided');
  }

  // 确保URL是字符串而非对象或其他类型
  const videoPath = String(input_video);

  const params = {
    video_path: videoPath,
    frames_per_second: Number(frames_per_second),
    interpolate_steps: Number(interpolate_steps),
    duration: Number(duration),
  };

  console.log(
    '[DEBUG-API] Sending API request with params:',
    JSON.stringify(params),
  );

  const response = await fetch('/api/tools/video-interpolation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[DEBUG-API] API request failed: ${response.status}`,
      errorText,
    );
    throw new Error(`API request failed: ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
    console.log('[DEBUG-API] API response:', data);
  } catch (error) {
    console.error('[DEBUG-API] Failed to parse response JSON:', error);
    throw new Error('Failed to parse API response');
  }

  if (data.error) {
    // console.error("[DEBUG-API] API returned error:", data.error);
    // toast.error(data.error);
    // throw new Error('no zaps');
    return { error: data.error, error_code: data.error_code };
  }

  if (data.output) {
    console.log('[DEBUG-API] API returned output URL:', data.output);
    return data.output;
  }
  return { error: 'No output from API', error_code: 0 };
};

const getId = genId();

// 创建一个增强版的uploadVideo函数，添加更多的错误处理和日志记录
const uploadVideo = async (videoUrl: string): Promise<string> => {
  if (!videoUrl) {
    console.error('[DEBUG] Attempted to upload empty video URL');
    throw new Error('Empty video URL');
  }

  console.log(
    '[DEBUG] Starting video upload for URL:',
    videoUrl.substring(0, 50) + '...',
  );

  try {
    const result = await originalUploadVideo(videoUrl);
    console.log(
      '[DEBUG] Video upload successful, received URL:',
      result.substring(0, 50) + '...',
    );
    return result;
  } catch (error) {
    console.error('[DEBUG] Video upload failed with error:', error);
    throw error;
  }
};

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation('video-interpolation');
  const { t: tc } = useTranslation('common');
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);
  const {
    inputImage: videoInput,
    setInputImage: setVideoInput,
    hasMedia,
    mediaItem,
    isFromTool,
  } = useProcessInitialImage();

  const [frames_per_second, setFramesPerSecond] = useState(24);
  const [interpolate_steps, setInterpolateSteps] = useState(2);

  const { resultVideos, setResultVideos, submitTask } = useVideos(
    'video-interpolation',
    'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm',
  );
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const [videoHeights, setVideoHeights] = useState<number[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  // last video添加 ref
  const lastVideoRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useAtom(profileAtom);
  const [duration, setDuration] = useState(0);

  // 监听视频输入变化，获取视频时长
  useEffect(() => {
    if (videoInput) {
      getVideoDuration(videoInput)
        .then(duration => {
          console.log('[DEBUG] Video duration:', duration);
          setDuration(Math.ceil(duration));
        })
        .catch(error => {
          console.error('[DEBUG] Failed to get video duration:', error);
        });
    }
  }, [videoInput]);

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
      if (generation && generation.meta_data) {
        //  get frames_per_second
        const frames_per_second = generation.meta_data.frames_per_second;
        if (frames_per_second) {
          setFramesPerSecond(frames_per_second);
        }
        console.log('frames_per_second', frames_per_second);
        //  get interpolate_steps
        const interpolate_steps = generation.meta_data.interpolate_steps;
        if (interpolate_steps) {
          setInterpolateSteps(interpolate_steps);
        }
        console.log('interpolate_steps', interpolate_steps);

        // router.replace({
        //   pathname: router.pathname,
        //   query: {},
        // });
      }
    }
  }, [router.isReady, router.query.generationId]);

  useEffect(() => {
    if (resultVideos.length > 0) {
      lastVideoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resultVideos]);

  // 初始化时清除 URL query 参数
  useEffect(() => {
    if (hasMedia) {
      router.replace('/video_interpolation', undefined, { shallow: true });
    }
  }, []);

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
          tool: 'video-interpolation',
          id: videoToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteVideo success');
          deleteMediaData(setResultVideos, videoToDelete); // 使用deleteMediaData
          toast.success(tc('toasts.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteVideo failed');
          toast.error(tc('toasts.deleteFailed'), {
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
        toast.error(tc('toasts.deleteFailed'), {
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
      toast.error(tc('toasts.downloadFailed'), {
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
      console.log('[DEBUG] Setting video input URL:', url);
      setVideoInput(url);

      // 获取视频时长
      getVideoDuration(url)
        .then(duration => {
          console.log('[DEBUG] Video duration:', duration);
          setDuration(Math.ceil(duration));
        })
        .catch(error => {
          console.error('[DEBUG] Failed to get video duration:', error);
        });
    } else {
      console.warn('[DEBUG] handleChange called with empty URL');
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    // 防止重复提交
    if (isGenerating || loading) {
      return;
    }

    // 输入验证
    if (!videoInput) {
      console.error('[DEBUG] No video input URL');
      toast.error(tc('toasts.noVideoUrl'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
      return;
    }

    console.log('[DEBUG] Starting video processing with input:', videoInput);

    // 检查点数是否足够
    if (profile.credit < VIDEO_INTERPOLATION * duration * interpolate_steps) {
      toast.error(tc('toasts.noZaps'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
      return;
    }

    setLoading(true);

    // 设置生成状态
    setIsGenerating(true);

    try {
      // 获取或上传视频URL
      let finalVideoUrl = videoInput;

      // 如果需要上传到存储服务
      // console.log("[DEBUG] Uploading video to storage:", videoInput);
      let should_delete_media = false;
      if (!videoInput.includes('supabase.co')) {
        should_delete_media = true;
        try {
          const videoInputUrl = await uploadVideo(videoInput);
          console.log('[DEBUG] Video uploaded successfully:', videoInputUrl);
          finalVideoUrl = videoInputUrl;
        } catch (error) {
          console.error('[DEBUG] Failed to upload video:', error);
          toast.error(tc('toasts.uploadFailed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
          setLoading(false);
          setIsGenerating(false);
          return;
        }
      } else {
        should_delete_media = false;
      }

      // 再次确保有有效的视频URL
      if (!finalVideoUrl) {
        console.error('[DEBUG] No valid video URL found after upload attempt');
        toast.error(tc('toasts.noVideoUrl'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        setIsGenerating(false);
        setLoading(false);
        return;
      }

      const taskId = await submitTask({
        target_model: ModelIds.VIDEO_INTERPOLATION,
        video: finalVideoUrl,
        interpolate_steps,
        frames_per_second,
        duration,
        tool: 'video-interpolation',
        should_delete_media,
        meta_data: {
          interpolate_steps,
          frames_per_second,
        },
      }).catch();
      setLoading(false);
      setIsGenerating(false);
      if (!taskId) {
        return;
      }
      setResultVideos([
        {
          id: taskId,
          video_url: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultVideos.filter(d => d.id !== -1),
      ]);
    } catch (error) {
      console.error('frame interpolation failed:', error);
      if ((error as any).message === 'no zaps') {
        toast.error(tc('toasts.noZaps'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
        return;
      }
      toast.error(tc('toasts.processingFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    } finally {
      // 无论成功或失败，都重置生成状态
      setIsGenerating(false);
      setLoading(false);
    }
  };

  // 修改删除按钮的处理函数
  const handleRemoveVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoInput('');
    setDuration(0);
    // 清除 URL query 参数
    router.replace('/video_interpolation', undefined, { shallow: true });
  };

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        <div className='pt-6 text-center'>
          <h1 className='mb-6 text-2xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-4xl lg:text-5xl'>
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
                <h2 className='text-lg font-bold text-primary-800 dark:text-primary-400 md:text-2xl'>
                  {t('input.title')}
                </h2>
              </div>
              {/* {isFromTool && hasMedia && (
                                <div className="p-2 mb-4 text-sm text-blue-700 bg-blue-50 rounded-lg">
                                    <p>{tc('from_other_tools', {
                                        input_type: tc('input_types.video'),
                                        tools: tc(`tools.${mediaItem.source || 'unknown'}`)
                                    })}</p>
                                </div>
                            )} */}
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
                          setDuration(Math.ceil(video.duration));
                        }}
                      />
                      {!isGenerating && !loading && (
                        <button
                          onClick={handleRemoveVideo}
                          className='absolute top-2 right-2 p-1 text-white bg-red-500 rounded-full hover:bg-red-600'
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
                    limit={20}
                    style={{
                      opacity: isGenerating || loading ? 0.5 : 1,
                      pointerEvents: isGenerating || loading ? 'none' : 'auto',
                    }}>
                    <FaCloudUploadAlt className='w-12 h-12 text-muted-foreground' />
                    <p className='mt-2 text-muted-foreground'>
                      {t('input.uploadPrompt')}
                    </p>
                  </UploadFile>
                )}
              </div>

              {/* Interpolate input */}
              <div className='mb-4'>
                <div className='flex justify-between mb-2'>
                  <label className='font-bold text-foreground text-sm md:text-base'>
                    {t('input.framesPerSecond')}{' '}
                  </label>
                  <span className='text-primary-600 font-semibold text-sm md:text-base'>
                    {frames_per_second} {t('input.framesPerSecondRange')}
                  </span>
                </div>
                <input
                  type='range'
                  min='1'
                  max='60'
                  value={frames_per_second}
                  onChange={e => setFramesPerSecond(Number(e.target.value))}
                  className='w-full accent-primary-600'
                  disabled={isGenerating || loading}
                />
              </div>

              {/* Interpolate input */}
              <div className='mb-4'>
                <div className='flex justify-between mb-2'>
                  <label className='font-bold text-foreground text-sm md:text-base'>
                    {t('input.interpolationSteps')}{' '}
                  </label>
                  <span className='text-primary-600 font-semibold text-sm md:text-base'>
                    {interpolate_steps} {t('input.interpolationStepsRange')}
                  </span>
                </div>
                <input
                  type='range'
                  min='1'
                  max='10'
                  value={interpolate_steps}
                  onChange={e => setInterpolateSteps(Number(e.target.value))}
                  className='w-full accent-primary-600'
                  disabled={isGenerating || loading}
                />
              </div>

              {/* Submit button */}
              <Button
                isLoading={loading || isGenerating}
                color='primary'
                className='w-full transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                size='lg'
                onClick={handleSubmit}
                isDisabled={!videoInput || loading || isGenerating}>
                <span className='mr-2'>{t('input.submitButton')}</span>
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-white'>
                    -{VIDEO_INTERPOLATION * duration * interpolate_steps}/
                    {profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='p-4 md:pb-6 md:px-6 md:pt-4 h-full flex flex-col shadow-md shadow-gray-200 md:shadow-2xl border-1.5 border-primary-50 bg-card rounded-xl'>
              <h2 className='flex items-center mb-4 md:mb-6 text-lg font-bold text-primary-800 dark:text-primary-400 md:text-2xl'>
                <FaDownload className='mr-2 text-primary-600' />{' '}
                {t('results.title')}
              </h2>
              <div className='flex flex-col w-full overflow-y-auto max-h-[424px]'>
                <div className='flex-1'>
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
                          totalCount={resultVideos.length}
                          isExample={video.id === -1}
                          handleLoadedMetadata={handleLoadedMetadata}
                          videoRefs={videoRefs}
                          showPrompt={!!video.prompt}
                          tool='video-interpolation'></ResultCard>
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground text-sm md:text-base'>
                      {t('results.emptyState')}
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
            <h2 className='pt-10 md:pt-16 mt-16 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
              {t('seo.whatIs.title')}
            </h2>
            <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('seo.whatIs.description')}
            </p>

            <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
              {t('seo.transform.title')}
            </h2>
            <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('seo.transform.description')}
            </p>

            <div className='grid grid-cols-1 gap-4 mt-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {(t('seo.steps', { returnObjects: true }) as any[]).map(
                (step: any) => (
                  <div
                    key={step.title}
                    className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
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
                ),
              )}
            </div>

            <div className='grid grid-cols-12 gap-4 mt-8 mb-8'>
              <div className='col-span-12'>
                <h2 className='pt-12 text-center md:pt-16 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mb-6 md:text-3xl'>
                  {t('seo.example.title')}
                </h2>
                <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                  {t('seo.example.description')}
                </p>
                <div className='grid grid-cols-12 gap-4'>
                  {/* Example input video */}
                  <div className='flex flex-col col-span-6 items-center'>
                    <div className='overflow-hidden mb-2 w-full h-64 rounded-lg'>
                      <video
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/fcd6143d-9a6b-4964-993e-c442c1121b10.webm' // 替换为实际的示例视频路径
                        controls
                        playsInline
                        autoPlay
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-xs text-center text-muted-foreground md:text-sm'>
                      {t('seo.example.inputLabel')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col col-span-6 items-center'>
                    <div className='overflow-hidden mb-2 w-full h-64 rounded-lg'>
                      <video
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/679983bc-952d-4509-bf03-d8b5bc1f91bc.webm'
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
                      {t('seo.example.outputLabel')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className='py-10 md:py-16 bg-gradient-to-b from-background dark:from-gray-900 rounded-xl to-primary-100 dark:to-gray-800'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                {t('seo.benefits.title')}
              </h2>
              <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('seo.benefits.description')}
              </p>
              <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                {(
                  t('seo.benefits.features', { returnObjects: true }) as any[]
                ).map((feature: any) => (
                  <div
                    key={feature.title}
                    className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <h3 className='mb-3 text-lg font-semibold text-primary-800 dark:text-primary-400 md:text-xl'>
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

            <div className='py-14 md:py-16'>
              <h2 className='mb-2 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                {t('seo.expertGuide.title')}
              </h2>
              <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('seo.expertGuide.description')}
              </p>

              <div className='flex justify-center'>
                <div className='max-w-[1000px] w-full'>
                  <FAQ
                    faqs={[
                      {
                        id: 1,
                        question: t('faq.question1'),
                        answer: t('faq.answer1') as string,
                      },
                      {
                        id: 2,
                        question: t('faq.question2'),
                        answer: t('faq.answer2') as string,
                      },
                      {
                        id: 3,
                        question: t('faq.question3'),
                        answer: t('faq.answer3', {
                          returnObjects: true,
                        }) as string[],
                      },
                      {
                        id: 4,
                        question: t('faq.question4'),
                        answer: t('faq.answer4') as string,
                      },
                      {
                        id: 5,
                        question: t('faq.question5'),
                        answer: t('faq.answer5') as string,
                      },
                      {
                        id: 6,
                        question: t('faq.question6'),
                        answer: t('faq.answer6') as string,
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 确认对话框 */}
        <Modal
          isOpen={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          classNames={{
            backdrop: 'bg-black/50 backdrop-blur-sm',
            base: 'border border-primary-200',
          }}>
          <ModalContent>
            {onClose => (
              <>
                <ModalHeader className='text-primary-800'>
                  {t('deleteModal.title')}
                </ModalHeader>
                <ModalBody>
                  <p>{t('deleteModal.message')}</p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant='light'
                    onPress={onClose}
                    className='transition-all duration-300 hover:bg-gray-100'>
                    {t('deleteModal.cancelButton')}
                  </Button>
                  <Button
                    color='danger'
                    onPress={() => {
                      handleConfirmDelete();
                      onClose();
                    }}
                    className='bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300 hover:from-red-600 hover:to-pink-600'>
                    {t('deleteModal.deleteButton')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
