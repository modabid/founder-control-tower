# Architecture & Governance Decisions

Durable decisions are recorded here so future chats/agents do not rely on conversational memory.

## ADR-001 — Deterministic calculations outrank AI

**Status:** Accepted

Financial arithmetic, delivery success, stock classification, reconciliation and data-quality checks are deterministic. AI interprets and prioritizes; it is not the source of truth.

## ADR-002 — Founder approval before external action

**Status:** Accepted

Agents are recommendation/analysis-first. Ads, payments/refunds, inventory commitments, courier/order changes, supplier/customer messages, deployments, purchases, bookings and other external commitments require founder approval unless a future explicit governance amendment says otherwise.

## ADR-003 — Phase-1 hierarchy

**Status:** Accepted

`LEDGER / SCALE / ROUTE / STOCK -> SENTINEL -> ORBIT -> ATLAS -> Founder`

SENTINEL audits/challenges; ORBIT synthesizes/prioritizes; ATLAS presents founder decisions.

## ADR-004 — AI cost control

**Status:** Accepted

Use deterministic snapshots, frozen source bundles, fingerprints/cache, local regression tests and cached replay. Do not repeat paid hierarchy tests for deterministic bugs.

## ADR-005 — GitHub becomes durable project source of truth

**Date:** 2026-09-10  
**Status:** Accepted

Code, agent contracts, architecture, decisions, changelog, tests and project status move into a Git repository. Chat history is not the durable project record.

## ADR-006 — Apps Script becomes transitional bridge

**Date:** 2026-09-10  
**Status:** Accepted

Google Sheets/Apps Script continue during validation/production transition but are not the permanent application architecture. New work should minimize Apps-Script-only coupling and preserve migration to TypeScript + database + web API.

## ADR-007 — Web application migration is incremental

**Status:** Accepted

Do not rewrite the entire system in one step. Extract stable business rules/contracts first, then database/API, then UI/action connectors. The Apps Script bridge can coexist during migration.

## ADR-008 — Founder approval and execution are separate queue states

**Date:** 2026-09-10  
**Status:** Accepted

Phase 2 uses the existing `ACTION_QUEUE` as a control-plane boundary between ATLAS recommendations and any future executor.

A recommendation may be queued without external effect. Founder approval changes only the queue state; it does not itself execute ads, messages, payments, inventory changes, courier/order changes, purchases, deployments or other commitments.

Founder-modified actions preserve the original row as `SUPERSEDED` and create a replacement record, keeping the decision trail auditable. V1 reuses the existing 24-column `ACTION_QUEUE` contract and does not add another sheet.

## ADR-009 — Hands-off technical operation with explicit founder gates

**Date:** 2026-09-10  
**Status:** Accepted

Routine technical work should not require the founder to run local commands. Repository inspection, implementation, deterministic testing, documentation, PR creation, CI troubleshooting, cached replay and no-write previews may proceed without interrupting the founder.

Founder approval remains mandatory for production deployment, paid infrastructure, external communications, financial commitments, ads/courier/order/inventory changes and other externally effective actions covered by governance. Approval requests should be concise Yes/No decisions.

For Apps Script source deployment, branch `deploy/apps-script` is the explicit production gate. Moving that branch to an approved `main` commit triggers deterministic CI, controlled `clasp push`, immediate pull-back verification and drift failure handling. This deployment path updates Apps Script source/HEAD only and does not silently create or update a separate versioned web-app deployment.

A one-time private GitHub Actions secret (`FCT_CLASP_AUTH_JSON`) is required because credentials must never be committed to the repository.
