# Founder Control Tower

## Product / Technical Specification

**Status:** MVP architecture approved for validation  
**Primary objective:** Build a low-cost Founder Control Tower that reads existing business data, calculates accurate operational and financial KPIs, detects problems/opportunities, and generates a concise founder-level daily report.

---

## 1. Core Product Principle

The Control Tower must not become another manual dashboard.

Its job is to answer:

1. What changed?
2. What is wrong?
3. Where are we losing money?
4. What opportunity should we act on?
5. What should the founder do today?

The system must classify findings into:

- 🔴 ACT NOW
- 🟡 WATCH
- 🟢 OPPORTUNITY
- ⚪ NORMAL / DO NOT BOTHER THE FOUNDER

Normal data should not create noise.

---

## 2. Current MVP Stack

The validation version must stay extremely low cost.

### Data layer
- Google Sheets
- Existing `DATA 2026` workbook remains the operational source of truth
- A separate new Google Sheet named `Founder Control Tower` will be created

### Calculation / automation layer
- Google Apps Script
- All important calculations must be deterministic in code/formulas
- AI must not be responsible for core financial calculations

### AI brain
- OpenAI API
- AI receives only summarized/structured KPI data, anomalies, historical comparisons, and relevant context
- AI produces founder-level interpretation, prioritization, explanations, and recommended actions

### No MVP requirement for
- Supabase
- Vercel
- n8n
- paid Meta reporting connectors
- separate warehouse/database infrastructure

---

## 3. Migration-Ready Requirement

Although the first version runs on Google Sheets + Apps Script, the code and data model must be designed so it can later move to:

- GitHub repository
- TypeScript / Node.js services
- Supabase/Postgres
- API-based connectors
- SaaS multi-tenant architecture for COD sellers

Avoid spreadsheet-specific business logic where possible.

Business rules should live in reusable functions/modules so they can later be ported with minimal rewriting.

---

## 4. Existing Source Workbook

Source workbook: `DATA 2026`

The existing workbook must remain operational and should not be redesigned during MVP validation.

The Control Tower must read from it but should not depend on its summary/profit formulas as authoritative calculations.

### Important source tabs

Use or inspect these source areas:

- `DATA` → UAE operational order/shipment data
- `DATA KWT` → Kuwait operational data
- `DATA SAU` / Saudi source if available → Saudi data, currently paused but structurally supported
- `Spend` → historical ad spend by date/store/SKU
- `Purchase` / inventory-related sources → current product cost logic feeds the order data
- `Seller Payment` → seller payouts where relevant
- Existing summary/profit tabs → reference only, not calculation source

### Source data already includes fields such as

- Month
- Courier
- Pickup Date
- Status
- Reference ID
- Sender / Store
- Shipment ID / AWB
- SKU 1–5
- Product Names
- Quantities
- COD Amount
- Delivery Charges
- Product Cost 1–5
- Total Product Cost
- existing row-level Profit

The new Control Tower must take factual fields from source rows and calculate its own KPIs independently.

---

## 5. Status Model

Operational lifecycle:

```text
Pending → Delivered → Paid
               ↘
                RRTO
```

Definitions:

### Pending
Order is with courier / outcome is not final.

### Delivered
Customer received the order. Revenue is earned, but courier COD remittance has not yet been received.

### Paid
Delivered order for which COD remittance has been received from courier.

### RRTO
Undelivered / return-to-origin final failure.

### Unshipped
Not yet handed over to courier.

---

## 6. Delivery Success Formula

Do not calculate success against pending orders.

### Finalized Delivery Success

```text
(Delivered + Paid) / (Delivered + Paid + RRTO)
```

Pending and Unshipped orders are excluded from final success rate.

Also keep separate operational metrics:

- Pending rate
- RRTO rate
- Aging pending > 1 / 2 / 3 days
- Delivered-not-paid value

---

## 7. Profit Model

The existing row-level `Profit` column in the operational sheet must NOT be used as real profit because RRTO/Pending rows can show positive margin even though revenue was not realized.

The Control Tower calculates profitability from zero.

### Level 1: Gross Contribution

