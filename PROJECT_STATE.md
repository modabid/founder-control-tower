# Project State

Last updated: **2026-09-11**

## Overall

Founder Control Tower Phase 1 is **locked, validated and deployed**. GitHub is the durable code/documentation source of truth. Google Apps Script remains a transitional runtime while deterministic business logic and the founder web surface migrate to portable TypeScript/Vercel.

The project operates in a **hands-off technical model**: normal architecture, coding, tests, CI fixes, branches, PRs and internal merges proceed without founder interruption. A concise **Yes / No** remains required for production deployments, paid infrastructure and governed externally effective business actions.

## Repository / Runtime Status

- GitHub repository: `modabid/founder-control-tower`
- default branch: `main`
- live Apps Script source mirror: `apps-script/live/`
- Phase-1 mapped live-vs-locked code parity: **12/12**
- controlled GitHub -> Apps Script source deployment path: **operational**
- latest verified Apps Script source deployment: regression PASS, clasp auth PASS, push PASS, pull-back parity PASS on 2026-09-10
- `.clasp.json`: local-only / excluded from Git
- `appsscript.json`: tracked
- `FCT_CLASP_AUTH_JSON`: deployment-only secret; never an application data credential

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

Reporting chain: `Domain Agent -> SENTINEL -> ORBIT -> ATLAS -> Founder`

## Locked Business Controls

- TikTok active-channel spend missing = hard blocker for final Real Contribution, Operating Profit and final SCALE go/no-go.
- Final delivery success = `(Delivered + Paid) / (Delivered + Paid + RRTO)` using terminal outcomes only.
- Delivered does not imply Paid. Delivered-but-unpaid remains courier receivable.
- Stock risk is dynamically derived from current deterministic data; SKU severity is never hardcoded.
- Inventory velocity = `max(7-day average pickup, 14-day average pickup)`.
- Zero physical stock with zero recent velocity = `NO_RECENT_DEMAND`, not active-demand stockout.
- RRTO is not physical available inventory until received/check-in.
- Last Mile scale gate = finalized delivery success `>=70%`.
- Deterministic normalized data/reconciliation outrank AI interpretation.
- Missing/bad material data causes HOLD/ASK, not guessing.

## Current Workbook

`Founder Control Tower - MVP`

Spreadsheet ID: `1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU`

The workbook remains the live MVP source during strangler migration. Existing `ACTION_QUEUE` keeps the 24-column A:X contract.

## Phase 2 — Control Plane

Implemented:

- deterministic ACTION_QUEUE mapping from final ATLAS recommendations;
- duplicate-open-action suppression;
- founder Approve / Reject / Modify-and-Approve transitions;
- approval state separated from execution state;
- validated zero-AI ATLAS cache bridge;
- deterministic founder dashboard snapshot contract;
- auditable agent playbook registry;
- daily operating-cycle code with zero external business actions;
- controlled Apps Script source deployment workflow.

The Apps Script daily trigger is not claimed as installed because the remote Execution API path returned Google storage `NOT_FOUND`. The approved daily founder brief is active through ChatGPT automation at **08:15 Asia/Dubai**, analysis/reporting only.

## Phase 3 — Portable Domain / Data / Web

### Portable Domain Core V1 — MERGED

Merged SHA: `9b046ef599b6aade4eb39401896e196294f1317d`.

Portable deterministic rules cover terminal delivery success, Delivered/Paid cash semantics, active-channel completeness/TikTok hard block, Operating Profit gating, inventory velocity/stock days, dynamic stock risk and Last Mile scale gate.

### Read-Only Sheet / Founder API V1 — MERGED

Merged SHA: `707ff8e4c967bdbb3e9f22ae178147a5696bb75a`.

Includes strict range/header adapters, deterministic founder read model, GET-only founder API, no-store behavior, fail-closed provider handling, and zero-write/zero-AI/zero-executor regression tests.

### Founder Web Dashboard Shell V1 — MERGED

Merged SHA: `afdb3bc6d9c5750a4592ea23766f274bbd12bd0f`.

Responsive founder dashboard surfaces P&L, delivery, courier receivable, deterministic controls, pending approvals and dynamic stock risk without duplicating business formulas in UI.

### Live Web Integration — MERGED

Merged SHA: `8a269b76775386255a556017def47e914c671d12`.

Live integration fixed/locked:

- UAE + Kuwait cash-source parity with shipment dedupe;
- zero-demand stock semantics;
- payroll payment-evidence control count;
- Sep-9 live-workbook parity regression;
- founder bearer auth, fail-closed/no-store API and server-only data credential boundary.

Sep-9 parity lock: 757 picked orders, 395 terminal successes, 251 pending, 111 RRTO, 78.06% finalized delivery, AED 28,731.12 delivered revenue/courier receivable at that cutoff, TikTok final-P&L hard blocker, two pending founder approvals and dynamic stock classification.

### Controlled Vercel Production Gate — MERGED

Initial gate merged SHA `7fd64b10b28b3ac2bd10d99d2bd25dc5475b98a4`; verify-before-promote hardening merged SHA `7886920c964b5c0e1d04ef595b6eaf1f0ae1b6e4`.

Production is triggered only from `deploy/vercel`. A candidate must pass auth, GET-only, live-read, no-store and zero-side-effect checks before promotion.

## Dedicated Vercel Project

Founder approved and a **separate** Vercel project was created:

- project: `founder-control-tower`
- source repository: `modabid/founder-control-tower`
- scope: Mohammed Abid's Vercel projects
- isolated from COD Dropshipping, StoreGem, DropshippingHunt and other applications
- current deployment: safe preview/bootstrap only; **live founder production is not yet marked READY**

`FCT_VERCEL_TOKEN` has been configured by the founder as a private GitHub Actions secret.

## No-New-Billing Web Read Path — IMPLEMENTATION IN PROGRESS

The founder declined adding a Google Cloud payment method solely for a new service account. ADR-010 therefore selects a token-gated Apps Script read bridge instead.

Branch: `phase3/apps-script-read-bridge`

Design:

`Vercel /api/founder -> Apps Script token-gated read bridge -> Founder Control Tower workbook`

The bridge:

- reads only a fixed allow-list of nine existing workbook ranges;
- returns raw matrices only;
- keeps all finance/delivery/cash/stock calculations in portable TypeScript;
- performs zero Sheet writes;
- performs zero ACTION_QUEUE mutations;
- performs zero paid AI calls;
- performs zero external business actions;
- uses Script Property `FCT_READ_BRIDGE_TOKEN` and matching server-only GitHub/Vercel secret `FCT_APPS_SCRIPT_READ_TOKEN`;
- does not reuse the clasp credential on the application request path.

A separate founder-gated versioned web-app deployment branch `deploy/apps-script-web` is being added. Its first successful deployment ID/URL will be recorded in `config/apps-script-read-bridge.json`; Vercel production refuses to run until that registry contains a trusted Apps Script URL.

## Remaining Production Gates

Before live founder production can be marked READY:

1. no-billing bridge branch must pass CI and merge to `main`;
2. founder must configure one server-to-server bridge secret in both Apps Script Script Properties and GitHub Actions;
3. founder web access token must exist as a separate GitHub secret;
4. founder must approve the versioned Apps Script web-app deployment;
5. bridge deployment must pass token/read-only/pull-back verification;
6. bridge deployment ID/URL must be committed to the non-secret registry;
7. founder-approved `deploy/vercel` promotion must pass candidate verification before production promotion.

No Google Cloud billing account/service account is required for this route.
