import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface CtaTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: number;
  onSuccess?: () => void;
  initialCtaTextTranslation?: Record<string, string> | null;
}

export const CtaTextModal: React.FC<CtaTextModalProps> = ({
  isOpen,
  onClose,
  tagId,
  onSuccess,
  initialCtaTextTranslation,
}) => {
  const { t } = useTranslation(['common', 'tags']);
  const [ctaText, setCtaText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ctaTextTranslation, setCtaTextTranslation] = useState<Record<
    string,
    string
  > | null>(initialCtaTextTranslation || null);

  const handleTranslateCtaText = async () => {
    if (!tagId || !ctaText.trim()) {
      toast.error('Please enter CTA text first');
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/tag/translate-cta-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          text: ctaText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to translate CTA text');
        return;
      }

      if (data.translations) {
        setCtaTextTranslation(data.translations);
        toast.success('CTA text translated successfully');
      }
    } catch (err) {
      toast.error('Failed to translate CTA text');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveCtaText = async () => {
    if (!tagId) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/tag/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          cta_text_translation: ctaTextTranslation,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(err.error || 'Failed to save CTA text');
        return;
      }

      toast.success('CTA text saved successfully');
      onClose();
      onSuccess?.();

      // Reset state after successful save
      setCtaText('');
      setCtaTextTranslation(null);
    } catch (error) {
      toast.error('Failed to save CTA text');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCtaText('');
    setCtaTextTranslation(initialCtaTextTranslation || null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size='lg'>
      <ModalContent>
        <ModalHeader>
          {t('common:edit_cta_text', {
            defaultValue: 'Edit CTA Button Text',
          })}
        </ModalHeader>
        <ModalBody>
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-default-700 mb-1 block'>
                {t('common:cta_button_text', {
                  defaultValue: 'Button Text (English)',
                })}
              </label>
              <p className='text-xs text-default-400 mb-2'>
                {t('common:cta_button_text_hint', {
                  defaultValue:
                    'Enter the text for the floating CTA button. It will be automatically translated to all supported languages.',
                })}
              </p>
              <div className='flex gap-2'>
                <Input
                  placeholder='Generate Art'
                  value={ctaText}
                  onValueChange={setCtaText}
                  className='flex-1'
                />
                <Button
                  color='primary'
                  variant='flat'
                  onPress={handleTranslateCtaText}
                  isLoading={isTranslating}
                  isDisabled={!ctaText.trim()}>
                  {t('common:translate', { defaultValue: 'Translate' })}
                </Button>
              </div>
            </div>

            {ctaTextTranslation && Object.keys(ctaTextTranslation).length > 0 && (
              <div className='p-3 bg-success-50 rounded-lg border border-success-200'>
                <p className='text-xs text-success-700 font-medium mb-2'>
                  {t('common:translation_preview', {
                    defaultValue: 'Translation Preview',
                  })}
                </p>
                <div className='space-y-1 max-h-40 overflow-y-auto'>
                  {Object.entries(ctaTextTranslation).map(([lang, text]) => (
                    <p key={lang} className='text-xs text-default-600'>
                      <span className='font-medium'>{lang}:</span> {text}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='light' onPress={handleClose}>
            {t('common:cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            color='primary'
            isLoading={isSaving}
            isDisabled={!ctaTextTranslation}
            onPress={handleSaveCtaText}>
            {t('common:save', { defaultValue: 'Save' })}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
