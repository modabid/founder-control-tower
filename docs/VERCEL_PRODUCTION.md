# Founder Control Tower — Vercel Production Contract

## Dedicated project

Founder Control Tower must be deployed into a new dedicated Vercel project named `founder-control-tower` sourced from `modabid/founder-control-tower`.

Do not deploy this web surface into COD Dropshipping, StoreGem, DropshippingHunt or another existing Vercel project.

## Production surface

The initial production surface is read-only:

- founder dashboard;
- GET-only `/api/founder` endpoint;
- deterministic workbook-derived metrics and controls;
- no ACTION_QUEUE mutation;
- no workbook writes;
- no paid AI calls from the request path;
- no external business executor.

## Server-only environment

Required production environment variables:

- `FCT_GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `FCT_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `FCT_WEB_ACCESS_TOKEN`

Optional:

- `FCT_SPREADSHEET_ID` — defaults to the locked Founder Control Tower MVP workbook.

The Google credential must be dedicated to read access for the web runtime. The Apps Script/clasp deployment credential is deployment-only and must never be reused.

No Google credential or founder bearer token may be embedded in browser-delivered assets.

## Deployment verification

Before marking production READY, verify all of the following:

1. CI green on the exact commit deployed.
2. Dashboard loads from the dedicated Vercel project.
3. Unauthorized `/api/founder` request fails closed.
4. Authorized request reads the live workbook successfully.
5. Responses remain `private, no-store` / CDN `no-store`.
6. TikTok missing spend continues to block final Real Contribution and Operating Profit.
7. Delivered remains distinct from Paid and courier receivable semantics remain intact.
8. UAE + Kuwait order-source parity is preserved without duplicate shipment counting.
9. Zero-demand zero-stock SKUs do not surface as false active-demand stockouts.
10. No Sheet write, approval mutation, paid AI call or external business action occurs.

Production deployment or redeployment remains founder-gated even though normal technical work is hands-off.
