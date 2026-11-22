# 0009: Add each service when the app first needs it

- **Status:** Accepted
- **Date:** 2026-11-22
- **Supersedes:** the R2 cache in [0002](0002-nextjs-on-workers.md) and the R2 section of [0006](0006-free-plan.md)

## Context

The goal is no cost ([0007](0007-free-cost-external-email.md)). Every service created early is one more quota,
secret and possible bill. R2 in particular needs a checkout and bills above its free tier, and the plan used
it from M0 only as Next.js's cache.

## Decision

- Create a service, account, binding or environment in the milestone whose feature first uses it, never
  earlier. The schedule is in [cloudflare.md](../platform/cloudflare.md#services).
- Don't create a service for what one already in use can do well enough.
- **No R2 until attachments (M4).** Next.js's incremental cache uses OpenNext's read-only Static Assets cache.
- No `use cache` and no revalidation while the cache is read-only: prerendered content changes on deploy.

## Evidence

On 2026-11-22 the app was built with that cache and run in local workerd with no storage binding at all:

| Check | Result |
| --- | --- |
| Static page, streamed cookie read, dynamic route, with and without a cookie | 200 |
| Server Action setting a cookie, then `refresh()`, in Chrome | Updated each time and survived a reload |
| 300 requests, 20 concurrent, distinct cookies | Each response showed only its own cookie |
| Server errors in the above | None |
| `use cache` at request time | Logged errors and recomputed every time |
| Process CPU after warm-up: static, dynamic, 100-task page | 5.0, 13.3, 22.9 ms: the CPU gate in 0006 stands |

Local workerd served the cache files under `/cdn-cgi/_next_cache/` to any client. OpenNext says only the
Worker can read that path when deployed. The M0 deployment test must confirm it. Those files hold only
prerendered shells, and no secret or user data may ever be prerendered.

## Alternatives

- **R2 cache from M0:** supports `use cache`, but needs a checkout for something no feature uses yet.
- **KV cache:** free, but another service, eventually consistent and discouraged by OpenNext for this.
- **Cache Components off:** not needed, since it works with the static cache.

## Consequences

- No payment method is needed before M4.
- Data needing a shared runtime cache requires a new ADR.
- R2 arriving in M4 is for files. It doesn't automatically become the cache.
