import React, { useState } from 'react';
import { Button, Chip, Avatar, Skeleton, AvatarGroup } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import {
  IconFlame,
  IconMinus,
  IconPlus,
  IconSettings,
  IconEyeOff,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { MdArrowBack } from 'react-icons/md';
import { getTagHeaderLogoUrl } from '../../utilities/imageOptimization';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ModeratorApplyModal } from './ModeratorApplyModal';
import { TagSettingsModal } from './TagSettingsModal';
import { HiddenPostsModal } from './HiddenPostsModal';
import { cn } from '@/lib/utils';
import { getTemplateInfoByTagName } from '@/Components/StyleTemplatePicker/styles/index';
import { getLocalizedField } from '../../utils/i18nText';

// ============ Types ============

export interface Moderator {
  id: number;
  user_id: string;
  role: string;
  user_name?: string;
  user_image?: string;
  user_uniqid?: string;
}

export interface TagData {
  id: number;
  name: string;
  logoUrl?: string | null;
  headerImage?: string | null;
  description?: string | null;
  isNsfw?: boolean;
  ctaLink?: string | null;
  characterCategory?: string | null;
  allowMediaTypes?: 'all' | 'image' | 'video' | null;
  ctaTextTranslation?: Record<string, string> | null;
  i18n?: Record<string, any>;
}

export interface TagStats {
  followerCount: number;
  postCount: number;
  popularity: number;
}

export interface TagFollowState {
  isFollowing: boolean;
  isLoading: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}

export interface TagUserContext {
  isLoggedIn: boolean;
  currentUserId?: string;
  isGlobalAdmin: boolean;
  onLoginRequired?: () => void;
}

export interface TagHeaderProps {
  tag: TagData;
  stats: TagStats;
  followState: TagFollowState;
  moderators?: Moderator[];
  user: TagUserContext;
  onTagUpdated?: () => void;
}

// Format number with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// ============ Subcomponents ============

interface StatsProps {
  postCount: number;
  followerCount: number;
  gapClass?: string;
}

const Stats: React.FC<StatsProps> = ({
  postCount,
  followerCount,
  gapClass = 'gap-4',
}) => {
  const { t } = useTranslation('tags');
  return (
    <div
      className={`flex items-center ${gapClass} text-sm text-default-500 dark:text-muted-foreground`}>
      <span>
        <span className='font-semibold text-default-700 dark:text-foreground'>
          {formatNumber(postCount)}
        </span>{' '}
        {t('postsLabel')}
      </span>
      <span>
        <span className='font-semibold text-default-700 dark:text-foreground'>
          {formatNumber(followerCount)}
        </span>{' '}
        {t('followersLabel')}
      </span>
    </div>
  );
};

interface ModeratorsDisplayProps {
  moderators: Moderator[];
  showApplyButton: boolean;
  onApplyClick: () => void;
  size: 'sm' | 'md';
}

const ModeratorsDisplay: React.FC<ModeratorsDisplayProps> = ({
  moderators,
  showApplyButton,
  onApplyClick,
  size,
}) => {
  const { t } = useTranslation('tags');

  if (moderators.length === 0 && !showApplyButton) {
    return null;
  }

  const isSmall = size === 'sm';
  const avatarSize = isSmall ? 'w-6 h-6' : 'w-7 h-7';
  const ringSize = isSmall ? 'ring-1' : 'ring-2';
  const textSize = isSmall ? 'text-[10px]' : 'text-xs';
  const labelSize = isSmall ? 'text-xs' : 'text-sm';
  const gapClass = isSmall ? 'gap-2' : 'gap-3';
  const maxAvatars = isSmall ? 3 : 5;

  return (
    <div className={`flex items-center ${gapClass}`}>
      {moderators.length > 0 && (
        <>
          <span
            className={`${labelSize} text-default-500 dark:text-muted-foreground`}>
            {t('mods')}
          </span>
          {moderators.length === 1 ? (
            <Avatar
              as={Link}
              href={`/user/${moderators[0].user_uniqid || moderators[0].user_id}`}
              src={moderators[0].user_image}
              name={moderators[0].user_name?.charAt(0) || '?'}
              showFallback
              classNames={{
                base: `${avatarSize} ${ringSize} ring-background ${!isSmall ? 'cursor-pointer' : ''}`,
                name: textSize,
              }}
            />
          ) : (
            <AvatarGroup max={maxAvatars} size='sm'>
              {moderators.map(mod => (
                <Avatar
                  key={mod.id}
                  as={Link}
                  href={`/user/${mod.user_uniqid || mod.user_id}`}
                  src={mod.user_image}
                  name={mod.user_name?.charAt(0) || '?'}
                  showFallback
                  classNames={{
                    base: `${avatarSize} ${ringSize} ring-background ${!isSmall ? 'cursor-pointer' : ''}`,
                    name: textSize,
                  }}
                />
              ))}
            </AvatarGroup>
          )}
        </>
      )}
      {showApplyButton && (
        <Button
          size='sm'
          variant='bordered'
          radius='full'
          className={cn(
            'border-1',
            isSmall ? 'h-7 min-w-0 px-2.5 text-xs font-medium' : 'font-medium',
          )}
          onPress={onApplyClick}>
          {t('applyModerator')}
        </Button>
      )}
    </div>
  );
};

