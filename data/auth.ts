import "server-only";

import { isAPIError } from "better-auth/api";
import { cache } from "react";

import { incrementSignInEmails } from "@/db/queries/email-usage";
import { createSignInCode, getAuth, isCodeReplaced } from "@/lib/auth";
import { AUTH, EMAIL_BUDGET } from "@/lib/config";
import { assertCanSendEmail, sendSignInCode } from "@/lib/email";
import { InvalidRequest, NotAuthenticated, ServiceUnavailable, TooManyRequests } from "@/lib/errors";
import { getLogger } from "@/lib/logging";
import { forgetOldEvents, takeFromLimit } from "@/lib/rate-limit";
import { getRequest } from "@/lib/request";
import type { Account } from "@/lib/schemas/account";
import { requestCodeSchema, signInSchema } from "@/lib/schemas/sign-in";

export async function requestSignInCode(input: unknown): Promise<{ email: string }> {
  const parsed = requestCodeSchema.safeParse(input);
  if (!parsed.success) throw new InvalidRequest("Invalid email", { email: "invalid" });

  const { email } = parsed.data;
  const { id, ip } = await getRequest();
  const log = getLogger({ request_id: id });

  assertCanSendEmail();
  await forgetOldEvents();
  // The IP first, so a blocked IP can't use up somebody else's address.
  if (!(await takeFromLimit("code:ip", ip, AUTH.codesPerIpPerHour))) {
    log.info("Sign-in code refused: IP limit");
    throw new TooManyRequests("Too many codes for this IP");
  }
  if (!(await takeFromLimit("code:email", email, AUTH.codesPerEmailPerHour))) {
    log.info("Sign-in code refused: address limit");
    throw new TooManyRequests("Too many codes for this address");
  }
  if (!(await incrementSignInEmails(new Date(), EMAIL_BUDGET.perDay, EMAIL_BUDGET.perMonth))) {
    log.warn("Sign-in code refused: email budget");
    throw new ServiceUnavailable("The email budget is used up");
  }

  const code = await createSignInCode(email);
  sendSignInCode(email, code);
  log.info("Sign-in code sent");
  return { email };
}

export async function signInWithCode(input: unknown): Promise<void> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) throw new InvalidRequest("Invalid code", { code: "incomplete" });

  const { id, ip, headers } = await getRequest();
  const log = getLogger({ request_id: id });
  if (!(await takeFromLimit("try:ip", ip, AUTH.triesPerIpPerHour))) {
    log.info("Sign-in refused: IP limit");
    throw new TooManyRequests("Too many tries for this IP");
  }

  try {
    const { email, code } = parsed.data;
    const { user } = await getAuth().api.signInEmailOTP({ body: { email, otp: code }, headers });
    getLogger({ request_id: id, user_id: user.id }).info(`User ${user.id}: signed in`);
  } catch (error) {
    if (isCodeReplaced(error)) throw new InvalidRequest("Code replaced", { code: "wrong_or_expired" });
    if (!isAPIError(error) || error.statusCode >= 500) throw error;
    const reason = error.body?.code === "TOO_MANY_ATTEMPTS" ? "too_many_attempts" : "wrong_or_expired";
    log.info(`Sign-in refused: ${reason}`);
    throw new InvalidRequest("Code refused", { code: reason });
  }
}

export const getAccount = cache(async (): Promise<Account | null> => {
  const { id, headers } = await getRequest();
  // Skips the database for visitors who have no session cookie.
  if (!headers.get("cookie")?.includes("session_token=")) return null;

  try {
    const session = await getAuth().api.getSession({ headers });
    return session ? { id: session.user.id, email: session.user.email } : null;
  } catch (error) {
    if (!isAPIError(error)) throw error;
    // Not rethrown with its cause, whose message holds the session token.
    getLogger({ request_id: id }).error("Session lookup failed");
    throw new ServiceUnavailable("Session lookup failed");
  }
});

export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) throw new NotAuthenticated("No session");
  return account;
}

export async function signOut(): Promise<void> {
  const account = await getAccount();
  const { id, headers } = await getRequest();
  const auth = getAuth();
  await auth.api.signOut({ headers });
  if (!account) return;
  // Better Auth swallows a failed delete, which would leave a session that only looks signed out.
  if (await auth.api.getSession({ headers })) throw new ServiceUnavailable("The session wasn't revoked");
  getLogger({ request_id: id, user_id: account.id }).info(`User ${account.id}: signed out`);
}

export async function signOutEverywhere(): Promise<void> {
  const account = await requireAccount();
  const { id, headers } = await getRequest();
  const auth = getAuth();
  await auth.api.revokeSessions({ headers });
  await auth.api.signOut({ headers }); // clears this browser's cookie
  getLogger({ request_id: id, user_id: account.id }).info(`User ${account.id}: all sessions revoked`);
}
