import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { isMobile } from 'react-device-detect';

import cn from 'classnames';
import { buttonVariants } from '../Components/common/button';
import * as Icons from '../Components/common/icons';
import { Input } from '../Components/common/input';
import { Label } from '../Components/common/label';
import { toast } from '../Components/common/use-toast';

import { EmailWhiteList } from '../utilities';

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

const isEmailAllowed = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  const userAccount = email.split('@')[0];
  if (userAccount.includes('+') || userAccount.includes('.')) {
    return false;
  }
  return EmailWhiteList.includes(domain as any);
};

const userAuthSchema = z.object({
  email: z.string().email(),
  // .refine(
  //   email => {
  //     const domain = email.split('@')[1]?.toLowerCase();
  //     return EmailWhiteList.includes(domain as any);
  //   },
  //   {
  //     message: 'toast:error.emailDomainNotAllowed',
  //   },
  // ),
  invitationCode: z.string().optional(),
});

type FormData = z.infer<typeof userAuthSchema>;

const setCookie = (name: string, value: string, days: number = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const { t } = useTranslation('toast');
  // Initialize Google One Tap for Chrome browsers
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const invitationCode = watch('invitationCode');

  async function onSubmit(data: FormData) {
    const emails = localStorage.getItem('devices_emails') || '[]';
    let emailsArray: string[] = [];
    try {
      emailsArray = JSON.parse(emails);
    } catch (error) {
      console.error('Error parsing devices_emails:', error);
    }
    if (emailsArray.length >= 2 && !emailsArray.includes(data.email)) {
      return toast({
        title: t('auth.error.title'),
        description: t('auth.error.devicesLimitExceeded'),
        variant: 'destructive',
      });
    }

    setIsLoading(true);
    if (data.invitationCode) {
      setCookie('ref', data.invitationCode);
    }

    const signInResult = await signIn('email', {
      email: data.email.toLowerCase(),
      redirect: false,
    }).catch(error => {
      console.error('Error during sign in:', error);
    });

    setIsLoading(false);

    if (!signInResult?.ok) {
      return toast({
        title: t('auth.error.title'),
        description: t('auth.error.description'),
        variant: 'destructive',
      });
    }
    const domain = data.email.split('@')[1]?.toLowerCase();
    const userAccount = data.email.split('@')[0];
    if (
      signInResult?.error &&
      domain === 'gmail.com' &&
      (userAccount.includes('+') || userAccount.includes('.'))
    ) {
      return toast({
        title: t('auth.error.title'),
        description: t('toast:error.emailDomainNotAllowedForGmail'),
        variant: 'destructive',
      });
    }

    if (signInResult?.error && !isEmailAllowed(data.email)) {
      return toast({
        title: t('auth.error.title'),
        description: t('toast:error.emailDomainNotAllowed'),
        variant: 'destructive',
      });
    }

    // Track user login success with email method
    try {
      localStorage.setItem(
        'pending_login_track',
        JSON.stringify({
          method: 'email',
          email: data.email.toLowerCase(),
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error('Error tracking login:', error);
    }

    let redirectUrl = window.location.href;
    if (redirectUrl?.match(/(login|register)$/)) {
      redirectUrl = '/';
    }
    window.localStorage.setItem('redirect_url', redirectUrl);
    return toast({
      title: t('auth.success.title'),
      description: t('auth.success.description'),
    });
  }

  const login = () => {
    setIsGoogleLoading(true);

    if (invitationCode) {
      setCookie('ref', invitationCode);
    }

    let popup: null | Window = null;

    signIn('google', { redirect: false, preventRedirect: true }).then(res => {
      if (isMobile && res?.url) {
        let redirectUrl = window.location.href;
        if (redirectUrl?.match(/(login|register)$/)) {
          redirectUrl = '/';
        }
        localStorage.setItem('redirect_url', redirectUrl);

        // Track Google login attempt
        try {
          localStorage.setItem(
            'pending_login_track',
            JSON.stringify({
              method: 'google',
              timestamp: new Date().toISOString(),
            }),
          );
        } catch (error) {
          console.error('Error tracking Google login:', error);
        }

        window.location.href = res.url;
        return;
      }
      popup = window.open('', 'Google Login', 'width=500,height=600');
      if (res?.url && popup) {
        // Track Google login attempt
        try {
          localStorage.setItem(
            'pending_login_track',
            JSON.stringify({
              method: 'google',
              timestamp: new Date().toISOString(),
            }),
          );
        } catch (error) {
          console.error('Error tracking Google login:', error);
        }

        popup.location.href = res.url;
      }
    });
  };

  React.useEffect(() => {
    const refCode = document.cookie
      .split('; ')
      .find(row => row.startsWith('ref='))
      ?.split('=')[1];
    if (refCode) {
      setValue('invitationCode', refCode);
    }
  }, []);

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='grid gap-2'>
          <div className='grid gap-1'>
            <Label className='sr-only' htmlFor='email'>
              {t('auth.email')}
            </Label>
            <Input
              id='email'
              placeholder={t('auth.email_placeholder')}
              type='email'
              autoCapitalize='none'
              autoComplete='email'
              autoCorrect='off'
              disabled={isLoading || isGoogleLoading}
              {...register('email')}
            />
            {errors?.email && (
              <p className='px-1 text-xs text-red-600'>
                {t(errors.email.message as string)}
              </p>
            )}
          </div>
          <div className='grid gap-1'>
            <Label className='sr-only' htmlFor='invitationCode'>
              {t('auth.invitation_code')}
            </Label>
            <Input
              id='invitationCode'
              placeholder={t('auth.invitation_code_placeholder')}
              type='text'
              disabled={isLoading || isGoogleLoading}
              {...register('invitationCode')}
            />
          </div>
          <button className={cn(buttonVariants())} disabled={isLoading}>
            {isLoading && (
              <Icons.Spinner className='mr-2 w-4 h-4 animate-spin' />
            )}
            {t('auth.signin_email')}
          </button>
        </div>
      </form>
      <div className='relative'>
        <div className='flex absolute inset-0 items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='flex relative justify-center text-xs uppercase'>
          <span className='px-2 bg-background text-muted-foreground'>
            {t('auth.signin_others')}
          </span>
        </div>
      </div>
      <button
        type='button'
        className={cn(buttonVariants({ variant: 'outline' }))}
        onClick={login}
        disabled={isLoading || isGoogleLoading}>
        {isGoogleLoading ? (
          <Icons.Spinner className='mr-2 w-4 h-4 animate-spin' />
        ) : (
          <img src='/images/google.png' className='mr-2 w-4 h-4' alt='Google' />
        )}{' '}
        {t('auth.google')}
      </button>
    </div>
  );
}
