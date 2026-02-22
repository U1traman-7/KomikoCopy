import React, { memo, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  cn,
  Tabs,
  Tab,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { IoMdAdd } from 'react-icons/io';
import { MdMenu, MdEdit, MdClose, MdRefresh } from 'react-icons/md';
import { AiOutlineStar } from 'react-icons/ai';
import toast from 'react-hot-toast';
import PromptTag from './PromptTag';
import { GenerationModel, LabelData } from './types';
import { useCustomStyles } from './useCustomStyles';
import { useFavoriteStyles } from './useFavoriteStyles';
import { useCategorySelectorModal } from './useCategorySelectorModal';
import { FaCheck } from 'react-icons/fa';
import { IoCheckmark } from 'react-icons/io5';
import { profileAtom } from '../../state';
import { KUSA_STYLES } from '../../../api/_constants';

// 构建 value -> KUSA_STYLES.id 映射表（仅执行一次）
const VALUE_TO_KUSA_ID: Record<string, string> = {};
for (const style of KUSA_STYLES) {
  VALUE_TO_KUSA_ID[style.value] = style.id;
}

// 获取 labelItem 对应的 styleId
function getStyleId(
  labelItem: string | { label: string; value: string; [key: string]: any },
  isKusa: boolean,
): string | undefined {
  const value = typeof labelItem === 'string' ? labelItem : labelItem.value;
  if (isKusa) {
    return VALUE_TO_KUSA_ID[value];
  }
  // 非 kusa 的 tag style 用 value 本身作为 styleId
  return value;
}

interface StyleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  setPrompt: (newPrompt: string) => void;
  styles: LabelData[];
  setModel?: (newModel: GenerationModel) => void;
  onLoginOpen?: () => void;
}