interface ExpandableDescriptionProps {
  description: string;
  isExpanded: boolean;
  onToggle: () => void;
  maxLines: number;
  textClass?: string;
}

const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  description,
  isExpanded,
  onToggle,
  maxLines,
  textClass = 'text-default-500 dark:text-foreground text-xs md:text-sm',
}) => {
  const { t } = useTranslation('tags');
  const totalLines = description.split('\n').length;
  const shouldShowExpandButton = totalLines > maxLines;

  const getLineClampClass = (lines: number) => {
    switch (lines) {
      case 1:
        return 'line-clamp-1';
      case 2:
        return 'line-clamp-2';
      case 3:
        return 'line-clamp-3';
      case 4:
        return 'line-clamp-4';
      case 5:
        return 'line-clamp-5';
      case 6:
        return 'line-clamp-6';
      default:
        return 'line-clamp-3';
    }
  };

  return (
    <div>
      <div
        className={`${textClass} ${!isExpanded && shouldShowExpandButton ? getLineClampClass(maxLines) : ''} whitespace-pre-wrap`}>
        {description}
      </div>
      {shouldShowExpandButton && (
        <button
          onClick={onToggle}
          className='text-primary-500 dark:text-primary-500 text-xs md:text-sm mt-1 hover:underline'>
          {isExpanded ? t('showLess') : t('showMore')}
        </button>
      )}
    </div>
  );
};

interface AdminButtonsProps {
  onHiddenPostsClick: () => void;
  onSettingsClick: () => void;
  className?: string;
}

const AdminButtons: React.FC<AdminButtonsProps> = ({
  onHiddenPostsClick,
  onSettingsClick,
  className = '',
}) => (
  <>
    <Button
      size='sm'
      variant='bordered'
      radius='full'
      isIconOnly
      className={`border-1 ${className}`}
      onPress={onHiddenPostsClick}>
      <IconEyeOff size={16} />
    </Button>
    <Button
      size='sm'
      variant='bordered'
      radius='full'
      isIconOnly
      className={`border-1 ${className}`}
      onPress={onSettingsClick}>
      <IconSettings size={16} />
    </Button>
  </>
);

interface FollowButtonProps {
  isFollowing: boolean;
  isLoading: boolean;
  onPress: () => void;
  size: 'sm' | 'md';
}

const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  isLoading,
  onPress,
  size,
}) => {
  const { t } = useTranslation('tags');
  const isSmall = size === 'sm';

  const startContent = isLoading ? undefined : isFollowing ? (
    <IconMinus size={isSmall ? 14 : 16} />
  ) : (
    <IconPlus
      size={isSmall ? 14 : 16}
      className={isSmall ? undefined : 'text-primary-foreground'}
    />
  );

  return (
    <Button
      color={isFollowing ? 'default' : 'primary'}
      variant={isFollowing ? 'bordered' : 'solid'}
      size='sm'
      radius='full'
      isLoading={isLoading}
      onPress={onPress}
      startContent={startContent}
      className={
        isSmall
          ? 'font-semibold h-8 min-w-0 px-3 border-1'
          : 'font-semibold flex-shrink-0 border-1'
      }>
      {isFollowing ? t('unfollow') : t('follow')}
    </Button>
  );
};

interface NsfwBadgeProps {
  size: 'sm' | 'md';
}

