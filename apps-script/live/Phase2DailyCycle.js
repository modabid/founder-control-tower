/**
 * Founder Control Tower — Phase 2 Daily Operating Cycle V1
 *
 * This layer turns the locked Phase-1 hierarchy into a practical daily
 * founder surface while preserving governance and AI cost controls.
 *
 * runFctPhase2DailyCycle():
 *   1. runs the final Phase-1 orchestrator (cache/delta aware);
 *   2. writes a founder brief/history entry;
 *   3. queues ATLAS recommendations as internal control-plane rows;
 *   4. executes zero external business actions.
 *
 * Installing/removing a time trigger is a production scheduling change and
 * must only be done after explicit founder approval.
 */

const FCT_PHASE2_DAILY_VERSION_ = '2026-09-10-P2-DAILY-V1';
const FCT_PHASE2_DAILY_HANDLER_ = 'runFctPhase2DailyCycle';
const FCT_PHASE2_DEFAULT_HOUR_ = 8;
const FCT_PHASE2_DEFAULT_MINUTE_ = 15;

function fctPhase2Result_(runLike) {
  if (!runLike) return {};
  return runLike.result && typeof runLike.result === 'object'
    ? runLike.result
    : runLike;
}

function fctPhase2Money_(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value == null ? '' : value);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fctPhase2Percent_(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value == null ? '' : value);
  const pct = n >= 0 && n <= 1 ? n * 100 : n;
  return pct.toFixed(1) + '%';
}

function fctPhase2RenderFounderBrief_(phase1Run, ledgerSnapshot) {
  const atlas = fctActionAtlasResult_(phase1Run);
  const sentinel = fctPhase2Result_(phase1Run.sentinel);
  const ledger = ledgerSnapshot || {};
  const e = ledger.economics || {};
  const lines = [];

  lines.push('FOUNDER CONTROL TOWER — ' + String(atlas.as_of || ledger.generated_at || 'CURRENT'));
  lines.push('');
  lines.push('GROUP PULSE');
  lines.push('Orders MTD: ' + String(e.orders_picked_mtd == null ? '' : e.orders_picked_mtd));
  lines.push('Final Delivery: ' + fctPhase2Percent_(e.finalized_delivery_success));
  lines.push('Delivered Revenue: AED ' + fctPhase2Money_(e.delivered_revenue_aed));
  lines.push('Gross Contribution: AED ' + fctPhase2Money_(e.gross_contribution_aed));
  lines.push('Meta Spend: AED ' + fctPhase2Money_(e.meta_platform_spend_aed));
  lines.push('Real Contribution: ' + (
    e.real_contribution_profit_aed == null
      ? String(e.real_contribution_status || 'BLOCKED')
      : 'AED ' + fctPhase2Money_(e.real_contribution_profit_aed)
  ));
  lines.push('Operating Profit: ' + (
    e.real_operating_profit_aed == null
      ? String(e.real_operating_profit_status || 'BLOCKED')
      : 'AED ' + fctPhase2Money_(e.real_operating_profit_aed)
  ));
  lines.push('Courier Receivable: AED ' + fctPhase2Money_(e.courier_receivable_aed));
  lines.push('Audit: ' + String(sentinel.audit_status || atlas.audit_status || 'UNKNOWN') +
    ' | Confidence: ' + String(atlas.confidence || 'UNKNOWN'));

  const groups = [
    { title: '🔴 ACT NOW', values: ['CRITICAL', 'ACT_NOW', 'ERROR'] },
    { title: '🟡 WATCH', values: ['WATCH'] },
    { title: '🟢 OPPORTUNITIES', values: ['OPPORTUNITY'] }
  ];

  groups.forEach(function(group) {
    const findings = (atlas.findings || []).filter(function(finding) {
      return group.values.indexOf(String(finding.severity || '').toUpperCase()) >= 0;
    });
    if (!findings.length) return;
    lines.push('');
    lines.push(group.title);
    findings.slice(0, 5).forEach(function(finding, index) {
      lines.push((index + 1) + '. ' + String(finding.title || '') +
        (finding.detail ? ' — ' + String(finding.detail) : ''));
    });
  });

  if ((atlas.recommendations || []).length) {
    lines.push('');
    lines.push('CEO PRIORITIES TODAY');
    atlas.recommendations.slice(0, 3).forEach(function(rec, index) {
      lines.push((index + 1) + '. ' + String(rec.action || '') +
        (rec.approval_required ? ' [APPROVAL REQUIRED]' : ' [INTERNAL]'));
    });
  }

  return lines.join('\n');
}

