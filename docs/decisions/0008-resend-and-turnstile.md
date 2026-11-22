# 0008: Send with Resend, protect its quota with Turnstile

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

[0007](0007-free-cost-external-email.md) allows one external sender on a free tier. A public form that sends
email lets a bot spend the whole quota and lock everyone out of sign-in.

## Decision

- Send with [Resend](https://resend.com/docs/knowledge-base/account-quotas-and-limits)'s free plan: 100 emails
  per day, 3,000 per month and no overage billing. Use its Tokyo sending region and don't enable inbound
  email, which counts towards the same quota.
- Verify [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/plans/) (free) on the server before
  any code is sent.
- Enforce the [email budget](../platform/cloudflare.md#email-budget) in D1, reserving most of it for sign-in.

## Alternatives

- **Brevo:** 300 per day, but sending needs account approval.
- **SMTP2GO:** 1,000 per month, a third of Resend's.
- **Rate limits without Turnstile:** a bot using many addresses and IPs still empties the quota.

## Consequences

- About 3,000 sign-in emails per month, and at most 100 on any day.
- Resend stores account data, logs and message content in the United States for 30 days, whatever the sending
  region. Asia-Pacific was a preference, not a requirement.
- Codes appear in Resend's logs, so they stay short-lived and single-use, and access to that account uses
  two-factor authentication.
- Revisit when sends regularly pass 70 per day.
