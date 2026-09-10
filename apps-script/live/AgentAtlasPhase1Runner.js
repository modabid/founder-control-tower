/**
 * Founder Control Tower — Step 6K
 * AG001 ATLAS — Phase-1 Founder Agent / Founder Brief.
 *
 * ISOLATED VALIDATION PATH:
 *   Fresh deterministic snapshots
 *   -> SENTINEL audit
 *   -> ORBIT supervisor synthesis
 *   -> ATLAS founder brief
 *
 * runFctOrbitPhase1AI() owns SENTINEL -> ORBIT validation.
 * ATLAS adds the second and final hierarchy synthesis pass after ORBIT.
 *
 * ADDITIVE FILE ONLY.
 * No sheet writes.
 * No operational execution.
 * No external actions.
 */

function runFctAtlasPhase1AI() {
  // ORBIT runs the latest SENTINEL audit first and returns only after its
  // own lock is released, avoiding nested-lock deadlocks.
  const orbitRun = runFctOrbitPhase1AI();

  if (!orbitRun || orbitRun.status !== 'SUCCESS' ||
      !orbitRun.result || orbitRun.result.agent_id !== 'AG002') {
    throw new Error(
      'ATLAS prerequisite failed: latest ORBIT supervisor brief is unavailable or invalid.'
    );
  }

  const packet = fctBuildAtlasPhase1Packet_(orbitRun);
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error(
      'Another Founder Control Tower AI run is already in progress.'
    );
  }

  const runId = fctRunId_();

  try {
    const task = [
      'Act as AG001 ATLAS, the Founder Control Tower Founder Agent.',
      'Convert the supplied audited ORBIT supervisor packet into the shortest useful founder brief for Abid.',
      'This is the final synthesis layer. Do not reopen deterministic arithmetic, create new source truth, or weaken SENTINEL/ORBIT evidence gates.',
      'The runtime will prepend a deterministic GROUP PULSE to your summary after validation. Do not recalculate or duplicate the full pulse; use your summary for the decision narrative.',
      'Source precedence is deterministic source/control data, deterministic cross-checks, SENTINEL audit inherited through ORBIT, ORBIT supervisor brief, then ATLAS interpretation.',
      'If ORBIT audit_status is FAIL, ATLAS audit_status must remain FAIL. If ORBIT preserves HOLD, ATLAS cannot turn it into a provisional GO.',
      'Missing live TikTok spend is a locked active-channel blocker. Final Real Contribution, Operating Profit, and final SCALE go/no-go decisions remain HOLD until valid TikTok spend exists. Never ask whether this rule should be bypassed or relaxed.',
      'Do not state a numeric Real Contribution or numeric Operating Profit while their deterministic statuses are blocked. Contribution-after-Meta before TikTok is not Real Contribution.',
      'Meta platform spend, courier receivable, finalized delivery success, and TikTok-blocker deterministic cross-checks currently MATCH. Preserve them; do not invent a discrepancy.',
      'Every row in phase1_founder_packet.critical_stock must remain visible as CRITICAL/OUT_OF_STOCK. Rows in phase1_founder_packet.watch_stock remain WATCH; never promote a WATCH row to CRITICAL because of an older brief or prior run.',
      'Market-specific Meta activity is proven only when known_market_meta_spend_aed > 0 for that exact country+SKU. Do not infer market activity from SKU-total spend or GROUP product economics.',
      'Missing market-specific Meta linkage affects ad classification only and does not erase deterministic physical stock risk.',
      'There is no reliable open PO/ETA/MOQ/supplier lead-time pipeline. Do not invent inbound quantities, reorder quantity, ETA, MOQ, supplier lead time, or cash commitment.',
      'Last Mile is a real operating risk below the 70% finalized-delivery gate, but the supplied reading is STALE/REVIEW. Any reference to its rate/counts must explicitly preserve the stale qualifier. A request for a future fresh internal API poll is allowed and does not mean current data is fresh.',
      'TFM/OTO screening differences are unconfirmed until remittance/settlement evidence exists. C3X June settlement is matched. Never call TFM/OTO a confirmed shortage, loss, debt, theft, or missing cash.',
      'Keep courier operational, normalized, financial, and settlement cohorts separate unless reconciled.',
      'Founder output should take roughly 2–3 minutes to read and contain only material issues, holds, opportunities, and decisions.',
      'Do not force an OPPORTUNITY if no opportunity is decision-ready. A provisional Meta-positive SKU is not a final scale opportunity while TikTok is missing.',
      'Maximum 4 findings. Maximum 3 recommendations. Maximum 3 questions_for_abid.',
      'Recommendations are the CEO PRIORITIES TODAY. Rank the highest-impact founder decisions first.',
      'Do not bundle internal no-approval work with an external approval-required action in one recommendation.',
      'Internal HOLD/reconciliation/data/API repoll may use approval_required=false. External contact, supplier/courier evidence request, TikTok source acquisition/integration, ad/courier/order/stock/payment change, PO/replenishment commitment, or money movement requires approval_required=true.',
      'TikTok source is currently MISSING, so acquiring/integrating/restoring it is not an internal refresh and requires founder approval.',
      'questions_for_abid may ask only for explicit approvals or genuinely missing evidence. Never renegotiate locked rules.',
      'Do not execute, imply execution, write to sheets, contact anyone, change systems, or commit money.',
      'Return a decisive founder-level brief, not a technical audit dump.'
    ].join(' ');

    const context = {
      phase1_founder_packet: packet,
      governance: {
        mode: 'FOUNDER_BRIEF_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        reporting_chain:
          'LEDGER/SCALE/ROUTE/STOCK -> SENTINEL -> ORBIT -> ATLAS -> Abid',
        source_precedence: [
          'DETERMINISTIC_SOURCE_AND_CONTROL_DATA',
          'DETERMINISTIC_CROSS_CHECKS',
          'SENTINEL_AUDIT',
          'ORBIT_SUPERVISOR_BRIEF',
          'ATLAS_INTERPRETATION'
        ],
        max_hierarchy_passes: 2
      },
      phase_note:
        'Step 6K isolated ATLAS validation. ORBIT invokes the latest SENTINEL audit. Specialist AI runtimes are already individually locked; the final integrated orchestrator will pass their actual briefs without duplicate specialist calls.'
    };

    const aiRun = fctRunAgent_(
      'AG001',
      task,
      context,
      'STANDARD',
      runId
    );

    if (!aiRun || !aiRun.result) {
      throw new Error(
        'ATLAS AI runtime returned no structured result.'
      );
    }

    if (aiRun.result.agent_id !== 'AG001') {
      throw new Error(
        'ATLAS identity contract failed: ' +
        String(aiRun.result.agent_id || '')
      );
    }

    aiRun.result = fctAtlasEnforceGovernance_(
      aiRun.result,
      packet
    );

    aiRun.result.summary = [
      fctAtlasBuildFounderPulse_(packet),
      String(aiRun.result.summary || '').trim()
    ].filter(Boolean).join(' | ');

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG001',
      orbit_run_id: orbitRun.run_id,
      sentinel_run_id: orbitRun.sentinel_run_id,
      packet_status: packet.overall_source_status,
      runtime: aiRun.runtime,
      deterministic_group_pulse: packet.group_pulse,
      deterministic_cross_checks:
        packet.deterministic_cross_checks,
      stock_classification:
        fctAtlasStockClassification_(packet),
      result: aiRun.result
    };

    Logger.log(JSON.stringify(output, null, 2));
    return output;

  } finally {
    lock.releaseLock();
  }
}


