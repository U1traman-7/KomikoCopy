/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import { Tabs, Tab, Card, CardBody, Avatar, Button } from '@nextui-org/react';
import { AiOutlineHeart } from 'react-icons/ai';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { VipCrownInline } from '@/components/VipBadge';

const DynamicImage = dynamic(
  () => import('@nextui-org/react').then(mod => mod.Image),
  { ssr: false },
);

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

export default function RankingPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>('post');
  const [activeRange, setActiveRange] = useState<Range>('daily');
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

    return (
      <Link
        key={item.id}
        href={`/post/${item.uniqid}`}
        className='w-full flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors'>
        <div className='w-16 h-16 flex items-center justify-center'>
          <div className='w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-lg'>
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
        <div className='flex items-center gap-4 w-[calc(100%-5rem)]'>
          <div
            href={`/post/${item.uniqid}`}
            className='w-20 h-20 rounded-lg overflow-hidden flex-shrink-0'>
            {mediaUrl && (
              <>
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    className='w-full h-full object-cover'
                    muted
                  />
                ) : (
                  <DynamicImage
                    src={mediaUrl}
                    alt={item.title}
                    className='w-full h-full object-cover'
                  />
                )}
              </>
            )}
          </div>
          <div className='min-w-0 w-[calc(100%-6rem)]'>
            <h3 className='text-base font-medium text-foreground truncate'>
              {item.title}
            </h3>
            <div className='flex items-center gap-2 mt-2'>
              <Avatar
                src={item.user_image}
                size='sm'
                className='w-5 h-5'
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/user/${item.user_uniqid}`);
                }}
              />
              <span
                className='text-sm text-muted-foreground hover:text-foreground'
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/user/${item.user_uniqid}`);
                }}>
                {item.user_name}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-1 text-muted-foreground'>
            <AiOutlineHeart className='text-lg' />
            <span className='text-sm font-medium'>{item.likes}</span>
          </div>
        </div>
      </Link>
    );
  };

  const renderCharacterItem = (item: CharacterRankingItem, index: number) => {
    return (
      <Link
        href={`/character/${item.character_uniqid}`}
        key={item.character_uniqid}
        className='flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors'
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/character/${item.character_uniqid}`);
        }}>
        <div className='flex-shrink-0 w-16 h-16 flex items-center justify-center'>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              index === 0
                ? 'bg-pink-500'
                : index === 1
                  ? 'bg-blue-500'
                  : index === 2
                    ? 'bg-orange-500'
                    : 'bg-muted-foreground'
            }`}>
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
        <div className='flex-1 flex items-center gap-4'>
          <div className='w-20 h-20 rounded-lg overflow-hidden flex-shrink-0'>
            <DynamicImage
              src={item.character_pfp}
              alt={item.character_name}
              className='w-full h-full object-cover'
            />
          </div>
          <div className='flex-1 min-w-0'>
            <h3 className='text-base font-medium text-foreground truncate'>
              {item.character_name}
            </h3>
            <div className='flex items-center gap-2 mt-2'>
              <Avatar
                src={item.user_image}
                size='sm'
                className='w-5 h-5'
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/user/${item.user_uniqid}`);
                }}
              />
              <span
                className='text-sm text-muted-foreground hover:text-foreground'
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/user/${item.user_uniqid}`);
                }}>
                {item.user_name}
              </span>
            </div>
          </div>
          <div className='flex items-center gap-1 text-orange-500'>
            <span className='text-sm font-medium'>{item.score || 0}</span>
          </div>
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
    const [isFollowing, setIsFollowing] = useState(false);
    const handleFollow = async (user_id: string) => {
      setIsFollowing(true);
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
          toast.success('Follow successfully');
          setData(prevData =>
            prevData.map(item =>
              item.id === user_id
                ? { ...item, following: true, fans: item.fans + 1 }
                : item,
            ),
          );
        } else {
          toast.error('Failed to follow');
        }
      } finally {
        setIsFollowing(false);
      }
    };

    return (
      <Link
        href={`/user/${item.user_uniqid}`}
        className='flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors'>
        <div className='flex-shrink-0 w-16 h-16 flex items-center justify-center'>
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              index === 0
                ? 'bg-pink-500'
                : index === 1
                  ? 'bg-blue-500'
                  : index === 2
                    ? 'bg-orange-500'
                    : 'bg-muted-foreground'
            }`}>
            {index + 1}
          </div>
        </div>
        <div className='flex-1 flex items-center gap-4'>
          <Avatar src={item.user_image} size='lg' className='w-16 h-16' />
          <div className='flex-1 min-w-0'>
            <h3 className='flex items-center gap-1 text-base font-medium text-foreground truncate'>
              {item.user_name}
              <VipCrownInline plan={item.vip || 'Free'} size='sm' />
            </h3>
            <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
              <span>粉丝 {item.fans}</span>
              <span>作品 {item.posts}</span>
            </div>
          </div>
          <div className='flex flex-col items-center gap-1 text-muted-foreground'>
            <Button
              variant='flat'
              size='sm'
              radius='full'
              isDisabled={item.following}
              isLoading={isFollowing}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                handleFollow(item.id);
              }}>
              {item.following ? 'Following' : 'Follow'}
            </Button>
          </div>
        </div>
      </Link>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className='flex justify-center items-center py-20'>
          <div className='text-muted-foreground'>加载中...</div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className='flex justify-center items-center py-20'>
          <div className='text-muted-foreground'>暂无数据</div>
        </div>
      );
    }

    if (activeRole === 'character') {
      return (
        <div className='flex flex-col gap-4'>
          {(data as CharacterRankingItem[]).map((item, index) =>
            renderCharacterItem(item, index),
          )}
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-4'>
        {activeRole === 'post' &&
          (data as PostRankingItem[]).map((item, index) =>
            renderPostItem(item, index),
          )}
        {activeRole === 'creator' &&
          (data as CreatorRankingItem[]).map((item, index) => (
            <CreatorItem key={item.id} item={item} index={index} />
          ))}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>排名榜 - 作品榜</title>
      </Head>
      <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='w-full pt-1 sm:pt-5 md:pt-10 p-2 md:p-4 lg:pl-60 2xl:pl-72 h-full mb-[5rem] lg:mr-8'>
            <div className='max-w-6xl mx-auto px-4 py-8'>
              {/* Back button and Title */}
              <div className='mb-6 flex items-center gap-4'>
                <button
                  onClick={() => router.back()}
                  className='text-2xl text-muted-foreground hover:text-foreground'>
                  ←
                </button>
                <div>
                  <h1 className='text-3xl font-bold text-heading'>
                    {activeRole === 'post'
                      ? '作品榜'
                      : activeRole === 'creator'
                        ? '创作者榜'
                        : '角色榜'}
                  </h1>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {activeRole === 'post'
                      ? 'LIST OF WORKS'
                      : activeRole === 'creator'
                        ? 'CREATOR OF WORKS'
                        : 'ELEMENTUM LIST'}
                  </p>
                </div>
              </div>

              {/* Main Role Tabs */}
              <div className='mb-6'>
                <Tabs
                  selectedKey={activeRole}
                  onSelectionChange={handleRoleChange}
                  variant='solid'
                  classNames={{
                    tabList: 'bg-card rounded-lg p-1',
                    tab: 'px-6',
                    tabContent: 'text-sm font-medium',
                  }}>
                  <Tab key='post' title='作品榜' />
                  <Tab key='creator' title='创作者榜' />
                  <Tab key='character' title='角色榜' />
                </Tabs>
              </div>

              {/* Range Tabs */}
              <div className='mb-6 flex justify-end'>
                <Tabs
                  selectedKey={activeRange}
                  onSelectionChange={handleRangeChange}
                  variant='light'
                  classNames={{
                    tabList: 'bg-card rounded-lg',
                    tab: 'px-6',
                    tabContent: 'text-sm',
                  }}>
                  {activeRole === 'post' && <Tab key='daily' title='日榜' />}
                  {activeRole !== 'post' && <Tab key='weekly' title='周榜' />}
                  <Tab key='monthly' title='月榜' />
                </Tabs>
              </div>

              {/* Content */}
              <Card className='bg-card rounded-2xl shadow-lg'>
                <CardBody className='p-6'>{renderContent()}</CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
