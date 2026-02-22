'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardBody, Button, Chip } from '@nextui-org/react'
import { IoClose, IoDownload, IoPhonePortrait } from 'react-icons/io5'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const { t } = useTranslation('pwa')
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroidDevice = /Android/.test(navigator.userAgent)
    const isStandaloneMode = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    setIsStandalone(isStandaloneMode)

    // Android PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (isAndroidDevice && !isStandaloneMode) {
        setShowPrompt(true)
      }
    }

    // iOS manual install prompt
    if (isIOSDevice && !isStandaloneMode) {
      setShowPrompt(true)
      // Auto-hide after 15 seconds for iOS
      setTimeout(() => setShowPrompt(false), 15000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt && isAndroid) {
      // Android PWA install
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if already dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setShowPrompt(false)
    }
  }, [])

  if (!showPrompt || isStandalone || (!isIOS && !isAndroid)) {
    return null
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 shadow-lg">
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <IoPhonePortrait className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-sm">
                        {t('install.title')}
                      </h3>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        className="text-xs"
                      >
                        PWA
                      </Chip>
                    </div>
                    
                    <p className="text-foreground-600 text-xs mb-3 leading-relaxed">
                      {t('install.description')}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {isAndroid && deferredPrompt && (
                        <Button
                          onClick={handleInstallClick}
                          color="primary"
                          variant="solid"
                          size="sm"
                          startContent={<IoDownload className="w-4 h-4" />}
                          className="font-medium"
                        >
                          {t('install.install_button')}
                        </Button>
                      )}
                      
                      <Button
                        onClick={handleDismiss}
                        variant="light"
                        size="sm"
                        className="text-foreground-500 min-w-unit-8"
                      >
                        {isIOS ? t('install.dismiss', '稍后') : t('install.dismiss', 'Later')}
                      </Button>
                    </div>
                    
                    {isIOS && (
                      <div className="mt-3 p-2 bg-primary-50 rounded-lg border border-primary-100">
                        <p className="text-xs text-primary-700 leading-relaxed">
                          💡 {t('install.instruction')}
                        </p>
                      </div>
                    )}
                    
                    {isAndroid && (
                      <div className="mt-3">
                        <p className="text-xs text-foreground-500">
                          {t('install.android_instruction')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleDismiss}
                    variant="light"
                    size="sm"
                    isIconOnly
                    className="text-foreground-400 hover:text-foreground-600 min-w-unit-6 w-6 h-6"
                  >
                    <IoClose className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 