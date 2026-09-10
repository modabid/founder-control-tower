/**
 * Founder Control Tower — Step 6J
 * AG002 ORBIT — Phase-1 Supervisor / Chief of Staff synthesis.
 *
 * ISOLATED VALIDATION PATH:
 *   Fresh deterministic LEDGER/SCALE/ROUTE/STOCK snapshots
 *   -> fresh validated AG012 SENTINEL audit
 *   -> AG002 ORBIT synthesis
 *
 * This isolated test intentionally does NOT rerun the four specialist AI
 * agents. Their individual runtimes are already locked. The final integrated
 * Phase-1 orchestrator will pass their actual AI briefs to SENTINEL/ORBIT
 * without duplicate calls.
 *
 * ADDITIVE FILE ONLY.
 * No sheet writes.
 * No operational execution.
 * No external actions.
 */

function runFctOrbitPhase1AI() {
  // SENTINEL owns its own lock. Run it first so ORBIT consumes the latest
  // audited cross-domain state without nested-lock deadlock.
  const sentinelRun = runFctSentinelPhase1AuditAI();

  if (!sentinelRun || sentinelRun.status !== 'SUCCESS' ||
      !sentinelRun.result || sentinelRun.result.agent_id !== 'AG012') {
    throw new Error(
      'ORBIT prerequisite failed: latest SENTINEL audit is unavailable or invalid.'
    );
  }

  const packet = fctBuildOrbitPhase1Packet_(sentinelRun);
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error(
      'Another Founder Control Tower AI run is already in progress.'
    );
  }

  const runId = fctRunId_();

  try {
    const task = [
      'Act as AG002 ORBIT, Founder Control Tower Supervisor / Chief of Staff.',
      'Synthesize the supplied Phase-1 audited packet into a concise supervisor brief for ATLAS.',
      'Do not recalculate deterministic arithmetic or replace source truth with model estimates.',
      'Source precedence is deterministic source/control data, deterministic cross-checks, SENTINEL audit, then ORBIT interpretation.',
      'SENTINEL is the audit gate. If SENTINEL preserves a FAIL/HOLD caused by missing or bad evidence, you may prioritize around it but you must not weaken, bypass, vote around, or convert the affected conclusion into a provisional go decision.',
      'TikTok spend is a locked active-channel blocker. Final Real Contribution, Operating Profit, and final SCALE go/no-go decisions remain HOLD until live TikTok spend is available. Never ask Abid whether this hard block should be relaxed.',
      'Deterministic cross-checks currently reconcile Meta platform spend across LEDGER/SCALE/STOCK, courier receivable across LEDGER/ROUTE, finalized delivery success, and TikTok blocker consistency. Preserve MATCH results and do not invent a reconciliation gap.',
      'Meta platform-to-DAILY_PNL and Meta platform-to-PRODUCT_PNL differences are separate allocation scopes; do not merge or double-count them.',
      'Last Mile below the 70% finalized-delivery gate is a real operating risk, but the supplied live poll is STALE/REVIEW. Any reference to its 64.1% or current counts must explicitly preserve the stale qualifier. Do not call stale counts current/fresh.',
      'TFM and OTO screening-vs-bank differences are unconfirmed until remittance/settlement evidence exists. C3X June settlement is matched. Never call TFM/OTO differences a confirmed shortage, loss, theft, debt, or missing cash.',
      'Keep live operational courier cohorts, normalized ORDERS_MASTER cohorts, financial COURIER_PERF cohorts, and settlement evidence separate unless reconciled.',
      'Carry forward every row in stock.critical_stock as CRITICAL/OUT_OF_STOCK and do not silently omit any. Rows in stock.watch_stock remain WATCH and must not be promoted to CRITICAL because of an older brief or prior run.',
      'Market-specific Meta activity is proven only by known_market_meta_spend_aed > 0 for that exact country+SKU. Do not infer market activity from SKU-total spend or GROUP product economics.',
      'Missing market-specific Meta linkage affects ad classification only and does not erase deterministic physical stock risk.',
      'No reliable open PO/ETA/MOQ/supplier lead-time pipeline exists. Do not invent inbound quantities, ETA, lead time, MOQ, reorder quantity, or cash commitment.',
      'Final SCALE decisions are blocked globally by missing TikTok spend, but operational evidence gathering, stock-risk preparation, internal reconciliation, or courier refresh work may still be recommended when valid.',
      'Prioritize what ATLAS needs to put in front of Abid today: the smallest set of material risks, holds, opportunities, and approval-required actions.',
      'Maximum 4 findings and maximum 3 recommendations.',
      'Do not bundle internal no-approval work with external approval-required work in one recommendation.',
      'Internal HOLD/reconciliation/data refresh can use approval_required=false. External contact, ad/courier/order/stock/payment changes, supplier/courier requests, PO/replenishment commitments, source-system/feed integration or money movement require approval_required=true.',
      'TikTok active-channel spend is currently MISSING, not merely stale. Therefore do not describe obtaining/refreshing the TikTok spend feed as an internal refresh. Acquisition, integration, connection, setup, enablement, or restoration of a missing TikTok spend source requires founder approval.',
      'A Last Mile API/data repoll is internal and can be approval_required=false. Never bundle it in the same recommendation with TikTok feed acquisition/integration or another approval-required action.',
      'With the 3-recommendation limit, prioritize founder approval decisions in recommendations. Internal refresh work may be placed in next_check/findings rather than bundled with external actions.',
      'questions_for_abid may ask only for genuinely missing evidence or an explicit approval decision. They must not renegotiate locked business rules.',
      'Do not execute, imply execution, or write any business change.',
      'Return a concise supervisor verdict suitable for ATLAS. Avoid duplicating normal information that does not require founder attention.'
    ].join(' ');

    const context = {
      phase1_supervisor_packet: packet,
      governance: {
        mode: 'SUPERVISOR_SYNTHESIS_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        reporting_chain:
          'LEDGER/SCALE/ROUTE/STOCK -> SENTINEL -> ORBIT -> ATLAS -> Abid',
        source_precedence: [
          'DETERMINISTIC_SOURCE_AND_CONTROL_DATA',
          'DETERMINISTIC_CROSS_CHECKS',
          'SENTINEL_AUDIT',
          'ORBIT_INTERPRETATION'
        ],
        max_hierarchy_passes: 2
      },
      phase_note:
        'Step 6J isolated ORBIT validation. Four specialist AI runtimes are already individually locked; final integrated orchestration will pass their actual briefs without duplicate calls.'
    };

    const aiRun = fctRunAgent_(
      'AG002',
      task,
      context,
      'STANDARD',
      runId
    );

    if (!aiRun || !aiRun.result) {
      throw new Error(
        'ORBIT AI runtime returned no structured result.'
      );
    }

    if (aiRun.result.agent_id !== 'AG002') {
      throw new Error(
        'ORBIT identity contract failed: ' +
        String(aiRun.result.agent_id || '')
      );
    }

    aiRun.result = fctOrbitEnforceGovernance_(
      aiRun.result,
      packet
    );

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG002',
      sentinel_run_id: sentinelRun.run_id,
      packet_status: packet.overall_source_status,
      runtime: aiRun.runtime,
      deterministic_cross_checks:
        packet.deterministic_cross_checks,
      stock_classification:
        fctOrbitStockClassification_(packet.stock),
      result: aiRun.result
    };

    Logger.log(JSON.stringify(output, null, 2));
    return output;

  } finally {
    lock.releaseLock();
  }
}


function testFctOrbitPhase1AI() {
  return runFctOrbitPhase1AI();
}


function testFctOrbitPacketNoApi() {
  throw new Error(
    'ORBIT packet requires a fresh SENTINEL result. Use testFctOrbitPhase1AI(); isolated no-API packet construction is intentionally unsupported.'
  );
}


