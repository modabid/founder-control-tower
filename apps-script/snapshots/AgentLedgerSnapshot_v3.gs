/**
 * Founder Control Tower — Step 6A
 * LEDGER deterministic domain snapshot.
 *
 * ADDITIVE FILE ONLY.
 * Does not call AI, does not write to business operations, and does not
 * modify Code.gs / TikTokOAuth.gs / existing runtime files.
 */

function fctBuildLedgerSnapshot_() {
  const ss = fctLedgerOpenSpreadsheet_();
  const tz = ss.getSpreadsheetTimeZone() || 'Asia/Dubai';
  const now = new Date();
  const todayKey = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const monthKey = Utilities.formatDate(now, tz, 'yyyy-MM');

  const dailyRows = fctLedgerObjects_(ss, 'DAILY_PNL');
  const metaRows = fctLedgerObjects_(ss, 'META_SPEND_LIVE');
  const payrollRows = fctLedgerObjects_(ss, 'PAYROLL_LEDGER');
  const opexRows = fctLedgerObjects_(ss, 'OPEX_CONTROL');
  const subscriptionRows = fctLedgerObjects_(ss, 'SUBSCRIPTIONS_CONTROL');
  const alertRows = fctLedgerObjects_(ss, 'ALERTS');
  const actionRows = fctLedgerObjects_(ss, 'ACTION_QUEUE');

  const pnl = fctLedgerSummarizeDailyPnl_(dailyRows, monthKey, tz, now);
  const orderCash = fctLedgerSummarizeOrderCash_(ss, monthKey, tz, now);
  const meta = fctLedgerSummarizeMeta_(metaRows, monthKey, tz, now);
  const payroll = fctLedgerSummarizePayroll_(payrollRows, monthKey);
  const opex = fctLedgerSummarizeOpex_(opexRows);
  const subscriptions = fctLedgerSummarizeSubscriptions_(subscriptionRows);
  const cashRecon = fctLedgerReadCourierCashRecon_(ss);
  const financeAlerts = fctLedgerFilterFinanceAlerts_(alertRows);
  const financeActions = fctLedgerFilterFinanceActions_(actionRows);

  const monthlyFixedBaseline = fctLedgerRound_(
    payroll.gross_payroll_aed +
    opex.monthly_opex_aed +
    subscriptions.core_active_saas_aed,
    2
  );

  const daysInMonth = new Date(
    Number(monthKey.substring(0, 4)),
    Number(monthKey.substring(5, 7)),
    0
  ).getDate();

  const todayDay = Math.min(Number(Utilities.formatDate(now, tz, 'd')), daysInMonth);
  const todayAccrualFactor = todayDay / daysInMonth;

  let pnlAccrualFactor = null;
  if (pnl.latest_date && pnl.latest_date.substring(0, 7) === monthKey) {
    pnlAccrualFactor = Number(pnl.latest_date.substring(8, 10)) / daysInMonth;
  }

  const fixedAccrualToday = fctLedgerRound_(monthlyFixedBaseline * todayAccrualFactor, 2);
  const fixedAccrualToPnl = pnlAccrualFactor === null
    ? null
    : fctLedgerRound_(monthlyFixedBaseline * pnlAccrualFactor, 2);

  const totalMetaSpend = meta.total_meta_spend_aed;
  const metaAllocationGap = fctLedgerRound_(
    totalMetaSpend - pnl.meta_spend_in_daily_pnl_aed,
    2
  );

  const contributionAfterAllMeta = fctLedgerRound_(
    pnl.gross_contribution_aed - totalMetaSpend,
    2
  );

  const opProfitBeforeTikTokCalendar = fctLedgerRound_(
    contributionAfterAllMeta - fixedAccrualToday,
    2
  );

  const opProfitBeforeTikTokAligned = fixedAccrualToPnl === null
    ? null
    : fctLedgerRound_(contributionAfterAllMeta - fixedAccrualToPnl, 2);

  const flags = [];

  if (pnl.tiktok_missing) {
    flags.push({
      severity: 'FAIL',
      code: 'TIKTOK_SPEND_MISSING',
      detail: 'Real Contribution and Operating Profit remain blocked until live TikTok spend is available.'
    });
  }

  if (Math.abs(metaAllocationGap) > 0.01) {
    flags.push({
      severity: 'REVIEW',
      code: 'META_TOTAL_VS_PNL_ALLOCATION_GAP',
      detail: 'Total META_SPEND_LIVE differs from Meta spend represented inside DAILY_PNL. Keep total platform cost separate from mapped product/country allocation.'
    });
  }

  if (pnl.latest_date && pnl.latest_date !== todayKey) {
    flags.push({
      severity: 'REVIEW',
      code: 'PNL_CUTOFF_NOT_TODAY',
      detail: 'DAILY_PNL latest date is ' + pnl.latest_date + ' while calendar accrual is through ' + todayKey + '. Do not treat the two operating-profit views as equivalent.'
    });
  }

  if (meta.latest_date && pnl.latest_date && meta.latest_date !== pnl.latest_date) {
    flags.push({
      severity: 'REVIEW',
      code: 'META_PNL_CUTOFF_MISMATCH',
      detail: 'META_SPEND_LIVE latest date and DAILY_PNL latest date differ.'
    });
  }

  if (Math.abs(pnl.courier_receivable_aed - orderCash.courier_receivable_aed) > 0.01) {
    flags.push({
      severity: 'REVIEW',
      code: 'DAILY_PNL_COURIER_RECEIVABLE_MISMATCH',
      detail: 'DAILY_PNL courier receivable differs from ORDERS_MASTER cash-status receivable. LEDGER uses ORDERS_MASTER for cash/receivable because PAID orders must carry zero courier receivable.'
    });
  }

  if (orderCash.paid_orders_with_receivable_nonzero > 0) {
    flags.push({
      severity: 'FAIL',
      code: 'PAID_ORDER_HAS_RECEIVABLE',
      detail: orderCash.paid_orders_with_receivable_nonzero + ' PAID order(s) still carry non-zero courier receivable in ORDERS_MASTER.'
    });
  }

  if (Math.abs(pnl.delivered_paid - orderCash.terminal_success_count) > 0.01) {
    flags.push({
      severity: 'REVIEW',
      code: 'DAILY_PNL_VS_ORDER_SUCCESS_COUNT_MISMATCH',
      detail: 'DAILY_PNL Delivered_Paid count differs from normalized ORDERS_MASTER terminal-success count for the month.'
    });
  }

  if (payroll.payment_evidence_pending_count > 0) {
    flags.push({
      severity: 'REVIEW',
      code: 'PAYROLL_PAYMENT_EVIDENCE_PENDING',
      detail: payroll.payment_evidence_pending_count + ' payroll row(s) are accrued but payment evidence is still pending.'
    });
  }

  if (subscriptions.active_missing_cost_count > 0) {
    flags.push({
      severity: 'REVIEW',
      code: 'ACTIVE_SUBSCRIPTION_COST_MISSING',
      detail: subscriptions.active_missing_cost_count + ' active subscription row(s) have no observed AED cost yet.'
    });
  }

  if (cashRecon.review_count > 0) {
    flags.push({
      severity: 'REVIEW',
      code: 'COURIER_CASH_RECON_OPEN',
      detail: cashRecon.review_count + ' courier cash reconciliation item(s) still require settlement evidence.'
    });
  }

  return {
    contract_version: '1.0',
    agent_id: 'AG003',
    agent: 'LEDGER',
    domain: 'FINANCE_CASH',
    generated_at: Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    period: {
      month: monthKey,
      today: todayKey,
      daily_pnl_latest_date: pnl.latest_date,
      meta_latest_date: meta.latest_date
    },
    economics: {
      orders_picked_mtd: pnl.orders_picked,
      delivered_paid_mtd: pnl.delivered_paid,
      delivered_unpaid_mtd: orderCash.delivered_unpaid_count,
      paid_mtd: orderCash.paid_count,
      pending_mtd: pnl.pending,
      rrto_mtd: pnl.rrto,
      finalized_delivery_success: pnl.finalized_delivery_success,
      delivered_revenue_aed: pnl.delivered_revenue_aed,
      gross_contribution_aed: pnl.gross_contribution_aed,

      // Cash and profit are intentionally separate.
      // ORDERS_MASTER is authoritative here because PAID means COD remitted.
      courier_receivable_aed: orderCash.courier_receivable_aed,
      paid_order_cod_aed: orderCash.paid_cod_aed,
      daily_pnl_courier_receivable_aed: pnl.courier_receivable_aed,

      meta_platform_spend_aed: totalMetaSpend,
      meta_spend_in_daily_pnl_aed: pnl.meta_spend_in_daily_pnl_aed,
      meta_not_represented_in_daily_pnl_aed: metaAllocationGap,
      contribution_after_all_meta_aed: contributionAfterAllMeta,

      tiktok_spend_aed: null,
      real_contribution_profit_aed: null,
      real_contribution_status: pnl.tiktok_missing
        ? 'BLOCKED_MISSING_TIKTOK_SPEND'
        : 'READY_FOR_RECALC',

      monthly_fixed_cost_baseline_aed: monthlyFixedBaseline,
      fixed_cost_accrual_through_today_aed: fixedAccrualToday,
      fixed_cost_accrual_through_pnl_date_aed: fixedAccrualToPnl,
      operating_profit_before_tiktok_calendar_accrual_aed: opProfitBeforeTikTokCalendar,
      operating_profit_before_tiktok_pnl_aligned_aed: opProfitBeforeTikTokAligned,
      real_operating_profit_aed: null,
      real_operating_profit_status: pnl.tiktok_missing
        ? 'BLOCKED_MISSING_TIKTOK_SPEND'
        : 'READY_FOR_RECALC'
    },
    fixed_costs: {
      payroll: payroll,
      opex: opex,
      subscriptions: subscriptions
    },
    normalized_order_cash: orderCash,
    cash_reconciliation: cashRecon,
    current_finance_alerts: financeAlerts,
    current_finance_actions: financeActions,
    data_quality: {
      status: flags.some(function (x) { return x.severity === 'FAIL'; }) ? 'FAIL' :
        (flags.length ? 'REVIEW' : 'PASS'),
      flags: flags
    },
    governance: {
      mode: 'RECOMMENDATION_ONLY',
      may_execute: false,
      source_precedence: [
        'DETERMINISTIC_CONTROL_DATA',
        'CURRENT_ALERTS',
        'ACTION_QUEUE',
        'AI_INTERPRETATION'
      ],
      pii_included: false
    },
    source_tabs: [
      'DAILY_PNL',
      'ORDERS_MASTER',
      'META_SPEND_LIVE',
      'PAYROLL_LEDGER',
      'OPEX_CONTROL',
      'SUBSCRIPTIONS_CONTROL',
      'CASH_RECON',
      'ALERTS',
      'ACTION_QUEUE'
    ]
  };
}

