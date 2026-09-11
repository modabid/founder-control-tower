# Changelog

## 2026-09-11 — Safe Apps Script Bridge Diagnostics

### Changed

- Replaced the live bridge workflow's direct response-body-to-`jq` verification with a fail-closed Node verifier.
- Added safe HTTP diagnostics limited to status, content type, redirect host and recognized Google/Apps Script error fingerprints.
- Added a diagnostic-only workflow for the existing untrusted deployment; it cannot push Apps Script source or create/update a deployment.
- Added deterministic regression coverage proving tokens, redirect query data, workbook values and private response bodies are never logged.

### Live Diagnosis

- Diagnostic run `34585449467` passed the full deterministic suite, then received HTTP `401`, content type `text/html`, no redirect and fingerprint `GOOGLE_RESOURCE_UNAVAILABLE` from the existing deployed endpoint.
- The failure occurs at Google's access/resource layer before the expected `doPost()` JSON contract; no response body, token or workbook data was logged.
- The diagnostic run performed no Apps Script push or versioned deployment.
- After the founder saved the missing Script Property token, attempt 2 of the same no-deploy run returned the identical Google `401` access/resource fingerprint, confirming the request is blocked before token validation executes.
- Added a credential-safe Apps Script Deployment API metadata inspector so the next no-deploy diagnostic can report only the deployed entry-point type, access mode, execution identity, manifest name/version and URL host.
- Hardened the inspector to refresh clasp credentials when a stored access token has no trustworthy expiry timestamp, avoiding false metadata `401` results from stale OAuth tokens.
- Confirmed the deployed V3 web-app entry point was `ANYONE`, not `ANYONE_ANONYMOUS`, which requires Google sign-in and explains the pre-`doPost()` 401.
- Hardened the approved deployment gate to force the reviewed manifest to Apps Script HEAD, pull it back and require anonymous access before creating a version, then verify the deployed entry-point metadata before probing live JSON.

### Verified Bridge V4

- Founder-approved run `34603494366` created deployment version 4 with `WEB_APP / ANYONE_ANONYMOUS / USER_DEPLOYING`.
- Live verification followed the approved Google redirect and received `200 application/json` with the expected token-gated read-only contract.
- Pull-back source parity passed; writes, external actions and AI calls remained zero.
- Registered the verified deployment in `config/apps-script-read-bridge.json`.
- Added a no-deploy Vercel readiness preflight to verify required GitHub secrets and bridge registry consistency before the separate production promotion gate.
- Preflight run `34603857231` passed deterministic tests and stopped before any Vercel action because `FCT_WEB_ACCESS_TOKEN` is not configured.

### Deployment Boundary

- This change does not trust or register the pending deployment.
- The diagnostic workflow targets the already-created deployment only and performs no Apps Script redeploy.
- `config/apps-script-read-bridge.json` remains empty until live verification passes.

## 2026-09-11 — Phase 3 No-Billing Apps Script Read Bridge

### Added

- Token-gated Apps Script web-app read bridge under `apps-script/live/FounderReadBridge.js`.
- Fixed allow-list for the nine workbook ranges required by the founder read model.
- Server-side `AppsScriptBridgeReader` that fetches the source bundle once per founder request and satisfies all range reads from that bundle.
- Separate production gate `deploy/apps-script-web` for versioned read-bridge deployment and verification.
- Non-secret bridge deployment registry at `config/apps-script-read-bridge.json`.
- Updated Vercel candidate/promotion workflow to use the Apps Script bridge instead of a Google service account.
- ADR-010 and `docs/APPS_SCRIPT_READ_BRIDGE.md`.

### Security / Cost Boundary

- No new Google Cloud billing account or service account is required for the initial founder web runtime.
- Bridge authorization uses dedicated Script Property `FCT_READ_BRIDGE_TOKEN` plus matching server-side secret `FCT_APPS_SCRIPT_READ_TOKEN`.
- The clasp deployment credential is not reused on the application request path.
- The browser receives neither bridge token nor Google credential.
- Bridge contains no Sheet writes, ACTION_QUEUE mutations, AI calls or external business executors.
- Deterministic business calculations remain in portable TypeScript rather than moving back into Apps Script.

