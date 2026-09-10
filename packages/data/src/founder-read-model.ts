import {
  contributionAfterActiveAds,
  finalDeliverySuccess,
  operatingProfit,
  roundMoney,
  demandVelocity,
  physicalStockDays,
  stockGate
} from '../../domain/src/core.ts';
import {
  currentMonthKey,
  googleSerialToIsoDate,
  numberValue,
  optionalNumber,
  recordsFromMatrix,
  type SheetMatrix,
  type SheetRangeReader,
  type SheetRecord
} from './sheet-reader.ts';

export const FCT_READ_RANGES = Object.freeze({
  dailyPnl: 'DAILY_PNL!A:R',
  ordersCash: 'ORDERS_MASTER!H:AL',
  ordersKuwait: 'RAW_KWT!C:X',
  metaSpend: 'META_SPEND_LIVE!A:R',
  payroll: 'PAYROLL_LEDGER!A:P',
  opex: 'OPEX_CONTROL!A:P',
  subscriptions: 'SUBSCRIPTIONS_CONTROL!A:O',
  actionQueue: 'ACTION_QUEUE!A:X',
  stock: 'STOCK_INTELLIGENCE!A:M'
});

const REQUIRED = Object.freeze({
  dailyPnl: ['Date', 'Orders_Picked', 'Delivered_Paid', 'Pending', 'RRTO', 'Delivered_Revenue_AED', 'Gross_Contribution_AED', 'Meta_Spend_AED', 'TikTok_Spend_AED', 'Courier_Receivable_AED', 'PNL_Status'],
  ordersCash: ['Pickup_Date', 'Shipment_ID', 'COD_AED', 'Status_Group', 'Is_Delivered', 'Is_Paid', 'Courier_Receivable_AED'],
  metaSpend: ['Date', 'Spend_AED', 'Mapping_Status'],
  payroll: ['Month', 'Gross_Payroll_AED', 'Net_Cash_AED', 'Payment_Status'],
  opex: ['Currency', 'Monthly_Equivalent_Native', 'Status'],
  subscriptions: ['Service', 'Active_Status', 'Observed_AED', 'Data_Quality'],
  actionQueue: ['Action_ID', 'Recommendation', 'Reason', 'Priority', 'Owner', 'Approval_Status', 'Execution_Status', 'Source', 'Created_At'],
  stock: ['Country', 'Product (SKU)', 'Available Stock', 'Avg / Day 7d', 'Avg / Day 14d', 'Demand Velocity Used', 'Available Stock Days', 'Stock Alert', 'Data Quality']
});

const KWT_COLUMN_INDEX = Object.freeze({
  pickupDate: 0,
  status: 1,
  shipmentId: 4,
  codAed: 21
});

const KWT_EXPECTED_HEADERS = Object.freeze({
  pickupDate: 'Pickup Date',
  status: 'Staus',
  shipmentId: 'Shipment ID',
  codAed: 'In AED'
});

export type FounderSourceBundle = {
  dailyPnl: SheetRecord[];
  ordersCash: SheetRecord[];
  ordersKuwait: SheetRecord[];
  metaSpend: SheetRecord[];
  payroll: SheetRecord[];
  opex: SheetRecord[];
  subscriptions: SheetRecord[];
  actionQueue: SheetRecord[];
  stock: SheetRecord[];
};

