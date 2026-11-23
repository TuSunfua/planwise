# 0009: Run scheduled work from GitHub Actions

- **Status:** Proposed
- **Date:** 2026-11-23

## Context

Reminders (REM-01) must go out within minutes of their time, and deleted data is purged daily. Vercel Hobby runs cron
at most once a day, up to 59 minutes late.

## Decision

- A GitHub Actions workflow on a schedule calls a protected Route Handler, which sends due reminders and purges.
  Scheduled workflows are free for public repositories.
- The handler checks a secret, works in batches and is safe to run twice.

## Alternatives

- **Vercel Cron:** once a day on Hobby; fine for purging, not for reminders.
- **A queue service such as Upstash QStash:** another vendor and quota.
- **`pg_cron` in Neon:** keeps the database awake, which spends its compute hours.

## Consequences

- GitHub runs schedules every 5 minutes at best, and can delay them under load: reminders may arrive a few minutes
  late.
- Decide in M4, when REM-01 is built.
