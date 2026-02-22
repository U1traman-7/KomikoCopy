import { MdAccessTime } from 'react-icons/md';
import { ImageToVideoModel, TextToVideoModel } from '../../../../api/tools/_zaps';
import { getModelConfig } from './modelConfig';

export const getDurationOptions = (
  model: ImageToVideoModel | TextToVideoModel,
) => {
  const config = getModelConfig(model);
  const durationOptions = config.durationOptions || [5];

  return durationOptions.map(duration => ({
    key: String(duration),
    label: `${duration}s`,
    icon: <MdAccessTime className='w-4 h-4' />,
  }));
};

