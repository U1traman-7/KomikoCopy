import { memo, useState } from "react";
import { useVariantData } from '../Components/ToolsPage/TemplateWrapper';
import { useVariantContent } from '../hooks/useVariantContent';
import { useTranslation } from 'react-i18next';

interface FAQCompProps {
  faqs?: {
    id: number;
    question: string;
    answer: string | string[] | React.ReactNode;
  }[];
  translationNamespace?: string;
}

const FAQ = memo(({ faqs, translationNamespace }: FAQCompProps) => {
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const { t } = useTranslation(translationNamespace || 'common');
  const { isVariant, data } = useVariantData();
  const content = useVariantContent(isVariant, data, t);

  // Use provided faqs or get from variant content
  const faqItems = faqs || (isVariant ? content.faq.items : []);

  return (
    <div className='space-y-4'>
      {faqItems.map((faq, index) => (
        <div key={faq.id || index} className='bg-card rounded-lg shadow-sm'>
          <button
            className='flex justify-between items-center px-6 py-4 w-full text-left'
            onClick={() =>
              setOpenFaqId(
                openFaqId === (faq.id || index) ? null : faq.id || index,
              )
            }>
            <span className='text-sm md:text-lg font-medium text-foreground'>
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-muted-foreground transform transition-transform ${
                openFaqId === (faq.id || index) ? 'rotate-180' : ''
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

          <div
            className={`${openFaqId === (faq.id || index) ? 'block' : 'hidden'}`}>
            <div className='px-6 pb-4'>
              {typeof faq.answer === 'string' ? (
                <p className='text-sm md:text-base text-muted-foreground'>
                  {faq.answer}
                </p>
              ) : Array.isArray(faq.answer) ? (
                <ul className='list-disc list-inside text-sm md:text-base text-muted-foreground'>
                  {faq.answer.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                faq.answer
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default FAQ;
