/**
 * Founder Control Tower — Step 6E
 * AG005 ROUTE deterministic LOGISTICS_COURIER snapshot.
 *
 * ADDITIVE FILE ONLY.
 *
 * READ / CALCULATE ONLY.
 * No API calls.
 * No sheet writes.
 * No courier/order status changes.
 * No customer contact.
 *
 * Source separation:
 *   1) ORDERS_MASTER = normalized sheet cohort / aging / receivable
 *   2) COURIER_PERF live Supabase block = current operational courier view
 *   3) COURIER_PERF top block = sheet financial/courier view where present
 *   4) CASH_RECON = settlement evidence/reconciliation
 *   5) ALERTS / ACTION_QUEUE = current deterministic controls
 *
 * Never silently merge conflicting cohorts.
 */

function fctBuildRouteSnapshot_() {
  const ss = fctGetSpreadsheet_();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Dubai';
  const now = new Date();
  const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const monthKey = today.substring(0, 7);

  const normalized = fctRouteSummarizeOrders_(ss, monthKey, tz, now);
  const live = fctRouteReadLiveCourierView_(ss, now);
  const sheetFinancial = fctRouteReadSheetCourierView_(ss);
  const settlement = fctRouteReadSettlementRecon_(ss);
  const courierConfig = fctRouteReadCourierConfig_(ss);
  const alerts = fctRouteReadAlerts_(ss);
  const actions = fctRouteReadActions_(ss);

  const normalizedByCourier = {};
  normalized.forEach(function(x) {
    normalizedByCourier[fctRouteCourierKey_(x.courier)] = x;
  });

  const sheetFinancialByCourier = {};
  sheetFinancial.forEach(function(x) {
    sheetFinancialByCourier[fctRouteCourierKey_(x.courier)] = x;
  });

  const liveWithChecks = live.map(function(x) {
    const key = fctRouteCourierKey_(x.courier);
    const sheet = normalizedByCourier[key] || null;
    const fin = sheetFinancialByCourier[key] || null;

    const cohortDifference = sheet
      ? fctRouteRound_(x.live_shipments - sheet.pickups_mtd, 0)
      : null;

    const liveGate = x.finalized_success === null
      ? 'NO_FINALIZED_DATA'
      : (x.finalized_success >= 0.70 ? 'PASS' : 'FAIL');

    const pollAgeHours = x.last_polled_at
      ? fctRouteRound_((now.getTime() - x.last_polled_at.getTime()) / 3600000, 1)
      : null;

    const freshness = pollAgeHours === null
      ? 'UNKNOWN'
      : (pollAgeHours <= 12 ? 'FRESH' : 'STALE_REVIEW');

    return {
      courier: x.courier,
      period: x.period,
      live_shipments: x.live_shipments,
      terminal_delivered: x.terminal_delivered,
      terminal_return: x.terminal_return,
      open_nonterminal: x.open_nonterminal,
      finalized_success: x.finalized_success,
      scale_gate_threshold: 0.70,
      scale_gate_status: liveGate,
      last_polled_utc: x.last_polled_utc,
      poll_age_hours: pollAgeHours,
      freshness_status: freshness,
      source: x.source,
      reconciliation_status: x.reconciliation_status,

      normalized_sheet_pickups_mtd: sheet ? sheet.pickups_mtd : null,
      normalized_sheet_finalized_success:
        sheet ? sheet.finalized_success : null,
      normalized_sheet_open_nonterminal:
        sheet ? sheet.open_nonterminal : null,
      normalized_sheet_courier_receivable_aed:
        sheet ? sheet.courier_receivable_aed : null,
      cohort_difference_live_vs_sheet: cohortDifference,

      sheet_financial_view: fin
        ? {
            total_finalized: fin.total_finalized,
            delivered_paid: fin.delivered_paid,
            rrto: fin.rrto,
            delivery_success: fin.delivery_success,
            delivered_revenue_aed: fin.delivered_revenue_aed,
            courier_cost_aed: fin.courier_cost_aed,
            courier_receivable_aed: fin.courier_receivable_aed
          }
        : null
    };
  });

  const flags = [];

  liveWithChecks.forEach(function(c) {
    const note = String(c.reconciliation_status || '');
    const m = note.match(/cohort\s*\+(\d+)/i);

    if (m &&
        c.cohort_difference_live_vs_sheet !== null &&
        Number(m[1]) !== Math.abs(c.cohort_difference_live_vs_sheet)) {
      flags.push({
        severity: 'REVIEW',
        code: 'RECON_NOTE_VS_COMPUTED_COHORT_MISMATCH',
        courier: c.courier,
        detail: c.courier + ' stored reconciliation note says +' +
          Number(m[1]) +
          ' versus sheet cohort, but this snapshot computes ' +
          c.cohort_difference_live_vs_sheet +
          '. Treat the note as stale/inconsistent until refreshed.'
      });
    }

    if (c.scale_gate_status === 'FAIL') {
      flags.push({
        severity: 'FAIL',
        code: 'COURIER_FINALIZED_SUCCESS_GATE_FAIL',
        courier: c.courier,
        detail: c.courier + ' live finalized success is ' +
          fctRouteRound_(c.finalized_success * 100, 1) +
          '%, below the 70% operating/scale gate.'
      });
    }

    if (c.freshness_status === 'STALE_REVIEW') {
      flags.push({
        severity: 'REVIEW',
        code: 'LIVE_COURIER_VIEW_STALE',
        courier: c.courier,
        detail: c.courier + ' live courier view is ' +
          c.poll_age_hours + ' hours old.'
      });
    }

    if (c.cohort_difference_live_vs_sheet !== null &&
        c.cohort_difference_live_vs_sheet !== 0) {
      flags.push({
        severity: 'REVIEW',
        code: 'LIVE_VS_SHEET_COHORT_MISMATCH',
        courier: c.courier,
        detail: c.courier + ' live shipment cohort differs from ORDERS_MASTER by ' +
          c.cohort_difference_live_vs_sheet +
          ' shipment(s). Do not silently merge the cohorts.'
      });
    }

    if (/REVIEW/i.test(c.reconciliation_status || '')) {
      flags.push({
        severity: 'REVIEW',
        code: 'COURIER_RECONCILIATION_STATUS_REVIEW',
        courier: c.courier,
        detail: c.courier + ': ' + c.reconciliation_status
      });
    }

    if (c.open_nonterminal > 0 && c.normalized_sheet_open_nonterminal !== null) {
      const sheet = normalizedByCourier[fctRouteCourierKey_(c.courier)];
      if (sheet && sheet.pending_aging_over_3d > 0) {
        flags.push({
          severity: 'REVIEW',
          code: 'OPEN_AGING_OVER_3D',
          courier: c.courier,
          detail: c.courier + ' has ' +
            sheet.pending_aging_over_3d +
            ' normalized open shipment(s) older than 3 days.'
        });
      }
    }
  });

  // Normalized couriers that have no live operational row must still
  // surface aging/exposure. Example: KWT OTE is a distinct configured courier.
  normalized.forEach(function(n) {
    const hasLive = liveWithChecks.some(function(c) {
      return fctRouteCourierKey_(c.courier) ===
        fctRouteCourierKey_(n.courier);
    });

    if (!hasLive) {
      if (n.open_nonterminal > 0) {
        flags.push({
          severity: 'REVIEW',
          code: 'NORMALIZED_COURIER_MISSING_LIVE_VIEW',
          courier: n.courier,
          detail: n.courier + ' has ' +
            n.open_nonterminal +
            ' open normalized shipment(s), but no matching live courier row is available.'
        });
      }

      if (n.pending_aging_over_3d > 0) {
        flags.push({
          severity: 'REVIEW',
          code: 'OPEN_AGING_OVER_3D',
          courier: n.courier,
          detail: n.courier + ' has ' +
            n.pending_aging_over_3d +
            ' normalized open shipment(s) older than 3 days.'
        });
      }
    }
  });

  liveWithChecks.forEach(function(c) {
    if (!c.sheet_financial_view) return;

    const normalizedFinalized = c.normalized_sheet_pickups_mtd === null
      ? null
      : (normalizedByCourier[fctRouteCourierKey_(c.courier)] || {}).finalized;

    const financialFinalized = fctRouteNumber_(
      c.sheet_financial_view.total_finalized
    );

    if (normalizedFinalized !== null &&
        normalizedFinalized !== undefined &&
        financialFinalized !== normalizedFinalized) {
      flags.push({
        severity: 'REVIEW',
        code: 'SHEET_FINANCIAL_VS_NORMALIZED_COHORT_MISMATCH',
        courier: c.courier,
        detail: c.courier + ' COURIER_PERF financial view has ' +
          financialFinalized + ' finalized shipment(s) while current-month ' +
          'ORDERS_MASTER has ' + normalizedFinalized +
          '. Treat them as different cohorts until reconciled.'
      });
    }

    const finReceivable =
      fctRouteNumber_(c.sheet_financial_view.courier_receivable_aed);
    const normalizedReceivable =
      fctRouteNumber_(c.normalized_sheet_courier_receivable_aed);

    if (Math.abs(finReceivable - normalizedReceivable) > 0.01) {
      flags.push({
        severity: 'REVIEW',
        code: 'SHEET_FINANCIAL_VS_NORMALIZED_RECEIVABLE_MISMATCH',
        courier: c.courier,
        detail: c.courier + ' COURIER_PERF financial receivable is AED ' +
          fctRouteRound_(finReceivable, 2) +
          ' while current-month ORDERS_MASTER Delivered-unpaid receivable is AED ' +
          fctRouteRound_(normalizedReceivable, 2) +
          '. Do not substitute one for the other until cohort/cash semantics are reconciled.'
      });
    }
  });

  settlement.forEach(function(x) {
    if (/REVIEW/i.test(x.status_note || '')) {
      flags.push({
        severity: 'REVIEW',
        code: 'SETTLEMENT_EVIDENCE_INCOMPLETE',
        courier: x.courier,
        detail: x.courier + ' settlement reconciliation remains review-only. ' +
          'Do not call the screening difference a confirmed shortage/loss without settlement evidence.'
      });
    }
  });

  const courierPickupMismatchAlerts = alerts.filter(function(a) {
    return /warehouse.*courier pickup|courier pickup/i.test(
      [a.metric, a.message].join(' ')
    );
  });

  if (courierPickupMismatchAlerts.some(function(a) {
    return /ACT NOW/i.test(a.severity || '');
  })) {
    flags.push({
      severity: 'REVIEW',
      code: 'WAREHOUSE_COURIER_PICKUP_RECON_OPEN',
      detail: courierPickupMismatchAlerts.filter(function(a) {
        return /ACT NOW/i.test(a.severity || '');
      }).slice(0, 10).map(function(a) {
        return a.entity + ' (' + a.current + ')';
      }).join(', ')
    });
  }

  const lastMileAction = actions.find(function(a) {
    return /last mile/i.test(a.area + ' ' + a.recommendation);
  });

  if (lastMileAction) {
    flags.push({
      severity: 'FAIL',
      code: 'LAST_MILE_ACTION_OPEN',
      courier: 'Last Mile',
      detail: lastMileAction.recommendation +
        ' Approval status: ' + lastMileAction.approval_status +
        '; execution: ' + lastMileAction.execution_status + '.'
    });
  }

  return {
    contract_version: '1.0',
    agent_id: 'AG005',
    agent: 'ROUTE',
    domain: 'LOGISTICS_COURIER',
    generated_at: Utilities.formatDate(
      now,
      tz,
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    ),
    period: {
      month: monthKey,
      today: today
    },

    normalized_order_view: normalized,
    live_courier_view: liveWithChecks,
    sheet_financial_courier_view: sheetFinancial,
    settlement_reconciliation: settlement,
    courier_config: courierConfig,

    current_logistics_alerts: alerts.slice(0, 20),
    current_logistics_actions: actions.slice(0, 12),

    data_quality: {
      status: flags.some(function(f) { return f.severity === 'FAIL'; })
        ? 'FAIL'
        : (flags.length ? 'REVIEW' : 'PASS'),
      flags: flags
    },

    governance: {
      mode: 'RECOMMENDATION_ONLY',
      may_execute: false,
      final_delivery_success_formula:
        '(Delivered + Paid) / (Delivered + Paid + RRTO)',
      paid_semantics: 'PAID means delivered COD remittance received; never infer Delivered -> Paid.',
      cohort_rule:
        'Keep live courier operational cohorts separate from ORDERS_MASTER and cash settlement cohorts unless reconciled.',
      source_precedence: [
        'LIVE_COURIER_OPERATIONAL_VIEW_FOR_CURRENT_STATUS',
        'NORMALIZED_ORDERS_FOR_SHEET_COHORT_AND_AGING',
        'SETTLEMENT_EVIDENCE_FOR_CASH_RECON',
        'CURRENT_ALERTS_AND_ACTION_QUEUE',
        'AI_INTERPRETATION'
      ],
      pii_included: false
    },

    source_tabs: [
      'ORDERS_MASTER',
      'COURIER_PERF',
      'CASH_RECON',
      'CONFIG',
      'ALERTS',
      'ACTION_QUEUE'
    ]
  };
}


