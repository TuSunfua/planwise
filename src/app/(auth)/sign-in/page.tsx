import type { Metadata } from "next";
import Link from "next/link";

import { DayPreview } from "@/app/(auth)/sign-in/_components/day-preview";
import { SignInForm } from "@/app/(auth)/sign-in/_components/sign-in-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Sign in" };

// Keep this page fully static. On a partially prerendered page, Next.js 16.4.6 answers a form posted before
// hydration with the streamed part alone: no page and no form. Fixed in 16.5 (next.js#99756).
export default function SignInPage() {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <main className="flex flex-col px-5 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          className="self-start rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Logo variant="full" className="w-[180px]" />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <SignInForm />
        </div>
      </main>
      <DayPreview />
    </div>
  );
}
