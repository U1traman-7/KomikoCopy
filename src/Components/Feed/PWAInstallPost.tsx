import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { IoClose, IoDownload, IoApps } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPost: React.FC = () => {
  const { t } = useTranslation('pwa');
  const [shouldShow, setShouldShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const checkDevice = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroidDevice = /Android/.test(navigator.userAgent);
      const isStandaloneMode = 
        (window.navigator as any).standalone || 
        window.matchMedia('(display-mode: standalone)').matches;
      
      setIsIOS(isIOSDevice);
      setIsAndroid(isAndroidDevice);
      setIsStandalone(isStandaloneMode);

      // Check if user has dismissed this prompt before
      const hasClickedBefore = localStorage.getItem('pwa-install-post-clicked');
      const hasDismissedBefore = localStorage.getItem('pwa-install-post-dismissed');
      
      // Only show on mobile devices, not in standalone mode, and not previously dismissed
      const shouldShowPrompt = 
        (isIOSDevice || isAndroidDevice) && 
        !isStandaloneMode && 
        !hasClickedBefore && 
        !hasDismissedBefore;
      
      setShouldShow(shouldShowPrompt);
    };

    checkDevice();

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isAndroid && deferredPrompt) {
      // Android PWA install
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('pwa-install-post-clicked', 'true');
          setShouldShow(false);
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
      setDeferredPrompt(null);
    } else {
      // Show modal with instructions for both Android and iOS
      onOpen();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-post-dismissed', 'true');
    setShouldShow(false);
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='relative'>
        <Card className='bg-card shadow-lg border border-border overflow-hidden mb-2'>
          {/* Header */}
          <div className='flex items-center justify-between p-3 md:p-4 border-b border-border'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div className='w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md'>
                <IoApps className='w-4 h-4 md:w-6 md:h-6 text-white' />
              </div>
              <div>
                <h3 className='font-semibold text-sm md:text-lg text-foreground'>
                  {t('install.title')}
                </h3>
                <p className='text-xs md:text-sm text-muted-foreground'>komiko.app</p>
              </div>
            </div>
            <Button
              isIconOnly
              size='sm'
              variant='light'
              className='text-muted-foreground hover:text-muted-foreground min-w-8 w-8 h-8'
              onClick={handleDismiss}>
              <IoClose className='w-4 h-4' />
            </Button>
          </div>

          <CardBody className='p-3 md:p-4'>
            <p className='text-xs md:text-sm text-muted-foreground mb-3 md:mb-4'>
              {t('install.description')}
            </p>

            {/* Install Button */}
            <div className='mb-2'>
              <Button
                onClick={handleInstallClick}
                color='primary'
                className='w-full h-10 md:h-12 text-sm md:text-base font-medium'
                startContent={
                  isAndroid ? (
                    <IoDownload className='w-4 h-4 md:w-5 md:h-5' />
                  ) : undefined
                }>
                {isAndroid ? t('install.install_button') : t('install.title')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Install Instructions Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size='lg'
        placement='center'
        backdrop='blur'
        classNames={{
          base: 'mx-4',
          body: 'py-6',
          header: 'border-b border-border',
          footer: 'border-t border-border',
        }}>
        <ModalContent>
          <ModalHeader className='flex flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <IoApps className='w-6 h-6 text-blue-500' />
              <span>{t('install.title')}</span>
            </div>
          </ModalHeader>

          <ModalBody>
            <div className='space-y-4'>
              {isIOS ? (
                // iOS Instructions
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <p className='text-sm text-blue-700 mb-4'>
                    {t('install.instruction')}
                  </p>

                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 p-3 bg-card rounded-lg'>
                      <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-bold text-sm'>1</span>
                      </div>
                      <div className='flex items-center gap-2 flex-1'>
                        <span className='text-sm text-foreground'>
                          {t('install.step1')}
                        </span>
                        <div className='ml-auto'>
                          <img
                            src='/images/share_safari_ios.jpg'
                            alt='Share button'
                            className='w-8 h-8 rounded'
                          />
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-card rounded-lg'>
                      <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-bold text-sm'>2</span>
                      </div>
                      <div className='flex items-center gap-2 flex-1'>
                        <span className='text-sm text-foreground'>
                          {t('install.step2')}
                        </span>
                        <div className='ml-auto'>
                          <img
                            src='/images/add_home_ios.jpg'
                            alt='Add to home screen'
                            className='w-8 h-8 rounded'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Android Instructions
                <div className='bg-green-50 p-4 rounded-lg'>
                  <p className='text-sm text-green-700 mb-4'>
                    {t('install.android_instruction')}
                  </p>

                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 p-3 bg-card rounded-lg'>
                      <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-bold text-sm'>1</span>
                      </div>
                      <div className='flex items-center gap-2 flex-1'>
                        <span className='text-sm text-foreground'>
                          {t('install.android_step1')}
                        </span>
                        <div className='ml-auto'>
                          <img
                            src='/images/share_android.jpg'
                            alt='Chrome menu'
                            className='w-8 h-8 rounded'
                          />
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-card rounded-lg'>
                      <div className='w-8 h-8 bg-green-500 rounded-full flex items-center justify-center'>
                        <span className='text-white font-bold text-sm'>2</span>
                      </div>
                      <div className='flex items-center gap-2 flex-1'>
                        <span className='text-sm text-foreground'>
                          {t('install.android_step2')}
                        </span>
                        <div className='ml-auto'>
                          <img
                            src='/images/add_home_android.jpg'
                            alt='Add to home screen'
                            className='w-8 h-8 rounded'
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className='text-center'>
                <p className='text-xs text-muted-foreground'>
                  {isIOS ? t('install.ios_note') : t('install.android_note')}
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button color='primary' onPress={onClose} className='w-full'>
              {t('install.got_it')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PWAInstallPost; 