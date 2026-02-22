import React, { useState, useEffect, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@nextui-org/react';
import Feed from '../Feed/Feed';

interface CharacterFeedProps {
  characterId: string;
  creatorOnly?: boolean;
  creatorUserId?: string;
  /** External NSFW mode control - when provided, hides internal toggle */
  externalNsfwMode?: boolean;
}

export const CharacterFeed: React.FC<CharacterFeedProps> = ({
  characterId,
  creatorOnly = false,
  creatorUserId,
  externalNsfwMode,
}) => {
  const { t } = useTranslation('feed');
  const [tagId, setTagId] = useState<number | null>(null);
  const [isLoadingTag, setIsLoadingTag] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedKey, setFeedKey] = useState(0);
  // Use external NSFW mode (controlled by parent page)
  const nsfwMode = externalNsfwMode ?? false;

  // 获取角色标签的ID
  const fetchCharacterTagId = async () => {
    if (!characterId || characterId === 'loading...') {
      setIsLoadingTag(false);
      return;
    }

    try {
      setIsLoadingTag(true);
      // Try new @character-id format first, fallback to old <character-id> format
      const newTagName = `@${characterId}`;
      const oldTagName = `<${characterId}>`;
      const response = await fetch(
        `/api/tags?include_tags=${encodeURIComponent(newTagName)},${encodeURIComponent(oldTagName)}&size=1`,
      );

      if (!response.ok) {
        console.error(`Failed to fetch tag ID: ${response.status}`);
        setTagId(null);
        setError(t('errors.loadFailed', 'Failed to load character'));
        return;
      }

      const result = await response.json();

      if (result.code === 1 && result.data && result.data.length > 0) {
        // Try to find tag with new format first, then old format
        const tag =
          result.data.find((t: any) => t.name === newTagName) ||
          result.data.find((t: any) => t.name === oldTagName);
        if (tag) {
          setTagId(tag.id);
          setError(null);
        } else {
          setTagId(null);
          setError(null); // 没有相关内容，不算错误
        }
      } else {
        setTagId(null);
        setError(null);
      }

      // Only increment feedKey after successfully processing the response
      setFeedKey(prev => prev + 1);
    } catch (err) {
      console.error('Error fetching character tag ID:', err);
      setError(t('errors.loadFailed', 'Failed to load character'));
      setTagId(null);
    } finally {
      setIsLoadingTag(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchCharacterTagId();
    });
  }, [characterId]);

  if (isLoadingTag) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spinner size='lg' color='default' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center h-64 text-center'>
        <div>
          <p className='text-danger mb-4'>{error}</p>
        </div>
      </div>
    );
  }

  if (tagId === null) {
    return (
      <div className='flex justify-center items-center h-32'>
        <div className='text-center'>
          <p className='text-muted-foreground text-lg mb-4'>
            {t('states.noPostsFound', 'No posts found')}
          </p>
          <p className='text-muted-foreground text-sm'>
            {t('noRelatedPostDesc', 'No posts related to this character yet')}
          </p>
        </div>
      </div>
    );
  }

  if (creatorOnly && creatorUserId) {
    return (
      <div
        key={`character-feed-wrapper-my-${feedKey}`}
        className='px-1 md:px-5'>
        <Feed
          key={`character-feed-my-${creatorUserId}-${feedKey}`}
          simple={true}
          tagId={tagId}
          prerenderedPosts={false}
          className='character-feed'
          forceNavigation={true}
          isCharacterFeed={true}
          type='profile'
          user_uniqid={creatorUserId}
          externalNsfwMode={nsfwMode}
        />
      </div>
    );
  }

  return (
    <div key={`character-feed-wrapper-all-${feedKey}`} className='px-1 md:px-5'>
      <Feed
        key={`character-feed-all-${feedKey}`}
        simple={true}
        tagId={tagId}
        prerenderedPosts={false}
        className='character-feed'
        forceNavigation={true}
        isCharacterFeed={true}
        externalNsfwMode={nsfwMode}
      />
    </div>
  );
};
