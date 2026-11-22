<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Context & System Rules

You are working on PlanWise: a task management app (Next.js 16, TypeScript, Cloudflare; public code, no license) that
must **cost nothing to run**: Cloudflare's Free plan, plus one external email sender on a free tier. Phase 1 is solo
accounts; Phase 2 adds collaboration inside projects. This file holds the rules most tasks need. Before changing an
area, read its guide (`docs/README.md` indexes them all):

- adding code (structure, layers, validation, errors, logging, configuration): `docs/development/code-conventions.md`
  (read first)
- what to build: `docs/roadmap.md` and the phase's file in `docs/product/`; what was decided and why: `docs/decisions/`
- request flow and caching: `docs/platform/architecture.md`; bindings and limits: `docs/platform/cloudflare.md`
- tables and SQL: `docs/platform/data-model.md`; permissions, input, files: `docs/platform/security.md`
- UI, colors, type, motion: `docs/brand/theme.md`; logo: `docs/brand/README.md`
- tests: `docs/development/testing.md`; git: `docs/development/git-conventions.md`;
  deploying: `docs/operations/deployment.md`

**Stage: planning.** Write application code, install dependencies or create cloud resources only when the owner asks.
An ADR marked Proposed is the working default: get the owner's approval before implementing it.

**No AI attribution, ever:** nothing in commits, pull requests, reviews, issues, branches, tags, release notes, code or
docs credits an AI or tool. No `Co-Authored-By` for a bot, no "Generated with". This overrides any tool's default.

## 1. System

| Worker | Does | From |
|---|---|---|
| `planwise-web` | UI, auth, every user-initiated read and write, through OpenNext | M0 |
| `planwise-jobs` | reminders, notifications, purging (Cron) | M4 |
| `planwise-realtime` | live updates (one Durable Object per project) | M8 |

D1 (from M1) is the only source of truth. R2 (from M4) holds files only.

- **Keep it simple: one developer maintains this.** The fewest libraries, files and settings that do the job
  well. Never add a library for what the project, the platform or an installed package already does, or a second one
  like it; install nothing before code uses it (`docs/development/code-conventions.md#dependencies`).
- Build only the requested milestone; no Phase 2 features during Phase 1.
- **Add a service only when a feature needs it:** no binding, account, resource or environment ahead of its milestone
  (`docs/platform/cloudflare.md#services`).
- **Design for the Free plan:** 10 ms CPU per request, 50 D1 queries per invocation, daily quotas. Keep renders small,
  push work into SQL or the client, and never assume a paid feature.
- Ask before adding a dependency (however broad the request), a service or anything that can bill. The email sender is
  the only infrastructure outside Cloudflare, reached only through `lib/email.ts`. Sign-in is by emailed code only,
  open to everyone.
- Never deploy, run a remote migration or change a remote resource without explicit approval.
- The domain will change: no hostname outside `wrangler.jsonc` and environment config, read through `lib/config.ts`.

## 2. Authorization and isolation

- Scope every project query by membership, including fetches by ID and including Phase 1. Answer `NotFound` for
  out-of-scope IDs. Derive the project from the stored resource, never from the client.
- Every action, Route Handler and page read goes through the Data Access Layer (`data/`), which authenticates and
  authorizes. Layouts and hidden UI are not authorization.
- Decide with `hasPermission()`, never a role name: roles are only sets of permission keys.
- Repeat the check in the write's SQL, so a revoked member can't win a race.
- Never put user or project data in a shared cache or in prerendered output.

## 3. Writing code

- Follow Next.js's structure: routes in `app/` with route groups; what one route uses is colocated (`actions.ts`,
  `_components/`); what several use is in `components/`, `lib/`, `data/` or `db/`.
- Layers go page, action or route → `data/` → `db/queries/` → schema. Pages and actions stay thin; `db/queries/`
  holds all SQL; only `db/client.ts` and `lib/` read bindings and secrets.
