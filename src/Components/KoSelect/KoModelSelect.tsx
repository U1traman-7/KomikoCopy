import React from 'react';
import KoSelect, { SelectItem as KoSelectItem } from './index';
import { Chip } from '@nextui-org/react';
import { BiSolidZap } from 'react-icons/bi';

export interface KoModelOption {
  value: string | number;
  name: string;
  iconEl?: React.ReactNode;
  icon?: string; // optional image src
  description?: string;
  dollars?: string | number; // display-only text (e.g., zaps cost)
  disabled?: boolean;
  maxDuration?: string | number;
  minDuration?: string | number;
  maxSize?: string | number;
  minSize?: string | number;
}

interface KoModelSelectProps {
  label?: string;
  placeholder?: string;
  ariaLabel?: string;
  defaultSelectedKey: string | number;
  options: KoModelOption[];
  onChange: (key: string | number) => void;
  className?: string;
  classNames?: {
    trigger?: string;
    listboxWrapper?: string;
  };
}

const KoModelSelect: React.FC<KoModelSelectProps> = ({
  label = 'Model',
  placeholder = 'Select a model',
  ariaLabel,
  defaultSelectedKey,
  options,
  onChange,
  className,
  classNames,
}) => (
  <div className={className}>
    <label className='block mb-2 font-bold text-foreground text-sm'>
      {label}
    </label>
    <KoSelect
      placeholder={placeholder}
      defaultSelectedKeys={[defaultSelectedKey]}
      aria-label={ariaLabel || label}
      className='w-full'
      classNames={{
        trigger:
          'border-border hover:border-primary-500 transition-all duration-300',
        listboxWrapper: '!max-h-[520px] overflow-y-auto',
        ...classNames,
      }}
      disabledKeys={options.filter(o => o.disabled).map(o => o.value)}
      onSelectionChange={keys => {
        const selected = Array.from(keys)[0] as string | number;
        onChange(selected);
      }}
      renderValue={items => {
        const selectedItem = items[0];
        const selectedKey = selectedItem?.itemKey?.toString() || '';
        const model = options.find(m => String(m.value) === selectedKey);
        return (
          <div className='flex gap-3 items-center'>
            {model?.iconEl ? (
              <span className='w-6 h-6  flex items-center justify-center text-muted-foreground'>
                {React.isValidElement(model.iconEl)
                  ? React.cloneElement(model.iconEl as React.ReactElement, {
                      strokeWidth: 1.5,
                    })
                  : model.iconEl}
              </span>
            ) : model?.icon ? (
              <img
                src={model.icon}
                alt={model?.name || 'Model'}
                className='w-6 h-6 md:w-7 md:h-7'
              />
            ) : null}
            <span className='leading-tight text-[13px] md:text-sm'>
              {model?.name || 'Model'}
            </span>
          </div>
        );
      }}>
      {options.map(option => (
        <KoSelectItem
          key={option.value}
          itemKey={option.value}
          value={option.value}
          textValue={option.name}>
          <div className='flex gap-3 w-full items-center min-h-[48px] py-1'>
            {option.iconEl ? (
              <span className='flex-shrink-0 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center'>
                {React.isValidElement(option.iconEl)
                  ? React.cloneElement(option.iconEl as React.ReactElement, {
                      strokeWidth: 1.5,
                    })
                  : option.iconEl}
              </span>
            ) : option.icon ? (
              <img
                src={option.icon}
                alt={option.name}
                className='flex-shrink-0 w-6 h-6 md:w-7 md:h-7'
              />
            ) : null}

            <div className='flex flex-col flex-1 min-w-0'>
              <div className='flex w-full items-start sm:items-center sm:flex-nowrap flex-wrap gap-x-2 gap-y-1'>
                <span className='flex-1 pr-2 min-w-0 text-sm font-medium leading-tight whitespace-normal break-keep text-wrap'>
                  {option.name}
                </span>
                <div className='flex flex-wrap gap-1 items-center justify-start w-full sm:w-auto sm:justify-end sm:ml-2'>
                  {(option.minDuration || option.maxDuration) && (
                    <Chip size='sm' color='primary' variant='flat'>
                      {[
                        option.minDuration ? `≥ ${option.minDuration}s` : null,
                        option.maxDuration ? `≤ ${option.maxDuration}s` : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Chip>
                  )}

                  {(option.minSize || option.maxSize) && (
                    <Chip size='sm' color='primary' variant='flat'>
                      {[
                        option.minSize ? `≥ ${option.minSize}MB` : null,
                        option.maxSize ? `≤ ${option.maxSize}MB` : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Chip>
                  )}

                  {option.dollars !== undefined && option.dollars !== null && (
                    <Chip
                      size='sm'
                      color='warning'
                      variant='flat'
                      startContent={
                        <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                      }>
                      {String(option.dollars)}
                    </Chip>
                  )}
                </div>
              </div>
              {option.description && (
                <span className='text-xs text-default-500 mt-0.5 block w-full whitespace-normal break-words leading-tight'>
                  {option.description}
                </span>
              )}
            </div>
          </div>
        </KoSelectItem>
      ))}
    </KoSelect>
  </div>
);

export default KoModelSelect;
export type { KoModelSelectProps };
