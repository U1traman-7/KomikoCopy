import React, { memo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { MdMenu } from 'react-icons/md';
import { BsGrid3X3Gap } from 'react-icons/bs';
import cn from 'classnames';
import { GenerationModel } from './types';
import { useCategorySelectorModal } from './useCategorySelectorModal';

interface GridData {
  category: string;
  labels: {
    label: string;
    value: string;
    prompt: string;
    image: string;
    requiresSeedream?: boolean;
    requiresBananaPro?: boolean;
  }[];
}

interface GridSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  gridData: GridData[];
  setModel?: (newModel: GenerationModel) => void;
}

const GridTag: React.FC<{
  gridItem: GridData['labels'][0];
  prompt: string;
  setPrompt: (prompt: string) => void;
  setModel?: (model: GenerationModel) => void;
  onClose?: () => void;
}> = memo(({ gridItem, prompt, setPrompt, setModel, onClose }) => {
  const { t } = useTranslation(['create', 'common']);

  const isSelected = prompt.includes(gridItem.value);

  const handleClick = () => {
    if (isSelected) {
      // Remove grid from prompt
      setPrompt(prompt.replace(gridItem.value, '').replace(/\s+/g, ' ').trim());
    } else {
      // Remove any existing grid first (only one grid at a time)
      const cleanedPrompt = prompt
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      // Add new grid
      const newPrompt = cleanedPrompt
        ? `${cleanedPrompt} ${gridItem.value}`
        : gridItem.value;
      setPrompt(newPrompt);

      // Switch model if required
      if (gridItem.requiresSeedream && setModel) {
        setModel('Seedream 4.5');
      } else if (gridItem.requiresBananaPro && setModel) {
        setModel('Gemini Pro');
      }

      // Close modal after selection
      if (onClose) {
        setTimeout(onClose, 200);
      }
    }
  };

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-200 ease-in-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'w-full',
      )}
      onClick={handleClick}>
      <div
        className={cn('w-full overflow-hidden rounded-lg', {
          'ring-2 ring-primary-500 ring-offset-1': isSelected,
        })}>
        <div className='relative w-full overflow-hidden bg-muted aspect-square'>
          <img
            src={gridItem.image}
            alt={gridItem.label}
            className='w-full h-full object-cover object-top'
            loading='lazy'
          />

          {/* Selection indicator */}
          {isSelected && (
            <div className='absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-primary-600 dark:bg-primary-500 rounded-bl-full flex items-center justify-center z-10 pointer-events-none'>
              <svg
                className='-mt-1 ml-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={3}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          )}

          {/* Model requirement badges */}
          {gridItem.requiresSeedream && (
            <Tooltip content='Seedream'>
              <div className='absolute top-0 left-0 rounded-tl-lg w-5 h-5 sm:w-6 sm:h-6 text-tiny rounded-br-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center'>
                <div className='-ml-1 -mt-1'>✨</div>
              </div>
            </Tooltip>
          )}
          {gridItem.requiresBananaPro && (
            <Tooltip content='Nano Banana Pro'>
              <div className='absolute top-0 left-0 rounded-tl-lg w-5 h-5 sm:w-6 sm:h-6 text-tiny rounded-br-full bg-blue-600 flex items-center justify-center'>
                <div className='-ml-1 -mt-1'>🍌</div>
              </div>
            </Tooltip>
          )}

          {/* Title overlay at bottom */}
          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-2 pb-1.5 z-10'>
            <div className='text-white font-medium text-xs leading-tight line-clamp-2 drop-shadow-md text-center px-[2px]'>
              {gridItem.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const GridSelectorModal: React.FC<GridSelectorModalProps> = memo(
  ({ isOpen, onClose, prompt, setPrompt, gridData, setModel }) => {
    const { t } = useTranslation(['create', 'common']);

    const {
      isMobile,
      activeTab,
      isCatMenuOpen,
      tabsContainerRef,
      contentRef,
      setIsCatMenuOpen,
      scrollToSection,
      setSectionRef,
      menuItems,
    } = useCategorySelectorModal({
      isOpen,
      categories: gridData,
    });

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size='4xl'
        scrollBehavior='inside'
        autoFocus={false}
        shouldBlockScroll={true}
        classNames={{
          body: 'p-0 md:pb-4',
          base: 'h-[80vh] md:h-[85vh] overflow-hidden',
          wrapper: !isOpen ? 'pointer-events-none' : '',
          backdrop: !isOpen ? 'pointer-events-none' : '',
        }}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1 pb-0'>
                <div className='flex items-center gap-2'>
                  <BsGrid3X3Gap className='w-5 h-5 text-primary dark:text-primary-500' />
                  <span>{t('choose_grid_layout') || 'Choose Grid Layout'}</span>
                </div>
              </ModalHeader>
              <ModalBody className='flex flex-col md:flex-row gap-0 overflow-hidden h-full md:pt-2'>
                {/* Mobile: Horizontal Tabs */}
                {isMobile && (
                  <div className='sticky top-0 z-10 bg-background px-2 flex-shrink-0'>
                    <div ref={tabsContainerRef} className='relative'>
                      {/* Mobile dropdown menu */}
                      <div className='absolute right-1 top-0 z-20'>
                        <Dropdown
                          isOpen={isCatMenuOpen}
                          onOpenChange={setIsCatMenuOpen}
                          shouldBlockScroll={false}>
                          <DropdownTrigger>
                            <Button
                              size='sm'
                              variant='flat'
                              isIconOnly
                              className='min-w-0 bg-background rounded-none'
                              onMouseEnter={() => setIsCatMenuOpen(true)}>
                              <MdMenu className='w-4 h-4 text-muted-foreground mt-1' />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label='Grid categories'
                            onAction={key => {
                              scrollToSection(key as string);
                              setIsCatMenuOpen(false);
                            }}
                            selectionMode='single'
                            items={gridData.map(c => ({
                              key: c.category,
                              name: c.category,
                            }))}>
                            {(item: { key: string; name: string }) => (
                              <DropdownItem
                                key={item.key}
                                textValue={item.name}>
                                {item.name}
                              </DropdownItem>
                            )}
                          </DropdownMenu>
                        </Dropdown>
                      </div>

                      <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={key =>
                          scrollToSection(key as string)
                        }
                        size='sm'
                        variant='underlined'
                        color='primary'
                        className='w-full pr-10 py-0'
                        classNames={{
                          tabList:
                            'relative w-full overflow-x-auto no-scrollbar flex-nowrap justify-start gap-0 border-b border-divider pb-0 scroll-smooth',
                          tab: 'flex-none shrink-0 px-3 py-0 whitespace-nowrap max-w-fit duration-300 text-sm',
                          cursor:
                            'w-full bg-primary transition-all duration-300 ease-out',
                          tabContent:
                            'text-xs group-data-[selected=true]:text-primary group-data-[selected=true]:dark:text-primary-500 duration-300',
                        }}>
                        {gridData.map(cat => (
                          <Tab key={cat.category} title={cat.category} />
                        ))}
                      </Tabs>
                    </div>
                  </div>
                )}

                {/* Desktop: Vertical Sidebar */}
                {!isMobile && (
                  <div className='flex-shrink-0 w-44 h-full border-r border-border bg-muted/30 overflow-y-auto'>
                    {gridData.map(category => (
                      <div
                        key={category.category}
                        className={cn(
                          'cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-muted/80',
                          activeTab === category.category
                            ? 'bg-background border-l-2 border-primary/60 text-foreground font-medium'
                            : 'text-muted-foreground border-l-2 border-transparent',
                        )}
                        onClick={() => scrollToSection(category.category)}>
                        {category.category}
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Area */}
                <div
                  ref={contentRef}
                  className='flex-1 overflow-y-auto p-4 md:pt-0 bg-background h-full'>
                  {/* All category sections */}
                  {gridData.map(category => (
                    <div
                      key={category.category}
                      ref={setSectionRef(category.category)}
                      className='mb-6 scroll-mt-4'>
                      <h3 className='text-sm font-semibold text-muted-foreground mb-2'>
                        {category.category}
                      </h3>
                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                        {category.labels.map(gridItem => (
                          <GridTag
                            key={gridItem.value}
                            gridItem={gridItem}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            setModel={setModel}
                            onClose={onClose}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {gridData.length === 0 && (
                    <div className='text-center py-12 text-muted-foreground'>
                      <BsGrid3X3Gap className='w-16 h-16 mx-auto mb-4 text-muted-foreground/40' />
                      <p className='text-lg font-medium mb-2'>
                        {t('no_grid_templates')}
                      </p>
                      <p className='text-sm'>
                        {t('no_grid_templates_description')}
                      </p>
                    </div>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  },
);

export default GridSelectorModal;
