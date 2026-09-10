import assert from 'node:assert/strict';
import {
  FCT_READ_RANGES,
  getFounderReadModel
} from '../../packages/data/src/founder-read-model.ts';
import type { SheetMatrix, SheetRangeReader } from '../../packages/data/src/sheet-reader.ts';

const ORDERS_HEADER = ['Pickup_Date','Raw_Status','Store','Reference_ID','Shipment_ID','SKU_1','Product_1','Qty_1','SKU_2','Product_2','Qty_2','SKU_3','Product_3','Qty_3','SKU_4','Product_4','Qty_4','SKU_5','Product_5','Qty_5','COD_Local','COD_AED','Raw_Delivery_Cost_AED','Product_Cost_AED','Status_Group','Delivery_Cost_AED','Is_Finalized','Is_Delivered','Is_Paid','Is_RRTO','Courier_Receivable_AED'];
const KWT_HEADER = ['Pickup Date','Staus','Reference ID','Sender Name','Shipment ID','SKU-001','Product Name','QTY','SKU-002','Product Name','QTY','SKU-003','Product Name','QTY','SKU-004','Product Name','QTY','SKU-005','Product Name','Mobile No.','COD Amount','In AED'];

function orderRow(index: number, status: 'DELIVERED' | 'PENDING' | 'RRTO', codAed: number): unknown[] {
  const delivered = status === 'DELIVERED';
  const rrto = status === 'RRTO';
  return [
    46266, status, 'UAE Store', 'U' + index, 'UAE-' + index,
    'PLG632', 'Product', 1, '', '', '', '', '', '', '', '', '', '', '', '',
    codAed, codAed, 0, 0, status, 0,
    delivered || rrto ? 1 : 0,
    delivered ? 1 : 0,
    0,
    rrto ? 1 : 0,
    delivered ? codAed : 0
  ];
}

const uaeOrders: unknown[][] = [ORDERS_HEADER];
for (let i = 0; i < 390; i++) {
  // Sep-9 observed UAE delivered COD total was AED 27,978.50.
  uaeOrders.push(orderRow(i, 'DELIVERED', i === 0 ? 27978.5 : 0));
}
for (let i = 0; i < 235; i++) uaeOrders.push(orderRow(1000 + i, 'PENDING', 0));
for (let i = 0; i < 111; i++) uaeOrders.push(orderRow(2000 + i, 'RRTO', 0));

function kwtRow(index: number, status: 'Delivered' | 'Pending', codAed: number): unknown[] {
  return [
    46268, status, '#K' + index, 'Gulfhub Store', 'KWT-' + index,
    'PLG617', 'Hands-Free Baby Bottle', 1,
    '', '', '', '', '', '', '', '', '', '', '', '',
    codAed / 11.866, codAed
  ];
}

const kwtDeliveredAed = [
  118.55399725154096,
  148.1034920619851,
  148.1034920619851,
  118.55399725154096,
  219.30709401486257
];
const kwtOrders: unknown[][] = [KWT_HEADER];
kwtDeliveredAed.forEach((value, index) => kwtOrders.push(kwtRow(index, 'Delivered', value)));
for (let i = 0; i < 16; i++) kwtOrders.push(kwtRow(100 + i, 'Pending', 0));

const meta: unknown[][] = [[
  'Date','Portfolio','Account_ID','Account_Name','Currency','Campaign_ID','Campaign_Name','Spend_Native','FX_to_AED','Spend_AED','Store','SKU','Product_Name','Country','Mapping_Status','Source','Key','Data_Quality_Flag'
]];
for (let i = 0; i < 250; i++) {
  const spend = i === 0 ? 6667.55 : 0;
  meta.push([46273,'P','A','Account','AED','C' + i,'Campaign',spend,1,spend,'Store','PLG632','Product','United Arab Emirates','VALIDATED','META LIVE','V' + i,'OK']);
}
for (let i = 0; i < 2; i++) {
  meta.push([46273,'P','A','Account','AED','P' + i,'Pending map',17.15,1,17.15,'Store','PLG632','Product','PENDING_ACTION','PENDING_ACTION','META LIVE','P' + i,'REVIEW']);
}

