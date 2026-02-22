import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { IconDotsVertical, IconSettings } from '@tabler/icons-react';
import { useAtomValue } from 'jotai';
import { authAtom, profileAtom } from '@/state';
import { ModeratorApplyModal } from './ModeratorApplyModal';
import { TagSettingsModal } from './TagSettingsModal';
import { CtaTextModal } from './CtaTextModal';
import type { Moderator } from './TagHeader';
import Link from 'next/link';

interface TagDetail {
  id: number;
  name: string;
  logo_url?: string | null;
  header_image?: string | null;
  description?: string | null;
  is_nsfw?: boolean;
  cta_link?: string | null;
  character_category?: string | null;
  allow_media_types?: 'all' | 'image' | 'video' | null;
  cta_text_translation?: Record<string, string> | null;
  is_following: boolean;
  moderators: Moderator[];
  allow_nsfw: boolean;
}

interface TagBarProps {
  tagId: number | null;
  sortBy: 'Trending' | 'Newest';
  activeTab: 'all' | 'featured' | 'characters';
  onTabChange: (
    tab: 'all' | 'featured' | 'characters',
    sortBy: 'Trending' | 'Newest',
  ) => void;
  onFollowChange?: (isFollowing: boolean) => void;
  onTagUpdated?: () => void;
  compact?: boolean;
}

const SPECIAL_TAG_IDS = [57349, 57360, 87327, 21544];

// 缓存tag详情，避免重复请求
const tagDetailCache = new Map<number, TagDetail>();

