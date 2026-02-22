import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Listbox, ListboxItem, Chip, Spinner } from '@nextui-org/react';
import cn from 'classnames';
import type { Character } from '../hooks/useCharacterMention';
import { useTranslation } from 'react-i18next';
interface MentionDropdownProps {
  show: boolean;
  position: { top: number; left: number; showBelow?: boolean } | null;
  loading: boolean;
  characters: Character[];
  dropdownRef: React.RefObject<HTMLDivElement>;
  onSelect: (character: Character) => void;
  onClose?: () => void;
}

export const MentionDropdown = memo(
  ({
    show,
    position,
    loading,
    characters,
    dropdownRef,
    onSelect,
    onClose,
  }: MentionDropdownProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const { t } = useTranslation('character');
    // Reset selected index when characters change
    useEffect(() => {
      setSelectedIndex(0);
      itemRefs.current = [];
    }, [characters]);

    // Auto scroll to selected item
    useEffect(() => {
      if (itemRefs.current[selectedIndex]) {
        itemRefs.current[selectedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, [selectedIndex]);

    // Handle keyboard navigation
    useEffect(() => {
      if (!show) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < characters.length - 1 ? prev + 1 : prev,
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (characters[selectedIndex]) {
            onSelect(characters[selectedIndex]);
            onClose?.();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose?.();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, characters, selectedIndex, onSelect, onClose]);

    // Close dropdown on page scroll
    useEffect(() => {
      if (!show) return;

      const handleScroll = (e: Event) => {
        // 检查滚动事件是否来自 dropdown 内部
        const path = e.composedPath();
        if (dropdownRef.current && path.includes(dropdownRef.current)) {
          return; // dropdown 内部滚动，不关闭
        }
        onClose?.();
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }, [show, onClose, dropdownRef]);

    if (!show || !position || typeof window === 'undefined') {
      return null;
    }

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: position.showBelow ? 'none' : 'translateY(0)',
          zIndex: 9999,
          scrollbarWidth: 'thin',
          scrollbarColor: '#9ca3af #f3f4f6',
        }}
        className='w-72 max-h-64 overflow-y-scroll bg-card border border-border rounded-lg shadow-xl [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:block [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50'>
        {loading ? (
          <div className='flex justify-center items-center p-3'>
            <Spinner size='sm' />
          </div>
        ) : characters.length > 0 ? (
          <Listbox
            aria-label='Character selection'
            onAction={key => {
              const character = characters.find(
                c => c.character_uniqid === key,
              );
              if (character) {
                onSelect(character);
                onClose?.();
              }
            }}>
            {characters.map((character, index) => (
              <ListboxItem
                key={character.character_uniqid}
                textValue={character.character_name}
                className={cn(
                  'hover:bg-muted transition-colors',
                  index === selectedIndex &&
                    'bg-primary-50 dark:bg-primary-900/20',
                )}>
                <div
                  ref={el => {
                    itemRefs.current[index] = el;
                  }}
                  className='flex items-center gap-2 py-1'>
                  <div className='relative'>
                    <Avatar
                      src={character.character_pfp}
                      size='sm'
                      className='flex-shrink-0 [&>img]:object-cover [&>img]:object-top'
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1 mb-0.5'>
                      <span className='font-semibold text-xs truncate text-foreground'>
                        {character.character_name}
                      </span>
                      {character.is_collected && !character.is_owned && (
                        <Chip
                          size='sm'
                          variant='flat'
                          color='primary'
                          className='text-[9px] h-3.5 px-1'>
                          {t('collected')}
                        </Chip>
                      )}
                    </div>
                    <div className='text-[10px] text-muted-foreground truncate font-mono'>
                      @{character.character_uniqid}
                    </div>
                  </div>
                  {character.num_collected !== undefined &&
                    character.num_collected !== null &&
                    character.num_collected > 0 && (
                      <Chip
                        size='sm'
                        variant='flat'
                        color='default'
                        className='text-[10px] h-5'>
                        {(character.num_collected || 0) + 1}{' '}
                        {(character.num_collected || 0) + 1 === 1
                          ? 'adopter'
                          : 'adopters'}
                      </Chip>
                    )}
                </div>
              </ListboxItem>
            ))}
          </Listbox>
        ) : (
          <div className='p-3 text-center text-muted-foreground text-xs'>
            {t('noCharactersFound')}
          </div>
        )}
      </div>,
      document.body,
    );
  },
);

MentionDropdown.displayName = 'MentionDropdown';
