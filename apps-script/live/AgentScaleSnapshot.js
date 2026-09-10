/**
 * Founder Control Tower — Step 6C
 * AG004 SCALE deterministic ADS_GROWTH snapshot.
 *
 * ADDITIVE FILE ONLY.
 *
 * Source precedence:
 *   deterministic control data -> current deterministic alerts/actions -> AI later
 *
 * READ / CALCULATE ONLY.
 * No API calls.
 * No sheet writes.
 * No ad changes.
 * No external actions.
 *
 * Important:
 * - Final scale decisions are BLOCKED while material active-channel spend
 *   (currently TikTok) is missing.
 * - Meta platform spend and product/country allocation are kept separate.
 * - ROAS/platform purchases are not used as authoritative profit.
 * - Stock, delivery and mapping gates are exposed, not guessed away.
 */

function fctBuildScaleSnapshot_() {
  const ss = fctGetSpreadsheet_();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Dubai';
  const now = new Date();
  const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const monthKey = today.substring(0, 7);

  const meta = fctScaleSummarizeMeta_(ss, monthKey, tz, now);
  const products = fctScaleReadProductPnl_(ss);
  const productPnlMetaSpend = fctScaleRound_(
    products.reduce(function(sum, p) {
      return sum + fctScaleNumber_(p.meta_spend_aed);
    }, 0),
    2
  );
  const productPnlMetaGap = fctScaleRound_(
    meta.platform_spend_aed - productPnlMetaSpend,
    2
  );

  const stock = fctScaleReadStock_(ss);
  const alerts = fctScaleReadAlerts_(ss);
  const actions = fctScaleReadActions_(ss);
  const couriers = fctScaleReadCourierGates_(ss);
  const pnlCutoff = fctScaleLatestDailyPnlDate_(ss, tz, now);

  const stockBySku = fctScaleIndexBySku_(stock);
  const alertsBySku = fctScaleIndexAlertsBySku_(alerts);
  const metaBySku = fctScaleIndexMetaBySku_(meta.product_spend);

  const scored = products.map(function(p) {
    const skuStock = stockBySku[p.sku] || [];
    const skuAlerts = alertsBySku[p.sku] || [];
    const skuMeta = metaBySku[p.sku] || null;

    const deliveryGate = fctScaleDeliveryGate_(p);
    const stockGate = fctScaleStockGate_(skuStock, skuAlerts);
    const mappingGate = skuMeta && skuMeta.country_pending_spend_aed > 0
      ? 'COUNTRY_SPLIT_PENDING'
      : 'PASS';

    let signal = 'NO_SIGNAL';
    if (p.delivered_paid > 0 && p.meta_spend_aed > 0) {
      if (p.contribution_after_meta_aed > 0) {
        signal = p.profit_per_delivered_after_meta_aed >= 20
          ? 'STRONG_POSITIVE_AFTER_META'
          : 'POSITIVE_AFTER_META';
      } else if (p.contribution_after_meta_aed < 0) {
        signal = 'NEGATIVE_AFTER_META';
      } else {
        signal = 'BREAKEVEN_AFTER_META';
      }
    } else if (p.delivered_paid > 0 && p.meta_spend_aed === 0) {
      signal = 'NO_META_SPEND';
    } else if (p.meta_spend_aed > 0 && p.delivered_paid === 0) {
      signal = 'SPEND_WITHOUT_DELIVERED_REVENUE';
    }

    let blockers = [];

    // Global active-channel completeness gate.
    if (fctScaleTikTokMissing_(products)) {
      blockers.push('TIKTOK_SPEND_MISSING');
    }

    const skuLiveMetaSpend = skuMeta
      ? fctScaleNumber_(skuMeta.spend_aed)
      : 0;
    const skuMetaGap = fctScaleRound_(
      skuLiveMetaSpend - fctScaleNumber_(p.meta_spend_aed),
      2
    );

    if (Math.abs(skuMetaGap) > 0.01) {
      blockers.push('SKU_META_VS_PRODUCT_PNL_GAP');
    }

    if (mappingGate !== 'PASS') blockers.push(mappingGate);
    if (deliveryGate !== 'PASS') blockers.push(deliveryGate);
    if (stockGate.status !== 'PASS') blockers.push(stockGate.status);

    if (skuAlerts.some(function(a) {
      return /inventory reconciliation/i.test(a.area || '');
    })) {
      blockers.push('INVENTORY_RECONCILIATION_OPEN');
    }

    // Primary-SKU attribution remains a review/provisional note.
    // It is not a universal hard scale blocker unless a later reconciliation
    // proves the SKU's spend/economics are materially misattributed.

    blockers = blockers.filter(function(x, i, arr) {
      return arr.indexOf(x) === i;
    });

    return {
      sku: p.sku,
      product: p.product,
      total_orders: p.total_orders,
      finalized: p.finalized,
      delivered_paid: p.delivered_paid,
      pending: p.pending,
      rrto: p.rrto,
      delivery_success: fctScaleRound_(p.delivery_success, 4),
      delivered_revenue_aed: fctScaleRound_(p.delivered_revenue_aed, 2),
      gross_contribution_aed: fctScaleRound_(p.gross_contribution_aed, 2),
      meta_spend_aed: fctScaleRound_(p.meta_spend_aed, 2),
      live_meta_spend_for_sku_aed: fctScaleRound_(skuLiveMetaSpend, 2),
      sku_meta_vs_product_pnl_gap_aed: fctScaleRound_(skuMetaGap, 2),
      contribution_after_meta_aed: fctScaleRound_(p.contribution_after_meta_aed, 2),
      profit_per_delivered_after_meta_aed: fctScaleRound_(
        p.profit_per_delivered_after_meta_aed,
        2
      ),
      economic_signal: signal,
      delivery_gate: deliveryGate,
      stock_gate: stockGate.status,
      stock_detail: stockGate.detail,
      mapping_gate: mappingGate,
      open_scale_alerts: skuAlerts.slice(0, 5),
      provisional_blockers: blockers,
      final_scale_decision_ready: blockers.length === 0,
      attribution_review:
        /PRIMARY_SKU_ATTRIBUTION/i.test(p.pnl_status || '')
          ? 'PRIMARY_SKU_ATTRIBUTION_REVIEW'
          : 'NONE',
      pnl_status: p.pnl_status
    };
  });

  const positiveCandidates = scored
    .filter(function(x) {
      return x.meta_spend_aed > 0 &&
        x.delivered_paid >= 3 &&
        x.contribution_after_meta_aed > 0;
    })
    .sort(function(a, b) {
      return b.contribution_after_meta_aed - a.contribution_after_meta_aed;
    })
    .slice(0, 10);

  const negativeCandidates = scored
    .filter(function(x) {
      return x.meta_spend_aed > 0 &&
        x.contribution_after_meta_aed < 0;
    })
    .sort(function(a, b) {
      return a.contribution_after_meta_aed - b.contribution_after_meta_aed;
    })
    .slice(0, 10);

  const flags = [];

  if (fctScaleTikTokMissing_(products)) {
    flags.push({
      severity: 'FAIL',
      code: 'TIKTOK_SPEND_MISSING',
      detail: 'Final delivery-adjusted scale decisions are blocked until live TikTok spend is available for the active channel.'
    });
  }

  if (meta.unmapped_spend_aed > 0) {
    flags.push({
      severity: 'FAIL',
      code: 'META_CORE_MAPPING_INCOMPLETE',
      detail: 'Some live Meta spend has no validated Store+SKU mapping.'
    });
  } else if (meta.country_pending_spend_aed > 0) {
    flags.push({
      severity: 'REVIEW',
      code: 'META_COUNTRY_SPLIT_PENDING',
      detail: 'AED ' +
        fctScaleRound_(meta.country_pending_spend_aed, 2) +
        ' of live Meta spend has Store+SKU mapped but country allocation is unresolved. Country-level P&L remains provisional.'
    });
  }

  if (Math.abs(productPnlMetaGap) > 0.01) {
    flags.push({
      severity: 'REVIEW',
      code: 'META_PLATFORM_VS_PRODUCT_PNL_GAP',
      detail: 'META_SPEND_LIVE platform spend is AED ' +
        fctScaleRound_(meta.platform_spend_aed, 2) +
        ' while GROUP PRODUCT_PNL currently represents AED ' +
        fctScaleRound_(productPnlMetaSpend, 2) +
        '. Difference AED ' +
        fctScaleRound_(productPnlMetaGap, 2) +
        ' must be reconciled for group-level completeness. Product-level scale readiness should use each SKU\'s own live-Meta vs PRODUCT_PNL reconciliation.'
    });
  }

  const skuMetaMismatches = scored.filter(function(x) {
    return Math.abs(fctScaleNumber_(x.sku_meta_vs_product_pnl_gap_aed)) > 0.01;
  });

  if (skuMetaMismatches.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'SKU_META_VS_PRODUCT_PNL_GAPS',
      detail: skuMetaMismatches.slice(0, 12).map(function(x) {
        return x.sku + ':' +
          fctScaleRound_(x.sku_meta_vs_product_pnl_gap_aed, 2);
      }).join(', ')
    });
  }

  if (products.some(function(p) {
    return /PRIMARY_SKU_ATTRIBUTION/i.test(p.pnl_status || '');
  })) {
    flags.push({
      severity: 'REVIEW',
      code: 'PRODUCT_PNL_PRIMARY_SKU_ATTRIBUTION',
      detail: 'Current PRODUCT_PNL attributes order economics to the primary SKU. Multi-item order attribution remains provisional.'
    });
  }

  const failedCouriers = couriers.filter(function(c) {
    return c.gate_status === 'FAIL';
  });
  if (failedCouriers.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'COURIER_SCALE_GATE_FAILED',
      detail: failedCouriers.map(function(c) {
        return c.courier + ' ' +
          fctScaleRound_(c.finalized_success * 100, 1) + '%';
      }).join(', ') +
      ' below the 70% finalized-delivery scale gate. Do not apply this globally to a product unless product-to-courier exposure is known.'
    });
  }

  const courierReconReview = couriers.filter(function(c) {
    return /REVIEW/i.test(c.reconciliation_status || '');
  });
  if (courierReconReview.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'COURIER_COHORT_RECONCILIATION_OPEN',
      detail: courierReconReview.map(function(c) {
        return c.courier + ': ' + c.reconciliation_status;
      }).join(' | ')
    });
  }

  if (pnlCutoff && pnlCutoff !== today) {
    flags.push({
      severity: 'REVIEW',
      code: 'PNL_CUTOFF_NOT_TODAY',
      detail: 'DAILY_PNL latest date is ' + pnlCutoff +
        ' while today is ' + today + '. Same-day scale conclusions must respect the cutoff.'
    });
  }

  const candidateStockRecon = positiveCandidates.filter(function(x) {
    return x.provisional_blockers.indexOf('INVENTORY_RECONCILIATION_OPEN') >= 0 ||
      x.stock_gate !== 'PASS';
  });
  if (candidateStockRecon.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'SCALE_CANDIDATE_STOCK_BLOCKERS',
      detail: candidateStockRecon.map(function(x) {
        return x.sku + ':' + x.stock_gate;
      }).join(', ')
    });
  }

  return {
    contract_version: '1.0',
    agent_id: 'AG004',
    agent: 'SCALE',
    domain: 'ADS_GROWTH',
    generated_at: Utilities.formatDate(
      now,
      tz,
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    ),
    period: {
      month: monthKey,
      today: today,
      daily_pnl_latest_date: pnlCutoff || '',
      meta_latest_date: meta.latest_date || ''
    },

    channel_completeness: {
      meta: {
        status: 'LIVE',
        platform_spend_aed: meta.platform_spend_aed,
        store_sku_mapped_spend_aed: meta.store_sku_mapped_spend_aed,
        store_sku_mapping_coverage: meta.platform_spend_aed
          ? fctScaleRound_(
              meta.store_sku_mapped_spend_aed / meta.platform_spend_aed,
              4
            )
          : null,
        country_resolved_spend_aed: meta.country_resolved_spend_aed,
        country_pending_spend_aed: meta.country_pending_spend_aed,
        unmapped_spend_aed: meta.unmapped_spend_aed
      },
      tiktok: {
        status: fctScaleTikTokMissing_(products)
          ? 'MISSING_ACTIVE_CHANNEL_SPEND'
          : 'AVAILABLE',
        spend_aed: null
      },
      google_ads: {
        status: 'INACTIVE_CURRENT_SCOPE',
        spend_aed: 0,
        note: 'Current Phase-1 scope records Google Ads as inactive; no Google integration is required unless status changes.'
      }
    },

    meta: {
      platform_spend_aed: meta.platform_spend_aed,

      // META_SPEND_LIVE currently contains spend + mapping only.
      // Do not represent absent performance metrics as real zero values.
      performance_metrics_status: meta.performance_metrics_available
        ? 'AVAILABLE'
        : 'UNAVAILABLE_IN_META_SPEND_LIVE',
      impressions: meta.performance_metrics_available
        ? meta.impressions
        : null,
      clicks: meta.performance_metrics_available
        ? meta.clicks
        : null,

      product_pnl_meta_spend_aed: productPnlMetaSpend,
      meta_not_represented_in_product_pnl_aed: productPnlMetaGap,

      top_campaigns_by_spend: meta.top_campaigns,
      product_spend: meta.product_spend.slice(0, 25)
    },

    provisional_product_rankings: {
      positive_after_meta: positiveCandidates,
      negative_after_meta: negativeCandidates
    },

    courier_scale_gates: couriers,
    current_scale_alerts: alerts.slice(0, 20),
    current_growth_actions: actions.slice(0, 12),

    data_quality: {
      status: flags.some(function(f) { return f.severity === 'FAIL'; })
        ? 'FAIL'
        : (flags.length ? 'REVIEW' : 'PASS'),
      flags: flags
    },

    governance: {
      mode: 'RECOMMENDATION_ONLY',
      may_execute: false,
      scale_rule: 'Never scale from ROAS alone. Require delivery-adjusted economics, all active ad-channel spend, delivery gate, stock gate, cash/data quality and mapping readiness.',
      source_precedence: [
        'DETERMINISTIC_CONTROL_DATA',
        'CURRENT_ALERTS',
        'ACTION_QUEUE',
        'AI_INTERPRETATION'
      ],
      pii_included: false
    },

    source_tabs: [
      'META_SPEND_LIVE',
      'PRODUCT_PNL',
      'STOCK_INTELLIGENCE',
      'COURIER_PERF',
      'DAILY_PNL',
      'ALERTS',
      'ACTION_QUEUE'
    ]
  };
}