function testFctAtlasPhase1AI() {
  return runFctAtlasPhase1AI();
}


function testFctAtlasPacketNoApi() {
  throw new Error(
    'ATLAS packet requires a fresh ORBIT result. Use testFctAtlasPhase1AI(); isolated no-API packet construction is intentionally unsupported.'
  );
}


function fctBuildAtlasPhase1Packet_(orbitRun) {
  const ledger = fctBuildLedgerSnapshot_();
  const scale = fctBuildScaleSnapshot_();
  const route = fctBuildRouteSnapshot_();
  const stock = fctBuildStockSnapshot_();

  fctAtlasAssertOrbitConsistency_(
    orbitRun,
    ledger,
    scale,
    route,
    stock
  );

  const lastMile = (route.live_courier_view || [])
    .find(function(x) {
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

  const criticalStock = (stock.critical_stock || [])
    .map(function(x) {
      return {
        country: x.country,
        sku: x.sku,
        product: x.product,
        available_stock: x.available_stock,
        demand_velocity_used: x.demand_velocity_used,
        available_stock_days: x.available_stock_days,
        stock_gate: x.stock_gate,
        priority: x.priority,
        known_market_meta_spend_aed:
          x.known_market_meta_spend_aed,
        reconciliation_gate: x.reconciliation_gate
      };
    });

  const watchStock = (stock.watch_stock || []).slice(0, 8)
    .map(function(x) {
      return {
        country: x.country,
        sku: x.sku,
        product: x.product,
        available_stock: x.available_stock,
        demand_velocity_used: x.demand_velocity_used,
        available_stock_days: x.available_stock_days,
        stock_gate: x.stock_gate,
        priority: x.priority,
        known_market_meta_spend_aed:
          x.known_market_meta_spend_aed,
        reconciliation_gate: x.reconciliation_gate
      };
    });

  const topPositive = (
    scale.provisional_product_rankings.positive_after_meta || []
  ).slice(0, 5).map(function(x) {
    return {
      sku: x.sku,
      total_orders: x.total_orders,
      delivery_success: x.delivery_success,
      contribution_after_meta_aed:
        x.contribution_after_meta_aed,
      profit_per_delivered_after_meta_aed:
        x.profit_per_delivered_after_meta_aed,
      stock_gate: x.stock_gate,
      mapping_gate: x.mapping_gate,
      provisional_blockers: x.provisional_blockers,
      final_scale_decision_ready:
        x.final_scale_decision_ready,
      pnl_status: x.pnl_status
    };
  });

  const sourceStatuses = {
    ledger: ledger.data_quality.status,
    scale: scale.data_quality.status,
    route: route.data_quality.status,
    stock: stock.data_quality.status,
    orbit: orbitRun.result.audit_status
  };

  const anyFail = Object.keys(sourceStatuses)
    .some(function(k) {
      return String(sourceStatuses[k]).toUpperCase() === 'FAIL';
    });

  const anyReview = Object.keys(sourceStatuses)
    .some(function(k) {
      return /REVIEW|WARNING/i.test(String(sourceStatuses[k]));
    });

  return {
    contract_version: '1.0',
    packet_for: 'AG001',
    generated_at: new Date().toISOString(),
    overall_source_status:
      anyFail ? 'FAIL' : (anyReview ? 'REVIEW' : 'PASS'),
    source_statuses: sourceStatuses,

    deterministic_cross_checks:
      orbitRun.deterministic_cross_checks || {},

    orbit_brief: {
      run_id: orbitRun.run_id,
      sentinel_run_id: orbitRun.sentinel_run_id,
      audit_status: orbitRun.result.audit_status,
      severity: orbitRun.result.severity,
      source_freshness: orbitRun.result.source_freshness,
      summary: orbitRun.result.summary,
      findings: orbitRun.result.findings,
      recommendations: orbitRun.result.recommendations,
      approval_required: orbitRun.result.approval_required,
      questions_for_abid:
        orbitRun.result.questions_for_abid,
      confidence: orbitRun.result.confidence,
      provisional_fields:
        orbitRun.result.provisional_fields,
      next_check: orbitRun.result.next_check
    },

    group_pulse: {
      period_month: ledger.period.month,
      as_of_date: ledger.period.today,
      daily_pnl_latest_date:
        ledger.period.daily_pnl_latest_date,
      meta_latest_date:
        ledger.period.meta_latest_date,
      orders_picked_mtd:
        ledger.economics.orders_picked_mtd,
      delivered_unpaid_mtd:
        ledger.economics.delivered_unpaid_mtd,
      paid_mtd:
        ledger.economics.paid_mtd,
      rrto_mtd:
        ledger.economics.rrto_mtd,
      finalized_delivery_success:
        ledger.economics.finalized_delivery_success,
      delivered_revenue_aed:
        ledger.economics.delivered_revenue_aed,
      gross_contribution_aed:
        ledger.economics.gross_contribution_aed,
      meta_platform_spend_aed:
        ledger.economics.meta_platform_spend_aed,
      contribution_after_all_meta_aed:
        ledger.economics.contribution_after_all_meta_aed,
      tiktok_spend_aed:
        ledger.economics.tiktok_spend_aed,
      real_contribution_profit_aed:
        ledger.economics.real_contribution_profit_aed,
      real_contribution_status:
        ledger.economics.real_contribution_status,
      real_operating_profit_aed:
        ledger.economics.real_operating_profit_aed,
      real_operating_profit_status:
        ledger.economics.real_operating_profit_status,
      courier_receivable_aed:
        ledger.economics.courier_receivable_aed,
      monthly_fixed_cost_baseline_aed:
        ledger.economics.monthly_fixed_cost_baseline_aed
    },

    critical_stock: criticalStock,
    watch_stock: watchStock,

    last_mile: lastMile ? {
      finalized_success: lastMile.finalized_success,
      scale_gate_status: lastMile.scale_gate_status,
      freshness_status: lastMile.freshness_status,
      poll_age_hours: lastMile.poll_age_hours,
      reconciliation_status: lastMile.reconciliation_status
    } : null,

    settlement_reviews: settlementReviews,

    scale_signals: {
      positive_after_meta_provisional: topPositive,
      tiktok_status:
        scale.channel_completeness.tiktok.status,
      meta_country_pending_spend_aed:
        scale.channel_completeness.meta.country_pending_spend_aed
    },

    stock_inbound_visibility:
      stock.inbound_visibility,

    locked_rules: {
      tiktok:
        'Missing active-channel TikTok spend blocks final Real Contribution, Operating Profit and final SCALE decisions.',
      delivery_success:
        '(Delivered + Paid)/(Delivered + Paid + RRTO), terminal outcomes only.',
      paid:
        'Paid means COD remittance received; Delivered does not imply Paid.',
      inventory:
        'Physical available stock is authoritative; RRTO is unavailable until physically received; velocity=max(7d,14d).',
      hierarchy:
        'SENTINEL/ORBIT evidence gates cannot be weakened by ATLAS. ATLAS is the final synthesis layer only.'
    }
  };
}


function fctAtlasAssertOrbitConsistency_(
  orbitRun,
  ledger,
  scale,
  route,
  stock
) {
  const checks = orbitRun.deterministic_cross_checks || {};

  const metaLS = checks.meta_platform_spend_ledger_vs_scale || {};
  const metaLSt = checks.meta_platform_spend_ledger_vs_stock || {};
  const pending = checks.meta_country_pending_scale_vs_stock || {};
  const recv = checks.courier_receivable_ledger_vs_route || {};
  const delivery = checks.finalized_delivery_success_ledger_vs_route || {};
  const tiktok = checks.tiktok_blocker_consistency || {};

  fctAtlasAssertNear_(
    ledger.economics.meta_platform_spend_aed,
    metaLS.ledger_aed,
    0.01,
    'LEDGER Meta spend changed after ORBIT'
  );

  fctAtlasAssertNear_(
    scale.meta.platform_spend_aed,
    metaLS.scale_aed,
    0.01,
    'SCALE Meta spend changed after ORBIT'
  );

  fctAtlasAssertNear_(
    stock.meta_market_attribution.platform_spend_aed,
    metaLSt.stock_attribution_aed,
    0.01,
    'STOCK Meta attribution changed after ORBIT'
  );

  fctAtlasAssertNear_(
    scale.channel_completeness.meta.country_pending_spend_aed,
    pending.scale_aed,
    0.01,
    'SCALE country-pending Meta changed after ORBIT'
  );

  fctAtlasAssertNear_(
    stock.meta_market_attribution.country_pending_spend_aed,
    pending.stock_aed,
    0.01,
    'STOCK country-pending Meta changed after ORBIT'
  );

  fctAtlasAssertNear_(
    ledger.economics.courier_receivable_aed,
    recv.ledger_aed,
    0.01,
    'LEDGER courier receivable changed after ORBIT'
  );

  const routeReceivable = (route.normalized_order_view || [])
    .reduce(function(sum, x) {
      return sum + Number((x && x.courier_receivable_aed) || 0);
    }, 0);

  fctAtlasAssertNear_(
    routeReceivable,
    recv.route_normalized_sum_aed,
    0.01,
    'ROUTE normalized courier receivable changed after ORBIT'
  );

  fctAtlasAssertNear_(
    ledger.economics.finalized_delivery_success,
    delivery.ledger,
    0.0001,
    'LEDGER finalized delivery success changed after ORBIT'
  );

  let success = 0;
  let rrto = 0;
  (route.normalized_order_view || []).forEach(function(x) {
    success += Number((x && x.delivered_unpaid) || 0) +
      Number((x && x.paid) || 0);
    rrto += Number((x && x.rrto) || 0);
  });

  const routeSuccess = (success + rrto) > 0
    ? success / (success + rrto)
    : null;

  fctAtlasAssertNear_(
    routeSuccess,
    delivery.route_normalized,
    0.0001,
    'ROUTE finalized delivery success changed after ORBIT'
  );

  const currentTikTokBlocked =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(ledger.economics.real_contribution_status || '')
    ) &&
    /MISSING_ACTIVE_CHANNEL_SPEND/i.test(
      String(scale.channel_completeness.tiktok.status || '')
    );

  if (String(tiktok.status || '').toUpperCase() === 'MATCH' &&
      !currentTikTokBlocked) {
    throw new Error(
      'ATLAS prerequisite consistency failed: TikTok blocker state changed after ORBIT; rerun the chain.'
    );
  }

  fctAtlasAssertStockClassificationStable_(
    orbitRun.stock_classification || null,
    stock
  );

  fctAtlasAssertCriticalStockCoverage_(
    stock.critical_stock || [],
    orbitRun.result || {}
  );

  return true;
}


function fctAtlasAssertNear_(actual, expected, tolerance, label) {
  const a = Number(actual);
  const e = Number(expected);

  if (!isFinite(a) || !isFinite(e) ||
      Math.abs(a - e) > Number(tolerance || 0)) {
    throw new Error(
      'ATLAS prerequisite consistency failed: ' + label +
      '. ORBIT/current snapshot mismatch; rerun the chain.'
    );
  }
}


function fctAtlasEnforceGovernance_(result, packet) {
  if (!result || typeof result !== 'object') {
    throw new Error(
      'ATLAS governance enforcement failed: invalid result object.'
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
      'ATLAS output contract failed: material severity with no findings.'
    );
  }

  if (Array.isArray(result.findings) &&
      result.findings.length > 4) {
    throw new Error(
      'ATLAS output contract failed: maximum 4 findings allowed.'
    );
  }

  if (Array.isArray(result.recommendations) &&
      result.recommendations.length > 3) {
    throw new Error(
      'ATLAS output contract failed: maximum 3 recommendations allowed.'
    );
  }

  if (Array.isArray(result.questions_for_abid) &&
      result.questions_for_abid.length > 3) {
    throw new Error(
      'ATLAS output contract failed: maximum 3 founder questions allowed.'
    );
  }

  fctAtlasAssertCriticalStockCoverage_(
    (packet && packet.critical_stock) || [],
    result
  );

  fctAtlasAssertCriticalCountClaims_(
    (packet && packet.critical_stock) || [],
    result
  );

  fctAtlasAssertWatchRowsNotPromoted_(
    (packet && packet.watch_stock) || [],
    result
  );

  const narrative = fctAtlasNarrativeParts_(result);

  narrative.forEach(function(s) {
    if (fctAtlasAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'ATLAS governance contract failed: locked TikTok blocker was weakened or bypassed.'
      );
    }

    if (fctAtlasStatesBlockedProfitAsNumeric_(s, packet)) {
      throw new Error(
        'ATLAS finance contract failed: blocked Real Contribution/Operating Profit was stated as a numeric final value.'
      );
    }

    if (fctAtlasMisstatesLastMileFreshness_(s, packet)) {
      throw new Error(
        'ATLAS data-quality contract failed: stale Last Mile data was presented as fresh/current.'
      );
    }

    if (fctAtlasAssertsUnconfirmedCourierShortage_(s)) {
      throw new Error(
        'ATLAS finance contract failed: TFM/OTO screening difference was presented as confirmed loss/shortage/debt.'
      );
    }

    if (fctAtlasMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'ATLAS stock contract failed: Kuwait Meta linkage was made a prerequisite for physical stock-risk action.'
      );
    }
  });

  const rawQuestions = Array.isArray(result.questions_for_abid)
    ? result.questions_for_abid
    : [];

  result.questions_for_abid = rawQuestions.filter(function(q) {
    const s = String(q || '');
    return !fctAtlasQuestionAsksTikTokBypass_(s) &&
      !fctAtlasMakesMarketMetaStockPrereq_(s);
  }).slice(0, 3);

  const recs = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  recs.forEach(function(rec) {
    const action = String((rec && rec.action) || '');
    const external = fctAtlasIsExternalApprovalAction_(action, packet);
    const internal = fctAtlasIsInternalAction_(action, packet);
    const pureHold = fctAtlasIsPureInternalHold_(action, packet);

    if (external && internal) {
      throw new Error(
        'ATLAS recommendation contract failed: internal and external actions must be split.'
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

  if (result.approval_required &&
      result.questions_for_abid.length === 0) {
    throw new Error(
      'ATLAS founder-decision contract failed: approval-required recommendations exist but no founder approval question was returned.'
    );
  }

  const orbit = (packet && packet.orbit_brief) || {};

  if (String(orbit.audit_status || '').toUpperCase() === 'FAIL') {
    result.audit_status = 'FAIL';
  }

  result.severity = fctAtlasMaxSeverity_(
    result.severity,
    orbit.severity
  );

  const orbitFreshness = String(
    orbit.source_freshness || ''
  ).toUpperCase();

  if (orbitFreshness && orbitFreshness !== 'FRESH') {
    result.source_freshness = orbitFreshness;
  }

  result.confidence = fctAtlasCapConfidence_(
    result.confidence,
    orbit.confidence
  );

  const inheritedProvisional = Array.isArray(
    orbit.provisional_fields
  ) ? orbit.provisional_fields : [];

  const ownProvisional = Array.isArray(
    result.provisional_fields
  ) ? result.provisional_fields : [];

  result.provisional_fields = ownProvisional
    .concat(inheritedProvisional)
    .filter(function(x, i, arr) {
      return arr.indexOf(x) === i;
    });

  return result;
}


function fctAtlasBuildFounderPulse_(packet) {
  const g = (packet && packet.group_pulse) || {};
  const date = String(g.as_of_date || '');
  const pnlDate = String(g.daily_pnl_latest_date || '');

  const realContribution =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_contribution_status || '')
    )
      ? 'BLOCKED (TikTok missing)'
      : fctAtlasMoneyOrUnavailable_(
          g.real_contribution_profit_aed
        );

  const operatingProfit =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_operating_profit_status || '')
    )
      ? 'BLOCKED (TikTok missing)'
      : fctAtlasMoneyOrUnavailable_(
          g.real_operating_profit_aed
        );

  return [
    'FOUNDER CONTROL TOWER — ' + date,
    'GROUP PULSE',
    'Orders ' + fctAtlasInteger_(g.orders_picked_mtd),
    'Final Delivery ' + fctAtlasPercent_(g.finalized_delivery_success),
    'Delivered Revenue AED ' + fctAtlasMoney_(g.delivered_revenue_aed),
    'Gross Contribution AED ' + fctAtlasMoney_(g.gross_contribution_aed),
    'Meta Spend AED ' + fctAtlasMoney_(g.meta_platform_spend_aed),
    'Real Contribution ' + realContribution,
    'Operating Profit ' + operatingProfit,
    'Courier Receivable AED ' + fctAtlasMoney_(g.courier_receivable_aed),
    (pnlDate || g.meta_latest_date)
      ? ('Data Cutoff P&L ' + (pnlDate || 'UNAVAILABLE') +
         ' / Meta ' + String(g.meta_latest_date || 'UNAVAILABLE') +
         '; receivable from current normalized orders')
      : ''
  ].filter(Boolean).join(' | ');
}