function fctBuildOrbitPhase1Packet_(sentinelRun) {
  const ledger = fctBuildLedgerSnapshot_();
  const scale = fctBuildScaleSnapshot_();
  const route = fctBuildRouteSnapshot_();
  const stock = fctBuildStockSnapshot_();

  const lastMile = (route.live_courier_view || []).find(function(x) {
    return String((x && x.courier) || '').toLowerCase() === 'last mile';
  }) || null;

  const settlementReviews = (ledger.cash_reconciliation.items || [])
    .filter(function(x) {
      return /REVIEW/i.test(String((x && x.status_note) || ''));
    })
    .map(function(x) {
      return {
        courier: x.courier,
        difference_aed: x.difference_aed,
        status_note: x.status_note
      };
    });

  const criticalStock = (stock.critical_stock || []).map(function(x) {
    return {
      country: x.country,
      sku: x.sku,
      product: x.product,
      available_stock: x.available_stock,
      available_stock_days: x.available_stock_days,
      stock_gate: x.stock_gate,
      priority: x.priority,
      known_market_meta_spend_aed:
        x.known_market_meta_spend_aed,
      reconciliation_gate: x.reconciliation_gate
    };
  });

  const watchStock = (stock.watch_stock || []).slice(0, 6)
    .map(function(x) {
      return {
        country: x.country,
        sku: x.sku,
        available_stock: x.available_stock,
        available_stock_days: x.available_stock_days,
        priority: x.priority,
        known_market_meta_spend_aed:
          x.known_market_meta_spend_aed,
        reconciliation_gate: x.reconciliation_gate
      };
    });

  const positiveProducts =
    (scale.provisional_product_rankings.positive_after_meta || [])
      .slice(0, 6)
      .map(fctOrbitCompactScaleRow_);

  const negativeProducts =
    (scale.provisional_product_rankings.negative_after_meta || [])
      .slice(0, 4)
      .map(fctOrbitCompactScaleRow_);

  const routeNormalized = (route.normalized_order_view || [])
    .map(function(x) {
      return {
        courier: x.courier,
        pickups_mtd: x.pickups_mtd,
        delivered_unpaid: x.delivered_unpaid,
        paid: x.paid,
        rrto: x.rrto,
        open_nonterminal: x.open_nonterminal,
        finalized_success: x.finalized_success,
        courier_receivable_aed: x.courier_receivable_aed,
        pending_aging_over_3d: x.pending_aging_over_3d
      };
    });

  const routeLive = (route.live_courier_view || [])
    .map(function(x) {
      return {
        courier: x.courier,
        live_shipments: x.live_shipments,
        terminal_delivered: x.terminal_delivered,
        terminal_return: x.terminal_return,
        open_nonterminal: x.open_nonterminal,
        finalized_success: x.finalized_success,
        scale_gate_status: x.scale_gate_status,
        freshness_status: x.freshness_status,
        poll_age_hours: x.poll_age_hours,
        reconciliation_status: x.reconciliation_status
      };
    });

  const sourceStatuses = {
    ledger: ledger.data_quality.status,
    scale: scale.data_quality.status,
    route: route.data_quality.status,
    stock: stock.data_quality.status,
    sentinel: sentinelRun.result.audit_status
  };

  const overallFail = Object.keys(sourceStatuses)
    .some(function(k) {
      return String(sourceStatuses[k]).toUpperCase() === 'FAIL';
    });

  const overallReview = Object.keys(sourceStatuses)
    .some(function(k) {
      return /REVIEW|WARNING/i.test(String(sourceStatuses[k]));
    });

  fctOrbitAssertFreshAuditConsistency_(
    sentinelRun, ledger, scale, route, stock
  );

  return {
    contract_version: '1.0',
    packet_for: 'AG002',
    generated_at: new Date().toISOString(),
    overall_source_status: overallFail
      ? 'FAIL'
      : (overallReview ? 'REVIEW' : 'PASS'),
    source_statuses: sourceStatuses,

    deterministic_cross_checks:
      sentinelRun.deterministic_cross_checks || {},

    sentinel_audit: {
      run_id: sentinelRun.run_id,
      audit_status: sentinelRun.result.audit_status,
      severity: sentinelRun.result.severity,
      source_freshness: sentinelRun.result.source_freshness,
      summary: sentinelRun.result.summary,
      findings: sentinelRun.result.findings,
      recommendations: sentinelRun.result.recommendations,
      questions_for_abid:
        sentinelRun.result.questions_for_abid,
      confidence: sentinelRun.result.confidence,
      provisional_fields:
        sentinelRun.result.provisional_fields
    },

    ledger: {
      period: ledger.period,
      data_quality_status: ledger.data_quality.status,
      economics: {
        orders_picked_mtd: ledger.economics.orders_picked_mtd,
        delivered_unpaid_mtd: ledger.economics.delivered_unpaid_mtd,
        paid_mtd: ledger.economics.paid_mtd,
        rrto_mtd: ledger.economics.rrto_mtd,
        finalized_delivery_success:
          ledger.economics.finalized_delivery_success,
        delivered_revenue_aed:
          ledger.economics.delivered_revenue_aed,
        gross_contribution_aed:
          ledger.economics.gross_contribution_aed,
        courier_receivable_aed:
          ledger.economics.courier_receivable_aed,
        meta_platform_spend_aed:
          ledger.economics.meta_platform_spend_aed,
        meta_not_represented_in_daily_pnl_aed:
          ledger.economics.meta_not_represented_in_daily_pnl_aed,
        contribution_after_all_meta_aed:
          ledger.economics.contribution_after_all_meta_aed,
        tiktok_spend_aed:
          ledger.economics.tiktok_spend_aed,
        real_contribution_profit_aed:
          ledger.economics.real_contribution_profit_aed,
        real_contribution_status:
          ledger.economics.real_contribution_status,
        monthly_fixed_cost_baseline_aed:
          ledger.economics.monthly_fixed_cost_baseline_aed,
        real_operating_profit_aed:
          ledger.economics.real_operating_profit_aed,
        real_operating_profit_status:
          ledger.economics.real_operating_profit_status
      },
      settlement_reviews: settlementReviews,
      data_quality_flags:
        (ledger.data_quality.flags || []).slice(0, 10)
    },

    scale: {
      period: scale.period,
      data_quality_status: scale.data_quality.status,
      channel_completeness: scale.channel_completeness,
      meta: {
        platform_spend_aed: scale.meta.platform_spend_aed,
        product_pnl_meta_spend_aed:
          scale.meta.product_pnl_meta_spend_aed,
        meta_not_represented_in_product_pnl_aed:
          scale.meta.meta_not_represented_in_product_pnl_aed,
        performance_metrics_status:
          scale.meta.performance_metrics_status
      },
      positive_after_meta: positiveProducts,
      negative_after_meta: negativeProducts,
      courier_scale_gates: (scale.courier_scale_gates || [])
        .map(function(x) {
          return {
            courier: x.courier,
            finalized_success: x.finalized_success,
            scale_gate_status: x.scale_gate_status,
            reconciliation_status: x.reconciliation_status,
            last_polled_utc: x.last_polled_utc
          };
        }),
      data_quality_flags:
        (scale.data_quality.flags || []).slice(0, 12)
    },

    route: {
      data_quality_status: route.data_quality.status,
      normalized_order_view: routeNormalized,
      live_courier_view: routeLive,
      last_mile: lastMile ? {
        finalized_success: lastMile.finalized_success,
        scale_gate_status: lastMile.scale_gate_status,
        freshness_status: lastMile.freshness_status,
        poll_age_hours: lastMile.poll_age_hours,
        reconciliation_status: lastMile.reconciliation_status
      } : null,
      settlement_reconciliation:
        (route.settlement_reconciliation || []).map(function(x) {
          return {
            courier: x.courier,
            difference_aed: x.difference_aed,
            status_note: x.status_note
          };
        }),
      data_quality_flags:
        (route.data_quality.flags || []).slice(0, 15)
    },

    stock: {
      data_quality_status: stock.data_quality.status,
      inventory_summary: stock.inventory_summary,
      critical_stock: criticalStock,
      watch_stock: watchStock,
      inbound_visibility: stock.inbound_visibility,
      meta_market_attribution:
        stock.meta_market_attribution,
      data_quality_flags:
        (stock.data_quality.flags || []).slice(0, 12)
    },

    locked_rules: {
      tiktok:
        'Missing active-channel TikTok spend hard-blocks final Real Contribution, Operating Profit and final SCALE decisions.',
      delivery_success:
        '(Delivered + Paid)/(Delivered + Paid + RRTO), terminal outcomes only.',
      paid:
        'Paid means COD remittance received; Delivered does not imply Paid.',
      inventory:
        'Physical available stock is authoritative; RRTO is unavailable until physically received; velocity=max(7d,14d).',
      sentinel:
        'SENTINEL FAIL caused by missing/bad evidence means HOLD/ASK for the affected conclusion; ORBIT cannot vote around it.'
    }
  };
}


