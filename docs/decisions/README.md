# Architecture decision records

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-vercel-and-neon.md) | Run on Vercel and Neon at no cost | Accepted |
| [0002](0002-postgres-on-neon.md) | Store data in Postgres on Neon, with Drizzle | Accepted |
| [0003](0003-project-membership.md) | Use project membership from Phase 1 | Accepted |
| [0004](0004-email-code-sign-in.md) | Passwordless sign-in with Better Auth | Accepted |
| [0005](0005-email-and-bots.md) | Send with Resend, stop bots with Vercel BotID | Accepted |
| [0006](0006-shadcn-ui.md) | Build UI primitives with shadcn/ui | Accepted |
| [0007](0007-live-updates-over-sse.md) | Send live updates over Server-Sent Events | Accepted |
| [0008](0008-files-in-neon.md) | Store files in Neon Object Storage | Accepted |
| [0009](0009-scheduled-work.md) | Run scheduled work from GitHub Actions | Proposed |

## Process

1. Copy [the template](template.md) to the next number.
2. Open it as Proposed.
3. The owner changes it to Accepted or Rejected.
4. Do not rewrite an accepted decision. Add a new ADR and mark the old one Superseded.

Write an ADR for a new platform service, a framework or major dependency, a change to the data or permission model, or any exception to a hard rule in `AGENTS.md`.
