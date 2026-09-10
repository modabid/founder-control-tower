# Locked Business Rules

## Status Semantics

- Pending: outcome not final
- Delivered: customer received order; courier COD not yet remitted
- Paid: delivered and COD remittance received
- RRTO: final delivery failure
- Unshipped: not handed to courier

Never infer `Delivered -> Paid`.

Delivered but not Paid = **courier receivable**.

## Final Delivery Success

`(Delivered + Paid) / (Delivered + Paid + RRTO)`

Pending/transit/OFD/unshipped and other non-terminal outcomes are excluded.

## Profit Levels

### Gross Contribution

Delivered COD revenue minus delivered product cost minus delivery/fulfillment minus RRTO costs.

### Real Contribution

Gross Contribution minus all active ad-channel spend and direct variable payouts/costs.

### Operating Profit

Real Contribution minus salaries, warehouse/rent, software and other fixed OPEX.

Cash and profit are separate concepts.

## TikTok Hard Block

If TikTok is an active ad channel and its spend is missing, final Real Contribution, final Operating Profit and final SCALE go/no-go remain blocked. This is not a preference override.

## Scaling

Never scale from ROAS alone. Gates include:

- delivery-adjusted economics;
- all active ad channels;
- delivery success;
- physical stock days;
- cash control;
- data freshness.

Last Mile scale gate: finalized delivery success >= 70%.

Product-to-courier exposure must not be inferred if absent.

## Inventory

Velocity = max(7-day average pickup, 14-day average pickup).

RRTO is not available stock until physically received.

Physical available stock is authoritative for stock-day risk.

Do not invent inbound PO, ETA, MOQ, supplier lead time or reorder quantity.

Stock severity is dynamic from the current deterministic packet; never hardcode old SKU classifications.
