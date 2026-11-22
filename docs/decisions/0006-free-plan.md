# 0006: Run on Cloudflare's Free plan

- **Status:** Accepted, except the Email section, superseded by [0007](0007-free-cost-external-email.md), and the R2 section,
  superseded by [0009](0009-services-when-needed.md)
- **Date:** 2026-11-22

## Context

PlanWise is free for its users. The owner chose to run it on Cloudflare's Free plan.

## Decision

Use Free for staging and production and design within its [limits](../platform/cloudflare.md#free-plan-limits).
Anything that needs payment is the owner's decision, taken in a new ADR.

## Known conflicts

### CPU

Free allows 10 ms of CPU per request, with some tolerance for occasional overruns. A Worker that exceeds it
consistently is stopped with error 1102.

The scaffold plus test routes was built with OpenNext and measured on 2026-11-22 in local workerd on an
i5-11400H, after warm-up:

| Request | Process CPU | App isolate, profiled |
| --- | --- | --- |
| Static page | 6.5 ms | 9.1 ms |
| Route Handler with D1 and R2 | 12.9 ms | 15.2 ms |
| Dynamic page reading a cookie | 16.0 ms | 16.2 ms |
| Dynamic page with 100 tasks | 26.5 ms | 26.8 ms |

Cold requests were higher. Local numbers include simulator or profiler overhead and differ from Cloudflare's
hardware, so they signal a risk and don't prove a failure. Auth and real queries will add to them.

**Gate:** the first task of M0 deploys a throwaway test to a Free account and reads CPU time and 1102 errors
from Workers Logs, before anything is built on this stack. If it doesn't fit, the options are:

1. Workers Paid, from $5 per month: no code change.
2. A static app shell with data from small Route Handlers outside Next.js's rendering: more code, no SSR.
3. A lighter framework: supersedes ADR 0002.

### Email

Email Service on Free sends only to verified destination addresses in the Cloudflare account, and needs a
domain on Cloudflare. It cannot send sign-in codes to the public. Options:

1. Workers Paid: 3,000 emails per month included, all on Cloudflare.
2. An external email provider with a free tier: an exception to [ADR 0001](0001-cloudflare-only.md).

Until then, local development uses Wrangler's simulated email and staging can send to the owner's verified
address. Passwords are not a way around this: hashing them safely costs far more than 10 ms of CPU, and
resets still need email.

### R2

R2 has a free tier but must be enabled through a checkout on the account, and usage above the tier is
billed. Stay inside it with the attachment limits and a usage alert.

## Consequences

- No fixed cost.
- Quotas are daily and shared by staging and production. When one runs out, that service fails until 00:00 UTC.
- Recovery history is 7 days instead of 30.
- Performance budgets are part of every feature.
