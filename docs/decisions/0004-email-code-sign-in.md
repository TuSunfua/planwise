# 0004: Passwordless sign-in with Better Auth

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

Both phases need accounts, and Phase 2 needs verified emails for invitations. The owner chose email as the only
sign-in method.

## Decision

- Better Auth with its Drizzle adapter, and emailed 6-digit codes as the only way to sign in.
- No `/api/auth` route: only Server Actions call Better Auth, through `data/auth.ts`, so nothing skips our limits.
- Our code creates and sends each code, because Better Auth's send callback swallows failures.
- Codes are stored as keyed hashes, not Better Auth's plain SHA-256, which is reversed instantly for six digits.

## Alternatives

- **Auth.js (NextAuth):** in maintenance by Better Auth's team, which recommends Better Auth for new projects. Its
  email codes have no attempt limit: in a test the right code still worked after 300 wrong guesses.
- **Passwords:** reset flows, breach exposure and hashing cost; one OWASP-strength hash took about 150 ms of CPU.
- **Social sign-in:** not wanted for now; can be added later.
- **Magic links:** consumed by mail scanners and awkward across devices.
- **Hosted auth:** identity data with another vendor.

## Consequences

- No passwords to protect, and emails are verified by design.
- Sign-in depends on email delivery and its quota ([0005](0005-email-and-bots.md)).
- Proven in integration tests: attempts, expiry, single use, parallel use, limits and revocation.