const NsfwBadge: React.FC<NsfwBadgeProps> = ({ size }) => {
  const isSmall = size === 'sm';
  return (
    <Chip
      size='sm'
      variant='flat'
      color='danger'
      className={isSmall ? 'h-5 text-xs px-1.5' : 'text-sm'}
      startContent={<IconAlertTriangle size={isSmall ? 12 : 14} />}>
      NSFW
    </Chip>
  );
};

// ============ Main Component ============

export const TagHeader: React.FC<TagHeaderProps> = ({
  tag,
  stats,
  followState,
  moderators = [],
  user,
  onTagUpdated,
}) => {
  const { t, i18n } = useTranslation('tags');
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHiddenPostsOpen, setIsHiddenPostsOpen] = useState(false);

  // 获取当前语言
  const currentLocale = i18n.language || 'en';

  // Destructure for cleaner access
  const {
    id: tagId,
    name: tagName,
    logoUrl,
    headerImage,
    description,
    isNsfw = false,
    ctaLink,
    characterCategory,
    allowMediaTypes,
  } = tag;

  // 获取本地化的描述（支持 i18n 列格式）
  const localizedDescription = getLocalizedField(
    tag,
    'description',
    currentLocale,
  );
  const localizedTagName = getLocalizedField(tag, 'name', currentLocale);

  // Compute default CTA link from template matching
  const templateInfo = getTemplateInfoByTagName(tagName);
  const defaultCtaLink = templateInfo
    ? `/effects/${templateInfo.effectsSlug}`
    : null;
  const { followerCount, postCount, popularity } = stats;
  const { isFollowing, isLoading, onFollow, onUnfollow } = followState;
  const { isLoggedIn, currentUserId, isGlobalAdmin, onLoginRequired } = user;

  // Check if current user is a moderator
  const isCurrentUserModerator = moderators.some(
    mod => mod.user_id === currentUserId,
  );
  // Only global admins can manage moderators (add/remove)
  const canManageMods = isGlobalAdmin;
  const showApplyButton = !isCurrentUserModerator && !isGlobalAdmin;
  const canAccessAdmin = isCurrentUserModerator || isGlobalAdmin;

  const handleApplyClick = () => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleFollowClick = () => {
    if (isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  return (
    <div className='relative w-full mb-2'>
      {/* Back Button */}
      <div className='absolute top-4 left-4 z-30'>
        <Button
          variant='flat'
          size='sm'
          startContent={<MdArrowBack className='w-4 h-4' />}
          onPress={() => router.back()}
          isIconOnly
          className='bg-card/90 backdrop-blur-sm text-foreground hover:bg-card font-medium'
        />
      </div>

      {/* Header Image */}
      <div className='relative w-full h-40 md:h-48 lg:h-56 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-200 dark:to-primary-300 md:rounded-lg'>
        {headerImage ? (
          <img
            src={headerImage}
            alt={tagName}
            className='w-full h-full object-cover'
          />
        ) : (
          <div className='w-full h-full bg-gradient-to-br from-primary-400/20 via-secondary-400/20 to-primary-500/30 dark:from-primary-400/20 dark:via-secondary-400/20 dark:to-primary-300/30' />
        )}

        {/* Popularity/Heat - top right corner */}
        <div className='absolute top-4 right-4'>
          <Chip
            size='sm'
            variant='flat'
            color='warning'
            className='bg-warning-50/95 dark:bg-warning-900/50 backdrop-blur-md border border-warning-300/50 dark:border-warning-700/50 text-warning-700 dark:text-warning-300 font-bold'
            startContent={
              <IconFlame
                size={16}
                className='text-warning-600 dark:text-warning-400'
              />
            }>
            {formatNumber(popularity)}
          </Chip>
        </div>
      </div>

      {/* Modals */}
      <ModeratorApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        tagId={tagId}
        tagName={tagName}
      />

      <TagSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tagId={tagId}
        tagName={tagName}
        currentLogoUrl={logoUrl}
        currentHeaderImage={headerImage}
        currentDescription={description}
        currentIsNsfw={isNsfw}
        currentCtaLink={ctaLink}
        currentCharacterCategory={characterCategory}
        currentAllowMediaTypes={allowMediaTypes}
        defaultCtaLink={defaultCtaLink}
        onSuccess={onTagUpdated}
        canManageMods={canManageMods}
        onModeratorAdded={onTagUpdated}
        isGlobalAdmin={isGlobalAdmin}
      />

      <HiddenPostsModal
        isOpen={isHiddenPostsOpen}
        onClose={() => setIsHiddenPostsOpen(false)}
        tagId={tagId}
        tagName={tagName}
        onUnhide={onTagUpdated}
      />

      {/* Tag Info */}
      <div className='relative px-3 md:px-4'>
        {/* Mobile Layout */}
        <div className='md:hidden'>
          {/* Row 1: Avatar + Tag name + Actions */}
          <div className='flex items-center gap-3 py-3'>
            <div className='flex-shrink-0'>
              <Avatar
                src={
                  getTagHeaderLogoUrl(logoUrl) ||
                  'https://d31cygw67xifd4.cloudfront.net/covers/ai-art.webp'
                }
                name={tagName.charAt(0).toUpperCase()}
                className='w-12 h-12 text-lg border-2 border-white'
                classNames={{
                  img: 'object-cover object-top',
                }}
              />
            </div>

            <div className='flex-1 min-w-0'>
              <div className='text-lg font-bold text-heading truncate'>
                #{localizedTagName}
              </div>
            </div>

            <div className='flex items-center gap-2 flex-shrink-0'>
              {canAccessAdmin && (
                <AdminButtons
                  onHiddenPostsClick={() => setIsHiddenPostsOpen(true)}
                  onSettingsClick={() => setIsSettingsOpen(true)}
                  className='h-8 w-8 min-w-0'
                />
              )}
              <FollowButton
                isFollowing={isFollowing}
                isLoading={isLoading}
                onPress={handleFollowClick}
                size='sm'
              />
            </div>
          </div>

          {/* Row 2: Stats + NSFW + Mods */}
          <div className='flex items-center justify-between pb-3'>
            <div className='flex items-center gap-3'>
              <Stats
                postCount={postCount}
                followerCount={followerCount}
                gapClass='gap-4'
              />
              {isNsfw && <NsfwBadge size='sm' />}
            </div>
            <ModeratorsDisplay
              moderators={moderators}
              showApplyButton={showApplyButton}
              onApplyClick={handleApplyClick}
              size='sm'
            />
          </div>

          {/* Row 3: Description - always show, with fallback to default text */}
          <ExpandableDescription
            description={
              localizedDescription || t('pageDescription', { tag: tagName })
            }
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
            maxLines={4}
            textClass='text-default-500 dark:text-foreground text-xs'
          />
        </div>

        {/* Desktop Layout */}
        <div className='hidden md:block pt-2'>
          <div className='flex flex-row items-end gap-4'>
            <div className='flex-shrink-0 -mt-16 relative z-10'>
              <Avatar
                src={
                  getTagHeaderLogoUrl(logoUrl) ||
                  'https://d31cygw67xifd4.cloudfront.net/covers/ai-art.webp'
                }
                name={tagName.charAt(0).toUpperCase()}
                className='w-28 h-28 text-4xl border-4 border-white'
                classNames={{
                  img: 'object-cover object-top',
                }}
              />
            </div>

            <div className='flex-1 pb-1'>
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='text-3xl lg:text-4xl font-bold text-heading'>
                    #{localizedTagName}
                  </div>
                  {isNsfw && <NsfwBadge size='md' />}
                </div>

                <div className='flex items-center gap-2'>
                  {canAccessAdmin && (
                    <AdminButtons
                      onHiddenPostsClick={() => setIsHiddenPostsOpen(true)}
                      onSettingsClick={() => setIsSettingsOpen(true)}
                    />
                  )}
                  <FollowButton
                    isFollowing={isFollowing}
                    isLoading={isLoading}
                    onPress={handleFollowClick}
                    size='md'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats + Mods Row */}
          <div className='flex items-center justify-between mt-3'>
            <Stats
              postCount={postCount}
              followerCount={followerCount}
              gapClass='gap-6'
            />
            <ModeratorsDisplay
              moderators={moderators}
              showApplyButton={showApplyButton}
              onApplyClick={handleApplyClick}
              size='md'
            />
          </div>

          {/* Description - always show, with fallback to default text */}
          <div className='mt-3'>
            <ExpandableDescription
              description={
                localizedDescription ||
                t('pageDescription', { tag: localizedTagName })
              }
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded(!isExpanded)}
              maxLines={4}
              textClass='text-default-600 dark:text-foreground text-base'
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagHeader;
