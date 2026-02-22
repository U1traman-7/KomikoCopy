import React, { memo, useState } from 'react';
import { Button } from '@nextui-org/react';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { authAtom } from 'state';
import { useIndexedDB } from 'hooks/useIndexedDB';
import { IoLogOutOutline } from 'react-icons/io5';

const LogoutButton = memo(({ className }: { className?: string }) => {
  const { t } = useTranslation('common');
  const db = useIndexedDB();

  const [isAuth] = useAtom(authAtom);
  const [isLoading, setIsLoading] = useState(false);
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // 清除 IndexedDB 中的 state 数据
      if (db) {
        await db.clear('state');
      }

      // 清除 localStorage 中的 komiko_recent_characters 数据
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('komiko_recent_characters')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      const response = await fetch('/api/logout');
      const data = await response.json();
      // console.log(data);
      if (data.code === 1) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  if (!isAuth) {
    return null;
  }

  return (
    <Button
      variant='light'
      isLoading={isLoading}
      className={`text-red-500 h-10 ${className}`}
      startContent={<IoLogOutOutline className='w-5 h-5' />}
      onClick={handleLogout}>
      {t('logout')}
    </Button>
  );
});

export default LogoutButton;
