import React, { memo } from 'react';
import { Button, Card, cn, Spinner, Tooltip } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AiOutlineStar, AiFillStar } from 'react-icons/ai';
import { GenerationModel } from './types';

// Helper function to make regex safe
export const makeCharRegex = (char: string) =>
  char.replace(/[.*+?^${}()|[\]\\<>]/g, '\\$&');

interface PromptTagProps {
  labelItem:
    | string
    | {
        label: string;
        value: string;
        image?: string;
        kusaSpecial?: boolean;
        requiresSeedream?: boolean;
        requiresBananaPro?: boolean;
      };
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  isKusa: boolean;
  isMobile: boolean;
  setModel?: (newModel: GenerationModel) => void;
  onClose?: () => void;
  showToast?: boolean;
  // 收藏功能新增 props
  styleId?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (styleId: string) => void;
  isTogglingFavorite?: boolean;
}

const PromptTag = memo(
  ({
    labelItem,
    prompt = '',
    setPrompt,
    isKusa,
    isMobile,
    setModel,
    onClose,
    showToast = false,
    styleId,
    isFavorite = false,
    onToggleFavorite,
    isTogglingFavorite = false,
  }: PromptTagProps) => {
    const { t } = useTranslation('create');
    const labelText =
      typeof labelItem === 'string' ? labelItem : labelItem.label;
    const labelValue =
      typeof labelItem === 'string' ? labelItem : labelItem.value;
    const labelImage =
      typeof labelItem === 'string' ? undefined : labelItem.image;
    const included = prompt.includes(labelValue);

    // 收藏星标点击处理
    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (styleId) onToggleFavorite?.(styleId);
    };

    const handlePress = () => {
      let newPrompt = prompt;
      if (!included) {
        if (isKusa) {
          const regex = /\[.+?\]/g;
          newPrompt = newPrompt.replace(regex, '');
          if (typeof labelItem === 'object' && labelItem.kusaSpecial) {
            setModel?.('Art Pro');
          }
          // Switch to Seedream 4.5 model for styles that require it
          if (typeof labelItem === 'object' && labelItem.requiresSeedream) {
            setModel?.('Seedream 4.5');
          }
          // Switch to Gemini Pro model for grids that require it
          if (typeof labelItem === 'object' && labelItem.requiresBananaPro) {
            setModel?.('Gemini Pro');
          }
        }
        const reg = /,\s*$/;
        newPrompt = `${newPrompt.replace(reg, '')}, ${labelValue}`;
        setPrompt(newPrompt.replace(/^,\s*/, ''));

        // Show toast for non-kusa styles
        if (showToast) {
          toast.success(t('style_inserted') || 'Style inserted');
        }

        // Close modal for kusa styles (with image)
        onClose?.();
      } else {
        const regex = new RegExp(`${makeCharRegex(labelValue)}\\s*,?\\s*`, 'g');
        const newPrompt = prompt.replace(regex, '');
        setPrompt(newPrompt);

        // Show toast for non-kusa styles
        if (showToast) {
          toast.success(t('style_removed') || 'Style removed');
        }

        // Close modal for kusa styles (with image)
        onClose?.();
      }
    };

    if (labelImage) {
      return (
        <div
          onClick={handlePress}
          className={cn(
            'relative cursor-pointer transition-all duration-200 ease-in-out',
            'hover:scale-[1.02] active:scale-[0.98]',
            'w-full',
          )}
          role='button'
          tabIndex={0}
          aria-pressed={included}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePress();
            }
          }}>
          <Card
            className={cn(
              'w-full overflow-hidden',
              {
                'ring-2 ring-primary-500 ring-offset-1': included,
              },
              isMobile ? 'rounded-lg' : '',
            )}>
            <div className='p-0 relative'>
              <div className='relative w-full overflow-hidden bg-muted aspect-square'>
                <img
                  src={labelImage}
                  alt={labelText}
                  className='w-full h-full object-cover object-top'
                  loading='lazy'
                />

                {included && (
                  <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600 rounded-bl-full flex items-center justify-center z-10 pointer-events-none'>
                    <svg
                      className='-mt-1 ml-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                )}

                {isKusa &&
                  typeof labelItem === 'object' &&
                  labelItem.kusaSpecial && (
                    <Tooltip content={t('kusa_only_tooltip')}>
                      <div className='absolute top-0 left-0 rounded-tl-lg w-5 h-5 sm:w-6 sm:h-6 text-tiny rounded-br-full bg-primary-600 flex items-center justify-center'>
                        <div className='-ml-1 -mt-1'>🌸</div>
                      </div>
                    </Tooltip>
                  )}

                {isKusa &&
                  typeof labelItem === 'object' &&
                  labelItem.requiresSeedream && (
                    <Tooltip content='Seedream'>
                      <div className='absolute top-0 left-0 rounded-tl-lg w-5 h-5 sm:w-6 sm:h-6 text-tiny rounded-br-full bg-primary-600 flex items-center justify-center'>
                        <div className='-ml-1 -mt-1'>✨</div>
                      </div>
                    </Tooltip>
                  )}

                {isKusa &&
                  typeof labelItem === 'object' &&
                  labelItem.requiresBananaPro && (
                    <Tooltip content='Nano Banana Pro'>
                      <div className='absolute top-0 left-0 rounded-tl-lg w-5 h-5 sm:w-6 sm:h-6 text-tiny rounded-br-full bg-primary-600 flex items-center justify-center'>
                        <div className='-ml-1 -mt-1'>🍌</div>
                      </div>
                    </Tooltip>
                  )}

                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-2 pb-1.5 z-10',
                  )}>
                  <div className='text-white font-medium text-xs leading-tight line-clamp-2 drop-shadow-md text-center px-[2px] capitalize'>
                    {labelText}
                  </div>
                </div>

                {/* 收藏星标按钮 - 右上角 */}
                {styleId && onToggleFavorite && (
                  <div
                    className='absolute top-1 right-1 z-20 w-8 h-8 flex items-center justify-center cursor-pointer bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all'
                    onClick={handleFavoriteClick}
                    role='button'
                    aria-label={t('toggle_favorite') || 'Toggle favorite'}>
                    {isTogglingFavorite ? (
                      <Spinner size='sm' color='warning' className='w-4 h-4' />
                    ) : isFavorite ? (
                      <AiFillStar className='w-5 h-5 text-yellow-400 drop-shadow-lg' />
                    ) : (
                      <AiOutlineStar className='w-5 h-5 text-white hover:text-yellow-300 drop-shadow-lg transition-colors' />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className='relative inline-flex items-center gap-0'>
        <Button
          key={labelText}
          variant='flat'
          size='sm'
          color={included ? 'primary' : 'default'}
          className={cn(
            'rounded-full font-medium transition-all duration-200 shadow-sm max-w-full py-2 h-auto md:py-1.5 md:break-words text-xs capitalize',
            styleId && onToggleFavorite ? 'pr-7' : '',
            !included && 'text-foreground',
          )}
          style={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            ...(labelValue.length > 20
              ? { maxWidth: isMobile ? '95%' : '95%' }
              : {}),
          }}
          onPress={handlePress}>
          {typeof labelItem === 'string' ? t(labelItem) : labelItem.label}
        </Button>
        {/* Tag 样式的收藏星标 */}
        {styleId && onToggleFavorite && (
          <div
            className='absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center cursor-pointer'
            onClick={handleFavoriteClick}
            role='button'
            aria-label={t('toggle_favorite') || 'Toggle favorite'}>
            {isTogglingFavorite ? (
              <Spinner size='sm' color='warning' className='w-3.5 h-3.5' />
            ) : isFavorite ? (
              <AiFillStar className='w-4 h-4 text-yellow-500 drop-shadow' />
            ) : (
              <AiOutlineStar className='w-4 h-4 text-gray-500 hover:text-yellow-500 transition-colors' />
            )}
          </div>
        )}
      </div>
    );
  },
);

export default PromptTag;
