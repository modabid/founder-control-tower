/**
 * Founder Control Tower — Step 6G
 * AG006 STOCK deterministic INVENTORY snapshot.
 *
 * ADDITIVE FILE ONLY.
 *
 * READ / CALCULATE ONLY.
 * No API calls.
 * No sheet writes.
 * No stock adjustments.
 * No PO / supplier / payment actions.
 *
 * Locked rules:
 * - Inventory velocity = max(7-day avg pickup, 14-day avg pickup)
 * - RRTO is NOT available stock until physically received
 * - Physical available stock is authoritative for stock-day risk
 * - Product economics are prioritization context only
 * - No lead time / MOQ / inbound quantity may be invented
 */

function fctBuildStockSnapshot_() {
  const ss = fctGetSpreadsheet_();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Dubai';
  const now = new Date();
  const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');

  const stockRows = fctStockReadIntelligence_(ss);
  const controlRows = fctStockReadControl_(ss);
  const pnlBySku = fctStockReadProductPnl_(ss);
  const metaMarket = fctStockReadMarketMetaSpend_(ss, today, tz, now);
  const alerts = fctStockReadAlerts_(ss);
  const actions = fctStockReadActions_(ss);
  const inbound = fctStockAssessInboundVisibility_(ss);

  const controlByKey = {};
  controlRows.forEach(function(r) {
    controlByKey[fctStockKey_(r.country, r.sku)] = r;
  });

  const alertByKey = {};
  alerts.forEach(function(a) {
    const sku = fctStockExtractSku_(a.entity + ' ' + a.message);
    if (!sku) return;
    const key = fctStockKey_(a.country, sku);
    if (!alertByKey[key]) alertByKey[key] = [];
    alertByKey[key].push(a);
  });

  const enriched = stockRows.map(function(r) {
    const key = fctStockKey_(r.country, r.sku);
    const control = controlByKey[key] || null;
    const pnl = pnlBySku[r.sku] || null;
    const marketMeta = metaMarket.by_market_sku[key] || {
      spend_aed: 0
    };
    const skuMeta = metaMarket.by_sku[r.sku] || {
      spend_aed: 0,
      country_pending_spend_aed: 0
    };
    const relatedAlerts = alertByKey[key] || [];

    const stockGate =
      /OUT OF STOCK/i.test(r.stock_alert)
        ? 'OUT_OF_STOCK'
        : (/ACT NOW/i.test(r.stock_alert)
            ? 'CRITICAL_LE_3_DAYS'
            : (/REORDER|WATCH/i.test(r.stock_alert)
                ? 'WATCH_LE_7_DAYS'
                : 'PASS'));

    const reconGate =
      /COURIER PICKUP MISMATCH/i.test(r.data_quality)
        ? 'COURIER_PICKUP_RECON_OPEN'
        : (/RETURN DATA MISMATCH/i.test(r.data_quality)
            ? 'RETURN_DATA_RECON_OPEN'
            : (/PURCHASE RECORD DIFF/i.test(r.data_quality)
                ? 'PURCHASE_HISTORY_RECON_OPEN'
                : 'PASS'));

    const knownMarketMetaActive =
      fctStockNumber_(marketMeta.spend_aed) > 0;

    const provisionalEconomics =
      pnl
        ? {
            total_orders: pnl.total_orders,
            finalized: pnl.finalized,
            delivered_paid: pnl.delivered_paid,
            delivery_success: pnl.delivery_success,
            gross_contribution_aed:
              fctStockRound_(pnl.gross_contribution_aed, 2),
            meta_spend_aed:
              fctStockRound_(pnl.meta_spend_aed, 2),
            contribution_after_meta_aed:
              fctStockRound_(pnl.contribution_after_meta_aed, 2),
            profit_per_delivered_after_meta_aed:
              fctStockRound_(pnl.profit_per_delivered_after_meta_aed, 2),
            pnl_status: pnl.pnl_status
          }
        : null;

    let priority = 'MONITOR';

    if (stockGate === 'OUT_OF_STOCK' ||
        stockGate === 'CRITICAL_LE_3_DAYS') {
      priority = knownMarketMetaActive
        ? 'ACT_NOW_KNOWN_META_ACTIVE_MARKET'
        : 'ACT_NOW_STOCK_RISK';
    } else if (stockGate === 'WATCH_LE_7_DAYS') {
      priority = knownMarketMetaActive
        ? 'WATCH_KNOWN_META_ACTIVE_MARKET'
        : 'WATCH';
    }

    return {
      country: r.country,
      sku: r.sku,
      product: r.product,
      available_stock: r.available_stock,
      confirmed_courier_stock: r.confirmed_courier_stock,
      pickup_last_7d: r.pickup_last_7d,
      avg_per_day_7d: r.avg_per_day_7d,
      pickup_last_14d: r.pickup_last_14d,
      avg_per_day_14d: r.avg_per_day_14d,
      demand_velocity_used: r.demand_velocity_used,
      velocity_rule_check:
        fctStockRound_(
          Math.max(r.avg_per_day_7d, r.avg_per_day_14d),
          6
        ),
      available_stock_days: r.available_stock_days,
      stock_alert: r.stock_alert,
      stock_gate: stockGate,
      recommended_action_from_sheet: r.recommended_action,
      data_quality: r.data_quality,
      reconciliation_gate: reconGate,
      priority: priority,

      // Exact market ad activity is separate from GROUP PRODUCT_PNL.
      known_market_meta_spend_aed:
        fctStockRound_(marketMeta.spend_aed, 2),
      sku_total_live_meta_spend_aed:
        fctStockRound_(skuMeta.spend_aed, 2),
      sku_country_pending_meta_spend_aed:
        fctStockRound_(
          skuMeta.country_pending_spend_aed,
          2
        ),

      sku_group_product_economics: provisionalEconomics,

      control_context: control
        ? {
            physical_purchase: control.physical_purchase,
            accounting_purchase: control.accounting_purchase,
            purchase_diff: control.purchase_diff,
            damaged_lost: control.damaged_lost,
            pickup_diff: control.pickup_diff,
            core_stock_balance_diff: control.core_stock_balance_diff,
            reconciliation_status: control.reconciliation_status,
            stock_status: control.stock_status
          }
        : null,
      current_alerts: relatedAlerts
    };
  });

  const critical = enriched
    .filter(function(x) {
      return x.stock_gate === 'OUT_OF_STOCK' ||
        x.stock_gate === 'CRITICAL_LE_3_DAYS';
    })
    .sort(fctStockRiskSort_);

  const watch = enriched
    .filter(function(x) {
      return x.stock_gate === 'WATCH_LE_7_DAYS';
    })
    .sort(fctStockRiskSort_);

  const recon = enriched
    .filter(function(x) {
      return x.reconciliation_gate !== 'PASS';
    })
    .sort(function(a, b) {
      const aAbs = a.control_context
        ? Math.abs(fctStockNumber_(a.control_context.pickup_diff))
        : 0;
      const bAbs = b.control_context
        ? Math.abs(fctStockNumber_(b.control_context.pickup_diff))
        : 0;
      return bAbs - aAbs;
    });

  const flags = [];

  if (critical.length) {
    flags.push({
      severity: 'FAIL',
      code: 'CRITICAL_STOCK_RISK_OPEN',
      detail: critical.slice(0, 12).map(function(x) {
        return x.country + ' ' + x.sku + ':' +
          (x.available_stock_days === null
            ? 'N/A'
            : fctStockRound_(x.available_stock_days, 2) + 'd');
      }).join(', ')
    });
  }

  if (watch.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'STOCK_WATCH_LE_7_DAYS',
      detail: watch.slice(0, 12).map(function(x) {
        return x.country + ' ' + x.sku + ':' +
          fctStockRound_(x.available_stock_days, 2) + 'd';
      }).join(', ')
    });
  }

  const pickupRecon = recon.filter(function(x) {
    return x.reconciliation_gate === 'COURIER_PICKUP_RECON_OPEN';
  });

  if (pickupRecon.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'COURIER_PICKUP_RECON_OPEN',
      detail: pickupRecon.slice(0, 12).map(function(x) {
        const d = x.control_context
          ? fctStockNumber_(x.control_context.pickup_diff)
          : null;
        return x.country + ' ' + x.sku +
          (d === null ? '' : ':' + d);
      }).join(', ')
    });
  }

  const returnRecon = recon.filter(function(x) {
    return x.reconciliation_gate === 'RETURN_DATA_RECON_OPEN';
  });

  if (returnRecon.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'RETURN_DATA_RECON_OPEN',
      detail: returnRecon.slice(0, 12).map(function(x) {
        return x.country + ' ' + x.sku;
      }).join(', ')
    });
  }

  if (!inbound.has_reliable_open_inbound_pipeline) {
    flags.push({
      severity: 'REVIEW',
      code: 'OPEN_INBOUND_PIPELINE_NOT_AVAILABLE',
      detail: inbound.note
    });
  }

  const knownMetaActiveCritical = critical.filter(function(x) {
    return fctStockNumber_(
      x.known_market_meta_spend_aed
    ) > 0;
  });

  if (knownMetaActiveCritical.length) {
    flags.push({
      severity: 'FAIL',
      code: 'KNOWN_META_ACTIVE_MARKETS_WITH_CRITICAL_STOCK',
      detail: knownMetaActiveCritical.slice(0, 10).map(function(x) {
        return x.country + ' ' + x.sku +
          ' stock=' + x.available_stock +
          ', days=' +
          (x.available_stock_days === null
            ? 'N/A'
            : fctStockRound_(x.available_stock_days, 2)) +
          ', market_meta=' +
          fctStockRound_(
            x.known_market_meta_spend_aed,
            2
          );
      }).join('; ')
    });
  }

  const criticalWithGroupEconomicsOnly = critical.filter(function(x) {
    return fctStockNumber_(x.known_market_meta_spend_aed) === 0 &&
      x.sku_group_product_economics &&
      (
        fctStockNumber_(x.sku_total_live_meta_spend_aed) > 0 ||
        fctStockNumber_(x.sku_country_pending_meta_spend_aed) > 0
      );
  });

  if (criticalWithGroupEconomicsOnly.length) {
    flags.push({
      severity: 'REVIEW',
      code: 'CRITICAL_STOCK_WITH_SKU_LEVEL_AD_SIGNAL_ONLY',
      detail: criticalWithGroupEconomicsOnly.slice(0, 10).map(function(x) {
        return x.country + ' ' + x.sku +
          ' has critical stock, but live Meta spend is not resolved to this market. ' +
          'SKU total Meta=' +
          fctStockRound_(x.sku_total_live_meta_spend_aed, 2) +
          ', country-pending=' +
          fctStockRound_(x.sku_country_pending_meta_spend_aed, 2);
      }).join('; ')
    });
  }

  return {
    contract_version: '1.0',
    agent_id: 'AG006',
    agent: 'STOCK',
    domain: 'INVENTORY',
    generated_at: Utilities.formatDate(
      now,
      tz,
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    ),
    period: {
      today: today
    },

    inventory_summary: fctStockSummary_(enriched),

    critical_stock: critical,
    watch_stock: watch,
    reconciliation_exceptions: recon.slice(0, 30),

    inbound_visibility: inbound,
    meta_market_attribution: {
      month: metaMarket.month,
      platform_spend_aed: metaMarket.platform_spend_aed,
      country_resolved_spend_aed:
        metaMarket.country_resolved_spend_aed,
      country_pending_spend_aed:
        metaMarket.country_pending_spend_aed
    },

    current_inventory_alerts: alerts.slice(0, 30),
    current_inventory_actions: actions.slice(0, 12),

    data_quality: {
      status: flags.some(function(f) {
        return f.severity === 'FAIL';
      })
        ? 'FAIL'
        : (flags.length ? 'REVIEW' : 'PASS'),
      flags: flags
    },

    governance: {
      mode: 'RECOMMENDATION_ONLY',
      may_execute: false,
      inventory_velocity_rule:
        'max(7-day average pickup, 14-day average pickup)',
      rrto_rule:
        'RRTO is NOT available stock until physically received.',
      stock_truth_rule:
        'Physical available stock controls stock-day risk; do not create stock by inference.',
      replenishment_rule:
        'Do not place PO, transfer stock, adjust inventory or commit cash without founder approval.',
      economics_rule:
        'Product economics may prioritize risk but cannot override stock reconciliation or missing inbound evidence.',
      pii_included: false
    },

    source_tabs: [
      'STOCK_INTELLIGENCE',
      'INVENTORY_CONTROL',
      'PRODUCT_PNL',
      'META_SPEND_LIVE',
      'RAW_PURCHASE_UAE',
      'RAW_PURCHASE_KWT',
      'ALERTS',
      'ACTION_QUEUE'
    ]
  };
}


