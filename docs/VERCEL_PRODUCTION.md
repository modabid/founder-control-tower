# Founder Control Tower — Vercel Production Contract

## Dedicated project

Founder Control Tower is deployed only into the dedicated Vercel project `founder-control-tower` for repository `modabid/founder-control-tower`.

Do not deploy this web surface into COD Dropshipping, StoreGem, DropshippingHunt or another existing Vercel project.

A safe preview/bootstrap deployment created the dedicated project on 2026-09-11. That bootstrap contains no Google credential and is not the live production dashboard.

## Production surface

The initial production surface is read-only:

- founder dashboard;
- GET-only `/api/founder` endpoint;
- deterministic workbook-derived metrics and controls;
- no ACTION_QUEUE mutation;
- no workbook writes;
- no paid AI calls from the request path;
- no external business executor.

## Controlled production gate

Production deploys are triggered only by the dedicated Git branch:

`deploy/vercel`

`.github/workflows/vercel-controlled-deploy.yml` must run the complete deterministic regression suite before contacting Vercel. It then links only the `founder-control-tower` project, deploys to production, and verifies:

- root dashboard HTTP 200;
- unauthenticated founder API = 401;
- POST founder API = 405;
- authenticated live read = 200;
- Google Sheets read-only provenance;
- writes = 0;
- external actions = 0;
- request-path AI calls = 0;
- browser/CDN caching remains disabled.

The branch is a founder-approval gate. Normal commits to `main` cannot trigger this production workflow.

## GitHub production secrets

The controlled workflow expects these repository secrets:

- `FCT_VERCEL_TOKEN` — Vercel authorization token with access to the dedicated project scope;
- `FCT_GOOGLE_SERVICE_ACCOUNT_JSON` — a dedicated Google service-account JSON credential whose account has Viewer access to the Founder Control Tower workbook;
- `FCT_WEB_ACCESS_TOKEN` — founder login/access key, minimum 24 characters.

The workflow validates the service-account structure, converts it to a masked single-line Base64 runtime value, and passes it to the production deployment as `FCT_GOOGLE_SERVICE_ACCOUNT_JSON_B64`. Base64 is transport encoding, not encryption; the value remains a secret.

The application also retains compatibility with separate server-side `FCT_GOOGLE_SERVICE_ACCOUNT_EMAIL` and `FCT_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` values, but the controlled workflow uses the single JSON secret to reduce manual setup errors.

`FCT_SPREADSHEET_ID` is fixed to the locked MVP workbook in the workflow unless explicitly changed through reviewed code.

The Apps Script/clasp deployment credential is deployment-only and must never be reused by the web application.

No Google credential or founder bearer token may be embedded in browser-delivered assets.

## Deployment verification

Before marking production READY, verify all of the following:

1. CI green on the exact commit deployed.
2. Dashboard loads from the dedicated Vercel project.
3. Unauthorized `/api/founder` request fails closed.
4. Authorized request reads the live workbook successfully.
5. Responses remain `private, no-store` / CDN `no-store`.
6. TikTok missing spend continues to block final Real Contribution and Operating Profit while that source remains missing.
7. Delivered remains distinct from Paid and courier receivable semantics remain intact.
8. UAE + Kuwait order-source parity is preserved without duplicate shipment counting.
9. Zero-demand zero-stock SKUs do not surface as false active-demand stockouts.
10. No Sheet write, approval mutation, paid AI call or external business action occurs.

Production deployment or redeployment remains founder-gated even though normal technical work is hands-off.
