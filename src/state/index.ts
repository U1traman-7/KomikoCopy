import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
// import { type NodeConfig } from "konva/lib/Node"; // 移除静态导入避免被打包到主bundle
import { IDiffItem } from '../Components/InfCanva/types';
import { SubscriptionStatus } from '../../api/payment/_constant';
import {
  createClient,
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js';
import { getUnreadMessageCount } from '@/api/profile';
// 我们要保存的json对象，中的基本元素

// 使用泛型替代NodeConfig以避免静态导入Konva
interface BaseNodeConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  visible?: boolean;
  // 添加其他可能需要的通用属性
  [key: string]: any;
}

interface ExtendedNodeConfig extends BaseNodeConfig {
  width?: number;
  height?: number;
}
export interface CNode {
  cType?: CNodeType;
  attrs: Partial<ExtendedNodeConfig>;
  imageUrl?: string; // comic_image only
  children?: Array<CNode>;
  childSorting?: Array<string>;
  visible?: boolean; // 是否显示，在删除，undo/redo时候使用
  asyncImageFunc?: () => Promise<any>; // 移步获取图片的方法，因为prompt处理事件太长了，需要先加载占位图，此方法执行完成后更新CNode
}
// node时currentSelectedShape.node，它是指的一个konva shape，画布上的节点
// CNode是保存appState里定义的基本节点
export interface HistoryItem {
  versionId: number | string;
  detail: {
    appState: Array<CNode>;
    comicPageSorting: Array<string>;
  };
}

export enum CNodeType {
  COMIC_PAGE = 'comic_page',
  COMIC_IMAGE = 'comic_image',
  COMIC_TEXT = 'comic_text',
  COMIC_BUBBLE = 'comic_bubble',
  COMIC_MARK_AREA = 'comic_mark_area',
}
export const appStateAtom = atom<Array<CNode>>([]);
export const useAppStateAtom = atom<boolean>(false);
export const historyAtom = atom<Array<HistoryItem>>([]);
export const comicPageSortingAtom = atom<Array<string>>([]);

export const prevStepsAtom = atom<Array<IDiffItem>>([]);
export const redoStepsAtom = atom<Array<IDiffItem>>([]);
export const selectedImageAtom = atom<string>('');
export const characterImagePromptAtom = atom<string>('');
export const characterGenderAtom = atom<string>('male');
export const exportImageAtom = atom<string>('');
export const postGeneratedImageUrlsAtom = atom<{ id: number; url: string }[]>(
  [],
);
export const postTitleAtom = atom<string>('');
export const postContentAtom = atom<string>('');
export const bgWidthAtom = atom<number>(1024);

export const authAtom = atom<boolean>(false);
export const isMobileAtom = atom<boolean>(false);
// 检查是否页面已经检查过auth
export const checkedAuthAtom = atom<boolean>(false);

interface ModalAction {
  onOpen: (props?: any) => void;
  onClose: () => void;
}
export interface Modals {
  pricing?: ModalAction;
  dailyCheckIn?: ModalAction;
  dailyRewards?: ModalAction;
  followList?: ModalAction;
  nsfw?: ModalAction;
}

export const modalsAtom = atom<Modals>({});
export const modalsPayloadAtom = atom<any>(null);

export interface Badge {
  id: number;
  badge_code: string;
  badge_name: string;
  title: string;
  icon_url: string;
  earned_at: string;
  priority: number;
  badge_type: string;
}

export interface Profile {
  id: string;
  authUserId: string;
  user_uniqid: string;
  created_at: string;
  user_name: string;
  image: string;
  user_desc: string;
  num_followers?: number;
  num_following?: number;
  credit: number;
  free_credit: number;
  badges?: Badge[];
  date_checkin: string;
  date_post: string;
  date_like: string;
  tour_completed: boolean;
  invite_code: string;
  plan: string;
  subscription_status: SubscriptionStatus;
  email: string;
  is_cpp: boolean;
  plan_codes: number[];
  is_official?: boolean;
  roles?: number[];
}

export const profileAtom = atom<Profile>({
  authUserId: '',
  user_uniqid: '',
  created_at: '',
  user_name: '--',
  image: '',
  user_desc: '',
  // num_followers: 0,
  // num_following: 0,
  credit: 0,
  free_credit: 0,
  subscription_status: SubscriptionStatus.NONE,
  date_checkin: '2020-01-01',
  date_post: '2020-01-01',
  date_like: '2020-01-01',
  tour_completed: false,
  invite_code: '',
  plan: 'Free',
  id: '',
  is_cpp: false,
  email: '',
  plan_codes: [],
  roles: [],
});

