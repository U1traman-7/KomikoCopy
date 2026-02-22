import {
  Drawer,
  DrawerContent,
  DrawerBody,
  DrawerFooter,
  Button,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { TbArrowRight, TbPencil, TbX } from 'react-icons/tb';
import { useTranslation } from 'react-i18next';

interface PublishDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PublishDrawer({
  isOpen,
  onOpenChange,
}: PublishDrawerProps) {
  const router = useRouter();
  const { t } = useTranslation(['publish', 'common']);

  const actions = [
    {
      title: t('drawer.action.newCharacter'),
      path: '/oc-maker',
      highlight: false,
      image: 'https://d31cygw67xifd4.cloudfront.net/covers/tools/oc-maker.webp',
      description: t(
        'common:ai_tools.comic_generation.create_character.content',
      ),
      theme: 'pink',
    },
    {
      title: t('drawer.action.generateImage'),
      path: '/ai-anime-generator',
      highlight: false,
      image: 'https://d31cygw67xifd4.cloudfront.net/covers/tools/anime.webp',
      description: t('common:ai_tools.illustration.ai_anime_generator.content'),
      theme: 'blue',
    },
    {
      title: t('drawer.action.generateVideo'),
      path: '/image-animation-generator',
      highlight: false,
      image:
        'https://d31cygw67xifd4.cloudfront.net/covers/tools/image-to-video.webp',
      description: t('common:ai_tools.animation.animation_generator.content'),
      theme: 'purple',
    },
    {
      title: t('drawer.action.exploreTemplates'),
      path: '/templates',
      highlight: false,
      image:
        'https://d31cygw67xifd4.cloudfront.net/covers/tools/playground.webp',
      description: t('drawer.description.exploreTemplates'),
      theme: 'teal',
    },
    {
      title: t('drawer.action.newPost'),
      path: '/publish',
      highlight: true,
      image: 'https://d31cygw67xifd4.cloudfront.net/covers/tools/canvas.webp',
      description: t('drawer.description.newPost'),
      theme: 'gradient',
    },
  ];

  const getThemeClasses = (theme: string, isHighlight: boolean) => {
    if (isHighlight) {
      return {
        container:
          'bg-gradient-to-r from-violet-500 to-purple-500 shadow-md hover:shadow-xl transform hover:scale-[1.01]',
        title: 'text-primary-foreground',
        description: 'text-purple-100',
      };
    }

    const themes = {
      pink: {
        container:
          'bg-gradient-to-r from-pink-50 to-white hover:from-pink-100 hover:to-pink-50 border border-pink-100/50',
        title: 'text-pink-700',
        description: 'text-pink-600/70',
      },
      blue: {
        container:
          'bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 border border-blue-100/50',
        title: 'text-blue-700',
        description: 'text-blue-600/70',
      },
      purple: {
        container:
          'bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 hover:to-purple-50 border border-purple-100/50',
        title: 'text-purple-700',
        description: 'text-purple-600/70',
      },
      teal: {
        container:
          'bg-gradient-to-r from-teal-50 to-white hover:from-teal-100 hover:to-teal-50 border border-teal-100/50',
        title: 'text-teal-700',
        description: 'text-teal-600/70',
      },
    };

    return themes[theme as keyof typeof themes] || themes.pink;
  };

  return (
    <Drawer
      size='5xl'
      hideCloseButton
      isOpen={isOpen}
      placement='bottom'
      onOpenChange={onOpenChange}
      backdrop='blur'
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              type: 'spring',
              stiffness: 420,
              damping: 32,
              mass: 0.6,
            },
          },
          exit: {
            y: 24,
            opacity: 0,
            transition: { duration: 0.22, ease: 'easeInOut' },
          },
        },
      }}>
      <DrawerContent>
        {onClose => (
          <>
            <DrawerBody className='pt-4 pb-2'>
              <div className='flex flex-col gap-2.5'>
                {actions.map(action => {
                  const themeClasses = getThemeClasses(
                    action.theme,
                    action.highlight,
                  );

                  return (
                    <div
                      key={action.path}
                      className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 h-20 ${
                        themeClasses.container
                      }`}
                      onClick={() => {
                        router.push(action.path);
                        onClose();
                      }}>
                      {action.image && (
                        <>
                          <div className='absolute right-0 top-0 bottom-0 w-40 pointer-events-none'>
                            <img
                              src={action.image}
                              alt=''
                              className='absolute inset-0 w-full h-full object-cover object-center'
                              loading='lazy'
                              style={{
                                opacity: action.highlight ? 0.12 : 0.18,
                                maskImage:
                                  'linear-gradient(to left, black 60%, transparent 100%)',
                                WebkitMaskImage:
                                  'linear-gradient(to left, black 60%, transparent 100%)',
                              }}
                            />
                          </div>
                        </>
                      )}

                      {/* Content layer */}
                      <div className='relative z-10 flex justify-between items-center h-full px-5 py-3'>
                        <div className='flex-1 pr-12'>
                          <div className='flex items-center gap-2'>
                            <div
                              className={`font-bold text-lg ${themeClasses.title}`}>
                              {action.title}
                            </div>
                            {action.highlight && (
                              <TbPencil className='text-white/90' size={16} />
                            )}
                          </div>
                          <div
                            className={`text-xs ${themeClasses.description}`}>
                            {action.description}
                          </div>
                        </div>

                        {/* Simplified arrow - same style for all */}
                        <div
                          className={
                            action.highlight
                              ? 'text-white/90'
                              : 'text-muted-foreground hover:text-muted-foreground'
                          }>
                          <TbArrowRight
                            size={20}
                            strokeWidth={2}
                            className='transition-transform hover:translate-x-1'
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DrawerBody>
            <DrawerFooter className='justify-center pb-6'>
              <Button
                isIconOnly
                radius='full'
                variant='light'
                onPress={onClose}
                className='bg-muted focus:bg-muted/80'>
                <TbX size={24} className='text-muted-foreground' />
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