```text
Delivered COD Revenue
- Product Cost attributable to delivered orders
- Delivery / fulfillment cost
- RTO cost
= Gross Contribution
```

### Level 2: Real Contribution Profit

```text
Gross Contribution
- Meta ad spend
- TikTok ad spend
- Google ad spend (when added)
- seller-related variable payouts / direct variable costs
= Real Contribution Profit
```

### Level 3: Operating Profit

```text
Real Contribution Profit
- salaries
- warehouse / rent
- software
- fixed operating expenses
= Operating Profit
```

Keep all three separately. Never show one ambiguous `Profit` metric.

---

## 8. Product Cost Rule

Do not build a duplicate inventory costing engine during MVP.

The existing operational system already imports/calculates product costs from inventory/purchase sources.

For historical order profitability, use the product cost stamped into the order row.

This preserves the cost applicable at the time of the order.

Inventory intelligence can be added later as a separate module.

---

## 9. RRTO Cost Rule

RRTO is not free even if current source rows show delivery charge = 0.

Create courier configuration containing actual commercial rules.

Example structure:

| Country | Courier | Delivered Fee | RTO Fee | Other Fee |
|---|---|---:|---:|---:|
| UAE | C3X | config | config | config |
| UAE | TFM | config | config | config |
| UAE | Lastmile | 10 AED delivered | config | config |
| KWT | OTE / current courier | config | config | config |
| SAU | future | config | config | config |

The calculation engine must use config values when source data does not include the true cost.

---

## 10. Countries

The architecture must support all business markets from day one:

- UAE → active
- Kuwait → active
- Saudi Arabia → paused currently, but supported for future restart
- additional countries later

### Group reporting currency

AED is the group reporting currency.

Each normalized order should keep both:

- local currency amount
- normalized AED amount

Do not destroy local-currency values.

---

## 11. New Founder Control Tower Sheet Structure

Recommended tabs:

### System / config
- `CONFIG`
- `BUSINESSES`
- `COUNTRIES`
- `COURIER_RATES`
- `MAPPINGS`

### Raw imports
- `RAW_UAE`
- `RAW_KWT`
- `RAW_SAU`
- `RAW_AD_SPEND`
- `RAW_REMITTANCE`
- `RAW_LASTMILE`
- `RAW_FINANCE`

### Normalized / calculated
- `ORDERS_MASTER`
- `DAILY_METRICS`
- `DAILY_PNL`
- `PRODUCT_PNL`
- `STORE_PNL`
- `COUNTRY_PNL`
- `COURIER_PERFORMANCE`
- `CASH_RECON`

### Founder intelligence
- `ALERTS`
- `DECISIONS`
- `FOUNDER_REPORT`
- `REPORT_HISTORY`

Machine tabs may be hidden from the founder view.

---

## 12. Universal Normalized Order Model

Every country must map into one common order structure.

Suggested fields:

```text
order_id
reference_id
shipment_id
country
currency
pickup_date
status
store
business
courier
customer_mobile_optional

sku_1
product_1
qty_1
cost_1
sku_2
product_2
qty_2
cost_2
sku_3
product_3
qty_3
cost_3
sku_4
product_4
qty_4
cost_4
sku_5
product_5
qty_5
cost_5

total_product_cost_local
total_product_cost_aed
cod_local
cod_aed
delivery_cost_aed
rto_cost_aed

is_finalized
is_delivered
is_paid
is_rrto
is_pending

source_sheet
source_row
last_synced_at
```

Later, when moved to Postgres/Supabase, products should be normalized into an `order_items` table rather than fixed SKU columns.

---

## 13. Ads Data

### Meta

Current Meta accounts are accessed through team members. The founder's previously suspended Meta identity should not be used for integration.

A legitimate authorized team user can provide reporting access.

MVP target:

```text
Meta Marketing API → Google Apps Script → RAW_AD_SPEND
```

Do not use paid reporting connectors unless direct API proves impractical.

### TikTok

Target:

```text
TikTok Ads API → Google Apps Script → RAW_AD_SPEND
```

Manual export is acceptable during early validation if API setup causes delay.

### Ad normalized schema

