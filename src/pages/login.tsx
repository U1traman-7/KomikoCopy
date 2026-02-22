import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import cn from 'classnames';
import { buttonVariants } from '../Components/common/button';
import * as Icons from '../Components/common/icons';

import { UserAuthForm } from '../Components/user-auth-form';
import { i18nDict as dict } from '../utilities';
import { useTranslation } from 'react-i18next';
import { useLoginModal } from 'hooks/useLoginModal';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  const { t } = useTranslation('login');
  useLoginModal(true);
  return (
    <div className='container flex flex-col justify-center items-center w-screen h-screen'>
      <Link
        href={`/`}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 left-4 md:left-8 md:top-8',
        )}>
        <>
          <Icons.ChevronLeft className='mr-2 w-4 h-4' />
          {t('back')}
        </>
      </Link>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <Image
            src='/images/logo_new.webp'
            className='mx-auto dark:brightness-200'
            width='144'
            height='72'
            alt=''
          />
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('welcome_back')}
          </h1>
          <p className='text-sm text-muted-foreground'>{t('signin_title')}</p>
        </div>
        <UserAuthForm />
        <p className='px-8 text-sm text-center text-muted-foreground'>
          <Link
            href={`/register`}
            className='underline hover:text-brand underline-offset-4'>
            {t('singup_title')}
          </Link>
        </p>
      </div>
    </div>
  );
}
