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

## Phase-2 Action Queue Gate

Founder approval and execution are separate state transitions.

`Recommend -> Queue -> Founder decision -> Ready -> Executor -> Verification -> Complete`

Rules:

- writing a recommendation into `ACTION_QUEUE` is an internal control-plane action and does not execute the recommendation;
- `APPROVED` / `READY` means permission exists for a future executor, not that the action happened;
- rejected actions become cancelled and must not execute;
- founder modification preserves the original row as `SUPERSEDED` and creates a replacement action rather than silently overwriting history;
- external/platform dependency states such as `PENDING_EXTERNAL_APPROVAL` are not a substitute for founder approval;
- future executors must re-check the current approval and action state immediately before any external side effect.

## Ambiguity

ASK / HOLD. Do not guess missing material facts.

## Source Precedence

1. deterministic source/control data
2. current deterministic alerts/reconciliation
3. founder snapshot
4. AI interpretation

A missing/empty data-quality table must not automatically be interpreted as clean data.