function fctAtlasMoneyOrUnavailable_(value) {
  if (value === null || value === undefined || value === '') {
    return 'UNAVAILABLE';
  }

  const n = Number(value);
  return isFinite(n)
    ? ('AED ' + fctAtlasMoney_(n))
    : 'UNAVAILABLE';
}


function fctAtlasMoney_(value) {
  if (value === null || value === undefined || value === '') {
    return 'UNAVAILABLE';
  }

  const n = Number(value);
  if (!isFinite(n)) return 'UNAVAILABLE';

  return n.toFixed(2).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  );
}


function fctAtlasInteger_(value) {
  if (value === null || value === undefined || value === '') {
    return 'UNAVAILABLE';
  }

  const n = Number(value);
  return isFinite(n)
    ? String(Math.round(n))
    : 'UNAVAILABLE';
}


function fctAtlasPercent_(value) {
  const n = Number(value);
  return isFinite(n)
    ? (n * 100).toFixed(2) + '%'
    : 'UNAVAILABLE';
}


function fctAtlasNarrativeParts_(result) {
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


function fctAtlasStockClassification_(packet) {
  return {
    critical_keys: fctAtlasStockKeys_(
      (packet && packet.critical_stock) || []
    ),
    watch_keys: fctAtlasStockKeys_(
      (packet && packet.watch_stock) || []
    )
  };
}


function fctAtlasStockKeys_(rows) {
  return (rows || []).map(function(x) {
    return String((x && x.country) || '').trim() + '|' +
      String((x && x.sku) || '').trim().toUpperCase();
  }).filter(function(x) {
    return x !== '|';
  }).sort();
}


function fctAtlasAssertStockClassificationStable_(prior, stock) {
  if (!prior) return true;
  const current = {
    critical_keys: fctAtlasStockKeys_(
      (stock && stock.critical_stock) || []
    ),
    watch_keys: fctAtlasStockKeys_(
      (stock && stock.watch_stock) || []
    )
  };
  if (JSON.stringify(prior.critical_keys || []) !==
        JSON.stringify(current.critical_keys || []) ||
      JSON.stringify(prior.watch_keys || []) !==
        JSON.stringify(current.watch_keys || [])) {
    throw new Error(
      'ATLAS prerequisite consistency failed: stock severity classification changed after ORBIT; rerun the chain.'
    );
  }
  return true;
}


function fctAtlasAssertCriticalCountClaims_(criticalRows, result) {
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
        'ATLAS stock-severity contract failed: narrative claims ' +
        claimed + ' critical stock rows/risks but deterministic packet has ' +
        actual + '.'
      );
    }
  }
  return true;
}


