import React from 'react';
import { useTranslation } from 'react-i18next';

interface DurationSelectorProps {
  selectedDuration: number;
  setSelectedDuration: (duration: number) => void;
  originalVideoDuration?: number;
  isClient: boolean;
  isSafari: boolean;
  className?: string;
  maxDuration: number;
}

export function DurationSelector({
  selectedDuration,
  setSelectedDuration,
  originalVideoDuration,
  isClient,
  isSafari,
  className = '',
  maxDuration,
}: DurationSelectorProps) {
  const { t } = useTranslation(['video-to-video']);

  return (
    <div className={`mb-4 ${className}`}>
      <label className='block mb-2 text-sm font-bold text-foreground'>
        {t('ui.duration.title')}
        {originalVideoDuration && (
          <span className='ml-2 text-xs text-muted-foreground'>
            (
            {t('ui.duration.originalDuration', {
              duration: Math.round(originalVideoDuration * 100) / 100,
            })}
            )
          </span>
        )}
      </label>

      <div className='grid grid-cols-4 gap-2'>
        {(() => {
          // Safari用户且视频时长<=15s：只显示原始时长选项
          if (isClient && isSafari && originalVideoDuration) {
            return (
              <label className='flex col-span-3 items-center px-3 py-2 text-sm rounded-lg border cursor-pointer md:text-base bg-primary-50 border-primary-300'>
                <input
                  type='radio'
                  name='duration'
                  value={originalVideoDuration}
                  checked={true}
                  readOnly
                  className='mr-1 accent-primary-600'
                />
                <span className='flex-1 text-sm'>
                  {Math.round(originalVideoDuration * 100) / 100}s (
                  {t('ui.duration.originalLength')})
                </span>
              </label>
            );
          }

          // 非Safari用户或Safari用户无视频：显示常规选项
          let durationOptions = [3, 5, 10, 15];

          // If original video is shorter than 3 seconds, replace the first option with actual duration
          if (originalVideoDuration && originalVideoDuration < 3) {
            durationOptions = [originalVideoDuration, 5, 10, 15];
          } else if (originalVideoDuration) {
            // If original is >=3s and <5s, replace the 5s slot with the original duration (e.g., 4.5s)
            if (originalVideoDuration >= 3 && originalVideoDuration < 5) {
              durationOptions = [3, originalVideoDuration, 10, 15];
            }
            // If original is >5s and <10s, replace the 10s slot with the original duration (e.g., 7s)
            else if (originalVideoDuration > 5 && originalVideoDuration < 10) {
              durationOptions = [3, 5, originalVideoDuration, 15];
            }
            // If original is >10s and <=15s, replace the 15s slot with the original duration (e.g., 12s)
            else if (
              originalVideoDuration > 10 &&
              originalVideoDuration <= 15
            ) {
              durationOptions = [3, 5, 10, originalVideoDuration];
            } else {
              durationOptions = [3, 5, 10, 15, originalVideoDuration];
            }
          }

          // filter durationOptions by maxDuration
          durationOptions = durationOptions.filter(
            duration => duration <= maxDuration,
          );

          return durationOptions.map((duration, index) => (
            <label
              key={index}
              className={`flex items-center py-2 px-3 text-sm md:text-base cursor-pointer border rounded-lg transition-all duration-300 hover:bg-primary-50 hover:border-primary-300 ${
                Math.abs(selectedDuration - duration) < 0.1
                  ? 'bg-primary-50 border-primary-300'
                  : originalVideoDuration &&
                      originalVideoDuration > 0 &&
                      duration > originalVideoDuration
                    ? 'bg-muted border-border cursor-not-allowed opacity-50'
                    : 'bg-card border-border'
              }`}>
              <input
                type='radio'
                name='duration'
                value={duration}
                checked={Math.abs(selectedDuration - duration) < 0.01}
                onChange={e => setSelectedDuration(Number(e.target.value))}
                disabled={
                  !!(
                    originalVideoDuration &&
                    originalVideoDuration > 0 &&
                    duration > originalVideoDuration
                  )
                }
                className='mr-1 accent-primary-600'
              />
              <span className='flex-1 text-sm'>
                {/* 当duration等于原始时长时，保留两位小数 */}
                {originalVideoDuration &&
                Math.abs(duration - originalVideoDuration) < 0.01
                  ? `${Math.round(duration * 100) / 100}s`
                  : (duration < 3 &&
                        originalVideoDuration &&
                        originalVideoDuration < 3) ||
                      (duration > 5 &&
                        duration <= 15 &&
                        originalVideoDuration &&
                        originalVideoDuration > 5 &&
                        originalVideoDuration <= 15)
                    ? `${Math.round(duration * 10) / 10}s`
                    : `${Math.round(duration)}s`}
                {/* Show "original length" label for custom duration options */}
                {originalVideoDuration &&
                  Math.abs(duration - originalVideoDuration) < 0.01 &&
                  duration !== 3 &&
                  duration !== 5 &&
                  duration !== 10 && (
                    <span className='block text-xs text-muted-foreground'>
                      ({t('ui.duration.originalLength')})
                    </span>
                  )}
                {originalVideoDuration &&
                  originalVideoDuration > 0 &&
                  duration > originalVideoDuration && (
                    <span className='block text-xs text-muted-foreground'>
                      ({t('ui.duration.tooLong')})
                    </span>
                  )}
              </span>
            </label>
          ));
        })()}
      </div>
      <p className='mt-2 text-xs text-muted-foreground'>
        {(() => {
          if (
            isClient &&
            isSafari &&
            originalVideoDuration &&
            originalVideoDuration <= 15
          ) {
            return null;
          }

          return originalVideoDuration &&
            originalVideoDuration > selectedDuration
            ? t('ui.duration.willBeTrimmed', {
                original: Math.round(originalVideoDuration * 100) / 100,
                target: Math.round(selectedDuration * 100) / 100,
              })
            : t('ui.duration.description');
        })()}
      </p>
    </div>
  );
} 