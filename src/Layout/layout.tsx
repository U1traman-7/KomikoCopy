import React from "react";
import { ModalProvider } from "@/components/modal-provider";
import { NavBar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { i18nDict as dict } from '@/utils/index';
import { useSession } from "next-auth/react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession()
  const { user } = session || {}

  return (
    <div className='flex flex-col min-h-screen'>
      <NavBar
        scroll={true}
        user={user}
        marketing={dict.marketing}
        dropdown={dict.dropdown}
      />
      <ModalProvider dict={dict.login} />
      <main className='flex-1 ios-safe-left ios-safe-right'>{children}</main>

      <SiteFooter
        className='border-border ios-safe-bottom'
        dict={dict.common}
      />
    </div>
  );
}
