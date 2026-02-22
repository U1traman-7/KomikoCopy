import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getNavItems } from '../constants';
interface MobileNavProps {
  setShowMobileMenu: (show: boolean) => void;
}

export function MobileNav({ setShowMobileMenu }: MobileNavProps) {
  const { t } = useTranslation('common');
  const items = getNavItems(t);

  return (
    <div className='fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 sm:hidden bg-black/40'>
      <div className='grid relative z-20 p-4 rounded-md border shadow-md bg-background border-border transition-none'>
        <div className='flex justify-end items-center'>
          <button
            className='rounded-sm opacity-70 transition-opacity ring-offset-background hover:opacity-100'
            onClick={() => setShowMobileMenu(false)}>
            <X size={24} />
            <span className='sr-only'>Close</span>
          </button>
        </div>
        <nav className='grid grid-flow-row auto-rows-max text-sm'>
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className='flex items-center p-2 w-full text-sm font-medium rounded-md hover:underline'
              onClick={() => setShowMobileMenu(false)}>
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
