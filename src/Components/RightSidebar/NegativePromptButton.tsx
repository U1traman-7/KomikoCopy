import React, { useState, memo, useCallback, useMemo } from 'react';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Textarea,
} from '@nextui-org/react';
import { PiProhibit, PiXCircle } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';

interface NegativePromptButtonProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  className?: string;
  isButtonInRow?: boolean;
}

const NegativePromptButton: React.FC<NegativePromptButtonProps> = ({
  value,
  onChange,
  maxLength = 500,
  className,
  isButtonInRow = false,
}) => {
  const { t } = useTranslation('create');
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleOpen = useCallback((open: boolean) => {
    if (open) {
      setLocalValue(value);
    }
    setIsOpen(open);
  }, [value]);

  const handleConfirm = useCallback(() => {
    onChange(localValue);
    setIsOpen(false);
  }, [localValue, onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setLocalValue('');
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const displayText = useMemo(() => {
    if (!value) return null;
    return value.length > 15
      ? `${value.substring(0, 15)}...`
      : value;
  }, [value]);

  const placeholderText = useMemo(() =>
    t('negative_prompt_placeholder', 'e.g., blurry, low quality, watermark, text...'),
  [t]);

  const descriptionText = useMemo(() =>
    t('negative_prompt_description', 'Describe what you don\'t want to see in the generated image.'),
  [t]);

  const negativePromptTitle = useMemo(() =>
    t('negative_prompt', 'Negative Prompt'),
  [t]);

  const cancelText = useMemo(() =>
    t('common:cancel', 'Cancel'),
  [t]);

  const confirmText = useMemo(() =>
    t('common:confirm', 'Confirm'),
  [t]);

  const buttonText = useMemo(() =>
    t('negative_prompt', 'Negative'),
  [t]);

  return (
    <Popover
      placement='bottom-start'
      offset={12}
      isOpen={isOpen}
      onOpenChange={handleOpen}>
      <PopoverTrigger>
        <Button
          variant='light'
          size='sm'
          className={cn('p-0 px-1 min-w-[70px]', className, {
            'bg-default/40': value.length > 0,
            'flex-1': isButtonInRow,
          })}
          startContent={
            <PiProhibit className='w-4 h-4 text-muted-foreground min-w-4' />
          }>
          <div className='flex items-center gap-1 truncate text-foreground'>
            <div className='truncate'>
              {displayText || buttonText}
            </div>
          </div>
          {value.length > 0 && (
            <PiXCircle
              className='w-4 h-4 cursor-pointer'
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='!p-4 rounded-xl w-[320px] outline-[0.5px] outline-border bg-card'>
        <div className='w-full'>
          <div className='flex justify-between items-center mb-3'>
            <h4 className='font-semibold text-foreground'>
              {negativePromptTitle}
            </h4>
            <span className='text-xs text-muted-foreground'>
              {localValue.length}/{maxLength}
            </span>
          </div>
          <p className='text-sm text-muted-foreground mb-3'>
            {descriptionText}
          </p>
          <Textarea
            value={localValue}
            onChange={handleInputChange}
            placeholder={placeholderText}
            maxLength={maxLength}
            minRows={3}
            maxRows={5}
            className='mb-3'
            classNames={{
              input: 'text-sm',
              inputWrapper: 'rounded-lg',
            }}
          />
          <div className='flex justify-end gap-2'>
            <Button
              variant='flat'
              size='sm'
              onPress={handleCancel}>
              {cancelText}
            </Button>
            <Button
              color='primary'
              size='sm'
              onPress={handleConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default memo(NegativePromptButton);