function testFctRouteSnapshotNoApi() {
  const s = fctBuildRouteSnapshot_();

  if (!s || s.agent_id !== 'AG005') {
    throw new Error('ROUTE snapshot contract failed: AG005 identity missing.');
  }

  if (!s.data_quality || !s.data_quality.status) {
    throw new Error('ROUTE snapshot contract failed: data-quality status missing.');
  }

  const lastMile = (s.live_courier_view || []).find(function(x) {
    return fctRouteCourierKey_(x.courier) === 'last mile';
  });

  if (lastMile &&
      lastMile.finalized_success !== null &&
      lastMile.finalized_success < 0.70 &&
      lastMile.scale_gate_status !== 'FAIL') {
    throw new Error(
      'ROUTE safety contract failed: Last Mile below 70% but gate did not fail.'
    );
  }

  if ((s.settlement_reconciliation || []).some(function(x) {
        return /SETTLEMENT RECON/i.test(x.courier || '');
      })) {
    throw new Error(
      'ROUTE settlement contract failed: section title parsed as courier.'
    );
  }

  const normalizedOnlyAging = (s.normalized_order_view || []).filter(function(n) {
    const hasLive = (s.live_courier_view || []).some(function(c) {
      return fctRouteCourierKey_(c.courier) ===
        fctRouteCourierKey_(n.courier);
    });
    return !hasLive && n.pending_aging_over_3d > 0;
  });

  normalizedOnlyAging.forEach(function(n) {
    const flagged = (s.data_quality.flags || []).some(function(f) {
      return f.code === 'OPEN_AGING_OVER_3D' &&
        fctRouteCourierKey_(f.courier) === fctRouteCourierKey_(n.courier);
    });

    if (!flagged) {
      throw new Error(
        'ROUTE aging contract failed: normalized-only courier aging was not surfaced for ' +
        n.courier + '.'
      );
    }
  });

  Logger.log(JSON.stringify(s, null, 2));
  return s;
}


