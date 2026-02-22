import { ReactNode } from 'react';
import { Select, SelectItem } from '@nextui-org/react';

type AspectOption = {
  key: string;
  label?: string;
  icon?: ReactNode;
};

type Props = {
  value: string;
  options: AspectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Compact mode: only show icon + value */
  compact?: boolean;
  /** Pill mode: RightSidebar-style pill button */
  pill?: boolean;
};

export default function AspectRatioSelector({
  value,
  options,
  onChange,
  placeholder,
  className,
  compact = false,
  pill = false,
}: Props) {
  const selectedOption = options.find(opt => opt.key === value);

  return (
    <Select
      placeholder={placeholder}
      selectedKeys={[value]}
      className={className}
      onSelectionChange={keys => {
        const selectedKey = Array.from(keys)[0] as string;
        if (selectedKey) {
          onChange(selectedKey);
        }
      }}
      classNames={{
        // dark mode: content2 层级（#374151），比 Card 背景 content1（#1f2937）稍亮，创造层次感
        trigger: pill
          ? 'h-9 min-h-9 bg-accent border border-primary-200 hover:border-primary-400 shadow-none gap-1.5 rounded-xl px-3'
          : compact
            ? 'h-[34px] min-h-[34px] bg-default-100 hover:bg-default-200 border-none shadow-none gap-1 rounded-lg'
            : 'bg-input hover:bg-muted border-border hover:border-primary-500 transition-colors duration-200',
        popoverContent: 'animate-none bg-card',
        value: pill ? 'text-foreground font-medium' : '',
      }}
      disableAnimation
      selectorIcon={<></>}
      aria-label={placeholder || 'Aspect Ratio'}
      renderValue={() =>
        pill ? (
          <div className='flex items-center gap-1.5'>
            <div className='rounded-sm border border-muted-foreground'>
              {selectedOption?.icon}
            </div>
            <span className='font-medium text-foreground'>
              {selectedOption?.label ?? selectedOption?.key}
            </span>
          </div>
        ) : compact ? (
          <div className='flex items-center gap-1'>
            {selectedOption?.icon}
            <span>{selectedOption?.label ?? selectedOption?.key}</span>
          </div>
        ) : (
          <div className='flex justify-between items-center w-full'>
            <span className='text-foreground'>{placeholder || 'Ratio'}</span>
            <div className='flex items-center gap-2'>
              {selectedOption?.icon}
              <span className='text-foreground'>
                {selectedOption?.label ?? selectedOption?.key}
              </span>
            </div>
          </div>
        )
      }>
      {options.map(option => (
        <SelectItem
          key={option.key}
          value={option.key}
          textValue={option.label ?? option.key}>
          <div className='flex items-center gap-2'>
            {option.icon}
            <span>{option.label ?? option.key}</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
