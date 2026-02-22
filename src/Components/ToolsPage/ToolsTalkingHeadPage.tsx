import React, { useEffect, useRef, useState, useMemo } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  Button,
  Card,
  Spinner,
  Switch,
  Textarea,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Tooltip,
} from '@nextui-org/react';
import UploadFile from '../UploadFile';
import AudioInput from '../VideoGeneration/components/AudioInput';
import {
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
  filterValidImage,
  filterValidVideo,
} from './utils';
import { ResultCard } from './ResultCard';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import { ImageData, VideoData } from './utils';
import FAQ from '@/components/FAQ';
import {
  TALKING_HEAD_STANDARD,
  TALKING_HEAD_HIGH,
  calculateTalkingHeadCost,
  TalkingHeadQuality,
  HEDRA_CREDIT_TO_DOLLAR,
  HEDRA_540P_ZAPS_PER_SEC,
  HEDRA_720P_ZAPS_PER_SEC,
} from '../../../api/tools/_zaps';
import { BiSolidZap } from 'react-icons/bi';
import { FaDownload } from 'react-icons/fa';
import { BsInfoCircleFill } from 'react-icons/bs';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { useBtnText } from 'hooks/useBtnText';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import Image from 'next/image';
import { fetchProfile } from '@/api/profile';
import HedraIcon from '../../../public/images/icons/hedra.svg';
import { VideoToolsTabs } from './VideoToolsTabs';
import { useOpenModal } from 'hooks/useOpenModal';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import {
  processAudioDataUrl,
  isSupportedAudioFormat,
} from '../../utilities/audio';
import { useRouter } from 'next/router';
import { getCreateYoursData } from '../../utilities/tools';
import { Hero } from '../SEO';
const getId = genId();

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 添加文件大小限制常量
const MAX_IMAGE_SIZE_MB = 8; // 8MB limit for images
const MAX_AUDIO_SIZE_MB = 15; // 15MB limit for audio
const MAX_BASE64_SIZE_MB = 3.5; // 考虑 base64 编码后的大小限制 (约 4.5MB * 0.75)

// 图片压缩函数 - 从 ImageUploader.tsx 复制并调整
const compressImage = (
  imageSrc: string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context.'));
        return;
      }

      let width = img.width;
      let height = img.height;

      // 计算图片的新宽高
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height *= maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width *= maxHeight / height));
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 压缩图片质量并返回Blob
      canvas.toBlob(
        blob => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result as string);
              } else {
                reject(new Error('FileReader result is not a string.'));
              }
            };
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Image compression failed.'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image.'));
  });
};

// 检查 base64 字符串的大小（MB）
const getBase64SizeMB = (base64String: string): number => {
  // base64 编码会增加约 33% 的大小
  const base64Data = base64String.split(',')[1] || base64String;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
};

// 文件大小检查现在由各个Upload组件处理

// Model interface
interface HedraModel {
  id: string;
  name: string;
  description: string;
  type: string;
  aspect_ratios: string[];
  resolutions: string[];
  durations: string[];
  requires_start_frame: boolean;
  requires_audio_input: boolean;
  supports_tts: boolean;
  custom_resolution: null | string;
  price_details: {
    credit_cost: number;
    unit_scale: number;
    billing_unit: string;
  };
  dimensions: null | any;
  icon?: string;
}

// 调用 talking head API - 第一步：发送生成请求
const submitTalkingHeadRequest = async (params: {
  image: string; // Base64 encoded image
  audio?: string; // Base64 encoded audio file
  ttsText?: string; // Text for speech synthesis (alternative to audio)
  prompt?: string; // Optional style prompt for image processing
  modelId?: string; // Selected model ID
  resolution?: string; // Video resolution (540p, 720p)
  aspectRatio?: string; // Video aspect ratio (1:1, 16:9, 9:16)
  audioDuration?: number; // Audio duration for timeout calculation
  meta_data?: any; // Meta data for the generation
}): Promise<{ id: string; status: string }> => {
  const formData = new FormData();

  if (params.image) formData.append('image', params.image);

  if (params.audio) {
    try {
      const { dataUrl } = processAudioDataUrl(params.audio);
      formData.append('audio', dataUrl);
    } catch (error: any) {
      console.error('Error processing audio data:', error);
      throw new Error(
        'Failed to process audio data: ' + (error?.message || String(error)),
      );
    }
  }

  if (params.ttsText) formData.append('ttsText', params.ttsText);
  if (params.prompt) formData.append('prompt', params.prompt);
  if (params.modelId) formData.append('modelId', params.modelId);
  if (params.resolution) formData.append('resolution', params.resolution);
  if (params.aspectRatio) formData.append('aspectRatio', params.aspectRatio);
  if (params.audioDuration)
    formData.append('audioDuration', params.audioDuration.toString());
  if (params.meta_data)
    formData.append('meta_data', JSON.stringify(params.meta_data));

  try {
    const response = await fetch('/api/tools/talking-head', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: `API request failed: ${response.status}` }));
      console.error('API error:', errorData);
      throw new Error(
        errorData.error || `API request failed: ${response.status}`,
      );
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error || 'no zaps');
    }

    return {
      id: data.id,
      status: data.status || 'processing',
    };
  } catch (error) {
    console.error('Error in talking head API:', error);
    throw error;
  }
};

