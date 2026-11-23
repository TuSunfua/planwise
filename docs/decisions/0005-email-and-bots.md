# 0005: Send with Resend, stop bots with Vercel BotID

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

Sign-up is public, so a code must reach any address. A public form that sends email lets a bot spend the whole quota
and lock everyone out of sign-in.

## Decision

- Send with Resend's free plan: 100 emails a day, 3,000 a month, stopping at the limit. Reach it only through
  `lib/email.ts`.
- Check Vercel BotID (basic, free on Hobby) on the server before any code is sent.
- Enforce the [email budget](../platform/hosting.md#email-budget) in Postgres, reserving most of it for sign-in,
  after limits per address and per IP.

## Alternatives

- **Cloudflare Turnstile:** free, but a second platform for one check.
- **Rate limits alone:** a bot using many addresses and IPs still empties the quota.
- **Brevo or SMTP2GO:** account approval, or a third of Resend's volume.

## Consequences

- About 3,000 sign-in emails a month, at most 100 on any day.
- Resend keeps message content, including codes, in the United States for 30 days: codes stay short-lived and
  single-use, and the account uses two-factor authentication.
- A sending domain with DNS access is needed before real email works.
- Revisit when sends regularly pass 70 a day.