```text
date
platform
country
business
store
ad_account_id
campaign_id
campaign_name
adset_or_adgroup_id
adset_or_adgroup_name
ad_id
ad_name
sku_optional
spend
impressions
clicks
ctr
cpm
cpc
purchases_platform
purchase_value_platform
reported_cpa
reported_roas
```

### Important mapping rule

Going forward, ads should map as reliably as possible to:

```text
Country + Store + SKU/Product
```

Without this, exact product-level profit attribution becomes weaker.

---

## 14. Courier and Cash Reconciliation

### C3X

Current process:
- COD remittance emails are received Monday, Wednesday, Friday
- Email contains Excel and PDF

MVP approach:
- Do not require C3X API
- Parse/import the Excel attachment
- PDF is reference/evidence only unless needed
- Match remittance rows using Shipment ID / AWB

Expected logic:

```text
Delivered COD Expected
- COD actually remitted
= Courier Receivable / Difference
```

Alerts should identify missing AWBs and amount differences.

### Lastmile freelancer driver

Lastmile operates deliveries in Sharjah/Ajman.

Known rule:
- driver fee = AED 10 per successful delivered order

Track:

```text
Order / AWB
Area
COD
Status
Delivered Date
COD Collected
Driver Fee
Cash Handed Over
Outstanding Cash
```

Founder Control Tower must treat Lastmile as a courier and also reconcile cash held by the driver.

---

## 15. Cash vs Profit

These must remain separate.

### Realized operational revenue/profit
Recognized when order is Delivered or Paid.

### Cash received
Recognized when status is Paid / remittance is reconciled / Lastmile cash is handed over.

### Courier receivable

```text
Delivered COD not yet remitted
```

Founder reporting should show examples like:

```text
Realized Contribution Profit: AED X
Cash Received: AED Y
Courier Receivable: AED Z
```

Profitability and liquidity must never be mixed.

---

## 16. Core Analysis Dimensions

Every major KPI should be available by:

- Group
- Country
- Business
- Store / Seller
- Product / SKU
- Courier
- Date / period
- Ad account / campaign where available

---

## 17. Product P&L

Required KPIs per SKU/product:

- Orders
- Finalized orders
- Delivered/Paid
- Pending
- RRTO
- Final delivery success
- Delivered revenue
- Product cost
- Delivery/RTO cost
- Ad spend
- CPA
- Gross contribution
- Real contribution profit
- Profit per delivered order
- ROI
- trend vs prior period

The system should be able to identify products that have good ad CPA but poor real profit due to low delivery success.

---

## 18. Store / Seller P&L

Required by store/seller:

- orders
- delivered
- RRTO
- success rate
- revenue
- product cost
- logistics cost
- ad spend or seller payout
- contribution profit
- profit margin
- courier receivable

Seller payout must be treated according to the actual business model, not blindly as ad spend.

---

## 19. Country P&L

Required view:

```text
UAE
Kuwait
Saudi Arabia
Group Total
```

Each market should show:

- orders
- delivered
- finalized success
- revenue AED
- contribution profit AED
- ad spend AED
- cash receivable
- trend
- status / alert level

Saudi can remain inactive without breaking calculations.

---

## 20. Courier Intelligence

For each courier:

- total pickups
- finalized deliveries
- pending
- RRTO
- final success rate
- average delivery aging when possible
- cost per delivered order
- RTO cost
- delivered COD awaiting remittance
- cash reconciled
- contribution profit influenced by courier

Later the agent may recommend courier allocation by area/product/country, but MVP is read-only recommendation only.

---

## 21. Finance Module

Initial finance may remain a simple sheet.

Track:

- fixed expenses
- salaries
- warehouse / rent
- software
- supplier payments
- seller payouts
- courier payments
- other operating expenses

Do not require bank API during validation.

---

## 22. AI Brain Responsibilities

AI must NOT calculate primary financial metrics from raw rows.

### Apps Script / deterministic engine does

- aggregation
- currency conversion
- delivery success
- revenue
- product cost
- courier cost
- RTO cost
- ad spend allocation
- contribution profit
- receivables
- trend calculations
- threshold checks

### OpenAI brain does

