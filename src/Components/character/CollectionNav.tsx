import React from 'react';
import { Button } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { FaFire, FaClock, FaUser, FaHeart, FaPlus } from 'react-icons/fa';
import { MdCollections } from 'react-icons/md';
import cn from 'classnames';
import {
  formatCategoryName,
  i18nKeyForCategory,
} from '../../utils/characterNameUtils';

export interface Collection {
  id: string;
  key: string; // i18n key
  name?: string; // Display name (for Fan collections, this is the original world name)
  icon?: React.ReactNode;
  count?: number;
  requireAuth?: boolean;
  type?: 'system' | 'ip';
}

export interface CollectionNavProps {
  collections: Collection[];
  activeCollection: string;
  onCollectionChange: (collectionId: string) => void;
  onMoreClick?: () => void; // For "More" button in AI Generator
  isAuthenticated?: boolean;
  className?: string;
  layout?: 'vertical' | 'horizontal'; // vertical for desktop, horizontal for mobile
  hideIcons?: boolean; // Hide icons to save space on mobile
}

/**
 * CollectionNav - Navigation component for character collections
 *
 * Features:
 * - System collections (Popular, Recently Used, My Characters, Adopted Characters)
 * - Fan collections (dynamically loaded)
 * - Responsive layout (vertical sidebar on desktop, horizontal tabs on mobile)
 * - Authentication-aware (shows login prompt for auth-required collections)
 * - Optional "More" button for AI Generator integration
 */