export const loginModalAtom = atom<{ onOpen: () => void }>({
  onOpen: () => {},
});

export interface User {
  id: number;
  authUserId: string;
  user_name: string;
  user_uniqid: string;
  image: string;
  followed: boolean;
  post_likes: number;
}

export const userListAtom = atom<User[]>([]);

export interface Character {
  id: number;
  authUserId: string;
  character_uniqid: string;
  created_at: string;
  character_name: string;
  character_description: string;
  alt_prompt?: string;
  file_uniqid: string;
  age: string;
  profession: string;
  personality: string;
  interests: string;
  intro: string;
  character_pfp: string;
  rizz: number;
  num_adopt: number;
  num_gen: number;
  num_collected?: number;
  // Fields from /api/getOwnedCharacters response
  user_name?: string;
  user_image?: string;
  is_owned?: boolean;
  is_collected?: boolean;
  collection_id?: number;
  collected_at?: string;
}

export const characterListAtom = atom<Character[]>([]);

const createStorage = <T>() => ({
  getItem: (key: string, initialValue: T): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  },
  setItem: (key: string, value: T): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  subscribe: (key: string, callback: (value: T) => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          callback(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  },
});

// Recent characters atom with localStorage persistence
// Automatically syncs with localStorage and persists across page refreshes
export const recentCharactersAtom = atomWithStorage<Character[]>(
  'komiko_recent_characters',
  [],
  createStorage<Character[]>(),
);

// DEPRECATED: No longer used - useCharacterMention now uses API-based search with local caching
// Kept for backward compatibility, can be removed in future cleanup
// export const officialCharactersCacheAtom = atom<Character[]>([]);

export interface Comment {
  id?: number;
  postId: number;
  content: string;
  votes: number;
  user_name: string;
  user_uniqid: string;
  user_id: string;
  image: string;
  created_at: string;
  children?: Comment[];
  liked?: boolean;
  reply_to_user_name?: string;
  reply_to_user_id?: string;
  reply_to_user_image?: string;
}
export interface Post {
  id: number;
  uniqid: string;
  user_uniqid: string;
  authUserId: string;
  created_at: string;
  views: number;
  rizz: number;
  title: string;
  content: string;
  media: string[];
  votes: number;
  user_name: string;
  image: string;
  user_plan?: string;
  liked: boolean;
  comments: Comment[];
  followed?: boolean;
  generations: any[];
  media_type?: 'image' | 'video' | 'text';
  post_tags: {
    id: number;
    name: string;
    logo_url?: string | null;
    display_name?: string | null;
    i18n?: Record<string, any> | null;
  }[];
  isPinned?: boolean;
  // 标识post是否在PinAppPost表中，防止重复展示post
  post_pinned?: boolean;
  featured?: boolean;
  // Translations by language code, containing title/content
  translation?: Record<string, { title?: string; content?: string }>;
  // Original Character id mapped from backend view; null when not OC
  oc_id?: string | null;
}

export const postListAtom = atom<Post[]>([]);
export const pageAtom = atom<number>(1);
export const tags = [
  {
    label: 'Trending',
    label_key: 'tags.trending',
    value: 'trending',
  },
  {
    label: 'Newest',
    label_key: 'tags.newest',
    value: 'newest',
  },
  // {
  //   label: 'Most Likes',
  //   label_key: 'tags.most_likes',
  //   value: 'most_likes',
  // },
  {
    label: 'Following',
    label_key: 'tags.following',
    value: 'following',
  },
];
export const feedTagAtom = atom<string>(tags[0].label);

export interface FollowCounts {
  followers: number;
  following: number;
}

export const followCountsAtom = atom<FollowCounts>({
  followers: 0,
  following: 0,
});

export const updateFollowCountsAtom = atom(
  null,
  (get, set, updates: Partial<FollowCounts>) => {
    const current = get(followCountsAtom);
    set(followCountsAtom, { ...current, ...updates });
  },
);

interface ChannelConfig {
  channelName: string;
  userId?: string;
  reconnectInterval?: number; // milliseconds (default: 5000)
  reconnectMaxAttempts?: number; // (default: 10)
  timeout?: number; // connection timeout in milliseconds (default: 30000)
}

