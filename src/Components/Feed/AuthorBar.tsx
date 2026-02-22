import React, { useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider,
} from '@nextui-org/react';
import { IoIosArrowBack } from 'react-icons/io';
import {
  RiMoreFill,
  RiTranslate,
  RiDeleteBin6Line,
  RiUnpinLine,
  RiPushpinLine,
  RiEyeOffLine,
  RiStarLine,
  RiStarFill,
  RiAlertFill,
  RiAlertLine,
  RiUserForbidLine,
  RiFlagLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import { VipAvatar, VipCrownInline } from '../VipBadge';
import { Post, Profile } from '../../state';

interface AuthorBarProps {
  showMore?: boolean;
  item: Post;
  isAuth: boolean;
  router: any;
  handleFollow?: (id: number) => void;
  profile?: Profile;
  setIsDeleteConfirmModalOpen: (open: boolean) => void;
  handleUnpin?: () => void;
  handlePin?: () => void;
  setIsPinConfirmModalOpen?: (open: boolean) => void;
  setIsUnpinConfirmModalOpen?: (open: boolean) => void;
  onHidePost?: (postId: number) => Promise<void>;
  isAdmin?: boolean;
  shouldShowDelete?: boolean;
  isTranslating?: boolean;
  handleTranslate?: () => void;
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
  // Close handler for modal
  handleClose?: () => void;
  // Block user handler
  onBlockUser?: (userId: string, userName: string) => void;
  isAuthorBlocked?: boolean;
  // Report post handler
  onReportPost?: (postId: number) => void;
}

export const AuthorBar = memo(
  ({
    showMore,
    item,
    isAuth,
    router,
    handleFollow,
    profile,
    setIsDeleteConfirmModalOpen,
    handleUnpin,
    handlePin,
    setIsPinConfirmModalOpen,
    setIsUnpinConfirmModalOpen,
    onHidePost,
    isAdmin,
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
    handleClose,
    onBlockUser,
    isAuthorBlocked,
    onReportPost,
  }: AuthorBarProps) => {
    const { t } = useTranslation('common');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const [isFeaturing, setIsFeaturing] = useState(false);
    const [isTagFeaturing, setIsTagFeaturing] = useState(false);
    const [isTagPinning, setIsTagPinning] = useState(false);
    const [isTagHiding, setIsTagHiding] = useState(false);
    const [isNsfwToggling, setIsNsfwToggling] = useState(false);

    // 使用真实的用户plan
    const userPlan = item.user_plan || 'Free';
    const NSFW_TAG_ID = 2;

    // 检测是否为 Featured post
    const isFeaturedPost = () => {
      if (!item.post_tags || item.post_tags.length === 0) {
        return false;
      }

      return item.post_tags.some(
        tag => tag.id === 57349 && tag.name === 'Featured',
      );
    };

    const handleFeaturePost = async (featured: boolean) => {
      setIsFeaturing(true);
      try {
        const response = await fetch('/api/featurePost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: item.id,
            featured,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // 更新 post_tags 而不是 featured 字段
          if (result.data.post_tags) {
            item.post_tags = result.data.post_tags;
          }
          toast.success(
            featured
              ? 'Post featured successfully'
              : 'Post unfeatured successfully',
          );
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to update featured status');
        }
      } catch (error) {
        console.error('Error updating featured status:', error);
        toast.error('Failed to update featured status');
      } finally {
        setIsFeaturing(false);
      }
    };

    const isNsfwPost = () => {
      if (!item.post_tags || item.post_tags.length === 0) {
        return false;
      }

      return item.post_tags.some(
        tag => tag.id === NSFW_TAG_ID || tag.name === 'NSFW',
      );
    };

    const handleToggleNsfw = async () => {
      const wasNsfw = isNsfwPost();
      setIsNsfwToggling(true);
      try {
        const response = await fetch('/api/toggleNsfw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: item.id,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.data.post_tags) {
            item.post_tags = result.data.post_tags;
          }
          toast.success(wasNsfw ? 'Post unmarked NSFW' : 'Post marked NSFW');
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to update NSFW status');
        }
      } catch (error) {
        console.error('Error toggling NSFW status:', error);
        toast.error('Failed to update NSFW status');
      } finally {
        setIsNsfwToggling(false);
      }
    };

    return (
      <div className='flex z-10 justify-between pr-6 pb-0 pl-5 mt-2 mb-2 bg-card'>
        <div>
          <div className='flex items-center align-center'>
            <div
              onClick={() => {
                if (handleClose) {
                  handleClose();
                } else if (isAuth) {
                  router.back({ scroll: false });
                } else {
                  router.push('/', { scroll: false });
                }
              }}
              className='block md:hidden'>
              <IoIosArrowBack className='mr-3 w-7 h-7' />
            </div>
            <VipAvatar
              radius='full'
              size='md'
              src={item.image}
              name={item.user_name}
              plan={userPlan}
              className='cursor-pointer'
              showCrown={false}
              onClick={() => router.push(`/user/${item.user_uniqid}`)}
            />
            <div className='flex items-center'>
              <p
                className='ml-3 text-base cursor-pointer text-default-500'
                onClick={() => router.push(`/user/${item.user_uniqid}`)}>
                {item.user_name}
              </p>
              <VipCrownInline plan={userPlan} size='sm' />
            </div>
          </div>
        </div>
        <div className='flex gap-2 items-center'>
          {handleFollow && item.authUserId !== profile?.id && (
            <Button
              variant={item.followed ? 'ghost' : 'solid'}
              radius='full'
              size='sm'
              className={
                item.followed
                  ? 'bg-card text-foreground shadow-none w-[100px] text-[16px]'
                  : 'text-primary-foreground bg-primary-500 w-[100px] text-[16px]'
              }
              onClick={async () => {
                if (isAuth === false) {
                  router.push('/login');
                } else {
                  handleFollow(item.id);
                }
              }}>
              {item.followed ? t('post_card.following') : t('post_card.follow')}
            </Button>
          )}
          {showMore && isAuth && (
            <Popover
              placement='bottom-end'
              isOpen={isDeleteModalOpen}
              onOpenChange={open => {
                setIsDeleteModalOpen(open);
              }}>
              <PopoverTrigger>
                <Button isIconOnly variant='light' className='text-default-500'>
                  <RiMoreFill className='w-6 h-6' />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className='px-1 py-2 min-w-[180px]'>
                  {/* User actions */}
                  {shouldShowDelete && (
                    <Button
                      className='justify-start w-full'
                      variant='light'
                      startContent={<RiDeleteBin6Line className='w-5 h-5' />}
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setIsDeleteConfirmModalOpen(true);
                      }}>
                      {t('post_card.delete')}
                    </Button>
                  )}

                  {/* Report post action - visible for logged-in users viewing other users' posts */}
                  {onReportPost &&
                    isAuth &&
                    !shouldShowDelete &&
                    item.authUserId !== profile?.id && (
                      <Button
                        className='justify-start w-full'
                        variant='light'
                        startContent={<RiFlagLine className='w-5 h-5' />}
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          onReportPost(item.id);
                        }}>
                        {t('post_card.menu.report', {
                          defaultValue: 'Report',
                        })}
                      </Button>
                    )}

                  {/* Block user action - visible for logged-in users viewing other users' posts */}
                  {onBlockUser &&
                    isAuth &&
                    !shouldShowDelete &&
                    item.authUserId !== profile?.id && (
                      <Button
                        className='justify-start w-full text-danger'
                        variant='light'
                        startContent={<RiUserForbidLine className='w-5 h-5' />}
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          onBlockUser(item.authUserId, item.user_name);
                        }}>
                        {isAuthorBlocked
                          ? t('post_card.menu.unblock_user', {
                              defaultValue: 'Unblock @{{name}}',
                              name: item.user_name,
                            })
                          : t('post_card.menu.block_user', {
                              defaultValue: 'Block @{{name}}',
                              name: item.user_name,
                            })}
                      </Button>
                    )}

                  {/* Tag Moderator actions */}
                  {(canPinForTag || canFeatureForTag || canHideForTag) &&
                    tagId && (
                      <>
                        {shouldShowDelete && <Divider className='my-2' />}
                        <p className='px-3 py-1 text-xs text-default-400'>
                          {t('post_card.menu.tag_moderator')}
                        </p>
                        {canPinForTag && onTagPin && (
                          <Button
                            className='justify-start w-full'
                            variant='light'
                            startContent={
                              isTagPinned ? (
                                <RiUnpinLine className='w-5 h-5 text-primary-500' />
                              ) : (
                                <RiPushpinLine className='w-5 h-5' />
                              )
                            }
                            isLoading={isTagPinning}
                            onPress={async () => {
                              setIsTagPinning(true);
                              try {
                                await onTagPin(
                                  item.id,
                                  tagId,
                                  isTagPinned ? 'unpin' : 'pin',
                                );
                              } catch (error) {
                                console.error('[Pin Tag] Error:', error);
                              } finally {
                                setIsTagPinning(false);
                                setIsDeleteModalOpen(false);
                              }
                            }}>
                            {isTagPinned
                              ? t('post_card.menu.unpin')
                              : t('post_card.menu.pin')}
                          </Button>
                        )}
                        {canFeatureForTag && onTagFeature && (
                          <Button
                            className='justify-start w-full'
                            variant='light'
                            startContent={
                              isTagFeatured ? (
                                <RiStarFill className='w-5 h-5 text-primary-500' />
                              ) : (
                                <RiStarLine className='w-5 h-5' />
                              )
                            }
                            isLoading={isTagFeaturing}
                            onPress={async () => {
                              setIsTagFeaturing(true);
                              try {
                                await onTagFeature(
                                  item.id,
                                  tagId,
                                  isTagFeatured ? 'unfeature' : 'feature',
                                );
                              } finally {
                                setIsTagFeaturing(false);
                                setIsDeleteModalOpen(false);
                              }
                            }}>
                            {isTagFeatured
                              ? t('post_card.menu.unfeature')
                              : t('post_card.menu.feature')}
                          </Button>
                        )}

                        {canHideForTag && onTagHide && (
                          <Button
                            className='justify-start w-full'
                            variant='light'
                            startContent={<RiEyeOffLine className='w-5 h-5' />}
                            isLoading={isTagHiding}
                            onPress={async () => {
                              setIsTagHiding(true);
                              try {
                                await onTagHide(
                                  item.id,
                                  tagId,
                                  isTagHidden ? 'unhide' : 'hide',
                                );
                              } finally {
                                setIsTagHiding(false);
                                setIsDeleteModalOpen(false);
                              }
                            }}>
                            {isTagHidden
                              ? t('post_card.menu.unhide')
                              : t('post_card.menu.hide')}
                          </Button>
                        )}
                      </>
                    )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <>
                      {(shouldShowDelete ||
                        ((canPinForTag || canFeatureForTag || canHideForTag) &&
                          tagId)) && <Divider className='my-2' />}
                      <p className='px-3 py-1 text-xs text-default-400'>
                        {t('post_card.menu.admin')}
                      </p>
                      {item.isPinned && handleUnpin && (
                        <Button
                          className='justify-start w-full'
                          variant='light'
                          startContent={<RiUnpinLine className='w-5 h-5' />}
                          onClick={() => {
                            setIsDeleteModalOpen(false);
                            setIsUnpinConfirmModalOpen?.(true);
                          }}>
                          {t('post_card.menu.unpin_global')}
                        </Button>
                      )}
                      {!item.isPinned && handlePin && (
                        <Button
                          className='justify-start w-full'
                          variant='light'
                          startContent={<RiPushpinLine className='w-5 h-5' />}
                          onClick={() => {
                            setIsDeleteModalOpen(false);
                            setIsPinConfirmModalOpen?.(true);
                          }}>
                          {t('post_card.menu.pin_global')}
                        </Button>
                      )}
                      <Button
                        className='justify-start w-full'
                        variant='light'
                        startContent={
                          isFeaturedPost() ? (
                            <RiStarFill className='w-5 h-5 text-yellow-500' />
                          ) : (
                            <RiStarLine className='w-5 h-5' />
                          )
                        }
                        isLoading={isFeaturing}
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          handleFeaturePost(!isFeaturedPost());
                        }}>
                        {isFeaturedPost()
                          ? t('post_card.menu.unfeature_global')
                          : t('post_card.menu.feature_global')}
                      </Button>
                      <Button
                        className='justify-start w-full'
                        variant='light'
                        startContent={
                          isNsfwPost() ? (
                            <RiAlertFill className='w-5 h-5 text-red-500' />
                          ) : (
                            <RiAlertLine className='w-5 h-5' />
                          )
                        }
                        isLoading={isNsfwToggling}
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          handleToggleNsfw();
                        }}>
                        {isNsfwPost()
                          ? t('post_card.menu.unmark_nsfw')
                          : t('post_card.menu.mark_nsfw')}
                      </Button>
                      <Button
                        className='justify-start w-full'
                        variant='light'
                        startContent={<RiTranslate className='w-5 h-5' />}
                        isLoading={isTranslating}
                        onClick={() => {
                          setIsDeleteModalOpen(false);
                          handleTranslate?.();
                        }}>
                        {t('post_card.menu.translate')}
                      </Button>
                      {onHidePost && (
                        <Button
                          className='justify-start w-full'
                          variant='light'
                          startContent={<RiEyeOffLine className='w-5 h-5' />}
                          isLoading={isHiding}
                          onClick={() => {
                            setIsHiding(true);
                            onHidePost(item.id).finally(() => {
                              setIsHiding(false);
                            });
                          }}>
                          {t('post_card.menu.hide')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  },
);

AuthorBar.displayName = 'AuthorBar';
