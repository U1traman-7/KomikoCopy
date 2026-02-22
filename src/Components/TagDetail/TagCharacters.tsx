import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Spinner,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Tooltip,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import {
  MdChevronLeft,
  MdChevronRight,
  MdAdd,
  MdClose,
  MdSearch,
} from 'react-icons/md';

import toast from 'react-hot-toast';
import { CharacterGrid } from '../character/CharacterGrid';
import { CharacterCardItem } from '../character/CharacterCardItem';
import { getCharacterImageUrl } from '../../utils/characterNameUtils';
import { getOptimizedImageUrl } from '../../utilities/imageOptimization';

interface Character {
  id: number;
  character_uniqid: string;
  character_name: string;
  character_description?: string;
  character_pfp?: string;
  rizz?: number;
  num_adopt?: number;
  num_gen?: number;
  is_official?: boolean;
  binding_id?: number;
}

interface TagCharactersProps {
  tagId: number;
  initialCharacters?: Character[];
  showAll?: boolean;
  isModerator?: boolean;
  isNsfw?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
}

const PAGE_SIZE = 21;

export const TagCharacters: React.FC<TagCharactersProps> = ({
  tagId,
  initialCharacters = [],
  showAll = false,
  isModerator = false,
  isNsfw = false,
  onRefresh,
  compact = false,
}) => {
  const { t } = useTranslation('tags');
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [isLoading, setIsLoading] = useState(initialCharacters.length === 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Character add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Character[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [hasAddedCharacters, setHasAddedCharacters] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const fetchCharacters = useCallback(
    async (pageNum: number) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/tag/characters?tagId=${tagId}&page=${pageNum}&pageSize=${PAGE_SIZE}`,
        );
        const data = await response.json();

        if (data.characters) {
          setCharacters(data.characters);
          setTotal(data.pagination?.total || data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching tag characters:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [tagId],
  );

  // Search characters for adding
  const searchCharacters = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search public characters only (official=false returns non-official public characters)
        // Only include NSFW characters if the tag is NSFW
        const params = new URLSearchParams({
          search: query,
          limit: '20',
          official: 'false',
          ...(isNsfw && { mode: 'nsfw' }),
        });
        const response = await fetch(`/api/characters?${params.toString()}`);
        const data = await response.json();
        if (data.code === 1 && data.data?.characters) {
          // Filter out characters already in the tag
          const existingIds = new Set(characters.map(c => c.character_uniqid));
          const filtered = data.data.characters.filter(
            (c: any) => !existingIds.has(c.character_uniqid),
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error('Error searching characters:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [characters, isNsfw],
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchCharacters(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCharacters]);

  // Add character to tag
  const handleAddCharacter = async (character: Character) => {
    setIsAdding(character.character_uniqid);
    try {
      const response = await fetch('/api/tag/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          characterId: character.character_uniqid,
          is_official: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to add character');
        return;
      }

      toast.success(t('characterAdded'));
      // Remove from search results, mark that we've added characters
      setSearchResults(prev =>
        prev.filter(c => c.character_uniqid !== character.character_uniqid),
      );
      setHasAddedCharacters(true);
    } catch (error) {
      toast.error(`${t('characterAdded')} failed`);
    } finally {
      setIsAdding(null);
    }
  };

  // Remove character from tag
  const handleRemoveCharacter = async (character: Character) => {
    // Official characters cannot be removed
    if (character.is_official) {
      toast.error(t('cannotRemoveOfficial'));
      return;
    }

    setIsDeleting(character.character_uniqid);
    try {
      const response = await fetch(
        `/api/tag/characters?tagId=${tagId}&characterId=${character.character_uniqid}`,
        { method: 'DELETE' },
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || `${t('characterRemoved')} failed`);
        return;
      }

      toast.success(t('characterRemoved'));
      fetchCharacters(currentPage);
      onRefresh?.();
    } catch (error) {
      toast.error(`${t('characterRemoved')} failed`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Fetch characters on mount or when tagId/page changes
  // When showAll is true, use pagination; otherwise fetch initial page only
  useEffect(() => {
    if (initialCharacters.length > 0) {
      setTotal(initialCharacters.length);
      return;
    }

    // When showAll is true, this effect handles pagination
    if (showAll) {
      fetchCharacters(currentPage);
    } else {
      // When not showAll, only fetch first page
      fetchCharacters(1);
    }
  }, [tagId, currentPage, showAll, initialCharacters.length, fetchCharacters]);

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Show preview (max 6) or all based on showAll prop
  const displayCharacters = showAll ? characters : characters.slice(0, 6);
  const hasMoreToShow = !showAll && characters.length > 6;

  const handleCharacterClick = (character: Character) => {
    router.push(`/character/${character.character_uniqid}`);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    // Refresh character list only when modal closes and characters were added
    if (hasAddedCharacters) {
      fetchCharacters(currentPage);
      onRefresh?.();
      setHasAddedCharacters(false);
    }
  };

  const renderAddModal = () => (
    <Modal
      isOpen={isAddModalOpen}
      onClose={handleModalClose}
      size='lg'
      scrollBehavior='inside'>
      <ModalContent>
        <ModalHeader className='flex items-center gap-2 border-b-[1px]'>
          <MdAdd size={20} />
          {t('addCharacterToTag')}
        </ModalHeader>
        <ModalBody className='py-4'>
          {/* Search input */}
          <Input
            placeholder={t('searchCharacters')}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<MdSearch className='w-4 h-4 text-default-400' />}
            classNames={{ inputWrapper: 'h-10' }}
            autoFocus
          />

          {/* Search results */}
          <div className='space-y-2'>
            {isSearching ? (
              <div className='flex justify-center py-8'>
                <Spinner size='lg' />
              </div>
            ) : searchResults.length > 0 ? (
              <div className='grid md:grid-cols-2 grid-cols-1 gap-2'>
                {searchResults.map(char => {
                  const rawImagePath = getCharacterImageUrl(char as any);
                  // Optimize Supabase images: 80px for 40x40 display (2x for retina)
                  const imagePath =
                    getOptimizedImageUrl(rawImagePath, 80, 75) || rawImagePath;
                  const isAddingThis = isAdding === char.character_uniqid;

                  return (
                    <div
                      key={char.character_uniqid}
                      className='relative border rounded-lg p-2 hover:bg-default-50 cursor-pointer transition-colors'
                      onClick={() => handleAddCharacter(char)}>
                      <div className='flex items-center gap-2'>
                        <img
                          src={imagePath || ''}
                          alt={char.character_name}
                          className='w-10 h-10 rounded-full object-cover object-top'
                        />
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium truncate'>
                            {char.character_name}
                          </p>
                          <p className='text-xs text-default-400'>
                            @{char.character_uniqid}
                          </p>
                        </div>
                        {isAddingThis ? (
                          <Spinner size='sm' />
                        ) : (
                          <MdAdd className='text-primary-500' size={20} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className='text-center py-8 text-default-400'>
                {t('noCharactersFound')}
              </div>
            ) : searchQuery.length > 0 ? (
              <div className='text-center py-8 text-default-400'>
                {t('typeMoreToSearch')}
              </div>
            ) : (
              <div className='text-center py-8 text-default-400'>
                {t('searchCharacterHint')}
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  if (isLoading && characters.length === 0) {
    return (
      <div className='flex justify-center items-center py-12'>
        <Spinner size='lg' color='default' />
      </div>
    );
  }

  if (characters.length === 0) {
    // In showAll mode (tab view), show empty state
    if (showAll) {
      return (
        <>
          <div className='flex flex-col items-center justify-center py-16 px-4 mt-2'>
            <div className='w-20 h-20 mb-4 rounded-full bg-default-100 flex items-center justify-center'>
              <svg
                className='w-10 h-10 text-default-300'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-medium text-default-700 mb-1'>
              {t('noCharactersYet')}
            </h3>
            <p className='text-sm text-default-400 text-center max-w-xs mb-4'>
              {t('noCharactersDesc')}
            </p>
            {/* Add button for moderators in empty state */}
            {isModerator && (
              <Button
                color='default'
                variant='flat'
                startContent={<MdAdd size={18} />}
                onPress={() => setIsAddModalOpen(true)}>
                {t('addCharacter')}
              </Button>
            )}
          </div>
          {/* Add Character Modal for empty state */}
          {renderAddModal()}
        </>
      );
    }
    return null; // Don't render preview section if no characters
  }

  const renderCard = (character: Character) => {
    const charAny = character as any;
    const imagePath = getCharacterImageUrl(character as any);
    const isDeletingThis = isDeleting === character.character_uniqid;

    return (
      <div className='relative group'>
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
          showCollectionCount={true}
        />
        {/* Delete button for moderators - hide for official characters */}
        {isModerator && !character.is_official && (
          <Tooltip content={t('removeCharacter')} placement='top'>
            <Button
              onPress={() => handleRemoveCharacter(character)}
              disabled={isDeletingThis}
              className={`absolute top-1 right-1 p-1.5 rounded-full shadow-sm transition-all
                bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100
                ${isDeletingThis ? 'opacity-100' : ''}
              `}
              isIconOnly
              aria-label='Remove character'
              size='sm'
              color='danger'>
              {isDeletingThis ? (
                <Spinner size='sm' color='white' />
              ) : (
                <MdClose />
              )}
            </Button>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className='w-full'>
      {/* Header with count and add button */}
      <div
        className={`flex items-center justify-between ${compact ? 'my-2' : 'mb-3'}`}>
        <div className='flex items-center gap-2'>
          <h3
            className={`font-semibold text-default-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            {t('relatedCharacters')}
          </h3>
          {total > 0 && (
            <Chip
              size='sm'
              variant='flat'
              classNames={{
                base: `bg-primary-50 dark:bg-primary-900/30 ${compact ? 'h-5 min-w-5' : ''}`,
                content: `text-primary-600 font-medium ${compact ? 'text-[10px]' : 'text-xs'}`,
              }}>
              {total}
            </Chip>
          )}
        </div>
        {/* Add button for moderators */}
        {isModerator && (
          <Button
            size='sm'
            color='primary'
            variant='flat'
            startContent={<MdAdd size={compact ? 14 : 16} />}
            className={compact ? 'h-7 text-xs min-w-0 px-2' : ''}
            onPress={() => setIsAddModalOpen(true)}>
            {t('addCharacter')}
          </Button>
        )}
      </div>

      {/* Character Grid */}
      <CharacterGrid
        characters={displayCharacters as any[]}
        loading={isLoading && characters.length === 0}
        emptyMessage={t('noCharactersDesc')}
        renderCard={renderCard as any}
        onCharacterClick={handleCharacterClick as any}
        enablePrefetch={true}
        className={
          compact
            ? '!gap-3 !grid-cols-6 md:!grid-cols-7 lg:!grid-cols-8 xl:!grid-cols-10'
            : ''
        }
      />

      {/* Pagination - only show in full view mode */}
      {showAll && totalPages > 1 && (
        <div className='flex justify-center items-center gap-1 mt-4'>
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className='p-1 rounded-md hover:bg-default-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            aria-label='Previous page'>
            <MdChevronLeft className='text-lg text-default-500' />
          </button>
          <span className='text-xs text-default-400 mx-2'>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className='p-1 rounded-md hover:bg-default-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
            aria-label='Next page'>
            <MdChevronRight className='text-lg text-default-500' />
          </button>
        </div>
      )}

      {/* Show "View All" button in preview mode */}
      {hasMoreToShow && !showAll && (
        <div className='flex justify-center mt-4'>
          <Button size='sm' variant='flat' color='primary'>
            {t('viewAll')}
          </Button>
        </div>
      )}

      {/* Add Character Modal */}
      {renderAddModal()}
    </div>
  );
};

export default TagCharacters;