- explain why metrics changed
- rank issues by importance
- identify probable root causes
- highlight opportunities
- compare against 7-day / 30-day baselines
- recommend founder actions
- create daily / weekly / monthly narrative
- answer natural-language questions using prepared business context

---

## 23. AI Input Contract

Do not send tens of thousands of raw rows to the model.

Generate a compact JSON-like business snapshot first.

Example:

```json
{
  "period": "2026-09-07",
  "group": {
    "orders": 184,
    "final_delivery_rate": 0.682,
    "delivered_revenue_aed": 9840,
    "real_contribution_profit_aed": 2140,
    "ad_spend_aed": 2860,
    "courier_receivable_aed": 16420
  },
  "countries": [],
  "products": [],
  "stores": [],
  "couriers": [],
  "anomalies": [],
  "previous_periods": {}
}
```

The AI response should be structured and machine-readable where possible.

---

## 24. Daily Founder Report

The report should take about 2–3 minutes to read.

Recommended output:

```text
FOUNDER CONTROL TOWER — [DATE]

GROUP PULSE
Orders: X
Final Delivery: X%
Delivered Revenue: AED X
Real Contribution Profit: AED X
Ad Spend: AED X
Courier Receivable: AED X

COUNTRIES
UAE: ...
Kuwait: ...
Saudi: Paused / ...

🔴 ACT NOW
1. ...
2. ...

🟡 WATCH
1. ...

🟢 OPPORTUNITIES
1. ...
2. ...

CEO PRIORITIES TODAY
1. ...
2. ...
3. ...
```

Do not dump normal metrics unnecessarily.

---

## 25. Weekly and Monthly Intelligence

### Weekly CEO Review

- revenue growth
- contribution profit growth
- cash / courier receivable
- best/worst products
- ad performance
- courier performance
- market performance
- major problems
- experiments
- next-week priorities

### Monthly Portfolio Review

Rank businesses/projects by:

- revenue
- profit
- growth
- cash generation
- problems
- founder attention required
- recommendation: SCALE / FIX / WATCH / PAUSE / REVIEW

---

## 26. Decision / Alert Memory

Store history in the Control Tower sheet initially:

- `ALERTS`
- `DECISIONS`
- `REPORT_HISTORY`

Each alert should ideally contain:

```text
alert_id
detected_at
severity
country
business
store
product
courier
metric
current_value
baseline_value
change_percent
estimated_impact_aed
recommendation
status
resolved_at
```

This later maps cleanly into database tables.

---

## 27. MVP Safety Rules

Initial system is READ ONLY with respect to business operations.

It may:
- read data
- calculate
- alert
- recommend

It must NOT automatically:
- pause ads
- change ad budgets
- refund customers
- make supplier payments
- change orders
- alter courier statuses

Future action layer should use:

```text
Recommend → Founder Approval → Execute
```

---

## 28. Security Rules

- Never hardcode API keys or tokens in sheet cells or source code
- Use Apps Script Properties / secrets during MVP
- Later use environment variables / secret manager
- Founder’s suspended Meta identity must not be used to bypass Meta restrictions
- Meta data should be accessed only through legitimate authorized team access
- Read-only scopes should be preferred where possible
- PII should not be sent to OpenAI unless required
- Avoid sending customer names, phone numbers, addresses to the AI layer

---

## 29. Code Architecture for MVP

Even inside Apps Script, keep modules separate.

Suggested logical structure:

```text
src/
  config.gs
  sync/
    syncUAE.gs
    syncKuwait.gs
    syncSaudi.gs
    syncSpend.gs
    syncMeta.gs
    syncTikTok.gs
    syncC3XRemittance.gs
    syncLastmile.gs
  normalize/
    normalizeOrders.gs
    normalizeAds.gs
  metrics/
    deliveryMetrics.gs
    profitEngine.gs
    cashReconciliation.gs
    productMetrics.gs
    storeMetrics.gs
    countryMetrics.gs
    courierMetrics.gs
  alerts/
    anomalyRules.gs
    alertEngine.gs
  ai/
    buildFounderSnapshot.gs
    openaiClient.gs
    generateFounderReport.gs
  reports/
    writeFounderReport.gs
    reportHistory.gs
  jobs/
    dailyJob.gs
```

