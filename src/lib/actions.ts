import "server-only";

import { DrizzleQueryError } from "drizzle-orm/errors";
import { unstable_rethrow } from "next/navigation";

import { AppError } from "@/lib/errors";
import type { ErrorCode } from "@/lib/errors";

export interface ActionError {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export async function runAction<T>(work: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.code, fields: error.fields } };
    }
    // Drizzle's message lists the bound values: emails, code hashes, session tokens. Postgres's doesn't.
    if (error instanceof DrizzleQueryError) throw new Error("Database query failed", { cause: error.cause });
    throw error;
  }
}
