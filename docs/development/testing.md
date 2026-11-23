# Testing

How the suites are run and written. The short rules are in `AGENTS.md` §4. The static tools and the integration
runner are installed ([what they enforce](code-conventions.md#9-enforcement)); the others are proposed.
There is no CI: run them by hand.

`npm test` starts the local Postgres, builds the app, runs `next start` on a throwaway database and posts the real
forms. It uses Node's own test
runner, so there is no test library.

| Level | Tool | Covers | Runs |
| --- | --- | --- | --- |
| Static | Prettier, ESLint, TypeScript | Style, types, import boundaries | Every commit or push |
| Unit | `node:test` | Rules, schemas, dates, ordering, permissions | Every push |
| Integration | `node:test` against `next start` on Postgres | Forms, DAL, SQL, migrations, jobs, limits | Every push |
| End to end | Playwright against the staging deployment | Core journeys | Before every release |
| Accessibility | axe in Playwright, plus manual keyboard pass | WCAG 2.2 AA | PR and release |
| Load | Scripted clients against staging | Latency, live updates | Before launches |

Integration tests run the production build, not `next dev`: some failures appear only there, such as forms posted
before hydration.

## Always test

- **Authorization:** each DAL function as owner, non-member and signed out. Phase 2 adds editor, viewer and removed member.
- **Isolation:** concurrent requests from different users never mix data.
- **Conflicts:** stale versions change nothing, including other statements in the batch.
- **Time:** midnight, daylight-saving changes and users far from UTC.
- **Races:** parallel requests on limits, codes and membership never pass a check together.
- **Retries:** the same job twice produces one effect.
- **Migrations:** from empty and from the previous release with data.

## Smoke test

Run on staging after every deploy, and on every framework or dependency upgrade:

1. A static page returns 200.
2. A dynamic page returns 200 **with and without a cookie**.
3. A Cache Components page streams its dynamic part.
4. A Server Action mutates and refreshes.
5. Sign-in works end to end, and each service in use responds.
6. Runtime logs contain no unexpected errors.

## Conventions

- Integration tests live in `tests/integration/<resource>.test.ts`, named by behaviour:
  `test("removing a member keeps their account", …)`.
- Go through the real stack, DAL to Postgres. The database is the suite's fixture, created fresh for each run.
- Authenticate with a real test session. Never override the auth check: that skips what is under test.
- Get data in as production does (sign up, create a project, accept an invitation), not by inserting rows.
- Replace only what is outside: email records what it was sent, third parties sit behind a mock transport.
- No real waits: move time by editing the row's timestamp (or with a fake clock in unit tests), and wait only for
  an outcome.
- Never sample or skip tests to save time. Deprecation warnings stay visible: fix ours.
- Fix a bug with a test that fails first.
- Test behavior, not implementation.
- Use the real local database, not mocks.
- Use synthetic data only.
- A flaky test is fixed, not retried or skipped.
