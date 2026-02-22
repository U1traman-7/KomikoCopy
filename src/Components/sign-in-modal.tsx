import React, { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

import { Button } from './common/button';
import * as Icons from './common/icons';

import { Modal } from './modal';
import { siteConfig } from '../utilities';
import { useSigninModal } from '../hooks/use-sigin-modal';
import { useTranslation } from 'react-i18next';

export const SignInModal = () => {
  const signInModal = useSigninModal();
  const [signInClicked, setSignInClicked] = useState(false);
  const { t } = useTranslation('login');

  return (
    <Modal showModal={signInModal.isOpen} setShowModal={signInModal.onClose}>
      <div className='w-full'>
        <div className='flex flex-col justify-center items-center px-4 py-6 pt-8 space-y-3 text-center border-b bg-background md:px-16'>
          <a href={siteConfig.url}>
            <Image
              src='/images/logo_new.webp'
              className='mx-auto dark:brightness-200'
              width='64'
              height='64'
              alt=''
            />
          </a>
          <h3 className='text-2xl font-bold font-urban'>{t('signup')}</h3>
          <p className='text-sm text-muted-foreground'>{t('privacy')}</p>
        </div>

        <div className='flex flex-col px-4 py-8 space-y-4 bg-secondary/50 md:px-16'>
          <Button
            variant='default'
            disabled={signInClicked}
            onClick={() => {
              setSignInClicked(true);
              signIn('github', { redirect: false })
                .then(() =>
                  setTimeout(() => {
                    signInModal.onClose();
                  }, 1000),
                )
                .catch(error => {
                  console.error('signUp failed:', error);
                });
            }}>
            {signInClicked ? (
              <Icons.Spinner className='mr-2 w-4 h-4 animate-spin' />
            ) : (
              <Icons.GitHub className='mr-2 w-4 h-4' />
            )}{' '}
            {t('signup_github')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
