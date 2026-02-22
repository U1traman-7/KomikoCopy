import React from 'react';
import { Button } from '@nextui-org/react';
import type { CTAProps } from './types';
export default function CTA({
  title,
  description,
  buttonText,
  onButtonClick,
}: CTAProps) {
  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className='py-8 md:py-16 text-center px-4 rounded bg-muted'>
      <h2 className='mb-4 md:mb-6 text-xl md:text-3xl font-bold text-heading'>
        {title}
      </h2>
      <p className='mx-auto mb-6 md:mb-8 max-w-2xl text-sm md:text-lg text-muted-foreground whitespace-pre-line'>
        {description}
      </p>
      <Button
        color='primary'
        size='lg'
        className='px-4 md:px-8 py-2 md:py-3 text-base md:text-lg font-semibold h-10 md:h-12'
        onPress={handleClick}>
        {buttonText}
      </Button>
    </div>
  );
}