function fctOrbitAssertFreshAuditConsistency_(
  sentinelRun,
  ledger,
  scale,
  route,
  stock
) {
  const checks = sentinelRun.deterministic_cross_checks || {};

  const metaLS = checks.meta_platform_spend_ledger_vs_scale || {};
  const metaLSt = checks.meta_platform_spend_ledger_vs_stock || {};
  const pending = checks.meta_country_pending_scale_vs_stock || {};
  const recv = checks.courier_receivable_ledger_vs_route || {};

  fctOrbitAssertNear_(
    ledger.economics.meta_platform_spend_aed,
    metaLS.ledger_aed,
    0.01,
    'LEDGER Meta spend changed after SENTINEL audit'
  );

  fctOrbitAssertNear_(
    scale.meta.platform_spend_aed,
    metaLS.scale_aed,
    0.01,
    'SCALE Meta spend changed after SENTINEL audit'
  );

  fctOrbitAssertNear_(
    stock.meta_market_attribution.platform_spend_aed,
    metaLSt.stock_attribution_aed,
    0.01,
    'STOCK Meta attribution changed after SENTINEL audit'
  );

  fctOrbitAssertNear_(
    scale.channel_completeness.meta.country_pending_spend_aed,
    pending.scale_aed,
    0.01,
    'SCALE country-pending Meta changed after SENTINEL audit'
  );

  fctOrbitAssertNear_(
    stock.meta_market_attribution.country_pending_spend_aed,
    pending.stock_aed,
    0.01,
    'STOCK country-pending Meta changed after SENTINEL audit'
  );

  fctOrbitAssertNear_(
    ledger.economics.courier_receivable_aed,
    recv.ledger_aed,
    0.01,
    'LEDGER courier receivable changed after SENTINEL audit'
  );

  const routeReceivable = (route.normalized_order_view || [])
    .reduce(function(sum, x) {
      return sum + Number((x && x.courier_receivable_aed) || 0);
    }, 0);

  fctOrbitAssertNear_(
    routeReceivable,
    recv.route_normalized_sum_aed,
    0.01,
    'ROUTE normalized courier receivable changed after SENTINEL audit'
  );

  const deliveryCheck =
    checks.finalized_delivery_success_ledger_vs_route || {};

  fctOrbitAssertNear_(
    ledger.economics.finalized_delivery_success,
    deliveryCheck.ledger,
    0.0001,
    'LEDGER finalized delivery success changed after SENTINEL audit'
  );

  let routeSuccessCount = 0;
  let routeRrto = 0;

  (route.normalized_order_view || []).forEach(function(x) {
    routeSuccessCount +=
      Number((x && x.delivered_unpaid) || 0) +
      Number((x && x.paid) || 0);
    routeRrto += Number((x && x.rrto) || 0);
  });

  const routeSuccess = (routeSuccessCount + routeRrto) > 0
    ? routeSuccessCount / (routeSuccessCount + routeRrto)
    : null;

  fctOrbitAssertNear_(
    routeSuccess,
    deliveryCheck.route_normalized,
    0.0001,
    'ROUTE normalized finalized delivery success changed after SENTINEL audit'
  );

  const tiktokCheck = checks.tiktok_blocker_consistency || {};
  const currentTikTokBlocked =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(ledger.economics.real_contribution_status || '')
    ) &&
    /MISSING_ACTIVE_CHANNEL_SPEND/i.test(
      String(scale.channel_completeness.tiktok.status || '')
    );

  if (String(tiktokCheck.status || '').toUpperCase() === 'MATCH' &&
      !currentTikTokBlocked) {
    throw new Error(
      'ORBIT prerequisite consistency failed: TikTok blocker state changed after SENTINEL audit; rerun the chain.'
    );
  }

  fctOrbitAssertStockClassificationStable_(
    sentinelRun.stock_classification || null,
    stock
  );

  // SENTINEL must have covered the current deterministic critical-stock set.
  fctOrbitAssertCriticalStockCoverage_(
    stock.critical_stock || [],
    sentinelRun.result || {}
  );

  return true;
}


function fctOrbitAssertNear_(actual, expected, tolerance, label) {
  const a = Number(actual);
  const e = Number(expected);

  if (!isFinite(a) || !isFinite(e) ||
      Math.abs(a - e) > Number(tolerance || 0)) {
    throw new Error(
      'ORBIT prerequisite consistency failed: ' + label +
      '. SENTINEL/current snapshot mismatch; rerun the chain.'
    );
  }
}


function fctOrbitCompactScaleRow_(x) {
  return {
    sku: x.sku,
    total_orders: x.total_orders,
    finalized: x.finalized,
    delivered_paid: x.delivered_paid,
    delivery_success: x.delivery_success,
    meta_spend_aed: x.meta_spend_aed,
    contribution_after_meta_aed:
      x.contribution_after_meta_aed,
    profit_per_delivered_after_meta_aed:
      x.profit_per_delivered_after_meta_aed,
    economic_signal: x.economic_signal,
    delivery_gate: x.delivery_gate,
    stock_gate: x.stock_gate,
    mapping_gate: x.mapping_gate,
    provisional_blockers: x.provisional_blockers,
    final_scale_decision_ready:
      x.final_scale_decision_ready,
    pnl_status: x.pnl_status
  };
}


function fctOrbitEnforceGovernance_(result, packet) {
  if (!result || typeof result !== 'object') {
    throw new Error(
      'ORBIT governance enforcement failed: invalid result object.'
    );
  }

  const severity = String(result.severity || '').toUpperCase();
  const material =
    severity === 'WATCH' ||
    severity === 'ACT_NOW' ||
    severity === 'CRITICAL';

  if (material &&
      (!Array.isArray(result.findings) ||
       result.findings.length === 0)) {
    throw new Error(
      'ORBIT output contract failed: material severity with no findings.'
    );
  }

  if (Array.isArray(result.findings) &&
      result.findings.length > 4) {
    throw new Error(
      'ORBIT output contract failed: maximum 4 findings allowed.'
    );
  }

  if (Array.isArray(result.recommendations) &&
      result.recommendations.length > 3) {
    throw new Error(
      'ORBIT output contract failed: maximum 3 recommendations allowed.'
    );
  }

  const criticalRows =
    (packet && packet.stock && packet.stock.critical_stock) || [];

  fctOrbitAssertCriticalStockCoverage_(
    criticalRows,
    result
  );

  fctOrbitAssertCriticalCountClaims_(
    criticalRows,
    result
  );

  fctOrbitAssertWatchRowsNotPromoted_(
    (packet && packet.stock && packet.stock.watch_stock) || [],
    result
  );

  const narrative = fctOrbitNarrativeParts_(result);

  narrative.forEach(function(s) {
    if (fctOrbitAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'ORBIT governance contract failed: locked TikTok blocker was weakened or bypassed.'
      );
    }

    if (fctOrbitMisstatesLastMileFreshness_(s, packet)) {
      throw new Error(
        'ORBIT data-quality contract failed: stale Last Mile data was presented as fresh/current.'
      );
    }

    if (fctOrbitAssertsUnconfirmedCourierShortage_(s)) {
      throw new Error(
        'ORBIT finance contract failed: TFM/OTO screening difference was presented as a confirmed shortage/loss/debt.'
      );
    }

    if (fctOrbitMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'ORBIT stock contract failed: Kuwait Meta linkage was made a prerequisite for physical stock-risk action.'
      );
    }
  });

  const rawQuestions = Array.isArray(result.questions_for_abid)
    ? result.questions_for_abid
    : [];

  result.questions_for_abid = rawQuestions.filter(function(q) {
    const s = String(q || '');
    return !fctOrbitQuestionAsksTikTokBypass_(s) &&
      !fctOrbitMakesMarketMetaStockPrereq_(s);
  });

  const recs = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  recs.forEach(function(rec) {
    const action = String((rec && rec.action) || '');
    const external = fctOrbitIsExternalApprovalAction_(action, packet);
    const internal = fctOrbitIsInternalAction_(action, packet);
    const pureHold = fctOrbitIsPureInternalHold_(action, packet);

    if (external && internal) {
      throw new Error(
        'ORBIT recommendation contract failed: internal and external actions must be split.'
      );
    }

    if (external) {
      rec.approval_required = true;
    } else if (internal || pureHold) {
      rec.approval_required = false;
    }
  });

  result.approval_required = recs.some(function(rec) {
    return !!(rec && rec.approval_required);
  });

  const sentinelAudit = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.audit_status || ''
  ).toUpperCase();

  if (sentinelAudit === 'FAIL') {
    result.audit_status = 'FAIL';
  }

  const sentinelSeverity = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.severity || ''
  ).toUpperCase();

  const severityRank = {
    NORMAL: 0,
    WATCH: 1,
    ACT_NOW: 2,
    CRITICAL: 3
  };

  const orbitSeverity = String(result.severity || '').toUpperCase();

  if (severityRank[sentinelSeverity] !== undefined &&
      (severityRank[orbitSeverity] === undefined ||
       severityRank[orbitSeverity] < severityRank[sentinelSeverity])) {
    result.severity = sentinelSeverity;
  }

  const sentinelFreshness = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.source_freshness || ''
  ).toUpperCase();

  if (sentinelFreshness && sentinelFreshness !== 'FRESH') {
    result.source_freshness = sentinelFreshness;
  }

  const sentinelConfidence = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.confidence || ''
  ).toUpperCase();

  if (sentinelConfidence === 'LOW') {
    result.confidence = 'LOW';
  } else if (sentinelConfidence === 'MEDIUM' &&
             String(result.confidence || '').toUpperCase() === 'HIGH') {
    result.confidence = 'MEDIUM';
  }

  const inheritedProvisional =
    packet && packet.sentinel_audit &&
    Array.isArray(packet.sentinel_audit.provisional_fields)
      ? packet.sentinel_audit.provisional_fields
      : [];

  const ownProvisional = Array.isArray(result.provisional_fields)
    ? result.provisional_fields
    : [];

  result.provisional_fields = ownProvisional
    .concat(inheritedProvisional)
    .filter(function(x, i, arr) {
      return arr.indexOf(x) === i;
    });

  return result;
}


