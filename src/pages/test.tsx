import React, { useState } from 'react';
import Select, { SelectItem } from '../Components/KoSelect';
import { Chip } from '@nextui-org/react';
import { BiSolidZap } from 'react-icons/bi';

enum TestModel {
  MODEL_A = 1,
  MODEL_B = 2,
  MODEL_C = 3,
}

export default function Test() {
  const [selectedModel, setSelectedModel] = useState<TestModel>(
    TestModel.MODEL_A,
  );

  const modelOptions = [
    {
      model: TestModel.MODEL_A,
      name: 'Model A',
      description: 'This is model A description',
      icon: '/images/favicon.webp',
      timeCost: '1min',
      fps: '30fps',
      dollars: '100',
    },
    {
      model: TestModel.MODEL_B,
      name: 'Model B',
      description: 'This is model B description',
      icon: '/images/favicon.webp',
      timeCost: '2min',
      fps: '60fps',
      dollars: '200',
    },
    {
      model: TestModel.MODEL_C,
      name: 'Model C',
      description: 'This is model C description',
      icon: '/images/favicon.webp',
      timeCost: '3min',
      fps: '120fps',
      dollars: '300',
    },
  ];

  return (
    <div className='p-4 max-w-xl mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>Test KoSelect</h1>
      <Select
        placeholder='Select a model'
        defaultSelectedKeys={[`${selectedModel}`]}
        className='w-full'
        onSelectionChange={(keys) => {
          const selected = +Array.from(keys)[0] as TestModel;
          setSelectedModel(selected);
        }}
        aria-label='Select Model'
        classNames={{
          trigger:
            'border-border hover:border-primary-500 transition-all duration-300',
          listboxWrapper: 'max-h-[456px] overflow-y-auto',
        }}
        renderValue={(items) => {
          const selectedItem = items[0];
          const selectedKey = selectedItem?.itemKey?.toString() || '';
          const model = modelOptions.find(
            (m) => m.model === Number(selectedKey),
          );
          return (
            <div className='flex gap-2 items-center'>
              {model?.icon && (
                <img
                  src={model.icon}
                  alt={model?.name || 'Model'}
                  className='w-6 h-6'
                />
              )}
              <span>{model?.name || 'Model'}</span>
            </div>
          );
        }}>
        {modelOptions.map((option) => (
          <SelectItem
            key={option.model}
            itemKey={option.model}
            value={option.model}
            textValue={option.name}>
            <div className='flex gap-2 items-center w-full'>
              {option.icon && (
                <img
                  src={option.icon}
                  alt={option.name}
                  className='flex-shrink-0 mt-1 w-6 h-6'
                />
              )}

              <div className='flex flex-col flex-1 min-w-0'>
                <div className='flex justify-between items-center w-full'>
                  <span className='flex-1 pr-2 min-w-0 text-sm font-medium truncate'>
                    {option.name}
                  </span>
                  <div className='flex flex-wrap flex-shrink-0 gap-1 justify-end items-center'>
                    <Chip size='sm' color='primary' variant='flat'>
                      {option.timeCost}
                    </Chip>
                    <Chip size='sm' color='secondary' variant='flat'>
                      {option.fps}
                    </Chip>
                    <Chip
                      size='sm'
                      color='warning'
                      variant='flat'
                      startContent={
                        <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                      }>
                      {option.dollars}
                    </Chip>
                  </div>
                </div>

                {option.description && (
                  <span className='text-xs text-default-400 mt-0.5'>
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </Select>

      <div className='mt-4 p-4 bg-muted rounded'>
        <p>
          Selected Model:{' '}
          {modelOptions.find((m) => m.model === selectedModel)?.name}
        </p>
      </div>
    </div>
  );
}
