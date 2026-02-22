import React, { useEffect, useMemo, useState } from 'react';
import {
  Switch,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
} from '@nextui-org/react';
import { VipCrownInline } from '../VipBadge/VipCrown';
import { useAtomValue } from 'jotai';
import { profileAtom } from '../../state';
import { useOpenModal } from '../../hooks/useOpenModal';
import { useTranslation } from 'react-i18next';
import { HiOutlineGlobeAlt, HiOutlineLockClosed } from 'react-icons/hi2';
import { BsInfoCircleFill } from 'react-icons/bs';
import cn from 'classnames';

interface PublicVisibilityToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  label?: string;
  tooltip?: string;
  showCrown?: boolean;
  variant?: 'inline' | 'section';
  useStore?: boolean;
  reverse?: boolean;
  classNames?: {
    label?: string;
    tooltip?: string;
  };
  detectPlan?: boolean;
}

export const PublicVisibilityToggle: React.FC<PublicVisibilityToggleProps> = ({
  isPublic,
  onToggle,
  label,
  tooltip,
  showCrown = true,
  variant = 'section',
  useStore = true,
  reverse = false,
  classNames,
  detectPlan = true,
}) => {
  const profile = useAtomValue(profileAtom);
  const { submit: openModal } = useOpenModal();
  const { t } = useTranslation('common');
  const resolvedLabel = label ?? t('publicVisibility.label');
  const resolvedTooltip = tooltip ?? t('publicVisibility.tooltip');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const isFreeUser = !profile?.plan_codes?.length;
  const STORAGE_KEY = useMemo(() => {
    if (!profile?.email) {
      return '';
    }
    return `public_visibility_preference_${profile?.email}`;
  }, [profile?.email]);

  useEffect(() => {
    if (typeof window !== 'undefined' && useStore) {
      if (!STORAGE_KEY) {
        return;
      }
      const savedPreference = localStorage.getItem(STORAGE_KEY);
      if (savedPreference !== null) {
        onToggle(savedPreference === 'true');
      } else {
        onToggle(profile?.plan === 'Free');
      }
    }
  }, [onToggle, useStore, profile?.plan, STORAGE_KEY]);

  const handleToggle = (checked: boolean) => {
    const shouldOpen = reverse ? checked : !checked;
    if (detectPlan) {
      if (isFreeUser && shouldOpen) {
        openModal('pricing', {
          trackingContext: {
            source: 'public_visibility_toggle',
            triggerTool: 'privacy_control',
          },
        });
        return;
      }
    }

    if (typeof window !== 'undefined' && useStore) {
      if (!STORAGE_KEY) {
        return;
      }
      localStorage.setItem(STORAGE_KEY, checked.toString());
    }
    onToggle(checked);
    setIsPopoverOpen(false);
  };

  if (variant === 'inline') {
    return (
      <Popover
        placement='bottom-end'
        isOpen={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger>
          <Button
            variant='flat'
            size='sm'
            startContent={
              isPublic ? (
                <HiOutlineGlobeAlt className='w-4 h-4' />
              ) : (
                <HiOutlineLockClosed className='w-4 h-4' />
              )
            }
            className='bg-card flex-1 hover:bg-muted text-foreground font-semibold px-1'>
            {isPublic
              ? t('publicVisibility.public')
              : t('publicVisibility.private')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-64 p-0 z-0'>
          <div className='p-4'>
            <h4 className='font-semibold text-foreground mb-3'>
              {t('publicVisibility.popoverTitle')}
            </h4>
            <div className='space-y-2'>
              <Button
                variant='light'
                className={`w-full justify-start h-auto p-3 ${
                  isPublic
                    ? 'bg-primary-50 border border-primary-200 dark:bg-primary-900/30'
                    : 'hover:bg-muted'
                }`}
                startContent={
                  <HiOutlineGlobeAlt className='w-5 h-5 text-muted-foreground' />
                }
                onClick={() => handleToggle(true)}>
                <div className='flex flex-col items-start'>
                  <span className='font-medium text-foreground'>
                    {t('publicVisibility.public')}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {t('publicVisibility.publicDescription')}
                  </span>
                </div>
              </Button>
              <Button
                variant='light'
                className={`w-full justify-start h-auto p-3 ${
                  !isPublic
                    ? 'bg-primary-50 border border-primary-200 dark:bg-primary-900/30'
                    : 'hover:bg-muted'
                }`}
                startContent={
                  <HiOutlineLockClosed className='w-5 h-5 text-muted-foreground' />
                }
                onClick={() => handleToggle(false)}>
                <div className='flex flex-col items-start'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-foreground'>
                      {t('publicVisibility.private')}
                    </span>
                    <span className='text-xs font-bold text-primary-500 bg-primary-100 px-2 py-1 rounded'>
                      {t('publicVisibility.plusBadge')}
                    </span>
                  </div>
                  <span className='text-sm text-muted-foreground'>
                    {t('publicVisibility.privateDescription')}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className='flex justify-between items-center'>
      <div className='flex items-center gap-2'>
        <span
          className={cn(
            'font-bold text-foreground text-sm',
            classNames?.label,
          )}>
          {resolvedLabel}
        </span>
        <Tooltip content={resolvedTooltip}>
          <div className='cursor-help'>
            <BsInfoCircleFill className='w-3 h-3 transition-colors cursor-help md:w-4 md:h-4 text-primary-500 hover:text-primary-600' />
          </div>
        </Tooltip>
      </div>
      <div className='flex items-center gap-2'>
        {showCrown && <VipCrownInline plan='Starter' size='sm' />}
        <Switch
          size='sm'
          isSelected={isPublic}
          onValueChange={handleToggle}
          classNames={{
            wrapper: 'h-4 w-8',
            thumb: 'w-3 h-3',
          }}
        />
      </div>
    </div>
  );
};
