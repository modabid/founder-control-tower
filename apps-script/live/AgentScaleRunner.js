/**
 * Founder Control Tower — Step 6D
 * AG004 SCALE -> existing Step 5 AI runtime.
 *
 * ADDITIVE FILE ONLY.
 *
 * Uses:
 *   fctBuildScaleSnapshot_()
 *   fctRunAgent_(agentId, task, context, mode, runId)
 *
 * Does NOT:
 *   - modify Code.gs / TikTokOAuth.gs / Step 5 runtime files
 *   - write ACTION_QUEUE
 *   - pause/scale ads
 *   - change budgets/bids/campaigns
 *   - execute any external business action
 */

function runFctScaleAgentAI() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error('Another Founder Control Tower AI run is already in progress.');
  }

  const runId = fctRunId_();

  try {
    const snapshot = fctBuildScaleSnapshot_();

    if (!snapshot || snapshot.agent_id !== 'AG004') {
      throw new Error('SCALE snapshot contract failed before AI runtime.');
    }

    const task = [
      'Review the supplied deterministic SCALE ads-and-growth snapshot as AG004.',
      'The deterministic values, gates and blockers are authoritative. Do not recalculate or replace them with model arithmetic.',
      'Never recommend scaling from ROAS or platform conversion metrics alone.',
      'Current META_SPEND_LIVE contains spend and mapping data but not impressions, clicks or platform purchases. Treat those metrics as unavailable, not zero.',
      'TikTok is an active channel with missing spend. Therefore no product may receive a FINAL scale decision yet. Strong products may be described only as provisional opportunities.',
      'The group Meta platform-vs-PRODUCT_PNL difference is a review flag for group completeness. Do not automatically apply it as a blocker to every SKU.',
      'Use each SKU own live Meta vs PRODUCT_PNL reconciliation field for product-level Meta readiness.',
      'PRIMARY_SKU_ATTRIBUTION is a provisional attribution review, not automatically a hard blocker unless the snapshot shows a material SKU-specific mismatch.',
      'PLG632 has unresolved UAE/Kuwait country allocation and inventory reconciliation. Do not issue a final country-level or scale decision for it.',
      'A product stock gate failure or inventory reconciliation review must be respected for that product.',
      'Courier scale gates are contextual. Last Mile below 70% must not be applied globally to every product unless product-to-courier exposure is proven.',
      'Low finalized sample must remain low-confidence. Do not call a one-order product a winner or loser with high confidence.',
      'Positive Contribution_After_Meta is provisional until all active ad-channel spend is included.',
      'Negative after-Meta economics may justify investigation or a recommendation to hold further scaling, but do not claim final real loss while TikTok attribution is incomplete.',
      'If severity is WATCH, ACT_NOW or CRITICAL, return at least 1 structured finding. Maximum 4 findings.',
      'Maximum 3 recommendations.',
      'Any recommendation to pause, scale, change budget/bid/creative/campaign, contact an external party, spend money or make another external change must set approval_required=true.',
      'Internal analysis, reconciliation, data checks and evidence review may set approval_required=false.',
      'Do not execute, imply execution, or write any operational change.',
      'If missing evidence blocks a conclusion, HOLD the conclusion and identify the exact missing evidence.'
    ].join(' ');

    const context = {
      scale_snapshot: snapshot,
      governance: {
        mode: 'RECOMMENDATION_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        scale_gate: 'NO_FINAL_SCALE_WITH_MISSING_ACTIVE_CHANNEL_SPEND',
        source_precedence: [
          'DETERMINISTIC_CONTROL_DATA',
          'CURRENT_ALERTS',
          'ACTION_QUEUE',
          'AI_INTERPRETATION'
        ]
      },
      phase_note: 'Step 6D isolated SCALE specialist validation. ORBIT, ATLAS and the other Phase-1 specialists are intentionally not running in this function.'
    };

    const aiRun = fctRunAgent_(
      'AG004',
      task,
      context,
      'STANDARD',
      runId
    );

    if (!aiRun || !aiRun.result) {
      throw new Error('SCALE AI runtime returned no structured result.');
    }

    if (aiRun.result.agent_id !== 'AG004') {
      throw new Error(
        'SCALE AI identity contract failed: ' +
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
        'SCALE AI output contract failed: material severity with no structured findings.'
      );
    }

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG004',
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


function testFctScaleAgentAI() {
  return runFctScaleAgentAI();
}