export const TagBar: React.FC<TagBarProps> = ({
  tagId,
  sortBy,
  activeTab,
  onTabChange,
  onFollowChange,
  onTagUpdated,
  compact = false,
}) => {
  const { t } = useTranslation(['tags', 'common']);
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);

  const [tagDetail, setTagDetail] = useState<TagDetail | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCtaTextModalOpen, setIsCtaTextModalOpen] = useState(false);
  const fetchingRef = useRef<number | null>(null);

  const isCommunityTag = tagId !== null && !SPECIAL_TAG_IDS.includes(tagId);

  const fetchTagDetail = useCallback(async (id: number) => {
    // 如果有缓存，先使用缓存数据（无loading状态）
    const cached = tagDetailCache.get(id);
    if (cached) {
      setTagDetail(cached);
      setIsFollowing(cached.is_following);
    }

    // 后台静默更新数据
    fetchingRef.current = id;
    try {
      const response = await fetch(`/api/tag/detail?id=${id}`);
      if (response.ok && fetchingRef.current === id) {
        const data = await response.json();
        if (data.tag) {
          const detail: TagDetail = {
            id: data.tag.id,
            name: data.tag.name,
            logo_url: data.tag.logo_url,
            header_image: data.tag.header_image,
            description: data.tag.description,
            is_nsfw: data.tag.is_nsfw,
            cta_link: data.tag.cta_link,
            character_category: data.tag.character_category,
            allow_media_types: data.tag.allow_media_types,
            is_following: data.is_following || false,
            moderators: data.moderators || [],
            allow_nsfw: data.tag.allow_nsfw || false,
          };
          tagDetailCache.set(id, detail);
          setTagDetail(detail);
          setIsFollowing(data.is_following || false);
        }
      }
    } catch (error) {
      console.error('Error fetching tag detail:', error);
      if (!cached) {
        setTagDetail(null);
      }
    }
  }, []);

  useEffect(() => {
    if (isCommunityTag && tagId) {
      fetchTagDetail(tagId);
    } else {
      setTagDetail(null);
    }
  }, [tagId, isCommunityTag, fetchTagDetail]);

  const updateCache = (id: number, isFollowing: boolean) => {
    const cached = tagDetailCache.get(id);
    if (cached) {
      tagDetailCache.set(id, { ...cached, is_following: isFollowing });
    }
  };

  const handleFollow = useCallback(async () => {
    if (!tagId || !isAuth) {
      return;
    }

    setIsFollowLoading(true);
    const prevState = isFollowing;
    setIsFollowing(true);

    try {
      const response = await fetch('/api/tag/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, action: 'follow' }),
      });
      const data = await response.json();
      if (data.is_following === false) {
        setIsFollowing(prevState);
      } else {
        updateCache(tagId, true);
        onFollowChange?.(true);
      }
    } catch (error) {
      setIsFollowing(prevState);
    } finally {
      setIsFollowLoading(false);
    }
  }, [tagId, isAuth, isFollowing, onFollowChange]);

  const handleUnfollow = useCallback(async () => {
    if (!tagId) {
      return;
    }

    setIsFollowLoading(true);
    const prevState = isFollowing;
    setIsFollowing(false);

    try {
      const response = await fetch('/api/tag/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, action: 'unfollow' }),
      });
      const data = await response.json();
      if (data.is_following === true) {
        setIsFollowing(prevState);
      } else {
        updateCache(tagId, false);
        onFollowChange?.(false);
      }
    } catch (error) {
      setIsFollowing(prevState);
    } finally {
      setIsFollowLoading(false);
    }
  }, [tagId, isFollowing, onFollowChange]);

  const handleTabChange = (tab: 'all' | 'featured' | 'characters') => {
    onTabChange(tab, sortBy);
  };

  const isCurrentUserModerator = tagDetail?.moderators?.some(
    m => m.user_id === profile?.id,
  );
  const isGlobalAdmin = profile?.roles?.includes(1) || false;
  const showApplyButton = !isCurrentUserModerator && !isGlobalAdmin;

  if (!isCommunityTag) {
    return null;
  }

  return (
    <>
      <div
        className={
          compact
            ? 'flex items-center justify-between gap-3 mb-1 px-0 border-b border-border pb-0'
            : 'flex items-center justify-between gap-4 mb-2 px-1 border-b border-border pb-2'
        }>
        {/* 左侧: Tabs */}
        <div className='flex items-center gap-2 overflow-hidden'>
          <Tabs
            aria-label='Tag content tabs'
            selectedKey={activeTab}
            onSelectionChange={key =>
              handleTabChange(key as 'all' | 'featured' | 'characters')
            }
            variant='underlined'
            classNames={{
              tabList: compact ? 'gap-5 pb-0' : 'gap-4 md:gap-6 pb-0',
              cursor: 'w-full bg-primary-400 rounded-md',
              tab: compact ? 'px-0 h-7' : 'px-0 h-9',
              tabContent: compact
                ? 'text-[12px] group-data-[selected=true]:text-foreground group-data-[selected=false]:text-muted-foreground font-bold'
                : 'text-xs md:text-sm group-data-[selected=true]:text-foreground font-semibold',
            }}>
            <Tab
              key='all'
              title={t('common:all', {
                defaultValue: 'All',
              })}
            />
            <Tab
              key='featured'
              title={t('common:preset_tags.featured', {
                defaultValue: 'Featured',
              })}
            />
            <Tab
              key='characters'
              title={t('common:create_character_short', {
                defaultValue: 'Characters',
              })}
            />
          </Tabs>
          {(isCurrentUserModerator || isGlobalAdmin) && (
            <Button
              size={compact ? 'sm' : 'md'}
              variant='light'
              onPress={() => setIsCtaTextModalOpen(true)}>
              {t('common:set_tag', { defaultValue: 'Tag Setting' })}
            </Button>
          )}
        </div>

        {/* 右侧: 分隔符 + Mods 头像 + Dropdown Menu */}
        <div className='flex items-center gap-2.5 flex-shrink-0'>
          {/* 分隔符 */}
          {tagDetail?.moderators && tagDetail.moderators.length > 0 && (
            <div className='h-3 w-px bg-border mx-1' />
          )}

          {/* Moderators 头像 */}
          {tagDetail?.moderators && tagDetail.moderators.length > 0 && (
            <div className='flex items-center gap-2'>
              <span
                className={
                  compact
                    ? 'text-[11px] text-muted-foreground font-medium'
                    : 'text-xs text-default-500'
                }>
                {t('tags:mods')}
              </span>
              {tagDetail.moderators.length === 1 ? (
                <Avatar
                  as={Link}
                  href={`/user/${tagDetail.moderators[0].user_uniqid || tagDetail.moderators[0].user_id}`}
                  src={tagDetail.moderators[0].user_image}
                  name={tagDetail.moderators[0].user_name?.charAt(0) || '?'}
                  showFallback
                  classNames={{
                    base: 'w-6 h-6 ring-1 ring-background',
                    name: 'text-[10px]',
                  }}
                />
              ) : (
                <AvatarGroup
                  max={3}
                  size='sm'
                  classNames={{
                    count: 'w-6 h-6 text-[10px]',
                  }}>
                  {tagDetail.moderators.map(mod => (
                    <Avatar
                      key={mod.id}
                      as={Link}
                      href={`/user/${mod.user_uniqid || mod.user_id}`}
                      src={mod.user_image}
                      name={mod.user_name?.charAt(0) || '?'}
                      showFallback
                      classNames={{
                        base: 'w-6 h-6 ring-1 ring-background',
                        name: 'text-[10px]',
                      }}
                    />
                  ))}
                </AvatarGroup>
              )}
            </div>
          )}

          {/* Dropdown Menu for Follow/Apply/Settings */}
          {(isAuth ||
            showApplyButton ||
            isCurrentUserModerator ||
            isGlobalAdmin) && (
            <Dropdown placement='bottom-end'>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size='sm'
                  variant='light'
                  radius='full'
                  className='min-w-0 w-7 h-7 text-muted-foreground'>
                  <IconDotsVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label='Tag actions'
                items={[
                  { key: 'follow', show: isAuth },
                  { key: 'apply', show: showApplyButton },
                  {
                    key: 'settings',
                    show: isCurrentUserModerator || isGlobalAdmin,
                  },
                ].filter(item => item.show)}>
                {item => {
                  if (item.key === 'follow') {
                    return (
                      <DropdownItem
                        key='follow'
                        onPress={() =>
                          isFollowing ? handleUnfollow() : handleFollow()
                        }>
                        {isFollowing ? t('tags:unfollow') : t('tags:follow')}
                      </DropdownItem>
                    );
                  }
                  if (item.key === 'settings') {
                    return (
                      <DropdownItem
                        key='settings'
                        startContent={<IconSettings size={16} />}
                        onPress={() => setIsSettingsModalOpen(true)}>
                        {t('tags:settings.title', { defaultValue: 'Settings' })}
                      </DropdownItem>
                    );
                  }
                  return (
                    <DropdownItem
                      key='apply'
                      onPress={() => setIsApplyModalOpen(true)}>
                      {t('tags:applyModerator')}
                    </DropdownItem>
                  );
                }}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>

      {tagDetail && (
        <>
          <ModeratorApplyModal
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            tagId={tagDetail.id}
            tagName={tagDetail.name}
          />
          <TagSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            tagId={tagDetail.id}
            tagName={tagDetail.name}
            currentLogoUrl={tagDetail.logo_url}
            currentHeaderImage={tagDetail.header_image}
            currentDescription={tagDetail.description}
            currentIsNsfw={tagDetail.is_nsfw}
            currentCtaLink={tagDetail.cta_link}
            currentCharacterCategory={tagDetail.character_category}
            currentAllowMediaTypes={tagDetail.allow_media_types}
            canManageMods={isGlobalAdmin}
            isGlobalAdmin={isGlobalAdmin}
            onSuccess={() => {
              // Invalidate cache and refetch
              tagDetailCache.delete(tagDetail.id);
              fetchTagDetail(tagDetail.id);
              onTagUpdated?.();
            }}
          />
          <CtaTextModal
            isOpen={isCtaTextModalOpen}
            onClose={() => setIsCtaTextModalOpen(false)}
            tagId={tagDetail.id}
            initialCtaTextTranslation={tagDetail.cta_text_translation}
            onSuccess={() => {
              // Invalidate cache and refetch
              tagDetailCache.delete(tagDetail.id);
              fetchTagDetail(tagDetail.id);
              onTagUpdated?.();
            }}
          />
        </>
      )}
    </>
  );
};

export default TagBar;
