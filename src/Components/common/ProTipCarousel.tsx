import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';

interface ProTipCarouselProps {
  autoPlayInterval?: number;
  className?: string;
}

export const ProTipCarousel: React.FC<ProTipCarouselProps> = ({
  autoPlayInterval = 4000,
  className,
}) => {
  const { t } = useTranslation('ai-anime-generator');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get tips directly from i18n
  const tipData = t('proTips.items', { returnObjects: true }) as string[];
  const tips = Array.isArray(tipData) ? tipData : [];

  const nextTip = useCallback(() => {
    setCurrentIndex(prevIndex => {
      if (tips.length <= 1) return prevIndex;
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * tips.length);
      } while (newIndex === prevIndex);
      return newIndex;
    });
  }, [tips.length]);

  // Auto-play functionality
  useEffect(() => {
    if (tips.length <= 1) return;

    const interval = setInterval(nextTip, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextTip, autoPlayInterval, tips.length]);

  if (!tips || tips.length === 0) return null;

  // Parse current tip
  const currentTip = tips[currentIndex];
  const match = currentTip?.match(/^([^:]+):\s*(.+)$/);
  const tipContent = match ? match[2] : currentTip;

  return (
    <div
      className={cn(
        'h-full p-1 md:p-2 md:pt-1 pt-0 relative flex flex-col gap-0 md:gap-1 text-center md:text-left',
        className,
      )}>
      <p className='my-0 md:my-1 flex items-center justify-center md:justify-start gap-1 sm:text-sm md:text-xl font-semibold text-primary-700 mx-auto'>
        <Lightbulb className='w-3 h-3 md:w-5 md:h-5 text-primary-500' />
        <span className='text-sm md:text-lg font-semibold text-primary-700'>
          {t('generating.title')}
        </span>
      </p>

      <div className='my-auto flex-1 w-full px-2 md:px-2 py-1.5  rounded-xl bg-primary-100/60 overflow-hidden max-w-[70ch] md:max-w-none mx-auto md:mx-0 flex items-center'>
        <p
          className='text-left text-[10px] sm:text-sm text-primary-700 leading-snug overflow-hidden break-normal line-clamp-[6] sm:line-clamp-[6] md:line-clamp-[7] lg:line-clamp-[9]'
          style={{ hyphens: 'auto' }}>
          <span className='font-semibold'>Pro tip:</span> {tipContent}
        </p>
      </div>
    </div>
  );
};

export default ProTipCarousel;
