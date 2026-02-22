/* eslint-disable */
import { useRouter } from 'next/router';
import Link from 'next/link';
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react';
import {
  Button,
  useDisclosure,
  Spinner,
  Skeleton,
  Card,
  CardBody,
  CardFooter,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  RadioGroup,
  Radio,
} from '@nextui-org/react';
import {
  isMobileAtom,
  postListAtom,
  pageAtom,
  tags,
  feedTagAtom,
  Post,
  profileAtom,
  authAtom,
} from '../../state';
import { SubscriptionStatus } from '../../../api/payment/_constant';

import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import useInfiniteScroll from './useInfiniteScrollNew'; // adjust the path as necessary
import { PostCard } from './PostCard';
import Masonry from 'react-masonry-css';
import { cn } from '@/lib/utils';
import { PWAInstallPost } from './PWAInstallPost';
import { ActivityPosts, ACTIVITY_POSTS_COUNT } from './ActivityPosts';
import { FeedPageSize } from '../../../api/_constants';
import toast from 'react-hot-toast';
import { toastError } from '@/utils/index';
import { useOpenModal } from '../../hooks/useOpenModal';
import { useBlockUser } from '../../hooks/useBlockUser';
import { useReportPost } from '../../hooks/useReportPost';
import { RankingContent } from './RankingContent';
import {
  IconCrown,
  IconPinFilled,
  IconClock,
  IconUsers,
  IconChevronDown,
  IconFlame,
  IconStar,
  IconTemplate,
  IconMovie,
  IconSearch,
  IconRefresh,
  IconMenu2,
} from '@tabler/icons-react';
import { TagOrderModal } from './TagOrderModal';
import { NsfwToggle } from '../NsfwToggle';
import { NativeBanner } from '@simula/ads';
import mixpanel from 'mixpanel-browser';

export const translationKeyMap = {
  1: 'preset_tags.oc',
  2: 'preset_tags.nsfw',
  5: 'preset_tags.genshin_impact',
  6: 'preset_tags.jujutsu_kaisen',
  7: 'preset_tags.spy_x_family',
  9: 'preset_tags.chainsaw_man',
  17: 'preset_tags.one_piece',
  20: 'preset_tags.pokemon',
  24: 'preset_tags.marvel',
  19418: 'preset_tags.anime',
  19419: 'preset_tags.game',
  19509: 'preset_tags.ship',
  20473: 'preset_tags.manga',
  20824: 'preset_tags.demon_slayer',
  21168: 'preset_tags.hatsune_miku',
  21544: 'preset_tags.animation',
  23587: 'preset_tags.naruto',
  38709: 'preset_tags.frieren',
  39431: 'preset_tags.furry',
  46021: 'preset_tags.hazbin_hotel',
  46905: 'preset_tags.my_hero_academia',
  54224: 'preset_tags.kawaii',
  57349: 'preset_tags.featured',
  57360: 'preset_tags.all_posts',
  87327: 'preset_tags.templates',
  136307: 'preset_tags.movie',
  136316: 'preset_tags.kpop_demon_hunters',
  144154: 'preset_tags.re_zero',
  19457: 'preset_tags.waifu',
  102038: 'preset_tags.husbando',
  24393: 'preset_tags.gay',
  48053: 'preset_tags.lesbian',
  360045: 'preset_tags.cthulhu',
  74328: 'preset_tags.gundam',
  437188: 'preset_tags.komikoChristmas',
  20905: 'preset_tags.harry_potter',
  433678: 'preset_tags.zootopia',
  30230: 'preset_tags.scenery',
  349487: 'preset_tags.scifi',
  430580: 'preset_tags.bankai',
  86768: 'preset_tags.dragon_ball', // Dragon Ball
  22: 'preset_tags.umamusume', // Umamusume
  81885: 'preset_tags.zenless_zone_zero', // Zenless Zone Zero
  105393: 'preset_tags.my_little_pony', // My Little Pony
  72685: 'preset_tags.street_fighter', // Street Fighter
};

// Special tag IDs
const FEATURED_TAG_ID = 57349;
const ALL_POSTS_TAG_ID = 57360;
const TEMPLATES_TAG_ID = 87327;
const ANIMATION_TAG_ID = 21544;
const SPECIAL_TAG_IDS = [
  FEATURED_TAG_ID,
  ALL_POSTS_TAG_ID,
  TEMPLATES_TAG_ID,
  ANIMATION_TAG_ID,
];

// 定义 API tag 的接�?
interface ApiTag {
  id: number;
  name: string;
  popularity: number;
  logo_url?: string | null;
  pinned_order?: number | null;
  is_nsfw?: boolean;
  allow_media_types?: 'all' | 'image' | 'video' | null;
  cta_text_translation?: Record<string, string> | null;
}

