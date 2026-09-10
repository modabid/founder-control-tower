# Founder Control Tower

Founder Control Tower is the operating intelligence and decision-control layer for an ecommerce/COD business portfolio.

## Current Status

**Phase 1 is locked and validated as of 2026-09-10.**

The current production-intelligence chain is:

`LEDGER / SCALE / ROUTE / STOCK -> SENTINEL -> ORBIT -> ATLAS -> Founder`

Google Sheets + Google Apps Script remain the **transitional runtime/data bridge**. This repository is now intended to become the long-term source of truth for code, business rules, agent contracts, tests, architecture decisions, and migration work toward a full web application.

## Repository Rules

Before changing business logic or agent behavior, read in this order:

1. `PROJECT_STATE.md`
2. `docs/FOUNDER_CONTROL_TOWER_SPEC.md`
3. `docs/BUSINESS_RULES.md`
4. `docs/GOVERNANCE.md`
5. `docs/AGENT_REGISTRY.md`
6. `DECISIONS.md`
7. `AGENTS.md`

After every meaningful change:

- update `PROJECT_STATE.md` if status/versions/known blockers changed;
- update `CHANGELOG.md`;
- update `DECISIONS.md` for architecture or governance decisions;
- add/update tests before calling code validated.

## Current Technology

### Transitional MVP

- Google Sheets — current deterministic data/control layer
- Google Apps Script — ingestion, normalization, calculations and AI orchestration
- OpenAI / Anthropic — reasoning only; never accounting source of truth

### Migration Target

The target web stack is intentionally modular so Apps Script can be removed gradually:

- `apps/web/` — future Founder Control Tower web app
- `packages/domain/` — portable TypeScript business rules/domain model
- `packages/agents/` — agent contracts, prompts and orchestration
- `infra/` — database/deployment/integration infrastructure
- `apps-script/` — temporary legacy bridge until migrated

A likely implementation path is Next.js + Postgres/Supabase + Vercel, but final infrastructure choices must be approved before being treated as locked architecture.

## Phase-1 Locked Code

Current locked components are under `apps-script/`:

- LEDGER snapshot v3 / runner v2
- SCALE snapshot v4 / runner
- ROUTE snapshot v3 / runner
- STOCK snapshot v2 / runner
- SENTINEL v11
- ORBIT v6
- ATLAS v3
- Phase-1 Final Orchestrator v5

The final orchestrator includes deterministic stock repair, approval normalization, hierarchy caching, frozen deterministic source snapshots, and zero-AI cached hierarchy replay.

## Important Migration Gap

Some foundational runtime files currently exist only in the live Apps Script project and were not available in the local migration workspace. See `MIGRATION_CHECKLIST.md` before declaring the Apps Script source fully mirrored in GitHub.

## Security

Never commit API keys, access tokens, passwords, customer PII, raw exports containing PII, or `.clasp.json` with sensitive project/account data. Use environment variables / secret stores and commit only `.env.example` / `.clasp.json.example`.
