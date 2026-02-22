/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Tabs, Tab, Card, CardBody, Avatar, Button, Tooltip } from '@nextui-org/react';
import { AiOutlineHeart } from 'react-icons/ai';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { VipCrownInline } from '@/components/VipBadge';
import { useTranslation } from 'react-i18next';
import {
  IconPhoto,
  IconUsers,
  IconClock,
  IconCalendar,
  IconCalendarWeek,
  IconFlame,
  IconQuestionMark,
} from '@tabler/icons-react';
import { FaTheaterMasks } from 'react-icons/fa';

type Role = 'post' | 'creator' | 'character';
type Range = 'daily' | 'weekly' | 'monthly';

type PostRankingItem = {
  id: number;
  title: string;
  media: string[];
  media_type: string;
  uniqid: string;
  user_image?: string;
  user_name?: string;
  user_uniqid?: string;
  likes: number;
};

type CharacterRankingItem = {
  character_uniqid: string;
  character_name: string;
  character_pfp: string;
  user_image?: string;
  user_name?: string;
  user_uniqid?: string;
  collection_count: number;
  score: number;
};

type CreatorRankingItem = {
  id: string;
  user_uniqid: string;
  user_image?: string;
  user_name?: string;
  fans: number;
  posts: number;
  likes: number;
  following: boolean;
  vip: string;
};

type RankingData =
  | PostRankingItem[]
  | CharacterRankingItem[]
  | CreatorRankingItem[];

// 排名徽章组件
const RankBadge = ({
  index,
  variant = 'card',
}: {
  index: number;
  variant?: 'card' | 'avatar';
}) => {
  const medals = ['gold.svg', 'silver-2.svg', 'bronze-2.svg'];

  if (index < 3) {
    // 卡片样式：左上角，较小
    const cardStyle = 'w-7 h-9 sm:w-9 sm:h-11 md:w-10 md:h-12';
    // 头像样式：底部，稍大
    const avatarStyle = 'w-8 h-10 sm:w-10 sm:h-12 md:w-12 md:h-14';

    return (
      <img
        src={`/images/icons/medal/${medals[index]}`}
        alt={`${['gold', 'silver', 'bronze'][index]} medal`}
        className={variant === 'card' ? cardStyle : avatarStyle}
      />
    );
  }

  return (
    <span className='text-xs md:text-base font-semibold text-muted-foreground'>
      {String(index + 1).padStart(2, '0')}
    </span>
  );
};

// 获取卡片边框和背景样式 - 前三名有特殊边框
const getCardStyle = (index: number) => {
  if (index === 0) {
    // 第一名：金色边框 + 金色光晕
    return 'group relative rounded-xl md:rounded-2xl bg-card shadow-lg transition-all duration-300 hover:shadow-2xl border border-yellow-400/30 hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]';
  } else if (index === 1) {
    // 第二名：银色边框 + 银色光晕
    return 'group relative rounded-xl md:rounded-2xl bg-card shadow-lg transition-all duration-300 hover:shadow-2xl border border-border hover:border-muted-foreground/40 hover:shadow-[0_0_15px_rgba(156,163,175,0.2)]';
  } else if (index === 2) {
    // 第三名：铜色边框 + 橙色光晕
    return 'group relative rounded-xl md:rounded-2xl bg-card shadow-lg transition-all duration-300 hover:shadow-2xl border border-amber-400/60 hover:border-amber-500/70 hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]';
  }
  // 第4名及以后：普通样式
  return 'group relative rounded-3xl bg-card transition-all duration-300 hover:bg-muted pr-4';
};