function fctAtlasAssertWatchRowsNotPromoted_(watchRows, result) {
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
            'ATLAS stock-severity contract failed: WATCH row ' +
            sku + ' was described with a CRITICAL/OOS/ACT_NOW label.'
          );
        }
      }
      pos = upper.indexOf(sku, pos + sku.length);
    }
  });
  return true;
}


function fctAtlasAssertCriticalStockCoverage_(criticalRows, result) {
  const text = [
    String((result && result.summary) || ''),
    JSON.stringify((result && result.findings) || []),
    JSON.stringify((result && result.recommendations) || [])
  ].join(' ');

  const missing = [];

  (criticalRows || []).forEach(function(x) {
    const country = String((x && x.country) || '').trim();
    const sku = String((x && x.sku) || '').trim().toUpperCase();

    if (!country || !sku) return;

    if (!fctAtlasHasCountrySkuMention_(text, country, sku)) {
      missing.push(country + ' ' + sku);
    }
  });

  if (missing.length) {
    throw new Error(
      'ATLAS completeness contract failed: deterministic critical stock omitted from founder brief: ' +
      missing.join(', ')
    );
  }

  return true;
}


function fctAtlasHasCountrySkuMention_(text, country, sku) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const p = String(sku || '').toUpperCase();

  const aliases =
    c.indexOf('united arab emirates') >= 0
      ? ['UAE', 'United Arab Emirates']
      : (c.indexOf('kuwait') >= 0
          ? ['Kuwait', 'KWT']
          : [country]);

  return aliases.some(function(alias) {
    const a = fctAtlasEscapeRegex_(alias);
    const k = fctAtlasEscapeRegex_(p);

    return (
      new RegExp(
        '\\b' + a + '\\b.{0,160}\\b' + k + '\\b',
        'i'
      ).test(s) ||
      new RegExp(
        '\\b' + k + '\\b.{0,160}\\b' + a + '\\b',
        'i'
      ).test(s)
    );
  });
}


