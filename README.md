<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo-full-dark.svg">
    <img src="public/brand/logo-full.svg" alt="PlanWise" width="320">
  </picture>
</p>

<p align="center"><strong>Plan on your own. Get it done together.</strong></p>

PlanWise is a task management app that works well for one person first, then grows into a place where people work on projects together. It is free to use and is built to run at no cost, on the free plans of Vercel, Neon and Resend. The source is visible but not open source: there is no license, so all rights are reserved.

> **Status: early development.** Sign-in by email code and an empty Inbox work locally. Nothing is deployed, and no email is sent yet: locally the code prints in the terminal.

## Phases

| Phase | Goal | Highlights |
| --- | --- | --- |
| [1. Solo](docs/product/phase-1-solo.md) | A complete personal task manager | Inbox, Today, projects, list and board views, labels, search, attachments, reminders |
| [2. Collaboration](docs/product/phase-2-collaboration.md) | Work together in projects | Invitations, roles, assignees, comments, activity, notifications, live updates |

The [roadmap](docs/roadmap.md) breaks both phases into milestones.

## Stack

| Concern | Choice | Status |
| --- | --- | --- |
| App | Next.js 16 App Router, React 19, TypeScript | In place |
| Styling | Tailwind CSS 4 | In place |
| UI primitives | shadcn/ui on Base UI | Set up; each component comes with the feature that needs it |
| Hosting | Vercel Hobby | Deploys in M0 |
| Database | Postgres on Neon, with Drizzle ORM | Local only; Neon in M1 |
| Authentication | Better Auth: email code | Local only; email arrives in M1 |
| Email | Resend's free plan, guarded by Vercel BotID | M1 |
| Files | Neon Object Storage | M4 |
| Background work | A scheduled job route ([ADR 0009](docs/decisions/0009-scheduled-work.md)) | M4 |
| Live updates | Server-Sent Events | M8 |

Each service is added only when a feature first needs it. The reasoning is in the [decision records](docs/decisions/README.md).

## Getting started

You need Node.js 22.18 or newer, npm (ideally 11.10 or newer) and Docker, for the local Postgres.

```bash
git clone git@github.com:TuSunfua/planwise.git
cd planwise
git config --local user.email <your public email>
```

```bash
npm ci
cp .env.example .env.local
sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 32)|" .env.local
npm run dev
```

Open <http://localhost:3000>. No cloud account is needed. `npm run dev` starts the local Postgres in Docker, applies
migrations, and removes the container when you stop it; the data stays in a Docker volume. The sign-in code prints in
that terminal.

Sign-in allows 3 codes per address an hour. To reset that while `npm run dev` runs:

```bash
docker compose exec postgres psql -U planwise -c "DELETE FROM rate_limit_events"
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Postgres and the development server; Ctrl+C stops both |
| `npm run build` | Create a production Next.js build |
| `npm run fix` | Format, sort imports and classes |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check, routes included |
| `npm test` | Build, then run the integration tests against a fresh database |
| `npm run check` | Run every check, the build and the tests |
| `npm run db:generate` | Generate a migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the database in `DATABASE_URL` (`npm run dev` does it locally) |

Deploying arrives in milestone M0: [deployment.md](docs/operations/deployment.md).

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/platform/architecture.md)
- [Code conventions](docs/development/code-conventions.md)
- [Git conventions](docs/development/git-conventions.md)
- [Rules for coding agents](AGENTS.md)
- [Brand and logo](docs/brand/README.md)
- [Theme](docs/brand/theme.md)
- [Decisions](docs/decisions/README.md)
