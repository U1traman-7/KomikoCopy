import React, { useState, memo } from 'react';
import { FaPlay, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useVideoPreload } from '@/hooks/useVideoPreload';

export type VideoPlayerProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  src: string;
  videoMuted: boolean;
  showPlayButton: boolean;
  isPlaying: boolean;
  className: string;
  onVideoHover: (isHovering: boolean) => void;
  toggleMute: (e: React.MouseEvent) => void;
};

const VideoPlayerInner: React.FC<VideoPlayerProps> = ({
  videoRef,
  src,
  videoMuted,
  showPlayButton,
  isPlaying,
  className,
  onVideoHover,
  toggleMute,
}) => {
  const shouldPreload = useVideoPreload(videoRef);
  const [canPlay, setCanPlay] = useState(false);

  return (
    <div
      className={`relative w-auto h-auto bg-black ${className.includes('rounded') ? className.split(' ').find(c => c.includes('rounded')) : ''}`}
      onMouseEnter={() => canPlay && onVideoHover(true)}
      onMouseLeave={() => onVideoHover(false)}>
      <video
        ref={videoRef}
        className={className}
        src={`${src}#t=0.001`}
        muted={videoMuted}
        loop
        playsInline
        preload={shouldPreload ? 'metadata' : 'none'}
        crossOrigin='anonymous'
        onCanPlay={() => setCanPlay(true)}
        onError={e => {
          setCanPlay(false);
          console.error('Video error:', e);
        }}
        style={{ display: 'block' }}
      />
      {(showPlayButton || isPlaying) && (
        <div
          className={`absolute inset-0 pointer-events-none ${showPlayButton ? 'bg-black bg-opacity-30' : ''}`}>
          {showPlayButton && (
            <FaPlay
              size={40}
              color='white'
              className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow'
            />
          )}
          {isPlaying && (
            <button
              onClick={toggleMute}
              className='absolute right-2 bottom-2 pointer-events-auto p-3 bg-black bg-opacity-50 rounded-full'>
              {videoMuted ? (
                <FaVolumeMute size={16} color='white' />
              ) : (
                <FaVolumeUp size={16} color='white' />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const VideoPlayer = memo(VideoPlayerInner);