function testFctStockSnapshotNoApi() {
  const s = fctBuildStockSnapshot_();

  if (!s || s.agent_id !== 'AG006') {
    throw new Error('STOCK snapshot contract failed: AG006 identity missing.');
  }

  (s.critical_stock || []).forEach(function(x) {
    if (x.demand_velocity_used > 0 &&
        Math.abs(
          fctStockNumber_(x.demand_velocity_used) -
          fctStockNumber_(x.velocity_rule_check)
        ) > 0.0001) {
      throw new Error(
        'STOCK velocity contract failed for ' +
        x.country + ' ' + x.sku + '.'
      );
    }
  });

  if (s.inbound_visibility.has_reliable_open_inbound_pipeline === false &&
      !(s.data_quality.flags || []).some(function(f) {
        return f.code === 'OPEN_INBOUND_PIPELINE_NOT_AVAILABLE';
      })) {
    throw new Error(
      'STOCK data contract failed: missing inbound pipeline was not surfaced.'
    );
  }

  (s.critical_stock || []).forEach(function(x) {
    if (x.priority === 'ACT_NOW_KNOWN_META_ACTIVE_MARKET' &&
        fctStockNumber_(x.known_market_meta_spend_aed) <= 0) {
      throw new Error(
        'STOCK market attribution contract failed for ' +
        x.country + ' ' + x.sku + '.'
      );
    }
  });

  Logger.log(JSON.stringify(s, null, 2));
  return s;
}


