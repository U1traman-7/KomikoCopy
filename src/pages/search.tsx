import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Button,
  Input,
  Chip,
  Spinner,
  Avatar,
  useDisclosure,
} from '@nextui-org/react';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import { useTranslation } from 'react-i18next';
import { SiteFooter } from '@/components/site-footer';
import { PostCard } from '../Components/Feed/PostCard';
import { Post, Character, authAtom, profileAtom } from '../state';
import Masonry from 'react-masonry-css';
import {
  featuredTemplateCategories,
  FeaturedTemplate,
} from '../data/featuredTemplates';
import {
  i2iStyleTemplatesCategories,
  getI2IStyleTemplatesCategoriesAsync,
} from '@/components/StyleTemplatePicker/styles/image';
import {
  effectTemplates,
  getEffectTemplatesAsync,
} from '@/components/StyleTemplatePicker/styles/video';
import useInfiniteScroll from '../Components/Feed/useInfiniteScroll';
import { CharacterCardItem } from '@/components/character/CharacterCardItem';
import { useLoginModal } from '@/hooks/useLoginModal';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { usePostOperations } from '@/hooks/usePostOperations';
import { useAtomValue } from 'jotai';
import TemplateCard from '../Components/TemplateCard';
import { NsfwToggle } from '../Components/NsfwToggle';

const USERS_GRID_COLS = { base: 3, sm: 4, md: 5, lg: 6, xl: 8 };
const CHARACTERS_GRID_COLS = { base: 3, sm: 4, md: 5, lg: 6, xl: 8 };
const TEMPLATES_GRID_COLS = { base: 2, sm: 2, md: 3, lg: 4, xl: 5 };
const ROWS_LIMIT = 2;

interface SearchUser {
  id: string;
  user_name: string;
  user_uniqid: string;
  image: string;
  num_followers?: number;
  num_following?: number;
  is_followed?: boolean;
}

type FilterType =
  | 'all'
  | 'users'
  | 'characters'
  | 'templates'
  | 'tags'
  | 'posts';