export type FounderReadModel = {
  status: 'SUCCESS';
  contractVersion: '1.0';
  asOf: string;
  period: {
    month: string;
    dailyPnlLatestDate: string | null;
    metaLatestDate: string | null;
  };
  economics: {
    ordersPickedMtd: number;
    deliveredPaidMtd: number;
    pendingMtd: number;
    rrtoMtd: number;
    finalizedDeliverySuccess: number | null;
    deliveredRevenueAed: number;
    grossContributionAed: number;
    courierReceivableAed: number;
    deliveredUnpaidCount: number;
    paidCount: number;
    paidOrderCodAed: number;
    metaPlatformSpendAed: number;
    metaSpendInDailyPnlAed: number;
    metaAllocationGapAed: number;
    tiktokSpendAed: number | null;
    realContributionAed: number | null;
    realContributionStatus: string;
    monthlyFixedCostBaselineAed: number;
    fixedCostAccrualThroughPnlDateAed: number | null;
    operatingProfitAed: number | null;
    operatingProfitStatus: string;
  };
  controls: {
    dataQualityStatus: 'PASS' | 'REVIEW' | 'FAIL';
    flags: { severity: 'REVIEW' | 'FAIL'; code: string; detail: string }[];
    metaMappingStatusCounts: Record<string, number>;
    payrollPaymentEvidencePendingCount: number;
    activeSubscriptionMissingCostCount: number;
  };
  approvals: {
    pendingCount: number;
    pending: Array<{
      actionId: string;
      priority: string;
      recommendation: string;
      reason: string;
      owner: string;
      source: string;
      createdAt: unknown;
    }>;
  };
  stock: {
    critical: Array<Record<string, unknown>>;
    watch: Array<Record<string, unknown>>;
    velocityMismatchCount: number;
  };
  provenance: {
    source: 'GOOGLE_SHEETS_READ_ONLY';
    ranges: typeof FCT_READ_RANGES;
    writesMade: 0;
    externalActionsExecuted: 0;
    aiCallsMade: 0;
  };
};

function parseKuwaitCashMatrix(matrix: SheetMatrix): SheetRecord[] {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error('RAW_KWT cash range is empty.');
  }

  const header = Array.isArray(matrix[0]) ? matrix[0] : [];
  const checks: Array<[number, string]> = [
    [KWT_COLUMN_INDEX.pickupDate, KWT_EXPECTED_HEADERS.pickupDate],
    [KWT_COLUMN_INDEX.status, KWT_EXPECTED_HEADERS.status],
    [KWT_COLUMN_INDEX.shipmentId, KWT_EXPECTED_HEADERS.shipmentId],
    [KWT_COLUMN_INDEX.codAed, KWT_EXPECTED_HEADERS.codAed]
  ];
  checks.forEach(([index, expected]) => {
    if (String(header[index] ?? '').trim() !== expected) {
      throw new Error('RAW_KWT cash contract mismatch at column index ' + index + ': expected ' + expected + '.');
    }
  });

  return matrix.slice(1).filter((row) => Array.isArray(row) && row.some((value) => value !== '' && value !== null && value !== undefined)).map((row) => ({
    'Pickup Date': row[KWT_COLUMN_INDEX.pickupDate],
    Staus: row[KWT_COLUMN_INDEX.status],
    'Shipment ID': row[KWT_COLUMN_INDEX.shipmentId],
    'In AED': row[KWT_COLUMN_INDEX.codAed]
  }));
}

export async function loadFounderSourceBundle(reader: SheetRangeReader): Promise<FounderSourceBundle> {
  const [dailyPnl, ordersCash, ordersKuwait, metaSpend, payroll, opex, subscriptions, actionQueue, stock] = await Promise.all([
    reader.readRange(FCT_READ_RANGES.dailyPnl),
    reader.readRange(FCT_READ_RANGES.ordersCash),
    reader.readRange(FCT_READ_RANGES.ordersKuwait),
    reader.readRange(FCT_READ_RANGES.metaSpend),
    reader.readRange(FCT_READ_RANGES.payroll),
    reader.readRange(FCT_READ_RANGES.opex),
    reader.readRange(FCT_READ_RANGES.subscriptions),
    reader.readRange(FCT_READ_RANGES.actionQueue),
    reader.readRange(FCT_READ_RANGES.stock)
  ]);

  return {
    dailyPnl: recordsFromMatrix(dailyPnl, REQUIRED.dailyPnl),
    ordersCash: recordsFromMatrix(ordersCash, REQUIRED.ordersCash),
    ordersKuwait: parseKuwaitCashMatrix(ordersKuwait),
    metaSpend: recordsFromMatrix(metaSpend, REQUIRED.metaSpend),
    payroll: recordsFromMatrix(payroll, REQUIRED.payroll),
    opex: recordsFromMatrix(opex, REQUIRED.opex),
    subscriptions: recordsFromMatrix(subscriptions, REQUIRED.subscriptions),
    actionQueue: recordsFromMatrix(actionQueue, REQUIRED.actionQueue),
    stock: recordsFromMatrix(stock, REQUIRED.stock)
  };
}

