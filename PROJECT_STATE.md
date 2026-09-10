# Project State

Last updated: **2026-09-10**

## Overall

Founder Control Tower Phase 1 is **locked, validated and deployed**. GitHub is the durable code/documentation source of truth. Google Apps Script remains the transitional live runtime while Phase 3 extracts deterministic business logic and data contracts into portable TypeScript.

The project operates in a **hands-off technical model**: normal architecture, coding, tests, CI fixes, branches, PRs and internal merges proceed without founder interruption. A concise **Yes / No** is required only for production deployment, paid infrastructure or governed externally effective business actions.

## Repository / Runtime Status

- GitHub repository: `modabid/founder-control-tower`
- default branch: `main`
- live Apps Script source mirror: `apps-script/live/`
- Phase-1 mapped live-vs-locked code parity: **12/12**
- controlled GitHub -> Apps Script deployment path: **operational**
- latest verified controlled Apps Script source deployment: regression PASS, clasp auth PASS, push PASS, pull-back parity PASS on 2026-09-10
- deployment target is Apps Script source/HEAD only; no separate versioned web-app deployment is implied
- `.clasp.json`: local-only / intentionally excluded from Git
- `appsscript.json`: tracked
- `FCT_CLASP_AUTH_JSON`: deployment-only secret; never an application/web data credential

## Phase-1 Locked Agents

| ID | Agent | Role | Status |
|---|---|---|---|
| AG001 | ATLAS | Founder Agent | Locked |
| AG002 | ORBIT | Chief of Staff / supervisor | Locked |
| AG003 | LEDGER | Finance & Cash | Locked |
| AG004 | SCALE | Ads & Growth | Locked |
| AG005 | ROUTE | Logistics & Courier | Locked |
| AG006 | STOCK | Inventory | Locked |
| AG012 | SENTINEL | Data Quality / Audit | Locked |

Reporting chain:

`Domain Agent -> SENTINEL -> ORBIT -> ATLAS -> Founder`

## Final Phase-1 Validation

Final hierarchy validation succeeded on 2026-09-10.

- validation mode: `HIERARCHY_ONLY_WITH_DETERMINISTIC_SPECIALIST_PROXIES`
- specialist AI calls: `0`
- hierarchy AI calls: `3`
- executed: `AG012 -> AG002 -> AG001`
- Sentinel recovery: not required
- V5 zero-AI cached replay: PASS
- governed external recommendations are deterministically repaired so model phrasing cannot bypass founder approval

## Locked Business Controls

- TikTok active-channel spend missing = hard blocker for final Real Contribution, Operating Profit and final SCALE go/no-go.
- Final delivery success = `(Delivered + Paid) / (Delivered + Paid + RRTO)` using terminal outcomes only.
- Delivered does not imply Paid. Delivered-but-unpaid remains courier receivable.
- Stock risk is dynamically derived from current deterministic data; SKU severity is never hardcoded.
- Inventory velocity = `max(7-day average pickup, 14-day average pickup)`.
- RRTO is not physical available inventory until received/check-in.
- Last Mile scale gate is `>=70%` finalized delivery success.
- Deterministic normalized data and reconciliations outrank AI interpretation.
- Missing/bad data causes HOLD/ASK, not guessing or majority voting.

## Current Workbook

`Founder Control Tower - MVP`

Spreadsheet ID:

`1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU`

The workbook remains the live MVP source during the strangler migration. Existing `ACTION_QUEUE` keeps the current 24-column A:X contract; no new control tab is required for Phase-2 approval state.

## Phase 2 — Control Plane / Founder Operating Surface

### Implemented

- deterministic ACTION_QUEUE mapping from final ATLAS recommendations;
- duplicate-open-action suppression;
- founder Approve / Reject / Modify-and-Approve state transitions;
- approval state separated from execution state; approval never implies execution;
- validated zero-AI ATLAS cache bridge;
- deterministic founder dashboard snapshot contract;
- auditable agent playbook registry with runtime parity tests;
- daily operating-cycle code that can refresh founder report/history and queue recommendations while executing zero external business actions;
- controlled GitHub Actions Apps Script source deployment workflow;
- dedicated `deploy/apps-script` branch as production deployment gate.

