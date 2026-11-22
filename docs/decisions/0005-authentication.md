# 0005: Passwordless sign-in with Better Auth

- **Status:** Accepted. Delivery is decided in [0007](0007-free-cost-external-email.md)
- **Date:** 2026-11-22

## Context

Both phases need accounts and Phase 2 needs verified emails for invitations. Auth must run on Workers within the Free plan's CPU limit and store its data on Cloudflare. The owner chose email as the only sign-in method.

## Decision

Use Better Auth with the Drizzle adapter on D1, and email one-time codes as the only sign-in method. Codes are sent through one wrapper, `lib/email.ts`, so the sender can be chosen later. Create the auth instance per request.

## Alternatives

- **Google or other social sign-in:** not wanted for now; can be added later.
- **Passwords:** add reset flows, breach exposure and CPU-heavy hashing.
- **Magic links:** can be consumed by mail scanners and are awkward across devices.
- **Cloudflare Access:** designed to protect internal apps, not for consumer sign-up.
- **Hosted auth providers:** put identity data outside Cloudflare.
- **Custom auth:** avoidable security risk.

## Consequences

- No passwords to protect and emails are verified by design.
- Sign-in depends on email delivery, which the Free plan can't provide to the public ([ADR 0006](0006-free-plan.md#email)).
- Better Auth on this exact stack is untested and must be proven in M1, especially its transaction use on D1.
