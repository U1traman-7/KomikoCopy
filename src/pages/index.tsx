/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { Button, NextUIProvider } from '@nextui-org/react';
import { Card, Chip, CardBody } from '@nextui-org/react';
import { Header } from '../Components/Header';
import { Feed } from '../Components/Feed';
import { Sidebar } from '../Components/Sidebar';
import { TagBar, TagCharacters } from '../Components/TagDetail';
import { QuickCreatePanel } from '../Components/Homepage';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../state';
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import Link from 'next/link';
import { ToolItem } from '../constants';
import {
  PiUserBold,
  PiImageBold,
  PiBookOpenBold,
  PiVideoBold,
} from 'react-icons/pi';
import { FaStar } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import useMediaQuery from '@/hooks/use-media-query';
import { useAtom } from 'jotai';
import { authAtom, postListAtom, pageAtom, feedTagAtom } from '../state';
import { useTranslation } from 'react-i18next';
import { SiteFooter } from '@/components/site-footer';
import { getLocalizedField } from '../utils/i18nText';

// // 现代化Banner组件
// export const FourImageBanner = () => {
//   const { t } = useTranslation('home');

//   const bannerImages = [
//     {
//       src: '/images/banners/assets/badge.jpeg',
//       alt: 'Badge',
//     },
//     {
//       src: '/images/banners/assets/body_pillow.webp',
//       alt: 'Body Pillow',
//     },
//     {
//       src: '/images/banners/assets/plushie.webp',
//       alt: 'Plushie',
//     },
//     {
//       src: '/images/banners/assets/standee.jpeg',
//       alt: 'Standee',
//     },
//   ];

//   return (
//     <div className='w-full p-1 md:px-5 mb-4 md:mb-12 lg:mb-20'>
//       <Link href='/photo-to-anime' className='block'>
//         <div className='rounded-2xl overflow-hidden h-[220px] md:h-[260px] relative cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl bg-gradient-to-r from-purple-800 to-blue-600 shadow-lg'>
//           <div className='flex h-full relative'>
//             {/* 左侧文字内容 */}
//             <div className='flex-1 p-4 md:p-8 flex flex-col justify-center pr-2 md:pr-8'>
//               <h2 className='mb-1 md:mb-4 text-lg md:text-3xl font-bold text-white leading-tight'>
//                 {t('banner.merch_title')}
//               </h2>

//               <p className='mb-3 md:mb-6 text-xs md:text-lg text-white/90 leading-relaxed'>
//                 {t('banner.merch_description')}
//               </p>

//               <Button
//                 color='default'
//                 variant='solid'
//                 className='w-32 md:w-40 font-semibold bg-white text-primary-600 hover:bg-gray-50 border-0'
//                 size='md'>
//                 {t('banner.try_now')}
//               </Button>
//             </div>

//             {/* 右侧图片展示 - 响应式布局 */}
//             <div className='w-[120px] md:w-[520px] p-2 md:p-8 flex items-center'>
//               <div className='grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-5 w-full'>
//                 {bannerImages.map((image, index) => (
//                   <div
//                     key={index}
//                     className='aspect-square overflow-hidden rounded-lg md:rounded-xl shadow-lg border-2 border-white/30 transition-all duration-300 hover:scale-105 hover:border-white/50 bg-white/10 backdrop-blur-sm'>
//                     <img
//                       src={image.src}
//                       alt={image.alt}
//                       className='w-full h-full object-cover'
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// };

// // 合并的轮播Banner组件
// const CombinedCarouselBanner = () => {
//   const { t } = useTranslation('home');

//   const bannerImages = [
//     {
//       src: '/images/banners/assets/badge.jpeg',
//       alt: 'Badge',
//     },
//     {
//       src: '/images/banners/assets/body_pillow.webp',
//       alt: 'Body Pillow',
//     },
//     {
//       src: '/images/banners/assets/plushie.webp',
//       alt: 'Plushie',
//     },
//     {
//       src: '/images/banners/assets/standee.jpeg',
//       alt: 'Standee',
//     },
//   ];

