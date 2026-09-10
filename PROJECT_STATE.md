# Project State

Last updated: **2026-09-10**

## Overall

Founder Control Tower Phase 1 is **locked, validated, and deployed with GitHub/local/Apps Script source parity**. GitHub is the durable code/documentation source of truth. Google Apps Script remains the transitional live runtime.

Phase 2 core is now substantially built. The project is moving to a **hands-off technical operating model** where normal development/testing/PR work proceeds without founder intervention and only externally effective changes require concise Yes/No approval.

## Repository / Live Runtime Status

- GitHub repository: `modabid/founder-control-tower`
- default branch: `main`
- live Apps Script source mirror: `apps-script/live/`
- Phase-1 live-vs-locked mapped code parity: **12/12**
- SENTINEL V11 parity correction: deployed to Apps Script on 2026-09-10 through controlled `clasp push`
- post-deploy `clasp pull`: clean; no Git drift detected
- Phase-2 `ActionQueue.js`: deployed to Apps Script source/HEAD on 2026-09-10
- Phase-2 validated-cache bridge and later hands-off modules: Git-reviewed development pending controlled deployment
- `.clasp.json`: local-only / intentionally excluded from Git
- `appsscript.json`: tracked
- Phase-1 and Phase-2 deterministic regression coverage: maintained in GitHub CI

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

## Locked Code Baseline

- `AgentLedgerSnapshot_v3.gs`
- `AgentLedgerRunner_v2.gs`
- `AgentScaleSnapshot_v4.gs`
- `AgentScaleRunner.gs`
- `AgentRouteSnapshot_v3.gs`
- `AgentRouteRunner.gs`
- `AgentStockSnapshot_v2.gs`
- `AgentStockRunner.gs`
- `AgentSentinelPhase1Runner_v11.gs`
- `AgentOrbitPhase1Runner_v6.gs`
- `AgentAtlasPhase1Runner_v3.gs`
- `Phase1FinalOrchestrator_v5.gs`

## Final Phase-1 Validation

Final live hierarchy validation succeeded on 2026-09-10.

- validation mode: `HIERARCHY_ONLY_WITH_DETERMINISTIC_SPECIALIST_PROXIES`
- specialist AI calls: `0`
- hierarchy AI calls: `3`
- executed: `AG012 -> AG002 -> AG001`
- Sentinel recovery: not required
- V5 zero-AI cached replay: PASS

Governance repair confirmed that governed external recommendations cannot remain `approval_required=false` solely because of model phrasing/classification.

## Current Known Business Blockers / Controls

- TikTok active-channel spend is missing and remains a hard blocker for final Real Contribution, Operating Profit and final SCALE go/no-go.
- Stock risk classification is dynamic from deterministic current stock data; never hardcode SKU severity.
- Last Mile below-gate data must retain freshness/staleness qualifiers.
- TFM/OTO settlement differences are screening/review until settlement evidence confirms them.
- Delivered does not imply Paid. Delivered-but-unpaid is courier receivable.

## Current Workbook

`Founder Control Tower - MVP`

Spreadsheet ID:

`1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU`

The workbook remains the live MVP data/control source during migration.

Existing `ACTION_QUEUE` is reused for Phase 2. V1 keeps the current 24-column A:X contract and does not add another tab or expand the grid.

## Phase 2 — Daily Founder Operating Surface

### Completed in code / Git

- ACTION_QUEUE deterministic mapping from final ATLAS recommendations.
- Duplicate-open-action suppression.
- Founder Approve / Reject / Modify-and-Approve state transitions.
- Approval state separated from execution state; approval never implies execution.
- Zero-AI validated ATLAS cache bridge fixing the earlier preview-shape mismatch.
- Deterministic founder dashboard snapshot contract for future UI/API use.
- Auditable agent playbook registry with runtime mirror and parity tests.
- Daily operating-cycle code that can run the cost-controlled hierarchy, refresh `FOUNDER_REPORT`, append `REPORT_HISTORY`, and queue actions while executing zero external business actions.
- Approval-gated daily trigger installer/remover; trigger is not activated by code deployment alone.
- Hands-off GitHub Actions Apps Script source deployment workflow.
- `deploy/apps-script` branch reserved as the explicit production deployment gate.

### One-time prerequisite for hands-off Apps Script deployment

GitHub repository secret:

`FCT_CLASP_AUTH_JSON`

This must contain the founder's existing authenticated `.clasprc.json` credential. It is never committed or echoed. Once configured, normal source deployment no longer requires founder PowerShell.

### Not activated / not deployed yet

- validated-cache bridge and current hands-off Phase-2 branch modules still need controlled Apps Script deployment;
- daily schedule is not installed;
- no external-action executor exists;
- no paid infrastructure/database migration has been approved;
- no separate versioned web-app deployment is being changed.

## Founder Approval Model

Normal technical development, deterministic tests, PR creation, CI fixes, cached replay and read-only inspection proceed without interrupting the founder.

A concise **Yes / No** is required for production deployment, paid infrastructure and governed external actions such as ads, money movement, supplier/customer/courier communication, order/routing/inventory changes, purchases or commitments.

See `docs/HANDS_OFF_OPERATION.md` and ADR-009.

## Next Workstream

1. merge the hands-off Phase-2 branch after CI passes;
2. configure the one-time private clasp GitHub secret;
3. request a single Yes/No to deploy the approved `main` commit through the `deploy/apps-script` gate;
4. verify automated push/pull parity;
5. request a separate Yes/No before activating the daily 08:15 Asia/Dubai trigger;
6. use Sheet + ChatGPT as the founder operating surface while building Phase 3 portable TypeScript/data contracts;
7. add controlled executors only after explicit domain-by-domain founder approval.