function testFctStockSnapshotCompact() {
  const s = fctBuildStockSnapshot_();

  const compact = function(x) {
    return {
      country: x.country,
      sku: x.sku,
      product: x.product,
      available_stock: x.available_stock,
      demand_velocity_used: x.demand_velocity_used,
      available_stock_days: x.available_stock_days,
      stock_gate: x.stock_gate,
      reconciliation_gate: x.reconciliation_gate,
      priority: x.priority,
      pickup_diff:
        x.control_context
          ? x.control_context.pickup_diff
          : null,
      known_market_meta_spend_aed:
        x.known_market_meta_spend_aed,
      sku_total_live_meta_spend_aed:
        x.sku_total_live_meta_spend_aed,
      sku_country_pending_meta_spend_aed:
        x.sku_country_pending_meta_spend_aed,
      sku_group_product_economics:
        x.sku_group_product_economics
          ? {
              meta_spend_aed:
                x.sku_group_product_economics.meta_spend_aed,
              contribution_after_meta_aed:
                x.sku_group_product_economics
                  .contribution_after_meta_aed,
              pnl_status:
                x.sku_group_product_economics.pnl_status
            }
          : null
    };
  };

  const out = {
    agent_id: s.agent_id,
    data_quality_status: s.data_quality.status,
    data_quality_flags: s.data_quality.flags,
    inventory_summary: s.inventory_summary,
    inbound_visibility: s.inbound_visibility,
    meta_market_attribution: s.meta_market_attribution,
    critical_stock:
      (s.critical_stock || []).slice(0, 15).map(compact),
    watch_stock:
      (s.watch_stock || []).slice(0, 15).map(compact),
    top_reconciliation_exceptions:
      (s.reconciliation_exceptions || [])
        .slice(0, 15)
        .map(compact),
    current_inventory_actions: s.current_inventory_actions
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}


function fctStockReadIntelligence_(ss) {
  const sh = ss.getSheetByName('STOCK_INTELLIGENCE');
  if (!sh) {
    throw new Error(
      'Required sheet not found: STOCK_INTELLIGENCE'
    );
  }

  return fctStockRowsToObjects_(sh).map(function(r) {
    const display = String(r['Product (SKU)'] || '');
    const sku = fctStockExtractSku_(display);

    return {
      country: String(r.Country || ''),
      sku: sku,
      product: display.replace(/\s*\(PLG\d+\)\s*$/i, ''),
      available_stock:
        fctStockNumber_(r['Available Stock']),
      confirmed_courier_stock:
        fctStockNumber_(r['Confirmed Courier Stock']),
      pickup_last_7d:
        fctStockNumber_(r['Pickup Last 7d']),
      avg_per_day_7d:
        fctStockNumber_(r['Avg / Day 7d']),
      pickup_last_14d:
        fctStockNumber_(r['Pickup Last 14d']),
      avg_per_day_14d:
        fctStockNumber_(r['Avg / Day 14d']),
      demand_velocity_used:
        fctStockNumber_(r['Demand Velocity Used']),
      available_stock_days:
        fctStockNumberOrNull_(
          r['Available Stock Days']
        ),
      stock_alert: String(r['Stock Alert'] || ''),
      recommended_action:
        String(r['Recommended Action'] || ''),
      data_quality:
        String(r['Data Quality'] || '')
    };
  }).filter(function(r) {
    return r.sku;
  });
}


function fctStockReadControl_(ss) {
  const sh = ss.getSheetByName('INVENTORY_CONTROL');
  if (!sh) return [];

  const values = sh.getDataRange().getValues();
  let headerRow = -1;

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '') === 'Country' &&
        String(values[i][1] || '') === 'Product (SKU)') {
      headerRow = i;
      break;
    }
  }

  if (headerRow < 0) return [];

  const headers = values[headerRow].map(function(h) {
    return String(h || '').trim();
  });

  const out = [];

  for (let r = headerRow + 1; r < values.length; r++) {
    const row = values[r];
    if (!row[0] || !row[1]) continue;

    const obj = {};
    headers.forEach(function(h, c) {
      if (h) obj[h] = row[c];
    });

    const display = String(obj['Product (SKU)'] || '');
    const sku = fctStockExtractSku_(display);
    if (!sku) continue;

    out.push({
      country: String(obj.Country || ''),
      sku: sku,
      physical_purchase:
        fctStockNumberOrNull_(obj['Physical Purchase']),
      accounting_purchase:
        fctStockNumberOrNull_(obj['Accounting Purchase']),
      purchase_diff:
        fctStockNumberOrNull_(obj['Purchase Diff']),
      damaged_lost:
        fctStockNumberOrNull_(obj['Damaged / Lost']),
      pickup_diff:
        fctStockNumberOrNull_(obj['Pickup Diff']),
      core_stock_balance_diff:
        fctStockNumberOrNull_(
          obj['Core Stock Balance Diff']
        ),
      reconciliation_status:
        String(obj['Reconciliation Status'] || ''),
      stock_status:
        String(obj['Stock Status'] || '')
    });
  }

  return out;
}


