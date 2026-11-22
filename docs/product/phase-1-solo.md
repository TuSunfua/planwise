# Phase 1: Solo

**Goal:** one person can run all their personal work in PlanWise.

"Solo" means a solo account: each user signs in and works only on their own data, online. It does not mean offline or local-only.

Priority: **Must** is required for release, **Should** is expected, **Could** is first to cut.

## Requirements

### Account (M1)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| AUTH-01 | Sign in with an email code | Must | Code expires in 10 minutes, works once and allows 5 attempts |
| AUTH-03 | Sign out and revoke sessions | Must | A revoked session fails on its next request |
| AUTH-04 | Set profile, timezone and theme | Must | Today follows the saved timezone; theme is system, light or dark, with no flash on load |
| AUTH-05 | Get an Inbox on sign-up | Must | Exactly one exists, even if sign-up is retried |

### Tasks (M2)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| TASK-01 | Quick capture from any screen | Must | Title and Enter create a task, in Inbox by default |
| TASK-02 | Edit title, notes, status, priority and dates | Must | A stale edit reports a conflict and keeps the typed text |
| TASK-03 | Complete and reopen | Must | One action; completion time is set and cleared |
| TASK-04 | One level of subtasks | Should | Parent shows progress; deeper nesting is rejected |
| TASK-05 | Delete and restore | Must | Undo is offered; restorable for 30 days |
| TASK-06 | Move between projects | Must | Subtasks move too; the user is told labels will be removed |

### Projects (M2)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| PROJ-01 | Create and edit projects | Must | Name is required; color is optional |
| PROJ-02 | Archive and unarchive | Must | Archived projects are read-only and leave default views |
| PROJ-03 | Delete and restore | Must | Confirmation required; restorable for 30 days; Inbox is protected |

### Planning views (M3)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| VIEW-01 | Inbox | Must | Shows tasks that have not been sorted into a project |
| VIEW-02 | Today | Must | Open tasks planned or due today, plus a separate overdue group |
| VIEW-03 | Upcoming | Must | The next 14 days, grouped by date |
| VIEW-04 | Project list | Must | Manual order survives a reload |
| VIEW-05 | Project board | Should | Columns by status; moving works by keyboard as well as drag |

### Organization (M4)

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| ORG-01 | Labels | Should | Names are unique within a project, ignoring case |
| ORG-02 | Search | Must | Finds title and notes matches only in accessible projects |
| ORG-03 | Filters | Should | By status, priority, label and date; stored in the URL |
| FILE-01 | Attachments | Should | Up to 10 MB each; private; removed when the task is purged |
| REM-01 | Email reminders | Could | Sent once at the chosen time, not for completed or deleted tasks |
| DATA-01 | Export data | Must | JSON containing everything the user owns |
| DATA-02 | Delete account | Must | Requires recent sign-in; removes rows and R2 objects |

## Task rules

- **Status:** `todo`, `in_progress`, `done`. Archived and deleted are separate timestamps, not statuses.
- **Priority:** `none`, `low`, `medium`, `high`, `urgent`.
- **Dates:** planned and due dates are calendar days with no time. A reminder is an exact instant.
- **Today:** calculated in the viewer's timezone, never the server's.
- **Parent completion:** completing a parent does not complete its subtasks.

## Quality bar

| Area | Requirement |
| --- | --- |
| Performance | p75 LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.1 |
| Server | p95 under 500 ms for common reads and writes |
| Scale | Smooth with 5,000 tasks in an account and 500 in a project |
| Accessibility | WCAG 2.2 AA |
| Devices | Usable from 360 px wide, on current major browsers |
| Privacy | No user's data is ever visible to another user |

## Out of scope

Sharing, assignees, comments, live updates, recurring tasks, calendar sync, offline editing, social sign-in and translations.

## Release criteria

- All Must requirements pass their acceptance criteria.
- Cross-user denial tests cover every read, write, search, export and file route.
- A D1 restore has been rehearsed in staging.
- The owner has used PlanWise as their only task manager for two weeks without a blocking bug.
