# Changelog

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
