import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Input,
  Chip,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { IconCheck, IconLoader2, IconAlertCircle } from '@tabler/icons-react';

interface ModeratorApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: number;
  tagName: string;
  onSuccess?: () => void;
}

interface ApplicationStatus {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  applied_role: string;
  created_at: string;
}

export const ModeratorApplyModal: React.FC<ModeratorApplyModalProps> = ({
  isOpen,
  onClose,
  tagId,
  tagName,
  onSuccess,
}) => {
  const { t } = useTranslation('tags');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] =
    useState<ApplicationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [preferredName, setPreferredName] = useState('');
  const [reason, setReason] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState({
    preferredName: '',
    contactInfo: '',
    reason: '',
  });

  // Validation helpers
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDiscord = (handle: string): boolean => {
    // Discord username format: username or username#discriminator
    // New format (no discriminator) or legacy format with 4 digits
    const discordRegex = /^.{2,32}(#\d{4})?$/;
    return discordRegex.test(handle);
  };

  const validateContactInfo = (contact: string): boolean => {
    return validateEmail(contact) || validateDiscord(contact);
  };

  // Real-time validation for contact info
  const contactInfoError = useMemo(() => {
    if (!contactInfo.trim()) return '';
    if (!validateContactInfo(contactInfo)) {
      return t('moderatorApplication.invalidContactInfo');
    }
    return '';
  }, [contactInfo, t]);

  // Character limits
  const REASON_MIN_LENGTH = 50;
  const REASON_MAX_LENGTH = 1000;
  const NAME_MAX_LENGTH = 50;

  const reasonCharCount = reason.length;
  const isReasonTooShort = reason.trim() && reasonCharCount < REASON_MIN_LENGTH;
  const isReasonTooLong = reasonCharCount > REASON_MAX_LENGTH;

  // Check for existing application when modal opens
  useEffect(() => {
    if (isOpen && tagId) {
      checkExistingApplication();
    }
  }, [isOpen, tagId]);

  const checkExistingApplication = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/api/tag/moderators?tagId=${tagId}&check=application`);
      const data = await response.json();
      if (data.application) {
        setExistingApplication(data.application);
      } else {
        setExistingApplication(null);
      }
    } catch (err) {
      console.error('Error checking application status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setFieldErrors({ preferredName: '', contactInfo: '', reason: '' });

    // Comprehensive validation
    const errors = {
      preferredName: '',
      contactInfo: '',
      reason: '',
    };

    if (!preferredName.trim()) {
      errors.preferredName = t('moderatorApplication.preferredNameRequired');
    } else if (preferredName.length > NAME_MAX_LENGTH) {
      errors.preferredName = t('moderatorApplication.preferredNameTooLong');
    }

    if (!contactInfo.trim()) {
      errors.contactInfo = t('moderatorApplication.contactInfoRequired');
    } else if (!validateContactInfo(contactInfo)) {
      errors.contactInfo = t('moderatorApplication.invalidContactInfo');
    }

    if (!reason.trim()) {
      errors.reason = t('moderatorApplication.reasonRequired');
    } else if (reasonCharCount < REASON_MIN_LENGTH) {
      errors.reason = t('moderatorApplication.reasonTooShort');
    } else if (reasonCharCount > REASON_MAX_LENGTH) {
      errors.reason = t('moderatorApplication.reasonTooLong');
    }

    // Check if there are any errors
    if (errors.preferredName || errors.contactInfo || errors.reason) {
      setFieldErrors(errors);
      setIsLoading(false);
      setError(t('moderatorApplication.applicationValidationFailed'));
      return;
    }

    try {
      const response = await fetch('/api/tag/moderators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          tagId,
          preferredName,
          reason,
          contactInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to submit application');
        return;
      }

      setSuccess(true);
      onSuccess?.();

      // Close modal after showing success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setPreferredName('');
        setReason('');
        setContactInfo('');
      }, 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      setSuccess(false);
      setPreferredName('');
      setReason('');
      setContactInfo('');
      setFieldErrors({ preferredName: '', contactInfo: '', reason: '' });
      onClose();
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'warning' as const,
        label: t('moderatorApplication.pending'),
      },
      approved: {
        color: 'success' as const,
        label: t('moderatorApplication.approved'),
      },
      rejected: {
        color: 'danger' as const,
        label: t('moderatorApplication.rejected'),
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Chip color={config.color} size='sm'>
        {config.label}
      </Chip>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size='lg'>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <span>{t('moderatorApplication.title')}</span>
          <Chip
            color='primary'
            variant='flat'
            size='sm'
            className='font-medium text-sm'>
            #{tagName}
          </Chip>
        </ModalHeader>
        <ModalBody>
          {isCheckingStatus ? (
            <div className='flex justify-center py-4'>
              <IconLoader2 className='w-8 h-8 animate-spin text-primary' />
            </div>
          ) : existingApplication ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-default-600'>
                  {t('moderatorApplication.status')}:
                </span>
                {renderStatusBadge(existingApplication.status)}
              </div>
              <p className='text-default-500 text-sm'>
                {existingApplication.status === 'pending'
                  ? t('moderatorApplication.pendingMessage')
                  : existingApplication.status === 'approved'
                    ? t('moderatorApplication.approvedMessage')
                    : t('moderatorApplication.rejectedMessage')}
              </p>
            </div>
          ) : success ? (
            <div className='flex flex-col items-center justify-center py-8 gap-4'>
              <div className='w-16 h-16 rounded-full bg-success-100 flex items-center justify-center'>
                <IconCheck className='w-8 h-8 text-success' />
              </div>
              <p className='text-success text-center'>
                {t('moderatorApplication.submitted')}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {error && (
                <div className='p-3 rounded-lg bg-danger-50 text-danger text-sm flex items-start gap-2'>
                  <IconAlertCircle className='w-5 h-5 flex-shrink-0 mt-0.5' />
                  <span>{error}</span>
                </div>
              )}

              {/* Intro copy */}
              <div className='space-y-2 text-xs text-default-500'>
                <p>{t('moderatorApplication.introTitle')}</p>
                <div className='space-y-1'>
                  <p className='font-semibold text-default-700'>
                    {t('moderatorApplication.benefitsTitle')}
                  </p>
                  <ul className='list-disc list-inside space-y-0 ml-1 leading-tight'>
                    <li>{t('moderatorApplication.benefit1')}</li>
                    <li>{t('moderatorApplication.benefit2')}</li>
                  </ul>
                </div>
                <p>{t('moderatorApplication.process')}</p>
              </div>

              {/* Q1: How should we address you? */}
              <Input
                label={t('moderatorApplication.preferredName')}
                placeholder={t('moderatorApplication.preferredNamePlaceholder')}
                value={preferredName}
                onValueChange={value => {
                  setPreferredName(value);
                  if (fieldErrors.preferredName) {
                    setFieldErrors({ ...fieldErrors, preferredName: '' });
                  }
                }}
                isInvalid={!!fieldErrors.preferredName}
                errorMessage={fieldErrors.preferredName}
                maxLength={NAME_MAX_LENGTH}
                description={
                  preferredName
                    ? `${preferredName.length}/${NAME_MAX_LENGTH}`
                    : ''
                }
                isRequired
              />

              {/* Q3: Contact */}
              <Input
                label={t('moderatorApplication.contact')}
                placeholder={t('moderatorApplication.contactPlaceholder')}
                value={contactInfo}
                onValueChange={value => {
                  setContactInfo(value);
                  if (fieldErrors.contactInfo) {
                    setFieldErrors({ ...fieldErrors, contactInfo: '' });
                  }
                }}
                isInvalid={!!fieldErrors.contactInfo || !!contactInfoError}
                errorMessage={fieldErrors.contactInfo || contactInfoError}
                type='text'
                autoComplete='email'
                isRequired
              />

              {/* Q4: Why should we choose you? */}
              <Textarea
                label={t('moderatorApplication.reason')}
                placeholder={t('moderatorApplication.reasonPlaceholder')}
                value={reason}
                onValueChange={value => {
                  if (value.length <= REASON_MAX_LENGTH) {
                    setReason(value);
                  }
                  if (fieldErrors.reason) {
                    setFieldErrors({ ...fieldErrors, reason: '' });
                  }
                }}
                isInvalid={!!fieldErrors.reason || !!isReasonTooShort}
                errorMessage={fieldErrors.reason}
                description={
                  <div className='space-y-1'>
                    {reasonCharCount < REASON_MIN_LENGTH && reason.trim() && (
                      <div className='text-xs text-warning'>
                        {t('moderatorApplication.reasonMinLength')}
                      </div>
                    )}
                    <div className='flex justify-end'>
                      <span
                        className={`text-xs ${
                          isReasonTooLong
                            ? 'text-danger'
                            : reasonCharCount > REASON_MAX_LENGTH * 0.9
                              ? 'text-warning'
                              : 'text-default-400'
                        }`}>
                        {reasonCharCount}/{REASON_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                }
                minRows={4}
                maxRows={8}
                isRequired
              />

              <p className='text-xs text-default-400 mt-2'>
                {t('moderatorApplication.note')}
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {!success && !existingApplication && (
            <>
              <Button
                variant='light'
                onPress={handleClose}
                isDisabled={isLoading}>
                {t('cancel')}
              </Button>
              <Button
                color='primary'
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={
                  !preferredName.trim() ||
                  !contactInfo.trim() ||
                  !reason.trim() ||
                  !!contactInfoError ||
                  isReasonTooShort ||
                  isReasonTooLong ||
                  isLoading
                }>
                {t('moderatorApplication.submitApplication')}
              </Button>
            </>
          )}
          {(success || existingApplication) && (
            <Button color='primary' variant='light' onPress={handleClose}>
              {t('moderatorApplication.close')}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModeratorApplyModal;
