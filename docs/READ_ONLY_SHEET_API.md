# Read-Only Sheet / Founder API Contract

Status: **Phase 3 V1 — code-complete, not production-deployed**

## Purpose

Provide a portable, deterministic read boundary over the current Founder Control Tower Google Sheet so the future web dashboard can migrate away from Apps Script without changing business semantics.

This layer is read-only. It does not approve actions, execute actions, modify Sheet data, call AI providers, or expose raw Google credentials to a client.

## Verified Live Source Ranges

The following source contracts were checked against the live `Founder Control Tower - MVP` workbook on 2026-09-10:

| Source | Read Range | Purpose |
|---|---|---|
| `DAILY_PNL` | `A:R` | MTD orders, terminal delivery outcomes, revenue, gross contribution, P&L allocation status |
| `ORDERS_MASTER` | `H:AL` | pickup date, COD, status semantics, Delivered/Paid flags, courier receivable |
| `META_SPEND_LIVE` | `A:R` | platform Meta spend, mapping state and cutoff |
| `PAYROLL_LEDGER` | `A:P` | current-month gross payroll, cash and payment-evidence state |
| `OPEX_CONTROL` | `A:P` | recurring/fixed OPEX baseline |
| `SUBSCRIPTIONS_CONTROL` | `A:O` | active software/SaaS observed AED costs |
| `ACTION_QUEUE` | `A:X` | pending founder approvals and audit metadata |
| `STOCK_INTELLIGENCE` | `A:M` | physical stock, 7d/14d velocity and stock risk |

`ORDERS_MASTER` intentionally starts at column H for this read model. The API does not request customer-name or customer-mobile fields.

## Deterministic Rules

The read model delegates portable formulas to `packages/domain/src/core.ts`. In particular:

- final delivery success uses terminal outcomes only;
- Delivered and Paid remain separate financial states;
- Delivered-but-unpaid remains courier receivable;
- Meta platform spend comes from `META_SPEND_LIVE` and is reconciled against the amount allocated into `DAILY_PNL`;
- missing active TikTok spend remains a hard blocker for final Real Contribution and Operating Profit;
- fixed-cost baseline uses current-month gross payroll, active AED OPEX monthly equivalents and active subscription observed AED costs;
- inventory velocity is `max(7-day average pickup, 14-day average pickup)`;
- stock days are based on physical available stock;
- invalid deterministic inputs fail closed instead of being guessed or silently coerced.

## Data-Quality Controls

The founder read model explicitly surfaces review/fail flags for conditions including:

- missing TikTok spend;
- Meta platform total vs P&L allocation difference;
- PAID orders carrying non-zero courier receivable;
- DAILY_PNL terminal-success count vs ORDERS_MASTER mismatch;
- payroll payment evidence pending;
- active subscription cost missing;
- non-AED OPEX excluded from the AED baseline pending conversion;
- Meta/P&L cutoff mismatch;
- STOCK_INTELLIGENCE velocity differing from the locked max(7d,14d) rule.

An empty general `DATA_QUALITY` table is never interpreted as proof that the system is clean.

## Google Sheets Reader

`packages/data/src/google-sheets-rest.ts` exposes only a `readRange()` method and issues HTTP `GET` requests to the Google Sheets values API. There is no write/update/append/delete method in this adapter.

The access-token provider is injected. The data layer does not own OAuth refresh-token storage.

## Founder API Boundary

`packages/api/src/founder-read-api.ts` is framework-neutral and intentionally narrow:

- accepts `GET` only;
- requires an explicit authorization function;
- returns `401` before reading Sheet data when unauthorized;
- returns `405` for non-GET methods;
- uses `Cache-Control: private, no-store`;
- converts provider/internal failures into a generic `503 FOUNDER_DATA_UNAVAILABLE` response rather than leaking provider payloads, tokens, stack traces or internals;
- exposes no mutation, approval, execution or AI endpoint.

## Production Credential Rule

A future web deployment must use a **dedicated server-only Google read credential/token provider** with the minimum practical Sheets read scope (target: `spreadsheets.readonly`).

`FCT_CLASP_AUTH_JSON` is a deployment credential for controlled Apps Script source deployment. It must **not** be reused as the web application's data credential.

Google access/refresh tokens must remain in a server-side secret store or environment and must never be sent to browser JavaScript or committed to GitHub.

## Deployment Boundary

This Phase-3 work adds source code, contracts and zero-paid-API regression tests only. It does not:

- publish a live API endpoint;
- deploy a web application;
- provision paid infrastructure;
- write to the workbook;
- mutate `ACTION_QUEUE`;
- execute ads, money movement, courier/order changes, inventory actions, communications, purchases, deployments or other governed business actions.

Production web/API deployment remains a separate founder Yes/No gate.
