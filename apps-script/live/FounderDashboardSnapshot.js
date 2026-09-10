/**
 * Founder Control Tower — Founder Dashboard Snapshot V1
 *
 * Read-only deterministic operating surface for future UI/API layers.
 * No model call, no sheet write, no external action.
 */

const FCT_FOUNDER_DASHBOARD_VERSION_ = '2026-09-10-FD-V1';

function fctFounderDashboardFromBundle_(bundle, pendingActions) {
  const snapshots = (bundle && bundle.snapshots) || {};
  const ledger = snapshots.AG003 || {};
  const scale = snapshots.AG004 || {};
  const route = snapshots.AG005 || {};
  const stock = snapshots.AG006 || {};
  const economics = ledger.economics || {};
  const pending = Array.isArray(pendingActions) ? pendingActions : [];

  const criticalStock = Array.isArray(stock.critical_stock)
    ? stock.critical_stock.slice(0, 10)
    : [];
  const watchStock = Array.isArray(stock.watch_stock)
    ? stock.watch_stock.slice(0, 10)
    : [];

  return {
    status: 'SUCCESS',
    version: FCT_FOUNDER_DASHBOARD_VERSION_,
    generated_at: String(
      (bundle && bundle.generated_at) ||
      ledger.generated_at ||
      stock.generated_at ||
      ''
    ),
    pulse: {
      orders_mtd: economics.orders_picked_mtd == null ? null : economics.orders_picked_mtd,
      finalized_delivery_success: economics.finalized_delivery_success == null
        ? null
        : economics.finalized_delivery_success,
      delivered_revenue_aed: economics.delivered_revenue_aed == null
        ? null
        : economics.delivered_revenue_aed,
      gross_contribution_aed: economics.gross_contribution_aed == null
        ? null
        : economics.gross_contribution_aed,
      meta_spend_aed: economics.meta_platform_spend_aed == null
        ? null
        : economics.meta_platform_spend_aed,
      real_contribution_profit_aed: economics.real_contribution_profit_aed == null
        ? null
        : economics.real_contribution_profit_aed,
      real_contribution_status: String(economics.real_contribution_status || ''),
      operating_profit_aed: economics.real_operating_profit_aed == null
        ? null
        : economics.real_operating_profit_aed,
      operating_profit_status: String(economics.real_operating_profit_status || ''),
      courier_receivable_aed: economics.courier_receivable_aed == null
        ? null
        : economics.courier_receivable_aed
    },
    controls: {
      ledger_data_quality: String((ledger.data_quality || {}).status || 'UNKNOWN'),
      scale_data_quality: String((scale.data_quality || {}).status || 'UNKNOWN'),
      route_data_quality: String((route.data_quality || {}).status || 'UNKNOWN'),
      stock_data_quality: String((stock.data_quality || {}).status || 'UNKNOWN'),
      channel_completeness: scale.channel_completeness || {},
      courier_scale_gates: scale.courier_scale_gates || route.courier_scale_gates || [],
      stock_critical_count: criticalStock.length,
      stock_watch_count: watchStock.length
    },
    stock: {
      critical: criticalStock,
      watch: watchStock
    },
    logistics: {
      live_courier_view: route.live_courier_view || [],
      settlement_reconciliation: route.settlement_reconciliation || []
    },
    approvals: {
      pending_count: pending.length,
      pending: pending.slice(0, 20).map(function(action) {
        return {
          action_id: String(action.Action_ID || ''),
          priority: String(action.Priority || ''),
          recommendation: String(action.Recommendation || ''),
          reason: String(action.Reason || ''),
          owner: String(action.Owner || ''),
          source: String(action.Source || ''),
          created_at: action.Created_At || ''
        };
      })
    },
    ai_calls_made: 0,
    writes_made: 0,
    external_actions_executed: 0
  };
}

function buildFctFounderDashboardSnapshotNoApi() {
  if (typeof fctP1BuildSourceBundle_ !== 'function') {
    throw new Error('Phase-1 deterministic source bundle builder is unavailable.');
  }

  const bundle = fctP1BuildSourceBundle_();
  const pending = typeof listFctPendingFounderActions === 'function'
    ? listFctPendingFounderActions()
    : [];

  const out = fctFounderDashboardFromBundle_(bundle, pending);
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FCT_FOUNDER_DASHBOARD_VERSION_,
    fctFounderDashboardFromBundle_
  };
}
