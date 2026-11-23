import "server-only";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { cache } from "react";

import { getDb } from "@/db/client";
import { ensureInbox } from "@/db/queries/projects";
import { deleteVerification } from "@/db/queries/verifications";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { AUTH, getConfig } from "@/lib/config";
import { newId } from "@/lib/ids";
import { keyedHash } from "@/lib/keyed-hash";
import { getLogger } from "@/lib/logging";

function createAuth() {
  const config = getConfig();

  return betterAuth({
    baseURL: config.appUrl,
    secret: config.authSecret,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      transaction: true,
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    session: {
      expiresIn: AUTH.sessionExpiresInSeconds,
      // Refreshing would be a database write while rendering. Never add cookieCache: it delays revocation.
      disableSessionRefresh: true,
    },
    // Runs before every session, so an Inbox that failed to appear at sign-up appears at the next try.
    databaseHooks: { session: { create: { before: async (session) => ensureInbox(session.userId) } } },
    advanced: {
      useSecureCookies: config.isHttps,
      ipAddress: { disableIpTracking: true },
      database: { generateId: () => newId() },
    },
    // data/auth.ts applies our own limits. There is no /api/auth route, so nothing can go around them.
    rateLimit: { enabled: false },
    telemetry: { enabled: false },
    logger: {
      // The other arguments can hold emails and tokens, so they are dropped.
      log: (level, message) => {
        getLogger()[level === "error" || level === "warn" ? level : "debug"](`Better Auth: ${message}`);
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: AUTH.codeExpiresInSeconds,
        allowedAttempts: AUTH.codeAttempts,
        storeOTP: { hash: (code) => keyedHash(`code:${code}`) },
        // Better Auth swallows this callback's failures, so data/auth.ts creates and sends codes itself.
        sendVerificationOTP: () => Promise.reject(new Error("Send through data/auth.ts")),
      }),
      nextCookies(), // must stay last
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;

// Per request, so its options always reflect the current configuration and nothing leaks between requests.
export const getAuth: () => Auth = cache(createAuth);

/**
 * The only way to create a code. Better Auth's server-only endpoint doesn't replace the previous one, so the
 * unique index would refuse every resend. The identifier format is Better Auth's; the resend test guards it.
 */
export async function createSignInCode(email: string): Promise<string> {
  // Parallel sends collide on that index. The per-address limit lets no more than this many run at once.
  for (let attempt = 1; ; attempt++) {
    await deleteVerification(`sign-in-otp-${email}`);
    try {
      return await getAuth().api.createVerificationOTP({ body: { email, type: "sign-in" } });
    } catch (error) {
      if (!isCodeConflict(error) || attempt >= AUTH.codesPerEmailPerHour) throw error;
    }
  }
}

// Also true when a wrong guess puts its code back after a new code was sent meanwhile.
export function isCodeConflict(error: unknown): boolean {
  const cause =
    error instanceof DrizzleQueryError
      ? (error.cause as { code?: string; constraint?: string } | undefined)
      : undefined;
  return cause?.code === "23505" && cause.constraint === "verifications_identifier_unique";
}