const fixtures: Record<string, SheetMatrix> = {
  [FCT_READ_RANGES.dailyPnl]: [
    ['Date','Country','Orders_Picked','Delivered_Paid','Pending','RRTO','Delivery_Success','Delivered_Revenue_AED','Product_Cost_AED','Delivery_Cost_AED','RTO_Cost_AED','Gross_Contribution_AED','Meta_Spend_AED','TikTok_Spend_AED','Contribution_After_Meta_AED','Real_Contribution_Profit_AED','Courier_Receivable_AED','PNL_Status'],
    [46274,'GROUP',757,395,251,111,395 / 506,28731.122072641912,0,0,0,17582.832072641915,5506.95,'',12075.882072641915,'',28731.122072641912,'PROVISIONAL_TIKTOK; META_COUNTRY_SPLIT_PENDING']
  ],
  [FCT_READ_RANGES.ordersCash]: uaeOrders,
  [FCT_READ_RANGES.ordersKuwait]: kwtOrders,
  [FCT_READ_RANGES.metaSpend]: meta,
  [FCT_READ_RANGES.payroll]: [
    ['Month','Pay_Date','Staff_ID','Gross_Native','Commission_Native','Advance_Recovery_Native','Net_Cash_Paid_Native','Currency','FX_to_AED','Gross_Payroll_AED','Net_Cash_AED','Payment_Method','Payment_Reference','Payment_Status','Source','Notes'],
    ['2026-09','2026-09-03','STF001',35200,0,10000,25200,'INR',0.04,1408,1008,'Transfer','','ACCRUED_PAYMENT_EVIDENCE_PENDING','Founder',''],
    ['2026-09','2026-09-03','STF002',26500,0,0,26500,'INR',0.04,1060,1060,'Transfer','','ACCRUED_PAYMENT_EVIDENCE_PENDING','Founder',''],
    ['2026-09','2026-09-01','STF003',1500,0,0,1500,'AED',1,1500,1500,'Cash','','ACCRUED_PAYMENT_EVIDENCE_PENDING','Founder',''],
    ['2026-09','2026-09-01','STF004',10000,0,0,10000,'AED',1,10000,10000,'Cheque','','ACCRUED_PAYMENT_EVIDENCE_PENDING','Founder','']
  ],
  [FCT_READ_RANGES.opex]: [
    ['Expense_ID','Expense','Category','Amount_Native','Currency','Frequency','Monthly_Equivalent_Native','AED_Normalization_Method','Payment_Day','Payment_Method','Cost_Center','VAT_Evidence','Source','Status','Effective_From','Notes'],
    ['O1','Office','Operations',5000,'AED','MONTHLY',5000,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O2','Trade License','Compliance',10000,'AED','ANNUAL',833.3333333333334,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O3','Visa','HR',2000,'AED','EVERY_24_MONTHS',83.33333333333333,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O4','Electricity','Utilities',500,'AED','MONTHLY',500,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O5','Internet','Utilities',500,'AED','MONTHLY',500,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O6','Mobile','Telecom',120,'AED','MONTHLY',120,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O7','VAT Filing','Compliance',200,'AED','QUARTERLY',66.66666667,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O8','Annual Tax','Compliance',300,'AED','ANNUAL',25,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O9','Bank Plan','Banking',99,'AED','MONTHLY',99,'AED direct','','','SHARED','','Founder','REVIEW',46266,'']
  ],
  [FCT_READ_RANGES.subscriptions]: [
    ['Subscription_ID','Service','Category','Founder_Budget_Native','Currency','Frequency','Payment_Source','Cost_Center','Active_Status','Reconcile_Source','Latest_Observed_Evidence','Observed_AED','Allocation_Status','Data_Quality','Notes'],
    ['S1','Claude','AI',100,'USD','MONTHLY','Mamo','SHARED','ACTIVE_CONFIRMED','RAW','',380.23,'SHARED','CURRENT_BASELINE',''],
    ['S2','ChatGPT','AI',20,'USD','MONTHLY','Pending','SHARED','ACTIVE_CONFIRMED','RAW','',76.05,'SHARED','BUDGET_FALLBACK',''],
    ['S3','Shopify','Ecommerce',65,'USD','MONTHLY','Mamo','PER_STORE','ACTIVE_MULTIPLE','RAW','',545.41,'SPLIT_REQUIRED','CURRENT_YTD_CONFIRMED',''],
    ['S4','Vercel','Hosting',40,'USD','RECURRING','Mamo','PROJECTS','ACTIVE_CONFIRMED','RAW','',228.13,'SPLIT_REQUIRED','CURRENT_YTD_CONFIRMED',''],
    ['S5','Supabase','Hosting',50,'USD','RECURRING','Mamo','PROJECTS','ACTIVE_CONFIRMED','RAW','',239.54,'SPLIT_REQUIRED','CURRENT_YTD_CONFIRMED',''],
    ['S6','Namecheap Domains','Domains','','MIXED','ANNUAL','Pending','SHARED','ACTIVE_CONFIRMED','RAW','','','SHARED','PENDING_COST',''],
    ['S7','Namecheap Email','Email','','MIXED','ANNUAL','Pending','SHARED','ACTIVE_CONFIRMED','RAW','','','SHARED','PENDING_COST','']
  ],
  [FCT_READ_RANGES.actionQueue]: [
    ['Action_ID','Created_At','Agent','Area','Priority','Recommendation','Reason','Confidence','Evidence','Expected_Impact','Risk','Owner','Approval_Status','Approved_By','Approved_At','Email_Status','Email_Sent_At','Execution_Status','Due_Date','Completed_At','Result','Source','Last_Updated','Notes'],
    ['ACT-1',46274,'Growth','Ads','ACT NOW','TikTok OAuth','Missing spend','HIGH','','','','Abid','PENDING_EXTERNAL_APPROVAL','','','','','WAITING_TIKTOK','','','','TikTok',46274,''],
    ['ACT-2',46274,'Route','Last Mile','ACT NOW','Investigate Last Mile','Below gate','HIGH','','','','Abid','PENDING_FOUNDER','','','','','NOT_STARTED','','','','ROUTE',46274,''],
    ['ACT-3',46274,'Stock','Stock','ACT NOW','Replenish stock','Low cover','HIGH','','','','Abid','PENDING_FOUNDER','','','','','NOT_STARTED','','','','STOCK',46274,'']
  ],
  [FCT_READ_RANGES.stock]: [
    ['Country','Product (SKU)','Available Stock','Confirmed Courier Stock','Pickup Last 7d','Avg / Day 7d','Pickup Last 14d','Avg / Day 14d','Demand Velocity Used','Available Stock Days','Stock Alert','Recommended Action','Data Quality'],
    ['United Arab Emirates','Wrist BP Machine (PLG597)',9,0,40,5.714285714285714,74,5.285714285714286,5.714285714285714,1.575,'ACT NOW','Reorder','MATCHED'],
    ['United Arab Emirates','iQibla Zikr Lite (PLG609)',0,0,0,0,1,0.07142857142857142,0.07142857142857142,0,'OUT OF STOCK','Replenish','MATCHED'],
    ['Kuwait','Smart Wrist Blood Pressure Monitor (PLG597)',0,0,0,0,1,0.07142857142857142,0.07142857142857142,0,'OUT OF STOCK','Replenish','MATCHED'],
    ['United Arab Emirates','Oral Care Toothpaste (PLG602)',144,0,222,31.714285714285715,266,19,31.714285714285715,4.54054054054054,'REORDER / WATCH','Prepare stock','COURIER PICKUP MISMATCH'],
    ['United Arab Emirates','Smart Watch 4 Pro+ (PLG650)',10,0,11,1.5714285714285714,25,1.7857142857142858,1.7857142857142858,5.6,'REORDER / WATCH','Prepare stock','MATCHED'],
    ['Kuwait','Hands-Free Baby Bottle (PLG617)',1,0,1,0.14285714285714285,4,0.2857142857142857,0.2857142857142857,3.5,'REORDER / WATCH','Prepare stock','MATCHED'],
    ['United Arab Emirates','Dormant Product (PLG0)',0,0,0,0,0,0,0,'','NO RECENT DEMAND','Monitor','MATCHED']
  ]
};

