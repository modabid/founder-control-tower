/**
 * Founder Control Tower — Step 6H
 * AG006 STOCK -> existing Step 5 AI runtime.
 *
 * ADDITIVE FILE ONLY.
 *
 * Uses:
 *   fctBuildStockSnapshot_()
 *   fctRunAgent_(agentId, task, context, mode, runId)
 *
 * Does NOT:
 *   - modify existing runtime files
 *   - write ACTION_QUEUE
 *   - adjust stock
 *   - add RRTO into available inventory
 *   - place PO / contact supplier / commit quantity
 *   - spend or move money
 */

function runFctStockAgentAI() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error('Another Founder Control Tower AI run is already in progress.');
  }

  const runId = fctRunId_();

  try {
    const snapshot = fctBuildStockSnapshot_();

    if (!snapshot || snapshot.agent_id !== 'AG006') {
      throw new Error('STOCK snapshot contract failed before AI runtime.');
    }

    const task = [
      'Review the supplied deterministic STOCK inventory snapshot as AG006.',
      'Deterministic available stock, velocity, stock days, stock gates, reconciliation status and market-specific Meta attribution are authoritative. Do not replace them with model estimates.',
      'Inventory velocity is max(7-day average pickup, 14-day average pickup).',
      'RRTO is NOT available stock until physically received. Never add expected returns back into inventory.',
      'Physical available stock controls stock-risk decisions. Do not create inventory by inference.',
      'Do not invent supplier lead time, MOQ, inbound quantity, ETA or open PO status.',
      'Current purchase sources are historical purchase evidence, not a reliable open inbound pipeline.',
      'Critical and out-of-stock items must remain critical even if product economics are weak or unavailable.',
      'Market-specific ad activity must use known_market_meta_spend_aed for that exact country+SKU.',
      'Do not infer Kuwait ad activity from GROUP PRODUCT_PNL or from SKU total Meta spend that is resolved to another country.',
      'sku_group_product_economics is GROUP/SKU context only. It is provisional because TikTok spend and primary-SKU attribution remain incomplete.',
      'Positive GROUP contribution may prioritize attention but does not authorize replenishment.',
      'Negative GROUP contribution may justify caution but does not erase a physical stock risk.',
      'Country-pending Meta spend must not be assigned to a country by guess.',
      'Courier pickup mismatch, return-data mismatch and purchase-history mismatch are reconciliation issues. Do not adjust stock balances to force a match.',
      'UAE PLG597 with exact-market Meta activity and <=3 days stock is an urgent operating risk.',
      'Kuwait PLG597 and PLG617 are critical stock risks, but do not call them Kuwait Meta-active unless exact-market spend proves it.',
      'PLG602 is a watch-level stock risk with exact UAE Meta activity and an open courier-pickup reconciliation.',
      'Do not recommend a reorder quantity unless deterministic inbound, lead-time and cash/ordering constraints support one.',
      'If severity is WATCH, ACT_NOW or CRITICAL, return at least 1 structured finding. Maximum 4 findings.',
      'Maximum 3 recommendations.',
      'Any recommendation to place a PO, transfer stock, contact supplier, approve purchase, commit quantity, pay money, stop/scale ads, or make another external/operational change must set approval_required=true.',
      'Internal reconciliation, stock verification, inbound evidence collection and data checks may set approval_required=false.',
      'Do not execute, imply execution, or write any operational change.',
      'When evidence is missing, HOLD the quantitative conclusion and specify the missing evidence.'
    ].join(' ');

    const context = {
      stock_snapshot: snapshot,
      governance: {
        mode: 'RECOMMENDATION_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        inventory_velocity_rule:
          'max(7-day average pickup, 14-day average pickup)',
        rrto_rule:
          'RRTO is not available stock until physically received.',
        source_precedence: [
          'PHYSICAL_STOCK_AND_DETERMINISTIC_INVENTORY_CONTROL',
          'CURRENT_STOCK_INTELLIGENCE_AND_ALERTS',
          'MARKET_SPECIFIC_AD_ACTIVITY',
          'GROUP_PRODUCT_ECONOMICS_AS_CONTEXT_ONLY',
          'AI_INTERPRETATION'
        ]
      },
      phase_note:
        'Step 6H isolated STOCK specialist validation. ORBIT, ATLAS and other Phase-1 specialists are intentionally not running in this function.'
    };

    const aiRun = fctRunAgent_(
      'AG006',
      task,
      context,
      'STANDARD',
      runId
    );

    if (!aiRun || !aiRun.result) {
      throw new Error('STOCK AI runtime returned no structured result.');
    }

    if (aiRun.result.agent_id !== 'AG006') {
      throw new Error(
        'STOCK AI identity contract failed: ' +
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
        'STOCK AI output contract failed: material severity with no structured findings.'
      );
    }

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG006',
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


function testFctStockAgentAI() {
  return runFctStockAgentAI();
}
