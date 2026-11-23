import { and, count, eq, gt, lt, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { rateLimitEvents } from "@/db/schema";

export async function deleteEventsBefore(cutoff: Date): Promise<void> {
  await getDb().delete(rateLimitEvents).where(lt(rateLimitEvents.occurredAt, cutoff));
}

// The lock makes parallel requests for one key count one at a time, so none of them reads a stale count.
export async function insertEventBelowLimit(key: string, limit: number, now: Date, since: Date): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`);
    const [used] = await tx
      .select({ n: count() })
      .from(rateLimitEvents)
      .where(and(eq(rateLimitEvents.key, key), gt(rateLimitEvents.occurredAt, since)));
    if ((used?.n ?? 0) >= limit) return false;
    await tx.insert(rateLimitEvents).values({ key, occurredAt: now });
    return true;
  });
}
