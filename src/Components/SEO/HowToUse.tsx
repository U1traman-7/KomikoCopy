import React from 'react';
import type { HowToUseProps } from './types';

export default function HowToUse({ title, steps }: HowToUseProps) {
  return (
    <section className='bg-background dark:bg-transparent'>
      <h2 className='mb-4 md:mb-10 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4'>
        {steps.map((step, index) => (
          <div
            key={step.title}
            className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
            <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
              {index + 1}
            </div>
            <div className='flex-grow'>
              <h3 className='mb-3 text-lg font-bold text-primary-600 md:text-xl'>
                {step.title}
              </h3>
              <p className='text-muted-foreground text-sm md:text-base'>
                {step.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}