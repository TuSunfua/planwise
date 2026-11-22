# Code Conventions

The layout of the app and the rules for writing code in it. The point: code for anything is always found
in the same place, and the same problem is never solved twice. `AGENTS.md` summarizes these rules; this is
the full standard.

## 1. Project structure

The layout follows the Next.js guides bundled in `node_modules/next/dist/docs/`: route groups, colocation and
private folders ([project structure]), and a Data Access Layer in `data/` ([data security]). Code one route
uses lives in that route; code several routes use lives at the root. Folders are created when first needed.

[project structure]: https://nextjs.org/docs/app/getting-started/project-structure
[data security]: https://nextjs.org/docs/app/guides/data-security#data-access-layer

```
app/                        # routing, and what only one route uses
├── layout.tsx, globals.css, favicon.ico
├── (marketing)/            # public pages
├── (auth)/sign-in/         # route groups don't change the URL
├── (app)/                  # signed-in pages, sharing one layout
│   ├── layout.tsx
│   ├── _components/        # used by several routes of this group
│   └── projects/[projectId]/
│       ├── page.tsx, loading.tsx, error.tsx, not-found.tsx
│       ├── actions.ts      # this segment's Server Actions
│       └── _components/    # used only by this segment
└── api/                    # route.ts: auth, files, external callers
components/                 # shared components
└── ui/                     # primitives with no domain knowledge
data/                       # Data Access Layer, one module per resource: data/tasks.ts
db/
├── client.ts, schema.ts
├── queries/                # all SQL, one module per resource
└── migrations/
lib/                        # what is neither UI nor data
├── auth.ts, permissions.ts
├── config.ts               # typed settings, constants, the app's URL
├── errors.ts, actions.ts, http.ts, pagination.ts, logging.ts
├── email.ts, storage.ts, queue.ts   # one wrapper per Cloudflare service
└── schemas/                # field types and per-resource schemas and DTOs, safe on the client
public/                     # static files
tests/                      # integration/<resource>.test.ts, e2e/
workers/<worker>/           # jobs (M4), realtime (M8)
```

- No `src/`: `app/` stays at the root, as scaffolded.
- **Colocate first.** A component or action starts in the segment that uses it. When a second route needs it,
  move it to the nearest shared segment, or to `components/` if the routes are in different groups.
- Non-route folders inside `app/` are private (`_components`), so they can never become a URL.
- A route group is for a different layout or section, not for tidiness alone.
- Name a module after what it holds (`lib/pagination.ts`), never `utils.ts`, `helpers.ts` or `common.ts`.

## 2. Layers

Calls go one way: **page, action or route → data (DAL) → db/queries → schema**. A lower layer never imports
a higher one.

| Layer | Does | Does not |
|-------|------|----------|
| `app/` pages and layouts | Routing, composition, states; call the DAL and pass DTOs down | Business rules, SQL |
| `actions.ts`, `route.ts` | Parse input, call the DAL, translate errors | Permission decisions, SQL |
| `data/` | Authenticate, authorize, apply rules, return DTOs; throws `lib/errors` | React UI, `Request`, `Response`, SQL |
| `db/queries/` | All SQL, scoped by the acting user's membership | Business decisions, user-facing errors |
| `components/`, `_components/` | Present DTOs, collect input | Import `data/`, `db/` or bindings (types come from `lib/schemas/`) |
| `workers/` | Wire events to `db/queries/` and `lib/` | Import `app/`, `data/` or Next.js |

- Every module in `data/` starts with `import "server-only"`, as does any server-only `lib/` module that
  only Next.js uses.
- What `workers/` imports (`db/`, the service wrappers) must not import Next.js or `server-only`.
- A DAL module may call another DAL module, never an action.

## 3. Reuse before you write

Look in this order: the segment you are in → its parents → `components/`, `lib/` and `data/`. Write new code
only when none fits. When a second route needs the same thing, **move it up** and delete the copies.

## 4. Validation

Every input is fully validated by its schema: bad input is a validation error (422 over HTTP) with the
reason, never a 500 from D1 or a silent no-op. Parse at the boundary: action arguments, params, search
params, request bodies, queue messages, environment.

- **Use the shared field types** (`lib/schemas/fields.ts`): `name`, `description`, `email` (lowercased), `id`,
  `calendarDay`, `timezone`, `paletteKey`. Add one there when a second schema needs the same rule.
