import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Avatar,
  Divider,
  Input,
  Spinner,
  Tooltip,
  Switch,
  Autocomplete,
  AutocompleteItem,
  Select,
  SelectItem,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import {
  IconSettings,
  IconPhoto,
  IconUpload,
  IconUserPlus,
  IconTrash,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile, deleteFilesByUrl } from '../../utilities';
import {
  processLogoImage,
  MAX_HEADER_WIDTH,
  MAX_HEADER_HEIGHT,
} from '../../utilities/imageOptimization';
import { compressImage } from '../../utilities/mediaCompression';

interface Moderator {
  id: number;
  user_id: string;
  role: string;
  user_name?: string;
  user_image?: string;
  user_uniqid?: string;
  email?: string;
}

interface CharacterCategory {
  category: string;
  normalized_category: string;
  count: number;
}

interface TagSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagId: number;
  tagName: string;
  currentLogoUrl?: string | null;
  currentHeaderImage?: string | null;
  currentDescription?: string | null;
  currentIsNsfw?: boolean;
  currentCtaLink?: string | null;
  currentCharacterCategory?: string | null;
  currentAllowMediaTypes?: 'all' | 'image' | 'video' | null;
  currentCtaTextTranslation?: Record<string, string> | null;
  defaultCtaLink?: string | null; // Auto-detected from template matching
  onSuccess?: () => void;
  canManageMods?: boolean;
  onModeratorAdded?: () => void;
  isGlobalAdmin?: boolean;
}

