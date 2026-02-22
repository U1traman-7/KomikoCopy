import React from 'react';
import { Chip } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { getTagLogoUrl } from '../../utilities/imageOptimization';
import { getLocalizedField } from '../../utils/i18nText';
import { GRID_LAYOUT_TAGS } from '../../constants';

export interface TagChipProps {
  tag: {
    name: string;
    logo_url?: string | null;
    display_name?: string | null;
    i18n?: Record<string, any> | null;
  };
  onClick?: () => void;
  onClose?: () => void;
  className?: string;
  disabled?: boolean;
  isSelected?: boolean;
}

// Helper function to check if tag is OC tag (excludes grid/layout tags)
const isOcTag = (tagName: string) =>
  tagName.startsWith('@') ||
  (tagName.startsWith('<') &&
    tagName.endsWith('>') &&
    !GRID_LAYOUT_TAGS.has(tagName));

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  onClick,
  onClose,
  className = '',
  disabled = false,
  isSelected = false,
}) => {
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language || 'en';
  const isOc = isOcTag(tag.name);

  // Get localized name with smart fallback
  const getDisplayName = () => {
    // Try to get localized name from tag.i18n
    const localizedFromI18n = getLocalizedField(tag, 'name', currentLocale);
    if (localizedFromI18n) {
      return localizedFromI18n;
    }

    // Check if tag.name looks like an i18n key (e.g., "titles.xxx")
    const looksLikeI18nKey = tag.name.match(/^[a-z_]+\.[a-zA-Z0-9_]+$/);
    if (looksLikeI18nKey) {
      // Try to translate it using style-templates namespace
      const translated = t(`style-templates:${tag.name}`, { defaultValue: '' });
      if (translated && translated !== `style-templates:${tag.name}`) {
        return translated;
      }
      // If translation failed, format the key as Title Case
      const parts = tag.name.split('.');
      const key = parts[parts.length - 1];
      return key
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Use tag.name as-is
    return tag.name;
  };

  const localizedName = getDisplayName();

  // Determine base and content styles based on state
  const getBaseStyle = () => {
    if (isSelected) {
      return 'bg-primary-100/50 px-1 h-6 dark:bg-primary-400/15 dark:border dark:border-primary-400/40';
    }
    if (isOc) {
      return 'bg-primary-100/30 px-1 h-6 dark:bg-primary-400/15 dark:border dark:border-primary-400/40';
    }
    return tag.logo_url
      ? 'bg-default-100 px-1 h-6 dark:bg-primary-400/10 dark:border dark:border-primary-400/30'
      : 'bg-default-100 h-6 dark:bg-primary-400/10 dark:border dark:border-primary-400/30';
  };

  const getContentStyle = () => {
    if (isSelected) {
      return 'text-primary-600 text-xs px-0.5 dark:text-foreground';
    }
    if (isOc) {
      return 'text-primary-500 text-xs px-0.5 dark:text-foreground';
    }
    return 'text-default-600 text-xs px-0.5 dark:text-foreground';
  };

  const getCloseButtonStyle = () => {
    if (isSelected) {
      return 'text-primary-600 hover:bg-primary-200/50 dark:text-foreground dark:hover:bg-primary-400/20';
    }
    if (isOc) {
      return 'text-primary-500 hover:bg-primary-200/30 dark:text-foreground dark:hover:bg-primary-400/20';
    }
    return 'dark:text-foreground dark:hover:bg-primary-400/20';
  };

  return (
    <Chip
      variant='flat'
      radius='full'
      size='sm'
      onClick={onClick}
      onClose={onClose}
      className={className}
      classNames={{
        base: getBaseStyle(),
        content: getContentStyle(),
        closeButton: getCloseButtonStyle(),
      }}
      isDisabled={disabled}>
      <span className='flex items-center gap-0.5'>
        {tag.logo_url ? (
          <span className='w-4 h-4 rounded-full overflow-hidden bg-card flex-shrink-0'>
            <img
              src={getTagLogoUrl(tag.logo_url) || tag.logo_url}
              alt={tag.name}
              className='w-full h-full object-cover object-top'
            />
          </span>
        ) : (
          <span className='text-default-400 dark:text-foreground font-semibold'>
            #
          </span>
        )}
        <span>{isOc ? tag.display_name || tag.name : localizedName}</span>
      </span>
    </Chip>
  );
};
