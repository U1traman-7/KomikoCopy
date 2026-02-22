import {
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
import { MdOutlineCollections } from 'react-icons/md';
import { RiUserLine } from 'react-icons/ri';

import toast, { Toaster } from 'react-hot-toast';
import { Header } from '../Header';
import { CreateCharacterButton } from '../MainApp';
import { Sidebar } from '../Sidebar';
import { authAtom, profileAtom } from '../../state';
import { useAtomValue } from 'jotai';
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';

import { useTranslation } from 'react-i18next';
import { SEOTags } from '@/components/common/SEOTags';
import { Breadcrumb } from '@/Components/common/Breadcrumb';
import { useLoginModal } from '@/hooks/useLoginModal';
import { useCharacterSEO } from '@/hooks/useCharacterSEO';
import { CharacterCard } from '@/Components/character/CharacterCard';
import { CharacterActions } from '@/Components/character/CharacterActions';
import { DeleteConfirmModal } from '@/Components/character/DeleteConfirmModal';
import { useRecentCharacters } from '@/hooks/useRecentCharacters';
import React, { Suspense } from 'react';
import useMobileScreen from '@/hooks/useMobileScreen';
import CTA from '@/Components/SEO/CTA';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { SiteFooter } from '@/components/site-footer';

const CharacterFeed = React.lazy(() =>
  import('@/Components/character/CharacterFeed').then(mod => ({
    default: mod.CharacterFeed,
  })),
);

interface VariantConfig {
  type: 'fanart' | 'pfp' | 'oc' | 'wallpaper' | 'pictures';
  mixpanelEvent: string;
  seoTitleSuffix: string;
  tabsAriaLabel: string;
  allPostsLabel: string;
  myPostsLabel: string;
}

interface ContentProps {
  charData: any;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  variant: VariantConfig['type'];
}

function Content({ charData, scrollContainerRef, variant }: ContentProps) {
  const { t } = useTranslation('character');

  if (!charData.is_official) return null;

  const variantKey = `variants.${variant}`;

  const handleCTAClick = () => {
    console.log(`generate ${variant} scroll`);
    scrollContainerRef.current?.scrollTo?.({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className='w-full max-w-3xl mx-auto px-3'>
      {/* MoreAITools Section */}
      <div className='my-8 md:my-12'>
        <MoreAITools category='illustration' />
      </div>

      {/* CTA Section */}
      <CTA
        title={t(`${variantKey}.createTitle`, { character_name: charData.character_name })}
        description={t(`${variantKey}.createDescription`, { character_name: charData.character_name })}
        buttonText={t(`${variantKey}.buttonText`, { character_name: charData.character_name })}
        onButtonClick={handleCTAClick}
      />
    </div>
  );
}

interface CharacterVariantPageProps {
  initialCharData: any;
  variant: VariantConfig;
}

export function CharacterVariantPage({ initialCharData, variant }: CharacterVariantPageProps) {
  const { t } = useTranslation('character');
  const router = useRouter();
  const { character_id, collected } = router.query;

  const { onOpen, LoginModal } = useLoginModal();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { generateStructuredData } = useCharacterSEO();
  const { addToRecent } = useRecentCharacters();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track(variant.mixpanelEvent, {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [variant.mixpanelEvent]);

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

  const [isOwnCharacter, setIsOwnCharacter] = useState<boolean>(false);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [isCollected, setIsCollected] = useState<boolean>(false);
  const [isCheckingCollection, setIsCheckingCollection] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('all-posts');

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      const newUrl = `/character/${character_id}/${variant.type}`;
      router.replace(newUrl, undefined, { shallow: true });
    }
  }, [collected, character_id, router, t, variant.type]);

  useEffect(() => {
    const checkCollectionStatus = async () => {
      if (typeof charData.is_collected === 'boolean') {
        startTransition(() => {
          setIsCollected(charData.is_collected);
          setIsCheckingCollection(false);
        });
        return;
      }

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

      if (isAuth && profile.authUserId === charData.authUserId) {
        startTransition(() => {
          setIsCollected(false);
          setIsCheckingCollection(false);
        });
        return;
      }

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

        if (allCharData.length > 1) {
          const nextChar = allCharData.find(
            char => char.character_uniqid !== charData.character_uniqid,
          );
          if (nextChar) {
            router.push(`/character/${nextChar.character_uniqid}/${variant.type}`);
          } else {
            router.back();
          }
        } else {
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

  const isDataLoaded =
    charData &&
    charData.character_uniqid !== 'loading...' &&
    charData.character_name !== 'Character not found';

  const seoTitle = isDataLoaded
    ? `${charData.character_name} ${variant.seoTitleSuffix}`
    : `${t('aiCharacter')} ${variant.seoTitleSuffix} | KomikoAI`;

  const seoDescription = isDataLoaded
    ? t(`variants.${variant.type}.description`, { character_name: charData.character_name })
    : t(`variants.${variant.type}.description`, { character_name: 'Character' });

  const name = charData.character_name;
  const character_name = charData.character_name;
  const seoKeywords = isDataLoaded 
    ? t(`variants.${variant.type}.keywords`, { character_name })
    : t(`variants.${variant.type}.keywords`, { character_name: name });

  return (
    <NextUIProvider>
      <Head>
        <title>{seoTitle}</title>
        <meta name='title' content={seoTitle} />
        <SEOTags
          canonicalPath={`/character/${character_id}/${variant.type}`}
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
        <meta
          name='author'
          content={isDataLoaded ? charData.user_name || 'KomikoAI' : 'KomikoAI'}
        />
        <meta name='robots' content='index,follow' />
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
            
            {/* Breadcrumb Navigation */}
            <Breadcrumb 
              className='w-full max-w-xl mx-auto'
              characterData={isDataLoaded ? {
                character_name: charData.character_name,
                character_uniqid: charData.character_uniqid
              } : undefined}
            />

            {/* Page Title and Description - Only for official characters */}
            {isDataLoaded && charData.is_official && (
              <div className='w-full max-w-xl mx-auto my-4 md:my-6'>
                <h1 className='text-2xl md:text-3xl font-bold text-heading text-center mb-3'>
                  {t(`variants.${variant.type}.h1`, { name: charData.character_name })}
                </h1>
                <p className='text-sm md:text-base text-muted-foreground text-center leading-relaxed whitespace-pre-line'>
                  {t(`variants.${variant.type}.pageDescription`, { character_name: charData.character_name })}
                </p>
              </div>
            )}

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

                  {isMounted && (
                    <div className='w-full max-w-3xl mx-auto'>
                      <Tabs
                        aria-label={variant.tabsAriaLabel}
                        color='primary'
                        variant='underlined'
                        disableAnimation
                        selectedKey={selectedTab}
                        onSelectionChange={key => setSelectedTab(key as string)}
                        classNames={{
                          base: 'w-full',
                          tabList:
                            'gap-3 md:gap-6 w-full relative rounded-none p-0 border-b border-divider',
                          cursor: 'w-full bg-primary',
                          tab: 'max-w-fit px-0 h-12',
                          tabContent: 'group-data-[selected=true]:text-primary',
                          panel: 'px-0 pt-2',
                        }}>
                        <Tab
                          key='all-posts'
                          title={
                            <div className='flex gap-2 items-center'>
                              <MdOutlineCollections className='text-xl' />
                              <span>{variant.allPostsLabel}</span>
                            </div>
                          }>
                          <Card className='border-none shadow-none min-h-0 bg-transparent'>
                            {selectedTab === 'all-posts' && (
                              <Suspense
                                fallback={
                                  <div className='flex justify-center items-center py-8'>
                                    <Spinner size='lg' color='default' />
                                  </div>
                                }>
                                <CharacterFeed
                                  characterId={charData.character_uniqid}
                                />
                              </Suspense>
                            )}
                          </Card>
                        </Tab>
                        {isAuth && profile.user_uniqid && (
                          <Tab
                            key='my-posts'
                            title={
                              <div className='flex gap-2 items-center'>
                                <RiUserLine className='text-xl' />
                                <span>{variant.myPostsLabel}</span>
                              </div>
                            }>
                            <Card className='border-none shadow-none min-h-0 bg-transparent'>
                              {selectedTab === 'my-posts' && (
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
                                  />
                                </Suspense>
                              )}
                            </Card>
                          </Tab>
                        )}
                      </Tabs>
                    </div>
                  )}

                  <Content
                    charData={charData}
                    scrollContainerRef={scrollContainerRef}
                    variant={variant.type}
                  />
                </div>
              )}
          </div>
        </div>
        <SiteFooter className='border-border lg:pl-[240px]' />
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