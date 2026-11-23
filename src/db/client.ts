import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getConfig } from "@/lib/config";

// One pool per server instance: it holds connections, never request or user data. Kept on globalThis so
// development's hot reloads don't open a new pool each time.
const shared = globalThis as typeof globalThis & { planwisePool?: Pool };

export function getDb(): NodePgDatabase {
  shared.planwisePool ??= new Pool({
    connectionString: getConfig().databaseUrl,
    max: 5,
    idleTimeoutMillis: 10_000, // releases Neon's compute sooner, so it can scale to zero
  });
  return drizzle({ client: shared.planwisePool });
}
