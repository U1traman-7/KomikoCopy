import React, { memo, useEffect, useState, useCallback } from 'react';
import { NextUIProvider, Button, Tabs, Tab } from '@nextui-org/react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { Header } from '../../Components/Header';
import { Sidebar } from '../../Components/Sidebar';
import { useTranslation } from 'react-i18next';
import { Feed } from '../../Components/Feed';
import { authAtom, pageAtom, postListAtom, profileAtom } from '@/state/index';
import { useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { SiteFooter } from '@/components/site-footer';
import useMediaQuery from '@/hooks/use-media-query';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import CTA from '@/Components/SEO/CTA';
import { LoginContext } from '../../pages/create';
import { useLoginModal } from '@/hooks/useLoginModal';
import { useOpenModal } from '@/hooks/useOpenModal';
import { TagHeader, TagCharacters } from '@/Components/TagDetail';
import { CtaTextModal } from '@/Components/TagDetail/CtaTextModal';
import { FiPlus } from 'react-icons/fi';
import { IconSettings } from '@tabler/icons-react';
import { Breadcrumb } from '@/Components/common/Breadcrumb';
import {
  getTemplateInfoByTagName,
  refreshTemplateTagNameMap,
} from '@/Components/StyleTemplatePicker/styles/index';

interface VariantConfig {
  type: 'fanart' | 'pfp' | 'oc' | 'wallpaper' | 'pictures';
  mixpanelEvent: string;
  seoTitleSuffix: string;
  tabsAriaLabel: string;
}

interface TagVariantPageProps {
  initialTagData: any;
  variant: VariantConfig;
}

export const TagVariantPage = memo(
  ({ initialTagData, variant }: TagVariantPageProps) => {
    const { t } = useTranslation('tags');
    const { isMobile } = useMediaQuery();
    const { onOpen, LoginModal } = useLoginModal();
    const { submit: openModal, modals } = useOpenModal();
    const auth = useAtomValue(authAtom);
    const profile = useAtomValue(profileAtom);
    const setPostList = useSetAtom(postListAtom);
    const setPage = useSetAtom(pageAtom);
    const isGlobalAdmin = profile?.roles?.includes(1) || false;

    const [feedKey, setFeedKey] = useState(1);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [isFollowing, setIsFollowing] = useState(
      initialTagData.is_following || false,
    );
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [sortBy, setSortBy] = useState<'Trending' | 'Newest'>('Trending');
    const [displayFollowerCount, setDisplayFollowerCount] = useState(
      initialTagData.follower_count || 0,
    );
    const [isCtaTextModalOpen, setIsCtaTextModalOpen] = useState(false);

    // Local state for tag data
    const [tagLogoUrl, setTagLogoUrl] = useState(initialTagData.logo_url);
    const [tagHeaderImage, setTagHeaderImage] = useState(
      initialTagData.header_image,
    );
    const [tagDescription, setTagDescription] = useState(
      initialTagData.description,
    );
    const [tagIsNsfw, setTagIsNsfw] = useState(
      initialTagData.is_nsfw_tag || false,
    );
    const [tagCtaLink, setTagCtaLink] = useState(initialTagData.cta_link);

    const [canFeatureForTag, setCanFeatureForTag] = useState(false);

    const [tagI18n, setTagI18n] = useState(initialTagData.i18n || {});
    const [tagCtaTextTranslation, setTagCtaTextTranslation] = useState(
      initialTagData.cta_text_translation || null,
    );

    // Check if this tag is a template tag and get tool URL
    // Use state so it updates after async database templates are loaded
    const [templateInfo, setTemplateInfo] = useState(() =>
      getTemplateInfoByTagName(initialTagData.tag_name),
    );

    // Async refresh: load database templates and recheck templateInfo
    useEffect(() => {
      let cancelled = false;
      // Reset with sync data first (handles client-side navigation)
      setTemplateInfo(getTemplateInfoByTagName(initialTagData.tag_name));
      refreshTemplateTagNameMap()
        .then(() => {
          if (!cancelled) {
            setTemplateInfo(getTemplateInfoByTagName(initialTagData.tag_name));
          }
        })
        .catch((err) => {
          console.error('[TagVariantPage] Failed to refresh template map:', err);
        });
      return () => {
        cancelled = true;
      };
    }, [initialTagData.tag_name]);

    const getToolUrl = () => {
      // Priority 1: Admin-set custom CTA link
      if (tagCtaLink) {
        // Add skipModal parameter to prevent style selector from auto-opening
        const separator = tagCtaLink.includes('?') ? '&' : '?';
        return `${tagCtaLink}${separator}skipModal=true`;
      }
      // Priority 2: Auto-detected template → effects page
      if (templateInfo) {
        return `/effects/${templateInfo.effectsSlug}`;
      }
      // Priority 3: Default fallback
      return `/ai-anime-generator?prompt=${encodeURIComponent(initialTagData.tag_name + ' ' + variant.type)}&skipModal=true`;
    };

    // Sync props to state when tag changes
    useEffect(() => {
      setDisplayFollowerCount(initialTagData.follower_count || 0);
      setIsFollowing(initialTagData.is_following || false);
      setTagLogoUrl(initialTagData.logo_url);
      setTagHeaderImage(initialTagData.header_image);
      setTagDescription(initialTagData.description);
      setTagIsNsfw(initialTagData.is_nsfw_tag || false);
      setTagCtaLink(initialTagData.cta_link);
      setPostList(initialTagData.posts ?? []);
      setPage(initialTagData.posts?.length ? 1 : 2);
      setTagI18n(initialTagData.i18n || {});
      setTagCtaTextTranslation(initialTagData.cta_text_translation || null);
    }, [
      initialTagData.tag_id,
      initialTagData.follower_count,
      initialTagData.is_following,
      initialTagData.logo_url,
      initialTagData.header_image,
      initialTagData.description,
      initialTagData.is_nsfw_tag,
      initialTagData.cta_link,
      initialTagData.posts,
      setPostList,
      setPage,
      setTagI18n,
    ]);

    // Check feature permission
    useEffect(() => {
      if (!auth || !initialTagData.tag_id) {
        setCanFeatureForTag(false);
        return;
      }

      const checkFeaturePermission = async () => {
        try {
          const response = await fetch(
            `/api/tag/posts?tagId=${initialTagData.tag_id}&check=feature`,
          );
          if (response.ok) {
            const data = await response.json();
            setCanFeatureForTag(data.can_feature === true);
          }
        } catch (error) {
          console.error('Error checking feature permission:', error);
          setCanFeatureForTag(false);
        }
      };

      checkFeaturePermission();
    }, [initialTagData.tag_id, auth]);

    const handleFollow = useCallback(async () => {
      setIsFollowLoading(true);
      setIsFollowing(true);
      setDisplayFollowerCount(prev => prev + 1);
      try {
        const response = await fetch('/api/tag/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tagId: initialTagData.tag_id,
            action: 'follow',
          }),
        });
        const data = await response.json();
        if (data.is_following === false) {
          setIsFollowing(false);
          setDisplayFollowerCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error following tag:', error);
        setIsFollowing(false);
        setDisplayFollowerCount(prev => Math.max(0, prev - 1));
      } finally {
        setIsFollowLoading(false);
      }
    }, [initialTagData.tag_id]);

    const handleUnfollow = useCallback(async () => {
      setIsFollowLoading(true);
      setIsFollowing(false);
      setDisplayFollowerCount(prev => Math.max(0, prev - 1));
      try {
        const response = await fetch('/api/tag/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tagId: initialTagData.tag_id,
            action: 'unfollow',
          }),
        });
        const data = await response.json();
        if (data.is_following === true) {
          setIsFollowing(true);
          setDisplayFollowerCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error unfollowing tag:', error);
        setIsFollowing(true);
        setDisplayFollowerCount(prev => prev + 1);
      } finally {
        setIsFollowLoading(false);
      }
    }, [initialTagData.tag_id]);

    const handleTagUpdated = useCallback(async () => {
      try {
        const response = await fetch(
          `/api/tag/detail?id=${initialTagData.tag_id}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.tag) {
            setTagLogoUrl(data.tag.logo_url);
            setTagHeaderImage(data.tag.header_image);
            setTagDescription(data.tag.description);
            setTagIsNsfw(data.tag.is_nsfw ?? false);
            setTagCtaLink(data.tag.cta_link ?? null);
            setTagI18n(data.tag.i18n || {});
            setTagCtaTextTranslation(data.tag.cta_text_translation || null);
            setFeedKey(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error refreshing tag data:', error);
      }
    }, [initialTagData.tag_id]);

    useHydrateAtoms([[postListAtom, initialTagData.posts ?? []]]);
    useHydrateAtoms([[pageAtom, initialTagData.posts?.length ? 1 : 2]]);

    // Get variant specific content
    const variantTitle = t(`variants.${variant.type}.title`, {
      name: initialTagData.tag_name,
    });
    const variantDescription = t(`variants.${variant.type}.description`, {
      name: initialTagData.tag_name,
    });
    const variantH1 = t(`variants.${variant.type}.h1`, {
      name: initialTagData.tag_name,
    });
    const variantH1Description = t(`variants.${variant.type}.h1Description`, {
      name: initialTagData.tag_name,
    });
    const variantCreateTitle = t(`variants.${variant.type}.createTitle`, {
      name: initialTagData.tag_name,
    });
    const variantCreateDescription = t(
      `variants.${variant.type}.createDescription`,
      { name: initialTagData.tag_name },
    );
    const variantButtonText = t(`variants.${variant.type}.buttonText`, {
      name: initialTagData.tag_name,
    });

    const metaKeywords = t(`variants.${variant.type}.keywords`, {
      name: initialTagData.tag_name,
    });

    useEffect(() => {
      const confirmed = document.cookie.includes('relax_content=true');
      const shouldShowNsfwModal =
        (initialTagData.is_nsfw_tag || tagIsNsfw) && !confirmed && modals?.nsfw;
      if (shouldShowNsfwModal) {
        openModal('nsfw', {
          onConfirm: () => {
            document.cookie = 'relax_content=true; path=/';
            setFeedKey(prev => prev + 1);
          },
        });
      }
    }, [modals.nsfw, tagIsNsfw, initialTagData.is_nsfw_tag, openModal]);

    if (!initialTagData.tag_id || initialTagData.tag_id === 0) {
      return (
        <LoginContext.Provider value={{ onLoginOpen: onOpen }}>
          <NextUIProvider>
            <LoginModal />
            <Head>
              <title>Tag not found</title>
            </Head>
            <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-hidden overflow-y-auto'>
              <Header autoOpenLogin={false} />
              <div className='flex'>
                <Sidebar />
                <div className='md:p-2 pt-12 md:pt-20 w-full h-full lg:pl-[240px] md:ml-5'>
                  <div className='max-w-6xl mx-auto'>
                    <div className='flex flex-col items-center justify-center py-20 text-center'>
                      <p className='text-lg text-muted-foreground mb-4'>
                        Tag not found: "{initialTagData.tag_name}"
                      </p>
                      {initialTagData.debug && (
                        <div className='text-left text-sm text-muted-foreground mt-4 p-4 bg-muted rounded'>
                          <p>
                            <strong>Debug Info:</strong>
                          </p>
                          <p>
                            Searched tag: {initialTagData.debug.searchedTag}
                          </p>
                          <p>Error: {initialTagData.debug.error}</p>
                          {initialTagData.debug.similarTags?.length > 0 && (
                            <>
                              <p className='mt-2'>
                                <strong>Similar tags found:</strong>
                              </p>
                              <ul>
                                {initialTagData.debug.similarTags.map(
                                  (tag: any) => (
                                    <li key={tag.id}>
                                      {tag.name} (ID: {tag.id}, Posts:{' '}
                                      {tag.post_count})
                                    </li>
                                  ),
                                )}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </NextUIProvider>
        </LoginContext.Provider>
      );
    }

    return (
      <LoginContext.Provider value={{ onLoginOpen: onOpen }}>
        <NextUIProvider>
          <LoginModal />
          <Head>
            <title>{variantTitle}</title>
            {(initialTagData.is_nsfw_tag || tagIsNsfw) && (
              <meta name='robots' content='noindex, nofollow' />
            )}
            <meta name='description' content={variantDescription} />
            <meta name='keywords' content={metaKeywords} />
            <meta property='og:type' content='website' />
            <meta property='og:title' content={variantTitle} />
            <meta property='og:description' content={variantDescription} />
            <meta property='og:image' content={'/images/social.webp'} />
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={variantTitle} />
            <meta name='twitter:description' content={variantDescription} />
            <meta name='twitter:image' content={'/images/social.webp'} />
          </Head>
          <Analytics />
          <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-hidden overflow-y-auto'>
            <Header autoOpenLogin={false} />
            <div className='flex'>
              <Sidebar />
              <div className='md:p-2 pt-12 md:pt-20 w-full h-full lg:pl-[240px] md:ml-5'>
                <div className='max-w-6xl mx-auto'>
                  {/* Breadcrumb */}
                  <div className='px-4 mb-4'>
                    <Breadcrumb className='' />
                  </div>

                  {/* H1 Title and Description */}
                  <div className='px-4 mb-6 text-center'>
                    <h1 className='mb-4 text-2xl font-bold text-heading md:text-4xl'>
                      {variantH1}
                    </h1>
                    <div className='mx-auto max-w-4xl text-muted-foreground text-sm md:text-base'>
                      <p>{variantH1Description}</p>
                    </div>
                  </div>

                  {/* Tag Header */}
                  <TagHeader
                    tag={{
                      id: initialTagData.tag_id,
                      name: initialTagData.tag_name,
                      logoUrl: tagLogoUrl,
                      headerImage: tagHeaderImage,
                      description: tagDescription,
                      isNsfw: tagIsNsfw,
                      ctaLink: tagCtaLink,
                      i18n: tagI18n,
                    }}
                    stats={{
                      followerCount: displayFollowerCount,
                      postCount: initialTagData.post_count || 0,
                      popularity: initialTagData.popularity || 100,
                    }}
                    followState={{
                      isFollowing,
                      isLoading: isFollowLoading,
                      onFollow: handleFollow,
                      onUnfollow: handleUnfollow,
                    }}
                    moderators={initialTagData.moderators || []}
                    user={{
                      isLoggedIn: !!auth,
                      currentUserId: profile?.id,
                      isGlobalAdmin,
                      onLoginRequired: onOpen,
                    }}
                    onTagUpdated={handleTagUpdated}
                  />

                  {/* Tabs */}
                  <div>
                    <div className='border-b border-divider border-b-[1px] px-4'>
                      <div className='flex items-center justify-between'>
                        <Tabs
                          aria-label={variant.tabsAriaLabel}
                          selectedKey={activeTab}
                          onSelectionChange={key => {
                            setActiveTab(key as string);
                            setFeedKey(prev => prev + 1);
                          }}
                          variant='underlined'
                          classNames={{
                            tabList: 'gap-6 pb-0',
                            cursor: 'w-full bg-primary-400 rounded-md ',
                            tab: 'px-0 h-10',
                            tabContent:
                              'text-sm group-data-[selected=true]:text-foreground font-semibold',
                          }}>
                          <Tab key='all' title={t('postsLabel', 'Posts')} />
                          <Tab
                            key='featured'
                            title={t('featured', 'Featured')}
                          />
                          <Tab
                            key='characters'
                            title={t('characters', 'Characters')}
                          />
                        </Tabs>

                        {/* CTA Text Edit Button for moderators/admins */}
                        {(isGlobalAdmin ||
                          (initialTagData.moderators || []).some(
                            (m: any) => m.user_id === profile?.id,
                          )) && (
                          <Button
                            size='sm'
                            variant='light'
                            isIconOnly
                            onPress={() => setIsCtaTextModalOpen(true)}
                            className='mb-1'>
                            <IconSettings size={18} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Sort Selector - show for all posts and featured tabs */}
                    {(activeTab === 'all' || activeTab === 'featured') && (
                      <div className='pt-2 px-3'>
                        <Tabs
                          selectedKey={sortBy}
                          onSelectionChange={key => {
                            setSortBy(key as 'Trending' | 'Newest');
                            setFeedKey(prev => prev + 1);
                          }}
                          variant='light'
                          radius='full'
                          size='sm'
                          classNames={{
                            tabList: 'bg-transparent p-0 gap-2',
                            cursor: 'bg-default-100 shadow-none',
                            tab: 'px-3 h-7',
                            tabContent:
                              'text-xs uppercase tracking-wide font-semibold text-default-400 group-data-[selected=true]:text-default-600',
                          }}>
                          <Tab
                            key='Trending'
                            title={t('trending', { defaultValue: 'Trending' })}
                          />
                          <Tab
                            key='Newest'
                            title={t('newest', { defaultValue: 'Newest' })}
                          />
                        </Tabs>
                      </div>
                    )}

                    {/* Tab content */}
                    <div className='mt-2 px-3'>
                      {activeTab === 'all' && (
                        <Feed
                          refreshId={feedKey}
                          key={`all-${feedKey}-${sortBy}-${variant.type}`}
                          tagId={initialTagData.tag_id}
                          hideTagFilters
                          sortBy={sortBy}
                          canFeatureForTagProp={canFeatureForTag}
                        />
                      )}

                      {activeTab === 'featured' && (
                        <Feed
                          refreshId={feedKey}
                          key={`featured-${feedKey}-${sortBy}-${variant.type}`}
                          tagId={initialTagData.tag_id}
                          hideTagFilters
                          sortBy={sortBy}
                          canFeatureForTagProp={canFeatureForTag}
                          featured={true}
                        />
                      )}

                      {activeTab === 'characters' && (
                        <TagCharacters
                          tagId={initialTagData.tag_id}
                          showAll={true}
                          isModerator={
                            isGlobalAdmin ||
                            (initialTagData.moderators || []).some(
                              (m: any) => m.user_id === profile?.id,
                            )
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className='px-3'>
                    <div className='md:my-12'>
                      <MoreAITools category='illustration' />
                    </div>

                    {/* CTA Section */}
                    <CTA
                      title={variantCreateTitle}
                      description={variantCreateDescription}
                      buttonText={variantButtonText}
                      onButtonClick={() => {
                        window.location.href = getToolUrl();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <SiteFooter className='border-border md:pl-56 lg:pl-[240px]' />
          </main>

          {/* Floating Generate Art Button */}
          <div className='fixed z-50 flex justify-center w-full bottom-20 lg:bottom-4'>
            <div className='px-4'>
              <Button
                variant='flat'
                color='primary'
                size={isMobile ? 'md' : 'lg'}
                onClick={() => {
                  window.location.href = getToolUrl();
                }}
                className='
                shadow-lg hover:shadow-xl transition-all duration-200 font-medium rounded-full
                bg-blue-600 hover:bg-blue-600
                border border-blue-500
                hover:scale-105 hover:shadow-2xl
                text-primary-foreground
                px-6 py-3 text-sm
                drop-shadow-md
              '
                startContent={<FiPlus className='w-4 h-4' />}>
                {variantButtonText}
              </Button>
            </div>
          </div>

          {/* CTA Text Modal */}
          <CtaTextModal
            isOpen={isCtaTextModalOpen}
            onClose={() => setIsCtaTextModalOpen(false)}
            tagId={initialTagData.tag_id}
            initialCtaTextTranslation={tagCtaTextTranslation}
            onSuccess={handleTagUpdated}
          />
        </NextUIProvider>
      </LoginContext.Provider>
    );
  },
);

TagVariantPage.displayName = 'TagVariantPage';
