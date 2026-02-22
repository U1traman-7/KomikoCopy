import { Modal, ModalContent, Button } from '@nextui-org/react'
import { useTranslation } from 'react-i18next'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onOpenChange: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  isDeleting,
}) => {
  const { t } = useTranslation('character')

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement='center'>
      <ModalContent>
        {onClose => (
          <>
            <div className='p-5'>
              <h3 className='mb-2 text-xl font-bold'>
                {t('deleteConfirmation')}
              </h3>
              <p className='mb-6 text-foreground'>
                {t('deleteConfirmationText')}
              </p>

              <div className='flex gap-3 justify-end'>
                <Button color='default' variant='light' onPress={onClose}>
                  {t('cancel')}
                </Button>
                <Button
                  color='danger'
                  isLoading={isDeleting}
                  isDisabled={isDeleting}
                  onPress={() => {
                    onConfirm()
                    onClose()
                  }}>
                  {t('delete')}
                </Button>
              </div>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  )
} 