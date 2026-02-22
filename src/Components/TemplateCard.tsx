import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@nextui-org/react';
import { HiOutlineArrowsExpand } from 'react-icons/hi';
import { HiMiniFire } from 'react-icons/hi2';
import { FaTiktok } from 'react-icons/fa';
import { FeaturedTemplate } from '../data/featuredTemplates';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface TemplateCardProps {
  template: FeaturedTemplate;
  onUse: (template: FeaturedTemplate) => void;
  onPreview?: (template: FeaturedTemplate) => void;
}

const TRANSLATION_NS = 'templates';

const resolveKey = (t: TFunction, key: string) => {
  if (!key) {
    return '';
  }
  if (key.includes(':')) {
    return t(key);
  }
  return t(key, { ns: TRANSLATION_NS });
};

export const TemplateCard = ({
  template,
  onUse,
  onPreview,
}: TemplateCardProps) => {
  const { t } = useTranslation([TRANSLATION_NS, 'style-templates']);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const title = useMemo(
    () => resolveKey(t, template.nameKey),
    [t, template.nameKey],
  );

  const handleUse = () => onUse(template);
  const handlePreview = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    onPreview?.(template);
  };

  useEffect(() => {
    if (template.media.type !== 'video') {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    let playTimeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.target !== video) {
            return;
          }

          clearTimeout(playTimeout);

          if (entry.isIntersecting) {
            playTimeout = setTimeout(() => {
              video.play().catch(() => {});
            }, 300);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      clearTimeout(playTimeout);
      video.pause();
    };
  }, [template.media.src, template.media.type]);

  return (
    <div className='flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-2.5 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-lg active:scale-[0.98]'>
      {/* Image/Video Section */}
      <div className='group relative aspect-square w-full overflow-hidden rounded-xl bg-muted'>
        <div
          className='h-full w-full cursor-pointer'
          role='button'
          tabIndex={0}
          onClick={handleUse}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleUse();
            }
          }}>
          {template.media.type === 'image' ? (
            <img
              src={template.media.src}
              alt={title}
              className='h-full w-full object-cover object-top'
              loading='lazy'
            />
          ) : (
            <video
              ref={videoRef}
              src={template.media.src}
              poster={template.media.poster}
              muted
              loop
              playsInline
              preload='metadata'
              className='h-full w-full object-cover object-top'
            />
          )}
        </div>

        {/* Popularity - Top left corner */}
        {template.popularity && (
          <div className='pointer-events-none absolute left-2 top-2'>
            <div className='flex items-center gap-1 rounded-full bg-card/85 px-2 py-0.5 shadow backdrop-blur-sm'>
              <HiMiniFire
                className='h-3 w-3 text-orange-500'
                aria-hidden='true'
              />
              <span className='text-[10.5px] font-medium text-foreground'>
                {template.popularity}
              </span>
            </div>
          </div>
        )}

        {/* TikTok Badge - Bottom right corner */}
        {template.badge === 'tiktok' && (
          <div className='pointer-events-none absolute bottom-2 right-2'>
            <div className='flex items-center gap-1 rounded-full bg-black px-2 py-0.5 shadow'>
              <FaTiktok className='h-3 w-3 text-white' aria-hidden='true' />
              <span className='text-[10.5px] font-medium text-white'>
                TikTok
              </span>
            </div>
          </div>
        )}

        {/* Preview Button - Top right corner */}
        <button
          type='button'
          aria-label={t('buttons.preview', { ns: TRANSLATION_NS })}
          className={`
            absolute top-2 right-2 flex items-center justify-center text-foreground
            backdrop-blur-sm transition-all hover:bg-card active:scale-95
            h-7 w-7 rounded-full bg-card/80 shadow-sm opacity-100
            sm:h-8 sm:w-8 sm:rounded-lg sm:bg-card/95 sm:shadow-md
            sm:opacity-0 sm:group-hover:opacity-100
          `}
          onClick={handlePreview}>
          <HiOutlineArrowsExpand className='h-3.5 w-3.5' />
        </button>
      </div>

      {/* Content Section - Bottom info */}
      <div className='flex flex-col gap-2 px-1 pt-2.5 pb-1'>
        <h3 className='text-xs  md:text-sm font-semibold leading-snug text-foreground text-center'>
          {title}
        </h3>

        <Button
          className='w-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 hover:bg-primary-200 dark:hover:bg-primary-800/50'
          variant='flat'
          radius='lg'
          size='sm'
          color='primary'
          onPress={handleUse}>
          {t('buttons.useTemplate', { ns: TRANSLATION_NS })}
        </Button>
      </div>
    </div>
  );
};

export default TemplateCard;
