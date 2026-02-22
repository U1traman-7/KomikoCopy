import {
  Modal,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';
import { PricingComp, PricingFAQ } from '../../pages/pricing';
import React, { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { modalsAtom, modalsPayloadAtom, profileAtom } from '../../state';
import { TestimonialsSection } from '../Landing/TestimonialsSection';
import { trackPricingModalViewed } from '../../utilities/analytics';

export default function PricingModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const setModals = useSetAtom(modalsAtom);
  const profile = useAtomValue(profileAtom);
  const payload = useAtomValue(modalsPayloadAtom);

  useEffect(() => {
    setModals(modals => ({
      ...modals,
      pricing: {
        onOpen,
        onClose,
      },
    }));
  }, [onOpen, onClose]);

  // 追踪查看定价
  useEffect(() => {
    if (isOpen && profile?.id) {
      if (payload?.trackingContext) {
        trackPricingModalViewed(
          profile.id,
          payload.trackingContext.source || 'manual',
          payload.trackingContext.triggerTool,
        );
      } else {
        trackPricingModalViewed(profile.id, 'manual');
      }
    }
  }, [isOpen, profile?.id, payload]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement='bottom'
      className='sm:!m-auto md:!m-auto'
      classNames={{ wrapper: 'z-[100001]', backdrop: 'z-[100001]' }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: 'easeOut',
            },
          },
          exit: {
            y: 20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: 'easeIn',
            },
          },
        },
      }}>
      <ModalContent className='mx-2 sm:max-w-[80vw] max-h-[80vh] min-h-[420px] overflow-y-auto pb-10 sm:mx-auto'>
        <PricingComp className='!pt-[40px] !bg-card !min-h-[auto]' />
        <TestimonialsSection theme='light' />
        <PricingFAQ />
      </ModalContent>
    </Modal>
  );
}
