import { Tabs, Tab, Image } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo, Key } from 'react';
import { useAtomValue } from 'jotai';
import { authAtom } from '../../state';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import rawCharactersData from '../../assets/characters.json';
import { useOwnedCharacters } from '../../hooks/useOwnedCharacters';
import {
  formatCategoryName,
  normalizeCategoryToKey,
  i18nKeyForCategory,
} from '../../utils/characterNameUtils';

interface SingleCharacter {
  name: string;
  simple_name: string; // Display name (e.g., "Lumine")
  image: string; // Image path (local or Supabase URL)
}

interface CharacterData {
  world: string;
  key: string;
  characters: SingleCharacter[];
}

interface ClassNameProps {
  classNames?: {
    characterTab?: string;
    characterTabItem?: string;
  };
  className?: string;
}

interface CharactersSelectorProps extends ClassNameProps {
  prompt?: string;
  setPrompt?: (newPrompt: string) => void;
  useDb?: boolean;
  setCharacter?: (character: SingleCharacter) => void;
  children?: React.ReactNode;
  model?: string;
  isCreatePage?: boolean;
}

// Convert character name to ID format
// e.g., "Lumine (Genshin Impact)" -> "Lumine_(Genshin_Impact)"
// e.g., "Hu Tao (Genshin Impact)" -> "Hu_Tao_(Genshin_Impact)"
const convertNameToId = (name: string) => {
  return name.replace(/\s+/g, '_').replace(/[()]/g, '');
};

// Convert character to prompt format with @ prefix
// e.g., "Lumine (Genshin Impact)" -> "@Lumine_(Genshin_Impact)"
const getCharacterPromptName = (char: SingleCharacter) => {
  // For user-created characters, use the name as-is (already has @ prefix)
  if (char.name?.startsWith('@')) {
    return char.name;
  }
  // For official characters, convert name to ID format and add @ prefix
  return '@' + convertNameToId(char.name || '');
};

const makeCharRegex = (char: SingleCharacter | string) => {
  if (typeof char === 'string') {
    return char.replace(/[.*+?^${}()|[\]\\<>]/g, '\\$&');
  } else {
    // Use the character's prompt name (with @ prefix and ID format)
    const promptName = getCharacterPromptName(char);
    return promptName.replace(/[.*+?^${}()|[\]\\<>]/g, '\\$&');
  }
};