function testFctRouteSnapshotCompact() {
  const s = fctBuildRouteSnapshot_();

  const out = {
    agent_id: s.agent_id,
    data_quality_status: s.data_quality.status,
    data_quality_flags: s.data_quality.flags,
    normalized_order_view: s.normalized_order_view,
    live_courier_view: s.live_courier_view.map(function(x) {
      return {
        courier: x.courier,
        live_shipments: x.live_shipments,
        terminal_delivered: x.terminal_delivered,
        terminal_return: x.terminal_return,
        open_nonterminal: x.open_nonterminal,
        finalized_success: x.finalized_success,
        scale_gate_status: x.scale_gate_status,
        poll_age_hours: x.poll_age_hours,
        freshness_status: x.freshness_status,
        reconciliation_status: x.reconciliation_status,
        normalized_sheet_pickups_mtd: x.normalized_sheet_pickups_mtd,
        normalized_sheet_finalized_success:
          x.normalized_sheet_finalized_success,
        normalized_sheet_open_nonterminal:
          x.normalized_sheet_open_nonterminal,
        normalized_sheet_courier_receivable_aed:
          x.normalized_sheet_courier_receivable_aed,
        cohort_difference_live_vs_sheet:
          x.cohort_difference_live_vs_sheet,
        sheet_financial_view: x.sheet_financial_view
      };
    }),
    settlement_reconciliation: s.settlement_reconciliation,
    courier_config: s.courier_config,
    logistics_actions: s.current_logistics_actions
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}


function fctRouteSummarizeOrders_(ss, monthKey, tz, now) {
  const sh = ss.getSheetByName('ORDERS_MASTER');
  if (!sh) throw new Error('Required sheet not found: ORDERS_MASTER');

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  const n = lastRow - 1;

  // G:H = Courier, Pickup_Date
  // AF:AL = Status_Group, Delivery_Cost_AED, Is_Finalized,
  //         Is_Delivered, Is_Paid, Is_RRTO, Courier_Receivable_AED
  const courierPickup = sh.getRange(2, 7, n, 2).getValues();
  const statusBlock = sh.getRange(2, 32, n, 7).getValues();

  const byCourier = {};

  for (let i = 0; i < n; i++) {
    const courier = String(courierPickup[i][0] || '').trim();
    if (!courier) continue;

    const pickupDate = fctRouteDateFromCell_(courierPickup[i][1], now);
    if (!pickupDate) continue;

    const dateKey = Utilities.formatDate(pickupDate, tz, 'yyyy-MM-dd');
    if (dateKey.substring(0, 7) !== monthKey) continue;

    const key = fctRouteCourierKey_(courier);

    if (!byCourier[key]) {
      byCourier[key] = {
        courier: courier,
        pickups_mtd: 0,
        delivered_unpaid: 0,
        paid: 0,
        rrto: 0,
        open_nonterminal: 0,
        finalized: 0,
        finalized_success: null,
        courier_receivable_aed: 0,
        pending_aging_over_1d: 0,
        pending_aging_over_2d: 0,
        pending_aging_over_3d: 0
      };
    }

    const x = byCourier[key];
    x.pickups_mtd++;

    const status = String(statusBlock[i][0] || '').trim().toUpperCase();
    const isFinalized =
      fctRouteNumber_(statusBlock[i][2]) === 1;
    const isDelivered =
      fctRouteNumber_(statusBlock[i][3]) === 1;
    const isPaid =
      fctRouteNumber_(statusBlock[i][4]) === 1 || status === 'PAID';
    const isRrto =
      fctRouteNumber_(statusBlock[i][5]) === 1 || status === 'RRTO';

    if (isPaid) {
      x.paid++;
    } else if (isDelivered) {
      x.delivered_unpaid++;
    }

    if (isRrto) x.rrto++;

    if (isFinalized || isPaid || isDelivered || isRrto) {
      x.finalized++;
    } else {
      x.open_nonterminal++;

      const ageDays =
        (now.getTime() - pickupDate.getTime()) / 86400000;

      if (ageDays > 1) x.pending_aging_over_1d++;
      if (ageDays > 2) x.pending_aging_over_2d++;
      if (ageDays > 3) x.pending_aging_over_3d++;
    }

    x.courier_receivable_aed +=
      fctRouteNumber_(statusBlock[i][6]);
  }

  return Object.keys(byCourier)
    .map(function(k) {
      const x = byCourier[k];
      const successCount = x.delivered_unpaid + x.paid;
      const denom = successCount + x.rrto;

      x.finalized_success = denom
        ? fctRouteRound_(successCount / denom, 4)
        : null;
      x.courier_receivable_aed =
        fctRouteRound_(x.courier_receivable_aed, 2);

      return x;
    })
    .sort(function(a, b) {
      return b.pickups_mtd - a.pickups_mtd;
    });
}


function fctRouteReadLiveCourierView_(ss, now) {
  const sh = ss.getSheetByName('COURIER_PERF');
  if (!sh) throw new Error('Required sheet not found: COURIER_PERF');

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

    const lastPolledText = String(obj.Last_Polled_UTC || '');
    const lastPolledAt =
      fctRouteParseUtcTimestamp_(lastPolledText);

    out.push({
      period: String(obj.Period || ''),
      courier: String(obj.Courier || ''),
      live_shipments: fctRouteNumber_(obj.Live_Shipments),
      terminal_delivered:
        fctRouteNumber_(obj.Terminal_Delivered),
      terminal_return:
        fctRouteNumber_(obj.Terminal_Return),
      open_nonterminal:
        fctRouteNumber_(obj.Open_NonTerminal),
      finalized_success: success,
      last_polled_utc: lastPolledText,
      last_polled_at: lastPolledAt,
      source: String(obj.Source || ''),
      reconciliation_status:
        String(obj.Reconciliation_Status || '')
    });
  }

  return out;
}