//   return (
//     <div className='w-full p-1 md:px-5 mt-12 md:mt-10 mb-4 md:mb-12 lg:mb-20'>
//       <Slider
//         dots={true}
//         infinite={true}
//         speed={500}
//         slidesToShow={1}
//         slidesToScroll={1}
//         autoplay={true}
//         autoplaySpeed={4000}
//         className='overflow-hidden w-full rounded-xl'>
//         {/* 第一个slide - 四图banner */}
//         <div>
//           <Link href='/photo-to-anime' className='block'>
//             <div className='rounded-xl overflow-hidden h-[220px] md:h-[260px] relative cursor-pointer transition-all duration-300 bg-gradient-to-r from-purple-800 to-blue-600'>
//               <div className='flex h-full relative'>
//                 {/* 左侧文字内容 */}
//                 <div className='flex-1 p-4 md:p-8 flex flex-col justify-center pr-2 md:pr-8'>
//                   <h2 className='mb-1 md:mb-4 text-lg md:text-3xl font-bold text-white leading-tight'>
//                     {t('banner.merch_title')}
//                   </h2>

//                   <p className='mb-3 md:mb-6 text-xs md:text-lg text-white/90 leading-relaxed'>
//                     {t('banner.merch_description')}
//                   </p>

//                   <Button
//                     color='default'
//                     variant='solid'
//                     className='w-32 md:w-40 font-semibold bg-white text-primary-600 hover:bg-gray-50 border-0'
//                     size='md'>
//                     {t('banner.try_now')}
//                   </Button>
//                 </div>

//                 {/* 右侧图片展示 - 响应式布局 */}
//                 <div className='w-[120px] md:w-[520px] p-2 md:p-8 flex items-center'>
//                   <div className='grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-5 w-full'>
//                     {bannerImages.map((image, index) => (
//                       <div
//                         key={index}
//                         className='aspect-square overflow-hidden rounded-lg md:rounded-xl border-2 border-white/30 transition-all duration-300 hover:scale-105 hover:border-white/50 bg-white/10 backdrop-blur-sm'>
//                         <img
//                           src={image.src}
//                           alt={image.alt}
//                           className='w-full h-full object-cover'
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Link>
//         </div>

//         {/* 第二个slide - video to video banner */}
//         <div>
//           <Link href='/video-to-video' className='block'>
//             <div className='relative overflow-hidden h-[220px] md:h-[260px] rounded-xl cursor-pointer transition-all duration-300'>
//               {/* Background image */}
//               <img
//                 src='/images/banner-video2video.webp'
//                 alt={'Video to Video AI'}
//                 className='object-cover object-right md:object-top w-full h-full rounded-xl'
//               />

//               {/* Floating video window - hidden on mobile */}
//               <div className='absolute top-1/2 -translate-y-1/2 right-8 w-48 h-auto bg-black rounded-xl overflow-hidden hidden md:block border-2 border-white'>
//                 <video
//                   className='w-full h-auto object-contain'
//                   muted
//                   autoPlay
//                   playsInline
//                   preload='metadata'
//                   onClick={e => {
//                     e.preventDefault();
//                     const video = e.target as HTMLVideoElement;
//                     if (video.paused) {
//                       video.play();
//                       e.currentTarget
//                         .querySelector('.play-button')
//                         ?.classList.add('hidden');
//                     } else {
//                       video.pause();
//                       e.currentTarget
//                         .querySelector('.play-button')
//                         ?.classList.remove('hidden');
//                     }
//                   }}>
//                   <source
//                     src='https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/cover-v3.webm'
//                     type='video/webm'
//                   />
//                 </video>
//                 <div className='play-button absolute inset-0 flex items-center justify-center pointer-events-none'>
//                   <div className='w-8 h-8 bg-white/80 rounded-full flex items-center justify-center'>
//                     <PiVideoBold size={16} className='text-foreground ml-0.5' />
//                   </div>
//                 </div>
//               </div>

