import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Card,
  Input,
  Textarea,
  Button,
  NextUIProvider,
  Divider,
  Chip,
  Checkbox,
} from '@nextui-org/react';
import {
  appStateAtom,
  CNodeType,
  exportImageAtom,
  postContentAtom,
  postGeneratedImageUrlsAtom,
  postTitleAtom,
  authAtom,
  loginModalAtom,
  profileAtom,
} from '../state';
import { Header } from '../Components/Header';
import { useAtom, useAtomValue } from 'jotai';
import { Analytics } from '@vercel/analytics/react';
import { addWatermark, downloadURI, toastError } from '../utilities';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';
import { HiOutlineDownload } from 'react-icons/hi';
import { IconX, IconCloudUpload, IconShare3 } from '@tabler/icons-react';
import { Sidebar } from '../Components/Sidebar';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { PublicVisibilityToggle } from '../Components/PublicVisibilityToggle/PublicVisibilityToggle';
import { uploadFile, migrateMediaFromReplicate } from '@/utils/index';
import { TagSelector, type Tag } from '../Components/TagSelector';
import { useLoginModal } from '../hooks/useLoginModal';

import { FiImage, FiVideo } from 'react-icons/fi';
import { uploadFileWithUppy, validateFile } from '../utilities/uppyUpload';
import { compressImage } from '../utilities/mediaCompression';
import {
  extractVideoFirstFrame,
  extractVideoLastFrame,
} from '../utilities/video/firstFrameExtractor';
// import { quickCompressVideo } from '../utilities/webmVideoCompression';
import { cleanQualityModifiers } from '../utilities/promptUtils';
import { RiPushpinLine, RiTranslate } from 'react-icons/ri';
import { uniqWith } from 'lodash-es';
import { POSITIVE_PROMPT } from '../utilities/tools';
import { CHARACTER_MENTION_REGEX } from '../constants';
import { ERROR_CODES } from '../../api/_constants';
// 定义ROLES常量，避免导入问题
const ROLES = {
  ADMIN: 1,
} as const;

const extractFrameFromVideo = async ({
  pendingFile,
  t,
  mediaUrls,
}: {
  pendingFile: File | string;
  t?: TFunction | any;
  mediaUrls: string[];
}) => {
  try {
    // 提取视频第一帧
    const firstFrameDataUrl = await extractVideoFirstFrame(pendingFile, 0.9);

    // 将base64转换为blob
    const firstResponse = await fetch(firstFrameDataUrl);
    const firstBlob = await firstResponse.blob();

    // 创建第一帧文件对象
    const firstFrameFile = new File(
      [firstBlob],
      `frame_first_${uuidv4()}.jpg`,
      {
        type: 'image/jpeg',
      },
    );

    // 生成帧图片的路径（首帧和末帧复用年份和月份）
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const firstFrameFileName = `frame_first_${Date.now()}_${uuidv4()}.jpg`;
    const firstFramePath = `uploads/${year}/${month}/images/${firstFrameFileName}`;

    // 上传第一帧图片
    const firstFrameUploadResult = await uploadFileWithUppy(
      firstFrameFile,
      firstFramePath,
    );

    // 将第一帧图片添加到images数组的最后
    mediaUrls.push(firstFrameUploadResult);

    // 提取视频最后一帧（用于 NSFW 检测）
    const lastFrameDataUrl = await extractVideoLastFrame(pendingFile, 0.9);

    const lastResponse = await fetch(lastFrameDataUrl);
    const lastBlob = await lastResponse.blob();

    const lastFrameFile = new File([lastBlob], `frame_last_${uuidv4()}.jpg`, {
      type: 'image/jpeg',
    });

    const lastFrameFileName = `frame_last_${Date.now()}_${uuidv4()}.jpg`;
    const lastFramePath = `uploads/${year}/${month}/images/${lastFrameFileName}`;

    const lastFrameUploadResult = await uploadFileWithUppy(
      lastFrameFile,
      lastFramePath,
    );

    // 将最后一帧图片也添加到 images 数组的最后
    mediaUrls.push(lastFrameUploadResult);

    toast.dismiss();
  } catch (error) {
    console.error('Failed to extract video frame:', error);
    toast.dismiss();
    toast.error(
      t
        ? t('toast:error.frameExtractionFailed')
        : 'Failed to extract video frame',
      { duration: 3000 },
    );
    // 即使帧提取失败，也继续发布视频
  }
};

