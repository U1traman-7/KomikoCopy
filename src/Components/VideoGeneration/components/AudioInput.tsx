import { Tabs, Tab } from '@nextui-org/react';
import { FaUpload } from 'react-icons/fa';
import { BiSolidMicrophone, BiSolidZap } from 'react-icons/bi';
import UploadAudio from '../../ToolsPage/UploadAudio';
import AudioRecorder from '../../ToolsPage/AudioRecorder';

interface AudioInputProps {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  accept?: string;
  maxDuration?: number;
  maxSizeMB?: number;
  hints?: {
    zapReminder?: string;
    sizeInfo?: string;
  };
  t: (key: string) => string;
  className?: string;
}

export default function AudioInput({
  value,
  onChange,
  label,
  accept = '.mp3,.wav',
  maxDuration = 30,
  maxSizeMB = 15,
  hints,
  t,
  className = '',
}: AudioInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className='block mb-2 font-bold text-foreground text-sm'>
          {label}
        </label>
      )}

      <Tabs aria-label='Audio Input Options' size='sm'>
        <Tab
          key='upload'
          title={
            <div className='flex gap-2 items-center'>
              <FaUpload size={16} />
              <span>{t('upload')}</span>
            </div>
          }>
          <UploadAudio
            onChange={onChange}
            initialAudio={value}
            accept={accept}
            className='border-border'
            removable={true}
            limit={maxSizeMB}
            enforceLimit={true}
            onRemove={() => onChange(null)}
          />
        </Tab>
        <Tab
          key='record'
          title={
            <div className='flex gap-2 items-center'>
              <BiSolidMicrophone size={16} />
              <span>{t('record')}</span>
            </div>
          }>
          <AudioRecorder
            onRecordingComplete={file => onChange(file || null)}
            maxDuration={maxDuration}
          />
        </Tab>
      </Tabs>

      {hints && (hints.zapReminder || hints.sizeInfo) && (
        <div className='mt-2 space-y-1 text-xs text-muted-foreground'>
          {hints.zapReminder && (
            <div className='flex items-center'>
              <BiSolidZap className='mr-1 text-orange-400' />
              <span className='text-xs md:text-sm'>{hints.zapReminder}</span>
            </div>
          )}
          {hints.sizeInfo && <p>{hints.sizeInfo}</p>}
        </div>
      )}
    </div>
  );
}

