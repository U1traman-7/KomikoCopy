import {
  Link,
  NextUIProvider,
  useDisclosure,
  Spinner,
  Button,
  Tabs,
  Tab,
  Card,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useEffect, useState, startTransition, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MdArrowBack, MdOutlineCollections } from 'react-icons/md';
import { FaUsers } from 'react-icons/fa';
import { RiUserLine } from 'react-icons/ri';

import toast, { Toaster } from 'react-hot-toast';
import { Header } from '../../Components/Header';
import { CreateCharacterButton } from '../../Components/MainApp';
import { Sidebar } from '../../Components/Sidebar';
import { authAtom, profileAtom } from '../../state';
import { useAtomValue } from 'jotai';
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';

import { getCharacterProfile } from '../../utilities';
import { useTranslation } from 'react-i18next';
import { SEOTags } from '@/components/common/SEOTags';
import { useLoginModal } from '@/hooks/useLoginModal';
import { useCharacterSEO } from '@/hooks/useCharacterSEO';
import { CharacterCard } from '@/Components/character/CharacterCard';
import { CharacterActions } from '@/Components/character/CharacterActions';
import { DeleteConfirmModal } from '@/Components/character/DeleteConfirmModal';
import { useRecentCharacters } from '@/hooks/useRecentCharacters';
import React, { Suspense, useCallback } from 'react';
import useMobileScreen from '@/hooks/useMobileScreen';
import { CharacterAdopters } from '@/Components/character/CharacterAdopters';
import { NsfwToggle } from '@/Components/NsfwToggle';
import { getLocalizedField } from '../../utils/i18nText';

// Only lowercase first letter for English text (other languages may not have this concept or have complex rules)
const lowercaseFirstLetter = (str: string, locale: string) => {
  if (!locale.startsWith('en')) {
    return str;
  }
  return str.charAt(0).toLocaleLowerCase(locale) + str.slice(1);
};
// 使用 React.lazy 延迟加载 CharacterFeed
const CharacterFeed = React.lazy(() =>
  import('@/Components/character/CharacterFeed').then(mod => ({
    default: mod.CharacterFeed,
  })),
);