function testFctLedgerSnapshotNoApi() {
  const snapshot = fctBuildLedgerSnapshot_();

  if (!snapshot || snapshot.agent_id !== 'AG003') {
    throw new Error('LEDGER snapshot contract failed: wrong agent_id.');
  }
  if (!snapshot.economics || !isFinite(Number(snapshot.economics.gross_contribution_aed))) {
    throw new Error('LEDGER snapshot contract failed: gross contribution missing.');
  }
  if (!snapshot.fixed_costs || Number(snapshot.economics.monthly_fixed_cost_baseline_aed) <= 0) {
    throw new Error('LEDGER snapshot contract failed: fixed-cost baseline missing.');
  }
  if (!snapshot.data_quality || !snapshot.data_quality.status) {
    throw new Error('LEDGER snapshot contract failed: data-quality status missing.');
  }
  if (!snapshot.normalized_order_cash) {
    throw new Error('LEDGER snapshot contract failed: normalized order cash summary missing.');
  }
  if (Number(snapshot.normalized_order_cash.paid_orders_with_receivable_nonzero) !== 0) {
    throw new Error('LEDGER cash contract failed: PAID order has non-zero courier receivable.');
  }

  Logger.log(JSON.stringify(snapshot, null, 2));
  return snapshot;
}

function fctLedgerOpenSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('FCT_SPREADSHEET_ID');
  if (!id) {
    throw new Error('FCT_SPREADSHEET_ID Script Property is missing.');
  }
  return SpreadsheetApp.openById(id);
}

