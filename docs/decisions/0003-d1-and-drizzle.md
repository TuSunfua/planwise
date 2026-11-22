# 0003: Store data in D1 with Drizzle

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

Tasks, projects and memberships are relational, need constraints and joins, and must live on Cloudflare.

## Decision

Use one D1 database per environment, Drizzle ORM for typed queries and Drizzle Kit to generate SQL that Wrangler applies. Use FTS5 for search.

## Alternatives

- **Durable Object SQLite per user or project:** scales out, but cross-project views such as Today and Assigned to me become fan-out queries.
- **KV:** no relations or transactions and eventually consistent.
- **Postgres through Hyperdrive:** more capable, but the database would be hosted outside Cloudflare.
- **Raw SQL:** fewer dependencies, less type safety.

## Consequences

- Simple queries across projects and a strong authorization join.
- A 500 MB ceiling on the Free plan and serialized query execution.
- No interactive transactions; writes are designed around batches and guards.
- Revisit at 250 MB or when database queueing threatens the latency target.
