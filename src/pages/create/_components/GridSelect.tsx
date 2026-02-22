/* eslint-disable */
import React, { useState, memo, useEffect } from 'react';
import * as Grids from '../../../Components/InfCanva/templateComicState';
import { Select, SelectItem, Chip } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { profileAtom } from 'state';

export type GridKey = keyof typeof Grids;
export type GridValue = (typeof Grids)[GridKey];

type GridOption = {
  label: string;
  value: GridKey;
  isPremium?: boolean;
};
interface GridSelectProps {
  // eslint-disable-next-line no-unused-vars
  onChange?: (gridKey: GridKey) => void;
  disabled?: boolean;
  value?: GridKey;
}

const GridSelect = memo(({ onChange, disabled, value }: GridSelectProps) => {
  const [currentGrid, setGrid] = useState<GridKey>('grid0');
  const { t } = useTranslation('common');
  // Mock implementation of premium status
  const [isPremium, setIsPremium] = useState(false);
  const profile = useAtomValue(profileAtom);

  useEffect(() => {
    if (profile.plan_codes?.length || profile.is_cpp) {
      setIsPremium(true);
    }
  }, [profile]);

  // Sync external value to internal state
  useEffect(() => {
    if (value !== undefined) {
      setGrid(value);
    }
  }, [value]);

  const options: GridOption[] = [
    {
      label: t('gridIndex', { index: 0 }),
      value: 'grid0',
    },
    {
      label: t('gridIndex', { index: 1 }),
      value: 'grid1',
    },
    {
      label: t('gridIndex', { index: 2 }),
      value: 'grid2',
    },
    {
      label: t('gridIndex', { index: 3 }),
      value: 'grid3',
    },
    {
      label: t('gridIndex', { index: 4 }),
      value: 'grid4',
      isPremium: true,
    },
    {
      label: t('gridIndex', { index: 5 }),
      value: 'grid5',
      isPremium: true,
    },
    {
      label: t('gridIndex', { index: 6 }),
      value: 'grid6',
      isPremium: true,
    },
    {
      label: t('gridIndex', { index: 7 }),
      value: 'grid7',
      isPremium: true,
    },
  ];

  const filteredOptions = options.filter(
    option => !option.isPremium || isPremium,
  );

  return (
    <Select
      size='md'
      className='w-[160px] rounded-lg shadow-md'
      aria-label='Comic grid layout selector'
      items={filteredOptions}
      placeholder='Grid 0'
      onChange={(e: any) => {
        if (e.target.value) {
          setGrid(e.target.value);
          onChange?.(e.target.value);
        }
      }}
      isDisabled={disabled}
      disabledKeys={isPremium ? [] : ['grid4', 'grid5', 'grid6', 'grid7']}
      value={currentGrid}>
      {item => (
        <SelectItem
          key={item.value}
          value={item.value}
          textValue={item.label}
          className='relative text-sm md:text-base'>
          <div className='flex justify-between items-center w-full'>
            <span>{item.label}</span>
            {item.isPremium && (
              <Chip
                size='sm'
                color='warning'
                variant='flat'
                className='scale-[0.7] md:scale-[0.75] text-xs'>
                Premium
              </Chip>
            )}
          </div>
        </SelectItem>
      )}
    </Select>
  );
});

export default GridSelect;
