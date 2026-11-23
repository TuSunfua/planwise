# 0002: Store data in Postgres on Neon, with Drizzle

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

Tasks, projects and memberships are relational, need constraints and joins, and must be reachable from Vercel
Functions.

## Decision

- One Neon project, with a branch per environment: `main` for production, `staging` for staging.
- Drizzle ORM for typed queries; Drizzle Kit generates SQL migrations, applied by hand.
- Connect with `pg` over TCP and a small pool, using Neon's pooled connection string, as Neon recommends for
  Vercel's Fluid compute.
- Locally, Postgres 18 in Docker, the version Neon gives new projects.

## Alternatives

- **Cloudflare D1:** only reachable from Workers; from Vercel it means a rate-limited management API or a Worker in
  between.
- **MongoDB Atlas Free:** documents for relational data, no Drizzle, throttled at 100 operations a second.
- **Supabase Free:** pauses after a week without activity and has no backups.

## Consequences

- Real transactions, row locks and advisory locks: atomic writes are simple, but parallel requests can race where
  SQLite would have serialized them, so limits take an advisory lock.
- Neon scales to zero after 5 idle minutes; the first query after that waits a few hundred milliseconds.
- 1 GB of storage and 100 compute-hours a month; storage is far off, compute needs watching.
- Revisit at 500 MB or when compute-hours pass 70 a month.
