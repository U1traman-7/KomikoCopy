import { ModalProvider } from "@/components/modal-provider";
import { NavBar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { i18nDict as dict } from '@/utils/index'
import { useUser } from "hooks/useUser";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar
        scroll={true}
        user={user}
      />
      <ModalProvider />
      <main className="flex-1">{children}</main>
      <SiteFooter
        className="border-border"
      />
    </div>
  );
}
