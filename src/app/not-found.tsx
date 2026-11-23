import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-[22px]/7 font-[780]">Page not found</h1>
      <p className="text-muted-foreground">It may have moved, or you may not have access to it.</p>
      <Link href="/" className={buttonVariants()}>
        Go to the home page
      </Link>
    </main>
  );
}
