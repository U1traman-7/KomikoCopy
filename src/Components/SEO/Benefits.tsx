import React from 'react';
import type { BenefitsProps } from './types';

export default function Benefits({ title, description, features }: BenefitsProps) {
  return (
    <section className='pb-16 bg-gradient-to-b from-background rounded-xl to-primary-100 dark:to-muted'>
      <h2 className='mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
        {description}
      </p>
      <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-3'>
        {features.map(feature => (
          <div
            key={feature.title}
            className='p-6 bg-card rounded-xl border border-primary-100 border-border shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
            <div className='flex items-center mb-4'>
              <span className='mr-3 text-xl md:text-2xl'>{feature.icon}</span>
              <h3 className='text-lg font-semibold text-primary-600 md:text-xl'>
                {feature.title}
              </h3>
            </div>
            <p className='text-muted-foreground text-sm md:text-base'>
              {feature.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}