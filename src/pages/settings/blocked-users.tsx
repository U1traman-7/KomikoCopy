import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Avatar,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@nextui-org/react';
import { RiArrowLeftLine } from 'react-icons/ri';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Header } from '../../Components/Header';
import { Sidebar } from '../../Components/Sidebar';
import { useAtomValue, useSetAtom } from 'jotai';
import { authAtom } from '../../state';
import { blockedUserIdsAtom, type BlockedUserInfo } from '../../state/block';

export const dynamic = 'force-dynamic';

// 格式化日期
function formatBlockedDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlockedUsersPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);
  const setBlockedUserIds = useSetAtom(blockedUserIdsAtom);

  const [users, setUsers] = useState<BlockedUserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockTarget, setUnblockTarget] = useState<BlockedUserInfo | null>(
    null,
  );
  const [isUnblocking, setIsUnblocking] = useState(false);

  // 获取屏蔽列表
  const fetchBlockedList = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/blocked-list', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.code === 1 && data.data?.blockedUsers) {
        setUsers(data.data.blockedUsers);
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) {
      router.push('/');
      return;
    }
    fetchBlockedList();
  }, [isAuth, router, fetchBlockedList]);

  // 取消屏蔽
  const handleUnblock = async () => {
    if (!unblockTarget) {
      return;
    }

    setIsUnblocking(true);
    try {
      const response = await fetch('/api/user/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetUserId: unblockTarget.id,
          action: 'unblock',
        }),
      });

      const data = await response.json();

      if (data.code === 1) {
        // 从列表中移除
        setUsers(prev => prev.filter(u => u.id !== unblockTarget.id));
        // 更新全局状态
        setBlockedUserIds(prev => prev.filter(id => id !== unblockTarget.id));
        toast.success(`Unblocked @${unblockTarget.user_name}`);
      } else {
        toast.error(data.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    } finally {
      setIsUnblocking(false);
      setUnblockTarget(null);
    }
  };

  return (
    <main className='flex flex-col h-screen caffelabs text-foreground bg-background overflow-y-auto'>
      <Head>
        <title>Blocked Users | Komiko</title>
      </Head>
      <Header autoOpenLogin={false} />
      <div className='flex'>
        <Sidebar />
        <div className='md:px-2 md:pt-24 pt-16 w-full h-full lg:pl-[240px] md:ml-5'>
          <div className='container relative mx-auto w-full max-w-2xl flex-grow px-4 md:px-6'>
            {/* 标题栏 */}
            <div className='flex items-center gap-3 mb-6'>
              <Button isIconOnly variant='light' onPress={() => router.back()}>
                <RiArrowLeftLine className='w-5 h-5' />
              </Button>
              <h1 className='text-xl font-bold'>
                {t('settings.blockedUsersPage.title')}
              </h1>
            </div>

            {/* 加载状态 */}
            {isLoading && (
              <div className='flex justify-center items-center py-12'>
                <Spinner size='lg' />
              </div>
            )}

            {/* 空状态 */}
            {!isLoading && users.length === 0 && (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <p className='text-muted-foreground text-lg mb-2'>
                  {t('settings.blockedUsersPage.empty')}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {t('settings.blockedUsersPage.emptyDescription')}
                </p>
              </div>
            )}

            {/* 屏蔽用户列表 */}
            {!isLoading && users.length > 0 && (
              <div className='space-y-2'>
                {users.map(user => (
                  <div
                    key={user.id}
                    className='flex items-center justify-between p-4 rounded-xl border border-border bg-card'>
                    <div className='flex items-center gap-3'>
                      <Avatar
                        src={user.image}
                        name={user.user_name}
                        size='md'
                        className='cursor-pointer flex-shrink-0'
                        onClick={() => router.push(`/user/${user.user_uniqid}`)}
                      />
                      <div>
                        <span
                          role='button'
                          tabIndex={0}
                          className='font-medium cursor-pointer hover:underline'
                          onClick={() =>
                            router.push(`/user/${user.user_uniqid}`)
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              router.push(`/user/${user.user_uniqid}`);
                            }
                          }}>
                          @{user.user_name}
                        </span>
                        <p className='text-sm text-muted-foreground'>
                          {t('settings.blockedUsersPage.blockedOn', {
                            date: formatBlockedDate(user.blocked_at),
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='flat'
                      size='sm'
                      className='min-w-[80px]'
                      onPress={() => setUnblockTarget(user)}>
                      {t('settings.blockedUsersPage.buttonUnblock')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unblock Confirm Modal */}
      {unblockTarget && (
        <Modal isOpen onClose={() => setUnblockTarget(null)} placement='center'>
          <ModalContent>
            <ModalHeader>
              {t('settings.blockedUsersPage.unblockConfirmTitle', {
                name: unblockTarget.user_name,
              })}
            </ModalHeader>
            <ModalBody>
              <p className='text-sm text-default-600'>
                {t('settings.blockedUsersPage.unblockConfirmDescription')}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant='light' onPress={() => setUnblockTarget(null)}>
                {t('settings.blockedUsersPage.buttonCancel')}
              </Button>
              <Button
                color='primary'
                isLoading={isUnblocking}
                onPress={handleUnblock}>
                {t('settings.blockedUsersPage.buttonUnblock')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </main>
  );
}
