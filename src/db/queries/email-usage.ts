import { and, gte, lte, sql, sum } from "drizzle-orm";

import { getDb } from "@/db/client";
import { emailUsage } from "@/db/schema";

const BUDGET_LOCK = "email-budget";

export async function incrementSignInEmails(now: Date, perDay: number, perMonth: number): Promise<boolean> {
  const day = now.toISOString().slice(0, 10);
  const firstOfMonth = `${day.slice(0, 7)}-01`;

  // One lock for the whole budget, so parallel sends can't each see the last free email.
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${BUDGET_LOCK}))`);
    const total = async (from: string) => {
      const [row] = await tx
        .select({ n: sum(emailUsage.count).mapWith(Number) })
        .from(emailUsage)
        .where(and(gte(emailUsage.day, from), lte(emailUsage.day, day)));
      return row?.n ?? 0;
    };
    if ((await total(day)) >= perDay || (await total(firstOfMonth)) >= perMonth) return false;

    await tx
      .insert(emailUsage)
      .values({ day, purpose: "sign_in", count: 1, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [emailUsage.day, emailUsage.purpose],
        set: { count: sql`${emailUsage.count} + 1`, updatedAt: now },
      });
    return true;
  });
}
