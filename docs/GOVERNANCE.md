# Governance

## Default Autonomy

Agents analyze, reconcile, audit and recommend. They do not autonomously make external commitments.

## Founder Approval Required

Examples include:

- pause/scale/change ads or budgets;
- send supplier/customer/courier messages;
- request external settlement/remittance evidence;
- place/recommend execution of PO/reorder/transfer/stock adjustment;
- payment/refund/money movement;
- courier/order/routing changes;
- deployment/system changes with external effect;
- bookings/purchases/commitments.

Internal data refresh/reconciliation/audit can remain approval-free when it does not create an external commitment.

## Approval Normalization

The final orchestrator deterministically normalizes recommendations so governed external actions cannot remain `approval_required=false` solely because the model phrased/classified them incorrectly.

## Ambiguity

ASK / HOLD. Do not guess missing material facts.

## Source Precedence

1. deterministic source/control data
2. current deterministic alerts/reconciliation
3. founder snapshot
4. AI interpretation

A missing/empty data-quality table must not automatically be interpreted as clean data.
