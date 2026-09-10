# ACTION_QUEUE — Phase 2 V1 Contract

## Purpose

`ACTION_QUEUE` is the founder decision/control layer between ATLAS recommendations and any future executor.

The core lifecycle is:

`Agent recommendation -> SENTINEL/ORBIT/ATLAS -> ACTION_QUEUE -> Founder decision -> Ready state -> Executor later -> SENTINEL verification -> Complete`

V1 does **not** execute business actions.

## Existing Sheet Contract

Use the existing `ACTION_QUEUE` tab. Do not create another tab or expand the grid for V1.

Locked A:X headers:

1. `Action_ID`
2. `Created_At`
3. `Agent`
4. `Area`
5. `Priority`
6. `Recommendation`
7. `Reason`
8. `Confidence`
9. `Evidence`
10. `Expected_Impact`
11. `Risk`
12. `Owner`
13. `Approval_Status`
14. `Approved_By`
15. `Approved_At`
16. `Email_Status`
17. `Email_Sent_At`
18. `Execution_Status`
19. `Due_Date`
20. `Completed_At`
21. `Result`
22. `Source`
23. `Last_Updated`
24. `Notes`

The writer must refuse to write if these headers do not match.

## Founder Approval States

- `NOT_REQUIRED` — internal/no-external-commitment action only.
- `PENDING_FOUNDER` — governed action awaiting Abid's decision.
- `APPROVED` — founder approved; still not executed.
- `REJECTED` — founder rejected; no execution.
- `SUPERSEDED` — original action replaced by a founder-modified action.
- `PENDING_EXTERNAL_APPROVAL` — legacy/external dependency state; not equivalent to founder approval.

## Execution States

- `BLOCKED_APPROVAL` — cannot proceed until founder approval.
- `BLOCKED_EXTERNAL` — external dependency unresolved.
- `READY_INTERNAL` — internal/no-external-commitment action is eligible for a future internal worker.
- `READY` — founder approved and eligible for a future executor.
- `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED` — execution lifecycle states for later phases.

`APPROVED` or `READY` must never be interpreted as already executed.

## Queue Creation

V1 accepts final AG001 ATLAS recommendations only. It does not create separate rows from `questions_for_abid`, avoiding duplicate founder prompts.

Mapping rules:

- `approval_required=true` -> `PENDING_FOUNDER` + `BLOCKED_APPROVAL`
- `approval_required=false` -> `NOT_REQUIRED` + `READY_INTERNAL`
- source is recorded as `ATLAS:<run_id>`
- ATLAS confidence/evidence are preserved
- duplicate open recommendations for the same owner are suppressed
- terminal/rejected/superseded actions do not block a future genuinely new action

## Founder Decisions

### Approve

Changes queue state only:

`PENDING_FOUNDER -> APPROVED / READY`

No external side effect occurs.

### Reject

Changes queue state only:

`PENDING_FOUNDER -> REJECTED / CANCELLED`

No external side effect occurs.

### Modify and approve

Do not overwrite the original recommendation. The original row becomes `SUPERSEDED / CANCELLED`; a replacement row is created and marked `APPROVED / READY` with the founder modification recorded in `Notes`.

This preserves an audit trail without adding another sheet.

## Safety

V1 may:

- read the cached Phase-1 hierarchy result;
- preview queue records without writes;
- write/update the internal `ACTION_QUEUE` control sheet;
- list pending founder decisions;
- record founder approve/reject/modify decisions.

V1 may **not**:

- change ads or budgets;
- send customer/supplier/courier messages;
- make payments/refunds;
- alter orders/courier statuses;
- change inventory;
- place purchase orders;
- deploy systems;
- make bookings/purchases/commitments.

Future executors must be separate, explicitly permissioned, and continue to obey founder approval plus post-action verification.

## No-API Validation

Use `testFctPhase2ActionCoreNoApi()` for the Apps Script pure contract and the Node regression `tests/phase2/action-queue-contract.js` in CI.

Use `previewFctPhase2ActionsFromLastValidationNoWrite()` before any queue write. It reuses cached Phase-1 output and makes no paid AI call.