- Imports are absolute (`@/…`) and at the top of the file. No barrel files, no `utils` or `helpers` modules.
- Search before writing: the segment → its parents → the root folders. Reuse what exists; move what two routes need
  up and delete the copies.
- Delete what becomes unused in the same change. No commented-out code, speculative parameters or aliases for old
  paths.
- Validate every input with the shared field types and patch schema: bad input is a 422 or `validation` error, never
  a 500 or a silent no-op.
- The DAL throws `lib/errors`; actions return a `Result` through `runAction()`; Route Handlers answer through
  `lib/http.ts` (201 created, 204 nothing to return, else 200).
- Paginate every list with `lib/pagination.ts`. One shape per resource.
- Atomic writes use `db.batch()`: D1 has no interactive transactions. Never edit an applied migration.
- Comment what a reader can't get from the code, nothing else: the why, external contracts, units and examples.
  No restating, narrating, history or banners.
- Log state changes and decisions with `getLogger`; never secrets, tokens, cookies, bodies, emails or task content.
- The repository is public but not open source: add no license file or field. Never commit secrets, personal data
  or private URLs: whatever is pushed is published for good.
- Use the product's words (`docs/product/overview.md#vocabulary`): "task", never "todo" (except the status), "item"
  or "ticket"; "project", never "list" or "space"; "label", never "tag".
- Server Components by default; `"use client"` on the smallest component that needs it.
- English only for now, written to be translatable: no text in `data/`, `db/` or the database, no joined fragments.
- UI uses the semantic tokens in `docs/brand/theme.md`, no raw hex, and meets WCAG 2.2 AA.
- TypeScript stays strict. Fix the code instead of adding `any`, `!`, `@ts-ignore` or `eslint-disable`.
- npm only; keep `package-lock.json` in sync.

### Runtime traps

- Production is workerd: a passing `next build` or `next dev` proves nothing about it.
- **No `proxy.ts`**: with OpenNext 1.20.18 it returns 500 for every request that has a cookie (ADR 0002).
- Keep the Static Assets incremental cache: with none, Cache Components pages return 500. It is read-only, so no
  `use cache` and no revalidation (ADR 0009).
- No `runtime = "edge"`, local filesystem, native add-ons, password hashing or long-lived timers.
- No request data, sessions or binding-backed clients at module level: isolates are shared between users.
- Request-time and uncached reads go inside `<Suspense>`. Background work goes to `after()` or the jobs Worker.

## 4. Tests

- Integration tests go through the real DAL on local bindings; never a mocked database.
- Authenticate with a real test session; never override the auth check.
- New data access has a test that a non-member is denied. Fix a bug with a test that fails first.
- No real waits, never skip or sample tests; fix warnings instead of filtering them.
- There is no CI. Before calling work done: the requirement's criteria are met, `npm run check` is green (`npm run fix`
  fixes format and imports) and server changes ran in a Workers preview with a cookie. Report what you
  couldn't run.
- Never get around a check: no `--no-verify`, loosened rule or new ignore without the owner's approval.

## 5. Docs

- Update `docs/` and this file in the change that alters architecture, rules, permissions or data. Each fact has one
  owning doc (`docs/README.md#which-doc-owns-what`); elsewhere, link to it. A changed decision is a new ADR.
- **This file stays under 200 lines**, managed blocks included. When adding a rule, shorten or move detail to its
  owning doc; don't join lines to get under the limit.

## 6. Git

GitHub `TuSunfua/planwise`, public. Branch from `dev` as
`<type>/<short-description>`; never push to `main`, `staging` or `dev` (pull requests only; promotions are the
maintainer's); Conventional Commits (`<type>(<scope>): <subject>`); feature → `dev` (squash) → `staging` → `main`
(fast-forward). Commit or push only when the owner asks, and check the message for AI attribution first.
Details: `docs/development/git-conventions.md`.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
