import Link from "next/link";
import { useTranslation, Trans } from "react-i18next";
import cn from "classnames";
import { buttonVariants } from "../Components/common/button";

import { UserAuthForm } from "../Components/user-auth-form";
import { useLoginModal } from "hooks/useLoginModal";

export const metadata = {
  title: "Create an account",
  description: "Create an account to get started.",
};

export default function RegisterPage() {
  const { t } = useTranslation('register');
  useLoginModal(true);

  return (
    <div className="container grid flex-col justify-center items-center w-screen h-screen lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href={`/login`}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-4 right-4 md:right-8 md:top-8",
        )}
      >
        {t('login_button')}
      </Link>
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            {/*<Icons.Logo className="mx-auto w-6 h-6" />*/}
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('create_account_heading')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('email_instruction')}
            </p>
          </div>
          <UserAuthForm />
          <p className="px-8 text-sm text-center text-muted-foreground">
            <Trans i18nKey="terms" ns="register" components={{
              Link1: <Link href={`/terms`} className="underline hover:text-brand underline-offset-4"/>,
              Link2: <Link href={`/privacy`} className="underline hover:text-brand underline-offset-4"/>
            }}
            />
          </p>
        </div>
      </div>
    </div>
  );
}
