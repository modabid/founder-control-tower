# Apps Script Read Bridge

## Purpose

Provide Founder Control Tower's Vercel runtime a low-cost, read-only path to the existing Google Sheet without creating a new Google Cloud billing account or service account.

## Data flow

`Founder browser -> Vercel GET /api/founder -> Apps Script POST bridge -> Google Sheet`

The browser never calls Apps Script directly and never receives the bridge token.

## Security boundary

- Apps Script web-app transport is anonymous so the Vercel server can reach it.
- Every valid bridge request must include a separate high-entropy token.
- Apps Script stores the expected token only in Script Properties as `FCT_READ_BRIDGE_TOKEN`.
- GitHub/Vercel store the matching server-side value as `FCT_APPS_SCRIPT_READ_TOKEN`.
- The clasp OAuth credential is deployment-only and is never used on the application request path.
- The bridge URL/deployment ID is not treated as a secret; access is controlled by the token.

## Read allow-list

The bridge exposes only these source ranges:

- `DAILY_PNL!A:R`
- `ORDERS_MASTER!H:AL`
- `RAW_KWT!C:X`
- `META_SPEND_LIVE!A:R`
- `PAYROLL_LEDGER!A:P`
- `OPEX_CONTROL!A:P`
- `SUBSCRIPTIONS_CONTROL!A:O`
- `ACTION_QUEUE!A:X`
- `STOCK_INTELLIGENCE!A:M`

It reads only through `SpreadsheetApp` and returns matrices. It contains no `setValue`, `setValues`, `appendRow`, row insertion/deletion, queue mutation, messaging, AI call or external business executor.

## Business logic boundary

The bridge does not calculate profit, delivery success, receivables, ad completeness or inventory risk. Those deterministic rules stay in portable TypeScript. This keeps Apps Script transitional per ADR-006/ADR-007 rather than moving new business logic back into Apps Script.

## Deployment

Source/manifest and the versioned web app are deployed only through the founder-gated branch `deploy/apps-script-web` and `.github/workflows/apps-script-read-bridge-deploy.yml`.

The first successful deployment ID/URL is recorded in `config/apps-script-read-bridge.json`. Future approved deployments update that same versioned deployment so Vercel can keep a stable bridge URL.

## Failure behavior

- missing/short Script Property token -> unauthorized;
- wrong token -> unauthorized;
- unsupported request -> bad request;
- missing sheet/range/provider failure -> source unavailable;
- Vercel converts bridge/provider failure into the existing fail-closed `FOUNDER_DATA_UNAVAILABLE` response;
- no business conclusion should be inferred when the live source is unavailable.
