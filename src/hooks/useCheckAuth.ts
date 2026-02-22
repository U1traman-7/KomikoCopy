import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { authAtom, checkedAuthAtom } from '../state';

export const useCheckAuth = (
  hasNoAuthAction?: () => void,
  hasAuthAction?: () => void,
) => {
  const setIsAuth = useSetAtom(authAtom);
  const setCheckedAuth = useSetAtom(checkedAuthAtom);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/is_auth');
      const data = await response.json();
      if (data.is_auth === false) {
        if (hasNoAuthAction) {
          hasNoAuthAction();
        }
        setIsAuth(false);
        return false;
      }
      if (hasAuthAction) {
        hasAuthAction();
      }
      setIsAuth(true);
      return true;
    } catch (error) {
      console.error('Failed to check authentication:', error);
      setIsAuth(false);
      return false;
    } finally {
      setCheckedAuth(true);
    }
  };
  return checkAuth;
};
