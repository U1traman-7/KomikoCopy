import { useEffect, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { env } from '@/utils/env';
import { useAtomValue } from 'jotai';
import { authAtom, checkedAuthAtom } from '../state';
import { useCheckAuth } from './useCheckAuth';
import { checkEmail } from '../utilities';

interface GoogleOneTapConfig {
  client_id: string;
  callback: (response: GoogleOneTapResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleOneTapResponse {
  credential: string;
  select_by: string;
}

interface GoogleOneTapNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleOneTapConfig) => void;
          prompt: (
            callback?: (notification: GoogleOneTapNotification) => void,
          ) => void;
          renderButton: (
            element: HTMLElement,
            config: Record<string, unknown>,
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const useGoogleOneTap = () => {
  const isAuth = useAtomValue(authAtom);
  const checkedAuth = useAtomValue(checkedAuthAtom);
  const checkAuth = useCheckAuth();

  const isChrome = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return (
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    );
  }, []);

  const initializeGoogleOneTap = useCallback(() => {
    if (typeof window === 'undefined' || !isChrome()) {
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: GoogleOneTapResponse) => {
            try {
              const result = await signIn('google-one-tap', {
                credential: response.credential,
                redirect: false,
              });

              if (result?.ok) {
                // let redirectUrl = window.location.href;
                // if (redirectUrl?.match(/(login|register)$/)) {
                //   redirectUrl = '/home';
                // }
                // window.localStorage.setItem('redirect_url', redirectUrl);
                // window.location.href = '/login-success';
                checkEmail()
                  .then(result => {
                    if (!result) {
                      // return fetch('/api/logout');
                      return fetch('/api/logout').then(() => false);
                    }

                    return true;
                  })
                  .then(result => {
                    if (result) {
                      return checkAuth();
                    }
                    return false;
                  });
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error('Google One Tap sign in error:', error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Prompt the One Tap UI
        window.google.accounts.id.prompt(
          (notification: GoogleOneTapNotification) => {
            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment()
            ) {
              // One Tap is not displayed or skipped
              // eslint-disable-next-line no-console
              console.log('Google One Tap not displayed or skipped');
            }
          },
        );
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    };
  }, [isChrome, checkAuth]);

  useEffect(() => {
    if (!isAuth && checkedAuth) {
      const cleanup = initializeGoogleOneTap();
      return cleanup;
    }
  }, [initializeGoogleOneTap, isAuth, checkedAuth]);

  return { isChrome };
};
