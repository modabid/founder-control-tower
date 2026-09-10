const assert = require('assert');
const aq = require('../../apps-script/live/ActionQueue.js');

const now = '2026-09-10T17:00:00.000Z';

const governed = aq.fctActionBuildRecord_({
  action: 'Change an external business setting.',
  why: 'Test governed action.',
  approval_required: true,
  owner: 'Abid'
}, {
  action_id: 'ACT-T-001',
  now_iso: now,
  severity: 'ACT_NOW',
  confidence: 'HIGH',
  source: 'ATLAS:TEST'
});

assert.equal(governed.Approval_Status, 'PENDING_FOUNDER');
assert.equal(governed.Execution_Status, 'BLOCKED_APPROVAL');

const approved = aq.fctActionApplyDecision_(
  governed,
  'APPROVE',
  'Abid',
  now,
  'ok'
);
assert.equal(approved.Approval_Status, 'APPROVED');
assert.equal(approved.Execution_Status, 'READY');
assert.equal(approved.Result, '');
assert.match(approved.Notes, /nothing executed/i);

assert.throws(
  () => aq.fctActionApplyDecision_(approved, 'APPROVE', 'Abid', now, ''),
  /not awaiting founder approval/
);

const externalDependency = Object.assign({}, governed, {
  Approval_Status: 'PENDING_EXTERNAL_APPROVAL',
  Execution_Status: 'BLOCKED_EXTERNAL'
});
assert.throws(
  () => aq.fctActionApplyDecision_(externalDependency, 'APPROVE', 'Abid', now, ''),
  /not awaiting founder approval/
);

const rejected = aq.fctActionApplyDecision_(
  governed,
  'REJECT',
  'Abid',
  now,
  'Do not proceed.'
);
assert.equal(rejected.Approval_Status, 'REJECTED');
assert.equal(rejected.Execution_Status, 'CANCELLED');
assert.match(rejected.Result, /Rejected by Abid/);
assert.equal(rejected.Approved_By, '');

const modified = aq.fctActionModifyAndApprove_(
  governed,
  'Use a narrower approved scope.',
  'Abid',
  now,
  'ACT-T-002',
  'scope reduced'
);
assert.equal(modified.superseded.Approval_Status, 'SUPERSEDED');
assert.equal(modified.superseded.Execution_Status, 'CANCELLED');
assert.equal(modified.replacement.Approval_Status, 'APPROVED');
assert.equal(modified.replacement.Execution_Status, 'READY');
assert.match(modified.replacement.Notes, /nothing executed/i);

const internal = aq.fctActionBuildRecord_({
  action: 'Refresh internal source.',
  why: 'Read-only.',
  approval_required: false,
  owner: 'ROUTE'
}, {
  action_id: 'ACT-T-003',
  now_iso: now,
  severity: 'WATCH',
  confidence: 'HIGH',
  source: 'ATLAS:TEST'
});
assert.equal(internal.Approval_Status, 'NOT_REQUIRED');
assert.equal(internal.Execution_Status, 'READY_INTERNAL');

assert(aq.fctActionIsDuplicateOpen_(
  governed,
  Object.assign({}, governed, {
    Recommendation: ' CHANGE   AN EXTERNAL BUSINESS SETTING. '
  })
));

assert(!aq.fctActionIsDuplicateOpen_(
  Object.assign({}, governed, {
    Approval_Status: 'REJECTED',
    Execution_Status: 'CANCELLED'
  }),
  governed
));

assert(aq.fctActionHeadersMatch_(aq.FCT_ACTION_HEADERS_.slice()));
assert(!aq.fctActionHeadersMatch_(aq.FCT_ACTION_HEADERS_.slice(0, 23)));
assert.equal(aq.fctActionRecordToRow_(governed).length, 24);

assert.deepEqual(aq.testFctPhase2ActionCoreNoApi(), {
  status: 'PASS',
  queue_version: '2026-09-10-AQ-V1',
  external_actions_executed: 0
});

console.log('PHASE2_ACTION_QUEUE_CONTRACT_PASS');
