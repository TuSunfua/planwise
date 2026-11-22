# Security

The threats, and the rules for auth, permissions, input, files and privacy that answer them.

## Threats

| Threat | Primary defense |
| --- | --- |
| Reading or changing another user's data by ID | Membership-scoped SQL and denial tests |
| Direct calls to Server Actions | Auth, validation and authorization on every call |
| Stolen or guessed sign-in code | Hashing, expiry, attempt limit, rate limits |
| Cross-site scripting through task content | Plain text rendering, no raw HTML, CSP |
| Cross-site request forgery | SameSite cookies and origin checks |
| Malicious upload | Size cap, type allowlist, forced download |
| Cross-user cache leak | No user data in shared caches |
| Access after removal | Check every request; close live connections |
| Leaked secret | Worker secrets, ignored local files, rotation |

## Authentication

- Better Auth with email codes only. There are no passwords and no social sign-in.
- Codes are stored hashed, expire in 10 minutes, work once and allow 5 attempts.
- Responses do not reveal whether an account exists.
- Cookies are `HttpOnly`, `Secure` outside local development and `SameSite=Lax`.
- Sessions are checked in D1. Do not enable a session cookie cache, which delays revocation.
- Account deletion and ownership transfer require a recent sign-in.
- Auth is resolved in the server layer. There is no `proxy.ts`; see [ADR 0002](../decisions/0002-nextjs-on-workers.md).

## Authorization

All decisions go through `authorize(actor, permission, project)`, backed by `project_members`.

- Decide with `hasPermission()`, never a role name. A role is a set of permission keys, granted in `lib/permissions.ts`;
  role names appear elsewhere only where the rule is about the role itself (a project has one owner).
- Deny by default, including unknown roles and keys. A key belongs to one feature.
- Derive the project from the stored resource, never from a client-supplied project ID.
- Return not found to non-members. Return forbidden only to members who lack the role.
- Repeat the check in mutation SQL (membership with a role holding the key) to close the gap between check and write.
- Authorize both source and destination when moving a task.

## Permission matrix

| Action | Key | Owner | Editor | Viewer | Non-member |
| --- | --- | :---: | :---: | :---: | :---: |
| View project, tasks, files, comments and activity | `project:view` | Yes | Yes | Yes | No |
| Create, edit, move, delete and restore tasks | `task:create`, `task:update`, `task:delete` | Yes | Yes | No | No |
| Manage labels | `label:manage` | Yes | Yes | No | No |
| Assign tasks | `task:assign` | Yes | Yes | No | No |
| Upload and delete files | `file:manage` | Yes | Yes | No | No |
| Set a personal reminder | `reminder:manage` | Yes | Yes | Yes | No |
| Create comments, change own | `comment:create` | Yes | Yes | No | No |
| Delete someone else's comment | `comment:moderate` | Yes | No | No | No |
| Rename or archive project | `project:update` | Yes | No | No | No |
| Invite, remove and change roles | `member:manage` | Yes | No | No | No |
| Leave project | `project:leave` | Transfer first | Yes | Yes | No |
| Transfer or delete project | `project:transfer`, `project:delete` | Yes | No | No | No |

An archived project is read-only for every role except for unarchive and delete by its owner. Inbox rejects all sharing, archive and delete actions.

## Input and output

- Parse every external input with a schema on the server: actions, routes, params, search params and queue messages.
- Initial caps: title 500 characters, notes 20,000, comment 10,000, project name 100, label 50.
- Bind SQL parameters. Never concatenate input.
- Return DTOs with named fields. Never pass a database row to a Client Component.
- Render notes and comments as plain text until an ADR chooses a sanitizer.
- Accept redirect targets only as validated same-origin paths.
- Server Actions keep Next.js origin checks. Cookie-authenticated mutating Route Handlers check `Origin`.

## Files

- Authorize each upload and download.
- Enforce 10 MB on bytes received, not only on the declared length.
- Allow common images, PDF, plain text, CSV and Office documents. Reject HTML and SVG.
- Serve with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-store`.

## Headers

Set through `next.config.ts`: HSTS, `nosniff`, a strict referrer policy, a permissions policy and a CSP with `frame-ancestors 'none'`.

Nonce-based CSP normally relies on Proxy, which is unavailable here. Choose and test the script policy in M1, including the hash of the [theme script](../brand/theme.md#light-dark-and-system).

## Privacy

- Logs contain request, user and resource IDs, outcome and duration. They never contain content, emails, codes, tokens or cookies.
- Queue messages and live events carry IDs only.
- Users can export and delete their data. Deleted data can remain in D1 recovery history for up to 7 days, and in pre-release exports until those are deleted. The privacy policy must disclose both.
- No third-party analytics without owner approval.