- **Bound everything**: strings by their [limits](../platform/security.md#input-and-output), numbers by
  their real range, closed sets by enums, lists by a maximum length.
- **Partial updates use the shared patch schema**: omitted = unchanged; an explicit `null` is refused
  unless the field is nullable. No `if (x !== undefined)` chains.
- Rules that need the database (existence, uniqueness, membership) live in the DAL.
- No defaults that stand in for user input.

### Errors

The DAL throws; the boundary translates. Next.js hides thrown messages in production, so an action never
lets an expected error escape.

| Error | Status | Action `code` |
|-------|--------|---------------|
| `NotAuthenticated` | 401 | `unauthenticated` |
| `PermissionDenied` | 403 | `forbidden` |
| `NotFound` | 404 | `not_found` |
| `ConflictError` | 409 | `conflict` |
| `PayloadTooLarge` | 413 | `too_large` |
| `InvalidRequest` | 422 | `validation` |
| `TooManyRequests` | 429 | `rate_limited` |
| `ServiceUnavailable` | 503 | `unavailable` |

- Actions wrap their work in `runAction()`, returning `{ ok: true, data }` or
  `{ ok: false, error: { code, message, fields? } }`. It rethrows Next.js's own signals (`redirect`,
  `notFound`) and anything unexpected.
- Pages turn `NotFound` into `notFound()`.
- A race that breaks a constraint after the DAL's checks is a `ConflictError`, never a 500.
- Rethrow with `{ cause }`. Never show a stack or an SQL message.

### HTTP responses

Route Handlers are for auth, files and external callers.

| Endpoint | Success |
|----------|---------|
| `POST` that creates | **201** with the created object |
| `GET`, `PUT`, actions that return what they changed | **200** with the object |
| `DELETE`, actions with nothing to return | **204**, no body |

JSON answers use `{ data, message, meta }`, built by `lib/http.ts` and never by hand. Auth library
routes and file bodies are the exceptions.

### Shapes and lists

- One resource has **one shape**. Event entries are subsets of it, always with `id`; a deletion is
  `{ id, removed: true }`.
- Never pass a database row to a Client Component.
- Paginate every list with `lib/pagination.ts`: `page` (from 1) and `take` (20, at most 100), ordered
  deterministically, ending in a unique column. Never hand-written limit, offset or count.
- Select named columns; no queries inside loops.

## 5. No dead code

- Delete what nothing uses (functions, components, schemas, fields, props, settings, env keys, files) in
  the change that made it unused. Code reached only from tests is dead.
- No speculative parameters, settings or hooks "for later"; no commented-out code.
- A rename or move updates every caller, doc and test; no aliases, re-exports or barrel `index.ts` files.

## 6. Coding standard

- Absolute imports only (`@/…`), all at the top of the file; `import type` for types.
- 2 spaces, double quotes, semicolons, lines up to 120 characters.
- `strict` TypeScript with explicit return types on exported server functions. No `any`, non-null `!`,
  `@ts-ignore` or `eslint-disable`: fix the code.
- A closed set is one `as const` array, with the type, schema and SQL check derived from it.
- Named exports, except where Next.js requires a default.
- Name required-but-unused arguments with a leading `_`.
- Prefer the platform to a small package.
- npm only. Pin Next.js, OpenNext and Wrangler exactly; upgrade them in their own PR.

### Naming

| Thing | Style | Example |
|-------|-------|---------|
| File, folder | kebab-case | `task-row.tsx` |
| Component, class, type | PascalCase | `TaskSummary` |
| Function, variable | camelCase | `listTodayTasks` |
| Constant, binding | UPPER_SNAKE_CASE | `MAX_TAKE`, `DB` |
| Boolean | is, has, can, should | `canEdit` |
| Server Action | verb, noun, `Action` | `completeTaskAction` |
| Schema | camelCase + `Schema` | `createTaskSchema` |
| Permission key | `resource:verb` | `task:update` |
| Database | snake_case | `project_members` |
| URL | kebab-case, plural | `/projects/[projectId]` |
| Event | past tense | `task.completed` |