//               <div className='flex absolute inset-0 flex-col justify-center px-4 md:px-10 md:pr-56 rounded-xl'>
//                 <h2 className='mb-4 text-2xl md:text-3xl font-bold text-white drop-shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_80%)]'>
//                   {t('carousel.slide2_title', 'Video to Video AI')}
//                 </h2>
//                 <p className='mb-6 text-sm md:text-lg text-white drop-shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_60%)]'>
//                   {t(
//                     'carousel.slide2_desc',
//                     'Transform your videos with Video to Video AI technology. Our advanced Video Style Transfer converts any video to anime, cartoon, manga, and manhwa styles while preserving original motion and timing.',
//                   )}
//                 </p>
//                 <Button color='primary' variant='solid' className='w-40'>
//                   {t('carousel.check_it_out2', 'Try It Out')}
//                 </Button>
//               </div>
//             </div>
//           </Link>
//         </div>
//       </Slider>
//     </div>
//   );
// };

// 原来的CarouselBanner组件（保留备用）
// const CarouselBanner = () => {
//     const { t } = useTranslation('home');

//     return (
//         <div className="w-full p-1 md:px-5 mt-[60px] mb-4 md:mb-12 lg:mb-20">
//             <Slider
//                 dots={true}
//                 infinite={false}
//                 speed={500}
//                 slidesToShow={1}
//                 slidesToScroll={1}
//                 autoplay={false}
//                 className="overflow-hidden w-full rounded-xl"
//             >
//                 <Link href="/video-to-video" className="relative w-full h-[250px] rounded-xl block">
//                     {/* Background image */}
//                     <img
//                         src="/images/banner-video2video.webp"
//                         alt={'Slide 2'}
//                         className="object-cover object-right md:object-top w-full h-full rounded-xl"
//                     />

//                     {/* Floating video window - hidden on mobile */}
//                     <div className="absolute top-1/2 -translate-y-1/2 right-8 w-48 h-auto bg-black rounded-xl overflow-hidden shadow-lg hidden md:block border-2 border-white">
//                         <video
//                             className="w-full h-auto object-contain"
//                             muted
//                             autoPlay
//                             playsInline
//                             preload="metadata"
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 const video = e.target as HTMLVideoElement;
//                                 if (video.paused) {
//                                     video.play();
//                                     e.currentTarget.querySelector('.play-button')?.classList.add('hidden');
//                                 } else {
//                                     video.pause();
//                                     e.currentTarget.querySelector('.play-button')?.classList.remove('hidden');
//                                 }
//                             }}
//                         >
//                             <source src="https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/cover-v3.webm" type="video/webm" />
//                         </video>
//                         <div className="play-button absolute inset-0 flex items-center justify-center pointer-events-none">
//                             <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
//                                 <PiVideoBold size={16} className="text-foreground ml-0.5" />
//                             </div>
//                         </div>
//                     </div>

//                     <div className="flex absolute inset-0 flex-col justify-center px-4 md:px-10 md:pr-56 rounded-xl">
//                         <h2 className="mb-4 text-2xl md:text-3xl font-bold text-white drop-shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_80%)]">{t('carousel.slide2_title', 'Video to Video AI')}</h2>
//                         <p className="mb-6 text-sm md:text-lg text-white drop-shadow-lg [text-shadow:_0_2px_4px_rgb(0_0_0_/_60%)]">{t('carousel.slide2_desc', 'Transform your videos with Video to Video AI technology. Our advanced Video Style Transfer converts any video to anime, cartoon, manga, and manhwa styles while preserving original motion and timing.')}</p>
//                         <Button
//                             color="primary"
//                             variant="solid"
//                             className="w-40"
//                         >
//                             {t('carousel.check_it_out2', 'Try It Out')}
//                         </Button>
//                     </div>
//                 </Link>
//             </Slider>
//         </div>
//     );
// };