function testFctScaleSnapshotNoApi() {
  const snapshot = fctBuildScaleSnapshot_();

  if (!snapshot || snapshot.agent_id !== 'AG004') {
    throw new Error('SCALE snapshot contract failed: AG004 identity missing.');
  }

  if (!snapshot.data_quality || !snapshot.data_quality.status) {
    throw new Error('SCALE snapshot contract failed: data-quality status missing.');
  }

  if (!snapshot.channel_completeness ||
      !snapshot.channel_completeness.meta ||
      snapshot.channel_completeness.meta.platform_spend_aed === undefined) {
    throw new Error('SCALE snapshot contract failed: channel completeness missing.');
  }

  if (snapshot.channel_completeness.tiktok.status ===
      'MISSING_ACTIVE_CHANNEL_SPEND' &&
      snapshot.provisional_product_rankings.positive_after_meta.some(function(x) {
        return x.final_scale_decision_ready === true;
      })) {
    throw new Error(
      'SCALE safety contract failed: a product is scale-ready while TikTok spend is missing.'
    );
  }

  if (snapshot.meta.performance_metrics_status ===
      'UNAVAILABLE_IN_META_SPEND_LIVE' &&
      (snapshot.meta.impressions !== null || snapshot.meta.clicks !== null)) {
    throw new Error(
      'SCALE data contract failed: unavailable Meta performance metrics must be null.'
    );
  }

  if (snapshot.provisional_product_rankings.positive_after_meta.some(function(x) {
        return Math.abs(fctScaleNumber_(x.sku_meta_vs_product_pnl_gap_aed)) > 0.01 &&
          x.final_scale_decision_ready === true;
      })) {
    throw new Error(
      'SCALE safety contract failed: a product is scale-ready while its own live Meta spend does not reconcile to PRODUCT_PNL.'
    );
  }

  Logger.log(JSON.stringify(snapshot, null, 2));
  return snapshot;
}


