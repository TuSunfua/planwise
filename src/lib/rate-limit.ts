import "server-only";

import { deleteEventsBefore, insertEventBelowLimit } from "@/db/queries/rate-limits";
import { HOUR_MS } from "@/lib/config";
import { keyedHash } from "@/lib/keyed-hash";

type Limit = "code:email" | "code:ip" | "try:ip";

// False means the limit for the last hour is used up.
export async function takeFromLimit(limit: Limit, subject: string, max: number): Promise<boolean> {
  const now = new Date();
  return insertEventBelowLimit(await keyedHash(`${limit}:${subject}`), max, now, new Date(now.getTime() - HOUR_MS));
}

export async function forgetOldEvents(): Promise<void> {
  await deleteEventsBefore(new Date(Date.now() - HOUR_MS));
}