function fctPhase2AdaptRunForReport_(phase1Run, ledgerSnapshot) {
  const atlas = fctActionAtlasResult_(phase1Run);
  const sentinel = fctPhase2Result_(phase1Run.sentinel);
  const orbit = fctPhase2Result_(phase1Run.orbit);

  return {
    run_id: String(phase1Run.run_id || atlas.run_id || fctRunId_()),
    status: String(phase1Run.status || 'SUCCESS'),
    as_of: String(atlas.as_of || ledgerSnapshot.generated_at || ''),
    audit_status: String(sentinel.audit_status || atlas.audit_status || 'NOT_APPLICABLE'),
    sentinel: sentinel,
    orbit: orbit,
    atlas: atlas,
    challenger: null,
    models_used: [],
    brief: fctPhase2RenderFounderBrief_(phase1Run, ledgerSnapshot),
    error: ''
  };
}

/**
 * Production daily cycle. May make bounded model calls only when Phase-1
 * cache/delta logic determines they are required. It never executes an
 * externally effective recommendation.
 */
function runFctPhase2DailyCycle() {
  if (typeof runFctPhase1FinalLive !== 'function') {
    throw new Error('Final Phase-1 orchestrator is unavailable.');
  }

  const phase1Run = runFctPhase1FinalLive();
  const ledger = fctBuildLedgerSnapshot_();
  const report = fctPhase2AdaptRunForReport_(phase1Run, ledger);

  fctAppendAiHistory_(report);
  fctWriteFounderBrief_(report);

  const queue = fctQueuePhase2ActionsFromRun_(phase1Run);

  const out = {
    status: 'SUCCESS',
    version: FCT_PHASE2_DAILY_VERSION_,
    phase1_run_id: phase1Run.run_id,
    logical_ai_calls_made: Number(phase1Run.logical_ai_calls_made || 0),
    queued_action_ids: queue.queued_action_ids || [],
    deduped_action_ids: queue.deduped_action_ids || [],
    founder_report_written: true,
    history_written: true,
    external_actions_executed: 0
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

/**
 * Zero-AI, zero-write preflight for a scheduled daily cycle.
 */
function inspectFctPhase2DailyCycleNoWrite() {
  if (typeof inspectFctPhase1FinalPlanNoApi !== 'function') {
    throw new Error('Phase-1 no-API plan inspector is unavailable.');
  }

  const plan = inspectFctPhase1FinalPlanNoApi();
  const triggers = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === FCT_PHASE2_DAILY_HANDLER_;
  });

  const out = {
    status: 'NO_WRITE_PREFLIGHT',
    version: FCT_PHASE2_DAILY_VERSION_,
    phase1_plan: plan,
    schedule_installed: triggers.length > 0,
    schedule_count: triggers.length,
    proposed_timezone: 'Asia/Dubai',
    proposed_hour: FCT_PHASE2_DEFAULT_HOUR_,
    proposed_minute: FCT_PHASE2_DEFAULT_MINUTE_,
    external_actions_executed: 0,
    sheet_writes_made: 0,
    ai_calls_made_by_this_preflight: 0
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

function installFctPhase2DailySchedule() {
  const existing = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === FCT_PHASE2_DAILY_HANDLER_;
  });

  if (existing.length) {
    return {
      status: 'ALREADY_INSTALLED',
      schedule_count: existing.length,
      handler: FCT_PHASE2_DAILY_HANDLER_
    };
  }

  ScriptApp.newTrigger(FCT_PHASE2_DAILY_HANDLER_)
    .timeBased()
    .atHour(FCT_PHASE2_DEFAULT_HOUR_)
    .nearMinute(FCT_PHASE2_DEFAULT_MINUTE_)
    .everyDays(1)
    .inTimezone('Asia/Dubai')
    .create();

  return {
    status: 'INSTALLED',
    schedule_count: 1,
    handler: FCT_PHASE2_DAILY_HANDLER_,
    timezone: 'Asia/Dubai',
    hour: FCT_PHASE2_DEFAULT_HOUR_,
    near_minute: FCT_PHASE2_DEFAULT_MINUTE_
  };
}

