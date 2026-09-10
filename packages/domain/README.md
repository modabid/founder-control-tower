# Domain Package

Portable TypeScript implementations of locked Founder Control Tower business rules. This package contains no Google, model-provider, UI, database or external-action code.

## Implemented V1

- terminal delivery success: `(Delivered + Paid) / (Delivered + Paid + RRTO)`;
- Delivered vs Paid cash semantics and courier-receivable classification;
- Real Contribution blocking when any active-channel spend is missing, including the locked TikTok hard block;
- Operating Profit only after Real Contribution is complete;
- inventory velocity `max(7-day avg pickup, 14-day avg pickup)`;
- physical stock-day calculation and dynamic stock gates;
- Last Mile `>= 70%` delivery-success scale gate;
- fail-closed scale gate aggregation;
- strict rejection of invalid/negative deterministic inputs rather than silently guessing.

## Boundary

No provider/UI/database-specific code belongs here. Data adapters must supply validated deterministic inputs. AI may interpret domain outputs but must not override these calculations.