export const RankingContent = () => {
  const router = useRouter();
  const { t } = useTranslation('feed');
  const [activeRole, setActiveRole] = useState<Role>('creator');
  const [activeRange, setActiveRange] = useState<Range>('weekly'); // creator/character 默认用 weekly
  const [data, setData] = useState<RankingData>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRankingData();
  }, [activeRole, activeRange]);

  const fetchRankingData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ranking?role=${activeRole}&range=${activeRange}`,
      );
      const result = await response.json();
      if (result.code === 1 && result.data) {
        setData(result.data.filter((item: any) => item !== null));
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Failed to fetch ranking data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (key: React.Key) => {
    setActiveRole(key as Role);
    if ((key === 'character' || key === 'creator') && activeRange === 'daily') {
      setActiveRange('weekly');
    }
    if (key === 'post' && activeRange === 'weekly') {
      setActiveRange('daily');
    }
  };

  const handleRangeChange = (key: React.Key) => {
    setActiveRange(key as Range);
  };

  const renderPostItem = (item: PostRankingItem, index: number) => {
    const mediaUrl = item.media && item.media.length > 0 ? item.media[0] : '';
    const isVideo = item.media_type === 'video';
    const cardStyle = getCardStyle(index);

    return (
      <Link
        key={item.id}
        href={`/post/${item.uniqid}`}
        className={`cursor-pointer flex items-center gap-2 md:gap-4 p-2 md:p-4 border-b border-border ${cardStyle}`}>
        {/* 排名数字 */}
        <div className='flex-shrink-0 w-6 md:w-10 flex items-center justify-center'>
          <RankBadge index={index} />
        </div>

        {/* 原图预览 */}
        <div className='flex-shrink-0'>
          <div className='w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden'>
            {mediaUrl ? (
              isVideo ? (
                <video
                  src={mediaUrl}
                  className='w-full h-full object-cover object-top'
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={item.title}
                  className='w-full h-full object-cover object-top'
                />
              )
            ) : (
              <div className='flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground'>
                {t('ranking.noPreview', 'No preview')}
              </div>
            )}
          </div>
        </div>

        {/* 文字信息区 */}
        <div className='flex-1 min-w-0 flex flex-col gap-1 md:gap-2'>
          {/* 作品名 + 点赞数 */}
          <div className='flex items-center justify-between gap-2 md:gap-3'>
            <h3 className='text-sm md:text-base font-semibold text-foreground truncate flex-1'>
              {item.title}
            </h3>
            <div className='flex items-center gap-0.5 md:gap-1 text-pink-500 flex-shrink-0'>
              <AiOutlineHeart className='text-sm md:text-lg' />
              <span className='text-xs md:text-sm font-semibold'>
                {item.likes}
              </span>
            </div>
          </div>

          {/* 创作者信息 */}
          <div className='flex items-center'>
            <span
              className='text-xs md:text-sm text-muted-foreground hover:text-foreground truncate cursor-pointer transition-colors'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/user/${item.user_uniqid}`);
              }}>
              {item.user_name}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const renderCharacterItem = (item: CharacterRankingItem, index: number) => {
    const cardStyle = getCardStyle(index);

    return (
      <Link
        href={`/character/${item.character_uniqid}`}
        key={item.character_uniqid}
        className={`flex items-center gap-4 p-2 md:p-4 rounded-xl transition-all duration-200 hover:bg-muted cursor-pointer border-b border-border ${cardStyle}`}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/character/${item.character_uniqid}`);
        }}>
        <div className='flex-shrink-0 w-6 md:w-8 flex items-center justify-center'>
          <RankBadge index={index} />
        </div>
        <div className='w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-md'>
          <img
            src={item.character_pfp}
            alt={item.character_name}
            className='w-full h-full object-cover object-top'
          />
        </div>
        <div className='flex-1 min-w-0 h-20 md:h-24 flex flex-col justify-center'>
          <h3 className='text-sm md:text-base font-semibold text-foreground truncate'>
            {item.character_name}
          </h3>
          <span
            className='text-xs md:text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors block mt-0.5 md:mt-1'
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/user/${item.user_uniqid}`);
            }}>
            {item.user_name}
          </span>
        </div>
        <div className='flex-shrink-0 w-12 md:w-16 flex items-center justify-end gap-0.5 md:gap-1 text-orange-500'>
          <IconFlame size={16} className='flex-shrink-0' />
          <span className='text-xs md:text-sm font-semibold'>
            {item.score || 0}
          </span>
        </div>
      </Link>
    );
  };

  const CreatorItem = ({
    item,
    index,
  }: {
    item: CreatorRankingItem;
    index: number;
  }) => {
    const [isFollowing, setIsFollowing] = useState(item.following);
    const [isLoading, setIsLoading] = useState(false);
    const cardStyle = getCardStyle(index);

    const handleFollow = async (user_id: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/follow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingUserId: user_id,
            value: 1,
          }),
        });
        if (response.ok) {
          toast.success(t('ranking.followSuccess'));
          setIsFollowing(true);
          setData(prevData =>
            prevData.map(prevItem =>
              prevItem.id === user_id
                ? { ...prevItem, following: true, fans: prevItem.fans + 1 }
                : prevItem,
            ),
          );
        } else {
          toast.error(t('ranking.followFailed'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Link
        href={`/user/${item.user_uniqid}`}
        className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl transition-all duration-200 cursor-pointer border-b border-border ${cardStyle}`}>
        <div className='flex-shrink-0 w-6 md:w-10 flex items-center justify-center'>
          <RankBadge index={index} />
        </div>
        <div className='flex-1 flex items-center gap-2 md:gap-3 min-w-0'>
          <div className='w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full overflow-hidden bg-muted'>
            <img
              src={item.user_image}
              alt={item.user_name}
              className='w-full h-full object-cover object-center'
            />
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='flex items-center gap-1 md:gap-1.5 text-sm md:text-base font-semibold text-foreground truncate'>
              {item.user_name}
              <VipCrownInline plan={item.vip || 'Free'} size='sm' />
            </h3>
            <div className='flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1 text-xs md:text-sm text-muted-foreground'>
              <span>
                {item.fans} {t('ranking.fans')}
              </span>
              <span>
                {item.posts} {t('ranking.posts')}
              </span>
            </div>
          </div>
          <div className='flex-shrink-0'>
            <Button
              variant='flat'
              size='sm'
              radius='full'
              className={`min-w-[60px] md:min-w-[70px] text-[10px] md:text-xs font-medium transition-opacity duration-200 hover:opacity-80 ${
                isFollowing
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
              isDisabled={isFollowing}
              isLoading={isLoading}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (!isFollowing) {
                  handleFollow(item.id);
                }
              }}>
              {isFollowing ? t('ranking.following') : t('ranking.follow')}
            </Button>
          </div>
        </div>
      </Link>
    );
  };

  const renderTopThree = () => {
    const topThree = data.slice(0, 3);

    if (activeRole === 'post') {
      return (
        <div className='flex justify-center items-start gap-2 md:gap-3 mb-8 px-2 md:px-4'>
          {topThree.map((item, index) => {
            const postItem = item as PostRankingItem;
            const mediaUrl = postItem.media?.[0] || '';
            const isVideo = postItem.media_type === 'video';
            const configs = [
              {
                width: 'w-28 sm:w-40 md:w-48',
                imgHeight: 'h-36 sm:h-48 md:h-56',
                textSize: 'text-xs sm:text-sm',
                marginTop: 'mt-0',
                order: 'order-2',
              }, // 第一名：在中间、最高
              {
                width: 'w-28 sm:w-40 md:w-48',
                imgHeight: 'h-36 sm:h-48 md:h-56',
                textSize: 'text-xs sm:text-sm',
                marginTop: 'mt-6 sm:mt-8',
                order: 'order-1',
              }, // 第二名：在左边、稍低
              {
                width: 'w-28 sm:w-40 md:w-48',
                imgHeight: 'h-36 sm:h-48 md:h-56',
                textSize: 'text-xs sm:text-sm',
                marginTop: 'mt-12 sm:mt-16',
                order: 'order-3',
              }, // 第三名：在右边、最低
            ];
            const config = configs[index];

            const cardStyle = getCardStyle(index);

            return (
              <Link
                key={postItem.id}
                href={`/post/${postItem.uniqid}`}
                className={`flex flex-col overflow-hidden ${config.width} ${config.marginTop} ${config.order} ${cardStyle}`}>
                {/* 排名角标 */}
                <div className='absolute left-1 sm:left-2 top-1 sm:top-2 z-20'>
                  <RankBadge index={index} />
                </div>

                {/* 图片区域 - 居中显示 */}
                <div className='p-1 sm:p-2'>
                  <div
                    className={`${config.imgHeight} rounded-lg sm:rounded-xl overflow-hidden bg-muted flex items-center justify-center`}>
                    {mediaUrl ? (
                      isVideo ? (
                        <video
                          src={mediaUrl}
                          className='w-full h-full object-contain'
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={postItem.title}
                          className='w-full h-full object-contain'
                        />
                      )
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-xs text-muted-foreground'>
                        No preview
                      </div>
                    )}
                  </div>
                </div>

                {/* 信息区域 */}
                <div className='flex flex-col gap-0.5 sm:gap-1 md:gap-1.5 px-2 sm:px-3 pb-2 sm:pb-3'>
                  <h3
                    className={`${config.textSize} font-semibold text-foreground truncate`}>
                    {postItem.title}
                  </h3>

                  <div className='flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground'>
                    <span
                      className='truncate hover:text-foreground cursor-pointer transition-colors max-w-[60%]'
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/user/${postItem.user_uniqid}`);
                      }}>
                      {postItem.user_name}
                    </span>
                    <div className='flex items-center gap-0.5 sm:gap-1 text-pink-500 flex-shrink-0'>
                      <AiOutlineHeart className='text-xs sm:text-sm' />
                      <span className='text-[10px] sm:text-xs font-semibold'>
                        {postItem.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      );
    }

    if (activeRole === 'character') {
      return (
        <div className='flex justify-center items-start gap-2 md:gap-3 mb-4 md:mb-8 px-2 md:px-4'>
          {topThree.map((item, index) => {
            const charItem = item as CharacterRankingItem;
            const configs = [
              {
                width: 'w-28 sm:w-40 md:w-48',
                imgHeight: 'h-36 sm:h-48 md:h-56',
                textSize: 'text-xs sm:text-sm',
                marginTop: 'mt-0',
                order: 'order-2',
              }, // 第一名：在中间、最高
              {
                width: 'w-28 sm:w-40 md:w-48',
                imgHeight: 'h-36 sm:h-48 md:h-56',
                textSize: 'text-xs sm:text-sm',
                marginTop: 'mt-6 sm:mt-8',
                order: 'order-1',
              }, // 第二名：在左边、稍低
              {
                width: 'w-28 sm:w-40 md:w-48',
                imgHeight: 'h-36 sm:h-48 md:h-56',
                textSize: 'text-xs sm:text-sm',
                marginTop: 'mt-12 sm:mt-16',
                order: 'order-3',
              }, // 第三名：在右边、最低
            ];
            const config = configs[index];
            const cardStyle = getCardStyle(index);

            return (
              <Link
                key={charItem.character_uniqid}
                href={`/character/${charItem.character_uniqid}`}
                className={`flex flex-col overflow-hidden ${config.width} ${config.marginTop} ${config.order} ${cardStyle}`}>
                {/* 排名角标 */}
                <div className='absolute left-1 sm:left-2 top-1 sm:top-2 z-20'>
                  <RankBadge index={index} />
                </div>

                {/* 图片区域 - 显示上半部分 */}
                <div className='p-1 sm:p-2'>
                  <div
                    className={`${config.imgHeight} rounded-lg sm:rounded-xl overflow-hidden bg-muted`}>
                    <img
                      src={charItem.character_pfp}
                      alt={charItem.character_name}
                      className='w-full h-full object-cover object-top'
                    />
                  </div>
                </div>

                {/* 信息区域 */}
                <div className='flex flex-col gap-0.5 sm:gap-1 md:gap-1.5 px-2 sm:px-3 pb-2 sm:pb-3'>
                  <h3
                    className={`${config.textSize} font-semibold text-foreground truncate`}>
                    {charItem.character_name}
                  </h3>

                  <div className='flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground'>
                    <span
                      className='truncate hover:text-foreground cursor-pointer transition-colors max-w-[60%]'
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/user/${charItem.user_uniqid}`);
                      }}>
                      {charItem.user_name}
                    </span>
                    <div className='flex items-center gap-0.5 sm:gap-1 text-orange-500 flex-shrink-0'>
                      <IconFlame
                        size={12}
                        className='flex-shrink-0 sm:w-4 sm:h-4'
                      />
                      <span className='text-[10px] sm:text-xs font-semibold'>
                        {charItem.score || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      );
    }

    // Creator
    return (
      <div className='flex justify-center items-end gap-4 md:gap-8 my-4 md:mb-8 px-2 md:px-4'>
        {topThree.map((item, index) => {
          const creatorItem = item as CreatorRankingItem;
          const configs = [
            {
              avatarSize: 'w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40',
              borderColor: 'border-yellow-400/60',
              textSize: 'text-xs sm:text-sm md:text-base',
              order: 1,
              marginBottom: 'mb-6 sm:mb-8',
            }, // 第一名：最大、在中间、底部留空间
            {
              avatarSize: 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32',
              borderColor: 'border-border',
              textSize: 'text-[10px] sm:text-xs md:text-sm',
              order: 0,
              marginBottom: 'mb-0',
            }, // 第二名：在左边
            {
              avatarSize: 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32',
              borderColor: 'border-orange-400/60',
              textSize: 'text-[10px] sm:text-xs md:text-sm',
              order: 2,
              marginBottom: 'mb-0',
            }, // 第三名：在右边
          ];
          const config = configs[index];

          return (
            <Link
              key={creatorItem.id}
              href={`/user/${creatorItem.user_uniqid}`}
              className={`flex flex-col items-center gap-2 sm:gap-3 ${config.marginBottom}`}
              style={{ order: config.order }}>
              {/* 头像容器 - 圆形边框 */}
              <div className='relative'>
                {/* 圆形边框 */}
                <div
                  className={`${config.avatarSize} rounded-full border-2 ${config.borderColor} shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden bg-muted`}>
                  <img
                    src={creatorItem.user_image || ''}
                    alt={creatorItem.user_name || ''}
                    className='w-full h-full object-cover object-center'
                  />
                </div>

                {/* 排名徽章在底部 */}
                <div className='absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 z-20'>
                  <RankBadge index={index} variant='avatar' />
                </div>
              </div>

              {/* 名字在头像下方 */}
              <div className='text-center max-w-[80px] sm:max-w-[100px] md:max-w-[120px]'>
                <h3
                  className={`${config.textSize} font-semibold text-foreground truncate`}>
                  {creatorItem.user_name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className='flex justify-center items-center py-20'>
          <div className='text-muted-foreground'>{t('ranking.loading')}</div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className='flex justify-center items-center py-20'>
          <div className='text-muted-foreground'>{t('ranking.noData')}</div>
        </div>
      );
    }

    const restData = data.slice(3);

    if (activeRole === 'post') {
      return (
        <>
          {data.length >= 3 && renderTopThree()}
          <div className='flex flex-col gap-2 md:gap-4'>
            {(restData as PostRankingItem[]).map((item, index) =>
              renderPostItem(item, index + 3),
            )}
          </div>
        </>
      );
    }

    if (activeRole === 'character') {
      return (
        <>
          {data.length >= 3 && renderTopThree()}
          <div className='flex flex-col gap-2 md:gap-4'>
            {(restData as CharacterRankingItem[]).map((item, index) =>
              renderCharacterItem(item, index + 3),
            )}
          </div>
        </>
      );
    }

    return (
      <>
        {data.length >= 3 && renderTopThree()}
        <div className='flex flex-col md:gap-4 gap-2'>
          {(restData as CreatorRankingItem[]).map((item, index) => (
            <CreatorItem key={item.id} item={item} index={index + 3} />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className='w-full px-0 md:px-6 md:py-2 border-t border-border pt-2'>
      <div className='max-w-7xl mx-auto'>
        {/* Tabs 和 Range 选择器在同一行 */}
        <div className='flex items-center gap-2 md:gap-4 mb-2 overflow-x-auto'>
          {/* 左侧：分类 Tabs */}
          <Tabs
            selectedKey={activeRole}
            onSelectionChange={handleRoleChange}
            variant='light'
            size='sm'
            radius='full'
            classNames={{
              tabContent:
                'text-xs md:text-sm font-medium text-muted-foreground group-data-[selected=true]:font-bold group-data-[selected=true]:text-foreground',
            }}>
            <Tab
              key='creator'
              title={
                <div className='flex items-center gap-1 md:gap-1.5'>
                  <IconUsers
                    size={14}
                    className='flex-shrink-0 md:w-4 md:h-4'
                  />
                  <span
                    className={
                      activeRole !== 'creator' ? 'hidden md:inline' : ''
                    }>
                    {t('ranking.creatorRanking')}
                  </span>
                </div>
              }
            />
            <Tab
              key='character'
              title={
                <div className='flex items-center gap-1 md:gap-1.5'>
                  <FaTheaterMasks
                    size={14}
                    className='flex-shrink-0 md:w-4 md:h-4'
                  />
                  <span
                    className={
                      activeRole !== 'character' ? 'hidden md:inline' : ''
                    }>
                    {t('ranking.characterRanking')}
                  </span>
                </div>
              }
            />
            <Tab
              key='post'
              title={
                <div className='flex items-center gap-1 md:gap-1.5'>
                  <IconPhoto
                    size={14}
                    className='flex-shrink-0 md:w-4 md:h-4'
                  />
                  <span
                    className={activeRole !== 'post' ? 'hidden md:inline' : ''}>
                    {t('ranking.postRanking')}
                  </span>
                </div>
              }
            />
          </Tabs>

          {/* 分隔线 */}
          <div className='h-6 md:h-8 w-px bg-border flex-shrink-0' />

          {/* 右侧：时间范围 Tabs */}
          <Tabs
            selectedKey={activeRange}
            onSelectionChange={handleRangeChange}
            variant='solid'
            radius='full'
            size='sm'
            classNames={{
              tabContent:
                'text-xs md:text-sm text-muted-foreground group-data-[selected=true]:font-bold group-data-[selected=true]:text-foreground',
            }}>
            {activeRole === 'post' && (
              <Tab
                key='daily'
                title={
                  <div className='flex items-center gap-1 md:gap-1.5'>
                    <IconClock
                      size={14}
                      className='flex-shrink-0 md:w-4 md:h-4'
                    />
                    <span
                      className={
                        activeRange !== 'daily' ? 'hidden md:inline' : ''
                      }>
                      {t('ranking.daily')}
                    </span>
                  </div>
                }
              />
            )}
            {activeRole !== 'post' && (
              <Tab
                key='weekly'
                title={
                  <div className='flex items-center gap-1 md:gap-1.5'>
                    <IconCalendarWeek
                      size={14}
                      className='flex-shrink-0 md:w-4 md:h-4'
                    />
                    <span
                      className={
                        activeRange !== 'weekly' ? 'hidden md:inline' : ''
                      }>
                      {t('ranking.weekly')}
                    </span>
                  </div>
                }
              />
            )}
            <Tab
              key='monthly'
              title={
                <div className='flex items-center gap-1 md:gap-1.5'>
                  <IconCalendar
                    size={14}
                    className='flex-shrink-0 md:w-4 md:h-4'
                  />
                  <span
                    className={
                      activeRange !== 'monthly' ? 'hidden md:inline' : ''
                    }>
                    {t('ranking.monthly')}
                  </span>
                </div>
              }
            />
          </Tabs>
        </div>

        {/* 内容区 */}
        <Card className='bg-card/80 backdrop-blur-sm rounded-2xl border border-border relative'>
          {/* 规则说明 Tooltip - 日榜不显示，周榜和月榜显示 */}
          {/*activeRange !== 'daily' && (
            <div className='absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-10'>
              <Tooltip
                placement='bottom-end'
                content={
                  <div className='max-w-[200px] sm:max-w-[250px] px-2 py-1'>
                    <p className='font-semibold text-xs sm:text-sm mb-1'>
                      {activeRange === 'weekly'
                        ? t('ranking.weeklyRules')
                        : t('ranking.monthlyRules')}
                    </p>
                    <p className='whitespace-pre-line text-[10px] sm:text-xs'>
                      {activeRange === 'weekly'
                        ? t('ranking.weeklyRulesContent')
                        : t('ranking.monthlyRulesContent')}
                    </p>
                  </div>
                }>
                <div className='flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full border border-border bg-muted hover:bg-muted transition-colors cursor-help'>
                  <IconQuestionMark className='w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-muted-foreground hover:text-foreground transition-colors' />
                </div>
              </Tooltip>
            </div>
          )*/}
          <CardBody className='p-2 md:p-6'>{renderContent()}</CardBody>
        </Card>
      </div>
    </div>
  );
};
