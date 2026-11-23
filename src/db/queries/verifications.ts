import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { verifications } from "@/db/schema";

export async function deleteVerification(identifier: string): Promise<void> {
  await getDb().delete(verifications).where(eq(verifications.identifier, identifier));
}
