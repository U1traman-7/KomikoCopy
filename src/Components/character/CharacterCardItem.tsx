import React from 'react';
import { Card, CardBody, Image } from '@nextui-org/react';
import { FaCheck, FaHeart, FaUserCircle } from 'react-icons/fa';
import cn from 'classnames';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalizedField } from '../../utils/i18nText';

interface SingleCharacter {
  // New format (from characters.json and RightSidebar)
  name?: string; // Full name used in prompts (e.g., "Lumine (Genshin Impact)")
  simple_name?: string; // Display name (e.g., "Lumine")
  image?: string; // Local image path (e.g., "/images/characters/xxx.webp")

  // Database format
  character_uniqid?: string;
  character_name?: string;
  character_pfp?: string;
  alt_prompt?: string;
  num_collected?: number;
  id?: string | number; // Character ID for i18n lookup
}

interface CharacterCardItemProps {
  character: SingleCharacter;
  selected: boolean;
  onClick: (character: SingleCharacter) => void;
  compact?: boolean;
  mode?: 'selector' | 'gallery'; // 'selector' for RightSidebar, 'gallery' for All Characters page
  showId?: boolean; // Whether to show character ID below name
  priority?: boolean; // Whether to use eager loading for this image (for first few items)
  showCollectionCount?: boolean; // Whether to show collection count badge (default: true)
}

/**
 * CharacterCardItem - Grid-style character card component for RightSidebar CharacterSelector
 *
 * Features:
 * - Large card layout with character portrait
 * - Character name overlay at bottom
 * - Collection count badge at top-left
 * - Selected state with border highlight and check icon
 * - Hover effects with scale animation
 * - Mobile responsive layout
 *
 * @param character - Character data to display
 * @param selected - Whether the character is currently selected
 * @param onClick - Callback when the card is clicked
 * @param compact - Whether to use compact layout (for mobile)
 */
export const CharacterCardItem: React.FC<CharacterCardItemProps> = ({
  character,
  selected,
  onClick,
  compact = false,
  mode = 'selector',
  showId = true,
  priority = false,
  showCollectionCount = true,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const { i18n } = useTranslation();

  // 获取当前语言
  const currentLocale = i18n.language || 'en';

  React.useEffect(() => {
    setImageError(false);
  }, [
    character.character_uniqid,
    character.name,
    character.character_pfp,
    character.image,
  ]);

  // Support both new format (name) and old format (character_uniqid)
  const isNewCharacter =
    character.name === '@new_character' ||
    character.character_uniqid === 'new_character';

  // Get character display name with i18n support for official characters
  const fallbackName = character.simple_name || character.character_name || '';
  // 使用本地化名称（如果有 i18n 数据）
  const displayName =
    getLocalizedField(character, 'character_name', currentLocale) ||
    fallbackName;

  // Get character image (support both formats)
  // Priority: character_pfp (DB/Supabase) > image (static local path)
  const imageSrc = character.character_pfp || character.image || '';

  // // Get character ID (support both formats)
  // const characterId =
  //   character.name ||
  //   (character.character_uniqid ? `@${character.character_uniqid}` : '');

  // Special styling for "New Character" button
  if (isNewCharacter) {
    return (
      <div
        className={cn(
          'relative cursor-pointer transition-all duration-200 ease-in-out',
          'hover:scale-[1.02] active:scale-[0.98]',
          'w-full',
        )}
        onClick={() => onClick(character)}
        role='button'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(character);
          }
        }}>
        <Card className='w-full overflow-hidden border-1 border-dashed border-border hover:border-primary-400 bg-muted/50 hover:bg-primary-50/30'>
          <CardBody className='p-0'>
            <div
              className={cn(
                'relative w-full flex flex-col items-center justify-center gap-2',
                {
                  'aspect-[3/4]': !compact,
                  'aspect-[4/5]': compact,
                },
              )}>
              {/* Plus icon */}
              <div className='w-8 h-8 rounded-full bg-muted hover:bg-primary-100 flex items-center justify-center transition-colors'>
                <Plus className='w-6 h-6 text-muted-foreground' />
              </div>
              {/* Text */}
              <div className='text-xs text-muted-foreground font-medium md:text-sm text-center'>
                {displayName}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Regular character card
  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-200 ease-in-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        {
          'w-full': true,
        },
      )}
      onClick={() => onClick(character)}
      role='button'
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(character);
        }
      }}>
      <Card
        className={cn('w-full overflow-hidden', {
          'ring-2 ring-primary-500 ring-offset-1': selected,
        })}>
        <CardBody className='p-0 relative'>
          {/* Character Image Container */}
          <div
            className={cn('relative w-full overflow-hidden bg-muted', {
              'aspect-[3/4]': !compact,
              'aspect-[4/5]': compact,
            })}>
            {imageSrc && !imageError ? (
              <img
                src={imageSrc}
                alt={displayName}
                className='w-full h-full object-cover object-top'
                loading={priority ? 'eager' : 'lazy'}
                onError={() => {
                  setImageError(true);
                }}
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center'>
                <FaUserCircle className='w-1/2 h-1/2 text-muted-foreground' />
              </div>
            )}

            {/* Collection count badge (top-left corner) */}
            {showCollectionCount && (
              <div className='absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 z-10 pointer-events-none'>
                <FaHeart className='w-2.5 h-2.5 text-red-400' />
                <span className='text-white text-[10px] font-medium'>
                  {character.num_collected !== undefined
                    ? character.num_collected + 1
                    : 1}
                </span>
              </div>
            )}

            {/* Selected checkmark (top-right corner) */}
            {selected && (
              <>
                <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600 rounded-bl-full flex items-center justify-center z-10 pointer-events-none'>
                  <FaCheck className='-mt-1 ml-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white' />
                </div>
                <span className='sm:hidden absolute left-1 top-1.5 text-[10px] font-medium text-primary-600 bg-card/90 rounded px-1 py-[1px] pointer-events-none'>
                  Selected
                </span>
              </>
            )}

            {/* Character name overlay (bottom) */}
            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-10 pb-1.5 px-2.5 z-10'>
              <div
                className={cn(
                  'text-white leading-tight line-clamp-2 drop-shadow-md',
                  {
                    // Gallery mode (for /characters page): larger, bold, centered
                    'font-bold text-sm text-center': mode === 'gallery',
                    // Selector mode (for RightSidebar): original style
                    'font-medium text-xs': mode === 'selector',
                  },
                )}>
                {displayName}
              </div>
              {/* {showId && characterId && character.name?.startsWith('@') && (
                <div className='text-white/90 text-[10px] font-mono truncate mt-0.5 drop-shadow-md'>
                  {characterId}
                </div>
              )} */}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CharacterCardItem;
