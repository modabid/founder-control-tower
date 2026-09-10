# GitHub Migration Checklist

## Migration Status

**Live Apps Script source mirror completed on 2026-09-10. Live-vs-locked Phase-1 parity is now 12/12.**

The current Apps Script project was cloned with `clasp` into:

`apps-script/live/`

This folder is the direct live-source snapshot and is intentionally kept separate from the versioned/locked Phase-1 reference code under `apps-script/snapshots/`, `apps-script/runners/`, `apps-script/hierarchy/`, and `apps-script/orchestrator/`.

## Phase-1 Parity

All 12 mapped locked Phase-1 production components now match their corresponding files in `apps-script/live/` byte-for-byte in content. The `.gs` versus `.js` filename-extension distinction is intentional and reflects the organized reference tree versus the `clasp` live mirror.

The final reconciliation issue was `AgentSentinelPhase1Runner.js`; it has been aligned to the locked `AgentSentinelPhase1Runner_v11.gs` reference.

## Mirrored

- Phase-1 locked specialist snapshots/runners
- SENTINEL / ORBIT / ATLAS locked hierarchy code
- Phase-1 Final Orchestrator V5
- current live Apps Script project snapshot under `apps-script/live/`
- shared runtime files including AI config/clients, schema, runtime, report, runner and snapshot modules
- `Code.js`
- `TikTokOAuth.js`
- runtime contract probe files
- `appsscript.json`
- Meta Ads legacy/source code available in migration workspace
- product/technical spec
- prior master handoff
- regression/smoke-test baseline

## Live Mirror Safety

- `.clasp.json` is intentionally excluded from Git and must remain local-only.
- `appsscript.json` is tracked because it is project source/configuration, not a credential file.
- Script Property values are not stored in Git.
- The live mirror represents the Apps Script source captured from production on 2026-09-10 plus reviewed parity corrections that have not necessarily been deployed back to Apps Script yet.
- Future Apps Script-side edits must be pulled before assuming GitHub matches production.

## Credentials

Do **not** export Script Property values into Git.

Known property names include:

- `FCT_SPREADSHEET_ID`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- Meta access-token properties

Only names/placeholders belong in `.env.example`.

## Transitional Sync Workflow

GitHub is the durable source of truth. Apps Script remains a transitional production runtime.

Recommended flow:

1. before reconciling production, run `clasp pull` inside `apps-script/live/` to capture any live-side changes;
2. review/compare changes in Git;
3. make new development changes through GitHub/Codex rather than directly in Apps Script where possible;
4. run deterministic/local tests before deployment;
5. use `clasp push` only for reviewed and founder-approved production updates;
6. never use uncontrolled two-way editing as the normal workflow.

Do not decommission Apps Script until the replacement web/backend runtime has parity and reconciliation checks.