function fctLedgerObjects_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Required sheet not found: ' + sheetName);

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return [];

  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  if (!values.length) return [];

  const headers = values[0].map(function (v) { return String(v || '').trim(); });
  const out = [];

  for (let r = 1; r < values.length; r++) {
    if (!values[r].some(function (v) { return v !== '' && v !== null; })) continue;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      if (headers[c]) obj[headers[c]] = values[r][c];
    }
    out.push(obj);
  }
  return out;
}

function fctLedgerSummarizeDailyPnl_(rows, monthKey, tz, now) {
  const current = [];
  let latest = null;

  rows.forEach(function (r) {
    const d = fctLedgerDateFromCell_(r.Date, now);
    if (!d) return;
    const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (key.substring(0, 7) !== monthKey) return;
    current.push(r);
    if (!latest || d.getTime() > latest.getTime()) latest = d;
  });

  const deliveredPaid = fctLedgerSum_(current, 'Delivered_Paid');
  const rrto = fctLedgerSum_(current, 'RRTO');
  const finalized = deliveredPaid + rrto;

  const tiktokMissing = current.some(function (r) {
    const status = String(r.PNL_Status || '').toUpperCase();
    return status.indexOf('TIKTOK') > -1 && status.indexOf('PROVISIONAL') > -1;
  });

  return {
    row_count: current.length,
    latest_date: latest ? Utilities.formatDate(latest, tz, 'yyyy-MM-dd') : null,
    orders_picked: fctLedgerSum_(current, 'Orders_Picked'),
    delivered_paid: deliveredPaid,
    pending: fctLedgerSum_(current, 'Pending'),
    rrto: rrto,
    finalized_delivery_success: finalized > 0
      ? fctLedgerRound_(deliveredPaid / finalized, 4)
      : null,
    delivered_revenue_aed: fctLedgerRound_(fctLedgerSum_(current, 'Delivered_Revenue_AED'), 2),
    gross_contribution_aed: fctLedgerRound_(fctLedgerSum_(current, 'Gross_Contribution_AED'), 2),
    meta_spend_in_daily_pnl_aed: fctLedgerRound_(fctLedgerSum_(current, 'Meta_Spend_AED'), 2),
    courier_receivable_aed: fctLedgerRound_(fctLedgerSum_(current, 'Courier_Receivable_AED'), 2),
    tiktok_missing: tiktokMissing
  };
}