// 调用 talking head 状态查询 API - 第二步：轮询状态
const checkTalkingHeadStatus = async (
  id: string,
): Promise<{
  status: string;
  output?: string;
  error?: string;
  progress: number;
  currentStep: string;
}> => {
  try {
    const response = await fetch(`/api/tools/talking-head-status?id=${id}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: `Status check failed: ${response.status}` }));
      throw new Error(
        errorData.error || `Status check failed: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking talking head status:', error);
    throw error;
  }
};

// 轮询状态直到完成
const pollTalkingHeadStatus = async (
  id: string,
  onProgress?: (progress: number, currentStep: string) => void,
  maxAttempts = 240, // 20分钟，每5秒轮询一次
): Promise<string> => {
  let attempts = 0;

  // production not log
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[${id}] Starting status polling with ${maxAttempts} max attempts`,
    );
  }

  while (attempts < maxAttempts) {
    try {
      const statusData = await checkTalkingHeadStatus(id);

      // 更新进度
      if (onProgress) {
        onProgress(statusData.progress, statusData.currentStep);
      }

      // 检查完成状态（包括更多可能的状态值）
      if (
        statusData.status === 'completed' ||
        statusData.status === 'complete' ||
        statusData.status === 'success' ||
        statusData.status === 'succeeded'
      ) {
        if (statusData.output) {
          console.log(
            `[${id}] Generation completed successfully with output URL`,
          );
          return statusData.output;
        } else {
          // 完成但没有输出，继续等待
          console.warn(
            `[${id}] Generation completed but no output available, continuing to poll... (attempt ${
              attempts + 1
            }/${maxAttempts})`,
          );
        }
      } else if (
        statusData.status === 'failed' ||
        statusData.status === 'error' ||
        statusData.status === 'cancelled'
      ) {
        const errorMsg = statusData.error || 'Generation failed';
        console.error(`[${id}] Generation failed: ${errorMsg}`);
        throw new Error(errorMsg);
      } else {
        // 处理中状态
        // console.log(`[${id}] Generation in progress: ${statusData.currentStep}`)
      }

      // 等待5秒后继续
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error(
        `[${id}] Error during status polling (attempt ${attempts + 1}):`,
        error,
      );
      attempts++;
      if (attempts >= maxAttempts) {
        console.error(
          `[${id}] Polling timed out after ${maxAttempts} attempts`,
        );
        throw error;
      }
      // 等待5秒后重试
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.error(`[${id}] Generation timed out after ${maxAttempts} attempts`);
  throw new Error('Generation timed out');
};

// 添加在enum部分
enum VideoResolution {
  '540p' = '540p',
  '720p' = '720p',
}

enum AspectRatio {
  '1:1' = '1:1',
  '16:9' = '16:9',
  '9:16' = '9:16',
}

// 添加新的费用计算函数 - 统一使用标准计算函数
const calculateModelCost = (
  selectedModel: string,
  models: HedraModel[],
  selectedResolution: string,
  audioDuration: number,
): number => {
  return calculateTalkingHeadCost(
    TalkingHeadQuality.HEDRA,
    selectedResolution,
    audioDuration,
  );
};

const ToolsTalkingHeadPage = ({ isMobile }: { isMobile?: boolean }) => {
  const { t } = useTranslation(['ai-talking-head', 'toast']);
  const router = useRouter();

  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [resultVideos, setResultVideos] = useState<(ImageData | VideoData)[]>([
    {
      id: -1,
      video_url: '/images/examples/ai-talking-head/callum.webm',
      prompt: t('common:exampleResult'),
    },
  ]);
  // 存储每个生成任务的进度
  const [generationProgress, setGenerationProgress] = useState<{
    [key: number]: number;
  }>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<number | null>(null);
  const [models, setModels] = useState<HedraModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  // Set default resolution to 540p
  const [selectedResolution, setSelectedResolution] = useState<string>('540p');
  const [selectedAspectRatio, setSelectedAspectRatio] =
    useState<string>('16:9');
  // 记录检测到的音频长度（秒）
  const [audioDuration, setAudioDuration] = useState<number>(10); // 默认10秒

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const [isPublic, setIsPublic] = useState(true);

  const btnText = useBtnText(t('buttons.generate'), t('buttons.generate'));
  const { submit: openModal } = useOpenModal();

  const { inputImage, setInputImage, hasMedia, mediaItem, isFromTool } =
    useProcessInitialImage();

  // 从 Supabase 加载视频
  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/tools/talking-head', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method: 'getVideos' }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch videos:', response.status);
        return;
      }

      const data = await response.json();
      if (data.data) {
        if (data.data.length === 0) {
          return;
        }
        // 转换数据格式以便验证和前端显示
        const videosForValidation = data.data.map(video => ({
          ...video,
          video_url: video.url_path || video.video_url, // 确保视频URL字段兼容
          status: video.status || GenerationStatus.DONE, // 确保状态已设置
          width: 480, // 添加默认宽度
          height: 640, // 添加默认高度
        }));

        const filteredVideos = await filterValidVideo(videosForValidation);
        setResultVideos(filteredVideos.filter(d => d.id !== -1));
      }
    } catch (error: any) {
      console.error('fetchVideos failed', error);
      // 静默处理，不显示错误提示
    }
  };

  useEffect(() => {
    if (isAuth) {
      fetchVideos();
    }
  }, [isAuth]);

  // // Computed property to check if current model supports TTS
  // const currentModelSupportsTTS = useMemo(() => {
  //   const model = models.find(m => m.id === selectedModel);
  //   return model?.supports_tts || false;
  // }, [selectedModel, models]);

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

  // 确认删除
  const handleConfirmDelete = async () => {
    setDeleteModalOpen(false);
    if (videoToDelete) {
      try {
        const response = await fetch('/api/tools/talking-head', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'deleteVideo',
            id: videoToDelete,
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('Failed to delete video:', response.status);
          toast.error(t('toast:common.deleteFailed', 'Failed to delete video'));
          return;
        }

        const data = await response.json();
        if (data.success) {
          console.log('deleteVideo success');
          deleteMediaData(setResultVideos, videoToDelete);
          toast.success(
            t('toast:common.deleteSuccess', 'Video deleted successfully'),
          );
        } else {
          console.log('deleteVideo failed');
          toast.error(t('toast:common.deleteFailed', 'Failed to delete video'));
        }
        setVideoToDelete(null);
      } catch (error) {
        console.error('deleteVideo failed', error);
        toast.error(t('toast:common.deleteFailed', 'Failed to delete video'));
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setSelectedImage(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setInputImage(imageUrl);
    } else {
      toast.error(
        t('toast:common.invalidImage', 'Please select a valid image file'),
      );
    }
  };

  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  // 检测上传音频文件的长度
  const detectAudioDuration = (file: File) => {
    if (!file) return;

    // Create a temporary URL to read the audio duration
    const audioElement = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audioElement.addEventListener('loadedmetadata', () => {
      // Get audio duration and round up to the nearest second
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        const durationInSeconds = Math.ceil(audioElement.duration);
        // Limit to 1-120 second range
        const limitedDuration = Math.min(120, Math.max(1, durationInSeconds));
        setAudioDuration(limitedDuration);

        // 提示用户音频被截断
        if (durationInSeconds > 120) {
          toast.error(
            t(
              'toast:talking-head.audioDurationExceeded',
              'Audio duration exceeds 2 minutes limit. Only the first 2 minutes will be used.',
            ),
          );
        }
      } else {
        console.warn('Could not detect audio duration, using default (10s)');
        setAudioDuration(10);
      }
      URL.revokeObjectURL(objectUrl);
    });

    audioElement.addEventListener('error', e => {
      console.error('Error reading audio file duration:', e);
      console.warn('Using default duration (10s) due to error');
      setAudioDuration(10);
      URL.revokeObjectURL(objectUrl);
    });

    // Load the audio - special handling for WebM
    if (file.type.includes('webm')) {
      console.log('WebM format detected, handling specially');
      // WebM files might need different handling for duration detection
      // Still try to load it as audio, but be prepared for errors
    }

    audioElement.src = objectUrl;
  };

  const handleAudioChange = (file: File | null) => {
    // Validate audio file format
    if (file) {
      // Check for supported audio formats
      if (
        !file.type.startsWith('audio/') &&
        !file.type.startsWith('video/webm')
      ) {
        toast.error(
          t(
            'toast:talking-head.invalidAudio',
            'Invalid audio format. Please use MP3 or WAV',
          ),
        );
        return;
      }

      // Detect the uploaded audio file duration
      detectAudioDuration(file);

      // Update state with the new audio file
      setSelectedAudio(file);

      // Log the state update
      console.log(
        `Audio state updated: ${file.name} (${file.type}), current duration estimate: ${audioDuration}s`,
      );
    } else {
      // If file is removed, reset to default duration and clear audio
      clearAllAudio();
    }
  };

  const clearAllAudio = () => {
    setSelectedAudio(null);
    setAudioDuration(10);
    // Log this state change for debugging
    console.log('All audio cleared, price calculation reset to default (10s)');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (url: string) => {
    if (url) {
      // 将 url 转换为 base64
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        setPreviewImage(url);
        setSelectedImage(new File([blob], 'image.jpg', { type: blob.type }));
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }
  };

  // 刷新结果列表
  const refreshList = async (id: number, resultUrl: string) => {
    // 先分发生成完成事件，这会触发进度条从GENERATING到100%
    await dispatchGenerated(id);

    // 更新视频列表，将状态从GENERATING更新为DONE
    setResultVideos(videos => {
      const index = videos.findIndex(d => d.id === id);
      if (index > -1) {
        // 确保状态从 GENERATING 更新为 DONE
        const updatedVideo = {
          ...videos[index],
          id,
          url_path: resultUrl,
          video_url: resultUrl, // 确保同时更新 video_url 和 url_path
          status: GenerationStatus.DONE,
          width: 480, // 添加默认宽度
          height: 640, // 添加默认高度
        };

        // 创建新数组，替换对应索引的项目
        const updatedVideos = [...videos];
        updatedVideos[index] = updatedVideo;

        return updatedVideos;
      }
      return videos;
    });
  };

  // Fetch available models
  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch('/api/tools/talking-head/models', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data: HedraModel[] = await response.json();

      // Filter for video models only
      const videoModels = data.filter(
        model => model.type === 'video' && model.requires_audio_input,
      );

      if (videoModels.length === 0) {
        throw new Error('No suitable models found');
      }

      // Add text-to-speech support flag based on model name/description
      const modelsWithTTS = videoModels.map(model => {
        // Check if model name or description contains text-to-speech related keywords
        const hasTTS =
          (model.name &&
            (model.name.toLowerCase().includes('tts') ||
              model.name.toLowerCase().includes('text-to-speech') ||
              model.name.toLowerCase().includes('text to speech'))) ||
          (model.description &&
            (model.description.toLowerCase().includes('tts') ||
              model.description.toLowerCase().includes('text-to-speech') ||
              model.description.toLowerCase().includes('text to speech')));

        return {
          ...model,
          supports_tts: Boolean(hasTTS), // Ensure it's a boolean value
          icon: HedraIcon.src, // Add icon path to each model
        };
      });

      setModels(modelsWithTTS);
      // 确保设置默认选中的模型
      if (modelsWithTTS.length > 0) {
        setSelectedModel(modelsWithTTS[0].id);
      }
    } catch (error) {
      console.error('Error fetching models:', error);

      toast.error(
        t('toast:talking-head.modelsFetchFailed', 'Failed to fetch models'),
      );
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

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

        if (generation.meta_data) {
          const metaData = generation.meta_data;
          if (metaData) {
            setSelectedResolution(metaData.resolution);
            setSelectedAspectRatio(metaData.aspectRatio);
          }
        }

        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);

  const handleSubmit = async () => {
    // if (!isAuth) {
    //   toast.error(
    //     t('toast:talking-head.login', 'Please sign in to use this feature'),
    //   );
    //   return;
    // }

    if (!selectedImage) {
      toast.error(
        t('toast:talking-head.imageRequired', 'Please select an image'),
      );
      return;
    }

    if (!selectedAudio) {
      toast.error(
        t('toast:talking-head.audioRequired', 'Please select an audio file'),
      );
      return;
    }

    setIsLoading(true);
    try {
      // 获取选中模型
      const selectedModelData = models.find(
        model => model.id === selectedModel,
      );

      // 使用自动检测的音频时长
      const estimatedDurationInSeconds = audioDuration;

      // 计算费用
      const cost = calculateModelCost(
        selectedModel,
        models,
        selectedResolution,
        estimatedDurationInSeconds,
      );

      if ((profile?.credit || 0) < cost) {
        // toast.error(t('toast:talking-head.noCredit', 'Insufficient credits'));
        openModal('pricing');
        setIsLoading(false);
        return;
      }

      // 添加生成中状态，确保正确设置 status 为 GENERATING
      const id = getId();

      // 创建一个带有完整属性的生成中视频对象
      const generatingVideo = {
        id,
        url_path: '',
        video_url: '',
        status: GenerationStatus.GENERATING,
        prompt: prompt || '',
        width: 480, // 添加默认宽度
        height: 640, // 添加默认高度
      };

      setResultVideos([
        generatingVideo,
        ...resultVideos.filter(d => d.id !== -1),
      ]);

      // Convert image to base64 with compression
      let imageBase64 = await fileToBase64(selectedImage);

      // 检查 base64 图片大小并在需要时压缩
      let imageSizeMB = getBase64SizeMB(imageBase64);

      if (imageSizeMB > MAX_BASE64_SIZE_MB * 0.6) {
        // 如果超过限制的 60%，开始压缩
        toast(t('toast:talking-head.compressingImage'), { duration: 2000 });

        try {
          // 根据文件大小调整压缩参数
          let quality = 0.8;
          let maxWidth = 1024;
          let maxHeight = 1024;

          if (imageSizeMB > MAX_BASE64_SIZE_MB * 0.8) {
            quality = 0.6;
            maxWidth = 768;
            maxHeight = 768;
          }

          const compressedBase64 = await compressImage(
            imageBase64,
            maxWidth,
            maxHeight,
            quality,
          );
          const compressedSizeMB = getBase64SizeMB(compressedBase64);

          if (compressedSizeMB > MAX_BASE64_SIZE_MB) {
            // 如果还是太大，进一步压缩
            const furtherCompressed = await compressImage(
              compressedBase64,
              512,
              512,
              0.5,
            );
            const finalSizeMB = getBase64SizeMB(furtherCompressed);

            if (finalSizeMB > MAX_BASE64_SIZE_MB) {
              throw new Error(t('toast:talking-head.imageCompressionFailed'));
            }

            imageBase64 = furtherCompressed;
          } else {
            imageBase64 = compressedBase64;
          }
        } catch (compressionError: any) {
          throw new Error(
            t('toast:talking-head.imageCompressionFailed') +
              ': ' +
              compressionError.message,
          );
        }
      }

      // API parameters
      const apiParams: any = {
        image: imageBase64,
        prompt,
        modelId: selectedModel,
        resolution: selectedResolution,
        aspectRatio: selectedAspectRatio,
        audioDuration: audioDuration, // 传递音频时长用于动态超时
      };

      // Add audio data
      if (selectedAudio) {
        // Validate audio format
        if (!isSupportedAudioFormat(selectedAudio.type)) {
          throw new Error(t('toast:talking-head.invalidAudio'));
        }

        try {
          // Convert to base64
          const audioBase64 = await fileToBase64(selectedAudio);

          // 检查音频 base64 大小
          const audioSizeMB = getBase64SizeMB(audioBase64);
          console.log(`Audio base64 size: ${audioSizeMB.toFixed(2)}MB`);

          if (audioSizeMB > MAX_BASE64_SIZE_MB) {
            throw new Error(
              t('toast:talking-head.audioTooLarge', {
                maxSize: audioSizeMB.toFixed(1),
              }) + '. Please use a smaller audio file or shorter duration.',
            );
          }

          // Process audio data URL for consistent format
          const { dataUrl } = processAudioDataUrl(audioBase64);
          apiParams.audio = dataUrl;
        } catch (error: any) {
          console.error('Error processing audio file:', error);
          throw new Error(
            'Failed to process audio file: ' +
              (error?.message || 'Please try another format.'),
          );
        }
      } else {
        throw new Error('No audio file provided');
      }

      // 最后检查总的请求大小
      const totalRequestSize = JSON.stringify(apiParams).length / (1024 * 1024);
      console.log(`Total request size: ${totalRequestSize.toFixed(2)}MB`);

      if (totalRequestSize > 4) {
        // Vercel 限制通常是 4.5MB
        throw new Error(t('toast:talking-head.requestTooLarge'));
      }

      // Call the API - 第一步：发送生成请求
      const { id: predictionId } = await submitTalkingHeadRequest(apiParams);

      // Update credits (handled by the API)
      if (profile) {
        setProfile({
          ...profile,
          credit: (profile.credit || 0) - cost,
        });
      }

      // 第二步：开始轮询状态
      const videoUrl = await pollTalkingHeadStatus(
        predictionId,
        (progress, currentStep) => {
          // console.log(`Progress: ${progress}%, Step: ${currentStep}`)
          // 更新生成中视频的真实进度
          setResultVideos(videos =>
            videos.map(v =>
              v.id === id ? { ...v, realProgress: progress } : v,
            ),
          );
        },
      );

      toast.success(
        t(
          'toast:talking-head.success',
          'Talking head video generated successfully',
        ),
      );
      // 更新结果列表，确保正确设置视频状态
      await refreshList(id, videoUrl);
    } catch (error: any) {
      console.error('Error generating talking head video:', error);

      // 移除生成中状态
      setResultVideos(videos => {
        const newVideos = [...videos];
        const index = newVideos.findIndex(
          v => v.status === GenerationStatus.GENERATING,
        );
        if (index > -1) {
          newVideos.splice(index, 1);
        }
        return newVideos;
      });

      let errorMessage =
        error.message ||
        t('toast:talking-head.failure', 'Failed to generate video');

      // 特殊错误处理
      if (
        error.message?.includes('413') ||
        error.message?.includes('Request Entity Too Large')
      ) {
        errorMessage = t('toast:talking-head.filesSizeTooLarge');
      } else if (error.message?.includes('Request too large')) {
        errorMessage = t('toast:talking-head.requestTooLarge');
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPrompt('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setPreviewImage(undefined);
  };

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
      link.setAttribute('download', `talking-head-${Date.now()}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toast:common.downloadFailed', 'Failed to download video'));
    }
  };

  // FAQ 数据
  const faqs = [
    {
      id: 1,
      question: t('ai-talking-head:faq.q1'),
      answer: t('ai-talking-head:faq.a1'),
    },
    {
      id: 2,
      question: t('ai-talking-head:faq.q2'),
      answer: t('ai-talking-head:faq.a2'),
    },
    {
      id: 3,
      question: t('ai-talking-head:faq.q3'),
      answer: t('ai-talking-head:faq.a3'),
    },
    {
      id: 4,
      question: t('ai-talking-head:faq.q4'),
      answer: t('ai-talking-head:faq.a4'),
    },
    {
      id: 5,
      question: t('ai-talking-head:faq.q5'),
      answer: t('ai-talking-head:faq.a5'),
    },
    {
      id: 6,
      question: t('ai-talking-head:faq.q6'),
      answer: t('ai-talking-head:faq.a6'),
    },
  ];

  // Add a handleLoadedMetadata function
  const handleLoadedMetadata = (index: number) => {
    // Optional: Handle video metadata loaded
    console.log(`Video metadata loaded for index ${index}`);
  };

  return (
    <div className='overflow-y-auto pb-4 md:pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <Hero
          title={t('ai-talking-head:title')}
          description={t('ai-talking-head:description')}
        />

        <Modal
          isOpen={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          classNames={TOOL_CARD_STYLES.modalClassNames}>
          <ModalContent>
            {onClose => (
              <>
                <ModalHeader className='text-foreground'>
                  {t('ai-talking-head:modal.deleteTitle', 'Confirm Delete')}
                </ModalHeader>
                <ModalBody>
                  <p>
                    {t(
                      'ai-talking-head:modal.deleteMessage',
                      'Are you sure you want to delete this video? This action cannot be undone.',
                    )}
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant='light'
                    onPress={onClose}
                    className='transition-all duration-300 hover:bg-muted'>
                    {t('ai-talking-head:modal.cancel', 'Cancel')}
                  </Button>
                  <Button
                    color='danger'
                    onPress={() => {
                      handleConfirmDelete();
                      onClose();
                    }}
                    className='bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300 hover:from-red-600 hover:to-pink-600'>
                    {t('ai-talking-head:modal.delete', 'Delete')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        <div className='flex flex-col md:flex-row gap-4 md:gap-4 lg:gap-6'>
          {/* 左侧输入区域 */}
          <div className='w-full md:flex-none md:w-5/12 lg:w-5/12'>
            <Card
              className={`p-4 md:px-6 md:pt-4 md:pb-6 md:transition-all duration-300 rounded-xl ${TOOL_CARD_STYLES.inputCard}`}>
              <div className='mb-1 w-full overflow-hidden overflow-x-auto'>
                <VideoToolsTabs activeTab='talking-head' />
                {/* <Tooltip
                  content={t('ai-talking-head:upload.tooltip')}
                  color='primary'
                  className='hidden md:block'>
                  <span>
                    <BsInfoCircleFill className='text-primary-500 hidden md:block' />
                  </span>
                </Tooltip> */}
              </div>
              {isFromTool && hasMedia && (
                <div className='p-2 mb-4 text-sm text-blue-700 bg-blue-50 rounded-lg'>
                  <p>{t('common:from_other_tools')}</p>
                </div>
              )}
              {/* 1. Image Input */}
              <div className='mb-6 pt-2'>
                <UploadFile
                  onChange={handleImageChange}
                  type='image'
                  initialImage={inputImage || previewImage}
                  accept='.png,.jpg,.jpeg,.webp'
                  limit={MAX_IMAGE_SIZE_MB}
                  enforceLimit={false}
                />
                <div className='mt-2 text-xs text-muted-foreground'>
                  <p>
                    {t('ai-talking-head:upload.imageSizeInfo', {
                      maxSize: MAX_IMAGE_SIZE_MB,
                    })}
                  </p>
                </div>
              </div>
              {/* 2. Audio Input Section */}
              <AudioInput
                value={selectedAudio}
                onChange={handleAudioChange}
                label={t('ai-talking-head:audioInput.label')}
                accept='.mp3,.wav,.mpeg'
                maxDuration={120}
                maxSizeMB={MAX_AUDIO_SIZE_MB}
                hints={{
                  zapReminder: t('ai-talking-head:zapReminder'),
                  sizeInfo: t('ai-talking-head:upload.audioSizeInfo', {
                    maxSize: MAX_AUDIO_SIZE_MB,
                  }),
                }}
                t={key => t(`ai-talking-head:audioInput.${key}Tab`)}
                className='mb-6'
              />
              {/* 3. Prompt Input */}
              {/* 4. Aspect Ratio Options */}
              {(() => {
                const model = models.find(m => m.id === selectedModel);
                const aspectRatios = model?.aspect_ratios || [];

                if (aspectRatios.length > 0) {
                  return (
                    <div className='mb-4'>
                      <label className='block mb-2 font-bold text-foreground text-sm'>
                        {t('ai-talking-head:aspectRatio.label')}
                      </label>
                      <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                        {aspectRatios.includes('16:9') && (
                          <label
                            className={`flex items-center text-sm py-2 px-3 cursor-pointer border rounded-lg transition-all duration-300 hover:bg-primary-50 hover:border-primary-300 ${
                              selectedAspectRatio === '16:9'
                                ? 'bg-primary-50 border-primary-300'
                                : 'bg-card border-border'
                            }`}>
                            <input
                              type='radio'
                              name='aspectRatio'
                              value='16:9'
                              checked={selectedAspectRatio === '16:9'}
                              onChange={e =>
                                setSelectedAspectRatio(e.target.value)
                              }
                              className='mr-2 accent-primary-600'
                            />
                            <span>
                              16:9 ({t('ai-talking-head:aspectRatio.landscape')}
                              )
                            </span>
                          </label>
                        )}
                        {aspectRatios.includes('9:16') && (
                          <label
                            className={`flex items-center text-sm py-2 px-3 cursor-pointer border rounded-lg transition-all duration-300 hover:bg-primary-50 hover:border-primary-300 ${
                              selectedAspectRatio === '9:16'
                                ? 'bg-primary-50 border-primary-300'
                                : 'bg-card border-border'
                            }`}>
                            <input
                              type='radio'
                              name='aspectRatio'
                              value='9:16'
                              checked={selectedAspectRatio === '9:16'}
                              onChange={e =>
                                setSelectedAspectRatio(e.target.value)
                              }
                              className='mr-2 accent-primary-600'
                            />
                            <span>
                              9:16 ({t('ai-talking-head:aspectRatio.portrait')})
                            </span>
                          </label>
                        )}
                        {aspectRatios.includes('1:1') && (
                          <label
                            className={`flex items-center text-sm py-2 px-3 cursor-pointer border rounded-lg transition-all duration-300 hover:bg-primary-50 hover:border-primary-300 ${
                              selectedAspectRatio === '1:1'
                                ? 'bg-primary-50 border-primary-300'
                                : 'bg-card border-border'
                            }`}>
                            <input
                              type='radio'
                              name='aspectRatio'
                              value='1:1'
                              checked={selectedAspectRatio === '1:1'}
                              onChange={e =>
                                setSelectedAspectRatio(e.target.value)
                              }
                              className='mr-2 accent-primary-600'
                            />
                            <span>
                              1:1 ({t('ai-talking-head:aspectRatio.square')})
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {/* 5. Resolution Options */}
              {(() => {
                const model = models.find(m => m.id === selectedModel);
                const resolutions = model?.resolutions || [];

                if (resolutions.length > 0) {
                  return (
                    <div className='mb-4'>
                      <label className='block mb-2 font-bold text-foreground text-sm'>
                        {t('ai-talking-head:resolution.label')}
                      </label>
                      <div className='grid grid-cols-2 gap-2'>
                        {resolutions.map(res => (
                          <label
                            key={res}
                            className={`flex items-center py-2 px-3 text-sm cursor-pointer border rounded-lg transition-all duration-300 hover:bg-primary-50 hover:border-primary-300 ${
                              selectedResolution === res
                                ? 'bg-primary-50 border-primary-300'
                                : 'bg-card border-border'
                            }`}>
                            <input
                              type='radio'
                              name='resolution'
                              value={res}
                              checked={selectedResolution === res}
                              onChange={e =>
                                setSelectedResolution(e.target.value)
                              }
                              className='mr-2 accent-primary-600'
                            />
                            <span>{res}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Hidden model selection section */}
              <div className='hidden'>
                <Select
                  selectionMode='single'
                  isDisabled={isLoadingModels}
                  className='mb-4'
                  selectedKeys={[selectedModel]}
                  onChange={e => {
                    if (e.target.value) {
                      setSelectedModel(e.target.value);
                    }
                  }}
                  classNames={{
                    trigger:
                      'border-border hover:border-primary-500 transition-all duration-300',
                  }}
                  renderValue={items => {
                    const selectedItem = items[0];
                    const selectedKey = selectedItem?.key?.toString() || '';
                    const model = models.find(m => m.id === selectedKey);
                    return (
                      <div className='flex gap-2 items-center'>
                        {model?.icon && (
                          <div className='bg-gray-800 rounded-md p-0.5 flex items-center justify-center w-6 h-6'>
                            <img
                              src={model.icon}
                              alt={model.name}
                              className='w-5 h-5'
                            />
                          </div>
                        )}
                        <span>{model?.name || 'Model'}</span>
                      </div>
                    );
                  }}>
                  {models.map(model => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      textValue={model.name}
                      className='py-2'>
                      <div className='flex flex-col'>
                        <div className='flex gap-2 items-center'>
                          {model.icon && (
                            <div className='bg-gray-800 rounded-md p-0.5 flex items-center justify-center w-6 h-6'>
                              <img
                                src={model.icon}
                                alt={model.name}
                                className='w-5 h-5'
                              />
                            </div>
                          )}
                          <span className='font-medium text-md'>
                            {model.name}
                          </span>
                        </div>
                        <div className='flex justify-between items-center w-full'>
                          <div className='flex items-center mt-1'>
                            <BiSolidZap className='w-3.5 h-3.5 text-orange-400 mr-1' />
                            <span className='text-xs text-muted-foreground'>
                              {model.price_details.credit_cost}{' '}
                              {t('ai-talking-head:model.zaps', 'zaps')}
                            </span>
                          </div>
                          <div className='ml-2'>
                            <Chip
                              size='sm'
                              variant='flat'
                              color={
                                model.supports_tts ? 'success' : 'default'
                              }>
                              {model.supports_tts
                                ? t('ai-talking-head:model.supportsTTS')
                                : t('ai-talking-head:model.noTTS')}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
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

              <Button
                color='primary'
                className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
                size='lg'
                onPress={handleSubmit}
                isDisabled={!selectedImage || isLoading || !selectedAudio}
                isLoading={isLoading}>
                <span className='mr-2'>
                  {t('ai-talking-head:buttons.generate')}
                </span>
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-card'
                    classNames={{
                      content: 'dark:text-foreground',
                    }}>
                    -
                    {calculateModelCost(
                      selectedModel,
                      models,
                      selectedResolution,
                      audioDuration,
                    )}
                    /{profile?.credit || 0}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* 右侧结果区域 */}
          <div className='w-full md:flex-1 md:relative h-[600px] md:h-auto'>
            <Card
              className={`p-4 md:p-6 md:pt-4 h-full md:absolute md:inset-0 flex flex-col ${TOOL_CARD_STYLES.outputCard}`}>
              <h2 className='flex items-center mb-4 text-base font-bold text-primary-800 dark:text-primary-300'>
                <FaDownload className='mr-2 text-primary-600' />{' '}
                {t('ai-talking-head:result.title')}
              </h2>
              <div className='overflow-hidden flex-1 w-full'>
                <div className='overflow-y-auto pr-1 h-full'>
                  {resultVideos.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6 talking-head-results'>
                      {resultVideos.map((video, index) => {
                        // 处理两种可能的数据格式
                        const videoData = {
                          id: video.id,
                          video_url:
                            'video_url' in video
                              ? video.video_url
                              : (video as any).url_path,
                          prompt: video.prompt,
                          status: video.status,
                          width: 'width' in video ? video.width : 480,
                          height: 'height' in video ? video.height : 640,
                          // 确保包含 realProgress 属性
                          realProgress: (video as any).realProgress,
                        };

                        return (
                          <div key={videoData.id} className='mb-2 w-full'>
                            <ResultCard
                              key={videoData.id}
                              type='video'
                              index={index}
                              data={
                                {
                                  ...videoData,
                                  // Override any properties that affect display
                                  video_url: videoData.video_url, // Ensure video URL is passed
                                  // Add custom dimensions for portrait orientation
                                  height: 640,
                                  width: 480,
                                } as VideoData
                              }
                              handleDelete={handleDeleteClick}
                              handleDownload={handleDownload}
                              videoRefs={videoRefs}
                              handleLoadedMetadata={handleLoadedMetadata}
                              showPrompt={true}
                              externalProgress={(() => {
                                const realProgress = (videoData as any)
                                  .realProgress;
                                return realProgress;
                              })()}
                              totalCount={resultVideos.length}
                              isExample={videoData.id === -1}
                              tool='talking-head'
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground text-sm'>
                      {t(
                        'ai-talking-head:result.videoReady',
                        'Your video results will appear here',
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <h2 className='pt-10 md:pt-16 mt-16 mb-4 text-xl font-bold text-center text-primary-900  dark:text-primary-300 md:text-3xl'>
          {t('ai-talking-head:whatIsSection.title')}
        </h2>
        <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm'>
          {t('ai-talking-head:whatIsSection.description')}
        </p>

        <div className='py-8 md:py-16'>
          <h2 className='mb-6 text-xl font-bold text-center text-primary-900 dark:text-primary-300 md:text-3xl'>
            {t('ai-talking-head:examples.title')}
          </h2>
          <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm'>
            {t('ai-talking-head:examples.description')}
          </p>

          <div className='grid grid-cols-1 gap-10 md:grid-cols-2'>
            {/* Example 1 */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='grid grid-cols-2 gap-4 p-6'>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <Image
                      src='/images/examples/ai-talking-head/callum.webp'
                      alt={t('ai-talking-head:examples.inputCaption')}
                      width={768}
                      height={1024}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.inputCaption')}
                  </p>
                </div>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <video
                      src='/images/examples/ai-talking-head/callum.webm'
                      controls
                      playsInline
                      className='object-cover w-full h-full'>
                      {t('ai-talking-head:examples.outputCaption3')}
                    </video>
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.outputCaption3')}
                  </p>
                </div>
              </div>
              <div className='px-6 py-4 bg-primary-50'>
                <p className='font-medium text-primary-800 text-xs md:text-sm'>
                  {t('ai-talking-head:examples.model')}: Hedra Character 3 |{' '}
                  {t('ai-talking-head:examples.transcript')}: ¡Hola! Soy Elena
                  de Madrid. Me encanta la fotografía y viajar por el mundo.
                </p>
              </div>
            </div>
            {/* Example 2 */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='grid grid-cols-2 gap-4 p-6'>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <Image
                      src='/images/examples/ai-talking-head/emma.webp'
                      alt={t('ai-talking-head:examples.inputCaption')}
                      width={768}
                      height={1024}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.inputCaption')}
                  </p>
                </div>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <video
                      src='/images/examples/ai-talking-head/emma.webm'
                      controls
                      playsInline
                      className='object-cover w-full h-full'>
                      {t('ai-talking-head:examples.outputCaption4')}
                    </video>
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.outputCaption4')}
                  </p>
                </div>
              </div>
              <div className='px-6 py-4 bg-primary-50'>
                <p className='font-medium text-primary-800 text-xs md:text-sm'>
                  {t('ai-talking-head:examples.model')}: Hedra Character 3 |{' '}
                  {t('ai-talking-head:examples.transcript')}: Hey! I've been
                  thinking about you. Want to grab coffee this weekend?
                </p>
              </div>
            </div>
            {/* Example 3 */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='grid grid-cols-2 gap-4 p-6'>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <Image
                      src='/images/examples/ai-talking-head/ishibashi.webp'
                      alt={t('ai-talking-head:examples.inputAlt')}
                      width={768}
                      height={1024}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.inputCaption')}
                  </p>
                </div>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <video
                      src='/images/examples/ai-talking-head/ishibashi.webm'
                      controls
                      playsInline
                      className='object-cover w-full h-full'>
                      {t('ai-talking-head:examples.outputCaption1')}
                    </video>
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.outputCaption1')}
                  </p>
                </div>
              </div>
              <div className='px-6 py-4 bg-primary-50'>
                <p className='font-medium text-primary-800 text-xs md:text-sm'>
                  {t('ai-talking-head:examples.model')}: Hedra Character 3 |{' '}
                  {t('ai-talking-head:examples.transcript')}:
                  この本は先週読み終わったばかりです。とても感動的な物語で、特に最後のシーンが印象に残っています。あなたもぜひ読んでみてください。
                </p>
              </div>
            </div>
            {/* Example 4 */}
            <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
              <div className='grid grid-cols-2 gap-4 p-6'>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <Image
                      src='/images/examples/ai-talking-head/jessica.webp'
                      alt={t('ai-talking-head:examples.inputCaption')}
                      width={768}
                      height={1024}
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.inputCaption')}
                  </p>
                </div>
                <div className='flex flex-col'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-[3/4]'>
                    <video
                      src='/images/examples/ai-talking-head/jessica.webm'
                      controls
                      playsInline
                      className='object-cover w-full h-full'>
                      {t('ai-talking-head:examples.outputCaption2')}
                    </video>
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('ai-talking-head:examples.outputCaption2')}
                  </p>
                </div>
              </div>
              <div className='px-6 py-4 bg-primary-50'>
                <p className='font-medium text-primary-800 dark:text-primary-400 text-xs md:text-sm'>
                  {t('ai-talking-head:examples.model')}: Hedra Character 3 |{' '}
                  {t('ai-talking-head:examples.transcript')}:
                  あっ、この電車、渋谷行きですか？初めてこの駅を使うので、ちょっと不安で…教えてくれてありがとう！
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className='pt-10 md:pt-16 pb-10 md:pb-16 bg-background'>
          <h2 className='mb-10 text-xl font-bold text-center text-primary-900 dark:text-primary-300 md:text-3xl'>
            {t(
              'ai-talking-head:howToSection.title',
              'How to Use AI Talking Head Generator',
            )}
          </h2>
          <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                step: 1,
                title: t('ai-talking-head:steps.step1.title', 'Upload Image'),
                content: t(
                  'ai-talking-head:steps.step1.content',
                  'Upload a clear portrait photo with good lighting and a neutral expression.',
                ),
              },
              {
                step: 2,
                title: t('ai-talking-head:steps.step2.title'),
                content: t('ai-talking-head:steps.step2.content'),
              },
              {
                step: 3,
                title: t(
                  'ai-talking-head:steps.step3.title',
                  'Customize Options',
                ),
                content: t(
                  'ai-talking-head:steps.step3.content',
                  'Add an optional style prompt and choose between standard or high quality.',
                ),
              },
              {
                step: 4,
                title: t(
                  'ai-talking-head:steps.step4.title',
                  'Generate & Download',
                ),
                content: t(
                  'ai-talking-head:steps.step4.content',
                  'Click generate, wait for processing, and download your talking head video.',
                ),
              },
            ].map(step => (
              <div
                key={step.title}
                className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                  {step.step}
                </div>
                <div className='flex-grow'>
                  <h3 className='mb-3 text-lg font-bold text-primary-800 dark:text-primary-400 md:text-xl'>
                    {step.title}
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {step.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className='py-10 md:py-16 bg-gradient-to-b from-background rounded-xl to-primary-100'>
          <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-300 md:text-3xl'>
            {t(
              'ai-talking-head:whyChoose.title',
              'Why Choose Our AI Talking Head Generator',
            )}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm'>
            {t(
              'ai-talking-head:whyChoose.description',
              'Our AI Talking Head Generator offers several advantages that make it the preferred choice for creating realistic talking videos from still images.',
            )}
          </p>
          <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                title: t(
                  'ai-talking-head:features.feature1.title',
                  'Realistic Lip Sync',
                ),
                content: t(
                  'ai-talking-head:features.feature1.content',
                  'Advanced AI ensures precise synchronization between lip movements and speech for natural-looking results.',
                ),
                icon: '🎬',
              },
              {
                title: t('ai-talking-head:features.feature2.title'),
                content: t('ai-talking-head:features.feature2.content'),
                icon: '🎙️',
              },
              {
                title: t(
                  'ai-talking-head:features.feature3.title',
                  'High Quality Option',
                ),
                content: t(
                  'ai-talking-head:features.feature3.content',
                  'Choose between standard and high quality rendering depending on your needs and preferences.',
                ),
                icon: '✨',
              },
              {
                title: t(
                  'ai-talking-head:features.feature4.title',
                  'Fast Processing',
                ),
                content: t(
                  'ai-talking-head:features.feature4.content',
                  'Our optimized AI generates talking head videos quickly without compromising on quality.',
                ),
                icon: '⚡',
              },
              {
                title: t(
                  'ai-talking-head:features.feature5.title',
                  'Easy to Use',
                ),
                content: t(
                  'ai-talking-head:features.feature5.content',
                  'Simple interface makes it easy for anyone to create professional-looking talking head videos without technical expertise.',
                ),
                icon: '👌',
              },
              {
                title: t(
                  'ai-talking-head:features.feature6.title',
                  'Style Customization',
                ),
                content: t(
                  'ai-talking-head:features.feature6.content',
                  'Add style prompts to guide the AI in creating videos with specific moods or presentation styles.',
                ),
                icon: '🎨',
              },
            ].map(feature => (
              <div
                key={feature.title}
                className='p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                <div className='flex items-center mb-4'>
                  <span className='mr-3 text-xl md:text-2xl'>
                    {feature.icon}
                  </span>
                  <h3 className='text-lg font-semibold text-primary-800 dark:text-primary-400 md:text-xl'>
                    {feature.title}
                  </h3>
                </div>
                <p className='text-muted-foreground text-sm'>
                  {feature.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 其他 AI 工具 */}
        <div className='my-12 md:my-16'>
          <MoreAITools category='animation' />
        </div>

        {/* FAQ 部分 */}
        <div className='py-14 md:py-16'>
          <h2 className='mb-2 text-xl font-bold text-center text-primary-900 dark:text-primary-300 md:text-3xl'>
            {t('ai-talking-head:faq.title')}
          </h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm'>
            {t(
              'ai-talking-head:faq.description',
              'Explore common questions about our AI Talking Head Generator, including its features, capabilities, and how it can revolutionize your video creation process.',
            )}
          </p>

          <div className='flex justify-center'>
            <div className='max-w-[1000px] w-full'>
              <FAQ faqs={faqs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsTalkingHeadPage;