function fctScaleSummarizeMeta_(ss, monthKey, tz, now) {
  const sh = ss.getSheetByName('META_SPEND_LIVE');
  if (!sh) throw new Error('Required sheet not found: META_SPEND_LIVE');

  const rawValues = sh.getDataRange().getValues();
  const headers = rawValues.length
    ? rawValues[0].map(function(h) { return String(h || '').trim(); })
    : [];
  const performanceMetricsAvailable =
    headers.indexOf('Impressions') >= 0 &&
    headers.indexOf('Clicks') >= 0;

  const rows = fctScaleRowsToObjects_(sh);
  const campaignMap = {};
  const productMap = {};

  let totalSpend = 0;
  let mappedSpend = 0;
  let countryResolvedSpend = 0;
  let countryPendingSpend = 0;
  let unmappedSpend = 0;
  let impressions = 0;
  let clicks = 0;
  let latestDate = '';

  rows.forEach(function(r) {
    const d = fctScaleDateFromCell_(r.Date, now);
    if (!d) return;

    const dateKey = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (dateKey.substring(0, 7) !== monthKey) return;

    if (!latestDate || dateKey > latestDate) latestDate = dateKey;

    const spend = fctScaleNumber_(r.Spend_AED);
    totalSpend += spend;
    const store = String(r.Store || '').trim();
    const sku = String(r.SKU || '').trim();
    const country = String(r.Country || '').trim();
    const mappingStatus = String(r.Mapping_Status || '').trim().toUpperCase();

    if (store && sku) {
      mappedSpend += spend;
    } else {
      unmappedSpend += spend;
    }

    const countryPending =
      mappingStatus === 'PENDING_ACTION' ||
      /^MULTI:/i.test(country) ||
      !country;

    if (countryPending && store && sku) {
      countryPendingSpend += spend;
    } else if (store && sku) {
      countryResolvedSpend += spend;
    }

    const campaignId = String(r.Campaign_ID || '');
    const campaignKey = [
      campaignId,
      store,
      sku,
      country,
      mappingStatus
    ].join('|');

    if (!campaignMap[campaignKey]) {
      campaignMap[campaignKey] = {
        campaign_id: campaignId,
        campaign_name: String(r.Campaign_Name || ''),
        portfolio: String(r.Portfolio || ''),
        account_id: String(r.Account_ID || ''),
        store: store,
        sku: sku,
        product: String(r.Product_Name || ''),
        country: country,
        mapping_status: mappingStatus,
        spend_aed: 0,
        impressions: performanceMetricsAvailable ? 0 : null,
        clicks: performanceMetricsAvailable ? 0 : null,
        pixel_purchases: null,
        omni_purchases: null
      };
    }

    campaignMap[campaignKey].spend_aed += spend;

    if (performanceMetricsAvailable) {
      campaignMap[campaignKey].impressions += fctScaleNumber_(r.Impressions);
      campaignMap[campaignKey].clicks += fctScaleNumber_(r.Clicks);
      impressions += fctScaleNumber_(r.Impressions);
      clicks += fctScaleNumber_(r.Clicks);
    }

    if (sku) {
      if (!productMap[sku]) {
        productMap[sku] = {
          sku: sku,
          product: String(r.Product_Name || ''),
          spend_aed: 0,
          country_pending_spend_aed: 0,
          country_resolved_spend_aed: 0,
          stores: {},
          countries: {}
        };
      }

      productMap[sku].spend_aed += spend;

      if (countryPending) {
        productMap[sku].country_pending_spend_aed += spend;
      } else {
        productMap[sku].country_resolved_spend_aed += spend;
      }

      if (store) productMap[sku].stores[store] = true;
      if (country) productMap[sku].countries[country] = true;
    }
  });

  const topCampaigns = Object.keys(campaignMap)
    .map(function(k) {
      const x = campaignMap[k];
      x.spend_aed = fctScaleRound_(x.spend_aed, 2);
      return x;
    })
    .sort(function(a, b) {
      return b.spend_aed - a.spend_aed;
    })
    .slice(0, 12);

  const productSpend = Object.keys(productMap)
    .map(function(k) {
      const x = productMap[k];
      return {
        sku: x.sku,
        product: x.product,
        spend_aed: fctScaleRound_(x.spend_aed, 2),
        country_pending_spend_aed:
          fctScaleRound_(x.country_pending_spend_aed, 2),
        country_resolved_spend_aed:
          fctScaleRound_(x.country_resolved_spend_aed, 2),
        stores: Object.keys(x.stores),
        countries: Object.keys(x.countries)
      };
    })
    .sort(function(a, b) {
      return b.spend_aed - a.spend_aed;
    });

  return {
    latest_date: latestDate,
    platform_spend_aed: fctScaleRound_(totalSpend, 2),
    store_sku_mapped_spend_aed: fctScaleRound_(mappedSpend, 2),
    country_resolved_spend_aed: fctScaleRound_(countryResolvedSpend, 2),
    country_pending_spend_aed: fctScaleRound_(countryPendingSpend, 2),
    unmapped_spend_aed: fctScaleRound_(unmappedSpend, 2),
    performance_metrics_available: performanceMetricsAvailable,
    impressions: performanceMetricsAvailable
      ? Math.round(impressions)
      : null,
    clicks: performanceMetricsAvailable
      ? Math.round(clicks)
      : null,
    top_campaigns: topCampaigns,
    product_spend: productSpend
  };
}


