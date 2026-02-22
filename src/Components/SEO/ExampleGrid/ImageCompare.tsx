import { useTranslation } from 'react-i18next';
export interface ImageExampleItem {
  input: string;
  inputLabel?: string;
  output: string;
  outputLabel?: string;
  prompt: string;
}

export interface ImageCompareProps {
  title: string;
  description?: string;
  examples: ImageExampleItem[];
}

export default function ImageCompare({
  title,
  description,
  examples,
}: ImageCompareProps) {
  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      {description && (
        <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
          {description}
        </p>
      )}

      <div className='grid grid-cols-1 gap-6 md:gap-10 md:grid-cols-2'>
        {examples.map((example: ImageExampleItem, index: number) => (
          <div
            key={example.input}
            className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
            <div className='grid grid-cols-2 gap-4 p-6 pb-2'>
              <div className='flex flex-col'>
                <div className='overflow-hidden mb-2 w-full rounded-lg h-48 md:h-64 max-w-full max-h-80'>
                  <img
                    src={example.input}
                    alt='Input'
                    className='object-contain w-full h-full'
                  />
                </div>
                <p className='text-xs text-center text-muted-foreground md:text-sm'>
                  {example.inputLabel || t('examples.inputLabel')}
                </p>
              </div>
              <div className='flex flex-col'>
                <div className='overflow-hidden mb-2 w-full rounded-lg h-48 md:h-64 max-w-full max-h-80'>
                  <img
                    src={example.output}
                    alt={example.outputLabel || t('examples.outputLabel')}
                    className='object-contain w-full h-full'
                  />
                </div>
                <p className='text-xs text-center text-muted-foreground md:text-sm'>
                  {example.outputLabel || t('examples.outputLabel')}
                </p>
              </div>
            </div>
            <div className='p-4 bg-primary-50 dark:bg-primary-900/30 h-[56px] box-border'>
              <p className='h-full font-medium capitalize text-primary-600 text-sm md:text-base dark:text-foreground'>
                {example.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
