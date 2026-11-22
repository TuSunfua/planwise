# Documentation

How PlanWise is planned, built and run. Start with [the project README](../README.md) to run it locally, then
read what matches your task below. Rules for AI agents are in [AGENTS.md](../AGENTS.md).

```
docs/
├── product/         what we build: overview, the two phases
├── platform/        cross-cutting: architecture, Cloudflare, data model, security
├── development/     how we work: code layout and rules, tests, git
├── operations/      deploying, rolling back, operating
├── decisions/       why: architecture decision records
├── brand/           logo and theme
├── roadmap.md
└── open-questions.md
```

## Where to start

| I want to… | Read |
|---|---|
| add or change code | [development/code-conventions.md](development/code-conventions.md) first |
| know what to build next | [roadmap.md](roadmap.md), then the phase's doc |
| understand a request end to end | [platform/architecture.md](platform/architecture.md) |
| add a permission or protect an action | [platform/security.md](platform/security.md) |
| add or change a table | [platform/data-model.md](platform/data-model.md) |
| build UI | [brand/theme.md](brand/theme.md) |
| write or run tests | [development/testing.md](development/testing.md) |
| branch, commit, merge | [development/git-conventions.md](development/git-conventions.md) |
| deploy or roll back | [operations/deployment.md](operations/deployment.md) |

## All documents

### Product

| Doc | Covers |
|---|---|
| [overview.md](product/overview.md) | Vision, users, principles, vocabulary, targets |
| [phase-1-solo.md](product/phase-1-solo.md) | Requirements and release criteria of the solo app |
| [phase-2-collaboration.md](product/phase-2-collaboration.md) | Requirements and release criteria of collaboration |
| [roadmap.md](roadmap.md) | Milestones, their exit criteria, risks |
| [open-questions.md](open-questions.md) | What is undecided, with working defaults |

### Platform

| Doc | Covers |
|---|---|
| [architecture.md](platform/architecture.md) | Workers, request flow, caching, consistency |
| [cloudflare.md](platform/cloudflare.md) | Services, limits, environments, bindings |
| [data-model.md](platform/data-model.md) | Tables, invariants, indexes, safe writes, migrations |
| [security.md](platform/security.md) | Threats, auth, permissions, input, files, privacy |

### Development

| Doc | Covers |
|---|---|
| [code-conventions.md](development/code-conventions.md) | Next.js project structure, layers, DAL, validation, errors, comments, logging, checklists |
| [testing.md](development/testing.md) | Test levels, conventions, the Workers smoke test |
| [git-conventions.md](development/git-conventions.md) | No AI attribution, branches, commit messages, pull requests, merge flow |

### Operations

| Doc | Covers |
|---|---|
| [deployment.md](operations/deployment.md) | Manual releases, regions, changing the domain, rollback, quotas |

### Decisions and brand

| Doc | Covers |
|---|---|
| [decisions/](decisions/README.md) | The ADRs and how to write one |
| [brand/README.md](brand/README.md) | Name, logo files and usage |
| [brand/theme.md](brand/theme.md) | Colors, type, layout, components, motion |

## Which doc owns what

Each fact is written once, in the doc that owns it; other docs link to it instead of repeating it.
`AGENTS.md` is the one summary, and it defers to these.

| Topic | Owner |
|---|---|
| What the product does | the phase's doc in `product/` |
| Order of work | [roadmap.md](roadmap.md) |
| Folders, layers, errors, code style | [code-conventions.md](development/code-conventions.md) |
| Tables, columns, invariants | [data-model.md](platform/data-model.md) |
| Permissions, input limits | [security.md](platform/security.md) |
| Bindings, limits, environments | [cloudflare.md](platform/cloudflare.md) |
| Branches, commits, merging | [git-conventions.md](development/git-conventions.md) |
| Releasing and rolling back | [deployment.md](operations/deployment.md) |
| Colors, type, components | [theme.md](brand/theme.md) |
| Why a choice was made | its ADR |

## Writing docs

- Write what the code can't tell a reader: contracts, rules, decisions and their reasons, how the parts fit,
  how to operate it. Don't restate what reading the code shows; link to the module instead.
- Put a doc in the folder of what it describes; add it to this index.
- Open with a line or two on what it covers.
- Use tables for settings, fields and lists of rules with attributes; one fact per bullet.
- Describe things as they are, or are planned to be, not their history (ADRs are the exception).
- Change the doc in the same commit as the code.
- Use relative links. Before renaming a heading, grep for `<doc>.md#`.
- Use the [product vocabulary](product/overview.md#vocabulary).
