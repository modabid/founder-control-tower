# Data Sources

## Founder Control Tower Workbook

Spreadsheet ID:

`1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU`

Key current tabs include:

- CONFIG
- RAW_UAE / RAW_KWT / RAW_SAU
- RAW_AD_SPEND
- RAW_EXPENSES
- RAW_SELLER_PAYMENTS
- INVENTORY_MASTER
- INVENTORY_CONTROL
- STOCK_INTELLIGENCE
- ORDERS_MASTER
- DAILY_PNL
- PRODUCT_PNL
- STORE_PNL
- COUNTRY_PNL
- COURIER_PERF
- BANK_TRANSACTIONS
- PAYMENT_RECON
- BANK_CONTROL
- CASH_RECON
- ALERTS
- FOUNDER_REPORT
- REPORT_HISTORY
- DATA_QUALITY
- META_SPEND_LIVE
- META_CAMPAIGN_MAP
- META_MAPPING_QUEUE
- TEAM_MASTER
- PAYROLL_LEDGER
- OPEX_CONTROL
- SUBSCRIPTIONS_CONTROL
- COST_CENTERS
- ACTION_QUEUE

Several supporting normalized/flow tabs are hidden in the workbook.

## Migration Principle

Do not make the future web app depend directly on arbitrary sheet ranges. Preserve normalized domain contracts so Sheets can be replaced by database repositories/adapters.
