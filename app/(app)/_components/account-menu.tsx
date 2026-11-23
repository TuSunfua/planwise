import { signOutAction, signOutEverywhereAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import type { Account } from "@/lib/schemas/account";

export function AccountMenu({ account }: { account: Account }) {
  return (
    <details className="relative">
      <summary className="flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Account
      </summary>
      <div className="absolute end-0 z-10 mt-2 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-lg border bg-popover p-3 shadow-lg">
        <p className="px-1 text-sm break-all text-muted-foreground">{account.email}</p>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
        <form action={signOutEverywhereAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign out on all devices
          </Button>
        </form>
      </div>
    </details>
  );
}
