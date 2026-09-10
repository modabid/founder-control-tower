# Web App Migration Strategy

## Goal

Remove Google Apps Script as the permanent runtime without discarding validated business logic.

## Principle

**Strangler migration, not big-bang rewrite.**

The existing Apps Script system keeps running while stable domain logic is extracted and replaced module by module.

## Target Boundaries

### Domain

Pure formulas, statuses, thresholds, reconciliation and governance. No Google APIs inside domain functions.

### Data adapters

Google Sheets initially; Postgres/Supabase later. Both implement the same repository contracts during transition.

### Agent layer

Compact deterministic packets -> model routing -> structured result -> deterministic governance post-processing.

### Action layer

Founder approval -> action queue -> permission-scoped executor -> verification -> audit trail.

### Web UI

Founder pulse, priorities, approvals, agent drill-down, data quality, finance, growth, logistics, stock and action history.

## Suggested Migration Order

1. Repository/documentation baseline.
2. Export remaining Apps Script runtime code.
3. Freeze domain contracts with tests.
4. Reimplement deterministic formulas in `packages/domain`.
5. Build read-only API over the current Sheet source.
6. Build web dashboard against that API.
7. Introduce database and dual-write/read reconciliation where appropriate.
8. Move scheduled ingestion/jobs out of Apps Script.
9. Add controlled execution connectors.
10. Retire Apps Script only after reconciliation proves parity.

## Candidate Stack

A practical candidate is:

- Next.js / TypeScript
- Postgres/Supabase
- Vercel
- background jobs/queues chosen only when required

This candidate is not a locked infrastructure decision yet.
