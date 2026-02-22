import React, { useEffect, useState, useCallback } from 'react';
import { Feed } from '@/Components/Feed';
import { GetServerSidePropsContext } from 'next';
import { NextUIProvider, Button, Tabs, Tab } from '@nextui-org/react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/react';
import { Header } from '@/Components/Header';
import { Sidebar } from '@/Components/Sidebar';
import { useTranslation } from 'react-i18next';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import {
  authAtom,
  pageAtom,
  Post,
  postListAtom,
  profileAtom,
} from '@/state/index';
import { useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { SiteFooter } from '@/components/site-footer';
import useMediaQuery from '@/hooks/use-media-query';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import CTA from '@/Components/SEO/CTA';
import { LoginContext } from '../../create';
import { useLoginModal } from '@/hooks/useLoginModal';
import { useOpenModal } from '@/hooks/useOpenModal';
import { TagHeader, TagCharacters } from '@/Components/TagDetail';
import { FiPlus } from 'react-icons/fi';
import { NsfwToggle } from '@/Components/NsfwToggle';
import {
  getTemplateInfoByTagName,
  refreshTemplateTagNameMap,
} from '@/Components/StyleTemplatePicker/styles/index';
import { getLocalizedField } from 'utils/i18nText';
import dynamic from 'next/dynamic';

// Dynamically import TagSearchDropdown to reduce initial bundle size
const TagSearchDropdown = dynamic(
  () =>
    import('@/Components/TagSearchDropdown').then(mod => mod.TagSearchDropdown),
  { ssr: false },
);

// Capitalize the first letter of each word in a tag name
function capitalizeTag(tag: string): string {
  return tag
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface TagPageProps {
  tag_id: number; // 0 means tag not found
  tag_name: string;
  posts: Post[];
  is_nsfw_tag?: boolean;
  // New fields for tag sub-community
  logo_url?: string | null;
  header_image?: string | null;
  description?: string | null;
  i18n?: Record<string, any> | null;
  cta_link?: string | null;
  character_category?: string | null;
  allow_media_types?: 'all' | 'image' | 'video' | null;
  cta_text_translation?: Record<string, string> | null;
  follower_count?: number;
  post_count?: number;
  popularity?: number;
  moderators?: Array<{
    id: number;
    user_id: string;
    role: 'owner' | 'moderator';
    user_name?: string;
    user_image?: string;
    user_uniqid?: string;
  }>;
  is_following?: boolean;
}

export default function TagPage({
  tag_id,
  tag_name,
  posts,
  is_nsfw_tag = false,
  logo_url,
  header_image,
  description,
  i18n: initialI18n,
  cta_link,
  character_category,
  allow_media_types,
  cta_text_translation,
  follower_count = 0,
  post_count = 0,
  popularity = 0,
  moderators = [],
  is_following: initialIsFollowing = false,
}: TagPageProps) {
  const { t, i18n } = useTranslation('tags');
  const router = useRouter();
  const { isMobile } = useMediaQuery();
  const { onOpen, LoginModal } = useLoginModal();
  const { submit: openModal, modals } = useOpenModal();
  const auth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);
  const setPostList = useSetAtom(postListAtom);
  const setPage = useSetAtom(pageAtom);
  const isGlobalAdmin = profile?.roles?.includes(1) || false; // 1 is ADMIN role
  const [feedKey, setFeedKey] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'Trending' | 'Newest'>('Trending');
  // For NSFW tags, NSFW mode should always be active and cannot be disabled
  const [nsfwMode, setNsfwMode] = useState(is_nsfw_tag || false);
  const [displayFollowerCount, setDisplayFollowerCount] =
    useState(follower_count);
  // isTagSearchOpen state removed - TagSearchDropdown manages its own state

  // Local state for editable tag info (can be updated via settings modal)
  const [tagLogoUrl, setTagLogoUrl] = useState(logo_url);
  const [tagHeaderImage, setTagHeaderImage] = useState(header_image);
  const [tagDescription, setTagDescription] = useState(description);
  const [tagIsNsfw, setTagIsNsfw] = useState(is_nsfw_tag);
  const [tagCtaLink, setTagCtaLink] = useState(cta_link);
  const [tagI18n, setTagI18n] = useState<Record<string, any>>(
    initialI18n || {},
  );
  const [tagCharacterCategory, setTagCharacterCategory] =
    useState(character_category);
  const [tagAllowMediaTypes, setTagAllowMediaTypes] =
    useState(allow_media_types);
  const [tagCtaTextTranslation, setTagCtaTextTranslation] = useState<Record<
    string,
    string
  > | null>(cta_text_translation || null);

  // Feature permission state - fetched once per tag page load
  const [canFeatureForTag, setCanFeatureForTag] = useState(false);

  // Check if this tag is a template tag and get tool URL
  // Use state so it updates after async database templates are loaded
  const [templateInfo, setTemplateInfo] = useState(() =>
    getTemplateInfoByTagName(tag_name),
  );

  // Async refresh: load database templates and recheck templateInfo
  useEffect(() => {
    let cancelled = false;
    // Reset with sync data first (handles client-side navigation)
    setTemplateInfo(getTemplateInfoByTagName(tag_name));
    refreshTemplateTagNameMap()
      .then(() => {
        if (!cancelled) {
          setTemplateInfo(getTemplateInfoByTagName(tag_name));
        }
      })
      .catch((err) => {
        console.error('[TagPage] Failed to refresh template map:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [tag_name]);
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
    return `/ai-anime-generator?prompt=${encodeURIComponent(tag_name)}&skipModal=true`;
  };
  const navigateToTool = () => {
    const url = getToolUrl();
    // Use client-side navigation for internal paths to preserve in-memory cache
    if (url.startsWith('/')) {
      router.push(url);
    } else {
      window.location.href = url;
    }
  };

  // Sync props to state when tag changes (important for client-side navigation)
  useEffect(() => {
    setDisplayFollowerCount(follower_count);
    setIsFollowing(initialIsFollowing);
    setTagLogoUrl(logo_url);
    setTagHeaderImage(header_image);
    setTagDescription(description);
    setTagIsNsfw(is_nsfw_tag);
    setTagCtaLink(cta_link);
    setTagCharacterCategory(character_category);
    setTagAllowMediaTypes(allow_media_types);
    setTagCtaTextTranslation(cta_text_translation || null);
    setTagI18n(initialI18n || {});
    // Reset post list atom for client-side navigation (useHydrateAtoms only works on first render)
    setPostList(posts ?? []);
    setPage(posts?.length ? 1 : 2);
  }, [
    tag_id,
    follower_count,
    initialIsFollowing,
    logo_url,
    header_image,
    description,
    initialI18n,
    is_nsfw_tag,
    cta_link,
    character_category,
    allow_media_types,
    posts,
    setPostList,
    setPage,
  ]);

  // Check feature permission once when entering tag page
  useEffect(() => {
    if (!auth || !tag_id) {
      setCanFeatureForTag(false);
      return;
    }

    const checkFeaturePermission = async () => {
      try {
        const response = await fetch(
          `/api/tag/posts?tagId=${tag_id}&check=feature`,
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
  }, [tag_id, auth]);

  const handleFollow = useCallback(async () => {
    setIsFollowLoading(true);
    // Optimistic update
    setIsFollowing(true);
    setDisplayFollowerCount(prev => prev + 1);
    try {
      const response = await fetch('/api/tag/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag_id, action: 'follow' }),
      });
      const data = await response.json();
      if (data.is_following === false) {
        // Revert if failed
        setIsFollowing(false);
        setDisplayFollowerCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error following tag:', error);
      // Revert on error
      setIsFollowing(false);
      setDisplayFollowerCount(prev => Math.max(0, prev - 1));
    } finally {
      setIsFollowLoading(false);
    }
  }, [tag_id]);

  const handleUnfollow = useCallback(async () => {
    setIsFollowLoading(true);
    // Optimistic update
    setIsFollowing(false);
    setDisplayFollowerCount(prev => Math.max(0, prev - 1));
    try {
      const response = await fetch('/api/tag/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag_id, action: 'unfollow' }),
      });
      const data = await response.json();
      if (data.is_following === true) {
        // Revert if failed
        setIsFollowing(true);
        setDisplayFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error unfollowing tag:', error);
      // Revert on error
      setIsFollowing(true);
      setDisplayFollowerCount(prev => prev + 1);
    } finally {
      setIsFollowLoading(false);
    }
  }, [tag_id]);

  // Callback to refresh tag data after settings update
  const handleTagUpdated = useCallback(async () => {
    try {
      const response = await fetch(`/api/tag/detail?id=${tag_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.tag) {
          setTagLogoUrl(data.tag.logo_url);
          setTagHeaderImage(data.tag.header_image);
          setTagDescription(data.tag.description);
          setTagIsNsfw(data.tag.is_nsfw ?? false);
          setTagCtaLink(data.tag.cta_link ?? null);
          setTagCharacterCategory(data.tag.character_category ?? null);
          setTagAllowMediaTypes(data.tag.allow_media_types ?? null);
          setTagCtaTextTranslation(data.tag.cta_text_translation ?? null);
          // Refresh feed to apply new settings
          setFeedKey(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error refreshing tag data:', error);
    }
  }, [tag_id]);

  useHydrateAtoms([[postListAtom, posts ?? []]]);
  useHydrateAtoms([[pageAtom, posts?.length ? 1 : 2]]);

  // Capitalize tag name for display
  const capitalizedTag = capitalizeTag(tag_name);
  const currentLocale = i18n.language || 'en';

  const localizedTagName = getLocalizedField(
    { name: tag_name, i18n: tagI18n },
    'name',
    currentLocale,
  );

  // Determine if tag has a description for conditional content
  const hasTagDescription =
    !!tagDescription && tagDescription.trim().length > 0;

  // Pre-compute meta content to avoid repetition
  const metaTitle = hasTagDescription
    ? t('meta.titleWithDescription', { tag: capitalizedTag })
    : t('meta.title', { tag: capitalizedTag });
  const metaDescription = hasTagDescription
    ? t('meta.descriptionWithTagDescription', {
        tag: capitalizedTag,
        tagDescription,
      })
    : t('meta.description', { tag: capitalizedTag });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'whatIs':
        return (
          <div key='whatIs' className='pt-14 md:py-16 md:mt-16'>
            <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {hasTagDescription
                ? t('headings.whatIsWithDescription', { tag: capitalizedTag })
                : t('headings.whatIs', { tag: capitalizedTag })}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base'>
              <p>
                {hasTagDescription
                  ? t('whatIsDescriptionWithDescription', {
                      tag: capitalizedTag,
                    })
                  : t('whatIsDescription', { tag: capitalizedTag })}
              </p>
            </div>
          </div>
        );

      case 'cta':
        return (
          <CTA
            key='cta'
            title={t('cta.title', { tag: capitalizedTag })}
            description={t('cta.description', { tag: capitalizedTag })}
            buttonText={t('cta.button', { tag: capitalizedTag })}
            onButtonClick={() => {
              navigateToTool();
            }}
          />
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    const confirmed = document.cookie.includes('relax_content=true');
    // Show NSFW modal if tag is NSFW and user hasn't confirmed yet
    const shouldShowNsfwModal = tagIsNsfw && !confirmed && modals?.nsfw;
    if (shouldShowNsfwModal) {
      openModal('nsfw', {
        onConfirm: () => {
          document.cookie = 'relax_content=true; path=/';
          setFeedKey(prev => prev + 1);
        },
      });
    }
  }, [modals.nsfw, tagIsNsfw]);

  return (
    <LoginContext.Provider value={{ onLoginOpen: onOpen }}>
      <NextUIProvider>
        <LoginModal />
        <Head>
          <title>{metaTitle}</title>
          {tagIsNsfw && <meta name='robots' content='noindex, nofollow' />}
          <meta property='og:type' content='website' />
          <meta property='og:title' content={metaTitle} />
          <meta property='og:description' content={metaDescription} />
          <meta property='og:image' content='/images/social.webp' />
          <meta property='og:url' content='https://komiko.app' />
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:title' content={metaTitle} />
          <meta name='twitter:description' content={metaDescription} />
          <meta name='twitter:image' content='/images/social.webp' />
          <meta
            name='keywords'
            content={t('meta.keywords', { tag: capitalizedTag })}
          />
          <meta name='description' content={metaDescription} />
        </Head>
        <Script
          async
          src='https://www.googletagmanager.com/gtag/js?id=AW-16476793251'></Script>

        <Script
          dangerouslySetInnerHTML={{
            __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'AW-16476793251');
                        `,
          }}></Script>
        <Analytics />
        <main className='flex flex-col min-h-screen caffelabs text-foreground bg-background'>
          <Header autoOpenLogin={false} />
          <div className='flex'>
            <Sidebar />
            <div className='md:p-2 pt-12 md:pt-20 w-full lg:pl-[240px] md:ml-5'>
              {/* Tag Search Box - 页面最顶部 */}
              <div className='flex justify-center mb-4 max-w-6xl mx-auto'>
                <TagSearchDropdown
                  placeholder={t('search_tags_placeholder', {
                    defaultValue: 'Search tags...',
                  })}
                  maxRows={5}
                />
              </div>

              <div className='max-w-6xl mx-auto'>
                {/* Tag Header with hero image, stats, subscribe and moderators */}
                <TagHeader
                  tag={{
                    id: tag_id,
                    name: tag_name,
                    logoUrl: tagLogoUrl,
                    headerImage: tagHeaderImage,
                    description: tagDescription,
                    isNsfw: tagIsNsfw,
                    ctaLink: tagCtaLink,
                    characterCategory: tagCharacterCategory,
                    allowMediaTypes: tagAllowMediaTypes,
                    i18n: tagI18n,
                  }}
                  stats={{
                    followerCount: displayFollowerCount,
                    postCount: post_count,
                    popularity,
                  }}
                  followState={{
                    isFollowing,
                    isLoading: isFollowLoading,
                    onFollow: handleFollow,
                    onUnfollow: handleUnfollow,
                  }}
                  moderators={moderators}
                  user={{
                    isLoggedIn: !!auth,
                    currentUserId: profile?.id,
                    isGlobalAdmin,
                    onLoginRequired: onOpen,
                  }}
                  onTagUpdated={handleTagUpdated}
                />

                {/* Tabs: All Posts | Featured | Characters */}
                <div>
                  {/* Main tabs */}
                  <div className='border-b border-divider border-border border-b-[1px] px-4 flex items-center justify-between'>
                    <Tabs
                      aria-label='Tag content tabs'
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
                      <Tab
                        key='all'
                        title={t('allPosts', { defaultValue: 'All Posts' })}
                      />
                      <Tab
                        key='featured'
                        title={t('featured', { defaultValue: 'Featured' })}
                      />
                      <Tab
                        key='characters'
                        title={t('characters', { defaultValue: 'Characters' })}
                      />
                    </Tabs>
                    <NsfwToggle
                      onModeChange={setNsfwMode}
                      isActive={is_nsfw_tag || nsfwMode}
                      disabled={is_nsfw_tag}
                      forceShow={is_nsfw_tag}
                    />
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
                    {/* Show "Tag not found" message when tag_id is 0 */}
                    {tag_id === 0 ? (
                      <div className='flex flex-col items-center justify-center py-20 text-center'>
                        <p className='text-lg text-muted-foreground'>
                          {t('notFound', {
                            defaultValue: 'Tag not found',
                          })}
                        </p>
                      </div>
                    ) : (
                      <>
                        {activeTab === 'all' && (
                          <Feed
                            refreshId={feedKey}
                            key={`all-${feedKey}-${sortBy}`}
                            tagId={tag_id}
                            hideTagFilters
                            sortBy={sortBy}
                            canFeatureForTagProp={canFeatureForTag}
                            externalNsfwMode={nsfwMode}
                            allowMediaTypes={tagAllowMediaTypes}
                          />
                        )}

                        {/* Featured shows moderator-pinned posts for this tag */}
                        {activeTab === 'featured' && (
                          <Feed
                            refreshId={feedKey}
                            key={`featured-${feedKey}-${sortBy}`}
                            tagId={tag_id}
                            hideTagFilters
                            sortBy={sortBy}
                            featured={true}
                            canFeatureForTagProp={canFeatureForTag}
                            externalNsfwMode={nsfwMode}
                            allowMediaTypes={tagAllowMediaTypes}
                          />
                        )}

                        {activeTab === 'characters' && (
                          <TagCharacters
                            key={`characters-${feedKey}`}
                            tagId={tag_id}
                            showAll={true}
                            isModerator={
                              isGlobalAdmin ||
                              moderators.some(m => m.user_id === profile?.id)
                            }
                            isNsfw={tagIsNsfw}
                            onRefresh={() => setFeedKey(prev => prev + 1)}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* H1 Section */}
                <h1 className='sr-only'>
                  {hasTagDescription
                    ? t('headings.mainTitleWithDescription', {
                        tag: capitalizedTag,
                      })
                    : t('headings.mainTitle', { tag: capitalizedTag })}
                </h1>

                {/* What Is Section */}
                <div className='px-3'>
                  {renderSection('whatIs')}

                  <div className='my-12 md:my-16'>
                    <MoreAITools category='illustration' />
                  </div>

                  {/* Call to Action Section */}
                  {renderSection('cta')}
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
                navigateToTool();
              }}
              className='
              shadow-lg hover:shadow-xl transition-all duration-200 font-semibold rounded-full
              bg-blue-600 hover:bg-blue-600
              border border-blue-500
              hover:scale-105 hover:shadow-2xl
              text-white
              px-6 py-3 text-sm
              drop-shadow-md
            '
              startContent={<FiPlus className='w-4 h-4' />}>
              {tagCtaTextTranslation?.[i18n.language] ||
                tagCtaTextTranslation?.['en'] ||
                t('generateArt', { tag: localizedTagName })}
            </Button>
          </div>
        </div>
      </NextUIProvider>
    </LoginContext.Provider>
  );
}

// 从请求中获取客户端IP地址，考虑Cloudflare代理
function getClientIPFromRequest(
  req: GetServerSidePropsContext['req'],
): string | null {
  // Cloudflare会通过CF-Connecting-IP传递真实IP
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
  }

  // 备用方案：x-forwarded-for（第一个IP是真实IP）
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const forwardedIPs = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedIPs.split(',')[0].trim();
  }

  // 最后尝试x-real-ip
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }

  return null;
}

const getPosts = async (
  tag?: number,
  req?: GetServerSidePropsContext['req'],
) => {
  const origin = process.env.NEXT_PUBLIC_API_URL;

  // 构建headers，传递客户端IP信息
  const headers: HeadersInit = {};
  if (req) {
    const clientIP = getClientIPFromRequest(req);
    headers['x-client-ip'] = clientIP || '';
    headers['x-forwarded-for'] = clientIP || '';
    headers['x-real-ip'] = clientIP || '';
    // headers['cf-connecting-ip'] = clientIP || '';
    headers['x-custom-real-client-ip'] = clientIP || '';
    headers['cookie'] = req.headers.cookie || '';
  }

  const res = await fetch(
    `${origin}/api/fetchFeed?page=1&sortby=Trending&mainfeedonly=True${
      tag ? `&tag=${tag}` : ''
    }`,
    {
      headers,
    },
  ).catch();
  // const data = res ? await res.json() : [];
  const text = await res?.text();
  // console.log('text', text);
  try {
    const data = JSON.parse(text);
    return data;
  } catch {
    return [];
  }
};
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const FAQComp = memo(({ tagName }: { tagName: string }) => {
//   const { t } = useTranslation('tags');
//   const [openFaqId, setOpenFaqId] = useState<number | null>(null);

//   const faqItemsRaw = t('faq.items', { returnObjects: true }) as Array<{
//     question: string;
//     answer: string;
//   }>;
//   const faqItems = faqItemsRaw.map((item, index) => ({
//     question: t(`faq.items.${index}.question`, { tag: tagName }),
//     answer: t(`faq.items.${index}.answer`, { tag: tagName }),
//   }));

//   return (
//     <>
//       {faqItems.map((faq, index) => (
//         <div key={index} className='rounded-lg shadow-sm'>
//           <button
//             className='flex justify-between items-center px-6 py-4 w-full text-left'
//             onClick={() => setOpenFaqId(openFaqId === index ? null : index)}>
//             <span className='text-sm md:text-lg font-medium text-gray-900'>
//               {faq.question}
//             </span>
//             <svg
//               className={`w-5 h-5 text-muted-foreground transform transition-transform ${
//                 openFaqId === index ? 'rotate-180' : ''
//               }`}
//               fill='none'
//               viewBox='0 0 24 24'
//               stroke='currentColor'>
//               <path
//                 strokeLinecap='round'
//                 strokeLinejoin='round'
//                 strokeWidth={2}
//                 d='M19 9l-7 7-7-7'
//               />
//             </svg>
//           </button>
//           {openFaqId === index && (
//             <div className='px-6 pb-4'>
//               <p className='text-muted-foreground text-sm md:text-base'>{faq.answer}</p>
//             </div>
//           )}
//         </div>
//       ))}
//     </>
//   );
// });

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { tag: rawTag } = context.params || {};
  const { req } = context;

  // Check if this is actually a variant page request that should be handled by [tag]/[variant].tsx
  const url = req.url || '';
  const pathSegments = url.split('/').filter(Boolean);
  if (pathSegments.length >= 3 && pathSegments[0] === 'tags') {
    const possibleVariant = pathSegments[2];
    const validVariants = ['fanart', 'oc', 'pfp', 'wallpaper', 'pictures'];

    if (validVariants.includes(possibleVariant)) {
      // This should be handled by the variant page, return 404 to let Next.js route it properly
      return {
        notFound: true,
      };
    }
  }

  // Decode URL-encoded tag name (e.g., "Genshin%20Impact" -> "Genshin Impact")
  const tag = typeof rawTag === 'string' ? decodeURIComponent(rawTag) : rawTag;

  // If no tag provided, return empty
  if (!tag) {
    return {
      props: {
        tag_id: 0,
        tag_name: '',
        posts: [],
      },
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  try {
    // Fetch tag with extended fields (exact case-sensitive match)
    // Use .limit(1) instead of .single() to avoid error when multiple matches exist
    const { data: tagResults, error } = await supabase
      .from('tags')
      .select(
        'id, name, is_nsfw, logo_url, header_image, description, cta_link, character_category, allow_media_types, cta_text_translation, follower_count, post_count, popularity, i18n',
      )
      .eq('name', tag as string)
      .limit(1);

    const data = tagResults?.[0];

    if (error || !data) {
      console.error('Tag query error:', error, 'tag:', tag);
      // Tag not found - return empty posts
      return {
        props: {
          tag_id: 0,
          tag_name: tag || '',
          posts: [],
        },
      };
    }

    // Parse token early for parallel queries
    let userId: string | null = null;
    try {
      const cookies = parse(req.headers.cookie || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (sessionToken) {
        const token = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!,
        });
        userId = (token?.id as string) || null;
      }
    } catch {
      // User not authenticated
    }

    // Define async fetchers
    const fetchModerators = async () => {
      try {
        const { data: modData } = await supabase
          .from('tag_moderators')
          .select(
            `
            id,
            user_id,
            role,
            User:user_id (
              user_name,
              image,
              user_uniqid
            )
          `,
          )
          .eq('tag_id', data.id);

        if (modData) {
          return modData.map((mod: any) => ({
            id: mod.id,
            user_id: mod.user_id,
            role: mod.role,
            user_name: mod.User?.user_name,
            user_image: mod.User?.image,
            user_uniqid: mod.User?.user_uniqid,
          }));
        }
        return [];
      } catch (e) {
        console.error('Error fetching moderators:', e);
        return [];
      }
    };

    const fetchFollowStatus = async () => {
      if (!userId) {
        return false;
      }
      try {
        const { data: followData } = await supabase
          .from('tag_follows')
          .select('id')
          .eq('user_id', userId)
          .eq('tag_id', data.id)
          .single();
        return !!followData;
      } catch {
        return false;
      }
    };

    const fetchPosts = async () => {
      try {
        return data.id === 57360
          ? await getPosts(undefined, req)
          : await getPosts(data.id, req);
      } catch (e) {
        console.error('Error fetching posts for tag:', data.id, e);
        return [];
      }
    };

    // Run all queries in parallel
    const [moderatorsResult, followResult, postsResult] = await Promise.all([
      fetchModerators(),
      fetchFollowStatus(),
      fetchPosts(),
    ]);

    return {
      props: {
        tag_id: data.id || 1,
        tag_name: data.name || tag || 'OC',
        is_nsfw_tag: data.is_nsfw || false,
        logo_url: data.logo_url || null,
        header_image: data.header_image || null,
        description: data.description || null,
        i18n: data.i18n || null,
        cta_link: data.cta_link || null,
        character_category: data.character_category || null,
        allow_media_types: data.allow_media_types || null,
        cta_text_translation: data.cta_text_translation || null,
        follower_count: data.follower_count || 0,
        post_count: data.post_count || 0,
        popularity: data.popularity || 100,
        moderators: moderatorsResult,
        posts: postsResult,
        is_following: followResult,
      },
    };
  } catch (e) {
    console.error('Error in getServerSideProps:', e);
    return {
      props: {
        tag_id: 0,
        tag_name: tag || '',
        posts: [],
      },
    };
  }
}