function fctStockReadProductPnl_(ss) {
  const sh = ss.getSheetByName('PRODUCT_PNL');
  if (!sh) return {};

  const rows = fctStockRowsToObjects_(sh);
  const bySku = {};

  rows.forEach(function(r) {
    if (String(r.Country || '').toUpperCase() !== 'GROUP') {
      return;
    }

    const sku = String(r.SKU || '').trim().toUpperCase();
    if (!sku) return;

    bySku[sku] = {
      total_orders: fctStockNumber_(r.Total_Orders),
      finalized: fctStockNumber_(r.Finalized),
      delivered_paid:
        fctStockNumber_(r.Delivered_Paid),
      delivery_success:
        fctStockNumberOrNull_(r.Delivery_Success),
      gross_contribution_aed:
        fctStockNumber_(r.Gross_Contribution_AED),
      meta_spend_aed:
        fctStockNumber_(r.Meta_Spend_AED),
      contribution_after_meta_aed:
        fctStockNumber_(r.Contribution_After_Meta_AED),
      profit_per_delivered_after_meta_aed:
        fctStockNumber_(
          r.Profit_Per_Delivered_After_Meta_AED
        ),
      pnl_status: String(r.PNL_Status || '')
    };
  });

  return bySku;
}


function fctStockReadMarketMetaSpend_(ss, today, tz, now) {
  const sh = ss.getSheetByName('META_SPEND_LIVE');

  const out = {
    month: String(today || '').substring(0, 7),
    platform_spend_aed: 0,
    country_resolved_spend_aed: 0,
    country_pending_spend_aed: 0,
    by_market_sku: {},
    by_sku: {}
  };

  if (!sh) return out;

  const rows = fctStockRowsToObjects_(sh);

  rows.forEach(function(r) {
    const d = fctStockDateFromCell_(r.Date, now);
    if (!d) return;

    const dateKey = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (dateKey.substring(0, 7) !== out.month) return;

    const spend = fctStockNumber_(r.Spend_AED);
    const sku = String(r.SKU || '').trim().toUpperCase();
    const country = String(r.Country || '').trim();
    const store = String(r.Store || '').trim();
    const mappingStatus =
      String(r.Mapping_Status || '').trim().toUpperCase();

    out.platform_spend_aed += spend;

    if (!sku) return;

    if (!out.by_sku[sku]) {
      out.by_sku[sku] = {
        spend_aed: 0,
        country_pending_spend_aed: 0
      };
    }

    out.by_sku[sku].spend_aed += spend;

    const countryPending =
      !store ||
      !country ||
      mappingStatus === 'PENDING_ACTION' ||
      /^MULTI:/i.test(country);

    if (countryPending) {
      out.country_pending_spend_aed += spend;
      out.by_sku[sku].country_pending_spend_aed += spend;
      return;
    }

    out.country_resolved_spend_aed += spend;

    const key = fctStockKey_(country, sku);
    if (!out.by_market_sku[key]) {
      out.by_market_sku[key] = {
        spend_aed: 0
      };
    }

    out.by_market_sku[key].spend_aed += spend;
  });

  out.platform_spend_aed =
    fctStockRound_(out.platform_spend_aed, 2);
  out.country_resolved_spend_aed =
    fctStockRound_(out.country_resolved_spend_aed, 2);
  out.country_pending_spend_aed =
    fctStockRound_(out.country_pending_spend_aed, 2);

  Object.keys(out.by_market_sku).forEach(function(k) {
    out.by_market_sku[k].spend_aed =
      fctStockRound_(out.by_market_sku[k].spend_aed, 2);
  });

  Object.keys(out.by_sku).forEach(function(k) {
    out.by_sku[k].spend_aed =
      fctStockRound_(out.by_sku[k].spend_aed, 2);
    out.by_sku[k].country_pending_spend_aed =
      fctStockRound_(
        out.by_sku[k].country_pending_spend_aed,
        2
      );
  });

  return out;
}


