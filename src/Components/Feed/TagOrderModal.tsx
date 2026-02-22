import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { IconX, IconPlus } from '@tabler/icons-react';
import { getTagSmallLogoUrl } from '../../utilities/imageOptimization';
import { getLocalizedField } from '../../utils/i18nText';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface TagOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: Array<{
    id: number;
    name: string;
    logo_url?: string | null;
    i18n?: Record<string, any> | null;
  }>;
  followedTagIds: number[];
  tagOrder: number[];
  defaultTagIds: number[]; // From API's default_tags (preset_order > 0)
  onSaveOrder: (orderedTagIds: number[]) => void | Promise<void>;
  onUnfollow?: (tagId: number) => void;
  onFollowedTagsChange?: (tagIds: number[]) => void;
}

// Special tags that should be hidden from the modal
const SPECIAL_TAG_IDS = [
  57349, // FEATURED
  57360, // ALL_POSTS
  87327, // TEMPLATES
  21544, // ANIMATION
];

// Sortable tag chip component using dnd-kit
interface SortableTagChipProps {
  tag: {
    id: number;
    name: string;
    logo_url?: string | null;
    i18n?: Record<string, any> | null;
  };
  onRemove: () => void;
  locale?: string;
}

const SortableTagChip: React.FC<SortableTagChipProps> = ({
  tag,
  onRemove,
  locale = 'en',
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const localizedName = getLocalizedField(tag, 'name', locale) || tag.name;

  const style = {
    // Use Translate instead of Transform to avoid scale deformation
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
      : undefined,
    transition,
    zIndex: isDragging ? 100 : 'auto',
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        inline-flex items-center gap-1 px-2 py-1.5 rounded-full
        bg-primary-50 text-primary-700
        cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'shadow-lg' : ''}
      `}>
      {tag.logo_url && (
        <div className='w-5 h-5 rounded-full overflow-hidden flex-shrink-0'>
          <img
            src={getTagSmallLogoUrl(tag.logo_url) || undefined}
            className='w-full h-full object-cover object-top'
            alt=''
          />
        </div>
      )}
      <span className='text-sm'>#{localizedName}</span>
      <IconX
        size={14}
        className='cursor-pointer hover:text-red-500'
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
      />
    </div>
  );
};

export const TagOrderModal: React.FC<TagOrderModalProps> = ({
  isOpen,
  onClose,
  tags,
  followedTagIds,
  tagOrder,
  defaultTagIds,
  onSaveOrder,
  onUnfollow,
  onFollowedTagsChange,
}) => {
  const { t, i18n } = useTranslation(['feed', 'common']);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [orderedSelectedIds, setOrderedSelectedIds] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // dnd-kit sensors - include TouchSensor for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // 150ms delay before drag starts on touch
        tolerance: 5, // 5px movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Track if modal was previously open to detect open/close transitions
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Initialize with currently followed tags
      setSelectedTagIds(new Set(followedTagIds));
      // Initialize order based on tagOrder or followedTagIds
      let initialOrder: number[];
      if (tagOrder.length > 0) {
        // Start with tags that have custom order
        const orderedTags = tagOrder.filter(id => followedTagIds.includes(id));
        // Add any followed tags that are not in the custom order (new follows)
        const unorderedTags = followedTagIds.filter(
          id => !tagOrder.includes(id),
        );
        initialOrder = [...orderedTags, ...unorderedTags];
      } else {
        initialOrder = followedTagIds;
      }
      setOrderedSelectedIds(initialOrder);
      setHasChanges(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, followedTagIds, tagOrder]);

  // Handle tag toggle (add/remove from selection)
  const handleToggleTag = useCallback((tagId: number) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
        // Remove from ordered list
        setOrderedSelectedIds(order => order.filter(id => id !== tagId));
      } else {
        next.add(tagId);
        // Add to end of ordered list
        setOrderedSelectedIds(order => [...order, tagId]);
      }
      return next;
    });
    setHasChanges(true);
  }, []);

  // dnd-kit drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedSelectedIds(prev => {
      const oldIndex = prev.indexOf(active.id as number);
      const newIndex = prev.indexOf(over.id as number);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Get newly unfollowed tags
      const unfollowedTags = followedTagIds.filter(
        id => !selectedTagIds.has(id),
      );

      // Process unfollows
      for (const tagId of unfollowedTags) {
        if (onUnfollow) {
          onUnfollow(tagId);
        } else {
          const response = await fetch('/api/tag/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagId, action: 'unfollow' }),
          });

          if (!response.ok) {
            throw new Error('Failed to unfollow');
          }
        }
      }

      // Get newly followed tags
      const newlyFollowedTags = Array.from(selectedTagIds).filter(
        id => !followedTagIds.includes(id),
      );

      // Process new follows
      for (const tagId of newlyFollowedTags) {
        const response = await fetch('/api/tag/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId, action: 'follow' }),
        });

        if (!response.ok) {
          throw new Error('Failed to follow');
        }
      }

      // Use the user-defined order from drag & drop
      const newOrderedTagIds = orderedSelectedIds.filter(id =>
        selectedTagIds.has(id),
      );
      await onSaveOrder(newOrderedTagIds);
      if (onFollowedTagsChange) {
        onFollowedTagsChange(newOrderedTagIds);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(t('feed:tagOrder.saveFailed', 'Failed to save changes'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Filter out special tags and categorize
  const filteredTags = tags.filter(tag => !SPECIAL_TAG_IDS.includes(tag.id));
  const tagMap = new Map(tags.map(tag => [tag.id, tag]));

  // Get ordered subscribed tags
  const orderedSubscribedTags = orderedSelectedIds
    .filter(id => !SPECIAL_TAG_IDS.includes(id) && tagMap.has(id))
    .map(id => tagMap.get(id)!);

  // Use defaultTagIds from API (preset_order > 0) for categorization
  const defaultTagIdsSet = new Set(defaultTagIds);
  const presetTags = filteredTags.filter(
    tag => defaultTagIdsSet.has(tag.id) && !selectedTagIds.has(tag.id),
  );
  const otherTags = filteredTags.filter(
    tag => !defaultTagIdsSet.has(tag.id) && !selectedTagIds.has(tag.id),
  );

  // Get current locale
  const currentLocale = i18n.language || 'en';

  // Render a tag chip (for preset/other tags)
  const renderTagChip = (tag: (typeof tags)[0]) => {
    const localizedName =
      getLocalizedField(tag, 'name', currentLocale) || tag.name;
    return (
      <div
        key={tag.id}
        onClick={() => handleToggleTag(tag.id)}
        className='inline-flex items-center gap-1 px-2 py-1.5 rounded-full cursor-pointer
          bg-default-50 border-1 border-default-300 text-default-700 hover:bg-default-100'>
        {tag.logo_url && (
          <div className='w-5 h-5 rounded-full overflow-hidden flex-shrink-0'>
            <img
              src={getTagSmallLogoUrl(tag.logo_url) || undefined}
              className='w-full h-full object-cover object-top'
              alt=''
            />
          </div>
        )}
        <span className='text-sm'>#{localizedName}</span>
        <IconPlus size={14} />
      </div>
    );
  };

  // Render categorized tags
  const renderCategorizedTags = () => (
    <div className='max-h-[60vh] overflow-y-auto space-y-4'>
      {/* Subscribed Tags - Sortable with dnd-kit */}
      {orderedSubscribedTags.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-foreground mb-2'>
            {t('feed:tagOrder.subscribedTags', 'Subscribed Tags')}
            <span className='text-xs text-muted-foreground ml-2'>
              {t('feed:tagOrder.dragToReorder', '(drag to reorder)')}
            </span>
          </h4>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={orderedSelectedIds}
              strategy={rectSortingStrategy}>
              <div className='flex flex-wrap gap-2'>
                {orderedSubscribedTags.map(tag => (
                  <SortableTagChip
                    key={tag.id}
                    tag={tag}
                    onRemove={() => handleToggleTag(tag.id)}
                    locale={currentLocale}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Preset Tags */}
      {presetTags.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-foreground mb-2'>
            {t('feed:tagOrder.presetTags', 'Recommended Tags')}
          </h4>
          <div className='flex flex-wrap gap-2'>
            {presetTags.map(tag => renderTagChip(tag))}
          </div>
        </div>
      )}

      {/* Other Tags */}
      {otherTags.length > 0 && (
        <div>
          <h4 className='text-sm font-medium text-foreground mb-2'>
            {t('feed:tagOrder.otherTags', 'Other Tags')}
          </h4>
          <div className='flex flex-wrap gap-2'>
            {otherTags.map(tag => renderTagChip(tag))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTags.length === 0 && (
        <div className='text-center py-8 text-muted-foreground'>
          {t('feed:tagOrder.noTags', 'No tags available')}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='2xl'
      scrollBehavior='inside'
      placement='bottom'
      classNames={{
        base: 'sm:mb-0 mb-0',
        wrapper: 'items-end sm:items-center',
      }}>
      <ModalContent>
        <ModalHeader className='pb-2'>
          <span>{t('feed:tagOrder.title', 'Manage Tags')}</span>
        </ModalHeader>
        <ModalBody>{renderCategorizedTags()}</ModalBody>
        <ModalFooter>
          <Button variant='flat' onPress={handleCancel}>
            {t('common:cancel', 'Cancel')}
          </Button>
          <Button
            color='primary'
            onPress={handleSave}
            isDisabled={!hasChanges || isSaving}
            isLoading={isSaving}>
            {t('common:save', 'Save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
