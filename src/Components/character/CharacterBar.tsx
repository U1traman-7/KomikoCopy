import {
  Modal,
  ModalContent,
  useDisclosure,
  Spinner,
  Image,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import { authAtom, profileAtom } from '../../state';
import { useTranslation } from 'react-i18next';
import { CharactersSelector } from '../common/CharactersSelector';
import { getCharacterProfile } from '../../utilities';
import { useOwnedCharacters } from '../../hooks/useOwnedCharacters';

interface CharacterBarProps {
  selectedCharName: string;
  setSelectedCharName: (name: string) => void;
  allCharData: any[];
  setAllCharData: (data: any[]) => void;
  charData: any;
  setCharData: (data: any) => void;
  defaultCharIds?: string[];
  initialCharData?: any;
}

export const CharacterBar: React.FC<CharacterBarProps> = ({
  selectedCharName,
  setSelectedCharName,
  allCharData,
  setAllCharData,
  charData,
  setCharData,
  defaultCharIds,
  initialCharData,
}) => {
  const { t } = useTranslation('character');
  const router = useRouter();
  const { character_id } = router.query;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);

  // Use cached owned characters
  const { characters: ownedCharacters } = useOwnedCharacters();

  const setCustomCharacter = (character: any) => {
    setSelectedCharName(character.alt_prompt ?? charData.character_name);
    setCharData(character);
    if (
      !allCharData.some(
        char => char.character_uniqid == character.character_uniqid,
      )
    ) {
      setAllCharData([...allCharData, character]);
    }
  };

  useEffect(() => {
    (async () => {
      if (character_id !== null && character_id !== undefined) {
        let customChars: any[] = [];

        // 特殊处理 character_id 为 "1" 的情况 - 这是用户所有 character 的入口
        const isListAllCharacters = character_id === '1';
        if (
          !isListAllCharacters &&
          charData.character_uniqid === character_id &&
          allCharData.length > 0
        ) {
          return;
        }

        // 如果不是列出所有角色的情况，则先获取当前角色
        if (!isListAllCharacters && character_id !== '') {
          let character;
          if (
            initialCharData &&
            initialCharData.character_name !== 'Character not found'
          ) {
            character = initialCharData;
          } else {
            const characters = await getCharacterProfile([
              character_id as string,
            ]);
            character = characters[0];
          }
          if (character) {
            // 检查如果character与charData不同才更新
            if (charData.character_uniqid !== character.character_uniqid) {
              setCustomCharacter(character);
            }
            customChars.push(character);
          }
        }

        // 获取所有角色 - 当角色列表为空或是 character_id 为 "1" 时
        if (allCharData.length === 0 || isListAllCharacters) {
          try {
            setIsLoading(true);
            // Use cached owned characters instead of fetching
            let allCharResults =
              ownedCharacters.length > 0 ? ownedCharacters : [];

            // If no cached data and we have default char IDs, fetch them
            if (allCharResults.length === 0 && defaultCharIds) {
              const characters = await getCharacterProfile(defaultCharIds);
              allCharResults = characters;
            }

            // 对于 character_id 为 "1" 的情况，显示第一个角色
            if (isListAllCharacters && allCharResults.length > 0) {
              // 选择第一个角色
              const firstCharacter = allCharResults[0];
              setCharData(firstCharacter);
              // 更新URL但不触发页面刷新
              router.replace(
                `/character/${firstCharacter.character_uniqid}`,
                undefined,
                { shallow: true },
              );
            }
            // 如果当前没有指定角色但有结果，选择第一个
            else if (allCharResults.length > 0 && customChars.length == 0) {
              setCharData(allCharResults[0]);
            }

            // push customChars that are not in allCharResults to allCharResults
            customChars.forEach((char: any) => {
              if (
                !allCharResults.some(
                  (char2: any) =>
                    char2.character_uniqid == char.character_uniqid,
                )
              ) {
                allCharResults.push(char);
              }
            });

            setAllCharData(allCharResults);
            setIsLoading(false);
          } catch (error) {
            console.error('获取角色数据失败:', error);
            setIsLoading(false);
          }
        }
      }
    })();
  }, [character_id, isAuth]);

  return (
    <div className='max-w-[100%] overflow-x-auto h-full min-h-[72px]'>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className='min-h-[330px] overflow-x-hidden'>
          <CharactersSelector
            prompt={selectedCharName}
            useDb={true}
            setCharacter={setCustomCharacter}
          />
        </ModalContent>
      </Modal>
      <div
        className='flex overflow-x-scroll gap-1 pb-1 w-full h-full bg-transparent space-between
                [&::-webkit-scrollbar]:h-1
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-primary-200
                dark:[&::-webkit-scrollbar-thumb]:bg-primary-700
                [&::-webkit-scrollbar-track]:bg-muted
                [scrollbar-width:thin]
                [scrollbar-color:hsl(var(--primary))_hsl(var(--muted))]
                [-webkit-overflow-scrolling:touch]
                [overflow-x-visibility:visible]
                [&::-webkit-scrollbar]:opacity-100'>
        <div
          key='add new character'
          className='flex flex-col items-center cursor-pointer'
          onClick={() => router.push('/oc-maker')}>
          <div className='relative mt-1 mb-2 w-[60px] h-[60px]'>
            <Image
              src='/images/new_character.webp'
              className='object-cover object-top w-full h-full rounded-full'
              style={{ aspectRatio: '1/1' }}
              draggable={false}
            />
          </div>
        </div>
        {isLoading ? (
          <div className='flex justify-center items-center p-4'>
            <Spinner size='sm' color='default' />
          </div>
        ) : (
          allCharData &&
          allCharData.length > 0 &&
          allCharData.map((character: any) => (
            <div
              key={character.character_uniqid}
              className='flex flex-col items-center cursor-pointer'
              onClick={() => {
                setCharData(character);

                router.replace(
                  `/character/${character.character_uniqid}`,
                  undefined,
                  { shallow: true },
                );
              }}>
              <div className='relative mt-1 mb-2 w-[60px] h-[60px]'>
                <div
                  className={
                    charData.character_uniqid === character.character_uniqid
                      ? `border-2 absolute inset-0 rounded-full z-[10] pointer-events-none ${
                          isAuth && profile.authUserId === character.authUserId
                            ? 'border-primary'
                            : 'border-cyan-400'
                        }`
                      : `absolute inset-0 rounded-full z-[10] pointer-events-none bg-muted-foreground opacity-20 hover:opacity-30`
                  }></div>
                <Image
                  src={character.character_pfp}
                  className='w-full h-full rounded-full z-[1] object-cover object-top'
                  style={{ aspectRatio: '1/1' }}
                  draggable={false}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