export const CollectionNav: React.FC<CollectionNavProps> = ({
  collections,
  activeCollection,
  onCollectionChange,
  onMoreClick,
  isAuthenticated = false,
  className,
  layout = 'vertical',
  hideIcons = false,
}) => {
  const { t } = useTranslation(['create', 'common']);

  const handleCollectionClick = (collection: Collection) => {
    onCollectionChange(collection.id);
  };

  // Default system collections
  const defaultCollections: Collection[] = [
    {
      id: 'popular',
      key: 'popular',
      icon: <FaFire className='w-4 h-4' />,
      type: 'system',
    },
    {
      id: 'recent',
      key: 'recently_used',
      icon: <FaClock className='w-4 h-4' />,
      requireAuth: true,
      type: 'system',
    },
    {
      id: 'my',
      key: 'my_characters',
      icon: <FaUser className='w-4 h-4' />,
      requireAuth: true,
      type: 'system',
    },
    {
      id: 'adopted',
      key: 'adopted_characters',
      icon: <FaHeart className='w-4 h-4' />,
      requireAuth: true,
      type: 'system',
    },
  ];

  // Merge default collections with provided collections
  const allCollections =
    collections.length > 0 ? collections : defaultCollections;

  // Separate system and Fan collections
  const systemCollections = allCollections.filter(
    c => c.type === 'system' || !c.type,
  );
  const fanCollections = allCollections.filter(c => c.type === 'ip');

  // Vertical layout (desktop sidebar)
  if (layout === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        {/* System Collections */}
        <div className='mb-1'>
          {systemCollections
            .filter(collection => {
              // Hide collections that require auth when user is not authenticated
              if (collection.requireAuth && !isAuthenticated) {
                return false;
              }
              return true;
            })
            .map(collection => {
              const isActive = activeCollection === collection.id;

              return (
                <Button
                  key={collection.id}
                  variant='light'
                  className={cn(
                    'w-full justify-start h-auto font-medium transition-all rounded-md items-center',
                    hideIcons
                      ? 'px-2 py-1.5 min-h-[32px] text-xs'
                      : 'px-3 py-2 min-h-[40px] text-sm',
                    {
                      'bg-primary-50 text-primary-700 hover:bg-primary-100':
                        isActive,
                      'text-foreground hover:bg-muted': !isActive,
                    },
                  )}
                  startContent={hideIcons ? undefined : collection.icon}
                  onClick={() => handleCollectionClick(collection)}>
                  <span className='flex-1 text-left whitespace-normal break-words leading-tight'>
                    {t(`create:${collection.key}`, collection.key)}
                  </span>
                  {collection.count !== undefined && collection.count > 0 && (
                    <span
                      className={cn(
                        'ml-1 rounded-full flex-shrink-0',
                        hideIcons
                          ? 'text-[10px] px-1 py-0'
                          : 'text-xs px-1.5 py-0.5',
                        {
                          'bg-primary-200 text-primary-600': isActive,
                          'bg-muted text-muted-foreground': !isActive,
                        },
                      )}>
                      {collection.count}
                    </span>
                  )}
                </Button>
              );
            })}
        </div>
        {fanCollections.length > 0 && (
          <>
            <div
              className={cn(
                'mt-3 mb-1 font-semibold text-muted-foreground uppercase tracking-wider',
                hideIcons ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs',
              )}>
              {t('character:gallery.fanCollections', 'Fan Collections')}
            </div>
            <div>
              {fanCollections.map(collection => {
                const isActive = activeCollection === collection.id;

                return (
                  <Button
                    key={collection.id}
                    variant='light'
                    className={cn(
                      'w-full justify-start h-auto font-medium transition-all rounded-md items-center',
                      hideIcons
                        ? 'px-2 py-1.5 min-h-[32px] text-xs'
                        : 'px-3 py-2 min-h-[40px] text-sm',
                      {
                        'bg-primary-100 text-primary-700 hover:bg-primary-100':
                          isActive,
                        'text-foreground hover:bg-muted': !isActive,
                      },
                    )}
                    startContent={
                      hideIcons
                        ? undefined
                        : collection.icon || (
                            <MdCollections className='w-4 h-4' />
                          )
                    }
                    onClick={() => handleCollectionClick(collection)}>
                    <span className='flex-1 text-left whitespace-normal break-words leading-tight'>
                      {(() => {
                        // For user categories (my_characters, recent_characters, adopted_characters),
                        // use direct translation keys instead of create:worlds namespace
                        if (collection.key === 'my_characters') {
                          return t('create:my_characters');
                        }
                        if (collection.key === 'recent_characters') {
                          return t('create:recently_used');
                        }
                        if (collection.key === 'adopted_characters') {
                          return t('create:adopted_characters');
                        }

                        const translationKey = i18nKeyForCategory(
                          collection.key || collection.name,
                        );
                        const translated = t(translationKey);
                        // If translation returns the same as key (no translation found), use formatted name
                        if (
                          translated === translationKey ||
                          translated === collection.key
                        ) {
                          return collection.name
                            ? formatCategoryName(collection.name)
                            : collection.key;
                        }
                        return translated;
                      })()}
                    </span>
                    {collection.count !== undefined && collection.count > 0 && (
                      <span
                        className={cn(
                          'ml-1 rounded-full flex-shrink-0',
                          hideIcons
                            ? 'text-[10px] px-1 py-0'
                            : 'text-xs px-1.5 py-0.5',
                          {
                            'bg-primary-200 text-primary-600': isActive,
                            'bg-muted text-muted-foreground': !isActive,
                          },
                        )}>
                        {collection.count}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </>
        )}
        {onMoreClick && (
          <div className='mt-4 pt-4 border-t border-border'>
            <Button
              variant='bordered'
              className='w-full justify-center text-sm font-medium'
              startContent={<FaPlus className='w-3 h-3' />}
              onClick={onMoreClick}>
              {t('create:more', 'More')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Horizontal layout (mobile tabs)
  return (
    <div className={cn('flex overflow-x-auto gap-2 pb-2', className)}>
      {systemCollections
        .filter(collection => {
          // Hide collections that require auth when user is not authenticated
          if (collection.requireAuth && !isAuthenticated) {
            return false;
          }
          return true;
        })
        .map(collection => {
          const isActive = activeCollection === collection.id;

          return (
            <Button
              key={collection.id}
              size='sm'
              variant={isActive ? 'solid' : 'flat'}
              color={isActive ? 'primary' : 'default'}
              className='flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap'
              startContent={collection.icon}
              onClick={() => handleCollectionClick(collection)}>
              {t(`create:${collection.key}`, collection.key)}
              {collection.count !== undefined && collection.count > 0 && (
                <span className='ml-1 text-xs'>({collection.count})</span>
              )}
            </Button>
          );
        })}

      {/* Fan Collections in horizontal layout */}
      {fanCollections.map(collection => {
        const isActive = activeCollection === collection.id;

        return (
          <Button
            key={collection.id}
            size='sm'
            variant={isActive ? 'solid' : 'flat'}
            color={isActive ? 'primary' : 'default'}
            className='flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap'
            startContent={
              collection.icon || <MdCollections className='w-4 h-4' />
            }
            onClick={() => handleCollectionClick(collection)}>
            {(() => {
              // For user categories (my_characters, recent_characters, adopted_characters),
              // use direct translation keys instead of create:worlds namespace
              if (collection.key === 'my_characters') {
                return t('create:my_characters');
              }
              if (collection.key === 'recent_characters') {
                return t('create:recently_used');
              }
              if (collection.key === 'adopted_characters') {
                return t('create:adopted_characters');
              }

              const translationKey = i18nKeyForCategory(
                collection.key || collection.name,
              );
              const translated = t(translationKey);
              // If translation returns the same as key (no translation found), use formatted name
              if (
                translated === translationKey ||
                translated === collection.key
              ) {
                return collection.name
                  ? formatCategoryName(collection.name)
                  : collection.key;
              }
              return translated;
            })()}
          </Button>
        );
      })}

      {/* More Button in horizontal layout */}
      {onMoreClick && (
        <Button
          size='sm'
          variant='bordered'
          className='flex-shrink-0 px-4 py-2 text-sm font-medium'
          startContent={<FaPlus className='w-3 h-3' />}
          onClick={onMoreClick}>
          {t('create:more', 'More')}
        </Button>
      )}
    </div>
  );
};

export default CollectionNav;
