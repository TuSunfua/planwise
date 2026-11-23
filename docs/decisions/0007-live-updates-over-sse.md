# 0007: Send live updates over Server-Sent Events

- **Status:** Accepted
- **Date:** 2026-11-23

## Context

Phase 2 shows other members' changes without a reload (LIVE-01 to LIVE-04). Vercel has no WebSockets.

## Decision

- Live updates go from server to browser over Server-Sent Events, from a Route Handler.
- An event is a hint to refetch, carrying IDs only. Losing one loses no data.
- The details are decided in M8, with measurements, in a follow-up ADR.

## Alternatives

- **WebSockets:** not available on Vercel, and would need another service.
- **Polling only:** simplest, but slower to show changes.

## Consequences

- An open stream keeps a function running. On Hobby that costs 2 GB of provisioned memory for its whole duration,
  against 360 GB-hours a month: about 180 hours of open streams in total. M8 must measure this, and may need streams
  only while a shared project is open, short reconnecting streams, or polling as the fallback.
- Streams end within 300 seconds, so the browser reconnects and refetches; that path must be cheap.
- Events across server instances need a shared source, likely Postgres; `LISTEN` doesn't work through Neon's pooler.
