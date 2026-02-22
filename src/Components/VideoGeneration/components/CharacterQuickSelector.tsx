import { memo } from 'react';
import { FaPlus, FaCheck } from 'react-icons/fa';
import { Avatar } from '@nextui-org/react';
import cn from 'classnames';
import type { Character } from '../hooks/useCharacterMention';

interface CharacterQuickSelectorProps {
  characters: Character[];
  isCharacterMentioned: (id: string) => boolean;
  onCharacterClick: (character: Character) => void;
  onAddNewClick: () => void;
  t: any;
}

export const CharacterQuickSelector = memo(({
  characters,
  isCharacterMentioned,
  onCharacterClick,
  onAddNewClick,
  t,
}: CharacterQuickSelectorProps) => {
  return (
    <div className='mt-4'>
      <div className='flex justify-between items-center mb-2'>
        <label className='text-sm font-medium text-foreground'>
          {t('ui.input.addOC')}
        </label>
      </div>
      <div className='flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary-200 [&::-webkit-scrollbar-track]:bg-muted'>
        {/* Add OC button */}
        <div
          onClick={onAddNewClick}
          className='flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 w-16 hover:opacity-80 transition-all'>
          <div className='relative'>
            <div className='w-14 h-14 border-2 border-dashed border-border rounded-full flex items-center justify-center bg-muted hover:bg-muted hover:border-muted-foreground transition-all'>
              <FaPlus className='w-6 h-6 text-muted-foreground' />
            </div>
          </div>
          <span className='text-xs text-center truncate w-full text-muted-foreground font-medium'>
            {t('ui.input.addNew', 'Add New')}
          </span>
        </div>

        {/* Existing characters */}
        {characters.slice(0, 10).map(character => {
          const isSelected = isCharacterMentioned(character.character_uniqid);
          return (
            <div
              key={character.character_uniqid}
              onClick={() => onCharacterClick(character)}
              className='flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 w-16 hover:opacity-80 transition-all'>
              <div className='relative'>
                <Avatar
                  src={character.character_pfp}
                  imgProps={{ draggable: false }}
                  className={cn(
                    'w-14 h-14 border-2 transition-all [&>img]:object-top [&>img]:object-cover',
                    isSelected
                      ? 'border-primary-500'
                      : 'border-transparent hover:border-primary-500',
                  )}
                />
                {isSelected && (
                  <div className='absolute -bottom-0.5 -right-0.5 w-4 h-4 p-1 bg-primary-500 rounded-full flex items-center justify-center border border-white'>
                    <FaCheck className='text-white text-[8px]' />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  'text-xs text-center truncate w-full transition-colors',
                  isSelected
                    ? 'text-primary-600 font-semibold'
                    : 'text-foreground',
                )}>
                {character.character_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CharacterQuickSelector.displayName = 'CharacterQuickSelector';