function inMonth(row: SheetRecord, field: string, month: string): boolean {
  const date = googleSerialToIsoDate(row[field]);
  return date !== null && date.slice(0, 7) === month;
}

function sum(rows: SheetRecord[], field: string): number {
  return rows.reduce((total, row) => total + numberValue(row[field] ?? 0, field), 0);
}

function latestDate(rows: SheetRecord[], field: string): string | null {
  const values = rows.map((row) => googleSerialToIsoDate(row[field])).filter((value): value is string => Boolean(value));
  return values.length ? values.sort().at(-1)! : null;
}

function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

function fixedCostSummary(bundle: FounderSourceBundle, month: string) {
  const payrollRows = bundle.payroll.filter((row) => String(row.Month ?? '').trim() === month);
  const grossPayroll = roundMoney(sum(payrollRows, 'Gross_Payroll_AED'));
  const evidencePending = payrollRows.filter((row) => String(row.Payment_Status ?? '').toUpperCase().includes('EVIDENCE_PENDING')).length;

  let monthlyOpex = 0;
  let unconvertedNonAed = 0;
  bundle.opex.forEach((row) => {
    const status = String(row.Status ?? '').trim().toUpperCase();
    if (status === 'INACTIVE') return;
    const currency = String(row.Currency ?? '').trim().toUpperCase();
    const value = numberValue(row.Monthly_Equivalent_Native ?? 0, 'Monthly_Equivalent_Native');
    if (currency === 'AED') monthlyOpex += value;
    else if (value !== 0) unconvertedNonAed++;
  });

  let activeSaas = 0;
  let missingActiveSaas = 0;
  bundle.subscriptions.forEach((row) => {
    if (!String(row.Active_Status ?? '').trim().toUpperCase().startsWith('ACTIVE')) return;
    const amount = optionalNumber(row.Observed_AED, 'Observed_AED');
    if (amount === null) {
      missingActiveSaas++;
      return;
    }
    activeSaas += amount;
  });

  return {
    grossPayrollAed: grossPayroll,
    monthlyOpexAed: roundMoney(monthlyOpex),
    activeSaasAed: roundMoney(activeSaas),
    monthlyFixedBaselineAed: roundMoney(grossPayroll + monthlyOpex + activeSaas),
    payrollPaymentEvidencePendingCount: evidencePending,
    activeSubscriptionMissingCostCount: missingActiveSaas,
    unconvertedNonAedOpexCount: unconvertedNonAed
  };
}

function normalizeKuwaitCashRows(rows: SheetRecord[]): SheetRecord[] {
  return rows.map((row) => {
    const status = String(row.Staus ?? '').trim().toUpperCase();
    const codAed = numberValue(row['In AED'] ?? 0, 'RAW_KWT In AED');
    return {
      Pickup_Date: row['Pickup Date'],
      Shipment_ID: row['Shipment ID'],
      COD_AED: codAed,
      Status_Group: status,
      Is_Delivered: status === 'DELIVERED' || status === 'PAID' ? 1 : 0,
      Is_Paid: status === 'PAID' ? 1 : 0,
      Courier_Receivable_AED: status === 'DELIVERED' ? codAed : 0
    };
  });
}

function mergeCashRows(masterRows: SheetRecord[], kuwaitRows: SheetRecord[]): SheetRecord[] {
  const out: SheetRecord[] = [];
  const shipmentIds = new Set<string>();

  masterRows.forEach((row) => {
    const shipmentId = String(row.Shipment_ID ?? '').trim();
    if (shipmentId) shipmentIds.add(shipmentId);
    out.push(row);
  });

  normalizeKuwaitCashRows(kuwaitRows).forEach((row) => {
    const shipmentId = String(row.Shipment_ID ?? '').trim();
    if (shipmentId && shipmentIds.has(shipmentId)) return;
    if (shipmentId) shipmentIds.add(shipmentId);
    out.push(row);
  });

  return out;
}

