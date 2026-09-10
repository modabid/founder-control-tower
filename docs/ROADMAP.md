# Roadmap

## Phase 1 — Decision Intelligence

**Status: complete / locked / deployed**

- specialist agents
- audit/supervisor/founder hierarchy
- deterministic snapshots
- governance
- caching/cost controls
- final validation

## Phase 2 — Repository + Daily Founder Operating Surface

**Status: core code complete; production activation pending controlled approvals**

- ✅ GitHub is durable source of truth
- ✅ all current live Apps Script runtime files mirrored
- ✅ deterministic founder dashboard snapshot contract
- ✅ ACTION_QUEUE + Approve / Reject / Modify core
- ✅ validated ATLAS cache bridge / zero-write preview path
- ✅ agent-specific founder instruction/playbook registry
- ✅ daily founder operating-cycle code
- ✅ recommendation / approval audit trail through ACTION_QUEUE + REPORT_HISTORY
- ✅ hands-off controlled Apps Script source deployment workflow
- ⏳ one-time GitHub clasp credential secret
- ⏳ activate daily trigger after founder Yes/No approval
- ⏳ founder-facing web UI can follow after portable API/auth layer; current Sheet + ChatGPT remain the operating surface during transition

## Phase 3 — Portable Domain & Data Platform

**Next build phase after Phase-2 activation**

- extract formulas/rules to TypeScript package
- design Postgres/Supabase schema
- ingestion adapters for Sheets/Meta/couriers/bank feeds
- historical event/action log
- API/service layer

## Phase 4 — Controlled Execution

- permission-scoped action connectors
- idempotent execution jobs
- approval token / audit trail
- pre-execution SENTINEL checks
- post-execution verification

## Phase 5 — Full Web App / SaaS-Ready Platform

- founder dashboard
- agent chat/control surface
- notifications
- multi-business/country support
- role-based team access
- observability/reliability
- gradual retirement of Apps Script