function fctLedgerSummarizeOrderCash_(ss, monthKey, tz, now) {
  const sh = ss.getSheetByName('ORDERS_MASTER');
  if (!sh) throw new Error('Required sheet not found: ORDERS_MASTER');

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return {
      row_count: 0,
      terminal_success_count: 0,
      delivered_unpaid_count: 0,
      paid_count: 0,
      delivered_unpaid_cod_aed: 0,
      paid_cod_aed: 0,
      courier_receivable_aed: 0,
      paid_orders_with_receivable_nonzero: 0
    };
  }

  const n = lastRow - 1;

  // Read only the columns required for the cash/receivable contract.
  // H Pickup_Date, AC COD_AED, AF Status_Group,
  // AI Is_Delivered, AJ Is_Paid, AL Courier_Receivable_AED.
  const pickupDates = sh.getRange(2, 8, n, 1).getValues();
  const codValues = sh.getRange(2, 29, n, 1).getValues();
  const statusValues = sh.getRange(2, 32, n, 1).getValues();
  const deliveredValues = sh.getRange(2, 35, n, 1).getValues();
  const paidValues = sh.getRange(2, 36, n, 1).getValues();
  const receivableValues = sh.getRange(2, 38, n, 1).getValues();

  let rowCount = 0;
  let paidCount = 0;
  let deliveredUnpaidCount = 0;
  let paidCod = 0;
  let deliveredUnpaidCod = 0;
  let receivable = 0;
  let paidWithReceivable = 0;

  for (let i = 0; i < n; i++) {
    const d = fctLedgerDateFromCell_(pickupDates[i][0], now);
    if (!d) continue;

    const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (key.substring(0, 7) !== monthKey) continue;

    rowCount++;

    const status = String(statusValues[i][0] || '').trim().toUpperCase();
    const isPaid = fctLedgerNumber_(paidValues[i][0]) === 1 || status === 'PAID';
    const isDelivered = fctLedgerNumber_(deliveredValues[i][0]) === 1 ||
      status === 'DELIVERED' || isPaid;

    const cod = fctLedgerNumber_(codValues[i][0]);
    const recv = fctLedgerNumber_(receivableValues[i][0]);

    if (isPaid) {
      paidCount++;
      paidCod += cod;
      if (Math.abs(recv) > 0.01) paidWithReceivable++;
    } else if (isDelivered) {
      deliveredUnpaidCount++;
      deliveredUnpaidCod += cod;
    }

    receivable += recv;
  }

  return {
    row_count: rowCount,
    terminal_success_count: paidCount + deliveredUnpaidCount,
    delivered_unpaid_count: deliveredUnpaidCount,
    paid_count: paidCount,
    delivered_unpaid_cod_aed: fctLedgerRound_(deliveredUnpaidCod, 2),
    paid_cod_aed: fctLedgerRound_(paidCod, 2),
    courier_receivable_aed: fctLedgerRound_(receivable, 2),
    paid_orders_with_receivable_nonzero: paidWithReceivable
  };
}

