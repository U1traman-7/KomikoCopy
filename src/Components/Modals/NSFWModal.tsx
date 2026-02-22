import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@nextui-org/react';
import React, { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { modalsAtom, modalsPayloadAtom } from '../../state';
import { useTranslation } from 'react-i18next';

export default function NSFWModal() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const setModals = useSetAtom(modalsAtom);
  const payload = useAtomValue(modalsPayloadAtom);
  const { t } = useTranslation('common');

  useEffect(() => {
    setModals(modals => ({
      ...modals,
      nsfw: {
        onOpen,
        onClose,
      },
    }));
  }, [onOpen, onClose, setModals]);

  // 处理NSFW确认 - 公共存储逻辑
  const handleNSFWConfirm = (confirmed: boolean) => {
    onClose();

    if (confirmed) {
      document.cookie = 'relax_content=true; path=/';

      // 调用传入的回调函数，用于处理特定页面的逻辑（如加载列表）
      if (payload?.onConfirm) {
        payload.onConfirm();
      }
    }
    // 如果用户选择No，不做任何操作
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement='center'
      size='sm'>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <p className='text-lg font-semibold'>{t('nsfw.title')}</p>
        </ModalHeader>
        <ModalBody>
          <p className='text-center'>{t('nsfw.message')}</p>
        </ModalBody>
        <ModalFooter className='flex gap-2'>
          <Button
            variant='light'
            onPress={() => handleNSFWConfirm(false)}
            className='bg-danger text-primary-foreground'>
            {t('nsfw.no')}
          </Button>
          <Button color='primary' onPress={() => handleNSFWConfirm(true)}>
            {t('nsfw.yes')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