function fctOrbitNarrativeParts_(result) {
  const out = [];
  out.push(String((result && result.summary) || ''));

  (Array.isArray(result.findings) ? result.findings : [])
    .forEach(function(x) {
      out.push(String((x && x.title) || ''));
      out.push(String((x && x.detail) || ''));
    });

  (Array.isArray(result.recommendations)
    ? result.recommendations
    : []).forEach(function(x) {
      out.push(String((x && x.action) || ''));
      out.push(String((x && x.why) || ''));
    });

  return out;
}


function fctOrbitStockClassification_(stock) {
  return {
    critical_keys: fctOrbitStockKeys_(
      (stock && stock.critical_stock) || []
    ),
    watch_keys: fctOrbitStockKeys_(
      (stock && stock.watch_stock) || []
    )
  };
}


function fctOrbitStockKeys_(rows) {
  return (rows || []).map(function(x) {
    return String((x && x.country) || '').trim() + '|' +
      String((x && x.sku) || '').trim().toUpperCase();
  }).filter(function(x) {
    return x !== '|';
  }).sort();
}


function fctOrbitAssertStockClassificationStable_(prior, stock) {
  if (!prior) return true;
  const current = fctOrbitStockClassification_(stock || {});
  const a = JSON.stringify(prior.critical_keys || []);
  const b = JSON.stringify(current.critical_keys || []);
  const c = JSON.stringify(prior.watch_keys || []);
  const d = JSON.stringify(current.watch_keys || []);
  if (a !== b || c !== d) {
    throw new Error(
      'ORBIT prerequisite consistency failed: stock severity classification changed after SENTINEL audit; rerun the chain.'
    );
  }
  return true;
}


function fctOrbitAssertCriticalCountClaims_(criticalRows, result) {
  const actual = (criticalRows || []).length;
  const text = JSON.stringify(result || {});
  const words = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const re = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b\s+(?:deterministic\s+)?critical(?:[- ]stock)?\s+(?:rows?|risks?|exposures?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = String(m[1] || '').toLowerCase();
    const claimed = Object.prototype.hasOwnProperty.call(words, raw)
      ? words[raw]
      : Number(raw);
    if (isFinite(claimed) && claimed !== actual) {
      throw new Error(
        'ORBIT stock-severity contract failed: narrative claims ' +
        claimed + ' critical stock rows/risks but deterministic packet has ' +
        actual + '.'
      );
    }
  }
  return true;
}


function fctOrbitAssertWatchRowsNotPromoted_(watchRows, result) {
  const text = JSON.stringify(result || {});
  const upper = text.toUpperCase();

  (watchRows || []).forEach(function(x) {
    const sku = String((x && x.sku) || '').trim().toUpperCase();
    if (!sku) return;

    let pos = upper.indexOf(sku);
    while (pos >= 0) {
      const start = Math.max(0, pos - 110);
      const end = Math.min(upper.length, pos + sku.length + 110);
      const windowText = upper.slice(start, end);
      const skuLocal = pos - start;
      const labels = [];
      const patterns = [
        { type: 'CRITICAL', re: /\bCRITICAL\b|\bOUT OF STOCK\b|\bOOS\b|\bACT[_ ]NOW\b|≤\s*3|<=\s*3/g },
        { type: 'WATCH', re: /\bWATCH\b|\bREORDER\b|≤\s*7|<=\s*7/g }
      ];

      patterns.forEach(function(spec) {
        spec.re.lastIndex = 0;
        let m;
        while ((m = spec.re.exec(windowText)) !== null) {
          labels.push({ type: spec.type, distance: Math.abs(m.index - skuLocal) });
        }
      });

      if (labels.length) {
        labels.sort(function(a, b) { return a.distance - b.distance; });
        if (labels[0].type === 'CRITICAL') {
          throw new Error(
            'ORBIT stock-severity contract failed: WATCH row ' +
            sku + ' was described with a CRITICAL/OOS/ACT_NOW label.'
          );
        }
      }
      pos = upper.indexOf(sku, pos + sku.length);
    }
  });
  return true;
}


function fctOrbitAssertCriticalStockCoverage_(criticalRows, result) {
  const text = [
    String((result && result.summary) || ''),
    fctOrbitNarrativeParts_(result).join(' ')
  ].join(' ');

  const missing = [];

  (criticalRows || []).forEach(function(x) {
    const country = String((x && x.country) || '').trim();
    const sku = String((x && x.sku) || '').trim().toUpperCase();

    if (!country || !sku) return;

    if (!fctOrbitHasCountrySkuMention_(text, country, sku)) {
      missing.push(country + ' ' + sku);
    }
  });

  if (missing.length) {
    throw new Error(
      'ORBIT completeness contract failed: critical stock omitted from supervisor brief: ' +
      missing.join(', ')
    );
  }

  return true;
}


function fctOrbitHasCountrySkuMention_(text, country, sku) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const k = fctOrbitEscapeRegex_(String(sku || '').toUpperCase());

  const aliases = c.indexOf('united arab emirates') >= 0
    ? ['UAE', 'United Arab Emirates']
    : (c.indexOf('kuwait') >= 0
      ? ['Kuwait', 'KWT']
      : [country]);

  return aliases.some(function(alias) {
    const a = fctOrbitEscapeRegex_(alias);
    return (
      new RegExp('\\b' + a + '\\b.{0,160}\\b' + k + '\\b', 'i').test(s) ||
      new RegExp('\\b' + k + '\\b.{0,160}\\b' + a + '\\b', 'i').test(s)
    );
  });
}


function fctOrbitAdvocatesTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Explicit statements preserving the locked block are safe.
  if (
    /\b(do not|don't|must not|cannot|can't|should not|never)\b.{0,80}\b(override|bypass|relax|waive)\b.{0,80}\b(TikTok|hard block|blocker)\b/i.test(s) ||
    /\b(final\s+)?(scale|scaling|go[- ]?no[- ]?go|scale decision)\b.{0,120}\b(remain(?:s)?|stay(?:s)?|keep|is|are)?\s*(blocked|on hold|hold|must wait)\b.{0,120}\b(TikTok|live spend|spend feed|active-channel spend)\b/i.test(s) ||
    /\b(blocked|hold|on hold|must wait)\b.{0,120}\b(until|pending)\b.{0,80}\b(TikTok|live spend|spend feed|active-channel spend)\b/i.test(s)
  ) {
    return false;
  }

  // Acquiring/integrating the missing TikTok source in order to unblock
  // a later decision is compliant; it does not authorize scaling now.
  if (
    /\b(approve|authorize|acquire|integrate|connect|configure|enable|restore|set up)\b.{0,120}\b(TikTok|spend feed|spend source|active-channel spend)\b.{0,160}\b(unblock|enable|restore|support|permit)\b.{0,100}\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b/i.test(s) ||
    /\b(TikTok|spend feed|spend source|active-channel spend)\b.{0,120}\b(integrat|connect|available|live|valid)\w*\b.{0,140}\b(before|then|after|once)\b.{0,100}\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b/i.test(s) ||
    /\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b.{0,120}\b(only after|after|once|when)\b.{0,100}\b(TikTok|live spend|spend feed|active-channel spend)\b.{0,80}\b(is|becomes)?\s*(available|live|integrated|connected|valid)\b/i.test(s)
  ) {
    return false;
  }

  // Direct attempts to waive/override the blocker are forbidden.
  if (
    /\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return true;
  }

  const scaleTerm =
    '(?:final\\s+)?(?:scale|scaling|scale decision|go[- ]?no[- ]?go)';

  // Explicit permission to scale while the TikTok evidence gate is still unmet.
  const patterns = [
    new RegExp(
      '\\b(?:allow|approve|authorize|greenlight|proceed|continue|go ahead)\\b.{0,90}\\b' +
      scaleTerm +
      '\\b.{0,120}\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b',
      'i'
    ),
    new RegExp(
      '\\b' + scaleTerm +
      '\\b.{0,90}\\b(?:proceed|continue|go ahead|greenlight|approved|allowed)\\b.{0,120}\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b',
      'i'
    ),
    new RegExp(
      '\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b.{0,120}\\b(?:allow|approve|authorize|greenlight|proceed|continue|go ahead)\\b.{0,90}\\b' +
      scaleTerm +
      '\\b',
      'i'
    ),
    new RegExp(
      '\\b' + scaleTerm +
      '\\b.{0,50}\\b(?:now|anyway|regardless)\\b.{0,140}\\bTikTok\\b.{0,80}\\b(?:missing|absent|unavailable|not available|not integrated)\\b',
      'i'
    )
  ];

  return patterns.some(function(re) {
    return re.test(s);
  });
}



function fctOrbitQuestionAsksTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Questions about approving the missing TikTok integration/source are valid.
  if (
    /\b(approve|authorize)\b.{0,100}\b(acquisition|integration|connection|setup|source|feed|API)\b.{0,120}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,120}\b(only after|after|once|when)\b.{0,100}\bTikTok\b/i.test(s)
  ) {
    return false;
  }

  if (
    /\b(do not|don't|must not|should not|cannot|can't|never)\b.{0,80}\b(override|bypass|relax|waive)\b.{0,80}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  if (
    /\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return true;
  }

  return (
    /\b(can|should|may|could)\b.{0,80}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,140}\b(proceed|continue|go ahead|be approved|be allowed)\b.{0,140}\b(without|despite|before|while|even though|even if|regardless of)\b.{0,80}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(proceed|continue|go ahead)\b.{0,100}\b(with\s+)?(final\s+)?(scale|scaling|scale decision)\b.{0,140}\b(without|despite|before|while|even though|even if)\b.{0,80}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(approve|allow|authorize|greenlight)\b.{0,100}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,140}\b(without|despite|before|while|even though|even if|regardless of)\b.{0,80}\bTikTok\b/i.test(s)
  );
}



function fctOrbitMisstatesLastMileFreshness_(text, packet) {
  const s = String(text || '');
  if (!/Last Mile/i.test(s)) return false;

  const lm = packet && packet.route && packet.route.last_mile;
  if (!lm || String(lm.freshness_status || '').toUpperCase() !== 'STALE_REVIEW') {
    return false;
  }

  // Safe stale-qualified phrasing. The same sentence may use words such as
  // "current" only to explain that current confidence is limited.
  if (/\b(stale|stale\/review|stale_review|not current|not fresh|not up[- ]?to[- ]?date|poll age|hours? old|old poll|aged poll)\b/i.test(s)) {
    return false;
  }

  // Safe action/future-state language: asking for a fresh/current poll is not
  // the same as asserting that the existing Last Mile evidence is fresh.
  if (fctOrbitIsLastMileRefreshRequest_(s)) {
    return false;
  }

  // Locked rule: a bare 64.1% reference must carry an explicit stale qualifier.
  if (/\b64\.1\s*%/i.test(s)) {
    return true;
  }

  // Fail only on assertive freshness/currentness about the existing evidence.
  return (
    /\bLast Mile\b.{0,90}\b(is|was|remains|looks|appears|shows|reports|reported|has|currently)\b.{0,80}\b(fresh|current|live now|up[- ]?to[- ]?date|latest)\b/i.test(s) ||
    /\b(fresh|current|up[- ]?to[- ]?date|latest)\b.{0,50}\bLast Mile\b.{0,70}\b(data|poll|feed|view|counts?|performance|result|results|figure|figures)\b/i.test(s) ||
    /\bLast Mile\b.{0,70}\b(data|poll|feed|view|counts?|performance|result|results|figure|figures)\b.{0,50}\b(is|are|was|were)\b.{0,30}\b(fresh|current|up[- ]?to[- ]?date|latest)\b/i.test(s)
  );
}


function fctOrbitIsLastMileRefreshRequest_(text) {
  const s = String(text || '');
  if (!/Last Mile/i.test(s)) return false;

  return (
    /\b(request|trigger|run|perform|obtain|get|fetch|refresh|repoll|poll|update|need|require|wait for|await)\b.{0,120}\b(fresh|current|new|updated|latest)?\b.{0,80}\bLast Mile\b.{0,80}\b(data|poll|feed|view|snapshot|evidence|counts?|performance)?\b/i.test(s) ||
    /\b(fresh|current|new|updated|latest)\b.{0,60}\bLast Mile\b.{0,80}\b(data|poll|feed|view|snapshot|evidence|counts?|performance)\b.{0,80}\b(before|to|for|needed|required)\b/i.test(s)
  );
}


function fctOrbitAssertsUnconfirmedCourierShortage_(text) {
  const s = String(text || '');
  if (!/\b(TFM|OTO)\b/i.test(s)) return false;

  if (/\b(unconfirmed|screening|review|not confirmed|do not treat|pending .*settlement|pending .*remittance)\b/i.test(s)) {
    return false;
  }

  return /\b(shortage|loss|lost|theft|missing cash|courier debt|owes|owed)\b/i.test(s);
}


function fctOrbitMakesMarketMetaStockPrereq_(text) {
  const s = String(text || '');
  if (!s) return false;

  if (
    /\b(not|isn't|is not|should not|must not|never)\b.{0,100}\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,120}\b(prerequisite|required|before)\b.{0,120}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,80}\b(is not|isn't|not)\b.{0,50}\b(required|a prerequisite|prerequisite)\b.{0,100}\b(before|for)\b.{0,100}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,100}\b(classification only|ad[- ]activity classification|not a prerequisite)\b/i.test(s)
  ) {
    return false;
  }

  const metaLinkage =
    /\b(Meta|market[- ]?linkage|ad[- ]?activity|market activity)\b/i.test(s);
  const stockAction =
    /\b(replenish|replenishment|restock|stock action|inventory action|stock commitment|purchase order|PO)\b/i.test(s);
  const prereq =
    /\b(required|prerequisite|must confirm|must prove|need to confirm|need to prove)\b.{0,100}\b(before|prior to)\b/i.test(s) ||
    /\b(before|prior to)\b.{0,100}\b(required|confirm|prove)\b/i.test(s);

  return metaLinkage && stockAction && prereq;
}


function fctOrbitTikTokSourceMissing_(packet) {
  const status = String(
    packet &&
    packet.scale &&
    packet.scale.channel_completeness &&
    packet.scale.channel_completeness.tiktok &&
    packet.scale.channel_completeness.tiktok.status || ''
  ).toUpperCase();

  return (
    status === 'MISSING_ACTIVE_CHANNEL_SPEND' ||
    status === 'MISSING' ||
    status === 'NOT_AVAILABLE' ||
    status === 'UNAVAILABLE'
  );
}


function fctOrbitIsExternalApprovalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  // When TikTok spend is missing, verbs such as refresh/sync/pull/update
  // the TikTok feed imply restoring/acquiring a missing source, not a routine internal refresh.
  if (
    fctOrbitTikTokSourceMissing_(packet) &&
    /\bTikTok\b/i.test(s) &&
    /\b(refresh|sync|pull|update|reload|restore|fetch|obtain|get|acquire|integrate|connect|configure|enable|add|ingest|set up)\b/i.test(s) &&
    /\b(feed|spend|data|source|API|connector|active-channel)\b/i.test(s)
  ) {
    return true;
  }

  // Explicit human/business communication with an outside party.
  if (
    /\b(contact|email|message|call|whatsapp|send to)\b.{0,100}\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b.{0,100}\b(contact|email|message|call|whatsapp)\b/i.test(s)
  ) {
    return true;
  }

  // Documentary/evidence requests from external parties.
  if (
    /\b(request|ask|obtain|get)\b.{0,120}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote)\b.{0,140}\b(couriers?|suppliers?|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(request|ask|obtain|get)\b.{0,120}\b(TFM|OTO|C3X|Last Mile|couriers?|suppliers?)\b.{0,120}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  // Source-system / connector / active-channel data integration.
  // A HOLD that merely says "until TikTok is integrated" is not itself
  // an external action; this requires an action verb such as approve/connect.
  if (
    /\b(approve|authorize)\b.{0,100}\b(acquisition|integration|connection|setup)\b.{0,120}\b(TikTok|API|feed|source|system|connector|spend)\b/i.test(s) ||
    /\b(integrate|connect|configure|enable|add|acquire|ingest|set up)\b.{0,120}\b(TikTok|API|feed|source|system|connector|spend data|active-channel spend)\b/i.test(s)
  ) {
    return true;
  }

  // Inventory / PO / replenishment commitments or external sourcing.
  if (
    /\b(place|approve|authorize|commit|purchase|buy|replenish|source|initiate|arrange|transfer)\b.{0,120}\b(PO|purchase|order|stock|inventory|units?|SKU|PLG\d+|replenishment|sourcing)\b/i.test(s)
  ) {
    return true;
  }

  // Ads/campaign changes. Treat "SCALE" as an action only when it
  // directly targets ads/campaign/budget/spend, not when it is the name
  // of the SCALE agent/decision/gate.
  if (
    /\b(pause|stop|increase|decrease|change|edit|approve)\b.{0,80}\b(ads?|campaigns?|budgets?|ad spend|Meta spend|TikTok spend)\b/i.test(s) ||
    /\bscale\b\s+(?:the\s+)?(?:(?:Meta|TikTok)\s+)?(?:ads?|campaigns?|budgets?|ad spend)\b/i.test(s) ||
    /\b(ads?|campaigns?|budgets?|ad spend)\b.{0,80}\b(scale|pause|stop|increase|decrease|change|edit)\b/i.test(s)
  ) {
    return true;
  }

  // Courier/order/routing operational changes.
  if (
    /\b(reroute|reassign|switch|assign|pause|stop|change)\b.{0,100}\b(couriers?|routing|shipments?|orders?|drivers?)\b/i.test(s)
  ) {
    return true;
  }

  // Money movement / refunds / payments.
  return /\b(pay|refund|release|move|transfer)\b.{0,100}\b(payments?|money|refunds?|cash|funds?)\b/i.test(s);
}


function fctOrbitIsInternalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const genericInternal = (
    /\b(refresh|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,120}\b(data|feed|API|courier view|records?|cohorts?|snapshot|mapping|allocation|reconciliation)\b/i.test(s) ||
    /\b(poll|repoll)\b.{0,100}\b(API|feed|courier view|data|snapshot|Last Mile|C3X|OTO|TFM)\b/i.test(s) ||
    /\b(request|trigger|run)\b.{0,120}\b(API|feed|data|courier view)\b.{0,60}\bpoll\b/i.test(s) ||
    /\b(request|trigger|run)\b.{0,120}\b(Last Mile|C3X|OTO|TFM)\b.{0,80}\bpoll\b/i.test(s) ||
    /\binternally\b.{0,120}\b(refresh|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s) ||
    /\b(refresh|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,120}\b(Last Mile|C3X|OTO|TFM|couriers?|cohorts?)\b/i.test(s) ||
    /\b(Last Mile|C3X|OTO|TFM|couriers?|cohorts?)\b.{0,120}\b(refresh|poll|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s)
  );

  if (!genericInternal) return false;

  const missingTikTokRefresh = (
    fctOrbitTikTokSourceMissing_(packet) &&
    /\bTikTok\b/i.test(s) &&
    /\b(refresh|sync|pull|update|reload|restore|fetch|obtain|get|acquire|integrate|connect|configure|enable|add|ingest|set up)\b/i.test(s) &&
    /\b(feed|spend|data|source|API|connector|active-channel)\b/i.test(s)
  );

  if (!missingTikTokRefresh) return true;

  // If the same sentence also contains a separate internal courier/reconciliation
  // action, preserve the internal signal so mixed-action validation can reject
  // the bundled recommendation instead of silently classifying everything external.
  const separateInternalSignal = (
    /\b(Last Mile|C3X|OTO|TFM|couriers?|cohorts?|reconciliation|mapping|allocation)\b/i.test(s) &&
    /\b(refresh|poll|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse|preserve)\b/i.test(s)
  );

  return separateInternalSignal;
}


function fctOrbitIsPureInternalHold_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const target =
    /\b(conclusion|calculation|decision|go[- ]?no[- ]?go|Real Contribution|Operating Profit|profit|SCALE)\b/i.test(s);

  const holdSignal =
    /\b(hold|keep|maintain|preserve)\b/i.test(s) ||
    /\bHOLD\b/i.test(s);

  return (
    target &&
    holdSignal &&
    !fctOrbitIsExternalApprovalAction_(s, packet)
  );
}


function fctOrbitEscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}


function testFctOrbitDynamicStockSeverityNoApi() {
  const critical = [
    { country: 'United Arab Emirates', sku: 'PLG597' },
    { country: 'United Arab Emirates', sku: 'PLG609' },
    { country: 'Kuwait', sku: 'PLG597' }
  ];

  fctOrbitAssertCriticalCountClaims_(critical, {
    summary: 'Three critical stock rows remain open; Kuwait PLG617 is WATCH at 3.5 days.'
  });

  fctOrbitAssertWatchRowsNotPromoted_(
    [{ country: 'Kuwait', sku: 'PLG617' }],
    { summary: 'Kuwait PLG617 is WATCH at 3.5 days.' }
  );

  let watchCaught = false;
  try {
    fctOrbitAssertWatchRowsNotPromoted_(
      [{ country: 'Kuwait', sku: 'PLG617' }],
      { summary: 'Kuwait PLG617 is CRITICAL at 3.5 days.' }
    );
  } catch (e) {
    watchCaught = /WATCH row PLG617/i.test(String((e && e.message) || e));
  }
  if (!watchCaught) {
    throw new Error('ORBIT watch-severity guard failed.');
  }

  let caught = false;
  try {
    fctOrbitAssertCriticalCountClaims_(critical, {
      recommendations: [{
        action: 'Approve evidence requests for all four critical stock rows.'
      }]
    });
  } catch (e) {
    caught = /packet has 3/i.test(String((e && e.message) || e));
  }
  if (!caught) {
    throw new Error(
      'ORBIT dynamic-stock guard failed to reject stale four-critical claim.'
    );
  }

  fctOrbitAssertStockClassificationStable_(
    {
      critical_keys: [
        'Kuwait|PLG597',
        'United Arab Emirates|PLG597',
        'United Arab Emirates|PLG609'
      ],
      watch_keys: ['Kuwait|PLG617']
    },
    {
      critical_stock: critical,
      watch_stock: [{ country: 'Kuwait', sku: 'PLG617' }]
    }
  );

  Logger.log('ORBIT dynamic stock severity guards PASS');
  return true;
}


function testFctOrbitFreshAuditConsistencyNoApi() {
  const sentinelRun = {
    deterministic_cross_checks: {
      meta_platform_spend_ledger_vs_scale: {
        ledger_aed: 6701.85,
        scale_aed: 6701.85
      },
      meta_platform_spend_ledger_vs_stock: {
        stock_attribution_aed: 6701.85
      },
      meta_country_pending_scale_vs_stock: {
        scale_aed: 34.3,
        stock_aed: 34.3
      },
      courier_receivable_ledger_vs_route: {
        ledger_aed: 24204.73,
        route_normalized_sum_aed: 24204.73
      },
      finalized_delivery_success_ledger_vs_route: {
        ledger: 329 / 391,
        route_normalized: 329 / 391
      },
      tiktok_blocker_consistency: {
        status: 'MATCH'
      }
    },
    result: {
      summary:
        'Critical stock: UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617.',
      findings: [{
        title: 'Critical stock',
        detail:
          'UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 are open.'
      }]
    }
  };

  const ledger = {
    economics: {
      meta_platform_spend_aed: 6701.85,
      courier_receivable_aed: 24204.73,
      finalized_delivery_success: 329 / 391,
      real_contribution_status:
        'BLOCKED_MISSING_TIKTOK_SPEND'
    }
  };

  const scale = {
    meta: { platform_spend_aed: 6701.85 },
    channel_completeness: {
      meta: { country_pending_spend_aed: 34.3 },
      tiktok: { status: 'MISSING_ACTIVE_CHANNEL_SPEND' }
    }
  };

  const route = {
    normalized_order_view: [
      {
        delivered_unpaid: 256,
        paid: 0,
        rrto: 29,
        courier_receivable_aed: 18574.78
      },
      {
        delivered_unpaid: 65,
        paid: 0,
        rrto: 33,
        courier_receivable_aed: 4685.35
      },
      {
        delivered_unpaid: 5,
        paid: 0,
        rrto: 0,
        courier_receivable_aed: 752.62
      },
      {
        delivered_unpaid: 3,
        paid: 0,
        rrto: 0,
        courier_receivable_aed: 191.98
      }
    ]
  };

  const stock = {
    meta_market_attribution: {
      platform_spend_aed: 6701.85,
      country_pending_spend_aed: 34.3
    },
    critical_stock: [
      { country: 'United Arab Emirates', sku: 'PLG597' },
      { country: 'United Arab Emirates', sku: 'PLG609' },
      { country: 'Kuwait', sku: 'PLG597' },
      { country: 'Kuwait', sku: 'PLG617' }
    ]
  };

  fctOrbitAssertFreshAuditConsistency_(
    sentinelRun,
    ledger,
    scale,
    route,
    stock
  );

  const changed = JSON.parse(JSON.stringify(stock));
  changed.meta_market_attribution.platform_spend_aed = 6702.00;

  let caught = false;
  try {
    fctOrbitAssertFreshAuditConsistency_(
      sentinelRun,
      ledger,
      scale,
      route,
      changed
    );
  } catch (e) {
    caught = /STOCK Meta attribution changed/i.test(
      String((e && e.message) || e)
    );
  }

  if (!caught) {
    throw new Error(
      'ORBIT consistency guard failed to catch changed STOCK Meta total.'
    );
  }

  Logger.log('ORBIT fresh-audit consistency guards PASS');
  return true;
}



