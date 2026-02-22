import { useEffect, useRef } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  subscribeChannelAtom,
  unsubscribeChannelAtom,
  addChannelCallbackAtom,
  getChannelAtom,
  channelStatusAtom,
} from '../state';

interface UseRealtimeChannelOptions {
  channelName: string;
  userId?: string;
  reconnectInterval?: number;
  reconnectMaxAttempts?: number;
  timeout?: number;
  enabled?: boolean; // Control when to connect
  onSubscribed?: (channel: RealtimeChannel) => void | Promise<void>;
  onError?: (error: Error) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
}

export function useRealtimeChannel(options: UseRealtimeChannelOptions) {
  const {
    channelName,
    userId,
    reconnectInterval = 5000,
    reconnectMaxAttempts = 10,
    timeout = 30000,
    enabled = true,
    onSubscribed,
    onError,
    onReconnecting,
  } = options;

  const subscribe = useSetAtom(subscribeChannelAtom);
  const unsubscribe = useSetAtom(unsubscribeChannelAtom);
  const addCallback = useSetAtom(addChannelCallbackAtom);
  const channel = useAtomValue(getChannelAtom);
  const status = useAtomValue(channelStatusAtom);

  // Use ref to store callbacks to avoid re-subscribing when they change
  const onSubscribedRef = useRef(onSubscribed);
  const onErrorRef = useRef(onError);
  const onReconnectingRef = useRef(onReconnecting);

  useEffect(() => {
    onSubscribedRef.current = onSubscribed;
    onErrorRef.current = onError;
    onReconnectingRef.current = onReconnecting;
  }, [onSubscribed, onError, onReconnecting]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Subscribe to channel
    subscribe({
      config: {
        channelName,
        userId,
        reconnectInterval,
        reconnectMaxAttempts,
        timeout,
      },
      onSubscribed: onSubscribedRef.current,
      onError: onErrorRef.current,
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [
    enabled,
    channelName,
    userId,
    reconnectInterval,
    reconnectMaxAttempts,
    timeout,
    subscribe,
    unsubscribe,
  ]);

  return {
    channel,
    status,
    addCallback,
  };
}

/**
 * Example: Multiple components using the same channel
 *
 * @example
 * ```tsx
 * // Component A
 * function NotificationBadge() {
 *   const { channel } = useRealtimeChannel({
 *     channelName: 'user-updates',
 *     userId: user.id,
 *     onSubscribed: (channel) => {
 *       channel.on('broadcast', { event: 'badge_update' }, (payload) => {
 *         setBadgeCount(payload.count);
 *       });
 *     },
 *   });
 *   // ...
 * }
 *
 * // Component B (reuses the same channel)
 * function NotificationList() {
 *   const { channel } = useRealtimeChannel({
 *     channelName: 'user-updates',
 *     userId: user.id, // Same channel name & userId = same singleton
 *     onSubscribed: (channel) => {
 *       channel.on('broadcast', { event: 'new_notification' }, (payload) => {
 *         addNotification(payload.notification);
 *       });
 *     },
 *   });
 *   // ...
 * }
 * ```
 */

/**
 * Example: Manual channel operations
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { channel, addCallback } = useRealtimeChannel({
 *     channelName: 'chat',
 *     onSubscribed: (channel) => {
 *       // Setup presence tracking
 *       channel.track({ user: 'user-1', online_at: new Date().toISOString() });
 *     },
 *   });
 *
 *   // Add additional callback later
 *   useEffect(() => {
 *     const callback = (status: string) => {
 *       console.log('Additional callback:', status);
 *     };
 *     addCallback(callback);
 *   }, [addCallback]);
 *
 *   // Send a message
 *   const sendMessage = async (message: string) => {
 *     if (channel) {
 *       await channel.send({
 *         type: 'broadcast',
 *         event: 'message',
 *         payload: { message, timestamp: Date.now() },
 *       });
 *     }
 *   };
 *
 *   return <button onClick={() => sendMessage('Hello!')}>Send</button>;
 * }
 * ```
 */
