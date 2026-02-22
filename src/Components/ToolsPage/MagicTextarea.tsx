import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@nextui-org/react';
import { FaMagic } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
const MagicTextarea = ({
  onChange,
  initialPrompt,
  placeholder,
}: {
  onChange?: (prompt: string) => void;
  initialPrompt?: string;
  placeholder?: string;
}) => {
  const { t } = useTranslation('image-animation-generator');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [magicPromptLoading, setMagicPromptLoading] = useState(false);
  placeholder = placeholder || t('ui.input.prompt.placeholder');

  useEffect(() => {
    onChange?.(prompt);
  }, [prompt]);
  useEffect(() => {
    setPrompt(initialPrompt || '');
  }, [initialPrompt]);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt, adjustTextareaHeight]);

  const generateMagicPrompt = async () => {
    const newPrompt = `Current user input prompt for video generation: "${prompt}"
Describe the visual scene in more details, optimize and slightly expand the prompt in one or two natural language sentences, use the same language as the user prompt. Directly output the optimized prompt without anything else, use the same language as in the user input.`;

    try {
      setMagicPromptLoading(true);
      const { generateText } = await import('../InfCanva/utils');
      const text = await generateText(newPrompt, 'gpt-4o', t);
      if (text) {
        setPrompt(text.replace(/["']/g, ''));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMagicPromptLoading(false);
    }
  };

  return (
    <div className='relative'>
      <textarea
        value={prompt}
        ref={textareaRef}
        onChange={e => setPrompt(e.target.value)}
        placeholder={placeholder}
        className='p-3 pb-8 w-full text-base rounded-lg border border-border bg-card text-foreground transition-all duration-300 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500'
        rows={4}
      />
      <Button
        color='primary'
        size='sm'
        onPress={generateMagicPrompt}
        className='absolute bottom-[8px] -right-[8px] text-xs scale-80'
        isDisabled={!prompt}
        isLoading={magicPromptLoading}>
        <FaMagic className='w-4 h-4 flex-0' />
        {t('common:magic_prompt')}
      </Button>
    </div>
  );
};

export default MagicTextarea;
