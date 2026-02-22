'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Textarea } from '@nextui-org/react';
import toast from 'react-hot-toast';
import { useCharacterMention } from '../hooks/useCharacterMention';
import { MentionDropdown } from './MentionDropdown';
import { CharacterQuickSelector } from './CharacterQuickSelector';
import { useRecentCharacters } from '../../../hooks/useRecentCharacters';

export interface ReferenceImage {
  id: string;
  url: string;
  name: string;
  file?: File;
  characterId?: string;
  isCharacter?: boolean;
}

export interface VideoPromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  referenceImages: ReferenceImage[];
  setReferenceImages: React.Dispatch<React.SetStateAction<ReferenceImage[]>>;
  isAuth: boolean;
  placeholder?: string;
  maxOCs?: number;
  minRows?: number;
  maxRows?: number;
  showQuickSelector?: boolean;
  showMagicPrompt?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  className?: string;
  textareaClassName?: string;
}

export const VideoPromptInput = memo(
  ({
    prompt,
    setPrompt,
    referenceImages,
    setReferenceImages,
    isAuth,
    placeholder = 'Describe the video effect you want to create. Type @ to mention characters.',
    maxOCs = 7,
    minRows = 2,
    maxRows = 4,
    showQuickSelector = true,
    t,
    className = '',
    textareaClassName = '',
  }: VideoPromptInputProps) => {
    const router = useRouter();
    const { addToRecent } = useRecentCharacters(10);

    // Track processed character IDs to prevent duplicates
    const processedCharacterIdsRef = new Set<string>();

    const {
      availableCharacters,
      loadingCharacters,
      showMentionDropdown,
      setShowMentionDropdown,
      dropdownPosition,
      textareaRef,
      mentionDropdownRef,
      filteredCharacters,
      isCharacterMentioned,
      toggleCharacterMention: originalToggleCharacterMention,
      handlePromptChange,
      selectCharacterFromDropdown,
    } = useCharacterMention({
      isAuth,
      prompt,
      setPrompt,
      onAddCharacterImage: character => {
        addToRecent(character as any);
        processedCharacterIdsRef.add(character.character_uniqid);

        setReferenceImages(prev => {
          // Check if character already exists
          const existsByCharId = prev.some(
            img => img.characterId === character.character_uniqid,
          );
          if (existsByCharId) return prev;

          const currentCharacterCount = prev.filter(
            img => img.isCharacter,
          ).length;

          // Check if image with same URL exists
          const existingUrlIndex = prev.findIndex(
            img => img.url === character.character_pfp,
          );

          if (existingUrlIndex !== -1) {
            const willIncrease = !prev[existingUrlIndex].isCharacter;
            if (willIncrease && currentCharacterCount >= maxOCs) {
              toast.error(
                t(
                  'ui.input.maxOCsReached',
                  `Maximum ${maxOCs} characters allowed`,
                ),
              );
              return prev;
            }
            const updated = [...prev];
            updated[existingUrlIndex] = {
              ...updated[existingUrlIndex],
              name: character.character_name,
              characterId: character.character_uniqid,
              isCharacter: true,
            };
            return updated;
          }

          // Add new character image
          if (currentCharacterCount >= maxOCs) {
            toast.error(
              t(
                'ui.input.maxOCsReached',
                `Maximum ${maxOCs} characters allowed`,
              ),
            );
            return prev;
          }

          return [
            ...prev,
            {
              id: `char-${character.character_uniqid}-${Date.now()}`,
              url: character.character_pfp,
              name: character.character_name,
              characterId: character.character_uniqid,
              isCharacter: true,
            },
          ];
        });
      },
      onRemoveCharacterImage: characterId => {
        setReferenceImages(prev =>
          prev.filter(img => img.characterId !== characterId),
        );
      },
    });

    // Handle character selection from dropdown
    const handleSelectCharacterFromDropdown = useCallback(
      (character: any) => {
        addToRecent(character as any);
        selectCharacterFromDropdown(character);
      },
      [addToRecent, selectCharacterFromDropdown],
    );

    // Handle toggle character mention with limit check
    const handleToggleCharacterMention = useCallback(
      (character: any) => {
        const characterId = character.character_uniqid;
        const mention = `@${characterId}`;
        const isAlreadyMentioned = prompt.includes(mention);

        if (isAlreadyMentioned) {
          originalToggleCharacterMention(character);
          return;
        }

        const currentCharacterCount = referenceImages.filter(
          img => img.isCharacter,
        ).length;
        if (currentCharacterCount >= maxOCs) {
          toast.error(
            t('ui.input.maxOCsReached', `Maximum ${maxOCs} characters allowed`),
          );
          return;
        }

        addToRecent(character as any);
        originalToggleCharacterMention(character);
      },
      [
        prompt,
        referenceImages,
        maxOCs,
        t,
        addToRecent,
        originalToggleCharacterMention,
      ],
    );

    return (
      <div className={className}>
        {/* Textarea with mention support */}
        <div className='relative'>
          <Textarea
            ref={textareaRef}
            value={prompt}
            onValueChange={handlePromptChange}
            onClear={() => setPrompt('')}
            isClearable
            disableAutosize
            onKeyDown={e => {
              if (
                showMentionDropdown &&
                (e.key === 'ArrowDown' ||
                  e.key === 'ArrowUp' ||
                  e.key === 'Enter')
              ) {
                e.preventDefault();
              }
              if (e.key === 'Escape') {
                setShowMentionDropdown(false);
              }
            }}
            placeholder={placeholder}
            rows={minRows}
            className={`w-full ${textareaClassName}`}
            classNames={{
              inputWrapper: 'border-0 shadow-none bg-transparent rounded-lg',
              input: 'text-sm resize-none',
            }}
          />

          {/* Mention dropdown */}
          <MentionDropdown
            show={showMentionDropdown}
            position={dropdownPosition}
            loading={loadingCharacters}
            characters={filteredCharacters}
            dropdownRef={mentionDropdownRef}
            onSelect={handleSelectCharacterFromDropdown}
            onClose={() => setShowMentionDropdown(false)}
          />
        </div>

        {/* Quick character selector */}
        {showQuickSelector && availableCharacters.length > 0 && (
          <CharacterQuickSelector
            characters={availableCharacters}
            isCharacterMentioned={isCharacterMentioned}
            onCharacterClick={handleToggleCharacterMention}
            onAddNewClick={() => router.push('/oc-maker')}
            t={t}
          />
        )}
      </div>
    );
  },
);

VideoPromptInput.displayName = 'VideoPromptInput';