class Sep9FixtureReader implements SheetRangeReader {
  readonly calls: string[] = [];
  async readRange(range: string): Promise<SheetMatrix> {
    this.calls.push(range);
    const value = fixtures[range];
    if (!value) throw new Error('Unexpected range: ' + range);
    return value;
  }
}

const reader = new Sep9FixtureReader();
const model = await getFounderReadModel(reader, '2026-09-11T00:30:00+04:00');

assert.equal(reader.calls.length, 9);
assert.equal(model.period.month, '2026-09');
assert.equal(model.period.dailyPnlLatestDate, '2026-09-09');
assert.equal(model.period.metaLatestDate, '2026-09-08');
assert.equal(model.economics.ordersPickedMtd, 757);
assert.equal(model.economics.deliveredPaidMtd, 395);
assert.equal(model.economics.pendingMtd, 251);
assert.equal(model.economics.rrtoMtd, 111);
assert.equal(model.economics.finalizedDeliverySuccess, 395 / 506);
assert.equal(model.economics.deliveredRevenueAed, 28731.12);
assert.equal(model.economics.grossContributionAed, 17582.83);
assert.equal(model.economics.courierReceivableAed, 28731.12);
assert.equal(model.economics.deliveredUnpaidCount, 395);
assert.equal(model.economics.paidCount, 0);
assert.equal(model.economics.metaPlatformSpendAed, 6701.85);
assert.equal(model.economics.metaSpendInDailyPnlAed, 5506.95);
assert.equal(model.economics.metaAllocationGapAed, 1194.9);
assert.equal(model.economics.tiktokSpendAed, null);
assert.equal(model.economics.realContributionStatus, 'BLOCKED_MISSING_TIKTOK_SPEND');
assert.equal(model.economics.realContributionAed, null);
assert.equal(model.economics.monthlyFixedCostBaselineAed, 22664.69);
assert.equal(model.economics.fixedCostAccrualThroughPnlDateAed, 6799.41);
assert.equal(model.economics.operatingProfitStatus, 'BLOCKED_MISSING_TIKTOK_SPEND');
assert.equal(model.economics.operatingProfitAed, null);
assert.equal(model.approvals.pendingCount, 2);
assert.equal(model.stock.critical.length, 3);
assert.equal(model.stock.watch.length, 3);
assert.equal(model.stock.velocityMismatchCount, 0);
assert.deepEqual(model.controls.metaMappingStatusCounts, { VALIDATED: 250, PENDING_ACTION: 2 });
assert.equal(model.controls.payrollPaymentEvidencePendingCount, 4);
assert.equal(model.controls.activeSubscriptionMissingCostCount, 2);
assert.ok(model.controls.flags.some((flag) => flag.code === 'TIKTOK_SPEND_MISSING'));
assert.ok(model.controls.flags.some((flag) => flag.code === 'META_TOTAL_VS_PNL_ALLOCATION_GAP'));
assert.ok(model.controls.flags.some((flag) => flag.code === 'META_PNL_CUTOFF_MISMATCH'));
assert.ok(model.controls.flags.some((flag) => flag.code === 'PAYROLL_PAYMENT_EVIDENCE_PENDING'));
assert.ok(model.controls.flags.some((flag) => flag.code === 'ACTIVE_SUBSCRIPTION_COST_MISSING'));
assert.equal(model.controls.flags.some((flag) => flag.code === 'DAILY_PNL_VS_ORDER_COUNT_MISMATCH'), false);
assert.equal(model.controls.flags.some((flag) => flag.code === 'DAILY_PNL_VS_ORDER_SUCCESS_COUNT_MISMATCH'), false);
assert.equal(model.provenance.writesMade, 0);
assert.equal(model.provenance.externalActionsExecuted, 0);
assert.equal(model.provenance.aiCallsMade, 0);

console.log('PHASE3_SEP9_LIVE_WORKBOOK_PARITY_PASS');
