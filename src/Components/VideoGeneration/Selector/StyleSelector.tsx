import { useRef, useState } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@nextui-org/react';
import { BsPalette } from 'react-icons/bs';
import { FaCheck } from 'react-icons/fa';
import cn from 'classnames';
import { TextToVideoStyle } from '../../../../api/tools/_zaps';

export interface StyleOption {
  key: TextToVideoStyle;
  label: string;
  image: string;
}

// Default style options
export const VIDEO_STYLE_OPTIONS: StyleOption[] = [
  {
    key: TextToVideoStyle.MODERN_ANIME,
    label: 'Modern Anime',
    image: '/images/styles/modern-anime.png',
  },
  {
    key: TextToVideoStyle.REALISTIC,
    label: 'Realistic',
    image: '/images/styles/realistic_new.webp',
  },
  {
    key: TextToVideoStyle.STUDIO_GHIBLI,
    label: 'Studio Ghibli',
    image: '/images/styles/studio-ghibli.png',
  },
  {
    key: TextToVideoStyle.RETRO_ANIME,
    label: 'Retro Anime',
    image: '/images/styles/retro-anime_new.webp',
  },
  {
    key: TextToVideoStyle.MYSTICAL_ANIME,
    label: 'Mystical Anime',
    image: '/images/styles/mystical-anime.png',
  },
  {
    key: TextToVideoStyle.HORROR_ANIME,
    label: 'Horror Anime',
    image: '/images/styles/horror-anime.png',
  },
  {
    key: TextToVideoStyle.DISNEY,
    label: 'Disney',
    image: '/images/styles/disney.png',
  },
  {
    key: TextToVideoStyle.CARTOON,
    label: 'Cartoon',
    image: '/images/styles/cartoon.png',
  },
  {
    key: TextToVideoStyle.KAWAII,
    label: 'Kawaii',
    image: '/images/styles/kawaii.png',
  },
  {
    key: TextToVideoStyle.MANGA,
    label: 'Manga',
    image: '/images/styles/manga_new.webp',
  },
  {
    key: TextToVideoStyle.CINEMATIC,
    label: 'Cinematic',
    image: '/images/styles/cinematic.png',
  },
  {
    key: TextToVideoStyle.INK_WASH,
    label: 'Ink Wash',
    image: '/images/styles/ink-wash.png',
  },
  {
    key: TextToVideoStyle.CYBERPUNK,
    label: 'Cyberpunk',
    image: '/images/styles/cyberpunk_new.webp',
  },
  {
    key: TextToVideoStyle.CLAYMATION,
    label: 'Claymation',
    image: '/images/styles/claymation.png',
  },
  {
    key: TextToVideoStyle.HAND_DRAWN,
    label: 'Hand-drawn',
    image: '/images/styles/hand-drawn.png',
  },
];

interface StyleSelectorProps {
  selectedStyle: TextToVideoStyle;
  onStyleChange: (style: TextToVideoStyle) => void;
  styleOptions?: StyleOption[];
  /** Compact mode: smaller trigger, 3 columns grid */
  compact?: boolean;
  /** Pill mode: RightSidebar-style pill button (overrides compact) */
  pill?: boolean;
  className?: string;
}

