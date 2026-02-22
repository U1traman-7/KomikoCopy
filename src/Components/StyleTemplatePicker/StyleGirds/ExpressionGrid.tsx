import React from 'react';
import { expressionTemplates } from './styles';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { FaCheck } from 'react-icons/fa6';
import { ExpressionTemplate } from './styles';

interface ExpressionStyleGridProps {
  selectedStyleId: string;
  setStyle: (style: ExpressionTemplate) => void;
}

export const ExpressionStyleGrid: React.FC<ExpressionStyleGridProps> = ({
  selectedStyleId,
  setStyle,
}) => {
  const { t } = useTranslation('style-templates');

  return (
    <div className='border-1 border-border rounded-lg'>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-1 max-h-[300px] overflow-y-auto p-1'>
        {expressionTemplates.map(style => {
          return (
            <div
              key={style.id}
              data-style-id={style.id}
              role='button'
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setStyle(style);
                }
              }}
              onClick={() => {
                setStyle(style);
              }}
              className={cn(
                'cursor-pointer rounded-lg transition-all duration-200 relative overflow-hidden',
                {
                  'border-2 border-primary-600 bg-primary-50 shadow-md':
                    selectedStyleId === style.id ||
                    selectedStyleId === `expression-${style.id}`,
                  'border border-border hover:border-primary-300 hover:bg-primary-50/30':
                    selectedStyleId !== style.id &&
                    selectedStyleId !== `expression-${style.id}`,
                  'opacity-50 !cursor-not-allowed border border-border': false,
                },
              )}>
              <div className='overflow-hidden rounded-none aspect-square relative'>
                <img
                  draggable={false}
                  src={style.image}
                  alt={t(`expressions.${style.nameKey}`)}
                  className='object-cover object-top w-full h-full'
                />
                {(selectedStyleId === style.id ||
                  selectedStyleId === `expression-${style.id}`) && (
                  <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600 rounded-bl-full flex items-center justify-center z-10 pointer-events-none'>
                    <FaCheck className='-mt-1 ml-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white' />
                  </div>
                )}
              </div>
              <p className='text-xs md:text-sm font-medium text-center truncate leading-tight py-2'>
                {t(`expressions.${style.nameKey}`)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