function fctScaleReadProductPnl_(ss) {
  const sh = ss.getSheetByName('PRODUCT_PNL');
  if (!sh) throw new Error('Required sheet not found: PRODUCT_PNL');

  return fctScaleRowsToObjects_(sh)
    .filter(function(r) {
      return String(r.Country || '').trim().toUpperCase() === 'GROUP' &&
        String(r.SKU || '').trim();
    })
    .map(function(r) {
      return {
        sku: String(r.SKU || '').trim(),
        product: String(r.Product || '').trim(),
        total_orders: fctScaleNumber_(r.Total_Orders),
        finalized: fctScaleNumber_(r.Finalized),
        delivered_paid: fctScaleNumber_(r.Delivered_Paid),
        pending: fctScaleNumber_(r.Pending),
        rrto: fctScaleNumber_(r.RRTO),
        delivery_success: fctScaleNumber_(r.Delivery_Success),
        delivered_revenue_aed: fctScaleNumber_(r.Delivered_Revenue_AED),
        gross_contribution_aed:
          fctScaleNumber_(r.Gross_Contribution_AED),
        meta_spend_aed: fctScaleNumber_(r.Meta_Spend_AED),
        contribution_after_meta_aed:
          fctScaleNumber_(r.Contribution_After_Meta_AED),
        profit_per_delivered_after_meta_aed:
          fctScaleNumber_(r.Profit_Per_Delivered_After_Meta_AED),
        pnl_status: String(r.PNL_Status || '')
      };
    });
}


