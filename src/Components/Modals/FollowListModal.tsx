import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Tabs,
  Tab,
  Button,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useSetAtom, useAtomValue, useAtom } from 'jotai';
import { modalsAtom, modalsPayloadAtom, followCountsAtom, updateFollowCountsAtom } from '../../state';
import { Avatar, AvatarImage, AvatarFallback } from '../common/avatar';
import { toast } from '../common/use-toast';
import { useTranslation } from 'react-i18next';

interface FollowUser {
  id: string;
  user_name: string;
  user_uniqid?: string;
  image: string;
  num_followers: number;
  num_following: number;
  followed?: boolean;
  isFollowedByMe?: boolean; // 当前用户是否关注了这个用户
  isFollowingMe?: boolean;  // 这个用户是否关注了当前用户
}

interface FollowListModalProps {
  userId?: string;
  initialTab?: 'followers' | 'following';
  followersCount?: number;
  followingCount?: number;
}

export default function FollowListModal({ 
  userId, 
  initialTab = 'followers',
  followersCount = 0,
  followingCount = 0
}: FollowListModalProps) {
  const { t } = useTranslation('follow');
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const setModals = useSetAtom(modalsAtom);
  const payload = useAtomValue(modalsPayloadAtom);
  const [followCounts, setFollowCounts] = useAtom(followCountsAtom);
  const updateFollowCounts = useSetAtom(updateFollowCountsAtom);
  
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(userId);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [followersHasMore, setFollowersHasMore] = useState(true);
  const [followingHasMore, setFollowingHasMore] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Register Modal to global state
  useEffect(() => {
    setModals(modals => ({
      ...modals,
      followList: {
        onOpen: (props?: { 
          userId?: string; 
          initialTab?: 'followers' | 'following';
          followersCount?: number;
          followingCount?: number;
        }) => {
          if (props?.userId) {
            setCurrentUserId(props.userId);
          }
          if (props?.initialTab) {
            setActiveTab(props.initialTab);
          }
          // 初始化全局关注数量
          if (props?.followersCount !== undefined) {
            updateFollowCounts({ followers: props.followersCount });
          }
          if (props?.followingCount !== undefined) {
            updateFollowCounts({ following: props.followingCount });
          }
          onOpen();
        },
        onClose,
      },
    }));
  }, [onOpen, onClose, setModals, updateFollowCounts]);

  // Get userId from payload, fallback to passed userId
  const finalUserId = currentUserId || payload?.userId;

  // Fetch followers/following list
  const fetchFollowList = useCallback(async (
    type: 'followers' | 'following',
    page: number = 1,
    isLoadMore: boolean = false
  ) => {
    if (!finalUserId) return;
    
    setLoading(true);
    try {
      const url = `/api/fetchFollow?type=${type}&page=${page}&limit=20&userId=${finalUserId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch follow list');
      }
      
      const data = await response.json();
      
      if (type === 'followers') {
        if (isLoadMore) {
          setFollowers(prev => [...prev, ...data.data]);
        } else {
          setFollowers(data.data);
        }
        setFollowersHasMore(data.pagination.hasNext);
      } else {
        if (isLoadMore) {
          setFollowing(prev => [...prev, ...data.data]);
        } else {
          setFollowing(data.data);
        }
        setFollowingHasMore(data.pagination.hasNext);
      }
    } catch (error) {
      console.error('Error fetching follow list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [finalUserId]);

  // Handle follow/unfollow
  const handleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      const followValue = isCurrentlyFollowing ? -1 : 1; // 如果当前已关注，则取消关注；否则关注
      
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followingUserId: targetUserId,
          value: followValue,
        }),
      });

      if (response.ok) {
        // Update local state
        if (activeTab === 'followers') {
          setFollowers(prev => {
            const updated = prev.map(user => {
              if (user.id === targetUserId) {
                const newIsFollowedByMe = !isCurrentlyFollowing;
                const updatedUser = {
                  ...user, 
                  isFollowedByMe: newIsFollowedByMe,
                  followed: newIsFollowedByMe,
                  // 更新被关注用户的粉丝数
                  num_followers: isCurrentlyFollowing 
                    ? Math.max(0, (user.num_followers || 0) - 1)  // 取消关注，粉丝数-1
                    : (user.num_followers || 0) + 1,  // 关注，粉丝数+1
                  // 如果取消关注，isFollowingMe 保持不变（对方仍然关注你）
                  // 如果关注，isFollowingMe 应该变成 true（因为现在互相关注了）
                  isFollowingMe: newIsFollowedByMe ? true : user.isFollowingMe
                };
                return updatedUser;
              }
              return user;
            });
            return updated;
          });
          
          // 更新全局关注数量 - 粉丝列表的回关操作
          if (isCurrentlyFollowing) {
            // 取消关注，减少following数量
            updateFollowCounts({ following: followCounts.following - 1 });
          } else {
            // 关注，增加following数量
            updateFollowCounts({ following: followCounts.following + 1 });
          }
        } else {
          // 关注列表：点击"已关注"按钮会取消关注，变成"关注"按钮
          setFollowing(prev => 
            prev.map(user => 
              user.id === targetUserId 
                ? { 
                    ...user, 
                    isFollowedByMe: !isCurrentlyFollowing,
                    followed: !isCurrentlyFollowing,
                    // 更新被关注用户的粉丝数
                    num_followers: isCurrentlyFollowing 
                      ? Math.max(0, (user.num_followers || 0) - 1)  // 取消关注，粉丝数-1
                      : (user.num_followers || 0) + 1  // 关注，粉丝数+1
                  }
                : user
            )
          );
          
          // 更新全局关注数量 - 关注列表的操作
          if (isCurrentlyFollowing) {
            // 取消关注，减少following数量
            updateFollowCounts({ following: followCounts.following - 1 });
          } else {
            // 关注，增加following数量
            updateFollowCounts({ following: followCounts.following + 1 });
          }
        }
        
      } else {
        throw new Error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };

  // Load more data
  const loadMore = () => {
    if (activeTab === 'followers' && followersHasMore && !loading) {
      const nextPage = followersPage + 1;
      setFollowersPage(nextPage);
      fetchFollowList('followers', nextPage, true);
    } else if (activeTab === 'following' && followingHasMore && !loading) {
      const nextPage = followingPage + 1;
      setFollowingPage(nextPage);
      fetchFollowList('following', nextPage, true);
    }
  };

  // Reload data when modal opens, tab changes, or userId changes
  useEffect(() => {
    if (isOpen && finalUserId) {
      if (activeTab === 'followers') {
        setFollowersPage(1);
        fetchFollowList('followers', 1, false);
      } else {
        setFollowingPage(1);
        fetchFollowList('following', 1, false);
      }
    }
  }, [activeTab, isOpen, finalUserId, fetchFollowList]);

  // Handle scroll to bottom for auto loading
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const currentList = activeTab === 'followers' ? followers : following;
    const hasMore = activeTab === 'followers' ? followersHasMore : followingHasMore;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
      
      if (isNearBottom && hasMore && !loading) {
        loadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [activeTab, followers, following, followersHasMore, followingHasMore, loading, loadMore]);

  // Render user list item
  const renderUserItem = (user: FollowUser) => {
    const isFollowedByMe = user.isFollowedByMe || false;
    const isFollowingMe = user.isFollowingMe || false;
    
    let buttonText = '';
    let buttonVariant: 'solid' | 'ghost' | 'bordered' = 'bordered';
    let buttonClassName = '';
    
    if (activeTab === 'followers') {
      // 粉丝列表逻辑
      if (isFollowedByMe) {
        // 当前用户关注了这个粉丝 -> 互相关注
        buttonText = t('mutually_followed');
        buttonVariant = 'ghost';
        buttonClassName = 'bg-muted text-muted-foreground border-transparent w-[80px] text-sm';
      } else {
        // 当前用户没有关注这个粉丝 -> 回关
        buttonText = t('follow_back');
        buttonVariant = 'solid';
        buttonClassName = 'text-primary-foreground bg-primary-500 hover:bg-primary-600 w-[80px] text-sm';
      }
    } else {
      // 关注列表逻辑
      if (isFollowedByMe) {
        if (isFollowingMe) {
          // 双方互相关注
          buttonText = t('mutually_followed');
          buttonVariant = 'ghost';
          buttonClassName = 'bg-muted text-muted-foreground border-transparent w-[80px] text-sm';
        } else {
          // 当前用户关注了对方，但对方没有关注当前用户
          buttonText = t('already_following');
          buttonVariant = 'ghost';
          buttonClassName = 'bg-muted text-muted-foreground border-transparent w-[80px] text-sm';
        }
      } else {
        // 当前用户没有关注对方 -> 始终显示蓝色“关注”按钮
        buttonText = t('follow');
        buttonVariant = 'solid';
        buttonClassName = 'text-primary-foreground bg-primary-500 hover:bg-primary-600 w-[80px] text-sm';
      }
    }

    const handleUserClick = () => {
      // Navigate to user profile page using user_uniqid if available, fallback to user_name
      const userIdentifier = user.user_uniqid || user.user_name;
      router.push(`/user/${userIdentifier}`);
      onClose(); // Close the modal after navigation
    };

    return (
      <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted transition-colors">
        <div 
          className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
          onClick={handleUserClick}
        >
          <Avatar className="h-12 w-12 cursor-pointer">
            <AvatarImage src={user.image} alt={user.user_name} />
            <AvatarFallback className="bg-muted">
              {user.user_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate hover:text-blue-500 transition-colors">
              {user.user_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {user.num_followers || 0} {t('followers').toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          variant={buttonVariant}
          radius='full'
          size='md'
          className={buttonClassName}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering the parent click event
            handleFollow(user.id, isFollowedByMe);
          }}
        >
          {buttonText}
        </Button>
      </div>
    );
  };

  const currentList = activeTab === 'followers' ? followers : following;
  const hasMore = activeTab === 'followers' ? followersHasMore : followingHasMore;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      className="!m-4 max-h-[80vh]"
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 bg-transparent border-0 px-8 py-6">
          <div className="flex items-center w-full">
            <div className="flex items-center justify-between w-full space-x-8">
              <div 
                className={`cursor-pointer transition-colors pl-10 pr-10 ${
                  activeTab === 'followers' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('followers')}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {followCounts.followers}
                  </div>
                  <div className="text-sm">
                    {t('followers')}
                  </div>
                </div>
              </div>
              
              <div 
                className={`cursor-pointer transition-colors pl-10 pr-10 ${
                  activeTab === 'following' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('following')}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {followCounts.following}
                  </div>
                  <div className="text-sm">
                    {t('following')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody className="px-8 py-0">
          <div ref={scrollContainerRef} className="max-h-200 overflow-y-auto rounded-xl">
            {loading && currentList.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : currentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p className="text-lg font-medium">{t('no_followers_yet')}</p>
              </div>
            ) : (
              <>
                {currentList.map((user) => renderUserItem(user))}
                
                {loading && currentList.length > 0 && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}
              </>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
