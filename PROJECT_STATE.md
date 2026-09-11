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

### Vercel Readiness Preflight

No-deploy preflight run `34603857231` ran after the verified Apps Script bridge was registered:

- full deterministic regression suite: **PASS**
- registered bridge ID/URL consistency: available to the gate
- `FCT_VERCEL_TOKEN`: configured
- `FCT_APPS_SCRIPT_READ_TOKEN`: configured
- `FCT_WEB_ACCESS_TOKEN`: **MISSING**
- Vercel candidate created: **NO**
- Vercel production changed: **NO**

Current blocker: the founder must create the private GitHub Actions secret `FCT_WEB_ACCESS_TOKEN` with at least 24 high-entropy characters. After it is saved, rerun the same no-deploy preflight.

## No-New-Billing Web Read Path — VERIFIED / REGISTERED

The founder declined adding a Google Cloud payment method solely for a new service account. ADR-010 therefore uses a token-gated Apps Script read bridge instead.

PR #12 merged to `main` on 2026-09-11 with merge SHA `2bf05199a5cd5a32673ff76830d3cdfc9f2bad6c`.

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
- uses Script Property `FCT_READ_BRIDGE_TOKEN` and matching server-only GitHub secret `FCT_APPS_SCRIPT_READ_TOKEN`;
- does not reuse the clasp credential on the application request path.

Direct offline bridge regression is included in the main test suite and validates correct-token / wrong-token behavior, the fixed nine-range allow-list, date serialization, zero writes and zero AI/executor side effects.

### First Founder-Approved Versioned Web-App Deployment Attempt

Founder explicitly approved the versioned Apps Script read-bridge deployment on 2026-09-11.

Deployment gate: `deploy/apps-script-web`  
Approved source SHA: `2bf05199a5cd5a32673ff76830d3cdfc9f2bad6c`  
GitHub Actions run: `34572448406`

Attempt 1 stopped safely before any deployment because `FCT_APPS_SCRIPT_READ_TOKEN` was not available to GitHub Actions. The founder regenerated a 64-character high-entropy token and updated both:

- Apps Script Script Property: `FCT_READ_BRIDGE_TOKEN`
- GitHub Actions secret: `FCT_APPS_SCRIPT_READ_TOKEN`

The same founder-approved deployment was retried. On the retry:

- deterministic regression suite: **PASS**
- private deployment input validation: **PASS**
- clasp credential normalization: **PASS**
- Apps Script source push step: **PASS** (`clasp` reported `Skipping push`, meaning HEAD already matched reviewed source)
- versioned read-bridge deployment creation: **PASS**
- created deployment ID: `AKfycbz5bDORUEqama0PiN2o9JpLewgE_RjmBGYs3tXz0-4Jvtgn7DxCI2bbqxo1MLlxY-0`
- deployment URL: `https://script.google.com/macros/s/AKfycbz5bDORUEqama0PiN2o9JpLewgE_RjmBGYs3tXz0-4Jvtgn7DxCI2bbqxo1MLlxY-0/exec`
- post-deploy token/read-only verification: **FAIL**

The verification failure is currently isolated to the deployed HTTP endpoint response. The workflow expected JSON from `doPost()` but received non-JSON content; `jq` failed with `Invalid numeric literal at line 1, column 10`. The initial workflow did not safely fingerprint the Google-side response, so it did not establish that `doPost()` itself failed.

A no-deploy diagnostic workflow was merged in PR #13 at SHA `5ac8fc958b26f804fdadef14afaa5c94b72304f5` and run as GitHub Actions run `34585449467`. It performed no Apps Script push or deployment operation. Safe live result:

- HTTP status: **401**
- content type: **text/html**
- redirect target: **none**
- fingerprint: **GOOGLE_RESOURCE_UNAVAILABLE**
- deterministic regression suite before the probe: **PASS**

After the founder confirmed that `FCT_READ_BRIDGE_TOKEN` had now been saved in Apps Script Script Properties, the same no-deploy diagnostic was rerun as attempt 2 of run `34585449467`. It returned the identical `401` / `text/html` / no-redirect / `GOOGLE_RESOURCE_UNAVAILABLE` result. Script Properties are read only after Apps Script execution begins, so this confirms the saved token is not the remaining blocker; Google's web-app access/resource layer is rejecting the request first.

Safe deployment metadata then identified the exact blocker: version 3 was a `WEB_APP` executing as `USER_DEPLOYING`, but its access was `ANYONE` rather than `ANYONE_ANONYMOUS`. That setting requires Google sign-in and caused the pre-`doPost()` 401.

The founder approved a material access correction and new versioned deployment. PR #18 hardened the production gate to force the reviewed manifest, pull it back and require anonymous access before version creation, then verify deployed access metadata before live JSON.

Founder-approved deployment run `34603494366` completed successfully on 2026-09-11:

- deterministic regression suite: **PASS**
- reviewed Apps Script source force-push: **PASS**
- pre-deployment pull-back manifest access: **ANYONE_ANONYMOUS**
- created deployment version: **4**
- verified deployment ID: `AKfycbyVSTktHx55hSfV99I2A-ZSuJqIzj56sWrv4yE1x3SFj6bxgsZojCKBjae6sTO6II6aXA`
- deployed entry point: **WEB_APP / ANYONE_ANONYMOUS / USER_DEPLOYING**
- live HTTP chain: **302** to `script.googleusercontent.com`, then **200 application/json**
- token-gated JSON contract: **PASS**
- allow-listed source matrices: **PASS**
- writes / external actions / AI calls: **0 / 0 / 0**
- final source pull-back parity: **PASS**

The verified deployment ID/URL is now registered in `config/apps-script-read-bridge.json`.

Because verification failed:

- pull-back parity step was skipped in that deployment run;
- `config/apps-script-read-bridge.json` on `main` intentionally remains empty/untrusted;
- the new deployment ID/URL is **not yet registered as trusted production source**;
- Vercel production promotion was **not triggered**;
- no Sheet write, ACTION_QUEUE mutation, paid AI call or external business action occurred.

## Remaining Production Gates

Before live founder production can be marked READY:

1. founder configures missing `FCT_WEB_ACCESS_TOKEN` (minimum 24 high-entropy characters), then rerun the no-deploy Vercel readiness preflight;
2. obtain the separate founder Yes / No approval for Vercel production promotion;
3. run `deploy/vercel` and require candidate founder auth, GET-only API, live bridge read, no-store and zero-side-effect checks before promotion;
4. independently verify the promoted production deployment;
5. mark production READY only after all checks pass.

No Google Cloud billing account/service account is required for this route.

## Approval Continuity

The founder already approved creation of the versioned Apps Script read bridge and the retry required after the missing-secret failure. The founder approved and completed the material Apps Script access correction through run `34603494366`. The bridge is verified and registered. Vercel production promotion remains a separate founder Yes / No gate. Vercel production promotion remains a separate founder approval gate unless the current conversation contains explicit approval for that exact promotion.
