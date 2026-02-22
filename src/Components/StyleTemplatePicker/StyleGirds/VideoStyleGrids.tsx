import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Modal, ModalContent, Button } from '@nextui-org/react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTrash } from 'react-icons/fa6';
import { FiMaximize } from 'react-icons/fi';
import { TbVideo } from 'react-icons/tb';
import { HiOutlineUser } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { getVideoDuration } from '@/components/ToolsPage/utils';
import {
  DanceTemplate,
  getDanceTemplatesAsync,
  getDanceTemplatesSync,
} from './styles';
import { useSingleVideoPlayback } from '@/hooks/useSingleVideoPlayback';

interface VideoStyleGridsProps {
  selectedStyleId: string;
  setStyle: (style: DanceTemplate) => void;
  onUploadedVideoChange?: (
    file: File | null,
    tempUrl: string | null,
    duration: number,
  ) => void;
}

export const VideoStyleGrids: React.FC<VideoStyleGridsProps> = ({
  selectedStyleId,
  setStyle,
  onUploadedVideoChange,
}) => {
  const { t } = useTranslation('style-templates');
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  useSingleVideoPlayback();

  const [fileName, setFileName] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  // 动态加载dance模板数据
  const [templates, setTemplates] = useState<DanceTemplate[]>(
    getDanceTemplatesSync(),
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // 加载dance模板数据
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const danceData = await getDanceTemplatesAsync();
        setTemplates(danceData);
      } catch (error) {
        console.error('Failed to load dance templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    // 如果同步数据为空或者只有静态数据，才异步加载
    const currentTemplates = getDanceTemplatesSync();
    if (currentTemplates.length === 0 || currentTemplates.length <= 7) {
      loadTemplates();
    } else {
      setTemplates(currentTemplates);
    }
  }, []);

  const formatDuration = useCallback((sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (!v) return;
      // Unmute and set a sensible default volume for previews
      v.muted = false;
      if (v.volume === 0) v.volume = 0.5;
      // Pause any other playing videos defensively (in addition to global hook)
      try {
        const videos = document.getElementsByTagName('video');
        for (const el of Array.from(videos)) {
          if (el !== v && !el.paused) {
            try {
              el.pause();
            } catch {}
          }
        }
      } catch {}
      v.play().catch(() => {});
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (!v) return;
      v.pause();
    },
    [],
  );

  const openModal = useCallback((src: string) => {
    setModalSrc(src);
    setIsModalOpen(true);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      try {
        modalVideoRef.current?.pause();
      } catch {}
    }
    setIsModalOpen(open);
  };

  const handleVideoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith('video/')) {
        toast.error(t('uploadFile.errors.selectVideo'));
        return;
      }

      // 验证文件大小 (限制为50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error(t('uploadFile.errors.fileSize', { limit: 50 }));
        return;
      }
      try {
        setUploadingVideo(true);
        // 使用本地临时URL预览，实际上传在生成时进行
        const tempUrl = URL.createObjectURL(file);
        setUploadedVideoUrl(tempUrl);

        // get duration first
        const videoDuration = await getVideoDuration(tempUrl);
        const duration = Math.floor(videoDuration * 100) / 100;
        // 保留小数点后两位
        setDuration(duration);

        const customTemplate: DanceTemplate = {
          id: 'uploaded-video',
          nameKey: 'uploaded_video',
          video: tempUrl,
          duration: duration,
        };

        setStyle(customTemplate as DanceTemplate);
        onUploadedVideoChange?.(file, tempUrl, duration);
        setFileName(file.name);
      } finally {
        setUploadingVideo(false);
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
      }
    },
    [setStyle, onUploadedVideoChange],
  );

  const handleUploadClick = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const handleDeleteUploadedVideo = useCallback(() => {
    setUploadedVideoUrl(null);
    setDuration(0);
    onUploadedVideoChange?.(null, null, 0);
    setFileName(null);
    // 如果当前选中的是上传的视频，清除选择
    if (selectedStyleId === 'uploaded-video') {
      setStyle('' as any);
    }
    toast.success('Uploaded video removed');
  }, [selectedStyleId, onUploadedVideoChange]);

  return (
    <>
      <div className='mb-2'>
        <div className='grid md:grid-cols-4 grid-cols-3 gap-3 md:max-h-[600px] max-h-[75vh] overflow-y-auto p-1'>
          {/* 视频上传卡片 */}
          {
            <>
              <div
                className={cn(
                  'cursor-pointer rounded-lg transition-all duration-300 relative overflow-hidden border-2 flex flex-col',
                  {
                    'border-primary-600 bg-primary-50 shadow-md':
                      selectedStyleId === 'uploaded-video' && uploadedVideoUrl,
                    'border-dashed border-border hover:border-muted-foreground hover:shadow-sm bg-muted hover:bg-muted/80':
                      !uploadedVideoUrl,
                    'border-border border':
                      uploadedVideoUrl && selectedStyleId !== 'uploaded-video',
                    'opacity-50': uploadingVideo,
                  },
                )}
                onClick={uploadedVideoUrl ? undefined : handleUploadClick}>
                <div
                  className={cn(
                    'overflow-hidden rounded-none relative',
                    uploadedVideoUrl ? 'aspect-[3/4]' : 'flex-1 aspect-[3/4]',
                  )}>
                  {uploadedVideoUrl ? (
                    // 显示上传的视频预览
                    <div className='absolute inset-0 w-full h-full'>
                      <video
                        draggable={false}
                        src={uploadedVideoUrl + '#t=0.001'}
                        className='object-contain object-center w-full h-full cursor-pointer bg-black'
                        muted
                        playsInline
                        loop
                        preload='auto'
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={() =>
                          setStyle({
                            id: 'uploaded-video',
                            nameKey: 'uploaded_video',
                            video: uploadedVideoUrl,
                            duration: duration,
                          } as any)
                        }
                      />
                      {/* 删除按钮 */}
                      <Button
                        type='button'
                        size='sm'
                        aria-label='Delete uploaded video'
                        onPress={handleDeleteUploadedVideo}
                        className='absolute top-2 left-2 z-10 rounded-md bg-red-500/80 hover:bg-red-600/90 text-white w-6 h-6 min-w-6 min-h-6'
                        isIconOnly>
                        <FaTrash className='w-3 h-3' />
                      </Button>
                      {/* duration */}
                      <div className='absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 hover:bg-black/70  text-white text-xs rounded backdrop-blur-sm'>
                        {formatDuration(duration)}
                      </div>
                      {/* 放大按钮 */}
                      <Button
                        type='button'
                        size='sm'
                        aria-label='Expand'
                        onPress={() => openModal(uploadedVideoUrl)}
                        className='absolute bottom-2 right-2 z-10 rounded-md bg-black/40 hover:bg-black/70 text-white w-6 h-6 min-w-6 min-h-6'
                        isIconOnly>
                        <FiMaximize className='w-3 h-3' />
                      </Button>
                      {/* 选中标识 */}
                      {selectedStyleId === 'uploaded-video' && (
                        <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600/80 rounded-bl-full flex items-center justify-center z-10 pointer-events-none'>
                          <FaCheck className='-mt-1 ml-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white' />
                        </div>
                      )}
                    </div>
                  ) : (
                    // 显示上传按钮
                    <div
                      className={cn(
                        'absolute inset-0 flex flex-col items-center justify-center p-2',
                        {
                          '!cursor-not-allowed': uploadingVideo,
                        },
                      )}>
                      {uploadingVideo ? (
                        <div className='flex flex-col items-center'>
                          <div className='w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2'></div>
                          <span className='text-xs text-muted-foreground'>
                            Uploading...
                          </span>
                        </div>
                      ) : (
                        <div className='flex flex-col items-center'>
                          <div className='relative mb-3'>
                            <div className='md:w-12 md:h-12 w-8 h-8  rounded-full bg-muted flex items-center justify-center'>
                              <HiOutlineUser className='md:w-7 md:h-7 w-4 h-4 text-muted-foreground' />
                            </div>
                            <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center'>
                              <TbVideo className='w-3 h-3 text-white' />
                            </div>
                          </div>
                          <span className='md:text-sm text-xs text-muted-foreground text-center w-full font-medium'>
                            {t('dances.uploadMotionVideo')}
                          </span>
                          <span className='text-xs text-muted-foreground text-center  w-full font-normal'>
                            {t('dances.uploadcost')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {fileName && (
                  <p className='text-[10px] font-medium text-center leading-tight py-1 select-none truncate'>
                    {fileName}
                  </p>
                )}
              </div>
            </>
          }

          {templates.map(style => {
            // UI 展示优先使用 displayVideo，降级到 video
            const displayVideoUrl = style.displayVideo || style.video;
            return (
              <div
                key={style.id}
                data-style-id={style.id}
                role='button'
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setStyle(style);
                  }
                }}
                onClick={() => {
                  setStyle(style);
                }}
                className={cn(
                  'cursor-pointer rounded-lg transition-all duration-200 relative overflow-hidden',
                  {
                    'border-2 border-primary-600 bg-primary-50 shadow-md':
                      selectedStyleId === style.id,
                    'border border-border hover:border-primary-300 hover:bg-primary-50/30':
                      selectedStyleId !== style.id,
                  },
                )}>
                {/* Video container */}
                <div className='overflow-hidden relative aspect-[3/4] rounded-none'>
                  <video
                    draggable={false}
                    src={displayVideoUrl + '#t=0.001'}
                    className='object-cover object-center w-full h-full'
                    muted
                    playsInline
                    loop
                    preload='auto'
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* Expand button */}
                  <Button
                    type='button'
                    size='sm'
                    aria-label='Expand'
                    onPress={() => {
                      openModal(displayVideoUrl);
                    }}
                    className='absolute bottom-2 right-2 z-10 rounded-sm bg-black/40 hover:bg-black/70 text-white w-4 h-4 min-w-4 min-h-4'
                    isIconOnly>
                    <FiMaximize className='w-2.5 h-2.5' />
                  </Button>

                  {/* Selected checkmark */}
                  {selectedStyleId === style.id && (
                    <div className='absolute top-0 right-0 w-6 h-6 bg-primary-600/90 rounded-bl-lg flex items-center justify-center z-10 pointer-events-none'>
                      <FaCheck className='-mt-1 ml-1 w-3 h-3 text-white' />
                    </div>
                  )}

                  {/* Duration for dance templates - overlay on video */}
                  {'duration' in style && (
                    <div className='absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 hover:bg-black/70 text-white text-xs rounded backdrop-blur-sm'>
                      {formatDuration(style.duration)}
                    </div>
                  )}
                </div>

                <p className='md:text-sm text-xs font-medium text-center truncate leading-tight md:py-2 py-1'>
                  {t(`dances.${style.nameKey}`)}
                </p>
              </div>
            );
          })}

          {/* 加载状态显示 */}
          {isLoadingTemplates &&
            templates.length === 0 &&
            Array.from({ length: 6 }, (_, i) => (
              <div
                key={`loading-${i}`}
                className='border border-border rounded-lg overflow-hidden animate-pulse'>
                <div className='aspect-[3/4] bg-muted' />
                <div className='p-2'>
                  <div className='h-4 bg-muted rounded' />
                </div>
              </div>
            ))}
        </div>
      </div>

      {isModalOpen && (
        <Modal
          isOpen
          onOpenChange={handleOpenChange}
          backdrop='opaque'
          placement='center'
          size='full'
          closeButton
          scrollBehavior='inside'
          classNames={{
            backdrop: 'bg-black/80',
            base: 'bg-transparent shadow-none',
            closeButton:
              'top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-50 backdrop-blur-sm border border-white/20',
          }}>
          <ModalContent>
            <div className='p-0 w-screen h-screen flex items-center justify-center'>
              <div className='relative w-full h-full'>
                <video
                  ref={modalVideoRef}
                  src={(modalSrc ?? '') + '#t=0.001'}
                  className='w-full h-full object-contain'
                  autoPlay
                  controls
                  loop
                  playsInline
                />
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}

      {/* 隐藏的视频文件输入 */}
      <input
        ref={videoInputRef}
        type='file'
        accept='video/*'
        onChange={handleVideoUpload}
        className='hidden'
      />
    </>
  );
};

export default VideoStyleGrids;