function fctAtlasAdvocatesTikTokBypass_(text) {
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



function fctAtlasQuestionAsksTikTokBypass_(text) {
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



function fctAtlasStatesBlockedProfitAsNumeric_(text, packet) {
  const g = (packet && packet.group_pulse) || {};
  const s = String(text || '');

  const realBlocked =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_contribution_status || '')
    );

  const opBlocked =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_operating_profit_status || '')
    );

  const numericReal =
    /\bReal Contribution(?: Profit)?\b\s*(?:(?:is|=|:)\s*)?(?:AED\s*)?-?\d[\d,]*(?:\.\d+)?\b/i.test(s);

  const numericOp =
    /\b(?:Real )?Operating Profit\b\s*(?:(?:is|=|:)\s*)?(?:AED\s*)?-?\d[\d,]*(?:\.\d+)?\b/i.test(s);

  return (realBlocked && numericReal) ||
    (opBlocked && numericOp);
}


function fctAtlasMisstatesLastMileFreshness_(text, packet) {
  const lm = packet && packet.last_mile;
  if (!lm ||
      String(lm.freshness_status || '').toUpperCase() !== 'STALE_REVIEW') {
    return false;
  }

  const s = String(text || '');
  if (!/Last Mile/i.test(s)) return false;

  // Future refresh/poll requests are safe and do not assert current freshness.
  if (
    /\b(refresh|repoll|poll|request|trigger|obtain|get)\b.{0,100}\b(fresh|new|latest|updated)\b.{0,80}\b(Last Mile|poll|data|reading|API|feed)\b/i.test(s) ||
    /\b(fresh|new|latest|updated)\b.{0,50}\b(Last Mile )?(poll|API poll|data poll|reading|feed)\b/i.test(s)
  ) {
    return false;
  }

  // Explicit stale qualification is safe.
  if (
    /\b(stale|STALE_REVIEW|stale-qualified|not current|not fresh|old|aged)\b/i.test(s)
  ) {
    return false;
  }

  return (
    /\bLast Mile\b.{0,100}\b(is|remains|shows|currently|current)\b.{0,80}\b(fresh|current|live|latest|up[- ]?to[- ]?date)\b/i.test(s) ||
    /\b(fresh|current|live|latest|up[- ]?to[- ]?date)\b.{0,80}\bLast Mile\b/i.test(s)
  );
}


