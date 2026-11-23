import { Suspense } from "react";

import { AccountMenu } from "@/app/(app)/_components/account-menu";
import { Logo } from "@/components/logo";
import { getAccount } from "@/data/auth";

async function SignedInAccount() {
  const account = await getAccount();
  return account && <AccountMenu account={account} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="flex min-h-[54px] items-center justify-between gap-4 border-b bg-sidebar px-4">
        <Logo variant="horizontal" className="w-[130px]" />
        <Suspense fallback={null}>
          <SignedInAccount />
        </Suspense>
      </header>
      {children}
    </>
  );
}