function fctRouteReadSheetCourierView_(ss) {
  const sh = ss.getSheetByName('COURIER_PERF');
  if (!sh) return [];

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(function(x) {
    return String(x || '').trim();
  });

  const out = [];

  for (let r = 1; r < values.length; r++) {
    if (!values[r][0] || !values[r][1]) break;

    const obj = {};
    headers.forEach(function(h, c) {
      if (h) obj[h] = values[r][c];
    });

    out.push({
      country: String(obj.Country || ''),
      courier: String(obj.Courier || ''),
      total_finalized:
        fctRouteNumber_(obj.Total_Finalized),
      delivered_paid:
        fctRouteNumber_(obj.Delivered_Paid),
      rrto: fctRouteNumber_(obj.RRTO),
      delivery_success:
        fctRouteNumberOrNull_(obj.Delivery_Success),
      delivered_revenue_aed:
        fctRouteRound_(
          fctRouteNumber_(obj.Delivered_Revenue_AED),
          2
        ),
      courier_cost_aed:
        fctRouteRound_(
          fctRouteNumber_(obj.Courier_Cost_AED),
          2
        ),
      courier_receivable_aed:
        fctRouteRound_(
          fctRouteNumber_(obj.Courier_Receivable_AED),
          2
        )
    });
  }

  return out;
}


