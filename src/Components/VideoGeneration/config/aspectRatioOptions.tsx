import { ImageToVideoModel, TextToVideoModel } from '../../../../api/tools/_zaps';
import { getModelConfig } from './modelConfig';

export const getAspectRatioOptions = (
  selectedModel: ImageToVideoModel | TextToVideoModel,
) => {
  const config = getModelConfig(selectedModel);
  const aspectRatios = config.aspectRatioOptions || ['16:9', '9:16'];

  const iconMap: Record<string, JSX.Element> = {
    '1:1': (
      <div className='w-[15px] h-[15px] rounded-sm border border-current'></div>
    ),
    '4:3': (
      <div className='w-[16px] h-[12px] rounded-sm border border-current'></div>
    ),
    '16:9': (
      <div className='w-[16px] h-[9px] rounded-sm border border-current'></div>
    ),
    '21:9': (
      <div className='w-[18px] h-[8px] rounded-sm border border-current'></div>
    ),
    '9:16': (
      <div className='w-[9px] h-[16px] rounded-sm border border-current'></div>
    ),
    '3:4': (
      <div className='w-[12px] h-[16px] rounded-sm border border-current'></div>
    ),
    '9:21': (
      <div className='w-[8px] h-[18px] rounded-sm border border-current'></div>
    ),
  };

  return aspectRatios.map(ratio => ({
    key: ratio,
    label: ratio,
    icon: iconMap[ratio],
  }));
};