### Deployment Boundary

- Code/CI work does not itself create or update the versioned Apps Script web app.
- Versioned bridge deployment remains founder-gated.
- Vercel production promotion remains founder-gated and can proceed only after a registered bridge candidate passes live read-only verification.

## 2026-09-10 — Phase 3 Founder Web Dashboard Shell V1

### Added

- Responsive founder dashboard shell under `apps/web/` consuming the Phase-3 Founder Read Model contract.
- Presentation-only rendering for P&L, terminal delivery success, courier receivable, data-quality blockers, pending approvals and dynamic stock risk.
- Explicit offline/mock mode banner and fail-closed rendering fallback.
- No duplicated business formulas in the UI; deterministic rules remain in `packages/domain` and reconciliation remains in `packages/data`.
- Zero-network mock fixture and regression coverage for the dashboard shell.
- `docs/WEB_DASHBOARD_SHELL.md` documenting the production integration boundary.

### Deployment Boundary

- This shell is not yet a live production web endpoint.
- Approval mutations and business executors remain disabled.
- No Google credential is exposed to the browser and no workbook write, paid AI call or external business action is introduced.

## 2026-09-10 — Phase 3 Read-Only Sheet / Founder API V1

### Added

- Strict read-only Google Sheet matrix/record adapter under `packages/data` with verified live source-range contracts.
- GET-only Google Sheets REST reader with an injected server-side access-token provider and no Sheet mutation methods.
- Deterministic founder read model covering current-month P&L, cash/receivable semantics, Meta reconciliation, fixed-cost baseline, pending approvals and dynamic stock risk.
- Explicit data-quality flags for missing TikTok spend, Meta allocation/cutoff mismatch, Paid-with-receivable anomalies, payroll evidence gaps, missing subscription costs, non-AED OPEX and stock-velocity mismatches.
- Authenticated framework-neutral founder API contract that rejects non-GET methods, fails closed before data reads when unauthorized, disables caching and hides provider/internal errors.
- Zero-paid-API fixtures/regression tests for the Sheet reader, read model and API boundary.
- `docs/READ_ONLY_SHEET_API.md` including the rule that future web runtime credentials must be dedicated server-only read credentials; the clasp deployment credential must not be reused by the application.

### Deployment Boundary

- No web/API production endpoint is deployed by this work.
- No workbook write, ACTION_QUEUE mutation, AI call, external business action or paid infrastructure is introduced.
- Production web/API activation remains a separate founder Yes/No gate.

## 2026-09-10 — Phase 3 Portable Domain Core V1

### Added

- First portable TypeScript business-rule module under `packages/domain/src/core.ts`.
- Locked terminal delivery-success formula with Delivered/Paid/RRTO semantics.
- Explicit Delivered-vs-Paid courier-receivable helpers; Delivered is not inferred as Paid.
- Active-channel contribution completeness gate with the TikTok missing-spend hard block.
- Operating-profit calculation only after Real Contribution is complete.
- Locked inventory velocity, physical stock-day and dynamic stock-gate functions.
- Last Mile `>=70%` scale gate and fail-closed gate aggregation.
- Strict deterministic input validation so invalid/negative inputs fail instead of being silently guessed.
- Phase-3 zero-API regression suite executed with Node 22 type stripping; no TypeScript build dependency added yet.

### Current Runtime Note

- The controlled GitHub-to-Apps-Script source deployment path is operational and has completed regression, push and pull-back parity successfully.
- The Apps Script Execution API `run-function` path returned Google storage `NOT_FOUND` during remote trigger activation attempts, so no Apps Script daily trigger is claimed as installed from that route.
- The approved 08:15 Asia/Dubai founder brief is currently scheduled through ChatGPT automation and remains analysis/reporting only; no external business action is executed automatically.

## 2026-09-10 — Phase 2 Hands-Off Operating Surface

### Added