// 加载中的占位图组�?
const PostCardSkeleton = ({ index = 0 }: { index?: number }) => {
  const heights = [280, 320, 250, 300, 350, 270];
  const height = heights[index % heights.length];

  return (
    <div className='caffelabs text-foreground'>
      <Card className='mt-1 bg-transparent rounded-xl shadow-none'>
        <CardBody className='overflow-visible p-0 bg-background rounded-xl'>
          <Skeleton className='rounded-xl' disableAnimation>
            <div
              className='rounded-xl bg-default-300'
              style={{ height: `${height}px` }}></div>
          </Skeleton>
        </CardBody>
        <CardFooter className='justify-between pt-2 pr-3 pb-1 pl-3 text-sm'>
          <Skeleton className='rounded-lg w-4/5' disableAnimation>
            <div className='h-5 rounded-lg bg-default-200'></div>
          </Skeleton>
        </CardFooter>
        <CardFooter className='justify-between pt-0 pr-3 pb-3 pl-3 text-small'>
          <div className='flex items-center align-center'>
            <Skeleton className='rounded-full' disableAnimation>
              <div className='w-5 h-5 rounded-full bg-default-200'></div>
            </Skeleton>
            <Skeleton className='rounded-lg' disableAnimation>
              <div className='h-4 w-24 rounded-lg bg-default-200'></div>
            </Skeleton>
          </div>
          <div className='flex flex-col gap-1 items-start align-center'>
            <Skeleton className='rounded-lg' disableAnimation>
              <div className='h-4 w-12 rounded-lg bg-default-200'></div>
            </Skeleton>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

const NSFW_TAG_ID = 2;

const filterNSFW = (posts: Post[], allowNsfw: boolean) => {
  if (!Array.isArray(posts)) {
    return [];
  }
  if (allowNsfw) {
    return posts;
  }
  return posts.filter(
    post => !post.post_tags?.some(tag => tag.id === NSFW_TAG_ID),
  );
};

// Helper function to sort posts with pinned posts first
const sortWithPinnedFirst = (
  posts: Post[],
  pinnedPostIds: Set<number>,
): Post[] => {
  if (!Array.isArray(posts)) {
    return [];
  }
  if (pinnedPostIds.size === 0) {
    return posts;
  }
  const pinnedPosts = posts.filter(post => pinnedPostIds.has(post.id));
  const unpinnedPosts = posts.filter(post => !pinnedPostIds.has(post.id));
  return [...pinnedPosts, ...unpinnedPosts];
};

// Helper function to calculate the activity post index
const calculateActivityPostIndex = (index: number): number => {
  return Math.floor((index - 1) / 3);
};

// Simula 广告: 广告插入频率（每 N 个帖子插入 1 个广告）
const AD_FREQUENCY = 5;

const Feed = ({
  simple = false,
  tagId,
  prerenderedPosts = true,
  className,
  forceNavigation = false,
  isCharacterFeed = false,
  type = 'feed',
  user_uniqid = 'True',
  refreshId = 0,
  hideTagFilters = false,
  sortBy,
  featured = false,
  canFeatureForTagProp,
  externalNsfwMode,
  onNsfwModeChange,
  onSelectedTagChange,
  headerContent,
  hideContent = false,
  customContent,
  compact = false,
  floatingButton,
  allowMediaTypes,
}: {
  simple?: boolean;
  tagId?: number;
  prerenderedPosts?: boolean;
  className?: string;
  forceNavigation?: boolean;
  isCharacterFeed?: boolean;
  type?: 'feed' | 'profile' | 'meme';
  user_uniqid?: string;
  refreshId?: number;
  hideTagFilters?: boolean;
  sortBy?: 'Trending' | 'Newest' | 'Following';
  featured?: boolean;
  canFeatureForTagProp?: boolean; // If provided, skip fetching from API
  /** External NSFW mode control - when provided, Feed uses this instead of internal state */
  externalNsfwMode?: boolean;
  /** Callback when internal NSFW mode changes (only used when externalNsfwMode is not provided) */
  onNsfwModeChange?: (isNsfwMode: boolean) => void;
  /** Callback when selected tag changes */
  onSelectedTagChange?: (
    tagId: number | null,
    sortBy: 'Trending' | 'Newest' | 'Following',
  ) => void;
  /** Content to render between tag filter bar and feed content */
  headerContent?: React.ReactNode;
  /** Hide the feed content (used when showing characters tab) */
  hideContent?: boolean;
  /** Custom content to render instead of feed when hideContent is true */
  customContent?: React.ReactNode;
  /** Compact mode - adds background color to content area */
  compact?: boolean;
  /** Floating button to render at bottom (only shown in compact mode). Can be ReactNode or function receiving tag info */
  floatingButton?:
    | React.ReactNode
    | ((
        tag: { name: string; i18n?: Record<string, any> } | null,
        ctaTextTranslation?: Record<string, string> | null,
      ) => React.ReactNode);
  /** Allowed media types for this tag (video, image, or all/null for no filter) */
  allowMediaTypes?: 'all' | 'image' | 'video' | null;
}) => {
  const router = useRouter();
  const { t } = useTranslation(['feed', 'common']);
  const [list, setList] = useAtom(postListAtom);
  const [page, setPage] = useAtom(pageAtom);
  const [selectedTag, setSelectedTag] = useAtom(feedTagAtom);

  // Ensure selectedTag always has a valid value
  useEffect(() => {
    if (!selectedTag) {
      setSelectedTag('Trending');
    }
  }, [selectedTag, setSelectedTag]);
  // Use sortBy prop if provided, otherwise use atom value
  const effectiveSortBy = sortBy ?? selectedTag;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isMobile, setIsMobile] = useAtom(isMobileAtom);
  const profile = useAtomValue(profileAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  const [apiTags, setApiTags] = useState<ApiTag[]>([]);
  const [selectedApiTag, setSelectedApiTag] = useState<number | null>(
    tagId ?? FEATURED_TAG_ID, // 默认选中Featured tag
  );
  const [showRanking, setShowRanking] = useState(false);

  // Notify parent of initial selected tag on mount
  useEffect(() => {
    const initialTag = tagId ?? FEATURED_TAG_ID;
    onSelectedTagChange?.(initialTag, 'Trending');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAuth = useAtomValue(authAtom);

  // 初始化屏蔽用户列表
  const {
    fetchBlockedUsers,
    blockedUserIds,
    blockUser,
    unblockUser,
    isBlocked: isUserBlocked,
  } = useBlockUser();
  useEffect(() => {
    if (isAuth) {
      fetchBlockedUsers();
    }
  }, [isAuth, fetchBlockedUsers]);

  // Creat Yours Popover

  const [isLoadingTags, setIsLoadingTags] = useState(false);
  // const isLoadingRef = useRef(false);

  // Pinned posts state
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [isLoadingPinnedPosts, setIsLoadingPinnedPosts] = useState(false);
  const { submit: openModal } = useOpenModal();

  const [modalFullScreen, setModalFullScreen] = useState(false);
  const requestIdRef = useRef(0);

  // Tag-specific feature state
  const [canFeatureForTag, setCanFeatureForTag] = useState(false);
  const [tagFeaturedPosts, setTagFeaturedPosts] = useState<Set<number>>(
    new Set(),
  );

  // Tag-specific pin state
  const [canPinForTag, setCanPinForTag] = useState(false);
  const [tagPinnedPosts, setTagPinnedPosts] = useState<Set<number>>(new Set());
  // Track initial pinned posts for sorting (don't re-sort when user pins/unpins)
  const initialPinnedPostsRef = useRef<Set<number>>(new Set());

  // Tag-specific hide state
  const [canHideForTag, setCanHideForTag] = useState(false);
  const [tagHiddenPosts, setTagHiddenPosts] = useState<Set<number>>(new Set());

  // Tag ordering state
  const [followedTagIds, setFollowedTagIds] = useState<number[]>([]);
  const [tagOrder, setTagOrder] = useState<number[]>([]);
  const [defaultTagIds, setDefaultTagIds] = useState<number[]>([]);
  const [followedTagsData, setFollowedTagsData] = useState<ApiTag[]>([]);
  const {
    isOpen: isOrderModalOpen,
    onOpen: onOrderModalOpen,
    onClose: onOrderModalClose,
  } = useDisclosure();

  // NSFW mode state - used for API calls
  const [internalNsfwMode, setInternalNsfwMode] = useState(false);
  const [isNsfwEnabled, setIsNsfwEnabled] = useState(false);
  const nsfwRequiredTagIdsRef = useRef<Set<number>>(new Set([2]));
  const setNsfwMode = (value: boolean) => {
    setInternalNsfwMode(value);
    onNsfwModeChange?.(value);
  };

  const isNsfwRequiredTagId = useCallback((tagId: number | null) => {
    if (!tagId) return false;
    return nsfwRequiredTagIdsRef.current.has(tagId);
  }, []);

  // Check if user has NSFW permission (relax_content cookie)
  useEffect(() => {
    const hasNsfwPermission = document.cookie.includes('relax_content=true');
    setIsNsfwEnabled(hasNsfwPermission);
  }, []);

  const effectiveNsfwMode = externalNsfwMode ?? internalNsfwMode;
  const allowNsfwInList =
    // Always show NSFW on the authenticated user's own profile.
    (type === 'profile' && user_uniqid === 'True') ||
    // Otherwise, require permission cookie + explicit NSFW mode or NSFW tag selection.
    (isNsfwEnabled &&
      (effectiveNsfwMode || isNsfwRequiredTagId(selectedApiTag)));

  // Helper function to determine if we should insert an activity post
  const shouldInsertActivityPost = (index: number): boolean => {
    return (
      effectiveSortBy === 'Trending' &&
      !isCharacterFeed &&
      index % 3 === 1 &&
      Math.floor((index - 1) / 3) < ACTIVITY_POSTS_COUNT &&
      // All Posts 和Featured 都需要展示activity post
      (selectedApiTag === FEATURED_TAG_ID ||
        selectedApiTag === ALL_POSTS_TAG_ID ||
        !selectedApiTag)
    );
  };

  const paginationRef = useRef({
    pageNo: page,
    pageSize: 15,
  });

  // Sync tagId prop to selectedApiTag when it changes (for tag page navigation)
  useEffect(() => {
    if (tagId) {
      setSelectedApiTag(tagId);
      listParamsRef.current.apiTag = tagId;
    }
  }, [tagId]);

  useEffect(() => {
    if (router.query.tag_id) {
      const queryTagId = Number(router.query.tag_id);
      if (queryTagId) {
        setSelectedApiTag(queryTagId);
      }
    }
  }, [router.query.tag_id]);

  // Check URL query parameter and set Ranking if needed
  useEffect(() => {
    if (router.isReady && router.query.view === 'leaderboard') {
      setShowRanking(true);
    }
  }, [router.isReady, router.query.view]);

  // refresh oc relative post and effect examples
  useEffect(() => {
    if (tagId && (isCharacterFeed || hideTagFilters)) {
      setList([]);
    }
  }, [tagId, isCharacterFeed, hideTagFilters]);

  // 获取置顶贴文
  const fetchPinnedPosts = useCallback(async () => {
    if (
      effectiveSortBy !== 'Trending' ||
      isCharacterFeed ||
      (selectedApiTag !== FEATURED_TAG_ID &&
        selectedApiTag !== ALL_POSTS_TAG_ID)
    ) {
      return;
    }

    try {
      setIsLoadingPinnedPosts(true);
      const response = await fetch('/api/pinPost?action=list');

      if (response.ok) {
        const pinnedData = await response.json();
        // console.log(pinnedData, 'pinnedData');
        setPinnedPosts(posts => {
          const newPosts = pinnedData || [];
          const finalPosts = [...posts];
          for (const post of newPosts) {
            if (!finalPosts.find(p => p.id === post.id)) {
              finalPosts.push(post);
            }
          }
          return finalPosts;
        });
      } else {
        setPinnedPosts([]);
      }
    } catch (error) {
      setPinnedPosts([]);
    } finally {
      setIsLoadingPinnedPosts(false);
    }
  }, [effectiveSortBy, isCharacterFeed, selectedApiTag]);

  useEffect(() => {
    // 不进行与渲染时，type切换清空postListAtom
    if (!prerenderedPosts) {
      setList([]);
    }
  }, [type, prerenderedPosts]);

  // 获取置顶贴文
  useEffect(() => {
    if (type === 'feed') {
      // console.log('fetchPinnedPosts');
      fetchPinnedPosts();
    }
  }, [fetchPinnedPosts, type]);

  // 获取 API tags
  const fetchApiTags = useCallback(async () => {
    try {
      setIsLoadingTags(true);
      const searchParams = new URLSearchParams();
      searchParams.set('size', '20');
      if (router.query.tag_id || tagId) {
        searchParams.set(
          'include_ids',
          [router.query.tag_id, tagId].filter(t => !!t).join(','),
        );
      }

      const response = await fetch(`/api/tags?${searchParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        if (result.code) {
          // Update "NSFW required" set based on tag metadata (DB is_nsfw)
          const requiredIds = new Set<number>([2]);
          for (const tag of result.data as ApiTag[]) {
            if (tag?.is_nsfw) requiredIds.add(tag.id);
          }
          nsfwRequiredTagIdsRef.current = requiredIds;

          setApiTags(prevTags => {
            const newTagsMap = new Map(
              result.data.map((t: ApiTag) => [t.id, t]),
            );
            const preservedTags = prevTags.filter(t => !newTagsMap.has(t.id));
            return [...result.data, ...preservedTags];
          });
        }
      } else {
        console.error('Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setIsLoadingTags(false);
    }
  }, [router.query.tag_id, tagId]);

  // 在组件加载时获取 tags
  // Skip if hideTagFilters is true (e.g., on tag detail page) since tags won't be displayed
  useEffect(() => {
    if (type === 'feed' && !hideTagFilters) {
      fetchApiTags();
    }
  }, [fetchApiTags, type, hideTagFilters]);

  // Fetch followed tags and tag order (now from API with sort_order)
  // Also merge followed tags into apiTags if they're not in the hot tags list
  // Handles default tag initialization for new users
  const fetchFollowedTags = useCallback(async () => {
    if (!isAuth) return;

    try {
      const response = await fetch('/api/tag/follow');
      let result = await response.json();

      // Check if user needs initialization with default tags
      if (result.is_initialized === false) {
        // Initialize default tags for new user
        const initResponse = await fetch('/api/tag/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'initialize' }),
        });
        const initResult = await initResponse.json();
        if (initResult.followed_tags) {
          result = initResult;
        }
      }

      // Extract default tags (preset_order > 0) from API response
      if (result.default_tags && Array.isArray(result.default_tags)) {
        const defaultIds = result.default_tags.map((t: any) => t.tag_id);
        setDefaultTagIds(defaultIds);

        // Merge NSFW-required tag ids from RPC response
        const requiredIds = new Set(nsfwRequiredTagIdsRef.current);
        for (const tag of result.default_tags as any[]) {
          if (tag?.is_nsfw === true) requiredIds.add(tag.tag_id);
        }
        nsfwRequiredTagIdsRef.current = requiredIds;

        setApiTags(prevTags => {
          const existingIds = new Set(prevTags.map(t => t.id));
          const newDefaultTags = result.default_tags
            .filter((t: any) => !existingIds.has(t.tag_id))
            .map((t: any) => ({
              id: t.tag_id,
              name: t.tag_name,
              logo_url: t.tag_logo,
              popularity: t.tag_popularity || 0,
              is_nsfw: t.is_nsfw ?? false,
              allow_media_types: t.allow_media_types ?? null,
            }));
          return [...prevTags, ...newDefaultTags];
        });
      }

      if (result.followed_tags && Array.isArray(result.followed_tags)) {
        const followedIds = result.followed_tags.map((t: any) => t.tag_id);
        setFollowedTagIds(followedIds);

        // Merge NSFW-required tag ids from RPC response
        const requiredIds = new Set(nsfwRequiredTagIdsRef.current);
        for (const tag of result.followed_tags as any[]) {
          if (tag?.is_nsfw === true) requiredIds.add(tag.tag_id);
        }
        nsfwRequiredTagIdsRef.current = requiredIds;

        const orderFromApi = result.followed_tags
          .filter((t: any) => t.sort_order !== undefined && t.sort_order > 0)
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((t: any) => t.tag_id);

        if (orderFromApi.length > 0) {
          setTagOrder(orderFromApi);
        }

        // Store full followed tags data for modal
        const followedTagsFullData = result.followed_tags.map((t: any) => ({
          id: t.tag_id,
          name: t.tag_name,
          logo_url: t.tag_logo,
          popularity: t.tag_popularity || 0,
          is_nsfw: t.is_nsfw ?? false,
        }));
        setFollowedTagsData(followedTagsFullData);

        // Merge followed tags into apiTags if not already present
        setApiTags(prevTags => {
          const existingIds = new Set(prevTags.map(t => t.id));
          const newTags = followedTagsFullData.filter(
            (t: ApiTag) => !existingIds.has(t.id),
          );
          return [...prevTags, ...newTags];
        });
      }
    } catch (error) {
      console.error('Failed to fetch followed tags:', error);
    }
  }, [isAuth]);

  // Skip if hideTagFilters is true (e.g., on tag detail page) since tags won't be displayed
  useEffect(() => {
    if (type === 'feed' && !hideTagFilters) {
      fetchFollowedTags();
    }
  }, [fetchFollowedTags, type, hideTagFilters]);

  // Handle followed tags change - update local state and refresh from server
  const handleFollowedTagsChange = useCallback(
    (tagIds: number[]) => {
      setFollowedTagIds(tagIds);
      // Refresh from server to ensure UI is in sync
      fetchFollowedTags();
    },
    [fetchFollowedTags],
  );

  // Handle tag order save - now saves to API instead of localStorage
  const handleSaveTagOrder = useCallback(
    async (orderedTagIds: number[]) => {
      setTagOrder(orderedTagIds);

      // Save to API for cross-device sync
      try {
        const tagOrders = orderedTagIds.map((tagId, index) => ({
          tagId,
          sortOrder: index + 1, // 1-based sort order
        }));

        const response = await fetch('/api/tag/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reorder', tagOrders }),
        });

        if (response.ok) {
          toast.success(
            t('feed:tagOrder.saved', 'Tag order saved successfully'),
          );
        } else {
          throw new Error('Failed to save tag order');
        }
      } catch (error) {
        console.error('Failed to save tag order:', error);
        toast.error(t('feed:tagOrder.saveFailed', 'Failed to save tag order'));
      }
    },
    [t],
  );

  // Sort tags by custom order - for logged-in users, only show special tags + pinned tags + followed tags
  // Pinned tags (pinned_order > 0) are always shown after the separator, regardless of user subscription
  const getOrderedTags = useCallback(
    (tags: ApiTag[]) => {
      const specialTagIds = SPECIAL_TAG_IDS;
      const specialTags = tags.filter(t => specialTagIds.includes(t.id));

      const pinnedTags = tags
        .filter(
          t =>
            t.pinned_order != null &&
            t.pinned_order > 0 &&
            !specialTagIds.includes(t.id),
        )
        .sort((a, b) => (b.pinned_order ?? 0) - (a.pinned_order ?? 0));

      const pinnedTagIds = new Set(pinnedTags.map(t => t.id));

      const remainingTags = tags.filter(
        t => !specialTagIds.includes(t.id) && !pinnedTagIds.has(t.id),
      );

      // For non-logged-in users or users without followed tags: show special + pinned + other hot tags
      if (!isAuth || followedTagIds.length === 0) {
        return [...specialTags, ...pinnedTags, ...remainingTags];
      }

      // For logged-in users: show special + pinned + followed tags
      const followedTags = remainingTags.filter(t =>
        followedTagIds.includes(t.id),
      );

      // Apply custom order to followed tags
      let orderedFollowedTags = followedTags;
      if (tagOrder.length > 0) {
        orderedFollowedTags = [...followedTags].sort((a, b) => {
          const indexA = tagOrder.indexOf(a.id);
          const indexB = tagOrder.indexOf(b.id);

          // If both tags are in the custom order, sort by order
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // If only one is in the order, put it first
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          // Otherwise maintain original order
          return 0;
        });
      }

      // Order: special tags -> pinned tags -> followed tags
      return [...specialTags, ...pinnedTags, ...orderedFollowedTags];
    },
    [isAuth, followedTagIds, tagOrder],
  );

  // Memoized merged tags for modal - ensures all followed tags are included
  const tagsForModal = React.useMemo(() => {
    const apiTagIds = new Set(apiTags.map(t => t.id));
    const missingFollowedTags = followedTagsData.filter(
      t => !apiTagIds.has(t.id),
    );
    return [...apiTags, ...missingFollowedTags];
  }, [apiTags, followedTagsData]);

  // Check if user can feature posts for this tag
  // Check feature permission and get featured post IDs
  useEffect(() => {
    if (!tagId) {
      setCanFeatureForTag(false);
      setTagFeaturedPosts(new Set());
      return;
    }

    // If canFeatureForTagProp is provided but user is not auth, use it directly without API call
    if (canFeatureForTagProp !== undefined && !isAuth) {
      setCanFeatureForTag(canFeatureForTagProp);
    }

    const checkFeaturePermissionAndGetFeatured = async () => {
      try {
        const response = await fetch(
          `/api/tag/posts?tagId=${tagId}&check=feature`,
        );
        if (response.ok) {
          const data = await response.json();
          // Use prop if provided, otherwise use API response
          if (canFeatureForTagProp === undefined) {
            setCanFeatureForTag(data.can_feature === true);
          } else {
            setCanFeatureForTag(canFeatureForTagProp);
          }
          // Initialize featured posts from API
          if (data.featured_post_ids && Array.isArray(data.featured_post_ids)) {
            setTagFeaturedPosts(new Set<number>(data.featured_post_ids));
          }
        }
      } catch (error) {
        console.error('Error checking feature permission:', error);
        if (canFeatureForTagProp === undefined) {
          setCanFeatureForTag(false);
        }
      }
    };

    checkFeaturePermissionAndGetFeatured();
  }, [tagId, isAuth, canFeatureForTagProp]);

  // Handle tag-specific feature/unfeature
  const handleTagFeature = useCallback(
    async (
      postId: number,
      targetTagId: number,
      action: 'feature' | 'unfeature',
    ) => {
      try {
        const response = await fetch('/api/tag/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId: targetTagId, postId, action }),
        });

        if (response.ok) {
          const data = await response.json();
          setTagFeaturedPosts(prev => {
            const next = new Set(prev);
            if (data.is_featured) {
              next.add(postId);
            } else {
              next.delete(postId);
            }
            return next;
          });
          toast.success(data.message);
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to update feature status');
        }
      } catch (error) {
        console.error('Error updating tag feature status:', error);
        toast.error('Failed to update feature status');
      }
    },
    [],
  );

  // Check if user can pin posts for this tag and get pinned post IDs
  useEffect(() => {
    // In featured view, don't load pinned posts (they shouldn't be sorted/displayed as pinned)
    if (!tagId || featured) {
      setCanPinForTag(false);
      setCanHideForTag(false);
      setTagPinnedPosts(new Set());
      initialPinnedPostsRef.current = new Set();
      return;
    }

    const checkPinPermissionAndGetPinned = async () => {
      try {
        const response = await fetch(`/api/tag/posts?tagId=${tagId}&check=pin`);
        if (response.ok) {
          const data = await response.json();
          const canManage = isAuth && data.can_pin === true;
          setCanPinForTag(canManage);
          // Hide permission is same as pin permission (moderator or admin)
          setCanHideForTag(canManage);
          // Initialize pinned posts from API
          if (data.pinned_post_ids && Array.isArray(data.pinned_post_ids)) {
            const pinnedSet = new Set<number>(data.pinned_post_ids);
            setTagPinnedPosts(pinnedSet);
            // Store initial pinned posts for sorting (won't change on user actions)
            initialPinnedPostsRef.current = pinnedSet;
          }
        }
      } catch (error) {
        console.error('Error checking pin permission:', error);
        setCanPinForTag(false);
        setCanHideForTag(false);
      }
    };

    checkPinPermissionAndGetPinned();
  }, [tagId, isAuth, featured]);

  // Handle tag-specific pin/unpin
  const handleTagPin = useCallback(
    async (postId: number, targetTagId: number, action: 'pin' | 'unpin') => {
      try {
        const response = await fetch('/api/tag/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId: targetTagId, postId, action }),
        });

        if (response.ok) {
          const data = await response.json();
          // Update pinned posts state and ref
          setTagPinnedPosts(prev => {
            const next = new Set(prev);
            if (data.is_pinned) {
              next.add(postId);
            } else {
              next.delete(postId);
            }
            // Update ref for sorting
            initialPinnedPostsRef.current = next;
            return next;
          });
          toast.success(data.message);
          // Close modal before refreshing
          setActiveItemId(null);
          onClose();
          // Clear list and refetch to update order
          setList([]);
          paginationRef.current.pageNo = 1;
          // Small delay to ensure state updates are processed
          setTimeout(() => {
            fetchList(true);
          }, 100);
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to update pin status');
        }
      } catch (error) {
        console.error('Error updating tag pin status:', error);
        toast.error('Failed to update pin status');
      }
    },
    [],
  );

  // Handle tag-specific hide/unhide
  const handleTagHide = useCallback(
    async (postId: number, targetTagId: number, action: 'hide' | 'unhide') => {
      try {
        const response = await fetch('/api/tag/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId: targetTagId, postId, action }),
        });

        if (response.ok) {
          const data = await response.json();
          // Update hidden posts state
          setTagHiddenPosts(prev => {
            const next = new Set(prev);
            if (data.is_hidden) {
              next.add(postId);
            } else {
              next.delete(postId);
            }
            return next;
          });
          toast.success(data.message);
          // Close modal before refreshing
          setActiveItemId(null);
          onClose();
          // Clear list and refetch to update
          setList([]);
          paginationRef.current.pageNo = 1;
          setTimeout(() => {
            fetchList(true);
          }, 100);
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to update hide status');
        }
      } catch (error) {
        console.error('Error updating tag hide status:', error);
        toast.error('Failed to update hide status');
      }
    },
    [],
  );

  const cancelController = useRef<AbortController | null>(null);

  // 首次加载时pageNo�?，需要标记一下；只要发生tag切换的交互，置为false
  const isInitialRef = useRef(prerenderedPosts);

  const listParamsRef = useRef<{
    tag: string;
    apiTag: number | null;
    featured: boolean;
  }>({
    tag: 'Trending',
    apiTag: null,
    featured: false,
  });

  const fetchList = async (isInitial = false, nsfwModeParam?: boolean) => {
    // Use passed parameter if provided, otherwise fall back to current state
    const effectiveNsfwMode =
      nsfwModeParam ?? externalNsfwMode ?? internalNsfwMode;

    setIsLoading(true);
    requestIdRef.current++;
    const requestId = requestIdRef.current;
    const tag = listParamsRef.current.tag;
    const apiTag = listParamsRef.current.apiTag;
    const isFeatured = listParamsRef.current.featured;

    let url = '';

    // Use dedicated featured API for tag featured posts
    if (isFeatured && apiTag && apiTag !== ALL_POSTS_TAG_ID) {
      url = `/api/tag/featured?tagId=${apiTag}&page=${isInitial ? 1 : paginationRef.current.pageNo}&sortBy=${tag === 'Trending' ? 'featured' : 'newest'}`;
    } else if (type === 'profile') {
      url = `/api/fetchFeed?page=${isInitial ? 1 : paginationRef.current.pageNo}&sortby=${tag}&useronly=${user_uniqid}`;
      // 只有明确传了 tagId 时才�?tag 参数（用�?CharacterFeed �?My Posts�?
      if (tagId && apiTag && apiTag !== ALL_POSTS_TAG_ID) {
        url += `&tag=${apiTag}`;
      }
    } else if (type === 'meme') {
      url = `/api/fetchFeed?page=${isInitial ? 1 : paginationRef.current.pageNo}&sortby=Newest&tagsonly=Meme,Comic`;
    } else {
      url = `/api/fetchFeed?page=${isInitial ? 1 : paginationRef.current.pageNo}&sortby=${tag}&mainfeedonly=True`;
      // All Posts tag (id: 57360) 特殊处理，显示所有的post
      if (apiTag && apiTag !== ALL_POSTS_TAG_ID) {
        url += `&tag=${apiTag}`;
      }
    }

    // Add mode parameter for NSFW filtering
    // Check cookie directly to avoid race condition with state initialization
    const hasNsfwPermission =
      typeof document !== 'undefined' &&
      document.cookie.includes('relax_content=true');
    // Also add mode=nsfw when an NSFW-required tag is selected (e.g. NSFW, porn)
    const isNsfwTagSelected = isNsfwRequiredTagId(apiTag);
    if ((effectiveNsfwMode || isNsfwTagSelected) && hasNsfwPermission) {
      url += `&mode=nsfw`;
    }

    // Add mediaType filter based on tag's allow_media_types setting
    // Use prop if provided, otherwise look up from apiTags
    const effectiveAllowMediaTypes =
      allowMediaTypes ?? apiTags.find(t => t.id === apiTag)?.allow_media_types;
    if (effectiveAllowMediaTypes && effectiveAllowMediaTypes !== 'all') {
      url += `&mediaType=${effectiveAllowMediaTypes}`;
    }

    const controller = new AbortController();
    // const timeoutId = setTimeout(() => controller.abort(), 10000);
    // isLoadingRef.current = true;
    setIsLoadingMore(true);

    cancelController.current = controller;

    const response = await fetch(url, {
      signal: controller.signal,
    }).catch();

    cancelController.current = null;

    try {
      if (!response?.ok) {
        // throw new Error('Failed to fetch list');
        console.error('Failed to fetch list');
        setError(t('feed:rrors.loadFailed', 'Failed to load feed'));
        return;
      }
      if (requestId !== requestIdRef.current) {
        return;
      }

      const posts = await response.json();
      if (!posts || !Array.isArray(posts)) {
        setHasMore(false);
        return;
      }
      // console.log(posts, 'posts');
      const freePostsCount = posts.filter(
        post => post.user_plan === 'Free',
      ).length;
      const paidPostsCount = posts.filter(
        post => post.user_plan !== 'Free',
      ).length;
      if (
        freePostsCount < FeedPageSize.FREE &&
        paidPostsCount < FeedPageSize.PAID
      ) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      paginationRef.current.pageNo++;
      if (isInitial) {
        setList(posts);
        return;
      }
      setList(prev => {
        const newList = [...prev];
        // console.log('posts', prev);
        for (const post of posts) {
          if (!newList.find(p => p.id === post.id)) {
            newList.push(post);
          }
        }
        return newList;
      });
    } catch (e) {
      setError(t('feed:errors.loadFailed', 'Failed to load feed'));
      console.error('Error fetching list:', e);
    } finally {
      // isLoadingRef.current = false;
      cancelController.current = null;
      isInitialRef.current = false;
      setIsLoadingMore(false);
      setIsLoading(false);
    }
  };

  const cancelFetchList = () => {
    console.log('cancelFetchList');
    cancelController.current?.abort('cancel');
    cancelController.current = null;
  };

  // Cancel pending requests when component unmounts (e.g., when switching tabs)
  useEffect(() => {
    return () => {
      cancelFetchList();
    };
  }, []);

  useEffect(() => {
    paginationRef.current.pageNo = isInitialRef.current ? 2 : page;
    paginationRef.current.pageSize = 10;
    // isLoadingRef.current = false;
    setIsLoading(false);
    setHasMore(true);
    // console.log('paginationRef', paginationRef.current);
    setError(null);
    setInitialLoadError(null);
    setPaginationError(null);
    listParamsRef.current.tag = effectiveSortBy;
    listParamsRef.current.apiTag = selectedApiTag;
    listParamsRef.current.featured = featured;
  }, [effectiveSortBy, selectedApiTag, featured]);

  const clearState = () => {
    setList([]); // Clear the list
    setPage(1); // Reset to the first page when the tag changes
    setHasMore(true);
    setError(null);
    setInitialLoadError(null);
    setPaginationError(null);
    isInitialRef.current = false;
  };

  useEffect(() => {
    if (!apiTags?.length) {
      return;
    }
    if (!tagId && !router.query.tag_id) {
      let selectedApiTag = localStorage.getItem('selectedApiTag');
      // 默认选中的是Featured tag，不需要处理，防止重复加载
      if (selectedApiTag === String(FEATURED_TAG_ID)) {
        return;
      }
      if (isAuth && !selectedApiTag) {
        selectedApiTag = String(ALL_POSTS_TAG_ID);
      }
      if (selectedApiTag) {
        setSelectedApiTag(Number(selectedApiTag));
        onSelectedTagChange?.(
          Number(selectedApiTag),
          effectiveSortBy as 'Trending' | 'Newest' | 'Following',
        );
        setIsLoading(true);
        clearState();
        cancelFetchList();
        setTimeout(() => {
          // 用setTimeout执行，防止在同一个tick里面abortController与fetchList同时执行
          listParamsRef.current.apiTag = Number(selectedApiTag);
          fetchList(true);
        }, 100);
      }
    }
  }, [tagId, router.query.tag_id, apiTags, isAuth]);

  useEffect(() => {
    if (refreshId) {
      // 先设�?loading 状态，防止�?setTimeout 期间显示 "No posts found"
      setIsLoading(true);
      clearState();
      cancelFetchList();
      setTimeout(() => {
        fetchList(true);
      }, 100);
    }
  }, [refreshId]);

  // Track previous externalNsfwMode to detect changes
  const prevExternalNsfwModeRef = useRef<boolean | undefined>(externalNsfwMode);

  // Refetch when externalNsfwMode changes (for tag/character pages)
  useEffect(() => {
    // Skip initial mount - only react to changes
    if (prevExternalNsfwModeRef.current === externalNsfwMode) {
      return;
    }
    prevExternalNsfwModeRef.current = externalNsfwMode;

    // Only refetch if externally controlled and value actually changed
    if (externalNsfwMode !== undefined) {
      setList([]);
      paginationRef.current.pageNo = 1;
      setHasMore(true);
      fetchList(true, externalNsfwMode);
    }
  }, [externalNsfwMode]);

  // ssr 渲染时，prerenderedPosts为true
  const initialLoadDoneRef = useRef(false);
  useEffect(() => {
    if (!prerenderedPosts && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      if (selectedApiTag !== null) {
        listParamsRef.current.apiTag = selectedApiTag;
      }
      if (type === 'profile' && user_uniqid && user_uniqid !== 'True') {
        setList([]);
        setTimeout(() => {
          fetchList(true);
        }, 50);
      } else {
        fetchList(true);
      }
    }
  }, [prerenderedPosts]);

  // 在oc页面和effect页面�?刷新列表
  useEffect(() => {
    if (
      selectedApiTag &&
      list.length === 0 &&
      !isLoading &&
      !prerenderedPosts &&
      (isCharacterFeed || hideTagFilters) &&
      hasMore
    ) {
      const timeoutId = setTimeout(() => {
        // Ensure apiTag is synced before fetch
        listParamsRef.current.apiTag = selectedApiTag;
        fetchList(true);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [
    selectedApiTag,
    list.length,
    isLoading,
    prerenderedPosts,
    isCharacterFeed,
    hideTagFilters,
    hasMore,
  ]);

  // 处理pinned post
  // 1. 查出来的post list中存在pinned post那么将pinned post 插入到pinnedPosts�?
  // 2. 在list剔除pinned post
  useEffect(() => {
    if (list.length > 0) {
      const pinnedPosts = list.filter(post => post.post_pinned);
      if (pinnedPosts.length <= 0) {
        return;
      }
      setPinnedPosts(posts => {
        const newPosts = pinnedPosts || [];
        const finalPosts = [...posts];
        for (const post of newPosts) {
          if (!finalPosts.find(p => p.id === post.id)) {
            finalPosts.push(post);
          }
        }
        return finalPosts;
      });
      // console.log('pinnedPosts', pinnedPosts);
      setList(posts => {
        const newPosts = pinnedPosts || [];
        const finalPosts: Post[] = [];
        for (const post of posts) {
          if (!newPosts.find(p => p.id === post.id)) {
            finalPosts.push(post);
          }
        }
        return finalPosts;
      });
    }
  }, [list]);

  const [lastElementRef] = useInfiniteScroll(fetchList, {
    rootMargin: '0px 0px 0px 0px',
    threshold: 0.01,
  });

  // ! HANDLE TAG (排序方式)
  const handleTagChange = (tag: string) => {
    console.log(`切换排序标签�?${tag}`);
    listParamsRef.current.tag = tag;
    if (tag !== selectedTag) {
      setSelectedTag(tag);
    }
    onSelectedTagChange?.(
      selectedApiTag,
      tag as 'Trending' | 'Newest' | 'Following',
    );
    setIsLoading(true);
    clearState();
    cancelFetchList();
    setTimeout(() => {
      fetchList(true);
    }, 100);
  };

  // ! HANDLE RANKING
  const handleRankingClick = () => {
    setShowRanking(true);
    setSelectedApiTag(null);
    onSelectedTagChange?.(
      null,
      effectiveSortBy as 'Trending' | 'Newest' | 'Following',
    );

    // Update URL query parameter
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, view: 'leaderboard' },
      },
      undefined,
      { shallow: true },
    );
  };

  // ! HANDLE API TAG (筛选条�?
  const handleApiTagChange = (tagId: number) => {
    console.log(`切换筛选标签到 ${tagId}`);

    // Clear ranking view
    if (showRanking) {
      setShowRanking(false);
      // Remove view query param
      const { view, ...restQuery } = router.query;
      router.push(
        {
          pathname: router.pathname,
          query: restQuery,
        },
        undefined,
        { shallow: true },
      );
    }

    // NSFW-required tags special handling (e.g. NSFW, porn)
    if (isNsfwRequiredTagId(tagId)) {
      const nsfwConfirmed = document.cookie.includes('relax_content=true');

      if (nsfwConfirmed) {
        // 已经确认过，直接切换
        if (tagId === selectedApiTag) {
          setSelectedApiTag(null);
          localStorage.removeItem('selectedApiTag');
        } else {
          setSelectedApiTag(tagId);
          localStorage.setItem('selectedApiTag', tagId.toString());
        }
        setIsLoading(true);
        clearState();
        cancelFetchList();

        // 用setTimeout执行，防止在同一个tick里面abortController与fetchList同时执行
        setTimeout(() => {
          fetchList(true);
        }, 100);
      } else {
        // 第一次点击NSFW，显示确认modal
        openModal('nsfw', {
          onConfirm: () => {
            // 切换到NSFW tag
            setSelectedApiTag(2);
            setIsLoading(true);
            clearState();
            cancelFetchList();
            // NSFWModal 已经设置�?cookie，这里更新状态让 NsfwToggle 显示
            setIsNsfwEnabled(true);

            // 用setTimeout执行，防止在同一个tick里面abortController与fetchList同时执行
            setTimeout(() => {
              fetchList(true);
            }, 100);
          },
        });
      }
      return;
    }

    // 其他tag正常处理
    if (tagId === selectedApiTag) {
      // setSelectedApiTag(null);
      // localStorage.removeItem('selectedApiTag');
      return;
    }
    setSelectedApiTag(tagId);
    localStorage.setItem('selectedApiTag', tagId.toString());
    onSelectedTagChange?.(
      tagId,
      effectiveSortBy as 'Trending' | 'Newest' | 'Following',
    );
    setIsLoading(true);
    clearState();
    cancelFetchList();
    setTimeout(() => {
      // 用setTimeout执行，防止在同一个tick里面abortController与fetchList同时执行
      fetchList(true);
    }, 100);
  };

  // ! HANDLE LIKE
  const handleLike = async (id: number) => {
    // Check if the post is in the regular list
    const isInList = list.some(item => item.id === id);
    // Check if the post is in the pinned posts
    const isInPinnedPosts = pinnedPosts.some(item => item.id === id);

    // Update regular list if post is there
    if (isInList) {
      const updatedList = list.map(item => {
        if (item.id === id) {
          console.log(item);
          const updatedItem = {
            ...item,
            liked: !item.liked,
            votes: item.liked ? item.votes - 1 : item.votes + 1,
          };
          let voteValue = 0;
          if (item.liked) {
            voteValue = -1;
          } else {
            voteValue = 1;
          }

          // Make API call to update like count on the server
          fetch('/api/vote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: item.id,
              parentCommentId: null,
              authUserId: null,
              value: voteValue,
            }),
          });
          return updatedItem;
        }
        return item;
      });
      setList(updatedList);
    }

    // Update pinned posts if post is there
    if (isInPinnedPosts) {
      const updatedPinnedPosts = pinnedPosts.map(item => {
        if (item.id === id) {
          const updatedItem = {
            ...item,
            liked: !item.liked,
            votes: item.liked ? item.votes - 1 : item.votes + 1,
          };
          let voteValue = 0;
          if (item.liked) {
            voteValue = -1;
          } else {
            voteValue = 1;
          }

          // Make API call to update like count on the server
          fetch('/api/vote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              postId: item.id,
              parentCommentId: null,
              authUserId: null,
              value: voteValue,
            }),
          });
          return updatedItem;
        }
        return item;
      });
      setPinnedPosts(updatedPinnedPosts);
    }
  };

  // ! HANDLE FOLLOW
  const handleFollow = async (id: number) => {
    // Check if the post is in the regular list
    const isInList = list.some(item => item.id === id);
    // Check if the post is in the pinned posts
    const isInPinnedPosts = pinnedPosts.some(item => item.id === id);

    // Update regular list if post is there
    if (isInList) {
      const updatedList = list.map(item => {
        if (item.id === id) {
          console.log(item);
          const updatedItem = { ...item, followed: !item.followed };
          let followValue = 0;
          if (item.followed) {
            followValue = -1;
          } else {
            followValue = 1;
          }

          // Make API call to update follow
          fetch('/api/follow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              followingUserId: item.authUserId,
              value: followValue,
            }),
          });
          return updatedItem;
        }
        return item;
      });
      setList(updatedList);
    }

    // Update pinned posts if post is there
    if (isInPinnedPosts) {
      const updatedPinnedPosts = pinnedPosts.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, followed: !item.followed };
          let followValue = 0;
          if (item.followed) {
            followValue = -1;
          } else {
            followValue = 1;
          }

          // Make API call to update follow
          fetch('/api/follow', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              followingUserId: item.authUserId,
              value: followValue,
            }),
          });
          return updatedItem;
        }
        return item;
      });
      setPinnedPosts(updatedPinnedPosts);
    }
  };

  // ! HANDLE COMMENT
  const handleCommentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setComment(event.target.value);
  };

  let canCall = true;
  const handleComment = async (
    id: number,
    parentCommentId?: number,
    replyToUserId?: string,
    replyToCommentId?: number,
  ) => {
    if (!canCall) {
      console.log('Cooldown active. Please wait.');
      return;
    }

    if (!comment.trim()) {
      console.log('Empty comment. Skipping.');
      return;
    }

    canCall = false;

    setTimeout(() => {
      canCall = true;
    }, 3000);

    // Check if the post is in the regular list
    const isInList = list.some(item => item.id === id);
    // Check if the post is in the pinned posts
    const isInPinnedPosts = pinnedPosts.some(item => item.id === id);

    // Update regular list if post is there
    if (isInList) {
      const updatedList = await Promise.all(
        list.map(async item => {
          if (item.id === id) {
            console.log(`postid ${item.id}`);

            console.log(
              JSON.stringify({
                postId: item.id,
                commentId: null,
                authUserId: null,
                content: comment,
                replyToUserId,
              }),
            );
            // Make API call to update like count on the server
            const response = await fetch('/api/comment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                postId: item.id,
                parentCommentId,
                replyToUserId,
                content: comment,
                item,
                replyToCommentId,
              }),
            });

            const new_comments = await response.json();
            if (!response.ok) {
              // throw new Error(new_comments.error || 'Failed to post comment');
              toastError(new_comments.error || 'Failed to post comment');
              return item;
            }

            const updatedItem = {
              ...item,
              comments: new_comments,
            };
            return updatedItem;
          }
          return item;
        }),
      );
      setList(updatedList);
    }

    // Update pinned posts if post is there
    if (isInPinnedPosts) {
      const updatedPinnedPosts = await Promise.all(
        pinnedPosts.map(async item => {
          if (item.id === id) {
            // Make API call to update comment on the server
            const response = await fetch('/api/comment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                postId: item.id,
                parentCommentId,
                replyToUserId,
                content: comment,
                item,
                replyToCommentId,
              }),
            });

            const new_comments = await response.json();
            if (!response.ok) {
              throw new Error(new_comments.error || 'Failed to post comment');
            }

            const updatedItem = {
              ...item,
              comments: new_comments,
            };
            return updatedItem;
          }
          return item;
        }),
      );
      setPinnedPosts(updatedPinnedPosts);
    }

    setComment('');
  };

  // 处理hide post
  const handleHidePost = (postId: number) => {
    // 从列表中移除被hide的post
    setList(prevList => prevList.filter(post => post.id !== postId));
    // 也从pinned posts中移除
    setPinnedPosts(prevList => prevList.filter(post => post.id !== postId));
  };

  // 检查用户是否为admin
  const isAdmin = profile.roles?.includes(1) || false; // 1是ADMIN角色

  // 判断是否显示更多选项：如果是自己的post、admin用户、或者已登录用户（可以屏蔽）
  const shouldShowMore = (item: Post) => {
    return item.authUserId === profile?.id || isAdmin || isAuth;
  };

  const shouldShowDelete = (item: Post) => {
    return item.authUserId === profile?.id;
  };

  // 处理屏蔽用户
  const [blockConfirmTarget, setBlockConfirmTarget] = useState<{
    userId: string;
    userName: string;
    isBlocked: boolean;
  } | null>(null);

  const handleBlockUser = useCallback(
    (userId: string, userName: string) => {
      const blocked = isUserBlocked(userId);
      setBlockConfirmTarget({ userId, userName, isBlocked: blocked });
    },
    [isUserBlocked],
  );

  const confirmBlockUser = useCallback(async () => {
    if (!blockConfirmTarget) return;
    const { userId, userName, isBlocked: wasBlocked } = blockConfirmTarget;

    let success = false;
    if (wasBlocked) {
      success = await unblockUser(userId, userName);
    } else {
      success = await blockUser(userId, userName);
      // 乐观更新：从列表中移除该用户的所有帖子
      if (success) {
        setList(prevList =>
          prevList.filter(post => post.authUserId !== userId),
        );
        setPinnedPosts(prevList =>
          prevList.filter(post => post.authUserId !== userId),
        );
      }
    }

    setBlockConfirmTarget(null);
  }, [blockConfirmTarget, blockUser, unblockUser, setList, setPinnedPosts]);

  // 处理举报帖子
  const { reportPost } = useReportPost();
  const [reportConfirmPostId, setReportConfirmPostId] = useState<number | null>(
    null,
  );
  const [reportReason, setReportReason] = useState<string>('inappropriate');

  const handleReportPost = useCallback((postId: number) => {
    setReportConfirmPostId(postId);
  }, []);

  // 关闭举报 Modal 并重置选择
  const handleReportModalClose = useCallback(() => {
    setReportConfirmPostId(null);
    setReportReason('inappropriate');
  }, []);

  const confirmReportPost = useCallback(async () => {
    if (!reportConfirmPostId) return;

    const success = await reportPost(reportConfirmPostId, reportReason);
    if (success) {
      // 乐观更新：从列表中移除被举报的帖子
      setList(prevList =>
        prevList.filter(post => post.id !== reportConfirmPostId),
      );
      setPinnedPosts(prevList =>
        prevList.filter(post => post.id !== reportConfirmPostId),
      );
    }

    setReportConfirmPostId(null);
    setReportReason('inappropriate');
  }, [reportConfirmPostId, reportReason, reportPost, setList, setPinnedPosts]);

  // ! HANDLE MODAL
  const handleBeforeUnload = () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
  };

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('scrollPosition');
    }
  }, []);

  const checkIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleOpen = (id: number, uniqid: string) => {
    if (isMobile || forceNavigation) {
      // handleBeforeUnload();
      // router.push(`/post/${uniqid}`);
      // onOpen();
      handleBeforeUnload();
      if (!router.pathname.includes('[')) {
        router.push(
          { pathname: router.pathname, query: { mobileModal: id } },
          undefined,
          {
            scroll: false,
            shallow: true,
          },
        );
      }
    }
    onOpen();
    setActiveItemId(id);
  };

  const handleClose = () => {
    setActiveItemId(null);
    onClose();
    if (isMobile && !router.pathname.includes('[')) {
      // Only update URL on non-dynamic routes
      router.push({ pathname: router.pathname, query: {} }, undefined, {
        scroll: false,
        shallow: true,
      });
    }
  };

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    // console.log('router.query.mobileModal', router.query.mobileModal);
    if (router.query.mobileModal) {
      onOpen();
      setActiveItemId(parseInt(router.query.mobileModal as string));
      setModalFullScreen(true);
    } else {
      onClose();
      setModalFullScreen(false);
      const y = sessionStorage.getItem('scrollPosition');
      if (y) {
        requestAnimationFrame(() => window.scrollTo(0, Number(y)));
      }
    }
  }, [router.isReady, router.query.mobileModal]);

  // ! HANDLE MODAL SIZE
  const adjustHeight = useCallback(() => {
    const img = document.getElementById('leftElement');
    const rightElement = document.getElementById('rightElement');
    if (img && rightElement) {
      rightElement.style.height = `${img.offsetHeight - 1}px`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', adjustHeight);

    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, [adjustHeight]);

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure the modal content has rendered
      setTimeout(adjustHeight, 10);
      setTimeout(adjustHeight, 100);
      setTimeout(adjustHeight, 250);
      setTimeout(adjustHeight, 500);
    }
  }, [isOpen, adjustHeight]);

  // Simula 广告: 提取上下文数据用于广告定向
  const getAdContext = useCallback(() => {
    const selectedTagObj = apiTags.find(t => t.id === selectedApiTag);
    const tagName = selectedTagObj
      ? translationKeyMap[selectedTagObj.id as keyof typeof translationKeyMap]
        ? t(
            `common:${translationKeyMap[selectedTagObj.id as keyof typeof translationKeyMap]}`,
          )
        : selectedTagObj.name
      : null;

    return {
      searchTerm:
        (Array.isArray(router.query.search)
          ? router.query.search[0]
          : router.query.search) || '',
      tags: tagName ? [tagName] : [],
      category: tagName || 'All',
      title: tagName || 'Explore',
      nsfw: effectiveNsfwMode || isNsfwRequiredTagId(selectedApiTag),
      userProfile: profile?.plan || 'Free',
      // userEmail 已移除 - 避免将 PII 传递给第三方广告 SDK
      customContext: {
        sortBy: effectiveSortBy || 'Trending',
        authenticated: String(isAuth),
        locale: router.locale || 'en',
      },
    };
  }, [
    apiTags,
    selectedApiTag,
    t,
    router.query.search,
    router.locale,
    effectiveNsfwMode,
    isNsfwRequiredTagId,
    profile?.plan,
    profile?.email,
    effectiveSortBy,
    isAuth,
  ]);

  // 缓存广告上下文，避免在 map 循环中重复计算
  const adContext = useMemo(() => getAdContext(), [getAdContext]);

  const renderContent = () => {
    // Render Ranking content when Ranking is active
    if (showRanking) {
      return <RankingContent />;
    }

    // Show spinner instead of skeleton when switching tabs/filters with existing data
    if (isLoading && list.length === 0) {
      return (
        <div className='flex justify-center items-center h-64'>
          <Spinner size='lg' color='primary' />
        </div>
      );
    }

    if ((initialLoadError || error) && list.length === 0) {
      return (
        <div className='flex justify-center items-center h-64 text-center'>
          <div>
            <p className='text-danger mb-4'>{initialLoadError || error}</p>
            <Button
              className='bg-primary text-primary-foreground px-4 py-2 rounded-lg'
              onPress={() => {
                setError(null);
                setInitialLoadError(null);
                setPaginationError(null);
                // const cacheKey = selectedApiTag
                //   ? `${selectedTag}_api_tag_${selectedApiTag}`
                //   : selectedTag;
                // hasAttemptedInitialLoad.current[cacheKey] = false;
                // memoizedFetchMoreData(true);
                fetchList(true);
              }}>
              {t('feed:actions.tryAgain', 'Try Again')}
            </Button>
          </div>
        </div>
      );
    }

    // 创建缓存键，组合排序和筛选条�?
    // const cacheKey = selectedApiTag
    //   ? `${selectedTag}_api_tag_${selectedApiTag}`
    //   : selectedTag;

    if (
      list.length === 0 &&
      // hasAttemptedInitialLoad.current[cacheKey] &&
      // initialLoadCompleteRef.current[cacheKey] &&
      !isLoading
    ) {
      return (
        <div className='flex justify-center items-center h-64'>
          <div className='text-center'>
            <p className='text-muted-foreground text-lg mb-4'>
              {t('feed:states.noPostsFound', 'No posts found')}
            </p>
            <Button
              className='px-4 py-2 rounded-full'
              color='default'
              startContent={<IconRefresh size={16} />}
              onClick={() => {
                // 重置分页�?page 1 重新加载
                paginationRef.current.pageNo = 1;
                fetchList(true);
              }}>
              {t('feed:actions.refresh', 'Refresh')}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <Masonry
          breakpointCols={{
            default: 6,
            '3000': 5,
            '2400': 4,
            '1200': 3,
            '640': 2,
          }}
          className='flex gap-2 md:gap-3 mx-0 w-full justify-center'
          columnClassName='my-masonry-grid_column'>
          {/* - 只在 Trending 页面显示并且置顶 */}
          {effectiveSortBy === 'Trending' &&
            !isCharacterFeed &&
            (selectedApiTag === FEATURED_TAG_ID ||
              selectedApiTag === ALL_POSTS_TAG_ID ||
              !selectedApiTag) &&
            type === 'feed' && (
              <>
                {pinnedPosts.map(item => (
                  <PostCard
                    key={item.id}
                    item={item}
                    handleOpen={handleOpen}
                    handleLike={handleLike}
                    handleFollow={handleFollow}
                    handleComment={handleComment}
                    handleCommentChange={handleCommentChange}
                    comment={comment}
                    isOpen={isOpen && activeItemId === item.id}
                    handleClose={handleClose}
                    useAnchor
                    showMore={shouldShowMore(item)}
                    onHidePost={handleHidePost}
                    shouldShowDelete={shouldShowDelete(item)}
                    isFullScreen={modalFullScreen}
                    modalFullScreen={modalFullScreen}
                    tagId={tagId}
                    canFeatureForTag={canFeatureForTag}
                    isTagFeatured={tagFeaturedPosts.has(item.id)}
                    onTagFeature={handleTagFeature}
                    canPinForTag={!featured && canPinForTag}
                    isTagPinned={!featured && tagPinnedPosts.has(item.id)}
                    onTagPin={handleTagPin}
                    canHideForTag={!featured && canHideForTag}
                    isTagHidden={!featured && tagHiddenPosts.has(item.id)}
                    onTagHide={handleTagHide}
                    onBlockUser={handleBlockUser}
                    isAuthorBlocked={isUserBlocked(item.authUserId)}
                    onReportPost={handleReportPost}
                  />
                ))}
                {/* <ActivityPosts index={0} /> */}
                <PWAInstallPost />
              </>
            )}

          {/* 交错显示 Regular Posts 和剩余的 Activity Posts */}
          {sortWithPinnedFirst(
            filterNSFW(list, allowNsfwInList),
            // Only apply pinned sorting on tag pages (not featured view)
            featured ? new Set<number>() : initialPinnedPostsRef.current,
          ).map((item, index) => (
            <React.Fragment key={`fragment-${item.id}-${item.uniqid}`}>
              {/* 每隔3个post插入一个activity post, 只在 Trending 页面显示 */}
              {shouldInsertActivityPost(index) && type === 'feed' && (
                <ActivityPosts index={calculateActivityPostIndex(index)} />
              )}

              {/* Simula 广告: 每隔 AD_FREQUENCY 个帖子插入一个原生广告（会员用户不显示） */}
              {!showRanking &&
                !isCharacterFeed &&
                (index + 1) % AD_FREQUENCY === 0 &&
                list.length > 0 &&
                profile.subscription_status !== SubscriptionStatus.ACTIVE && (
                  <div className='mb-4'>
                    <NativeBanner
                      slot='explore'
                      position={Math.floor((index + 1) / AD_FREQUENCY)}
                      context={adContext}
                      onImpression={(ad: { id: string }) => {
                        try {
                          mixpanel.track('Ad Impression', {
                            ad_id: ad.id,
                            position: Math.floor((index + 1) / AD_FREQUENCY),
                            tag: selectedApiTag,
                            sort_by: effectiveSortBy,
                          });
                        } catch (e) {
                          // 追踪失败不影响用户体验
                        }
                      }}
                      onError={(err: Error) => {
                        console.error('Simula Ad Error:', err);
                      }}
                    />
                  </div>
                )}

              {/* Regular Post */}
              <PostCard
                key={`post-${item.id}-${item.uniqid}`}
                item={item}
                handleOpen={handleOpen}
                handleLike={handleLike}
                handleFollow={handleFollow}
                handleComment={handleComment}
                handleCommentChange={handleCommentChange}
                comment={comment}
                isOpen={isOpen && activeItemId === item.id}
                handleClose={handleClose}
                useAnchor
                showMore={shouldShowMore(item)}
                onHidePost={handleHidePost}
                shouldShowDelete={shouldShowDelete(item)}
                isFullScreen={modalFullScreen}
                modalFullScreen={modalFullScreen}
                tagId={tagId}
                canFeatureForTag={canFeatureForTag}
                isTagFeatured={tagFeaturedPosts.has(item.id)}
                onTagFeature={handleTagFeature}
                canPinForTag={!featured && canPinForTag}
                isTagPinned={!featured && tagPinnedPosts.has(item.id)}
                onTagPin={handleTagPin}
                canHideForTag={(() => {
                  const result = !featured && canHideForTag;
                  return result;
                })()}
                isTagHidden={!featured && tagHiddenPosts.has(item.id)}
                onTagHide={handleTagHide}
                onBlockUser={handleBlockUser}
                isAuthorBlocked={isUserBlocked(item.authUserId)}
                onReportPost={handleReportPost}
              />
            </React.Fragment>
          ))}

          {/* 加载中的占位�?*/}
          {isLoadingMore &&
            Array(4)
              .fill(0)
              .map((_, index) => (
                <PostCardSkeleton
                  key={`loading-skeleton-${index}`}
                  index={index}
                />
              ))}
        </Masonry>

        {/* 分页错误提示 - 显示在内容底部，不影响已有内�?*/}
        {paginationError && list.length > 0 && (
          <div className='flex justify-center items-center mt-4 mb-4'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-center max-w-md'>
              <p className='text-red-600 mb-2 text-sm'>{paginationError}</p>
              <Button
                size='sm'
                className='bg-red-500 text-primary-foreground'
                onClick={() => {
                  setPaginationError(null);
                  // memoizedFetchMoreData(false);
                  fetchList();
                }}>
                {t('feed:actions.retry', 'Retry')}
              </Button>
            </div>
          </div>
        )}

        {/* 底部加载指示�?*/}
        {isLoadingMore && (
          <div className='flex justify-center items-center h-8 w-full mt-2 mb-4'>
            <Spinner size='sm' color='default' />
          </div>
        )}

        {!hasMore && list.length > 0 && (
          <div className='flex justify-center mt-8 mb-8'>
            <p className='text-muted-foreground'>
              {t('feed:states.noMorePosts', 'No more posts to load')}
            </p>
          </div>
        )}

        {/* 无限滚动触发元素  */}
        {hasMore && list.length > 0 && (
          <div
            ref={lastElementRef}
            style={{ height: 20, padding: 0, margin: 0 }}
            className='w-full'
          />
        )}
      </>
    );
  };

  return (
    <div
      className={cn('caffelabs text-foreground w-full flex-grow ', className)}>
      {!simple && !hideTagFilters && (
        <div className='flex gap-1 items-center h-8 mb-3'>
          <div className='flex-shrink-0 flex items-center gap-0.5 h-8'>
            <Button
              radius='full'
              size='sm'
              variant='flat'
              isIconOnly={isMobile}
              className={`min-h-8 h-8 py-0 bg-default-100 dark:bg-primary-400/10 hover:bg-default-200 dark:hover:bg-primary-400/20 text-foreground text-sm ${!isMobile ? 'px-3 gap-1.5' : ''}`}
              onPress={() => router.push('/search')}
              startContent={!isMobile ? <IconSearch size={16} /> : undefined}>
              {isMobile ? (
                <IconSearch size={16} />
              ) : (
                t('search:input_placeholder')
              )}
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  radius='full'
                  size='sm'
                  color='primary'
                  variant='flat'
                  isIconOnly={isMobile}
                  className='min-h-8 h-8 py-0 flex-shrink-0 bg-default-100 dark:bg-primary-400/10 hover:bg-default-200 dark:hover:bg-primary-400/20 text-foreground text-sm'
                  startContent={
                    !isMobile ? (
                      selectedTag === 'Trending' ? (
                        <IconFlame size={16} />
                      ) : selectedTag === 'Newest' ? (
                        <IconClock size={16} />
                      ) : (
                        <IconUsers size={16} />
                      )
                    ) : undefined
                  }
                  endContent={
                    !isMobile ? <IconChevronDown size={14} /> : undefined
                  }
                  aria-label={`Sort by: ${t(`tags.${selectedTag?.toLowerCase() || 'trending'}`)}`}>
                  {isMobile ? (
                    selectedTag === 'Trending' ? (
                      <IconFlame size={14} />
                    ) : selectedTag === 'Newest' ? (
                      <IconClock size={14} />
                    ) : (
                      <IconUsers size={14} />
                    )
                  ) : (
                    <>
                      {selectedTag === 'Trending' && t('tags.trending')}
                      {selectedTag === 'Newest' && t('tags.newest')}
                      {selectedTag === 'Following' && t('tags.following')}
                    </>
                  )}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label='Sort options'
                selectedKeys={[selectedTag]}
                onAction={key => {
                  handleTagChange(key as string);
                }}
                selectionMode='single'
                className='text-sm'>
                <DropdownItem
                  key='Trending'
                  startContent={<IconFlame size={16} />}
                  aria-label='Sort by trending'
                  className='text-sm'>
                  {t('tags.trending')}
                </DropdownItem>
                <DropdownItem
                  key='Newest'
                  startContent={<IconClock size={16} />}
                  aria-label='Sort by newest'
                  className='text-sm'>
                  {t('tags.newest')}
                </DropdownItem>
                <DropdownItem
                  key='Following'
                  startContent={<IconUsers size={16} />}
                  aria-label='Sort by following'
                  className='text-sm'>
                  {t('tags.following')}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* 分隔�?- 仅桌面端显示 */}
          <div className='hidden md:block w-px h-5 bg-border flex-shrink-0 self-center'></div>

          {/* 标签区域 */}
          <div
            className='flex items-center md:mt-[3px] h-8 md:h-12 overflow-x-auto flex-1
            [&::-webkit-scrollbar]:h-1
            [&::-webkit-scrollbar]:mt-1
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-border
            [&::-webkit-scrollbar-track]:bg-transparent
            [scrollbar-width:thin]
            [scrollbar-color:hsl(var(--border))_transparent]'>
            <div className='flex gap-1.5 items-center h-8'>
              {isLoadingTags
                ? // 加载中的占位
                  Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <Skeleton
                        key={`tag-skeleton-${index}`}
                        className='rounded-full w-20 h-8 flex-shrink-0'
                        disableAnimation
                      />
                    ))
                : getOrderedTags(apiTags).map((tag, index, orderedTags) => {
                    const shouldInsertRanking = tag.id === ANIMATION_TAG_ID;
                    const isSpecialTag = SPECIAL_TAG_IDS.includes(tag.id);
                    // 第一个非特殊标签前面需要分隔符（仅桌面端）
                    const isFirstHashTag =
                      !isMobile &&
                      !isSpecialTag &&
                      index > 0 &&
                      SPECIAL_TAG_IDS.includes(orderedTags[index - 1]?.id);

                    const getTagIcon = (tagId: number) => {
                      const icons: Record<number, React.ReactNode> = {
                        [FEATURED_TAG_ID]: (
                          <IconStar size={16} className='text-cyan-500' />
                        ),
                        [TEMPLATES_TAG_ID]: (
                          <IconTemplate size={16} className='text-blue-500' />
                        ),
                        [ANIMATION_TAG_ID]: (
                          <IconMovie size={16} className='text-green-500' />
                        ),
                      };
                      return icons[tagId];
                    };

                    const tagIcon = getTagIcon(tag.id);
                    // Check if this is a pinned tag
                    const isPinnedTag =
                      tag.pinned_order != null && tag.pinned_order > 0;
                    const avatarContent =
                      !tagIcon && tag.logo_url ? (
                        <span className='w-5 h-5 rounded-full overflow-hidden bg-card flex items-center justify-center'>
                          <img
                            src={`${tag.logo_url}?width=40&height=40&resize=cover&quality=60`}
                            alt={tag.name}
                            className='w-full h-full object-cover object-top'
                          />
                        </span>
                      ) : undefined;

                    // Pin icon shown at the end for pinned tags (without logo or special icon)
                    const pinIconContent =
                      !tagIcon && !tag.logo_url && isPinnedTag ? (
                        <IconPinFilled className='w-3 h-3' />
                      ) : undefined;

                    // 根据 tag.id 设置对应的背景色、边框色和文字颜�?
                    const getTagStyles = (
                      tagId: number,
                      isSelected: boolean,
                    ) => {
                      if (!isSelected) {
                        return 'bg-default-100 dark:bg-primary-400/10 hover:bg-default-200 dark:hover:bg-primary-400/20 text-foreground';
                      }
                      const styles: Record<number, string> = {
                        [FEATURED_TAG_ID]:
                          'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 border-1 text-cyan-700 dark:text-cyan-300',
                        [TEMPLATES_TAG_ID]:
                          'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 border-1 text-blue-700 dark:text-blue-300',
                        [ANIMATION_TAG_ID]:
                          'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 border-1 text-green-700 dark:text-green-300',
                      };
                      return (
                        styles[tagId] ||
                        'bg-primary-50 dark:bg-primary-900/30 border-primary-300 border-1 text-primary-700 dark:text-primary-300'
                      );
                    };

                    return (
                      <React.Fragment key={tag.id}>
                        {/* 分隔�?- 在第一�?#tag 前面（仅桌面端） */}
                        {isFirstHashTag && (
                          <div className='w-px h-5 bg-border self-center flex-shrink-0'></div>
                        )}

                        <Button
                          onClick={() => handleApiTagChange(tag.id)}
                          radius='full'
                          size='sm'
                          variant='flat'
                          color='default'
                          startContent={tagIcon || avatarContent}
                          endContent={pinIconContent}
                          className={`min-h-8 h-8 py-0 flex-shrink-0 md:text-sm text-xs px-2 ${getTagStyles(
                            tag.id,
                            selectedApiTag === tag.id && !showRanking,
                          )}`}>
                          {/* 特殊标签不需要展�? */}
                          {!isSpecialTag && !tag.logo_url ? '#' : ''}
                          {/* {tag.name} */}
                          {(() => {
                            // Priority 1: Use translationKeyMap for preset tags
                            if (translationKeyMap[tag.id]) {
                              return t(`common:${translationKeyMap[tag.id]}`);
                            }

                            // Priority 2: Check if tag.name looks like an i18n key (e.g., "titles.xxx")
                            const looksLikeI18nKey = tag.name.match(
                              /^[a-z_]+\.[a-zA-Z0-9_]+$/,
                            );
                            if (looksLikeI18nKey) {
                              // Try to translate it using style-templates namespace
                              const translated = t(
                                `style-templates:${tag.name}`,
                                { defaultValue: '' },
                              );
                              if (
                                translated &&
                                translated !== `style-templates:${tag.name}`
                              ) {
                                return translated;
                              }
                              // If translation failed, format the key as Title Case
                              const parts = tag.name.split('.');
                              const key = parts[parts.length - 1];
                              return key
                                .split(/(?=[A-Z])/)
                                .map(
                                  word =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                                )
                                .join(' ');
                            }

                            // Priority 3: Use tag.name as-is
                            return tag.name;
                          })()}
                        </Button>

                        {/* Insert Ranking button after Animation */}
                        {shouldInsertRanking && (
                          <Button
                            onPress={() => handleRankingClick()}
                            startContent={
                              <IconCrown
                                size={16}
                                className='text-yellow-500'
                              />
                            }
                            radius='full'
                            size='sm'
                            variant='flat'
                            color='default'
                            className={`min-h-8 h-8 py-0 flex-shrink-0 text-xs md:text-sm ${
                              showRanking
                                ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 border-1 text-yellow-700 dark:text-yellow-300'
                                : 'bg-default-100 dark:bg-primary-400/10 hover:bg-default-200 dark:hover:bg-primary-400/20 text-foreground'
                            }`}>
                            {t('tags.leaderboard')}
                          </Button>
                        )}
                      </React.Fragment>
                    );
                  })}
            </div>
          </div>

          {/* 右侧图标区域 */}
          <div className='flex-shrink-0 flex items-center gap-0.5 ml-auto'>
            {/* Tag Order Menu Button - only show if user has followed tags */}
            {isAuth && followedTagIds.length > 0 && (
              <Button
                isIconOnly
                size='sm'
                variant='light'
                radius='sm'
                color='default'
                className='flex-shrink-0'
                onPress={onOrderModalOpen}
                aria-label='Customize tag order'>
                <IconMenu2 size={16} />
              </Button>
            )}

            {/* NSFW Mode Toggle - at the end of tag bar */}
            {/* When NSFW tag (id: 2) is selected, toggle is active and disabled */}
            {/* When Leaderboard is selected, toggle is inactive and disabled (no NSFW mode for leaderboard) */}
            <NsfwToggle
              onModeChange={isNsfwMode => {
                setNsfwMode(isNsfwMode);
                // Reset list and refetch with new mode
                setList([]);
                paginationRef.current.pageNo = 1;
                setHasMore(true);
                // Pass mode directly to avoid stale closure issue
                fetchList(true, isNsfwMode);
              }}
              forceShow={isNsfwEnabled || isNsfwRequiredTagId(selectedApiTag)}
              isActive={
                !showRanking &&
                (isNsfwRequiredTagId(selectedApiTag) || internalNsfwMode)
              }
              disabled={showRanking || isNsfwRequiredTagId(selectedApiTag)}
            />
          </div>
        </div>
      )}

      {/* Tag Order Modal */}
      <TagOrderModal
        isOpen={isOrderModalOpen}
        onClose={onOrderModalClose}
        tags={tagsForModal}
        followedTagIds={followedTagIds}
        tagOrder={tagOrder}
        defaultTagIds={defaultTagIds}
        onSaveOrder={handleSaveTagOrder}
        onFollowedTagsChange={handleFollowedTagsChange}
      />

      {compact && headerContent && !showRanking ? (
        <div
          className={`bg-muted/80 p-2 pt-0 md:p-3 md:pt-1 mt-2 ${hideContent && customContent ? 'rounded-2xl' : 'rounded-t-2xl'}`}>
          {headerContent}
          {hideContent ? customContent : renderContent()}
        </div>
      ) : (
        <>
          {headerContent}
          {hideContent ? customContent : renderContent()}
        </>
      )}

      {/* Floating Button (compact mode only, exclude special tags) */}
      {(() => {
        if (
          !compact ||
          showRanking ||
          !selectedApiTag ||
          SPECIAL_TAG_IDS.includes(selectedApiTag)
        ) {
          return null;
        }
        const selectedTag = apiTags.find(t => t.id === selectedApiTag);
        const floatingButtonContent =
          typeof floatingButton === 'function'
            ? floatingButton(
                selectedTag
                  ? {
                      name: selectedTag.name,
                      i18n: selectedTag.i18n,
                    }
                  : null,
                selectedTag?.cta_text_translation ?? null,
              )
            : floatingButton;
        return floatingButtonContent;
      })()}

      {/* Block User Confirmation Modal */}
      {blockConfirmTarget && (
        <Modal
          isOpen={!!blockConfirmTarget}
          onClose={() => setBlockConfirmTarget(null)}
          classNames={{
            wrapper: 'z-[110]',
            backdrop: 'z-[109]',
          }}>
          <ModalContent>
            <ModalHeader>
              {blockConfirmTarget.isBlocked
                ? t('common:block.confirmUnblockTitle', {
                    name: blockConfirmTarget.userName,
                  })
                : t('common:block.confirmBlockTitle', {
                    name: blockConfirmTarget.userName,
                  })}
            </ModalHeader>
            <ModalBody>
              {blockConfirmTarget.isBlocked ? (
                <p>{t('common:block.unblockDescription')}</p>
              ) : (
                <ul className='list-disc pl-4 space-y-1 text-sm text-default-600'>
                  <li>{t('common:block.blockDescription1')}</li>
                  <li>{t('common:block.blockDescription2')}</li>
                  <li>{t('common:block.blockDescription3')}</li>
                </ul>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                onPress={() => setBlockConfirmTarget(null)}>
                {t('common:block.buttonCancel')}
              </Button>
              <Button
                color={blockConfirmTarget.isBlocked ? 'primary' : 'danger'}
                onPress={confirmBlockUser}>
                {blockConfirmTarget.isBlocked
                  ? t('common:block.buttonUnblock')
                  : t('common:block.buttonBlock')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Report Post Confirmation Modal */}
      {reportConfirmPostId && (
        <Modal
          isOpen={!!reportConfirmPostId}
          onClose={handleReportModalClose}
          classNames={{
            wrapper: 'z-[110]',
            backdrop: 'z-[109]',
          }}>
          <ModalContent>
            <ModalHeader>{t('common:report.confirmTitle')}</ModalHeader>
            <ModalBody>
              <p className='text-sm text-default-600'>
                {t('common:report.selectReason')}
              </p>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <Radio
                  value='inappropriate'
                  description={t(
                    'common:report.reasons.inappropriate.description',
                  )}>
                  {t('common:report.reasons.inappropriate.label')}
                </Radio>
                <Radio
                  value='spam'
                  description={t('common:report.reasons.spam.description')}>
                  {t('common:report.reasons.spam.label')}
                </Radio>
                <Radio
                  value='hate_speech'
                  description={t(
                    'common:report.reasons.hate_speech.description',
                  )}>
                  {t('common:report.reasons.hate_speech.label')}
                </Radio>
                <Radio
                  value='violence'
                  description={t('common:report.reasons.violence.description')}>
                  {t('common:report.reasons.violence.label')}
                </Radio>
                <Radio
                  value='copyright'
                  description={t(
                    'common:report.reasons.copyright.description',
                  )}>
                  {t('common:report.reasons.copyright.label')}
                </Radio>
                <Radio
                  value='other'
                  description={t('common:report.reasons.other.description')}>
                  {t('common:report.reasons.other.label')}
                </Radio>
              </RadioGroup>
              <p className='text-xs text-default-400 mt-2'>
                {t('common:report.warning')}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={handleReportModalClose}>
                {t('common:report.buttonCancel')}
              </Button>
              <Button color='danger' onPress={confirmReportPost}>
                {t('common:report.buttonReport')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default memo(Feed);
