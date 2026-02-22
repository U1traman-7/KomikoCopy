/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import { Header } from '../Components/Header';
import { Sidebar } from '../Components/Sidebar';
import { Button, Card, CardBody, Avatar, Spinner } from '@nextui-org/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CONTENT_TYPES } from '../../api/_constants';
import { authAtom } from '../state';
import { useAtomValue } from 'jotai';
import useInfiniteScroll from '../Components/Feed/useInfiniteScrollNew';

const DynamicImage = dynamic(
  () => import('@nextui-org/react').then(mod => mod.Image),
  { ssr: false },
);

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'avi', 'ogv']);

interface MessageContent {
  id: number;
  type: number;
  users: {
    user_id: string;
    user_name: string;
    avatar_url: string;
    user_uniqid: string;
  }[];
  content?: string;
  host_thumbnail?: string;
  host_content_title?: string;
  host_content_uniqid?: string;
  other_count?: number;
  is_comment?: boolean;
  payload?: Record<string, any> | null;
  isFollowedByMe?: boolean; // 我是否已关注了这个粉丝
}

export default function NotificationsPage() {
  const getUrlExtension = (url?: string) => {
    if (!url) return '';
    const cleanUrl = url.split('?')[0].split('#')[0];
    const fileName = cleanUrl.split('/').pop() || '';
    return fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
  };

  const isVideoUrl = (url?: string) => {
    const extension = getUrlExtension(url);
    return extension ? VIDEO_EXTENSIONS.has(extension) : false;
  };

  const getVideoThumbnailSrc = (url: string) =>
    url.includes('#') ? url : `${url}#t=0.001`;

  const router = useRouter();
  const { t } = useTranslation('notifications');
  const isAuth = useAtomValue(authAtom);
  const [messages, setMessages] = useState<MessageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    console.log(messages);
  }, [messages]);

  const fetchMessages = useCallback(
    async (
      page: number,
      append: boolean = false,
      withRead: boolean = false,
    ) => {
      if (!isAuth) {
        setLoading(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const withReadParam = withRead ? '&withRead=1' : '';
      try {
        const response = await fetch(
          `/api/message?action=detail&pageNo=${page}&pageSize=20${withReadParam}`,
        );
        const result = await response.json();

        if (result.code === 1 && result.data?.messages) {
          const newMessages = result.data.messages.filter(
            (msg: MessageContent | null) => msg !== null,
          ) as MessageContent[];

          if (append) {
            setMessages(prev => [...prev, ...newMessages]);
          } else {
            setMessages(newMessages);
          }

          setHasMore(newMessages.length === 20);
        } else {
          if (!append) {
            setMessages([]);
          }
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        if (!append) {
          setMessages([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [isAuth],
  );

  useEffect(() => {
    const init = async () => {
      if (!isAuth) {
        return;
      }

      // // 先将当前所有消息置为已读（移动已读指针到最新）
      // try {
      //   await fetch('/api/message?action=all_read', { method: 'GET' });
      // } catch (error) {
      //   console.error('Failed to mark all as read:', error);
      // }

      // 再按已读指针之后的数据进行分页读取
      fetchMessages(1, false, true);
    };

    init();
  }, [isAuth, fetchMessages]);

  // Follow back 状态管理
  const [followBackLoadingId, setFollowBackLoadingId] = useState<number | null>(null);

  const handleFollowBack = async (message: MessageContent) => {
    if (followBackLoadingId !== null) return;
    const targetUser = message.users?.[0];
    if (!targetUser) return;

    setFollowBackLoadingId(message.id);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followingUserId: targetUser.user_id,
          value: 1,
        }),
      });

      if (response.ok) {
        // 更新本地消息状态
        setMessages(prev =>
          prev.map(msg =>
            msg.id === message.id ? { ...msg, isFollowedByMe: true } : msg,
          ),
        );
        toast.success(t('followBackSuccess'));
      } else {
        toast.error(t('followBackFailed'));
      }
    } catch (error) {
      console.error('Follow back failed:', error);
      toast.error(t('followBackFailed'));
    } finally {
      setFollowBackLoadingId(null);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const nextPage = pageNo + 1;
    setPageNo(nextPage);
    fetchMessages(nextPage, true);
  }, [loading, loadingMore, hasMore, pageNo, fetchMessages]);

  const [loadMoreRef] = useInfiniteScroll(handleLoadMore, {
    rootMargin: '0px 0px 200px 0px',
    threshold: 0.1,
  });

  const handleUserClick = (
    e: React.MouseEvent,
    userUniqid: string | undefined,
  ) => {
    e.stopPropagation();
    if (userUniqid) {
      router.push(`/user/${userUniqid}`);
    }
  };

  const handleMessageClick = (message: MessageContent) => {
    if (message.type === CONTENT_TYPES.FOLLOW) {
      // Follow messages don't have a target to navigate to
      return;
    }

    if (message.type === CONTENT_TYPES.BADGE_EARNED) {
      router.push('/profile');
      return;
    }

    if (message.type === CONTENT_TYPES.OC_COLLECTED) {
      // Navigate to character page
      if (message.host_content_uniqid) {
        router.push(`/character/${message.host_content_uniqid}`);
      }
      return;
    }

    // For other types, navigate to post page
    if (message.host_content_uniqid) {
      router.push(`/post/${message.host_content_uniqid}`);
    }
  };

  const renderAvatars = (message: MessageContent) => {
    const maxAvatars = 2;
    const displayUsers = (message.users || []).slice(0, maxAvatars);
    const avatarCount = displayUsers.length;

    // Fixed container size to ensure alignment
    const containerSize = 'w-12 h-12'; // 48px x 48px

    if (avatarCount === 0) {
      return null;
    }

    if (avatarCount === 1) {
      // Single avatar - larger size
      return (
        <div className={`${containerSize} flex items-center justify-center`}>
          <Avatar
            src={displayUsers[0]?.avatar_url}
            size='md'
            className='w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity'
            onClick={e => handleUserClick(e, displayUsers[0]?.user_uniqid)}
          />
        </div>
      );
    }

    // Two avatars - positioned at top-right and bottom-left
    return (
      <div className={`${containerSize} relative`}>
        {/* First avatar - top-right */}
        <Avatar
          src={displayUsers[0]?.avatar_url}
          size='sm'
          className='absolute top-0 right-0 w-8 h-8 border-2 border-white cursor-pointer hover:opacity-80 transition-opacity z-10'
          onClick={e => handleUserClick(e, displayUsers[0]?.user_uniqid)}
        />
        {/* Second avatar - bottom-left */}
        <Avatar
          src={displayUsers[1]?.avatar_url}
          size='sm'
          className='absolute bottom-0 left-0 w-8 h-8 border-2 border-white cursor-pointer hover:opacity-80 transition-opacity z-10'
          onClick={e => handleUserClick(e, displayUsers[1]?.user_uniqid)}
        />
      </div>
    );
  };

  const renderUserNames = (message: MessageContent) => {
    const maxNames = 2;
    const displayUsers = (message.users || []).slice(0, maxNames);
    const hasMoreUsers = message.other_count && message.other_count > 0;
    const isFeatured = message.type === CONTENT_TYPES.FEATURED;
    const isBadge = message.type === CONTENT_TYPES.BADGE_EARNED;
    const isOfficialMessage = isFeatured || isBadge;

    if (displayUsers.length === 0 && !isOfficialMessage) {
      return null;
    }

    // For featured messages, show "Komiko-chan"
    if (isOfficialMessage) {
      return (
        <span className='font-medium text-foreground cursor-pointer hover:text-blue-600'>
          Komiko-chan
        </span>
      );
    }

    // For single user
    if (displayUsers.length === 1 && !hasMoreUsers) {
      return (
        <span
          className='font-medium text-foreground cursor-pointer hover:text-blue-600'
          onClick={e => handleUserClick(e, displayUsers[0]?.user_uniqid)}>
          {displayUsers[0]?.user_name}
        </span>
      );
    }

    // For multiple users
    const firstUser = displayUsers[0];
    const secondUser = displayUsers[1];

    if (hasMoreUsers) {
      return (
        <span className='text-foreground'>
          <span
            className='font-medium cursor-pointer hover:text-blue-600'
            onClick={e => handleUserClick(e, firstUser?.user_uniqid)}>
            {firstUser?.user_name}
          </span>
          {secondUser && (
            <>
              {' & '}
              <span
                className='font-medium cursor-pointer hover:text-blue-600'
                onClick={e => handleUserClick(e, secondUser?.user_uniqid)}>
                {secondUser?.user_name}
              </span>
            </>
          )}{' '}
          & {message.other_count} {t('others')}
        </span>
      );
    }

    return (
      <span className='text-foreground'>
        <span
          className='font-medium cursor-pointer hover:text-blue-600'
          onClick={e => handleUserClick(e, firstUser?.user_uniqid)}>
          {firstUser?.user_name}
        </span>
        {secondUser && (
          <>
            {' & '}
            <span
              className='font-medium cursor-pointer hover:text-blue-600'
              onClick={e => handleUserClick(e, secondUser?.user_uniqid)}>
              {secondUser?.user_name}
            </span>
          </>
        )}
      </span>
    );
  };

  const renderMessageContent = (message: MessageContent) => {
    switch (message.type) {
      case CONTENT_TYPES.LIKES:
        return (
          <span className='text-base text-muted-foreground'>{t('likedYourPost')}</span>
        );

      case CONTENT_TYPES.COMMENT_LIKES:
        return (
          <span className='text-base text-muted-foreground'>
            {t('likedYourComment')}
          </span>
        );

      case CONTENT_TYPES.COMMENT:
        return (
          <span className='text-base text-muted-foreground'>
            {message.content
              ? t('commentedOnYourPostWithContent', {
                  comment: message.content,
                })
              : t('commentedOnYourPost')}
          </span>
        );

      case CONTENT_TYPES.REPLY_COMMENT:
        return (
          <span className='text-base text-muted-foreground'>
            {message.content
              ? t('repliedToYourComment', { reply: message.content })
              : t('repliedToYourComment')}
          </span>
        );

      case CONTENT_TYPES.FOLLOW:
        return (
          <span className='text-base text-muted-foreground'>{t('followedYou')}</span>
        );

      case CONTENT_TYPES.OC_COLLECTED:
        return (
          <span className='text-base text-muted-foreground'>
            {t('adoptedCharacter', {
              characterName: message.host_content_title || '',
            })}
          </span>
        );

      case CONTENT_TYPES.OC_USED:
        return (
          <span className='text-base text-muted-foreground'>
            {t('createdPostFeaturing', {
              characterName: message.host_content_title || '',
            })}
          </span>
        );

      case CONTENT_TYPES.FEATURED:
        return (
          <span className='text-base text-muted-foreground'>
            {t('featuredYourPost')}
          </span>
        );

      case CONTENT_TYPES.BADGE_EARNED: {
        const badgeName =
          message.payload?.badgeName || message.payload?.badgeTitle || '';
        return (
          <span className='text-base text-muted-foreground'>
            {t('earnedTheBadge', { badgeName })}
          </span>
        );
      }

      case CONTENT_TYPES.SHOULD_CHARGE: {
        const invoiceText = message.payload?.invoiceText || 'this invoice';
        return (
          <span className='text-base text-muted-foreground'>
            {t('paymentOverdue', { invoiceText })}
          </span>
        );
      }

      case CONTENT_TYPES.TAG_REQUEST: {
        const tagName = message.payload?.tagName || 'this tag';
        return (
          <span className='text-base text-muted-foreground'>
            {t('modRequestApproved', { tagName })}
          </span>
        );
      }

      case CONTENT_TYPES.CPP_ACTIVED:
        return (
          <span className='text-base text-muted-foreground'>{t('activatedCPP')}</span>
        );

      case CONTENT_TYPES.OFFICIAL: {
        // Handle profile moderation notifications
        if (message.payload?.type === 'profile_moderation') {
          const action = message.payload.action;

          if (action === 'avatar_approved') {
            return (
              <span className='text-base text-muted-foreground'>
                {t('profilePictureApproved')}
              </span>
            );
          }

          if (action === 'avatar_rejected') {
            return (
              <span className='text-base text-muted-foreground'>
                {t('profilePictureRejected', { fields: t('fieldAvatar') })}
              </span>
            );
          }

          if (action === 'avatar_removed') {
            return (
              <span className='text-base text-muted-foreground'>
                {t('profilePictureRejected', { fields: t('fieldAvatar') })}
              </span>
            );
          }
        }

        // Handle profile reset notifications (admin action)
        if (message.payload?.type === 'profile_reset') {
          const resetFields = message.payload.reset_fields || [];
          const fieldNameMap: Record<string, string> = {
            avatar: t('fieldAvatar'),
            username: t('fieldUsername'),
            bio: t('fieldBio'),
          };
          const fields = resetFields
            .map((f: string) => fieldNameMap[f] || f)
            .join(', ');
          return (
            <span className='text-base text-muted-foreground'>
              {t('profilePictureRejected', { fields })}
            </span>
          );
        }

        // Default for other OFFICIAL notifications
        return null;
      }

      default:
        return null;
    }
  };

  const renderFollowBackButton = (message: MessageContent) => {
    if (message.type !== CONTENT_TYPES.FOLLOW) return null;
    // 如果已经关注了对方，显示 "Following" 状态
    if (message.isFollowedByMe) {
      return (
        <Button
          size='sm'
          variant='flat'
          radius='full'
          className='flex-shrink-0 min-w-[90px] text-xs'
          isDisabled>
          {t('following')}
        </Button>
      );
    }
    // 显示 Follow back 按钮
    return (
      <Button
        size='sm'
        variant='solid'
        color='primary'
        radius='full'
        className='flex-shrink-0 min-w-[90px] text-xs'
        isLoading={followBackLoadingId === message.id}
        onPress={() => handleFollowBack(message)}>
        {t('followBack')}
      </Button>
    );
  };

  const renderMessageItem = (message: MessageContent) => {
    const thumbnailUrl = message.host_thumbnail || '';
    const showThumbnail =
      message.type !== CONTENT_TYPES.FOLLOW && Boolean(thumbnailUrl);
    const isVideoThumbnail = isVideoUrl(thumbnailUrl);
    const isFollowMessage = message.type === CONTENT_TYPES.FOLLOW;

    return (
      <div
        key={message.id}
        className='flex items-center gap-3 p-4 hover:bg-muted transition-colors cursor-pointer border-b border-border last:border-b-0'
        onClick={() => handleMessageClick(message)}>
        {/* Avatars */}
        <div className='flex-shrink-0 w-12 h-12 flex items-center justify-center'>
          {renderAvatars(message)}
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-1 flex-wrap'>
                {renderUserNames(message)}
                {renderMessageContent(message)}
              </div>
            </div>

            {/* Follow back 按钮 - 仅在 Follow 通知中显示 */}
            {isFollowMessage && (
              <div className='flex-shrink-0' onClick={e => e.stopPropagation()}>
                {renderFollowBackButton(message)}
              </div>
            )}

            {/* Thumbnail */}
            {showThumbnail && (
              <div className='flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden'>
                {isVideoThumbnail ? (
                  <video
                    src={getVideoThumbnailSrc(thumbnailUrl)}
                    className='w-full h-full object-cover pointer-events-none'
                    muted
                    playsInline
                    preload='metadata'
                    aria-label={message.host_content_title || ''}
                  />
                ) : (
                  <DynamicImage
                    src={thumbnailUrl}
                    alt={message.host_content_title || ''}
                    className='w-full h-full object-cover'
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isAuth) {
    return (
      <>
        <Head>
          <title>{t('pageTitle')}</title>
        </Head>
        <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
          <Header autoOpenLogin={false} />
          <div className='flex'>
            <Sidebar />
            <div className='w-full pt-5 sm:pt-5 md:pt-10 p-2 md:p-4 lg:pl-60 2xl:pl-72 h-full mb-[5rem] lg:mr-8'>
              <div className='max-w-4xl mx-auto px-4 py-8'>
                <Card className='bg-card rounded-2xl shadow-lg'>
                  <CardBody className='p-6 text-center'>
                    <p className='text-muted-foreground'>{t('pleaseLogin')}</p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t('pageTitle')}</title>
      </Head>
      <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
        <Header autoOpenLogin={false} />
        <div className='flex'>
          <Sidebar />
          <div className='w-full pt-5 sm:pt-5 md:pt-10 p-2 md:p-4 lg:pl-60 2xl:pl-72 h-full mb-[5rem] lg:mr-8'>
            <div className='max-w-4xl mx-auto px-4 py-8'>
              {/* Header */}
              <div className='mb-6 flex items-center justify-between'>
                <div>
                  <h1 className='text-3xl font-bold text-heading'>
                    {t('notifications')}
                  </h1>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {t('notificationsSubtitle')}
                  </p>
                </div>
              </div>

              {/* Messages List */}
              <Card className='bg-card rounded-2xl shadow-lg'>
                <CardBody className='p-0'>
                  {loading ? (
                    <div className='flex justify-center items-center py-20'>
                      <Spinner size='lg' />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className='flex justify-center items-center py-20'>
                      <p className='text-muted-foreground'>{t('noNotifications')}</p>
                    </div>
                  ) : (
                    <>
                      {messages.map(renderMessageItem)}
                      {hasMore && (
                        <div
                          ref={loadMoreRef}
                          className='py-6 flex justify-center items-center border-t border-border'>
                          {loadingMore && <Spinner size='sm' />}
                        </div>
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