### Current Production Scheduling

The Apps Script daily-trigger installer exists in code, but the remote Apps Script Execution API `run-function` route returned Google storage `NOT_FOUND` during the attempted preflight/install/verify flow. Therefore **no Apps Script daily trigger is claimed as installed** from that route.

The founder-approved daily brief is active through ChatGPT automation at **08:15 Asia/Dubai**. It is analysis/reporting only and may not execute ads, payments, courier/order changes, inventory commitments, messages, purchases, deployments or other governed external actions.

## Phase 3 — Portable Domain / Data Layer

### Portable Domain Core V1 — MERGED

Merged to `main` on 2026-09-10 (merge SHA `9b046ef599b6aade4eb39401896e196294f1317d`).

`packages/domain/src/core.ts` now carries portable deterministic implementations for:

- terminal delivery success;
- Delivered/Paid semantics;
- active-channel contribution completeness and TikTok hard block;
- Operating Profit after complete Real Contribution;
- inventory velocity, physical stock days and dynamic stock gates;
- Last Mile `>=70%` scale gate;
- fail-closed deterministic numeric validation.

No Google/provider/UI/database/execution dependency belongs in the domain package.

### Read-Only Sheet / Founder API V1 — IN DEVELOPMENT, CI GREEN

Branch: `phase3/read-only-sheet-api`

Implemented and regression-tested:

- strict Sheet matrix/header adapter;
- GET-only Google Sheets REST reader with injected server-only token provider;
- verified live source contracts for `DAILY_PNL`, `ORDERS_MASTER`, `META_SPEND_LIVE`, `PAYROLL_LEDGER`, `OPEX_CONTROL`, `SUBSCRIPTIONS_CONTROL`, `ACTION_QUEUE` and `STOCK_INTELLIGENCE`;
- deterministic founder read model for MTD economics, cash/receivable semantics, Meta reconciliation, fixed-cost baseline, pending approvals and stock risk;
- explicit data-quality flags rather than treating an empty generic quality table as clean;
- authenticated framework-neutral founder API that is GET-only, no-store, fail-closed and provider-error-redacted;
- zero workbook writes, zero AI calls and zero external actions in this layer;
- zero-paid-API fixture regression tests.

See `docs/READ_ONLY_SHEET_API.md`.

### Credential Boundary for Future Web Runtime

A production web/API deployment must use a **dedicated server-only Google read credential/token provider** with minimum practical read scope. The clasp deployment credential must not be reused. No browser/client receives Google access or refresh tokens.

No live web/API endpoint or paid infrastructure has been provisioned yet.

## Founder Approval Model

Technical development, deterministic/offline tests, CI fixes, docs, PRs, internal merges, cached replay and read-only inspection proceed without founder interruption.

Founder Yes/No is required before:

- production deploy/redeploy;
- paid infrastructure or material new recurring cost;
- ads or campaign changes;
- payments/refunds/money movement;
- supplier/customer/courier communications;
- order/routing/courier status mutation;
- inventory purchase/transfer/adjustment/commitment;
- booking/purchase/deployment or another externally effective action.

## Next Workstream

1. finalize and merge the Phase-3 read-only Sheet/API branch after CI and documentation checks;
2. build the web founder dashboard shell against the read-model contract using mock/offline data first;
3. add secure server authentication and a server-side Google read-token adapter;
4. validate dashboard/read-model parity against current deterministic workbook outputs;
5. only then request founder Yes/No for any live Vercel/web API deployment or paid infrastructure;
6. migrate additional deterministic calculations/jobs incrementally before considering Apps Script retirement;
7. add permissioned executors domain-by-domain only after separate founder approval and audit coverage.
