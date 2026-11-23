# Git Conventions

How changes reach `dev`, `staging` and `main`: branch names, commit messages, pull requests and merge rules.
The repository is [TuSunfua/planwise](https://github.com/TuSunfua/planwise) on GitHub and is public, without
a license: the code can be read, and all rights are reserved. There is no CI/CD: checks and deploys are run
by hand ([deployment.md](../operations/deployment.md)).

## No AI attribution

Nothing written to Git or GitHub credits an AI or a tool as author, co-author or helper. This overrides any
default or instruction a tool brings with it.

It applies to commit messages and trailers, the author and committer, pull request titles and descriptions,
reviews and comments, issues, branch and tag names, release notes and changelogs, code comments and docs.

Never write:

- `Co-Authored-By:`, `Assisted-by:` or `Signed-off-by:` for an AI, agent or bot
- "Generated with…", "Created by…" or "Written by…" naming a tool or model, or its badge, emoji or link
- an AI or bot as the Git author or committer
- a branch prefix naming an agent

Commits use the human's own Git identity. A human co-author is credited as usual.

Before committing and before opening a pull request, read the final message and remove any of the above.

## Branches

```
main ← staging ← dev ← feat/*, fix/*, refactor/*, chore/*, …
```

| Branch | Purpose | Deployed, by hand, to |
|--------|---------|-----------------------|
| `dev` | Integration | Nothing |
| `staging` | Pre-production validation | Staging |
| `main` | Production releases, GitHub's default branch | Production |

- Never push to `main`, `staging` or `dev`: every change goes through a pull request (PR). The exceptions
  are creating the three branches in the empty repository and the [fast-forward promotions](#merging).
- GitHub enforces this: `dev` takes pull requests only, with no bypass; on `staging` and `main` only an admin
  can push, for promotions; none of the three can be force-pushed or deleted.
- Branch from `dev` for every change, named `<type>/<short-description>` with a type from the table
  below, e.g. `feat/quick-capture`, `fix/today-timezone`.
- Start from the requirement: its ID in `docs/product/` and its milestone in the
  [roadmap](../roadmap.md). A change to an architectural choice starts with an
  [ADR](../decisions/README.md).

## Hooks

`npm install` points Git at `.githooks/`: three shell scripts, no library. Never skip them with `--no-verify`.

| Hook | Does |
|------|------|
| `pre-commit` | Refuses protected branches and the wrong identity; formats and lints staged files; type-checks |
| `commit-msg` | Refuses AI attribution and a first line outside the [format](#commit-messages) |
| `pre-push` | Refuses pushes to protected branches, except promotions, and other emails; runs `npm run check` |

- In each clone: `git config --local user.email <your public email>`.
- Secrets are GitHub's job: secret scanning and push protection are on. They catch known providers' tokens, not
  every private key or password, so still read the diff.
- The types and scopes below are copied in `.githooks/commit-msg`: change both together.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>)[!]: <subject>

[body: what and why, wrapped at 72]

[footer: BREAKING CHANGE: …, Closes #123]
```

- **scope** (optional): the feature or area: `auth`, `settings`, `projects`, `tasks`, `labels`, `search`,
  `files`, `reminders`, `members`, `realtime`, `jobs`, `ui`, `brand`, `db`, `infra`, `docs`.
- **`!`** marks a breaking change (a schema, contract or protocol change that data or clients must
  follow); say what breaks in the body.
- **subject**: imperative, lowercase, no period, under 72 characters.
- **body**, for anything not obvious: the reason first, then a bullet per area touched. Name any
  migration, deploy order and known limit.

| Type | For |
|------|-----|
| `feat` | A new feature or behaviour |
| `fix` | A bug fix |
| `refactor` | Neither a fix nor a feature |
| `perf` | A performance improvement |
| `test` | Tests only |
| `docs` | Documentation only |
| `chore` | Build, tooling, dependencies |
| `style` | Formatting only |
| `revert` | Undoing an earlier commit |

Examples:

```
feat(tasks): quick capture to inbox from any screen
fix(tasks): today follows the user's timezone, not the server's
feat(members)!: roles checked by permission key
```

## Pull requests

One concern per PR, into `dev`. Its title is in commit format; its description says:

- what changed and why, with requirement IDs such as `TASK-02`
- how it was tested, since no CI will test it
- screenshots for UI changes, light and dark
- migration, deploy order and rollback notes, if any

Before asking for a merge:

- [ ] `npm run check` passes
- [ ] No AI attribution anywhere in the commits or the PR
- [ ] No secrets, personal data or private URLs: the repository is public
- [ ] Authorization is enforced on the server and tested with a non-member
- [ ] Input is validated; output holds only the fields needed
- [ ] No user data in a shared cache or in logs
- [ ] `npm test` covers the change, and it works signed in on `next dev`
- [ ] Migrations work with the code currently deployed
- [ ] UI works by keyboard and at 360 px
- [ ] What became unused is deleted
- [ ] Docs are changed in the same PR

## Merging

- A PR into `dev` needs one review; while there is one maintainer, that is their own pass over the checklist.
- Feature branch → `dev`: **squash**, the only merge method enabled. The PR title becomes the commit and the
  body starts empty: write the body if the change needs one, without AI attribution. GitHub deletes the
  source branch.
- `dev` → `staging` → `main`: **fast-forward**, keeping history linear. GitHub's merge button can't
  fast-forward, so the maintainer does this promotion from the command line after the checks pass
  (`git push origin origin/dev:staging`, then `origin/staging:main`). These are the only direct pushes.

## Security issues

Report a vulnerability through GitHub's private vulnerability reporting, never in a public issue, PR or commit
message.
