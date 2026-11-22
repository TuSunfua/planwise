# Open questions

What is undecided, with working defaults, and what has been decided. Record an answer here, or in an ADR if
it is architectural.

## Open

| ID | Question | Working default | Decide by |
| --- | --- | --- | --- |
| Q4 | Which domain? Candidates: `planwise.id.vn`, or a subdomain of `fulltech.io.vn`. | Deferred: start on `workers.dev`, keep the [domain changeable](operations/deployment.md#changing-the-domain) | Before real email |
| Q13 | How do sign-in codes reach real users? Cloudflare's Free plan emails only [verified addresses](decisions/0006-free-plan.md#email). | Build against local simulation; choose Workers Paid or an external free email provider before public sign-up | Start of M1 |
| Q14 | What if pages don't fit Free's 10 ms of CPU? Local tests measured [16 to 27 ms](decisions/0006-free-plan.md#cpu) for dynamic pages. | Measure on a real Free deployment first thing in M0, then choose | Start of M0 |

## Decided on 2026-11-22

| ID | Question | Answer |
| --- | --- | --- |
| Q1 | What does "works alone" mean? | Solo accounts, online |
| Q2 | OpenNext or vinext? | OpenNext ([ADR 0002](decisions/0002-nextjs-on-workers.md)) |
| Q3 | Which Cloudflare plan? | Free ([ADR 0006](decisions/0006-free-plan.md)) |
| Q5 | Keep Next.js agent feedback? | Yes |
| Q6 | Which languages? | English now; i18n later |
| Q7 | Where does data live? | Asia-Pacific where a location can be chosen; no legal residency requirement |
| Q8 | Which sign-in methods? | Email only, by one-time code |
| Q9 | Keep the name and logo? | Yes, unchanged. No trademark or similar-logo search has been done. |
| Q10 | License and visibility? | Public repository, not open source: no license, all rights reserved |
| Q11 | Free or paid for users? | Free for now, no billing |
| Q12 | Git host and CI? | GitHub; no CI/CD for now |
