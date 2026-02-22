import React, { useEffect, useRef, useState } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import '../styles/global.css';
import toast, { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import type { AppProps } from 'next/app';
import mixpanel from 'mixpanel-browser';
import { changeLocale, getUserInfo, shouldSuppressToast } from '../utilities';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { Toaster as ToasterCustom } from '@/ui/toaster';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import Modals from '@/components/Modals';
import { useGoogleOneTap } from '@/hooks/useGoogleOneTap';
import { useDailyCheckInTrigger } from '@/hooks/useDailyCheckInTrigger';
import {
  trackPageView,
  setUserProperties,
  getUserSegment,
  trackUserRegistration,
  trackUserLogin,
} from '../utilities/analytics';
import { initServiceWorkerMonitor } from '../utilities/serviceWorkerMonitor';
import { setupEphemeralScrollbar } from '@/utils/ephemeralScrollbar';
import { NetworkStatusMonitor } from '../Components/NetworkStatus';
import { useInitializeApp } from '../hooks/useInitializeApp';
import { SimulaProvider } from '@simula/ads';
import { CookieConsentBanner } from '@/Components/CookieConsentBanner';
import {
  getAdConsentStatus,
  acceptAdConsent,
  rejectAdConsent,
} from '@/utils/adConsent';

// Nunito
import { Nunito } from 'next/font/google';
// import Clarity from '@microsoft/clarity';

const nunito = Nunito({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-nunito',
});

// Force dynamic rendering to avoid SSR issues with browser APIs
export const dynamic = 'force-dynamic';

const BASE_URL_AUTH = '/v2/api/auth';

// ThemedMain component to apply NextUI theme based on next-themes
function ThemedMain({
  children,
  nunito,
}: {
  children: React.ReactNode;
  nunito: { variable: string; className: string };
}) {
  const { resolvedTheme } = useTheme();
  // Map next-themes theme to NextUI theme name
  const nextuiTheme = resolvedTheme === 'dark' ? 'caffelabs-dark' : 'caffelabs';

  // Apply theme to html and body for NextUI Portal content (Modal, Popover, Select dropdown, etc.)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      const body = document.body;

      // Remove old theme classes
      html.classList.remove('caffelabs', 'caffelabs-dark');
      body.classList.remove('caffelabs', 'caffelabs-dark');

      // Add current theme class
      html.classList.add(nextuiTheme);
      body.classList.add(nextuiTheme);

      // Set data-theme attribute for NextUI
      html.setAttribute('data-theme', nextuiTheme);
      body.setAttribute('data-theme', nextuiTheme);
    }
  }, [nextuiTheme]);

  return (
    <main
      className={`${nunito.variable} ${nunito.className} ${nextuiTheme}`}
      data-theme={nextuiTheme}>
      {children}
    </main>
  );
}
// Clarity.init('r2upezbwh5');
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);

  useGoogleOneTap();
  useDailyCheckInTrigger();
  useInitializeApp(); // 初始化模板数据缓存

  // Simula 广告系统: 隐私同意状态
  const [hasPrivacyConsent, setHasPrivacyConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    // 检查用户的广告隐私同意状态
    const consentStatus = getAdConsentStatus();

    if (consentStatus === 'accepted') {
      setHasPrivacyConsent(true);
    } else if (consentStatus === 'rejected') {
      setHasPrivacyConsent(false);
    } else {
      // 用户尚未做出选择，显示同意弹窗
      setShowConsentModal(true);
    }
  }, []);

  // 处理用户接受广告隐私同意
  const handleAcceptConsent = () => {
    acceptAdConsent();
    setHasPrivacyConsent(true);
    setShowConsentModal(false);
  };

  // 处理用户拒绝广告隐私同意
  const handleRejectConsent = () => {
    rejectAdConsent();
    setHasPrivacyConsent(false);
    setShowConsentModal(false);
  };

  // Ensure next/font applies to portal content (e.g., NextUI Modal mounted on <body>)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      const body = document.body;
      html.classList.add(nunito.variable, nunito.className);
      body.classList.add(nunito.variable, nunito.className);

      // Setup ephemeral scrollbar: hidden by default, shows while scrolling
      const cleanupScrollbar = setupEphemeralScrollbar();

      return () => {
        html.classList.remove(nunito.variable, nunito.className);
        body.classList.remove(nunito.variable, nunito.className);
        if (cleanupScrollbar) {
          cleanupScrollbar();
        }
      };
    }
  }, []);

  useEffect(() => {
    // Globally suppress PostHog-related error toasts
    const originalToastError = toast.error as unknown as (
      message: any,
      options?: any,
    ) => any;
    (toast as any).error = (message: any, options?: any) => {
      const text =
        typeof message === 'string' ? message : message?.message || '';
      if (shouldSuppressToast(text)) {
        return;
      }
      return originalToastError(message, options);
    };

    (async () => {
      try {
        if (!process.env.NEXT_PUBLIC_mixpanel_api_key) {
          throw new Error('Mixpanel API key is missing');
        }
        mixpanel.init(process.env.NEXT_PUBLIC_mixpanel_api_key, {
          debug: true,
          track_pageview: true,
          persistence: 'localStorage',
          ignore_dnt: true,
        });

        const userInfo = await getUserInfo();
        mixpanel.identify(userInfo?.id);
        mixpanel.people.set({ ...userInfo });
        // Track App Open
        mixpanel.track('App Open');

        // Track page views on route changes
        const handleRouteChange = (url: string) => {
          mixpanel.track('Page View', { page: url });
        };

        router.events.on('routeChangeComplete', handleRouteChange);

        // Track App Background when the app loses focus
        const handleVisibilityChange = () => {
          if (document.hidden) {
            mixpanel.track('App Background');
          } else {
            mixpanel.track('App Open');
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function to track App Close
        return () => {
          router.events.off('routeChangeComplete', handleRouteChange);
          document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange,
          );

          // Track App Close when the component unmounts or the user leaves the app
          mixpanel.track('App Close');
        };
      } catch (error) {
        console.error('Error initializing Mixpanel:', error);
      }
    })();
  }, []);

  const profileIdRef = useRef<string | undefined>();
  useEffect(() => {
    profileIdRef.current = profile?.id;
  }, [profile?.id]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      loaded: posthogInstance => {
        if (process.env.NODE_ENV === 'development') {
          posthogInstance.debug();
        }
      },
    });

    const handleRouteChange = (url: string) => {
      posthog.capture('$pageview');
      // Track page view with our custom tracking using current profile id
      trackPageView(url, profileIdRef.current);
    };
    Router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  // Global loading toast for route transitions (only for tag pages)
  useEffect(() => {
    let loadingToastId: string | undefined;

    const handleRouteStart = (url: string) => {
      // Only show loading for tag pages
      const path = url.split('?')[0];
      if (!path.includes('/tags/')) {
        return;
      }

      loadingToastId = toast.loading(i18n.t('common:post_card.loading'), {
        position: 'top-center',
      });
    };

    const handleRouteEnd = () => {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
        loadingToastId = undefined;
      }
    };

    Router.events.on('routeChangeStart', handleRouteStart);
    Router.events.on('routeChangeComplete', handleRouteEnd);
    Router.events.on('routeChangeError', handleRouteEnd);

    return () => {
      Router.events.off('routeChangeStart', handleRouteStart);
      Router.events.off('routeChangeComplete', handleRouteEnd);
      Router.events.off('routeChangeError', handleRouteEnd);
    };
  }, []);

  useEffect(() => {
    // Disable PostHog in local development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    if (isAuth && profile?.id) {
      posthog.identify(profile.id, {
        email: profile.email,
        plan: profile.plan,
      });

      window['trackdesk']?.('komikoai', 'externalCid', {
        externalCid: profile.email,
        revenueOriginId: 'ab00840f-a953-4c0a-a700-17cdb81cbadc',
      });

      if (profile?.email && profile?.created_at) {
        // Check for pending login/registration event
        try {
          const pendingTrackRaw = localStorage.getItem('pending_login_track');
          if (pendingTrackRaw) {
            const pendingTrack = JSON.parse(pendingTrackRaw);
            const eventTime = new Date(pendingTrack.timestamp).getTime();
            const userCreationTime = new Date(profile.created_at).getTime();

            // If the event happened within 60 seconds of user creation, it's a registration
            if (Math.abs(eventTime - userCreationTime) < 60000) {
              trackUserRegistration(
                profile.id,
                profile.email,
                pendingTrack.method,
              );
            } else {
              trackUserLogin(profile.id, profile.email, pendingTrack.method);
            }
            localStorage.removeItem('pending_login_track');
          }
        } catch (error) {
          console.error('Error processing pending track:', error);
        }

        setUserProperties({
          email: profile.email,
          plan: profile.plan || 'Free',
          subscription_status: String(profile.subscription_status || 'none'),
          total_credits: profile.credit || 0,
          user_segment: getUserSegment(
            profile.created_at || new Date().toISOString(),
            profile.plan || 'Free',
            String(profile.subscription_status || 'none'),
          ),
        });
      }
    }
  }, [
    isAuth,
    profile?.id,
    profile?.email,
    profile?.plan,
    profile?.subscription_status,
    profile?.credit,
    profile?.created_at,
  ]);

  // 监听 Service Worker 更新和健康状况
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 初始化 Service Worker 监控
      initServiceWorkerMonitor().catch(error => {
        console.error('Failed to initialize Service Worker Monitor:', error);
      });

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'SW_UPDATED') {
          toast.success(
            'App updated! External images should now work properly.',
            {
              duration: 5000,
              position: 'top-center',
            },
          );
        } else if (event.data.type === 'SW_ERROR') {
          console.error('Service Worker错误:', event.data.error);
          // 追踪错误到 PostHog
          import('../utilities/analytics').then(
            ({ trackServiceWorkerError }) => {
              trackServiceWorkerError(
                event.data.error,
                event.data.errorType || 'uncaught',
                profile?.id,
              );
            },
          );
        } else if (event.data.type === 'SW_PERFORMANCE_WARNING') {
          console.warn('Service Worker性能警告:', event.data.message);
          // 追踪性能警告到 PostHog
          import('../utilities/analytics').then(
            ({ trackServiceWorkerPerformanceWarning }) => {
              trackServiceWorkerPerformanceWarning(
                event.data.message,
                event.data.cacheSize,
                profile?.id,
              );
            },
          );
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('login_failed')) {
      fetch('/api/logout');
      sessionStorage.removeItem('login_failed');
    }
  }, []);

  // Simula API key - only use SimulaProvider if key is available
  const SIMULA_API_KEY = process.env.NEXT_PUBLIC_SIMULA_API_KEY;

  // 公共的应用内容，避免代码重复
  const appContent = (
    <NextThemesProvider
      attribute='class'
      defaultTheme='light'
      enableSystem={true}
      storageKey='komiko-theme'
      disableTransitionOnChange>
      <NextUIProvider>
        <Head>
          <meta
            name='viewport'
            content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
          />
          <link rel='icon' type='image/png' href='/images/favicon.webp' />
          <link rel='icon' href='/images/favicon.ico' />
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
          {/* tag for microsoft clarity */}
          <Script
            dangerouslySetInnerHTML={{
              __html: `<script type="text/javascript">
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "r2upezbwh5");
        </script>`,
            }}></Script>
        </Head>
        <Script src='//cdn.trackdesk.com/tracking.js' async></Script>
        <Script
          dangerouslySetInnerHTML={{
            __html: `(function(t,d,k){(t[k]=t[k]||[]).push(d);t[d]=t[d]||t[k].f||function(){(t[d].q=t[d].q||[]).push(arguments)}})(window,"trackdesk","TrackdeskObject");
          trackdesk('komikoai', 'click');
          `,
          }}></Script>
        <ThemedMain nunito={nunito}>
          <Analytics />
          <div>
            <Toaster position='top-right' />
          </div>
          <Component {...pageProps} />
          <ToasterCustom />
          <Modals />
          <NetworkStatusMonitor />
          {/* Cookie 同意横幅移到 NextUIProvider 内部，确保主题生效 */}
          <CookieConsentBanner
            isVisible={showConsentModal}
            onAccept={handleAcceptConsent}
            onReject={handleRejectConsent}
          />
        </ThemedMain>
      </NextUIProvider>
    </NextThemesProvider>
  );

  return (
    <>
      <PostHogProvider client={posthog}>
        <SessionProvider session={session} basePath={BASE_URL_AUTH}>
          {SIMULA_API_KEY ? (
            <SimulaProvider
              apiKey={SIMULA_API_KEY}
              primaryUserID={profile?.id || 'anonymous'}
              hasPrivacyConsent={hasPrivacyConsent}
              devMode={process.env.NODE_ENV === 'development'}>
              {appContent}
            </SimulaProvider>
          ) : (
            appContent
          )}
        </SessionProvider>
      </PostHogProvider>
    </>
  );
}

const useRefCode = () => {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    try {
      const url = new URL(window.location.href);
      const refCode = url.searchParams.get('code');
      url.searchParams.delete('code');
      if (refCode) {
        document.cookie = `ref=${refCode}; path=/; max-age=${60 * 60 * 24 * 365 * 10}`;
        history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  }, [router.isReady]);
};

export default function App(props: AppProps) {
  i18n.changeLanguage(props.router.locale);
  useEffect(() => {
    // Move navigator access inside useEffect to ensure client-side only
    const lang = localStorage.getItem('lang');
    if (typeof window !== 'undefined') {
      const defaultLang = navigator.language;
      const supportedLngs = Object.keys(
        i18n.options.resources || {},
      ) as string[];
      if (
        !lang &&
        props.router.locale === 'en' &&
        defaultLang !== 'en' &&
        supportedLngs.includes(defaultLang)
      ) {
        changeLocale(defaultLang);
        props.router.push(props.router.pathname, props.router.asPath, {
          locale: defaultLang,
        });
      }
    }
  }, []);
  useRefCode();
  return (
    <I18nextProvider i18n={i18n}>
      <MyApp {...props} />
    </I18nextProvider>
  );
}
