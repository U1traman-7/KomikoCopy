import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner, Avatar, Chip, Button } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { MdChevronLeft, MdChevronRight, MdPeople } from 'react-icons/md';
import { HiHeart } from 'react-icons/hi';
import { AiOutlinePlus, AiOutlineCheck } from 'react-icons/ai';
import toast from 'react-hot-toast';

interface Adopter {
  user_id: string;
  user_uniqid: string;
  user_name: string;
  image: string;
  is_current_user: boolean;
  following?: boolean;
}

interface Author {
  user_id: string;
  user_uniqid: string;
  user_name: string;
  image: string;
}

interface CharacterAdoptersProps {
  characterId: string;
  author?: Author;
}

const PAGE_SIZE = 18;

const AdopterItem = ({
  adopter,
  onFollowChange,
}: {
  adopter: Adopter;
  onFollowChange: (userId: string, following: boolean) => void;
}) => {
  const { t } = useTranslation('character');
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(adopter.following ?? false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (adopter.is_current_user) {
      return;
    }

    setIsLoadingFollow(true);
    const newFollowState = !isFollowing;
    const followValue = newFollowState ? 1 : -1;

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followingUserId: adopter.user_id,
          value: followValue,
        }),
      });
      if (response.ok) {
        setIsFollowing(newFollowState);
        onFollowChange(adopter.user_id, newFollowState);
      } else {
        toast.error(
          newFollowState
            ? t('followFailed', 'Follow failed')
            : t('unfollowFailed', 'Unfollow failed'),
        );
      }
    } finally {
      setIsLoadingFollow(false);
    }
  };

  return (
    <div
      onClick={() => router.push(`/user/${adopter.user_uniqid}`)}
      className='group flex items-center gap-2 p-3 rounded-xl bg-card dark:bg-default-100
                 border border-default-200 shadow-sm hover:shadow-md hover:border-primary-300
                 cursor-pointer transition-all'>
      <Avatar
        src={adopter.image}
        name={adopter.user_name}
        size='sm'
        className='flex-shrink-0'
      />
      <p className='flex-1 min-w-0 text-sm font-medium text-default-700 truncate group-hover:text-primary-600 transition-colors'>
        {adopter.user_name}
      </p>
      {!adopter.is_current_user && (
        <Button
          size='sm'
          radius='full'
          variant='flat'
          color='default'
          isLoading={isLoadingFollow}
          startContent={
            !isLoadingFollow ? (
              isFollowing ? (
                <AiOutlineCheck className='w-3 h-3' />
              ) : (
                <AiOutlinePlus className='w-3 h-3' />
              )
            ) : null
          }
          className={'min-w-[56px] h-7 text-xs font-medium'}
          onClick={handleFollow}>
          {isFollowing ? t('following', 'Following') : t('follow', 'Follow')}
        </Button>
      )}
      {adopter.is_current_user && (
        <Chip
          size='sm'
          variant='flat'
          className='text-xs bg-primary-100 text-primary-600'>
          {t('you', 'You')}
        </Chip>
      )}
    </div>
  );
};

export const CharacterAdopters: React.FC<CharacterAdoptersProps> = ({
  characterId,
  author,
}) => {
  const { t } = useTranslation('character');
  const [adopters, setAdopters] = useState<Adopter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  useEffect(() => {
    const fetchAdopters = async () => {
      if (!characterId || characterId === 'loading...') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const offset = (currentPage - 1) * PAGE_SIZE;
        const response = await fetch(
          `/api/character/adopters?character_uniqid=${characterId}&limit=${PAGE_SIZE}&offset=${offset}`,
        );

        if (!response.ok) {
          console.error(`Failed to fetch adopters: ${response.status}`);
          setError(t('errors.loadFailed', 'Failed to load adopters'));
          return;
        }

        const result = await response.json();

        if (result.code === 1 && result.data) {
          setAdopters(result.data.adopters || []);
          setTotal(result.data.total || 0);
          setError(null);
        } else {
          setAdopters([]);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching adopters:', err);
        setError(t('errors.loadFailed', 'Failed to load adopters'));
        setAdopters([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdopters();
  }, [characterId, currentPage, t]);

  const handleFollowChange = (userId: string, following: boolean) => {
    setAdopters(prev =>
      prev.map(a => (a.user_id === userId ? { ...a, following } : a)),
    );
  };

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

  if (error) {
    return (
      <div className='flex flex-col justify-center items-center h-64 text-center gap-3'>
        <div className='w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center'>
          <MdPeople className='text-3xl text-danger-400' />
        </div>
        <p className='text-danger font-medium'>{error}</p>
      </div>
    );
  }

  if (!isLoading && adopters.length === 0 && !author) {
    return (
      <div className='flex flex-col justify-center items-center py-12'>
        <div className='w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center mb-3'>
          <HiHeart className='text-2xl text-pink-400' />
        </div>
        <p className='text-default-500 text-sm'>
          {t('noAdopters', 'No adopters yet')}
        </p>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {/* Header with count */}
      <div className='mb-2 flex items-center gap-2'>
        <Chip
          size='sm'
          variant='flat'
          classNames={{
            base: 'bg-primary-50 dark:bg-primary-900/30',
            content: 'text-primary-600 font-medium text-xs',
          }}>
          {total + 1}
        </Chip>
        <span className='text-xs text-default-400'>
          {t('adoptersLabel', 'adopters')}
        </span>
      </div>

      {/* Adopters List */}
      {isLoading ? (
        <div className='flex justify-center items-center h-32'>
          <Spinner size='md' color='default' />
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {adopters.map(adopter => (
            <AdopterItem
              key={adopter.user_id}
              adopter={adopter}
              onFollowChange={handleFollowChange}
            />
          ))}
          {/* Author at the end */}
          {author && !adopters.some(a => a.user_id === author.user_id) && (
            <AdopterItem
              key={`author-${author.user_id}`}
              adopter={{
                ...author,
                is_current_user: false,
                following: false,
              }}
              onFollowChange={handleFollowChange}
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center items-center gap-1 mt-3'>
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className='p-1 rounded-md hover:bg-default-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'>
            <MdChevronLeft className='text-lg text-default-500' />
          </button>
          <span className='text-xs text-default-400 mx-2'>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className='p-1 rounded-md hover:bg-default-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'>
            <MdChevronRight className='text-lg text-default-500' />
          </button>
        </div>
      )}
    </div>
  );
};