function testFctOrbitTikTokBypassSemanticsNoApi() {
  const safeNarrative = [
    'Approve acquisition and integration of the missing live TikTok spend source so final SCALE decisions can proceed after valid data is available.',
    'Integrate TikTok spend to unblock final SCALE decisions.',
    'Final SCALE decisions remain HOLD until TikTok spend is live.',
    'Approve TikTok integration; final scaling remains blocked until live spend arrives.',
    'This missing TikTok source blocks SCALE; integration is required to unblock it later.',
    'Once TikTok spend is integrated and valid, final SCALE decisions may proceed.',
    'Approve acquisition and integration of live TikTok active-channel spend.'
  ];

  const unsafeNarrative = [
    'Proceed with final scaling despite missing TikTok spend.',
    'Approve final scaling without TikTok data.',
    'Greenlight SCALE before TikTok spend is integrated.',
    'Scale now even though TikTok spend is unavailable.',
    'Override the TikTok hard blocker.',
    'Allow final scale decisions while TikTok spend is missing.'
  ];

  const safeQuestions = [
    'Do you approve acquisition and integration of the missing live TikTok spend source?',
    'Can final scaling proceed only after TikTok spend is integrated?'
  ];

  const unsafeQuestions = [
    'Can final scaling proceed despite missing TikTok spend?',
    'Should we approve final scaling before TikTok spend is integrated?',
    'Can we override the TikTok blocker?'
  ];

  safeNarrative.forEach(function(s) {
    if (fctOrbitAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'fctOrbit TikTok guard false-positive SAFE narrative: ' + s
      );
    }
  });

  unsafeNarrative.forEach(function(s) {
    if (!fctOrbitAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'fctOrbit TikTok guard false-negative UNSAFE narrative: ' + s
      );
    }
  });

  safeQuestions.forEach(function(s) {
    if (fctOrbitQuestionAsksTikTokBypass_(s)) {
      throw new Error(
        'fctOrbit TikTok question guard false-positive SAFE question: ' + s
      );
    }
  });

  unsafeQuestions.forEach(function(s) {
    if (!fctOrbitQuestionAsksTikTokBypass_(s)) {
      throw new Error(
        'fctOrbit TikTok question guard false-negative UNSAFE question: ' + s
      );
    }
  });

  Logger.log('fctOrbit TikTok bypass semantics PASS');
  return true;
}


