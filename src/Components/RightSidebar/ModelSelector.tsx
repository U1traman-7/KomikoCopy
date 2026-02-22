/**
 * ModelSelector Component
 * Extracted from RightSidebar.tsx
 *
 * A standalone model selector component with:
 * - Model grid layout
 * - Category display
 * - Cost badges
 * - Feature tags
 * - Legacy models toggle
 * - Responsive design (mobile + desktop)
 */

import React, { useState, useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import cn from 'classnames';
import { BiSolidZap } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { GenerationModel } from './types';
import { MODEL_IMAGES } from './constants';
import {
  IMAGE_ANIMAGINE_XL_3_1,
  IMAGE_ART_PRO,
  IMAGE_GEMINI,
  IMAGE_ILLUSTRIOUS,
  IMAGE_KUSAXL,
  IMAGE_NOOBAI_XL,
  IMAGE_SEEDREAM,
  IMAGE_SEEDREAM_V4,
} from '../../../api/tools/_zaps';

// Model item type definition
export interface ModelItem {
  key: GenerationModel | 'category' | 'legacy-toggle';
  image: string;
  cost: number | string;
  features: string[];
  label?: string;
  isCategory?: boolean;
  suffix?: React.ReactNode;
  isLegacyToggle?: boolean;
  isLegacy?: boolean;
}

// Anime models that don't support grid layouts
export const ANIME_MODELS = [
  'Art Pro',
  'Art Unlimited',
  'Animagine',
  'Illustrious',
  'Noobai',
  'KusaXL',
] as const;

interface ModelSelectorProps {
  /** Currently selected model key */
  selectedModel: string;
  /** Display name for the selected model */
  displayModel: string;
  /** Image URL for the selected model */
  modelImage: string;
  /** Callback when a model is selected */
  onModelSelect: (modelKey: GenerationModel, modelImg: string) => void;
  /** Whether the popover is open */
  isOpen: boolean;
  /** Callback when popover open state changes */
  onOpenChange: (open: boolean) => void;
  /** Whether in mobile view */
  isMobile?: boolean;
  /** Whether button is in a row layout */
  isButtonInRow?: boolean;
  /** Whether page is currently scrolling (prevents auto-close) */
  isScrolling?: boolean;
  /** Whether to exclude anime models (models that don't support grid) */
  excludeAnimeModels?: boolean;
  /** Whether to hide category headers and legacy toggle */
  hideCategoriesAndLegacy?: boolean;
  /** List of allowed model keys to display. If provided, only these models will be shown */
  allowedModels?: string[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  displayModel,
  modelImage,
  onModelSelect,
  isOpen,
  onOpenChange,
  isMobile = false,
  isButtonInRow = false,
  isScrolling = false,
  excludeAnimeModels = false,
  hideCategoriesAndLegacy = false,
  allowedModels,
}) => {
  const { t } = useTranslation(['create']);
  const [showLegacyModels, setShowLegacyModels] = useState(false);

  // Models array defined internally
  const models = useMemo<ModelItem[]>(
    () => [
      {
        key: 'Auto Model',
        image: MODEL_IMAGES['Auto Model'],
        cost: '15-80',
        features: ['Character preset', 'Multiple OC'],
      },
      {
        key: 'Gemini Pro',
        image: MODEL_IMAGES['Gemini Pro'],
        label: '🔥 Nano Banana Pro',
        cost: '300-500',
        features: ['Multiple OC', 'Reference image'],
      },
      {
        key: 'category',
        image: '',
        cost: 0,
        features: [],
        label: '🌸 ' + t('create:anime_models'),
        suffix: (
          <span className='font-normal'>
            (
            <a
              href='https://komiko-app.notion.site/AI-Art-Generator-26b4d853a19f80c08e9ff0e8c9e903b3'
              target='_blank'
              className='text-primary-500 hover:text-primary-600'
              rel='noopener noreferrer'>
              {t('create:how_to_guide')}
            </a>
            )
          </span>
        ),
        isCategory: true,
      },
      {
        key: 'Art Pro',
        image: MODEL_IMAGES['Art Pro'],
        cost: IMAGE_ART_PRO,
        features: ['Character preset', 'Anime style', 'Danbooru tags'],
      },
      {
        key: 'Art Unlimited',
        image: MODEL_IMAGES['Art Unlimited'],
        cost: IMAGE_ART_PRO,
        features: ['Character preset', 'Anime style', 'NSFW', 'Danbooru tags'],
      },
      {
        key: 'category',
        image: '',
        cost: 0,
        features: [],
        label: '✨ ' + t('create:general_models'),
        isCategory: true,
      },
      {
        key: 'Seedream 4.5',
        image: MODEL_IMAGES['Seedream 4.5'],
        cost: IMAGE_SEEDREAM,
        features: ['Multiple OC', 'NSFW', 'Reference image'],
      },
      {
        key: 'Gemini',
        image: MODEL_IMAGES['Gemini'],
        label: 'Gemini (Nano Banana)',
        cost: IMAGE_GEMINI,
        features: ['Multiple OC', 'Reference image'],
      },
      {
        key: 'legacy-toggle',
        image: '',
        cost: 0,
        features: [],
        label: 'View Legacy Models',
        isLegacyToggle: true,
      },
      {
        key: 'Seedream 4',
        image: MODEL_IMAGES['Seedream 4'],
        cost: IMAGE_SEEDREAM_V4,
        features: ['Multiple OC', 'NSFW', 'Reference image'],
        isLegacy: true,
      },
      {
        key: 'Animagine',
        image: MODEL_IMAGES['Animagine'],
        cost: IMAGE_ANIMAGINE_XL_3_1,
        features: ['Character preset', 'Anime Style', 'Danbooru tags'],
        isLegacy: true,
      },
      {
        key: 'Illustrious',
        image: MODEL_IMAGES['Illustrious'],
        cost: IMAGE_ILLUSTRIOUS,
        features: ['Character preset', 'Anime Style', 'NSFW', 'Danbooru tags'],
        isLegacy: true,
      },
      {
        key: 'Noobai',
        image: MODEL_IMAGES['Noobai'],
        cost: IMAGE_NOOBAI_XL,
        features: ['Character preset', 'Anime Style', 'Danbooru tags'],
        isLegacy: true,
      },
      {
        key: 'KusaXL',
        image: MODEL_IMAGES['KusaXL'],
        cost: IMAGE_KUSAXL,
        features: ['Character preset', 'Anime style', 'NSFW', 'Danbooru tags'],
        isLegacy: true,
      },
    ],
    [t],
  );

  return (
    <Popover
      placement='bottom-start'
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open && isScrolling) {
          return;
        }
        onOpenChange(open);
      }}
      offset={12}
      shouldFlip={true}
      triggerType='menu'
      shouldBlockScroll={false}
      backdrop='transparent'>
      <PopoverTrigger>
        <div
          className={cn(
            'flex justify-center items-center p-0 m-0 text-sm font-medium text-white bg-transparent bg-center bg-cover transition-opacity cursor-pointer rounded-[10px] hover:opacity-90',
            { 'w-1/2': isMobile, 'w-[110px]': !isMobile },
            { 'ring-2 ring-primary-300': isOpen },
            { 'flex-1': isButtonInRow },
          )}
          style={{
            backgroundImage: `url(${modelImage})`,
            textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
            height: isMobile ? '34px' : '37px',
          }}>
          <span className='truncate max-w-[90px] drop-shadow-md'>
            {displayModel}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className='!p-4 rounded-xl justify-start max-w-[420px] outline-none border border-border shadow-lg max-h-[458px] overflow-y-auto'>
        <div className='grid grid-cols-2 gap-2 w-full'>
          {models
            .filter(modelItem => {
              // If allowedModels is provided, include legacy models that are in the list
              if (allowedModels && allowedModels.length > 0) {
                return true; // Don't filter legacy here, let the next filter handle it
              }
              return !modelItem.isLegacy || showLegacyModels;
            })
            .filter(modelItem => {
              // If allowedModels is provided, only show models in that list
              // Also hide categories and legacy toggle when using allowedModels
              if (allowedModels && allowedModels.length > 0) {
                if (modelItem.isCategory || modelItem.isLegacyToggle) {
                  return false;
                }
                return allowedModels.includes(modelItem.key as string);
              }
              // Filter out categories and legacy toggle if hideCategoriesAndLegacy is true
              if (hideCategoriesAndLegacy && (modelItem.isCategory || modelItem.isLegacyToggle)) {
                return false;
              }
              // Filter out anime models if excludeAnimeModels is true
              if (excludeAnimeModels && !modelItem.isCategory && !modelItem.isLegacyToggle) {
                return !ANIME_MODELS.includes(modelItem.key as typeof ANIME_MODELS[number]);
              }
              return true;
            })
            .map((modelItem, index) => {
              if (modelItem.isCategory) {
                return (
                  <div
                    key={`category-${index}`}
                    className='col-span-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
                    <span>{modelItem.label}</span>
                    {modelItem.suffix && modelItem.suffix}
                  </div>
                );
              }

              if (modelItem.isLegacyToggle) {
                return (
                  <div
                    key={`legacy-toggle-${index}`}
                    className='col-span-2 flex items-center gap-2 text-sm font-medium text-blue-600 mt-2 mb-1 cursor-pointer hover:text-blue-700 hover:underline transition-colors'
                    onClick={() => setShowLegacyModels(!showLegacyModels)}>
                    <span>
                      {showLegacyModels ? '▼' : '▶'} {modelItem.label}
                    </span>
                  </div>
                );
              }

              const isSelected = selectedModel === modelItem.key;
              return (
                <div
                  key={modelItem.key}
                  className={cn(
                    'relative flex flex-col justify-between cursor-pointer max-w-full min-w-[140px] min-h-[80px] rounded-lg text-white bg-cover bg-center transition-all duration-200 p-3 h-full',
                    'hover:scale-[1.02] hover:shadow-lg',
                    isSelected
                      ? 'ring-2 ring-primary-400 ring-offset-2 shadow-lg'
                      : 'hover:ring-1 hover:ring-primary-200',
                  )}
                  onClick={() =>
                    onModelSelect(
                      modelItem.key as GenerationModel,
                      modelItem.image,
                    )
                  }
                  style={{
                    backgroundImage: `url(${modelItem.image})`,
                  }}>
                  {/* Gradient overlay */}
                  <div className='absolute inset-0 bg-gradient-to-t rounded-lg from-black/80 via-black/30 to-primary-800/10'></div>

                  {/* Content */}
                  <div className='flex relative z-10 flex-col justify-between h-full'>
                    {/* Top: Model name and cost */}
                    <div className='flex justify-between items-start mb-1'>
                      <div
                        className='text-xs font-bold md:text-sm'
                        style={{
                          textShadow: '1px 2px 4px rgba(0,0,0,0.8)',
                        }}>
                        {modelItem.label || modelItem.key}
                      </div>
                      <div className='bg-orange-500 text-primary-foreground rounded-full px-1.5 py-0 flex gap-1 items-center font-medium md:font-semibold text-xs shadow-md text-nowrap'>
                        <BiSolidZap className='w-2.5 h-2.5 text-primary-foreground' />
                        <span>{modelItem.cost}</span>
                      </div>
                    </div>

                    {/* Bottom: Feature tags */}
                    <div className='flex gap-1.5 flex-wrap text-[12px] md:text-sm'>
                      {modelItem.features.map(
                        (feature: string, featureIndex) => {
                          let importance = '';
                          if (
                            feature === 'Character preset' ||
                            feature === 'Multiple OC' ||
                            feature === 'Single OC'
                          ) {
                            importance = 'bg-card/95 text-foreground';
                          } else if (feature === 'All languages') {
                            importance = 'bg-card/85 text-foreground';
                          } else {
                            importance = 'bg-card/75 text-muted-foreground';
                          }
                          return (
                            <div
                              key={featureIndex}
                              className={cn(
                                'p-1 py-0 font-medium rounded-full border shadow-sm backdrop-blur-sm text-[10px] border-white/20',
                                importance,
                              )}>
                              {feature}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

