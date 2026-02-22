import React, { useState, useEffect } from 'react';
import { Spinner } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { CharacterGrid } from '../character/CharacterGrid';
import { CharacterCardItem } from '../character/CharacterCardItem';
import { Character } from '../../state';
import { getCharacterImageUrl } from '../../utils/characterNameUtils';

interface PublicUserCharactersProps {
  userUniqid: string;
  nsfwMode?: boolean;
}

/**
 * PublicUserCharacters - Shows public characters for a specific user
 */
export const PublicUserCharacters: React.FC<PublicUserCharactersProps> = ({
  userUniqid,
  nsfwMode = false,
}) => {
  const { t } = useTranslation(['user', 'character', 'common']);
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const modeParam = nsfwMode ? '&mode=nsfw' : '';
        const response = await fetch(
          `/api/characters?user_uniqid=${userUniqid}${modeParam}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch characters');
        }

        const result = await response.json();
        // API returns { code: 1, message: 'success', data: { characters: [...], total: 2 } }
        const data = result.data || result;
        setCharacters(data.characters || []);
      } catch (err) {
        console.error('Error fetching user characters:', err);
        setError('Failed to load characters');
      } finally {
        setLoading(false);
      }
    };

    if (userUniqid) {
      fetchCharacters();
    }
  }, [userUniqid, nsfwMode]);

  const handleCharacterClick = (character: Character) => {
    router.push(`/character/${character.character_uniqid}`);
  };

  const renderCard = (character: Character) => {
    const imagePath = getCharacterImageUrl(character);

    return (
      <CharacterCardItem
        character={{
          name: character.alt_prompt || character.character_name || '',
          simple_name: character.character_name || '',
          image: imagePath,
          character_pfp: imagePath,
          character_uniqid: character.character_uniqid,
          character_name: character.character_name,
          alt_prompt: character.alt_prompt,
          num_collected: character.num_collected,
          id: character.id,
        }}
        mode='gallery'
        selected={false}
        onClick={() => handleCharacterClick(character)}
      />
    );
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center py-20'>
        <Spinner size='lg' color='default' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <p className='text-muted-foreground'>{error}</p>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <CharacterGrid
        characters={characters}
        loading={loading}
        emptyMessage={t('user:noPublicCharactersYet')}
        renderCard={renderCard}
        onCharacterClick={handleCharacterClick}
        enablePrefetch={true}
        className='p-1'
      />
    </div>
  );
};

