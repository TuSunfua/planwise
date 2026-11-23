# Data model

The database is Postgres on Neon. `db/schema.ts` is authoritative; this is the design around it.

## Relationships

```mermaid
erDiagram
  users ||--o{ project_members : has
  projects ||--|{ project_members : has
  projects ||--o{ tasks : contains
  projects ||--o{ labels : defines
  tasks ||--o{ tasks : "has subtasks"
  tasks ||--o{ task_labels : tagged
  labels ||--o{ task_labels : applied
  tasks ||--o{ attachments : has
  tasks ||--o{ reminders : has
  users ||--o{ reminders : sets
  projects ||--o{ invitations : "Phase 2"
  tasks ||--o{ task_assignees : "Phase 2"
  tasks ||--o{ comments : "Phase 2"
  projects ||--o{ activity_events : "Phase 2"
  users ||--o{ notifications : "Phase 2"
```

## Column conventions

| Topic | Rule |
| --- | --- |
| Names | `snake_case`; plural tables; `<entity>_id` foreign keys |
| IDs | UUIDv7 as `uuid`, created on the server |
| Instants | `timestamptz`, suffix `_at` |
| Calendar days | `date`, suffix `_on` |
| Booleans | `boolean`, prefix `is_` or `has_` |
| Enums | `text` with a `CHECK` constraint |
| Order | Fractional index as `text`, named `position`, with `id` as tie-breaker |
| Timestamps | `created_at` and `updated_at` on every mutable table |
| Concurrency | Integer `version` on projects, tasks and comments |
| Deletion | `deleted_at` on projects and tasks, purged after 30 days |

## Phase 1 tables

Better Auth owns `users`, `sessions`, `accounts` and `verifications`, configured to follow these naming rules where it allows. From AUTH-04 `users` also stores `timezone` (IANA name) and `theme` (`system`, `light` or `dark`). Every `color` column stores a [palette key](../brand/theme.md#project-and-label-colors), never a hex value.

| Table | Columns besides timestamps | Key constraints |
| --- | --- | --- |
| `projects` | `id`, `kind`, `created_by`, `name`, `color`, `position`, `version`, `archived_at`, `deleted_at` | `kind` is `inbox` or `standard`; unique `created_by` where kind is inbox |
| `project_members` | `project_id`, `user_id`, `role` | Primary key on both IDs; unique `project_id` where role is owner |
| `tasks` | `id`, `project_id`, `parent_id`, `created_by`, `title`, `notes`, `status`, `priority`, `planned_on`, `due_on`, `position`, `completed_at`, `version`, `deleted_at` | Unique `(id, project_id)`; `(parent_id, project_id)` references it |
| `labels` | `id`, `project_id`, `name`, `color` | Unique `(project_id, lower(name))`; unique `(id, project_id)` |
| `task_labels` | `task_id`, `label_id`, `project_id` | Both composite foreign keys include `project_id` |
| `attachments` | `id`, `task_id`, `uploaded_by`, `file_name`, `content_type`, `size_bytes`, `state` | `state` is `pending`, `ready` or `deleting` |
| `reminders` | `id`, `task_id`, `user_id`, `remind_at`, `state`, `sent_at` | Unique `(task_id, user_id, remind_at)` |
| `email_usage` | `day` (UTC `date`), `purpose`, `count` | Primary key on day and purpose; incremented with a guard on the budget |
| `rate_limit_events` | `key`, `occurred_at`, no timestamps | `key` is a keyed hash; rows older than an hour are deleted |
| Task search | `title`, `notes` | A generated `tsvector` column with a GIN index, from ORG-02 |

`db/schema.ts` adds each column with the feature that uses it: `projects` starts with `id`, `kind` and `created_by`.
`verifications.identifier` is unique, which keeps one live sign-in code per address.

`projects.created_by` is history only. **Ownership and access come only from `project_members`.**

Phase 1 writes a single `owner` membership for every project, including Inbox. Phase 2 adds rows; it does not change how access is checked.

## Phase 2 tables

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `invitations` | Pending access | Token stored only as a hash; has expiry; one pending per project and email |
| `ownership_transfers` | Offer awaiting acceptance | One pending per project |
| `task_assignees` | Responsibility | Carries `project_id`; references both the task and the membership, so only members can be assigned |
| `comments` | Discussion | Author retained for history; soft-deleted |
| `activity_events` | History | Append-only; stores IDs and changed field names, not content |
| `notifications` | Per-user inbox | Unique delivery key to prevent duplicates |

Do not create these tables during Phase 1.

## Invariants

1. Every task belongs to exactly one project. "No project" means Inbox.
2. Every project has exactly one owner. The index enforces at most one; the DAL and tests enforce at least one.
3. An Inbox has one member and cannot be shared, archived or deleted except with the account.
4. A subtask shares its parent's project and cannot have subtasks.
5. A label can be applied only within its project.
6. `completed_at` is set if and only if status is `done`.
7. A deleted project hides everything inside it without rewriting child rows.

## Initial indexes

| Index | Serves |
| --- | --- |
| `project_members(user_id, project_id)` | Access checks and project list |
| `tasks(project_id, status, position)` where not deleted | List and board |
| `tasks(project_id, planned_on)` where open and not deleted | Today and Upcoming |
| `tasks(project_id, due_on)` where open and not deleted | Today and overdue |
| `tasks(parent_id, project_id)` | Subtasks |
| `task_labels(label_id)` | Label filter |
| `attachments(task_id)` | Task detail and purge |
| `reminders(state, remind_at)` | Due reminder scan |

Check new queries with `EXPLAIN QUERY PLAN`.

## Writing safely

- **Atomicity:** related writes go in one `db.transaction()`.
- **Limits and budgets:** parallel requests must not both pass a count. Take `pg_advisory_xact_lock` on the key, then
  count and insert in the same transaction.
- **Conflicts:** update with `WHERE id = ? AND version = ?` plus a membership `EXISTS`. Treat zero changed rows as a
  conflict or denial.
- **Moving a task:** in one transaction, delete its label links and its subtasks' links, then update parent and
  children together.
- **Search:** always join search results to `project_members`.
- **Purging:** delete stored files before their rows, so a retry can still find the keys.

## Migrations

- Generate with Drizzle Kit into `db/migrations/` (`npm run db:generate`), read the SQL, and apply with
  `npm run db:migrate`.
- Migrations run only when someone runs them: the app never migrates or alters the schema while serving.
- Applied migrations are immutable. Fix forward.
- Use expand, backfill, switch, then contract across separate releases.
- Large tables change without long locks: add columns as nullable, backfill in batches, then add the constraint.