export default function SearchPage() {
  const router = useRouter();
  const { t } = useTranslation(['search', 'style-templates']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchResults, setSearchResults] = useState({
    tags: [] as { id: number; name: string; is_nsfw?: boolean }[],
    works: [] as Post[],
    characters: [] as Character[],
    users: [] as SearchUser[],
    templates: [] as FeaturedTemplate[],
  });
  const [hasMoreWorks, setHasMoreWorks] = useState(true);
  const [isLoadingMoreWorks, setIsLoadingMoreWorks] = useState(false);
  const worksPageRef = useRef(1);

  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const usersOffsetRef = useRef(0);
  const USERS_PAGE_SIZE = 20;
  const [nsfwMode, setNsfwMode] = useState(false);
  const nsfwModeRef = useRef(false);

  // 模板数据状态
  const [imageTemplates, setImageTemplates] = useState(
    i2iStyleTemplatesCategories,
  );
  const [videoTemplates, setVideoTemplates] = useState(effectTemplates);
  const [isLoadingModeSwitch, setIsLoadingModeSwitch] = useState(false);

  const { onOpen: openLoginModal } = useLoginModal(false, true);
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);

  const setWorksList = useCallback((updater: React.SetStateAction<Post[]>) => {
    setSearchResults(prev => ({
      ...prev,
      works: typeof updater === 'function' ? updater(prev.works) : updater,
    }));
  }, []);

  // 使用 usePostOperations hook
  const {
    shouldShowMore,
    shouldShowDelete,
    handleLike: handlePostLike,
    handleFollow: handlePostFollow,
    handleHidePost,
    handleComment: handlePostComment,
    handleCommentChange: handlePostCommentChange,
    comment: postComment,
  } = usePostOperations({
    profile,
    isAuth,
    openLoginModal,
    setList: setWorksList,
  });

  const {
    isOpen: isPostModalOpen,
    onOpen: onPostModalOpen,
    onClose: onPostModalClose,
  } = useDisclosure();
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [modalFullScreen, setModalFullScreen] = useState(false);
  const {
    history: searchHistory,
    saveHistory: saveSearchHistory,
    removeHistory: removeSearchHistory,
    clearHistory: clearSearchHistory,
  } = useSearchHistory();

  const lastSearchQueryRef = useRef<string>('');

  // 跟踪窗口宽度，用于判断一行能显示多少个
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 加载模板数据
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const [imageTemplatesFromDB, videoTemplatesFromDB] = await Promise.all([
          getI2IStyleTemplatesCategoriesAsync(),
          getEffectTemplatesAsync(),
        ]);

        setImageTemplates(imageTemplatesFromDB);
        setVideoTemplates(videoTemplatesFromDB);
        console.log('Search page templates loaded from database:', {
          imageCategories: imageTemplatesFromDB?.length,
          videoCategories: videoTemplatesFromDB?.length,
        });
      } catch (error) {
        console.error('Search page failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const isMobile = windowWidth < 768;

  // 根据窗口宽度获取当前一行的列数
  const getColsForWidth = (gridCols: typeof USERS_GRID_COLS) => {
    if (windowWidth >= 1280) {
      return gridCols.xl;
    }
    if (windowWidth >= 1024) {
      return gridCols.lg;
    }
    if (windowWidth >= 768) {
      return gridCols.md;
    }
    if (windowWidth >= 640) {
      return gridCols.sm;
    }
    return gridCols.base;
  };

  useEffect(() => {
    const q = router.query.q as string;
    if (q) {
      setSearchQuery(q);
      if (q !== lastSearchQueryRef.current) {
        lastSearchQueryRef.current = q;
        performSearch(q, true);
      }
    } else {
      setIsLoading(false);
      setSearchResults({
        tags: [],
        works: [],
        characters: [],
        users: [],
        templates: [],
      });
      lastSearchQueryRef.current = '';
    }
  }, [router.query.q]);

  // 监听mobileModal参数变化，处理手机端modal显示
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (router.query.mobileModal) {
      onPostModalOpen();
      setActivePostId(parseInt(router.query.mobileModal as string));
      setModalFullScreen(true);
    } else {
      onPostModalClose();
      setModalFullScreen(false);
      // 恢复滚动位置
      const y = sessionStorage.getItem('scrollPosition');
      if (y) {
        requestAnimationFrame(() => window.scrollTo(0, Number(y)));
      }
    }
  }, [
    router.isReady,
    router.query.mobileModal,
    onPostModalOpen,
    onPostModalClose,
  ]);

  const performSearch = async (query: string, skipHistory = false) => {
    if (!query.trim()) {
      return;
    }
    setIsLoading(true);
    if (!skipHistory) {
      saveSearchHistory(query);
    }
    router.push(`/search?q=${encodeURIComponent(query)}`, undefined, {
      shallow: true,
    });
    worksPageRef.current = 1;
    setHasMoreWorks(true);
    usersOffsetRef.current = 0;
    setHasMoreUsers(true);
    await fetchAllSearchResults(query);
  };

  const fetchAllSearchResults = async (query: string, isNsfwMode?: boolean) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    // Use passed parameter, ref, or state (in that order of priority)
    const effectiveNsfwMode = isNsfwMode ?? nsfwModeRef.current;
    const modeParam = effectiveNsfwMode ? '&mode=nsfw' : '';

    try {
      const [tagsRes, worksRes, charactersRes, usersRes] = await Promise.all([
        fetch(
          `/api/tags?search_text=${encodeURIComponent(trimmedQuery)}&current=0&size=10${modeParam}`,
        ),
        fetch(
          `/api/search/posts?q=${encodeURIComponent(trimmedQuery)}&page=1&sort=newest&limit=20${modeParam}`,
        ),
        fetch(
          `/api/characters?search=${encodeURIComponent(trimmedQuery)}&official=${!effectiveNsfwMode}&limit=20&offset=0&sort=popular${modeParam}`,
        ),
        fetch(
          `/api/search/users?search=${encodeURIComponent(trimmedQuery)}&limit=20&offset=0`,
        ),
      ]);

      const tagsData = tagsRes.ok ? await tagsRes.json() : null;
      let worksData: any[] = [];
      if (worksRes.ok) {
        const data = await worksRes.json();
        worksData = data?.code === 1 ? data.data?.posts || [] : [];
      }
      const charactersData = charactersRes.ok
        ? await charactersRes.json()
        : null;
      const usersData = usersRes.ok ? await usersRes.json() : null;

      const lowerQuery = trimmedQuery.toLowerCase();
      const featuredTemplates = featuredTemplateCategories.flatMap(
        cat => cat.templates,
      );

      const imageStyleTemplates: FeaturedTemplate[] = imageTemplates
        .flatMap(cat => cat.templates)
        .map(template => ({
          id: template.id,
          nameKey: `style-templates:titles.${template.nameKey.replace('titles.', '')}`,
          media: {
            type: 'image' as const,
            src: template.image,
          },
          tool: 'playground' as const,
          route: {
            path: '/playground',
            query: { style: template.id },
          },
        }));

      const videoEffectTemplates: FeaturedTemplate[] = videoTemplates
        .flatMap(cat => cat.templates)
        .map(template => ({
          id: template.id,
          nameKey: `style-templates:effects.${template.nameKey}`,
          media: {
            type: 'video' as const,
            src: template.video,
          },
          tool: 'videoEffects' as const,
          route: {
            path: '/ai-video-effects',
            query: { effect: template.id },
          },
        }));
      const allTemplatesMap = new Map<string, FeaturedTemplate>();
      [
        ...featuredTemplates,
        ...imageStyleTemplates,
        ...videoEffectTemplates,
      ].forEach(t => {
        if (!allTemplatesMap.has(t.id)) {
          allTemplatesMap.set(t.id, t);
        }
      });

      const filteredTemplates = Array.from(allTemplatesMap.values())
        .filter(template => {
          const nameKey = template.nameKey;
          try {
            const translatedName = t(nameKey, { ns: 'style-templates' });
            return (
              translatedName.toLowerCase().includes(lowerQuery) ||
              nameKey.toLowerCase().includes(lowerQuery) ||
              template.id.toLowerCase().includes(lowerQuery)
            );
          } catch {
            return (
              nameKey.toLowerCase().includes(lowerQuery) ||
              template.id.toLowerCase().includes(lowerQuery)
            );
          }
        })
        .slice(0, 30);

      const tagsList =
        tagsData?.code === 1
          ? Array.isArray(tagsData.data)
            ? tagsData.data
            : []
          : [];

      // NSFW 过滤：当不在 NSFW 模式时，过滤掉 is_nsfw = true 的 tag
      // 注意：用户必须有 relax_content cookie 才能看到 NSFW 内容
      const hasNsfwPermission =
        typeof document !== 'undefined' &&
        document.cookie.includes('relax_content=true');
      const filteredTagsList =
        effectiveNsfwMode && hasNsfwPermission
          ? tagsList
          : tagsList.filter(
              (tag: { is_nsfw?: boolean }) => tag.is_nsfw !== true,
            );

      const usersList =
        usersData?.code === 1 ? usersData.data?.users || [] : [];
      const usersTotal = usersData?.code === 1 ? usersData.data?.total || 0 : 0;

      setSearchResults({
        tags: filteredTagsList.slice(0, 10),
        works: worksData || [],
        characters:
          charactersData?.code === 1
            ? (charactersData.data?.characters || []).slice(0, 20)
            : [],
        users: usersList.slice(0, 20),
        templates: filteredTemplates,
      });

      // Check if there are more users to load
      if (
        usersList.length < USERS_PAGE_SIZE ||
        usersList.length >= usersTotal
      ) {
        setHasMoreUsers(false);
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch posts, characters, and tags (used for NSFW mode switching)
  const fetchNsfwModeData = async (query: string, isNsfwMode: boolean) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    setIsLoadingModeSwitch(true);
    const modeParam = isNsfwMode ? '&mode=nsfw' : '';

    try {
      const [postsRes, charactersRes, tagsRes] = await Promise.all([
        fetch(
          `/api/search/posts?q=${encodeURIComponent(trimmedQuery)}&page=1&sort=newest&limit=20${modeParam}`,
        ),
        fetch(
          `/api/characters?search=${encodeURIComponent(trimmedQuery)}&official=${!isNsfwMode}&limit=20&offset=0&sort=popular${modeParam}`,
        ),
        fetch(
          `/api/tags?search_text=${encodeURIComponent(trimmedQuery)}&current=0&size=10${modeParam}`,
        ),
      ]);

      const updates: Partial<typeof searchResults> = {};

      if (postsRes.ok) {
        const data = await postsRes.json();
        const worksData = data?.code === 1 ? data.data?.posts || [] : [];
        updates.works = worksData;
        worksPageRef.current = 1;
        setHasMoreWorks(worksData.length >= 20);
      }

      if (charactersRes.ok) {
        const data = await charactersRes.json();
        updates.characters =
          data?.code === 1 ? (data.data?.characters || []).slice(0, 20) : [];
      }

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        const tagsList =
          data?.code === 1 ? (Array.isArray(data.data) ? data.data : []) : [];
        // NSFW 过滤：当不在 NSFW 模式时，过滤掉 is_nsfw = true 的 tag
        const hasNsfwPermission =
          typeof document !== 'undefined' &&
          document.cookie.includes('relax_content=true');
        const filteredTagsList =
          isNsfwMode && hasNsfwPermission
            ? tagsList
            : tagsList.filter(
                (tag: { is_nsfw?: boolean }) => tag.is_nsfw !== true,
              );
        updates.tags = filteredTagsList.slice(0, 10);
      }

      setSearchResults(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error fetching NSFW mode data:', error);
    } finally {
      setIsLoadingModeSwitch(false);
    }
  };

  const fetchMoreWorks = useCallback(async () => {
    if (!hasMoreWorks || isLoadingMoreWorks || !searchQuery.trim()) {
      return;
    }

    setIsLoadingMoreWorks(true);
    const nextPage = worksPageRef.current + 1;
    const modeParam = nsfwModeRef.current ? '&mode=nsfw' : '';

    try {
      const response = await fetch(
        `/api/search/posts?q=${encodeURIComponent(searchQuery.trim())}&page=${nextPage}&sort=newest&limit=20${modeParam}`,
      );

      if (response.ok) {
        const data = await response.json();
        const newWorks = data?.code === 1 ? data.data?.posts || [] : [];

        if (newWorks.length === 0) {
          setHasMoreWorks(false);
        } else {
          setSearchResults(prev => ({
            ...prev,
            works: [
              ...prev.works,
              ...newWorks.filter(
                (post: Post) => !prev.works.find(p => p.id === post.id),
              ),
            ],
          }));
          worksPageRef.current = nextPage;
        }
      }
    } catch (error) {
      console.error('Error fetching more works:', error);
    } finally {
      setIsLoadingMoreWorks(false);
    }
  }, [hasMoreWorks, isLoadingMoreWorks, searchQuery]);

  const [lastWorksElementRef] = useInfiniteScroll(fetchMoreWorks, {
    rootMargin: '0px 0px 800px 0px',
    threshold: 0.01,
  });

  const fetchMoreUsers = useCallback(async () => {
    if (!hasMoreUsers || isLoadingMoreUsers || !searchQuery.trim()) {
      return;
    }

    setIsLoadingMoreUsers(true);
    const nextOffset = usersOffsetRef.current + USERS_PAGE_SIZE;

    try {
      const response = await fetch(
        `/api/search/users?search=${encodeURIComponent(searchQuery.trim())}&limit=${USERS_PAGE_SIZE}&offset=${nextOffset}`,
      );

      if (response.ok) {
        const data = await response.json();
        const newUsers = data?.code === 1 ? data.data?.users || [] : [];

        if (newUsers.length === 0) {
          setHasMoreUsers(false);
        } else {
          setSearchResults(prev => ({
            ...prev,
            users: [
              ...prev.users,
              ...newUsers.filter(
                (user: SearchUser) => !prev.users.find(u => u.id === user.id),
              ),
            ],
          }));
          usersOffsetRef.current = nextOffset;
        }
      }
    } catch (error) {
      console.error('Error fetching more users:', error);
    } finally {
      setIsLoadingMoreUsers(false);
    }
  }, [hasMoreUsers, isLoadingMoreUsers, searchQuery]);

  const [lastUsersElementRef] = useInfiniteScroll(fetchMoreUsers, {
    rootMargin: '0px 0px 400px 0px',
    threshold: 0.01,
  });

  const handleSearch = () => {
    // Blur active element to dismiss keyboard on mobile
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    performSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleTagClick = (tagName: string) => {
    router.push(`/tags/${encodeURIComponent(tagName)}`);
  };

  const handlePostOpen = useCallback(
    (id: number, uniqid: string) => {
      if (isMobile) {
        // 保存滚动位置
        sessionStorage.setItem('scrollPosition', String(window.scrollY));
        // 将mobileModal参数添加到URL，保留现有的q参数
        router.push(
          {
            pathname: router.pathname,
            query: { ...router.query, mobileModal: id },
          },
          undefined,
          { scroll: false, shallow: true },
        );
      }
      setActivePostId(id);
      onPostModalOpen();
    },
    [onPostModalOpen, isMobile, router],
  );

  const handlePostClose = useCallback(() => {
    setActivePostId(null);
    onPostModalClose();
    if (isMobile) {
      // 移除mobileModal参数，保留其他query参数
      const { mobileModal, ...restQuery } = router.query;
      router.push({ pathname: router.pathname, query: restQuery }, undefined, {
        scroll: false,
        shallow: true,
      });
    }
  }, [onPostModalClose, isMobile, router]);

  const handleCharacterClick = useCallback(
    (character: Character) => {
      router.push(`/character/${character.character_uniqid}`);
    },
    [router],
  );

  const handleUserClick = useCallback(
    (user: SearchUser) => {
      router.push(`/user/${user.user_uniqid}`);
    },
    [router],
  );

  const handleUserFollow = useCallback(
    async (userId: string, isCurrentlyFollowing: boolean) => {
      if (!isAuth) {
        openLoginModal();
        return;
      }

      const followValue = isCurrentlyFollowing ? -1 : 1;

      // Optimistically update UI
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(user =>
          user.id === userId
            ? {
                ...user,
                is_followed: !isCurrentlyFollowing,
                num_followers: isCurrentlyFollowing
                  ? Math.max(0, (user.num_followers || 0) - 1)
                  : (user.num_followers || 0) + 1,
              }
            : user,
        ),
      }));

      try {
        const response = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingUserId: userId,
            value: followValue,
          }),
        });

        if (!response.ok) {
          // Revert on failure
          setSearchResults(prev => ({
            ...prev,
            users: prev.users.map(user =>
              user.id === userId
                ? {
                    ...user,
                    is_followed: isCurrentlyFollowing,
                    num_followers: isCurrentlyFollowing
                      ? (user.num_followers || 0) + 1
                      : Math.max(0, (user.num_followers || 0) - 1),
                  }
                : user,
            ),
          }));
        }
      } catch (error) {
        // Revert on error
        setSearchResults(prev => ({
          ...prev,
          users: prev.users.map(user =>
            user.id === userId
              ? {
                  ...user,
                  is_followed: isCurrentlyFollowing,
                  num_followers: isCurrentlyFollowing
                    ? (user.num_followers || 0) + 1
                    : Math.max(0, (user.num_followers || 0) - 1),
                }
              : user,
          ),
        }));
      }
    },
    [isAuth, openLoginModal],
  );

  const handleUseTemplate = useCallback(
    (template: FeaturedTemplate) => {
      const { path, query } = template.route;
      router.push({
        pathname: path,
        query,
      });
    },
    [router],
  );

  const handleNsfwModeChange = useCallback(
    (isNsfwMode: boolean) => {
      setNsfwMode(isNsfwMode);
      nsfwModeRef.current = isNsfwMode;
      // Refetch posts, characters, and tags (keep users and templates unchanged)
      if (searchQuery.trim()) {
        fetchNsfwModeData(searchQuery.trim(), isNsfwMode);
      }
    },
    [searchQuery],
  );

  const hasQuery = !!router.query.q;
  const showHistory = !hasQuery && searchHistory.length > 0;

  const shouldShowSection = (section: FilterType) => {
    if (activeFilter === 'all') {
      return true;
    }
    return activeFilter === section;
  };

  // 计算 all tab 下每个模块显示的数量
  // 移动端：显示两行（base 列数 * 2）
  // PC端：显示一行（当前断点的列数）
  const currentUsersCols = getColsForWidth(USERS_GRID_COLS);
  const currentCharactersCols = getColsForWidth(CHARACTERS_GRID_COLS);
  const currentTemplatesCols = getColsForWidth(TEMPLATES_GRID_COLS);

  const usersLimit = isMobile
    ? USERS_GRID_COLS.base * ROWS_LIMIT // 3 * 2 = 6
    : currentUsersCols; // 当前一行能显示的数量
  const charactersLimit = isMobile
    ? CHARACTERS_GRID_COLS.base * ROWS_LIMIT // 3 * 2 = 6
    : currentCharactersCols;
  const templatesLimit = isMobile
    ? TEMPLATES_GRID_COLS.base * ROWS_LIMIT // 2 * 2 = 4
    : currentTemplatesCols;

  // 在 all tab 下是否显示 See All 按钮（超过一行才显示）
  const showUsersSeeAll =
    activeFilter === 'all' && searchResults.users.length > usersLimit;
  const showCharactersSeeAll =
    activeFilter === 'all' && searchResults.characters.length > charactersLimit;
  const showTemplatesSeeAll =
    activeFilter === 'all' && searchResults.templates.length > templatesLimit;

  // 获取要显示的数据
  const displayedUsers =
    activeFilter === 'all'
      ? searchResults.users.slice(0, usersLimit)
      : searchResults.users;
  const displayedCharacters =
    activeFilter === 'all'
      ? searchResults.characters.slice(0, charactersLimit)
      : searchResults.characters;
  const displayedTemplates =
    activeFilter === 'all'
      ? searchResults.templates.slice(0, templatesLimit)
      : searchResults.templates;

  return (
    <>
      <Head>
        <title>{`${t('search:title')} | KomikoAI`}</title>
      </Head>
      <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='w-full pt-1 sm:pt-5 md:pt-10 p-2 md:p-4 lg:pl-60 2xl:pl-72 h-full mb-[5rem] lg:mr-8'>
            <div className='mt-16 md:mt-18 lg:mt-28 max-w-4xl mx-auto px-4 min-h-[calc(100vh-200px)]'>
              <div className='mb-6'>
                <div className='flex justify-center'>
                  <div className='w-full max-w-2xl'>
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('input_placeholder')}
                      size='lg'
                      radius='full'
                      enterKeyHint='search'
                      classNames={{
                        input: 'text-base',
                        inputWrapper:
                          'h-12 bg-card shadow-md border-2 border-primary-200',
                      }}
                      startContent={
                        <IconSearch size={24} className='text-primary-400' />
                      }
                      endContent={
                        searchQuery && (
                          <Button
                            isIconOnly
                            variant='light'
                            size='sm'
                            onPress={() => {
                              setSearchQuery('');
                              router.push('/search', undefined, {
                                shallow: true,
                              });
                            }}
                            className='min-w-6 w-6 h-6'>
                            <IconX size={16} className='text-primary-400' />
                          </Button>
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {hasQuery && (
                <div className='mb-4 relative'>
                  <div className='flex items-center'>
                    {/* Tabs container with overflow scroll */}
                    <div className='overflow-x-auto flex-1 pr-12 md:pr-14'>
                      <div className='flex gap-6 md:gap-8 min-w-max'>
                        {(
                          [
                            'all',
                            'tags',
                            'users',
                            'characters',
                            'templates',
                            'posts',
                          ] as FilterType[]
                        ).map(filter => (
                          <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`
                              relative px-0 py-3 text-sm transition-colors whitespace-nowrap flex-shrink-0
                              ${
                                activeFilter === filter
                                  ? 'text-primary font-medium'
                                  : 'text-muted-foreground hover:text-primary'
                              }
                            `}>
                            {filter === 'all' && t('filter.all', '综合')}
                            {filter === 'users' && t('filter.users', '用户')}
                            {filter === 'characters' &&
                              t('filter.characters', '角色')}
                            {filter === 'templates' &&
                              t('filter.templates', 'Templates')}
                            {filter === 'tags' && t('tags', 'Tags')}
                            {filter === 'posts' && t('filter.posts', 'Posts')}
                            {activeFilter === filter && (
                              <span className='absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-primary rounded-full' />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* NSFW Toggle - fixed position on right, hide for Users tab */}
                    {activeFilter !== 'users' && (
                      <div className='absolute right-0 top-1/2 -translate-y-1/2 bg-background pl-2'>
                        <NsfwToggle
                          onModeChange={handleNsfwModeChange}
                          isActive={nsfwMode}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className='flex justify-center py-8'>
                  <Spinner size='lg' />
                </div>
              )}

              {!hasQuery && !isLoading && (
                <div className='space-y-6'>
                  {showHistory && (
                    <div>
                      <div className='flex items-center justify-between mb-3'>
                        <h2 className='text-lg font-bold'>{t('history')}</h2>
                        <Button
                          variant='light'
                          size='sm'
                          onClick={clearSearchHistory}
                          className='text-xs text-default-500'>
                          {t('clear')}
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {searchHistory.map(item => (
                          <Chip
                            key={item.query}
                            variant='flat'
                            className='cursor-pointer bg-default-100 hover:bg-default-200'
                            onClose={() => removeSearchHistory(item.query)}
                            onClick={() => handleHistoryClick(item.query)}>
                            {item.query}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasQuery && !isLoading && (
                <div className='space-y-5'>
                  {(shouldShowSection('all') || activeFilter === 'tags') &&
                    searchResults.tags.length > 0 && (
                      <div>
                        {activeFilter === 'tags' && (
                          <h3 className='text-lg font-semibold text-heading mb-4'>
                            {t('tags', 'Tags')}
                          </h3>
                        )}
                        {activeFilter === 'tags' ? (
                          <div className='flex flex-wrap gap-2'>
                            {searchResults.tags.map(tag => (
                              <Button
                                key={tag.id}
                                onClick={() => handleTagClick(tag.name)}
                                radius='full'
                                size='sm'
                                variant='flat'
                                color='default'
                                className='capitalize md:text-sm text-xs bg-default-50'>
                                #{tag.name}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div className='flex h-auto overflow-x-auto overflow-y-hidden flex-1 ko-select'>
                            <div className='flex gap-2 py-1'>
                              {searchResults.tags.map(tag => (
                                <Button
                                  key={tag.id}
                                  onClick={() => handleTagClick(tag.name)}
                                  radius='full'
                                  size='sm'
                                  variant='flat'
                                  color='default'
                                  className='flex-shrink-0 capitalize md:text-sm text-xs bg-default-50'>
                                  #{tag.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {shouldShowSection('users') &&
                    searchResults.users.length > 0 && (
                      <div>
                        <div className='flex items-center justify-between mb-4'>
                          <h3 className='text-lg font-semibold text-heading'>
                            {t('filter.users')}
                          </h3>
                          {showUsersSeeAll && (
                            <Button
                              size='sm'
                              variant='light'
                              className='text-xs sm:text-sm text-primary-600 hover:text-primary-700'
                              onPress={() => setActiveFilter('users')}>
                              {t('see_all')}
                            </Button>
                          )}
                        </div>
                        {activeFilter === 'users' ? (
                          <>
                            <div className='flex flex-col gap-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden md:grid md:grid-cols-2 lg:grid-cols-3'>
                              {displayedUsers.map(user => {
                                const isFollowing = user.is_followed || false;
                                return (
                                  <div
                                    key={user.id}
                                    className='flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border last:border-b-0 md:border-b md:border-r md:last:border-r-0'>
                                    <div
                                      className='flex items-center gap-3 flex-1 min-w-0 cursor-pointer'
                                      onClick={() => handleUserClick(user)}
                                      onKeyDown={e => {
                                        if (
                                          e.key === 'Enter' ||
                                          e.key === ' '
                                        ) {
                                          handleUserClick(user);
                                        }
                                      }}
                                      role='button'
                                      tabIndex={0}>
                                      <Avatar
                                        src={user.image}
                                        name={user.user_name}
                                        className='w-12 h-12 flex-shrink-0'
                                      />
                                      <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-medium text-foreground truncate hover:text-primary-600 transition-colors'>
                                          {user.user_name}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>
                                          {user.num_followers || 0}{' '}
                                          {t('followers')}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size='sm'
                                      radius='full'
                                      variant={isFollowing ? 'flat' : 'solid'}
                                      color={
                                        isFollowing ? 'default' : 'primary'
                                      }
                                      className={
                                        isFollowing
                                          ? 'bg-muted text-foreground min-w-[80px]'
                                          : 'min-w-[80px]'
                                      }
                                      onPress={() =>
                                        handleUserFollow(user.id, isFollowing)
                                      }>
                                      {isFollowing
                                        ? t('following')
                                        : t('follow')}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                            {isLoadingMoreUsers && (
                              <div className='flex justify-center py-4'>
                                <Spinner />
                              </div>
                            )}
                            {hasMoreUsers && (
                              <div ref={lastUsersElementRef} className='h-4' />
                            )}
                          </>
                        ) : (
                          // All tab - 简洁的网格卡片
                          <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'>
                            {displayedUsers.map(user => (
                              <div
                                key={user.id}
                                className='flex flex-col items-center p-3 rounded-xl bg-card border border-border shadow-sm cursor-pointer hover:shadow-md hover:border-primary-200 transition-all duration-200'
                                onClick={() => handleUserClick(user)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    handleUserClick(user);
                                  }
                                }}
                                role='button'
                                tabIndex={0}>
                                <Avatar
                                  src={user.image}
                                  name={user.user_name}
                                  className='w-14 h-14 sm:w-16 sm:h-16 ring-2 ring-border'
                                />
                                <p className='text-sm font-medium mt-2 text-center truncate w-full text-foreground'>
                                  {user.user_name}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  {shouldShowSection('characters') &&
                    searchResults.characters.length > 0 && (
                      <div>
                        <div className='flex items-center justify-between mb-4'>
                          <h3 className='text-lg font-semibold text-heading'>
                            {t('filter.characters')}
                          </h3>
                          {showCharactersSeeAll && (
                            <Button
                              size='sm'
                              variant='light'
                              className='text-xs sm:text-sm text-primary-600 hover:text-primary-700'
                              onPress={() => setActiveFilter('characters')}>
                              {t('see_all')}
                            </Button>
                          )}
                        </div>
                        <div className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'>
                          {displayedCharacters.map(character => (
                            <CharacterCardItem
                              key={character.id}
                              character={character}
                              selected={false}
                              onClick={() => handleCharacterClick(character)}
                              compact={true}
                              showId={false}
                              showCollectionCount={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {shouldShowSection('templates') &&
                    searchResults.templates.length > 0 && (
                      <div>
                        <div className='flex items-center justify-between mb-4'>
                          <h3 className='text-lg font-semibold text-heading'>
                            {t('filter.templates')}
                          </h3>
                          {showTemplatesSeeAll && (
                            <Button
                              size='sm'
                              variant='light'
                              className='text-xs sm:text-sm text-primary-600 hover:text-primary-700'
                              onPress={() => setActiveFilter('templates')}>
                              {t('see_all')}
                            </Button>
                          )}
                        </div>
                        <div className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
                          {displayedTemplates.map(template => (
                            <TemplateCard
                              key={template.id}
                              template={template}
                              onUse={handleUseTemplate}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  {shouldShowSection('posts') &&
                    (searchResults.works.length > 0 || isLoadingModeSwitch) && (
                      <div>
                        <div className='flex items-center justify-between mb-4'>
                          <h3 className='text-lg font-semibold text-heading'>
                            {t('filter.posts', 'Posts')}
                          </h3>
                        </div>
                        {isLoadingModeSwitch ? (
                          <div className='flex justify-center py-8'>
                            <Spinner size='lg' />
                          </div>
                        ) : (
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
                            {searchResults.works.map(post => (
                              <PostCard
                                key={post.id}
                                item={post}
                                handleOpen={handlePostOpen}
                                handleLike={handlePostLike}
                                handleFollow={handlePostFollow}
                                handleComment={handlePostComment}
                                handleCommentChange={handlePostCommentChange}
                                comment={postComment}
                                isOpen={
                                  isPostModalOpen && activePostId === post.id
                                }
                                handleClose={handlePostClose}
                                useAnchor
                                showMore={shouldShowMore(post)}
                                onHidePost={handleHidePost}
                                shouldShowDelete={shouldShowDelete(post)}
                                isFullScreen={modalFullScreen}
                                modalFullScreen={modalFullScreen}
                              />
                            ))}
                            {isLoadingMoreWorks && (
                              <div className='flex justify-center col-span-full py-4'>
                                <Spinner />
                              </div>
                            )}
                          </Masonry>
                        )}
                        {hasMoreWorks && !isLoadingModeSwitch && (
                          <div ref={lastWorksElementRef} className='h-4' />
                        )}
                      </div>
                    )}

                  {/* No results for specific tab or all tabs */}
                  {!isLoading && (
                    <>
                      {/* All tab - show when everything is empty */}
                      {activeFilter === 'all' &&
                        searchResults.tags.length === 0 &&
                        searchResults.works.length === 0 &&
                        searchResults.characters.length === 0 &&
                        searchResults.users.length === 0 &&
                        searchResults.templates.length === 0 && (
                          <div className='flex flex-col items-center justify-center py-16 text-default-400'>
                            <p className='text-lg'>{t('no_results')}</p>
                          </div>
                        )}
                      {/* Tags tab */}
                      {activeFilter === 'tags' &&
                        searchResults.tags.length === 0 && (
                          <div className='flex flex-col items-center justify-center py-16 text-default-400'>
                            <p className='text-lg'>{t('no_results')}</p>
                          </div>
                        )}
                      {/* Users tab */}
                      {activeFilter === 'users' &&
                        searchResults.users.length === 0 && (
                          <div className='flex flex-col items-center justify-center py-16 text-default-400'>
                            <p className='text-lg'>{t('no_results')}</p>
                          </div>
                        )}
                      {/* Characters tab */}
                      {activeFilter === 'characters' &&
                        searchResults.characters.length === 0 && (
                          <div className='flex flex-col items-center justify-center py-16 text-default-400'>
                            <p className='text-lg'>{t('no_results')}</p>
                          </div>
                        )}
                      {/* Templates tab */}
                      {activeFilter === 'templates' &&
                        searchResults.templates.length === 0 && (
                          <div className='flex flex-col items-center justify-center py-16 text-default-400'>
                            <p className='text-lg'>{t('no_results')}</p>
                          </div>
                        )}
                      {/* Posts tab */}
                      {activeFilter === 'posts' &&
                        searchResults.works.length === 0 && (
                          <div className='flex flex-col items-center justify-center py-16 text-default-400'>
                            <p className='text-lg'>{t('no_results')}</p>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <SiteFooter className='md:pl-56 lg:pl-[240px]' />
      </main>
    </>
  );
}
