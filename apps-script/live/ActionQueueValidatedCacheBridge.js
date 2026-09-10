/**
 * Founder Control Tower — Phase 2 validated ATLAS cache bridge
 *
 * Purpose:
 *   Adapt the Phase-1 zero-AI validation replay/cache format into the Phase-2
 *   ACTION_QUEUE input contract without changing the locked Phase-1 orchestrator.
 *
 * Safety:
 *   - reads cached Phase-1 outputs only;
 *   - makes zero OpenAI/Anthropic calls;
 *   - preview function performs no sheet writes;
 *   - queue function only delegates to the existing internal ACTION_QUEUE writer;
 *   - no business action/executor is invoked.
 */

const FCT_ACTION_VALIDATED_CACHE_BRIDGE_VERSION_ =
  '2026-09-10-AQ-CACHE-BRIDGE-V1';

const FCT_ACTION_LAST_VALIDATION_CACHE_ = Object.freeze({
  orchestrator_version: '2026-09-10-P1-FINAL-V4',
  atlas_agent_version: 'ATLAS-V3-INTEGRATED-V2-DET-REPAIR'
});

function fctActionValidateCachedAtlasRun_(cachedRun) {
  if (!cachedRun || typeof cachedRun !== 'object' || Array.isArray(cachedRun)) {
    throw new Error('Validated ATLAS cache is missing or invalid.');
  }

  const result = cachedRun.result;
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('Validated ATLAS cache does not contain a result object.');
  }

  if (result.agent_id !== 'AG001') {
    throw new Error(
      'Validated ATLAS cache agent mismatch. Expected AG001, got ' +
      String(result.agent_id || '')
    );
  }

  if (!Array.isArray(result.recommendations)) {
    throw new Error('Validated ATLAS cache recommendations are missing.');
  }

  return result;
}

function fctActionBuildValidatedAtlasBridgeRun_(cachedRun, normalizedResult, replay) {
  const result = fctActionValidateCachedAtlasRun_({
    result: normalizedResult
  });

  const guard = replay || {};
  if (guard.status && guard.status !== 'PASS') {
    throw new Error('Phase-1 cached replay guard did not PASS.');
  }
  if (Number(guard.ai_calls_made || 0) !== 0) {
    throw new Error('Phase-1 cached replay unexpectedly reports AI calls.');
  }

  return {
    run_id: String(cachedRun && cachedRun.run_id || result.run_id || ''),
    status: 'SUCCESS',
    mode: 'PHASE2_VALIDATED_ATLAS_CACHE_BRIDGE',
    bridge_version: FCT_ACTION_VALIDATED_CACHE_BRIDGE_VERSION_,
    ai_calls_made: 0,
    atlas: {
      result: result
    },
    founder_brief: result,
    replay_guard: {
      status: String(guard.status || ''),
      mode: String(guard.mode || ''),
      ai_calls_made: Number(guard.ai_calls_made || 0)
    }
  };
}

function fctActionLoadLastValidatedAtlasRunNoApi_() {
  if (typeof replayFctPhase1LastValidationCacheNoApi !== 'function') {
    throw new Error('Phase-1 cached replay function is unavailable.');
  }
  if (typeof fctP1ReadLegacyCachedRunNoFingerprint_ !== 'function') {
    throw new Error('Phase-1 legacy cache reader is unavailable.');
  }
  if (typeof fctP1NormalizeRecommendationApprovals_ !== 'function') {
    throw new Error('Phase-1 approval normalizer is unavailable.');
  }
  if (typeof fctP1AssertRecommendationApprovals_ !== 'function') {
    throw new Error('Phase-1 approval assertion is unavailable.');
  }

  // First verify that the complete cached hierarchy is coherent under the
  // current deterministic post-processing. This is a zero-AI replay.
  const replay = replayFctPhase1LastValidationCacheNoApi();

  const cachedAtlas = fctP1ReadLegacyCachedRunNoFingerprint_(
    'AG001',
    FCT_ACTION_LAST_VALIDATION_CACHE_.orchestrator_version,
    FCT_ACTION_LAST_VALIDATION_CACHE_.atlas_agent_version
  );

  const normalized = fctP1NormalizeRecommendationApprovals_(
    JSON.parse(JSON.stringify(cachedAtlas.result)),
    'AG001'
  );

  fctP1AssertRecommendationApprovals_(normalized.result);

  return fctActionBuildValidatedAtlasBridgeRun_(
    cachedAtlas,
    normalized.result,
    replay
  );
}

/**
 * ZERO-AI / ZERO-WRITE preview for the last validated Phase-1 ATLAS result.
 */
function previewFctPhase2ActionsFromLastValidatedAtlasNoWrite() {
  const run = fctActionLoadLastValidatedAtlasRunNoApi_();
  const atlas = fctActionAtlasResult_(run);
  const nowIso = fctIsoNow_();

  const actions = atlas.recommendations.map(function(rec, i) {
    return fctActionBuildRecord_(rec, {
      action_id: 'PREVIEW-' + String(i + 1),
      now_iso: nowIso,
      agent: 'ATLAS',
      area: 'Founder Decision',
      severity: atlas.severity,
      confidence: atlas.confidence,
      evidence_refs: atlas.evidence_refs,
      source: 'ATLAS:' + fctActionSourceRunId_(run, atlas),
      notes: 'Preview only; no ACTION_QUEUE write.'
    });
  });

  const out = {
    status: 'SUCCESS',
    mode: 'ZERO_AI_ZERO_WRITE_PREVIEW',
    bridge_version: FCT_ACTION_VALIDATED_CACHE_BRIDGE_VERSION_,
    source_run_id: fctActionSourceRunId_(run, atlas),
    ai_calls_made: 0,
    sheet_writes_made: 0,
    external_actions_executed: 0,
    actions: actions
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

/**
 * Internal control-plane queue write only. No external executor is invoked.
 * Do not run this function until the founder explicitly approves queue creation.
 */
function queueFctPhase2ActionsFromLastValidatedAtlasNoApi() {
  const run = fctActionLoadLastValidatedAtlasRunNoApi_();
  return fctQueuePhase2ActionsFromRun_(run);
}

function testFctPhase2ValidatedAtlasCacheBridgeNoApi() {
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

  const run = fctActionBuildValidatedAtlasBridgeRun_(
    { run_id: 'FCT-TEST-CACHE', result: mockResult },
    mockResult,
    {
      status: 'PASS',
      mode: 'ZERO_AI_CACHED_HIERARCHY_REPLAY',
      ai_calls_made: 0
    }
  );

  if (run.ai_calls_made !== 0 ||
      !run.atlas ||
      !run.atlas.result ||
      run.atlas.result.agent_id !== 'AG001' ||
      run.atlas.result.recommendations.length !== 1) {
    throw new Error('Validated ATLAS cache bridge contract failed.');
  }

  return {
    status: 'PASS',
    bridge_version: FCT_ACTION_VALIDATED_CACHE_BRIDGE_VERSION_,
    ai_calls_made: 0,
    sheet_writes_made: 0,
    external_actions_executed: 0
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FCT_ACTION_VALIDATED_CACHE_BRIDGE_VERSION_,
    FCT_ACTION_LAST_VALIDATION_CACHE_,
    fctActionValidateCachedAtlasRun_,
    fctActionBuildValidatedAtlasBridgeRun_,
    testFctPhase2ValidatedAtlasCacheBridgeNoApi
  };
}
