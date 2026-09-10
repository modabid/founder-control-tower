# Deployment Boundary

The Founder Control Tower web surface is read-only at this stage.

Production integration may read the founder model through the authenticated GET-only API, but it may not:

- write to Google Sheets;
- mutate ACTION_QUEUE approvals;
- execute ads, payments, courier/order changes or inventory actions;
- expose Google credentials or refresh tokens to the browser;
- reuse `FCT_CLASP_AUTH_JSON` as an application credential.

Any future write/execution path requires a separate audited implementation and founder approval.
