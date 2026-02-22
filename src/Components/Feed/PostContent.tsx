/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Textarea,
  Tabs,
  Tab,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tooltip,
} from '@nextui-org/react';
import { IconSend2, IconShare3 } from '@tabler/icons-react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { HiOutlineDownload } from 'react-icons/hi';
import { HiOutlinePlus, HiSparkles } from 'react-icons/hi2';
import {
  RiFacebookCircleFill,
  RiLink,
  RiMoreFill,
  RiPinterestFill,
  RiRedditFill,
  RiTelegramFill,
  RiTwitterXFill,
  RiWhatsappFill,
  RiEyeOffLine,
} from 'react-icons/ri';
import { CommentSection } from '../Comments/CommentSection';
import { PromptCard } from './PromptCard';
import { AuthorBar } from './AuthorBar';
import {
  Post,
  Comment,
  authAtom,
  isMobileAtom,
  loginModalAtom,
  profileAtom,
} from '../../state';
import { shareLink } from '../../utilities';
import {
  buildCreateYoursParams,
  getToolPageRoute,
} from '../../utilities/tools';
import { useVideoPreload } from '@/hooks/useVideoPreload';
import { useCheckAuth } from '@/hooks/useCheckAuth';
import { usePostTranslation } from '@/hooks/usePostTranslation';
import { usePostOCLogic } from '@/hooks/usePostOCLogic';
import { useRemixCount } from '@/hooks/useRemixCount';
import { formatRelativeTime, copyText, isHiddenPrompt } from './postUtils';
import { GRID_LAYOUT_TAGS } from '../../constants';
import { ROLES } from './postConstants';
import { TagChip } from '../TagChip';

export interface PostContentProps {
  item: Post;
  handleFollow?: (id: number) => void;
  comment: string;
  handleCommentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleComment: (
    id: number,
    parentCommentId?: number,
    replyingToUserUniqId?: string,
    replyingToCommentId?: number,
  ) => void;
  handleLike: (id: number) => void;
  showMore?: boolean;
  handleClose?: () => void;
  isFullScreen?: boolean;
  onHidePost?: (postId: number) => void;
  shouldShowDelete?: boolean;
  isTranslating?: boolean;
  handleTranslate?: () => void;
  onClearReplyState?: () => void;
  ocPromptFromParent?: string | null;
  ocCharIdFromParent?: string | null;
  // Tag-specific feature props
  tagId?: number;
  canFeatureForTag?: boolean;
  isTagFeatured?: boolean;
  onTagFeature?: (
    postId: number,
    tagId: number,
    action: 'feature' | 'unfeature',
  ) => Promise<void>;
  // Tag-specific pin props
  canPinForTag?: boolean;
  isTagPinned?: boolean;
  onTagPin?: (
    postId: number,
    tagId: number,
    action: 'pin' | 'unpin',
  ) => Promise<void>;
  // Tag-specific hide props
  canHideForTag?: boolean;
  isTagHidden?: boolean;
  onTagHide?: (
    postId: number,
    tagId: number,
    action: 'hide' | 'unhide',
  ) => Promise<void>;
  // Block user props
  onBlockUser?: (userId: string, userName: string) => void;
  isAuthorBlocked?: boolean;
  // Report post props
  onReportPost?: (postId: number) => void;
}