function removeFctPhase2DailySchedule() {
  const triggers = ScriptApp.getProjectTriggers().filter(function(trigger) {
    return trigger.getHandlerFunction() === FCT_PHASE2_DAILY_HANDLER_;
  });

  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  return {
    status: 'REMOVED',
    removed_count: triggers.length,
    handler: FCT_PHASE2_DAILY_HANDLER_
  };
}

function testFctPhase2DailyPureNoApi() {
  const mock = {
    run_id: 'P1-TEST',
    status: 'SUCCESS',
    logical_ai_calls_made: 0,
    sentinel: {
      result: {
        agent_id: 'AG012',
        audit_status: 'PASS_WITH_WARNING'
      }
    },
    orbit: {
      result: {
        agent_id: 'AG002'
      }
    },
    atlas: {
      result: {
        run_id: 'FCT-ATLAS-TEST',
        agent_id: 'AG001',
        as_of: '2026-09-10',
        audit_status: 'PASS_WITH_WARNING',
        severity: 'ACT_NOW',
        confidence: 'HIGH',
        findings: [
          {
            title: 'Test finding',
            detail: 'Test detail',
            severity: 'ACT_NOW',
            evidence_refs: ['TEST']
          }
        ],
        evidence_refs: ['TEST'],
        recommendations: [
          {
            action: 'Review test action.',
            why: 'Test why.',
            approval_required: true,
            owner: 'Abid'
          }
        ],
        approval_required: true,
        questions_for_abid: [],
        provisional_fields: [],
        next_check: 'Later'
      }
    }
  };

  const ledger = {
    generated_at: '2026-09-10T08:00:00+04:00',
    economics: {
      orders_picked_mtd: 100,
      finalized_delivery_success: 0.8,
      delivered_revenue_aed: 10000,
      gross_contribution_aed: 5000,
      meta_platform_spend_aed: 2000,
      real_contribution_profit_aed: null,
      real_contribution_status: 'BLOCKED_MISSING_TIKTOK_SPEND',
      real_operating_profit_aed: null,
      real_operating_profit_status: 'BLOCKED_MISSING_TIKTOK_SPEND',
      courier_receivable_aed: 4000
    }
  };

  const adapted = fctPhase2AdaptRunForReport_(mock, ledger);

  if (adapted.atlas.agent_id !== 'AG001') {
    throw new Error('Phase-2 daily adapter failed ATLAS contract.');
  }
  if (adapted.brief.indexOf('Orders MTD: 100') < 0 ||
      adapted.brief.indexOf('BLOCKED_MISSING_TIKTOK_SPEND') < 0 ||
      adapted.brief.indexOf('[APPROVAL REQUIRED]') < 0) {
    throw new Error('Phase-2 daily founder brief contract failed.');
  }

  return {
    status: 'PASS',
    version: FCT_PHASE2_DAILY_VERSION_,
    external_actions_executed: 0
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FCT_PHASE2_DAILY_VERSION_,
    FCT_PHASE2_DAILY_HANDLER_,
    FCT_PHASE2_DEFAULT_HOUR_,
    FCT_PHASE2_DEFAULT_MINUTE_,
    fctPhase2Result_,
    fctPhase2Money_,
    fctPhase2Percent_,
    fctPhase2RenderFounderBrief_,
    fctPhase2AdaptRunForReport_
  };
}
