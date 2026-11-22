# 0002: Run Next.js on Workers with OpenNext

- **Status:** Accepted, except the R2 cache: superseded by [0009](0009-services-when-needed.md)
- **Date:** 2026-11-22

## Context

The scaffold is Next.js 16.4.6 with `cacheComponents`, `partialPrefetching` and Turbopack. Next.js has no verified Cloudflare adapter yet.

Cloudflare recommends [vinext](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) for new apps and positions OpenNext for existing ones. However, vinext reimplements Next.js on Vite, is described by Cloudflare as beta, [documents incomplete Cache Components support](https://github.com/cloudflare/vinext#known-gaps-were-working-on), and does not run Turbopack loader configuration.

## Evidence

On 2026-11-22 a throwaway copy of the scaffold was built with `@opennextjs/cloudflare` 1.20.18 and run locally in workerd with Wrangler 4.166.0.

| Configuration | Result |
| --- | --- |
| Cache Components, no incremental cache | Pages returned 500 |
| Cache Components, R2 incremental cache | Static page, streamed cookie read and `use cache` worked |
| Cache Components off | Pages worked |
| `proxy.ts`, with or without Cache Components | **500 on requests with a cookie**, in cookie parsing |
| `proxy.ts`, request without a cookie | 200 |
| Deprecated Edge `middleware.ts` | Worked |
| D1 and R2 bindings | Worked; a failed D1 batch rolled back |
| 300 requests, 20 concurrent, distinct cookies | Each response showed only its own cookie |
| Bundle with the test routes | 5,801 KiB uncompressed, 1,243 KiB gzip, within the 64 MiB limit |

OpenNext also warned at build time that Cache Components is [not fully supported](https://github.com/opennextjs/opennextjs-cloudflare/pull/1318), and Next.js warned at runtime about workerd's `setTimeout()` behavior.

**Not tested:** a real deployment, production CPU time, Server Actions, tag revalidation, behavior across isolates, client navigation in a browser, and vinext itself.

## Decision

- Use OpenNext, with exactly pinned versions.
- Keep Cache Components and always configure the R2 incremental cache.
- Do not cache user data across requests.
- Do not use `proxy.ts` or deprecated `middleware.ts`. Resolve auth in the server layer and set headers in `next.config.ts`.

## Alternatives

- **vinext:** Cloudflare's recommendation and possibly the long-term answer, but its documented gaps fall on features this scaffold enables.
- **OpenNext with Cache Components off:** the fallback if M0 testing finds blocking defects.
- **Static export:** cannot support server rendering or Server Actions.
- **A different framework:** better native Workers support, but discards the chosen scaffold.

## Consequences

- We keep the real Next.js compiler and runtime.
- We run against Cloudflare's current recommendation and must watch for OpenNext support to decline.
- Every framework upgrade needs a workerd smoke test.
- Revisit when vinext fully supports Cache Components, a verified Cloudflare adapter ships, or the Proxy bug is fixed.
