import { NextUIProvider } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Sidebar } from '../Components/Sidebar';
import nextDynamic from 'next/dynamic';

// // 动态导入InfCanva组件以防止Canvas被打包
// const InfCanva = nextDynamic(() =>
//   import('../Components/InfCanva').then(mod => ({ default: mod.InfCanva })),
//   {
//     ssr: false,
//     loading: () => <div className="flex justify-center items-center h-64">Loading Canvas...</div>
//   }
// );

// Dynamically import ImageGenerationController to prevent Canvas from being bundled
const ImageGenerationController = nextDynamic(
  () =>
    import('../Components/RightSidebar/RightSidebar').then(mod => ({
      default: mod.ImageGenerationController,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex justify-center items-center h-64'>Loading...</div>
    ),
  },
);
import { useState, useEffect } from 'react';
import { DrawAction, TEMP_IMAGE_URL } from '../constants';
import { Header } from '../Components/Header';
import ProfileGallery from '../Components/ProfilePage/ProfileGallery';
import { isMobileAtom } from '../state';
import { useAtom } from 'jotai';
import Script from 'next/script';
import { GetServerSideProps } from 'next';

// Force dynamic rendering to avoid SSR issues with browser APIs
export const dynamic = 'force-dynamic';

// This ensures the page runs with dynamic rendering
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function CreateStory() {
  const router = useRouter();
  const { prompt } = router.query;
  const [inputValue, setInputValue] = useState('');
  const [prelist, setPrelist] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useAtom(isMobileAtom);

  useEffect(() => {
    // Check for mobile only on client-side
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [setIsMobile]);

  const onImageLoaded = (
    imageObj: any,
    options: {
      replace?: boolean | string;
      updateSize?: boolean;
      imageIndex?: number | undefined;
      prompt?: string;
      model?: string;
      selectedCharImages?: any[];
      asyncImageFunc?: any;
    },
  ) => {
    console.log('onImageLoaded');
    (async () => {
      setPrelist([
        { prompt: options.prompt, url_path: 'loading.webp' },
        ...prelist,
      ]);
      const { imageUrls } = await options.asyncImageFunc();
      console.log('imageUrls', imageUrls);
      setPrelist([
        ...imageUrls.map((url: string) => ({
          prompt: options.prompt,
          url_path: url.replace(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/`,
            '',
          ),
        })),
        ...prelist,
      ]);
    })();
  };

  return (
    <NextUIProvider>
      <Head>
        <title>Create Story | KomikoAI</title>
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
      <div>
        <Toaster position='top-right' />
      </div>
      <main className='caffelabs text-foreground bg-background'>
        <Header />
        <Sidebar loginPopupOnly={true} />
        {!isMobile && (
          <div className='mt-[64px] mx-4 flex flex-row'>
            <div className='mt-4 w-[380px] xs:w-full md:w-[380px]'>
              <ImageGenerationController
                inputValue={inputValue}
                setInputValue={setInputValue}
                onImageLoaded={onImageLoaded}
                currentSelectedShape={undefined}
                isMobile={false}
                prompt={prompt as string | undefined}
              />
            </div>
            <div className='h-[calc(100vh-64px)] pt-4 overflow-y-auto w-[calc(100%-380px)]'>
              <ProfileGallery prelist={prelist} />
            </div>
          </div>
        )}
        {isMobile && (
          <div className='mt-[64px] mx-4 flex flex-col'>
            <div className='h-[calc(50vh-64px)] pt-4 overflow-y-auto w-full'>
              <ProfileGallery prelist={prelist} />
            </div>
            <div className='mt-4 w-full'>
              <ImageGenerationController
                inputValue={inputValue}
                setInputValue={setInputValue}
                onImageLoaded={onImageLoaded}
                currentSelectedShape={undefined}
                isMobile={false}
                prompt={prompt as string | undefined}
              />
            </div>
          </div>
        )}
      </main>
    </NextUIProvider>
  );
}