function fctStockDateFromCell_(value, now) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + value * 86400000);
  }

  const s = String(value || '').trim();
  if (!s) return null;

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}


function fctStockReadAlerts_(ss) {
  const sh = ss.getSheetByName('ALERTS');
  if (!sh) return [];

  return fctStockRowsToObjects_(sh)
    .filter(function(r) {
      const status = String(r.Status || '').toUpperCase();

      if (status &&
          status !== 'OPEN' &&
          status !== 'ACTIVE' &&
          status !== 'PENDING_ACTION') {
        return false;
      }

      const text = [
        r.Area,
        r.Metric,
        r.Message,
        r.Recommended_Action
      ].join(' ');

      return /stock|inventory|warehouse.*courier pickup|purchase history|return data/i
        .test(text);
    })
    .map(function(r) {
      return {
        severity: String(r.Severity || ''),
        area: String(r.Area || ''),
        country: String(r.Country || ''),
        entity: String(r.Entity || ''),
        metric: String(r.Metric || ''),
        current: r.Current,
        message: String(r.Message || ''),
        recommended_action:
          String(r.Recommended_Action || ''),
        status: String(r.Status || '')
      };
    });
}


function fctStockReadActions_(ss) {
  const sh = ss.getSheetByName('ACTION_QUEUE');
  if (!sh) return [];

  return fctStockRowsToObjects_(sh)
    .filter(function(r) {
      const execution =
        String(r.Execution_Status || '').toUpperCase();

      if (execution === 'COMPLETED' ||
          execution === 'CANCELLED') {
        return false;
      }

      const text = [
        r.Agent,
        r.Area,
        r.Recommendation,
        r.Reason
      ].join(' ');

      return /stock|inventory|warehouse|replenish|reorder/i
        .test(text);
    })
    .map(function(r) {
      return {
        action_id: String(r.Action_ID || ''),
        agent: String(r.Agent || ''),
        area: String(r.Area || ''),
        priority: String(r.Priority || ''),
        recommendation:
          String(r.Recommendation || ''),
        reason: String(r.Reason || ''),
        confidence: String(r.Confidence || ''),
        owner: String(r.Owner || ''),
        approval_status:
          String(r.Approval_Status || ''),
        execution_status:
          String(r.Execution_Status || ''),
        due_date: String(r.Due_Date || '')
      };
    });
}


