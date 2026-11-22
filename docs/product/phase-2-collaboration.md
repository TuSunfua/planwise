# Phase 2: Collaboration

**Goal:** people can work together in a project while everything else stays private.

Phase 2 starts after the [Phase 1 release criteria](phase-1-solo.md#release-criteria) are met. Existing projects become shareable with no data migration between containers.

## Roles

There are three roles: **owner**, **editor** and **viewer**. The [permission matrix](../platform/security.md#permission-matrix) defines what each can do. A project always has exactly one owner, and an Inbox can never be shared.

## Requirements

### Membership (M6)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| MEM-01 | Invite by email | Must | Expires in 7 days, works once, only for that verified email; the link can be copied if the email can't be sent |
| MEM-02 | Revoke or resend an invitation | Must | The previous link stops working immediately |
| MEM-03 | Change roles | Must | Applies on the member's next request |
| MEM-04 | Remove a member or leave | Must | Access and live connection end; their assignments are cleared |
| MEM-05 | Transfer ownership | Must | Atomic; target must be a member and must accept |
| MEM-06 | Delete an account that owns shared projects | Must | Blocked until each is transferred or deleted |

### Working together (M7)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| COL-01 | Assign tasks | Must | Multiple assignees, all current members |
| COL-02 | Assigned to me | Must | Lists assignments across accessible projects |
| COL-03 | Comment | Must | Authors edit and delete their own; owner can delete any |
| COL-04 | Mention members | Should | Only current members can be mentioned |
| COL-05 | Activity history | Must | Append-only record of task and membership changes |
| NOTE-01 | In-app notifications | Must | For invitations, assignments and mentions; never for your own action |
| NOTE-02 | Email notifications | Should | Can be turned off by type; nothing sent after access is lost |

### Live updates (M8)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| LIVE-01 | Changes appear without a reload | Must | Within 2 seconds for connected members |
| LIVE-02 | Recover after disconnect | Must | Reconnect fetches the current state from D1 |
| LIVE-03 | Handle concurrent edits | Must | Never silently overwrites; the second writer sees a conflict |
| LIVE-04 | Presence | Could | Shows who is viewing the project |

## Behavior changes from Phase 1

| Topic | Phase 1 | Phase 2 |
| --- | --- | --- |
| Today | Your dated tasks | Solo projects as before; in shared projects, only tasks assigned to you |
| Planned date | Set by you | Shared by all members of the project |
| Move task | Any of your projects | Needs edit rights in both; removes assignees who are not in the destination |
| Attachments | Visible to you | Visible to every project member |
| Reminders | Yours | Still personal to the user who set them |

## Out of scope

Organizations, public links, guests without accounts, per-task permissions, chat, simultaneous character-by-character editing and billing.

## Release criteria

- Every cell of the permission matrix has an automated test.
- Removing a member is proven to cut off HTTP, files, search, email and WebSocket access.
- A test with 25 people connected to one project meets the 2-second target.