// 添加工具卡片组件
export const ToolCard = ({
  tool,
  active,
}: {
  tool: ToolItem & { badge?: string };
  active?: {
    activeTab: string;
    collList: ToolItem[];
    removeCollectFunc: (item: ToolItem) => void;
    addCollectFunc: (item: ToolItem) => void;
  };
}) => {
  const { t: tCommon } = useTranslation('common');

  const [visible, setVisible] = useState(false);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!mediaRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(entry.target);
        }
      },
      { rootMargin: '100px', threshold: 0.1 },
    );
    obs.observe(mediaRef.current);
    return () => obs.disconnect();
  }, []);

  // 根据是否为横向滚动（for-you）调整宽度
  const containerClass =
    active?.activeTab === 'for-you'
      ? 'w-28 sm:w-32 md:w-36 flex-shrink-0 relative'
      : 'w-full relative';

  return (
    <div className={containerClass}>
      <Card
        as={Link}
        href={`${tool.path}`}
        title={`${tCommon(tool.title_key || '')} - ${tCommon(tool.content_key || '')} | Komiko`}
        rel='dofollow'
        // isPressable
        className='flex flex-col w-full h-full shadow-none hover:shadow-lg border-1 border-border bg-card'>
        {!tool.derivative && (
          <div
            ref={mediaRef}
            className={`relative border-b-1 inset-0 overflow-hidden ${
              active?.activeTab === 'for-you'
                ? 'aspect-[4/3]'
                : 'aspect-[16/10]'
            }`}>
            {tool.video_url && (
              <div className='relative w-full h-full'>
                {visible ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload='none'
                    className='absolute inset-0 w-full h-full object-cover'>
                    <source
                      src={tool.video_url}
                      type={
                        tool.video_url.endsWith('.webm')
                          ? 'video/webm'
                          : 'video/mp4'
                      }
                    />
                  </video>
                ) : (
                  <div className='absolute inset-0 w-full h-full bg-muted' />
                )}
              </div>
            )}

            {tool.image_url && (
              <img
                loading='lazy'
                src={tool.image_url}
                className='block w-full h-full object-cover'
                draggable={false}
                alt={tCommon(tool.title_key || '')}
              />
            )}

            {active &&
              (!active?.collList.find(n => n.path == tool.path) ? (
                <FaStar
                  title='favorite this tool'
                  className='absolute right-2 top-2 z-10 w-6 h-6 text-muted-foreground/40 cursor-pointer transition-transform duration-200 hover:scale-110 hover:drop-shadow-sm'
                  onClick={e => {
                    e.preventDefault();
                    active?.addCollectFunc(tool);
                  }}
                />
              ) : (
                <FaStar
                  title='Unfavorite this tool'
                  className='absolute right-2 top-2 z-10 text-yellow-400 cursor-pointer w-6 h-6 transition-transform duration-200 hover:scale-110 hover:drop-shadow-sm'
                  onClick={e => {
                    e.preventDefault();
                    active?.removeCollectFunc(tool);
                  }}
                />
              ))}
          </div>
        )}
        <CardBody
          className={`flex-grow border-border ${active?.activeTab === 'for-you' ? 'p-1.5 sm:p-2' : ''}`}>
          <div className=''>
            <h3
              className={`font-bold text-foreground ${active?.activeTab === 'for-you' ? 'text-[10px] sm:text-xs md:text-sm leading-tight' : 'text-sm md:text-base'}`}>
              {tCommon(tool.title_key || '')}
            </h3>
            {active?.activeTab !== 'for-you' && (
              <p className='mt-1 text-xs md:text-sm text-muted-foreground'>
                {tCommon(tool.content_key || '')}
              </p>
            )}
          </div>
        </CardBody>
        {tool.badge && (
          <div className='absolute top-2 right-2'>
            <Chip
              size='sm'
              color={tool.badge === 'NEW' ? 'primary' : 'secondary'}
              variant='flat'>
              {tool.badge}
            </Chip>
          </div>
        )}
      </Card>
    </div>
  );
};

