import "server-only";

import { getConfig } from "@/lib/config";
import { ServiceUnavailable } from "@/lib/errors";

// No sender exists until Resend and BotID are set up (ADR 0005), so anything deployed refuses to send.
export function assertCanSendEmail(): void {
  if (!getConfig().isLocal) throw new ServiceUnavailable("No email sender is configured");
}

export function sendSignInCode(email: string, code: string): void {
  assertCanSendEmail();
  console.log(`\n  Sign-in code for ${email}: ${code}\n`);
}