function fctAtlasAssertsUnconfirmedCourierShortage_(text) {
  const s = String(text || '');
  if (!/\b(TFM|OTO)\b/i.test(s)) return false;

  if (
    /\b(unconfirmed|screening|review|not confirmed|cannot confirm|pending .*settlement|pending .*remittance|do not treat|not .*shortage|not .*loss)\b/i.test(s)
  ) {
    return false;
  }

  return /\b(shortage|loss|lost|missing cash|theft|stolen|debt|owed|cash missing)\b/i.test(s);
}


function fctAtlasMakesMarketMetaStockPrereq_(text) {
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


function fctAtlasIsExternalApprovalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const tiktokMissing = fctAtlasTikTokSourceMissing_(packet);

  // Missing TikTok source acquisition/integration is governed external/system work.
  if (tiktokMissing && (
      /\b(approve|authorize)\b.{0,120}\b(acquisition|integration|connection|setup|restoration|enablement)\b.{0,120}\bTikTok\b/i.test(s) ||
      /\b(approve|authorize)\b.{0,120}\bTikTok\b.{0,120}\b(acquisition|integration|connection|setup|restoration|enablement)\b/i.test(s) ||
      /\b(refresh|sync|fetch|pull|obtain|acquire|integrate|connect|configure|enable|add|restore|set up|setup|ingest)\b.{0,130}\bTikTok\b.{0,100}\b(spend|feed|source|data|API|connector)?/i.test(s) ||
      /\bTikTok\b.{0,100}\b(spend|feed|source|data|API|connector)\b.{0,100}\b(refresh|sync|fetch|pull|obtain|acquire|integrate|connect|configure|enable|add|restore|set up|setup|ingest)\b/i.test(s)
    )) {
    return true;
  }

  if (
    /\b(contact|email|message|call|whatsapp|send to)\b.{0,110}\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b.{0,110}\b(contact|email|message|call|whatsapp)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(request|ask|obtain|get)\b.{0,140}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote|inbound|PO)\b.{0,160}\b(couriers?|suppliers?|TFM|OTO|C3X|Last Mile|procurement)\b/i.test(s) ||
    /\b(request|ask|obtain|get)\b.{0,140}\b(TFM|OTO|C3X|Last Mile|couriers?|suppliers?)\b.{0,140}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote|inbound|PO)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(approve|authorize|request|ask|obtain|get)\b.{0,120}\b(supplier|courier)\b.{0,100}\b(evidence|statement|quote|ETA|lead[- ]?time|MOQ|PO|inbound)\b/i.test(s) ||
    /\b(supplier|courier)\b.{0,100}\b(evidence|statement|quote|ETA|lead[- ]?time|MOQ|PO|inbound)\b.{0,100}\b(request|ask|obtain|get)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(place|approve|authorize|commit|purchase|buy|replenish|source|initiate|arrange|transfer)\b.{0,130}\b(PO|purchase|order|stock|inventory|units?|SKU|PLG\d+|replenishment|sourcing)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(scale|pause|stop|increase|decrease|change|edit|approve)\b.{0,110}\b(ads?|campaigns?|budgets?|ad spend|Meta spend|TikTok spend)\b/i.test(s) ||
    /\b(ads?|campaigns?|budgets?)\b.{0,110}\b(scale|pause|stop|increase|decrease|change|edit)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(reroute|reassign|switch|assign|pause|stop|change)\b.{0,110}\b(couriers?|routing|shipments?|orders?|drivers?)\b/i.test(s)
  ) {
    return true;
  }

  return /\b(pay|refund|release|move|transfer)\b.{0,110}\b(payments?|money|refunds?|cash|funds?)\b/i.test(s);
}


function fctAtlasIsInternalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const tiktokMissing = fctAtlasTikTokSourceMissing_(packet);
  const mentionsTikTok = /TikTok/i.test(s);

  // Internal reconciliation/review is still internal even when the same
  // sentence also contains a governed TikTok source action. This allows
  // the mixed-action guard to force the model to split them.
  const reconciliationInternal =
    /\b(reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,140}\b(records?|cohorts?|snapshot|mapping|allocation|reconciliation|courier view)\b/i.test(s) ||
    /\binternally\b.{0,140}\b(reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s);

  const courierPollInternal =
    /\b(refresh|repoll|poll|request|trigger|run)\b.{0,140}\b(Last Mile|C3X|OTO|TFM)\b.{0,100}\b(API|feed|data|poll|snapshot|courier view)?/i.test(s) ||
    /\b(Last Mile|C3X|OTO|TFM)\b.{0,120}\b(refresh|repoll|poll|API poll|data poll)\b/i.test(s);

  if (reconciliationInternal || courierPollInternal) {
    return true;
  }

  // A missing TikTok source itself is not a routine internal refresh.
  if (tiktokMissing && mentionsTikTok) {
    return false;
  }

  return (
    /\b(refresh|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,130}\b(data|feed|API|courier view|records?|cohorts?|snapshot|mapping|allocation|reconciliation)\b/i.test(s) ||
    /\b(poll|repoll)\b.{0,110}\b(API|feed|courier view|data|snapshot)\b/i.test(s) ||
    /\b(request|trigger|run)\b.{0,130}\b(API|feed|data|courier view)\b.{0,70}\bpoll\b/i.test(s)
  );
}


function fctAtlasIsPureInternalHold_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const target =
    /\b(conclusion|calculation|decision|go[- ]?no[- ]?go|Real Contribution|Operating Profit|profit|SCALE)\b/i.test(s);

  const hold =
    /\b(hold|keep|maintain|preserve|remain)\b/i.test(s);

  return target && hold &&
    !fctAtlasIsExternalApprovalAction_(s, packet);
}


