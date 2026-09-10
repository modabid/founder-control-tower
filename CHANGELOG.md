# Changelog

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
