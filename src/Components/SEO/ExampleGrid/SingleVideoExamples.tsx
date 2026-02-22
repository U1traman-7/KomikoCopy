import React from 'react';
import LazyVideo from '../../LazyMedia/LazyVideo';

interface VideoExample {
  id: number;
  title?: string;
  description?: string;
  videoUrl: string;
}

interface SingleVideoExamplesProps {
  title: string;
  description?: string;
  examples: VideoExample[];
}

export const SingleVideoExample = ({ example }: { example: VideoExample }) => {
  return (
    <div
      key={example.id}
      className='relative flex overflow-hidden flex-col bg-primary-50 dark:bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
      <div
        className='relative w-full max-w-full max-h-[360px] md:max-h-[420px] xl:max-h-[480px] rounded-t-xl bg-black overflow-hidden mx-auto'
        style={{ aspectRatio: '16 / 9' }}>
        <LazyVideo
          src={example.videoUrl}
          className='absolute inset-0 w-full h-full object-contain max-w-full max-h-full'
          label={example.description}
          playsInline
          muted={false}
          placeholder={
            <div className='absolute inset-0 w-full h-full bg-muted flex items-center justify-center'>
              <div className='text-muted-foreground dark:text-foreground text-sm'>Loading video...</div>
            </div>
          }
        />
      </div>
      <div className='p-4'>
        {example.title && (
          <h3 className='mb-1 md:mb-2 text-base md:text-lg font-semibold text-primary-600 dark:text-foreground'>
            {example.title}
          </h3>
        )}
        {example.description && (
          <p
            className={`${example.title ? 'text-muted-foreground dark:text-foreground text-sm' : 'text-primary-600 dark:text-foreground text-base'}`}>
            {example.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default function SingleVideoExamples({
  title,
  description,
  examples,
}: SingleVideoExamplesProps) {
  // Responsive grid: 1 col (xs), 2 cols (md), 2 cols (lg if 4 items), 3 cols (lg if >4)
  const getGridCols = () => {
    if (examples.length === 4) {
      // 2x2 grid on large screens for 4 items
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    }

    if (examples.length === 2) {
      return 'grid-cols-1 md:grid-cols-2';
    }

    // default: 1 (xs), 2 (md), 3 (lg)
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <section>
      <h2 className='mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
        {description}
      </p>

      <div className={`grid ${getGridCols()} gap-4 md:gap-5 lg:gap-6`}>
        {examples.map(example => (
          <SingleVideoExample key={example.id} example={example} />
        ))}
      </div>
    </section>
  );
}