function fctLedgerSummarizeMeta_(rows, monthKey, tz, now) {
  const current = [];
  let latest = null;
  const mapping = {};

  rows.forEach(function (r) {
    const d = fctLedgerDateFromCell_(r.Date, now);
    if (!d) return;
    const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
    if (key.substring(0, 7) !== monthKey) return;
    current.push(r);
    if (!latest || d.getTime() > latest.getTime()) latest = d;

    const status = String(r.Mapping_Status || 'UNKNOWN').trim() || 'UNKNOWN';
    mapping[status] = (mapping[status] || 0) + 1;
  });

  return {
    row_count: current.length,
    latest_date: latest ? Utilities.formatDate(latest, tz, 'yyyy-MM-dd') : null,
    total_meta_spend_aed: fctLedgerRound_(fctLedgerSum_(current, 'Spend_AED'), 2),
    mapping_status_counts: mapping
  };
}

function fctLedgerSummarizePayroll_(rows, monthKey) {
  const current = rows.filter(function (r) {
    return String(r.Month || '').trim() === monthKey;
  });

  const statuses = {};
  let evidencePending = 0;

  current.forEach(function (r) {
    const s = String(r.Payment_Status || 'UNKNOWN').trim() || 'UNKNOWN';
    statuses[s] = (statuses[s] || 0) + 1;
    if (s.toUpperCase().indexOf('EVIDENCE_PENDING') > -1) evidencePending++;
  });

  return {
    row_count: current.length,
    gross_payroll_aed: fctLedgerRound_(fctLedgerSum_(current, 'Gross_Payroll_AED'), 2),
    net_cash_aed: fctLedgerRound_(fctLedgerSum_(current, 'Net_Cash_AED'), 2),
    payment_status_counts: statuses,
    payment_evidence_pending_count: evidencePending
  };
}

function fctLedgerSummarizeOpex_(rows) {
  let monthly = 0;
  let unconverted = 0;
  let reviewCount = 0;

  rows.forEach(function (r) {
    const status = String(r.Status || '').toUpperCase();
    if (status === 'INACTIVE') return;

    const currency = String(r.Currency || '').toUpperCase();
    const val = fctLedgerNumber_(r.Monthly_Equivalent_Native);

    if (currency === 'AED') monthly += val;
    else if (val !== 0) unconverted++;

    if (status === 'REVIEW') reviewCount++;
  });

  return {
    monthly_opex_aed: fctLedgerRound_(monthly, 2),
    unconverted_non_aed_count: unconverted,
    review_count: reviewCount
  };
}

function fctLedgerSummarizeSubscriptions_(rows) {
  let total = 0;
  let missing = 0;
  const missingServices = [];
  const included = [];

  rows.forEach(function (r) {
    const active = String(r.Active_Status || '').toUpperCase();
    if (active.indexOf('ACTIVE') !== 0) return;

    const raw = r.Observed_AED;
    if (raw === '' || raw === null || raw === undefined || !isFinite(Number(raw))) {
      missing++;
      missingServices.push(String(r.Service || 'UNKNOWN'));
      return;
    }

    const amount = Number(raw);
    total += amount;
    included.push({
      service: String(r.Service || ''),
      observed_aed: fctLedgerRound_(amount, 2),
      data_quality: String(r.Data_Quality || '')
    });
  });

  return {
    core_active_saas_aed: fctLedgerRound_(total, 2),
    active_missing_cost_count: missing,
    active_missing_cost_services: missingServices,
    included_services: included
  };
}

