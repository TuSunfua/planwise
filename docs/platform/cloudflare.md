# Cloudflare platform

The services we use, their limits, the environments and the bindings. Limits were checked against Cloudflare's documentation on 2026-11-22. Check again before relying on one.

## Services

| Service | Use | Arrives in |
| --- | --- | --- |
| Workers | All compute | M0 |
| Workers Static Assets | JS, CSS, fonts, brand files | M0 |
| D1 | Application and auth data | M0 |
| R2 | Framework cache; private attachments in a separate bucket | M0, M4 |
| Workers Logs | Logs and errors | M0 |
| Email Service | Sign-in codes, reminders, invitations | M1 |
| Rate Limiting binding | Coarse abuse protection | M1 |
| Cron Triggers | Find due work, purge deleted data | M4 |
| Queues | Retryable background delivery | M4 |
| Durable Objects | Live updates | M8 |

Not planned: Pages, KV, Hyperdrive, Vectorize and Workers AI. Adding one needs an ADR.

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
| R2 | 10 GB, 1 million writes and 10 million reads per month | Needs the R2 checkout; cap attachments per user |
| Queues | 10,000 operations per day (about 3 per message), kept 24 hours | Only for work that needs retries; sweep from D1 |
| Cron Triggers | 5 per account | One per environment, dispatching by schedule |
| Durable Objects | SQLite-backed only; 100,000 requests and 13,000 GB-s per day | Hibernating WebSockets |
| Workers Logs | 200,000 events per day, kept 3 days | Keep `info` quiet |
| Email Service | Verified addresses in the account only | See [Q13](../open-questions.md) |
| Image transformations | 5,000 unique per month | Serve brand SVGs as they are |

## Location

Users are expected mostly in Asia. Create D1 and R2 with the `apac` location
([how](../operations/deployment.md#creating-resources)). It is a placement preference, not a legal
residency guarantee, which is not required. Workers run near each visitor.

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
| Queue message | 128 KB | Send IDs, not content |
| Rate Limiting binding | Approximate, per location | Enforce strict limits, such as code attempts, in D1 |

## Environments

| Environment | Address | Data | Deployment |
| --- | --- | --- | --- |
| Local | `localhost` | Local emulated bindings | None |
| Staging | `workers.dev` until a domain is chosen | Synthetic only | By hand, from `staging` |
| Production | `workers.dev` until a domain is chosen | Real | By hand, from `main`, once approved |

Staging and production never share a database, bucket, queue or secret. Pull request previews must never bind production resources.

## Names

Resources are named `planwise-<purpose>-<environment>`. Code sees only the binding.

| Binding | Resource | Example production name |
| --- | --- | --- |
| `DB` | D1 | `planwise-db-production` |
| `FILES` | R2 | `planwise-files-production` |
| `NEXT_INC_CACHE_R2_BUCKET` | R2, name required by OpenNext | `planwise-cache-production` |
| `WORKER_SELF_REFERENCE` | Service binding, name required by OpenNext | `planwise-web-production` |
| `ASSETS` | Static Assets | Managed by the deployment |
| `EMAIL` | Email Service | Not applicable |
| `JOBS` | Queue | `planwise-jobs-production` |
| `AUTH_RATE_LIMIT` | Rate Limiting | Not applicable |

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
- [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)
- [Queues limits](https://developers.cloudflare.com/queues/platform/limits/)
- [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