export default function StyleSelector({
  selectedStyle,
  onStyleChange,
  styleOptions = VIDEO_STYLE_OPTIONS,
  compact = false,
  pill = false,
  className = '',
}: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = useState(400);

  const selectedOption = styleOptions.find(opt => opt.key === selectedStyle);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !compact && !pill && triggerRef.current) {
      setPopoverWidth(triggerRef.current.clientWidth || 400);
    }
  };

  const handleSelect = (style: TextToVideoStyle) => {
    onStyleChange(style);
    setIsOpen(false);
  };

  // Pill mode: RightSidebar-style pill button
  if (pill) {
    return (
      <Popover
        placement='bottom'
        isOpen={isOpen}
        onOpenChange={handleOpenChange}>
        <PopoverTrigger>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all text-sm h-9',
              'bg-accent border border-primary-200 hover:border-primary-400',
              className,
            )}>
            {selectedOption ? (
              <>
                <img
                  src={selectedOption.image}
                  alt={selectedOption.label}
                  className='w-5 h-5 rounded object-cover'
                />
                <span className='font-medium text-foreground'>
                  {selectedOption.label}
                </span>
              </>
            ) : (
              <>
                <BsPalette className='w-4 h-4 text-muted-foreground' />
                <span className='font-medium text-foreground'>Style</span>
              </>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className='p-3 w-[320px] bg-card'>
          <div className='grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto'>
            {styleOptions.map(option => (
              <button
                key={option.key}
                onClick={() => handleSelect(option.key)}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition-all',
                  selectedStyle === option.key
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-transparent hover:border-border',
                )}>
                <img
                  src={option.image}
                  alt={option.label}
                  className='w-full aspect-[3/2] object-cover'
                />
                <div className='absolute bottom-0 left-0 right-0 bg-foreground/50 text-background text-[10px] py-0.5 text-center truncate px-1'>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (compact) {
    return (
      <Popover
        placement='bottom'
        isOpen={isOpen}
        onOpenChange={handleOpenChange}>
        <PopoverTrigger>
          <Button
            size='sm'
            variant='flat'
            className={cn(
              'h-[34px] px-3 bg-input hover:bg-muted flex-1 sm:flex-none',
              className,
            )}>
            <BsPalette className='w-4 h-4 text-foreground' />
            <span className='text-xs text-foreground'>
              {selectedOption?.label || 'Style'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='p-3 w-[320px] bg-card'>
          <div className='grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto'>
            {styleOptions.map(option => (
              <button
                key={option.key}
                onClick={() => handleSelect(option.key)}
                className={cn(
                  'relative rounded-lg overflow-hidden border-2 transition-all',
                  selectedStyle === option.key
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-transparent hover:border-border',
                )}>
                <img
                  src={option.image}
                  alt={option.label}
                  className='w-full aspect-[3/2] object-cover'
                />
                <div className='absolute bottom-0 left-0 right-0 bg-foreground/50 text-background text-[10px] py-0.5 text-center truncate px-1'>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={className}>
      <Popover
        disableAnimation
        placement='bottom'
        isOpen={isOpen}
        onOpenChange={handleOpenChange}>
        <PopoverTrigger>
          <Button
            ref={triggerRef}
            className='w-full px-3 bg-input hover:bg-muted transition-colors duration-200'>
            <div className='flex w-full justify-between items-center gap-2'>
              <span className='text-foreground'>Style</span>
              <div className='flex items-center gap-2'>
                <BsPalette className='w-4 h-4 text-foreground' />
                <span className='text-foreground'>
                  {selectedOption?.label || 'Select Style'}
                </span>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='p-3 bg-card'>
          <div
            className='grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto'
            style={{ width: `${popoverWidth}px` }}>
            {styleOptions.map(option => (
              <div
                key={option.key}
                className={cn(
                  'cursor-pointer rounded-lg transition-all duration-200 relative overflow-hidden',
                  {
                    'border-2 border-primary-600 bg-primary-50 shadow-md':
                      selectedStyle === option.key,
                    'border border-border hover:border-primary-300 hover:bg-primary-50/30':
                      selectedStyle !== option.key,
                  },
                )}
                onClick={() => handleSelect(option.key)}>
                <div className='relative aspect-[3/2] rounded-lg overflow-hidden'>
                  <img
                    src={option.image}
                    alt={option.label}
                    className='w-full h-full object-cover'
                  />
                  {selectedStyle === option.key && (
                    <div className='absolute top-0 right-0 w-6 h-6 bg-primary-600/90 rounded-bl-lg flex items-center justify-center z-10 pointer-events-none'>
                      <FaCheck className='-mt-1 ml-1 w-3 h-3 text-primary-foreground' />
                    </div>
                  )}
                </div>
                <p className='text-xs font-medium text-center truncate leading-tight py-1'>
                  {option.label}
                </p>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
