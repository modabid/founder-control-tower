# Founder Web Dashboard Shell

Status: Phase 3 offline/read-only shell.

The dashboard under `apps/web/` renders the Founder Read Model contract without duplicating deterministic business rules. It is intentionally isolated from live Google credentials, AI providers, ACTION_QUEUE mutations, and business executors.

## Safety boundary

- presentation only;
- no workbook writes;
- no approval mutation;
- no external action execution;
- mock mode must be visibly identified;
- rendering failure must fail closed and must not imply a business conclusion.

## Production integration

The live web runtime must consume the authenticated GET-only Founder Read API. Google credentials must remain server-only and must not reuse the clasp deployment credential. Production deployment requires the founder deployment gate.