function fctAtlasTikTokSourceMissing_(packet) {
  const g = (packet && packet.group_pulse) || {};
  const scale = (packet && packet.scale_signals) || {};

  return (
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_contribution_status || '')
    ) ||
    /MISSING_ACTIVE_CHANNEL_SPEND/i.test(
      String(scale.tiktok_status || '')
    )
  );
}


function fctAtlasMaxSeverity_(a, b) {
  const rank = {
    NORMAL: 0,
    WATCH: 1,
    ACT_NOW: 2,
    CRITICAL: 3
  };

  const aa = String(a || '').toUpperCase();
  const bb = String(b || '').toUpperCase();

  if (rank[aa] === undefined) return bb || aa;
  if (rank[bb] === undefined) return aa;
  return rank[aa] >= rank[bb] ? aa : bb;
}


function fctAtlasCapConfidence_(atlasConfidence, orbitConfidence) {
  const rank = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2
  };

  const a = String(atlasConfidence || '').toUpperCase();
  const o = String(orbitConfidence || '').toUpperCase();

  if (rank[o] === undefined) return a || o;
  if (rank[a] === undefined) return o;
  return rank[a] <= rank[o] ? a : o;
}


function fctAtlasEscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}



function testFctAtlasTikTokBypassSemanticsNoApi() {
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
    if (fctAtlasAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'fctAtlas TikTok guard false-positive SAFE narrative: ' + s
      );
    }
  });

  unsafeNarrative.forEach(function(s) {
    if (!fctAtlasAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'fctAtlas TikTok guard false-negative UNSAFE narrative: ' + s
      );
    }
  });

  safeQuestions.forEach(function(s) {
    if (fctAtlasQuestionAsksTikTokBypass_(s)) {
      throw new Error(
        'fctAtlas TikTok question guard false-positive SAFE question: ' + s
      );
    }
  });

  unsafeQuestions.forEach(function(s) {
    if (!fctAtlasQuestionAsksTikTokBypass_(s)) {
      throw new Error(
        'fctAtlas TikTok question guard false-negative UNSAFE question: ' + s
      );
    }
  });

  Logger.log('fctAtlas TikTok bypass semantics PASS');
  return true;
}


