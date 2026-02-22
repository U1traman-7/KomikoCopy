import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, Image, Input, Button } from '@nextui-org/react';
import { FaCheck, FaMagic } from 'react-icons/fa';
import Masonry from 'react-masonry-css';
import { motion } from 'framer-motion';

type SelectionType = 'character' | 'comic' | 'anime' | 'animation';

export const InteractiveMenu = ({ className = '' }) => {
  const { t } = useTranslation('landing');
  const [selectedType, setSelectedType] = useState<SelectionType | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  interface ListItem {
    id: number;
    media?: {
      alt: string;
      image: string;
      placeholder?: string;
    }[];
    type?: string;
  }

  const [list, setList] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Set default character selection on mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && selectedType === null) {
        setSelectedType('character');
      }
    };

    // Run once on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedType]);

  // Update placeholder based on selected type and screen width
  useEffect(() => {
    const updatePlaceholder = () => {
      const isMobile = window.innerWidth < 640;
      const key = !selectedType
        ? 'input_placeholder'
        : `${selectedType}_placeholder`;

      setPlaceholder(t(`interactive_menu.${key}${isMobile ? '_short' : ''}`));
    };

    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);
    return () => window.removeEventListener('resize', updatePlaceholder);
  }, [t, selectedType]);

  // Load content
  useEffect(() => {
    setLoading(true);

    const characterImages = [
      {
        id: 1,
        alt: 'a girl character',
        image: '/images/examples/oc-maker/girl.webp',
        type: 'character',
      },
      {
        id: 2,
        alt: 'a man character',
        image: '/images/examples/oc-maker/man2.webp',
        type: 'character',
      },
      {
        id: 3,
        alt: 'a girl character',
        image: '/images/examples/oc-maker/girl3.webp',
        type: 'character',
      },
      {
        id: 4,
        alt: 'a girl character',
        image: '/images/examples/oc-maker/girl7.webp',
        type: 'character',
      },
      {
        id: 5,
        alt: 'a boy character',
        image: '/images/examples/oc-maker/boy3.webp',
        type: 'character',
      },
      {
        id: 6,
        alt: 'a girl character',
        image: '/images/examples/oc-maker/girl6.webp',
        type: 'character',
      },
      {
        id: 7,
        alt: 'a girl character',
        image: '/images/examples/oc-maker/girl4.webp',
        type: 'character',
      },
      {
        id: 8,
        alt: 'a boy character',
        image: '/images/examples/oc-maker/boy2.webp',
        type: 'character',
      },
    ];

    const comicImages = [
      {
        id: 9,
        alt: 'a comic that about shadow',
        image: '/images/examples/comic-generator/shadow.webp',
        type: 'comic',
      },
      {
        id: 10,
        alt: 'a comic that about friendship',
        image: '/images/examples/comic-generator/friends.webp',
        type: 'comic',
      },
      {
        id: 11,
        alt: 'a comic that about victorian in modern times',
        image:
          '/images/examples/comic-generator/victorian_in_modern_times.webp',
        type: 'comic',
      },
      {
        id: 12,
        alt: 'a comic that about reflection',
        image: '/images/examples/comic-generator/reflections.webp',
        type: 'character',
      },
      {
        id: 13,
        alt: 'a comic that about generate comic',
        image: '/images/generate_comic.webp',
        type: 'comic',
      },
      {
        id: 14,
        alt: 'a comic that about guardians',
        image: '/images/examples/comic-generator/guardians.webp',
        type: 'character',
      },
      {
        id: 15,
        alt: 'a comic that about a panda',
        image: '/images/examples/comic-generator/panda.webp',
        type: 'character',
      },
      {
        id: 16,
        alt: 'a comic that about quantum echoes',
        image: '/images/examples/comic-generator/quantum_echoes.webp',
        type: 'character',
      },
    ];

    const animationImages = [
      {
        id: 17,
        alt: 'a animation that about two girls',
        image: '/images/examples/ai-anime-generator/two-girl.webp',
        type: 'animation',
      },
      {
        id: 18,
        alt: 'a animation that about a girl',
        image: '/images/examples/ai-anime-generator/girl.webp',
        type: 'animation',
      },
      {
        id: 19,
        alt: 'a animation that about a boy',
        image: '/images/examples/ai-anime-generator/boy1.webp',
        type: 'animation',
      },
      {
        id: 20,
        alt: 'a animation that about a girl',
        image: '/images/examples/ai-anime-generator/girl2.webp',
        type: 'animation',
      },
      {
        id: 21,
        alt: 'a animation that shows a girl with a panda styled head',
        image: '/images/examples/ai-anime-generator/panda.webp',
        type: 'animation',
      },
      {
        id: 22,
        alt: 'a animation that about a girl',
        image: '/images/examples/ai-anime-generator/girl4.webp',
        type: 'animation',
      },
      {
        id: 23,
        alt: 'a animation that about a girl',
        image: '/images/examples/ai-anime-generator/girl3.webp',
        type: 'animation',
      },
      {
        id: 24,
        alt: 'a animation that about fate',
        image: '/images/examples/ai-anime-generator/fate.webp',
        type: 'animation',
      },
    ];

    const animationVideos = [
      {
        id: 25,
        alt: 'A girl playing guitar',
        image: '/images/examples/image-animation-generator/guitar.webm',
        placeholder: '/images/examples/image-animation-generator/guitar.webp',
        type: 'animation',
      },
      {
        id: 26,
        alt: 'A fairy in a flower',
        image: '/images/pages/vidu/flower.webm',
        placeholder: '/images/pages/vidu/flower.webp',
        type: 'animation',
      },
      {
        id: 27,
        alt: 'A pancake',
        image: '/images/examples/image-animation-generator/pancake.webm',
        placeholder: '/images/examples/image-animation-generator/pancake.webp',
        type: 'animation',
      },
      {
        id: 28,
        alt: 'A cat transforming into a tiger',
        image: '/images/pages/vidu/cat.webm',
        placeholder: '/images/pages/vidu/cat.webp',
        type: 'animation',
      },
      {
        id: 29,
        alt: 'A man drawing his sword',
        image: '/images/pages/vidu/man_sword.webm',
        placeholder: '/images/pages/vidu/man_sword.webp',
        type: 'animation',
      },
      {
        id: 30,
        alt: 'A girl with ice cream',
        image: '/images/examples/image-animation-generator/girl.webm',
        placeholder: '/images/examples/image-animation-generator/girl.webp',
        type: 'animation',
      },
      {
        id: 31,
        alt: 'A graceful animation',
        image: '/images/pages/vidu/man.webm',
        placeholder: '/images/pages/vidu/man.webp',
        type: 'animation',
      },
      {
        id: 32,
        alt: 'A girl with a cute sign',
        image: '/images/pages/frame-pack-ai-video-generator/girl.webm',
        placeholder: '/images/pages/frame-pack-ai-video-generator/girl.webp',
        type: 'animation',
      },
    ];

    // Filter and format data based on selection
    let sourceData;
    switch (selectedType) {
      case 'anime':
        sourceData = animationImages;
        break;
      case 'comic':
        sourceData = comicImages;
        break;
      case 'character':
        sourceData = characterImages;
        break;
      case 'animation':
        sourceData = animationVideos;
        break;
      default:
        // 如果没有选择类型，随机显示8张图片
        const allImages = [
          ...characterImages,
          ...comicImages,
          ...animationImages,
          ...animationVideos,
        ];
        sourceData = allImages
          .sort(() => 0.5 - Math.random()) // 随机排序
          .slice(0, 8); // 只取前8张
        break;
    }

    setList(
      sourceData.map(item => ({
        id: item.id,
        media: [
          {
            alt: item.alt,
            image: item.image,
            placeholder: item.placeholder,
          },
        ],
        type: item.type,
      })),
    );

    setLoading(false);
  }, [selectedType]);

  // Handle create button click
  const handleCreateContent = useCallback(() => {
    if (!selectedType) {
      return;
    }

    const inputValue = inputRef.current?.value?.trim();
    if (!inputValue) {
      return;
    }

    const routeMap = {
      character: '/oc-maker',
      comic: '/ai-comic-generator',
      anime: '/ai-anime-generator',
      animation: '/image-animation-generator',
    };

    router.push(
      `${routeMap[selectedType]}?prompt=${encodeURIComponent(inputValue)}`,
    );
  }, [selectedType, router]);

  const TypeSelectionCards = useMemo(
    () => (
      <div className='absolute -top-32 md:-top-44 left-0 sm:left-6 z-20 flex space-x-[-15px] sm:space-x-[-30px] px-2 sm:px-0 w-full sm:w-auto justify-center sm:justify-start'>
        {/* Character Card */}
        <div
          className={`transform -rotate-12 sm:-rotate-15 hover:rotate-0 hover:scale-110
        ${
          selectedType === 'character'
            ? '-translate-y-3 z-30'
            : 'translate-y-1 z-10'
        }
        hover:-translate-y-1 hover:z-40
        transition-all duration-300 ease-in-out overflow-visible
      `}>
          <Card
            isPressable
            radius='lg'
            className={`w-[90px] sm:w-[120px] h-[110px] sm:h-[140px] overflow-hidden p-0
            ${
              selectedType === 'character'
                ? 'outline outline-[3px] outline-primary shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                : 'shadow-md hover:shadow-lg'
            } border-0
          `}
            onClick={() => setSelectedType('character')}>
            <div className='absolute top-0 left-0 right-0 z-20 p-1.5 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent'>
              <h4 className='text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center'>
                {t('interactive_menu.character_card.title')}
              </h4>
            </div>
            <div className='absolute inset-0 z-10' />
            <Image
              removeWrapper
              alt={t('interactive_menu.character_card.alt')}
              className='object-cover z-0 w-full h-full'
              src='/images/examples/oc-maker/boy2.webp'
            />
            {selectedType === 'character' && (
              <div className='flex absolute top-1 right-1 z-30 justify-center items-center w-3 h-3 rounded-full bg-primary'>
                <FaCheck className='h-1.5 w-1.5 text-white' />
              </div>
            )}
          </Card>
        </div>

        {/* Anime Card */}
        <div
          className={`transform -rotate-6 sm:-rotate-8 hover:rotate-0 hover:scale-110
        ${
          selectedType === 'anime'
            ? '-translate-y-3 z-30'
            : 'translate-y-1 z-10'
        }
        hover:-translate-y-1 hover:z-40
        transition-all duration-300 ease-in-out overflow-visible
      `}>
          <Card
            isPressable
            radius='lg'
            className={`w-[90px] sm:w-[120px] h-[110px] sm:h-[140px] overflow-hidden p-0
            ${
              selectedType === 'anime'
                ? 'outline outline-[3px] outline-primary shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                : 'shadow-md hover:shadow-lg'
            } border-0
          `}
            onClick={() => setSelectedType('anime')}>
            <div className='absolute top-0 left-0 right-0 z-20 p-1.5 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent'>
              <h4 className='text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center'>
                {t('interactive_menu.anime_card.title')}
              </h4>
            </div>
            <div className='absolute inset-0 z-10' />
            <Image
              removeWrapper
              alt='a anime that about fate'
              className='object-cover z-0 w-full h-full'
              src='/images/examples/ai-anime-generator/fate.webp'
            />
            {selectedType === 'anime' && (
              <div className='flex absolute top-1 right-1 z-30 justify-center items-center w-3 h-3 rounded-full bg-primary'>
                <FaCheck className='h-1.5 w-1.5 text-white' />
              </div>
            )}
          </Card>
        </div>

        {/* Comic Card */}
        <div
          className={`transform rotate-6 sm:rotate-8 hover:rotate-0 hover:scale-110
        ${
          selectedType === 'comic'
            ? '-translate-y-3 z-30'
            : 'translate-y-1 z-10'
        }
        hover:-translate-y-1 hover:z-40
        transition-all duration-300 ease-in-out overflow-visible
      `}>
          <Card
            isPressable
            radius='lg'
            className={`w-[90px] sm:w-[120px] h-[110px] sm:h-[140px] overflow-hidden p-0
            ${
              selectedType === 'comic'
                ? 'outline outline-[3px] outline-primary shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                : 'shadow-md hover:shadow-lg'
            } border-0
          `}
            onClick={() => setSelectedType('comic')}>
            <div className='absolute top-0 left-0 right-0 z-20 p-1.5 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent'>
              <h4 className='text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center'>
                {t('interactive_menu.comic_card.title')}
              </h4>
            </div>
            <div className='absolute inset-0 z-10' />
            <Image
              removeWrapper
              alt={t('interactive_menu.comic_card.alt')}
              className='object-cover z-0 w-full h-full'
              src='/images/comic1.webp'
            />
            {selectedType === 'comic' && (
              <div className='flex absolute top-1 right-1 z-30 justify-center items-center w-3 h-3 rounded-full bg-primary'>
                <FaCheck className='h-1.5 w-1.5 text-white' />
              </div>
            )}
          </Card>
        </div>

        {/* Animation Card */}
        <div
          className={`transform rotate-12 sm:rotate-15 hover:rotate-0 hover:scale-110
        ${
          selectedType === 'animation'
            ? '-translate-y-3 z-30'
            : 'translate-y-3 z-10'
        }
        hover:-translate-y-1 hover:z-40
        transition-all duration-300 ease-in-out overflow-visible
      `}>
          <Card
            isPressable
            radius='lg'
            className={`w-[90px] sm:w-[120px] h-[110px] sm:h-[140px] overflow-hidden p-0
            ${
              selectedType === 'animation'
                ? 'outline outline-[3px] outline-primary shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                : 'shadow-md hover:shadow-lg'
            } border-0
          `}
            onClick={() => setSelectedType('animation')}>
            <div className='absolute top-0 left-0 right-0 z-20 p-1.5 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent'>
              <h4 className='text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center'>
                {t('interactive_menu.animation_card.title')}
              </h4>
            </div>
            <div className='absolute inset-0 z-10' />
            <video
              autoPlay
              loop
              muted
              playsInline
              preload='auto'
              className='object-cover z-0 w-full h-full'
              src='/images/pages/frame-pack-ai-video-generator/girl.webm'
            />
            {selectedType === 'animation' && (
              <div className='flex absolute top-1 right-1 z-30 justify-center items-center w-3 h-3 rounded-full bg-primary'>
                <FaCheck className='h-1.5 w-1.5 text-white' />
              </div>
            )}
          </Card>
        </div>

        <div className='absolute top-8 left-[440px] transform rotate-[-2deg] hidden lg:block'>
          <div className='relative'>
            <div className='relative w-[200px] h-[60px] overflow-visible'>
              <motion.svg
                viewBox='0 0 408 86'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='overflow-visible absolute top-0 left-0 w-full h-full'
                style={{ overflow: 'visible' }}>
                <motion.path
                  d='M405 11.0871C382.058 29.4611 363.937 37.239 334.504 35.933C307.924 34.7537 279.012 22.1513 254.291 12.9679C223.684 1.59801 163.605 -7.28821 145.82 28.9049C132.011 57.0079 152.709 90.6134 185.282 81.4674C197.84 77.9414 204.329 61.2047 198.767 49.5933C192.759 37.0522 174.799 31.0063 162.378 28.113C129.021 20.3425 106.797 51.5383 76.613 57.0174C48.4126 62.1362 27.4713 49.5247 6.11682 32.4685C4.28767 31.0075 5.22449 40.728 5.22449 43.1592C5.22449 52.0716 3.43968 48.116 3.43968 41.3774C3.43968 37.0435 1.15299 27.829 7.00919 30.2907C11.2342 32.0667 20.1151 32.4685 24.8563 32.4685'
                  stroke='#563afa'
                  strokeWidth='5'
                  strokeLinecap='round'
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                    transition: {
                      pathLength: { duration: 2.5, ease: [0.76, 0, 0.24, 1] },
                      opacity: { duration: 0.8 },
                    },
                  }}
                  whileInView={{
                    x: [0, -3, 0],
                    transition: {
                      x: {
                        repeat: Infinity,
                        repeatType: 'reverse',
                        duration: 3,
                        ease: 'easeInOut',
                      },
                    },
                  }}
                />

                <defs>
                  <path
                    id='textPath'
                    d='M24.8563 22.4685C20.1151 22.4685 11.2342 22.0667 7.00919 20.2907C1.15299 17.829 3.43968 27.0435 3.43968 31.3774C3.43968 38.116 5.22449 42.0716 5.22449 33.1592C5.22449 30.728 4.28767 21.0075 6.11682 22.4685C27.4713 39.5247 48.4126 52.1362 76.613 47.0174C106.797 41.5383 129.021 10.3425 162.378 18.113C174.799 21.0063 192.759 27.0522 198.767 39.5933C204.329 51.2047 197.84 67.9414 185.282 71.4674C152.709 80.6134 132.011 47.0079 145.82 18.9049C163.605 -17.28821 223.684 -8.40199 254.291 2.9679C279.012 12.1513 307.924 24.7537 334.504 25.933C363.937 27.239 382.058 19.4611 405 1.0871'
                  />
                </defs>

                <motion.text
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: {
                      delay: 1.5,
                      duration: 0.8,
                      scale: {
                        type: 'spring',
                        stiffness: 200,
                        damping: 10,
                      },
                    },
                  }}
                  whileInView={{
                    x: [0, -2, 0],
                    transition: {
                      x: {
                        repeat: Infinity,
                        repeatType: 'reverse',
                        duration: 3.5,
                        ease: 'easeInOut',
                        delay: 0.2,
                      },
                    },
                  }}>
                  <textPath
                    href='#textPath'
                    startOffset='76%'
                    fill='#563afa'
                    fontSize='20'
                    fontWeight='bold'
                    dominantBaseline='central'
                    textAnchor='middle'>
                    <tspan
                      dy='-15'
                      stroke='white'
                      strokeWidth='1'
                      paintOrder='stroke'>
                      {t('interactive_menu.title')}
                    </tspan>
                  </textPath>
                </motion.text>
              </motion.svg>
            </div>
          </div>
        </div>
      </div>
    ),
    [selectedType, t],
  );

  // Content preview component
  const ContentPreview = useMemo(
    () => (
      <div className='relative mt-8'>
        {loading ? (
          <div className='flex justify-center items-center py-8'>
            <div className='w-12 h-12 rounded-full border-t-2 border-b-2 animate-spin border-primary'></div>
          </div>
        ) : (
          <>
            <style jsx global>{`
              .content-grid {
                perspective: 1000px;
                mask-image: linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 1) 0%,
                  rgba(0, 0, 0, 1) 50%,
                  rgba(0, 0, 0, 0.8) 60%,
                  rgba(0, 0, 0, 0.6) 70%,
                  rgba(0, 0, 0, 0.4) 80%,
                  rgba(0, 0, 0, 0.2) 90%,
                  rgba(0, 0, 0, 0) 100%
                );
                -webkit-mask-image: linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 1) 0%,
                  rgba(0, 0, 0, 1) 50%,
                  rgba(0, 0, 0, 0.8) 60%,
                  rgba(0, 0, 0, 0.6) 70%,
                  rgba(0, 0, 0, 0.4) 80%,
                  rgba(0, 0, 0, 0.2) 90%,
                  rgba(0, 0, 0, 0) 100%
                );
                mask-size: 100% 100%;
                -webkit-mask-size: 100% 100%;
                mask-position: center;
                -webkit-mask-position: center;
                mask-repeat: no-repeat;
                -webkit-mask-repeat: no-repeat;
              }
              .content-card {
                transform-style: preserve-3d;
                transition: all 0.5s ease-out;
                opacity: 1;
              }
              .content-card:nth-child(4n + 1) {
                transform: rotate(0.3deg);
              }
              .content-card:nth-child(4n + 2) {
                transform: rotate(-0.3deg);
              }
              .content-card:nth-child(4n + 3) {
                transform: rotate(0.3deg);
              }
              .content-card:nth-child(4n + 4) {
                transform: rotate(-0.3deg);
              }
              @media (hover: hover) {
                .content-card:hover {
                  transform: rotate(0deg) scale(1.02);
                  z-index: 10;
                }
              }
            `}</style>
            <Masonry
              breakpointCols={{ default: 4, '1200': 3, '800': 2, '500': 2 }}
              className='flex gap-4 w-full content-grid'>
              {list.map((item, index) => (
                <div
                  key={item.id}
                  className='mb-4 content-card group'
                  style={{
                    marginBottom: '16px',
                    willChange: 'transform, opacity',
                  }}>
                  <Card className='bg-card overflow-hidden rounded-xl shadow transition-all duration-300 border-border group-hover:shadow-xl'>
                    <div className='overflow-hidden p-0 bg-card rounded-xl'>
                      {item.media?.[0]?.image?.endsWith('.webm') ? (
                        <div className='overflow-hidden relative'>
                          <video
                            width='100%'
                            height='auto'
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload='auto'
                            poster={item.media[0].placeholder}
                            className='object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110'
                            src={item.media[0].image}
                          />
                          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0' />
                        </div>
                      ) : (
                        <div className='overflow-hidden relative'>
                          <Image
                            width='100%'
                            height='auto'
                            removeWrapper
                            src={
                              item.media?.[0]?.image || '/images/comic1.webp'
                            }
                            alt={item.media?.[0]?.alt || 'Image'}
                            className='object-cover w-full rounded-xl transition-transform duration-300 group-hover:scale-110'
                            style={{ height: 'auto' }}
                          />
                          <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent transition-opacity duration-300 to-black/30 group-hover:opacity-0' />
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </Masonry>

            <div className='flex relative z-20 justify-center mt-4'>
              <Link href='/' passHref>
                <Button
                  className='px-4 py-2 text-sm text-muted-foreground bg-transparent rounded-full border border-border transition-all duration-300 hover:bg-muted sm:px-6 sm:text-base'
                  variant='light'
                  size='md'>
                  {t('interactive_menu.see_more')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    ),
    [loading, list, t],
  );

  // Input styles
  const inputClassNames = {
    base: 'w-full max-w-full',
    mainWrapper: 'h-full',
    input: [
      'text-xs sm:text-sm md:text-base',
      'font-normal',
      'bg-transparent',
      'text-foreground/90',
      'placeholder:text-default-700/50 dark:placeholder:text-foreground/60',
      'placeholder:text-xs sm:placeholder:text-sm md:placeholder:text-base',
      'truncate',
    ],
    inputWrapper: [
      'h-9 sm:h-10 md:h-12 lg:h-14',
      'pl-3 sm:pl-4 md:pl-8',
      'pr-2',
      'py-0',
      'shadow-[0_4px_30px_rgba(168,85,247,0.25)]',
      'dark:shadow-[0_4px_30px_rgba(168,85,247,0.2)]',
      'bg-card/70 dark:bg-black/20',
      'backdrop-blur-xl',
      'backdrop-saturate-150',
      'group-data-[focused=true]:bg-card/80 dark:group-data-[focused=true]:bg-black/30',
      '!cursor-text',
      'rounded-full',
      'border-2 border-purple-300 dark:border-purple-600',
      'group-data-[focused=true]:border-primary dark:group-data-[focused=true]:border-primary',
      'transition-all duration-300',
      'relative',
      'hover:shadow-[0_8px_40px_rgba(168,85,247,0.35)]',
      'dark:hover:shadow-[0_8px_40px_rgba(168,85,247,0.25)]',
    ],
  };

  return (
    <div
      className={`container relative mx-auto mt-40 max-w-[100rem] ${className}`}>
      <div className='flex relative flex-col items-center p-2 md:p-10 rounded-3xl'>
        <div className='absolute inset-0 rounded-3xl backdrop-blur-md bg-card/90 dark:bg-black/90'></div>
        <div className='relative z-10 mx-auto w-full max-w-4xl'>
          <div className='relative'>
            <div className='flex relative flex-col gap-4'>
              <div className='relative z-30 w-full'>
                <Input
                  id='inspiration-input'
                  ref={inputRef}
                  type='text'
                  placeholder={placeholder}
                  classNames={inputClassNames}
                  endContent={
                    <>
                      {/* Mobile button */}
                      <Button
                        color='primary'
                        radius='full'
                        isIconOnly
                        className='flex absolute right-0 justify-center items-center p-0 w-9 h-9 shadow-md sm:hidden min-w-9 sm:w-10 sm:h-10 sm:min-w-10'
                        isDisabled={!selectedType}
                        onClick={handleCreateContent}>
                        <FaMagic size={16} />
                      </Button>

                      {/* Desktop button */}
                      <Button
                        color='primary'
                        radius='full'
                        className='hidden gap-2 items-center px-3 py-2 text-xs font-medium shadow-lg sm:flex sm:px-4 sm:text-sm md:px-6 md:py-4 md:text-base'
                        isDisabled={!selectedType}
                        onClick={handleCreateContent}>
                        <span className='flex gap-2 items-center p-1'>
                          <FaMagic size={16} />
                          {!selectedType
                            ? t('interactive_menu.button.choose_type')
                            : t(
                                `interactive_menu.button.create_${selectedType}`,
                              )}
                        </span>
                      </Button>
                    </>
                  }
                />
              </div>
              <div className='relative z-20 -mt-8 w-full'>
                {TypeSelectionCards}
                {ContentPreview}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