function fctScaleReadStock_(ss) {
  const sh = ss.getSheetByName('STOCK_INTELLIGENCE');
  if (!sh) throw new Error('Required sheet not found: STOCK_INTELLIGENCE');

  return fctScaleRowsToObjects_(sh)
    .map(function(r) {
      const label = String(r['Product (SKU)'] || '');
      const m = label.match(/\((PLG\d+)\)/i);
      if (!m) return null;

      return {
        country: String(r.Country || ''),
        sku: m[1].toUpperCase(),
        product_label: label,
        available_stock: fctScaleNumber_(r['Available Stock']),
        available_stock_days:
          fctScaleNumberOrNull_(r['Available Stock Days']),
        stock_alert: String(r['Stock Alert'] || ''),
        recommended_action: String(r['Recommended Action'] || ''),
        data_quality: String(r['Data Quality'] || '')
      };
    })
    .filter(function(x) { return !!x; });
}


function fctScaleReadAlerts_(ss) {
  const sh = ss.getSheetByName('ALERTS');
  if (!sh) return [];

  const rows = fctScaleRowsToObjects_(sh);

  return rows
    .filter(function(r) {
      const status = String(r.Status || '').toUpperCase();
      if (status && status !== 'OPEN' && status !== 'ACTIVE') return false;

      const areaMetric = [
        r.Area,
        r.Metric
      ].join(' ');

      return /ads|growth|meta|inventory reconciliation|stock|inventory/i
        .test(areaMetric);
    })
    .map(function(r) {
      return {
        severity: String(r.Severity || ''),
        area: String(r.Area || ''),
        country: String(r.Country || ''),
        entity: String(r.Entity || ''),
        metric: String(r.Metric || ''),
        message: String(r.Message || ''),
        recommended_action: String(r.Recommended_Action || ''),
        status: String(r.Status || '')
      };
    });
}


