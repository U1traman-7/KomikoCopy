import React, { useState } from 'react';
import { Card, Button, Chip } from '@nextui-org/react';
import { HiOutlineDocumentDuplicate, HiSparkles } from 'react-icons/hi2';
import { FaCrown } from 'react-icons/fa';

import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  hasCompleteGenerationData,
  getToolPageRoute,
  buildCreateYoursParams,
} from '../../utilities/tools';
import { cleanQualityModifiers } from '../../utilities/promptUtils';
import { CHARACTER_MENTION_REGEX } from '../../constants';
import { useRemixCount } from '@/hooks/useRemixCount';

// 视频播放组件
const VideoWithPlayButton: React.FC<{
  src: string;
  className?: string;
}> = ({ src, className }) => (
  <video className={`${className} object-cover`} controls preload='metadata'>
    <source src={src} type='video/mp4' />
    Your browser does not support the video tag.
  </video>
);

interface PromptCardProps {
  generation: any;
  item: any;
}

export const PromptCard: React.FC<PromptCardProps> = ({ generation, item }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Derive data from generation
  const promptText: string = cleanQualityModifiers(generation?.prompt || '');
  const videoUrl: string | undefined = generation?.video_url;
  const imagePath: string | undefined = generation?.url_path;
  let metaData = generation?.meta_data;
  if (typeof metaData === 'string') {
    try {
      metaData = JSON.parse(metaData);
    } catch (e) {
      metaData = null;
    }
  }
  const isPromptHidden = !promptText && generation?.tool && !metaData?.style_id;
  const shouldShowTryTheTool = isPromptHidden;
  const { remixCount, remixButtonRef, incrementRemixCount } = useRemixCount({
    postId: item?.id,
    enabled: !shouldShowTryTheTool,
    fetchOnView: true,
  });

  const handleCopyPrompt = () => {
    if (isPromptHidden) {
      toast.error(t('post_card.prompt_hidden'));
      return;
    }
    navigator.clipboard.writeText(promptText);
    toast.success(t('post_card.prompt_copied'));
  };

  const handleCreateYours = async () => {
    if (!generation || !item || isNavigating) {
      return;
    }

    setIsNavigating(true);
    if (!shouldShowTryTheTool) {
      void incrementRemixCount();
    }

    try {
      // Check if this is an OC post
      const isOCPost = item.post_tags?.some(
        tag => tag.name.startsWith('@') || tag.name === 'OC',
      );

      if (isOCPost) {
        // Extract character_uniqid from tags or content
        let ocId = '';

        // Try to find in tags first
        for (const tag of item.post_tags || []) {
          const match = CHARACTER_MENTION_REGEX.exec(tag.name);
          if (match) {
            ocId = match[0].replace('@', '');
            break;
          }
        }

        if (ocId) {
          try {
            // Fetch character data to check if prompt is hidden
            const response = await fetch(
              `/api/getCharacterProfile?uniqid=${ocId}&post_id=${item.id}`,
            );
            const data = await response.json();

            // If prompt is hidden (empty character_description), go to oc-maker
            if (!data.character_description) {
              router.push('/oc-maker');
              return;
            }

            // If prompt is available, go to ai-anime-generator with prompt
            const params = new URLSearchParams();
            params.append('prompt', data.character_description);
            params.append('ocId', ocId);
            router.push(`/ai-anime-generator?${params.toString()}`);
            return;
          } catch (error) {
            console.error('Error fetching character data:', error);
            // On error, still allow navigation to oc-maker
            router.push('/oc-maker');
            return;
          }
        }
      }

      // Regular generation flow
      const route = getToolPageRoute(generation.tool, generation.meta_data);
      const params = buildCreateYoursParams(generation, item);
      const targetUrl = `${route}?${params.toString()}`;

      router.push(targetUrl);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      setIsNavigating(false);
    }
  };

  return (
    <Card className='p-2 bg-muted' shadow='sm'>
      <div className='flex gap-2 flex-1 items-start'>
        {videoUrl ? (
          <VideoWithPlayButton
            src={videoUrl}
            className='h-[90px] w-[90px] rounded-md'
          />
        ) : (
          <img
            alt={promptText}
            className='h-[90px] w-[90px] object-cover rounded-md'
            src={
              imagePath?.startsWith('http')
                ? imagePath
                : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/${imagePath}`
            }
          />
        )}
        <div className='flex-1 flex flex-col gap-2'>
          {isPromptHidden ? (
            <div className='flex items-center gap-2'>
              <Chip
                size='sm'
                variant='flat'
                color='default'
                startContent={<FaCrown className='w-4 h-4' />}
                className='text-xs'>
                {t('post_card.prompt_hidden')}
              </Chip>
            </div>
          ) : (
            <p className='text-[14px] max-h-[90px] overflow-hidden line-clamp-4'>
              {promptText}
            </p>
          )}
        </div>
      </div>
      <div className='flex justify-between py-1 pr-1 bg-card rounded-b-md'>
        <Button
          size='sm'
          className='text-[14px] h-[28px] text-foreground bg-card flex items-center mr-2 gap-1'
          onPress={handleCopyPrompt}
          isDisabled={isPromptHidden}>
          <HiOutlineDocumentDuplicate className='w-[16px] h-[16px]' />
          {t('post_card.copy_prompt')}
        </Button>
        <div ref={remixButtonRef} className='flex'>
          <Button
            size='sm'
            color='primary'
            className='text-[14px] h-[28px] rounded-full'
            startContent={
              !isNavigating ? <HiSparkles className='w-3 h-3' /> : undefined
            }
            isLoading={isNavigating}
            isDisabled={isNavigating}
            onPress={handleCreateYours}>
            {/* eslint-disable no-nested-ternary */}
            {isNavigating
              ? t('common:loading', { defaultValue: 'Loading...' })
              : shouldShowTryTheTool
                ? t('post_card.try_the_tool')
                : remixCount < 2
                  ? t('post_card.remix')
                  : t('post_card.remix_count', { count: remixCount })}
          </Button>
        </div>
      </div>
    </Card>
  );
};
