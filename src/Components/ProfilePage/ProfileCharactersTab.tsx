import React, { useState } from 'react';
import { Tabs, Tab, Card } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { useCharacters } from '../../hooks/useCharacters';
import { CharacterGrid } from '../character/CharacterGrid';
import { CharacterCardItem } from '../character/CharacterCardItem';
import { Character } from '../../state';
import { getCharacterImageUrl } from '../../utils/characterNameUtils';

/**
 * ProfileCharactersTab - Characters tab for user profile
 * Shows My Characters and Adopted Characters with toggle
 */
export const ProfileCharactersTab: React.FC = () => {
  const { t } = useTranslation(['profile', 'character']);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'adopted'>('my');

  // Fetch characters based on active tab
  const {
    characters: myCharacters,
    loading: myLoading,
    error: myError,
  } = useCharacters({
    collection: 'my',
    enabled: activeTab === 'my',
  });

  const {
    characters: adoptedCharacters,
    loading: adoptedLoading,
    error: adoptedError,
  } = useCharacters({
    collection: 'adopted',
    enabled: activeTab === 'adopted',
  });

  const characters = activeTab === 'my' ? myCharacters : adoptedCharacters;
  const loading = activeTab === 'my' ? myLoading : adoptedLoading;
  const error = activeTab === 'my' ? myError : adoptedError;

  const emptyMessage =
    activeTab === 'my'
      ? t('character:gallery.emptyMyCharacters')
      : t('character:gallery.emptyAdoptedCharacters');

  const handleCharacterClick = (character: Character) => {
    router.push(`/character/${character.character_uniqid}`);
  };

  const renderCard = (character: Character) => {
    const charAny = character as any;
    const imagePath = getCharacterImageUrl(character);

    return (
      <CharacterCardItem
        character={
          {
            ...character,
            name: charAny.alt_prompt || character.character_name || '',
            simple_name: character.character_name || '',
            image: imagePath,
            character_pfp: imagePath,
          } as any
        }
        mode='gallery'
        selected={false}
        onClick={() => handleCharacterClick(character)}
      />
    );
  };

  return (
    <div className='w-full'>
      {/* Sub-tabs for My/Adopted */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={key => setActiveTab(key as 'my' | 'adopted')}
        aria-label='Character collections'
        variant='light'
        size='sm'
        radius='full'
        classNames={{
          tabList: 'inline-flex bg-default-100 rounded-full p-1 gap-1 bg-transparent',
          tabContent:
            'text-xs md:text-sm font-medium text-muted-foreground group-data-[selected=true]:font-bold group-data-[selected=true]:text-foreground',
          panel: 'py-0 px-1',
        }}>
        <Tab
          key='my'
          title={
            <div className='flex items-center space-x-2'>
              <span>{t('myCharacters')}</span>
            </div>
          }
        />
        <Tab
          key='adopted'
          title={
            <div className='flex items-center space-x-2'>
              <span>{t('adoptedCharacters')}</span>
            </div>
          }
        />
      </Tabs>

      {/* Character Grid */}
      <div className='px-1 pt-2'>
        <CharacterGrid
          characters={characters}
          loading={loading}
          emptyMessage={emptyMessage}
          renderCard={renderCard}
          onCharacterClick={handleCharacterClick}
          enablePrefetch={true}
        />
      </div>

      {error && (
        <div className='text-center py-8 text-red-500'>{t('common:error')}</div>
      )}
    </div>
  );
};
