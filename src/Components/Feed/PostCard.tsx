/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import React from 'react';
import {
  Image,
  Card,
  CardBody,
  CardFooter,
  Modal,
  ModalContent,
  ModalBody,
  Button,
} from '@nextui-org/react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { RiPushpinFill } from 'react-icons/ri';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Post, authAtom, loginModalAtom } from '../../state';
import { VipRing, VipAvatar, VipCrownInline } from '../VipBadge';
import { toolsMappingData } from '../../utilities/tools';
import { getToolsIcon } from '../Sidebar/Sidebar';
import { VideoPlayer } from './VideoPlayer';
import { PostContent } from './PostContent';
import { isHiddenPrompt } from './postUtils';
import { usePostTranslation } from '@/hooks/usePostTranslation';
import { usePostToolTitle } from '@/hooks/usePostToolTitle';
import { useVideoControl } from '@/hooks/useVideoControl';
import { usePostOCLogic } from '@/hooks/usePostOCLogic';
import { useRemixCount } from '@/hooks/useRemixCount';

interface PostCardProps {
  item: Post;
  handleOpen: (id: number, uniqid: string) => void;
  handleLike: (id: number) => void;
  handleFollow?: (id: number) => void;
  handleComment: (id: number, parentCommentId?: number) => void;
  handleCommentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  comment: string;
  isOpen: boolean;
  handleClose: () => void;
  useAnchor?: boolean;
  showMore?: boolean;
  isFullScreen?: boolean;
  hideVipRing?: boolean; // 新增：控制是否隐藏VIP光环
  onHidePost?: (postId: number) => void; // 新增：处理hide post的回调
  shouldShowDelete?: boolean;
  modalFullScreen?: boolean;
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

export const PostCard: React.FC<PostCardProps> = memo(
  ({
    item,
    handleOpen,
    handleLike,
    handleFollow,
    handleComment,
    handleCommentChange,
    comment,
    isOpen,
    handleClose,
    useAnchor,
    showMore,
    isFullScreen,
    modalFullScreen,
    hideVipRing = false,
    onHidePost,
    shouldShowDelete,
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
  }) => {
    const { t } = useTranslation('common');
    const router = useRouter();

    const { displayTitle } = usePostTranslation(item);
    const { getToolI18nTitle } = usePostToolTitle();
    const {
      videoRef,
      videoMuted,
      isPlaying,
      showPlayButton,
      handleVideoHover,
      toggleMute,
      pauseVideo,
    } = useVideoControl();
    const { isOCPostItem, shouldShowCreateYourButton, handleOCCreateYours } =
      usePostOCLogic(item);

    const [isHovered, setIsHovered] = useState(false);
    const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = useCallback(() => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (!isOpen) {
        setIsHovered(true);
      }
    }, [isOpen]);

    // const [modalFullScreen, setModalFullScreen] = useState(false);

    const handleMouseLeave = useCallback(() => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 80);
    }, []);

    // 清理定时器
    useEffect(() => {
      return () => {
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
        }
      };
    }, []);

    const isAuth = useAtomValue(authAtom);
    const [isTranslating, setIsTranslating] = useState(false);
    const handleTranslate = async () => {
      try {
        setIsTranslating(true);
        const resp = await fetch('/api/post/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: item.id }),
        });
        const data = await resp.json();
        if (resp.ok && (data?.code === 1 || data?.ok)) {
          toast.success('Translations updated');
        } else {
          toast.error(data?.error || 'Failed to translate');
        }
      } catch (e) {
        toast.error('Failed to translate');
      } finally {
        setIsTranslating(false);
      }
    };

    const loginModal = useAtomValue(loginModalAtom);
    const hidePost = () => {
      onHidePost?.(item.id);
      handleClose();
    };

    // ! HANDLE MODAL SIZE
    const adjustHeight = useCallback(() => {
      const img = document.getElementById('leftElement');
      const rightElement = document.getElementById('rightElement');
      if (img && rightElement) {
        rightElement.style.height = `${img.offsetHeight - 1}px`;
        console.log('adjusting height');
        console.log(`${img.offsetHeight}px`);
      }
    }, []);

    useEffect(() => {
      // 使用防抖来优化resize性能
      let timeoutId: NodeJS.Timeout;
      const debouncedAdjustHeight = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(adjustHeight, 150);
      };

      window.addEventListener('resize', debouncedAdjustHeight);

      return () => {
        window.removeEventListener('resize', debouncedAdjustHeight);
        clearTimeout(timeoutId);
      };
    }, [adjustHeight]);

    useEffect(() => {
      if (isOpen) {
        // 暂停预览视频
        pauseVideo();

        // Use RAF to ensure the modal content has rendered - 优化性能
        const scheduleAdjust = () => {
          requestAnimationFrame(() => {
            adjustHeight();
            // 后续调整使用更少的计时器
            setTimeout(adjustHeight, 100);
            setTimeout(adjustHeight, 500);
          });
        };
        scheduleAdjust();
      }
    }, [isOpen, adjustHeight, pauseVideo]);

    // Close modal when navigating to user profile page (e.g., clicking avatar in comments)
    useEffect(() => {
      const handleRouteChange = (url: string) => {
        if (isOpen && url.includes('/user/')) {
          handleClose();
        }
      };

      router.events.on('routeChangeStart', handleRouteChange);
      return () => {
        router.events.off('routeChangeStart', handleRouteChange);
      };
    }, [isOpen, handleClose, router.events]);

    const onOpen = (e: React.MouseEvent) => {
      e.preventDefault();
      return (id: number, uniqid: string) => {
        handleOpen(id, uniqid);
      };
    };

    const isFirstMediaVideo = item.media_type === 'video';
    // 决定是否显示VIP光环
    const shouldShowVipRing = !hideVipRing;
    const planToUse = shouldShowVipRing ? item.user_plan || 'Free' : 'Free';

    const shouldShowTryTheTool =
      item.generations?.[0] &&
      isHiddenPrompt(item.generations[0]) &&
      !isOCPostItem;

    const { remixCount, remixButtonRef, incrementRemixCount } = useRemixCount({
      postId: item.id,
      enabled: shouldShowCreateYourButton && !shouldShowTryTheTool,
      fetchOnView: true,
    });

    const handleCreateYoursClick = (
      event: React.MouseEvent<HTMLButtonElement>,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      if (!shouldShowTryTheTool) {
        void incrementRemixCount();
      }
      handleOCCreateYours(null);
    };

    // 检查是否有标题内容来决定图片圆角
    const hasTitle = item.title && item.title.trim().length > 0;
    // 对于VIP用户，移除圆角以避免与VIP边框冲突
    const imageRoundedClass =
      shouldShowVipRing && planToUse !== 'Free'
        ? hasTitle
          ? 'rounded-t-none'
          : 'rounded-none'
        : hasTitle
          ? 'rounded-t-xl'
          : 'rounded-xl';

    const overlayTool =
      item.generations?.[0]?.tool || (isOCPostItem ? 'oc-maker' : null);

    const renderOverlays = () => {
      const shouldShow = isHovered && !isOpen;

      return (
        <>
          {/* Pinned indicator */}
          {isTagPinned && (
            <div className='absolute top-2 left-2 z-20'>
              <div className='rounded-full bg-primary-500 px-2 py-1 text-primary-foreground text-[10px] md:text-xs backdrop-blur-sm flex items-center gap-1 shadow-md'>
                <RiPushpinFill className='w-3 h-3' />
                <span className='font-medium'>Pinned</span>
              </div>
            </div>
          )}

          {overlayTool && (
            <div
              className={`absolute bottom-2 right-2 md:top-2 ${isTagPinned ? 'md:top-10' : 'md:top-2'} md:left-2 md:bottom-auto md:right-auto z-10 transition-all duration-300 ease-in-out opacity-100 transform translate-y-0 pointer-events-auto ${shouldShow
                ? 'md:opacity-100 md:translate-y-0 md:pointer-events-auto'
                : 'md:opacity-0 md:-translate-y-2 md:pointer-events-none'
                }`}>
              <div className='pointer-events-none rounded-full bg-black/50 px-2 py-1 text-white text-[10px] md:text-xs backdrop-blur-sm flex items-center'>
                <span className='inline-flex items-start text-wrap text-left'>
                  <span className='w-3 h-3 inline-flex items-center justify-center mr-1 flex-shrink-0 mt-[1px]'>
                    {getToolsIcon(toolsMappingData[overlayTool!]?.route)}
                  </span>
                  {getToolI18nTitle(
                    overlayTool!,
                    item.generations[0]?.meta_data,
                    item.generations[0]?.prompt,
                  )}
                </span>
              </div>
            </div>
          )}

          {shouldShowCreateYourButton && (
            <div
              ref={remixButtonRef}
              className={`absolute bottom-2 right-2 z-10 transition-all duration-300 ease-in-out opacity-100 transform translate-y-0 pointer-events-auto ${shouldShow
                ? 'md:opacity-100 md:translate-y-0 md:pointer-events-auto'
                : 'md:opacity-0 md:translate-y-2 md:pointer-events-none'
                }`}
              onClick={e => e.stopPropagation()}>
              <Button
                size='sm'
                radius='full'
                className='hidden md:inline-flex text-xs font-medium text-primary-foreground bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-md hover:shadow-lg transition-transform hover:scale-[1.02] hover:opacity-100 data-[hover=true]:opacity-100 active:opacity-100 focus-visible:opacity-100 pointer-events-auto'
                type='button'
                onClick={handleCreateYoursClick}>
                {shouldShowTryTheTool
                  ? t('post_card.try_the_tool')
                  : remixCount < 2 ? t('post_card.remix') : t('post_card.remix_count', { count: remixCount })}
              </Button>
            </div>
          )}
        </>
      );
    };

    // 白色内容区域（图片 + 标题）- 根据是否有标题和VIP状态决定圆角
    const whiteContentArea = (
      <Card
        className={`bg-background shadow-none ${shouldShowVipRing && planToUse !== 'Free'
          ? hasTitle
            ? 'rounded-t-none'
            : 'rounded-none'
          : hasTitle
            ? 'rounded-t-xl'
            : 'rounded-xl'
          }`}>
        {useAnchor ? (
          <a
            href={`/post/${item.uniqid}`}
            onClick={e => onOpen(e)(item.id, item.uniqid)}>
            <CardBody className={`overflow-visible p-0 ${imageRoundedClass}`}>
              <div
                className='relative'
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}>
                {isFirstMediaVideo ? (
                  <VideoPlayer
                    videoRef={videoRef}
                    src={item.media[0]}
                    videoMuted={videoMuted}
                    showPlayButton={showPlayButton}
                    isPlaying={isPlaying}
                    className={`object-contain w-auto h-auto ${imageRoundedClass}`}
                    onVideoHover={handleVideoHover}
                    toggleMute={toggleMute}
                  />
                ) : (
                  <Image
                    alt={displayTitle}
                    className='w-full object-cover rounded-none'
                    src={item.media[0]}
                    style={{ height: 'auto' }}
                  />
                )}
                {renderOverlays()}
              </div>
            </CardBody>
          </a>
        ) : (
          <CardBody
            className='overflow-visible p-0 w-full rounded-t-xl'
            onClick={e => onOpen(e)(item.id, item.uniqid)}>
            <div
              className='relative'
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}>
              {isFirstMediaVideo ? (
                <div className='flex justify-center'>
                  <VideoPlayer
                    videoRef={videoRef}
                    src={item.media[0]}
                    videoMuted={videoMuted}
                    showPlayButton={showPlayButton}
                    isPlaying={isPlaying}
                    className='object-contain w-auto h-auto rounded-t-xl'
                    onVideoHover={handleVideoHover}
                    toggleMute={toggleMute}
                  />
                </div>
              ) : (
                <Image
                  alt={displayTitle}
                  className='w-full object-cover mx-auto rounded-none'
                  src={item.media[0]}
                  style={{ height: 'auto' }}
                />
              )}
              {renderOverlays()}
            </div>
          </CardBody>
        )}
        <CardFooter className='justify-between pt-2 px-3 pb-2 text-sm'>
          <b className='overflow-hidden max-h-16 whitespace-normal text-ellipsis'>
            {displayTitle}
          </b>
        </CardFooter>
      </Card>
    );

    // 用户信息区域 - 根据VIP状态决定底部圆角
    const userInfoArea = (
      <div
        className={`bg-background px-3 pb-3 pt-0 ${shouldShowVipRing && planToUse !== 'Free'
          ? 'rounded-b-none'
          : 'rounded-b-xl'
          }`}>
        <div className='flex justify-between items-center text-small'>
          <div className='flex items-center align-center'>
            <VipAvatar
              radius='full'
              className='w-5 h-5 text-tiny'
              src={item.image}
              name={item.user_name}
              plan={planToUse}
              crownSize='sm'
              showCrown={false}
              onClick={() => router.push(`/user/${item.user_uniqid}`)}
              style={{ cursor: 'pointer' }}
            />
            <div className='flex items-center'>
              <p
                className='ml-1 text-sm cursor-pointer text-default-500'
                onClick={() => router.push(`/user/${item.user_uniqid}`)}>
                {item.user_name}
              </p>
              <VipCrownInline plan={planToUse} size='sm' />
            </div>
          </div>
          <div className='flex flex-col gap-1 items-start align-center text-default-500'>
            <div
              className='flex justify-center items-center cursor-pointer'
              onClick={() => {
                if (!isAuth) {
                  loginModal?.onOpen?.();
                } else {
                  handleLike(item.id);
                }
              }}>
              {item.liked ? (
                <AiFillHeart className='text-sm text-red-500' />
              ) : (
                <AiOutlineHeart className='text-sm' />
              )}
              <span className='ml-1'>{item.votes}</span>
            </div>
          </div>
        </div>
      </div>
    );

    // 完整的卡片内容（图片 + 标题 + 用户信息）
    const fullCardContent = (
      <div className='bg-background overflow-hidden'>
        {whiteContentArea}
        {userInfoArea}
      </div>
    );

    const cardContent = (
      <div key={item.id} className='caffelabs text-foreground mb-2 md:mb-3'>
        <div
          className={`transition-shadow duration-300 ease-in-out ${shouldShowVipRing && planToUse !== 'Free' ? '' : 'shadow-none hover:shadow-lg rounded-xl'}`}>
          {shouldShowVipRing && planToUse !== 'Free' ? (
            <VipRing plan={planToUse} intensity='light'>
              {fullCardContent}
            </VipRing>
          ) : (
            <div className='border border-border rounded-xl overflow-hidden shadow-sm'>
              {fullCardContent}
            </div>
          )}
        </div>

        {isOpen && (
          <Modal
            size={modalFullScreen ? 'full' : '4xl'}
            isOpen
            onClose={handleClose}
            hideCloseButton
            backdrop='opaque'
            classNames={{
              wrapper: 'z-[100]',
              backdrop: 'z-[99]',
            }}>
            <ModalContent>
              <ModalBody className='overflow-y-auto pt-0 pr-0 pb-0 pl-0 h-full md:overflow-y-none'>
                <PostContent
                  item={item}
                  handleFollow={handleFollow}
                  comment={comment}
                  handleCommentChange={handleCommentChange}
                  handleComment={handleComment}
                  handleLike={handleLike}
                  showMore={showMore}
                  handleClose={handleClose}
                  isFullScreen={isFullScreen}
                  onHidePost={hidePost}
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
                  onBlockUser={onBlockUser}
                  isAuthorBlocked={isAuthorBlocked}
                  onReportPost={onReportPost}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </div>
    );

    return cardContent;
  },
);

export default PostCard;