function testFctOrbitGovernanceGuardsNoApi() {
  testFctOrbitTikTokBypassSemanticsNoApi();

  const packet = {
    route: {
      last_mile: {
        freshness_status: 'STALE_REVIEW',
        finalized_success: 0.641
      }
    },
    scale: {
      channel_completeness: {
        tiktok: {
          status: 'MISSING_ACTIVE_CHANNEL_SPEND'
        }
      }
    },
    sentinel_audit: {
      audit_status: 'FAIL',
      severity: 'CRITICAL',
      source_freshness: 'MIXED',
      confidence: 'MEDIUM',
      provisional_fields: ['tiktok_spend']
    },
    stock: {
      critical_stock: [
        { country: 'United Arab Emirates', sku: 'PLG597' },
        { country: 'United Arab Emirates', sku: 'PLG609' },
        { country: 'Kuwait', sku: 'PLG597' },
        { country: 'Kuwait', sku: 'PLG617' }
      ]
    }
  };

  const safeResult = {
    agent_id: 'AG002',
    audit_status: 'PASS_WITH_WARNING',
    severity: 'ACT_NOW',
    source_freshness: 'FRESH',
    confidence: 'HIGH',
    provisional_fields: [],
    summary:
      'Final SCALE remains HOLD until TikTok spend arrives. Critical stock: UAE PLG597 and UAE PLG609; Kuwait PLG597 and Kuwait PLG617. Last Mile is STALE/REVIEW at 64.1%, so exact current counts are not confirmed. TFM/OTO screening gaps are unconfirmed pending settlement evidence.',
    findings: [
      {
        title: 'Locked blockers',
        detail: 'TikTok spend missing keeps final profit and scale decisions blocked.'
      },
      {
        title: 'Critical stock',
        detail: 'UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 remain material physical stock risks.'
      },
      {
        title: 'Last Mile stale risk',
        detail: 'Last Mile is STALE/REVIEW; 64.1% is not a fresh/current figure.'
      }
    ],
    recommendations: [
      {
        action: 'Hold final SCALE decisions until TikTok spend is available.',
        why: 'Locked active-channel blocker.',
        approval_required: true
      },
      {
        action: 'Refresh the Last Mile API data feed internally.',
        why: 'Stale operational view.',
        approval_required: true
      },
      {
        action: 'Request TFM remittance statement from the courier.',
        why: 'Settlement evidence is external.',
        approval_required: false
      }
    ],
    questions_for_abid: [
      'Can Finance request the TFM settlement statement?'
    ],
    approval_required: false
  };

  const enforced = fctOrbitEnforceGovernance_(safeResult, packet);

  if (enforced.recommendations[0].approval_required !== false) {
    throw new Error('ORBIT guard failed: pure HOLD must be approval=false.');
  }

  if (enforced.recommendations[1].approval_required !== false) {
    throw new Error('ORBIT guard failed: internal refresh must be approval=false.');
  }

  if (enforced.recommendations[2].approval_required !== true) {
    throw new Error('ORBIT guard failed: external courier request must be approval=true.');
  }

  if (enforced.approval_required !== true) {
    throw new Error('ORBIT guard failed: overall approval must reflect external recommendation.');
  }

  const actualOutputCase = fctOrbitEnforceGovernance_({
    agent_id: 'AG002',
    severity: 'CRITICAL',
    audit_status: 'FAIL',
    source_freshness: 'MIXED',
    summary:
      'Final SCALE remains HOLD. UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 are critical.',
    findings: [
      {
        title: 'Critical stock',
        detail:
          'UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 are critical.'
      }
    ],
    recommendations: [
      {
        action:
          'Maintain the locked profit/SCALE HOLD and internally refresh Last Mile and unreconciled courier cohorts.',
        approval_required: true
      },
      {
        action:
          'Approve acquisition and integration of live TikTok active-channel spend.',
        approval_required: false
      },
      {
        action:
          'Approve supplier/inventory evidence requests for all four critical stock rows, without PO or replenishment commitment.',
        approval_required: false
      }
    ],
    questions_for_abid: [],
    approval_required: false,
    confidence: 'MEDIUM',
    provisional_fields: []
  }, packet);

  if (actualOutputCase.recommendations[0].approval_required !== false) {
    throw new Error(
      'ORBIT regression failed: actual HOLD + internal courier cohorts action must be approval=false.'
    );
  }

  if (actualOutputCase.recommendations[1].approval_required !== true) {
    throw new Error(
      'ORBIT regression failed: TikTok acquisition/integration must be approval=true.'
    );
  }

  if (actualOutputCase.recommendations[2].approval_required !== true) {
    throw new Error(
      'ORBIT regression failed: supplier/inventory evidence request must be approval=true.'
    );
  }

  if (enforced.audit_status !== 'FAIL') {
    throw new Error('ORBIT guard failed: SENTINEL FAIL must remain FAIL.');
  }

  if (enforced.severity !== 'CRITICAL') {
    throw new Error('ORBIT guard failed: severity cannot be below SENTINEL CRITICAL.');
  }

  if (enforced.source_freshness !== 'MIXED') {
    throw new Error('ORBIT guard failed: source freshness cannot exceed SENTINEL MIXED.');
  }

  if (enforced.confidence !== 'MEDIUM') {
    throw new Error('ORBIT guard failed: confidence cannot exceed SENTINEL MEDIUM.');
  }

  if (enforced.provisional_fields.indexOf('tiktok_spend') < 0) {
    throw new Error('ORBIT guard failed: SENTINEL provisional fields must be inherited.');
  }

  if (fctOrbitMakesMarketMetaStockPrereq_(
        'Kuwait Meta linkage is not required before replenishment; it is for ad-activity classification only.'
      )) {
    throw new Error('ORBIT guard false-positive: safe Kuwait Meta wording.');
  }

  if (!fctOrbitMakesMarketMetaStockPrereq_(
        'For Kuwait PLG617, Meta linkage is required before replenishment.'
      )) {
    throw new Error('ORBIT guard false-negative: unsafe Kuwait Meta wording.');
  }

  const tiktokStateAwareCases = {
    externalWhenMissing: [
      'Refresh the TikTok spend feed.',
      'Sync TikTok active-channel spend data.',
      'Fetch TikTok spend from the missing feed.',
      'Integrate the TikTok spend feed.'
    ],
    safeHoldOnly: [
      'Hold final SCALE until TikTok spend is available.',
      'Maintain the SCALE HOLD until TikTok feed is integrated.'
    ],
    internalCourier: [
      'Refresh the Last Mile API feed.',
      'Request a fresh Last Mile poll.'
    ]
  };

  tiktokStateAwareCases.externalWhenMissing.forEach(function(s) {
    if (!fctOrbitIsExternalApprovalAction_(s, packet)) {
      throw new Error(
        'ORBIT TikTok missing-source classifier false-negative: ' + s
      );
    }
  });

  tiktokStateAwareCases.safeHoldOnly.forEach(function(s) {
    if (fctOrbitIsExternalApprovalAction_(s, packet)) {
      throw new Error(
        'ORBIT TikTok HOLD classifier false-positive: ' + s
      );
    }
  });

  tiktokStateAwareCases.internalCourier.forEach(function(s) {
    if (fctOrbitIsExternalApprovalAction_(s, packet) ||
        !fctOrbitIsInternalAction_(s, packet)) {
      throw new Error(
        'ORBIT courier-refresh classifier failed: ' + s
      );
    }
  });

  const readyTikTokPacket = JSON.parse(JSON.stringify(packet));
  readyTikTokPacket.scale.channel_completeness.tiktok.status = 'READY';

  if (fctOrbitIsExternalApprovalAction_(
        'Refresh the TikTok spend feed internally.',
        readyTikTokPacket
      )) {
    throw new Error(
      'ORBIT TikTok state classifier failed: routine refresh of an existing READY feed must not be external.'
    );
  }

  if (!fctOrbitIsInternalAction_(
        'Refresh the TikTok spend feed internally.',
        readyTikTokPacket
      )) {
    throw new Error(
      'ORBIT TikTok state classifier failed: routine refresh of an existing READY feed must be internal.'
    );
  }

  const orbitApprovalRegressionCases = {
    internal: [
      'Maintain the locked profit/SCALE HOLD and internally refresh Last Mile and unreconciled courier cohorts.',
      'Refresh unreconciled courier cohorts internally.'
    ],
    external: [
      'Approve acquisition and integration of live TikTok active-channel spend.',
      'Integrate the TikTok spend feed.',
      'Scale the Meta ad campaign.',
      'Request TFM settlement statement from the courier.'
    ]
  };

  orbitApprovalRegressionCases.internal.forEach(function(s) {
    if (fctOrbitIsExternalApprovalAction_(s, packet)) {
      throw new Error(
        'ORBIT approval classifier false-positive external: ' + s
      );
    }
    if (!fctOrbitIsInternalAction_(s, packet) &&
        !fctOrbitIsPureInternalHold_(s, packet)) {
      throw new Error(
        'ORBIT approval classifier failed to recognize internal action: ' + s
      );
    }
  });

  orbitApprovalRegressionCases.external.forEach(function(s) {
    if (!fctOrbitIsExternalApprovalAction_(s, packet)) {
      throw new Error(
        'ORBIT approval classifier false-negative external: ' + s
      );
    }
  });

  // Regression from the real V3 output: missing TikTok source + Last Mile poll
  // must be recognized as mixed external/internal and rejected as one recommendation.
  const v3MixedAction =
    'Maintain the profit/SCALE HOLD; refresh the TikTok spend feed and Last Mile poll, then preserve separate courier cohorts during review.';

  if (!fctOrbitIsExternalApprovalAction_(v3MixedAction, packet)) {
    throw new Error(
      'ORBIT regression failed: refreshing a missing TikTok feed must require approval.'
    );
  }

  if (!fctOrbitIsInternalAction_(v3MixedAction, packet)) {
    throw new Error(
      'ORBIT regression failed: Last Mile poll portion must still be recognized as internal.'
    );
  }

  let mixedRejected = false;
  try {
    fctOrbitEnforceGovernance_({
      agent_id: 'AG002',
      audit_status: 'FAIL',
      severity: 'ACT_NOW',
      source_freshness: 'MIXED',
      confidence: 'MEDIUM',
      provisional_fields: [],
      summary:
        'SENTINEL FAIL preserved. Final SCALE remains HOLD. UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 are critical. Last Mile is stale.',
      findings: [{
        title: 'Critical stock',
        detail:
          'UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 are critical.'
      }],
      recommendations: [{
        action: v3MixedAction,
        approval_required: false
      }],
      questions_for_abid: [],
      approval_required: false
    }, packet);
  } catch (e) {
    mixedRejected = /internal and external actions must be split/i.test(
      String((e && e.message) || e)
    );
  }

  if (!mixedRejected) {
    throw new Error(
      'ORBIT regression failed: V3 mixed TikTok/Last Mile recommendation was not rejected.'
    );
  }

  const tikTokHoldOnly =
    'Maintain the final SCALE HOLD until TikTok spend is integrated.';

  if (fctOrbitIsExternalApprovalAction_(tikTokHoldOnly, packet)) {
    throw new Error(
      'ORBIT regression failed: HOLD-only TikTok wording must not require approval.'
    );
  }

  const externalClassifierCases = [
    'Request inbound ETA evidence from suppliers.',
    'Initiate replenishment sourcing for UAE PLG597.',
    'Request TFM remittance statement from the courier.'
  ];

  externalClassifierCases.forEach(function(s) {
    if (!fctOrbitIsExternalApprovalAction_(s, packet)) {
      throw new Error(
        'ORBIT external-action guard false-negative: ' + s
      );
    }
  });

  const internalClassifierCases = [
    'Request a fresh Last Mile API poll.',
    'Refresh the Last Mile courier view data internally.',
    'Reconcile the Meta country allocation internally.'
  ];

  internalClassifierCases.forEach(function(s) {
    if (fctOrbitIsExternalApprovalAction_(s, packet) ||
        !fctOrbitIsInternalAction_(s, packet)) {
      throw new Error(
        'ORBIT internal-action classifier failed: ' + s
      );
    }
  });

  const lastMileSafePhrases = [
    'Request a fresh Last Mile API poll.',
    'Trigger a fresh internal Last Mile courier API poll before operational reliance.',
    'Obtain current Last Mile data before making a courier decision.',
    'Refresh Last Mile data and recheck the gate.',
    'The Last Mile poll is stale; exact current performance is low confidence.',
    'Last Mile is STALE/REVIEW at 64.1%.',
    'The latest Last Mile poll is stale and cannot be treated as current.'
  ];

  lastMileSafePhrases.forEach(function(s) {
    if (fctOrbitMisstatesLastMileFreshness_(s, packet)) {
      throw new Error(
        'ORBIT Last Mile freshness guard false-positive: ' + s
      );
    }
  });

  const lastMileUnsafePhrases = [
    'Last Mile is current at 64.1%.',
    'Last Mile is fresh and running at 64.1%.',
    'Fresh Last Mile data shows delivery success below the gate.',
    'The current Last Mile poll reports 64.1%.',
    'Last Mile reported 64.1%.'
  ];

  lastMileUnsafePhrases.forEach(function(s) {
    if (!fctOrbitMisstatesLastMileFreshness_(s, packet)) {
      throw new Error(
        'ORBIT Last Mile freshness guard false-negative: ' + s
      );
    }
  });

  const unsafeCases = [
    {
      label: 'TikTok bypass',
      mutate: function(r) {
        r.summary = 'Proceed with final scaling despite missing TikTok spend.';
      },
      expected: /TikTok blocker/i
    },
    {
      label: 'Last Mile freshness',
      mutate: function(r) {
        r.summary = 'Last Mile is current at 64.1%.';
      },
      expected: /Last Mile data/i
    },
    {
      label: 'TFM shortage assertion',
      mutate: function(r) {
        r.summary = 'TFM has a confirmed AED 26,074.57 shortage.';
      },
      expected: /screening difference/i
    },
    {
      label: 'Critical stock omission',
      mutate: function(r) {
        r.summary = 'Critical stock: UAE PLG597, Kuwait PLG597, Kuwait PLG617.';
        r.findings = [{
          title: 'Critical stock',
          detail: 'UAE PLG597, Kuwait PLG597 and Kuwait PLG617 are critical.'
        }];
      },
      expected: /PLG609/i
    }
  ];

  unsafeCases.forEach(function(tc) {
    const clone = JSON.parse(JSON.stringify(safeResult));
    tc.mutate(clone);
    let caught = false;

    try {
      fctOrbitEnforceGovernance_(clone, packet);
    } catch (e) {
      caught = tc.expected.test(String((e && e.message) || e));
    }

    if (!caught) {
      throw new Error(
        'ORBIT governance guard failed to catch: ' + tc.label
      );
    }
  });

  const mixed = JSON.parse(JSON.stringify(safeResult));
  mixed.recommendations[0] = {
    action:
      'Refresh Last Mile API data and request TFM remittance statement from the courier.',
    why: 'Mixed action test.',
    approval_required: true
  };

  let mixedCaught = false;
  try {
    fctOrbitEnforceGovernance_(mixed, packet);
  } catch (e) {
    mixedCaught = /internal and external actions must be split/i
      .test(String((e && e.message) || e));
  }

  if (!mixedCaught) {
    throw new Error(
      'ORBIT governance guard failed to reject mixed internal/external recommendation.'
    );
  }

  Logger.log('ORBIT governance guards PASS');
  return true;
}
