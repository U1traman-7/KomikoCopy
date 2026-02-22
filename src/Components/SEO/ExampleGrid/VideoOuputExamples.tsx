import React from 'react';
import type { VideoExample } from '../types';
import LazyVideo from '../../LazyMedia/LazyVideo';
import LazyImage from '../../LazyMedia/LazyImage';
import { SingleVideoExample } from './SingleVideoExamples';

export interface VideoOuputExampleProps {
  title: string;
  description: string;
  inputType: 'video' | 'image';
  examples: VideoExample[];
  autoPlay?: boolean;
}

export default function VideoOuputExample({
  title,
  description,
  inputType,
  examples,
  autoPlay = false,
}: VideoOuputExampleProps) {
  const renderComparisonExample = (example: VideoExample) => (
    <div
      key={example.id}
      className='flex flex-col bg-card rounded-xl shadow-sm transition-shadow duration-200 hover:shadow-md'>
      <div className='grid grid-cols-2 gap-4 px-6 pt-6 pb-4'>
        <div className='flex flex-col'>
          <div className='w-full rounded-lg h-64 md:h-80 flex items-center justify-center overflow-hidden bg-muted'>
            {inputType === 'video' ? (
              <LazyVideo
                src={example.input}
                className='max-h-full max-w-full w-auto h-auto rounded-lg object-contain'
                label={example.inputLabel || ''}
                playsInline
                muted
                autoPlay={autoPlay}
              />
            ) : (
              <LazyImage
                src={example.input}
                alt={example.inputLabel || ''}
                className='max-h-full max-w-full w-auto h-auto rounded-lg object-contain'
              />
            )}
          </div>
          <p className='text-xs text-center text-muted-foreground md:text-sm mt-3 px-2'>
            {example.inputLabel}
          </p>
        </div>
        <div className='flex flex-col'>
          <div className='w-full rounded-lg h-64 md:h-80 flex items-center justify-center overflow-hidden bg-muted'>
            <LazyVideo
              src={example.output || ''}
              className='max-h-full max-w-full w-auto h-auto rounded-lg object-contain'
              label={example.outputLabel || ''}
              playsInline
              muted
              autoPlay={autoPlay}
            />
          </div>
          <p className='text-xs text-center text-muted-foreground md:text-sm mt-3 px-2'>
            {example.outputLabel}
          </p>
        </div>
      </div>
      <div className='px-6 py-4 bg-primary-50 dark:bg-primary-900/30 rounded-b-xl mt-auto'>
        <p className='font-medium text-primary-600 dark:text-foreground text-xs md:text-sm'>
          {example.description}
        </p>
      </div>
    </div>
  );

  const renderSingleExample = (example: VideoExample) => {
    const singleExample = {
      id: example.id,
      description: example.description,
      videoUrl: example.output || '',
    };

    return <SingleVideoExample example={singleExample} key={example.id} />;
  };

  return (
    <div>
      <h2 className='md:mb-6 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
        {title}
      </h2>
      <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
        {description}
      </p>

      <div className='grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-2'>
        {examples.map(example =>
          example.layout === 'comparison'
            ? renderComparisonExample(example)
            : renderSingleExample(example),
        )}
      </div>
    </div>
  );
}
