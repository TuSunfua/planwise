# 0008: Store files in Neon Object Storage

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

FILE-01 attaches files to tasks in M4. They must be private and stay free.

## Decision

- Use Neon Object Storage: 5 GB on the free plan, private buckets, signed upload and download URLs.
- Create the bucket only when FILE-01 starts.
- Before relying on it, confirm in Neon's console that it is generally available and what happens at 5 GB.

## Alternatives

- **Cloudflare R2:** 10 GB and free downloads, but needs a checkout and bills above the free tier.
- **Vercel Blob:** 1 GB and few operations; at its limit it switches off for 30 days.

## Consequences

- Data and files sit with one vendor, and nothing can bill.
- Downloads share Neon's 5 GB of monthly transfer with the database: about 500 full downloads of a 10 MB file.
- Attachments need caps per user and for the whole app.
- If Neon's storage doesn't hold up, R2 with caps is the fallback, in a new ADR.
