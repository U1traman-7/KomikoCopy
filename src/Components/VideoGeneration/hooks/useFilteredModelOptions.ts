import { useMemo, useEffect } from 'react';
import { ImageToVideoModel } from '../../../../api/tools/_zaps';
import { getModelConfig } from '../config/modelConfig';
import { ModelOption } from '../config/modelOptions';

// Support both old format (url) and new ReferenceItem format (previewUrl)
interface ReferenceImage {
  id: string;
  url?: string;
  previewUrl?: string;
  name: string;
  file?: File;
  characterId?: string;
  isCharacter?: boolean;
}

interface UseFilteredModelOptionsParams {
  allModelOptions: ModelOption[];
  referenceImages: ReferenceImage[];
  endFrameImage: string;
  selectedModel: ImageToVideoModel;
  onModelChange: (model: ImageToVideoModel) => void;
}

/**
 * Hook to filter model options based on input state (end frame, multiple images, character count)
 * and auto-switch model when current selection is no longer available.
 *
 * Shared between QuickCreatePanel and ImageOrTextToVideoConvert.
 */
export function useFilteredModelOptions({
  allModelOptions,
  referenceImages,
  endFrameImage,
  selectedModel,
  onModelChange,
}: UseFilteredModelOptionsParams) {
  // Calculate character image count
  const characterImageCount = useMemo(() => {
    return referenceImages.filter(img => img.isCharacter).length;
  }, [referenceImages]);

  // Filter model options based on input
  const filteredModelOptions = useMemo(() => {
    let filteredOptions = [...allModelOptions];

    // Filter based on end frame
    if (endFrameImage) {
      filteredOptions = filteredOptions.filter(
        opt => getModelConfig(opt.model).supportsEndFrame,
      );
    }
    // Filter based on multiple reference images (2+ images)
    else if (referenceImages.length >= 2) {
      filteredOptions = filteredOptions.filter(opt => {
        const config = getModelConfig(opt.model);
        if (!config.supportsMultipleReferenceImages) return false;
        const maxImages = config.maxReferenceImages || 7;
        return referenceImages.length <= maxImages;
      });
    }
    // Filter based on multiple characters (2+ OCs)
    else if (characterImageCount >= 2) {
      filteredOptions = filteredOptions.filter(
        opt => getModelConfig(opt.model).supportsMultipleReferenceImages,
      );
    }

    return filteredOptions;
  }, [endFrameImage, referenceImages.length, characterImageCount, allModelOptions]);

  // Auto-switch model when current model is not available in filtered list
  useEffect(() => {
    const availableModels = filteredModelOptions.map(opt => opt.model);
    if (
      !availableModels.includes(selectedModel) &&
      filteredModelOptions.length > 0
    ) {
      onModelChange(filteredModelOptions[0].model);
    }
  }, [filteredModelOptions, selectedModel, onModelChange]);

  return {
    filteredModelOptions,
    characterImageCount,
  };
}
