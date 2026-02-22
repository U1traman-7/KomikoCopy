import { Select, SelectItem } from '@nextui-org/react';

export type ResolutionOption = {
  key: string;
  label?: string;
};

type Props = {
  value: string;
  options: ResolutionOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function ResolutionSelector({
  value,
  options,
  onChange,
  placeholder,
  className,
}: Props) {
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
        trigger:
          'bg-input hover:bg-muted border-border hover:border-primary-500 transition-all duration-300',
        popoverContent: 'bg-card',
      }}
      disableAnimation
      selectorIcon={<></>}
      aria-label={placeholder || 'Resolution'}
      renderValue={() => {
        const selectedOption = options.find(opt => opt.key === value);
        return (
          <div className='flex justify-between items-center w-full'>
            <span className='text-foreground'>
              {placeholder || 'Resolution'}
            </span>
            <span className='text-foreground'>
              {selectedOption?.label ?? selectedOption?.key}
            </span>
          </div>
        );
      }}>
      {options.map(option => (
        <SelectItem key={option.key} value={option.key}>
          {option.label ?? option.key}
        </SelectItem>
      ))}
    </Select>
  );
}