function Content({
  charData,
  scrollContainerRef,
}: {
  charData: any;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const { t, i18n } = useTranslation('character');
  const isMobile = useMobileScreen();
  if (!charData.is_official) return null;

  // 获取当前语言
  const currentLocale = i18n.language || 'en';

  // 获取本地化文本（支持 i18n 列格式）
  const localizedCharacterName = getLocalizedField(
    charData,
    'character_name',
    currentLocale,
  );
  const localizedIntro = getLocalizedField(charData, 'intro', currentLocale);
  const localizedPersonality = getLocalizedField(
    charData,
    'personality',
    currentLocale,
  );
  const localizedCategory = getLocalizedField(
    charData,
    'category',
    currentLocale,
  );

  return (
    <div className='text-center'>
      <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
        {t('whoIs', { character_name: localizedCharacterName })}
      </h2>
      <p className='mx-auto mb-6 md:mb-8 max-w-2xl text-sm md:text-lg text-muted-foreground'>
        {localizedCharacterName}{' '}
        {t('popularCharacterFrom', {
          world_name: localizedCategory,
        })}{' '}
        {localizedIntro}
      </p>
      <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
        {t('personalityQuestion', { character_name: localizedCharacterName })}
      </h2>
      <p className='mx-auto mb-6 md:mb-8 max-w-2xl text-sm md:text-lg text-muted-foreground'>
        {localizedCharacterName} {t('characterIs')}{' '}
        {lowercaseFirstLetter(localizedPersonality, currentLocale)}
      </p>
      <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
        {t('createAIArt', { character_name: localizedCharacterName })}
      </h2>
      <p className='mx-auto mb-6 md:mb-8 max-w-2xl text-sm md:text-lg text-muted-foreground'>
        {t('aiTrainingDescription', {
          character_name: localizedCharacterName,
          world_name: localizedCategory,
        })}
      </p>
      <div className='w-full flex justify-center items-center'>
        <Button
          color='primary'
          size={isMobile ? 'md' : 'lg'}
          className='px-4 md:px-8 text-base md:text-lg font-semibold'
          onPress={() => {
            console.log('generate fanart scroll');
            scrollContainerRef.current?.scrollTo?.({
              top: 0,
              behavior: 'smooth',
            });
          }}>
          {t('generateFanartNow', { character_name: localizedCharacterName })}
        </Button>
      </div>
    </div>
  );
}

export default function Page({ initialCharData }: { initialCharData: any }) {
  const { t } = useTranslation('character');
  const router = useRouter();
  const { character_id, collected } = router.query;

  // 登录modal相关
  const { onOpen, LoginModal } = useLoginModal();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 提取seo信息
  const { generateStructuredData } = useCharacterSEO();

  // Recent characters hook
  const { addToRecent } = useRecentCharacters();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.characters', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  // const [selectedCharName, setSelectedCharName] = useState<string>('');
  const [allCharData, setAllCharData] = useState<any[]>([]);
  const [charData, setCharData] = useState(initialCharData);

  const [isDeleting, setIsDeleting] = useState(false);
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onOpenChange: onDeleteModalOpenChange,
  } = useDisclosure();

  // 是否是当前用户的角色
  const [isOwnCharacter, setIsOwnCharacter] = useState<boolean>(false);
  // 收集操作loading状态
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  // 收藏状态
  const [isCollected, setIsCollected] = useState<boolean>(false);
  // 检查收藏状态loading
  const [isCheckingCollection, setIsCheckingCollection] =
    useState<boolean>(false);
  // Track if component is mounted to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);
  // Track selected tab to conditionally render Feed components
  const [selectedTab, setSelectedTab] = useState<string>('all-posts');
  // NSFW mode state for feed
  const [nsfwMode, setNsfwMode] = useState(false);

  // Handle NSFW mode change
  const handleNsfwModeChange = useCallback((isNsfwMode: boolean) => {
    setNsfwMode(isNsfwMode);
  }, []);

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 检查是否是当前用户的角色
  useEffect(() => {
    startTransition(() => {
      if (isAuth && profile.authUserId && charData && charData.authUserId) {
        setIsOwnCharacter(charData.authUserId === profile.authUserId);
      } else {
        setIsOwnCharacter(false);
      }
    });
  }, [isAuth, profile.authUserId, charData?.authUserId]);

  useEffect(() => {
    if (collected === 'true') {
      toast.success(
        t('collectedSuccess') || 'Character collected successfully',
      );
      // 清除URL参数，避免刷新页面时重复显示toast
      const newUrl = `/character/${character_id}`;
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [collected, character_id, router, t]);

  // 检查收藏状态
  useEffect(() => {
    const checkCollectionStatus = async () => {
      if (typeof charData.is_collected === 'boolean') {
        startTransition(() => {
          setIsCollected(charData.is_collected);
          setIsCheckingCollection(false);
        });
        return;
      }

      // 如果用户未登录或角色ID无效，设为未收藏
      if (
        !isAuth ||
        !charData.character_uniqid ||
        charData.character_uniqid === 'loading...'
      ) {
        startTransition(() => {
          setIsCollected(false);
          setIsCheckingCollection(false);
        });
        return;
      }

      // 自己的角色不需要检查收藏状态
      if (isAuth && profile.authUserId === charData.authUserId) {
        startTransition(() => {
          setIsCollected(false);
          setIsCheckingCollection(false);
        });
        return;
      }

      // 开始检查收藏状态
      startTransition(() => {
        setIsCheckingCollection(true);
      });
      try {
        const response = await fetch(
          `/api/checkCollectedCharacter?character_uniqid=${charData.character_uniqid}`,
        );
        const result = await response.json();
        startTransition(() => {
          if (result.code === 1) {
            setIsCollected(result.data.is_collected);
          } else {
            setIsCollected(false);
          }
        });
      } catch (error) {
        console.error('Error checking collection status:', error);
        startTransition(() => {
          setIsCollected(false);
        });
      } finally {
        startTransition(() => {
          setIsCheckingCollection(false);
        });
      }
    };

    checkCollectionStatus();
  }, [
    isAuth,
    charData.character_uniqid,
    charData.is_collected,
    charData.authUserId,
    profile.authUserId,
  ]);

  // 收集/取消收集角色
  const handleCollectCharacter = async () => {
    if (!isAuth) {
      onOpen();
      return;
    }

    if (!charData.character_uniqid || isCollecting) {
      return;
    }

    setIsCollecting(true);
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character_uniqid: charData.character_uniqid,
          action: isCollected ? 'uncollect' : 'collect',
        }),
      });

      const result = await response.json();
      if (result.code === 1) {
        const newCollectedStatus = !isCollected;
        setIsCollected(newCollectedStatus);
        setCharData(prev => ({
          ...prev,
          is_collected: newCollectedStatus,
          num_collected: newCollectedStatus
            ? (prev.num_collected || 0) + 1
            : Math.max(0, (prev.num_collected || 0) - 1),
        }));
        setAllCharData(prev =>
          prev.map(char =>
            char.character_uniqid === charData.character_uniqid
              ? {
                  ...char,
                  is_collected: newCollectedStatus,
                  num_collected: newCollectedStatus
                    ? (char.num_collected || 0) + 1
                    : Math.max(0, (char.num_collected || 0) - 1),
                }
              : char,
          ),
        );
        toast.success(
          isCollected ? t('uncollectedSuccess') : t('collectedSuccess'),
        );
        // 追踪收集事件
        try {
          mixpanel.track(
            isCollected ? 'uncollect.character' : 'collect.character',
            {
              character_uniqid: charData.character_uniqid,
              character_name: charData.character_name,
            },
          );
        } catch (error) {}
      } else {
        toast.error(
          result.message ||
            (isCollected ? t('uncollectFailed') : t('collectFailed')),
        );
      }
    } catch (error) {
      console.error('Error handling collection:', error);
      toast.error(isCollected ? t('uncollectFailed') : t('collectFailed'));
    } finally {
      setIsCollecting(false);
    }
  };

  // Function to delete character
  const deleteCharacter = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/deleteCharacter?uniqid=${charData.character_uniqid}`,
        {
          method: 'DELETE',
        },
      );

      const result = await response.json();

      if (response.ok) {
        setIsDeleting(false);
        toast.success(
          t('characterDeleted') || 'Character deleted successfully',
        );

        setAllCharData(
          allCharData.filter(
            char => char.character_uniqid !== charData.character_uniqid,
          ),
        );

        // Redirect to the first character or home page
        if (allCharData.length > 1) {
          const nextChar = allCharData.find(
            char => char.character_uniqid !== charData.character_uniqid,
          );
          if (nextChar) {
            router.push(`/character/${nextChar.character_uniqid}`);
          } else {
            // 返回上一页
            router.back();
          }
        } else {
          // 返回上一页
          router.back();
        }
      } else {
        setIsDeleting(false);
        toast.error(
          result.error || t('deleteFailed') || 'Failed to delete character',
        );
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      setIsDeleting(false);
      toast.error(t('deleteFailed') || 'Failed to delete character');
    }
  };

  // 检查数据是否有效加载
  const isDataLoaded =
    charData &&
    charData.character_uniqid !== 'loading...' &&
    charData.character_name !== 'Character not found';

  // SEO fallback values
  // const seoTitle = isDataLoaded
  //   ? `${t('aiCharacter')}: ${charData.character_name} | KomikoAI`
  //   : `${t('aiCharacter')} | KomikoAI`;
  const seoTitle = isDataLoaded
    ? charData.character_name
    : `${t('aiCharacter')} | KomikoAI`;

  // const seoDescription = isDataLoaded
  //   ? generatePageDescription(charData)
  //   : t('characterPageDefault') ||
  //     'Discover AI-generated characters on KomikoAI. Create, share and explore unique anime characters.';
  const seoDescription = isDataLoaded
    ? charData.intro
    : t('characterPageDefault') ||
      'Discover AI-generated characters on KomikoAI. Create, share and explore unique anime characters.';

  // const seoKeywords = isDataLoaded
  //   ? extractCharacterKeywords(charData)
  //   : t('keyword_oc') + ', ' + t('keyword_ai_character');
  const name = charData.character_name;
  const character_name = charData.character_name;
  const seoKeywords = charData.is_official
    ? `${character_name}, ${character_name} fanart, ${character_name} art, ${character_name} anime art, ${character_name} AI art, ${character_name} AI generator, ${character_name} generator, ${character_name} OC, $${character_name} pfp, ${character_name} OC Maker, ai ${character_name}`
    : `${name}, ${name} fan art, ${name} art, ${name} AI art, ${name} AI generator, fan art, AI art, original character, oc, ai character, oc maker, oc generator`;

  return (
    <NextUIProvider>
      <Head>
        <title>{seoTitle}</title>
        <meta name='title' content={seoTitle} />
        <SEOTags
          canonicalPath={`/character/${character_id}`}
          title={seoTitle}
          description={seoDescription}
          keywords={seoKeywords}
          ogImage={
            isDataLoaded ? charData.character_pfp : '/images/social.webp'
          }
          structuredData={
            isDataLoaded ? generateStructuredData(charData) : null
          }
          locale={router.locale || 'en'}
        />
        {/* 添加作者信息 */}
        <meta
          name='author'
          content={isDataLoaded ? charData.user_name || 'KomikoAI' : 'KomikoAI'}
        />
        {isDataLoaded && charData.is_nsfw ? (
          <meta name='robots' content='noindex, nofollow' />
        ) : (
          <meta name='robots' content='index, follow' />
        )}
      </Head>
      <Analytics />
      <div>
        <Toaster position='top-right' />
      </div>
      <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />
        <div className='flex h-screen'>
          <Sidebar />
          <div
            className='overflow-y-auto p-4  pt-16 md:pt-20 pb-24 w-full h-full bg-muted lg:pl-[240px] '
            ref={scrollContainerRef}>
            {/* 返回 */}
            <div className='w-full max-w-xl mx-auto'>
              <Button
                variant='flat'
                size='sm'
                startContent={<MdArrowBack className='w-4 h-4' />}
                onClick={() => router.back()}
                isIconOnly
                className='text-muted-foreground hover:text-foreground font-medium'></Button>
            </div>

            {/* <div className='flex relative z-10 flex-col items-center w-full'>
              {!(charData as any)._notFound && (
                <CharacterBar
                  selectedCharName={selectedCharName}
                  setSelectedCharName={setSelectedCharName}
                  allCharData={allCharData}
                  setAllCharData={setAllCharData}
                  charData={charData}
                  setCharData={setCharData}
                  initialCharData={initialCharData}
                />
              )}
            </div> */}

            {/* 如果角色找不到 */}
            {(charData as any)._notFound && (
              <div className='flex flex-col justify-center items-center w-full h-full min-h-[400px]'>
                <div className='text-center max-w-md'>
                  <div className='mb-6'>
                    <div className='text-6xl mb-4'>🤔</div>
                    <h1 className='text-2xl font-bold text-heading mb-2'>
                      {t('characterNotFound') || 'character not found'}
                    </h1>
                    <p className='text-muted-foreground mb-6'>
                      {t('characterNotFoundDesc') ||
                        'Sorry, the character you are looking for does not exist or has been deleted'}
                    </p>
                  </div>
                  <CreateCharacterButton />
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {charData.character_uniqid == 'loading...' &&
              !(charData as any)._notFound && (
                <div className='flex flex-col justify-center items-center w-full h-full'>
                  <CreateCharacterButton />
                  <div className='text-lg text-center'>
                    {t('noCharactersYet')}
                  </div>
                </div>
              )}

            {charData.character_uniqid !== 'loading...' &&
              !(charData as any)._notFound && (
                <div className='flex flex-col gap-4 w-full mx-auto'>
                  <div className='hidden md:flex items-start gap-3'>
                    {/* 角色卡片和操作按钮 */}
                    <div className='flex-1 min-w-0 relative'>
                      {isDeleting && (
                        <div className='flex absolute inset-0 z-30 justify-center items-center rounded-lg bg-card/70'>
                          <Spinner size='lg' color='default' />
                        </div>
                      )}

                      <CharacterCard
                        charData={charData}
                        isDeleting={isDeleting}
                      />

                      <CharacterActions
                        charData={charData}
                        isOwnCharacter={isOwnCharacter}
                        isCollected={isCollected}
                        isCollecting={isCollecting || isCheckingCollection}
                        onOpenDeleteModal={onOpenDeleteModal}
                        onCollectCharacter={handleCollectCharacter}
                        onAddToRecent={addToRecent}
                      />
                    </div>
                  </div>

                  {/* 移动端角色卡片和操作按钮 */}
                  <div className='md:hidden relative'>
                    {isDeleting && (
                      <div className='flex absolute inset-0 z-30 justify-center items-center rounded-lg bg-card/70'>
                        <Spinner size='lg' color='default' />
                      </div>
                    )}

                    <CharacterCard
                      charData={charData}
                      isDeleting={isDeleting}
                    />

                    <CharacterActions
                      charData={charData}
                      isOwnCharacter={isOwnCharacter}
                      isCollected={isCollected}
                      isCollecting={isCollecting || isCheckingCollection}
                      onOpenDeleteModal={onOpenDeleteModal}
                      onCollectCharacter={handleCollectCharacter}
                      onAddToRecent={addToRecent}
                    />
                  </div>

                  {/* Tabs: Feed 和 Adopters */}
                  {isMounted && (
                    <div className='w-full max-w-3xl mx-auto'>
                      {/* Tab header with NSFW toggle */}
                      <div className='flex items-center justify-between border-b border-divider'>
                        <Tabs
                          aria-label='Character content tabs'
                          color='primary'
                          variant='underlined'
                          disableAnimation
                          selectedKey={selectedTab}
                          onSelectionChange={key =>
                            setSelectedTab(key as string)
                          }
                          classNames={{
                            base: 'w-auto',
                            tabList:
                              'gap-3 md:gap-6 relative rounded-none p-0 border-none',
                            cursor: 'w-full bg-primary',
                            tab: 'max-w-fit px-0 h-12',
                            tabContent:
                              'group-data-[selected=true]:text-primary',
                            panel: 'hidden',
                          }}>
                          <Tab
                            key='all-posts'
                            title={
                              <div className='flex gap-2 items-center'>
                                <MdOutlineCollections className='text-xl' />
                                <span>{t('allPosts', 'All Posts')}</span>
                              </div>
                            }
                          />
                          {isAuth && profile.user_uniqid && (
                            <Tab
                              key='my-posts'
                              title={
                                <div className='flex gap-2 items-center'>
                                  <RiUserLine className='text-xl' />
                                  <span>{t('myPosts', 'My Posts')}</span>
                                </div>
                              }
                            />
                          )}
                          <Tab
                            key='adopters'
                            title={
                              <div className='flex gap-2 items-center'>
                                <FaUsers className='text-xl' />
                                <span>{t('adopters', 'Adopters')}</span>
                              </div>
                            }
                          />
                        </Tabs>
                        <NsfwToggle onModeChange={handleNsfwModeChange} />
                      </div>

                      {/* Tab panels */}
                      <div className='pt-2'>
                        {selectedTab === 'all-posts' && (
                          <Suspense
                            fallback={
                              <div className='flex justify-center items-center py-8'>
                                <Spinner size='lg' color='default' />
                              </div>
                            }>
                            <CharacterFeed
                              characterId={charData.character_uniqid}
                              externalNsfwMode={nsfwMode}
                            />
                          </Suspense>
                        )}
                        {selectedTab === 'my-posts' &&
                          isAuth &&
                          profile.user_uniqid && (
                            <Suspense
                              fallback={
                                <div className='flex justify-center items-center py-8'>
                                  <Spinner size='lg' color='default' />
                                </div>
                              }>
                              <CharacterFeed
                                characterId={charData.character_uniqid}
                                creatorOnly={true}
                                creatorUserId={profile.user_uniqid}
                                externalNsfwMode={nsfwMode}
                              />
                            </Suspense>
                          )}
                        {selectedTab === 'adopters' && (
                          <CharacterAdopters
                            characterId={charData.character_uniqid}
                            author={{
                              user_id: charData.authUserId,
                              user_uniqid: charData.user_uniqid,
                              user_name: charData.user_name,
                              image: charData.user_image,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* SEO Content */}
                  <Content
                    charData={charData}
                    scrollContainerRef={scrollContainerRef}
                  />
                </div>
              )}
          </div>
        </div>
      </main>
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={onDeleteModalOpenChange}
        onConfirm={deleteCharacter}
        isDeleting={isDeleting}
      />
      <LoginModal />
    </NextUIProvider>
  );
}

export async function getServerSideProps(context: any) {
  const { character_id } = context.params;
  const { req } = context;

  let initialCharData: any = {
    age: 'loading...',
    authUserId: 'loading...',
    character_description: 'loading...',
    character_name: 'Character not found',
    character_uniqid: 'loading...',
    created_at: 'loading...',
    file_uniqid: 'loading...',
    gender: 'loading...',
    id: 'loading...',
    character_pfp: 'loading...',
    interests: 'loading...',
    intro: 'loading...',
    loras: [],
    personality: 'loading...',
    profession: 'loading...',
    user_image: 'loading...',
    user_name: 'loading...',
    _notFound: false,
    is_collected: null,
    is_official: false,
  };

  // 对于/character/1路径，将在客户端处理默认选择
  if (character_id && character_id !== '1') {
    try {
      const customChars = await getCharacterProfile([character_id as string]);
      if (
        customChars &&
        customChars.length > 0 &&
        customChars[0] &&
        customChars[0].character_name !== 'Character not found'
      ) {
        initialCharData = customChars[0];

        // 尝试并行获取收藏状态（如果用户已登录）
        try {
          // 从 cookie 中获取 session 来判断用户是否登录
          const cookies = req.headers.cookie || '';
          const hasSession =
            cookies.includes('next-auth.session-token') ||
            cookies.includes('__Secure-next-auth.session-token');

          if (hasSession && initialCharData.character_uniqid) {
            // 构建完整的 API URL
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host;
            const apiUrl = `${protocol}://${host}/api/checkCollectedCharacter?character_uniqid=${initialCharData.character_uniqid}`;

            const response = await fetch(apiUrl, {
              headers: {
                cookie: cookies,
              },
            });

            if (response.ok) {
              const result = await response.json();
              if (result.code === 1) {
                initialCharData.is_collected = !!result.data.is_collected;
              }
            }
          }
        } catch (error) {
          // 收藏状态获取失败不影响页面加载，客户端会重试
          console.error('Error fetching collection status in SSR:', error);
        }
      } else {
        // 角色不存在，标记为未找到
        initialCharData._notFound = true;
      }
    } catch (error) {
      console.error('Error fetching character:', error);
      initialCharData._notFound = true;
    }
  }

  return {
    props: {
      initialCharData,
    },
  };
}
