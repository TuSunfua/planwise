"use client";

import Link from "next/link";
import { useEffect } from "react";

// A page load, not redirect(): the router keeps a redirect thrown while rendering and replays it after sign-in,
// which sends the person straight back out.
export function SignInRequired() {
  useEffect(() => {
    window.location.replace("/sign-in");
  }, []);

  return (
    <p className="text-muted-foreground">
      <Link href="/sign-in" className="inline-flex min-h-11 items-center font-semibold text-link underline">
        Sign in to continue
      </Link>
    </p>
  );
}
