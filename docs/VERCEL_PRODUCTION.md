# Founder Control Tower — Vercel Production Contract

## Dedicated project

Founder Control Tower is deployed only into the dedicated Vercel project `founder-control-tower` for repository `modabid/founder-control-tower`.

Do not deploy this web surface into COD Dropshipping, StoreGem, DropshippingHunt or another existing Vercel project.

A safe preview/bootstrap deployment created the dedicated project on 2026-09-11. That bootstrap contains no live workbook credential and is not the live production dashboard.

## Production surface

The initial production surface is read-only:

- founder dashboard;
- GET-only `/api/founder` endpoint;
- deterministic workbook-derived metrics and controls;
- no ACTION_QUEUE mutation;
- no workbook writes;
- no paid AI calls from the request path;
- no external business executor.

## No-new-billing data path

The production web runtime does **not** require a new Google Cloud billing account or service account.

Data path:

`Vercel /api/founder -> token-gated Apps Script read bridge -> Founder Control Tower workbook`

The Apps Script bridge exposes only a fixed allow-list of source ranges. It returns raw range matrices only; finance, delivery, cash and stock business rules remain in portable TypeScript under `packages/domain` / `packages/data`.

The bridge uses a dedicated high-entropy Script Property named `FCT_READ_BRIDGE_TOKEN`. Vercel receives the matching value only as the server-side secret `FCT_APPS_SCRIPT_READ_TOKEN`. The browser never receives this bridge credential.

The existing clasp credential remains deployment-only and is not used by the web application request path.

## Controlled production gates

Apps Script bridge production deployment is triggered only by:

`deploy/apps-script-web`

`.github/workflows/apps-script-read-bridge-deploy.yml` runs the deterministic regression suite, pushes the reviewed Apps Script source, creates or updates the versioned web-app deployment, verifies the token-gated read contract, then pulls source back and fails on drift.

Vercel production deployment is triggered only by:

`deploy/vercel`

`.github/workflows/vercel-controlled-deploy.yml` runs the full deterministic suite, creates an isolated candidate, verifies live founder auth/read-only behavior, and promotes only a verified candidate to production.

Normal commits to `main` cannot trigger either production workflow.

## GitHub production secrets

Required repository secrets:

- `FCT_CLASP_AUTH_JSON` — existing deployment-only Apps Script credential;
- `FCT_VERCEL_TOKEN` — Vercel authorization token scoped to the dedicated project/account;
- `FCT_APPS_SCRIPT_READ_TOKEN` — server-to-server read bridge token, minimum 32 characters;
- `FCT_WEB_ACCESS_TOKEN` — founder dashboard access key, minimum 24 characters.

The same `FCT_APPS_SCRIPT_READ_TOKEN` value must also exist in Apps Script **Project Settings -> Script Properties** as `FCT_READ_BRIDGE_TOKEN`.

`config/apps-script-read-bridge.json` records the non-secret versioned deployment ID/URL after the first approved bridge deployment. The Vercel workflow refuses production if a trusted bridge URL is not registered.

No secret may be embedded in browser-delivered assets or committed to Git.

## Deployment verification

Before marking production READY, verify all of the following:

1. CI green on the exact commit deployed.
2. Apps Script bridge token gate succeeds only with the configured server secret.
3. Bridge provenance reports zero writes, zero external actions and zero AI calls.
4. Dashboard loads from the dedicated Vercel project.
5. Unauthorized `/api/founder` request fails closed.
6. POST `/api/founder` is rejected; browser-facing founder API remains GET-only.
7. Authorized request reads the live workbook successfully through the bridge.
8. Responses remain `private, no-store` / CDN `no-store`.
9. TikTok missing spend continues to block final Real Contribution and Operating Profit while that source remains missing.
10. Delivered remains distinct from Paid and courier receivable semantics remain intact.
11. UAE + Kuwait order-source parity is preserved without duplicate shipment counting.
12. Zero-demand zero-stock SKUs do not surface as false active-demand stockouts.
13. No Sheet write, approval mutation, paid AI call or external business action occurs.

Production deployment or redeployment remains founder-gated even though normal technical work is hands-off.
