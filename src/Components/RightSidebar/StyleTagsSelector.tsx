import React, { memo, useState, useEffect, Key } from 'react';
import { Tabs, Tab, Link, cn } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import PromptTag from './PromptTag';
import { LabelData, GenerationModel } from './types';

interface TagCategoryPanelProps {
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  category: LabelData;
  children?: React.ReactNode;
  isKusa?: boolean;
  setModel?: (newModel: GenerationModel) => void;
}

/** Renders a single category's tag list (private, not exported) */
const TagCategoryPanel: React.FC<TagCategoryPanelProps> = ({
  prompt,
  setPrompt,
  category,
  children,
  isKusa = false,
  setModel,
}) => {
  const { t } = useTranslation('create');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return (
    <div className={cn('overflow-y-auto h-full p-2 md:p-3')}>
      {category.key === 'General' && (
        <p className='text-sm ml-2 mb-2 text-muted-foreground'>
          {t('explore_more_style')}{' '}
          <Link
            size='sm'
            target='_blank'
            showAnchorIcon
            href='https://www.downloadmost.com/NoobAI-XL/danbooru-artist/'
            underline='always'>
            {t('here')}
          </Link>
          {t('only_for_Animagine_and_Illustrious')}
        </p>
      )}
      <div
        className={cn(
          'gap-2',
          category.isKusa ? 'grid grid-cols-2' : 'flex flex-wrap',
        )}>
        {category.labels?.map(
          (
            labelItem:
              | string
              | { label: string; value: string; kusaSpecial?: boolean },
            index: number,
          ) => (
            <PromptTag
              labelItem={labelItem}
              key={typeof labelItem === 'string' ? labelItem : labelItem.value}
              prompt={prompt}
              setPrompt={setPrompt}
              isKusa={isKusa}
              isMobile={isMobile}
              setModel={setModel}
            />
          ),
        )}
      </div>
    </div>
  );
};

interface StyleTagsSelectorProps {
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  labelsData: LabelData[];
  setModel?: (newModel: GenerationModel) => void;
}

/** Tabbed selector for style/quality/camera prompt tags */
export const StyleTagsSelector: React.FC<StyleTagsSelectorProps> = memo(
  ({ prompt, setPrompt, labelsData, setModel }) => {
    const [category, setCategory] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);

      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }, []);

    return labelsData.length === 1 ? (
      <TagCategoryPanel
        prompt={prompt}
        setPrompt={setPrompt}
        category={labelsData[0]}
        setModel={setModel}
      />
    ) : (
      <Tabs
        fullWidth={false}
        placement='start'
        className={cn(
          'overflow-y-auto overflow-x-hidden flex-shrink-0',
          isMobile ? 'max-w-18' : 'max-w-24',
        )}
        aria-label='Categories'
        disableAnimation
        size='sm'
        variant='light'
        color='default'
        classNames={{
          tab: cn(
            'rounded-lg transition-all duration-200 hover:bg-muted active:bg-muted data-[selected=true]:bg-muted',
            isMobile ? 'py-1 px-2' : 'py-2 px-1 h-auto',
          ),
          tabContent: cn(
            'group-data-[selected=true]:text-foreground font-medium',
            isMobile ? 'text-xs' : 'text-sm',
          ),
          cursor: 'bg-muted shadow-none w-full',
          panel: cn('max-w-full pt-0 h-full overflow-hidden p-0'),
          tabList: cn(
            'border-r border-border rounded-r-none p-0 h-full pb-12 pr-1 pt-1',
          ),
          wrapper: 'h-full',
          base: 'h-full',
        }}
        onSelectionChange={(key: Key) => {
          setCategory(key as string);
        }}
        selectedKey={category}>
        {labelsData?.map((category, index) => (
          <Tab
            key={category.category}
            title={
              <div className='flex justify-center items-center w-full h-full text-center'>
                <span
                  className={cn(
                    'text-nowrap transition-all group-data-[selected=true]:font-medium text-xs text-foreground',
                  )}>
                  {category.category}
                </span>
              </div>
            }
            className='m-0'>
            <TagCategoryPanel
              prompt={prompt}
              setPrompt={setPrompt}
              category={category}
              isKusa={category.isKusa}
              setModel={setModel}
            />
          </Tab>
        ))}
      </Tabs>
    );
  },
);

StyleTagsSelector.displayName = 'StyleTagsSelector';

// Backward compatibility alias
export const LabelsSelector = StyleTagsSelector;
