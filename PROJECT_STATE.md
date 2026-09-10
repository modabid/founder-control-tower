# Project State

Last updated: **2026-09-10**

## Overall

Founder Control Tower Phase 1 is **locked, validated, and deployed with GitHub/local/Apps Script source parity**. GitHub is the durable code/documentation source of truth. Google Apps Script remains the transitional live runtime.

Phase 2 is now in development: **ACTION_QUEUE + Founder Approval Core**.

## Repository / Live Runtime Status

- GitHub repository: `modabid/founder-control-tower`
- default branch: `main`
- live Apps Script source mirror: `apps-script/live/`
- Phase-1 live-vs-locked mapped code parity: **12/12**
- SENTINEL V11 parity correction: deployed to Apps Script on 2026-09-10 through controlled `clasp push`
- post-deploy `clasp pull`: clean; no Git drift detected
- `.clasp.json`: local-only / intentionally excluded from Git
- `appsscript.json`: tracked
- Phase-1 local/GitHub regression suite: PASS

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

## Phase-2 V1 — Action Queue / Founder Approval Core

Status: **IN DEVELOPMENT / NOT DEPLOYED**

Planned/implemented contract on the Phase-2 branch:

1. final ATLAS recommendations can be converted into deterministic queue records;
2. duplicate open recommendations are suppressed;
3. governed actions start `PENDING_FOUNDER / BLOCKED_APPROVAL`;
4. internal no-external-commitment actions start `NOT_REQUIRED / READY_INTERNAL`;
5. founder Approve/Reject/Modify changes queue state only and never executes the action;
6. founder modification preserves the original record as `SUPERSEDED` and creates a replacement;
7. preview uses cached Phase-1 output and requires no paid AI call;
8. no executor is included in V1.

See `docs/ACTION_QUEUE.md` and ADR-008.

## Next Workstream

1. validate and review Phase-2 Action Queue / Founder Approval Core in GitHub CI;
2. deploy only after founder approval;
3. run no-write preview against cached Phase-1 output before any queue write;
4. add founder-facing approval UI/dashboard controls;
5. add permissioned executors one domain at a time, with pre-execution approval re-check and post-action SENTINEL verification;
6. add agent instruction/playbook memory with auditable founder rules;
7. extract portable domain logic into TypeScript and introduce database/API/web app incrementally.