function fctRouteReadSettlementRecon_(ss) {
  const sh = ss.getSheetByName('CASH_RECON');
  if (!sh) return [];

  // Rows 3:5 are the validated top-level courier summary.
  // Do not scan into the detailed C3X section beginning below it.
  const values = sh.getRange('A3:F5').getValues();

  return values
    .filter(function(r) {
      return String(r[0] || '').trim();
    })
    .map(function(r) {
      return {
        courier: String(r[0] || '').trim(),
        basis: String(r[1] || ''),
        expected_statement_aed:
          fctRouteRound_(fctRouteNumber_(r[2]), 2),
        bank_credits_aed:
          fctRouteRound_(fctRouteNumber_(r[3]), 2),
        difference_aed:
          fctRouteRound_(fctRouteNumber_(r[4]), 2),
        status_note: String(r[5] || '')
      };
    });
}


function fctRouteReadCourierConfig_(ss) {
  const sh = ss.getSheetByName('CONFIG');
  if (!sh) return [];

  const values = sh.getRange('A22:F30').getValues();
  const out = [];

  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const country = String(r[0] || '').trim();
    const courier = String(r[1] || '').trim();

    if (!country || !courier) continue;
    if (country === 'COSTING_PRIORITY' ||
        country === 'OTO_COST_POLICY') {
      continue;
    }

    out.push({
      country: country,
      courier: courier,
      delivered_fee_rule: String(r[2] || ''),
      rto_fee_rule: String(r[3] || ''),
      notes: String(r[4] || '')
    });
  }

  return out;
}


