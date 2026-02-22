import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getNavItems } from '../constants';

interface MainNavProps {
  children?: React.ReactNode;
  showMobileMenu?: boolean;
  setShowMobileMenu?: (show: boolean) => void;
}

export function MainNav({
  children,
  showMobileMenu,
  setShowMobileMenu,
}: MainNavProps) {
  const { t } = useTranslation('common');
  const items = getNavItems(t);

  return (
    <div className='flex gap-2 md:gap-4 flex-1 min-w-0'>
      <Link
        href={'/'}
        className='flex items-center space-x-2 basis-[60px] sm:basis-[80px] md:basis-[100px] flex-shrink-0 flex-grow-0'>
        <div>
          <Image
            // src="/images/avatars/saasfly-logo.svg"
            src='/images/logo_new.webp'
            width='100'
            height='50'
            alt=''
            className='w-[60px] sm:w-[80px] md:w-[100px] h-auto dark:brightness-110'
          />
        </div>
      </Link>
      {/* //todo below is the saasfly locale based routing that we may/not use in future */}
      <div className='hidden md:flex items-center gap-4 overflow-x-auto'>
        {items?.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className='flex items-center text-sm lg:text-[1rem] font-strong transition-colors text-foreground/80 hover:text-foreground/100 whitespace-nowrap flex-shrink-0'>
            {item.title}
          </Link>
        ))}
      </div>
      {/* {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? <Icons.Close /> : <Icons.Logo />}
        <span className="font-bold">{t('nav.menu')}</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} menuItemClick={handleMenuItemClick}>
          {children}
        </MobileNav>
      )} */}
    </div>
  );
}