function cashSummary(masterRows: SheetRecord[], kuwaitRows: SheetRecord[], month: string) {
  const current = mergeCashRows(masterRows, kuwaitRows).filter((row) => inMonth(row, 'Pickup_Date', month));
  let paidCount = 0;
  let deliveredUnpaidCount = 0;
  let paidCod = 0;
  let receivable = 0;
  let paidWithReceivable = 0;

  current.forEach((row) => {
    const status = String(row.Status_Group ?? '').trim().toUpperCase();
    const paidFlag = numberValue(row.Is_Paid ?? 0, 'Is_Paid') === 1;
    const deliveredFlag = numberValue(row.Is_Delivered ?? 0, 'Is_Delivered') === 1;
    const isPaid = paidFlag || status === 'PAID';
    const isDelivered = deliveredFlag || status === 'DELIVERED' || isPaid;
    const cod = numberValue(row.COD_AED ?? 0, 'COD_AED');
    const recv = numberValue(row.Courier_Receivable_AED ?? 0, 'Courier_Receivable_AED');

    if (isPaid) {
      paidCount++;
      paidCod += cod;
      if (Math.abs(recv) > 0.01) paidWithReceivable++;
    } else if (isDelivered) {
      deliveredUnpaidCount++;
    }
    receivable += recv;
  });

  return {
    currentOrderCount: current.length,
    paidCount,
    deliveredUnpaidCount,
    paidCodAed: roundMoney(paidCod),
    courierReceivableAed: roundMoney(receivable),
    paidOrdersWithReceivableNonzero: paidWithReceivable,
    terminalSuccessCount: paidCount + deliveredUnpaidCount
  };
}

function stockSummary(rows: SheetRecord[]) {
  const enriched = rows.map((row) => {
    const available = numberValue(row['Available Stock'] ?? 0, 'Available Stock');
    const avg7 = numberValue(row['Avg / Day 7d'] ?? 0, 'Avg / Day 7d');
    const avg14 = numberValue(row['Avg / Day 14d'] ?? 0, 'Avg / Day 14d');
    const velocity = demandVelocity(avg7, avg14);
    const sheetVelocity = numberValue(row['Demand Velocity Used'] ?? 0, 'Demand Velocity Used');
    const days = physicalStockDays(available, velocity);
    const gate = stockGate(available, days);
    return {
      country: String(row.Country ?? ''),
      productSku: String(row['Product (SKU)'] ?? ''),
      availableStock: available,
      demandVelocity: velocity,
      sheetDemandVelocity: sheetVelocity,
      availableStockDays: days,
      sheetAvailableStockDays: optionalNumber(row['Available Stock Days'], 'Available Stock Days'),
      gate,
      dataQuality: String(row['Data Quality'] ?? ''),
      velocityMatchesSheet: Math.abs(velocity - sheetVelocity) <= 0.0001
    };
  });

  return {
    critical: enriched.filter((row) => row.gate === 'OUT_OF_STOCK' || row.gate === 'CRITICAL_LE_3_DAYS').slice(0, 20),
    watch: enriched.filter((row) => row.gate === 'WATCH_LE_7_DAYS').slice(0, 20),
    velocityMismatchCount: enriched.filter((row) => !row.velocityMatchesSheet).length
  };
}