function fctRouteReadAlerts_(ss) {
  const sh = ss.getSheetByName('ALERTS');
  if (!sh) return [];

  return fctRouteRowsToObjects_(sh)
    .filter(function(r) {
      const status = String(r.Status || '').toUpperCase();
      if (status && status !== 'OPEN' &&
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

      return /courier|delivery|logistics|last mile|warehouse.*courier pickup|remittance|settlement/i
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


function fctRouteReadActions_(ss) {
  const sh = ss.getSheetByName('ACTION_QUEUE');
  if (!sh) return [];

  return fctRouteRowsToObjects_(sh)
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

      return /logistics|courier|last mile|delivery|remittance|settlement/i
        .test(text);
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
        owner: String(r.Owner || ''),
        approval_status:
          String(r.Approval_Status || ''),
        execution_status:
          String(r.Execution_Status || ''),
        due_date: String(r.Due_Date || '')
      };
    });
}


function fctRouteRowsToObjects_(sheet) {
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


function fctRouteCourierKey_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');
}


function fctRouteParseUtcTimestamp_(text) {
  const s = String(text || '').trim();
  if (!s) return null;

  // Example: 2026-09-09 10:00:16+00
  const normalized = s
    .replace(' ', 'T')
    .replace(/\+00$/, 'Z');

  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}


function fctRouteDateFromCell_(value, now) {
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

  const m = s.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3,9})$/);
  if (m) {
    const year = (now || new Date()).getFullYear();
    const d = new Date(m[1] + ' ' + m[2] + ' ' + year);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}


function fctRouteNumber_(value) {
  if (value === undefined ||
      value === null ||
      value === '') {
    return 0;
  }

  const n = Number(value);
  return isNaN(n) ? 0 : n;
}


function fctRouteNumberOrNull_(value) {
  if (value === undefined ||
      value === null ||
      value === '') {
    return null;
  }

  const n = Number(value);
  return isNaN(n) ? null : n;
}


function fctRouteRound_(value, decimals) {
  if (value === null ||
      value === undefined ||
      isNaN(Number(value))) {
    return value;
  }

  const p = Math.pow(10, decimals || 0);
  return Math.round(Number(value) * p) / p;
}