interface ChannelState {
  channel: RealtimeChannel | null;
  supabase: SupabaseClient | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
  timeoutTimer: NodeJS.Timeout | null;
  lastError: Error | null;
  subscribeCallbacks: Array<(status: string) => void>;
  config: ChannelConfig | null;
}

export const unreadMessageCountAtom = atom(0);

// Atom to store channel state
export const channelStateAtom = atom<ChannelState>({
  channel: null,
  supabase: null,
  status: 'disconnected',
  reconnectAttempts: 0,
  reconnectTimer: null,
  timeoutTimer: null,
  lastError: null,
  subscribeCallbacks: [],
  config: null,
});

// Atom to initialize/get channel singleton
export const channelAtom = atom(
  get => get(channelStateAtom).channel,
  (get, set, config: ChannelConfig) => {
    const state = get(channelStateAtom);

    // If channel already exists with same name, return it
    const channelName = config.userId
      ? `${config.channelName}:${config.userId}`
      : config.channelName;

    if (state.channel && state.channel.topic === channelName) {
      // eslint-disable-next-line no-console
      console.log('Reusing existing channel:', channelName);
      return state.channel;
    }

    // Clean up existing channel if any
    if (state.channel) {
      // eslint-disable-next-line no-console
      console.log('Cleaning up existing channel');
      state.channel.unsubscribe();
    }

    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
    }

    if (state.timeoutTimer) {
      clearTimeout(state.timeoutTimer);
    }

    // Create Supabase client if not exists
    const supabase =
      state.supabase ||
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PUBLIC!,
        {
          realtime: {
            timeout: config.timeout || 30000,
          },
        },
      );

    // Create new channel
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: config.userId || '' },
      },
    });

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${config.userId}`,
      },
      payload => {
        console.log('New message in DB:', payload);
        if (payload.table === 'messages') {
          set(unreadMessageCountAtom, get(unreadMessageCountAtom) + 1);
        }
      },
    );
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'broad_type=eq.2',
      },
      payload => {
        console.log('New message in DB:', payload);
        if (payload.table === 'messages') {
          set(unreadMessageCountAtom, get(unreadMessageCountAtom) + 1);
        }
      },
    );

    console.log('Created new channel:', channelName);

    set(channelStateAtom, {
      ...state,
      channel,
      supabase,
      status: 'connecting',
      reconnectAttempts: 0,
      lastError: null,
      config,
    });

    return channel;
  },
);

const getUnreadMessageCountAtom = atom(null, async (get, set) => {
  try {
    const { code, data } = await getUnreadMessageCount();
    if (code !== 1) {
      return;
    }

    // setUnreadCount(count => count + data.count);
    // set(unreadMessageCountAtom, )
    const count = get(unreadMessageCountAtom);
    set(unreadMessageCountAtom, count + data.count);
  } catch (error) {
    console.error('Failed to fetch unread message count:', error);
  }
});

// Atom to subscribe to channel (no auto-reconnect)
export const subscribeChannelAtom = atom(
  null,
  (
    get,
    set,
    params: {
      config: ChannelConfig;
      onSubscribed?: (channel: RealtimeChannel) => void | Promise<void>;
      onError?: (error: Error) => void;
    },
  ) => {
    const { config, onSubscribed, onError } = params;
    const timeout = config.timeout || 30000;

    const attemptReconnect = async () => {
      const currentState = get(channelStateAtom);

      // Clear existing timers
      if (currentState.reconnectTimer) {
        clearTimeout(currentState.reconnectTimer);
      }
      if (currentState.timeoutTimer) {
        clearTimeout(currentState.timeoutTimer);
      }

      // Increment reconnect attempts
      set(channelStateAtom, {
        ...currentState,
        status: 'connecting',
      });

      // Get or create channel
      const channel = set(channelAtom, config);

      // Set timeout timer
      const timeoutTimer = setTimeout(() => {
        const latestState = get(channelStateAtom);
        if (latestState.status === 'connecting') {
          // eslint-disable-next-line no-console
          console.error('[Channel] Connection timeout');
          const error = new Error('Connection timeout');
          set(channelStateAtom, {
            ...latestState,
            status: 'error',
            lastError: error,
          });
          onError?.(error);
        }
      }, timeout);

      set(channelStateAtom, {
        ...get(channelStateAtom),
        timeoutTimer,
      });

      // Subscribe to channel
      channel.subscribe(async status => {
        const latestState = get(channelStateAtom);

        // Clear timeout timer on any status change
        if (latestState.timeoutTimer) {
          clearTimeout(latestState.timeoutTimer);
        }

        if (status === 'SUBSCRIBED') {
          // eslint-disable-next-line no-console
          console.log('[Channel] Subscribed successfully');
          set(channelStateAtom, {
            ...latestState,
            status: 'connected',
            reconnectAttempts: 0,
            reconnectTimer: null,
            timeoutTimer: null,
          });

          await set(getUnreadMessageCountAtom);

          // Execute all subscribe callbacks
          for (const cb of latestState.subscribeCallbacks) {
            try {
              cb(status);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('[Channel] Callback error:', err);
            }
          }

          // Execute custom onSubscribed callback
          if (onSubscribed) {
            try {
              await onSubscribed(channel);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('[Channel] onSubscribed error:', err);
            }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const error = new Error(`Channel ${status}`);
          // eslint-disable-next-line no-console
          console.error('[Channel] Error:', status);
          set(channelStateAtom, {
            ...latestState,
            status: 'error',
            lastError: error,
            timeoutTimer: null,
          });
          onError?.(error);
        } else if (status === 'CLOSED') {
          // eslint-disable-next-line no-console
          console.warn('[Channel] Closed');
          set(channelStateAtom, {
            ...latestState,
            status: 'disconnected',
            timeoutTimer: null,
          });
        }
      });
    };

    // Start initial connection
    attemptReconnect();
  },
);

// Atom to add custom operations that will execute after subscription
// Note: These callbacks will be called on every successful subscription (including reconnects)
export const addChannelCallbackAtom = atom(
  null,
  (get, set, callback: (status: string) => void) => {
    const state = get(channelStateAtom);
    set(channelStateAtom, {
      ...state,
      subscribeCallbacks: [...state.subscribeCallbacks, callback],
    });

    // If already connected, execute callback immediately
    if (state.status === 'connected') {
      try {
        callback('SUBSCRIBED');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Channel] Callback execution error:', err);
      }
    }
  },
);

// Atom to remove a specific callback
export const removeChannelCallbackAtom = atom(
  null,
  (get, set, callback: (status: string) => void) => {
    const state = get(channelStateAtom);
    set(channelStateAtom, {
      ...state,
      subscribeCallbacks: state.subscribeCallbacks.filter(
        cb => cb !== callback,
      ),
    });
  },
);

// Atom to unsubscribe and cleanup
export const unsubscribeChannelAtom = atom(null, (get, set) => {
  const state = get(channelStateAtom);

  // eslint-disable-next-line no-console
  console.log('[Channel] Unsubscribing and cleaning up');

  if (state.channel) {
    state.channel.unsubscribe();
  }

  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
  }

  if (state.timeoutTimer) {
    clearTimeout(state.timeoutTimer);
  }

  set(channelStateAtom, {
    channel: null,
    supabase: state.supabase, // Keep supabase client for reuse
    status: 'disconnected',
    reconnectAttempts: 0,
    reconnectTimer: null,
    timeoutTimer: null,
    lastError: null,
    subscribeCallbacks: [],
    config: null,
  });
});

// Atom to get current channel instance for adding event listeners
export const getChannelAtom = atom(get => {
  const state = get(channelStateAtom);
  return state.channel;
});

// Atom to get channel connection status
export const channelStatusAtom = atom(get => {
  const state = get(channelStateAtom);
  return {
    status: state.status,
    reconnectAttempts: state.reconnectAttempts,
    lastError: state.lastError,
  };
});

// Promotion atoms
export {
  promotionDataAtom,
  topCampaignAtom,
  promotionEndTimeAtom,
  isPromotionExpiredAtom,
  fetchPromotionAtom,
  clearPromotionAtom,
  type Campaign,
  type PromotionData,
  type SubscriptionPromotion,
} from './promotion';

// Block user atoms
export {
  blockedUserIdsAtom,
  isUserBlockedAtom,
  blockedUsersListAtom,
  type BlockedUserInfo,
} from './block';

// Re-export Jotai hooks for convenience
export { useAtomValue, useSetAtom };
