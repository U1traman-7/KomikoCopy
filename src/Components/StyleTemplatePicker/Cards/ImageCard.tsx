import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaCrown } from 'react-icons/fa6';
import { getStyleInfo } from '../../../../api/tools/_styleTransferPrompts';
import { ImageStyleTemplate } from '../styles';

export interface ImageCardProps {
  style: ImageStyleTemplate;
  selected: boolean;
  onClick: () => void;
  isVip: boolean;
  onOpenModal?: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  style,
  selected,
  onClick,
  isVip,
  onOpenModal,
}) => {
  const { t } = useTranslation('style-templates');
  const [isVipStyle, setIsVipStyle] = useState(false);

  // 检查是否为VIP样式
  useEffect(() => {
    const fetchStyleInfo = async () => {
      try {
        const styleInfo = await getStyleInfo(style.id);
        setIsVipStyle(styleInfo?.needVip || false);
      } catch (error) {
        console.error('Failed to fetch style info:', error);
        setIsVipStyle(false);
      }
    };

    fetchStyleInfo();
  }, [style.id]);

  const isDisabled = isVipStyle && !isVip;

  const handleClick = () => {
    if (isDisabled) {
      onOpenModal?.();
    } else {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      key={style.id}
      role='button'
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        cursor-pointer rounded-lg transition-all duration-200 relative overflow-hidden
        ${
          selected && !isDisabled
            ? 'border-2 border-primary-600 bg-primary-50 dark:bg-primary-900 shadow-md'
            : 'border border-border hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-900/30'
        }
        ${isDisabled ? 'opacity-50 !cursor-not-allowed border border-border' : ''}
      `}
      aria-label={t(style.nameKey)}
      aria-pressed={selected}>
      {isVipStyle && !selected && (
        <div className='absolute flex-center top-0 right-0 z-10 bg-primary/50 p-0.5 px-1 rounded-bl-lg rounded-tr-lg'>
          <FaCrown className='text-yellow-500 w-4 h-4 drop-shadow-md' />
        </div>
      )}
      <div className='overflow-hidden rounded-none aspect-square relative'>
        <img
          src={style.image}
          alt={t(style.nameKey)}
          className='object-cover object-top w-full h-full'
          draggable={false}
          loading='lazy'
          decoding='async'
        />
      </div>
      {selected && !isDisabled && (
        <>
          <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600 rounded-bl-full flex items-center justify-center z-10 pointer-events-none'>
            <FaCheck className='-mt-1 ml-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white' />
          </div>
          <span className='sm:hidden absolute left-1 top-1.5 text-[10px] font-medium text-primary-600 bg-card/90 rounded px-1 py-[1px] pointer-events-none'>
            {t('ui.selected')}
          </span>
        </>
      )}
      <p className='text-xs font-medium text-center truncate leading-tight py-1'>
        {t(style.nameKey)}
      </p>
    </div>
  );
};