export const CharactersSelector: React.FC<CharactersSelectorProps> = ({
  prompt = '',
  setPrompt,
  useDb = true,
  setCharacter,
  classNames,
  children,
  model,
  isCreatePage,
}) => {
  const { t } = useTranslation(['create', 'character']);
  const router = useRouter();
  const [world, setWorld] = useState('Genshin Impact');
  const isAuth = useAtomValue(authAtom);
  const [isMobile, setIsMobile] = useState(false);

  // Use cached owned characters instead of fetching every time
  const { characters: ownedCharacters } = useOwnedCharacters();

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const characters = useMemo(() => {
    if (typeof window === 'undefined') {
      // Default to all characters during SSR
      return rawCharactersData;
    }

    const language = navigator.language;
    if (language.startsWith('ja')) {
      // 日文只显示General
      return [rawCharactersData[0]];
    } else {
      return rawCharactersData;
    }
  }, []);

  const [charactersData, setCharactersData] = useState<CharacterData[]>(
    useDb ? [] : characters,
  );

  // Add effect to handle model changes
  useEffect(() => {
    if (
      model === 'Animagine' ||
      model === 'Noobai' ||
      model === 'Illustrious'
    ) {
      if (world === t('my_characters')) {
        setWorld('General');
      }
      // Filter out My Characters from charactersData
      setCharactersData(prevData =>
        prevData.filter(data => data.key !== 'my_characters'),
      );
    }
  }, [model, world, t]);

  useEffect(() => {
    (async () => {
      if (useDb) {
        const charactersData: CharacterData[] = [];
        // Get all official characters, sorted by popularity, limited to 100
        const res = await fetch('/api/characters?official=true&limit=100')
          .then(res => res.json())
          .catch();
        if (res.error) {
          console.error('[common/CharactersSelector] API error:', res.error);
          return;
        }
        const { data: charData } = res;

        for (const char of charData!) {
          const world = char.category;
          const character: SingleCharacter = {
            name: `@${char.character_uniqid}`,
            simple_name: char.character_name,
            image: char.character_pfp,
          };

          // Insert character into the corresponding world in charactersData
          const worldIndex = charactersData.findIndex(
            worldData => worldData.world === world,
          );
          if (worldIndex === -1) {
            charactersData.push({
              world,
              key: normalizeCategoryToKey(world),
              characters: [character],
            });
          } else {
            charactersData[worldIndex].characters.push(character);
          }
        }
        setCharactersData(charactersData);
      } else {
        // Use cached owned characters instead of fetching
        // Transform Character[] to SingleCharacter[] format
        const charDataFilter: SingleCharacter[] =
          ownedCharacters.length > 0
            ? ownedCharacters.map(char => ({
                name: `@${char.character_uniqid}`,
                simple_name: char.character_name,
                image: char.character_pfp,
              }))
            : [];
        const myCharactersData = {
          world: t('my_characters'),
          key: 'my_characters',
          characters: [
            {
              name: '@new_character',
              simple_name: t('character:new_character'),
              image: '/images/new_character.webp',
            },
          ].concat(charDataFilter),
        };

        // Only add My Characters tab if model is not Animagine or Noobai
        if (
          model === 'Animagine' ||
          model === 'Noobai' ||
          model === 'Illustrious'
        ) {
          setCharactersData(charactersData);
        } else {
          // Check if My Characters already exists before adding
          const hasMyCharacters = charactersData.some(
            data => data.key === 'my_characters',
          );
          const index = charactersData.findIndex(
            data => data.key === 'my_characters',
          );

          if (!hasMyCharacters) {
            setCharactersData([myCharactersData].concat(charactersData));
          } else {
            if (index >= 0) {
              const found = charactersData[index];
              if (found.characters.filter(c => c.image).length === 1) {
                found.characters.push(...charDataFilter);
              }
              setCharactersData([...charactersData]);
            }
          }
        }
      }
    })();
  }, [model, isAuth, useDb, setCharactersData, ownedCharacters]);

  // Filter out My Characters tab when rendering if model is Animagine or Noobai
  const filteredCharactersData =
    model === 'Animagine' || model === 'Noobai' || model === 'Illustrious'
      ? charactersData.filter(data => data.key !== 'my_characters')
      : charactersData;

  return (
    <div
      className={cn(
        'flex max-w-full',
        isMobile
          ? 'max-h-[40vh]'
          : isCreatePage
            ? 'max-h-[49vh]'
            : 'max-h-[70vh]',
      )}>
      <Tabs
        fullWidth={false}
        aria-label='Character Worlds'
        size='sm'
        placement='start'
        variant='light'
        color='default'
        className={cn(
          'overflow-y-auto overflow-x-hidden flex-shrink-0 h-full',
          isMobile ? 'max-w-20' : 'max-w-24',
          classNames?.characterTab,
        )}
        classNames={{
          tab: cn(
            'rounded-lg transition-all duration-200 hover:bg-muted',
            isMobile ? 'py-1 px-2 h-auto' : 'py-2 px-1 h-auto',
          ),
          tabContent: cn(
            'group-data-[selected=true]:text-foreground font-medium ',
            isMobile ? 'text-xs' : 'text-sm',
          ),
          cursor: 'bg-muted shadow-none grid place-items-center',
          panel: cn(
            'max-w-full pr-0 h-full',
            isMobile ? 'pl-2 pt-2' : 'pl-3 px-0',
          ),
          tabList: cn('border-r border-border rounded-r-none p-0  h-full'),
        }}
        onSelectionChange={(key: Key) => {
          setWorld(key as string);
        }}
        selectedKey={world}>
        {filteredCharactersData.map((world, index) => (
          <Tab
            key={index + world.world}
            title={
              <div className='flex items-center w-full text-left'>
                <span
                  className={cn(
                    'whitespace-normal break-words text-center leading-tight transition-all group-data-[selected=true]:font-medium text-xs',
                  )}>
                  {(() => {
                    // For user categories (my_characters, recent_characters, adopted_characters),
                    // use direct translation keys instead of create:worlds namespace
                    if (world.key === 'my_characters') {
                      return t('my_characters');
                    }
                    if (world.key === 'recent_characters') {
                      return t('recently_used');
                    }
                    if (world.key === 'adopted_characters') {
                      return t('adopted_characters');
                    }

                    // For other categories, use the worlds namespace
                    const translationKey = i18nKeyForCategory(world.key);
                    const translated = t(translationKey);
                    // If translation returns the same as key (no translation found), use formatted name
                    if (
                      translated === translationKey ||
                      translated === world.key
                    ) {
                      return formatCategoryName(world.world);
                    }
                    return translated;
                  })()}
                </span>
              </div>
            }
            className='m-0'
            style={{
              marginBottom:
                index === filteredCharactersData.length - 1 ? '50px' : '0px',
            }}>
            <div
              className={cn(
                'mt-0 flex flex-wrap justify-start content-start gap-1 overflow-y-auto w-full overflow-x-hidden pr-1 pb-4 custom-scrollbar max-h-full px-3',
                classNames?.characterTabItem,
              )}>
              {world.characters.map((character: SingleCharacter) => {
                // Get the prompt name with @ prefix and ID format
                const characterPromptName = getCharacterPromptName(character);
                const charRegex = new RegExp(
                  `(^|\\s|,)${makeCharRegex(character)}(\\s|,|$)`,
                  'i',
                );
                const included = charRegex.test(prompt);
                // Use character.image or fallback to constructed local path
                let imagePath = character.image;
                if (imagePath === '') {
                  const safeCharacterName = character.name.replace('/', '-');
                  imagePath = `/images/characters/${world.world}/${safeCharacterName}.webp`;
                }

                return (
                  <div
                    key={character.name}
                    className='flex flex-col items-center m-0.5 mb-2 cursor-pointer'
                    onClick={() => {
                      if (character.name !== '@new_character') {
                        if (!included) {
                          const reg = /,\s*$/;
                          const newPrompt =
                            prompt.replace(reg, '') +
                            ', ' +
                            characterPromptName;
                          setPrompt &&
                            setPrompt(newPrompt.replace(/^,\s*/, ''));
                          setCharacter && setCharacter(character);
                        } else {
                          // Simple approach: remove the character name and clean up commas
                          let newPrompt = prompt.replace(
                            new RegExp(makeCharRegex(character), 'g'),
                            '',
                          );
                          // Clean up multiple commas and spaces
                          newPrompt = newPrompt
                            .replace(/\s*,\s*,\s*/g, ', ')
                            .replace(/^\s*,\s*/, '')
                            .replace(/\s*,\s*$/, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                          setPrompt && setPrompt(newPrompt);
                        }
                      } else {
                        router.push('/oc-maker');
                      }
                    }}>
                    <div
                      className={cn(
                        'relative w-[55px] h-[55px] rounded-full overflow-hidden',
                      )}>
                      <div
                        className={
                          included
                            ? 'absolute inset-0 rounded-full opacity-50 pointer-events-none bg-primary-400 z-[100]'
                            : 'absolute inset-0 rounded-full opacity-0 transition-opacity duration-200 pointer-events-none bg-primary-400 z-[100] character-hover:opacity-30'
                        }></div>
                      <Image
                        src={imagePath}
                        className='w-full h-full object-cover z-[1] transition-transform duration-200 character-hover:scale-105'
                        style={
                          imagePath.startsWith('/images/characters/')
                            ? {
                                aspectRatio: '1/1',
                                transform: 'scale(1.6)',
                                transformOrigin: 'center top',
                                objectPosition: 'center top',
                              }
                            : {
                                aspectRatio: '1/1',
                                transform: 'scale(1.4)',
                                transformOrigin: 'center top',
                                objectPosition: 'center top',
                              }
                        }
                        draggable={false}
                      />
                    </div>
                    <div
                      className={cn(
                        'overflow-hidden mt-1 text-sm text-center truncate whitespace-nowrap text-ellipsis mobile-character-name w-[65px]',
                        isMobile ? 'text-xs' : 'text-sm',
                      )}>
                      {character.simple_name}
                    </div>
                  </div>
                );
              })}
            </div>
          </Tab>
        ))}
      </Tabs>
      {children}
    </div>
  );
};

export default CharactersSelector;
