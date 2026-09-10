# Contributing

## Before Changing Logic

Read `AGENTS.md` and the canonical business/governance docs.

## Required For Every Meaningful Change

1. change code/docs;
2. add/update deterministic regression tests;
3. run `npm test` where applicable;
4. update `CHANGELOG.md`;
5. update `PROJECT_STATE.md` if current status/version/blockers changed;
6. update `DECISIONS.md` if a durable architectural/governance decision changed.

## Commit Style

Examples:

- `feat(stock): add inbound evidence contract`
- `fix(governance): require approval for ad pause actions`
- `docs(state): update phase 2 migration status`
- `test(orchestrator): add cache replay regression`

Never commit secrets or raw customer PII.
