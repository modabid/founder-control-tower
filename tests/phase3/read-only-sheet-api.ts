import assert from 'node:assert/strict';
import { GoogleSheetsRestReader } from '../../packages/data/src/google-sheets-rest.ts';
import {
  FCT_READ_RANGES,
  getFounderReadModel
} from '../../packages/data/src/founder-read-model.ts';
import type { SheetMatrix, SheetRangeReader } from '../../packages/data/src/sheet-reader.ts';

const fixtures: Record<string, SheetMatrix> = {
  [FCT_READ_RANGES.dailyPnl]: [
    ['Date','Country','Orders_Picked','Delivered_Paid','Pending','RRTO','Delivery_Success','Delivered_Revenue_AED','Product_Cost_AED','Delivery_Cost_AED','RTO_Cost_AED','Gross_Contribution_AED','Meta_Spend_AED','TikTok_Spend_AED','Contribution_After_Meta_AED','Real_Contribution_Profit_AED','Courier_Receivable_AED','PNL_Status'],
    [46266,'United Arab Emirates',45,24,4,17,0.5853658537,1788.83,394.41,299.4,0,1095.02,335.46,'',759.56,'',1788.83,'PROVISIONAL_TIKTOK; META_COUNTRY_SPLIT_PENDING'],
    [46267,'United Arab Emirates',41,29,1,11,0.725,2264.86,459.75,360.6,0,1444.51,532.99,'',911.52,'',2264.86,'PROVISIONAL_TIKTOK; META_COUNTRY_SPLIT_PENDING']
  ],
  [FCT_READ_RANGES.ordersCash]: [
    ['Pickup_Date','Raw_Status','Store','Reference_ID','Shipment_ID','SKU_1','Product_1','Qty_1','SKU_2','Product_2','Qty_2','SKU_3','Product_3','Qty_3','SKU_4','Product_4','Qty_4','SKU_5','Product_5','Qty_5','COD_Local','COD_AED','Raw_Delivery_Cost_AED','Product_Cost_AED','Status_Group','Delivery_Cost_AED','Is_Finalized','Is_Delivered','Is_Paid','Is_RRTO','Courier_Receivable_AED'],
    [46266,'PAID','Store A','R1','AWB1','PLG1','P1',1,'','','','','','','','','','','','',59,59,11.55,13,'PAID',11.55,1,1,1,0,0],
    [46267,'DELIVERED','Store A','R2','AWB2','PLG2','P2',1,'','','','','','','','','','','','',69,69,11.55,12,'DELIVERED',11.55,1,1,0,0,69]
  ],
  [FCT_READ_RANGES.ordersKuwait]: [
    ['Pickup Date','Staus','Reference ID','Sender Name','Shipment ID','SKU-001','Product Name','QTY','SKU-002','Product Name','QTY','SKU-003','Product Name','QTY','SKU-004','Product Name','QTY','SKU-005','Product Name','Mobile No.','COD Amount','In AED'],
    [46267,'Delivered','#K1','Store K','KWT1','PLG3','P3',1,'','','','','','','','','','','','',9.99,118.55],
    [46267,'Delivered','#DUP','Store K','AWB2','PLG2','P2',1,'','','','','','','','','','','','',99.99,999]
  ],
  [FCT_READ_RANGES.metaSpend]: [
    ['Date','Portfolio','Account_ID','Account_Name','Currency','Campaign_ID','Campaign_Name','Spend_Native','FX_to_AED','Spend_AED','Store','SKU','Product_Name','Country','Mapping_Status','Source','Key','Data_Quality_Flag'],
    [46266,'P','A1','Account','AED','C1','Campaign',61.52,1,61.52,'Store A','PLG1','P1','United Arab Emirates','VALIDATED','META LIVE','K1','OK'],
    [46267,'P','A1','Account','AED','C2','Campaign 2',57.34,1,57.34,'Store A','PLG2','P2','United Arab Emirates','VALIDATED','META LIVE','K2','OK']
  ],
  [FCT_READ_RANGES.payroll]: [
    ['Month','Pay_Date','Staff_ID','Gross_Native','Commission_Native','Advance_Recovery_Native','Net_Cash_Paid_Native','Currency','FX_to_AED','Gross_Payroll_AED','Net_Cash_AED','Payment_Method','Payment_Reference','Payment_Status','Source','Notes'],
    ['2026-09','2026-09-03','S1',35200,0,10000,25200,'INR',0.04,1408,1008,'Transfer','','ACCRUED_PAYMENT_EVIDENCE_PENDING','Founder',''],
    ['2026-09','2026-09-03','S2',26500,0,0,26500,'INR',0.04,1060,1060,'Transfer','','ACCRUED_PAYMENT_EVIDENCE_PENDING','Founder','']
  ],
  [FCT_READ_RANGES.opex]: [
    ['Expense_ID','Expense','Category','Amount_Native','Currency','Frequency','Monthly_Equivalent_Native','AED_Normalization_Method','Payment_Day','Payment_Method','Cost_Center','VAT_Evidence','Source','Status','Effective_From','Notes'],
    ['O1','Office','Operations',5000,'AED','MONTHLY',5000,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O2','Trade License','Compliance',10000,'AED','ANNUAL',833.3333333333,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O3','Visa','HR',2000,'AED','EVERY_24_MONTHS',83.3333333333,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,''],
    ['O4','Electricity','Utilities',500,'AED','MONTHLY',500,'AED direct','','','SHARED','','Founder','ESTIMATE',46266,'']
  ],
  [FCT_READ_RANGES.subscriptions]: [
    ['Subscription_ID','Service','Category','Founder_Budget_Native','Currency','Frequency','Payment_Source','Cost_Center','Active_Status','Reconcile_Source','Latest_Observed_Evidence','Observed_AED','Allocation_Status','Data_Quality','Notes'],
    ['S1','Claude','AI',100,'USD','MONTHLY','Mamo','SHARED','ACTIVE_CONFIRMED','RAW','','380.23','SHARED','CURRENT_BASELINE',''],
    ['S2','ChatGPT','AI',20,'USD','MONTHLY','Pending','SHARED','ACTIVE_CONFIRMED','RAW','','76.05','SHARED','BUDGET_FALLBACK','']
  ],
  [FCT_READ_RANGES.actionQueue]: [
    ['Action_ID','Created_At','Agent','Area','Priority','Recommendation','Reason','Confidence','Evidence','Expected_Impact','Risk','Owner','Approval_Status','Approved_By','Approved_At','Email_Status','Email_Sent_At','Execution_Status','Due_Date','Completed_At','Result','Source','Last_Updated','Notes'],
    ['ACT-1',46266,'ATLAS','Ops','ACT NOW','Review courier cash','Cash risk','HIGH','','','','Abid','PENDING_FOUNDER','','','','','BLOCKED_APPROVAL','','','','ATLAS:1',46266,''],
    ['ACT-2',46266,'ATLAS','Internal','WATCH','Refresh internal data','Freshness','HIGH','','','','ROUTE','NOT_REQUIRED','','','','','READY_INTERNAL','','','','ATLAS:1',46266,'']
  ],
  [FCT_READ_RANGES.stock]: [
    ['Country','Product (SKU)','Available Stock','Confirmed Courier Stock','Pickup Last 7d','Avg / Day 7d','Pickup Last 14d','Avg / Day 14d','Demand Velocity Used','Available Stock Days','Stock Alert','Recommended Action','Data Quality'],
    ['United Arab Emirates','Product 1 (PLG1)',2,0,7,1,28,2,2,1,'ACT NOW','Review','OK'],
    ['Kuwait','Product 2 (PLG2)',10,0,7,1,28,2,2,5,'WATCH','Review','OK'],
    ['United Arab Emirates','Dormant Product (PLG0)',0,0,0,0,0,0,0,'','NO RECENT DEMAND','Monitor','OK']
  ]
};

