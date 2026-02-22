/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Tabs, Tab } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';

interface VideoToolsTabsProps {
  activeTab: 'video-to-video' | 'talking-head' | 'image-animation';
  className?: string;
}

export const VideoToolsTabs: React.FC<VideoToolsTabsProps> = ({
  activeTab,
  className,
}) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tabs = [
    {
      id: 'image-animation',
      label: t('video_tabs.image_or_text_to_video', 'Image Or Text'),
      path: '/image-animation-generator',
    },
    {
      id: 'video-to-video',
      label: t('video_tabs.video_to_video'),
      path: '/video-to-video',
    },
    // {
    //   id: 'text-to-animation',
    //   label: t('video_tabs.text_to_animation'),
    //   path: '/text-to-video',
    // },
    {
      id: 'talking-head',
      label: t('video_tabs.talking_head'),
      path: '/ai-talking-head',
    },
  ];

  const handleTabChange = (key: React.Key) => {
    if (isMounted) {
      const selectedTab = tabs.find(tab => tab.id === key);
      if (selectedTab) {
        router.push(selectedTab.path);
      }
    }
  };

  return (
    <div className={cn('flex justify-start gap-2', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleTabChange(tab.id)}
          className={cn(
            'pb-1 text-[12px] md:font-bold font-semibold transition-all duration-200 relative border-b-2 whitespace-nowrap',
            activeTab === tab.id
              ? 'text-primary-600 border-primary-600'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          )}>
          {tab.label}
        </button>
      ))}
    </div>
  );
};
