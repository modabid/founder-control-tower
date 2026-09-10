function runFctPhase1SmokeTest() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    throw new Error('Another Founder Control Tower AI run is already in progress.');
  }

  const runId = fctRunId_();
  const modelsUsed = [];

  try {
    const snapshot = fctBuildCoreSnapshot_(runId);

    const sentinelRun = fctRunAgent_(
      'AG012',
      [
        'Audit the supplied Founder Control Tower snapshot before any founder decision.',
        'Check freshness/provisional flags, cash-vs-profit semantics, missing material feeds, mapping/reconciliation warnings and whether the snapshot is decision-safe.',
        'The DATA_QUALITY table may be empty; that does NOT automatically prove all data is valid.',
        'Return PASS, PASS_WITH_WARNING or FAIL with exact affected fields.'
      ].join(' '),
      snapshot,
      'STANDARD',
      runId
    );
    const sentinel = sentinelRun.result;
    modelsUsed.push(sentinelRun.runtime);

    const orbitContext = {
      core_snapshot: snapshot,
      sentinel_result: sentinel,
      phase_note: 'Initial runtime smoke test. LEDGER/SCALE/ROUTE/STOCK model outputs are not yet included; use deterministic founder snapshot and open action/alert queues only.'
    };

    const orbitRun = fctRunAgent_(
      'AG002',
      [
        'Produce a supervisor brief for ATLAS.',
        'Remove duplicate noise, respect SENTINEL audit findings, rank only material current issues and opportunities, and flag any decision that is not safe yet.',
        'Do not pretend domain agents ran in this smoke test.'
      ].join(' '),
      orbitContext,
      sentinel.audit_status === 'FAIL' ? 'DEEP' : 'STANDARD',
      runId
    );
    const orbit = orbitRun.result;
    modelsUsed.push(orbitRun.runtime);

    const atlasContext = {
      core_snapshot: snapshot,
      sentinel_result: sentinel,
      orbit_result: orbit
    };

    const atlasRun = fctRunAgent_(
      'AG001',
      [
        'Prepare Abid\'s founder decision brief from the verified supervisor pack.',
        'Focus on what changed, what is wrong, where money/risk is exposed, opportunities, and the top 3 CEO priorities.',
        'If SENTINEL says data is not decision-safe, HOLD the affected decision and ask the exact question needed.',
        'Do not execute anything.'
      ].join(' '),
      atlasContext,
      orbit.severity === 'CRITICAL' ? 'DEEP' : 'STANDARD',
      runId
    );
    const atlas = atlasRun.result;
    modelsUsed.push(atlasRun.runtime);

    let challenger = null;
    if (fctShouldChallengeAtlas_(sentinel, orbit, atlas)) {
      const challengerRun = fctRunChallenger_('AG001', atlas, atlasContext, runId);
      if (challengerRun) {
        challenger = challengerRun.result;
        modelsUsed.push(challengerRun.runtime);
      }
    }

    const brief = fctRenderFounderBrief_(snapshot, atlas, sentinel, challenger);

    const run = {
      run_id: runId,
      status: 'SUCCESS',
      as_of: snapshot.as_of,
      audit_status: sentinel.audit_status,
      sentinel: sentinel,
      orbit: orbit,
      atlas: atlas,
      challenger: challenger,
      models_used: modelsUsed,
      brief: brief,
      error: ''
    };

    fctAppendAiHistory_(run);
    fctWriteFounderBrief_(run);

    Logger.log(brief);
    return run;
  } catch (e) {
    const failure = {
      run_id: runId,
      status: 'ERROR',
      as_of: '',
      audit_status: 'FAIL',
      sentinel: {},
      orbit: {},
      atlas: {},
      models_used: modelsUsed,
      brief: '',
      error: String(e && e.stack ? e.stack : e)
    };

    try {
      fctAppendAiHistory_(failure);
    } catch (logError) {
      Logger.log('Failed to write AI error log: ' + logError);
    }

    throw e;
  } finally {
    lock.releaseLock();
  }
}

function testFctOpenAIConnection() {
  const runId = 'TEST-OAI-' + Utilities.getUuid().slice(0, 8);
  const run = fctRunAgent_(
    'AG001',
    'Connection test only. Return NORMAL severity, NOT_APPLICABLE audit status, no recommendations, no approval needed.',
    {
      run_id: runId,
      as_of: fctIsoNow_(),
      deterministic_truth: { test: 'OPENAI_CONNECTION_OK_IF_YOU_CAN_READ_THIS' }
    },
    'STANDARD',
    runId
  );
  Logger.log(JSON.stringify(run, null, 2));
  return run;
}

function testFctAnthropicConnection() {
  const runId = 'TEST-ANT-' + Utilities.getUuid().slice(0, 8);
  const run = fctRunAgent_(
    'AG012',
    'Connection test only. Return NORMAL severity, PASS audit status, no recommendations, no approval needed.',
    {
      run_id: runId,
      as_of: fctIsoNow_(),
      deterministic_truth: { test: 'ANTHROPIC_CONNECTION_OK_IF_YOU_CAN_READ_THIS' }
    },
    'STANDARD',
    runId
  );
  Logger.log(JSON.stringify(run, null, 2));
  return run;
}

function testFctPhase1NoApi() {
  const setup = checkFctAiSetup();
  const config = testFctRuntimeConfig();
  const snapshot = testFctSnapshot();
  fctEnsureAiHistoryHeaders_();

  const result = {
    setup: setup,
    phase1_agents: config.map(function(x) { return x.id + ':' + x.playbook; }),
    snapshot_as_of: snapshot.as_of,
    founder_snapshot_rows: snapshot.deterministic_truth.founder_snapshot.length,
    open_actions: snapshot.deterministic_truth.action_queue_open.length,
    open_alerts_in_payload: snapshot.deterministic_truth.alerts_open_top.length,
    open_data_quality_rows: snapshot.deterministic_truth.data_quality_open.length,
    history_headers_ready: true
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
