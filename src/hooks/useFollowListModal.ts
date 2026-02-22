import { useAtomValue } from 'jotai';
import { modalsAtom } from '../state';

export const useFollowListModal = () => {
  const modals = useAtomValue(modalsAtom);
  
  const openFollowListModal = (props?: { 
    userId?: string; 
    initialTab?: 'followers' | 'following';
    followersCount?: number;
    followingCount?: number;
  }) => {
    modals?.followList?.onOpen?.(props);
  };

  const closeFollowListModal = () => {
    modals?.followList?.onClose?.();
  };

  return {
    openFollowListModal,
    closeFollowListModal,
  };
};