export const StyleSelectorModal: React.FC<StyleSelectorModalProps> = memo(
  ({ isOpen, onClose, prompt, setPrompt, styles, setModel, onLoginOpen }) => {
    const { t } = useTranslation(['create', 'common']);
    const profile = useAtomValue(profileAtom);
    const userId = profile?.id || null;

    const {
      isMobile,
      activeTab,
      isCatMenuOpen,
      tabsContainerRef,
      contentRef,
      setIsCatMenuOpen,
      scrollToSection,
      setSectionRef,
    } = useCategorySelectorModal({
      isOpen,
      categories: styles,
      includeCustomTab: true,
    });

    const {
      customStyles,
      newCustomStyle,
      setNewCustomStyle,
      isLoading,
      isSaving,
      editingStyle,
      editValue,
      setEditValue,
      deletingStyle,
      loadOnce,
      refresh,
      addStyle,
      deleteStyle,
      startEdit,
      cancelEdit,
      saveEdit,
    } = useCustomStyles();

    const {
      favoriteStyleIds,
      isLoading: isFavLoading,
      togglingStyleId,
      loadOnce: loadOnceFavorites,
      isFavorite,
      toggleFavorite,
    } = useFavoriteStyles({ userId, onLoginRequired: onLoginOpen });

    // Load custom styles and favorites once when modal opens
    useEffect(() => {
      if (isOpen) {
        loadOnce();
        loadOnceFavorites();
      }
    }, [isOpen, loadOnce, loadOnceFavorites]);

    // 收集所有收藏的样式 items，用于"收藏"分类展示
    const favoriteItems = useMemo(() => {
      if (favoriteStyleIds.size === 0) return { kusaItems: [], tagItems: [] };

      const kusaItems: Array<{
        labelItem: { label: string; value: string; image?: string; kusaSpecial?: boolean; requiresSeedream?: boolean; requiresBananaPro?: boolean };
        styleId: string;
      }> = [];
      const tagItems: Array<{
        labelItem: string | { label: string; value: string };
        styleId: string;
      }> = [];

      for (const category of styles) {
        for (const labelItem of category.labels) {
          const styleId = getStyleId(labelItem, !!category.isKusa);
          if (styleId && favoriteStyleIds.has(styleId)) {
            if (category.isKusa && typeof labelItem === 'object') {
              kusaItems.push({ labelItem, styleId });
            } else {
              tagItems.push({ labelItem, styleId });
            }
          }
        }
      }

      return { kusaItems, tagItems };
    }, [styles, favoriteStyleIds]);

    const handleSaveEdit = async () => {
      const result = await saveEdit();
      // Update prompt if old style was used
      if (result.success && result.oldStyle && result.newStyle) {
        if (prompt.includes(result.oldStyle)) {
          setPrompt(prompt.replace(result.oldStyle, result.newStyle));
        }
      }
    };

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
                {t('choose_style') || 'Choose Style'}
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
                            aria-label='Style categories'
                            onAction={key => {
                              scrollToSection(key as string);
                              setIsCatMenuOpen(false);
                            }}
                            selectionMode='single'
                            items={[
                              {
                                key: 'favorites',
                                name: t('favorites') || 'Favorites',
                              },
                              ...styles.map(c => ({
                                key: c.category,
                                name: c.category,
                              })),
                              {
                                key: 'custom',
                                name: t('custom_style') || 'Custom',
                              },
                            ]}>
                            {(item: { key: string; name: string }) => (
                              <DropdownItem
                                key={item.key}
                                textValue={item.name}
                                className='capitalize'>
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
                            'text-xs group-data-[selected=true]:text-primary group-data-[selected=true]:dark:text-primary-500 duration-300 capitalize',
                        }}>
                        <Tab
                          key='favorites'
                          title={t('favorites') || 'Favorites'}
                        />
                        {styles.map(cat => (
                          <Tab key={cat.category} title={cat.category} />
                        ))}
                        <Tab
                          key='custom'
                          title={t('custom_style') || 'Custom'}
                        />
                      </Tabs>
                    </div>
                  </div>
                )}

                {/* Desktop: Vertical Sidebar */}
                {!isMobile && (
                  <div className='flex-shrink-0 w-44 h-full border-r border-border bg-muted/30 overflow-y-auto'>
                    {/* 收藏分类 - 置顶 */}
                    <div
                      className={cn(
                        'cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-muted/80 flex items-center gap-1.5',
                        activeTab === 'favorites'
                          ? 'bg-background border-l-2 border-primary/60 text-foreground font-medium'
                          : 'text-muted-foreground border-l-2 border-transparent',
                      )}
                      onClick={() => scrollToSection('favorites')}>
                      <AiOutlineStar className='w-3.5 h-3.5' />
                      {t('favorites') || 'Favorites'}
                    </div>
                    {styles.map(category => (
                      <div
                        key={category.category}
                        className={cn(
                          'cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-muted/80 capitalize',
                          activeTab === category.category
                            ? 'bg-background border-l-2 border-primary/60 text-foreground font-medium'
                            : 'text-muted-foreground border-l-2 border-transparent',
                        )}
                        onClick={() => scrollToSection(category.category)}>
                        {category.category}
                      </div>
                    ))}
                    <div
                      className={cn(
                        'cursor-pointer px-4 py-2.5 text-sm transition-colors hover:bg-muted/80 flex items-center gap-2',
                        activeTab === 'custom'
                          ? 'bg-background border-l-2 border-primary/60 text-foreground font-medium'
                          : 'text-muted-foreground border-l-2 border-transparent',
                      )}
                      onClick={() => scrollToSection('custom')}>
                      {t('custom_style') || 'Custom'}
                    </div>
                  </div>
                )}

                {/* Content Area */}
                <div
                  ref={contentRef}
                  className='flex-1 overflow-y-auto p-4 md:pt-0 bg-background h-full'>
                  {/* 收藏分类 */}
                  <div
                    ref={setSectionRef('favorites')}
                    className='mb-6 scroll-mt-4'>
                    <h3 className='text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5'>
                      <AiOutlineStar className='w-4 h-4' />
                      {t('favorites') || 'Favorites'}
                    </h3>
                    {isFavLoading ? (
                      <div className='flex justify-center py-8'>
                        <Spinner size='sm' />
                      </div>
                    ) : favoriteItems.kusaItems.length === 0 && favoriteItems.tagItems.length === 0 ? (
                      <div className='text-center py-8 text-muted-foreground'>
                        <AiOutlineStar className='w-8 h-8 mx-auto mb-2 text-muted-foreground/50' />
                        <p className='text-sm font-medium'>{t('no_favorites') || 'No favorites yet'}</p>
                        <p className='text-xs mt-1'>
                          {t('no_favorites_description') || 'Tap the star icon on any style to add it to your favorites'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* 收藏的 Image styles */}
                        {favoriteItems.kusaItems.length > 0 && (
                          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3'>
                            {favoriteItems.kusaItems.map(({ labelItem, styleId }) => (
                              <PromptTag
                                key={styleId}
                                labelItem={labelItem}
                                prompt={prompt}
                                setPrompt={setPrompt}
                                isKusa={true}
                                isMobile={isMobile}
                                setModel={setModel}
                                onClose={onClose}
                                showToast={false}
                                styleId={styleId}
                                isFavorite={true}
                                onToggleFavorite={toggleFavorite}
                                isTogglingFavorite={togglingStyleId === styleId}
                              />
                            ))}
                          </div>
                        )}
                        {/* 收藏的 Tag styles */}
                        {favoriteItems.tagItems.length > 0 && (
                          <div className='flex flex-wrap gap-2'>
                            {favoriteItems.tagItems.map(({ labelItem, styleId }) => (
                              <PromptTag
                                key={styleId}
                                labelItem={labelItem}
                                prompt={prompt}
                                setPrompt={setPrompt}
                                isKusa={false}
                                isMobile={isMobile}
                                setModel={setModel}
                                onClose={undefined}
                                showToast={true}
                                styleId={styleId}
                                isFavorite={true}
                                onToggleFavorite={toggleFavorite}
                                isTogglingFavorite={togglingStyleId === styleId}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>


                  {/* Image style sections (isKusa) */}
                  {styles
                    .filter(category => !!category.isKusa)
                    .map(category => (
                      <div
                        key={category.category}
                        ref={setSectionRef(category.category)}
                        className='mb-6 scroll-mt-4'>
                        <h3 className='text-sm font-semibold text-muted-foreground mb-2 capitalize'>
                          {category.category}
                        </h3>
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'>
                          {category.labels.map(labelItem => {
                            const sid = getStyleId(labelItem, true);
                            return (
                              <PromptTag
                                key={
                                  typeof labelItem === 'string'
                                    ? labelItem
                                    : labelItem.value
                                }
                                labelItem={labelItem}
                                prompt={prompt}
                                setPrompt={setPrompt}
                                isKusa={true}
                                isMobile={isMobile}
                                setModel={setModel}
                                onClose={onClose}
                                showToast={false}
                                styleId={sid}
                                isFavorite={sid ? isFavorite(sid) : false}
                                onToggleFavorite={sid ? toggleFavorite : undefined}
                                isTogglingFavorite={sid ? togglingStyleId === sid : false}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {/* Request new style message */}
                  <div className='mb-6 text-sm text-muted-foreground text-center'>
                    <span>
                      {t('request_style_prefix') ||
                        "Can't find the style you want? Request it in our "}
                    </span>
                    <a
                      href='https://discord.gg/WvJTBNDN'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:text-blue-700 underline'>
                      {t('request_style_link') ||
                        'Discord Feature Requests channel'}
                    </a>
                    <span>!</span>
                  </div>

                  {/* Tag style sections (non-isKusa, like General) */}
                  {styles
                    .filter(category => !category.isKusa)
                    .map(category => (
                      <div
                        key={category.category}
                        ref={setSectionRef(category.category)}
                        className='mb-6 scroll-mt-4'>
                        <h3 className='text-sm font-semibold text-muted-foreground mb-2 capitalize'>
                          {category.category}
                        </h3>
                        <div className='flex flex-wrap gap-2 gap-3'>
                          {category.labels.map(labelItem => {
                            const sid = getStyleId(labelItem, false);
                            return (
                              <PromptTag
                                key={
                                  typeof labelItem === 'string'
                                    ? labelItem
                                    : labelItem.value
                                }
                                labelItem={labelItem}
                                prompt={prompt}
                                setPrompt={setPrompt}
                                isKusa={false}
                                isMobile={isMobile}
                                setModel={setModel}
                                onClose={undefined}
                                showToast={true}
                                styleId={sid}
                                isFavorite={sid ? isFavorite(sid) : false}
                                onToggleFavorite={sid ? toggleFavorite : undefined}
                                isTogglingFavorite={sid ? togglingStyleId === sid : false}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}

                  {/* Custom styles section */}
                  <div
                    ref={setSectionRef('custom')}
                    className='scroll-mt-4 flex flex-col md:gap-6 gap-4 max-w-2xl border border-border rounded-lg p-4 bg-muted/30'>
                    <h3 className='text-sm font-medium text-muted-foreground'>
                      {t('custom_style') || 'Custom'}
                    </h3>

                    {/* Add new style */}
                    <div className='flex gap-3 items-end'>
                      <Input
                        label={t('new_custom_style') || 'New Custom Style'}
                        placeholder={
                          t('enter_style_prompt') || 'Enter style prompts...'
                        }
                        value={newCustomStyle}
                        onValueChange={setNewCustomStyle}
                        onKeyDown={e => e.key === 'Enter' && addStyle()}
                        variant='bordered'
                        labelPlacement='outside'
                        isClearable
                        onClear={() => setNewCustomStyle('')}
                        className='flex-1'
                      />
                      <Button
                        color='default'
                        onClick={addStyle}
                        isLoading={isSaving}
                        isDisabled={isSaving || !newCustomStyle.trim()}
                        size='sm'
                        className='px-1 mb-1'
                        startContent={
                          !isSaving && <IoMdAdd className='w-4 h-4' />
                        }>
                        {t('add') || 'Add'}
                      </Button>
                    </div>

                    {/* Saved styles list */}
                    <div>
                      <div className='flex items-center justify-between mb-1'>
                        <h4 className='text-sm font-medium text-muted-foreground'>
                          {t('saved_styles') || 'Saved Styles'}
                        </h4>
                        <Button
                          size='sm'
                          variant='light'
                          isIconOnly
                          onClick={refresh}
                          isLoading={isLoading}
                          className='min-w-7 w-7 h-7'>
                          <MdRefresh className='w-4 h-4 text-muted-foreground' />
                        </Button>
                      </div>
                      {isLoading ? (
                        <div className='flex justify-center py-12'>
                          <Spinner size='md' />
                        </div>
                      ) : customStyles.length === 0 ? (
                        <div className='text-center py-12 text-muted-foreground text-sm'>
                          {t('no_saved_styles') || 'No saved custom styles yet'}
                        </div>
                      ) : (
                        <div className='flex flex-col gap-1'>
                          {customStyles.map((style, index) => {
                            const isSelected = prompt.includes(style);
                            const isEditing = editingStyle === style;

                            if (isEditing) {
                              return (
                                <div
                                  key={index}
                                  className='flex items-center gap-2 px-3 py-2 bg-muted rounded-lg'>
                                  <Input
                                    size='sm'
                                    value={editValue}
                                    onValueChange={setEditValue}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        handleSaveEdit();
                                      }
                                      if (e.key === 'Escape') {
                                        cancelEdit();
                                      }
                                    }}
                                    variant='bordered'
                                    className='flex-1'
                                    autoFocus
                                  />
                                  <div className='flex gap-1 flex-shrink-0'>
                                    <Button
                                      size='sm'
                                      color='primary'
                                      onClick={handleSaveEdit}
                                      isLoading={isSaving}
                                      startContent={
                                        !isSaving && (
                                          <FaCheck className='w-3 h-3' />
                                        )
                                      }>
                                      {t('save') || 'Save'}
                                    </Button>
                                    <Button
                                      size='sm'
                                      variant='flat'
                                      onClick={cancelEdit}
                                      startContent={
                                        <MdClose className='w-3 h-3' />
                                      }>
                                      {t('cancel') || 'Cancel'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={index}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
                                  isSelected
                                    ? 'bg-primary-100 dark:bg-primary-200'
                                    : 'bg-muted hover:bg-muted/80',
                                )}>
                                <div
                                  className='flex-1 text-sm cursor-pointer break-all'
                                  onClick={() => {
                                    if (isSelected) {
                                      setPrompt(
                                        prompt
                                          .replace(style, '')
                                          .replace(/,\s*,/g, ',')
                                          .replace(/^,\s*/, '')
                                          .replace(/,\s*$/, ''),
                                      );
                                      toast.success(
                                        t('style_removed') || 'Style removed',
                                        { position: 'top-center' },
                                      );
                                    } else {
                                      const sep =
                                        prompt && !prompt.trim().endsWith(',')
                                          ? ', '
                                          : '';
                                      setPrompt(`${prompt}${sep}${style}`);
                                      toast.success(
                                        t('style_inserted') || 'Style inserted',
                                        { position: 'top-center' },
                                      );
                                    }
                                  }}>
                                  <div className='flex items-center'>
                                    {isSelected && (
                                      <span className='text-primary dark:text-primary-500 mr-1 flex items-center'>
                                        <IoCheckmark className='w-3.5 h-3.5' />
                                      </span>
                                    )}
                                    <span>{style}</span>
                                  </div>
                                </div>
                                <div className='flex flex-shrink-0'>
                                  <Button
                                    size='sm'
                                    variant='light'
                                    className='text-muted-foreground min-w-0 px-1.5 h-7'
                                    onClick={() => startEdit(style)}
                                    startContent={
                                      <MdEdit className='w-3.5 h-3.5' />
                                    }>
                                    {t('edit') || 'Edit'}
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='light'
                                    color='danger'
                                    className='min-w-0 px-1.5 h-7'
                                    isLoading={deletingStyle === style}
                                    isDisabled={!!deletingStyle}
                                    onClick={() => deleteStyle(style)}
                                    startContent={
                                      deletingStyle !== style && (
                                        <MdClose className='w-3.5 h-3.5' />
                                      )
                                    }>
                                    {t('delete') || 'Delete'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  },
);

export default StyleSelectorModal;