function fctStockAssessInboundVisibility_(ss) {
  const uae = ss.getSheetByName('RAW_PURCHASE_UAE');
  const kwt = ss.getSheetByName('RAW_PURCHASE_KWT');

  let uaeHeaders = [];
  let kwtEvidence = [];

  if (uae && uae.getLastRow() >= 1) {
    uaeHeaders = uae.getRange(
      1,
      1,
      1,
      Math.min(uae.getLastColumn(), 20)
    ).getValues()[0].map(function(x) {
      return String(x || '').trim();
    });
  }

  if (kwt && kwt.getLastRow() >= 3) {
    kwtEvidence = kwt.getRange(
      1,
      1,
      Math.min(3, kwt.getLastRow()),
      Math.min(kwt.getLastColumn(), 20)
    ).getValues();
  }

  const uaeHasInboundFields = uaeHeaders.some(function(h) {
    return /ETA|expected arrival|inbound|PO status|received status|delivery date/i
      .test(h);
  });

  return {
    has_reliable_open_inbound_pipeline: false,
    uae_purchase_history_has_inbound_status_fields:
      uaeHasInboundFields,
    kuwait_purchase_structure:
      'Date-matrix purchase history; no deterministic open-PO/ETA status contract detected.',
    note:
      'Current purchase sources provide purchase history, but no reliable open inbound PO / ETA / MOQ / supplier lead-time pipeline is available. Do not assume incoming stock or reorder quantity.'
  };
}


