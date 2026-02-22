import { useRouter } from 'next/router';
import { NextUIProvider } from '@nextui-org/react';
import dynamic from 'next/dynamic';
import { Header } from '../Components/Header';
import { Feed } from '../Components/Feed';
import { Sidebar } from '../Components/Sidebar';
import mixpanel from 'mixpanel-browser';
import React, { useEffect } from 'react';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import { useHydrateAtoms } from 'jotai/utils';
import { pageAtom, postListAtom, type Post } from '../state';
import { useTranslation } from 'react-i18next';

const TagSearchDropdown = dynamic(
  () =>
    import('../Components/TagSearchDropdown').then(
      mod => mod.TagSearchDropdown,
    ),
  { ssr: false },
);

export default function Home({ posts }: { posts: Post[] }) {
  const { t } = useTranslation(['community', 'feed']);
  const router = useRouter();

  useHydrateAtoms([[postListAtom, posts]]);
  useHydrateAtoms([[pageAtom, posts.length ? 1 : 2]]);

  const currentUrl = `https://komiko.app${router.asPath}`;

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
        <meta name='description' content={t('meta.description')} />
        <meta name='keywords' content={t('meta.keywords')} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={t('meta.title')} />
        <meta property='og:description' content={t('meta.description')} />
        <meta property='og:image' content={'/images/social.webp'} />
        <meta property='og:url' content={currentUrl} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={t('meta.title')} />
        <meta name='twitter:description' content={t('meta.description')} />
        <meta name='twitter:image' content={'/images/social.webp'} />
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
      <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto overflow-hidden'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='w-full md:mt-[4rem] px-2 md:p-4 pt-16 md:pt-4 lg:pl-[240px] lg:ml-5 h-full '>
            {/* Tag Search Box */}
            <div className='flex justify-center mb-4 mt-2 md:mt-0 px-2'>
              <TagSearchDropdown />
            </div>
            <Feed />
          </div>
        </div>
      </main>
    </NextUIProvider>
  );
}

export const getServerSideProps = async () => {
  try {
    const origin = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(
      `${origin}/api/fetchFeed?page=1&sortby=Trending&mainfeedonly=True`,
    );

    if (!response.ok) {
      console.error(
        'Failed to fetch feed:',
        response.status,
        response.statusText,
      );
      return {
        props: { posts: [] },
      };
    }

    const posts = await response.json();

    return {
      props: { posts: posts || [] },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: { posts: [] },
    };
  }
};
