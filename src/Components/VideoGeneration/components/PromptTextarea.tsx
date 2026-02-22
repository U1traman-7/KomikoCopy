import type { ChangeEvent } from 'react';
import { memo } from 'react';
import { FaMagic } from 'react-icons/fa';
import { Button } from '@nextui-org/react';
import { Textarea } from '@nextui-org/react';

interface PromptTextareaProps {
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  magicPromptLoading: boolean;
  onMagicPrompt: () => void;
  t: any;
}

export const PromptTextarea = memo(
  ({
    maxLength,
    value,
    onChange,
    onKeyDown,
    placeholder,
    textareaRef,
    magicPromptLoading,
    onMagicPrompt,
    t,
  }: PromptTextareaProps) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if ((e.nativeEvent as InputEvent).isComposing) {
        onChange(e.target.value);
        return;
      }
      onChange(e.target.value);
    };

    const isOverLimit =
      typeof maxLength === 'number' &&
      maxLength > 0 &&
      value.length > maxLength;

    return (
      <div className='relative'>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className='p-2 pt-0 pb-10 w-full bg-transparent border-0 text-foreground placeholder-muted-foreground resize-none focus:outline-none'
          classNames={{
            input:
              'text-xs resize-y dark:!bg-transparent dark:!text-foreground',
            base: 'bg-transparent',
            // dark mode: content2 层级（#374151），比 Card 背景 content1（#1f2937）稍亮，创造层次感
            inputWrapper: 'rounded-md dark:!bg-input',
          }}
          onClear={() => onChange('')}
          disableAutosize
          rows={4}
          isClearable
          size='lg'
          isInvalid={isOverLimit}
          errorMessage={
            isOverLimit
              ? `Prompt is too long (${value.length}/${maxLength} characters)`
              : undefined
          }
        />
        {typeof maxLength === 'number' && maxLength > 0 && (
          <div
            className={`absolute bottom-[36px] right-2 text-xs ${
              isOverLimit ? 'text-red-500' : 'text-muted-foreground'
            }`}>
            {value.length}/{maxLength}
          </div>
        )}
        <Button
          color='primary'
          size='sm'
          onPress={onMagicPrompt}
          className='absolute bottom-[4px] -right-[4px] text-xs scale-80'
          isDisabled={!value}
          isLoading={magicPromptLoading}>
          <FaMagic className='w-4 h-4 flex-0' />
          {t('common:magic_prompt')}
        </Button>
      </div>
    );
  },
);

PromptTextarea.displayName = 'PromptTextarea';
