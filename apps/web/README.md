# Founder Control Tower Web

Phase-3 read-only dashboard shell.

## Current Mode

The current `index.html` is an **offline/mock preview** that consumes the same founder read-model shape defined by `packages/data/src/founder-read-model.ts`. It intentionally does not fetch live Google data, mutate `ACTION_QUEUE`, call AI providers or execute business actions.

Open `index.html` directly to inspect the responsive founder surface. The visible banner makes mock mode explicit.

## Architecture Boundary

- Business formulas stay in `packages/domain`.
- Sheet normalization/reconciliation stays in `packages/data`.
- Authentication and GET-only response policy stay in `packages/api`.
- `apps/web/dashboard.js` performs presentation/formatting only.
- Approval/execution controls are intentionally disabled in this shell.
- No external fonts, scripts, analytics or network dependencies are loaded.

## Next Integration

A future production web layer will replace the offline fixture with the authenticated founder read API. That deployment requires a dedicated server-only Google read credential/token provider and a separate founder Yes/No production gate.
