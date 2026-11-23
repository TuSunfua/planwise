"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-[22px]/7 font-[780]">Something went wrong</h1>
      <p className="text-muted-foreground">Nothing you saved is lost. Try loading this page again.</p>
      <Button type="button" onClick={retry}>
        Reload this page
      </Button>
    </main>
  );
}
