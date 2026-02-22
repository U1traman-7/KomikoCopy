'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Button, Chip } from '@nextui-org/react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PiUserBold, PiImageBold, PiVideoBold, PiCamera } from 'react-icons/pi';
import { IconTemplate } from '@tabler/icons-react';
import { BiSolidZap } from 'react-icons/bi';
import { MdAccessTime } from 'react-icons/md';
import { BsPalette } from 'react-icons/bs';
import { FaChevronDown } from 'react-icons/fa';
import cn from 'classnames';
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';

import useMediaQuery from '../../hooks/use-media-query';
import type { ImageGenerationControllerRef } from '../RightSidebar/RightSidebar';
import ModelSelector from '../VideoGeneration/Selector/ModelSelector';
import { VIDEO_STYLE_OPTIONS } from '../VideoGeneration/Selector/StyleSelector';
import { aspectRatioIconMap } from '../VideoGeneration/constants/aspectRatioIcons';
import { VideoDuration } from '../VideoGeneration/config/modelConfig';

import VideoReferenceModal from './VideoReferenceModal';
import { QuickCreateListPopover } from './QuickCreateListPopover';
import { useQuickCreateVideo } from './useQuickCreateVideo';

// Dynamically import ImageGenerationController to prevent Canvas from being bundled
const ImageGenerationController = dynamic(
  () =>
    import('../RightSidebar/RightSidebar').then(mod => ({
      default: mod.ImageGenerationController,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex justify-center items-center h-32 text-muted-foreground'>
        Loading...
      </div>
    ),
  },
);

type CreateTab = 'ai-image' | 'ai-video' | 'characters' | 'templates';

interface QuickCreatePanelProps {
  className?: string;
}

export const QuickCreatePanel = ({ className }: QuickCreatePanelProps) => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const { isMobile } = useMediaQuery();

  // Ref for programmatic generation trigger
  const imageGenRef = useRef<ImageGenerationControllerRef>(null);

  // Tab state (AI Image is default)
  const [activeTab, setActiveTab] = useState<CreateTab>('ai-image');

  // Image generation state
  const [imageInputValue, setImageInputValue] = useState('');
  const [currentImageModel, setCurrentImageModel] =
    useState<string>('Auto Model');

  // Image generation callback - not used, generation happens on target page
  const handleImageLoaded = () => {
    // No-op: generation happens on /ai-anime-generator page
  };

  // Video generation - use extracted hook
  const {
    videoPrompt,
    setVideoPrompt,
    selectedVideoModel,
    setSelectedVideoModel,
    videoDuration,
    setVideoDuration,
    videoAspectRatio,
    setVideoAspectRatio,
    videoStyle,
    setVideoStyle,
    videoReferenceImages,
    setVideoReferenceImages,
    videoEndFrameImage,
    setVideoEndFrameImage,
    videoGenerating,
    isVideoReferenceModalOpen,
    setIsVideoReferenceModalOpen,
    isStylePopoverOpen,
    setIsStylePopoverOpen,
    isDurationPopoverOpen,
    setIsDurationPopoverOpen,
    isAspectPopoverOpen,
    setIsAspectPopoverOpen,
    videoConfig,
    videoModelOptions,
    videoDurationOptions,
    videoAspectRatioOptions,
    videoCost,
    tVideo,
    profile,
    handleVideoGenerate,
  } = useQuickCreateVideo();

  // Tab configuration
  const tabs = [
    {
      key: 'ai-image' as CreateTab,
      label: tCommon('generate_image_short', 'Generate'),
      icon: PiImageBold,
      href: null,
    },
    {
      key: 'ai-video' as CreateTab,
      label: tCommon('generate_animation_short', 'Video'),
      icon: PiVideoBold,
      href: null,
    },
    {
      key: 'characters' as CreateTab,
      label: tCommon('create_character_short', 'Characters'),
      icon: PiUserBold,
      href: '/characters',
    },
    {
      key: 'effects' as CreateTab,
      label: tCommon('effects', 'Effects'),
      icon: IconTemplate,
      href: '/effects',
    },
  ];

  // Show 3 tabs on mobile, 4 on desktop
  const visibleTabs = isMobile ? tabs.slice(0, 3) : tabs;

  return (
    <div
      className={`relative w-full overflow-visible p-1 md:p-2 ${className || ''}`}>
      {/* Tab buttons - vertical icon + text + underline style */}
      <div
        className={cn(
          'flex relative ml-4',
          isMobile ? 'gap-8 z-10 mb-4' : 'gap-14 mb-4',
        )}>
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;

          const tabContent = (
            <div
              className={cn(
                'flex flex-col items-center gap-1 cursor-pointer transition-all relative pb-2 px-3',
                isActive
                  ? 'text-primary-500 dark:text-primary-300'
                  : 'text-foreground hover:text-foreground',
              )}>
              <IconComponent
                className={cn(
                  'transition-colors',
                  isMobile ? 'w-5 h-5' : 'w-6 h-6',
                  isActive
                    ? 'text-primary-500 dark:text-primary-300'
                    : 'text-foreground',
                )}
              />
              <span
                className={cn(
                  'font-medium transition-colors',
                  isMobile ? 'text-xs' : 'text-sm',
                  isActive
                    ? 'text-primary-500 dark:text-primary-300'
                    : 'text-foreground',
                )}>
                {tab.label}
              </span>
              {/* Active underline */}
              {isActive && (
                <div className='absolute bottom-0 left-0 right-0 h-[3px] bg-primary-500 dark:bg-primary-400 rounded-full' />
              )}
            </div>
          );

          if (tab.href) {
            return (
              <Link key={tab.key} href={tab.href}>
                {tabContent}
              </Link>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className='bg-transparent border-none p-0'>
              {tabContent}
            </button>
          );
        })}
      </div>

      {/* Decorative mascot image */}
      <img
        alt={t('create_section.ai_art', 'AI Art')}
        src='https://d31cygw67xifd4.cloudfront.net/covers/ai-art.webp'
        className={cn(
          'absolute object-contain pointer-events-none drop-shadow-lg z-10',
          isMobile
            ? '-top-8 right-0 w-[70px] opacity-95'
            : 'top-0 right-8 w-[100px] opacity-95',
        )}
      />

      {/* Generator content area - fixed min height to prevent flickering */}
      {(activeTab === 'ai-image' || activeTab === 'ai-video') && (
        <div className='w-full min-h-[220px]'>
          {/* AI Image Generator */}
          {activeTab === 'ai-image' && (
            <ImageGenerationController
              ref={imageGenRef}
              inputValue={imageInputValue}
              setInputValue={setImageInputValue}
              onImageLoaded={handleImageLoaded}
              isMobile={isMobile}
              showPreset={false}
              tool='ai-anime-generator'
              stackChip={true}
              showImagesCount={false}
              needPromptReferenceCollapsed={false}
              className='w-full'
              onModelChange={setCurrentImageModel}
              onGenerating={() => {
                router.push({
                  pathname: '/ai-anime-generator',
                  query: {
                    prompt: imageInputValue,
                    model: currentImageModel,
                    autoGenerate: 'true',
                  },
                });
              }}
            />
          )}

          {/* AI Video Generator */}
          {activeTab === 'ai-video' && (
            <div className='border border-primary-300 dark:border-primary-700 rounded-xl p-3 pb-4'>
              {/* Top controls - Model, Style, Duration, Aspect Ratio */}
              <div className='flex items-center gap-4 flex-wrap pb-2'>
                {/* Model selector */}
                <ModelSelector
                  selectedModel={selectedVideoModel}
                  modelOptions={videoModelOptions}
                  onModelChange={setSelectedVideoModel}
                  t={tVideo}
                  duration={videoDuration}
                  large
                  compact
                />

                {/* Style selector - only show when no images uploaded */}
                {videoReferenceImages.length === 0 && (
                  <Popover
                    placement='bottom'
                    isOpen={isStylePopoverOpen}
                    onOpenChange={setIsStylePopoverOpen}>
                    <PopoverTrigger>
                      <button
                        type='button'
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm',
                          VIDEO_STYLE_OPTIONS.find(
                            opt => opt.key === videoStyle,
                          )
                            ? 'bg-primary-50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/15 dark:border-primary-400/40 dark:hover:bg-primary-400/25'
                            : 'bg-primary-50/50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/10 dark:border-primary-400/30 dark:hover:bg-primary-400/20',
                        )}>
                        {VIDEO_STYLE_OPTIONS.find(
                          opt => opt.key === videoStyle,
                        ) ? (
                          <img
                            src={
                              VIDEO_STYLE_OPTIONS.find(
                                opt => opt.key === videoStyle,
                              )?.image
                            }
                            alt={
                              VIDEO_STYLE_OPTIONS.find(
                                opt => opt.key === videoStyle,
                              )?.label
                            }
                            className='w-5 h-5 rounded object-cover'
                          />
                        ) : (
                          <BsPalette className='w-4 h-4 text-primary-500 dark:text-primary-300' />
                        )}
                        <span className='text-primary-700 dark:text-primary-300 font-medium'>
                          {VIDEO_STYLE_OPTIONS.find(
                            opt => opt.key === videoStyle,
                          )?.label || 'Style'}
                        </span>
                        <FaChevronDown className='w-2.5 h-2.5 text-primary-400 dark:text-primary-300' />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className='p-3 w-[320px]'>
                      <div className='grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto'>
                        {VIDEO_STYLE_OPTIONS.map(option => (
                          <button
                            key={option.key}
                            onClick={() => {
                              setVideoStyle(option.key);
                              setIsStylePopoverOpen(false);
                            }}
                            className={cn(
                              'relative rounded-lg overflow-hidden border-2 transition-all',
                              videoStyle === option.key
                                ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-400/30'
                                : 'border-transparent hover:border-border',
                            )}>
                            <img
                              src={option.image}
                              alt={option.label}
                              className='w-full aspect-[3/2] object-cover'
                            />
                            <div className='absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5 text-center truncate px-1'>
                              {option.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Duration selector */}
                {videoConfig.showDuration && (
                  <QuickCreateListPopover
                    isOpen={isDurationPopoverOpen}
                    onOpenChange={setIsDurationPopoverOpen}
                    value={String(videoDuration)}
                    options={videoDurationOptions}
                    onChange={val =>
                      setVideoDuration(Number(val) as VideoDuration)
                    }
                    icon={<MdAccessTime className='w-5 h-5 text-foreground' />}
                    displayValue={`${videoDuration}s`}
                  />
                )}

                {/* Aspect ratio selector */}
                {videoConfig.showAspectRatio && (
                  <QuickCreateListPopover
                    isOpen={isAspectPopoverOpen}
                    onOpenChange={setIsAspectPopoverOpen}
                    value={videoAspectRatio}
                    options={videoAspectRatioOptions}
                    onChange={setVideoAspectRatio}
                    icon={aspectRatioIconMap[videoAspectRatio]}
                    wrapIcon
                  />
                )}
              </div>

              {/* Divider */}
              <div className='h-[1px] bg-primary-100 dark:bg-primary-400/20' />

              {/* Prompt Textarea */}
              <textarea
                value={videoPrompt}
                onChange={e => setVideoPrompt(e.target.value)}
                placeholder={tCommon(
                  'home_ai_video.video_prompt_placeholder',
                  'Describe the video effect you want to create. Type @ to mention characters.',
                )}
                className='pt-3 w-full bg-transparent text-sm focus:outline-none min-h-[128px] resize-none placeholder:text-muted-foreground placeholder:text-sm placeholder:leading-relaxed'
                style={{
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                }}
              />

              {/* Bottom Control Bar */}
              <div
                className={cn(
                  'pt-3 border-t border-primary-100 dark:border-primary-400/20',
                  isMobile
                    ? 'flex flex-col gap-1'
                    : 'flex justify-between items-center',
                )}>
                {/* Left side - Reference Images button */}
                <div className='flex items-center gap-2 flex-wrap'>
                  <Button
                    variant='flat'
                    size='sm'
                    className={cn(
                      'p-0 px-2 min-w-[84px] h-9 dark:bg-transparent',
                      {
                        'bg-default-100': videoReferenceImages.length > 0,
                      },
                    )}
                    onPress={() => setIsVideoReferenceModalOpen(true)}
                    startContent={
                      <PiCamera className='w-5 h-5 text-muted-foreground stroke-0 min-w-5' />
                    }>
                    <div className='flex items-center gap-1 truncate text-foreground'>
                      <div className='truncate'>
                        {videoReferenceImages.length > 0
                          ? videoReferenceImages.length === 1
                            ? videoReferenceImages[0].name
                            : `${videoReferenceImages.length} ${tCommon('images', 'images')}`
                          : tCommon('home_ai_video.reference', 'Reference')}
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Right side - Generate button with credit info */}
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    type='button'
                    className={cn(
                      'text-sm h-9 rounded-xl gap-1.5 relative !overflow-visible min-w-[110px] font-semibold bg-primary-500 hover:bg-primary-600 text-primary-foreground shadow-md px-5',
                      isMobile ? 'w-full' : '',
                    )}
                    isDisabled={!videoPrompt.trim()}
                    isLoading={videoGenerating}
                    onClick={handleVideoGenerate}>
                    {tCommon('generate', 'Generate')}
                    <Chip
                      startContent={
                        <BiSolidZap className='mr-0 w-3 h-3 text-yellow-400' />
                      }
                      variant='flat'
                      size='sm'
                      className='bg-card/90 text-muted-foreground text-[10px] scale-[0.85] absolute top-full -translate-y-1/2 left-0 right-0 mx-auto w-fit shadow-sm'>
                      {videoCost} / {profile?.credit ?? '...'}
                    </Chip>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reference Images Modal for Video */}
      <VideoReferenceModal
        isOpen={isVideoReferenceModalOpen}
        onClose={() => setIsVideoReferenceModalOpen(false)}
        references={videoReferenceImages}
        setReferences={setVideoReferenceImages}
        endFrameImage={videoEndFrameImage}
        onEndFrameChange={setVideoEndFrameImage}
        onEndFrameRemove={() => setVideoEndFrameImage('')}
        supportsEndFrame={videoConfig.supportsEndFrame}
        maxImages={7}
      />
    </div>
  );
};

export default QuickCreatePanel;
