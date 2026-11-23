import "server-only";

import { headers } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";

interface RequestInfo {
  headers: Headers;
  id: string;
  ip: string;
}

export const getRequest = cache(async (): Promise<RequestInfo> => {
  await connection(); // the ID below is random, which a prerender refuses
  const incoming = new Headers(await headers());
  return {
    headers: incoming,
    id: incoming.get("x-vercel-id") ?? crypto.randomUUID(),
    // Vercel overwrites this header with the client's address, so a client can't choose it.
    ip: incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  };
});
