/**
 * Founder Control Tower — Step 6F
 * AG005 ROUTE -> existing Step 5 AI runtime.
 *
 * ADDITIVE FILE ONLY.
 *
 * Uses:
 *   fctBuildRouteSnapshot_()
 *   fctRunAgent_(agentId, task, context, mode, runId)
 *
 * Does NOT:
 *   - modify Code.gs / TikTokOAuth.gs / Step 5 runtime files
 *   - write ACTION_QUEUE
 *   - change courier/order statuses
 *   - contact customers/couriers/drivers
 *   - release/refund/collect money
 *   - execute any external action
 */

function runFctRouteAgentAI() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error('Another Founder Control Tower AI run is already in progress.');
  }

  const runId = fctRunId_();

  try {
    const snapshot = fctBuildRouteSnapshot_();

    if (!snapshot || snapshot.agent_id !== 'AG005') {
      throw new Error('ROUTE snapshot contract failed before AI runtime.');
    }

    const task = [
      'Review the supplied deterministic ROUTE logistics-and-courier snapshot as AG005.',
      'The deterministic values, cohort labels, gates, reconciliation statuses and aging counts are authoritative. Do not recalculate or merge conflicting cohorts.',
      'Keep live courier operational data, ORDERS_MASTER normalized cohort data, COURIER_PERF financial view, and CASH_RECON settlement evidence separate unless the snapshot explicitly says they are reconciled.',
      'Final delivery success uses terminal outcomes only: (Delivered + Paid) / (Delivered + Paid + RRTO). Pending/open shipments are excluded from the denominator.',
      'Paid means COD remittance received. Never infer Delivered -> Paid.',
      'Delivered but unpaid COD is courier receivable in the normalized order cohort.',
      'Last Mile live finalized success below 70% is a real operating/scale gate failure. Respect it.',
      'Last Mile live data is stale/review if the snapshot says so; do not present stale live counts as current fact without qualification.',
      'Last Mile COURIER_PERF financial view and current-month ORDERS_MASTER are different cohorts right now. Do not choose one receivable/finalized count as the single truth until reconciled.',
      'C3X live-vs-sheet cohort mismatch and the stored +2 reconciliation note inconsistency are review items. Do not guess which count is correct.',
      'Kuwait OTE and UAE OTO are different couriers. Never merge them.',
      'OTE has no matching live Supabase row in the current snapshot. Use normalized aging only and state the live-view gap.',
      'OTO has live operational rows with blank pickup_date records. Do not convert those into normalized pickup aging until pickup dates exist.',
      'TFM and OTO settlement differences are screening/review items only. Do not call them confirmed shortages, losses or courier debt without settlement/remittance evidence.',
      'C3X June settlement reconciliation is matched; do not reopen it as a shortage.',
      'Warehouse-to-courier pickup mismatches are reconciliation issues, not automatically courier losses.',
      'Prioritize material delivery conversion risk, aged open shipments, cash exposure, courier reconciliation gaps and actionable operating bottlenecks.',
      'If severity is WATCH, ACT_NOW or CRITICAL, return at least 1 structured finding. Maximum 4 findings.',
      'Maximum 3 recommendations.',
      'Any recommendation requiring contacting a courier/customer/driver, changing an order/courier status, collecting/releasing money, changing routing/allocation, or another external operational action must set approval_required=true.',
      'Internal reconciliation, evidence review, aging analysis and data refresh may set approval_required=false.',
      'Do not execute, imply execution, or write any operational change.',
      'If evidence is insufficient, HOLD the conclusion and specify the exact evidence needed.'
    ].join(' ');

    const context = {
      route_snapshot: snapshot,
      governance: {
        mode: 'RECOMMENDATION_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        source_precedence: [
          'LIVE_COURIER_OPERATIONAL_VIEW_FOR_CURRENT_STATUS',
          'NORMALIZED_ORDERS_FOR_SHEET_COHORT_AND_AGING',
          'SETTLEMENT_EVIDENCE_FOR_CASH_RECON',
          'CURRENT_ALERTS_AND_ACTION_QUEUE',
          'AI_INTERPRETATION'
        ]
      },
      phase_note: 'Step 6F isolated ROUTE specialist validation. ORBIT, ATLAS and the other Phase-1 specialists are intentionally not running in this function.'
    };

    const aiRun = fctRunAgent_(
      'AG005',
      task,
      context,
      'STANDARD',
      runId
    );

    if (!aiRun || !aiRun.result) {
      throw new Error('ROUTE AI runtime returned no structured result.');
    }

    if (aiRun.result.agent_id !== 'AG005') {
      throw new Error(
        'ROUTE AI identity contract failed: ' +
        String(aiRun.result.agent_id || '')
      );
    }

    const severity = String(aiRun.result.severity || '').toUpperCase();
    const materialSeverity =
      severity === 'WATCH' ||
      severity === 'ACT_NOW' ||
      severity === 'CRITICAL';

    if (materialSeverity &&
        (!Array.isArray(aiRun.result.findings) ||
         aiRun.result.findings.length === 0)) {
      throw new Error(
        'ROUTE AI output contract failed: material severity with no structured findings.'
      );
    }

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG005',
      snapshot_status: snapshot.data_quality
        ? snapshot.data_quality.status
        : '',
      runtime: aiRun.runtime,
      result: aiRun.result
    };

    Logger.log(JSON.stringify(output, null, 2));
    return output;

  } finally {
    lock.releaseLock();
  }
}


function testFctRouteAgentAI() {
  return runFctRouteAgentAI();
}
