# Founder Control Tower — Repository Agent Instructions

## Mission

Maintain Founder Control Tower as a migration-ready, deterministic-first operating system for founder decisions. Google Apps Script is transitional. New logic should be portable toward TypeScript + Postgres/Supabase + a web app.

## Mandatory Read Order

Before architecture or business-logic changes, read:

1. `PROJECT_STATE.md`
2. `docs/FOUNDER_CONTROL_TOWER_SPEC.md`
3. `docs/BUSINESS_RULES.md`
4. `docs/GOVERNANCE.md`
5. `docs/AGENT_REGISTRY.md`
6. `DECISIONS.md`

## Source-of-Truth Principle

Deterministic source/control data outranks AI interpretation.

Order:

1. deterministic normalized/control data;
2. deterministic alerts/reconciliation;
3. founder snapshot;
4. AI interpretation.

AI must never invent accounting values, stock facts, supplier facts, courier settlement, product-to-courier exposure, inbound PO/ETA/MOQ, or missing ad spend.

## Governance

Agents analyze/recommend by default. External action, spend, messages, payments, refunds, order/courier changes, inventory changes, ad changes, deployments, purchases or commitments require founder approval unless explicitly reclassified in the locked governance spec.

Ambiguity: **ASK / HOLD, do not guess.**

## Development Rule

Before giving the founder code to run:

- syntax-check it;
- review dependencies and function collisions;
- run no-API/local mocks first;
- validate business contracts and governance;
- test false-positive/edge cases;
- inspect side effects;
- avoid live AI tests unless deterministic tests cannot answer the question;
- do not call a build validated if the relevant checks did not pass.

## Cost Control

Avoid unnecessary OpenAI/Anthropic calls. Prefer frozen deterministic packets, fingerprints/cache, local tests and cached replay. A live hierarchy validation must not be repeated merely to verify deterministic post-processing.

## Documentation Contract

For every meaningful code or architecture change:

- update `CHANGELOG.md`;
- update `PROJECT_STATE.md` when current status/version/blockers change;
- add an entry to `DECISIONS.md` when a design/governance choice becomes durable;
- update relevant agent/business-rule docs;
- add or update regression tests.

Do not leave project state only inside chat history.

## Secrets

Never commit credentials. Script Properties and future environment/secrets stores hold credentials. `.env.example` contains names only, never values.
