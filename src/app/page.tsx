import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
      <h1>
        <Logo variant="full" className="w-[440px] max-w-full" />
      </h1>
      <p className="text-xl text-muted-foreground">Plan on your own. Get it done together.</p>
      {/* The Inbox sends whoever is signed out to sign-in. */}
      <Link href="/inbox" className={buttonVariants()}>
        Start planning
      </Link>
    </main>
  );
}
