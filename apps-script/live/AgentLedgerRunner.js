/**
 * Founder Control Tower — Step 6B
 * AG003 LEDGER -> existing Step 5 AI runtime.
 *
 * ADDITIVE FILE ONLY.
 *
 * Uses:
 *   fctBuildLedgerSnapshot_()
 *   fctRunAgent_(agentId, task, context, mode, runId)
 *
 * Does NOT:
 *   - modify Code.gs / TikTokOAuth.gs / Step 5 runtime files
 *   - write ACTION_QUEUE
 *   - change ads/orders/payments/courier/inventory
 *   - execute any external business action
 *
 * This file is an isolated LEDGER AI validation before the full
 * LEDGER + SCALE + ROUTE + STOCK -> SENTINEL -> ORBIT -> ATLAS chain.
 */

function runFctLedgerAgentAI() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error('Another Founder Control Tower AI run is already in progress.');
  }

  const runId = fctRunId_();

  try {
    const snapshot = fctBuildLedgerSnapshot_();

    if (!snapshot || snapshot.agent_id !== 'AG003') {
      throw new Error('LEDGER snapshot contract failed before AI runtime.');
    }

    const task = [
      'Review the supplied deterministic LEDGER finance-and-cash snapshot as AG003.',
      'The deterministic values are authoritative. Do not recalculate or replace them with model arithmetic.',
      'Separate profit from cash at all times.',
      'Treat Delivered but unpaid COD as courier receivable; Paid means remittance received.',
      'TikTok spend is missing, therefore Real Contribution Profit and Real Operating Profit are BLOCKED. Do not invent or estimate either final metric.',
      'The Meta platform total and Meta amount represented in DAILY_PNL are intentionally separate until allocation is reconciled.',
      'The P&L cutoff and calendar fixed-cost accrual cutoff differ; do not mix them as if they are the same date.',
      'C3X June reconciliation is matched.',
      'TFM and OTO figures are screening/review items only because settlement evidence is incomplete. Do not call those differences confirmed shortages or losses.',
      'Payroll payment evidence and some subscription costs remain incomplete; state those as evidence gaps, not confirmed unpaid liabilities unless the snapshot proves it.',
      'Prioritize only material finance/cash issues, leakage risks, deadlines and opportunities.',
      'Avoid duplicating existing actions unless there is a materially different finance reason.',
      'If severity is WATCH, ACT_NOW or CRITICAL, include at least 1 structured finding. Do not leave findings empty when the summary contains material issues.',
      'Each finding must be a concise finance/cash observation grounded in the supplied snapshot; do not restate methodology.',
      'If a conclusion is blocked by missing evidence, HOLD that conclusion and state exactly what evidence is required.',
      'Approval rule: any recommendation that requires contacting a courier, supplier, bank, platform, employee or other external party must set approval_required=true unless the evidence is already internally available and the recommendation is only to review/reconcile it.',
      'Internal review, reconciliation and evidence-checking may remain approval_required=false.',
      'Return recommendations only. Do not execute, approve, send, pay, cancel, scale, pause or modify anything.',
      'Keep the output concise: 1 to 4 findings when material issues exist, otherwise 0 findings; maximum 3 recommendations.'
    ].join(' ');

    const context = {
      ledger_snapshot: snapshot,
      governance: {
        mode: 'RECOMMENDATION_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        source_precedence: [
          'DETERMINISTIC_CONTROL_DATA',
          'CURRENT_DETERMINISTIC_ALERTS',
          'ACTION_QUEUE',
          'AI_INTERPRETATION'
        ]
      },
      phase_note: 'Step 6B isolated LEDGER specialist validation. ORBIT, ATLAS and the other Phase-1 specialists are intentionally not running in this function.'
    };

    // STANDARD is intentional.
    // Missing/bad data should cause HOLD/ASK, not automatic model escalation.
    const aiRun = fctRunAgent_(
      'AG003',
      task,
      context,
      'STANDARD',
      runId
    );

    if (!aiRun || !aiRun.result) {
      throw new Error('LEDGER AI runtime returned no structured result.');
    }

    if (aiRun.result.agent_id !== 'AG003') {
      throw new Error(
        'LEDGER AI identity contract failed: ' +
        String(aiRun.result.agent_id || '')
      );
    }

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG003',
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


/**
 * Explicit test alias for the Step 6B isolated LEDGER AI validation.
 * This DOES call the configured AI provider through the existing runtime,
 * but performs no business-operation execution and no Control Tower sheet write.
 */
function testFctLedgerAgentAI() {
  return runFctLedgerAgentAI();
}
