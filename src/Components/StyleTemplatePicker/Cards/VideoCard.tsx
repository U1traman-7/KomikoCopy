import React, { useCallback, useState, useRef } from 'react';
import { Button, Modal, ModalContent } from '@nextui-org/react';
import { FaCheck } from 'react-icons/fa6';
import { FiMaximize } from 'react-icons/fi';
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2';
import { BiSolidZap } from 'react-icons/bi';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { VideoStyleTemplate } from '../styles';
import {
  calculateVideoTemplateCost,
} from '../../../../api/tools/_zaps';

export interface EffectCardProps {
  template: VideoStyleTemplate;
  selected: boolean;
  onClick: () => void;
  compact?: boolean; // Whether it's compact mode (used in modal)
}

// Helper function to calculate effect cost based on model, duration and pipeline type
const calculateEffectCost = (modelId: number, duration: number, videoPipelineType?: string): number => {
  return calculateVideoTemplateCost(modelId, duration, videoPipelineType);
};

export const EffectCard: React.FC<EffectCardProps> = ({
  template,
  selected,
  onClick,
}) => {
  const { t } = useTranslation('style-templates');
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (!v) return;
      v.muted = false;
      if (v.volume === 0) v.volume = 0.5;
      try {
        const videos = document.getElementsByTagName('video');
        for (const el of Array.from(videos)) {
          if (el !== v && !el.paused) {
            try {
              el.pause();
            } catch {}
          }
        }
      } catch {}
      v.play().catch(() => {});
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const v = e.currentTarget as HTMLVideoElement;
      if (!v) return;
      v.pause();
    },
    [],
  );

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      try {
        modalVideoRef.current?.pause();
      } catch {}
    }
    setIsModalOpen(open);
  };

  const effectCost = calculateEffectCost(template.model, template.duration, template.videoPipelineType);

  return (
    <div
      key={template.id}
      data-style-id={template.id}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onClick();
        }
      }}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-lg transition-all duration-200 overflow-hidden',
        {
          'border-2 border-primary-600 bg-primary-50 shadow-md': selected,
          'border border-border hover:border-primary-300 hover:bg-primary-50/30':
            !selected,
        },
      )}>
      {/* Video container */}
      <div className={cn('overflow-hidden relative aspect-[3/2] rounded-t-lg')}>
        <video
          draggable={false}
          src={template.video + '#t=0.001'}
          className='object-cover object-top w-full h-full'
          muted
          playsInline
          loop
          preload='auto'
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />

        {/* Expand button */}
        <Button
          type='button'
          size='sm'
          aria-label='Expand'
          onPress={openModal}
          className='absolute bottom-1 right-1 z-10 rounded-sm bg-black/40 hover:bg-black/70 text-white w-5 h-5 min-w-5 min-h-5'
          isIconOnly>
          <FiMaximize className='w-2.5 h-2.5' />
        </Button>

        {/* Selected checkmark */}
        {selected && (
          <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600 rounded-tr-lg rounded-bl-lg flex items-center justify-center z-10 pointer-events-none'>
            <FaCheck className='-mt-0.5 ml-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 text-white' />
          </div>
        )}

        {/* Audio and Zaps info - overlay on video bottom left */}
        <div className='absolute bottom-1 left-1 flex items-center gap-0.5 px-1 py-0.5 bg-black/70 rounded-full shadow-sm'>
          {/* Audio icon */}
          {template.hasAudio ? (
            <HiSpeakerWave className='w-2 h-2 text-white' />
          ) : (
            <HiSpeakerXMark className='w-2 h-2 text-muted-foreground' />
          )}
          {/* Zaps */}
          <div className='flex items-center gap-0.5'>
            <BiSolidZap className='w-2 h-2 text-yellow-400' />
            <span className='text-[8px] font-semibold text-white leading-none'>
              {effectCost}
            </span>
          </div>
        </div>
      </div>

      {/* Template name */}
      <p className='text-[9px] sm:text-[10px] font-medium text-center truncate leading-tight py-0.5 px-0.5'>
        {t(`effects.${template.nameKey}`)}
      </p>

      {/* Modal for expanded video */}
      {isModalOpen && (
        <Modal
          isOpen
          onOpenChange={handleOpenChange}
          backdrop='opaque'
          placement='center'
          size='full'
          closeButton
          scrollBehavior='inside'
          classNames={{
            backdrop: 'bg-black/80',
            base: 'bg-transparent shadow-none',
            closeButton:
              'top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-50 backdrop-blur-sm border border-white/20',
          }}>
          <ModalContent>
            <div className='p-0 w-screen h-screen flex items-center justify-center'>
              <div className='relative w-full h-full'>
                <video
                  ref={modalVideoRef}
                  src={template.video + '#t=0.001'}
                  className='w-full h-full object-contain'
                  autoPlay
                  controls
                  loop
                  playsInline
                />
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default EffectCard;
