import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@nextui-org/react";
import { Plan } from "../../api/pricing";
import Plans from "./Plans";


const usePricingModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  function PricingModal({
    title,
    profile,
    billingCycle,
  }: {
    title?: string;
    profile?: { plan: Plan | string } | null;
    billingCycle?: 'monthly' | 'annual';
  }) {
    return (
      <>
        <Modal isOpen={isOpen} onOpenChange={onClose}>
          <ModalContent>
            <ModalHeader>
              <p>{title || 'Plans'}</p>
            </ModalHeader>
            <ModalBody className='overflow-y-auto pb-4 h-full md:overflow-y-none'>
              <Plans profile={profile} billingCycle={billingCycle} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return {
    PricingModal,
    isOpen,
    onOpen,
    onClose,
  }
}

export default usePricingModal;
