# Cloudflare platform

The services we use, their limits, the environments and the bindings. Limits were checked against Cloudflare's documentation on 2026-11-22. Check again before relying on one.

## Services

A service is created in the milestone that first needs it, not before
([ADR 0009](../decisions/0009-services-when-needed.md)).

| Service | Use | Created in | Because |
| --- | --- | --- | --- |
| Workers | All compute | M0 | The app has to run |
| Workers Static Assets | JS, CSS, fonts, brand files, prerender cache | M0 | Part of every deployment |
| Workers Logs | Logs, errors, CPU time | M0 | The CPU gate reads it |
| D1 | Application and auth data | M1 | Accounts are the first data |
| Resend | Sign-in codes, later reminders and invitations | M1 | Sign-in |
| Turnstile | Keep bots from spending the email quota | M1 | Public sign-in form |
| R2 | Private attachments | M4 | FILE-01; if that is cut, no R2 |
| Cron Triggers | Reminders, purging | M4 | First scheduled work |
| Durable Objects | Live updates | M8 | LIVE-01 |

Added only if a need appears, each with an ADR:

| Service | Instead, for now | Add it when |
| --- | --- | --- |
| Queues | A D1 table swept by cron | Sweeps can't keep up |
| Rate Limiting binding | Counters in D1 and Turnstile | Counters cost too many D1 writes |
| A writable framework cache | Prerender at deploy, read D1 per request | Public data must change between deploys |

Not planned: Email Service (Free can't email the public), Pages, KV, Hyperdrive, Vectorize and Workers AI.

## Free plan limits

We run on **Free** ([ADR 0006](../decisions/0006-free-plan.md)). Daily quotas reset at 00:00 UTC and are
shared by every environment in the account.

| Resource | Free allows | Rule |
| --- | --- | --- |
| CPU per request and per cron run | 10 ms | Small renders; heavy work in SQL or the client; measure every feature |
| Worker requests | 100,000 per day | Static assets are free, so keep them out of the Worker; limit prefetching |
| Subrequests | 50 external, 1,000 to Cloudflare services | No fan-out |
| D1 queries | 50 per invocation; a batch counts as one | Batch; no query per row |
| D1 rows read | 5 million per day | Every query uses an index; a count reads every row it counts |
| D1 rows written | 100,000 per day, index updates included | No write on every request, such as refreshing a session |
| D1 storage | 500 MB per database, 5 GB per account, 10 databases | Alert at 250 MB |
| D1 recovery | 7 days | Export before each release |
| R2, from M4 | 10 GB, 1 million writes and 10 million reads per month | Needs the R2 checkout; cap attachments per user |
| Cron Triggers | 5 per account | One per environment, dispatching by schedule |
| Durable Objects | SQLite-backed only; 100,000 requests and 13,000 GB-s per day | Hibernating WebSockets |
| Workers Logs | 200,000 events per day, kept 3 days | Keep `info` quiet |
| Image transformations | 5,000 unique per month | Serve brand SVGs as they are |

## Staying free

The goal is no cost ([ADR 0007](../decisions/0007-free-cost-external-email.md)). Free-plan services stop at
their quota, with one exception:

- **R2, not used until M4, bills above its free tier** and needs a checkout to enable. Cap attachments per user and for the whole
  app, at 8 GB in total, and set a usage alert.
- Never turn on pay-as-you-go at the email provider.
- Renewing a domain is outside these limits and is the owner's cost.

## Email budget

Figures are for Resend's free plan ([ADR 0008](../decisions/0008-resend-and-turnstile.md)). They
live as constants in `lib/config.ts` and are counted in D1, per UTC day and month.

| Budget | Per day | Per month |
| --- | --- | --- |
| Provider's limit, all emails | 100 | 3,000 |
| Reminders, invitations and notifications together | 20 | 500 |
| Reserved for sign-in codes | the rest, at least 80 | the rest, at least 2,500 |

- Sign-in codes are sent during the request. Everything else goes through the jobs Worker, at most 40 per
  invocation (Free allows 50 external subrequests).
- Over the budget, reminders and notifications wait for the next day, and an invitation shows a link to copy.
- A provider 429 is never retried in a loop. Sign-in says that email is unavailable and when to try again.

## Location

Users are expected mostly in Asia. When their milestone comes, create D1 and R2 with the `apac` location
([how](../operations/deployment.md#creating-resources)). It is a placement preference, not a legal
residency guarantee, which is not required. The email sender may store its data elsewhere. Workers run near each visitor.

## Limits that shape the code

| Limit | Value | Rule |
| --- | --- | --- |
| Memory per isolate | 128 MB | Paginate and never load large sets |
| Worker bundle | 64 MiB uncompressed | Check the size before each deploy |
| Worker startup | 1 second | Keep module-level work trivial |
| D1 parameters per query | 100 | Chunk inserts and `IN` lists |
| D1 `LIKE` pattern | 50 bytes | Search with FTS5 |
| D1 row | 2 MB | Cap text fields; files go to R2 |
| D1 concurrency | One query at a time per database | Keep queries short and indexed |

## Environments

| Environment | Address | Data | Deployment |
| --- | --- | --- | --- |
| Local | `localhost` | Local emulated bindings | None |
| Staging | `workers.dev` until a domain is chosen | Synthetic only | By hand, from `staging` |
| Production | `workers.dev` until a domain is chosen | Real | By hand, from `main`, once approved |

Staging is created in M0 and production at launch in M5. They never share a database, bucket or secret. Pull request previews must never bind production resources.

## Names

Resources are named `planwise-<purpose>-<environment>`. Code sees only the binding.

A binding is declared in the milestone that creates its [service](#services).

| Binding | Resource | Example production name |
| --- | --- | --- |
| `DB` | D1 | `planwise-db-production` |
| `FILES` | R2 | `planwise-files-production` |
| `WORKER_SELF_REFERENCE` | Service binding, name required by OpenNext | `planwise-web-production` |
| `ASSETS` | Static Assets | Managed by the deployment |
| `EMAIL_API_KEY` | Secret for the email sender | Not applicable |
| `TURNSTILE_SECRET_KEY` | Secret for Turnstile | Not applicable |

## Configuration

- `wrangler.jsonc` is the source of truth. Do not configure bindings only in the dashboard.
- Bindings are not inherited by named environments, so declare them in each.
- Enable `nodejs_compat` and pin `compatibility_date`. Change the date in its own pull request.
- Generate binding types with `wrangler types`.
- Store secrets with `wrangler secret put`, and locally in an ignored `.dev.vars`.
- Never prefix a secret with `NEXT_PUBLIC_`; those values ship to the browser.

## Files

- Buckets are private, with no `r2.dev` URL or public custom domain.
- Uploads and downloads pass through an authorized Route Handler using the R2 binding, so no S3 keys are needed.
- The limit is 10 MB per file. OpenNext can buffer request bodies in memory, so raising it requires an ADR and probably presigned URLs.
- Object keys are `attachments/<attachment-id>`, which stay valid when a task moves or a project changes owner.

## Sources

- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits) and [regions](https://resend.com/docs/dashboard/domains/regions)
- [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/)
