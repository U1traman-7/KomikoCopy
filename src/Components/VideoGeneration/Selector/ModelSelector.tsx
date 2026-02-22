import { Chip } from '@nextui-org/react';
import { BiSolidZap } from 'react-icons/bi';
import KoSelect, { SelectItem as KoSelectItem } from '../../KoSelect';
import { ImageToVideoModel } from '../../../../api/tools/_zaps';
import { useTranslation } from 'react-i18next';
import { ModelOption } from '../config/modelOptions';

interface ModelSelectorProps {
  selectedModel: ImageToVideoModel;
  modelOptions: ModelOption[];
  onModelChange: (model: ImageToVideoModel) => void;
  t: (key: string) => string;
  className?: string;
  duration?: number;
  /** Compact mode: no label, smaller trigger, inline-friendly */
  compact?: boolean;
  /** Large mode: same height as RightSidebar model selector (h-9/37px) */
  large?: boolean;
}

const getOptionKey = (opt: ModelOption) => `${opt.model}`;

export default function ModelSelector({
  selectedModel,
  modelOptions,
  onModelChange,
  t,
  className = '',
  duration,
  compact = false,
  large = false,
}: ModelSelectorProps) {
  const { t: commonT } = useTranslation('common');

  // Guard against empty modelOptions
  if (!modelOptions || modelOptions.length === 0) {
    return null;
  }

  const selectedOption = modelOptions.find(o => o.model === selectedModel);
  const selectedOptionKey = selectedOption
    ? getOptionKey(selectedOption)
    : getOptionKey(modelOptions[0]);

  // Check if selected model is a VIDU variant
  const isViduModel =
    selectedModel === ImageToVideoModel.VIDU ||
    selectedModel === ImageToVideoModel.VIDU_Q2 ||
    selectedModel === ImageToVideoModel.VIDU_Q2_MULTI ||
    selectedModel === ImageToVideoModel.VIDU_Q2_PRO ||
    (selectedModel as any) === 'VIDU' ||
    (selectedModel as any) === 'VIDU_Q2';

  // Show BGM hint only for VIDU models when duration is 4 seconds
  const showBGMHint = isViduModel && duration === 4;

  return (
    <div className={className}>
      {!compact && (
        <>
          <label className='block text-sm font-bold text-foreground mb-1'>
            {t('ui.input.model.label')}
          </label>
          {showBGMHint && (
            <p className='text-xs text-muted-foreground mb-1'>
              {commonT('bgmAvailableFor4SecondVideosOnly')}
            </p>
          )}
        </>
      )}
      <KoSelect
        placeholder={t('ui.input.model.placeholder')}
        selectedKeys={[selectedOptionKey]}
        className={compact || large ? 'w-auto min-w-[140px]' : 'w-full'}
        onSelectionChange={keys => {
          const selectedKey = Array.from(keys)[0] as string;
          const opt = modelOptions.find(o => getOptionKey(o) === selectedKey);
          if (opt) {
            onModelChange(opt.model);
          }
        }}
        aria-label={t('ui.input.model.ariaLabel')}
        classNames={{
          trigger: large
            ? 'h-[37px] min-h-[37px] px-3 bg-default-100 hover:bg-default-200 border border-transparent dark:bg-primary-400/10 dark:border-primary-400/30 dark:hover:bg-primary-400/20 dark:text-foreground rounded-[10px]'
            : compact
              ? 'h-[34px] px-3 bg-default-100 hover:bg-default-200 border border-transparent dark:bg-primary-400/10 dark:border-primary-400/30 dark:hover:bg-primary-400/20 dark:text-foreground'
              : 'bg-input hover:bg-muted border-border hover:border-primary-500 transition-all duration-300',
          listboxWrapper: '!max-h-[520px] overflow-y-auto min-w-[380px]',
        }}
        renderValue={() => {
          const opt = modelOptions.find(
            o => getOptionKey(o) === selectedOptionKey,
          );
          return (
            <div className='flex gap-2 items-center'>
              {opt?.icon && (
                <img
                  src={opt.icon}
                  alt={opt?.name || 'Model'}
                  className={compact || large ? 'w-5 h-5' : 'w-6 h-6'}
                />
              )}
              <span
                className={
                  compact || large
                    ? 'text-sm font-medium text-foreground'
                    : 'text-foreground'
                }>
                {opt?.name || 'Model'}
              </span>
            </div>
          );
        }}>
        {modelOptions.map((option: ModelOption) => (
          <KoSelectItem
            key={getOptionKey(option)}
            itemKey={getOptionKey(option)}
            value={getOptionKey(option)}
            textValue={option.name}>
            <div className='flex gap-2 w-full items-center'>
              {option.icon && (
                <img
                  src={option.icon}
                  alt={option.name}
                  className='flex-shrink-0 mt-1 w-6 h-6'
                />
              )}
              <div className='flex flex-col flex-1 min-w-0'>
                <div className='flex justify-between items-center w-full'>
                  <span className='flex-1 pr-2 min-w-0 text-sm font-medium truncate'>
                    {option.name}
                  </span>
                  <div className='flex flex-wrap items-center justify-end gap-1 text-xs leading-tight'>
                    {option.duration && (
                      <Chip
                        size='sm'
                        color='primary'
                        variant='flat'
                        className='px-1 py-0.5 leading-none text-[10px]'>
                        {option.duration}
                      </Chip>
                    )}
                    {option.hasAudio && (
                      <Chip
                        size='sm'
                        color='success'
                        variant='flat'
                        className='px-1 py-0.5 leading-none text-xs'>
                        {commonT('audio')}
                      </Chip>
                    )}
                    {option.hasNSFW && (
                      <Chip
                        size='sm'
                        color='danger'
                        variant='flat'
                        className='px-1 py-0.5 leading-none text-[10px]'>
                        {commonT('NSFW')}
                      </Chip>
                    )}
                    {option.supportsMultipleReferenceImages && (
                      <Chip
                        size='sm'
                        color='secondary'
                        variant='flat'
                        className='px-1 py-0.5 leading-none text-[10px]'>
                        {commonT('multipleReferences')}
                      </Chip>
                    )}
                    {option.supportsFirstLastFrame && (
                      <Chip
                        size='sm'
                        color='secondary'
                        variant='flat'
                        className='px-1 py-0.5 leading-none text-[10px]'>
                        {commonT('endFrame')}
                      </Chip>
                    )}
                    <Chip
                      size='sm'
                      color='warning'
                      variant='flat'
                      className='px-1 py-0.5 leading-none text-[10px]'
                      startContent={
                        <BiSolidZap className='mr-0 w-3 h-3 text-orange-400' />
                      }>
                      {option.dollars}
                    </Chip>
                  </div>
                </div>
                {option.description && (
                  <span className='text-xs text-default-400 mt-0.5'>
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          </KoSelectItem>
        ))}
      </KoSelect>
    </div>
  );
}