function fctScaleReadActions_(ss) {
  const sh = ss.getSheetByName('ACTION_QUEUE');
  if (!sh) return [];

  return fctScaleRowsToObjects_(sh)
    .filter(function(r) {
      const agent = String(r.Agent || '');
      const area = String(r.Area || '');
      const execution = String(r.Execution_Status || '').toUpperCase();

      if (execution === 'COMPLETED' || execution === 'CANCELLED') {
        return false;
      }

      return /growth/i.test(agent) ||
        /ads|p&l|pnl|meta|tiktok/i.test(area);
    })
    .map(function(r) {
      return {
        action_id: String(r.Action_ID || ''),
        agent: String(r.Agent || ''),
        area: String(r.Area || ''),
        priority: String(r.Priority || ''),
        recommendation: String(r.Recommendation || ''),
        reason: String(r.Reason || ''),
        confidence: String(r.Confidence || ''),
        approval_status: String(r.Approval_Status || ''),
        execution_status: String(r.Execution_Status || ''),
        due_date: String(r.Due_Date || '')
      };
    });
}


function fctScaleReadCourierGates_(ss) {
  const sh = ss.getSheetByName('COURIER_PERF');
  if (!sh) return [];

  const values = sh.getDataRange().getValues();
  let headerIndex = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '') === 'Period' &&
        String(values[i][1] || '') === 'Courier') {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex < 0) return [];

  const headers = values[headerIndex].map(function(x) {
    return String(x || '').trim();
  });

  const out = [];

  for (let r = headerIndex + 1; r < values.length; r++) {
    const row = values[r];
    if (!row || !row[1]) continue;

    const obj = {};
    headers.forEach(function(h, c) {
      if (h) obj[h] = row[c];
    });

    const successRaw = obj.Finalized_Success;
    const success = typeof successRaw === 'number'
      ? successRaw
      : (/^\d+(\.\d+)?$/.test(String(successRaw || ''))
          ? Number(successRaw)
          : null);

    out.push({
      period: String(obj.Period || ''),
      courier: String(obj.Courier || ''),
      live_shipments: fctScaleNumber_(obj.Live_Shipments),
      terminal_delivered: fctScaleNumber_(obj.Terminal_Delivered),
      terminal_return: fctScaleNumber_(obj.Terminal_Return),
      open_nonterminal: fctScaleNumber_(obj.Open_NonTerminal),
      finalized_success: success,
      gate_threshold: 0.70,
      gate_status: success === null
        ? 'NO_FINALIZED_DATA'
        : (success >= 0.70 ? 'PASS' : 'FAIL'),
      last_polled_utc: String(obj.Last_Polled_UTC || ''),
      source: String(obj.Source || ''),
      reconciliation_status: String(obj.Reconciliation_Status || '')
    });
  }

  return out;
}


