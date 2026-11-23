import "server-only";

import { z } from "zod";

export const HOUR_MS = 60 * 60 * 1000;

export const AUTH = {
  codeExpiresInSeconds: 10 * 60,
  codeAttempts: 5,
  sessionExpiresInSeconds: 30 * 24 * 60 * 60,
  codesPerEmailPerHour: 3,
  codesPerIpPerHour: 10,
  triesPerIpPerHour: 30,
} as const;

// The provider's limits. Sign-in is the only purpose that sends so far.
export const EMAIL_BUDGET = { perDay: 100, perMonth: 3000 } as const;

const environmentSchema = z.object({
  APP_ENV: z.string().optional(),
  APP_URL: z.url({ protocol: /^https?$/ }),
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

interface Config {
  appUrl: string;
  authSecret: string;
  databaseUrl: string;
  isHttps: boolean;
  // Fails closed: a deployment is https, so it can never count as local.
  isLocal: boolean;
}

// The only reader of process.env.
export function getConfig(): Config {
  const parsed = environmentSchema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Missing or invalid configuration: ${names}. See .env.example.`);
  }

  const { APP_ENV, APP_URL, AUTH_SECRET, DATABASE_URL } = parsed.data;
  const isHttps = new URL(APP_URL).protocol === "https:";
  return {
    appUrl: APP_URL,
    authSecret: AUTH_SECRET,
    databaseUrl: DATABASE_URL,
    isHttps,
    isLocal: APP_ENV === "local" && !isHttps,
  };
}
