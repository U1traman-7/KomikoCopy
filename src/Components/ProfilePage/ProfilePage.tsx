/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Tabs, Tab, useDisclosure } from '@nextui-org/react';
import { useRouter } from 'next/router';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
} from '@nextui-org/react';
import { FaCloudUploadAlt, FaTheaterMasks } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  MdOutlineCollections,
  MdPhotoLibrary,
  MdVideoCameraBack,
} from 'react-icons/md';
import { IoMdHeart } from 'react-icons/io';

// import SpecificFeed from './SpecificFeed';
import { authAtom, profileAtom, updateFollowCountsAtom } from '../../state';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import ProfileGallery from './ProfileGallery';
import ProfileVideos from './ProfileVideos';
import UserInfoCard from './UserInfoCard';
import { Feed } from '../Feed';
import { toastError } from '@/utils/index';
import { ProfileCharactersTab } from './ProfileCharactersTab';
import { LikedFeed } from './LikedFeed';
import { CreditBar } from './CreditBar';
import { ProfileModTab } from './ProfileModTab';
import { FaUserShield } from 'react-icons/fa';
import { ERROR_CODES } from '../../../api/_constants';

const uploadImage = async (
  file: File,
  t: (key: string) => string,
): Promise<string | null> => {
  const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB size limit (adjust as needed)

  if (file.size > maxSizeInBytes) {
    console.error('File size exceeds the maximum limit of 2 MB.');
    toast.error('File size exceeds maximum limit of 2MB.');
    return null;
  }

  const form = new FormData();
  const imagePath = `app_media/${uuidv4()}.jpg`;
  form.append('file', file);
  form.append('imagePath', imagePath);
  form.append('width', '300');
  form.append('height', '300');
  form.append('moderate', '1');

  try {
    const response = await fetch('/api/uploadImage', {
      method: 'POST',
      body: form,
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result) {
      toast.error(t('toast:common.uploadFailed'));
      return null;
    }

    if (result.code !== 1) {
      let errorMessage: string | undefined;
      if (
        result?.error_code === ERROR_CODES.PROFILE_MODERATION_FAILED &&
        typeof result?.data?.field === 'string'
      ) {
        const field = String(result.data.field);
        const reason =
          typeof result?.data?.reason === 'string' && result.data.reason.trim()
            ? String(result.data.reason).trim()
            : 'inappropriate_content';

        const candidateKeys = [
          `moderation.${field}.${reason}`,
          `moderation.${field}.inappropriate_content`,
          `moderation.reason.${reason}`,
          `moderation.reason.inappropriate_content`,
          `moderation.generic`,
        ];

        for (const key of candidateKeys) {
          const translated = t(key);
          if (translated !== key) {
            errorMessage = translated;
            break;
          }
        }

        if (!errorMessage) {
          const generic = t('moderation.generic');
          errorMessage =
            generic !== 'moderation.generic' ? generic : t('toast:common.uploadFailed');
        }
      } else {
        errorMessage = result?.error || t('toast:common.uploadFailed');
      }

      toast.error(errorMessage);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error(t('toast:common.uploadFailed'));
    return null;
  }
};

export default function ProfilePage() {
  const { t } = useTranslation('profile');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  // 添加删除账户相关的状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 添加头像上传加载状态
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const updateFollowCounts = useSetAtom(updateFollowCountsAtom);
  const [hasModTags, setHasModTags] = useState(false);

  //! FETCH PROFILE
  useEffect(() => {
    // const fetchProfile = async () => {
    //   try {
    //     console.log(
    //       'useEffect fetchProfile API 被调用',
    //       new Date().toISOString(),
    //     ); // 在终端打印调用时间
    //     const response = await fetch('/api/fetchProfile', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ method: 'profile' }),
    //     });
    //     console.log('calling fetch profile');

    //     const data = await response.json();
    //     console.log('data success', data);
    //     // setProfile({ ...data, authUserId: data.id });
    //     // setUsername(data.user_name);
    //     // setBio(data.user_desc);
    //   } catch (error) {
    //     console.error('Error fetching profile:', error);
    //   }
    // };

    // isAuth && fetchProfile();
    if (isAuth) {
      setUsername(profile.user_name);
      setBio(profile.user_desc);

      if (
        profile.num_followers !== undefined &&
        profile.num_following !== undefined
      ) {
        updateFollowCounts({
          followers: profile.num_followers,
          following: profile.num_following,
        });
      }
    }
  }, [isAuth, profile, setProfile, updateFollowCounts]);

  // Check if user has mod tags
  useEffect(() => {
    const checkModTags = async () => {
      if (!profile.authUserId) return;

      try {
        const response = await fetch(
          `/api/tag/moderated?userId=${profile.authUserId}`,
        );
        const data = await response.json();
        setHasModTags(data.tags && data.tags.length > 0);
      } catch (error) {
        console.error('Error checking mod tags:', error);
      }
    };

    if (isAuth && profile.authUserId) {
      checkModTags();
    }
  }, [isAuth, profile.authUserId]);

  //! HANDLE MODAL
  const handleOpen = () => {
    onOpen();
  };

  const handleClose = () => {
    onClose();
  };

  //! HANDLE EDIT
  const handleUsernameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setUsername(event.target.value);
    // setProfile((prevProfile) => ({
    //     ...prevProfile,
    //     user_name: event.target.value,
    // }));
  };

  const handleBioChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    // setProfile((prevProfile) => ({
    //     ...prevProfile,
    //     user_desc: event.target.value,
    // }));
    setBio(event.target.value);
  };

  let canCall = true;
  const handleEditProfile = async () => {
    if (!canCall) {
      return;
    }

    if (!username.trim()) {
      return;
    }

    canCall = false;

    setTimeout(() => {
      canCall = true;
    }, 10000);

    try {
      // Make API call to update the profile on the server
      const response = await fetch(`/api/fetchProfile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'edit-profile',
          authUserId: profile.authUserId,
          new_username: username,
          new_bio: bio,
          new_image: profile.image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        let errorMessage: string | undefined;
        if (
          errorData?.error_code === ERROR_CODES.PROFILE_MODERATION_FAILED &&
          typeof errorData?.field === 'string'
        ) {
          const field = String(errorData.field);
          const reason =
            typeof errorData?.reason === 'string' && errorData.reason.trim()
              ? String(errorData.reason).trim()
              : 'inappropriate_content';

          const candidateKeys = [
            `moderation.${field}.${reason}`,
            `moderation.${field}.inappropriate_content`,
            `moderation.reason.${reason}`,
            `moderation.reason.inappropriate_content`,
            `moderation.generic`,
          ];

          for (const key of candidateKeys) {
            const translated = t(key);
            if (translated !== key) {
              errorMessage = translated;
              break;
            }
          }

          if (!errorMessage) {
            const generic = t('moderation.generic');
            errorMessage =
              generic !== 'moderation.generic'
                ? generic
                : 'Failed to update profile';
          }
        } else {
          errorMessage =
            errorData?.error || t('moderation.generic') || 'Failed to update profile';
          if (errorMessage === 'moderation.generic') {
            errorMessage = 'Failed to update profile';
          }
        }

        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await response.json();

      // Update the profile state with the new data
      setProfile(prevProfile => ({
        ...prevProfile,
        user_name: username,
        user_desc: bio,
      }));

      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error already shown via toast in the if block above
    }
  };

  //! Handle upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      toast.loading('Reviewing your image...', { id: 'avatar-upload' });

      try {
        const imageUrl = await uploadImage(file, t);

        if (imageUrl) {
          setProfile(prevProfile => ({
            ...prevProfile,
            image: imageUrl as string,
          }));
          toast.success('Avatar updated successfully!', { id: 'avatar-upload' });
        } else {
          toast.dismiss('avatar-upload');
        }
      } catch (error) {
        console.error('Error in handleFileChange:', error);
        toast.error('Failed to upload avatar', { id: 'avatar-upload' });
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/deleteAccount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        toastError(t('toast:common.deleteAccountFailed'));
        return;
      }
      const data = await response.json();
      if (data.code !== 1) {
        toastError(t('toast:common.deleteAccountFailed'));
        return;
      }

      await fetch('/api/logout');

      // 刷新页面
      window.location.reload();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div className='flex flex-col gap-4 container relative mx-auto w-full max-w-6xl flex-grow px-2 md:px-6'>
      {/* 用户信息卡片 */}
      <UserInfoCard
        profile={profile as any}
        onEditClick={handleOpen}
        onDeleteAccount={() => setIsDeleteModalOpen(true)}
        isOwnProfile={true}
      />

      {/* 积分条 */}
      {profile.authUserId !== '' && (
        <CreditBar
          profile={profile}
          setProfile={setProfile}
          showAmbassadorSection={true}
        />
      )}

      {/* POP UP MODAL */}
      <Modal size='lg' placement='center' isOpen={isOpen} onClose={handleClose}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader>
                <p>{t('editProfile')}</p>
              </ModalHeader>
              <ModalBody className='overflow-y-auto h-full md:overflow-y-none'>
                <div
                  className='relative w-24 h-24 cursor-pointer md:w-28 md:h-28 lg:w-28 lg:h-28'
                  onClick={handleImageUpload}>
                  <img
                    className='object-cover w-full h-full rounded-full'
                    src={profile.image}
                    alt={profile.user_name}
                  />
                  <div className='flex absolute inset-0 justify-center items-center bg-black bg-opacity-50 rounded-full'>
                    <FaCloudUploadAlt
                      className='text-white'
                      style={{ height: '2rem', width: '2rem' }}
                    />
                  </div>
                </div>
                <input
                  type='file'
                  accept='image/*'
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Input
                  type='username'
                  variant={'flat'}
                  label={t('username')}
                  value={username}
                  onChange={handleUsernameChange}
                  size='lg'
                  className='max-w-s'
                />
                <Textarea
                  label={t('bio')}
                  className='flex text-lg rounded-full'
                  radius='full'
                  variant='flat'
                  placeholder={t('joinDiscussion')}
                  size='lg'
                  minRows={2}
                  maxRows={4}
                  style={{ resize: 'none' }}
                  classNames={{
                    base: 'max-w-s',
                    input: 'resize-y',
                  }}
                  value={bio}
                  onChange={handleBioChange}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => handleEditProfile()}
                  radius='full'
                  className='text-primary-foreground bg-gradient-to-tr from-sky-400 to-purple-300 shadow-lg'>
                  {t('save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        size='md'
        placement='center'
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader>
                <p className='text-danger font-semibold'>
                  {t('deleteAccount')}
                </p>
              </ModalHeader>
              <ModalBody>
                <p className='text-foreground'>{t('deleteAccountMessage')}</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant='light'
                  onClick={handleCancelDelete}
                  radius='full'
                  className='bg-primary text-primary-foreground data-[hover=true]:bg-primary/50'>
                  {t('no')}
                </Button>
                <Button
                  variant='light'
                  onClick={handleConfirmDelete}
                  radius='full'
                  className='bg-card text-danger border-danger'
                  disabled={isDeleting}>
                  {isDeleting ? t('deleting') : t('yes')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* PERSONAL FEED */}
      <div>
        <Tabs
          aria-label='Options'
          color='primary'
          variant='underlined'
          classNames={{
            base: 'w-full overflow-x-auto',
            tabList:
              'gap-3 md:gap-6 w-full relative rounded-none p-0 border-b border-divider min-w-max text-xs md:text-base',
            cursor: 'w-full bg-primary',
            tab: 'max-w-fit px-0 h-12',
            tabContent: 'group-data-[selected=true]:text-primary',
            panel: 'px-0 pt-2',
          }}>
          <Tab
            key='posts'
            title={
              <div className='flex gap-2 items-center'>
                <MdOutlineCollections className='text-xl' />
                <span>{t('posts')}</span>
              </div>
            }>
            <Card className='border-none shadow-none min-h-0 bg-transparent'>
              {/* <SpecificFeed showMore /> */}
              <Feed simple type='profile' prerenderedPosts={false} />
            </Card>
          </Tab>
          <Tab
            key='characters'
            title={
              <div className='flex gap-2 items-center'>
                <FaTheaterMasks className='text-xl' />
                <span>{t('characters')}</span>
              </div>
            }>
            <Card className='border-none shadow-none min-h-0 bg-transparent'>
              <ProfileCharactersTab />
            </Card>
          </Tab>
          <Tab
            key='images'
            title={
              <div className='flex gap-2 items-center'>
                <MdPhotoLibrary className='text-xl' />
                <span>{t('images')}</span>
              </div>
            }>
            <Card className='border-none shadow-none min-h-0 bg-transparent'>
              <ProfileGallery />
            </Card>
          </Tab>
          <Tab
            key='videos'
            title={
              <div className='flex gap-2 items-center'>
                <MdVideoCameraBack className='text-xl' />
                <span>{t('videos')}</span>
              </div>
            }>
            <Card className='border-none shadow-none min-h-0 bg-transparent'>
              <ProfileVideos />
            </Card>
          </Tab>
          <Tab
            key='liked'
            title={
              <div className='flex gap-2 items-center'>
                <IoMdHeart className='text-xl' />
                <span>{t('liked')}</span>
              </div>
            }>
            <Card className='border-none shadow-none min-h-0 bg-transparent'>
              <LikedFeed />
            </Card>
          </Tab>
          {hasModTags && (
            <Tab
              key='mod'
              title={
                <div className='flex gap-2 items-center'>
                  <FaUserShield className='text-xl' />
                  <span>{t('mod')}</span>
                </div>
              }>
              <Card className='border-none shadow-none min-h-0 bg-transparent'>
                <ProfileModTab userId={profile.authUserId} />
              </Card>
            </Tab>
          )}
        </Tabs>
      </div>
    </div>
  );
}