export const PostContent = ({
  item,
  showMore,
  handleFollow,
  comment,
  handleCommentChange,
  handleComment,
  handleLike,
  handleClose,
  isFullScreen,
  onHidePost,
  shouldShowDelete,
  isTranslating,
  handleTranslate,
  tagId,
  canFeatureForTag,
  isTagFeatured,
  onTagFeature,
  canPinForTag,
  isTagPinned,
  onTagPin,
  canHideForTag,
  isTagHidden,
  onTagHide,
  onBlockUser,
  isAuthorBlocked,
  onReportPost,
}: PostContentProps) => {
  const { t } = useTranslation('common');
  const { t: tCharacter } = useTranslation('character');
  const router = useRouter();
  const { showSocial } = router.query;
  const isAuth = useAtomValue(authAtom);
  const loginModal = useAtomValue(loginModalAtom);
  const profile = useAtomValue(profileAtom);

  // Use custom hooks
  const { displayTitle, displayContent } = usePostTranslation(item);
  const {
    hasOCCharacter,
    isOCPostItem,
    isOwnCharacter,
    isCollectingOC,
    handleCollectOC,
    handleCreateYoursOC,
  } = usePostOCLogic(item);

  const shouldShowTryTheToolSingle =
    !isOCPostItem &&
    item.generations &&
    item.generations.length === 1 &&
    isHiddenPrompt(item.generations[0]);

  const shouldShowOCRemixButton =
    hasOCCharacter &&
    (!item.generations ||
      item.generations.length === 0 ||
      item.generations[0]?.tool === 'oc-maker');

  const shouldShowSingleRemixButton =
    item.generations &&
    item.generations.length === 1 &&
    !shouldShowTryTheToolSingle;

  const shouldEnableRemixCount =
    shouldShowOCRemixButton || shouldShowSingleRemixButton;

  const { remixCount, remixButtonRef, incrementRemixCount } = useRemixCount({
    postId: item.id,
    enabled: shouldEnableRemixCount,
    fetchOnView: true,
  });

  const [showSocialButtons, setShowSocialButtons] = useState(
    (showSocial as string) == 'true',
  );
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false);
  const [isPinConfirmModalOpen, setIsPinConfirmModalOpen] = useState(false);
  const [isUnpinConfirmModalOpen, setIsUnpinConfirmModalOpen] = useState(false);
  const [parentCommentId, setParentCommentId] = useState<number | undefined>();
  const [replyingToCommentId, setReplyingToCommentId] = useState<
    number | undefined
  >();
  const [replyingToUserName, setReplyingToUserName] = useState<string>('');
  const [replyingToUserId, setReplyingToUserId] = useState<
    string | undefined
  >();
  const [comments, setComments] = useState<Comment[]>(item.comments || []);
  const [isReplyingActive, setIsReplyingActive] = useState(false);
  const [shouldClearCommentSection, setShouldClearCommentSection] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLiking, setIsLiking] = useState(false);

  // Sync item.comments changes to local state
  useEffect(() => {
    setComments(item.comments || []);
  }, [item.comments]);
  const shareUrl = useMemo(
    () =>
      ({
        url: `/post/${item.uniqid}${profile?.invite_code && item.authUserId === profile?.id ? '?code=' + profile.invite_code : ''}`,
        toString() {
          let origin = 'https://komiko.app';
          try {
            origin = window?.location?.origin || origin;
          } finally {
            return origin + (this as any).url;
          }
        },
      }) as unknown as string,
    [profile?.invite_code, profile?.id, item?.authUserId],
  );
  const shouldPreload = useVideoPreload(videoRef);
  // 检查用户是否为admin角色
  const isAdmin = profile.roles?.includes(ROLES.ADMIN) || false;
  const isMobile = useAtomValue(isMobileAtom);

  // 处理hide post
  const handleHidePost = async () => {
    try {
      const response = await fetch('/api/post/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: item.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.code === 1) {
        toast.success('Post hidden successfully');
        onHidePost?.(item.id);
        handleClose?.();
      } else {
        toast.error(data.error || 'Failed to hide post');
      }
    } catch (error) {
      console.error('Error hiding post:', error);
      toast.error('Failed to hide post');
    }
  };

  useEffect(() => {
    if (!shouldPreload) return;

    const video = videoRef.current;
    if (!video) return;

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    video.muted = !isDesktop;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (!video.muted) {
          console.log('Unmuted autoplay failed, falling back to muted.', error);
          video.muted = true;
          video
            .play()
            .catch(e => console.error('Muted autoplay also failed.', e));
        }
      });
    }
  }, [shouldPreload]);

  const checkAuth = useCheckAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  // Function to handle focusing on reply
  const handleFocusReply = (commentId: number, replyToCommentId?: number) => {
    if (commentId === 0) {
      // Cancel reply - clear the state
      setReplyingToCommentId(undefined);
      setParentCommentId(undefined);
      setReplyingToUserName('');
      setIsReplyingActive(false);
      return;
    }

    setReplyingToCommentId(replyToCommentId || commentId);
    setParentCommentId(commentId);
    // Find the user name for the comment being replied to
    const findCommentUser = (
      comments: Comment[],
      id: number,
    ): { userName: string; userId: string } | null => {
      for (const comment of comments) {
        if (comment.id === id) {
          // console.log('comment', comment);
          return {
            userName: comment.user_name,
            userId: comment.user_id,
          };
        }
        if (comment.children) {
          const found = findCommentUser(comment.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    // If replying to a nested comment, find that user's name
    // Otherwise, find the parent comment's user name
    const targetCommentId = replyToCommentId || commentId;
    const { userName, userId } =
      findCommentUser(comments, targetCommentId) ?? {};
    setReplyingToUserName(userName || '');
    setReplyingToUserId(userId || '');

    // Force focus by toggling the active state
    setIsReplyingActive(false);
    // Use a small timeout to ensure the state change is detected
    setTimeout(() => {
      setIsReplyingActive(true);
    }, 10);
  };

  // Wrap handleComment to clear reply state after submission
  const wrappedHandleComment = (id: number) => {
    // Call the original handleComment
    const result = handleComment(
      id,
      parentCommentId,
      replyingToUserId,
      replyingToCommentId,
    );

    // Clear reply state after submission (handleComment is async but returns void)
    setTimeout(() => {
      // Clear PostCard state
      setReplyingToCommentId(undefined);
      setReplyingToUserName('');
      setReplyingToUserId(undefined);
      setIsReplyingActive(false);
      setParentCommentId(undefined);

      // Trigger CommentSection to clear its state
      setShouldClearCommentSection(prev => prev + 1);
    }, 100);

    return result;
  };

  // Focus textarea when replying
  useEffect(() => {
    if (isReplyingActive && commentTextareaRef.current) {
      setTimeout(() => {
        commentTextareaRef.current?.focus();
      }, 100);
    }
  }, [isReplyingActive, replyingToCommentId]);

  // Handle comment voting
  const handleCommentVote = async (commentId: number) => {
    if (!isAuth) {
      loginModal?.onOpen?.();
      return;
    }

    // Prevent multiple rapid clicks
    if (isLiking) {
      return;
    }

    setIsLiking(true);

    try {
      // Find current comment's liked state
      const findComment = (comments: Comment[], id: number): Comment | null => {
        for (const comment of comments) {
          if (comment.id === id) return comment;
          if (comment.children) {
            const found = findComment(comment.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const currentComment = findComment(comments, commentId);
      if (!currentComment) {
        setIsLiking(false);
        return;
      }

      const newLikedState = !currentComment.liked;

      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: commentId,
          value: currentComment.liked ? -1 : 1, // Cancel if already liked, otherwise like
        }),
      });

      if (response.ok) {
        // Update local state
        updateCommentVoteStatus(commentId, newLikedState);
      } else {
        toast.error('点赞失败');
      }
    } catch (error) {
      console.error('Failed to vote comment:', error);
      toast.error('点赞失败');
    } finally {
      setIsLiking(false);
    }
  };

  // Recursively update comment vote status helper function
  const updateCommentVoteStatus = (commentId: number, liked: boolean) => {
    const updateComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const newVotes = liked
            ? comment.votes + 1
            : Math.max(0, comment.votes - 1);
          return {
            ...comment,
            liked: liked,
            votes: newVotes,
          };
        }
        if (comment.children) {
          return {
            ...comment,
            children: updateComments(comment.children),
          };
        }
        return comment;
      });
    };

    // Update local state
    setComments(prevComments => updateComments(prevComments));
  };

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/post', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (response.ok) {
        toast.success(t('post_card.delete_success'));
        // router.push('/');
        handleClose?.();
        window.location.reload();
      } else {
        toast.error(t('post_card.delete_failed'));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(t('post_card.delete_failed'));
    }
  };

  const handleUnpin = async () => {
    try {
      const response = await fetch('/api/pinPost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unpin',
          postId: item.id,
        }),
      });
      if (response.ok) {
        // Update the local state instead of reloading
        item.isPinned = false;
        toast.success('Post unpinned successfully');
        handleClose?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to unpin post');
      }
    } catch (error) {
      console.error('Error unpinning post:', error);
      toast.error('Failed to unpin post');
    }
  };

  const handlePin = async () => {
    try {
      const response = await fetch('/api/pinPost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'pin',
          postId: item.id,
        }),
      });
      if (response.ok) {
        // Update the local state instead of reloading
        item.isPinned = true;
        toast.success('Post pinned successfully');
        handleClose?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to pin post');
      }
    } catch (error) {
      console.error('Error pinning post:', error);
      toast.error('Failed to pin post');
    }
  };

  return (
    <div
      className='flex flex-col md:flex-row min-h-[60vh]'
      style={isFullScreen ? { height: 'auto' } : { maxHeight: '85vh' }}>
      {/* Left section with images */}
      <div className='block md:hidden'>
        <AuthorBar
          showMore={showMore}
          item={item}
          isAuth={isAuth}
          router={router as any}
          profile={profile}
          setIsDeleteConfirmModalOpen={setIsDeleteConfirmModalOpen}
          handleUnpin={handleUnpin}
          handlePin={handlePin}
          setIsPinConfirmModalOpen={setIsPinConfirmModalOpen}
          setIsUnpinConfirmModalOpen={setIsUnpinConfirmModalOpen}
          onHidePost={handleHidePost}
          isAdmin={isAdmin}
          shouldShowDelete={shouldShowDelete}
          isTranslating={isTranslating}
          handleTranslate={handleTranslate}
          tagId={tagId}
          canFeatureForTag={canFeatureForTag}
          isTagFeatured={isTagFeatured}
          onTagFeature={onTagFeature}
          canPinForTag={canPinForTag}
          isTagPinned={isTagPinned}
          onTagPin={onTagPin}
          canHideForTag={canHideForTag}
          isTagHidden={isTagHidden}
          onTagHide={onTagHide}
          handleClose={handleClose}
          onBlockUser={onBlockUser}
          isAuthorBlocked={isAuthorBlocked}
          onReportPost={onReportPost}></AuthorBar>
      </div>
      <div
        style={{ flex: '5 5 0%' }}
        className={` ${item.media.length === 1 ? 'overflow-auto flex items-center justify-center md:h-full' : 'overflow-y-auto md:h-full'} w-full min-h-[60vh]`}
        id='leftElement'>
        <div
          className={`${item.media.length === 1 ? 'flex flex-col items-center justify-center h-full w-full md:h-full min-h-[60vh]' : 'flex flex-col items-center w-full'}`}>
          {item.media_type === 'video' ? (
            // 对于视频类型，只渲染第一个媒体文件，使用原生控制器
            <div className='flex relative justify-center items-center w-full min-h-[60vh]'>
              <video
                ref={videoRef}
                src={item.media[0] + '#t=0.001'}
                className='object-contain w-full'
                id='responsiveVideo-0'
                controls
                loop
                playsInline
                preload={shouldPreload ? 'metadata' : 'none'}
                style={{ maxHeight: '70vh' }}></video>
            </div>
          ) : (
            // 对于图片类型，渲染所有媒体文件
            item.media.map((mediaUrl, index) => (
              <img
                key={index}
                src={mediaUrl}
                alt={displayTitle}
                className={`${item.media.length === 1 ? 'object-contain max-h-full' : 'max-w-full object-contain'}`}
                style={
                  item.media.length === 1
                    ? { maxWidth: '100%', maxHeight: '100%' }
                    : {}
                }
                loading='lazy'
                id={`responsiveImage-${index}`}
              />
            ))
          )}
          {!isAuth && (
            <div className='mt-2 w-full text-muted-foreground'>
              <div className='flex justify-center mb-1 w-full'>
                {t('post_card.the_end')}
              </div>

              <div className='flex justify-center w-full'>
                <div>
                  {t('post_card.discover')}&nbsp;
                  <Link href='/' className='text-blue-500'>
                    {t('post_card.more_stories')}
                  </Link>
                  &nbsp;{t('post_card.or_start')}&nbsp;
                  <Link href='/create' className='text-blue-500'>
                    {t('post_card.creating_your_own')}
                  </Link>
                  !
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section with content */}
      <div
        style={{ flex: '4 4 0%' }}
        className={`overflow-y-auto min-h-[60vh] ${isFullScreen ? 'h-screen' : 'max-h-[85vh]'}`}
        id='rightElement' // Preserving the id
      >
        <Card className='shadow-none bg-background dark:bg-card'>
          <div className='hidden mt-4 md:block'>
            <AuthorBar
              showMore={showMore}
              item={item}
              isAuth={isAuth}
              router={router as any}
              handleFollow={handleFollow}
              profile={profile}
              setIsDeleteConfirmModalOpen={setIsDeleteConfirmModalOpen}
              handleUnpin={handleUnpin}
              handlePin={handlePin}
              setIsPinConfirmModalOpen={setIsPinConfirmModalOpen}
              setIsUnpinConfirmModalOpen={setIsUnpinConfirmModalOpen}
              onHidePost={handleHidePost}
              shouldShowDelete={shouldShowDelete}
              isAdmin={isAdmin}
              isTranslating={isTranslating}
              handleTranslate={handleTranslate}
              tagId={tagId}
              canFeatureForTag={canFeatureForTag}
              isTagFeatured={isTagFeatured}
              onTagFeature={onTagFeature}
              canPinForTag={canPinForTag}
              isTagPinned={isTagPinned}
              onTagPin={onTagPin}
              canHideForTag={canHideForTag}
              isTagHidden={isTagHidden}
              onTagHide={onTagHide}
              onBlockUser={onBlockUser}
              isAuthorBlocked={isAuthorBlocked}
              onReportPost={onReportPost}></AuthorBar>
          </div>
          <CardBody className='px-6 pt-1 pb-1'>
            <div className='overflow-y-auto'>
              <p className='mt-2 font-semibold text-large'>{displayTitle}</p>
              <p className='mt-2' style={{ whiteSpace: 'pre-wrap' }}>
                {displayContent}
              </p>
              {item.post_tags && item.post_tags.length > 0 && (
                <div className='flex flex-wrap gap-1.5 mt-3'>
                  {(() => {
                    // Check if tag is a character tag (@xxx or <xxx>), excluding grid/layout tags
                    const isOcTag = (tagName: string) =>
                      tagName.startsWith('@') ||
                      (tagName.startsWith('<') &&
                        tagName.endsWith('>') &&
                        !GRID_LAYOUT_TAGS.has(tagName));

                    // Extract character ID from various tag formats
                    const extractCharacterId = (tagName: string): string => {
                      if (tagName.startsWith('@')) {
                        return tagName.slice(1); // Remove '@' prefix
                      }
                      if (tagName.startsWith('<') && tagName.endsWith('>')) {
                        return tagName.slice(1, -1); // Remove '<' and '>'
                      }
                      return tagName;
                    };

                    return item.post_tags
                      .filter(tag => tag.id !== 57349 && tag.id !== 87327)
                      .sort((a, b) => {
                        const aIsOc = isOcTag(a.name);
                        const bIsOc = isOcTag(b.name);
                        if (aIsOc && !bIsOc) return -1;
                        if (!aIsOc && bIsOc) return 1;
                        return 0;
                      })
                      .map(tag => {
                        const isOc = isOcTag(tag.name);
                        const ocID = extractCharacterId(tag.name);

                        const href = isOc
                          ? `/character/${ocID}`
                          : `/tags/${tag.name}`;

                        return (
                          <div
                            key={tag.id}
                            className='cursor-pointer'
                            onClick={e => {
                              e.stopPropagation();
                              router.push(href);
                              handleClose?.();
                            }}>
                            <TagChip tag={tag} />
                          </div>
                        );
                      });
                  })()}
                </div>
              )}
              <p className='mt-2 text-sm text-default-500'>
                {formatRelativeTime(item.created_at)}
              </p>
              <Divider className='my-4' />
              <Tabs
                aria-label='Options'
                variant='underlined'
                color='primary'
                classNames={{
                  tabList: 'gap-3',
                  tab: 'px-0',
                }}>
                <Tab key='Comments' title={t('post_card.comments')}>
                  <CommentSection
                    postId={item.id}
                    comments={comments}
                    onCommentSubmit={async (
                      content,
                      parentCommentId,
                      replyToCommentId,
                      replyToUserId,
                    ) => {
                      // Use existing handleComment logic but with parentCommentId support
                      try {
                        const response = await fetch('/api/comment', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            postId: item.id,
                            parentCommentId,
                            replyToCommentId,
                            replyToUserId,
                            content,
                            item,
                          }),
                        });

                        const new_comments = await response.json();
                        if (response.ok) {
                          // Update the post with new comments
                          const updatedItem = {
                            ...item,
                            comments: new_comments,
                          };
                          setComments(new_comments);
                        } else {
                          console.log(new_comments.error);
                          throw new Error(
                            new_comments.error || 'Failed to post comment',
                          );
                        }
                      } catch (error) {
                        console.error('Failed to post comment:', error);
                        toast.error('Failed to post comment');
                        // throw error; // Re-throw to be caught in CommentSection
                      }
                    }}
                    onFocusReply={handleFocusReply}
                    onVote={handleCommentVote}
                    shouldClearCommentSection={shouldClearCommentSection}
                  />
                </Tab>
                {hasOCCharacter && (
                  //Adopt OC button
                  <>
                    {!isOwnCharacter && (
                      <Tab
                        key='CollectOC'
                        title={
                          <Button
                            size='sm'
                            onPress={() => {
                              handleCollectOC();
                            }}
                            variant='flat'
                            color='secondary'
                            className='text-xs md:text-sm font-medium rounded-xl gap-1'
                            isLoading={isCollectingOC}>
                            <HiOutlinePlus />
                            <span>{tCharacter('collectOCShort')}</span>
                          </Button>
                        }
                      />
                    )}

                    {(!item.generations ||
                      item.generations.length === 0 ||
                      item.generations[0]?.tool === 'oc-maker') && (
                      <Tab
                        key='CreateYoursOC'
                        title={
                          <div ref={remixButtonRef} className='inline-flex'>
                            <Button
                              size='sm'
                              color='primary'
                              className='text-sm font-medium rounded-xl gap-1'
                              startContent={<HiSparkles className='w-4 h-4' />}
                              onPress={() => {
                                void incrementRemixCount();
                                handleCreateYoursOC();
                              }}>
                              {remixCount < 2
                                ? t('post_card.remix')
                                : t('post_card.remix_count', {
                                    count: remixCount,
                                  })}
                            </Button>
                          </div>
                        }
                      />
                    )}
                  </>
                )}

                {/* Single generation with Create Yours button */}
                {item.generations && item.generations.length === 1 && (
                  <Tab
                    key='CreateYours'
                    title={
                      <div ref={remixButtonRef} className='inline-flex'>
                        <Button
                          size='sm'
                          color='primary'
                          className='text-sm font-medium rounded-xl gap-1'
                          startContent={<HiSparkles className='w-4 h-4' />}
                          onPress={() => {
                            if (!shouldShowTryTheToolSingle) {
                              void incrementRemixCount();
                            }
                            const route = getToolPageRoute(
                              item.generations[0].tool,
                              item.generations[0].meta_data,
                            );
                            const params = buildCreateYoursParams(
                              item.generations[0],
                              item,
                            );
                            router.push(`${route}?${params.toString()}`);
                          }}>
                          {shouldShowTryTheToolSingle
                            ? t('post_card.try_the_tool')
                            : remixCount < 2
                              ? t('post_card.remix')
                              : t('post_card.remix_count', {
                                  count: remixCount,
                                })}
                        </Button>
                      </div>
                    }
                  />
                )}
                {/* Multiple generations with Create Yours buttons */}
                {item.generations && item.generations.length > 1 && (
                  <Tab key='Prompts' title={t('post_card.prompts')}>
                    <div className='flex flex-col gap-3'>
                      {item.generations &&
                        item.generations.map((generation, index) => {
                          return (
                            <PromptCard
                              key={generation.url_path}
                              generation={generation}
                              item={item}
                            />
                          );
                        })}
                      {!item.generations ||
                        (item.generations.length === 0 && (
                          <div className='flex justify-center items-center text-base text-default-500'>
                            {t('post_card.no_prompts')}
                          </div>
                        ))}
                    </div>
                  </Tab>
                )}

                {item.generations &&
                  item.generations.length === 1 &&
                  isHiddenPrompt(item.generations[0]) && (
                    <Tab
                      key='PromptHidden'
                      isDisabled
                      className='data-[disabled=true]:opacity-100 data-[disabled=true]:cursor-help'
                      title={
                        <>
                          {/* 桌面端：显示图标 + 文字 + tooltip */}
                          <div className='pointer-events-auto'>
                            <Tooltip
                              showArrow
                              content={
                                <div className='px-2 py-2'>
                                  <p className='text-sm'>
                                    {t('post_card.prompt_hidden_tooltip')}
                                  </p>
                                </div>
                              }
                              placement='top-end'
                              classNames={{
                                content:
                                  'bg-content1 dark:bg-content1 border border-default-200 shadow-lg',
                              }}>
                              <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-transparent text-xs cursor-help transition-colors !text-foreground-700 dark:!text-foreground-400'>
                                <RiEyeOffLine className='w-3.5 h-3.5' />
                                <span>{t('post_card.prompt_hidden')}</span>
                              </span>
                            </Tooltip>
                          </div>
                        </>
                      }>
                      <div />
                    </Tab>
                  )}
              </Tabs>
            </div>
          </CardBody>
          <CardFooter className='justify-between pt-0.5 flex-[0] min-h-[56px]'>
            <div className='flex-1 flex flex-col'>
              <Textarea
                ref={commentTextareaRef}
                className='flex rounded-full'
                radius='full'
                variant='flat'
                placeholder={
                  replyingToCommentId
                    ? t('post_card.reply_to_user', {
                        userName: replyingToUserName,
                      })
                    : t('post_card.join_discussion')
                }
                minRows={1}
                maxRows={4}
                style={{ resize: 'none' }}
                value={comment}
                onChange={handleCommentChange}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    wrappedHandleComment(item.id);
                  }
                }}
                classNames={{
                  inputWrapper: 'bg-input focus-within:bg-input',
                  input: '!text-foreground',
                }}
              />
            </div>
            <div className='flex justify-center items-center mr-1 cursor-pointer'>
              <IconSend2
                stroke={1.75}
                className={'w-8 h-8 text-lg'}
                onClick={() => {
                  if (!isAuth) {
                    loginModal?.onOpen?.();
                  } else {
                    wrappedHandleComment(item.id, replyingToCommentId);
                  }
                }}
              />
              <span className='ml-1'> </span>
            </div>
            <div
              className='flex justify-center items-center mr-2 cursor-pointer'
              onClick={() => {
                if (!isAuth) {
                  loginModal?.onOpen?.();
                } else {
                  handleLike(item.id);
                }
              }}>
              {item.liked ? (
                <AiFillHeart className='w-8 h-8 text-lg text-red-500' />
              ) : (
                <AiOutlineHeart className='w-8 h-8 text-lg' />
              )}
              <span className='ml-1'> {item.votes}</span>
            </div>
            <div className='flex justify-center items-center cursor-pointer'>
              {isMobile && (
                <IconShare3
                  stroke={1.75}
                  className={'w-8 h-8 text-lg'}
                  onClick={() => {
                    setShowSocialButtons(true);
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(shareUrl);
                    } else {
                      copyText(shareUrl);
                    }
                    toast.success(t('post_card.sharing_link_copied'));
                  }}
                />
              )}
              {!isMobile && (
                <div
                  onMouseEnter={() => setShowSocialButtons(true)}
                  onMouseLeave={() => setShowSocialButtons(false)}>
                  <Popover
                    placement='top-end'
                    showArrow={true}
                    isOpen={showSocialButtons}
                    onOpenChange={setShowSocialButtons}
                    backdrop='transparent'>
                    <PopoverTrigger>
                      <IconShare3
                        stroke={1.75}
                        className={'w-8 h-8 text-lg cursor-pointer'}
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(shareUrl);
                          } else {
                            copyText(shareUrl.toString());
                          }
                          toast.success(t('post_card.sharing_link_copied'));
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className='px-2 py-2 mb-1 bg-muted rounded-lg'>
                      {profile?.id === item?.authUserId && (
                        <h3 className='max-w-[300px] px-1 text-left mb-2 font-medium'>
                          {t('share_title', { count: 500 })}
                        </h3>
                      )}
                      <div className='flex flex-row gap-3 justify-between w-full'>
                        <Button
                          isIconOnly
                          className='bg-transparent'
                          onClick={() => {
                            const twitterText = t('post_card.share.twitter', {
                              title: displayTitle,
                              username: item.user_name,
                              content: displayContent,
                              link: shareUrl.toString(),
                            });
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
                            window.open(twitterUrl, '_blank');
                          }}>
                          <RiTwitterXFill className='w-7 h-7 text-foreground' />
                        </Button>
                        <Button
                          isIconOnly
                          className='bg-transparent'
                          onClick={() => {
                            const facebookText = t('post_card.share.facebook', {
                              title: displayTitle,
                              username: item.user_name,
                              content: displayContent,
                            });
                            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.toString())}&quote=${encodeURIComponent(facebookText)}`;
                            window.open(facebookUrl, '_blank');
                          }}>
                          <RiFacebookCircleFill className='w-8 h-8 text-[#0766FF]' />
                        </Button>
                        <Button
                          isIconOnly
                          className='bg-transparent'
                          onClick={() => {
                            const redditText = t('post_card.share.reddit', {
                              title: displayTitle,
                              username: item.user_name,
                            });
                            const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl.toString())}&title=${encodeURIComponent(redditText)}`;
                            window.open(redditUrl, '_blank');
                          }}>
                          <RiRedditFill className='w-8 h-8 text-[#FF4500]' />
                        </Button>
                        <Button
                          isIconOnly
                          className='bg-transparent'
                          onClick={() => {
                            const pinterestText = t(
                              'post_card.share.pinterest',
                              {
                                title: displayTitle,
                                username: item.user_name,
                              },
                            );
                            const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl.toString())}&media=${encodeURIComponent(item.media[0])}&description=${encodeURIComponent(pinterestText)}`;
                            window.open(pinterestUrl, '_blank');
                          }}>
                          <RiPinterestFill className='w-8 h-8 text-[#EC0023]' />
                        </Button>
                        <Button
                          isIconOnly
                          className='bg-transparent'
                          onClick={() => {
                            const whatsappText = t('post_card.share.whatsapp', {
                              title: displayTitle,
                              username: item.user_name,
                              link: shareUrl.toString(),
                            });
                            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}&url=${encodeURIComponent(shareUrl.toString())}`;
                            window.open(whatsappUrl, '_blank');
                          }}>
                          <RiWhatsappFill className='w-8 h-8 text-[#24D366]' />
                        </Button>
                        <Button
                          isIconOnly
                          className='bg-transparent'
                          onClick={() => {
                            const telegramText = t('post_card.share.telegram', {
                              title: displayTitle,
                              username: item.user_name,
                            });
                            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl.toString())}&text=${encodeURIComponent(telegramText)}`;
                            window.open(telegramUrl, '_blank');
                          }}>
                          <RiTelegramFill className='w-8 h-8 text-[#247EC8]' />
                        </Button>
                      </div>
                      <div className='flex flex-row gap-1 justify-between w-full'>
                        <Button
                          className='gap-1 p-1 pl-2 bg-transparent'
                          onClick={async () => {
                            try {
                              if (item.media_type === 'video') {
                                // 下载视频
                                const response = await fetch(item.media[0]);
                                const blob = await response.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `video_${item.id}.mp4`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success(t('post_card.video_downloaded'));
                              } else {
                                // 下载图片
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                  console.error('Failed to get canvas context');
                                  return;
                                }

                                // 加载所有图片
                                const images = await Promise.all(
                                  item.media.map(
                                    url =>
                                      new Promise((resolve, reject) => {
                                        const img = new window.Image();
                                        img.crossOrigin = 'anonymous';
                                        img.onload = () => resolve(img);
                                        img.onerror = reject;
                                        img.src = url;
                                      }),
                                  ),
                                );

                                // 计算总高度和最大宽度
                                let totalHeight = 0;
                                let maxWidth = 0;
                                images.forEach((img: any) => {
                                  totalHeight += img.height;
                                  maxWidth = Math.max(maxWidth, img.width);
                                });

                                // 设置canvas尺寸
                                canvas.width = maxWidth;
                                canvas.height = totalHeight;

                                // 在canvas上绘制图片
                                let y = 0;
                                images.forEach((img: any) => {
                                  ctx.drawImage(img, 0, y);
                                  y += img.height;
                                });

                                // 转换canvas为Blob
                                const blob = await new Promise(resolve =>
                                  canvas.toBlob(resolve, 'image/png'),
                                );

                                // 创建下载链接并触发下载
                                const url = URL.createObjectURL(blob as Blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `image_${item.id}.png`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success(t('post_card.image_downloaded'));
                              }
                            } catch (error) {
                              console.error('Download failed:', error);
                              toast.error(t('post_card.download_failed'));
                            }
                          }}>
                          <HiOutlineDownload className='w-7 h-7 text-foreground' />
                          {t('post_card.download')}
                        </Button>
                        <Button
                          className='gap-1 p-1 bg-transparent'
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(
                                shareUrl.toString(),
                              );
                            } else {
                              copyText(shareUrl.toString());
                            }
                            toast.success(t('post_card.sharing_link_copied'));
                          }}>
                          <RiLink className='w-7 h-7 text-foreground' />
                          {t('post_card.copy_link')}
                        </Button>
                        <Button
                          className='gap-1 pr-0 pl-1 bg-transparent'
                          onClick={() => {
                            shareLink(
                              `${shareUrl}`,
                              `${displayTitle} | Komiko App`,
                              `${displayTitle} | Komiko App`,
                            );
                          }}>
                          <RiMoreFill className='w-7 h-7 text-foreground' />
                          {t('post_card.more')}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      <Modal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        classNames={{
          wrapper: 'z-[110]',
          backdrop: 'z-[109]',
        }}>
        <ModalContent>
          <ModalHeader>{t('post_card.confirm_delete')}</ModalHeader>
          <ModalBody>
            <p>{t('post_card.confirm_delete_message')}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color='danger'
              variant='light'
              onPress={() => setIsDeleteConfirmModalOpen(false)}>
              {t('post_card.cancel')}
            </Button>
            <Button
              color='danger'
              onPress={() => {
                setIsDeleteConfirmModalOpen(false);
                handleDelete();
              }}>
              {t('post_card.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isPinConfirmModalOpen}
        onClose={() => setIsPinConfirmModalOpen(false)}
        classNames={{
          wrapper: 'z-[110]',
          backdrop: 'z-[109]',
        }}>
        <ModalContent>
          <ModalHeader>Confirm Pin</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to pin this post?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => setIsPinConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='primary'
              onPress={() => {
                setIsPinConfirmModalOpen(false);
                handlePin();
              }}>
              Pin
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isUnpinConfirmModalOpen}
        onClose={() => setIsUnpinConfirmModalOpen(false)}
        classNames={{
          wrapper: 'z-[110]',
          backdrop: 'z-[109]',
        }}>
        <ModalContent>
          <ModalHeader>Confirm Unpin</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to unpin this post?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => setIsUnpinConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='warning'
              onPress={() => {
                setIsUnpinConfirmModalOpen(false);
                handleUnpin();
              }}>
              Unpin
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