function testFctAtlasDynamicStockSeverityNoApi() {
  const critical = [
    { country: 'United Arab Emirates', sku: 'PLG597' },
    { country: 'United Arab Emirates', sku: 'PLG609' },
    { country: 'Kuwait', sku: 'PLG597' }
  ];

  fctAtlasAssertCriticalCountClaims_(critical, {
    summary: 'Three critical stock rows remain open; Kuwait PLG617 is WATCH at 3.5 days.'
  });

  fctAtlasAssertWatchRowsNotPromoted_(
    [{ country: 'Kuwait', sku: 'PLG617' }],
    { summary: 'Kuwait PLG617 is WATCH at 3.5 days.' }
  );

  let watchCaught = false;
  try {
    fctAtlasAssertWatchRowsNotPromoted_(
      [{ country: 'Kuwait', sku: 'PLG617' }],
      { summary: 'Kuwait PLG617 is CRITICAL at 3.5 days.' }
    );
  } catch (e) {
    watchCaught = /WATCH row PLG617/i.test(String((e && e.message) || e));
  }
  if (!watchCaught) {
    throw new Error('ATLAS watch-severity guard failed.');
  }

  let caught = false;
  try {
    fctAtlasAssertCriticalCountClaims_(critical, {
      recommendations: [{
        action: 'Approve supplier evidence for all four critical stock rows.'
      }]
    });
  } catch (e) {
    caught = /packet has 3/i.test(String((e && e.message) || e));
  }
  if (!caught) {
    throw new Error(
      'ATLAS dynamic-stock guard failed to reject stale four-critical claim.'
    );
  }

  fctAtlasAssertStockClassificationStable_(
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

  Logger.log('ATLAS dynamic stock severity guards PASS');
  return true;
}


function testFctAtlasGovernanceGuardsNoApi() {
  testFctAtlasTikTokBypassSemanticsNoApi();

  const mockPacket = {
    overall_source_status: 'FAIL',
    deterministic_cross_checks: {
      tiktok_blocker_consistency: { status: 'MATCH' }
    },
    orbit_brief: {
      audit_status: 'FAIL',
      severity: 'CRITICAL',
      source_freshness: 'MIXED',
      confidence: 'MEDIUM',
      provisional_fields: ['tiktok_spend']
    },
    group_pulse: {
      as_of_date: '2026-09-09',
      daily_pnl_latest_date: '2026-09-08',
      meta_latest_date: '2026-09-08',
      orders_picked_mtd: 658,
      finalized_delivery_success: 0.8414,
      delivered_revenue_aed: 24204.73,
      gross_contribution_aed: 14854.70,
      meta_platform_spend_aed: 6701.85,
      real_contribution_profit_aed: null,
      real_contribution_status: 'BLOCKED_MISSING_TIKTOK_SPEND',
      real_operating_profit_aed: null,
      real_operating_profit_status: 'BLOCKED_MISSING_TIKTOK_SPEND',
      courier_receivable_aed: 24204.73
    },
    critical_stock: [
      { country: 'United Arab Emirates', sku: 'PLG597' },
      { country: 'United Arab Emirates', sku: 'PLG609' },
      { country: 'Kuwait', sku: 'PLG597' },
      { country: 'Kuwait', sku: 'PLG617' }
    ],
    last_mile: {
      finalized_success: 0.641,
      freshness_status: 'STALE_REVIEW',
      poll_age_hours: 29.2
    },
    scale_signals: {
      tiktok_status: 'MISSING_ACTIVE_CHANNEL_SPEND'
    }
  };

  const safe = {
    agent_id: 'AG001',
    audit_status: 'PASS',
    severity: 'ACT_NOW',
    source_freshness: 'FRESH',
    summary:
      'Final profit and SCALE remain HOLD. UAE PLG597, UAE PLG609, Kuwait PLG597 and Kuwait PLG617 require attention. Last Mile is stale-qualified and TFM/OTO remain unconfirmed.',
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
          'Approve acquisition and integration of the missing live TikTok spend source.',
        approval_required: false
      },
      {
        action:
          'Trigger a fresh internal Last Mile API poll.',
        approval_required: true
      },
      {
        action:
          'Approve requests to TFM and OTO for settlement statements.',
        approval_required: false
      }
    ],
    approval_required: false,
    questions_for_abid: [
      'Approve TikTok spend source integration?',
      'Approve requesting TFM and OTO settlement statements?'
    ],
    confidence: 'HIGH',
    provisional_fields: []
  };

  const enforced = fctAtlasEnforceGovernance_(
    JSON.parse(JSON.stringify(safe)),
    mockPacket
  );

  if (enforced.audit_status !== 'FAIL') {
    throw new Error(
      'ATLAS guard failed: ORBIT FAIL must be preserved.'
    );
  }

  if (enforced.severity !== 'CRITICAL') {
    throw new Error(
      'ATLAS guard failed: severity cannot be lower than ORBIT.'
    );
  }

  if (enforced.source_freshness !== 'MIXED') {
    throw new Error(
      'ATLAS guard failed: freshness cannot exceed ORBIT.'
    );
  }

  if (enforced.confidence !== 'MEDIUM') {
    throw new Error(
      'ATLAS guard failed: confidence cannot exceed ORBIT.'
    );
  }

  if (enforced.recommendations[0].approval_required !== true) {
    throw new Error(
      'ATLAS guard failed: missing TikTok source integration must require approval.'
    );
  }

  if (enforced.recommendations[1].approval_required !== false) {
    throw new Error(
      'ATLAS guard failed: internal Last Mile poll must not require approval.'
    );
  }

  if (enforced.recommendations[2].approval_required !== true) {
    throw new Error(
      'ATLAS guard failed: external TFM/OTO request must require approval.'
    );
  }

  if (enforced.approval_required !== true) {
    throw new Error(
      'ATLAS guard failed: overall approval flag must reflect external actions.'
    );
  }

  const pulse = fctAtlasBuildFounderPulse_(mockPacket);

  if (!/Orders 658/.test(pulse) ||
      !/Final Delivery 84\.14%/.test(pulse) ||
      !/Delivered Revenue AED 24,204\.73/.test(pulse) ||
      !/Real Contribution BLOCKED \(TikTok missing\)/.test(pulse) ||
      !/Operating Profit BLOCKED \(TikTok missing\)/.test(pulse) ||
      !/Courier Receivable AED 24,204\.73/.test(pulse)) {
    throw new Error(
      'ATLAS deterministic Founder Pulse contract failed.'
    );
  }

  if (!fctAtlasStatesBlockedProfitAsNumeric_(
      'Real Contribution AED 8,152.85',
      mockPacket)) {
    throw new Error(
      'ATLAS blocked-profit guard false-negative.'
    );
  }

  if (fctAtlasStatesBlockedProfitAsNumeric_(
      'Contribution after all Meta before TikTok is AED 8,152.85; Real Contribution remains blocked.',
      mockPacket)) {
    throw new Error(
      'ATLAS blocked-profit guard false-positive.'
    );
  }

  if (fctAtlasMisstatesLastMileFreshness_(
      'Trigger a fresh Last Mile API poll.',
      mockPacket)) {
    throw new Error(
      'ATLAS Last Mile freshness guard false-positive on future poll request.'
    );
  }

  if (!fctAtlasMisstatesLastMileFreshness_(
      'Last Mile is currently fresh at 64.1%.',
      mockPacket)) {
    throw new Error(
      'ATLAS Last Mile freshness guard false-negative.'
    );
  }

  if (fctAtlasAdvocatesTikTokBypass_(
      'Final SCALE remains blocked until TikTok spend is available.')) {
    throw new Error(
      'ATLAS TikTok guard false-positive on safe HOLD language.'
    );
  }

  if (!fctAtlasAdvocatesTikTokBypass_(
      'Proceed with final scaling despite missing TikTok spend.')) {
    throw new Error(
      'ATLAS TikTok guard false-negative on bypass language.'
    );
  }

  if (fctAtlasAdvocatesTikTokBypass_(
      'Approve acquisition and integration of the missing TikTok spend source to unblock final SCALE decisions.')) {
    throw new Error(
      'ATLAS TikTok guard false-positive on valid source-integration approval.'
    );
  }

  if (!fctAtlasAdvocatesTikTokBypass_(
      'Approve final SCALE despite missing TikTok spend.')) {
    throw new Error(
      'ATLAS TikTok guard false-negative on direct final SCALE approval.'
    );
  }

  if (fctAtlasStatesBlockedProfitAsNumeric_(
      'Real Contribution blocked; Meta spend AED 6,701.85.',
      mockPacket)) {
    throw new Error(
      'ATLAS blocked-profit guard false-positive on nearby Meta spend.'
    );
  }

  if (!fctAtlasIsExternalApprovalAction_(
      'Approve TikTok source integration.',
      mockPacket)) {
    throw new Error(
      'ATLAS approval guard false-negative on TikTok integration noun form.'
    );
  }

  if (!fctAtlasIsExternalApprovalAction_(
      'Approve supplier evidence request for inbound ETA.',
      mockPacket)) {
    throw new Error(
      'ATLAS approval guard false-negative on supplier evidence request.'
    );
  }

  const mixedAction =
    'Approve TikTok source integration and trigger a fresh Last Mile API poll.';

  if (!fctAtlasIsExternalApprovalAction_(mixedAction, mockPacket) ||
      !fctAtlasIsInternalAction_(mixedAction, mockPacket)) {
    throw new Error(
      'ATLAS mixed-action classifier failed for TikTok integration + Last Mile repoll.'
    );
  }

  let mixedRejected = false;
  const mixedResult = JSON.parse(JSON.stringify(safe));
  mixedResult.recommendations = [{
    action: mixedAction,
    approval_required: true
  }];
  mixedResult.questions_for_abid = ['Approve TikTok integration?'];

  try {
    fctAtlasEnforceGovernance_(mixedResult, mockPacket);
  } catch (e) {
    mixedRejected = /must be split/i.test(String((e && e.message) || e));
  }

  if (!mixedRejected) {
    throw new Error(
      'ATLAS mixed-action governance guard failed to reject bundled action.'
    );
  }

  Logger.log('ATLAS governance guards PASS');
  return true;
}
