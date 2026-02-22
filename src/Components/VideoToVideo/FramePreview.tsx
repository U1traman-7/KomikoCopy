import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { IconQuestionMark } from '@tabler/icons-react';

// FramePreview 组件
interface FramePreviewProps {
  extractedFrame: string | null;
  styledFrame: string | null;
  isProcessing: boolean;
}

const FramePreview = React.forwardRef<HTMLDivElement, FramePreviewProps>(
  ({ extractedFrame, styledFrame, isProcessing }, ref) => {
    const { t: tFrame } = useTranslation(['video-to-video', 'common', 'toast']);
    const [imageHeight, setImageHeight] = useState<number | null>(null);
    const [imageWidth, setImageWidth] = useState<number | null>(null);
    const [displayWidth, setDisplayWidth] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          setDisplayWidth(containerRef.current.offsetWidth);
        }
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    if (!extractedFrame) {
      return null;
    }

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageWidth(img.naturalWidth);
      setImageHeight(img.naturalHeight);
      setDisplayWidth(containerRef.current?.offsetWidth || img.offsetWidth);
    };

    return (
      <div className='p-2 mb-2 bg-muted rounded-lg mt-4' ref={ref}>
        <div className='flex gap-1 flex-row justify-between items-stretch mb-1 sm:gap-4 w-full'>
          <div className='flex-1 text-center'>
            <div className='relative mx-auto w-full' ref={containerRef}>
              <img
                src={extractedFrame}
                alt={tFrame('ui.framePreview.original')}
                className='object-contain w-full h-auto rounded-lg border-2 border-border shadow-sm'
                onLoad={handleImageLoad}
              />
            </div>
            <p className='mt-2 text-xs font-medium text-muted-foreground'>
              {tFrame('ui.framePreview.original')}
            </p>
          </div>

          <div className='flex-1 text-center'>
            {isProcessing ? (
              <div
                className='flex overflow-hidden relative flex-col justify-center items-center mx-auto w-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-400'
                style={{
                  height:
                    displayWidth && imageHeight && imageWidth
                      ? (displayWidth * imageHeight) / imageWidth
                      : 300,
                  width: '100%',
                }}>
                <div
                  className='absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-pulse via-blue-100/50'
                  style={{ animationDuration: '2s' }}></div>
                <div className='flex relative z-10 flex-col justify-center items-center p-4 text-center'>
                  <div className='mb-2 w-8 h-8 rounded-full border-4 border-blue-200 animate-spin sm:h-12 sm:w-12 border-t-blue-600 sm:mb-4'></div>
                  <p className='mb-2 text-xs font-medium text-blue-600 sm:text-sm'>
                    {tFrame('ui.framePreview.applyingStyle')}
                  </p>
                  <div className='flex justify-center items-center space-x-1'>
                    <div
                      className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce'
                      style={{ animationDelay: '0ms' }}></div>
                    <div
                      className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce'
                      style={{ animationDelay: '150ms' }}></div>
                    <div
                      className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce'
                      style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            ) : styledFrame ? (
              <>
                <div
                  className='relative mx-auto w-full overflow-hidden rounded-lg border-2 border-emerald-400 shadow-md'
                  style={{
                    height:
                      displayWidth && imageHeight && imageWidth
                        ? (displayWidth * imageHeight) / imageWidth
                        : 'auto',
                    width: '100%',
                  }}>
                  <img
                    src={styledFrame}
                    alt={tFrame('ui.framePreview.styled')}
                    className='object-cover w-full h-full'
                  />
                  <div className='flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 bg-emerald-500 rounded-full border-2 border-card shadow-lg sm:w-6 sm:h-6'>
                    <IoCheckmarkCircle className='flex-shrink-0 w-3 h-3 text-primary-foreground sm:w-4 sm:h-4' />
                  </div>
                </div>
                <p className='mt-1 text-xs font-medium text-emerald-600'>
                  {tFrame('ui.framePreview.styled')}
                </p>
              </>
            ) : (
              <div
                className='flex relative justify-center items-center mx-auto w-full bg-muted rounded-lg border-2 border-border border-dashed transition-colors duration-300 hover:border-muted-foreground overflow-hidden content-start'
                style={{
                  height:
                    displayWidth && imageHeight && imageWidth
                      ? (displayWidth * imageHeight) / imageWidth
                      : 300,
                  width: '100%',
                }}>
                <div className='p-4 text-center overflow-hidden'>
                  <div className='flex justify-center items-center mx-auto mb-1'>
                    <IconQuestionMark className='w-4 h-4 text-muted-foreground' />
                  </div>
                  <p className='text-xs font-medium text-muted-foreground truncate'>
                    {tFrame('ui.framePreview.awaitingStyle')}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground truncate'>
                    {tFrame('ui.framePreview.selectStyleBelow')}
                  </p>
                </div>
              </div>
            )}
            {!styledFrame && !isProcessing && (
              <p className='mt-1 text-xs text-muted-foreground'>
                {tFrame('ui.framePreview.styled')}
              </p>
            )}
          </div>
        </div>
        <p className='mt-2 text-xs text-center text-muted-foreground'>
          {tFrame('ui.framePreview.frameReferenceText')}
        </p>
      </div>
    );
  },
);

FramePreview.displayName = 'FramePreview';

export default FramePreview;
