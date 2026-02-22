import React from 'react';
import Link from 'next/link';
import { Skeleton } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import { Character } from '../../state';

interface CharacterGridProps {
  characters: Character[];
  loading?: boolean;
  onCharacterClick?: (character: Character) => void;
  layout?: 'grid' | 'list';
  showStats?: boolean;
  emptyMessage?: string;
  className?: string;
  renderCard?: (character: Character) => React.ReactNode; // Custom card renderer
  enablePrefetch?: boolean; 
}

/**
 * CharacterGrid - Grid layout component for displaying characters
 *
 * Features:
 * - Responsive grid layout (2 cols mobile, 3-4 cols tablet, 5-6 cols desktop)
 * - Loading state with skeleton screens
 * - Empty state handling
 * - Custom card rendering support
 * - Grid or list layout options
 */
export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  loading = false,
  onCharacterClick,
  layout = 'grid',
  showStats = false,
  emptyMessage,
  className,
  renderCard,
  enablePrefetch = true, 
}) => {
  const { t } = useTranslation(['create', 'common']);

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={cn(
          'grid gap-2',
          {
            'grid-cols-3 md:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6':
              layout === 'grid',
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': layout === 'list',
          },
          className,
        )}>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className='w-full'>
            <Skeleton className='w-full aspect-[3/4] rounded-lg' />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!characters || characters.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center'>
          <svg
            className='w-12 h-12 text-muted-foreground'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold text-foreground mb-2'>
          {t('common:no_characters_found', 'No characters found')}
        </h3>
        <p className='text-muted-foreground max-w-md'>
          {emptyMessage ||
            t(
              'common:no_characters_description',
              'Try selecting a different collection or create your own character.',
            )}
        </p>
      </div>
    );
  }

  // Grid layout
  return (
    <div
      className={cn(
        'grid gap-2',
        {
          'md:gap-4 grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6':
            layout === 'grid',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': layout === 'list',
        },
        className,
      )}>
      {characters.map(character => {
        const characterUrl = `/character/${character.character_uniqid}`;

        // Wrap with Link for prefetch if enabled
        const content = renderCard ? (
          renderCard(character)
        ) : (
          // Default card rendering (will be replaced by CharacterCard component)
          <div className='w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center'>
            <span className='text-muted-foreground text-sm'>
              {character.character_name}
            </span>
          </div>
        )

        return (
          <div
            key={character.character_uniqid || character.id}
            className='w-full'>
            {enablePrefetch && character.character_uniqid ? (
              <Link
                href={characterUrl}
                prefetch={true}
                onClick={e => {
                  // Prevent default Link navigation, use custom handler
                  e.preventDefault();
                  onCharacterClick?.(character);
                }}
                className='block w-full cursor-pointer'>
                {content}
              </Link>
            ) : (
              <div
                onClick={() => onCharacterClick?.(character)}
                className='cursor-pointer'>
                {content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CharacterGrid;
