'use strict';

const fs = require('fs');
const path = require('path');

global.fctActionAtlasResult_ = function(run) {
  return run && run.atlas && run.atlas.result;
};

const daily = require('../../apps-script/live/Phase2DailyCycle.js');

const mock = {
  run_id: 'P1-TEST',
  status: 'SUCCESS',
  logical_ai_calls_made: 0,
  sentinel: { result: { agent_id: 'AG012', audit_status: 'PASS_WITH_WARNING' } },
  orbit: { result: { agent_id: 'AG002' } },
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
          title: 'Stock risk',
          detail: 'Physical stock is critical.',
          severity: 'ACT_NOW',
          evidence_refs: ['TEST:STOCK']
        }
      ],
      evidence_refs: ['TEST:STOCK'],
      recommendations: [
        {
          action: 'Request verified supplier stock facts.',
          why: 'Critical stock needs verified evidence.',
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

const adapted = daily.fctPhase2AdaptRunForReport_(mock, ledger);

if (!adapted || adapted.atlas.agent_id !== 'AG001') {
  throw new Error('Phase-2 daily adapter contract failed.');
}
if (!adapted.brief.includes('Orders MTD: 100')) {
  throw new Error('Phase-2 daily brief missing deterministic order count.');
}
if (!adapted.brief.includes('Final Delivery: 80.0%')) {
  throw new Error('Phase-2 daily brief delivery formatting failed.');
}
if (!adapted.brief.includes('BLOCKED_MISSING_TIKTOK_SPEND')) {
  throw new Error('Phase-2 daily brief must preserve TikTok hard block.');
}
if (!adapted.brief.includes('[APPROVAL REQUIRED]')) {
  throw new Error('Phase-2 daily brief must expose founder approval gate.');
}

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'apps-script', 'live', 'Phase2DailyCycle.js'),
  'utf8'
);

for (const forbidden of ['MailApp.', 'GmailApp.', 'UrlFetchApp.fetch(', 'AdsApp.', 'DriveApp.createFile(']) {
  if (source.includes(forbidden)) {
    throw new Error('Phase-2 daily cycle contract failed: external executor primitive found: ' + forbidden);
  }
}

if (!source.includes('external_actions_executed: 0')) {
  throw new Error('Phase-2 daily cycle contract failed: explicit zero-execution result missing.');
}

console.log('PHASE2_DAILY_CYCLE_CONTRACT_PASS');
