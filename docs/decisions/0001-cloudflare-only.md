# 0001: Run everything on Cloudflare

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

The owner requires PlanWise to be deployed entirely on Cloudflare infrastructure, including Workers and R2.

## Decision

Use Cloudflare for compute, data, files, jobs, email, real-time and observability. Use Workers with Static Assets, not Pages.

Google sign-in is proposed separately as an external identity provider. It hosts nothing.

## Alternatives

- **Mixed providers**, such as an external Postgres: conflicts with the requirement.
- **Cloudflare Pages:** Cloudflare's current full-stack Next.js guidance targets Workers.

## Consequences

- One account, bill and deployment tool.
- Designs must fit workerd and D1 limits.
- Beta products, currently Email Sending, carry availability and API risk.
