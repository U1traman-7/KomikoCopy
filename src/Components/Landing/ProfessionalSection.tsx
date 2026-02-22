/* eslint disable */
import Link from 'next/link';
import { Button } from '@nextui-org/react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconPalette,
  IconPhoto,
  IconWand,
  IconZoomIn,
  IconVideo,
  IconBrush,
  IconMicrophone,
  IconLayersIntersect,
  IconUpload,
  IconColorSwatch,
  IconCheck,
  IconTarget,
  IconUser,
  IconFile,
  IconStack3,
  IconSparkles,
  IconHeart,
  IconPencil,
  IconPlayerPlay,
  IconWaveSawTool,
  IconShield,
  IconClock,
  IconBolt,
  IconRipple,
  IconDownload,
} from '@tabler/icons-react';

const ProfessionalArtistsBento = memo(
  ({ theme }: { theme: string | undefined }) => {
    const { t } = useTranslation('landing');
    const [activeTab, setActiveTab] = useState('line-art-colorization');

    const features = [
      {
        id: 'line_art_colorization',
        title: t('professional.line_art_colorization.title'),
        shortTitle: t('professional.line_art_colorization.short_title'),
        description: t('professional.line_art_colorization.description'),
        icon: <IconPalette className='h-5 w-5 md:h-6 md:w-6' />,
        imageUrl: '/images/examples/line-art-colorize/input.jpg',
        detailedDescription: t(
          'professional.line_art_colorization.detailed_description',
        ),
        features: [
          {
            icon: <IconUpload className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.line_art_colorization.features.upload_line_art',
            ),
          },
          {
            icon: <IconPhoto className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.line_art_colorization.features.reference_guided',
            ),
          },
          {
            icon: <IconColorSwatch className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.line_art_colorization.features.specify_colors',
            ),
          },
          {
            icon: <IconCheck className='h-4 w-4 md:h-5 md:w-5' />,
            text: t('professional.line_art_colorization.features.high_quality'),
          },
        ],
      },
      {
        id: 'sketch_simplification',
        title: t('professional.sketch_simplification.title'),
        shortTitle: t('professional.sketch_simplification.short_title'),
        description: t('professional.sketch_simplification.description'),
        icon: <IconBrush className='h-5 w-5 md:h-6 md:w-6' />,
        imageUrl: '/images/examples/sketch_simplifier/cover.png',
        detailedDescription: t(
          'professional.sketch_simplification.detailed_description',
        ),
        features: [
          {
            icon: <IconBrush className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.sketch_simplification.features.clean_line_art',
            ),
          },
          {
            icon: <IconSparkles className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.sketch_simplification.features.smart_simplification',
            ),
          },
          {
            icon: <IconClock className='h-4 w-4 md:h-5 md:w-5' />,
            text: t('professional.sketch_simplification.features.time_saving'),
          },
          {
            icon: <IconCheck className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.sketch_simplification.features.professional_quality',
            ),
          },
        ],
      },
      {
        id: 'inbetween',
        title: t('professional.animation_inbetweening.title'),
        shortTitle: t('professional.animation_inbetweening.short_title'),
        description: t('professional.animation_inbetweening.description'),
        icon: <IconVideo className='h-5 w-5 md:h-6 md:w-6' />,
        videoUrl:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/9c49fd9c-346e-46b7-8104-428f6c2d8dd2.webm',
        detailedDescription: t(
          'professional.animation_inbetweening.detailed_description',
        ),
        features: [
          {
            icon: <IconUpload className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.animation_inbetweening.features.upload_keyframes',
            ),
          },
          {
            icon: <IconWand className='h-4 w-4 md:h-5 md:w-5' />,
            text: t('professional.animation_inbetweening.features.advanced_ai'),
          },
          {
            icon: <IconClock className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.animation_inbetweening.features.rapid_creation',
            ),
          },
          {
            icon: <IconCheck className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.animation_inbetweening.features.professional_quality',
            ),
          },
        ],
      },
      {
        id: 'video_interpolation',
        title: t('professional.frame_interpolation.title'),
        shortTitle: t('professional.frame_interpolation.short_title'),
        description: t('professional.frame_interpolation.description'),
        icon: <IconLayersIntersect className='h-5 w-5 md:h-6 md:w-6' />,
        videoUrl:
          'https://dihulvhqvmoxyhkxovko.supabase.co/storage/v1/object/public/husbando-land/public/husbando-land/app_videos/679983bc-952d-4509-bf03-d8b5bc1f91bc.webm',
        detailedDescription: t(
          'professional.frame_interpolation.detailed_description',
        ),
        features: [
          {
            icon: <IconBolt className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.frame_interpolation.features.higher_frame_rates',
            ),
          },
          {
            icon: <IconRipple className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.frame_interpolation.features.smoother_motion',
            ),
          },
          {
            icon: <IconZoomIn className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.frame_interpolation.features.video_enhancement',
            ),
          },
          {
            icon: <IconCheck className='h-4 w-4 md:h-5 md:w-5' />,
            text: t(
              'professional.frame_interpolation.features.professional_quality',
            ),
          },
        ],
      },
    ];

    const scrollToFeature = (featureId: string) => {
      setActiveTab(featureId);
      const element = document.getElementById(featureId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    useEffect(() => {
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveTab(entry.target.id);
            }
          });
        },
        { threshold: 0.5 },
      );

      features.forEach(feature => {
        const element = document.getElementById(feature.id);
        if (element) {
          observer.observe(element);
        }
      });

      return () => observer.disconnect();
    }, []);

    return (
      <div className='mb-6 md:mb-8'>
        <div className='sticky top-0 z-[100] backdrop-blur-sm md:border-b border-border mb-8 md:mb-12'>
          <div className='px-3 py-3 md:px-4 md:py-4'>
            {/* Mobile: Chip Group */}
            <div className='md:hidden'>
              <div className='flex gap-2 flex-wrap justify-center'>
                {features.map(feature => (
                  <button
                    key={feature.id}
                    onClick={() => scrollToFeature(feature.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === feature.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}>
                    <span className='text-xs'>{feature.icon}</span>
                    <span>{feature.shortTitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: Tabs */}
            <div className='hidden md:flex gap-2 justify-center flex-wrap'>
              {features.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => scrollToFeature(feature.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === feature.id
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                  {feature.icon}
                  <span>{feature.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='space-y-8 md:space-y-14'>
          {features.map((feature, index) => (
            <section
              key={feature.id}
              id={feature.id}
              className='scroll-mt-32 md:scroll-mt-40'>
              <Link
                href={`/${feature.id}`}
                className='block bg-card rounded-lg md:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer border border-border'>
                {/* Mobile: Stack vertically, Desktop: Grid */}
                <div className='block md:grid md:grid-cols-2 md:gap-0'>
                  {/* Image Section - Always on top for mobile */}
                  <div
                    className={`relative bg-muted w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 flex items-center justify-center overflow-hidden md:p-6 lg:p-8 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    {feature.videoUrl ? (
                      <video
                        src={feature.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className='w-full h-full rounded-lg object-cover object-center'
                      />
                    ) : (
                      <img
                        src={feature.imageUrl}
                        alt={feature.title}
                        className='w-full h-full rounded-lg object-cover object-center'
                      />
                    )}
                  </div>

                  {/* Content Section */}
                  <div
                    className={`p-4 md:p-8 flex flex-col justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    <div className='flex items-center space-x-3 mb-3 md:mb-4'>
                      <div className='w-6 h-6 md:w-8 md:h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0'>
                        {feature.icon}
                      </div>
                      <h3 className='text-lg md:text-2xl font-bold text-heading leading-tight'>
                        {feature.title}
                      </h3>
                    </div>

                    <p className='text-sm md:text-base text-muted-foreground mb-4 md:mb-6 leading-relaxed'>
                      {feature.detailedDescription}
                    </p>

                    <div className='grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-3 mb-4 md:mb-6'>
                      {feature.features.map((feat, featIndex) => (
                        <div
                          key={featIndex}
                          className='flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-muted rounded-lg'>
                          <div className='text-primary flex-shrink-0'>
                            {feat.icon}
                          </div>
                          <span className='text-foreground text-xs md:text-sm font-medium'>
                            {feat.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Indicator */}
                    <div className='flex flex-wrap gap-3'>
                      <span className='inline-flex items-center text-primary font-medium text-sm md:text-base'>
                        Learn more →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          ))}
        </div>
      </div>
    );
  },
);

export const ProfessionalSection = memo(
  ({ theme }: { theme: string | undefined }) => {
    const { t } = useTranslation('landing');

    return (
      <div className='pt-16 pb-8 md:pb-16 ' id='professional-artists'>
        <div className='container mx-auto px-2 md:px-16'>
          <div className='text-center mb-8 md:mb-12'>
            <p className='text-xs md:text-sm font-semibold uppercase text-primary-600 mb-2'>
              {t('professional.section_title')}
            </p>
            <h2
              className={`text-${theme === 'dark' ? 'white' : 'black'} font-sans mb-4 md:mb-5 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight`}>
              {t('professional.main_title')}
            </h2>
            <p
              className={`text-${theme === 'dark' ? 'white' : 'black'} font-strong mb-6 md:mb-8 text-base md:text-xl !leading-relaxed text-default-600 dark:text-body-color-dark`}>
              {t('professional.subtitle')}
            </p>
          </div>

          <ProfessionalArtistsBento theme={theme} />

          {/* CTA - Mobile optimized */}
          <div className='text-center mt-8 md:mt-12'>
            <Link href='/' title='Start Creating with AI'>
              <Button
                className='px-6 md:px-8 py-3 md:py-4 font-semibold text-base md:text-lg min-h-[48px] md:min-h-[56px]'
                color='primary'
                radius='full'
                size='lg'>
                {t('professional.cta_button')}
              </Button>
            </Link>
            <p
              className={`mt-3 md:mt-4 text-xs md:text-sm text-muted-foreground`}>
              {t('professional.cta_subtitle')}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
