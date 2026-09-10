# Project State

Last updated: **2026-09-10**

## Overall

Founder Control Tower Phase 1 is **locked and validated**. The next workstream is repository-first productionization, dashboard, approval/action workflow, agent memory/playbooks, automations, and gradual migration away from Google Apps Script.

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

## Final Validation

Final live hierarchy validation succeeded on 2026-09-10.

- validation mode: `HIERARCHY_ONLY_WITH_DETERMINISTIC_SPECIALIST_PROXIES`
- specialist AI calls: `0`
- hierarchy AI calls: `3`
- executed: `AG012 -> AG002 -> AG001`
- Sentinel recovery: not required

Validated cached hierarchy IDs:

- SENTINEL: `FCT-20260910-090752-3d74cf5b`
- ORBIT: `FCT-20260910-090844-50898a9c`
- ATLAS: `FCT-20260910-090936-e3382a98`

V5 zero-AI cached replay: **PASS**.

Governance repair confirmed that external ad action `Suspend ad scaling...` is normalized from `approval_required=false` to `true` without another model call.

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

## Next Workstream

1. Make GitHub the durable code/documentation source of truth.
2. Export missing live Apps Script runtime files into this repository.
3. Build Founder Dashboard on top of the locked Phase-1 contracts.
4. Build ACTION_QUEUE + founder approval workflow.
5. Add agent instruction/playbook memory with auditable founder rules.
6. Add schedules/alerts while preserving no-autonomous-external-action governance.
7. Extract portable domain logic from Apps Script into TypeScript.
8. Introduce database/API/web app incrementally.
