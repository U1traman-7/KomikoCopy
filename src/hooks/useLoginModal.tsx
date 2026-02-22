import { useAtom } from 'jotai';
import { authAtom } from '../state';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { UserAuthForm } from '../Components/user-auth-form';
import { LOGIN_FAILED, LOGIN_SUCCESS, toastError } from '../utilities';
import { useCheckAuth } from './useCheckAuth';

interface FullLoginModalReturn {
  LoginModal: () => JSX.Element;
  isOpen: boolean;
  onOpen: () => void;
  onOpenChange: () => void;
  isAuth: boolean;
  onClose: () => void;
}

// Function overloads for precise typing
export function useLoginModal(justEffect: true, noCheckAuth: boolean): null;
export function useLoginModal(
  justEffect?: false,
  noCheckAuth?: boolean,
): FullLoginModalReturn;
export function useLoginModal(
  justEffect = false,
  noCheckAuth = false,
): null | FullLoginModalReturn {
  const [isAuth] = useAtom(authAtom);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const router = useRouter();
  const checkAuth = useCheckAuth();

  useEffect(() => {
    const success = (e: MessageEvent) => {
      if (e.origin !== window.origin) {
        console.log('not same origin');
        return;
      }
      if (e.data === LOGIN_SUCCESS) {
        checkAuth().then(result => {
          if (result) {
            if (
              window.location.pathname.includes('login') ||
              window.location.pathname.includes('register')
            ) {
              router.push('/');
            }
            onClose();
            return;
          }
          toastError('Login failed');
        });
      } else if (e.data === LOGIN_FAILED) {
        fetch('/api/logout');
      }
    };
    const channel = new BroadcastChannel(LOGIN_SUCCESS);
    channel.addEventListener('message', success);
    if (!noCheckAuth) {
      checkAuth();
    }
    window.addEventListener('message', success);
    return () => {
      window.removeEventListener('message', success);
    };
  }, [onClose]);

  if (justEffect) {
    return null;
  }

  return {
    LoginModal: () => {
      const { t } = useTranslation('login');

      return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {onClose => (
              <>
                <ModalBody className='flex flex-col justify-center items-center pt-8 pb-8 space-y-6'>
                  <div className='flex flex-col space-y-2 text-center'>
                    <Image
                      src='/images/logo_new.webp'
                      className='mx-auto dark:brightness-200'
                      width='144'
                      height='72'
                      alt=''
                    />
                    <h2 className='text-2xl font-semibold tracking-tight'>
                      {t('welcome_to_komiko')}
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                      {t('signin_subtitle')}
                    </p>
                  </div>
                  <UserAuthForm className='w-[80%]' />
                  <p className='px-8 text-sm text-center text-muted-foreground'>
                    <a
                      href='https://discord.gg/KJNSBVVkvN'
                      target='_blank'
                      className='underline hover:text-brand underline-offset-4'
                      rel='noreferrer'>
                      {t('trouble_signin')}
                    </a>
                  </p>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      );
    },
    isOpen,
    onOpen,
    onOpenChange,
    isAuth,
    onClose,
  };
}
