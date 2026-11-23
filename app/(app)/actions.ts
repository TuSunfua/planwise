"use server";

import { redirect } from "next/navigation";

import { signOut, signOutEverywhere } from "@/data/auth";
import { runAction } from "@/lib/actions";
import type { Result } from "@/lib/actions";

// Failing shows the error page: signing out must never look like it worked when it didn't.
function leave(result: Result<void>): never {
  if (!result.ok && result.error.code !== "unauthenticated") throw new Error(`Sign-out failed: ${result.error.code}`);
  redirect("/sign-in");
}

export async function signOutAction(): Promise<void> {
  leave(await runAction(signOut));
}

export async function signOutEverywhereAction(): Promise<void> {
  leave(await runAction(signOutEverywhere));
}
