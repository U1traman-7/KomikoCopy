import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const FAQSection = memo(() => {
  const { t } = useTranslation('landing');
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: t('faq.what_is_komiko.question'),
      answer: t('faq.what_is_komiko.answer'),
    },
    {
      id: 0,
      question: t('faq.what_tools.question'),
      answer: t('faq.what_tools.answer'),
    },
    {
      id: 2,
      question: t('faq.how_comic_creation_works.question'),
      answer: t('faq.how_comic_creation_works.answer'),
    },
    {
      id: 3,
      question: t('faq.is_free.question'),
      answer: t('faq.is_free.answer'),
    },
    {
      id: 4,
      question: t('faq.manga_anime_style.question'),
      answer: t('faq.manga_anime_style.answer'),
    },
    {
      id: 5,
      question: t('faq.what_makes_different.question'),
      answer: t('faq.what_makes_different.answer'),
    },
    {
      id: 6,
      question: t('faq.need_artistic_skills.question'),
      answer: t('faq.need_artistic_skills.answer'),
    },
    {
      id: 7,
      question: t('faq.commercial_projects.question'),
      answer: t('faq.commercial_projects.answer'),
    },
    {
      id: 8,
      question: t('faq.support.question'),
      answer: t('faq.support.answer'),
    },
  ];

  return (
    <div className='mx-auto mt-2 md:mt-8 max-w-3xl px-6 mb-8 md:mb-16' id='faq'>
      <h2 className='text-foreground text-center font-sans mb-5 text-2xl font-bold leading-tight sm:text-3xl sm:leading-tight md:text-4xl md:leading-tight'>
        {t('faq.title')}
      </h2>
      <div className='space-y-6'>
        {faqs.map(faq => (
          <div key={faq.id} className='bg-card rounded-lg shadow-sm'>
            <button
              className='flex justify-between items-center px-4 md:px-6 py-3 md:py-4 w-full text-left'
              onClick={() =>
                setOpenFaqId(openFaqId === faq.id ? null : faq.id)
              }>
              <span className='text-sm md:text-lg font-medium text-foreground'>
                {faq.question}
              </span>
              <svg
                className={`w-5 h-5 text-muted-foreground transform transition-transform ${
                  openFaqId === faq.id ? 'rotate-180' : ''
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
            {openFaqId === faq.id && (
              <div className='px-4 md:px-6 pb-3 md:pb-4'>
                <p className='text-sm md:text-base text-muted-foreground'>
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
