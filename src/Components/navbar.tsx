/*eslint-disable */
import type { User } from 'next-auth';

import { Button } from './common/button';

import useScroll from '../hooks/useScroll';
import { useSigninModal } from '../hooks/use-sigin-modal';
import { MainNav } from './main-nav';
import { UserAccountNav } from './user-account-nav';
import React, { useState } from 'react';
import { MobileNav } from './mobile-nav';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AvatarSetting from './AvatarSetting';
import LanguageToggle from './LanguageToggle';
import { Promotion } from './Header/Header';

type Dictionary = Record<string, string>;

interface NavBarProps {
  user: Pick<User, 'name' | 'image' | 'email'> | undefined;
  children?: React.ReactNode;
  rightElements?: React.ReactNode;
  scroll?: boolean;
}

export function NavBar({
  user,
  children,
  rightElements,
  scroll = false,
}: NavBarProps) {
  const scrolled = useScroll(50);
  const signInModal = useSigninModal();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { t } = useTranslation('landing');

  return (
    <div className='sticky top-0 z-20'>
      <Promotion />
      <header
        className={`flex w-full p-0 justify-center border-border transition-colors ${
          scroll
            ? scrolled
              ? 'border-b bg-muted'
              : 'border-b bg-muted'
            : 'border-b bg-muted'
        }`}>
        <div className='container flex justify-between items-center py-3 h-12 md:py-4 md:h-16 min-w-0'>
          <MainNav
            showMobileMenu={showMobileMenu}
            setShowMobileMenu={setShowMobileMenu}>
            {children}
          </MainNav>

          <div className='flex items-center space-x-2 sm:space-x-3 flex-shrink-0'>
            {rightElements}

            {/* Show language toggle for non-logged-in users */}
            {!user && <LanguageToggle />}

            {/* <LocaleChange url={"/"} /> */}
            {!user ? (
              <Link href='/' className='hidden lg:block'>
                <Button
                  className='px-2 sm:px-3 text-sm whitespace-nowrap'
                  variant='default'
                  size='sm'>
                  {t('create_now')}
                </Button>
              </Link>
            ) : null}

            {user && <AvatarSetting className='ml-2' />}

            <button
              className='flex items-center lg:hidden'
              onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <Menu size={24} />
            </button>
          </div>
        </div>

        {showMobileMenu && <MobileNav setShowMobileMenu={setShowMobileMenu} />}
      </header>
    </div>
  );
}