export const TagSettingsModal: React.FC<TagSettingsModalProps> = ({
  isOpen,
  onClose,
  tagId,
  tagName,
  currentLogoUrl,
  currentHeaderImage,
  currentDescription,
  currentIsNsfw = false,
  currentCtaLink,
  currentCharacterCategory,
  currentAllowMediaTypes,
  currentCtaTextTranslation,
  defaultCtaLink,
  onSuccess,
  canManageMods = false,
  onModeratorAdded,
  isGlobalAdmin = false,
}) => {
  const { t } = useTranslation('tags');
  // Basic settings state
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null);
  const [headerImage, setHeaderImage] = useState<string | null>(
    currentHeaderImage || null,
  );
  const [description, setDescription] = useState(currentDescription || '');
  const [isNsfw, setIsNsfw] = useState(currentIsNsfw);
  const [ctaLink, setCtaLink] = useState(currentCtaLink || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [urlsToDelete, setUrlsToDelete] = useState<string[]>([]);

  // Character category state (admin only)
  const [characterCategory, setCharacterCategory] = useState<string>(
    currentCharacterCategory || '',
  );
  const [categories, setCategories] = useState<CharacterCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Allow media types state (admin only)
  const [allowMediaTypes, setAllowMediaTypes] = useState<string>(
    currentAllowMediaTypes || 'all',
  );

  // CTA text translation state
  const [ctaText, setCtaText] = useState<string>('');
  const [ctaTextTranslation, setCtaTextTranslation] = useState<Record<string, string> | null>(
    currentCtaTextTranslation || null,
  );
  const [isTranslating, setIsTranslating] = useState(false);

  // Moderator management state
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isLoadingMods, setIsLoadingMods] = useState(false);
  const [newModEmail, setNewModEmail] = useState('');
  // Role is always 'moderator' now, no need for state
  const [isAddingMod, setIsAddingMod] = useState(false);
  const [addModError, setAddModError] = useState<string | null>(null);
  const [deletingModId, setDeletingModId] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Fetch moderators
  const fetchModerators = useCallback(async () => {
    if (!canManageMods) return;
    setIsLoadingMods(true);
    try {
      const response = await fetch(`/api/tag/moderators?tagId=${tagId}`);
      const data = await response.json();
      if (response.ok && data.moderators) {
        setModerators(data.moderators);
      }
    } catch (error) {
      console.error('Error fetching moderators:', error);
    } finally {
      setIsLoadingMods(false);
    }
  }, [tagId, canManageMods]);

  // Fetch character categories (admin only)
  const fetchCategories = useCallback(async () => {
    if (!isGlobalAdmin) return;
    setIsLoadingCategories(true);
    try {
      const response = await fetch('/api/characters?collections=true');
      const data = await response.json();
      if (data.code === 1 && data.data?.collections) {
        // Map from collections format to our category format and sort alphabetically
        const mapped = data.data.collections.map((col: any) => ({
          category: col.name,
          normalized_category: col.slug,
          count: col.character_count,
        }));
        mapped.sort((a: CharacterCategory, b: CharacterCategory) =>
          a.category.localeCompare(b.category),
        );
        setCategories(mapped);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [isGlobalAdmin]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogoUrl(currentLogoUrl || null);
      setHeaderImage(currentHeaderImage || null);
      setDescription(currentDescription || '');
      setIsNsfw(currentIsNsfw);
      setCtaLink(currentCtaLink || '');
      setCharacterCategory(currentCharacterCategory || '');
      setAllowMediaTypes(currentAllowMediaTypes || 'all');
      setCtaText(currentCtaTextTranslation?.en || '');
      setCtaTextTranslation(currentCtaTextTranslation || null);
      setLogoFile(null);
      setHeaderFile(null);
      setUrlsToDelete([]);
      setNewModEmail('');
      setAddModError(null);
      fetchModerators();
      fetchCategories();
    }
  }, [
    isOpen,
    currentLogoUrl,
    currentHeaderImage,
    currentDescription,
    currentIsNsfw,
    currentCtaLink,
    currentCharacterCategory,
    currentAllowMediaTypes,
    currentCtaTextTranslation,
    fetchModerators,
    fetchCategories,
  ]);

  // Add moderator handler
  const handleAddModerator = async () => {
    if (!newModEmail.trim()) {
      setAddModError(t('addMod.emailRequired'));
      return;
    }

    setIsAddingMod(true);
    setAddModError(null);

    try {
      const response = await fetch('/api/tag/moderators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          tagId,
          email: newModEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddModError(data.error || t('addMod.failed'));
        return;
      }

      toast.success(t('addMod.success'));
      setNewModEmail('');
      fetchModerators();
      onModeratorAdded?.();
    } catch (err) {
      setAddModError(t('addMod.networkError'));
    } finally {
      setIsAddingMod(false);
    }
  };

  // Delete moderator handler
  const handleDeleteModerator = async (userId: string, userName?: string) => {
    if (
      !confirm(
        t('settings.confirmDeleteMod', {
          name: userName || userId,
        }),
      )
    ) {
      return;
    }

    setDeletingModId(userId);

    try {
      const response = await fetch(
        `/api/tag/moderators?tagId=${tagId}&userId=${userId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || t('settings.deleteModFailed'));
        return;
      }

      toast.success(t('settings.deleteModSuccess'));
      fetchModerators();
      onModeratorAdded?.();
    } catch (error) {
      toast.error(t('settings.deleteModFailed'));
    } finally {
      setDeletingModId(null);
    }
  };

  // Translate CTA text handler
  const handleTranslateCtaText = async () => {
    if (!ctaText.trim()) {
      toast.error('Please enter CTA text first');
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/tag/translate-cta-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          text: ctaText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to translate CTA text');
        return;
      }

      if (data.translations) {
        setCtaTextTranslation(data.translations);
        toast.success('CTA text translated successfully');
      }
    } catch (err) {
      toast.error('Failed to translate CTA text');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'header',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.invalidImage'));
      e.target.value = '';
      return;
    }

    // Revoke old object URL to prevent memory leak
    if (type === 'logo' && logoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(logoUrl);
    } else if (type === 'header' && headerImage?.startsWith('blob:')) {
      URL.revokeObjectURL(headerImage);
    }

    setIsProcessingImage(true);

    try {
      if (type === 'logo') {
        // Process logo: crop to square and convert to WebP
        const processedFile = await processLogoImage(file);
        const previewUrl = URL.createObjectURL(processedFile);
        setLogoUrl(previewUrl);
        setLogoFile(processedFile);
      } else {
        // Process header: compress and convert to WebP
        const processedFile = await compressImage(file, {
          maxWidth: MAX_HEADER_WIDTH,
          maxHeight: MAX_HEADER_HEIGHT,
          quality: 0.9,
        });
        const previewUrl = URL.createObjectURL(processedFile);
        setHeaderImage(previewUrl);
        setHeaderFile(processedFile);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(t('settings.imageProcessError'));
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  // Validate CTA link - only allow internal links
  const isCtaLinkValid = (link: string) => {
    if (!link) return true; // Empty is valid (uses default)
    return (
      link.startsWith('/') ||
      link.includes('komiko.app') ||
      link.includes('komikoai.com')
    );
  };

  const handleSubmit = async () => {
    // Validate CTA link before submit
    if (ctaLink && !isCtaLinkValid(ctaLink)) {
      toast.error(
        t('settings.ctaLinkError', {
          defaultValue: 'Only internal links allowed',
        }),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Use current state values - they will be null if user removed the image
      let finalLogoUrl: string | null = logoUrl?.startsWith('blob:')
        ? null
        : logoUrl;
      let finalHeaderImage: string | null = headerImage?.startsWith('blob:')
        ? null
        : headerImage;

      // Collect all URLs to delete (including replaced images)
      const allUrlsToDelete = [...urlsToDelete];

      const uploadId = uuidv4();

      // Upload logo if a new file was selected
      if (logoFile) {
        // Mark old logo for deletion if replacing
        if (currentLogoUrl?.includes('supabase.co')) {
          allUrlsToDelete.push(currentLogoUrl);
        }
        const logoPath = `tag_assets/${tagId}/logo_${uploadId}.webp`;
        finalLogoUrl = await uploadFile(logoPath, logoFile);
        if (!finalLogoUrl) throw new Error('Failed to upload logo');
      }

      // Upload header if a new file was selected
      if (headerFile) {
        // Mark old header for deletion if replacing
        if (currentHeaderImage?.includes('supabase.co')) {
          allUrlsToDelete.push(currentHeaderImage);
        }
        const headerPath = `tag_assets/${tagId}/header_${uploadId}.webp`;
        finalHeaderImage = await uploadFile(headerPath, headerFile);
        if (!finalHeaderImage) throw new Error('Failed to upload header');
      }

      // Delete old files from storage (fire and forget, don't block saving)
      if (allUrlsToDelete.length > 0) {
        deleteFilesByUrl(allUrlsToDelete).catch(err => {
          console.warn('Failed to delete old files:', err);
        });
      }

      // Update tag via API
      const response = await fetch('/api/tag/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId,
          logo_url: finalLogoUrl,
          header_image: finalHeaderImage,
          description: description || null,
          is_nsfw: isNsfw,
          cta_link: ctaLink || null,
          character_category: characterCategory || null,
          allow_media_types: allowMediaTypes === 'all' ? null : allowMediaTypes,
          cta_text_translation: ctaTextTranslation || null,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success(t('settings.success'));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error(t('settings.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg' scrollBehavior='inside'>
      <ModalContent>
        <ModalHeader className='flex items-center gap-2 border-b-[1px]'>
          <IconSettings size={20} />
          {t('settings.title')}
          <span className='text-sm font-normal text-default-500'>
            #{tagName}
          </span>
        </ModalHeader>
        <ModalBody className='gap-3 pt-4'>
          {/* Basic Settings Section */}
          <div className='space-y-1'>
            <h3 className='text-base font-semibold text-default-800'>
              {t('settings.basicSettings')}
            </h3>
          </div>

          {/* Logo Upload */}
          <div>
            <label className='text-sm font-medium text-default-700 mb-1 block'>
              {t('settings.logo')}
            </label>
            <p className='text-xs text-default-400 mb-2'>
              {t('settings.logoHint')}
            </p>
            <div className='flex items-center gap-4'>
              <Avatar
                key={logoUrl || 'no-logo'}
                src={logoUrl || undefined}
                name={tagName.charAt(0).toUpperCase()}
                className='w-16 h-16 text-2xl'
                classNames={{ base: 'bg-muted to-secondary-500' }}
              />
              <input
                ref={logoInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={e => handleImageSelect(e, 'logo')}
              />
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='flat'
                  isLoading={isProcessingImage}
                  startContent={
                    !isProcessingImage ? <IconUpload size={16} /> : undefined
                  }
                  onPress={() => logoInputRef.current?.click()}>
                  {t('settings.uploadLogo')}
                </Button>
                {logoUrl && (
                  <Button
                    size='sm'
                    variant='flat'
                    color='danger'
                    startContent={<IconTrash size={16} />}
                    onPress={() => {
                      // Mark old URL for deletion if it's a Supabase URL
                      if (logoUrl?.includes('supabase.co')) {
                        setUrlsToDelete(prev => [...prev, logoUrl]);
                      } else if (logoUrl?.startsWith('blob:')) {
                        URL.revokeObjectURL(logoUrl);
                      }
                      setLogoUrl(null);
                      setLogoFile(null);
                    }}>
                    {t('settings.remove')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Header Image Upload */}
          <div>
            <label className='text-sm font-medium text-default-700 mb-1 block'>
              {t('settings.headerImage')}
            </label>
            <p className='text-xs text-default-400 mb-2'>
              {t('settings.headerHint')}
            </p>
            <div
              className='relative w-full h-32 rounded-lg overflow-hidden border-1 border-dashed border-default-300 hover:border-primary-400 transition-colors cursor-pointer group'
              onClick={() => headerInputRef.current?.click()}>
              {headerImage ? (
                <img
                  src={headerImage}
                  alt='Header'
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full bg-muted to-secondary-100 flex items-center justify-center'>
                  <div className='text-center text-default-400'>
                    <IconPhoto size={32} className='mx-auto mb-1' />
                    <span className='text-sm'>
                      {t('settings.clickToUpload')}
                    </span>
                  </div>
                </div>
              )}
              <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                <IconUpload size={24} className='text-white' />
              </div>
            </div>
            <input
              ref={headerInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={e => handleImageSelect(e, 'header')}
            />
            {headerImage && (
              <Button
                size='sm'
                variant='flat'
                color='danger'
                className='mt-2'
                startContent={<IconTrash size={16} />}
                onPress={() => {
                  // Mark old URL for deletion if it's a Supabase URL
                  if (headerImage?.includes('supabase.co')) {
                    setUrlsToDelete(prev => [...prev, headerImage]);
                  } else if (headerImage?.startsWith('blob:')) {
                    URL.revokeObjectURL(headerImage);
                  }
                  setHeaderImage(null);
                  setHeaderFile(null);
                }}>
                {t('settings.removeHeader')}
              </Button>
            )}
          </div>

          {/* Description */}
          <div>
            <Textarea
              placeholder={t('settings.descriptionPlaceholder')}
              value={description}
              label={t('settings.description')}
              onValueChange={setDescription}
              minRows={3}
              maxRows={6}
              maxLength={2000}
              labelPlacement='outside'
            />
            <p className='text-xs text-default-400 mt-1 text-right'>
              {description.length}/2000
            </p>
          </div>

          {/* Allow NSFW Toggle */}
          <div className='flex items-center justify-between'>
            <div className='flex flex-col gap-0.5'>
              <label className='text-sm font-medium text-default-700'>
                {t('settings.isNsfw')}
              </label>
              <p className='text-xs text-default-400'>
                {t('settings.isNsfwDescription')}
              </p>
            </div>
            <Switch
              isSelected={isNsfw}
              onValueChange={setIsNsfw}
              size='sm'
              classNames={{
                wrapper:
                  'bg-default-200 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-pink-500 data-[selected=true]:to-purple-500',
              }}
            />
          </div>

          {/* CTA Link - Admin only */}
          {isGlobalAdmin && (
            <div>
              <Input
                label={t('settings.ctaLink', {
                  defaultValue: 'CTA Button Link',
                })}
                placeholder={defaultCtaLink || '/ai-anime-generator?prompt=...'}
                value={ctaLink}
                onValueChange={setCtaLink}
                labelPlacement='outside'
                isInvalid={!!ctaLink && !isCtaLinkValid(ctaLink)}
                errorMessage={t('settings.ctaLinkError', {
                  defaultValue:
                    'Only internal links allowed (relative paths or komiko.app/komikoai.com)',
                })}
                description={
                  defaultCtaLink
                    ? t('settings.ctaLinkHintWithDefault', {
                        defaultValue: `Auto-detected: ${defaultCtaLink}`,
                        defaultLink: defaultCtaLink,
                      })
                    : t('settings.ctaLinkHint', {
                        defaultValue:
                          'Only internal links allowed. Leave empty to use default.',
                      })
                }
              />
            </div>
          )}

          {/* CTA Button Text */}
          <div>
            <label className='text-sm font-medium text-default-700 mb-1 block'>
              {t('settings.ctaButtonText', {
                defaultValue: 'CTA Button Text',
              })}
            </label>
            <p className='text-xs text-default-400 mb-2'>
              {t('settings.ctaButtonTextHint', {
                defaultValue:
                  'Customize the text shown on the floating CTA button. Will be translated to all supported languages.',
              })}
            </p>
            <div className='flex gap-2'>
              <Input
                placeholder={t('settings.ctaButtonTextPlaceholder', {
                  defaultValue: 'Generate Art',
                })}
                value={ctaText}
                onValueChange={setCtaText}
                className='flex-1'
              />
              <Button
                color='primary'
                variant='flat'
                onPress={handleTranslateCtaText}
                isLoading={isTranslating}
                isDisabled={!ctaText.trim()}>
                {t('settings.translate', { defaultValue: 'Translate' })}
              </Button>
            </div>
            {ctaTextTranslation && Object.keys(ctaTextTranslation).length > 0 && (
              <div className='mt-2 p-2 bg-success-50 rounded-lg border border-success-200'>
                <p className='text-xs text-success-700 font-medium mb-1'>
                  {t('settings.translationPreview', {
                    defaultValue: 'Translation Preview',
                  })}
                </p>
                <div className='space-y-1'>
                  {Object.entries(ctaTextTranslation)
                    .slice(0, 3)
                    .map(([lang, text]) => (
                      <p key={lang} className='text-xs text-default-600'>
                        <span className='font-medium'>{lang}:</span> {text}
                      </p>
                    ))}
                  {Object.keys(ctaTextTranslation).length > 3 && (
                    <p className='text-xs text-default-500'>
                      +{Object.keys(ctaTextTranslation).length - 3} more
                      languages
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Character Category */}
          <div>
            <Autocomplete
              shouldCloseOnBlur={false}
              label={t('settings.characterCategory', {
                defaultValue: 'Character Category',
              })}
              placeholder={t('settings.characterCategoryPlaceholder', {
                defaultValue: 'Search or select a category',
              })}
              selectedKey={characterCategory || null}
              onSelectionChange={key => {
                setCharacterCategory((key as string) || '');
              }}
              labelPlacement='outside'
              isLoading={isLoadingCategories}
              isClearable
              onClear={() => setCharacterCategory('')}
              itemHeight={48}
              maxListboxHeight={320}
              description={t('settings.characterCategoryHint', {
                defaultValue:
                  'Link this tag to an official character category.',
              })}
              defaultItems={categories}>
              {cat => (
                <AutocompleteItem
                  key={cat.normalized_category}
                  textValue={cat.category}
                  description={cat.normalized_category}
                  endContent={
                    <span className='text-xs text-default-500 shrink-0'>
                      {cat.count}
                    </span>
                  }>
                  {cat.category}
                </AutocompleteItem>
              )}
            </Autocomplete>
          </div>

          {/* Allowed Media Types - Admin only */}
          {isGlobalAdmin && (
            <div>
              <Select
                label={t('settings.allowedMediaTypes')}
                selectedKeys={[allowMediaTypes]}
                onSelectionChange={keys => {
                  const selected = Array.from(keys)[0] as string;
                  setAllowMediaTypes(selected || 'all');
                }}
                labelPlacement='outside'>
                <SelectItem key='all'>{t('settings.mediaTypeAll')}</SelectItem>
                <SelectItem key='image'>{t('settings.mediaTypeImage')}</SelectItem>
                <SelectItem key='video'>{t('settings.mediaTypeVideo')}</SelectItem>
              </Select>
            </div>
          )}

          {/* Moderator Management Section - only for owners/admins */}
          {canManageMods && (
            <>
              <Divider className='my-4' />
              <div>
                <label className='text-base font-semibold text-default-800 mb-3 block'>
                  {t('settings.moderators')}
                </label>

                {/* Moderator List */}
                <div className='space-y-2 mb-4 max-h-48 overflow-y-auto'>
                  {isLoadingMods ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner size='sm' />
                    </div>
                  ) : moderators.length === 0 ? (
                    <p className='text-sm text-default-400 text-center py-4'>
                      {t('settings.noModerators')}
                    </p>
                  ) : (
                    moderators.map(mod => (
                      <div
                        key={mod.id}
                        className='flex items-center justify-between p-2 rounded-lg bg-default-100 hover:bg-default-200 transition-colors'>
                        <div className='flex items-center gap-3'>
                          <Avatar
                            src={mod.user_image}
                            name={mod.user_name?.charAt(0) || '?'}
                            size='sm'
                            className='w-8 h-8'
                          />
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium text-default-700'>
                              {mod.user_name || 'Anonymous'}
                            </span>
                            <span className='text-xs text-default-400'>
                              {isGlobalAdmin
                                ? mod.email || mod.user_id.slice(0, 8)
                                : `@${mod.user_uniqid || mod.user_id.slice(0, 8)}`}
                            </span>
                          </div>
                          <span className='text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full'>
                            {t('moderator')}
                          </span>
                        </div>
                        <Tooltip content={t('settings.removeMod')}>
                          <Button
                            isIconOnly
                            size='sm'
                            variant='light'
                            color='danger'
                            isLoading={deletingModId === mod.user_id}
                            onPress={() =>
                              handleDeleteModerator(mod.user_id, mod.user_name)
                            }>
                            <IconTrash size={16} />
                          </Button>
                        </Tooltip>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Moderator Form */}
                <div className='space-y-3 p-3 rounded-lg border border-default-200 bg-default-50'>
                  <p className='text-xs font-medium text-default-600'>
                    {t('addMod.title')}
                  </p>
                  <Input
                    size='sm'
                    label={t('addMod.emailLabel')}
                    placeholder={t('addMod.emailPlaceholder')}
                    type='email'
                    value={newModEmail}
                    onValueChange={setNewModEmail}
                    isDisabled={isAddingMod}
                    isInvalid={!!addModError}
                    errorMessage={addModError}
                  />
                  <Button
                    size='sm'
                    color='warning'
                    variant='flat'
                    startContent={<IconUserPlus size={16} />}
                    onPress={handleAddModerator}
                    isLoading={isAddingMod}
                    className='w-full'>
                    {t('addMod.confirm')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant='light' onPress={onClose}>
            {t('cancel')}
          </Button>
          <Button
            color='primary'
            isLoading={isSubmitting}
            onPress={handleSubmit}>
            {t('save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TagSettingsModal;

