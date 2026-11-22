<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo-full-dark.svg">
    <img src="public/brand/logo-full.svg" alt="PlanWise" width="320">
  </picture>
</p>

<p align="center"><strong>Plan on your own. Get it done together.</strong></p>

PlanWise is a task management app that works well for one person first, then grows into a place where people work on projects together. It is free to use and is built to run at no cost: on Cloudflare's Free plan, with a free external email sender. The source is visible but not open source: there is no license, so all rights are reserved.

> **Status: planning.** The repository holds the plan, conventions, brand assets and an empty Next.js app that shows only the logo. No features are built yet.

## Phases

| Phase | Goal | Highlights |
| --- | --- | --- |
| [1. Solo](docs/product/phase-1-solo.md) | A complete personal task manager | Inbox, Today, projects, list and board views, labels, search, attachments, reminders |
| [2. Collaboration](docs/product/phase-2-collaboration.md) | Work together in projects | Invitations, roles, assignees, comments, activity, notifications, live updates |

The [roadmap](docs/roadmap.md) breaks both phases into milestones.

## Planned stack

| Concern | Choice | Arrives in |
| --- | --- | --- |
| App | Next.js 16 App Router, React 19, TypeScript | In place |
| Styling | Tailwind CSS 4 | In place |
| UI primitives | shadcn/ui on Base UI | Set up; each component comes with the feature that needs it |
| Hosting | Cloudflare Workers through OpenNext | M0 |
| Database | Cloudflare D1 with Drizzle ORM | M1 |
| Framework cache | Workers Static Assets, read-only | M0 |
| Authentication | Better Auth: email code | M1 |
| Email | Resend's free plan, guarded by Turnstile | M1 |
| Files | Cloudflare R2 | M4 |
| Background work | Cron Triggers | M4 |
| Live updates | Durable Objects with WebSockets | M8 |

Each service is added only when a feature first needs it. The reasoning is in the [decision records](docs/decisions/README.md).

## Getting started

You need Node.js 22.12 or newer and npm, ideally 11.10 or newer.

```bash
git clone git@github.com:TuSunfua/planwise.git
cd planwise
git config --local user.email <your public email>
```

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production Next.js build |
| `npm run start` | Serve that build with Node.js |
| `npm run fix` | Format, sort imports and classes |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check, routes included |
| `npm run check` | Run every check and a build |

Cloudflare preview and deploy commands arrive in milestone M0. Until then, the app cannot be deployed to Workers.

## Documentation

- [Documentation index](docs/README.md)
- [Architecture](docs/platform/architecture.md)
- [Code conventions](docs/development/code-conventions.md)
- [Git conventions](docs/development/git-conventions.md)
- [Rules for coding agents](AGENTS.md)
- [Brand and logo](docs/brand/README.md)
- [Theme](docs/brand/theme.md)
- [Decisions](docs/decisions/README.md)