If Apps Script project structure is kept flat, preserve equivalent module boundaries by file naming.

---

## 30. Future Supabase Data Model

When validated, migrate normalized entities approximately into:

```text
organizations
businesses
countries
stores
couriers
products
orders
order_items
ad_accounts
ad_campaigns
ad_spend_daily
courier_remittances
courier_remittance_items
expenses
daily_metrics
alerts
decisions
reports
users
```

Every SaaS-ready table should eventually support `organization_id` for multi-tenancy.

---

## 31. SaaS-Readiness Principle

Future target may become a COD Seller Control Tower SaaS.

Therefore:

- no hardcoded company/store names in business logic
- countries configurable
- couriers configurable
- currencies configurable
- formulas driven by configuration
- every entity should have stable IDs
- data connectors separated from metrics engine
- metrics engine separated from AI layer
- AI provider separated from business logic
- future authentication/permissions should support multiple organizations and users

Do not over-engineer multi-tenancy in the Google Sheets MVP, but do not write code that makes migration unnecessarily difficult.

---

## 32. Recommended Migration Path

### Phase 1 — Validation

```text
Existing DATA 2026
+ Founder Control Tower Google Sheet
+ Apps Script
+ OpenAI API
```

Goal: prove the system produces genuinely useful founder decisions for 2–4 weeks.

### Phase 2 — Repository

Move Apps Script logic / business rules into GitHub and cleanly separate:

```text
connectors
normalization
metrics
alerts
AI
reports
```

### Phase 3 — Supabase

```text
Google Sheets / APIs
→ ingestion layer
→ Supabase/Postgres
→ metrics service
→ OpenAI reasoning
→ web dashboard
```

Google Sheets can remain as an operational input/interface where useful.

### Phase 4 — Action Layer

Add approval-based actions.

### Phase 5 — SaaS MVP

Add:
- organization accounts
- authentication
- COD seller onboarding
- connector setup
- country/courier configuration
- per-tenant dashboards
- subscription billing

---

## 33. MVP Build Order

1. Create new Founder Control Tower Google Sheet
2. Build `CONFIG`
3. Import UAE, Kuwait, Saudi source data read-only
4. Normalize into `ORDERS_MASTER`
5. Implement correct status logic
6. Implement delivery metrics
7. Implement independent profit engine
8. Add historical `Spend` import
9. Build product/store/country/courier P&Ls
10. Build cash receivable logic
11. Add Lastmile reconciliation
12. Add C3X remittance import/reconciliation
13. Add Meta spend automation
14. Add TikTok spend automation
15. Build anomaly/alert rules
16. Build founder snapshot
17. Connect OpenAI API
18. Generate daily Founder Report
19. Run parallel with existing reporting for 2–4 weeks
20. Audit accuracy before migration

---

## 34. MVP Acceptance Criteria

Do not call the MVP successful until:

1. Source workbook remains untouched and operational
2. New sheet imports source data reliably
3. UAE + Kuwait work from one normalized model
4. Saudi can be activated without architecture changes
5. Delivery success excludes pending orders
6. Paid vs Delivered correctly separates cash received from courier receivable
7. Profit does not rely on existing row-level Profit values
8. Product/store/country totals reconcile back to source data
9. C3X remittance can be matched by AWB/shipment
10. Lastmile cash outstanding can be calculated
11. Ad spend is allocated without double counting
12. Founder report highlights only meaningful issues/opportunities
13. AI cannot silently modify financial calculations
14. Daily results can be reproduced deterministically from the same source data
15. The architecture can later be moved to GitHub/Supabase without redesigning the business model

---

## 35. Important Non-Goals for First MVP

Do not build yet:

- polished web dashboard
- mobile app
- full bank integration
- autonomous ad management
- autonomous payments
- sophisticated ML forecasting
- complex warehouse system
- microservices
- full SaaS multi-tenancy

Validate founder value first.

---

## 36. Guiding Product Rule

The Founder Control Tower is not a reporting tool.

It is a decision system.

Every output should ultimately help answer:

```text
What should I do now, and why?
```