- Controlled GitHub Actions deployment workflow for Apps Script source/HEAD.
- Dedicated `deploy/apps-script` production gate branch.
- One-time private `FCT_CLASP_AUTH_JSON` credential contract; credentials remain outside Git.
- Deterministic regression + preflight + `clasp push` + immediate `clasp pull` + Git drift verification in the deployment workflow.
- `docs/HANDS_OFF_OPERATION.md` defining technical autonomy and concise Yes/No founder gates.
- ADR-009 for hands-off technical operation with explicit founder-controlled external actions.
- Auditable `config/agent-playbooks.json` registry plus an Apps Script runtime mirror and parity tests.
- Phase-2 daily operating-cycle code that can run the cost-controlled Phase-1 hierarchy, refresh founder brief/history and queue recommendations without executing external actions.
- Deterministic founder dashboard snapshot contract for future UI/API use.
- Additional Phase-2 CI regression tests for deployment safety, playbook governance, daily-cycle safety and dashboard source contracts.

### Not Activated Yet

- The daily Apps Script trigger is code-complete but is not claimed as installed through Apps Script because the remote Execution API function path is unavailable in the current deployment shape.
- No paid infrastructure, database migration, external messaging or business executor was created.
- A separate versioned Apps Script web-app deployment remains outside the source/HEAD deployment path.

## 2026-09-10 — Phase 2 Action Queue Core V1

### Added

- Deterministic `ACTION_QUEUE` / founder approval core on a dedicated Phase-2 branch.
- Queue mapping from final ATLAS recommendations without executing business actions.
- Separate approval and execution states.
- Founder Approve / Reject / Modify-and-Approve state transitions with audit trail preservation.
- Duplicate-open-action suppression.
- Cached Phase-1 no-write preview path and no-API pure contract tests.
- Phase-2 Node regression coverage in CI.
- `docs/ACTION_QUEUE.md` contract.

### Safety

- V1 performs no ads, payments, refunds, courier/order changes, inventory changes, messages, purchases, bookings, commitments or deployments.
- `APPROVED` / `READY` means eligible for a future executor; it does not mean executed.
- Existing 24-column `ACTION_QUEUE` sheet contract is reused; no new tab or grid expansion.

### Project State Correction

- Phase-1 SENTINEL V11 parity repair was deployed to Apps Script via controlled `clasp push` on 2026-09-10.
- Post-deploy `clasp pull` produced no Git drift.

## 2026-09-10 — SENTINEL Live Parity Repair

### Changed

- Aligned `apps-script/live/AgentSentinelPhase1Runner.js` with the locked `apps-script/hierarchy/AgentSentinelPhase1Runner_v11.gs` reference.
- Restored compact structured-output constraints, compact AI context, output-completion recovery retry, and recovery diagnostics in the Git live mirror.
- Recorded full **12/12** mapped Phase-1 live-vs-locked content parity.

### Verified

- Existing local Phase-1 regression suite passed in the Codex reconciliation workspace.
- SENTINEL live/reference byte comparison passed there.
- No API calls or paid AI validation were required.

## 2026-09-10 — Live Apps Script Mirror

### Added

- Direct `clasp` snapshot of the current live Apps Script project under `apps-script/live/`.
- Shared runtime modules, AI clients/config, schema, runner/report/snapshot runtime files, `Code.js`, `TikTokOAuth.js`, runtime probes and `appsscript.json`.
- `.gitattributes` to normalize repository text files to LF line endings.

### Verified

- Local Phase-1 regression suite passed before commit.
- Secret-pattern scan returned no matches for the checked API-key/token patterns.
- `.clasp.json` remained excluded from Git.
- GitHub Phase 1 CI passed for commit `cdb1e72971f9823412b9842b8b900b341703c76b`.

## 2026-09-10 — GitHub Baseline

### Added

- Repository-first project structure.
- Phase-1 locked snapshots, specialist runners, hierarchy agents and final orchestrator V5.
- Canonical project state, governance, business rules, agent registry and migration roadmap.
- GitHub CI smoke/regression tests.
- Migration checklist for reconciling the live Apps Script runtime.

### Locked

- Phase-1 agent hierarchy and deterministic-first governance.
- TikTok missing-spend hard blocker.
- Dynamic stock severity.
- Delivered/Paid/courier-receivable semantics.
- Founder approval normalization for governed external actions.

### Migration Decision

GitHub is the long-term code/documentation source of truth; Apps Script is transitional.