export function buildFounderReadModel(bundle: FounderSourceBundle, asOfIso: string): FounderReadModel {
  const month = currentMonthKey(asOfIso);
  const daily = bundle.dailyPnl.filter((row) => inMonth(row, 'Date', month));
  const meta = bundle.metaSpend.filter((row) => inMonth(row, 'Date', month));
  const cash = cashSummary(bundle.ordersCash, bundle.ordersKuwait, month);
  const fixed = fixedCostSummary(bundle, month);

  const ordersPicked = sum(daily, 'Orders_Picked');
  const deliveredPaid = sum(daily, 'Delivered_Paid');
  const rrto = sum(daily, 'RRTO');
  const finalizedSuccess = finalDeliverySuccess({ delivered: deliveredPaid, paid: 0, rrto });
  const grossContribution = roundMoney(sum(daily, 'Gross_Contribution_AED'));
  const metaPlatformSpend = roundMoney(sum(meta, 'Spend_AED'));
  const metaPnlSpend = roundMoney(sum(daily, 'Meta_Spend_AED'));
  const metaAllocationGap = roundMoney(metaPlatformSpend - metaPnlSpend);

  const tiktokMissing = daily.some((row) => {
    const status = String(row.PNL_Status ?? '').toUpperCase();
    return status.includes('TIKTOK') && status.includes('PROVISIONAL');
  });
  const hasTikTokValues = daily.some((row) => row.TikTok_Spend_AED !== '' && row.TikTok_Spend_AED !== null && row.TikTok_Spend_AED !== undefined);
  const tiktokSpend = tiktokMissing ? null : (hasTikTokValues ? roundMoney(sum(daily, 'TikTok_Spend_AED')) : 0);

  const contribution = contributionAfterActiveAds({
    grossContributionAed: grossContribution,
    activeChannels: tiktokMissing || hasTikTokValues ? ['META', 'TIKTOK'] : ['META'],
    spendByChannelAed: { META: metaPlatformSpend, TIKTOK: tiktokSpend }
  });

  const pnlLatest = latestDate(daily, 'Date');
  const opProfit = pnlLatest === null
    ? { status: 'BLOCKED_MISSING_PNL_DATE', valueAed: null, missingChannels: [] as string[] }
    : operatingProfit(
        contribution,
        roundMoney(fixed.monthlyFixedBaselineAed * (dayOfMonth(pnlLatest) / daysInMonth(month)))
      );

  const flags: FounderReadModel['controls']['flags'] = [];
  if (tiktokMissing) flags.push({ severity: 'FAIL', code: 'TIKTOK_SPEND_MISSING', detail: 'Real Contribution and Operating Profit remain blocked until live TikTok spend is available.' });
  if (Math.abs(metaAllocationGap) > 0.01) flags.push({ severity: 'REVIEW', code: 'META_TOTAL_VS_PNL_ALLOCATION_GAP', detail: 'META_SPEND_LIVE differs from Meta spend represented in DAILY_PNL.' });
  if (cash.paidOrdersWithReceivableNonzero > 0) flags.push({ severity: 'FAIL', code: 'PAID_ORDER_HAS_RECEIVABLE', detail: cash.paidOrdersWithReceivableNonzero + ' PAID order(s) carry non-zero courier receivable.' });
  if (cash.currentOrderCount !== ordersPicked) flags.push({ severity: 'REVIEW', code: 'DAILY_PNL_VS_ORDER_COUNT_MISMATCH', detail: 'DAILY_PNL Orders_Picked differs from the merged UAE/Kuwait order-source count.' });
  if (cash.terminalSuccessCount !== deliveredPaid) flags.push({ severity: 'REVIEW', code: 'DAILY_PNL_VS_ORDER_SUCCESS_COUNT_MISMATCH', detail: 'DAILY_PNL Delivered_Paid differs from merged UAE/Kuwait terminal-success count.' });
  if (fixed.payrollEvidencePendingCount > 0) flags.push({ severity: 'REVIEW', code: 'PAYROLL_PAYMENT_EVIDENCE_PENDING', detail: fixed.payrollEvidencePendingCount + ' payroll row(s) are accrued but payment evidence is pending.' });
  if (fixed.activeSubscriptionMissingCostCount > 0) flags.push({ severity: 'REVIEW', code: 'ACTIVE_SUBSCRIPTION_COST_MISSING', detail: fixed.activeSubscriptionMissingCostCount + ' active subscription row(s) have no observed AED cost.' });
  if (fixed.unconvertedNonAedOpexCount > 0) flags.push({ severity: 'REVIEW', code: 'NON_AED_OPEX_UNCONVERTED', detail: fixed.unconvertedNonAedOpexCount + ' non-AED OPEX row(s) are not included in AED fixed-cost baseline.' });

  const metaLatest = latestDate(meta, 'Date');
  if (pnlLatest && metaLatest && pnlLatest !== metaLatest) flags.push({ severity: 'REVIEW', code: 'META_PNL_CUTOFF_MISMATCH', detail: 'META_SPEND_LIVE and DAILY_PNL latest dates differ.' });

  const metaMappingStatusCounts: Record<string, number> = {};
  meta.forEach((row) => {
    const status = String(row.Mapping_Status ?? 'UNKNOWN').trim() || 'UNKNOWN';
    metaMappingStatusCounts[status] = (metaMappingStatusCounts[status] || 0) + 1;
  });

  const pending = bundle.actionQueue.filter((row) => String(row.Approval_Status ?? '').trim().toUpperCase() === 'PENDING_FOUNDER');
  const stock = stockSummary(bundle.stock);
  if (stock.velocityMismatchCount > 0) flags.push({ severity: 'FAIL', code: 'STOCK_VELOCITY_RULE_MISMATCH', detail: stock.velocityMismatchCount + ' STOCK_INTELLIGENCE row(s) differ from max(7d,14d) velocity rule.' });

  return {
    status: 'SUCCESS',
    contractVersion: '1.0',
    asOf: asOfIso,
    period: {
      month,
      dailyPnlLatestDate: pnlLatest,
      metaLatestDate: metaLatest
    },
    economics: {
      ordersPickedMtd: ordersPicked,
      deliveredPaidMtd: deliveredPaid,
      pendingMtd: sum(daily, 'Pending'),
      rrtoMtd: rrto,
      finalizedDeliverySuccess: finalizedSuccess,
      deliveredRevenueAed: roundMoney(sum(daily, 'Delivered_Revenue_AED')),
      grossContributionAed: grossContribution,
      courierReceivableAed: cash.courierReceivableAed,
      deliveredUnpaidCount: cash.deliveredUnpaidCount,
      paidCount: cash.paidCount,
      paidOrderCodAed: cash.paidCodAed,
      metaPlatformSpendAed: metaPlatformSpend,
      metaSpendInDailyPnlAed: metaPnlSpend,
      metaAllocationGapAed: metaAllocationGap,
      tiktokSpendAed: tiktokSpend,
      realContributionAed: contribution.valueAed,
      realContributionStatus: contribution.status,
      monthlyFixedCostBaselineAed: fixed.monthlyFixedBaselineAed,
      fixedCostAccrualThroughPnlDateAed: pnlLatest === null ? null : roundMoney(fixed.monthlyFixedBaselineAed * (dayOfMonth(pnlLatest) / daysInMonth(month))),
      operatingProfitAed: opProfit.valueAed,
      operatingProfitStatus: opProfit.status
    },
    controls: {
      dataQualityStatus: flags.some((flag) => flag.severity === 'FAIL') ? 'FAIL' : (flags.length ? 'REVIEW' : 'PASS'),
      flags,
      metaMappingStatusCounts,
      payrollPaymentEvidencePendingCount: fixed.payrollEvidencePendingCount,
      activeSubscriptionMissingCostCount: fixed.activeSubscriptionMissingCostCount
    },
    approvals: {
      pendingCount: pending.length,
      pending: pending.slice(0, 20).map((row) => ({
        actionId: String(row.Action_ID ?? ''),
        priority: String(row.Priority ?? ''),
        recommendation: String(row.Recommendation ?? ''),
        reason: String(row.Reason ?? ''),
        owner: String(row.Owner ?? ''),
        source: String(row.Source ?? ''),
        createdAt: row.Created_At ?? ''
      }))
    },
    stock,
    provenance: {
      source: 'GOOGLE_SHEETS_READ_ONLY',
      ranges: FCT_READ_RANGES,
      writesMade: 0,
      externalActionsExecuted: 0,
      aiCallsMade: 0
    }
  };
}

export async function getFounderReadModel(reader: SheetRangeReader, asOfIso: string): Promise<FounderReadModel> {
  return buildFounderReadModel(await loadFounderSourceBundle(reader), asOfIso);
}