export default function Home() {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const { isMobile } = useMediaQuery();
  const { locale, defaultLocale } = router;

  const [activeTab, setActiveTab] = useState('for-you');
  const [isAuth] = useAtom(authAtom);
  const [postList, setPostList] = useAtom(postListAtom);
  const [page, setPage] = useAtom(pageAtom);
  const [feedTag, setFeedTag] = useAtom(feedTagAtom);
  const profile = useAtomValue(profileAtom);

  // TagBar相关状态
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedSortBy, setSelectedSortBy] = useState<'Trending' | 'Newest'>(
    'Trending',
  );
  const [contentTab, setContentTab] = useState<
    'all' | 'featured' | 'characters'
  >('all');
  const [feedKey, setFeedKey] = useState(0);

  const handleSelectedTagChange = (
    tagId: number | null,
    sortBy: 'Trending' | 'Newest' | 'Following',
  ) => {
    setSelectedTagId(tagId);
    setSelectedSortBy(sortBy === 'Following' ? 'Trending' : sortBy);
    setContentTab('all');
  };

  const handleTagBarTabChange = (
    tab: 'all' | 'featured' | 'characters',
    sortBy: 'Trending' | 'Newest',
  ) => {
    setContentTab(tab);
    if (tab !== 'characters') {
      setFeedKey(prev => prev + 1);
    }
  };

  const handleFollowChange = () => {
    // Follow/Unfollow不需要刷新Feed内容
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.home', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  // useEffect(() => {
  //     if (mixpanel) mixpanel?.track('Enter main app')
  // }, [])
  return (
    <NextUIProvider>
      <Head>
        <title>{t('meta.title')}</title>
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('meta.og_title')} />
        <meta property='og:description' content={t('meta.description')} />
        <meta
          property='og:url'
          content={`https://komiko.app${locale === defaultLocale ? '' : `/${locale}`}`}
        />
        <meta property='og:image' content={'/images/character_design.webp'} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('meta.twitter_title')} />
        <meta name='twitter:description' content={t('meta.description')} />
        <meta name='twitter:image' content={'/images/character_design.webp'} />
        <meta name='description' content={t('meta.description')} />
        <meta name='keywords' content={t('meta.keywords')} />

        <link
          rel='preload'
          as='video'
          href='/images/examples/video-to-video/cover-v3.webm'
          type='video/webm'
        />

        {/* //! googleAds  */}
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
      <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />

        <div className='flex'>
          <Sidebar />

          <div className='w-full pt-1 sm:pt-5 md:pt-10 p-2 md:p-4 lg:pl-60 2xl:pl-72 h-full mb-[5rem] lg:mr-8'>
            {/* <div className='mt-14 md:mt-10'>
              <CombinedCarouselBanner />
            </div> */}
            <div className='mt-12 md:mt-10 gap-4 md:gap-6 px-1 md:px-5 w-full sm:grid-cols-2 mb-1 md:mb-1 lg:mb-1 pt-1'>
              <QuickCreatePanel className='mb-0 mt-1' />

              {/* <div className='hidden sm:flex overflow-visible bg-gradient-to-r rounded-xl border-1 border-primary-100 from-primary-500/15 to-primary-500/5 relative'>
                <div className='grid grid-cols-12 gap-6 justify-center items-center md:gap-4'>
                  <div className='flex z-10 flex-col col-span-12 px-4 py-2 md:px-6 md:py-6 md:col-span-7'>
                    <div className='mb-1 w-full max-w-full'>
                      <h3 className='text-lg md:text-2xl lg:text-3xl font-semibold text-heading text-nowrap'>
                        {t('create_section.ai_art', 'AI Art')}
                      </h3>
                    </div>
                    <div className='flex-col justify-start mt-3 md:mt-6 w-full max-w-[240px] md:max-w-[300px]'>
                      <Button
                        as={Link}
                        href='/characters'
                        color='danger'
                        variant='solid'
                        className='font-semibold bg-gradient-to-r from-primary-500 to-purple-500 text-white mb-2 md:mb-3 w-full md:w-[200px] text-sm md:text-base'
                        startContent={
                          <PiUserBold size={16} className='w-4 md:w-5' />
                        }
                        size='sm'>
                        {tCommon('explore_characters', 'Explore Characters')}
                      </Button>

                      <Button
                        as={Link}
                        href='/ai-anime-generator'
                        color='danger'
                        variant='solid'
                        className='font-semibold bg-gradient-to-r from-blue-600 to-secondary-500 text-white mb-1 w-full md:w-[200px] text-sm md:text-base'
                        startContent={
                          <PiImageBold size={16} className='w-4 md:w-5' />
                        }
                        size='sm'>
                        {tCommon('generate_image', 'Generate Image')}
                      </Button>
                    </div>
                  </div>
                  <div className='absolute bottom-0 right-0 lg:right-2 col-span-5'>
                    <img
                      alt={t('create_section.ai_art', 'AI Art')}
                      className='block object-bottom w-24 h-auto sm:w-[120px] lg:w-48 md:h-auto'
                      src='https://d31cygw67xifd4.cloudfront.net/covers/ai-art.webp'
                      style={{
                        marginBottom: 0,
                        padding: 0,
                        display: 'block',
                      }}
                    />
                  </div>
                </div>
              </div> */}
              {/* <div className='hidden sm:flex overflow-visible bg-gradient-to-r rounded-xl border-1 border-secondary-100 from-secondary-500/15 to-secondary-500/5 relative'>
                <div className='grid grid-cols-12 gap-6 justify-center items-center md:gap-4'>
                  <div className='flex z-10 flex-col col-span-12 px-4 py-2 md:px-6 md:py-6 md:col-span-7'>
                    <div className='mb-2 md:mb-1 w-full max-w-full'>
                      <h3 className='text-lg md:text-2xl lg:text-3xl font-semibold text-heading text-nowrap'>
                        {t('create_section.storytelling', 'Storytelling')}
                      </h3>
                    </div>

                    <div className=' flex-col justify-start mt-3 md:mt-6 w-full max-w-[240px] md:max-w-[300px]'>
                      <Button
                        as={Link}
                        href='/image-animation-generator'
                        color='danger'
                        variant='solid'
                        className='font-semibold bg-gradient-to-r from-primary-500 to-purple-500 text-white mb-2 md:mb-3 w-full md:w-[280px] text-sm md:text-base'
                        startContent={
                          <PiVideoBold
                            size={16}
                            className='w-4 md:w-5 stroke-1'
                          />
                        }
                        size='sm'>
                        {tCommon('generate_animation', 'Generate Video')}
                      </Button>

                      <div className='flex gap-1 md:gap-2 mb-1 w-full md:w-[280px]'>
                        <Button
                          as={Link}
                          href='/ai-comic-generator'
                          color='danger'
                          variant='solid'
                          className='font-semibold bg-gradient-to-r from-blue-600 to-secondary-500 text-white flex-1 text-sm md:text-base min-w-[80px] md:min-w-[120px]'
                          startContent={
                            <PiBookOpenBold
                              size={14}
                              className='w-3 md:w-4 flex-shrink-0'
                            />
                          }
                          size='sm'>
                          <span className='truncate'>
                            {tCommon('generate', 'Generate')}
                          </span>
                        </Button>

                        <Button
                          as={Link}
                          href='/create'
                          color='danger'
                          variant='solid'
                          className='font-semibold bg-gradient-to-r from-blue-600 to-secondary-500 text-white flex-1 text-sm md:text-base min-w-[80px] md:min-w-[120px]'
                          size='sm'>
                          <span className='truncate'>
                            {tCommon('create_comic', 'Create Comic')}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className='absolute bottom-0 right-0 lg:right-2 col-span-5'>
                    <img
                      alt={t('create_section.storytelling', 'Storytelling')}
                      className='block object-bottom w-24 h-auto sm:w-[120px] lg:w-48 md:h-auto'
                      src='https://d31cygw67xifd4.cloudfront.net/covers/storytelling.webp'
                      style={{
                        marginBottom: 0,
                        padding: 0,
                        display: 'block',
                      }}
                    />
                  </div>
                </div>
              </div> */}
            </div>
            {/* <div className='px-1 md:px-5 mb-4 md:mb-6'>
              <div className='flex flex-col gap-3 md:gap-4 rounded-2xl md:rounded-3xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm md:flex-row md:items-center md:justify-between'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-wide text-primary-600'>
                    {t('ai_apps_banner.eyebrow', 'Templates & Tools')}
                  </p>
                  <h2 className='mt-0.5 md:mt-1 text-lg font-bold text-heading md:text-2xl'>
                    {t('ai_apps_banner.title', 'Explore All AI Apps')}
                  </h2>
                  <p className='mt-1 md:mt-2 max-w-2xl text-xs text-slate-600 md:text-base'>
                    {t(
                      'ai_apps_banner.description',
                      'Your favorite generators now live on the AI Apps page. Pin go-to workflows and jump into creation faster than ever.',
                    )}
                  </p>
                </div>
                <Button
                  as={Link}
                  href='/ai-apps'
                  color='primary'
                  radius='md'
                  variant='flat'
                  className='w-full md:w-auto md:text-base'>
                  {t('ai_apps_banner.cta', 'Open AI Apps')}
                </Button>
              </div>
            </div> */}
            {/* <div className='flex gap-2 items-center mb-4 text-xl font-bold text-gray-400'>
              <h2
                className={`pr-1 pl-2 md:pl-5 text-foreground transition-all duration-200 ease-in-out cursor-pointer`}
                onClick={() => router.push('/community')}>
                {t('hero.community')}
              </h2>
            </div> */}
            <div className='mt-2 w-full h-full mx-auto p-1 md:px-5'>
              <Feed
                prerenderedPosts={false}
                onSelectedTagChange={handleSelectedTagChange}
                refreshId={feedKey}
                featured={contentTab === 'featured'}
                hideContent={contentTab === 'characters'}
                compact
                headerContent={
                  <TagBar
                    tagId={selectedTagId}
                    sortBy={selectedSortBy}
                    activeTab={contentTab}
                    onTabChange={handleTagBarTabChange}
                    onFollowChange={handleFollowChange}
                    onTagUpdated={() => setFeedKey(prev => prev + 1)}
                    compact
                  />
                }
                customContent={
                  selectedTagId ? (
                    <TagCharacters
                      tagId={selectedTagId}
                      showAll={true}
                      isModerator={profile?.roles?.includes(1) || false}
                      compact
                    />
                  ) : null
                }
                floatingButton={(tag, ctaTextTranslation) => {
                  const localizedTagName = tag
                    ? getLocalizedField(tag, 'name', router.locale || 'en')
                    : null;
                  return (
                    <div className='fixed z-50 flex justify-center bottom-20 lg:bottom-4 left-0 right-0 lg:left-60 2xl:left-72'>
                      <div className='px-4'>
                        <Button
                          variant='flat'
                          color='primary'
                          size='md'
                          onClick={() => {
                            router.push(
                              tag
                                ? `/ai-anime-generator?prompt=${encodeURIComponent(tag.name)}`
                                : '/ai-anime-generator',
                            );
                          }}
                          className='
                            shadow-lg hover:shadow-xl transition-all duration-200 font-semibold rounded-full
                            bg-blue-600 hover:bg-blue-600
                            border border-blue-500
                            hover:scale-105 hover:shadow-2xl
                            text-white
                            px-4 py-2 text-sm
                            drop-shadow-md
                          '
                          startContent={<FiPlus className='w-4 h-4' />}>
                          {ctaTextTranslation?.[router.locale || 'en'] ||
                            ctaTextTranslation?.['en'] ||
                            (localizedTagName
                              ? t('generateTagArt', {
                                  tag: localizedTagName,
                                  defaultValue: `Generate ${localizedTagName} Art`,
                                })
                              : t('generateArt', {
                                  defaultValue: 'Generate Art',
                                }))}
                        </Button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
            <SiteFooter className='border-border ios-safe-bottom' />
          </div>
        </div>
      </main>
    </NextUIProvider>
  );
}