Use the [product vocabulary](../product/overview.md#vocabulary) in code, database and docs alike.

### Comments

Comment what a reader can't get from the code; names, types and small functions already say *what*.

| Keep | Drop |
|------|------|
| the *why*: a non-obvious reason or constraint, a race, a security decision, a third-party quirk | TSDoc that restates the name or signature |
| external contracts: queue messages, R2 key layouts, event shapes | file headers that paraphrase the file name |
| domain meaning a newcomer needs | comments narrating the next line |
| example values and units: `// e.g. "Asia/Ho_Chi_Minh"`, `// bytes` | the code's history ("moved from…", "used to…") |
| group labels in long lists: `// Phase 2` | decorative banners |
| how to extend: "a new kind is an entry here and in `KINDS`" | commented-out code |
| a short heading splitting a long module | doc links repeated on every file of a feature |

A TSDoc comment, when one is needed, is short. A TODO references an issue.

### Configuration

- Bindings are declared in `wrangler.jsonc` and read with `getCloudflareContext()` only in `db/client.ts` and
  `lib/`, per request.
- The app's URL and email sender come from `lib/config.ts`. No hostname appears anywhere else
  ([changing the domain](../operations/deployment.md#changing-the-domain)).
- `.dev.vars.example` holds only what a deployment must set: secrets and per-deployment values. A tuning
  value (TTL, limit, batch size) is a constant in `lib/config.ts` with its default, never also there.

### Logging

Log with `getLogger`, never `console`. Every line of a request carries `request_id` and `user_id`.

- **Log state changes and decisions**, with identifiers in the message:
  `` `Task ${id}: todo -> done` ``, a denial and the check that failed, a role change.
- Don't repeat what the boundary logs already (error responses, unexpected exceptions).
- `debug` repeats and detail; `info` state changes; `warn` a failure to be retried; `error` a bug, with
  its stack.
- **Never log** secrets, cookies, request bodies, email addresses or task content, even at `debug`.

## 7. Next.js and Cloudflare

Read the bundled guide in `node_modules/next/dist/docs/` before using an API.

- Server Components by default; `"use client"` on the smallest component that needs it.
- `params`, `searchParams`, `cookies()` and `headers()` are async. Request-time and uncached reads go
  inside `<Suspense>`.
- Actions are for UI mutations only, never for fetching what a page renders. Never mutate during render.
- After a user-data mutation, call `refresh()` from `next/cache`. User data never goes in `use cache`.
- No `proxy.ts`, no `runtime = "edge"`, no route-segment options that Cache Components replaces.
- Create the database and auth instances per request; no request state at module level.
- Await work or hand it to `after()`. Web APIs first; check each dependency runs in workerd.
- SQL writes follow [writing safely on D1](../platform/data-model.md#writing-safely-on-d1).

## 8. UI

- Semantic tokens from the [theme](../brand/theme.md), never raw hex. 360 px and up, light and dark.
- Native elements first. Every control has an accessible name and visible focus.
- Never status by color alone; every drag has a keyboard alternative; respect reduced motion.
- Each route has loading, empty, error and not-found states.
- Primary touch targets are at least 44 px.
- An optimistic update rolls back visibly and keeps what was typed.
- Instants are stored in UTC, calendar days as `YYYY-MM-DD`; "today" comes from the user's timezone.
  Never turn a calendar day into a `Date` just to store or compare it.
- Sentence case, plain verbs, specific buttons ("Delete project").

### English now, i18n later

The app is English only ([Q6](../open-questions.md)). These rules keep adding languages cheap:

- User-facing text lives in pages and components, never in `data/`, `db/` or the database. The UI chooses
  its text from the error's `code`.
- Never build a sentence by joining fragments; plurals go through `Intl.PluralRules`.
- Format dates and numbers with `Intl`, passing the locale from `lib/config.ts`, never hard-coded.
- Use logical CSS (`ms-`, `pe-`, `text-start`), not left and right.
- No i18n library or `[lang]` segment yet. When it comes, it can't rely on `proxy.ts` (ADR 0002).

## 9. Enforcement

There is no CI: `npm run check` (from M0) is run by hand before every pull request and deploy. It runs format, lint, type check and every test suite. Lint is set up to fail on
unused code, commented-out code, relative imports, `console` and the import boundaries above. Until then
run `npm run lint`, `npx tsc --noEmit` and `npm run build`.

## 10. Checklists

**New route:** its segment in the right group → `page.tsx` with loading, error and not-found states →
`actions.ts` and `_components/` as needed.

**New resource:** schema and DTO in `lib/schemas/` → queries in `db/queries/` → the DAL in `data/` →
`tests/integration/<resource>.test.ts` → its requirement and any new rule in the docs.

**New permission:** the key and its grants in `lib/permissions.ts` → the
[permission matrix](../platform/security.md#permission-matrix) → the matrix test.

**New table or column:** `db/schema.ts` → a generated, reviewed migration → the
[data model](../platform/data-model.md) → a test from the previous release's data.

**New binding or Worker:** an ADR if it is a new service → `wrangler.jsonc` for every environment →
its wrapper in `lib/` → [cloudflare.md](../platform/cloudflare.md) and
[deployment.md](../operations/deployment.md).
