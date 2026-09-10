# Project State

Last updated: **2026-09-11**

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
- Zero physical stock with zero recent velocity is `NO_RECENT_DEMAND` / unknown-velocity monitoring, not an active-demand stockout alert.
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

## Phase 3 — Portable Domain / Data / Web Layer

### Portable Domain Core V1 — MERGED

Merged to `main` on 2026-09-10 (merge SHA `9b046ef599b6aade4eb39401896e196294f1317d`).

`packages/domain/src/core.ts` carries portable deterministic implementations for terminal delivery success, Delivered/Paid semantics, active-channel contribution completeness and the TikTok hard block, Operating Profit after complete Real Contribution, inventory velocity/stock days/dynamic stock gates, Last Mile `>=70%` scale gate and fail-closed numeric validation.

### Read-Only Sheet / Founder API V1 — MERGED

Merged to `main` on 2026-09-10 (merge SHA `707ff8e4c967bdbb3e9f22ae178147a5696bb75a`).

Implemented and regression-tested:

- strict Sheet matrix/header adapter;
- GET-only Google Sheets REST reader with injected server-only token provider;
- deterministic founder read model for MTD economics, cash/receivable semantics, Meta reconciliation, fixed-cost baseline, pending approvals and stock risk;
- explicit data-quality flags;
- authenticated framework-neutral founder API that is GET-only, no-store, fail-closed and provider-error-redacted;
- zero workbook writes, zero AI calls and zero external actions;
- zero-paid-API fixture regression tests.

### Founder Web Dashboard Shell V1 — MERGED

Merged to `main` on 2026-09-10 (merge SHA `afdb3bc6d9c5750a4592ea23766f274bbd12bd0f`).

Implemented and CI-tested:

- responsive read-only founder dashboard shell;
- P&L, delivery, courier receivable, controls, pending approvals and stock-risk surfaces;
- explicit offline/mock mode banner;
- fail-closed rendering fallback;
- no duplicated deterministic formulas in UI;
- no live Google credential, workbook write, approval mutation, AI call or external executor.

### Live Web Integration — CI GREEN / READY TO MERGE

Branch: `phase3/live-web-integration`

Validated on 2026-09-11:

- server-side `/api/founder` integration uses the existing GET-only Founder Read API;
- browser never receives Google credentials;
- dedicated service-account token provider is server-only;
- founder bearer token is required for the API;
- API responses are `no-store` with provider/configuration errors redacted;
- production web build regression passes;
- live workbook parity exposed and repaired zero-demand stock semantics so dormant zero-stock SKUs do not become false critical alerts;
- group cash/receivable parity now merges UAE `ORDERS_MASTER` and Kuwait `RAW_KWT` while deduplicating by shipment ID;
- strict generic Sheet parser remains strict; RAW_KWT repeated headers are handled by a dedicated positional adapter rather than weakening contract validation;
- payroll payment-evidence pending control count is now exposed correctly;
- Sep-9 deterministic live-workbook regression is part of the main CI suite and is green at commit `03014c206795f2bfe48087ed954b703f6e6d4ed7`;
- no Sheet writes, paid AI calls or external business executors are introduced.

Sep-9 parity lock includes: 757 picked orders, 395 terminal successes, 251 pending, 111 RRTO, 78.06% finalized delivery, AED 28,731.12 delivered revenue / courier receivable at that cutoff, TikTok final-P&L hard blocker, two pending founder approvals, and dynamic current-demand stock classification.

## Vercel Production Target

Founder approved creating a **new dedicated Vercel project** for Founder Control Tower rather than deploying into COD Dropshipping, StoreGem, DropshippingHunt or any other existing project.

Target:

- Vercel project name: `founder-control-tower`
- source repository: `modabid/founder-control-tower`
- production purpose: Founder Control Tower dashboard + read-only founder API
- environment and billing isolation: separate from existing ecommerce/SaaS projects
- current status: **not yet deployed**

Required server-only production environment values:

- `FCT_GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `FCT_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `FCT_WEB_ACCESS_TOKEN`
- optional override `FCT_SPREADSHEET_ID` (otherwise the locked workbook ID is used)

The clasp deployment credential must never be reused by the web application.

## Credential Boundary for Web Runtime

A production web/API deployment must use a **dedicated server-only Google read credential/token provider** with minimum practical read scope. The clasp deployment credential must not be reused. No browser/client receives Google access or refresh tokens.

## Founder Approval Model

Technical development, deterministic/offline tests, CI fixes, docs, PRs, internal merges, cached replay and read-only inspection proceed without founder interruption.

Founder Yes/No is required before production deploy/redeploy, paid infrastructure or externally effective actions. Founder approval to proceed with the live web deployment stage and to create a separate `founder-control-tower` Vercel project has been received.

## Next Workstream

1. merge the CI-green live web integration PR into `main`;
2. create/link the new dedicated Vercel project `founder-control-tower` to `modabid/founder-control-tower`;
3. provision/use a dedicated server-only Google read credential and founder web access token without exposing either to the browser;
4. deploy the read-only Founder Control Tower web surface under the approved production gate;
5. verify authentication, live workbook parity, fail-closed behavior, no-cache policy and zero-write/executor boundaries after deployment;
6. migrate additional deterministic calculations/jobs incrementally before considering Apps Script retirement;
7. add permissioned executors domain-by-domain only after separate founder approval and audit coverage.
