/**
 * Founder Control Tower — SCALE compact validation V2
 *
 * READ ONLY / NO API / NO SHEET WRITES.
 * Designed for AgentScaleSnapshot_v4.gs.
 */

function testFctScaleSnapshotCompactV2() {
  const s = fctBuildScaleSnapshot_();

  const compactProduct = function(x) {
    return {
      sku: x.sku,
      product: x.product,
      delivered_paid: x.delivered_paid,
      delivery_success: x.delivery_success,
      product_pnl_meta_spend_aed: x.meta_spend_aed,
      live_meta_spend_for_sku_aed: x.live_meta_spend_for_sku_aed,
      sku_meta_vs_product_pnl_gap_aed: x.sku_meta_vs_product_pnl_gap_aed,
      contribution_after_meta_aed: x.contribution_after_meta_aed,
      profit_per_delivered_after_meta_aed:
        x.profit_per_delivered_after_meta_aed,
      delivery_gate: x.delivery_gate,
      stock_gate: x.stock_gate,
      mapping_gate: x.mapping_gate,
      attribution_review: x.attribution_review,
      blockers: x.provisional_blockers,
      final_scale_decision_ready: x.final_scale_decision_ready
    };
  };

  const out = {
    agent_id: s.agent_id,
    data_quality_status: s.data_quality.status,
    data_quality_flags: (s.data_quality.flags || []).map(function(f) {
      return {
        severity: f.severity,
        code: f.code,
        detail: f.detail
      };
    }),
    meta: {
      platform_spend_aed: s.meta.platform_spend_aed,
      product_pnl_meta_spend_aed: s.meta.product_pnl_meta_spend_aed,
      meta_not_represented_in_product_pnl_aed:
        s.meta.meta_not_represented_in_product_pnl_aed,
      performance_metrics_status: s.meta.performance_metrics_status
    },
    top_positive_after_meta:
      (s.provisional_product_rankings.positive_after_meta || [])
        .slice(0, 6)
        .map(compactProduct),
    top_negative_after_meta:
      (s.provisional_product_rankings.negative_after_meta || [])
        .slice(0, 6)
        .map(compactProduct)
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}
