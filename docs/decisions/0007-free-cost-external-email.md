# 0007: Keep the cost at zero, with an external email sender

- **Status:** Accepted
- **Date:** 2026-11-22
- **Supersedes:** the email parts of [0001](0001-cloudflare-only.md) and [0006](0006-free-plan.md), and the
  delivery part of [0005](0005-authentication.md)

## Context

Sign-up is public, so a sign-in code must reach any address. Cloudflare's Free plan emails only verified
destination addresses. The owner's goal is to run the app at no cost; using only Cloudflare was a means to that.

## Decision

- Running PlanWise costs nothing. A choice that can bill needs the owner's approval.
- Cloudflare still hosts compute, data, files, jobs and real-time.
- Email is the one exception: an external provider on a free tier that stops at its quota instead of billing.
- The provider is reached only through `lib/email.ts`, over HTTPS, so it can be replaced in one file.
- Sign-in stays by emailed one-time code ([0005](0005-authentication.md)).

Which provider is a separate decision: [0008](0008-resend-and-turnstile.md).

## Alternatives

- **Workers Paid with Cloudflare Email Service:** not free.
- **Invite-only with verified addresses:** free, but sign-up must be public.
- **Passwords and no sender:** possible, unlike what 0006 says. scrypt can run in a Durable Object, which has
  its own 30-second CPU budget (about 0.14 s per hash in local workerd, untested when deployed). Not chosen:
  without email there is no account recovery, no verified address and no email for invitations or reminders.

## Consequences

- Anyone can sign up, and invitations and reminders keep working by email.
- A second vendor holds recipients' addresses and message content, which the privacy policy discloses.
- The sender's quota becomes a limit on sign-ins and needs protecting from abuse.
- A domain with DNS access is needed before real email works.
- If Workers Paid is ever adopted, revisit Cloudflare Email Service.
