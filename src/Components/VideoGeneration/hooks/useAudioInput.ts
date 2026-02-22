import { useState } from 'react';
import toast from 'react-hot-toast';
import { isSupportedAudioFormat } from '../../../utilities/audio';

export const useAudioInput = (t: any) => {
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(5);

  const detectAudioDuration = (file: File) => {
    if (!file) return;
    const audioElement = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audioElement.addEventListener('loadedmetadata', () => {
      if (audioElement.duration && !isNaN(audioElement.duration)) {
        const seconds = Math.ceil(audioElement.duration);
        const limited = Math.min(30, Math.max(3, seconds));
        setAudioDuration(limited);
      } else {
        setAudioDuration(5);
      }
      URL.revokeObjectURL(objectUrl);
    });
    audioElement.addEventListener('error', () => {
      setAudioDuration(5);
      URL.revokeObjectURL(objectUrl);
    });
    audioElement.src = objectUrl;
  };

  const clearAllAudio = () => {
    setSelectedAudio(null);
    setAudioDuration(5);
  };

  const handleAudioChange = (file: File | null) => {
    if (!file) {
      clearAllAudio();
      return;
    }
    if (
      !isSupportedAudioFormat(file.type) &&
      !file.type.startsWith('video/webm')
    ) {
      toast.error(
        t(
          'image-animation-generator:ui.audio.invalidFormat',
          'Invalid audio format. Please use MP3 or WAV',
        ),
      );
      return;
    }
    detectAudioDuration(file);
    setSelectedAudio(file);
  };

  return {
    selectedAudio,
    audioDuration,
    handleAudioChange,
    clearAllAudio,
  };
};

