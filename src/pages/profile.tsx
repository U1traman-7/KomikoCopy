import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import { ProfilePage } from '../Components/ProfilePage';
import Head from 'next/head';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation('profile');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          mixpanel.track('visit.page.profile', {});
          console.log('tracking mixpanel');
        } catch (error) {
          console.error('Mixpanel tracking failed:', error);
        }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>{t('pageTitle')}</title>
      </Head>
      <Header />
      <div className='flex'>
        <Sidebar />
        <div className='p-2 pt-16 md:pt-24 w-full h-full lg:pl-[240px] md:ml-5 '>
          <ProfilePage />
        </div>
      </div>
    </main>
  );
}
