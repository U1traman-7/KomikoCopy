// [#target:tools]
/*eslint-disable */
import React from 'react';
import dynamic from 'next/dynamic';
import { NextUIProvider } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Sidebar } from '../../Components/Sidebar';
import Script from 'next/script';
import { useLoginModal } from 'hooks/useLoginModal';
import { useTranslation } from 'react-i18next';

// 动态导入InfCanva组件以防止Canvas被打包到主bundle
const InfCanva = dynamic(
  () =>
    import('../../Components/InfCanva').then(mod => ({
      default: mod.InfCanva,
    })),
  { ssr: false },
);

export const LoginContext = React.createContext<{ onLoginOpen: () => void }>({
  onLoginOpen: () => {},
});
export default function CreateStory() {
  const { LoginModal, onOpen } = useLoginModal();
  const { t } = useTranslation('create');

  return (
    <LoginContext.Provider value={{ onLoginOpen: onOpen }}>
      <NextUIProvider>
        <Head>
          <title>{t('pageTitle')}</title>
          {/* //! googleAds  */}
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
        </Head>
        <Analytics />
        <div>
          <Toaster position='top-right' />
        </div>
        <main className='caffelabs text-foreground bg-background'>
          <Sidebar loginPopupOnly={true} />
          <InfCanva />
          <LoginModal />
        </main>
      </NextUIProvider>
    </LoginContext.Provider>
  );
}
