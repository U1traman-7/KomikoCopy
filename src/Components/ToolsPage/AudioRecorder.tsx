import React, { useState, useRef, useEffect } from 'react';
import { BiSolidMicrophone, BiStopCircle, BiReset } from 'react-icons/bi';
import { Button, Spinner } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';

// 将AudioBuffer转换为WAV格式
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM格式
  const bitDepth = 16; // 16位深度

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  // 准备音频的输出数据
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const dataView = new DataView(arrayBuffer);

  // RIFF标识
  dataView.setUint8(0, 'R'.charCodeAt(0));
  dataView.setUint8(1, 'I'.charCodeAt(0));
  dataView.setUint8(2, 'F'.charCodeAt(0));
  dataView.setUint8(3, 'F'.charCodeAt(0));

  // 文件大小减去前8个字节
  dataView.setUint32(4, 36 + dataSize, true);

  // WAVE标识
  dataView.setUint8(8, 'W'.charCodeAt(0));
  dataView.setUint8(9, 'A'.charCodeAt(0));
  dataView.setUint8(10, 'V'.charCodeAt(0));
  dataView.setUint8(11, 'E'.charCodeAt(0));

  // fmt子块标识
  dataView.setUint8(12, 'f'.charCodeAt(0));
  dataView.setUint8(13, 'm'.charCodeAt(0));
  dataView.setUint8(14, 't'.charCodeAt(0));
  dataView.setUint8(15, ' '.charCodeAt(0));

  // fmt子块大小
  dataView.setUint32(16, 16, true);
  // 音频格式 (1 = PCM)
  dataView.setUint16(20, format, true);
  // 声道数
  dataView.setUint16(22, numChannels, true);
  // 采样率
  dataView.setUint32(24, sampleRate, true);
  // 字节率
  dataView.setUint32(28, sampleRate * blockAlign, true);
  // 数据块对齐
  dataView.setUint16(32, blockAlign, true);
  // 位深度
  dataView.setUint16(34, bitDepth, true);

  // data子块标识
  dataView.setUint8(36, 'd'.charCodeAt(0));
  dataView.setUint8(37, 'a'.charCodeAt(0));
  dataView.setUint8(38, 't'.charCodeAt(0));
  dataView.setUint8(39, 'a'.charCodeAt(0));

  // data子块大小
  dataView.setUint32(40, dataSize, true);

  // 写入音频数据
  let offset = 44;
  for (let i = 0; i < numChannels; i++) {
    const channelData = buffer.getChannelData(i);
    for (let j = 0; j < numSamples; j++) {
      const index = j * numChannels + i;
      const pcm = channelData[j] * 32767; // 转换为16位整数

      // 确保数值范围在-32768到32767之间
      const clampedPcm = Math.max(-32768, Math.min(32767, pcm));
      dataView.setInt16(offset + index * bytesPerSample, clampedPcm, true);
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// 添加一个音频格式转换工具函数
const convertAudioToWav = async (blob: Blob): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    try {
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          // 解码音频数据
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // 创建离线上下文
          const offlineAudioContext = new OfflineAudioContext({
            numberOfChannels: audioBuffer.numberOfChannels,
            length: audioBuffer.length,
            sampleRate: audioBuffer.sampleRate
          });

          // 创建音频源
          const source = offlineAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineAudioContext.destination);
          source.start(0);

          // 渲染音频
          const renderedBuffer = await offlineAudioContext.startRendering();

          // 转换为WAV格式
          const wavBlob = audioBufferToWav(renderedBuffer);
          resolve(wavBlob);
        } catch (error) {
          console.error('Error decoding audio:', error);
          reject(error);
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      // 开始读取文件
      fileReader.readAsArrayBuffer(blob);
    } catch (error) {
      console.error('Error in conversion:', error);
      reject(error);
    }
  });
};

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: File | null) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 120 // Default max duration: 2 minutes
}) => {
  const { t } = useTranslation('common');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setIsPreparing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 尝试找到支持的MIME类型
      let mimeType = 'audio/webm';  // 大多数浏览器支持webm
      const supportedMimeTypes = [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus'
      ];

      // First try to find a supported audio MIME type
      for (const type of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      console.log('Using audio mime type for recording:', mimeType);
      let mediaRecorder: MediaRecorder;

      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (error) {
        console.error('Failed to create MediaRecorder with selected MIME type, falling back to default:', error);
        // Fallback to default (browser will choose)
        mediaRecorder = new MediaRecorder(stream);
        console.log('Using fallback MIME type:', mediaRecorder.mimeType);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsConverting(true);
          const originalMimeType = mediaRecorder.mimeType;
          console.log('Recording completed with mime type:', originalMimeType);

          // Create the original Blob with the recorded data
          const recordedBlob = new Blob(audioChunksRef.current, { type: originalMimeType });

          // Set a temporary URL for preview
          const tempUrl = URL.createObjectURL(recordedBlob);
          setAudioURL(tempUrl);

          // Always convert to WAV for best compatibility
          console.log('Starting audio format conversion...');
          let finalBlob: Blob;

          try {
            finalBlob = await convertAudioToWav(recordedBlob);
            console.log('Conversion successful! Output format: audio/wav');
          } catch (conversionError) {
            console.error('Conversion failed, using original format:', conversionError);
            // If conversion fails, try to use the original format but force set as WAV
            finalBlob = new Blob([recordedBlob], { type: 'audio/wav' });
            console.warn('Using original audio data with forced WAV MIME type - this might cause issues');
          }

          // Create the final File object
          const audioFile = new File(
            [finalBlob],
            `recording-${Date.now()}.wav`,
            {
              type: 'audio/wav',
              lastModified: Date.now()
            }
          );

          console.log(`Created audio file: ${audioFile.name}, type: ${audioFile.type}, size: ${audioFile.size} bytes`);

          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());

          onRecordingComplete(audioFile);
          setIsConverting(false);
        } catch (error) {
          console.error('Error processing recording:', error);
          setIsPreparing(false);
          setIsConverting(false);
          alert('Error processing recording. Please try again.');

          // Stop all audio tracks
          stream.getTracks().forEach(track => track.stop());
        }
      };

      // 开始录制
      mediaRecorder.start(1000); // 每秒收集一次数据
      setIsRecording(true);
      setIsPreparing(false);

      // 设置计时器
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          // 达到最大时长时自动停止
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('访问麦克风出错:', error);
      setIsPreparing(false);
      alert('无法访问您的麦克风。请检查浏览器权限设置。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // 清除计时器
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setRecordingTime(0);
    onRecordingComplete(null);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  return (
    <div className="flex flex-col items-center w-full p-4 bg-muted rounded-lg border border-border">
      <div className="w-full mb-4">
        {isRecording ? (
          <div className="flex items-center justify-center mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-red-500 font-medium">Recording... {formatTime(recordingTime)}</span>
          </div>
        ) : isPreparing ? (
          <div className="flex items-center justify-center mb-2">
            <Spinner size="sm" className="mr-2" />
            <span>Preparing microphone...</span>
          </div>
        ) : isConverting ? (
          <div className="flex items-center justify-center mb-2">
            <Spinner size="sm" className="mr-2" />
            <span>Converting audio format...</span>
          </div>
        ) : audioURL ? (
          <div className="flex items-center justify-center mb-2">
            <span className="text-green-500 font-medium">Recording complete! {formatTime(recordingTime)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center mb-2">
            <span>Click the microphone button to start recording</span>
          </div>
        )}

        {audioURL && (
          <div className="w-full mb-3">
            <audio ref={audioRef} src={audioURL} controls className="w-full" />
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        {!isRecording && !audioURL && (
          <button
            onClick={startRecording}
            disabled={isPreparing}
            className={`px-4 py-2 rounded-full ${isPreparing ? 'bg-muted-foreground' : 'bg-red-500 hover:bg-red-600'} text-primary-foreground flex items-center transition-colors duration-300`}
          >
            <BiSolidMicrophone className="w-5 h-5 mr-2" />
            <span>{isPreparing ? 'Preparing...' : 'Start Recording'}</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center transition-colors duration-300"
          >
            <BiStopCircle className="w-5 h-5 mr-2" />
            <span>Stop</span>
          </button>
        )}

        {audioURL && (
          <button
            onClick={resetRecording}
            className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center transition-colors duration-300"
          >
            <BiReset className="w-5 h-5 mr-2" />
            <span>Record Again</span>
          </button>
        )}
      </div>

      {isConverting && (
        <div className="mt-3 text-xs text-muted-foreground">
          Converting WebM to WAV format for better compatibility...
        </div>
      )}

      {maxDuration && (
        <div className="mt-3 text-xs text-muted-foreground">
          Maximum recording duration: {formatTime(maxDuration)}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 