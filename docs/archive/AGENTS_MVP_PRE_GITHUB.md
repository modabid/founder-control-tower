# Founder Control Tower — Codex Instructions

## Read First

The source of truth for product and technical requirements is:

`FOUNDER_CONTROL_TOWER_SPEC.md`

Read that file before making architectural or business-logic changes.

## Current Goal

Build and validate a low-cost Founder Control Tower MVP using:

- Google Sheets as the MVP data layer
- Google Apps Script for ingestion, normalization, calculations, automation, and scheduled jobs
- OpenAI API only for reasoning, prioritization, explanations, and founder reports

Do not introduce Supabase, Vercel, n8n, paid data connectors, or a web dashboard unless explicitly requested.

## Critical Architecture Rules

1. Existing `DATA 2026` workbook is an operational source and must be treated as read-only by the Control Tower.
2. Build a separate `Founder Control Tower` sheet.
3. Do not trust existing Profit/Summary calculations as the authoritative business logic.
4. Import factual source fields and calculate Control Tower KPIs independently.
5. Keep deterministic financial calculations out of the AI layer.
6. Keep connectors, normalization, metrics, alerts, AI, and reports logically separated.
7. Write business logic so it can later migrate to TypeScript + Supabase/Postgres.
8. Avoid hardcoded business/store/country/courier names in calculation logic.
9. Prefer config-driven rules.
10. MVP is read-only: analyze and recommend, do not change ads/orders/payments automatically.

## Status Semantics

- Pending = outcome not final
- Delivered = customer received order, courier COD not yet remitted
- Paid = delivered and COD remittance received
- RRTO = final delivery failure
- Unshipped = not handed to courier

Final delivery success:

`(Delivered + Paid) / (Delivered + Paid + RRTO)`

Pending/Unshipped must not be in the finalized success denominator.

## Profit Rules

Do not use the existing row-level `Profit` field as real profit.

Calculate:

1. Gross Contribution
2. Real Contribution Profit
3. Operating Profit

Keep cash received separate from realized profit.

Delivered but not Paid = courier receivable.

## Country Scope

Support:

- UAE active
- Kuwait active
- Saudi paused but structurally supported

Group reporting currency = AED.
Keep local-currency values too.

## AI Rule

Do not send raw customer-level data to OpenAI unless necessary.

Build compact KPI/anomaly snapshots first.

AI may:
- explain changes
- prioritize issues
- suggest actions
- create founder reports

AI must not be the source of truth for arithmetic or accounting calculations.

## Before Coding

For each feature:

1. Identify source data
2. Define normalized schema
3. Define deterministic calculation
4. Define reconciliation/check
5. Define alert condition if applicable
6. Only then add AI interpretation

## Validation

Always add or run checks that confirm:

- totals reconcile to source data
- no double-counting
- Pending is excluded from finalized delivery success
- Delivered and Paid both count as delivered revenue
- Paid alone counts as courier cash received
- product/store/country/courier rollups reconcile to group totals
- ad spend is not counted twice

## Migration Principle

This MVP should be cheap, but not disposable.

When later moved to GitHub/Supabase, we should be able to reuse the domain model and calculation rules rather than redesign the product.
