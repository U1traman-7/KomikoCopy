import React from 'react';

/**
 * Shared aspect ratio icon map for video generation components
 * Used in QuickCreatePanel, ImageOrTextToVideoConvert, etc.
 */
export const aspectRatioIconMap: Record<string, JSX.Element> = {
  '1:1': (
    <div className='w-[15px] h-[15px] rounded-sm border border-current' />
  ),
  '4:3': (
    <div className='w-[16px] h-[12px] rounded-sm border border-current' />
  ),
  '16:9': (
    <div className='w-[16px] h-[9px] rounded-sm border border-current' />
  ),
  '21:9': (
    <div className='w-[18px] h-[8px] rounded-sm border border-current' />
  ),
  '9:16': (
    <div className='w-[9px] h-[16px] rounded-sm border border-current' />
  ),
  '3:4': (
    <div className='w-[12px] h-[16px] rounded-sm border border-current' />
  ),
  '9:21': (
    <div className='w-[8px] h-[18px] rounded-sm border border-current' />
  ),
};

export default aspectRatioIconMap;
