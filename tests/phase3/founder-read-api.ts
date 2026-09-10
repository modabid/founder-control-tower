import assert from 'node:assert/strict';
import { createFounderReadApi } from '../../packages/api/src/founder-read-api.ts';
import { FCT_READ_RANGES } from '../../packages/data/src/founder-read-model.ts';
import type { SheetMatrix, SheetRangeReader } from '../../packages/data/src/sheet-reader.ts';

const headers: Record<string, SheetMatrix> = {
  [FCT_READ_RANGES.dailyPnl]: [['Date','Country','Orders_Picked','Delivered_Paid','Pending','RRTO','Delivery_Success','Delivered_Revenue_AED','Product_Cost_AED','Delivery_Cost_AED','RTO_Cost_AED','Gross_Contribution_AED','Meta_Spend_AED','TikTok_Spend_AED','Contribution_After_Meta_AED','Real_Contribution_Profit_AED','Courier_Receivable_AED','PNL_Status']],
  [FCT_READ_RANGES.ordersCash]: [['Pickup_Date','Raw_Status','Store','Reference_ID','Shipment_ID','SKU_1','Product_1','Qty_1','SKU_2','Product_2','Qty_2','SKU_3','Product_3','Qty_3','SKU_4','Product_4','Qty_4','SKU_5','Product_5','Qty_5','COD_Local','COD_AED','Raw_Delivery_Cost_AED','Product_Cost_AED','Status_Group','Delivery_Cost_AED','Is_Finalized','Is_Delivered','Is_Paid','Is_RRTO','Courier_Receivable_AED']],
  [FCT_READ_RANGES.ordersKuwait]: [['Pickup Date','Staus','Reference ID','Sender Name','Shipment ID','SKU-001','Product Name','QTY','SKU-002','Product Name','QTY','SKU-003','Product Name','QTY','SKU-004','Product Name','QTY','SKU-005','Product Name','Mobile No.','COD Amount','In AED']],
  [FCT_READ_RANGES.metaSpend]: [['Date','Portfolio','Account_ID','Account_Name','Currency','Campaign_ID','Campaign_Name','Spend_Native','FX_to_AED','Spend_AED','Store','SKU','Product_Name','Country','Mapping_Status','Source','Key','Data_Quality_Flag']],
  [FCT_READ_RANGES.payroll]: [['Month','Pay_Date','Staff_ID','Gross_Native','Commission_Native','Advance_Recovery_Native','Net_Cash_Paid_Native','Currency','FX_to_AED','Gross_Payroll_AED','Net_Cash_AED','Payment_Method','Payment_Reference','Payment_Status','Source','Notes']],
  [FCT_READ_RANGES.opex]: [['Expense_ID','Expense','Category','Amount_Native','Currency','Frequency','Monthly_Equivalent_Native','AED_Normalization_Method','Payment_Day','Payment_Method','Cost_Center','VAT_Evidence','Source','Status','Effective_From','Notes']],
  [FCT_READ_RANGES.subscriptions]: [['Subscription_ID','Service','Category','Founder_Budget_Native','Currency','Frequency','Payment_Source','Cost_Center','Active_Status','Reconcile_Source','Latest_Observed_Evidence','Observed_AED','Allocation_Status','Data_Quality','Notes']],
  [FCT_READ_RANGES.actionQueue]: [['Action_ID','Created_At','Agent','Area','Priority','Recommendation','Reason','Confidence','Evidence','Expected_Impact','Risk','Owner','Approval_Status','Approved_By','Approved_At','Email_Status','Email_Sent_At','Execution_Status','Due_Date','Completed_At','Result','Source','Last_Updated','Notes']],
  [FCT_READ_RANGES.stock]: [['Country','Product (SKU)','Available Stock','Confirmed Courier Stock','Pickup Last 7d','Avg / Day 7d','Pickup Last 14d','Avg / Day 14d','Demand Velocity Used','Available Stock Days','Stock Alert','Recommended Action','Data Quality']]
};

class CountingReader implements SheetRangeReader {
  calls = 0;
  private readonly fail: boolean;

  constructor(fail = false) {
    this.fail = fail;
  }

  async readRange(range: string): Promise<SheetMatrix> {
    this.calls++;
    if (this.fail) throw new Error('provider secret details must not leak');
    const matrix = headers[range];
    if (!matrix) throw new Error('Unexpected range: ' + range);
    return matrix;
  }
}

const blockedReader = new CountingReader();
const blockedApi = createFounderReadApi({
  reader: blockedReader,
  authorize: async () => false,
  now: () => new Date('2026-09-10T04:15:00.000Z')
});

const post = await blockedApi({ method: 'POST' });
assert.equal(post.status, 405);
assert.equal(post.headers.Allow, 'GET');
assert.equal(blockedReader.calls, 0);

const unauthorized = await blockedApi({ method: 'GET' });
assert.equal(unauthorized.status, 401);
assert.equal(blockedReader.calls, 0);

const reader = new CountingReader();
const api = createFounderReadApi({
  reader,
  authorize: (request) => request.headers?.authorization === 'Bearer founder-session',
  now: () => new Date('2026-09-10T04:15:00.000Z')
});

const ok = await api({ method: 'GET', headers: { authorization: 'Bearer founder-session' } });
assert.equal(ok.status, 200);
assert.equal(ok.body.ok, true);
assert.equal(ok.body.data?.provenance.writesMade, 0);
assert.equal(ok.body.data?.provenance.externalActionsExecuted, 0);
assert.equal(ok.body.data?.provenance.aiCallsMade, 0);
assert.equal(reader.calls, 9);
assert.match(ok.headers['Cache-Control'], /no-store/);

const failingReader = new CountingReader(true);
const failingApi = createFounderReadApi({
  reader: failingReader,
  authorize: () => true,
  now: () => new Date('2026-09-10T04:15:00.000Z')
});
const unavailable = await failingApi({ method: 'GET' });
assert.equal(unavailable.status, 503);
assert.equal(unavailable.body.error, 'FOUNDER_DATA_UNAVAILABLE');
assert.equal(JSON.stringify(unavailable).includes('provider secret details'), false);

assert.throws(() => createFounderReadApi({ reader, authorize: undefined as never, now: () => new Date() }));

console.log('PHASE3_FOUNDER_READ_API_PASS');
