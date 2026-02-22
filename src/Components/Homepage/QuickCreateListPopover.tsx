import React, { ReactNode } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import cn from 'classnames';
import { FaChevronDown } from 'react-icons/fa';

interface PopoverOption {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface QuickCreateListPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  options: PopoverOption[];
  onChange: (value: string) => void;
  icon: ReactNode;
  displayValue?: string;
  wrapIcon?: boolean;
}

/**
 * Shared list popover component for QuickCreatePanel
 * Used for Duration, Aspect Ratio selectors with consistent styling
 */
export const QuickCreateListPopover: React.FC<QuickCreateListPopoverProps> = ({
  isOpen,
  onOpenChange,
  value,
  options,
  onChange,
  icon,
  displayValue,
  wrapIcon = false,
}) => (
  <Popover placement='bottom' isOpen={isOpen} onOpenChange={onOpenChange}>
    <PopoverTrigger>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all text-sm',
          'bg-primary-50/50 border border-primary-200 hover:bg-primary-100 dark:bg-primary-400/10 dark:border-primary-400/30 dark:hover:bg-primary-400/20',
        )}>
        {wrapIcon ? (
          <div className='rounded-sm border border-primary-300 dark:border-primary-400/40'>
            {icon}
          </div>
        ) : (
          <span className='text-primary-500'>{icon}</span>
        )}
        <span className='text-primary-700 dark:text-primary-300 font-medium'>
          {displayValue || value}
        </span>
        <FaChevronDown className='w-2.5 h-2.5 text-primary-400 dark:text-primary-300' />
      </div>
    </PopoverTrigger>
    <PopoverContent className='p-2 min-w-[100px]'>
      <div className='flex flex-col gap-1'>
        {options.map(option => (
          <button
            key={option.key}
            onClick={() => {
              onChange(option.key);
              onOpenChange(false);
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left',
              value === option.key
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-muted',
            )}>
            {option.icon}
            <span className='text-sm'>{option.label}</span>
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

export default QuickCreateListPopover;