function fctStockSummary_(rows) {
  return {
    sku_market_rows: rows.length,
    total_available_units:
      fctStockRound_(
        rows.reduce(function(s, x) {
          return s + fctStockNumber_(x.available_stock);
        }, 0),
        0
      ),
    out_of_stock_rows:
      rows.filter(function(x) {
        return x.stock_gate === 'OUT_OF_STOCK';
      }).length,
    critical_le_3d_rows:
      rows.filter(function(x) {
        return x.stock_gate === 'CRITICAL_LE_3_DAYS';
      }).length,
    watch_le_7d_rows:
      rows.filter(function(x) {
        return x.stock_gate === 'WATCH_LE_7_DAYS';
      }).length,
    courier_pickup_recon_rows:
      rows.filter(function(x) {
        return x.reconciliation_gate ===
          'COURIER_PICKUP_RECON_OPEN';
      }).length,
    return_data_recon_rows:
      rows.filter(function(x) {
        return x.reconciliation_gate ===
          'RETURN_DATA_RECON_OPEN';
      }).length,
    purchase_history_recon_rows:
      rows.filter(function(x) {
        return x.reconciliation_gate ===
          'PURCHASE_HISTORY_RECON_OPEN';
      }).length
  };
}


function fctStockRiskSort_(a, b) {
  const aDays = a.available_stock_days === null
    ? 999999
    : a.available_stock_days;
  const bDays = b.available_stock_days === null
    ? 999999
    : b.available_stock_days;

  if (aDays !== bDays) return aDays - bDays;

  return fctStockNumber_(b.demand_velocity_used) -
    fctStockNumber_(a.demand_velocity_used);
}


function fctStockRowsToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];

  const headers = values[0].map(function(h) {
    return String(h || '').trim();
  });

  const out = [];

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
    out.push(obj);
  }

  return out;
}


function fctStockExtractSku_(text) {
  const m = String(text || '').toUpperCase().match(/PLG\d+/);
  return m ? m[0] : '';
}


function fctStockKey_(country, sku) {
  return String(country || '').trim().toLowerCase() +
    '|' +
    String(sku || '').trim().toUpperCase();
}


function fctStockNumber_(value) {
  if (value === undefined ||
      value === null ||
      value === '') {
    return 0;
  }

  const n = Number(value);
  return isNaN(n) ? 0 : n;
}


function fctStockNumberOrNull_(value) {
  if (value === undefined ||
      value === null ||
      value === '') {
    return null;
  }

  const n = Number(value);
  return isNaN(n) ? null : n;
}


function fctStockRound_(value, decimals) {
  if (value === null ||
      value === undefined ||
      isNaN(Number(value))) {
    return value;
  }

  const p = Math.pow(10, decimals || 0);
  return Math.round(Number(value) * p) / p;
}
