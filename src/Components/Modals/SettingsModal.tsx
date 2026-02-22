import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Switch,
  Button,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { changeLocale } from '../../utilities';
import { languages } from '../LanguageToggle';
import { manageSubscriptionPortal } from '../../api/pricing';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { env } from '../../utilities/env';
import { useOpenModal } from '../../hooks/useOpenModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeleteAccount?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onRequestDeleteAccount,
}: SettingsModalProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const profile = useAtomValue(profileAtom);
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const { submit: openModal } = useOpenModal();

  // Check if user has active subscription
  const isSubscribed =
    profile?.plan && profile.plan !== 'Free' && profile.plan !== 'CPP';

  // Check NSFW status from cookie - re-check every time modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const nsfwStatus = document.cookie.includes('relax_content=true');
      setNsfwEnabled(nsfwStatus);
    }
  }, [isOpen]);

  // Get current language
  useEffect(() => {
    if (router.locale) {
      setCurrentLanguage(router.locale);
    } else {
      const lang = localStorage.getItem('lang') || 'en';
      setCurrentLanguage(lang);
    }
  }, [router.locale]);

  // Handle NSFW toggle
  const handleNsfwToggle = (enabled: boolean) => {
    if (enabled) {
      // Show NSFWModal for confirmation
      openModal('nsfw', {
        onConfirm: () => {
          setNsfwEnabled(true);
          // Reload is necessary because NSFW setting affects content filtering
          // across the entire application, including feed data fetching
          window.location.reload();
        },
      });
    } else {
      // Disable NSFW
      document.cookie =
        'relax_content=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setNsfwEnabled(false);
      // Reload is necessary because NSFW setting affects content filtering
      // across the entire application, including feed data fetching
      window.location.reload();
    }
  };

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    changeLocale(langCode);
    router.push(router.pathname, router.asPath, { locale: langCode });
    // Close modal after language change
    setTimeout(() => {
      onClose();
    }, 100);
  };

  // Handle subscription management
  const handleSubscriptionClick = async () => {
    if (isSubscribed) {
      // Go to subscription portal
      try {
        const res = await manageSubscriptionPortal();
        if (res?.code && res?.data?.url) {
          window.location.href = res.data.url;
        } else {
          toast.error(t('settings.subscription.manage'));
        }
      } catch (error) {
        console.error('Error managing subscription:', error);
        toast.error(t('settings.subscription.manage'));
      }
    } else {
      // Go to pricing page
      // const locale = router.locale || 'en';
      // const appUrl = env.NEXT_PUBLIC_APP_URL || 'https://komiko.app';
      // const pricingUrl = `${appUrl}/${locale}/pricing`;
      // window.location.href = pricingUrl;
      router.push('/pricing');
    }
  };

  const handleDeleteButtonClick = (closeModal: () => void) => {
    closeModal();
    onRequestDeleteAccount?.();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size='lg'
        placement='center'
        scrollBehavior='inside'>
        <ModalContent>
          {closeModal => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                <h2 className='text-2xl font-bold'>{t('settings.title')}</h2>
              </ModalHeader>
              <ModalBody className='pb-4'>
                {/* Privacy Settings */}
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-4'>
                    {t('settings.privacy')}
                  </h3>
                  <div className='flex items-start gap-4 mb-4'>
                    <Switch
                      isSelected={nsfwEnabled}
                      onValueChange={handleNsfwToggle}
                      classNames={{
                        base: 'flex-row-reverse gap-2',
                        wrapper:
                          'bg-muted-foreground/40 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-pink-500 data-[selected=true]:to-purple-500',
                      }}
                    />
                    <div className='flex-1'>
                      <p className='text-sm font-medium mb-1'>
                        {t('settings.nsfw.enable')}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {t('settings.nsfw.description')}
                      </p>
                    </div>
                  </div>
                  {/* Blocked Users Link */}
                  <Button
                    variant='flat'
                    className='w-full'
                    onPress={() => {
                      onClose();
                      router.push('/settings/blocked-users');
                    }}>
                    {t('settings.blockedUsers')}
                  </Button>
                </div>

                {/* Language Preference */}
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-4'>
                    {t('settings.language')}
                  </h3>
                  <div className='border border-border rounded-lg overflow-hidden'>
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 border-border ${
                          currentLanguage === lang.code
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-foreground'
                        }`}>
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subscription Management */}
                <div className='mb-6'>
                  <h3 className='text-lg font-semibold mb-4'>
                    {t('settings.subscription.title')}
                  </h3>
                  <div className='space-y-3'>
                    {isSubscribed && (
                      <p className='text-sm text-muted-foreground'>
                        {t('settings.subscription.currentPlan', {
                          plan: profile?.plan || 'Free',
                        })}
                      </p>
                    )}
                    <Button
                      color='primary'
                      variant='flat'
                      className='w-full'
                      onClick={handleSubscriptionClick}>
                      {isSubscribed
                        ? t('settings.subscription.manage')
                        : t('settings.subscription.upgrade')}
                    </Button>
                  </div>
                </div>

                {/* Komiko Logo */}
                <div className='flex justify-center mb-4'>
                  <Image
                    src='/images/logo_new.webp'
                    alt='Komiko Logo'
                    width={120}
                    height={60}
                    className='opacity-60 dark:brightness-200'
                  />
                </div>

                {/* Danger Zone */}
                <div className='mb-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50/70 dark:bg-red-900/20 p-4 max-w-md mx-auto text-center'>
                  <h3 className='text-lg font-semibold text-red-600 mb-2'>
                    {t('settings.danger.title')}
                  </h3>
                  <p className='text-sm text-red-500 mb-4'>
                    {t('settings.danger.description')}
                  </p>
                  <Button
                    color='danger'
                    variant='flat'
                    size='sm'
                    className='font-semibold px-4'
                    onClick={() => handleDeleteButtonClick(closeModal)}>
                    {t('settings.danger.delete')}
                  </Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