export const handlePublish = async (
  postTitle: string,
  postContent = '',
  exportMedia: string,
  postGeneratedImageUrls: { id: number; url: string }[] = [],
  setLoading?: any,
  // 标记展示的tag, 后期会废弃
  tags: string[] = [],
  hideMainFeed = false,
  showToast = true,
  t?: TFunction | any,
  mediaType: 'image' | 'video' | 'text' = 'image',
  pendingFile?: File | null,
  // 用于筛选分类的tag
  newTags?: Tag[],
  // 是否置顶
  isPinned = false,
  // 登录状态检查
  isAuth?: boolean,
  // 用户信息
  userProfile?: any,
  // 是否自动翻译（管理员可见）
  shouldTranslate?: boolean,
  hidePrompt = false,
  ocId?: string,
  source?: string,
  // eslint-disable-next-line max-params
) => {
  setLoading?.(true);

  // 如果有文件需要上传，必须先检查登录状态
  if (pendingFile && !isAuth) {
    setLoading?.(false);
    const errorMessage = t
      ? t('toast:error.loginRequired')
      : 'Please login to upload files';
    if (showToast) {
      toast.error(errorMessage);
    }
    throw new Error(errorMessage);
  }

  let mediaUrls: string[] = [];

  // 如果有待上传的文件，先压缩再上传
  if (pendingFile) {
    // 显示压缩进度提示
    const compressionToast = toast.loading(
      t ? t('toast:info.compressing') : 'Compressing file...',
    );

    try {
      const fileSizeMB = pendingFile.size / (1024 * 1024);

      if (fileSizeMB > 20) {
        toast.loading(
          t
            ? t('toast:info.processingLargeFile', {
              size: Math.round(fileSizeMB),
            })
            : `Processing large file (${Math.round(fileSizeMB)}MB)... This may take a while.`,
          { id: compressionToast },
        );
      }

      const validation = await validateFile(pendingFile);
      if (!validation.isValid) {
        toast.error(validation.error || 'File Validation Failed');
        throw new Error(validation.error || 'File Validation Failed');
      }

      // 压缩媒体文件
      let fileToUpload = pendingFile;
      let originalDuration: number | undefined;

      if (pendingFile.type.startsWith('image/')) {
        toast.loading(
          t
            ? t('toast:info.compressingFile', { progress: 10 })
            : 'Compressing image...',
          { id: compressionToast },
        );

        try {
          fileToUpload = await compressImage(pendingFile, {
            maxWidth: 1080,
            maxHeight: 1080,
            quality: 0.85,
          });
        } catch (compressionError) {
          console.warn('⚠️ 图片压缩失败，使用原文件:', compressionError);
          // 压缩失败时使用原文件
          fileToUpload = pendingFile;
        }
      } else if (pendingFile.type.startsWith('video/')) {
        // const fileSizeMB = pendingFile.size / (1024 * 1024);
        // const duration = validation.fileInfo?.duration || 0;

        // TODO: 使用freeconvert api 压缩
        // // 压缩条件：文件小于50MB且时长小于60秒的视频
        // if (fileSizeMB < 50 && duration < 60) {
        //   toast.loading(
        //     t
        //       ? t('toast:info.compressingFile', { progress: 15 })
        //       : 'Compressing video...',
        //     { id: compressionToast },
        //   );

        //   try {
        //     const compressionResult = await quickCompressVideo(
        //       pendingFile,
        //       (progress: number) => {
        //         const displayProgress = Math.round(15 + progress * 0.3); // 15-45%
        //         toast.loading(
        //           t
        //             ? t('toast:info.compressingFile', {
        //                 progress: displayProgress,
        //               })
        //             : `Compressing video... ${displayProgress}%`,
        //           { id: compressionToast },
        //         );
        //       },
        //     );
        //     fileToUpload = compressionResult.file;
        //     originalDuration = compressionResult.originalDuration;
        //   } catch (compressionError) {
        //     console.warn('⚠️ 视频压缩失败，使用原文件:', compressionError);
        //     // 压缩失败时使用原文件
        //     fileToUpload = pendingFile;
        //   }
        // }

        // 暂时跳过视频压缩，直接使用原文件
        fileToUpload = pendingFile;
      }

      // 生成安全的文件路径，根据实际上传的文件确定扩展
      let extension = '.jpg'; // 默认扩展名
      if (fileToUpload.type.startsWith('video/')) {
        // 视频压缩后为webm格式
        if (fileToUpload.type === 'video/webm') {
          extension = '.webm';
        } else if (fileToUpload.name.includes('.')) {
          const originalExt = `.${fileToUpload.name.split('.').pop()?.toLowerCase()}`;
          extension = originalExt || '.mp4';
        } else {
          extension = '.mp4'; // 默认视频格式
        }
      } else if (fileToUpload.type.startsWith('image/')) {
        // 图片压缩后为webp格式
        if (fileToUpload.type === 'image/webp') {
          extension = '.webp';
        } else if (fileToUpload.name.includes('.')) {
          const originalExt = `.${fileToUpload.name.split('.').pop()?.toLowerCase()}`;
          extension = originalExt || '.jpg';
        } else {
          extension = '.jpg'; // 默认图片格式
        }
      }

      // 生成带目录结构的文件路径
      const timestamp = Date.now();
      const randomId = uuidv4().substring(0, 8);
      const fileName = `${timestamp}_${randomId}${extension}`;

      // 使用用户上传目录结构
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const isVideoFile = fileToUpload.type.startsWith('video/');

      // 创建层次化目录: uploads/2024/01/videos/ 或 uploads/2024/01/images/
      const mediaType = isVideoFile ? 'videos' : 'images';
      const filePath = `uploads/${year}/${month}/${mediaType}/${fileName}`;
      // 更新toast为处理状态
      toast.loading(
        t ? t('toast:info.processingFile') : 'Processing file... 0%',
        {
          id: compressionToast,
        },
      );

      const uploadResult = await uploadFileWithUppy(
        fileToUpload,
        filePath,
        {
          onProgress: (percentage: number) => {
            if (percentage <= 30) {
              // 压缩阶段
              toast.loading(
                t
                  ? t('toast:info.compressingFile', { progress: percentage })
                  : `Compressing file... ${percentage}%`,
                { id: compressionToast },
              );
            } else {
              // 上传阶段
              toast.loading(
                t
                  ? t('toast:info.uploadingProgress', { progress: percentage })
                  : `Uploading file... ${percentage}%`,
                { id: compressionToast },
              );
            }
          },
          onError: (error: Error) => {
            console.error('❌ Uppy上传失败:', error);
          },
        },
        originalDuration,
      );

      // 使用上传后的URL作为exportMedia
      exportMedia = uploadResult;

      // 关闭loading toast
      toast.dismiss(compressionToast);

      // 显示成功消息
      toast.success(
        t ? t('toast:success.fileProcessed') : 'File processed successfully!',
        { duration: 2000 },
      );
    } catch (error) {
      setLoading?.(false);
      console.error('Failed to compress or upload file:', error);

      // 关闭进度toast
      toast.dismiss(compressionToast);

      // 提供更详细的错误信息
      let errorMessage = 'Failed to process file. Please try again.';

      if (error instanceof Error) {
        if (
          error.message.includes('memory') ||
          error.message.includes('Memory')
        ) {
          errorMessage = t
            ? t('toast:error.memoryError')
            : 'File too large for processing. Please try a smaller file.';
        } else if (
          error.message.includes('timeout') ||
          error.message.includes('Timeout') ||
          error.message.includes('AbortError')
        ) {
          errorMessage = t
            ? t('toast:error.timeoutError')
            : 'Upload timeout. Please check your connection and try again with a smaller file.';
        } else if (
          error.message.includes('upload') ||
          error.message.includes('Upload') ||
          error.message.includes('network') ||
          error.message.includes('Network')
        ) {
          errorMessage = t
            ? t('toast:error.uploadError')
            : 'Upload failed. Please check your connection and try again.';
        } else if (
          error.message.includes('chunk') ||
          error.message.includes('Chunk')
        ) {
          errorMessage = t
            ? t('toast:error.chunkError')
            : 'Large file upload failed. Please try again or use a smaller file.';
        } else if (t) {
          errorMessage = t('toast:error.failedToProcessFile');
        }
      }

      toast.error(errorMessage, { duration: 8000 });
      return null;
    }
  }

  // 检查并转存replicate.delivery的视频
  if (exportMedia.includes('replicate.delivery')) {
    try {
      // 检查url是否有效
      const response = await fetch(exportMedia);
      if (!response.ok) {
        throw new Error('URL is not valid');
      }
      const migratedVideoUrl = await migrateMediaFromReplicate(
        exportMedia,
        mediaType === 'video' ? 'video' : 'image',
      );
      mediaUrls = [migratedVideoUrl];
    } catch (error) {
      console.error('Failed to migrate video:', error);
      // 如果转存失败，使用原始URL
      mediaUrls = [exportMedia];
    }
  } else if (
    mediaType === 'image' &&
    !pendingFile &&
    !exportMedia.includes('supabase.co')
  ) {
    // 处理 base64 图片（来自 /create 页面）- 上传到存储
    try {
      const blob = await fetch(exportMedia).then(res => res.blob());
      const imagePath = `app_images/${uuidv4()}.webp`;
      const file = new File([blob], imagePath);
      const result = await uploadFile(imagePath, file);
      if (result) {
        mediaUrls = [result];
      } else {
        mediaUrls = [exportMedia];
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      mediaUrls = [exportMedia];
    }
  } else {
    mediaUrls = [exportMedia];
  }

  if (mediaType === 'video' && !pendingFile) {
    const extractFrameToast = toast.loading(
      t ? t('toast:info.processingFile') : 'Processing file... 0%',
    );
    try {
      await extractFrameFromVideo({
        pendingFile: exportMedia,
        t,
        mediaUrls,
      });
    } catch {
      toast.dismiss(extractFrameToast);
    }
  }

  if (pendingFile) {
    mediaUrls = [exportMedia];

    // 如果是视频文件，提取第一帧并上传
    if (mediaType === 'video' && pendingFile.type.startsWith('video/')) {
      try {
        await extractFrameFromVideo({
          pendingFile,
          t,
          mediaUrls,
        });
      } catch { }
    }
  } else if (mediaType === 'text') {
    // 纯文本内容，不需要媒体文件
    mediaUrls = [];
  }

  // Represent AI generated images as url path
  const generations: { id: number; url: string }[] = [];

  postGeneratedImageUrls = uniqWith(
    postGeneratedImageUrls,
    (a, b) => a.id === b.id && a.url === b.url,
  );

  // 先把 replicate 等外链转存为 Supabase，再构建 generations
  const migratedGeneratedImageUrls = await Promise.all(
    postGeneratedImageUrls.map(async ({ id, url }) => {
      try {
        const migratedUrl = await migrateMediaFromReplicate(url, 'image');
        return { id, url: migratedUrl } as { id: number; url: string };
      } catch {
        return { id, url } as { id: number; url: string };
      }
    }),
  );

  for (const { id, url } of migratedGeneratedImageUrls) {
    if (!url) {
      continue;
    }
    if (url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
      // 处理 image_generation 路径
      if (url.includes('/image_generation/')) {
        const path = url.replace(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
          '',
        );
        generations.push({ id, url: path });
      }
      // 处理 app_images 路径（来自 Create 页面）
      else if (url.includes('/app_images/')) {
        const path = url.replace(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/`,
          '',
        );
        generations.push({ id, url: path });
      } else {
        generations.push({ id, url });
      }
    } else {
      generations.push({ id, url });
    }
  }

  try {
    mixpanel.track('visit.page.publish', {
      title: postTitle,
      content: postContent,
      media: mediaUrls,
      type: mediaType,
    });
  } catch {
    // ignore tracking errors
  }

  // Extract OC ID from newTags if not already present
  let finalOcId = ocId || '';
  if (!finalOcId && newTags) {
    const ocTag = newTags.find(tag => tag.name.startsWith('@'));

    if (ocTag) {
      const match = CHARACTER_MENTION_REGEX.exec(ocTag.name);
      if (match) {
        finalOcId = match[0].replace('@', '');
      }
    }
  }

  const payload = {
    title: postTitle,
    description: postContent,
    images: mediaUrls,
    generations,
    tags,
    hide_main_feed: hideMainFeed,
    media_type: mediaType,
    new_tags: newTags,
    is_pinned: isPinned,
    should_translate: shouldTranslate === true,
    hide_prompt: hidePrompt,
    ...((source === 'oc-maker' || source === 'character') && finalOcId
      ? { oc_id: finalOcId }
      : {}),
  };

  // 显示准备发布提示
  const preppingToast = toast.loading(t('preppingPost'), {
    duration: 0, // 不自动关闭
  });

  try {
    const response = await fetch('/api/postStory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('❌ Response failed:', response.status);
      console.log('Content-Type:', contentType);

      // First get the response text
      const responseText = await response.text();
      console.error('响应内容 (前500字符):', responseText.substring(0, 500));

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        // Response is not JSON, likely an HTML error page
        console.error('❌ API返回非JSON响应 - 可能是服务器崩溃或配置错误');
        toast.dismiss(preppingToast);
        setLoading?.(false);
        toast.error('Server error. Check console for details.');
        return null;
      }

      console.error('❌ API错误响应:', errorData);
      // 关闭准备发布提示
      toast.dismiss(preppingToast);
      if ((errorData as any)?.code === 400) {
        if (!generations?.length) {
          toastError(t('toast:error.nsfwContentNotSupported'));
          setLoading?.(false);
          return null;
        }
        toastError(t('toast:error.illegalContent'));
        setLoading?.(false);
        return null;
      }
      // Show detailed error if available
      const errorMsg = (errorData as any)?.details
        ? `${errorData.error}: ${(errorData as any).details}`
        : errorData.error;
      throw new Error(errorMsg);
    }

    const { message, postId, error_code, credit } = await response.json();
    if (error_code === ERROR_CODES.USER_OPERATION_FORBIDDEN) {
      toastError(t('toast:error.userBlocked'));
      setLoading?.(false);
      toast.dismiss(preppingToast);
      setLoading?.(false);
      return null;
    }

    // 关闭准备发布提示
    toast.dismiss(preppingToast);
    setLoading?.(false);
    if (message && showToast) {
      if (credit) {
        toast.success(t('toast:success.postSuccess', { credit: credit || 0 }));
      } else {
        toast.success(message);
      }
    }
    return postId;
  } catch (error) {
    // 关闭准备发布提示
    toast.dismiss(preppingToast);
    setLoading(false);
    console.error('Error posting:', error);
    if (t) {
      toast.error(t('toast:error.failedPost'));
    } else {
      toast.error('Failed to post. Please try again.');
    }
    return null;
  }
};

const promptToTags = (prompt: string) => {
  const tags = prompt.split(',').map(tag => tag.trim().replace('\n', ' '));
  const tagsNeedToDelete = POSITIVE_PROMPT.split(',').map(tag => tag.trim());

  // 匹配 <character-id> 格式
  const characterIdMatch = prompt.match(/<[^>]+>/);
  let characterId = '';
  if (characterIdMatch) {
    characterId = characterIdMatch[0];
  }

  // 匹配 @xxx 格式的 OC ID（优先级最高，放在第一位）
  const atMentions = prompt.match(CHARACTER_MENTION_REGEX) || [];
  const atTags = atMentions
    .map(mention => mention.trim())
    .filter(mention => mention.length > 1);

  // 匹配 [xxx-style] 格式的 style tags
  const styleMatches = prompt.match(/\[[^\]]+\]/g) || [];
  const styleTags = styleMatches
    .map(style => style.trim())
    .filter(style => style.length > 2); // 至少是 [] 加上一个字符

  // 过滤普通 tags（排除 OC ID、character ID 和 style）
  const tagsToAdd = tags.filter(
    tag =>
      tag.length > 0 &&
      tag.length <= 20 &&
      !tagsNeedToDelete.includes(tag) &&
      !tag.startsWith('@') && // 排除 @xxx 格式（已经单独处理）
      !(tag.startsWith('<') && tag.endsWith('>')) && // 排除 <xxx> 格式（已经单独处理）
      !(tag.startsWith('[') && tag.endsWith(']')), // 排除 [xxx] 格式（已经单独处理）
  );

  // 构建 finalTags：优先保证 OC ID、character ID 和 style
  const finalTags: string[] = [];

  // 1. 首先添加 @xxx 格式的 OC ID（放在第一位，必须保留）
  for (const atTag of atTags) {
    if (!finalTags.includes(atTag)) {
      finalTags.push(atTag);
    }
  }

  // 2. 然后添加 <character-id> 格式的 tag（如果有）
  if (characterId && !finalTags.includes(characterId)) {
    finalTags.push(characterId);
  }

  // 3. 添加 [xxx-style] 格式的 style tags
  for (const styleTag of styleTags) {
    if (!finalTags.includes(styleTag)) {
      finalTags.push(styleTag);
    }
  }

  // 4. 最后添加其他普通 tags，但要确保总数不超过 10
  const reservedSlots = finalTags.length; // OC ID、character ID 和 style 占用的位置
  const maxOtherTags = Math.max(0, 10 - reservedSlots);
  for (const tag of tagsToAdd.slice(0, maxOtherTags)) {
    if (!finalTags.includes(tag)) {
      finalTags.push(tag);
    }
  }

  return finalTags.map(name => ({
    name,
    id: -1,
  }));
};

const contentToTags = (content: string) => {
  if (!content) {
    return [];
  }
  const characterIdMatch = /\/character\/(.+?)\s/.exec(content);
  let characterId = '';
  if (characterIdMatch) {
    characterId = characterIdMatch[1];
  }
  const tags = content
    .split('\n')
    .map(line => line.trim().replace(/^.+?:/, '').trim())
    .filter(line => line.length > 0)
    .flatMap(line => line.split(','))
    .filter(line => line.length > 0 && line.length <= 20);

  let result = tags.slice(0, 10).map(name => ({
    name,
    id: -1,
  }));
  if (characterId) {
    result = result.slice(0, 9);
    result.push({ name: `@${characterId}`, id: -1 });
  }
  return result;
};

const PublishWorkComponent: React.FC = () => {
  const { t } = useTranslation(['publish', 'toast']);
  const [exportImage, setExportImage] = useAtom(exportImageAtom);
  const [postGeneratedImageUrls, setPostGeneratedImageUrls] = useAtom(
    postGeneratedImageUrlsAtom,
  );
  const [postTitle, setPostTitle] = useAtom(postTitleAtom);
  const [postContent, setPostContent] = useAtom(postContentAtom);
  const [isAuth] = useAtom(authAtom);
  const [loginModalState] = useAtom(loginModalAtom);
  const profile = useAtomValue(profileAtom);
  const { LoginModal } = useLoginModal();
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>(
    'image',
  );
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null); // 新增：待上传的文件
  const [pinPost, setPinPost] = useState(false);
  const [shouldTranslate, setShouldTranslate] = useState(false);
  const [hideMyPrompt, setHideMyPrompt] = useState(false);
  const [ocId, setOcId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const appState = useAtomValue(appStateAtom);
  const sourcePageRef = useRef<string>('');

  // 检查是否为管理员
  const isAdmin =
    Array.isArray(profile?.roles) && profile.roles.includes(ROLES.ADMIN);
  // 清除URL查询参数但保持状态
  const clearUrlQuery = async () => {
    const { pathname, query } = router;
    if (Object.keys(query).length > 0) {
      await router.replace(pathname, undefined, { shallow: true });
    }
  };

  // const hidePromptKey = useMemo(() => {
  //   if (!profile?.email) {
  //     return '';
  //   }
  //   return `hide_my_prompt_${profile?.email}`;
  // }, [profile?.email]);

  // 清除所有内容的函数
  const clearAllContent = () => {
    if (exportImage && exportImage.startsWith('blob:')) {
      URL.revokeObjectURL(exportImage);
    }

    setExportImage('data:,');
    setPostGeneratedImageUrls([]);
    setPostTitle('');
    setPostContent('');
    setSelectedTags([]);
    setUrlParamsProcessed(false);
    setMediaType('image');
    setPendingFile(null);
    setPinPost(false);
  };

  useEffect(
    () => () => {
      if (exportImage && exportImage.startsWith('blob:')) {
        URL.revokeObjectURL(exportImage);
      }
    },
    [exportImage],
  );

  // 自动清理之前的内容
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    // 检查是否有之前留存的内容（不是来自URL参数）
    const hasContent =
      (exportImage && exportImage !== 'data:,') || postTitle || postContent;
    const hasUrlParams = router.query.mediaUrl;
    const hasContentFromCreate =
      exportImage?.startsWith('data:') && exportImage.length > 'data:,'.length;

    if (hasContentFromCreate) {
      return;
    }
    // 如果有内容但不是来自URL参数，且也不是刚通过URL处理的内容，自动清除
    if (hasContent && !hasUrlParams && !urlParamsProcessed) {
      clearAllContent();
    }
  }, [router.isReady, urlParamsProcessed]);

  // 处理URL参数
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const {
      mediaUrl,
      mediaType,
      prompt,
      content,
      tags,
      generationId,
      source,
      templateTag,
      characterTag,
    } = router.query;

    // Handle template tag from StyleTemplatePicker (e.g., "Bankai" or "Bankai,卍解")
    // May contain comma-separated tags: English tag + localized tag
    if (templateTag && typeof templateTag === 'string') {
      setSelectedTags(prev => {
        const templateTags = templateTag.split(',').filter(t => t.trim());
        const newTags: Tag[] = [];
        for (const tagName of templateTags) {
          if (!prev.find(t => t.name === tagName)) {
            newTags.push({ name: tagName, id: -1 });
          }
        }
        if (newTags.length === 0) {
          return prev;
        }
        return [...prev, ...newTags];
      });
    }

    // Handle character tag from effect generation (format: #@character-id)
    // This links the post to the character used in generation
    if (characterTag && typeof characterTag === 'string') {
      setSelectedTags(prev => {
        // Character tag is already in #@id format
        if (!prev.find(t => t.name === characterTag)) {
          return [...prev, { name: characterTag, id: -1 }];
        }
        return prev;
      });
    }

    // 从character/[character_id]页面跳转过来的，单独加OC tag <character-id>
    // 并把content中的tag也加进去
    if (tags && typeof tags === 'string') {
      const contentTags = contentToTags(content as string);
      setSelectedTags(selectedTags => {
        const newTags = tags.split(',').map(tag => ({
          name: tag,
          id: -1,
        }));

        // Merge contentTags, avoiding duplicates
        for (const contentTag of contentTags) {
          if (!newTags.find(t => t.name === contentTag.name)) {
            newTags.push(contentTag);
          }
        }

        const appendTags: Tag[] = [];
        for (const tag of newTags) {
          if (!selectedTags.find(t => t.name === tag.name)) {
            appendTags.push(tag);
          }
        }
        if (!appendTags.length) {
          return selectedTags;
        }
        return [...selectedTags, ...appendTags];
      });

      // Extract OC ID if this is an OC post
      if (tags.includes('OC')) {
        // Try to extract from tags first
        let extractedOcId = '';
        const tagMatch = CHARACTER_MENTION_REGEX.exec(tags);
        if (tagMatch) {
          extractedOcId = tagMatch[0].replace('@', '');
        }

        // If not found in tags, try content
        if (!extractedOcId && content) {
          const contentMatch = CHARACTER_MENTION_REGEX.exec(String(content));
          if (contentMatch) {
            extractedOcId = contentMatch[0].replace('@', '');
          }
        }

        if (extractedOcId) {
          setOcId(extractedOcId);
        }
      }
    }

    // 如果没有URL参数，直接返回，避免打断刚处理完成的内容
    if (!mediaUrl) {
      return;
    }

    // 如果已经处理过相同的URL，跳过
    if (urlParamsProcessed && exportImage === mediaUrl) {
      return;
    }

    sourcePageRef.current = source as string;

    // 设置媒体类型
    if (mediaType && typeof mediaType === 'string') {
      setMediaType(mediaType as 'image' | 'video' | 'text');
    }

    // 如果URL中有mediaUrl，则设置exportImage（覆盖现有内容）
    if (mediaUrl && typeof mediaUrl === 'string') {
      setExportImage(mediaUrl);

      if (
        (mediaUrl.includes('supabase.co') ||
          mediaUrl.includes('replicate.delivery')) &&
        generationId
      ) {
        setPostGeneratedImageUrls([
          {
            id: generationId ? parseInt(generationId as string) : -1,
            url: mediaUrl,
          },
        ]);
      }

      // if prompt is in the url, extract tags from it
      if (prompt && typeof prompt === 'string') {
        if (!tags) {
          setSelectedTags(prev => {
            const newTags = promptToTags(prompt);
            // console.log(newTags, 'newTags');
            if (!newTags) {
              return prev;
            }
            const appendTags: Tag[] = [];
            for (const tag of newTags) {
              if (!prev.find(t => t.name === tag.name)) {
                appendTags.push(tag);
              }
            }
            return [...prev, ...appendTags];
          });
        }
      }

      // if content is in the url, set it as post content
      if (content && typeof content === 'string') {
        const cleanedContent = cleanQualityModifiers(content);
        setPostContent(cleanedContent);
      }

      // 标记为已处理并清除URL参数
      setUrlParamsProcessed(true);
      setTimeout(() => {
        clearUrlQuery();
      }, 100);
    }
  }, [
    router.isReady,
    router.query,
    exportImage,
    setExportImage,
    setPostGeneratedImageUrls,
    postTitle,
    setPostTitle,
    urlParamsProcessed,
  ]);

  // 处理从create页面跳转过来的情况
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    // 如果没有URL参数，说明是从create页面跳转过来的
    if (
      !router.query.mediaUrl &&
      !router.query.prompt &&
      !router.query.content
    ) {
      // 从create页面过来的，需要从appState中获取prompt
      // const prompt = appState.find(node => node.attrs.text).join('\n');
      const found = appState.find(
        node => node.cType === CNodeType.COMIC_IMAGE && node.attrs.prompt,
      );
      const prompt = found?.attrs.prompt;
      if (prompt && !postTitle) {
        const tags = promptToTags(prompt);
        if (tags) {
          setSelectedTags(tags);
        }
      }
    }
  }, [router.isReady, router.query, appState, postTitle, setPostTitle]);

  // 页面离开时清理状态
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 如果没有从URL参数加载内容，且内容没有保存，则清理
      if (
        !router.query.mediaUrl &&
        (exportImage !== 'data:,' || postTitle || postContent)
      ) {
        clearAllContent();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [router.query.mediaUrl, exportImage, postTitle, postContent]);

  // useEffect(() => {
  //   const hidePrompt = localStorage.getItem(hidePromptKey);
  //   setHideMyPrompt(hidePrompt === 'true');
  // }, [hidePromptKey]);
  // 处理文件上传
  const handleFileSelect = async (file: File) => {
    if (!file) {
      return;
    }

    // 检查文件类型
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error(t('toast:error.unsupportedFileType'));
      return;
    }

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = isVideo ? 50 : 5; // 视频50MB，图片5MB

    if (fileSizeMB > maxSizeMB) {
      toast.error(
        isVideo
          ? t('toast:error.videoTooLarge', {
            size: Math.round(fileSizeMB),
            max: maxSizeMB,
          })
          : t('toast:error.imageTooLarge', {
            size: Math.round(fileSizeMB),
            max: maxSizeMB,
          }),
        { duration: 6000 },
      );
      return;
    }

    // 对于大视频文件给出警告
    if (isVideo && fileSizeMB > 40) {
      toast(
        t('toast:info.largeVideoWarning', { size: Math.round(fileSizeMB) }),
        {
          duration: 5000,
          icon: '⚠️',
        },
      );
    }

    const fileType = isVideo ? 'video' : 'image';
    setMediaType(fileType);

    setPendingFile(file);

    const previewUrl = URL.createObjectURL(file);
    setExportImage(previewUrl);
  };

  // 处理拖拽
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 处理文件选择
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // 处理分享
  const handleShare = async () => {
    if (!postTitle) {
      toast.error(t('pleaseEnterTitle'));
      return;
    }

    const shareTitle = postTitle;
    const shareText = postContent || postTitle;

    if (pendingFile) {
      toast.error(t('pleasePublishFirst'));
      return;
    }

    // 如果有图片/视频，尝试分享媒体文件
    if (navigator.share) {
      try {
        if (mediaType === 'video') {
          // 分享视频文件
          const response = await fetch(exportImage);
          const blob = await response.blob();
          const file = new File([blob], 'KomikoAI.mp4', {
            type: 'video/mp4',
          });

          await navigator.share({
            title: shareTitle,
            text: shareText,
            files: [file],
          });
        } else {
          // 分享带水印的图片
          const watermarkedImage = await addWatermark(exportImage);
          const response = await fetch(watermarkedImage);
          const blob = await response.blob();
          const file = new File([blob], 'KomikoAI.jpg', {
            type: blob.type,
          });

          await navigator.share({
            title: shareTitle,
            text: shareText,
            files: [file],
          });
        }
        toast.success(t('toast:success.share'));
      } catch {
        // 如果分享失败，下载媒体文件
        await downloadMedia();
      }
    } else {
      // 如果不支持原生分享，下载媒体文件
      await downloadMedia();
    }
  };

  const downloadMedia = async () => {
    if (mediaType === 'video') {
      // 对于视频，直接使用原始URL
      const link = document.createElement('a');
      link.href = exportImage;
      link.download = 'KomikoAI.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('toast:success.download'));
    } else {
      // 对于图片，添加水印
      downloadURI(await addWatermark(exportImage), 'KomikoAI.jpg');
      toast.success(t('toast:success.download'));
    }
  };

  return (
    <NextUIProvider>
      <Head>
        <title>{t('pageTitle')}</title>
      </Head>
      <Analytics />
      <main className='h-screen caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='p-4 mx-auto max-w-6xl w-full pt-20 pb-20 md:pb-4 overflow-y-auto lg:pl-[240px]'>
            <div className='flex justify-center mt-1 mb-6 w-full'>
              <h3 className='text-2xl font-bold text-center bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent'>
                {t('shareStory')}
              </h3>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[calc(100%-8rem)]'>
              {/* 左侧：媒体预览和上传区域 */}
              <div className='flex flex-col'>
                <Card className='bg-card flex-1 p-6 min-h-[400px]'>
                  {exportImage && exportImage !== 'data:,' ? (
                    <div className='relative w-full h-full'>
                      <div className='w-full h-full flex items-center justify-center bg-muted rounded-lg overflow-hidden'>
                        {mediaType === 'video' ? (
                          <video
                            src={exportImage}
                            controls
                            autoPlay
                            muted
                            className='max-w-full max-h-full object-contain'>
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={exportImage}
                            alt={postTitle || 'Uploaded content'}
                            className='max-w-full max-h-full object-contain'
                          />
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className='absolute top-4 right-4 flex gap-2'>
                        {!pendingFile && (
                          <>
                            <Button
                              isIconOnly
                              size='sm'
                              className='bg-card/90 backdrop-blur-sm shadow-lg'
                              onClick={downloadMedia}>
                              <HiOutlineDownload className='w-4 h-4' />
                            </Button>

                            <Button
                              isIconOnly
                              size='sm'
                              className='bg-card/90 backdrop-blur-sm shadow-lg'
                              onClick={handleShare}>
                              <IconShare3 className='w-4 h-4' />
                            </Button>
                          </>
                        )}

                        <Button
                          isIconOnly
                          size='sm'
                          className='bg-card/90 backdrop-blur-sm shadow-lg'
                          onClick={() => clearAllContent()}>
                          <IconX className='w-4 h-4' />
                        </Button>
                      </div>

                      {/* 媒体类型标签 */}
                      <div className='absolute bottom-4 left-4'>
                        <Chip
                          size='sm'
                          variant='flat'
                          color={
                            mediaType === 'video' ? 'secondary' : 'primary'
                          }
                          startContent={
                            mediaType === 'video' ? (
                              <FiVideo className='w-3 h-3' />
                            ) : (
                              <FiImage className='w-3 h-3' />
                            )
                          }>
                          {mediaType === 'video'
                            ? t('mediaPreview.video')
                            : t('mediaPreview.image')}
                        </Chip>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`w-full h-full border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer ${dragActive
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-border hover:border-primary-400 hover:bg-muted'
                        }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}>
                      <div className='flex flex-col items-center justify-center h-full gap-4 p-8'>
                        <div className='p-4 rounded-full bg-primary-100'>
                          <IconCloudUpload className='w-8 h-8 text-primary-500' />
                        </div>
                        <div className='text-center'>
                          <p className='text-lg font-medium text-foreground mb-2'>
                            {dragActive
                              ? t('fileUpload.dropHere')
                              : t('fileUpload.title')}
                          </p>
                          <p className='text-sm text-muted-foreground mb-4'>
                            {t('fileUpload.subtitle')}
                          </p>
                          <div className='flex gap-2 justify-center mb-3'>
                            <Chip size='sm' variant='flat' color='primary'>
                              {t('fileUpload.imageFormats')}
                            </Chip>
                            <Chip size='sm' variant='flat' color='secondary'>
                              {t('fileUpload.videoFormats')}
                            </Chip>
                          </div>
                          <div className='text-xs text-muted-foreground space-y-1'>
                            <p>{t('fileUpload.maxSize', { size: '5' })}</p>
                            <p>
                              {t('fileUpload.videoMaxSize', {
                                size: '50',
                                duration: '3',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* 右侧：表单区域 */}
              <div className='flex flex-col'>
                <Card className='bg-card flex-1 p-6'>
                  <div className='flex flex-col gap-4'>
                    <div>
                      <label className='text-sm font-bold text-foreground mb-2 block'>
                        {t('storyTitle')}
                      </label>
                      <Input
                        placeholder={t('enterStoryTitle')}
                        value={postTitle}
                        onValueChange={setPostTitle}
                        variant='bordered'
                        classNames={{
                          input: 'text-base',
                          inputWrapper: 'h-12',
                        }}
                      />
                      {/* <div className='flex justify-between items-center mt-1'>
                        <p className='text-xs text-muted-foreground'>
                          {postTitle.length}/40
                        </p>
                        {postTitle.length > 35 && (
                          <p className='text-xs text-warning'>
                            {t('titleLengthWarning')}
                          </p>
                        )}
                      </div> */}
                    </div>

                    <div>
                      <label className='text-sm font-bold text-foreground mb-2 block'>
                        {t('description')}
                      </label>
                      <Textarea
                        placeholder={t('addMoreDescription')}
                        value={postContent}
                        onValueChange={setPostContent}
                        minRows={2}
                        maxRows={12}
                        variant='bordered'
                        classNames={{
                          input: 'text-base',
                        }}
                      />
                      <p className='text-xs text-muted-foreground mt-1'>
                        {postContent.length} {t('characters')}
                      </p>
                    </div>

                    <div>
                      <div className='py-1'>
                        <TagSelector
                          selectedTags={selectedTags}
                          onTagsChange={setSelectedTags}
                          maxTags={15}
                          placeholder={t('tagPlaceholder')}
                        />
                      </div>
                    </div>

                    {/* Hide My Prompt toggle */}
                    <PublicVisibilityToggle
                      isPublic={hideMyPrompt}
                      onToggle={isPublic => {
                        setHideMyPrompt(isPublic);
                        // if (!hidePromptKey) {
                        //   return;
                        // }
                        // localStorage.setItem(
                        //   hidePromptKey,
                        //   isPublic.toString(),
                        // );
                      }}
                      label={t('common:hide_my_prompt')}
                      tooltip={t('common:hide_my_prompt_tooltip')}
                      showCrown
                      reverse
                      useStore={false}
                    />

                    {/* 置顶选项 - 只有官方账号可见 */}
                    {isAdmin && (
                      <div className='mb-2 flex gap-2 flex-col'>
                        <Checkbox
                          isSelected={pinPost}
                          onValueChange={setPinPost}
                          color='primary'
                          size='sm'>
                          <span className='text-sm text-red-700'>
                            <span className='flex items-center gap-1'>
                              <RiPushpinLine className='w-4 h-4' />
                              {t('pinPost')}
                            </span>
                          </span>
                        </Checkbox>
                        <Checkbox
                          isSelected={shouldTranslate}
                          onValueChange={setShouldTranslate}
                          color='primary'
                          size='sm'>
                          <span className='text-sm'>
                            <span className='flex items-center gap-1'>
                              <RiTranslate className='w-4 h-4' />
                              {t('translateOnPublish', {
                                defaultValue: 'Translate on publish',
                              })}
                            </span>
                          </span>
                        </Checkbox>
                      </div>
                    )}

                    <div className='flex flex-col gap-3'>
                      <Button
                        color='primary'
                        variant='solid'
                        size='lg'
                        className='w-full font-medium hover:cursor-pointer'
                        isLoading={loading}
                        isDisabled={
                          !postTitle ||
                          ((!exportImage || exportImage === 'data:,') &&
                            !pendingFile)
                        }
                        onClick={async () => {
                          // 检查登录状态
                          if (!isAuth) {
                            loginModalState.onOpen?.();
                            return;
                          }

                          if (!postTitle) {
                            toast.error(t('pleaseEnterTitle'));
                            return;
                          }
                          if (
                            (!exportImage || exportImage === 'data:,') &&
                            !pendingFile
                          ) {
                            toast.error(t('pleaseCreateStory'));
                            return;
                          }
                          let newTags = [...selectedTags];
                          if (sourcePageRef.current === 'text-to-video') {
                            if (!newTags?.length) {
                              newTags = [];
                            }

                            if (
                              !newTags.some(tag => tag.name === 'Text to Video')
                            ) {
                              newTags.push({
                                id: 53569,
                                name: 'Text to Video',
                              });
                            }
                          }
                          const postId = await handlePublish(
                            postTitle,
                            postContent,
                            exportImage,
                            postGeneratedImageUrls,
                            setLoading,
                            [], // tags
                            false, // hideMainFeed
                            true, // showToast
                            t,
                            mediaType,
                            pendingFile,
                            // selectedTags,
                            newTags,
                            pinPost, // pin
                            isAuth, // 登录状态
                            profile, // 用户信息
                            shouldTranslate, // 是否自动翻译（管理员）
                            hideMyPrompt,
                            ocId, // OC ID
                            sourcePageRef.current, // source
                          );
                          if (postId) {
                            // 清理atom状态，防止下次进入时仍有数据
                            clearAllContent();

                            router.push(
                              `${window.location.origin}/post/${postId}?showSocial=true`,
                            );
                          }
                        }}>
                        {t('post')}
                      </Button>

                      <div className='p-3 bg-muted rounded-lg'>
                        <p className='text-xs text-muted-foreground leading-relaxed'>
                          <span className='font-medium'>{t('pleaseNote')}</span>{' '}
                          <strong>{t('nsfwWarning')}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*,video/*'
          onChange={handleFileInputChange}
          className='hidden'
        />
      </main>
      <LoginModal />
    </NextUIProvider>
  );
};

export default PublishWorkComponent;
