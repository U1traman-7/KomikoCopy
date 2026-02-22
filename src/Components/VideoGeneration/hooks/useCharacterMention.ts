import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCharacterSearch } from '../../../hooks/useCharacterSearch';
import { useOwnedCharacters } from '../../../hooks/useOwnedCharacters';
import { Character as GlobalCharacter } from '../../../state';

export interface Character {
  character_uniqid: string;
  character_name: string;
  character_pfp: string;
  alt_prompt?: string;
  character_description?: string;
  is_collected?: boolean;
  is_owned?: boolean;
  num_collected?: number;
}

export interface UseCharacterMentionProps {
  isAuth: boolean;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onAddCharacterImage?: (character: Character) => void;
  onRemoveCharacterImage?: (characterId: string) => void;
}

export const useCharacterMention = ({
  isAuth,
  prompt,
  setPrompt,
  onAddCharacterImage,
  onRemoveCharacterImage,
}: UseCharacterMentionProps) => {
  // Get owned/collected characters (for quick selector and character info)
  const { characters: ownedCharacters, loading: loadingOwnedCharacters } =
    useOwnedCharacters();

  // Convert owned characters to Character format
  const availableCharacters = useMemo<Character[]>(
    () =>
      ownedCharacters.map((char: GlobalCharacter) => ({
        character_uniqid: char.character_uniqid,
        character_name: char.character_name,
        character_pfp: char.character_pfp,
        alt_prompt: char.alt_prompt,
        character_description: char.character_description,
        is_collected: char.is_collected,
        is_owned: char.is_owned,
        num_collected: char.num_collected,
      })),
    [ownedCharacters],
  );

  // State for mention dropdown
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    showBelow?: boolean;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Use character search hook (searches both owned and official characters)
  const { searchCharacters, loading: loadingSearch } = useCharacterSearch({
    isAuth,
    minSearchLength: 2,
  });

  const loadingCharacters = loadingOwnedCharacters || loadingSearch;

  // Search characters when query changes (with debounce)
  useEffect(() => {
    let isCancelled = false;

    // Debounce search to avoid excessive API calls
    const debounceTimer = setTimeout(async () => {
      const results = await searchCharacters(mentionSearchQuery);
      if (!isCancelled) {
        setFilteredCharacters(results);
      }
    }, 300); // 300ms debounce delay

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [mentionSearchQuery, searchCharacters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    };

    if (showMentionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMentionDropdown]);

  // Check if character is already mentioned
  const isCharacterMentioned = (characterId: string): boolean =>
    prompt.includes(`@${characterId}`);

  // Extract character IDs from prompt
  const extractCharacterIdsFromPrompt = useCallback(
    (text: string): string[] => {
      // Match character mentions, supporting formats like @Anya_(Spy_X_Family), @kusa-11
      const regex = /@([a-zA-Z0-9_().:'-]+)/g;
      const matches = text.matchAll(regex);
      return Array.from(matches, m => m[1]);
    },
    [],
  );

  // Escape special regex characters
  const escapeRegExp = useCallback((str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  // Toggle character mention and image
  const toggleCharacterMention = useCallback(
    (character: Character) => {
      const characterId = character.character_uniqid;
      const mention = `@${characterId}`;

      if (prompt.includes(mention)) {
        // Remove mention - escape special regex chars in mention
        const escapedMention = escapeRegExp(mention);
        const newPrompt = prompt
          .replace(new RegExp(`\\s*${escapedMention}\\s*`, 'g'), ' ')
          .replace(/\s+/g, ' ')
          .trim();
        setPrompt(newPrompt);
        onRemoveCharacterImage?.(characterId);
      } else {
        // Add mention
        const newPrompt = prompt ? `${prompt} ${mention}` : mention;
        setPrompt(newPrompt);
        onAddCharacterImage?.(character);
      }
    },
    [prompt, setPrompt, onAddCharacterImage, onRemoveCharacterImage],
  );

  // Handle prompt change with @mention detection
  const handlePromptChange = useCallback(
    (newPrompt: string) => {
      setPrompt(newPrompt);
      // console.log('newPrompt', newPrompt);

      // Detect @ symbol for mention dropdown
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = newPrompt.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ')) {
          setMentionSearchQuery(textAfterAt);
          setShowMentionDropdown(true);

          if (textareaRef.current) {
            const textarea = textareaRef.current;
            const textareaRect = textarea.getBoundingClientRect();
            const style = window.getComputedStyle(textarea);

            // Create a mirror div to calculate cursor position
            const mirror = document.createElement('div');
            const mirrorStyle = mirror.style;

            // Copy all relevant styles from textarea to mirror
            mirrorStyle.position = 'absolute';
            mirrorStyle.top = '0';
            mirrorStyle.left = '0';
            mirrorStyle.visibility = 'hidden';
            mirrorStyle.overflow = 'auto';
            mirrorStyle.whiteSpace = 'pre-wrap';
            mirrorStyle.overflowWrap = 'break-word';

            // Copy all text-related styles
            const properties = [
              'direction',
              'boxSizing',
              'width',
              'height',
              'overflowX',
              'overflowY',
              'borderTopWidth',
              'borderRightWidth',
              'borderBottomWidth',
              'borderLeftWidth',
              'borderStyle',
              'paddingTop',
              'paddingRight',
              'paddingBottom',
              'paddingLeft',
              'fontStyle',
              'fontVariant',
              'fontWeight',
              'fontStretch',
              'fontSize',
              'fontSizeAdjust',
              'lineHeight',
              'fontFamily',
              'textAlign',
              'textTransform',
              'textIndent',
              'textDecoration',
              'letterSpacing',
              'wordSpacing',
              'tabSize',
            ];

            properties.forEach(prop => {
              mirrorStyle[prop as any] = style[prop as any];
            });

            // Set text content up to the @ symbol position
            const textUpToAt = newPrompt.substring(0, lastAtIndex);
            mirror.textContent = textUpToAt;

            // Create a span to mark the @ position
            const atMarker = document.createElement('span');
            atMarker.textContent = '@';
            mirror.appendChild(atMarker);

            document.body.appendChild(mirror);

            // Get the position of the @ marker
            const atMarkerRect = atMarker.getBoundingClientRect();
            const mirrorRect = mirror.getBoundingClientRect();

            // Clean up
            document.body.removeChild(mirror);

            const dropdownHeight = 288; // max-h-72 = 18rem = 288px
            const dropdownWidth = 320; // w-80 = 20rem = 320px
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const padding = 10;

            // Calculate position relative to @ symbol
            // The @ marker position is relative to the mirror div, we need to translate it to viewport coordinates
            const paddingTop = parseInt(style.paddingTop) || 0;
            const paddingLeft = parseInt(style.paddingLeft) || 0;
            const borderTop = parseInt(style.borderTopWidth) || 0;
            const borderLeft = parseInt(style.borderLeftWidth) || 0;

            // Calculate the actual position of @ in the textarea
            const atOffsetTop = atMarkerRect.top - mirrorRect.top;
            const atOffsetLeft = atMarkerRect.left - mirrorRect.left;

            // Translate to viewport coordinates
            const atTop =
              textareaRect.top +
              borderTop +
              paddingTop +
              atOffsetTop -
              textarea.scrollTop;
            const atLeft =
              textareaRect.left +
              borderLeft +
              paddingLeft +
              atOffsetLeft -
              textarea.scrollLeft;

            const lineHeight = parseInt(style.lineHeight) || 24;

            // Calculate vertical position (show below @ symbol by default)
            let top = atTop + lineHeight + 4; // 4px gap below the line
            let shouldShowBelow = true;

            // If not enough space below, show above
            const spaceBelow = viewportHeight - top;
            if (spaceBelow < dropdownHeight + padding) {
              const spaceAbove = atTop - padding;
              if (spaceAbove > dropdownHeight) {
                top = atTop - dropdownHeight - 4;
                shouldShowBelow = false;
              }
            }

            // Calculate horizontal position (align with @ symbol)
            let left = atLeft;

            // Ensure dropdown doesn't overflow right edge
            if (left + dropdownWidth > viewportWidth - padding) {
              left = Math.max(padding, viewportWidth - dropdownWidth - padding);
            }

            // Ensure dropdown doesn't overflow left edge
            if (left < padding) {
              left = padding;
            }

            setDropdownPosition({
              top,
              left,
              showBelow: shouldShowBelow,
            });
          }
        } else {
          setShowMentionDropdown(false);
          setDropdownPosition(null);
        }
      } else {
        setShowMentionDropdown(false);
        setDropdownPosition(null);
      }
    },
    [setPrompt],
  );

  // Select character from dropdown
  // Use useCallback to prevent unnecessary re-renders
  const selectCharacterFromDropdown = useCallback(
    (character: Character) => {
      const characterId = character.character_uniqid;
      const mention = `@${characterId}`;

      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = prompt.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const beforeAt = prompt.substring(0, lastAtIndex);
        const afterCursor = prompt.substring(cursorPos);
        const newPrompt = `${beforeAt}${mention} ${afterCursor}`;
        setPrompt(newPrompt);
        onAddCharacterImage?.(character);
      }

      setShowMentionDropdown(false);
      setMentionSearchQuery('');
    },
    [prompt, setPrompt, onAddCharacterImage],
  );

  return {
    availableCharacters, // For CharacterQuickSelector and other components
    loadingCharacters,
    showMentionDropdown,
    setShowMentionDropdown,
    mentionSearchQuery,
    dropdownPosition,
    textareaRef,
    mentionDropdownRef,
    filteredCharacters, // For MentionDropdown (includes search results)
    isCharacterMentioned,
    extractCharacterIdsFromPrompt,
    toggleCharacterMention,
    handlePromptChange,
    selectCharacterFromDropdown,
  };
};
