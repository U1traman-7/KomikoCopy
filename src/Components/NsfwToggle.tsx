import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { IconPepper } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface NsfwToggleProps {
  /** Callback when mode changes, returns true if NSFW mode is enabled */
  onModeChange?: (isNsfwMode: boolean) => void;
  /** Additional class names */
  className?: string;
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Controlled mode - when provided, component becomes controlled */
  isActive?: boolean;
  /** Force show the toggle even if cookie is not set yet (used after NSFW confirmation) */
  forceShow?: boolean;
  /** Disable the toggle (always show as active but not clickable) */
  disabled?: boolean;
}

/**
 * NSFW Toggle Button
 *
 * A toggle button for switching between SFW and NSFW content modes.
 * Only visible when user has NSFW permission (relax_content cookie).
 *
 * Used in:
 * - Home Feed
 * - Character pages
 * - Tag pages
 */
export const NsfwToggle: React.FC<NsfwToggleProps> = ({
  onModeChange,
  className,
  size = 'sm',
  isActive,
  forceShow = false,
  disabled = false,
}) => {
  // Initialize with forceShow to avoid flash of wrong state on NSFW tag pages
  const [isNsfwEnabled, setIsNsfwEnabled] = useState(forceShow); // User has NSFW permission
  const [internalNsfwMode, setInternalNsfwMode] = useState(false); // Internal state for uncontrolled mode
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if we're in controlled mode
  const isControlled = isActive !== undefined;
  const nsfwMode = isControlled ? isActive : internalNsfwMode;

  // Check NSFW permission from cookie on mount and when forceShow changes
  useEffect(() => {
    const hasNsfwPermission = document.cookie.includes('relax_content=true');
    setIsNsfwEnabled(hasNsfwPermission || forceShow);
  }, [forceShow]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const newMode = !nsfwMode;
    if (!isControlled) {
      setInternalNsfwMode(newMode);
    }
    onModeChange?.(newMode);
  }, [nsfwMode, onModeChange, isControlled, disabled]);

  // Mobile long press handlers
  const handleTouchStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
      // Auto hide after 2 seconds
      setTimeout(() => setShowTooltip(false), 2000);
    }, 500); // 500ms long press
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Don't render if user doesn't have NSFW permission
  if (!isNsfwEnabled) {
    return null;
  }

  // Tooltip content based on current mode
  const tooltipContent = nsfwMode ? 'NSFW mode' : 'SFW mode';

  return (
    <Tooltip
      content={tooltipContent}
      placement='top'
      isOpen={showTooltip}
      onOpenChange={setShowTooltip}
      classNames={{
        content: 'text-xs px-3 py-1.5 bg-primary/20 text-primary font-medium rounded-lg',
      }}>
      <Button
        radius='full'
        size={size}
        isIconOnly
        isDisabled={false}
        className={cn(
          'flex-shrink-0 transition-all',
          nsfwMode
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
            : 'bg-default-100 hover:bg-default-200',
          disabled && 'cursor-not-allowed opacity-100',
          className,
        )}
        onPress={handleToggle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label={nsfwMode ? 'Switch to SFW mode' : 'Switch to NSFW mode'}>
        <IconPepper
          size={size === 'sm' ? 16 : size === 'md' ? 18 : 20}
          className={nsfwMode ? 'text-primary-foreground' : 'text-red-500'}
        />
      </Button>
    </Tooltip>
  );
};

export default NsfwToggle;
