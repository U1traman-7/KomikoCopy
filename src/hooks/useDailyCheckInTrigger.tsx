import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { authAtom, modalsAtom, profileAtom, promotionDataAtom } from '../state';
import { dailyCheckInStatus } from '@/api/profile';

export const useDailyCheckInTrigger = () => {
  const modals = useAtomValue(modalsAtom);
  const isAuth = useAtomValue(authAtom);
  const profile = useAtomValue(profileAtom);
  const promotionData = useAtomValue(promotionDataAtom);

  useEffect(() => {
    if (
      !modals.dailyCheckIn ||
      !isAuth ||
      !profile?.id ||
      !promotionData.loaded
    ) {
      return;
    }

    const checkAndShowModal = () => {
      const today = new Date().toISOString().split('T')[0];
      const lastCheckInDate = localStorage.getItem('lastCheckInDate');

      if (lastCheckInDate !== today) {
        dailyCheckInStatus()
          .then(res => {
            if (res?.data?.date_checkin !== today) {
              modals.dailyCheckIn?.onOpen();
            } else {
              localStorage.setItem('lastCheckInDate', today);
            }
          })
          .catch(() => {
            modals.dailyCheckIn?.onOpen();
          });
      }
    };

    const timer = setTimeout(() => {
      checkAndShowModal();
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndShowModal();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [modals.dailyCheckIn, isAuth, profile?.id, promotionData.loaded]);
};
