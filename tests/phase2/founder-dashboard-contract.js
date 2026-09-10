'use strict';

const dashboard = require('../../apps-script/live/FounderDashboardSnapshot.js');

const bundle = {
  generated_at: '2026-09-10T10:00:00+04:00',
  snapshots: {
    AG003: {
      economics: {
        orders_picked_mtd: 757,
        finalized_delivery_success: 0.845,
        delivered_revenue_aed: 24729.63,
        gross_contribution_aed: 15410.55,
        meta_platform_spend_aed: 6701.85,
        real_contribution_profit_aed: null,
        real_contribution_status: 'BLOCKED_MISSING_TIKTOK_SPEND',
        real_operating_profit_aed: null,
        real_operating_profit_status: 'BLOCKED_MISSING_TIKTOK_SPEND',
        courier_receivable_aed: 24729.63
      },
      data_quality: { status: 'FAIL' }
    },
    AG004: {
      data_quality: { status: 'FAIL' },
      channel_completeness: { tiktok: 'MISSING' },
      courier_scale_gates: [{ courier: 'Last Mile', pass: false }]
    },
    AG005: {
      data_quality: { status: 'REVIEW' },
      live_courier_view: [{ courier: 'Last Mile', finalized_success: 0.641 }],
      settlement_reconciliation: []
    },
    AG006: {
      data_quality: { status: 'REVIEW' },
      critical_stock: [
        { country: 'UAE', sku: 'PLG609', stock_days: 0 },
        { country: 'KWT', sku: 'PLG597', stock_days: 0 }
      ],
      watch_stock: [{ country: 'KWT', sku: 'PLG617', stock_days: 3.5 }]
    }
  }
};

const pending = [
  {
    Action_ID: 'ACT-1',
    Priority: '🔴 ACT NOW',
    Recommendation: 'Authorize TikTok source acquisition.',
    Reason: 'P&L is blocked.',
    Owner: 'Abid',
    Source: 'ATLAS:TEST',
    Created_At: '2026-09-10'
  }
];

const out = dashboard.fctFounderDashboardFromBundle_(bundle, pending);

if (out.pulse.orders_mtd !== 757 || out.pulse.finalized_delivery_success !== 0.845) {
  throw new Error('Founder dashboard contract failed: deterministic pulse mismatch.');
}
if (out.pulse.real_contribution_profit_aed !== null ||
    out.pulse.real_contribution_status !== 'BLOCKED_MISSING_TIKTOK_SPEND') {
  throw new Error('Founder dashboard contract failed: TikTok block was lost.');
}
if (out.controls.stock_critical_count !== 2 || out.stock.watch.length !== 1) {
  throw new Error('Founder dashboard contract failed: stock controls mismatch.');
}
if (out.approvals.pending_count !== 1 || out.approvals.pending[0].action_id !== 'ACT-1') {
  throw new Error('Founder dashboard contract failed: approvals mismatch.');
}
if (out.ai_calls_made !== 0 || out.writes_made !== 0 || out.external_actions_executed !== 0) {
  throw new Error('Founder dashboard contract failed: read-only guarantees broken.');
}

console.log('PHASE2_FOUNDER_DASHBOARD_CONTRACT_PASS');