function fctScaleLatestDailyPnlDate_(ss, tz, now) {
  const sh = ss.getSheetByName('DAILY_PNL');
  if (!sh) return '';

  const rows = fctScaleRowsToObjects_(sh);
  let latest = '';

  rows.forEach(function(r) {
    const d = fctScaleDateFromCell_(r.Date, now);
    if (!d) return;
    const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (!latest || key > latest) latest = key;
  });

  return latest;
}


function fctScaleDeliveryGate_(p) {
  if (p.finalized < 5) return 'LOW_SAMPLE_FINALIZED_LT_5';
  if (p.delivery_success < 0.70) return 'DELIVERY_GATE_FAIL';
  return 'PASS';
}


function fctScaleStockGate_(stockRows, alerts) {
  if (!stockRows || !stockRows.length) {
    return {
      status: 'STOCK_DATA_MISSING',
      detail: 'No STOCK_INTELLIGENCE row found for this SKU.'
    };
  }

  const critical = stockRows.filter(function(s) {
    return /ACT NOW|OUT OF STOCK/i.test(s.stock_alert || '') ||
      (s.available_stock_days !== null &&
       s.available_stock_days <= 3 &&
       s.available_stock_days >= 0);
  });

  if (critical.length) {
    return {
      status: 'STOCK_GATE_FAIL',
      detail: critical.map(function(s) {
        return s.country + ' ' +
          (s.available_stock_days === null
            ? s.stock_alert
            : fctScaleRound_(s.available_stock_days, 2) + ' days');
      }).join(' | ')
    };
  }

  const reconOpen = (alerts || []).some(function(a) {
    return /inventory reconciliation/i.test(a.area || '');
  });

  if (reconOpen) {
    return {
      status: 'STOCK_RECONCILIATION_REVIEW',
      detail: 'Open deterministic inventory reconciliation alert exists for this SKU.'
    };
  }

  return {
    status: 'PASS',
    detail: stockRows.map(function(s) {
      return s.country + ': ' +
        (s.available_stock_days === null
          ? s.stock_alert
          : fctScaleRound_(s.available_stock_days, 2) + ' days');
    }).join(' | ')
  };
}


