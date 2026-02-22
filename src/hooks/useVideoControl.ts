import { useState, useRef, useCallback } from 'react';
import { isSafari } from './useVideoPreload';

/**
 * Hook to manage video playback controls
 */
export const useVideoControl = () => {
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);

  const handleVideoHover = useCallback(
    (isHovering: boolean) => {
      if (!videoRef.current) return;
      const video = videoRef.current;

      if (isHovering) {
        if (isSafari()) {
          video.preload = 'auto';
          requestAnimationFrame(() => {
            if (video.readyState >= 2) {
              video.muted = true;
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setShowPlayButton(false);
                })
                .catch(() => {});
            }
          });
        } else {
          video.muted = videoMuted;
          video
            .play()
            .then(() => {
              setIsPlaying(true);
              setShowPlayButton(false);
            })
            .catch(() => {
              setIsPlaying(false);
              setShowPlayButton(true);
            });
        }
      } else {
        video.pause();
        if (!isSafari()) {
          video.currentTime = 0;
        }
        video.muted = true;
        setVideoMuted(true);
        setIsPlaying(false);
        setShowPlayButton(true);
      }
    },
    [videoMuted],
  );

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setVideoMuted(newMutedState);
    }
  }, []);

  const pauseVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (!isSafari()) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current.muted = true;
      setVideoMuted(true);
      setIsPlaying(false);
      setShowPlayButton(true);
    }
  }, []);

  return {
    videoRef,
    videoMuted,
    isPlaying,
    showPlayButton,
    handleVideoHover,
    toggleMute,
    pauseVideo,
    setVideoMuted,
    setIsPlaying,
    setShowPlayButton,
  };
};

