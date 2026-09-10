const assert = require('assert');

const aq = require('../../apps-script/live/ActionQueue.js');
const bridge = require('../../apps-script/live/ActionQueueValidatedCacheBridge.js');

const mockResult = {
  agent_id: 'AG001',
  run_id: 'FCT-TEST-ATLAS',
  severity: 'ACT_NOW',
  confidence: 'HIGH',
  evidence_refs: ['TEST:E1'],
  recommendations: [
    {
      action: 'Request verified supplier stock facts.',
      why: 'Critical stock requires verified evidence.',
      approval_required: true,
      owner: 'Abid'
    }
  ]
};

const run = bridge.fctActionBuildValidatedAtlasBridgeRun_(
  { run_id: 'FCT-TEST-CACHE', result: mockResult },
  mockResult,
  {
    status: 'PASS',
    mode: 'ZERO_AI_CACHED_HIERARCHY_REPLAY',
    ai_calls_made: 0
  }
);

assert.strictEqual(run.ai_calls_made, 0);
assert.strictEqual(run.atlas.result.agent_id, 'AG001');
assert.strictEqual(run.atlas.result.recommendations.length, 1);

const record = aq.fctActionBuildRecord_(run.atlas.result.recommendations[0], {
  action_id: 'PREVIEW-1',
  now_iso: '2026-09-10T18:00:00.000Z',
  agent: 'ATLAS',
  area: 'Founder Decision',
  severity: run.atlas.result.severity,
  confidence: run.atlas.result.confidence,
  evidence_refs: run.atlas.result.evidence_refs,
  source: 'ATLAS:' + run.run_id
});

assert.strictEqual(record.Approval_Status, 'PENDING_FOUNDER');
assert.strictEqual(record.Execution_Status, 'BLOCKED_APPROVAL');

assert.throws(() => bridge.fctActionBuildValidatedAtlasBridgeRun_(
  { run_id: 'BAD', result: mockResult },
  mockResult,
  { status: 'PASS', ai_calls_made: 1 }
), /unexpectedly reports AI calls/);

assert.throws(() => bridge.fctActionValidateCachedAtlasRun_({
  result: { agent_id: 'AG002', recommendations: [] }
}), /agent mismatch/);

console.log('PHASE2_VALIDATED_ATLAS_CACHE_BRIDGE_PASS');
