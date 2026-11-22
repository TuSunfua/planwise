# Testing

How the suites are run and written. The short rules are in `AGENTS.md` §4. The static tools are installed
([what they enforce](code-conventions.md#9-enforcement)); the others are proposed and are installed in M0.
There is no CI: run them by hand.

| Level | Tool | Covers | Runs |
| --- | --- | --- | --- |
| Static | Prettier, ESLint, TypeScript | Style, types, import boundaries | Every commit or push |
| Unit | Vitest | Rules, schemas, dates, ordering, permissions | Before every PR |
| Integration | Vitest with Cloudflare's Workers pool | DAL, SQL, migrations, jobs, bindings in use | Before every PR |
| End to end | Playwright against a Workers preview | Core journeys | Before every PR |
| Accessibility | axe in Playwright, plus manual keyboard pass | WCAG 2.2 AA | PR and release |
| Load | Scripted clients against staging | Latency, live updates | Before launches |

End-to-end tests run against the OpenNext build, not `next dev`, because the failures found while planning passed the build and appeared only when run in workerd.

## Always test

- **Authorization:** each DAL function as owner, non-member and signed out. Phase 2 adds editor, viewer and removed member.
- **Isolation:** concurrent requests from different users never mix data.
- **Conflicts:** stale versions change nothing, including other statements in the batch.
- **Time:** midnight, daylight-saving changes and users far from UTC.
- **D1 limits:** more than 100 bound values.
- **Retries:** the same job twice produces one effect.
- **Migrations:** from empty and from the previous release with data.

## Workers smoke test

Run on every framework, adapter, Wrangler or compatibility-date change:

1. A static page returns 200.
2. A dynamic page returns 200 **with and without a cookie**.
3. A Cache Components page streams its dynamic part.
4. A Server Action mutates and refreshes.
5. Each binding in use works (D1 from M1, R2 from M4).
6. Runtime logs contain no unexpected errors.

## Conventions

- Integration tests live in `tests/integration/<resource>.test.ts`, named by behaviour:
  `test("removing a member keeps their account", …)`.
- Go through the real stack, DAL to D1. The database is the suite's fixture, with foreign keys enforced.
- Authenticate with a real test session. Never override the auth check: that skips what is under test.
- Get data in as production does (sign up, create a project, accept an invitation), not by inserting rows.
- Replace only what is outside: email records what it was sent, third parties sit behind a mock transport.
- No real waits: drive time with a fake clock and wait only for an outcome.
- Never sample or skip tests to save time. Deprecation warnings stay visible: fix ours.
- Fix a bug with a test that fails first.
- Test behavior, not implementation.
- Use real local bindings, not mocks.
- Use synthetic data only.
- A flaky test is fixed, not retried or skipped.