function fctLedgerReadCourierCashRecon_(ss) {
  const sh = ss.getSheetByName('CASH_RECON');
  if (!sh) throw new Error('Required sheet not found: CASH_RECON');

  const rows = sh.getRange('A2:F10').getValues();
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) break;
    items.push({
      courier: String(rows[i][0] || ''),
      basis: String(rows[i][1] || ''),
      expected_statement_aed: fctLedgerNumberOrNull_(rows[i][2]),
      bank_credits_aed: fctLedgerNumberOrNull_(rows[i][3]),
      difference_aed: fctLedgerNumberOrNull_(rows[i][4]),
      status_note: String(rows[i][5] || '')
    });
  }

  const reviewCount = items.filter(function (x) {
    return x.status_note.toUpperCase().indexOf('REVIEW') > -1;
  }).length;

  const matchedCount = items.filter(function (x) {
    return x.status_note.toUpperCase().indexOf('MATCHED') > -1;
  }).length;

  return {
    items: items,
    matched_count: matchedCount,
    review_count: reviewCount
  };
}

function fctLedgerFilterFinanceAlerts_(rows) {
  // Deliberately do NOT keyword-match Entity/Product names.
  // Example: "Electric Piggy Bank" must not become a finance alert merely
  // because its product name contains the word "Bank".
  const areaMetricTerms =
    /finance|cash|banking|bank control|payment|payroll|salary|expense|subscription|renewal|remittance|settlement|profit|p&l|pnl|billing|ad spend|spend reconciliation/i;

  const messageTerms =
    /cash outstanding|bank credit|bank debit|payment evidence|payroll|salary|subscription|renewal|remittance|settlement|billing|unexplained spend|duplicate charge|operating profit|real contribution|tiktok spend|meta spend/i;

  return rows.filter(function (r) {
    const status = String(r.Status || '').toUpperCase();
    if (status && status !== 'OPEN' && status !== 'ACTIVE') return false;

    const areaMetric = [
      r.Area,
      r.Metric
    ].join(' ');

    const messageAction = [
      r.Message,
      r.Recommended_Action
    ].join(' ');

    return areaMetricTerms.test(areaMetric) || messageTerms.test(messageAction);
  }).slice(0, 12).map(function (r) {
    return {
      severity: String(r.Severity || ''),
      area: String(r.Area || ''),
      entity: String(r.Entity || ''),
      metric: String(r.Metric || ''),
      message: String(r.Message || ''),
      recommended_action: String(r.Recommended_Action || ''),
      status: String(r.Status || '')
    };
  });
}

function fctLedgerFilterFinanceActions_(rows) {
  const terms = /finance|cash|bank|payment|p&l|pnl|payroll|salary|expense|subscription|remittance|settlement|profit|spend|tiktok|meta/i;

  return rows.filter(function (r) {
    const exec = String(r.Execution_Status || '').toUpperCase();
    if (exec === 'COMPLETED' || exec === 'DONE') return false;

    const hay = [
      r.Agent,
      r.Area,
      r.Recommendation,
      r.Reason,
      r.Evidence,
      r.Expected_Impact,
      r.Risk
    ].join(' ');

    return terms.test(hay);
  }).slice(0, 12).map(function (r) {
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
      due_date: r.Due_Date ? String(r.Due_Date) : ''
    };
  });
}

function fctLedgerSum_(rows, field) {
  return rows.reduce(function (sum, r) {
    return sum + fctLedgerNumber_(r[field]);
  }, 0);
}

function fctLedgerNumber_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function fctLedgerNumberOrNull_(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isFinite(n) ? fctLedgerRound_(n, 2) : null;
}

function fctLedgerRound_(n, decimals) {
  if (n === null || n === undefined || !isFinite(Number(n))) return null;
  const p = Math.pow(10, decimals || 0);
  return Math.round(Number(n) * p) / p;
}

function fctLedgerDateFromCell_(value, now) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  const s = String(value || '').trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = s.match(/^(\d{1,2})-([A-Za-z]{3})$/);
  if (m) {
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const mi = months[String(m[2]).toLowerCase()];
    if (mi !== undefined) return new Date(now.getFullYear(), mi, Number(m[1]));
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}
