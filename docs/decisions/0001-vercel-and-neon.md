# 0001: Run on Vercel and Neon at no cost

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

PlanWise is free for its users and must cost nothing to run. One developer maintains it. Next.js renders pages on the
server, and an earlier plan on Cloudflare Workers allowed 10 ms of CPU per request on the free plan: local
measurements put signed-in pages at 20 to 35 ms.

## Decision

- Host the Next.js app on **Vercel Hobby**, in one region next to the database.
- Keep data in **Postgres on Neon Free** ([0002](0002-postgres-on-neon.md)).
- Send email with **Resend Free** ([0005](0005-email-and-bots.md)).
- Create each service in the milestone that first needs it, never earlier. The schedule is in
  [hosting.md](../platform/hosting.md#services).
- Anything that can bill needs the owner's approval in a new ADR.

## Alternatives

- **Cloudflare Workers Free:** generous and never pauses, but 10 ms of CPU leaves no room for server rendering.
- **Workers Paid ($5 a month):** removes the limit, but isn't free.
- **Netlify Free:** 300 credits a month is little compute.
- **Deno Deploy:** shuts down in April 2027.
- **Render Free:** web services sleep and the free database expires.
- **A free virtual machine:** free compute, but patching and uptime become our job.

## Consequences

- Next.js runs where it is built to run, with no adapter and no per-request CPU limit.
- Free limits are monthly. Passing one pauses the Vercel project for 30 days, without billing.
- Vercel Hobby is for personal, non-commercial use; charging money means moving to Pro first.
- No WebSockets and cron only once a day on Hobby: live updates and reminders need their own answers
  ([0007](0007-live-updates-over-sse.md), [0009](0009-scheduled-work.md)).
- Revisit if usage approaches a monthly limit or the project starts earning money.