class FixtureReader implements SheetRangeReader {
  readonly calls: string[] = [];
  async readRange(range: string): Promise<SheetMatrix> {
    this.calls.push(range);
    const value = fixtures[range];
    if (!value) throw new Error('Unexpected range: ' + range);
    return value;
  }
}

const reader = new FixtureReader();
const model = await getFounderReadModel(reader, '2026-09-10T08:15:00+04:00');

assert.equal(reader.calls.length, 9);
assert.equal(new Set(reader.calls).size, 9);
assert.equal(model.status, 'SUCCESS');
assert.equal(model.economics.ordersPickedMtd, 86);
assert.equal(model.economics.deliveredPaidMtd, 53);
assert.equal(model.economics.rrtoMtd, 28);
assert.equal(model.economics.finalizedDeliverySuccess, 53 / 81);
assert.equal(model.economics.deliveredRevenueAed, 4053.69);
assert.equal(model.economics.grossContributionAed, 2539.53);
assert.equal(model.economics.courierReceivableAed, 187.55);
assert.equal(model.economics.paidCount, 1);
assert.equal(model.economics.deliveredUnpaidCount, 2);
assert.equal(model.economics.metaPlatformSpendAed, 118.86);
assert.equal(model.economics.realContributionAed, null);
assert.equal(model.economics.realContributionStatus, 'BLOCKED_MISSING_TIKTOK_SPEND');
assert.equal(model.economics.operatingProfitAed, null);
assert.equal(model.economics.operatingProfitStatus, 'BLOCKED_MISSING_TIKTOK_SPEND');
assert.equal(model.economics.monthlyFixedCostBaselineAed, 9340.95);
assert.equal(model.approvals.pendingCount, 1);
assert.equal(model.approvals.pending[0].actionId, 'ACT-1');
assert.equal(model.stock.critical.length, 1);
assert.equal(model.stock.watch.length, 1);
assert.equal(model.stock.velocityMismatchCount, 0);
assert.equal(model.provenance.writesMade, 0);
assert.equal(model.provenance.externalActionsExecuted, 0);
assert.equal(model.provenance.aiCallsMade, 0);
assert.equal(model.controls.dataQualityStatus, 'FAIL');
assert.ok(model.controls.flags.some((flag) => flag.code === 'TIKTOK_SPEND_MISSING'));
assert.ok(model.controls.flags.some((flag) => flag.code === 'META_TOTAL_VS_PNL_ALLOCATION_GAP'));
assert.ok(model.controls.flags.some((flag) => flag.code === 'DAILY_PNL_VS_ORDER_COUNT_MISMATCH'));

let requestedUrl = '';
let requestedInit: RequestInit | undefined;
const rest = new GoogleSheetsRestReader(
  'sheet-id',
  async () => 'token',
  async (url, init) => {
    requestedUrl = url;
    requestedInit = init;
    return new Response(JSON.stringify({ values: [['A'], [1]] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
);
const matrix = await rest.readRange('DAILY_PNL!A:R');
assert.deepEqual(matrix, [['A'], [1]]);
assert.equal(requestedInit?.method, 'GET');
assert.equal((requestedInit?.headers as Record<string, string>).Authorization, 'Bearer token');
assert.ok(requestedUrl.startsWith('https://sheets.googleapis.com/v4/spreadsheets/sheet-id/values/'));
assert.ok(requestedUrl.includes('UNFORMATTED_VALUE'));

console.log('PHASE3_READ_ONLY_SHEET_API_PASS');
