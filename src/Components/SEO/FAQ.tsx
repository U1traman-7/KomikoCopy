import React, { useState } from 'react';
import type { FAQProps } from './types';

function FAQ({ title, description, faqs }: FAQProps) {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  return (
    <section className=''>
      <h2 className='mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
        {description}
      </p>

      <div className='flex justify-center'>
        <div className='max-w-[1000px] w-full'>
          {faqs.map((faq, index) => (
            <div key={index} className='rounded-lg shadow-sm'>
              <button
                className='flex justify-between items-center px-6 py-4 w-full text-left'
                onClick={() => setOpenFaqId(openFaqId === index ? null : index)}>
                <span className='text-sm md:text-lg font-medium text-foreground'>
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-muted-foreground transform transition-transform ${
                    openFaqId === index ? 'rotate-180' : ''
                  }`}
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>
              {openFaqId === index && (
                <div className='px-6 pb-4'>
                  <p className='text-muted-foreground text-sm md:text-base'>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;