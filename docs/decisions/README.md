# Architecture decision records

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-cloudflare-only.md) | Run everything on Cloudflare | Accepted |
| [0002](0002-nextjs-on-workers.md) | Run Next.js on Workers with OpenNext | Accepted |
| [0003](0003-d1-and-drizzle.md) | Store data in D1 with Drizzle | Accepted |
| [0004](0004-project-membership.md) | Use project membership from Phase 1 | Accepted |
| [0005](0005-authentication.md) | Passwordless sign-in with Better Auth | Accepted |
| [0006](0006-free-plan.md) | Run on Cloudflare's Free plan | Accepted |

## Process

1. Copy [the template](template.md) to the next number.
2. Open it as Proposed.
3. The owner changes it to Accepted or Rejected.
4. Do not rewrite an accepted decision. Add a new ADR and mark the old one Superseded.

Write an ADR for a new platform service, a framework or major dependency, a change to the data or permission model, or any exception to a hard rule in `AGENTS.md`.
