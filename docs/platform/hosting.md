# Hosting

The services we use, their free limits, the environments and the settings. Limits were checked against each
provider's pages on 2026-11-23. Check again before relying on one.

## Services

A service is created in the milestone that first needs it, not before
([ADR 0001](../decisions/0001-vercel-and-neon.md)).

| Service | Use | Created in |
| --- | --- | --- |
| Vercel Hobby | The Next.js app: pages, Server Actions, Route Handlers | M0 |
| Neon Free | Postgres, the only source of truth | M1 |
| Resend Free | Sign-in codes, later reminders and invitations | M1 |
| Vercel BotID, basic | Keep bots from spending the email quota | M1 |
| Neon Object Storage | Private attachments | M4, if FILE-01 is built |
| A scheduler | Reminders and purging | M4 ([ADR 0009](../decisions/0009-scheduled-work.md), Proposed) |

Not planned: anything that bills, a separate cache or queue, WebSockets.

## Free limits

| Resource | Free allows | Rule |
| --- | --- | --- |
| Vercel function invocations | 1 million a month | Static pages and assets don't count; limit prefetching of dynamic pages |
| Vercel active CPU | 4 hours a month | Measure each feature; heavy work goes into SQL |
| Vercel provisioned memory | 360 GB-hours a month, at a fixed 2 GB | Billed while a request is in flight, so no long-held requests |
| Vercel function duration | 300 seconds | Streams reconnect before then |
| Vercel transfer | 100 GB a month | Brand files as SVG; no large assets |
| Vercel regions | One | `sin1` (Singapore), next to the database |
| Vercel cron | Once a day, ±59 minutes | Not enough for reminders: [ADR 0009](../decisions/0009-scheduled-work.md) |
| Neon compute | 100 CU-hours a month | Autoscaling 0.25 to 0.5 CU; it scales to zero after 5 idle minutes. Never keep it awake |
| Neon storage | 1 GB per project | Alert at 500 MB |
| Neon transfer | 5 GB a month, shared with object storage | Select named columns; paginate |
| Neon history | 6 hours | Export before each release |
| Neon Object Storage | 5 GB | Cap attachments per user and for the whole app |
| Resend | 100 emails a day, 3,000 a month | The [email budget](#email-budget) |

## Staying free

None of these services bills on the free plans. Running out has a cost of its own:

- **Vercel pauses the project for 30 days** when a Hobby limit is passed, and it doesn't resume on its own. Watch the
  usage page.
- Neon suspends compute until the next month when compute or transfer runs out, and refuses writes above the storage
  limit. It deletes nothing.
- Resend stops sending at its quota.
- Vercel Hobby is meant for personal, non-commercial projects. PlanWise is free and earns nothing; charging money
  would need Vercel Pro first.

## Email budget

Figures are for Resend's free plan ([ADR 0005](../decisions/0005-email-and-bots.md)). They live as constants in
`lib/config.ts` and are counted in Postgres, per UTC day and month.

| Budget | Per day | Per month |
| --- | --- | --- |
| Provider's limit, all emails | 100 | 3,000 |
| Reminders, invitations and notifications together | 20 | 500 |
| Reserved for sign-in codes | the rest, at least 80 | the rest, at least 2,500 |

- Over the budget, reminders and notifications wait for the next day, and an invitation shows a link to copy.
- A provider 429 is never retried in a loop. Sign-in says that email is unavailable and when to try again.

## Environments

| Environment | Address | Database | Deployed |
| --- | --- | --- | --- |
| Local | `localhost` | Postgres in Docker (`compose.yaml`) | Never |
| Staging | Vercel preview of `staging` | Neon branch `staging` | By hand, from `staging` |
| Production | `*.vercel.app` until a domain is chosen | Neon branch `main` | By hand, from `main`, once approved |

Staging and production never share a database or a secret. Other preview deployments get no database.

## Settings

Read only through `lib/config.ts`. Set on Vercel per environment; locally in `.env.local`, which Git ignores.

| Variable | Holds |
| --- | --- |
| `APP_URL` | The app's address, e.g. `https://planwise.vercel.app` |
| `DATABASE_URL` | Neon's pooled connection string |
| `AUTH_SECRET` | Signs cookies and keys hashes: `openssl rand -base64 32` |
| `APP_ENV` | `local` only in `.env.local`: it prints sign-in codes. Never set on Vercel |
| `RESEND_API_KEY`, `EMAIL_FROM` | From M1, when email is set up |

## Files

- Buckets are private.
- Uploads and downloads use short-lived signed URLs, created only after the DAL authorizes the request.
- The limit is 10 MB per file.
- Object keys are `attachments/<attachment-id>`, which stay valid when a task moves or a project changes owner.

## Sources

- [Vercel pricing](https://vercel.com/pricing), [Hobby plan](https://vercel.com/docs/plans/hobby),
  [function limits](https://vercel.com/docs/functions/usage-and-pricing),
  [cron](https://vercel.com/docs/cron-jobs/usage-and-pricing), [BotID](https://vercel.com/docs/botid)
- [Neon plans](https://neon.com/docs/introduction/plans),
  [connecting from Vercel](https://neon.com/docs/guides/vercel-connection-methods),
  [object storage](https://neon.com/docs/storage)
- [Resend pricing](https://resend.com/pricing)
