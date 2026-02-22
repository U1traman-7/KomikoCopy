import React, { useEffect, useRef, useState } from 'react';

import toast, { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { FaDownload, FaTrash, FaPlus, FaMinus } from 'react-icons/fa'; // 在文件顶部导入图标
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
import { ResultCard } from './ResultCard';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { uploadVideo as uploadVideoApi } from '@/api/upload';
import { uploadImageFromUrl } from '@/utils/uploadUtils';
import {
  filterValidVideo,
  mergeMediaData,
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
  VideoData,
} from './utils';
import FAQ from '@/components/FAQ';
import { FRAME_INTERPOLATION } from '../../../api/tools/_zaps';
import { BiSolidZap } from 'react-icons/bi';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { useBtnText } from 'hooks/useBtnText';
import { useOpenModal } from 'hooks/useOpenModal';

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
  if (data.error) {
    toast.error(data.error);
    throw new Error(data.error);
  }
  return data;
};

// 1. 检查并调整图片尺寸 512*512 和 格式
const processImage = async (imageUrl: string): Promise<string> =>
  new Promise((resolve, reject) => {
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

// 3. 调用 interpolate API
const interpolateAPI = async (
  frame1: string,
  frame2: string,
  interpolate: number,
): Promise<string> => {
  const params: { [key: string]: any } = {
    frame1,
    frame2,
    times_to_interpolate: interpolate,
  };
  console.log('params', params);
  const response = await fetch('/api/tools/frame-interpolation', {
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
  if (data.output) {
    return data.output;
  }
  throw new Error('No output from interpolateAPI API');
};

// 4. 上传视频到 Supabase
const uploadVideo = async (videoUrl: string): Promise<string> => {
  try {
    // 1. 获取视频 blob
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch video URL');
    }
    const blob = await response.blob();

    // 2. 创建视频文件
    const file = new File([blob], `${uuidv4()}.mp4`, { type: 'video/mp4' });
    // 3. 上传到 Supabase
    const videoPath = `app_videos/${file.name}`; // 使用专门的视频文件夹
    const form = new FormData();
    form.append('path', videoPath);
    form.append('file', file);
    const res = await uploadVideoApi(form).catch();
    if (!res || res.error) {
      throw new Error(`Upload failed: ${res.error}`);
    }
    return res.data;
  } catch (error) {
    console.error('Failed to upload video:', error);
    throw error;
  }
};

const getId = genId();

// Add this constant before the component
const faqs = [
  {
    id: 1,
    question: 'What is KomikoAI AI Frame Interpolation?',
    answer:
      'KomikoAI AI Frame Interpolation is a cutting-edge AI blend frames technology that uses artificial intelligence to create smooth transitions between images. Our AI frame blender analyzes your input frames and generates natural intermediate frames, enabling fluid AI-powered animations from static images. This advanced AI frame-by-frame animation technology is revolutionizing content creation for both professionals and enthusiasts.',
  },
  {
    id: 2,
    question: 'How does AI Frame Blending work?',
    answer:
      'Our AI video blending technology uses sophisticated deep learning models to analyze your input frames. The AI frame interpolation engine identifies corresponding elements between frames, calculates movement patterns, and generates new frames that create natural, smooth transitions. This AI animation generator considers multiple factors including position, rotation, scale, and lighting changes.',
  },
  {
    id: 3,
    question: 'What are the benefits of AI frame interpolation?',
    answer: [
      'Reduces animation production time by up to 90%',
      'Creates professional-quality motion sequences automatically',
      'Enables smooth transitions without manual frame-by-frame animation',
      'Perfect for creating engaging social media content and presentations',
      'Ideal for both beginners and professional animators',
    ],
  },
  {
    id: 4,
    question: 'Can I use interpolated videos for commercial purposes?',
    answer:
      "Yes, you can use AI-generated interpolated videos for personal and commercial purposes. However, ensure you comply with KomikoAI's terms of service.",
  },
  {
    id: 5,
    question: 'What image formats and sizes are supported?',
    answer:
      'The AI supports images in JPG and PNG formats. For best results, use images of similar dimensions and aspect ratios.',
  },
  {
    id: 6,
    question: 'How many frames can be interpolated?',
    answer:
      'You can adjust the interpolation factor from 1 to 8, which determines how many intermediate frames are generated between your two keyframes. Higher values create smoother but longer animations.',
  },
  {
    id: 7,
    question: 'What types of images work best for interpolation?',
    answer:
      'Images with similar compositions and clear corresponding elements work best. Avoid drastic changes in perspective or content between frames for optimal results.',
  },
  {
    id: 8,
    question: 'What are the limitations of AI frame interpolation?',
    answer:
      'While AI frame interpolation is powerful, it has some limitations:\n• Complex Movements: Very complex or dramatic changes between frames may produce artifacts\n• Artistic Style: The AI might struggle with maintaining consistent style in certain cases\n• Resolution: Very high-resolution images may require more processing time',
  },
];

export default function ToolsPage({ isMobile }: any) {
  // 在组件中定义状态
  const [interpolate, setInterpolate] = useState(7);

  const [inputImages, setInputImages] = useState<string[]>(['', '']);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // video results list
  const [resultVideos, setResultVideos] = useState<VideoData[]>([]);
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);

  const [videoHeights, setVideoHeights] = useState<number[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // last video添加 ref
  const lastVideoRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const btnText = useBtnText('Blend Frames', 'Blend Frames');
  const { submit: openModal } = useOpenModal();

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

  // 从 Supabase 加载 视频
  const fetchVideos = async (needMerge?: boolean) => {
    try {
      const response = await videosAPI({
        method: 'getVideos',
        tool: 'frame_interpolation',
      });
      if (response.data) {
        const subs = await filterValidVideo(response.data);
        if (!needMerge) {
          setResultVideos(subs);
          return;
        }
        setResultVideos(resultVideos => {
          const oldData = mergeMediaData(
            resultVideos,
            subs,
            'video_url',
          ) as VideoData[];
          return [...oldData];
        });
      }
    } catch (error: any) {
      console.error('fetchVideos failed', error);
      if (error.message.indexOf('401')) {
        return;
      }
      toast.error('Fetch videos failed', {
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
    isAuth && fetchVideos();
  }, [isAuth]);

  // 第二个 useEffect：监听 resultVideos 变化并滚动
  useEffect(() => {
    if (resultVideos.length > 0) {
      lastVideoRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [resultVideos]);

  /* ******************************  点击删除视频相关    *****************************  */
  // 点击删除按钮时保存视频 ID
  const handleDeleteClick = (videoId: number) => {
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
          tool: 'frame_interpolation',
          id: videoToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteVideo success');
          deleteMediaData(setResultVideos, videoToDelete);
          // await fetchVideos();  // 重新加载视频列表
          toast.success('Delete success', {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteVideo failed');
          toast.error('Delete failed', {
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

  const handleChange = (index: number) => (url: string) => {
    const newImages = [...inputImages];
    newImages[index] = url;
    setInputImages(newImages);
  };

  const refreshList = async (id: number, resultUrl: string) => {
    await dispatchGenerated(id);
    setResultVideos(resultVideos => {
      const index = resultVideos.findIndex(d => d.id === id);
      resultVideos[index] = {
        id,
        video_url: resultUrl,
      };
      if (index > -1) {
        return [...resultVideos];
      }
      return resultVideos;
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    // TODO: Handle image submission and get result
    console.log('Processing images...');
    if (profile.credit < FRAME_INTERPOLATION) {
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

      const id = getId();
      setResultVideos([
        {
          id,
          video_url: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultVideos,
      ]);
      setLoading(false);

      // 3. 调用 API 处理两张图片
      const startTime = Date.now();
      const resultUrl = await interpolateAPI(
        uploadedUrls[0],
        uploadedUrls[1],
        interpolate, // 根据需求设置 prompt
      );
      setProfile(profile => ({
        ...profile,
        credit: profile.credit - FRAME_INTERPOLATION,
      }));
      await refreshList(id, resultUrl);
      console.log(
        `API 处理时间: ${((Date.now() - startTime) / 1000).toFixed(2)}秒`,
      );
      console.log('resultUrl', resultUrl);
      // 4. 上传视频到 Supabase
      const response = await videosAPI({
        method: 'generateVideo',
        tool: 'frame_interpolation',
        video_url: resultUrl,
        id: null,
      });
      if (response.data && response.data.length > 0) {
        console.log('generateVideo success');
        const data = response.data[0];
        setResultVideos(resultVideos => {
          const index = resultVideos.findIndex(d => d.id === id);
          if (index > -1) {
            resultVideos[index] = {
              id: data.id,
              video_url: data.video_url,
            };
            return [...resultVideos];
          }
          return resultVideos;
        });
        // await fetchVideos();  // 重新加载视频列表
        toast.success('frame interpolation success', {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.success('frame interpolation failed', {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }

      // const videoUrl = await uploadVideo("https://replicate.delivery/czjl/T4lTHoDdlCpEB9zWxiove8FUyce3QtOkM0PGafASLpeBaKnPB/out.mp4");
      // console.log("videoUrl", videoUrl);
    } catch (error) {
      console.error('frame interpolation failed:', error);
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
      toast.error('frame interpolation failed', {
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

  return (
    // Add min-h-screen to ensure minimum screen height, overflow-y-auto to allow vertical scrolling
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen bg-background'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        <h1 className='mt-2 mb-3 text-4xl font-bold text-center'>
          AI Frame Blending & Frame Interpolation
        </h1>
        <p className='pr-20 pl-20 mb-6 text-center text-muted-foreground text-md'>
          Create smooth animations between keyframes with AI frame blending. Our
          advanced AI frame interpolation engine transforms static images into
          fluid animations by intelligently generating intermediate frames.
          Perfect for creators seeking professional AI video smoothing and
          frame-by-frame animation generation.
        </p>

        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Left input area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-5'>
            <Card className='bg-card p-6'>
              {/* <h2 className="mb-6 text-2xl font-bold">Input Images</h2> */}
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>Input Images</h2>
              </div>
              {inputImages.map((image, index) => (
                <div className='mb-6'>
                  <p className='mb-2'>Frame {index + 1}</p>
                  <UploadFile onChange={handleChange(index)}></UploadFile>
                </div>
              ))}

              {/* Prompt input */}
              <div className='mb-6'>
                <div className='flex justify-between mb-2'>
                  <p>Times To Interpolate </p>
                  <p>{interpolate} (min: 1, max: 8)</p>
                </div>
                <input
                  type='range'
                  min='1'
                  max='8'
                  value={interpolate}
                  onChange={e => setInterpolate(Number(e.target.value))}
                  className='w-full'
                />
              </div>
              {/* Submit button */}
              <Button
                isLoading={loading}
                color='primary'
                className='w-full'
                size='lg'
                onClick={handleSubmit}
                isDisabled={
                  inputImages.length <= 1 || inputImages.some(image => !image)
                }>
                {btnText}
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-card'>
                    -{FRAME_INTERPOLATION}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='bg-card p-6 h-full'>
              <h2 className='mb-6 text-2xl font-bold'>Video Results</h2>
              <div className='w-full max-h-[calc(728px-7rem)] flex flex-col'>
                <div className='overflow-y-auto flex-1'>
                  {resultVideos?.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6'>
                      {resultVideos.map((video, index) => (
                        <ResultCard
                          key={video.id}
                          data={video}
                          handleDownload={handleDownload}
                          handleDelete={handleDeleteClick}
                          handleLoadedMetadata={handleLoadedMetadata}
                          index={index}
                          videoRefs={videoRefs}
                          type='video'
                          isExample={video.id === -1}
                          tool='frame-interpolation'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground'>
                      Results will be displayed here
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Add SEO Section after main content */}
        <div className='flex flex-col justify-center items-center mb-8'>
          <div className='col-span-12'>
            <h2 className='mt-16 mb-2 text-3xl font-bold text-center'>
              Create Professional Animations with AI Frame Interpolation
            </h2>
            <p className='pr-20 pl-20 mb-6 text-center text-muted-foreground text-md'>
              See how our AI frame blending technology transforms static images
              into smooth animations through intelligent frame interpolation
            </p>

            <div className='grid grid-cols-2 gap-4 mb-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4'>
              {[
                {
                  step: 1,
                  title: 'Step 1: Upload Two Images',
                  content:
                    'Upload two keyframe images that you want to animate between. These will be your start and end frames. Our frame interpolation AI will analyze these frames to create smooth transitions.',
                },
                {
                  step: 2,
                  title: 'Step 2: Adjust Settings',
                  content:
                    'Set the interpolation factor (1-8) to control how many frames are generated between your keyframes.',
                },
                {
                  step: 3,
                  title: 'Step 3: Generate AI Animation',
                  content:
                    "Click the 'Blend Frames' button to start the interpolation process. Wait for the AI frame blending engine to analyze and generate intermediate frames for smooth animation.",
                },
                {
                  step: 4,
                  title: 'Step 4: Download and Share',
                  content:
                    'Download your professionally interpolated animation, ready for use in videos, presentations or social media!',
                },
              ].map((step: any) => (
                <div
                  key={step.title}
                  className='flex flex-col p-4 h-full bg-card rounded-lg border border-border shadow-md stroke-2 stroke-black'>
                  <div className='flex justify-center items-center w-12 h-12 text-2xl font-bold text-primary-foreground rounded-full bg-primary-500'>
                    {step.step}
                  </div>
                  <div className='flex-grow mt-4'>
                    <h3 className='text-lg font-bold text-heading'>
                      {step.title}
                    </h3>
                    <p className='mt-2 text-muted-foreground text-md'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='grid grid-cols-12 gap-4 mt-8 mb-8'>
              <div className='col-span-12'>
                <h2 className='mt-16 mb-2 text-3xl font-bold text-center'>
                  AI Blend Frames Examples
                </h2>
                <p className='pr-20 pl-20 mb-6 text-center text-muted-foreground text-md'>
                  See AI blend frames results generated by KomikoAI users
                </p>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                  {/* Example image 1 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_media/bac532a0-d420-4291-bbf1-9ef68ecc99a6.webp' // Replace with actual example image path
                        alt='Example Input 1'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Input Image 1: Start Frame
                    </p>
                  </div>

                  {/* Example image 2 */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <img
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_media/24cdea23-dcca-4c84-bba7-6ae5522b61f1.webp' // Replace with actual example image path
                        alt='Example Input 2'
                        className='object-contain w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Input Image 2: End Frame
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col items-center'>
                    <div className='overflow-hidden mb-2 w-full h-48 rounded-lg'>
                      <video
                        src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/c1171fab-76b3-4c73-9e0d-8e03eed98651.webm'
                        controls
                        autoPlay
                        playsInline
                        loop
                        muted
                        className='object-contain w-full h-full'>
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      Output: Processed video
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className='mt-16 mb-4 text-3xl font-bold text-center'>
              Why Create Animations with AI Frame Interpolation
            </h2>
            <p className='px-8 mb-6 text-center text-muted-foreground text-md sm:px-20'>
              KomikoAI's AI Frame Interpolation technology revolutionizes
              animation creation by making it accessible to everyone, from
              beginners to professional animators.
            </p>
            <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
              {[
                {
                  title: 'AI Frame Interpolation',
                  content:
                    'Experience state-of-the-art AI animation generation with our intelligent frame blending system. Our deep learning models analyze motion patterns to create perfectly smooth transitions between frames.',
                },
                {
                  title: 'Professional Animation Results',
                  content:
                    'Create studio-quality animations with our AI frame interpolation technology. Perfect for professional motion graphics, social media content, and creative projects requiring smooth frame-by-frame animation.',
                },
                {
                  title: 'Fast AI Animation Creation',
                  content:
                    'Transform your animation workflow with our rapid AI frame generation. What traditionally takes hours of manual frame-by-frame work can now be completed in minutes using our intelligent blending technology.',
                },
                {
                  title: 'Intelligent Frame Analysis',
                  content:
                    "KomikoAI AI's frame interpolation technology analyzes motion patterns, creating fluid transitions by understanding position, rotation, scale, and lighting changes between frames.",
                },
                {
                  title: 'Advanced AI Blend Control',
                  content:
                    'Fine-tune your AI frame blending settings for optimal results. Our AI frame interpolation engine gives you complete control over animation smoothness and timing.',
                },
                {
                  title: 'Efficient Animation Workflow',
                  content:
                    "Integrate KomikoAI AI's frame blender seamlessly into your creative process. Focus on key frames while our AI video smoothing technology handles the complex interpolation work.",
                },
              ].map(feature => (
                <div
                  key={feature.title}
                  className='p-4 bg-card rounded-lg border border-border shadow-md shadow-primary-300'>
                  <h3 className='mb-2 text-lg font-semibold'>
                    {feature.title}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {feature.content}
                  </p>
                </div>
              ))}
            </div>
            <div className='my-12 md:my-16'>
              <MoreAITools category='animation' />
            </div>
            <h2 className='mt-16 mb-2 text-3xl font-bold text-center'>
              Expert Guide to AI Frame Blending
            </h2>
            <p className='pr-20 pl-20 mb-6 text-center text-muted-foreground text-md'>
              Learn everything about creating professional animations with
              KomikoAI AI's frame interpolation technology.
            </p>

            <div className='flex justify-center'>
              <div className='max-w-[1000px] w-full'>
                <FAQ faqs={faqs} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 确认对话框 */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Delete Confirmation</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this video? This action cannot be
            undone.
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='danger'
              onPress={handleConfirmDelete} // 使用保存的 videoToDelete
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
