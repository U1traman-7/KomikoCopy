import React, { useState, useRef, useEffect } from 'react';
import { Card, CardBody, CardFooter, Button, Chip } from '@nextui-org/react';
import { IoPlay, IoArrowForward } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { VipRing } from '../VipBadge';

interface Author {
  name: string;
  avatar: string;
}

interface ActivityPost {
  id: string;
  title: string;
  description?: string;
  buttonText: string;
  href: string;
  vipPlan: string;
  image?: string;
  newTab?: boolean;
  video?: string;
  author: Author;
  isAd: boolean;
}

interface ActivityPostsProps {
  index?: number;
}

// 活动配置（不含翻译文本）
const ACTIVITY_POSTS_CONFIG = [
  // {
  //   id: 'video-to-video-ai',
  //   i18nKey: 'video_to_video',
  //   vipPlan: 'Starter',
  //   video:
  //     'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/assets/examples/video-to-video/v2v-launch.webm',
  //   href: '/video-to-video',
  //   author: {
  //     name: 'Komiko',
  //     avatar: '/images/favicons/apple-icon.png',
  //   },
  //   isAd: false,
  // },
  {
    id: 'anishort',
    i18nKey: 'anishort',
    vipPlan: 'Starter',
    video: '/images/promotion/anishort.webm',
    href: 'https://www.anishort.app/',
    newTab: true,
    author: {
      name: 'Anishort',
      avatar: '/images/icons/anishort.webp',
    },
    isAd: true,
  },
  {
    id: 'new-playground',
    i18nKey: 'new-playground',
    vipPlan: 'Plus',
    image: '/images/banners/cover/playground.webp',
    href: '/templates',
    author: {
      name: 'Komiko',
      avatar: '/images/favicons/apple-icon.png',
    },
    isAd: false,
  },
] as const;

const ActivityPostItem: React.FC<{
  activity: ActivityPost;
  activityIndex: number;
}> = ({ activity, activityIndex }) => {
  const { t } = useTranslation('home');
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // 提前50px
      },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      key={activity.id}
      className='caffelabs text-foreground mb-2'>
      <div className='transition-shadow duration-300 ease-in-out'>
        <VipRing plan={activity.vipPlan} intensity='light'>
          <Link
            href={activity.href}
            target={activity.newTab ? '_blank' : undefined}
            className='block cursor-pointer'>
            <div className='bg-card overflow-hidden'>
              <Card className='bg-card shadow-none rounded-t-xl'>
                <CardBody className='overflow-visible p-0 w-full rounded-t-xl relative'>
                  {!isVisible && (activity.image || activity.video) && (
                    // 占位�?
                    <div className='w-full h-40 bg-muted flex items-center justify-center'>
                      <IoPlay size={32} color='rgba(0,0,0,0.2)' />
                    </div>
                  )}

                  {isVisible && activity.image && (
                    <img
                      alt={activity.title}
                      className='w-full object-cover mx-auto rounded-none'
                      src={activity.image}
                      loading='lazy'
                    />
                  )}

                  {isVisible && activity.video && (
                    <video
                      src={activity.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload='metadata'
                      className='w-full h-full object-cover block'
                    />
                  )}

                  {/* Ad chip */}
                  {activity.isAd && (
                    <Chip
                      size='sm'
                      variant='solid'
                      color='primary'
                      className='absolute top-2 left-2 text-primary-foreground bg-blue-500 backdrop-blur-sm font-medium text-xs'>
                      {t('activity_posts.ad')}
                    </Chip>
                  )}
                </CardBody>

                {/* 标题区域 */}
                <CardFooter className='justify-between pt-2 px-3 pb-1 text-sm relative'>
                  <div className='flex flex-col gap-1'>
                    <b className='overflow-hidden max-h-12 whitespace-normal text-ellipsis text-sm leading-tight'>
                      {activity.title}
                    </b>
                    {/* description */}
                    {activity.description && (
                      <p className='text-xs md:text-sm text-default-500 leading-snug'>
                        {activity.description}
                      </p>
                    )}
                  </div>
                </CardFooter>
              </Card>

              {/* 用户信息区域 */}
              <div className='bg-card px-3 pb-2 pt-0 rounded-b-none'>
                <div className='flex justify-between items-center text-small'>
                  <div className='flex items-center align-center'>
                    <div
                      className={
                        'w-4 h-4 rounded-full bg-purple-50 flex items-center justify-center'
                      }>
                      <img
                        src={activity.author.avatar}
                        alt={activity.author.name}
                        className='w-3 h-3'
                        loading='lazy'
                      />
                    </div>
                    <div className='flex items-center'>
                      <p className='ml-1 text-xs text-default-500'>
                        {activity.author.name}
                      </p>
                    </div>
                  </div>
                  <div
                    className='text-primary-700 hover:text-primary-600 text-sm flex items-center gap-1'
                    onClick={e => e.stopPropagation()}>
                    {activity.buttonText}
                    <IoArrowForward className='w-4 h-4' />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </VipRing>
      </div>
    </div>
  );
};

export const ActivityPosts: React.FC<ActivityPostsProps> = ({ index }) => {
  const { t } = useTranslation('home');
  const [dismissedPosts, setDismissedPosts] = useState<string[]>([]);

  // 基于配置生成活动数据（含翻译�?
  const activities: ActivityPost[] = ACTIVITY_POSTS_CONFIG.map(config => ({
    ...config,
    title: t(`activity_posts.${config.i18nKey}.title`),
    buttonText: t(`activity_posts.${config.i18nKey}.button`),
    description: t(`activity_posts.${config.i18nKey}.description`, ''),
  }));

  // const handleDismiss = (postId: string) => {
  //   const newDismissed = [...dismissedPosts, postId];
  //   setDismissedPosts(newDismissed);
  // };

  // 如果指定了index，只显示对应的活�?
  const visibleActivities =
    index !== undefined && index >= 0 && index < activities.length
      ? activities
          .slice(index, index + 1)
          .filter(activity => !dismissedPosts.includes(activity.id))
      : activities.filter(activity => !dismissedPosts.includes(activity.id));

  if (visibleActivities.length === 0) {
    return null;
  }

  return (
    <>
      {visibleActivities.map((activity, activityIndex) => (
        <ActivityPostItem
          key={activity.id}
          activity={activity}
          activityIndex={activityIndex}
        />
      ))}
    </>
  );
};

export const ACTIVITY_POSTS_COUNT = ACTIVITY_POSTS_CONFIG.length;