function fctScaleTikTokMissing_(products) {
  if (!products || !products.length) return true;

  return products.some(function(p) {
    return /PROVISIONAL_TIKTOK/i.test(p.pnl_status || '');
  });
}


function fctScaleIndexBySku_(rows) {
  const out = {};
  (rows || []).forEach(function(r) {
    if (!out[r.sku]) out[r.sku] = [];
    out[r.sku].push(r);
  });
  return out;
}


function fctScaleIndexAlertsBySku_(alerts) {
  const out = {};
  (alerts || []).forEach(function(a) {
    const text = [
      a.entity,
      a.message,
      a.recommended_action
    ].join(' ');

    const matches = text.match(/PLG\d+/gi) || [];
    matches.forEach(function(sku) {
      sku = sku.toUpperCase();
      if (!out[sku]) out[sku] = [];
      out[sku].push(a);
    });
  });
  return out;
}


function fctScaleIndexMetaBySku_(rows) {
  const out = {};
  (rows || []).forEach(function(r) {
    out[r.sku] = r;
  });
  return out;
}


function fctScaleRowsToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];

  const headers = values[0].map(function(h) {
    return String(h || '').trim();
  });

  const rows = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row.some(function(v) {
      return v !== '' && v !== null;
    })) {
      continue;
    }

    const obj = {};
    headers.forEach(function(h, c) {
      if (h) obj[h] = row[c];
    });
    rows.push(obj);
  }

  return rows;
}


function fctScaleDateFromCell_(value, now) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    // Google Sheets serial date.
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + value * 86400000);
  }

  const s = String(value || '').trim();
  if (!s) return null;

  // ISO / common parseable dates.
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;

  // Current-year forms such as 8-Sep.
  const m = s.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3,9})$/);
  if (m) {
    const year = (now || new Date()).getFullYear();
    const d = new Date(m[1] + ' ' + m[2] + ' ' + year);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}


function fctScaleNumber_(value) {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}


function fctScaleNumberOrNull_(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}


function fctScaleRound_(value, decimals) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return value;
  }

  const p = Math.pow(10, decimals || 0);
  return Math.round(Number(value) * p) / p;
}
