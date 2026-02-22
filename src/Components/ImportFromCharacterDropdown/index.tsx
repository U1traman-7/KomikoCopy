import React, { useState, useEffect } from 'react';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Avatar,
} from '@nextui-org/react';
import { MdPersonAdd } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { authAtom } from 'state';

export interface CharacterData {
  character_uniqid: string;
  character_name?: string;
  character_pfp?: string;
  profession?: string;
  intro?: string;
  character_description?: string;
  [key: string]: any; // Allow additional fields from API
}

interface ImportFromCharacterDropdownProps {
  onSelect: (character: CharacterData) => void;
  /** Pre-fetched characters list. If not provided, will fetch internally */
  characters?: CharacterData[];
  /** Whether to fetch full character data (including intro, profession) */
  fetchFullData?: boolean;
  className?: string;
}

export function ImportFromCharacterDropdown({
  onSelect,
  characters: externalCharacters,
  fetchFullData = false,
  className,
}: ImportFromCharacterDropdownProps) {
  const { t } = useTranslation('image-animation-generator');
  const isAuth = useAtomValue(authAtom);
  const [ownedCharacters, setOwnedCharacters] = useState<CharacterData[]>([]);

  // Fetch owned characters if not provided externally
  useEffect(() => {
    if (externalCharacters) {
      setOwnedCharacters(externalCharacters);
      return;
    }

    const fetchOwnedCharacters = async () => {
      if (!isAuth) {
        return;
      }

      try {
        const fields = fetchFullData ? 'full' : 'basic';
        const response = await fetch(
          `/api/getOwnedCharacters?fields=${fields}`,
        );
        if (response.ok) {
          const data = await response.json();
          setOwnedCharacters(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch owned characters:', error);
      }
    };

    fetchOwnedCharacters();
  }, [isAuth, externalCharacters, fetchFullData]);

  // Transform character image URL with Supabase transformations for compression
  const getCompressedImageUrl = (originalUrl?: string) => {
    if (!originalUrl) {
      return originalUrl;
    }

    try {
      // Check if it's a Supabase Storage URL
      const url = new URL(originalUrl);
      if (
        url.hostname.includes('supabase') &&
        url.pathname.includes('/storage/')
      ) {
        // Add transform parameters for compression
        url.searchParams.set('width', '128');
        url.searchParams.set('quality', '75');
        return url.toString();
      }
    } catch (e) {
      // Invalid URL, return original
      return originalUrl;
    }

    return originalUrl;
  };

  // Always show button, but handle empty state
  const hasCharacters = isAuth && ownedCharacters.length > 0;

  return (
    <Dropdown
      classNames={{
        content: 'max-h-[400px] overflow-y-auto',
      }}>
      <DropdownTrigger>
        <Button
          size='sm'
          variant='flat'
          className={className}
          isDisabled={!hasCharacters}
          classNames={{
            base: 'dark:bg-muted dark:hover:bg-muted/80',
          }}
          startContent={<MdPersonAdd className='w-4 h-4 text-foreground' />}>
          <span className='text-foreground'>{t('ui.importFromCharacter')}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label='Select character'
        itemClasses={{
          base: 'gap-2',
        }}
        onAction={key => {
          const char = ownedCharacters.find(c => c.character_uniqid === key);
          if (char) {
            onSelect(char);
          }
        }}>
        {ownedCharacters.map(char => (
          <DropdownItem
            key={char.character_uniqid}
            startContent={
              <div className='w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-muted'>
                <img
                  src={getCompressedImageUrl(char.character_pfp)}
                  alt={char.character_name}
                  className='w-full h-full object-cover object-[center_20%]'
                  loading='lazy'
                />
              </div>
            }>
            {char.character_name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

export default ImportFromCharacterDropdown;
