# 0004: Use project membership from Phase 1

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

Phase 1 is solo and Phase 2 shares projects. A `user_id` on each task would be quick, then require rewriting every query and permission check when sharing arrives.

## Decision

- Every task belongs to a project.
- Each user gets an Inbox project that cannot be shared.
- Access comes only from `project_members`, starting with one owner row per project.
- Build no invitations, role UI or other collaboration features in Phase 1.

## Alternatives

- **`user_id` ownership now:** a risky migration of the security model later.
- **Workspaces or organizations:** an extra level that neither phase needs.
- **Tasks with an optional project:** two authorization paths.

## Consequences

- Phase 2 is additive and solo queries already exercise the final access path.
- Phase 1 queries carry one extra join.
- Team-wide access would later need a workspace layer and a new ADR.
