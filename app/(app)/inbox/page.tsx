import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SignInRequired } from "@/app/(app)/_components/sign-in-required";
import { getInbox } from "@/data/projects";
import { NotAuthenticated, NotFound } from "@/lib/errors";

export const metadata: Metadata = { title: "Inbox" };

async function Inbox() {
  try {
    await getInbox();
  } catch (error) {
    if (error instanceof NotAuthenticated) return <SignInRequired />;
    if (error instanceof NotFound) notFound();
    throw error;
  }

  return (
    <>
      <h1 className="text-[22px]/7 font-[780]">Inbox</h1>
      <p className="rounded-md border bg-card p-6 text-muted-foreground">
        Your Inbox is ready. It&apos;s empty for now.
      </p>
    </>
  );
}

export default function InboxPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Loading your Inbox…</p>}>
        <Inbox />
      </Suspense>
    </main>
  );
}
