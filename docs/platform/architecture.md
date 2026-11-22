# Architecture

The Workers, how a request flows through them, caching and consistency. This is the target design; none of it
is implemented yet.

## System

```mermaid
flowchart TB
  B[Browser] -->|HTTPS| W[planwise-web<br/>Next.js on OpenNext]
  W --> A[Workers Static Assets]
  W --> D[(D1<br/>source of truth)]
  W --> F[(R2<br/>private files)]
  W --> C[(R2<br/>framework cache)]
  W --> Q[[Queues]]
  T[Cron Trigger] --> J[planwise-jobs]
  Q --> J
  J --> D
  J --> F
  J --> E[Email Service]
  W -->|sign-in codes| E
  B -. Phase 2 WebSocket .-> R[planwise-realtime]
  R -.-> O[Durable Object<br/>one per project]
  W -. after commit .-> R
```

| Worker | Responsibility | Arrives in |
| --- | --- | --- |
| `planwise-web` | UI, auth, all user-initiated reads and writes | M0 |
| `planwise-jobs` | Reminders, notification delivery, purging | M4 |
| `planwise-realtime` | WebSockets and presence | M8 |

Separate Workers let jobs and sockets deploy without modifying the OpenNext-generated entry point.

## Layers

```mermaid
flowchart LR
  UI[app<br/>pages and route handlers] --> S[data<br/>rules and authorization]
  ACT[app/**/actions] --> S
  S --> R[db/queries<br/>scoped SQL]
  S --> P[lib<br/>R2, Queues, email]
  R --> DB[(D1)]
```

Code follows the Next.js project structure, with a Data Access Layer (DAL). What each layer may do and
where its file lives: [code-conventions.md](../development/code-conventions.md#2-layers).

## Reading

1. The route renders a static shell, with user content inside `<Suspense>`.
2. A Server Component calls the DAL.
3. The DAL resolves the session from the cookie and checks it against D1.
4. A query in `db/queries/` runs, scoped by membership.
5. The DAL returns a minimal DTO.

Server Components call the DAL directly, not the app's own HTTP endpoints.

## Writing

1. A Client Component calls a Server Action, optionally updating optimistically.
2. The action calls the DAL, which authenticates, validates and authorizes.
3. The query writes with membership and `version` guards, batching related statements.
4. Side effects run after the commit.
5. The action returns a `Result` (a DAL error translated by `runAction()`) and calls `refresh()` from `next/cache`.

## Caching

| Content | Policy |
| --- | --- |
| Hashed static assets | Served by Workers Static Assets |
| Public pages and static shells | Prerendered, stored in the R2 incremental cache |
| Session, tasks, projects, anything user-specific | Read per request; deduplicate with React `cache()` only |
| Public data needing tag revalidation | Not allowed until a tag cache is configured and tested |

Keeping user data out of shared caches means revoked access takes effect on the next request.

## Consistency

- D1 is the only source of truth. R2, Queues and Durable Objects never decide permissions or task state.
- D1 and Queues cannot commit together. Work that must not be lost is recorded in D1 and swept by the jobs Worker.
- Queue consumers are idempotent because messages can be delivered more than once.
- A live update is a hint to refetch. Losing one cannot lose data.
