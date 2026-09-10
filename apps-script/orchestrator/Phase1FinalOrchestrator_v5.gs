/**
 * Founder Control Tower — Phase-1 Final Cost-Optimized Orchestrator
 *
 * LIVE PATH (one bounded hierarchy run):
 *   AG003 LEDGER
 *   AG004 SCALE
 *   AG005 ROUTE
 *   AG006 STOCK
 *       -> AG012 SENTINEL
 *       -> AG002 ORBIT
 *       -> AG001 ATLAS
 *
 * Cost controls:
 *   - deterministic compact packets before AI
 *   - per-agent fingerprint cache in Script Properties
 *   - unchanged agent inputs reuse prior validated AI brief
 *   - no duplicate SENTINEL/ORBIT/ATLAS calls inside hierarchy
 *   - production cold run: maximum 7 normal logical AI calls + 1 SENTINEL recovery retry
 *   - final hierarchy validation: 3 normal logical AI calls + 1 SENTINEL recovery retry
 *   - source drift aborts the hierarchy instead of blindly rerunning agents
 *
 * Safety:
 *   - recommendation / audit / founder-brief only
 *   - no sheet writes
 *   - no ads/orders/courier/inventory/payment execution
 *   - no external communication
 */

const FCT_P1_ORCH_VERSION_ = '2026-09-10-P1-FINAL-V5';
const FCT_P1_MAX_LOGICAL_AI_CALLS_ = 8;
const FCT_P1_VALIDATION_MAX_LOGICAL_AI_CALLS_ = 4;
const FCT_P1_CACHE_PREFIX_ = 'FCT_P1_AI_CACHE_';
const FCT_P1_CACHE_CHUNK_SIZE_ = 6500;
const FCT_P1_CACHE_MAX_CHUNKS_ = 6;


/**
 * FINAL LIVE function.
 * Do not use for code testing. Use inspect/test no-API functions first.
 */
function runFctPhase1FinalLive() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error(
      'Another Founder Control Tower Phase-1 run is already in progress.'
    );
  }

  const state = {
    logical_ai_calls: 0,
    logical_ai_call_budget:
      FCT_P1_MAX_LOGICAL_AI_CALLS_,
    executed_agents: [],
    reused_agents: [],
    cache_write_skips: [],
    started_at: new Date().toISOString()
  };

  try {
    // Freeze deterministic source truth once at run start.
    // Every specialist and hierarchy layer uses this same source cut.
    const frozen = fctP1BuildSourceBundle_();

    const specialists = {};
    ['AG003', 'AG004', 'AG005', 'AG006']
      .forEach(function(agentId) {
        specialists[agentId] =
          fctP1GetOrRunSpecialist_(
            agentId,
            frozen.snapshots[agentId],
            state
          );
      });

    const sentinelBase =
      fctP1BuildFrozenSentinelPacket_(frozen.snapshots);

    const sentinelRun =
      fctP1GetOrRunIntegratedSentinel_(
        sentinelBase,
        specialists,
        state
      );

    const orbitRun =
      fctP1GetOrRunIntegratedOrbit_(
        sentinelRun,
        sentinelBase,
        specialists,
        state
      );

    const atlasRun =
      fctP1GetOrRunIntegratedAtlas_(
        orbitRun,
        sentinelBase,
        state
      );

    const output = {
      run_id: 'P1-' + fctRunId_(),
      status: 'SUCCESS',
      phase: 'PHASE_1_FINAL',
      orchestrator_version: FCT_P1_ORCH_VERSION_,
      source_snapshot_mode: 'FROZEN_AT_RUN_START',
      source_snapshot_generated_at: sentinelBase.generated_at,
      logical_ai_calls_made: state.logical_ai_calls,
      logical_ai_call_budget: FCT_P1_MAX_LOGICAL_AI_CALLS_,
      executed_agents: state.executed_agents,
      reused_agents: state.reused_agents,
      cache_write_skips: state.cache_write_skips,
      specialist_runs: {
        AG003: fctP1CompactRunForOutput_(specialists.AG003),
        AG004: fctP1CompactRunForOutput_(specialists.AG004),
        AG005: fctP1CompactRunForOutput_(specialists.AG005),
        AG006: fctP1CompactRunForOutput_(specialists.AG006)
      },
      sentinel: fctP1CompactRunForOutput_(sentinelRun),
      orbit: fctP1CompactRunForOutput_(orbitRun),
      atlas: atlasRun,
      founder_brief: atlasRun.result
    };

    Logger.log(JSON.stringify(output, null, 2));
    return output;

  } finally {
    lock.releaseLock();
  }
}


/**
 * FINAL PHASE-1 VALIDATION LIVE PATH — COST OPTIMIZED.
 *
 * Purpose:
 *   Validate the hierarchy after the four specialist agents have already
 *   been individually live-tested and locked.
 *
 * Paid AI calls:
 *   AG012 SENTINEL -> AG002 ORBIT -> AG001 ATLAS
 *   Normal cold validation: 3 logical AI calls.
 *   Maximum with one SENTINEL structured-output recovery: 4.
 *
 * IMPORTANT:
 *   AG003/AG004/AG005/AG006 are NOT rerun here. Instead, current deterministic
 *   snapshots are converted into clearly-labelled validation proxies. These
 *   proxies are never represented as fresh specialist AI runs and cannot share
 *   a fingerprint with production AI specialist briefs.
 */
function runFctPhase1FinalValidationLive() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error(
      'Another Founder Control Tower Phase-1 run is already in progress.'
    );
  }

  const state = {
    logical_ai_calls: 0,
    logical_ai_call_budget:
      FCT_P1_VALIDATION_MAX_LOGICAL_AI_CALLS_,
    executed_agents: [],
    reused_agents: [],
    cache_write_skips: [],
    validation_mode: true,
    started_at: new Date().toISOString()
  };

  try {
    const frozen = fctP1BuildSourceBundle_();

    const specialists =
      fctP1BuildDeterministicValidationSpecialists_(
        frozen.snapshots
      );

    const sentinelBase =
      fctP1BuildFrozenSentinelPacket_(
        frozen.snapshots
      );

    const sentinelRun =
      fctP1GetOrRunIntegratedSentinel_(
        sentinelBase,
        specialists,
        state
      );

    const orbitRun =
      fctP1GetOrRunIntegratedOrbit_(
        sentinelRun,
        sentinelBase,
        specialists,
        state
      );

    const atlasRun =
      fctP1GetOrRunIntegratedAtlas_(
        orbitRun,
        sentinelBase,
        state
      );

    const output = {
      run_id: 'P1V-' + fctRunId_(),
      status: 'SUCCESS',
      phase: 'PHASE_1_FINAL_VALIDATION',
      validation_mode:
        'HIERARCHY_ONLY_WITH_DETERMINISTIC_SPECIALIST_PROXIES',
      orchestrator_version:
        FCT_P1_ORCH_VERSION_,
      source_snapshot_mode:
        'FROZEN_AT_RUN_START',
      source_snapshot_generated_at:
        sentinelBase.generated_at,
      specialist_ai_calls_made: 0,
      specialist_validation_status:
        'PREVIOUSLY_LIVE_TESTED_AND_LOCKED',
      logical_ai_calls_made:
        state.logical_ai_calls,
      logical_ai_call_budget:
        state.logical_ai_call_budget,
      executed_agents:
        state.executed_agents,
      reused_agents:
        state.reused_agents,
      cache_write_skips:
        state.cache_write_skips,
      specialist_brief_sources:
        fctP1ValidationBriefSources_(specialists),
      sentinel:
        fctP1CompactRunForOutput_(sentinelRun),
      orbit:
        fctP1CompactRunForOutput_(orbitRun),
      atlas: atlasRun,
      founder_brief: atlasRun.result
    };

    if (state.logical_ai_calls >
        FCT_P1_VALIDATION_MAX_LOGICAL_AI_CALLS_) {
      throw new Error(
        'Phase-1 validation cost contract failed: logical AI calls exceeded validation budget.'
      );
    }

    Logger.log(JSON.stringify(output, null, 2));
    return output;

  } finally {
    lock.releaseLock();
  }
}


/**
 * ZERO-AI validation-mode preflight.
 */
function inspectFctPhase1FinalValidationPlanNoApi() {
  const bundle = fctP1BuildSourceBundle_();
  const out =
    fctP1BuildValidationPlanFromBundle_(bundle);

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}


function fctP1BuildValidationPlanFromBundle_(bundle) {
  const specialists =
    fctP1BuildDeterministicValidationSpecialists_(
      bundle.snapshots
    );

  return {
    status: 'NO_API_VALIDATION_PREFLIGHT',
    orchestrator_version:
      FCT_P1_ORCH_VERSION_,
    source_snapshot_mode:
      'FROZEN_AT_RUN_START',
    specialist_ai_calls_if_run_now: 0,
    specialist_brief_sources:
      fctP1ValidationBriefSources_(specialists),
    hierarchy_calls_normal_cold: 3,
    sentinel_recovery_extra_call_max: 1,
    estimated_max_logical_ai_calls_this_validation: 4,
    hard_validation_logical_ai_call_budget:
      FCT_P1_VALIDATION_MAX_LOGICAL_AI_CALLS_,
    note:
      'Zero AI calls made. Final validation intentionally does not rerun the four already-locked specialist agents.'
  };
}


/**
 * ZERO-AI validation-mode contract test against current deterministic builders.
 */
function testFctPhase1FinalValidationNoApi() {
  const bundle = fctP1BuildSourceBundle_();
  const specialists =
    fctP1BuildDeterministicValidationSpecialists_(
      bundle.snapshots
    );

  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      const run = specialists[agentId];

      if (!run ||
          run.agent_id !== agentId ||
          run.brief_source !==
            'DETERMINISTIC_VALIDATION_PROXY') {
        throw new Error(
          'Phase-1 validation proxy contract failed for ' +
          agentId + '.'
        );
      }

      if (!run.source_fingerprint) {
        throw new Error(
          'Phase-1 validation proxy missing stable source fingerprint for ' +
          agentId + '.'
        );
      }
    });

  const stock = bundle.snapshots.AG006;
  const critical =
    fctP1StockKeys_(stock.critical_stock || []);
  const watch =
    fctP1StockKeys_(stock.watch_stock || []);

  critical.forEach(function(k) {
    if (watch.indexOf(k) >= 0) {
      throw new Error(
        'Phase-1 validation stock contract failed: same market+SKU is both CRITICAL and WATCH: ' +
        k
      );
    }
  });

  const plan =
    fctP1BuildValidationPlanFromBundle_(bundle);

  // Zero-cost regression for the exact production failure where AI omitted
  // one deterministic critical stock row. This must auto-repair rather than
  // force another paid AI retry.
  testFctPhase1DeterministicStockRepairNoApi();

  // Zero-cost regression for the exact successful live-run governance
  // issue where "Suspend ad scaling..." was incorrectly approval=false.
  testFctPhase1ApprovalNormalizationNoApi();

  if (plan.specialist_ai_calls_if_run_now !== 0 ||
      plan.estimated_max_logical_ai_calls_this_validation !== 4) {
    throw new Error(
      'Phase-1 validation cost plan contract failed.'
    );
  }

  Logger.log(
    'PHASE1_FINAL_VALIDATION_NO_API_PASS'
  );

  return {
    status: 'PASS',
    critical_stock_keys: critical,
    watch_stock_keys: watch,
    plan: plan
  };
}


/**
 * ZERO-AI preflight.
 * Reads deterministic sources and existing cache only.
 */
function inspectFctPhase1FinalPlanNoApi() {
  const bundle = fctP1BuildSourceBundle_();
  const out = fctP1BuildPlanFromBundle_(bundle);
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}


function fctP1BuildPlanFromBundle_(bundle) {
  const specialistPlan = {};
  let specialistMisses = 0;

  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      const snapshot = bundle.snapshots[agentId];
      const compact = fctP1CompactSpecialistSnapshot_(
        agentId,
        snapshot
      );
      const fingerprint = fctP1Fingerprint_(
        fctP1AgentVersion_(agentId),
        compact
      );
      const cached = fctP1CacheRead_(agentId, fingerprint);

      specialistPlan[agentId] = {
        cache_hit: !!cached,
        fingerprint: fingerprint,
        data_quality_status:
          snapshot && snapshot.data_quality
            ? snapshot.data_quality.status
            : null
      };

      if (!cached) specialistMisses++;
    });

  return {
    status: 'NO_API_PREFLIGHT',
    orchestrator_version: FCT_P1_ORCH_VERSION_,
    source_snapshot_mode: 'FROZEN_AT_RUN_START',
    specialist_plan: specialistPlan,
    specialist_ai_calls_if_run_now: specialistMisses,
    hierarchy_calls_max_after_specialists: 3,
    sentinel_recovery_extra_call_max: 1,
    estimated_max_logical_ai_calls_this_run:
      specialistMisses + 4,
    hard_logical_ai_call_budget:
      FCT_P1_MAX_LOGICAL_AI_CALLS_,
    note:
      'This function made zero AI calls. Hierarchy cache hits can reduce the actual count further.'
  };
}


/**
 * ZERO-AI contract test using current deterministic source builders.
 */
function testFctPhase1FinalOrchestratorNoApi() {
  const bundle = fctP1BuildSourceBundle_();

  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      const s = bundle.snapshots[agentId];
      if (!s || s.agent_id !== agentId) {
        throw new Error(
          'Phase-1 orchestrator source contract failed for ' + agentId + '.'
        );
      }
    });

  // Current STOCK classification must be entirely packet-driven.
  const stock = bundle.snapshots.AG006;
  const critical = fctP1StockKeys_(stock.critical_stock || []);
  const watch = fctP1StockKeys_(stock.watch_stock || []);

  critical.forEach(function(k) {
    if (watch.indexOf(k) >= 0) {
      throw new Error(
        'Phase-1 orchestrator stock contract failed: same market+SKU is both CRITICAL and WATCH: ' + k
      );
    }
  });

  const plan = fctP1BuildPlanFromBundle_(bundle);

  if (plan.estimated_max_logical_ai_calls_this_run >
      FCT_P1_MAX_LOGICAL_AI_CALLS_) {
    throw new Error(
      'Phase-1 orchestrator cost contract failed: estimated logical AI calls exceed hard budget.'
    );
  }

  Logger.log('PHASE1_FINAL_ORCHESTRATOR_NO_API_PASS');
  return {
    status: 'PASS',
    critical_stock_keys: critical,
    watch_stock_keys: watch,
    plan: plan
  };
}


// -----------------------------------------------------------------------------
// COST-OPTIMIZED FINAL VALIDATION SPECIALIST PROXIES
// -----------------------------------------------------------------------------

function fctP1BuildDeterministicValidationSpecialists_(snapshots) {
  const out = {};

  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      out[agentId] =
        fctP1BuildDeterministicValidationSpecialist_(
          agentId,
          snapshots[agentId]
        );
    });

  return out;
}


function fctP1BuildDeterministicValidationSpecialist_(
  agentId,
  snapshot
) {
  const compact =
    fctP1CompactSpecialistSnapshot_(
      agentId,
      snapshot
    );

  const fingerprint = fctP1Fingerprint_(
    'VALIDATION-PROXY-' +
      fctP1AgentVersion_(agentId),
    compact
  );

  const dqStatus =
    snapshot && snapshot.data_quality
      ? String(snapshot.data_quality.status || '')
          .toUpperCase()
      : 'REVIEW';

  const severity =
    dqStatus === 'FAIL'
      ? 'ACT_NOW'
      : (dqStatus === 'REVIEW'
          ? 'WATCH'
          : 'NORMAL');

  const result =
    fctP1BuildValidationProxyResult_(
      agentId,
      snapshot,
      severity,
      fingerprint
    );

  return {
    run_id:
      'VALIDATION-' + agentId + '-' + fingerprint,
    status: 'SUCCESS',
    agent_id: agentId,
    snapshot_status: dqStatus,
    source_fingerprint: fingerprint,
    brief_source:
      'DETERMINISTIC_VALIDATION_PROXY',
    runtime: {
      provider: 'none',
      model: 'deterministic-proxy',
      effort: 'none',
      failed_over: false,
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0
      }
    },
    result: result
  };
}


function fctP1BuildValidationProxyResult_(
  agentId,
  s,
  severity,
  fingerprint
) {
  s = s || {};
  const today =
    (s.period &&
      (s.period.today ||
       s.period.as_of_date ||
       s.period.current_date)) ||
    '';

  const base = {
    run_id:
      'VALIDATION-' + agentId + '-' + fingerprint,
    agent_id: agentId,
    as_of: today,
    source_freshness: 'DETERMINISTIC_CURRENT_SNAPSHOT',
    audit_status:
      severity === 'NORMAL'
        ? 'PASS'
        : (severity === 'WATCH'
            ? 'PASS_WITH_WARNING'
            : 'FAIL'),
    severity: severity,
    findings: [],
    evidence_refs: [
      'current_deterministic_snapshot'
    ],
    recommendations: [],
    approval_required: false,
    questions_for_abid: [],
    confidence: 'HIGH',
    provisional_fields: [],
    next_check:
      'Validation proxy only; use the deterministic snapshot as source truth.'
  };

  if (agentId === 'AG003') {
    const e = s.economics || {};
    base.summary = [
      'DETERMINISTIC VALIDATION PROXY — LEDGER.',
      'Real Contribution=' +
        String(e.real_contribution_status || 'UNKNOWN') + '.',
      'Operating Profit=' +
        String(e.real_operating_profit_status || 'UNKNOWN') + '.',
      'Courier receivable AED ' +
        String(e.courier_receivable_aed || 0) + '.',
      'Meta AED ' +
        String(e.meta_platform_spend_aed || 0) + '.'
    ].join(' ');

    base.findings = [{
      title: 'Deterministic finance gate',
      detail:
        'Profit/cash status is taken directly from the current LEDGER snapshot; no specialist AI inference was rerun for this validation.',
      severity: severity,
      evidence_refs: [
        'ledger_snapshot.economics'
      ]
    }];
  }

  if (agentId === 'AG004') {
    const tiktok =
      ((s.channel_completeness || {}).tiktok) || {};

    base.summary = [
      'DETERMINISTIC VALIDATION PROXY — SCALE.',
      'TikTok status=' +
        String(tiktok.status || 'UNKNOWN') + '.',
      'Current scale gates remain deterministic and no final go/no-go is created by this proxy.'
    ].join(' ');

    base.findings = [{
      title: 'Deterministic scale gate',
      detail:
        'Current SCALE channel completeness, stock and courier gates are passed to SENTINEL without rerunning AG004 AI.',
      severity: severity,
      evidence_refs: [
        'scale_snapshot.channel_completeness'
      ]
    }];
  }

  if (agentId === 'AG005') {
    const lastMile =
      (s.live_courier_view || []).find(function(x) {
        return String((x && x.courier) || '')
          .toLowerCase() === 'last mile';
      }) || {};

    base.summary = [
      'DETERMINISTIC VALIDATION PROXY — ROUTE.',
      'Last Mile success=' +
        String(lastMile.finalized_success) + '.',
      'freshness=' +
        String(lastMile.freshness_status || 'UNKNOWN') + '.',
      'Settlement cohorts remain separate.'
    ].join(' ');

    base.findings = [{
      title: 'Deterministic logistics gate',
      detail:
        'Current ROUTE live/normalized/settlement statuses are supplied directly; no AG005 AI rerun occurred.',
      severity: severity,
      evidence_refs: [
        'route_snapshot.live_courier_view'
      ]
    }];
  }

  if (agentId === 'AG006') {
    const critical =
      fctP1StockKeys_(s.critical_stock || []);
    const watch =
      fctP1StockKeys_(s.watch_stock || []);

    base.summary = [
      'DETERMINISTIC VALIDATION PROXY — STOCK.',
      'Critical=' +
        (critical.length ? critical.join(', ') : 'none') + '.',
      'Watch=' +
        (watch.length ? watch.join(', ') : 'none') + '.',
      'No prior SKU classification is reused.'
    ].join(' ');

    base.findings = [{
      title: 'Current deterministic stock classification',
      detail:
        'CRITICAL: ' +
        (critical.length ? critical.join(', ') : 'none') +
        '. WATCH: ' +
        (watch.length ? watch.join(', ') : 'none') + '.',
      severity:
        critical.length ? 'ACT_NOW' : severity,
      evidence_refs: [
        'stock_snapshot.critical_stock',
        'stock_snapshot.watch_stock'
      ]
    }];
  }

  return base;
}


function fctP1ValidationBriefSources_(specialists) {
  const out = {};

  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      const r = specialists[agentId];
      out[agentId] = r
        ? r.brief_source
        : null;
    });

  return out;
}


// -----------------------------------------------------------------------------
// SPECIALIST STAGE
// -----------------------------------------------------------------------------

function fctP1GetOrRunSpecialist_(agentId, snapshot, state) {
  const compact = fctP1CompactSpecialistSnapshot_(agentId, snapshot);
  const fingerprint = fctP1Fingerprint_(
    fctP1AgentVersion_(agentId),
    compact
  );

  const cached = fctP1CacheRead_(agentId, fingerprint);
  if (cached) {
    state.reused_agents.push(agentId);
    return fctP1RestoreCachedRun_(agentId, cached);
  }

  const runId = fctRunId_();
  const aiRun = fctP1CallAgent_(
    agentId,
    fctP1SpecialistTask_(agentId),
    fctP1SpecialistContext_(agentId, compact),
    'STANDARD',
    runId,
    state
  );

  fctP1AssertAIResult_(agentId, aiRun);

  const compactResult =
    fctP1CompactAgentResult_(aiRun.result);

  fctP1AssertSpecialistResult_(
    agentId,
    snapshot,
    compactResult
  );

  const run = {
    run_id: runId,
    status: 'SUCCESS',
    agent_id: agentId,
    snapshot_status:
      snapshot && snapshot.data_quality
        ? snapshot.data_quality.status
        : null,
    source_fingerprint: fingerprint,
    runtime: fctP1CompactRuntime_(aiRun.runtime),
    result: compactResult
  };

  fctP1TryCacheRun_(
    agentId,
    fingerprint,
    run,
    state
  );

  return run;
}


function fctP1SpecialistTask_(agentId) {
  const common = [
    'Use the supplied deterministic specialist snapshot as authoritative source truth.',
    'Do not recalculate or replace deterministic values with model estimates.',
    'If evidence is missing, HOLD the affected conclusion and name the missing evidence.',
    'Maximum 4 findings and maximum 3 recommendations.',
    'Do not execute or imply execution.',
    'External contact, system/business change, spend, payment, stock, courier, order or ad action requires approval_required=true.',
    'Internal reconciliation, evidence review and analysis may use approval_required=false.',
    'Keep output compact: summary <=80 words; finding detail <=45 words; recommendation why <=35 words.'
  ];

  const byAgent = {
    AG003: [
      'Act as AG003 LEDGER, Finance & Cash specialist.',
      'Separate profit from cash. Paid means COD remittance received; Delivered does not imply Paid.',
      'Missing TikTok spend hard-blocks final Real Contribution and Operating Profit. Never invent either metric.',
      'C3X matched settlement stays matched. TFM/OTO review differences are not confirmed losses without settlement evidence.',
      'Do not mix P&L cutoff with calendar fixed-cost accrual cutoff.'
    ],
    AG004: [
      'Act as AG004 SCALE, Ads & Growth specialist.',
      'Never scale from ROAS alone.',
      'Missing TikTok active-channel spend blocks every FINAL scale decision.',
      'Meta performance metrics absent from the source are unavailable, not zero.',
      'Respect per-product stock/mapping gates and low finalized sample confidence.',
      'Courier gates are contextual unless product-to-courier exposure is proven.'
    ],
    AG005: [
      'Act as AG005 ROUTE, Logistics & Courier specialist.',
      'Use terminal-only delivery success: (Delivered + Paid)/(Delivered + Paid + RRTO).',
      'Keep live operational, normalized orders, financial courier, and settlement cohorts separate.',
      'If Last Mile is stale, preserve the stale qualifier while retaining the operating risk.',
      'TFM/OTO screening differences are not confirmed shortages without settlement evidence.',
      'OTE Kuwait and OTO UAE are distinct couriers.'
    ],
    AG006: [
      'Act as AG006 STOCK, Inventory specialist.',
      'Physical available stock is authoritative; RRTO is unavailable until physically received.',
      'Velocity is max(7-day average pickup, 14-day average pickup).',
      'Use critical_stock and watch_stock exactly as supplied for the current run. Never use prior-run SKU classifications.',
      'Rows in critical_stock remain critical/out-of-stock; rows in watch_stock remain WATCH and must not be promoted because of an older brief.',
      'Market-specific Meta activity requires known_market_meta_spend_aed > 0 for that exact country+SKU.',
      'Do not infer open PO, ETA, MOQ, lead time, inbound quantity or reorder quantity.'
    ]
  };

  return (byAgent[agentId] || [])
    .concat(common)
    .join(' ');
}


function fctP1SpecialistContext_(agentId, compact) {
  const keyMap = {
    AG003: 'ledger_snapshot',
    AG004: 'scale_snapshot',
    AG005: 'route_snapshot',
    AG006: 'stock_snapshot'
  };

  const out = {
    governance: {
      mode: 'RECOMMENDATION_ONLY',
      may_execute: false,
      final_authority: 'Abid',
      source_precedence: [
        'DETERMINISTIC_SOURCE_AND_CONTROL_DATA',
        'CURRENT_ALERTS_AND_RECONCILIATION_STATUS',
        'AI_INTERPRETATION'
      ]
    },
    phase_note:
      'Final Phase-1 cost-optimized specialist pass. Compact deterministic packet only.'
  };

  out[keyMap[agentId]] = compact;
  return out;
}


function fctP1CompactSpecialistSnapshot_(agentId, s) {
  s = s || {};

  if (agentId === 'AG003') {
    return {
      agent_id: s.agent_id,
      period: s.period,
      economics: s.economics,
      fixed_costs: {
        payroll: s.fixed_costs && s.fixed_costs.payroll,
        opex: s.fixed_costs && s.fixed_costs.opex,
        subscriptions: s.fixed_costs && s.fixed_costs.subscriptions
      },
      cash_reconciliation: s.cash_reconciliation,
      data_quality: fctP1CompactDQ_(s.data_quality, 10),
      current_finance_actions:
        (s.current_finance_actions || []).slice(0, 6)
    };
  }

  if (agentId === 'AG004') {
    return {
      agent_id: s.agent_id,
      period: s.period,
      channel_completeness: s.channel_completeness,
      meta: {
        platform_spend_aed: s.meta && s.meta.platform_spend_aed,
        performance_metrics_status:
          s.meta && s.meta.performance_metrics_status,
        product_pnl_meta_spend_aed:
          s.meta && s.meta.product_pnl_meta_spend_aed,
        meta_not_represented_in_product_pnl_aed:
          s.meta && s.meta.meta_not_represented_in_product_pnl_aed,
        product_spend:
          ((s.meta && s.meta.product_spend) || []).slice(0, 15)
      },
      provisional_product_rankings: {
        positive_after_meta:
          (((s.provisional_product_rankings || {})
            .positive_after_meta) || []).slice(0, 8),
        negative_after_meta:
          (((s.provisional_product_rankings || {})
            .negative_after_meta) || []).slice(0, 6)
      },
      courier_scale_gates:
        (s.courier_scale_gates || []).slice(0, 10),
      data_quality: fctP1CompactDQ_(s.data_quality, 12)
    };
  }

  if (agentId === 'AG005') {
    return {
      agent_id: s.agent_id,
      period: s.period,
      normalized_order_view: s.normalized_order_view,
      live_courier_view: s.live_courier_view,
      sheet_financial_courier_view:
        s.sheet_financial_courier_view,
      settlement_reconciliation:
        s.settlement_reconciliation,
      data_quality: fctP1CompactDQ_(s.data_quality, 14),
      current_logistics_actions:
        (s.current_logistics_actions || []).slice(0, 6)
    };
  }

  if (agentId === 'AG006') {
    return {
      agent_id: s.agent_id,
      period: s.period,
      inventory_summary: s.inventory_summary,
      critical_stock:
        (s.critical_stock || []).slice(0, 12),
      watch_stock:
        (s.watch_stock || []).slice(0, 12),
      reconciliation_exceptions:
        (s.reconciliation_exceptions || []).slice(0, 12),
      inbound_visibility: s.inbound_visibility,
      meta_market_attribution:
        s.meta_market_attribution,
      data_quality: fctP1CompactDQ_(s.data_quality, 12)
    };
  }

  throw new Error('Unsupported Phase-1 specialist: ' + agentId);
}


function fctP1AssertSpecialistResult_(agentId, snapshot, result) {
  if (!result || result.agent_id !== agentId) {
    throw new Error(
      'Phase-1 specialist result contract failed for ' + agentId + '.'
    );
  }

  const sev = String(result.severity || '').toUpperCase();
  if (/WATCH|ACT_NOW|CRITICAL/.test(sev) &&
      (!Array.isArray(result.findings) || !result.findings.length)) {
    throw new Error(
      'Phase-1 specialist result contract failed: material severity without findings for ' + agentId + '.'
    );
  }

  if ((result.findings || []).length > 4 ||
      (result.recommendations || []).length > 3) {
    throw new Error(
      'Phase-1 specialist output exceeded bounded structure for ' + agentId + '.'
    );
  }

  if (agentId === 'AG006') {
    fctP1AssertStockCriticalCoverage_(
      snapshot.critical_stock || [],
      result
    );
  }

  return true;
}


// -----------------------------------------------------------------------------
// INTEGRATED SENTINEL -> ORBIT -> ATLAS
// -----------------------------------------------------------------------------

function fctP1AllValidationProxies_(specialists) {
  return ['AG003', 'AG004', 'AG005', 'AG006']
    .every(function(agentId) {
      const r = specialists && specialists[agentId];
      return !!r &&
        r.brief_source ===
          'DETERMINISTIC_VALIDATION_PROXY';
    });
}


function fctP1GetOrRunIntegratedSentinel_(basePacket, specialists, state) {
  const specialistBriefs = fctP1SpecialistBriefs_(specialists);
  const normalContext = fctP1EmbeddedSentinelBuildAIContext_(basePacket, false);
  normalContext.specialist_briefs = specialistBriefs;
  const validationProxyMode =
    fctP1AllValidationProxies_(specialists);

  normalContext.phase_note =
    validationProxyMode
      ? 'Cost-optimized final hierarchy validation. All four specialist briefs are DETERMINISTIC_VALIDATION_PROXY summaries because those agents were already individually live-tested and locked. Audit current deterministic source truth; do not claim the specialists were rerun.'
      : 'Final integrated Phase-1 audit. Specialist AI briefs are advisory and must be audited against deterministic source truth.';

  const fingerprint = fctP1Fingerprint_(
    fctP1AgentVersion_('AG012'),
    {
      packet: fctP1CompactSentinelFingerprintPacket_(basePacket),
      specialists: specialistBriefs
    }
  );

  const cached = fctP1CacheRead_('AG012', fingerprint);
  if (cached) {
    state.reused_agents.push('AG012');
    return fctP1RestoreCachedRun_('AG012', cached);
  }

  const runId = fctRunId_();
  const task = fctP1SentinelTask_();
  let aiRun;
  let recoveryRetry = false;

  try {
    aiRun = fctP1CallAgent_(
      'AG012',
      task,
      normalContext,
      'STANDARD',
      runId,
      state
    );
  } catch (err) {
    if (!fctP1EmbeddedSentinelIsOutputCompletionError_(err)) {
      throw err;
    }

    recoveryRetry = true;
    const recoveryContext =
      fctP1EmbeddedSentinelBuildAIContext_(basePacket, true);
    recoveryContext.specialist_briefs =
      fctP1UltraCompactSpecialistBriefs_(specialists);
    recoveryContext.phase_note =
      validationProxyMode
        ? 'Cost-optimized hierarchy validation recovery. Specialist briefs are deterministic validation proxies, not fresh specialist AI runs. Deterministic truth is unchanged.'
        : 'Structured-output recovery. Deterministic truth unchanged; nonessential detail removed.';

    aiRun = fctP1CallAgent_(
      'AG012',
      task + ' RECOVERY MODE: summary <=60 words; max 3 findings; max 3 recommendations; max 1 question; no methodology repetition.',
      recoveryContext,
      'STANDARD',
      runId,
      state
    );
  }

  fctP1AssertAIResult_('AG012', aiRun);
  fctP1AssertMaterialOutput_('AG012', aiRun.result);

  let result = fctP1CompactAgentResult_(aiRun.result);

  const sentinelStockRepair =
    fctP1ApplyDeterministicStockRepair_(
      result,
      (basePacket.stock && basePacket.stock.critical_stock) || [],
      (basePacket.stock && basePacket.stock.watch_stock) || [],
      'stock.critical_stock'
    );
  result = sentinelStockRepair.result;

  fctP1EmbeddedSentinelAssertCriticalStockCoverage_(
    (basePacket.stock && basePacket.stock.critical_stock) || [],
    result.findings || []
  );

  fctP1EmbeddedSentinelAssertCriticalCountClaims_(
    (basePacket.stock && basePacket.stock.critical_stock) || [],
    result
  );

  fctP1EmbeddedSentinelAssertWatchRowsNotPromoted_(
    (basePacket.stock && basePacket.stock.watch_stock) || [],
    result
  );

  const lastMile = (((basePacket.route || {}).live_courier_view) || [])
    .find(function(x) {
      return String((x && x.courier) || '').toLowerCase() === 'last mile';
    });

  if (lastMile &&
      String(lastMile.freshness_status || '').toUpperCase() === 'STALE_REVIEW' &&
      /fresh data|fresh live data|fresh operational/i.test(JSON.stringify(result))) {
    throw new Error(
      'SENTINEL semantic contract failed: Last Mile is STALE_REVIEW but integrated audit described it as fresh.'
    );
  }

  result = fctP1EmbeddedSentinelEnforceLockedGovernance_(result);

  const sentinelApprovalRepair =
    fctP1NormalizeRecommendationApprovals_(
      result,
      'AG012'
    );
  result = sentinelApprovalRepair.result;
  fctP1AssertRecommendationApprovals_(result);

  const run = {
    run_id: runId,
    status: 'SUCCESS',
    agent_id: 'AG012',
    packet_status: basePacket.overall_source_status,
    recovery_retry: recoveryRetry,
    deterministic_repairs:
      (sentinelStockRepair.repairs || [])
        .concat(
          (sentinelApprovalRepair.repairs || [])
            .map(function(x) {
              return 'APPROVAL_NORMALIZED:' +
                x.recommendation_index +
                ':' + x.from + '->' + x.to;
            })
        ),
    source_fingerprint: fingerprint,
    runtime: fctP1CompactRuntime_(aiRun.runtime),
    deterministic_cross_checks:
      basePacket.deterministic_cross_checks,
    stock_classification:
      fctP1EmbeddedSentinelStockClassification_(basePacket.stock),
    result: result
  };

  fctP1TryCacheRun_(
    'AG012',
    fingerprint,
    run,
    state
  );

  return run;
}


function fctP1GetOrRunIntegratedOrbit_(sentinelRun, sentinelBase, specialists, state) {
  const packet = fctP1BuildFrozenOrbitPacket_(sentinelRun, sentinelBase);
  packet.specialist_briefs = fctP1SpecialistBriefs_(specialists);

  const fingerprint = fctP1Fingerprint_(
    fctP1AgentVersion_('AG002'),
    fctP1CompactOrbitFingerprintPacket_(packet)
  );

  const cached = fctP1CacheRead_('AG002', fingerprint);
  if (cached) {
    state.reused_agents.push('AG002');
    return fctP1RestoreCachedRun_('AG002', cached);
  }

  const runId = fctRunId_();
  const aiRun = fctP1CallAgent_(
    'AG002',
    fctP1OrbitTask_(),
    {
      phase1_supervisor_packet: packet,
      governance: {
        mode: 'SUPERVISOR_SYNTHESIS_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        max_hierarchy_passes: 2
      },
      phase_note:
        fctP1AllValidationProxies_(specialists)
          ? 'Cost-optimized final hierarchy validation. Specialist briefs are deterministic validation proxies because the domain agents were already individually live-tested and locked. Do not claim fresh specialist AI runs occurred.'
          : 'Final integrated ORBIT pass. Specialist AI briefs were already run once and are included; do not request duplicate agent runs.'
    },
    'STANDARD',
    runId,
    state
  );

  fctP1AssertAIResult_('AG002', aiRun);

  let result = fctP1CompactAgentResult_(aiRun.result);

  const orbitStockRepair =
    fctP1ApplyDeterministicStockRepair_(
      result,
      (packet.stock && packet.stock.critical_stock) || [],
      (packet.stock && packet.stock.watch_stock) || [],
      'stock.critical_stock'
    );
  result = orbitStockRepair.result;

  result = fctP1EmbeddedOrbitEnforceGovernance_(result, packet);

  const orbitApprovalRepair =
    fctP1NormalizeRecommendationApprovals_(
      result,
      'AG002'
    );
  result = orbitApprovalRepair.result;
  fctP1AssertRecommendationApprovals_(result);

  const run = {
    run_id: runId,
    status: 'SUCCESS',
    agent_id: 'AG002',
    sentinel_run_id: sentinelRun.run_id,
    packet_status: packet.overall_source_status,
    source_fingerprint: fingerprint,
    deterministic_repairs:
      (orbitStockRepair.repairs || [])
        .concat(
          (orbitApprovalRepair.repairs || [])
            .map(function(x) {
              return 'APPROVAL_NORMALIZED:' +
                x.recommendation_index +
                ':' + x.from + '->' + x.to;
            })
        ),
    runtime: fctP1CompactRuntime_(aiRun.runtime),
    deterministic_cross_checks:
      packet.deterministic_cross_checks,
    stock_classification:
      fctP1EmbeddedOrbitStockClassification_(packet.stock),
    result: result
  };

  fctP1TryCacheRun_(
    'AG002',
    fingerprint,
    run,
    state
  );

  return run;
}


function fctP1GetOrRunIntegratedAtlas_(orbitRun, sentinelBase, state) {
  const packet = fctP1BuildFrozenAtlasPacket_(orbitRun, sentinelBase);

  const fingerprint = fctP1Fingerprint_(
    fctP1AgentVersion_('AG001'),
    fctP1CompactAtlasFingerprintPacket_(packet)
  );

  const cached = fctP1CacheRead_('AG001', fingerprint);
  if (cached) {
    state.reused_agents.push('AG001');
    return fctP1RestoreCachedRun_('AG001', cached);
  }

  const runId = fctRunId_();
  const aiRun = fctP1CallAgent_(
    'AG001',
    fctP1AtlasTask_(),
    {
      phase1_founder_packet: packet,
      governance: {
        mode: 'FOUNDER_BRIEF_ONLY',
        may_execute: false,
        final_authority: 'Abid',
        max_hierarchy_passes: 2
      },
      phase_note:
        'Final integrated ATLAS founder brief. Do not rerun upstream agents.'
    },
    'STANDARD',
    runId,
    state
  );

  fctP1AssertAIResult_('AG001', aiRun);

  let result = fctP1CompactAgentResult_(aiRun.result);

  const atlasStockRepair =
    fctP1ApplyDeterministicStockRepair_(
      result,
      (packet && packet.critical_stock) || [],
      (packet && packet.watch_stock) || [],
      'phase1_founder_packet.critical_stock'
    );
  result = atlasStockRepair.result;

  result = fctP1EmbeddedAtlasEnforceGovernance_(result, packet);

  const atlasApprovalRepair =
    fctP1NormalizeRecommendationApprovals_(
      result,
      'AG001'
    );
  result = atlasApprovalRepair.result;
  fctP1AssertRecommendationApprovals_(result);

  result.summary = [
    fctP1EmbeddedAtlasBuildFounderPulse_(packet),
    String(result.summary || '').trim()
  ].filter(Boolean).join(' | ');

  const run = {
    run_id: runId,
    status: 'SUCCESS',
    agent_id: 'AG001',
    orbit_run_id: orbitRun.run_id,
    sentinel_run_id: orbitRun.sentinel_run_id,
    packet_status: packet.overall_source_status,
    source_fingerprint: fingerprint,
    deterministic_repairs:
      (atlasStockRepair.repairs || [])
        .concat(
          (atlasApprovalRepair.repairs || [])
            .map(function(x) {
              return 'APPROVAL_NORMALIZED:' +
                x.recommendation_index +
                ':' + x.from + '->' + x.to;
            })
        ),
    runtime: fctP1CompactRuntime_(aiRun.runtime),
    deterministic_group_pulse: packet.group_pulse,
    deterministic_cross_checks:
      packet.deterministic_cross_checks,
    stock_classification:
      fctP1EmbeddedAtlasStockClassification_(packet),
    result: result
  };

  fctP1TryCacheRun_(
    'AG001',
    fingerprint,
    run,
    state
  );

  return run;
}


function fctP1SentinelTask_() {
  return [
    'Act as AG012 SENTINEL, Phase-1 audit gate.',
    'Audit deterministic source truth AND the four specialist briefs. Each brief includes brief_source: AI_SPECIALIST in production or DETERMINISTIC_VALIDATION_PROXY in cost-optimized final validation. Validation proxies are summaries of current deterministic data, not fresh specialist AI opinions. Specialist briefs are advisory; when they conflict with deterministic data, preserve deterministic truth and flag the conflict.',
    'Do not average conflicting cohorts or invent repairs.',
    'Missing TikTok spend hard-blocks final Real Contribution, Operating Profit and final SCALE decisions.',
    'Preserve deterministic MATCH cross-checks.',
    'Stock classification is dynamic: every current critical_stock row remains critical; every current watch_stock row remains WATCH. Never use prior-run classifications.',
    'Physical stock risk does not depend on Meta linkage. Market Meta linkage affects ad classification only.',
    'Last Mile stale data must remain explicitly stale while preserving the operating risk.',
    'TFM/OTO screening gaps are not confirmed shortages without settlement evidence; C3X matched settlement stays matched.',
    'No PO/ETA/MOQ/lead-time/reorder quantity may be invented.',
    'Maximum 4 findings, 3 recommendations, 2 questions. Keep output compact.',
    'External action/contact/system integration requires approval=true; internal HOLD/reconciliation/data refresh can be false.',
    'Do not execute anything.'
  ].join(' ');
}


function fctP1OrbitTask_() {
  return [
    'Act as AG002 ORBIT, Founder Control Tower Supervisor.',
    'Synthesize the audited packet for ATLAS. SENTINEL is the audit gate and cannot be voted around.',
    'Do not recalculate deterministic arithmetic.',
    'Missing TikTok spend keeps final profit and SCALE decisions HOLD.',
    'Preserve current dynamic critical_stock and watch_stock classifications exactly.',
    'Preserve stale qualifier for Last Mile and unconfirmed status for TFM/OTO screening differences.',
    'Do not merge operational, normalized, financial, or settlement courier cohorts.',
    'No inbound quantity/ETA/MOQ/lead-time/reorder quantity may be invented.',
    'Maximum 4 findings and 3 recommendations. Prioritize founder decisions.',
    'Do not bundle internal no-approval work with external approval-required work.',
    'Missing TikTok source acquisition/integration requires founder approval; Last Mile internal API repoll does not.',
    'Do not execute anything.'
  ].join(' ');
}


function fctP1AtlasTask_() {
  return [
    'Act as AG001 ATLAS, final Founder Agent.',
    'Turn the audited ORBIT packet into the shortest useful founder brief for Abid.',
    'Do not weaken ORBIT/SENTINEL gates or recalculate deterministic pulse values.',
    'Do not state numeric Real Contribution or Operating Profit while TikTok blocker is active.',
    'Preserve current dynamic critical_stock and watch_stock classifications exactly.',
    'Preserve Last Mile stale qualifier and TFM/OTO unconfirmed settlement status.',
    'No final SCALE go/no-go while TikTok spend is missing.',
    'Maximum 4 findings, 3 CEO priorities, 3 founder questions.',
    'External action/contact/integration/commitment requires approval=true; internal HOLD/reconciliation/API repoll can be false.',
    'Do not execute anything.'
  ].join(' ');
}



// -----------------------------------------------------------------------------
// FROZEN SOURCE PACKETS
// -----------------------------------------------------------------------------

function fctP1BuildFrozenSentinelPacket_(snapshots) {
  const ledger = snapshots.AG003 || {};
  const scale = snapshots.AG004 || {};
  const route = snapshots.AG005 || {};
  const stock = snapshots.AG006 || {};

  const routeReceivable = (route.normalized_order_view || [])
    .reduce(function(sum, x) {
      return sum + Number((x && x.courier_receivable_aed) || 0);
    }, 0);

  let routeSuccessCount = 0;
  let routeRrto = 0;
  (route.normalized_order_view || []).forEach(function(x) {
    routeSuccessCount +=
      Number((x && x.delivered_unpaid) || 0) +
      Number((x && x.paid) || 0);
    routeRrto += Number((x && x.rrto) || 0);
  });

  const routeFinalSuccess =
    (routeSuccessCount + routeRrto) > 0
      ? routeSuccessCount / (routeSuccessCount + routeRrto)
      : null;

  const ledgerMeta = Number(
    (ledger.economics && ledger.economics.meta_platform_spend_aed) || 0
  );
  const scaleMeta = Number(
    (scale.meta && scale.meta.platform_spend_aed) || 0
  );
  const stockMeta = Number(
    (stock.meta_market_attribution &&
      stock.meta_market_attribution.platform_spend_aed) || 0
  );
  const scalePending = Number(
    (scale.channel_completeness &&
      scale.channel_completeness.meta &&
      scale.channel_completeness.meta.country_pending_spend_aed) || 0
  );
  const stockPending = Number(
    (stock.meta_market_attribution &&
      stock.meta_market_attribution.country_pending_spend_aed) || 0
  );
  const ledgerReceivable = Number(
    (ledger.economics && ledger.economics.courier_receivable_aed) || 0
  );
  const ledgerDelivery = Number(
    (ledger.economics && ledger.economics.finalized_delivery_success) || 0
  );

  const cross = {
    meta_platform_spend_ledger_vs_scale: fctP1MatchPair_(
      'ledger_aed', ledgerMeta,
      'scale_aed', scaleMeta,
      0.01
    ),
    meta_platform_spend_ledger_vs_stock: fctP1MatchPair_(
      'ledger_aed', ledgerMeta,
      'stock_attribution_aed', stockMeta,
      0.01
    ),
    meta_country_pending_scale_vs_stock: fctP1MatchPair_(
      'scale_aed', scalePending,
      'stock_aed', stockPending,
      0.01
    ),
    courier_receivable_ledger_vs_route: fctP1MatchPair_(
      'ledger_aed', ledgerReceivable,
      'route_normalized_sum_aed', routeReceivable,
      0.01
    ),
    finalized_delivery_success_ledger_vs_route: {
      ledger: fctP1Round_(ledgerDelivery, 6),
      route_normalized:
        routeFinalSuccess === null
          ? null
          : fctP1Round_(routeFinalSuccess, 6),
      difference:
        routeFinalSuccess === null
          ? null
          : fctP1Round_(ledgerDelivery - routeFinalSuccess, 6),
      status:
        routeFinalSuccess !== null &&
        Math.abs(ledgerDelivery - routeFinalSuccess) <= 0.0001
          ? 'MATCH'
          : 'MISMATCH'
    },
    tiktok_blocker_consistency: {
      ledger_real_contribution_status:
        ledger.economics && ledger.economics.real_contribution_status,
      scale_tiktok_status:
        scale.channel_completeness &&
        scale.channel_completeness.tiktok &&
        scale.channel_completeness.tiktok.status,
      status:
        /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
          String(ledger.economics &&
            ledger.economics.real_contribution_status || '')
        ) &&
        /MISSING_ACTIVE_CHANNEL_SPEND/i.test(
          String(scale.channel_completeness &&
            scale.channel_completeness.tiktok &&
            scale.channel_completeness.tiktok.status || '')
        )
          ? 'MATCH'
          : 'MISMATCH'
    }
  };

  const sourceStatuses = {
    ledger: ledger.data_quality && ledger.data_quality.status,
    scale: scale.data_quality && scale.data_quality.status,
    route: route.data_quality && route.data_quality.status,
    stock: stock.data_quality && stock.data_quality.status
  };

  const anyFail = Object.keys(sourceStatuses).some(function(k) {
    return String(sourceStatuses[k]).toUpperCase() === 'FAIL';
  });
  const anyReview = Object.keys(sourceStatuses).some(function(k) {
    return /REVIEW|WARNING/i.test(String(sourceStatuses[k]));
  });

  return {
    contract_version: '1.0-FROZEN',
    packet_for: 'AG012',
    generated_at: new Date().toISOString(),
    source_snapshot_mode: 'FROZEN_AT_RUN_START',
    overall_source_status:
      anyFail ? 'FAIL' : (anyReview ? 'REVIEW' : 'PASS'),
    source_statuses: sourceStatuses,
    deterministic_cross_checks: cross,
    ledger: {
      period: ledger.period,
      economics: ledger.economics,
      cash_reconciliation: ledger.cash_reconciliation,
      data_quality: ledger.data_quality
    },
    scale: {
      period: scale.period,
      channel_completeness: scale.channel_completeness,
      meta: {
        platform_spend_aed: scale.meta && scale.meta.platform_spend_aed,
        product_pnl_meta_spend_aed:
          scale.meta && scale.meta.product_pnl_meta_spend_aed,
        meta_not_represented_in_product_pnl_aed:
          scale.meta && scale.meta.meta_not_represented_in_product_pnl_aed,
        performance_metrics_status:
          scale.meta && scale.meta.performance_metrics_status
      },
      provisional_product_rankings:
        scale.provisional_product_rankings,
      courier_scale_gates: scale.courier_scale_gates,
      data_quality: scale.data_quality
    },
    route: {
      normalized_order_view: route.normalized_order_view,
      live_courier_view: route.live_courier_view,
      settlement_reconciliation: route.settlement_reconciliation,
      data_quality: route.data_quality
    },
    stock: {
      inventory_summary: stock.inventory_summary,
      critical_stock: stock.critical_stock,
      watch_stock: stock.watch_stock,
      reconciliation_exceptions:
        (stock.reconciliation_exceptions || []).slice(0, 15),
      inbound_visibility: stock.inbound_visibility,
      meta_market_attribution: stock.meta_market_attribution,
      data_quality: stock.data_quality
    },
    locked_interpretation_rules: {
      paid:
        'PAID = COD remittance received; Delivered does not imply Paid.',
      delivery_success:
        '(Delivered + Paid)/(Delivered + Paid + RRTO), terminal outcomes only.',
      inventory_velocity:
        'max(7-day average pickup,14-day average pickup).',
      rrto:
        'RRTO is unavailable until physically received.',
      scale:
        'Never scale from ROAS alone; final scale requires all active-channel spend and valid delivery/stock/cash/freshness gates.',
      data_quality:
        'Missing/bad data blocks affected conclusions; do not vote around deterministic FAIL.'
    }
  };
}


function fctP1BuildFrozenOrbitPacket_(sentinelRun, base) {
  const ledger = base.ledger || {};
  const scale = base.scale || {};
  const route = base.route || {};
  const stock = base.stock || {};
  const lastMile = (route.live_courier_view || []).find(function(x) {
    return String((x && x.courier) || '').toLowerCase() === 'last mile';
  }) || null;

  return {
    contract_version: '1.0-FROZEN',
    packet_for: 'AG002',
    generated_at: base.generated_at,
    source_snapshot_mode: 'FROZEN_AT_RUN_START',
    overall_source_status: base.overall_source_status,
    source_statuses: {
      ledger: base.source_statuses.ledger,
      scale: base.source_statuses.scale,
      route: base.source_statuses.route,
      stock: base.source_statuses.stock,
      sentinel: sentinelRun.result.audit_status
    },
    deterministic_cross_checks: base.deterministic_cross_checks,
    sentinel_audit: {
      run_id: sentinelRun.run_id,
      audit_status: sentinelRun.result.audit_status,
      severity: sentinelRun.result.severity,
      source_freshness: sentinelRun.result.source_freshness,
      summary: sentinelRun.result.summary,
      findings: sentinelRun.result.findings,
      recommendations: sentinelRun.result.recommendations,
      questions_for_abid: sentinelRun.result.questions_for_abid,
      confidence: sentinelRun.result.confidence,
      provisional_fields: sentinelRun.result.provisional_fields
    },
    ledger: {
      period: ledger.period,
      data_quality_status:
        ledger.data_quality && ledger.data_quality.status,
      economics: ledger.economics,
      settlement_reviews:
        fctP1SettlementReviews_(ledger.cash_reconciliation),
      data_quality_flags:
        ((ledger.data_quality || {}).flags || []).slice(0, 10)
    },
    scale: {
      period: scale.period,
      data_quality_status:
        scale.data_quality && scale.data_quality.status,
      channel_completeness: scale.channel_completeness,
      meta: scale.meta,
      positive_after_meta:
        (((scale.provisional_product_rankings || {})
          .positive_after_meta) || []).slice(0, 6),
      negative_after_meta:
        (((scale.provisional_product_rankings || {})
          .negative_after_meta) || []).slice(0, 4),
      courier_scale_gates: scale.courier_scale_gates,
      data_quality_flags:
        ((scale.data_quality || {}).flags || []).slice(0, 12)
    },
    route: {
      data_quality_status:
        route.data_quality && route.data_quality.status,
      normalized_order_view: route.normalized_order_view,
      live_courier_view: route.live_courier_view,
      last_mile: lastMile ? {
        finalized_success: lastMile.finalized_success,
        scale_gate_status: lastMile.scale_gate_status,
        freshness_status: lastMile.freshness_status,
        poll_age_hours: lastMile.poll_age_hours,
        reconciliation_status: lastMile.reconciliation_status
      } : null,
      settlement_reconciliation: route.settlement_reconciliation,
      data_quality_flags:
        ((route.data_quality || {}).flags || []).slice(0, 15)
    },
    stock: {
      data_quality_status:
        stock.data_quality && stock.data_quality.status,
      inventory_summary: stock.inventory_summary,
      critical_stock: stock.critical_stock,
      watch_stock: stock.watch_stock,
      inbound_visibility: stock.inbound_visibility,
      meta_market_attribution: stock.meta_market_attribution,
      data_quality_flags:
        ((stock.data_quality || {}).flags || []).slice(0, 12)
    },
    locked_rules: base.locked_interpretation_rules
  };
}


function fctP1BuildFrozenAtlasPacket_(orbitRun, base) {
  const ledger = base.ledger || {};
  const scale = base.scale || {};
  const route = base.route || {};
  const stock = base.stock || {};
  const lastMile = (route.live_courier_view || []).find(function(x) {
    return String((x && x.courier) || '').toLowerCase() === 'last mile';
  }) || null;

  return {
    contract_version: '1.0-FROZEN',
    packet_for: 'AG001',
    generated_at: base.generated_at,
    source_snapshot_mode: 'FROZEN_AT_RUN_START',
    overall_source_status: base.overall_source_status,
    source_statuses: {
      ledger: base.source_statuses.ledger,
      scale: base.source_statuses.scale,
      route: base.source_statuses.route,
      stock: base.source_statuses.stock,
      orbit: orbitRun.result.audit_status
    },
    deterministic_cross_checks: base.deterministic_cross_checks,
    orbit_brief: {
      run_id: orbitRun.run_id,
      sentinel_run_id: orbitRun.sentinel_run_id,
      audit_status: orbitRun.result.audit_status,
      severity: orbitRun.result.severity,
      source_freshness: orbitRun.result.source_freshness,
      summary: orbitRun.result.summary,
      findings: orbitRun.result.findings,
      recommendations: orbitRun.result.recommendations,
      approval_required: orbitRun.result.approval_required,
      questions_for_abid: orbitRun.result.questions_for_abid,
      confidence: orbitRun.result.confidence,
      provisional_fields: orbitRun.result.provisional_fields,
      next_check: orbitRun.result.next_check
    },
    group_pulse: {
      period_month: ledger.period && ledger.period.month,
      as_of_date: ledger.period && ledger.period.today,
      daily_pnl_latest_date:
        ledger.period && ledger.period.daily_pnl_latest_date,
      meta_latest_date:
        ledger.period && ledger.period.meta_latest_date,
      orders_picked_mtd:
        ledger.economics && ledger.economics.orders_picked_mtd,
      delivered_unpaid_mtd:
        ledger.economics && ledger.economics.delivered_unpaid_mtd,
      paid_mtd:
        ledger.economics && ledger.economics.paid_mtd,
      rrto_mtd:
        ledger.economics && ledger.economics.rrto_mtd,
      finalized_delivery_success:
        ledger.economics && ledger.economics.finalized_delivery_success,
      delivered_revenue_aed:
        ledger.economics && ledger.economics.delivered_revenue_aed,
      gross_contribution_aed:
        ledger.economics && ledger.economics.gross_contribution_aed,
      meta_platform_spend_aed:
        ledger.economics && ledger.economics.meta_platform_spend_aed,
      contribution_after_all_meta_aed:
        ledger.economics && ledger.economics.contribution_after_all_meta_aed,
      tiktok_spend_aed:
        ledger.economics && ledger.economics.tiktok_spend_aed,
      real_contribution_profit_aed:
        ledger.economics && ledger.economics.real_contribution_profit_aed,
      real_contribution_status:
        ledger.economics && ledger.economics.real_contribution_status,
      real_operating_profit_aed:
        ledger.economics && ledger.economics.real_operating_profit_aed,
      real_operating_profit_status:
        ledger.economics && ledger.economics.real_operating_profit_status,
      courier_receivable_aed:
        ledger.economics && ledger.economics.courier_receivable_aed,
      monthly_fixed_cost_baseline_aed:
        ledger.economics && ledger.economics.monthly_fixed_cost_baseline_aed
    },
    critical_stock: stock.critical_stock || [],
    watch_stock: (stock.watch_stock || []).slice(0, 8),
    last_mile: lastMile ? {
      finalized_success: lastMile.finalized_success,
      scale_gate_status: lastMile.scale_gate_status,
      freshness_status: lastMile.freshness_status,
      poll_age_hours: lastMile.poll_age_hours,
      reconciliation_status: lastMile.reconciliation_status
    } : null,
    settlement_reviews:
      fctP1SettlementReviews_(ledger.cash_reconciliation),
    scale_signals: {
      positive_after_meta_provisional:
        (((scale.provisional_product_rankings || {})
          .positive_after_meta) || []).slice(0, 5),
      tiktok_status:
        scale.channel_completeness &&
        scale.channel_completeness.tiktok &&
        scale.channel_completeness.tiktok.status,
      meta_country_pending_spend_aed:
        scale.channel_completeness &&
        scale.channel_completeness.meta &&
        scale.channel_completeness.meta.country_pending_spend_aed
    },
    stock_inbound_visibility: stock.inbound_visibility,
    locked_rules: base.locked_interpretation_rules
  };
}


function fctP1SettlementReviews_(cashRecon) {
  const items = cashRecon && cashRecon.items || [];
  return items.filter(function(x) {
    return /REVIEW/i.test(String((x && x.status_note) || ''));
  }).map(function(x) {
    return {
      courier: x.courier,
      difference_aed: x.difference_aed,
      status_note: x.status_note
    };
  });
}


function fctP1MatchPair_(keyA, a, keyB, b, tolerance) {
  const diff = fctP1Round_(Number(a || 0) - Number(b || 0), 6);
  const out = {};
  out[keyA] = Number(a || 0);
  out[keyB] = Number(b || 0);
  out.difference_aed = diff;
  out.status = Math.abs(diff) <= Number(tolerance || 0)
    ? 'MATCH'
    : 'MISMATCH';
  return out;
}


function fctP1Round_(value, decimals) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return value;
  }
  const p = Math.pow(10, Number(decimals || 0));
  return Math.round(Number(value) * p) / p;
}


// -----------------------------------------------------------------------------
// SOURCE STABILITY + COMPACT FINGERPRINT PACKETS
// -----------------------------------------------------------------------------

function fctP1BuildSourceBundle_() {
  const snapshots = {
    AG003: fctBuildLedgerSnapshot_(),
    AG004: fctBuildScaleSnapshot_(),
    AG005: fctBuildRouteSnapshot_(),
    AG006: fctBuildStockSnapshot_()
  };

  const fingerprints = {};
  Object.keys(snapshots).forEach(function(agentId) {
    fingerprints[agentId] = fctP1Fingerprint_(
      fctP1AgentVersion_(agentId),
      fctP1CompactSpecialistSnapshot_(
        agentId,
        snapshots[agentId]
      )
    );
  });

  return {
    snapshots: snapshots,
    fingerprints: fingerprints
  };
}


function fctP1AssertSourceBundleStable_(before, after, message) {
  const changed = [];

  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      if (String(before[agentId]) !== String(after[agentId])) {
        changed.push(agentId);
      }
    });

  if (changed.length) {
    throw new Error(
      (message || 'Phase-1 deterministic source drift detected.') +
      ' Changed domains: ' + changed.join(', ') + '.'
    );
  }

  return true;
}


function fctP1CompactSentinelFingerprintPacket_(p) {
  return {
    overall_source_status: p.overall_source_status,
    source_statuses: p.source_statuses,
    deterministic_cross_checks: p.deterministic_cross_checks,
    ledger: p.ledger,
    scale: p.scale,
    route: p.route,
    stock: p.stock,
    locked_interpretation_rules: p.locked_interpretation_rules
  };
}


function fctP1CompactOrbitFingerprintPacket_(p) {
  return {
    overall_source_status: p.overall_source_status,
    source_statuses: p.source_statuses,
    deterministic_cross_checks: p.deterministic_cross_checks,
    sentinel_audit: p.sentinel_audit,
    ledger: p.ledger,
    scale: p.scale,
    route: p.route,
    stock: p.stock,
    specialist_briefs: p.specialist_briefs,
    locked_rules: p.locked_rules
  };
}


function fctP1CompactAtlasFingerprintPacket_(p) {
  return {
    overall_source_status: p.overall_source_status,
    source_statuses: p.source_statuses,
    deterministic_cross_checks: p.deterministic_cross_checks,
    orbit_brief: p.orbit_brief,
    group_pulse: p.group_pulse,
    critical_stock: p.critical_stock,
    watch_stock: p.watch_stock,
    last_mile: p.last_mile,
    settlement_reviews: p.settlement_reviews,
    scale_signals: p.scale_signals,
    stock_inbound_visibility: p.stock_inbound_visibility,
    locked_rules: p.locked_rules
  };
}


// -----------------------------------------------------------------------------
// COST / CACHE
// -----------------------------------------------------------------------------

function fctP1CallAgent_(agentId, task, context, mode, runId, state) {
  state.logical_ai_calls++;

  const logicalBudget =
    Number(state.logical_ai_call_budget ||
      FCT_P1_MAX_LOGICAL_AI_CALLS_);

  if (state.logical_ai_calls > logicalBudget) {
    throw new Error(
      'Phase-1 cost guard stopped the run: logical AI call budget exceeded.'
    );
  }

  state.executed_agents.push(agentId);

  return fctRunAgent_(
    agentId,
    task,
    context,
    mode || 'STANDARD',
    runId
  );
}


function fctP1CacheRead_(agentId, fingerprint) {
  try {
    const props = PropertiesService.getScriptProperties();
    const base = fctP1CacheBaseKey_(agentId);
    const metaRaw = props.getProperty(base + '_META');
    if (!metaRaw) return null;

    let meta;
    try {
      meta = JSON.parse(metaRaw);
    } catch (e) {
      return null;
    }

    if (!meta ||
        meta.orchestrator_version !== FCT_P1_ORCH_VERSION_ ||
        meta.agent_version !== fctP1AgentVersion_(agentId) ||
        String(meta.fingerprint) !== String(fingerprint) ||
        !meta.chunks || meta.chunks < 1 ||
        meta.chunks > FCT_P1_CACHE_MAX_CHUNKS_) {
      return null;
    }

    let payload = '';
    for (let i = 0; i < meta.chunks; i++) {
      const part = props.getProperty(base + '_C' + i);
      if (part === null || part === undefined) return null;
      payload += part;
    }

    try {
      const parsed = JSON.parse(payload);
      if (!parsed || !parsed.run ||
          parsed.run.agent_id !== agentId) {
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  } catch (e) {
    // Cache is an optimization only. Never block AI work because cache read failed.
    return null;
  }
}


function fctP1TryCacheRun_(agentId, fingerprint, run, state) {
  try {
    const compactRun = fctP1CacheSafeRun_(run);
    const payload = JSON.stringify({ run: compactRun });
    const chunks = Math.ceil(
      payload.length / FCT_P1_CACHE_CHUNK_SIZE_
    );

    if (chunks < 1 || chunks > FCT_P1_CACHE_MAX_CHUNKS_) {
      state.cache_write_skips.push({
        agent_id: agentId,
        reason: 'CACHE_PAYLOAD_TOO_LARGE',
        chars: payload.length
      });
      return false;
    }

    const props = PropertiesService.getScriptProperties();
    const base = fctP1CacheBaseKey_(agentId);

    // Write chunks first, metadata last. A partial write cannot become a hit.
    for (let i = 0; i < chunks; i++) {
      props.setProperty(
        base + '_C' + i,
        payload.slice(
          i * FCT_P1_CACHE_CHUNK_SIZE_,
          (i + 1) * FCT_P1_CACHE_CHUNK_SIZE_
        )
      );
    }

    for (let i = chunks; i < FCT_P1_CACHE_MAX_CHUNKS_; i++) {
      props.deleteProperty(base + '_C' + i);
    }

    props.setProperty(
      base + '_META',
      JSON.stringify({
        orchestrator_version: FCT_P1_ORCH_VERSION_,
        agent_version: fctP1AgentVersion_(agentId),
        fingerprint: fingerprint,
        chunks: chunks,
        saved_at: new Date().toISOString()
      })
    );

    return true;
  } catch (e) {
    state.cache_write_skips.push({
      agent_id: agentId,
      reason: 'CACHE_WRITE_FAILED',
      error: fctP1TrimText_((e && e.message) || e, 300)
    });
    return false;
  }
}


function fctP1RestoreCachedRun_(agentId, cached) {
  const run = cached.run;
  if (!run || run.agent_id !== agentId || !run.result) {
    throw new Error(
      'Phase-1 cache contract failed for ' + agentId + '.'
    );
  }
  run.cache_reused = true;
  return run;
}


function fctP1CacheSafeRun_(run) {
  return {
    run_id: run.run_id,
    status: run.status,
    agent_id: run.agent_id,
    snapshot_status: run.snapshot_status,
    packet_status: run.packet_status,
    sentinel_run_id: run.sentinel_run_id,
    orbit_run_id: run.orbit_run_id,
    recovery_retry: run.recovery_retry,
    source_fingerprint: run.source_fingerprint,
    runtime: fctP1CompactRuntime_(run.runtime),
    deterministic_cross_checks:
      run.deterministic_cross_checks,
    deterministic_group_pulse:
      run.deterministic_group_pulse,
    stock_classification:
      run.stock_classification,
    result: fctP1CompactAgentResult_(run.result)
  };
}



function fctP1ApplyDeterministicStockRepair_(
  result,
  criticalRows,
  watchRows,
  evidenceRef
) {
  const out = result || {};
  const critical = criticalRows || [];
  const watch = watchRows || [];
  const repairs = [];

  const beforeCountText = JSON.stringify(out);

  fctP1TransformNarrativeStrings_(out, function(s) {
    return fctP1RepairCriticalCountClaimsText_(
      s,
      critical.length
    );
  });

  const afterCountText = JSON.stringify(out);

  if (beforeCountText !== afterCountText) {
    repairs.push(
      'DETERMINISTIC_CRITICAL_STOCK_COUNT_NORMALIZED'
    );
  }

  const beforeCoverageText = afterCountText;
  const missing = critical.filter(function(x) {
    return !fctP1HasCountrySkuMention_(
      beforeCoverageText,
      x && x.country,
      x && x.sku
    );
  });

  if (missing.length) {
    fctP1UpsertDeterministicStockFinding_(
      out,
      critical,
      watch,
      evidenceRef
    );

    repairs.push(
      'DETERMINISTIC_CRITICAL_STOCK_COVERAGE:' +
      missing.map(function(x) {
        return fctP1StockCountryAlias_(x && x.country) +
          ' ' + String((x && x.sku) || '').toUpperCase();
      }).join(',')
    );
  }

  const afterCoverageText = JSON.stringify(out);

  if (missing.length &&
      beforeCoverageText === afterCoverageText) {
    throw new Error(
      'Phase-1 deterministic repair contract failed: critical stock coverage repair made no change.'
    );
  }

  return {
    result: out,
    repairs: repairs
  };
}


function fctP1TransformNarrativeStrings_(result, transform) {
  if (!result || typeof transform !== 'function') {
    return result;
  }

  result.summary =
    transform(String(result.summary || ''));

  result.next_check =
    transform(String(result.next_check || ''));

  result.questions_for_abid =
    (result.questions_for_abid || [])
      .map(function(x) {
        return transform(String(x || ''));
      });

  result.findings =
    (result.findings || []).map(function(f) {
      const x = f || {};
      x.title = transform(String(x.title || ''));
      x.detail = transform(String(x.detail || ''));
      return x;
    });

  result.recommendations =
    (result.recommendations || []).map(function(r) {
      const x = r || {};
      x.action = transform(String(x.action || ''));
      x.why = transform(String(x.why || ''));
      return x;
    });

  return result;
}


function fctP1RepairCriticalCountClaimsText_(text, actual) {
  const words =
    'one|two|three|four|five|six|seven|eight|nine|ten|\\d+';

  const re = new RegExp(
    '\\b(' + words + ')\\b' +
    '(\\s+(?:deterministic\\s+)?critical(?:[- ]stock)?\\s+' +
    '(?:rows?|risks?|exposures?))',
    'gi'
  );

  return String(text || '').replace(
    re,
    String(Number(actual || 0)) + '$2'
  );
}


function fctP1UpsertDeterministicStockFinding_(
  result,
  criticalRows,
  watchRows,
  evidenceRef
) {
  const findings = Array.isArray(result.findings)
    ? result.findings
    : [];

  const detail =
    fctP1BuildDeterministicStockDetail_(
      criticalRows,
      watchRows
    );

  let target = -1;

  for (let i = 0; i < findings.length; i++) {
    const f = findings[i] || {};
    const text = [
      String(f.title || ''),
      String(f.detail || '')
    ].join(' ');

    if (
      /\b(stock|inventory|replenish|reorder|OOS|out of stock)\b/i.test(text) ||
      /\bPLG\d+\b/i.test(text)
    ) {
      target = i;
      break;
    }
  }

  const deterministicFinding = {
    title: 'Deterministic stock classification',
    detail: detail,
    severity:
      criticalRows && criticalRows.length
        ? 'ACT_NOW'
        : 'WATCH',
    evidence_refs: [
      evidenceRef || 'deterministic_stock_classification'
    ]
  };

  if (target >= 0) {
    findings[target] = deterministicFinding;
  } else if (findings.length < 4) {
    findings.push(deterministicFinding);
  } else {
    // Preserve all existing findings while making deterministic stock
    // truth visible. Prefer augmenting the lowest-severity finding.
    let mergeIndex = findings.length - 1;
    const rank = {
      NORMAL: 0,
      WATCH: 1,
      ACT_NOW: 2,
      CRITICAL: 3
    };
    let bestRank = 99;

    findings.forEach(function(f, i) {
      const r = rank[
        String((f && f.severity) || '')
          .toUpperCase()
      ];
      const score =
        r === undefined ? 9 : r;

      if (score < bestRank) {
        bestRank = score;
        mergeIndex = i;
      }
    });

    const existing = findings[mergeIndex] || {};
    existing.title =
      String(existing.title || 'Finding') +
      ' + deterministic stock';
    existing.detail = [
      String(existing.detail || ''),
      detail
    ].filter(Boolean).join(' | ');
    existing.evidence_refs =
      (existing.evidence_refs || [])
        .concat([
          evidenceRef ||
          'deterministic_stock_classification'
        ])
        .filter(function(x, i, arr) {
          return arr.indexOf(x) === i;
        })
        .slice(0, 3);

    if (
      criticalRows &&
      criticalRows.length &&
      String(existing.severity || '')
        .toUpperCase() === 'NORMAL'
    ) {
      existing.severity = 'ACT_NOW';
    }

    findings[mergeIndex] = existing;
  }

  result.findings = findings.slice(0, 4);
  return result;
}


function fctP1BuildDeterministicStockDetail_(
  criticalRows,
  watchRows
) {
  const critical = (criticalRows || [])
    .map(fctP1StockRowLabel_);

  const watch = (watchRows || [])
    .slice(0, 5)
    .map(fctP1StockRowLabel_);

  const parts = [];

  if (critical.length) {
    parts.push(
      'CRITICAL: ' + critical.join('; ')
    );
  }

  if (watch.length) {
    parts.push(
      'WATCH: ' + watch.join('; ')
    );
  }

  return parts.join(' | ');
}


function fctP1StockRowLabel_(row) {
  const x = row || {};
  const country =
    fctP1StockCountryAlias_(x.country);
  const sku =
    String(x.sku || '').toUpperCase();
  const gate =
    String(x.stock_gate || '')
      .toUpperCase();

  let state = '';

  if (
    /OUT_OF_STOCK|OOS/.test(gate) ||
    Number(x.available_stock) === 0 ||
    Number(x.available_stock_days) === 0
  ) {
    state = 'OOS';
  } else if (
    x.available_stock_days !== null &&
    x.available_stock_days !== undefined &&
    x.available_stock_days !== '' &&
    isFinite(Number(x.available_stock_days))
  ) {
    state =
      fctP1Round_(
        Number(x.available_stock_days),
        2
      ) + 'd';
  } else {
    state = gate || 'RISK';
  }

  return [
    country,
    sku,
    state
  ].filter(Boolean).join(' ');
}


function fctP1StockCountryAlias_(country) {
  const s = String(country || '').trim();
  const lower = s.toLowerCase();

  if (
    lower.indexOf('united arab emirates') >= 0
  ) {
    return 'UAE';
  }

  if (lower.indexOf('kuwait') >= 0) {
    return 'Kuwait';
  }

  return s;
}


function fctP1HasCountrySkuMention_(
  text,
  country,
  sku
) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const k = fctP1EscapeRegex_(
    String(sku || '').toUpperCase()
  );

  const aliases =
    c.indexOf('united arab emirates') >= 0
      ? ['UAE', 'United Arab Emirates']
      : (c.indexOf('kuwait') >= 0
          ? ['Kuwait', 'KWT']
          : [country]);

  return aliases.some(function(alias) {
    const a = fctP1EscapeRegex_(alias);

    return (
      new RegExp(
        '\\b' + a +
        '\\b[^.;,\\n]{0,50}\\b' +
        k + '\\b',
        'i'
      ).test(s) ||
      new RegExp(
        '\\b' + k +
        '\\b[^.;,\\n]{0,50}\\b' +
        a + '\\b',
        'i'
      ).test(s)
    );
  });
}



function testFctPhase1DeterministicStockRepairNoApi() {
  const critical = [
    {
      country: 'United Arab Emirates',
      sku: 'PLG597',
      available_stock_days: 2.09,
      stock_gate: 'CRITICAL_LE_3_DAYS'
    },
    {
      country: 'United Arab Emirates',
      sku: 'PLG609',
      available_stock_days: 0,
      available_stock: 0,
      stock_gate: 'OUT_OF_STOCK'
    },
    {
      country: 'Kuwait',
      sku: 'PLG597',
      available_stock_days: 0,
      available_stock: 0,
      stock_gate: 'OUT_OF_STOCK'
    }
  ];

  const watch = [
    {
      country: 'Kuwait',
      sku: 'PLG617',
      available_stock_days: 3.5,
      stock_gate: 'WATCH_LE_7_DAYS'
    }
  ];

  const omitted = {
    summary:
      'Four critical stock rows need attention.',
    findings: [
      {
        title: 'Stock risk',
        detail:
          'UAE PLG597 and UAE PLG609 require attention. Kuwait PLG617 remains WATCH.',
        severity: 'ACT_NOW',
        evidence_refs: []
      }
    ],
    recommendations: [],
    questions_for_abid: [],
    next_check: ''
  };

  const repaired =
    fctP1ApplyDeterministicStockRepair_(
      omitted,
      critical,
      watch,
      'stock.critical_stock'
    );

  const result = repaired.result;

  fctP1EmbeddedSentinelAssertCriticalStockCoverage_(
    critical,
    result.findings
  );

  fctP1EmbeddedSentinelAssertCriticalCountClaims_(
    critical,
    result
  );

  fctP1EmbeddedSentinelAssertWatchRowsNotPromoted_(
    watch,
    result
  );

  if (
    !/3 critical stock rows/i.test(
      String(result.summary || '')
    )
  ) {
    throw new Error(
      'Deterministic repair did not normalize critical count.'
    );
  }

  if (
    !/Kuwait PLG597/i.test(
      JSON.stringify(result.findings)
    )
  ) {
    throw new Error(
      'Deterministic repair did not restore omitted Kuwait PLG597.'
    );
  }

  if (
    !/Kuwait PLG617 3\.5d/i.test(
      JSON.stringify(result.findings)
    )
  ) {
    throw new Error(
      'Deterministic repair did not preserve Kuwait PLG617 WATCH state.'
    );
  }

  Logger.log(
    'PHASE1_DETERMINISTIC_STOCK_REPAIR_PASS'
  );

  return true;
}



function fctP1IsGovernedExternalActionText_(text) {
  const s = String(text || '');
  if (!s) return false;

  // External communication / evidence acquisition.
  if (
    /\b(contact|email|message|call|whatsapp|send to|request|ask|obtain|get)\b.{0,140}\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile|remittance|settlement|statements?|invoice|proof|documents?|evidence|ETA|lead[- ]?time|MOQ|quote|inbound|PO)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  // Missing data-source / system integration.
  if (
    /\b(approve|authorize|acquire|integrate|connect|configure|enable|restore|set up|setup|ingest|add)\b.{0,140}\b(TikTok|API|feed|source|connector|integration|active-channel spend|spend feed)\b/i.test(s) ||
    /\b(TikTok|API|feed|source|connector)\b.{0,140}\b(acquire|integrate|connect|configure|enable|restore|set up|setup|ingest)\b/i.test(s)
  ) {
    return true;
  }

  // Inventory / purchasing commitments or sourcing/outreach.
  if (
    /\b(place|approve|authorize|commit|purchase|buy|replenish|source|initiate|arrange|transfer|order)\b.{0,140}\b(PO|purchase|order|stock|inventory|units?|SKU|PLG\d+|replenishment|sourcing|supplier)\b/i.test(s)
  ) {
    return true;
  }

  // Ads/campaign/budget operational actions.
  // Important: "SCALE decision remains HOLD" is NOT caught here.
  if (
    /\b(suspend|halt|pause|stop|disable|turn off|reduce|increase|decrease|change|edit|scale)\b.{0,90}\b(ad scaling|scaling ads?|ads?|campaigns?|budgets?|ad spend|Meta ads?|TikTok ads?)\b/i.test(s) ||
    /\b(ad scaling|scaling ads?|ads?|campaigns?|budgets?|ad spend|Meta ads?|TikTok ads?)\b.{0,90}\b(suspend|halt|pause|stop|disable|turn off|reduce|increase|decrease|change|edit|scale)\b/i.test(s) ||
    /\b(do not|don't|hold|keep)\b.{0,60}\b(scale|scaling)\b.{0,35}\b(?:the\s+)?(?:Meta|TikTok)?\s*(ads?|campaigns?|budgets?)\b/i.test(s)
  ) {
    return true;
  }

  // Courier/order/routing operational actions.
  if (
    /\b(reroute|reassign|switch|assign|suspend|halt|pause|stop|disable|change)\b.{0,110}\b(couriers?|routing|shipments?|orders?|drivers?|deliveries?)\b/i.test(s)
  ) {
    return true;
  }

  // Money movement / refund / payment.
  return /\b(pay|refund|release|move|transfer|send)\b.{0,110}\b(payments?|money|refunds?|cash|funds?|AED|amount)\b/i.test(s);
}


function fctP1IsClearlyInternalActionText_(text) {
  const s = String(text || '');
  if (!s) return false;

  return (
    /\b(refresh|repoll|poll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,130}\b(data|feed|API|courier view|records?|cohorts?|snapshot|mapping|allocation|reconciliation)\b/i.test(s) ||
    /\binternally\b.{0,130}\b(refresh|repoll|poll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s) ||
    /\b(Last Mile|C3X|OTO|TFM)\b.{0,100}\b(API poll|data poll|repoll|refresh|reconcile|review)\b/i.test(s)
  );
}


function fctP1IsInternalDecisionHold_(text) {
  const s = String(text || '');
  if (!s) return false;

  const decisionTarget =
    /\b(Real Contribution|Operating Profit|profit|SCALE|scale decision|go[- ]?no[- ]?go|conclusion|calculation|decision)\b/i.test(s);

  const holdSignal =
    /\b(hold|keep|maintain|preserve|remain blocked|remain on hold)\b/i.test(s);

  return (
    decisionTarget &&
    holdSignal &&
    !fctP1IsGovernedExternalActionText_(s)
  );
}


function fctP1NormalizeRecommendationApprovals_(
  result,
  layerName
) {
  const out = result || {};
  const recs = Array.isArray(out.recommendations)
    ? out.recommendations
    : [];
  const repairs = [];

  recs.forEach(function(rec, index) {
    const action = String((rec && rec.action) || '');
    const external =
      fctP1IsGovernedExternalActionText_(action);
    const internal =
      fctP1IsClearlyInternalActionText_(action);
    const hold =
      fctP1IsInternalDecisionHold_(action);

    const before = !!(rec && rec.approval_required);

    if (external) {
      rec.approval_required = true;
    } else if (internal || hold) {
      rec.approval_required = false;
    }

    const after = !!(rec && rec.approval_required);

    if (before !== after) {
      repairs.push({
        layer: String(layerName || ''),
        recommendation_index: index,
        from: before,
        to: after,
        action: fctP1TrimText_(action, 220)
      });
    }
  });

  out.approval_required = recs.some(function(rec) {
    return !!(rec && rec.approval_required);
  });

  return {
    result: out,
    repairs: repairs
  };
}


function fctP1AssertRecommendationApprovals_(result) {
  const recs = Array.isArray(
    result && result.recommendations
  ) ? result.recommendations : [];

  recs.forEach(function(rec, index) {
    const action = String((rec && rec.action) || '');

    if (
      fctP1IsGovernedExternalActionText_(action) &&
      !(rec && rec.approval_required)
    ) {
      throw new Error(
        'Phase-1 approval contract failed: governed external action at recommendation ' +
        index + ' must have approval_required=true.'
      );
    }
  });

  return true;
}


function testFctPhase1ApprovalNormalizationNoApi() {
  const cases = [
    {
      action:
        'Suspend ad scaling on PLG609, PLG597(UAE/Kuwait) until physical stock is restored.',
      expected: true
    },
    {
      action:
        'Pause Meta ads for PLG597.',
      expected: true
    },
    {
      action:
        'Do not scale the Meta ads until physical stock is restored.',
      expected: true
    },
    {
      action:
        'Approve acquisition and integration of the missing live TikTok spend source.',
      expected: true
    },
    {
      action:
        'Request TFM and OTO remittance/settlement statements.',
      expected: true
    },
    {
      action:
        'Approve supplier evidence requests for the critical stock rows.',
      expected: true
    },
    {
      action:
        'Reroute Last Mile orders to another courier.',
      expected: true
    },
    {
      action:
        'Maintain final profit/SCALE decisions on HOLD until TikTok spend is available.',
      expected: false
    },
    {
      action:
        'Trigger a fresh internal Last Mile API poll.',
      expected: false
    },
    {
      action:
        'Internally reconcile courier cohorts.',
      expected: false
    }
  ];

  cases.forEach(function(x) {
    const actual =
      fctP1IsGovernedExternalActionText_(x.action);

    if (actual !== x.expected) {
      throw new Error(
        'Phase-1 approval classifier mismatch: "' +
        x.action + '" expected=' +
        x.expected + ' actual=' + actual
      );
    }
  });

  const exactLiveSentinel = {
    recommendations: [
      {
        action:
          'Integrate/confirm live TikTok spend feed before approving any Real Contribution, Operating Profit, or final Scale decision.',
        approval_required: false
      },
      {
        action:
          'Hold Last Mile scale/route reliance pending fresh poll and cohort/settlement reconciliation.',
        approval_required: false
      },
      {
        action:
          'Suspend ad scaling on PLG609, PLG597(UAE/Kuwait) until physical stock replenished; verify before any reorder claim.',
        approval_required: false
      }
    ],
    approval_required: false
  };

  const normalized =
    fctP1NormalizeRecommendationApprovals_(
      exactLiveSentinel,
      'AG012'
    );

  if (
    normalized.result.recommendations[2]
      .approval_required !== true
  ) {
    throw new Error(
      'Phase-1 exact live regression failed: Suspend ad scaling must require approval.'
    );
  }

  if (
    normalized.result.recommendations[1]
      .approval_required !== false
  ) {
    throw new Error(
      'Phase-1 exact live regression failed: internal Last Mile hold/review should remain approval=false.'
    );
  }

  fctP1AssertRecommendationApprovals_(
    normalized.result
  );

  Logger.log(
    'PHASE1_APPROVAL_NORMALIZATION_NO_API_PASS'
  );

  return true;
}


/**
 * ZERO-AI replay of the most recent compatible V4 hierarchy cache.
 *
 * Purpose:
 *   Re-validate the successful paid hierarchy run after deterministic
 *   governance/post-processing fixes, without calling Claude/OpenAI again.
 *
 * This does NOT create new AI evidence. It only re-processes cached outputs
 * from the already completed hierarchy run and verifies chain coherence.
 */
function replayFctPhase1LastValidationCacheNoApi() {
  const legacyVersion =
    '2026-09-10-P1-FINAL-V4';

  const sentinel =
    fctP1ReadLegacyCachedRunNoFingerprint_(
      'AG012',
      legacyVersion,
      'SENTINEL-V11-INTEGRATED-V2-DET-REPAIR'
    );

  const orbit =
    fctP1ReadLegacyCachedRunNoFingerprint_(
      'AG002',
      legacyVersion,
      'ORBIT-V6-INTEGRATED-V2-DET-REPAIR'
    );

  const atlas =
    fctP1ReadLegacyCachedRunNoFingerprint_(
      'AG001',
      legacyVersion,
      'ATLAS-V3-INTEGRATED-V2-DET-REPAIR'
    );

  if (!sentinel || !orbit || !atlas) {
    throw new Error(
      'Phase-1 cached validation replay unavailable: one or more V4 hierarchy cache entries are missing.'
    );
  }

  if (
    String(orbit.sentinel_run_id || '') !==
      String(sentinel.run_id || '') ||
    String(atlas.orbit_run_id || '') !==
      String(orbit.run_id || '')
  ) {
    throw new Error(
      'Phase-1 cached validation replay rejected: cached hierarchy run IDs do not form one coherent chain.'
    );
  }

  if (
    atlas.sentinel_run_id &&
    String(atlas.sentinel_run_id) !==
      String(sentinel.run_id || '')
  ) {
    throw new Error(
      'Phase-1 cached validation replay rejected: ATLAS sentinel_run_id does not match cached SENTINEL.'
    );
  }

  const s = fctP1NormalizeRecommendationApprovals_(
    JSON.parse(JSON.stringify(sentinel.result)),
    'AG012'
  );
  const o = fctP1NormalizeRecommendationApprovals_(
    JSON.parse(JSON.stringify(orbit.result)),
    'AG002'
  );
  const a = fctP1NormalizeRecommendationApprovals_(
    JSON.parse(JSON.stringify(atlas.result)),
    'AG001'
  );

  fctP1AssertRecommendationApprovals_(s.result);
  fctP1AssertRecommendationApprovals_(o.result);
  fctP1AssertRecommendationApprovals_(a.result);

  const atlasQuestions =
    Array.isArray(a.result.questions_for_abid)
      ? a.result.questions_for_abid
      : [];

  if (
    a.result.approval_required &&
    atlasQuestions.length === 0
  ) {
    throw new Error(
      'Phase-1 cached validation replay rejected: ATLAS has approval-required actions but no founder question.'
    );
  }

  const out = {
    status: 'PASS',
    mode:
      'ZERO_AI_CACHED_HIERARCHY_REPLAY',
    ai_calls_made: 0,
    source_orchestrator_version:
      legacyVersion,
    current_code_version:
      FCT_P1_ORCH_VERSION_,
    cached_chain: {
      sentinel_run_id: sentinel.run_id,
      orbit_run_id: orbit.run_id,
      atlas_run_id: atlas.run_id
    },
    approval_repairs: {
      AG012: s.repairs,
      AG002: o.repairs,
      AG001: a.repairs
    },
    final_approval_required:
      !!a.result.approval_required,
    atlas_summary:
      fctP1TrimText_(
        a.result.summary,
        900
      ),
    atlas_recommendations:
      (a.result.recommendations || [])
        .map(function(r) {
          return {
            action:
              fctP1TrimText_(
                r && r.action,
                260
              ),
            approval_required:
              !!(r && r.approval_required)
          };
        }),
    atlas_questions_for_abid:
      atlasQuestions.slice(0, 3),
    note:
      'No model call was made. This replay validates deterministic governance corrections against the already-paid V4 hierarchy outputs.'
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}


function fctP1ReadLegacyCachedRunNoFingerprint_(
  agentId,
  orchestratorVersion,
  agentVersion
) {
  const props =
    PropertiesService.getScriptProperties();
  const base =
    FCT_P1_CACHE_PREFIX_ + agentId;
  const metaRaw =
    props.getProperty(base + '_META');

  if (!metaRaw) return null;

  let meta;
  try {
    meta = JSON.parse(metaRaw);
  } catch (e) {
    return null;
  }

  if (
    !meta ||
    String(meta.orchestrator_version || '') !==
      String(orchestratorVersion || '') ||
    String(meta.agent_version || '') !==
      String(agentVersion || '') ||
    !meta.chunks ||
    meta.chunks < 1 ||
    meta.chunks > FCT_P1_CACHE_MAX_CHUNKS_
  ) {
    return null;
  }

  let payload = '';

  for (let i = 0; i < meta.chunks; i++) {
    const part =
      props.getProperty(
        base + '_C' + i
      );

    if (
      part === null ||
      part === undefined
    ) {
      return null;
    }

    payload += part;
  }

  try {
    const parsed = JSON.parse(payload);

    if (
      !parsed ||
      !parsed.run ||
      String(parsed.run.agent_id || '') !==
        String(agentId)
    ) {
      return null;
    }

    return parsed.run;
  } catch (e) {
    return null;
  }
}


function fctP1CacheBaseKey_(agentId) {
  return FCT_P1_CACHE_PREFIX_ + agentId;
}


function fctP1AgentVersion_(agentId) {
  const versions = {
    AG003: 'LEDGER-FINAL-COMPACT-V1',
    AG004: 'SCALE-FINAL-COMPACT-V1',
    AG005: 'ROUTE-FINAL-COMPACT-V1',
    AG006: 'STOCK-DYNAMIC-FINAL-COMPACT-V1',
    AG012: 'SENTINEL-V11-INTEGRATED-V2-DET-REPAIR',
    AG002: 'ORBIT-V6-INTEGRATED-V2-DET-REPAIR',
    AG001: 'ATLAS-V3-INTEGRATED-V2-DET-REPAIR'
  };
  return versions[agentId] || 'UNKNOWN';
}


// -----------------------------------------------------------------------------
// COMPACTION / FINGERPRINT / OUTPUT HELPERS
// -----------------------------------------------------------------------------

function fctP1SpecialistBriefs_(specialists) {
  const out = {};
  ['AG003', 'AG004', 'AG005', 'AG006']
    .forEach(function(agentId) {
      const r = specialists[agentId];
      out[agentId] = r
        ? {
            run_id: r.run_id,
            snapshot_status: r.snapshot_status,
            brief_source:
              r.brief_source || 'AI_SPECIALIST',
            result: fctP1CompactAgentResult_(r.result)
          }
        : null;
    });
  return out;
}


function fctP1UltraCompactSpecialistBriefs_(specialists) {
  const full = fctP1SpecialistBriefs_(specialists);
  const out = {};

  Object.keys(full).forEach(function(agentId) {
    const x = full[agentId];
    const r = x && x.result ? x.result : {};
    out[agentId] = {
      snapshot_status: x && x.snapshot_status,
      severity: r.severity,
      audit_status: r.audit_status,
      summary: fctP1TrimText_(r.summary, 500),
      findings: (r.findings || []).slice(0, 3).map(function(f) {
        return {
          title: f.title,
          detail: fctP1TrimText_(f.detail, 260),
          severity: f.severity
        };
      }),
      confidence: r.confidence
    };
  });

  return out;
}


function fctP1CompactAgentResult_(r) {
  r = r || {};
  return {
    run_id: r.run_id,
    agent_id: r.agent_id,
    as_of: r.as_of,
    source_freshness: r.source_freshness,
    audit_status: r.audit_status,
    severity: r.severity,
    summary: fctP1TrimText_(r.summary, 1800),
    findings: (r.findings || []).slice(0, 4).map(function(f) {
      return {
        title: fctP1TrimText_(f && f.title, 220),
        detail: fctP1TrimText_(f && f.detail, 650),
        severity: f && f.severity,
        evidence_refs:
          ((f && f.evidence_refs) || []).slice(0, 3)
      };
    }),
    evidence_refs: (r.evidence_refs || []).slice(0, 6),
    recommendations:
      (r.recommendations || []).slice(0, 3).map(function(x) {
        return {
          action: fctP1TrimText_(x && x.action, 600),
          why: fctP1TrimText_(x && x.why, 450),
          approval_required: !!(x && x.approval_required),
          owner: x && x.owner
        };
      }),
    approval_required: !!r.approval_required,
    questions_for_abid:
      (r.questions_for_abid || []).slice(0, 3)
        .map(function(x) { return fctP1TrimText_(x, 500); }),
    confidence: r.confidence,
    provisional_fields:
      (r.provisional_fields || []).slice(0, 8),
    next_check: fctP1TrimText_(r.next_check, 700)
  };
}


function fctP1CompactRuntime_(runtime) {
  runtime = runtime || {};
  return {
    provider: runtime.provider,
    model: runtime.model,
    effort: runtime.effort,
    failed_over: runtime.failed_over,
    usage: runtime.usage
  };
}


function fctP1CompactRunForOutput_(run) {
  if (!run) return null;
  return {
    run_id: run.run_id,
    agent_id: run.agent_id,
    snapshot_status: run.snapshot_status,
    packet_status: run.packet_status,
    cache_reused: !!run.cache_reused,
    runtime: run.runtime,
    recovery_retry: !!run.recovery_retry,
    deterministic_repairs:
      run.deterministic_repairs || [],
    result: run.result
  };
}


function fctP1CompactDQ_(dq, limit) {
  dq = dq || {};
  return {
    status: dq.status,
    flags: (dq.flags || []).slice(0, limit || 10)
      .map(function(f) {
        return {
          severity: f && f.severity,
          code: f && f.code,
          courier: f && f.courier,
          detail: fctP1TrimText_(f && f.detail, 300)
        };
      })
  };
}


function fctP1AssertAIResult_(agentId, aiRun) {
  if (!aiRun || !aiRun.result) {
    throw new Error(
      'Phase-1 AI runtime returned no structured result for ' + agentId + '.'
    );
  }
  if (aiRun.result.agent_id !== agentId) {
    throw new Error(
      'Phase-1 AI identity contract failed for ' + agentId +
      ': got ' + String(aiRun.result.agent_id || '')
    );
  }
  return true;
}


function fctP1AssertMaterialOutput_(agentId, result) {
  result = result || {};
  const sev = String(result.severity || '').toUpperCase();
  if (/WATCH|ACT_NOW|CRITICAL/.test(sev) &&
      (!Array.isArray(result.findings) || !result.findings.length)) {
    throw new Error(
      'Phase-1 output contract failed: material severity without findings for ' + agentId + '.'
    );
  }
  if ((result.findings || []).length > 4 ||
      (result.recommendations || []).length > 3) {
    throw new Error(
      'Phase-1 output contract failed: bounded structure exceeded for ' + agentId + '.'
    );
  }
  return true;
}


function fctP1AssertStockCriticalCoverage_(criticalRows, result) {
  const text = JSON.stringify({
    findings: (result && result.findings) || [],
    summary: (result && result.summary) || ''
  });

  const missing = [];
  (criticalRows || []).forEach(function(x) {
    const key = fctP1MarketSkuKey_(x);
    if (!fctP1TextHasMarketSku_(text, x.country, x.sku)) {
      missing.push(key);
    }
  });

  if (missing.length) {
    throw new Error(
      'STOCK specialist omitted deterministic critical stock: ' +
      missing.join(', ')
    );
  }
  return true;
}


function fctP1StockKeys_(rows) {
  return (rows || []).map(fctP1MarketSkuKey_).sort();
}


function fctP1MarketSkuKey_(x) {
  return [
    String((x && x.country) || '').trim().toLowerCase(),
    String((x && x.sku) || '').trim().toUpperCase()
  ].join('|');
}


function fctP1TextHasMarketSku_(text, country, sku) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const aliases = c.indexOf('united arab emirates') >= 0
    ? ['UAE', 'United Arab Emirates']
    : (c.indexOf('kuwait') >= 0
        ? ['Kuwait', 'KWT']
        : [country]);

  return aliases.some(function(alias) {
    const a = fctP1EscapeRegex_(alias);
    const k = fctP1EscapeRegex_(sku);
    return new RegExp(
      '\\b' + a + '\\b.{0,160}\\b' + k + '\\b|' +
      '\\b' + k + '\\b.{0,160}\\b' + a + '\\b',
      'i'
    ).test(s);
  });
}


function fctP1Fingerprint_(version, obj) {
  const stable = fctP1StableStringify_({
    version: version,
    payload: fctP1NormalizeFingerprintValue_(obj)
  });
  return fctP1HashString_(stable);
}


function fctP1NormalizeFingerprintValue_(value, keyName) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(function(x) {
      return fctP1NormalizeFingerprintValue_(x, '');
    });
  }

  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(function(k) {
      // These fields move with wall-clock time even when business state did not.
      // Freshness transitions are retained through freshness_status itself.
      if (k === 'generated_at') {
        return;
      }
      if (k === 'poll_age_hours') {
        out[k] = fctP1AgeBucket_(value[k]);
        return;
      }
      out[k] = fctP1NormalizeFingerprintValue_(value[k], k);
    });
    return out;
  }

  if (typeof value === 'string') {
    if (/poll|stale|freshness/i.test(value)) {
      return value.replace(
        /\b(\d+(?:\.\d+)?)\s*(?:h|hours?)\b/gi,
        function(_, n) {
          return '<' + fctP1AgeBucket_(Number(n)) + '>';
        }
      );
    }
    return value;
  }

  return value;
}


function fctP1AgeBucket_(value) {
  const n = Number(value);
  if (!isFinite(n)) return 'AGE_UNKNOWN';
  if (n < 24) return 'AGE_LT_24H';
  if (n < 48) return 'AGE_24_48H';
  if (n < 72) return 'AGE_48_72H';
  return 'AGE_72H_PLUS';
}


function fctP1StableStringify_(value) {
  if (value === null || value === undefined) {
    return value === undefined ? 'null' : 'null';
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return '[' + value.map(function(x) {
      return fctP1StableStringify_(x);
    }).join(',') + ']';
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map(function(k) {
      return JSON.stringify(k) + ':' +
        fctP1StableStringify_(value[k]);
    }).join(',') + '}';
  }

  return JSON.stringify(value);
}


function fctP1HashString_(text) {
  const s = String(text || '');
  let h1 = 2166136261;
  let h2 = 5381;

  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 = ((h2 << 5) + h2) ^ c;
  }

  return [
    (h1 >>> 0).toString(16),
    (h2 >>> 0).toString(16),
    s.length.toString(16)
  ].join('-');
}


function fctP1TrimText_(value, maxLen) {
  const s = String(
    value === undefined || value === null ? '' : value
  );
  const n = Number(maxLen || 300);
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}


function fctP1EscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

// =============================================================================
// SELF-CONTAINED HIERARCHY GOVERNANCE HELPERS
// Snapshot-copied and namespaced from the validated Sentinel/Orbit/Atlas layers.
// The final orchestrator MUST NOT depend on version-specific helper functions
// living in separate hierarchy files.
// =============================================================================

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelIsOutputCompletionError_(err) {
  const s = String(
    (err && err.message) || err || ''
  );

  return (
    /max_output_tokens/i.test(s) ||
    /max_tokens/i.test(s) ||
    /before completing structured JSON/i.test(s) ||
    /structured output.*incomplete/i.test(s) ||
    /schema\/output completion/i.test(s)
  );
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelBuildAIContext_(
  packet,
  ultraCompact
) {
  const p = packet || {};
  const ledger = p.ledger || {};
  const scale = p.scale || {};
  const route = p.route || {};
  const stock = p.stock || {};

  const compactPacket = {
    overall_source_status:
      p.overall_source_status,
    source_statuses:
      p.source_statuses,
    deterministic_cross_checks:
      p.deterministic_cross_checks,

    ledger: {
      period: ledger.period,
      economics:
        fctP1EmbeddedSentinelPick_(
          ledger.economics,
          [
            'orders_picked_mtd',
            'delivered_unpaid_mtd',
            'paid_mtd',
            'rrto_mtd',
            'finalized_delivery_success',
            'delivered_revenue_aed',
            'gross_contribution_aed',
            'meta_platform_spend_aed',
            'meta_not_represented_in_daily_pnl_aed',
            'contribution_after_all_meta_aed',
            'tiktok_spend_aed',
            'real_contribution_profit_aed',
            'real_contribution_status',
            'real_operating_profit_aed',
            'real_operating_profit_status',
            'courier_receivable_aed'
          ]
        ),
      cash_reconciliation:
        ledger.cash_reconciliation,
      data_quality:
        fctP1EmbeddedSentinelCompactDQ_(
          ledger.data_quality,
          ultraCompact ? 5 : 8
        )
    },

    scale: {
      channel_completeness:
        scale.channel_completeness,
      meta: scale.meta,
      courier_scale_gates:
        scale.courier_scale_gates,
      data_quality:
        fctP1EmbeddedSentinelCompactDQ_(
          scale.data_quality,
          ultraCompact ? 5 : 8
        )
    },

    route: {
      live_courier_view:
        route.live_courier_view,
      settlement_reconciliation:
        route.settlement_reconciliation,
      normalized_order_view:
        ultraCompact
          ? []
          : route.normalized_order_view,
      data_quality:
        fctP1EmbeddedSentinelCompactDQ_(
          route.data_quality,
          ultraCompact ? 6 : 10
        )
    },

    stock: {
      inventory_summary:
        stock.inventory_summary,
      critical_stock:
        (stock.critical_stock || [])
          .slice(0, 10),
      watch_stock:
        (stock.watch_stock || [])
          .slice(0, ultraCompact ? 5 : 8),
      inbound_visibility:
        stock.inbound_visibility,
      meta_market_attribution:
        stock.meta_market_attribution,
      reconciliation_exceptions:
        ultraCompact
          ? []
          : (stock.reconciliation_exceptions || [])
              .slice(0, 8),
      data_quality:
        fctP1EmbeddedSentinelCompactDQ_(
          stock.data_quality,
          ultraCompact ? 6 : 10
        )
    },

    locked_interpretation_rules:
      p.locked_interpretation_rules
  };

  return {
    phase1_audit_packet: compactPacket,
    governance: {
      mode: 'AUDIT_ONLY',
      may_execute: false,
      final_authority: 'Abid',
      reporting_chain:
        'Domain Agents -> SENTINEL -> ORBIT -> ATLAS -> Abid',
      source_precedence: [
        'DETERMINISTIC_SOURCE_AND_CONTROL_DATA',
        'DETERMINISTIC_CROSS_CHECKS',
        'CURRENT_ALERTS_AND_RECONCILIATION_STATUS',
        'AI_AUDIT'
      ]
    },
    phase_note:
      ultraCompact
        ? 'Structured-output recovery context. Source truth is unchanged; only nonessential detail was removed.'
        : 'Compact Step 6I SENTINEL context. Full deterministic packet remains available to runtime guards outside the AI prompt.'
  };
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelCompactDQ_(dq, limit) {
  const x = dq || {};
  const flags = Array.isArray(x.flags)
    ? x.flags
    : [];

  const ranked = flags.slice().sort(function(a, b) {
    const rank = {
      FAIL: 0,
      CRITICAL: 0,
      ACT_NOW: 1,
      REVIEW: 2,
      WATCH: 2,
      NORMAL: 3
    };

    const aa = String(
      (a && a.severity) || ''
    ).toUpperCase();

    const bb = String(
      (b && b.severity) || ''
    ).toUpperCase();

    return (
      (rank[aa] === undefined ? 9 : rank[aa]) -
      (rank[bb] === undefined ? 9 : rank[bb])
    );
  });

  return {
    status: x.status,
    flags: ranked
      .slice(0, limit || 8)
      .map(function(f) {
        return {
          severity: f && f.severity,
          code: f && f.code,
          detail:
            fctP1EmbeddedSentinelTrimText_(
              f && f.detail,
              220
            )
        };
      })
  };
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelPick_(obj, keys) {
  const src = obj || {};
  const out = {};

  (keys || []).forEach(function(k) {
    if (Object.prototype.hasOwnProperty.call(
          src,
          k
        )) {
      out[k] = src[k];
    }
  });

  return out;
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelTrimText_(value, maxLen) {
  const s = String(
    value === undefined ||
    value === null
      ? ''
      : value
  );

  const n = Number(maxLen || 220);

  return s.length <= n
    ? s
    : s.slice(0, n - 1) + '…';
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelStockClassification_(stock) {
  return {
    critical_keys: fctP1EmbeddedSentinelStockKeys_(
      (stock && stock.critical_stock) || []
    ),
    watch_keys: fctP1EmbeddedSentinelStockKeys_(
      (stock && stock.watch_stock) || []
    )
  };
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelStockKeys_(rows) {
  return (rows || []).map(function(x) {
    return String((x && x.country) || '').trim() + '|' +
      String((x && x.sku) || '').trim().toUpperCase();
  }).filter(function(x) {
    return x !== '|';
  }).sort();
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelAssertCriticalCountClaims_(criticalRows, result) {
  const actual = (criticalRows || []).length;
  const text = JSON.stringify(result || {});
  const words = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const re = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b\s+(?:deterministic\s+)?critical(?:[- ]stock)?\s+(?:rows?|risks?|exposures?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = String(m[1] || '').toLowerCase();
    const claimed = Object.prototype.hasOwnProperty.call(words, raw)
      ? words[raw]
      : Number(raw);
    if (isFinite(claimed) && claimed !== actual) {
      throw new Error(
        'SENTINEL stock-severity contract failed: narrative claims ' +
        claimed + ' critical stock rows/risks but deterministic packet has ' +
        actual + '.'
      );
    }
  }
  return true;
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelAssertWatchRowsNotPromoted_(watchRows, result) {
  const text = JSON.stringify(result || {});
  const upper = text.toUpperCase();

  (watchRows || []).forEach(function(x) {
    const sku = String((x && x.sku) || '').trim().toUpperCase();
    if (!sku) return;

    let pos = upper.indexOf(sku);
    while (pos >= 0) {
      const start = Math.max(0, pos - 110);
      const end = Math.min(upper.length, pos + sku.length + 110);
      const windowText = upper.slice(start, end);
      const skuLocal = pos - start;
      const labels = [];
      const patterns = [
        { type: 'CRITICAL', re: /\bCRITICAL\b|\bOUT OF STOCK\b|\bOOS\b|\bACT[_ ]NOW\b|≤\s*3|<=\s*3/g },
        { type: 'WATCH', re: /\bWATCH\b|\bREORDER\b|≤\s*7|<=\s*7/g }
      ];

      patterns.forEach(function(spec) {
        spec.re.lastIndex = 0;
        let m;
        while ((m = spec.re.exec(windowText)) !== null) {
          labels.push({ type: spec.type, distance: Math.abs(m.index - skuLocal) });
        }
      });

      if (labels.length) {
        labels.sort(function(a, b) { return a.distance - b.distance; });
        if (labels[0].type === 'CRITICAL') {
          throw new Error(
            'SENTINEL stock-severity contract failed: WATCH row ' +
            sku + ' was described with a CRITICAL/OOS/ACT_NOW label.'
          );
        }
      }
      pos = upper.indexOf(sku, pos + sku.length);
    }
  });
  return true;
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelAssertCriticalStockCoverage_(
  criticalRows,
  findings
) {
  const findingText = (findings || []).map(function(f) {
    return [
      String((f && f.title) || ''),
      String((f && f.detail) || '')
    ].join(' ');
  }).join(' ');

  const missing = [];

  (criticalRows || []).forEach(function(x) {
    const country = String((x && x.country) || '').trim();
    const sku = String((x && x.sku) || '').trim().toUpperCase();

    if (!country || !sku) return;

    if (!fctP1EmbeddedSentinelHasCountrySkuMention_(
          findingText,
          country,
          sku
        )) {
      missing.push(country + ' ' + sku);
    }
  });

  if (missing.length) {
    throw new Error(
      'SENTINEL completeness contract failed: deterministic critical stock omitted from findings: ' +
      missing.join(', ')
    );
  }

  return true;
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelHasCountrySkuMention_(
  text,
  country,
  sku
) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const p = String(sku || '').toUpperCase();

  const aliases =
    c.indexOf('united arab emirates') >= 0
      ? ['UAE', 'United Arab Emirates']
      : (c.indexOf('kuwait') >= 0
          ? ['Kuwait', 'KWT']
          : [country]);

  return aliases.some(function(alias) {
    const a = fctP1EmbeddedSentinelEscapeRegex_(alias);
    const k = fctP1EmbeddedSentinelEscapeRegex_(p);

    return (
      new RegExp(
        '\\b' + a + '\\b.{0,140}\\b' + k + '\\b',
        'i'
      ).test(s) ||
      new RegExp(
        '\\b' + k + '\\b.{0,140}\\b' + a + '\\b',
        'i'
      ).test(s)
    );
  });
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelEscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelEnforceLockedGovernance_(result) {
  if (!result || typeof result !== 'object') {
    throw new Error(
      'SENTINEL governance enforcement failed: invalid result object.'
    );
  }

  // 1) Questions are allowed to request missing evidence or explicit approval.
  // They are NOT allowed to renegotiate locked business rules.
  const rawQuestions = Array.isArray(result.questions_for_abid)
    ? result.questions_for_abid
    : [];

  result.questions_for_abid = rawQuestions.filter(function(q) {
    const s = String(q || '');

    return !fctP1EmbeddedSentinelQuestionAsksTikTokBypass_(s) &&
      !fctP1EmbeddedSentinelMakesMarketMetaStockPrereq_(s);
  });

  // 2) Recommendation approval semantics are deterministic.
  const recs = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  recs.forEach(function(rec) {
    const action = String((rec && rec.action) || '');
    const externalAction =
      fctP1EmbeddedSentinelIsExternalApprovalAction_(action);
    const internalRefresh =
      fctP1EmbeddedSentinelIsInternalRefreshAction_(action);
    const pureInternalHold =
      fctP1EmbeddedSentinelIsPureInternalHold_(action);

    if (externalAction && internalRefresh) {
      throw new Error(
        'SENTINEL recommendation contract failed: mixed internal and external actions must be split.'
      );
    }

    if (externalAction) {
      rec.approval_required = true;
    } else if (pureInternalHold || internalRefresh) {
      rec.approval_required = false;
    }
  });

  if (recs.length > 3) {
    throw new Error(
      'SENTINEL output contract failed: maximum 3 recommendations allowed.'
    );
  }

  if (Array.isArray(result.findings) &&
      result.findings.length > 4) {
    throw new Error(
      'SENTINEL output contract failed: maximum 4 findings allowed.'
    );
  }

  result.approval_required = recs.some(function(rec) {
    return !!(rec && rec.approval_required);
  });

  // 2) Narrative/recommendation content is stricter.
  // If the model actually recommends bypassing a locked rule,
  // fail the run rather than silently editing the decision logic.
  const narrativeParts = [];

  narrativeParts.push(String(result.summary || ''));

  (Array.isArray(result.findings) ? result.findings : [])
    .forEach(function(x) {
      narrativeParts.push(String((x && x.title) || ''));
      narrativeParts.push(String((x && x.detail) || ''));
    });

  (Array.isArray(result.recommendations) ? result.recommendations : [])
    .forEach(function(x) {
      narrativeParts.push(String((x && x.action) || ''));
      narrativeParts.push(String((x && x.why) || ''));
    });

  narrativeParts.forEach(function(s) {
    if (fctP1EmbeddedSentinelAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'SENTINEL governance contract failed: narrative attempted to bypass the locked TikTok blocker.'
      );
    }

    if (fctP1EmbeddedSentinelMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'SENTINEL governance contract failed: narrative made Kuwait Meta linkage a replenishment prerequisite.'
      );
    }
  });

  return result;
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelIsExternalApprovalAction_(text) {
  const s = String(text || '');
  if (!s) return false;

  if (fctP1IsGovernedExternalActionText_(s)) {
    return true;
  }

  // Direct human/business communication.
  if (
    /\b(contact|email|message|call|whatsapp|send to)\b.{0,90}\b(courier|supplier|driver|customer|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(courier|supplier|driver|customer|TFM|OTO|C3X|Last Mile)\b.{0,90}\b(contact|email|message|call|whatsapp)\b/i.test(s)
  ) {
    return true;
  }

  // Request/obtain documentary evidence FROM an external party.
  if (
    /\b(request|ask|obtain|get)\b.{0,90}\b(remittance|settlement|statement|invoice|proof|document|evidence)\b.{0,90}\b(from|of)\b.{0,60}\b(courier|supplier|driver|customer|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(request|ask|obtain|get)\b.{0,90}\b(TFM|OTO|C3X|Last Mile)\b.{0,90}\b(remittance|settlement|statement|invoice|proof|document|evidence)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  // Operational/business changes always need approval.
  return /\b(place|approve|commit|pay|transfer|pause|stop|scale|change|reroute|reassign|refund|release)\b.{0,90}\b(PO|purchase|order|stock|ads?|routing|courier|payment|campaign|money|refund)\b/i.test(s);
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelIsInternalRefreshAction_(text) {
  const s = String(text || '');
  if (!s) return false;

  return (
    /\b(refresh|repoll|reconcile|compare|review|audit)\b.{0,90}\b(data|feed|API|courier view|records|cohort|snapshot)\b/i.test(s) ||
    /\b(poll|repoll)\b.{0,90}\b(API|feed|courier view|data|snapshot|Last Mile|C3X|OTO|TFM)\b/i.test(s) ||
    /\bfresh\b.{0,40}\b(poll|API poll|data poll)\b/i.test(s)
  );
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelIsPureInternalHold_(text) {
  const s = String(text || '');
  if (!s) return false;

  return (
    /\b(hold|keep)\b.{0,120}\b(conclusion|calculation|decision|go[- ]?no[- ]?go|Real Contribution|Operating Profit|SCALE)\b/i.test(s) &&
    !fctP1EmbeddedSentinelIsExternalApprovalAction_(s)
  );
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelQuestionAsksTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Explicit prohibitions preserve the locked rule.
  if (
    /\b(do not|don't|must not|should not|cannot|can't|never)\b.{0,70}\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  // Questions that explicitly preserve the blocker are safe.
  if (
    /\b(can|should|may|could)\b.{0,60}\b(scale|scaling|final scale decision)\b.{0,80}\b(only after|once|after)\b.{0,60}\bTikTok\b/i.test(s) ||
    /\bTikTok\b.{0,60}\b(required|must be available|must be integrated)\b.{0,80}\b(before)\b.{0,60}\b(scale|scaling)\b/i.test(s)
  ) {
    return false;
  }

  return (
    /\b(can|should|may|could)\b.{0,50}\b(scale|scaling|final scale decision)\b.{0,80}\b(proceed|continue|go ahead)\b.{0,80}\b(without|despite|before|pending|missing|absent)\b.{0,40}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,50}\b(proceed|continue|go ahead)\b.{0,80}\b(with|on)\b.{0,40}\b(scale|scaling)\b.{0,80}\b(without|despite|missing)\b.{0,40}\bTikTok\b/i.test(s) ||
    /\b(override|bypass|relax|waive)\b.{0,50}\b(TikTok|hard block|blocker)\b/i.test(s)
  );
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelAdvocatesTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Safe/required language must never be treated as a bypass.
  if (
    /\b(do not|don't|must not|cannot|can't|should not|never|hold|blocked|remain blocked|keep .* hold)\b.{0,100}\b(scale|scaling|go[- ]?no[- ]?go|override|bypass|relax|waive)\b/i.test(s) ||
    /\b(scale|scaling|go[- ]?no[- ]?go)\b.{0,100}\b(blocked|hold|must wait|until .*TikTok|pending .*TikTok)\b/i.test(s) ||
    /\b(do not|don't|must not|never)\b.{0,60}\b(override|bypass|relax|waive)\b.{0,60}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  // Fail only on explicit positive permission to make a FINAL scale decision
  // despite absent TikTok spend.
  const positiveScale =
    /\b(allow|approve|authorize|proceed|continue|go ahead|greenlight|scale)\b.{0,80}\b(scale|scaling|go[- ]?no[- ]?go|final scale decision)\b/i.test(s) ||
    /\b(scale|scaling|final scale decision)\b.{0,80}\b(proceed|continue|go ahead|greenlight|approved|allowed)\b/i.test(s);

  const missingTikTok =
    /\b(without|despite|before|pending|missing|absent|unavailable)\b.{0,50}\bTikTok\b/i.test(s) ||
    /\bTikTok\b.{0,50}\b(missing|absent|unavailable|not available|not integrated)\b/i.test(s);

  const directOverride =
    /\b(override|bypass|relax|waive)\b.{0,50}\b(TikTok|hard block|blocker)\b/i.test(s);

  return directOverride || (positiveScale && missingTikTok);
}

// Embedded from AgentSentinelPhase1Runner_v11.gs
function fctP1EmbeddedSentinelMakesMarketMetaStockPrereq_(text) {
  const s = String(text || '');
  if (!s) return false;

  if (
    /\b(not|isn't|is not|should not|must not|never)\b.{0,100}\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,120}\b(prerequisite|required|before)\b.{0,120}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,80}\b(is not|isn't|not)\b.{0,50}\b(required|a prerequisite|prerequisite)\b.{0,100}\b(before|for)\b.{0,100}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,100}\b(classification only|ad[- ]activity classification|not a prerequisite)\b/i.test(s)
  ) {
    return false;
  }

  const metaLinkage =
    /\b(Meta|market[- ]?linkage|ad[- ]?activity|market activity)\b/i.test(s);
  const stockAction =
    /\b(replenish|replenishment|restock|stock action|inventory action|stock commitment|purchase order|PO)\b/i.test(s);
  const prereq =
    /\b(required|prerequisite|must confirm|must prove|need to confirm|need to prove)\b.{0,100}\b(before|prior to)\b/i.test(s) ||
    /\b(before|prior to)\b.{0,100}\b(required|confirm|prove)\b/i.test(s);

  return metaLinkage && stockAction && prereq;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitEnforceGovernance_(result, packet) {
  if (!result || typeof result !== 'object') {
    throw new Error(
      'ORBIT governance enforcement failed: invalid result object.'
    );
  }

  const severity = String(result.severity || '').toUpperCase();
  const material =
    severity === 'WATCH' ||
    severity === 'ACT_NOW' ||
    severity === 'CRITICAL';

  if (material &&
      (!Array.isArray(result.findings) ||
       result.findings.length === 0)) {
    throw new Error(
      'ORBIT output contract failed: material severity with no findings.'
    );
  }

  if (Array.isArray(result.findings) &&
      result.findings.length > 4) {
    throw new Error(
      'ORBIT output contract failed: maximum 4 findings allowed.'
    );
  }

  if (Array.isArray(result.recommendations) &&
      result.recommendations.length > 3) {
    throw new Error(
      'ORBIT output contract failed: maximum 3 recommendations allowed.'
    );
  }

  const criticalRows =
    (packet && packet.stock && packet.stock.critical_stock) || [];

  fctP1EmbeddedOrbitAssertCriticalStockCoverage_(
    criticalRows,
    result
  );

  fctP1EmbeddedOrbitAssertCriticalCountClaims_(
    criticalRows,
    result
  );

  fctP1EmbeddedOrbitAssertWatchRowsNotPromoted_(
    (packet && packet.stock && packet.stock.watch_stock) || [],
    result
  );

  const narrative = fctP1EmbeddedOrbitNarrativeParts_(result);

  narrative.forEach(function(s) {
    if (fctP1EmbeddedOrbitAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'ORBIT governance contract failed: locked TikTok blocker was weakened or bypassed.'
      );
    }

    if (fctP1EmbeddedOrbitMisstatesLastMileFreshness_(s, packet)) {
      throw new Error(
        'ORBIT data-quality contract failed: stale Last Mile data was presented as fresh/current.'
      );
    }

    if (fctP1EmbeddedOrbitAssertsUnconfirmedCourierShortage_(s)) {
      throw new Error(
        'ORBIT finance contract failed: TFM/OTO screening difference was presented as a confirmed shortage/loss/debt.'
      );
    }

    if (fctP1EmbeddedOrbitMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'ORBIT stock contract failed: Kuwait Meta linkage was made a prerequisite for physical stock-risk action.'
      );
    }
  });

  const rawQuestions = Array.isArray(result.questions_for_abid)
    ? result.questions_for_abid
    : [];

  result.questions_for_abid = rawQuestions.filter(function(q) {
    const s = String(q || '');
    return !fctP1EmbeddedOrbitQuestionAsksTikTokBypass_(s) &&
      !fctP1EmbeddedOrbitMakesMarketMetaStockPrereq_(s);
  });

  const recs = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  recs.forEach(function(rec) {
    const action = String((rec && rec.action) || '');
    const external = fctP1EmbeddedOrbitIsExternalApprovalAction_(action, packet);
    const internal = fctP1EmbeddedOrbitIsInternalAction_(action, packet);
    const pureHold = fctP1EmbeddedOrbitIsPureInternalHold_(action, packet);

    if (external && internal) {
      throw new Error(
        'ORBIT recommendation contract failed: internal and external actions must be split.'
      );
    }

    if (external) {
      rec.approval_required = true;
    } else if (internal || pureHold) {
      rec.approval_required = false;
    }
  });

  result.approval_required = recs.some(function(rec) {
    return !!(rec && rec.approval_required);
  });

  const sentinelAudit = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.audit_status || ''
  ).toUpperCase();

  if (sentinelAudit === 'FAIL') {
    result.audit_status = 'FAIL';
  }

  const sentinelSeverity = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.severity || ''
  ).toUpperCase();

  const severityRank = {
    NORMAL: 0,
    WATCH: 1,
    ACT_NOW: 2,
    CRITICAL: 3
  };

  const orbitSeverity = String(result.severity || '').toUpperCase();

  if (severityRank[sentinelSeverity] !== undefined &&
      (severityRank[orbitSeverity] === undefined ||
       severityRank[orbitSeverity] < severityRank[sentinelSeverity])) {
    result.severity = sentinelSeverity;
  }

  const sentinelFreshness = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.source_freshness || ''
  ).toUpperCase();

  if (sentinelFreshness && sentinelFreshness !== 'FRESH') {
    result.source_freshness = sentinelFreshness;
  }

  const sentinelConfidence = String(
    packet && packet.sentinel_audit &&
    packet.sentinel_audit.confidence || ''
  ).toUpperCase();

  if (sentinelConfidence === 'LOW') {
    result.confidence = 'LOW';
  } else if (sentinelConfidence === 'MEDIUM' &&
             String(result.confidence || '').toUpperCase() === 'HIGH') {
    result.confidence = 'MEDIUM';
  }

  const inheritedProvisional =
    packet && packet.sentinel_audit &&
    Array.isArray(packet.sentinel_audit.provisional_fields)
      ? packet.sentinel_audit.provisional_fields
      : [];

  const ownProvisional = Array.isArray(result.provisional_fields)
    ? result.provisional_fields
    : [];

  result.provisional_fields = ownProvisional
    .concat(inheritedProvisional)
    .filter(function(x, i, arr) {
      return arr.indexOf(x) === i;
    });

  return result;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitNarrativeParts_(result) {
  const out = [];
  out.push(String((result && result.summary) || ''));

  (Array.isArray(result.findings) ? result.findings : [])
    .forEach(function(x) {
      out.push(String((x && x.title) || ''));
      out.push(String((x && x.detail) || ''));
    });

  (Array.isArray(result.recommendations)
    ? result.recommendations
    : []).forEach(function(x) {
      out.push(String((x && x.action) || ''));
      out.push(String((x && x.why) || ''));
    });

  return out;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitStockClassification_(stock) {
  return {
    critical_keys: fctP1EmbeddedOrbitStockKeys_(
      (stock && stock.critical_stock) || []
    ),
    watch_keys: fctP1EmbeddedOrbitStockKeys_(
      (stock && stock.watch_stock) || []
    )
  };
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitStockKeys_(rows) {
  return (rows || []).map(function(x) {
    return String((x && x.country) || '').trim() + '|' +
      String((x && x.sku) || '').trim().toUpperCase();
  }).filter(function(x) {
    return x !== '|';
  }).sort();
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitAssertCriticalCountClaims_(criticalRows, result) {
  const actual = (criticalRows || []).length;
  const text = JSON.stringify(result || {});
  const words = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const re = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b\s+(?:deterministic\s+)?critical(?:[- ]stock)?\s+(?:rows?|risks?|exposures?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = String(m[1] || '').toLowerCase();
    const claimed = Object.prototype.hasOwnProperty.call(words, raw)
      ? words[raw]
      : Number(raw);
    if (isFinite(claimed) && claimed !== actual) {
      throw new Error(
        'ORBIT stock-severity contract failed: narrative claims ' +
        claimed + ' critical stock rows/risks but deterministic packet has ' +
        actual + '.'
      );
    }
  }
  return true;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitAssertWatchRowsNotPromoted_(watchRows, result) {
  const text = JSON.stringify(result || {});
  const upper = text.toUpperCase();

  (watchRows || []).forEach(function(x) {
    const sku = String((x && x.sku) || '').trim().toUpperCase();
    if (!sku) return;

    let pos = upper.indexOf(sku);
    while (pos >= 0) {
      const start = Math.max(0, pos - 110);
      const end = Math.min(upper.length, pos + sku.length + 110);
      const windowText = upper.slice(start, end);
      const skuLocal = pos - start;
      const labels = [];
      const patterns = [
        { type: 'CRITICAL', re: /\bCRITICAL\b|\bOUT OF STOCK\b|\bOOS\b|\bACT[_ ]NOW\b|≤\s*3|<=\s*3/g },
        { type: 'WATCH', re: /\bWATCH\b|\bREORDER\b|≤\s*7|<=\s*7/g }
      ];

      patterns.forEach(function(spec) {
        spec.re.lastIndex = 0;
        let m;
        while ((m = spec.re.exec(windowText)) !== null) {
          labels.push({ type: spec.type, distance: Math.abs(m.index - skuLocal) });
        }
      });

      if (labels.length) {
        labels.sort(function(a, b) { return a.distance - b.distance; });
        if (labels[0].type === 'CRITICAL') {
          throw new Error(
            'ORBIT stock-severity contract failed: WATCH row ' +
            sku + ' was described with a CRITICAL/OOS/ACT_NOW label.'
          );
        }
      }
      pos = upper.indexOf(sku, pos + sku.length);
    }
  });
  return true;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitAssertCriticalStockCoverage_(criticalRows, result) {
  const text = [
    String((result && result.summary) || ''),
    fctP1EmbeddedOrbitNarrativeParts_(result).join(' ')
  ].join(' ');

  const missing = [];

  (criticalRows || []).forEach(function(x) {
    const country = String((x && x.country) || '').trim();
    const sku = String((x && x.sku) || '').trim().toUpperCase();

    if (!country || !sku) return;

    if (!fctP1EmbeddedOrbitHasCountrySkuMention_(text, country, sku)) {
      missing.push(country + ' ' + sku);
    }
  });

  if (missing.length) {
    throw new Error(
      'ORBIT completeness contract failed: critical stock omitted from supervisor brief: ' +
      missing.join(', ')
    );
  }

  return true;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitHasCountrySkuMention_(text, country, sku) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const k = fctP1EmbeddedOrbitEscapeRegex_(String(sku || '').toUpperCase());

  const aliases = c.indexOf('united arab emirates') >= 0
    ? ['UAE', 'United Arab Emirates']
    : (c.indexOf('kuwait') >= 0
      ? ['Kuwait', 'KWT']
      : [country]);

  return aliases.some(function(alias) {
    const a = fctP1EmbeddedOrbitEscapeRegex_(alias);
    return (
      new RegExp('\\b' + a + '\\b.{0,160}\\b' + k + '\\b', 'i').test(s) ||
      new RegExp('\\b' + k + '\\b.{0,160}\\b' + a + '\\b', 'i').test(s)
    );
  });
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitAdvocatesTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Explicit statements preserving the locked block are safe.
  if (
    /\b(do not|don't|must not|cannot|can't|should not|never)\b.{0,80}\b(override|bypass|relax|waive)\b.{0,80}\b(TikTok|hard block|blocker)\b/i.test(s) ||
    /\b(final\s+)?(scale|scaling|go[- ]?no[- ]?go|scale decision)\b.{0,120}\b(remain(?:s)?|stay(?:s)?|keep|is|are)?\s*(blocked|on hold|hold|must wait)\b.{0,120}\b(TikTok|live spend|spend feed|active-channel spend)\b/i.test(s) ||
    /\b(blocked|hold|on hold|must wait)\b.{0,120}\b(until|pending)\b.{0,80}\b(TikTok|live spend|spend feed|active-channel spend)\b/i.test(s)
  ) {
    return false;
  }

  // Acquiring/integrating the missing TikTok source in order to unblock
  // a later decision is compliant; it does not authorize scaling now.
  if (
    /\b(approve|authorize|acquire|integrate|connect|configure|enable|restore|set up)\b.{0,120}\b(TikTok|spend feed|spend source|active-channel spend)\b.{0,160}\b(unblock|enable|restore|support|permit)\b.{0,100}\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b/i.test(s) ||
    /\b(TikTok|spend feed|spend source|active-channel spend)\b.{0,120}\b(integrat|connect|available|live|valid)\w*\b.{0,140}\b(before|then|after|once)\b.{0,100}\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b/i.test(s) ||
    /\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b.{0,120}\b(only after|after|once|when)\b.{0,100}\b(TikTok|live spend|spend feed|active-channel spend)\b.{0,80}\b(is|becomes)?\s*(available|live|integrated|connected|valid)\b/i.test(s)
  ) {
    return false;
  }

  // Direct attempts to waive/override the blocker are forbidden.
  if (
    /\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return true;
  }

  const scaleTerm =
    '(?:final\\s+)?(?:scale|scaling|scale decision|go[- ]?no[- ]?go)';

  // Explicit permission to scale while the TikTok evidence gate is still unmet.
  const patterns = [
    new RegExp(
      '\\b(?:allow|approve|authorize|greenlight|proceed|continue|go ahead)\\b.{0,90}\\b' +
      scaleTerm +
      '\\b.{0,120}\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b',
      'i'
    ),
    new RegExp(
      '\\b' + scaleTerm +
      '\\b.{0,90}\\b(?:proceed|continue|go ahead|greenlight|approved|allowed)\\b.{0,120}\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b',
      'i'
    ),
    new RegExp(
      '\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b.{0,120}\\b(?:allow|approve|authorize|greenlight|proceed|continue|go ahead)\\b.{0,90}\\b' +
      scaleTerm +
      '\\b',
      'i'
    ),
    new RegExp(
      '\\b' + scaleTerm +
      '\\b.{0,50}\\b(?:now|anyway|regardless)\\b.{0,140}\\bTikTok\\b.{0,80}\\b(?:missing|absent|unavailable|not available|not integrated)\\b',
      'i'
    )
  ];

  return patterns.some(function(re) {
    return re.test(s);
  });
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitQuestionAsksTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Questions about approving the missing TikTok integration/source are valid.
  if (
    /\b(approve|authorize)\b.{0,100}\b(acquisition|integration|connection|setup|source|feed|API)\b.{0,120}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,120}\b(only after|after|once|when)\b.{0,100}\bTikTok\b/i.test(s)
  ) {
    return false;
  }

  if (
    /\b(do not|don't|must not|should not|cannot|can't|never)\b.{0,80}\b(override|bypass|relax|waive)\b.{0,80}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  if (
    /\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return true;
  }

  return (
    /\b(can|should|may|could)\b.{0,80}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,140}\b(proceed|continue|go ahead|be approved|be allowed)\b.{0,140}\b(without|despite|before|while|even though|even if|regardless of)\b.{0,80}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(proceed|continue|go ahead)\b.{0,100}\b(with\s+)?(final\s+)?(scale|scaling|scale decision)\b.{0,140}\b(without|despite|before|while|even though|even if)\b.{0,80}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(approve|allow|authorize|greenlight)\b.{0,100}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,140}\b(without|despite|before|while|even though|even if|regardless of)\b.{0,80}\bTikTok\b/i.test(s)
  );
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitMisstatesLastMileFreshness_(text, packet) {
  const s = String(text || '');
  if (!/Last Mile/i.test(s)) return false;

  const lm = packet && packet.route && packet.route.last_mile;
  if (!lm || String(lm.freshness_status || '').toUpperCase() !== 'STALE_REVIEW') {
    return false;
  }

  // Safe stale-qualified phrasing. The same sentence may use words such as
  // "current" only to explain that current confidence is limited.
  if (/\b(stale|stale\/review|stale_review|not current|not fresh|not up[- ]?to[- ]?date|poll age|hours? old|old poll|aged poll)\b/i.test(s)) {
    return false;
  }

  // Safe action/future-state language: asking for a fresh/current poll is not
  // the same as asserting that the existing Last Mile evidence is fresh.
  if (fctP1EmbeddedOrbitIsLastMileRefreshRequest_(s)) {
    return false;
  }

  // Locked rule: a bare 64.1% reference must carry an explicit stale qualifier.
  if (/\b64\.1\s*%/i.test(s)) {
    return true;
  }

  // Fail only on assertive freshness/currentness about the existing evidence.
  return (
    /\bLast Mile\b.{0,90}\b(is|was|remains|looks|appears|shows|reports|reported|has|currently)\b.{0,80}\b(fresh|current|live now|up[- ]?to[- ]?date|latest)\b/i.test(s) ||
    /\b(fresh|current|up[- ]?to[- ]?date|latest)\b.{0,50}\bLast Mile\b.{0,70}\b(data|poll|feed|view|counts?|performance|result|results|figure|figures)\b/i.test(s) ||
    /\bLast Mile\b.{0,70}\b(data|poll|feed|view|counts?|performance|result|results|figure|figures)\b.{0,50}\b(is|are|was|were)\b.{0,30}\b(fresh|current|up[- ]?to[- ]?date|latest)\b/i.test(s)
  );
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitIsLastMileRefreshRequest_(text) {
  const s = String(text || '');
  if (!/Last Mile/i.test(s)) return false;

  return (
    /\b(request|trigger|run|perform|obtain|get|fetch|refresh|repoll|poll|update|need|require|wait for|await)\b.{0,120}\b(fresh|current|new|updated|latest)?\b.{0,80}\bLast Mile\b.{0,80}\b(data|poll|feed|view|snapshot|evidence|counts?|performance)?\b/i.test(s) ||
    /\b(fresh|current|new|updated|latest)\b.{0,60}\bLast Mile\b.{0,80}\b(data|poll|feed|view|snapshot|evidence|counts?|performance)\b.{0,80}\b(before|to|for|needed|required)\b/i.test(s)
  );
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitAssertsUnconfirmedCourierShortage_(text) {
  const s = String(text || '');
  if (!/\b(TFM|OTO)\b/i.test(s)) return false;

  if (/\b(unconfirmed|screening|review|not confirmed|do not treat|pending .*settlement|pending .*remittance)\b/i.test(s)) {
    return false;
  }

  return /\b(shortage|loss|lost|theft|missing cash|courier debt|owes|owed)\b/i.test(s);
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitMakesMarketMetaStockPrereq_(text) {
  const s = String(text || '');
  if (!s) return false;

  if (
    /\b(not|isn't|is not|should not|must not|never)\b.{0,100}\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,120}\b(prerequisite|required|before)\b.{0,120}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,80}\b(is not|isn't|not)\b.{0,50}\b(required|a prerequisite|prerequisite)\b.{0,100}\b(before|for)\b.{0,100}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,100}\b(classification only|ad[- ]activity classification|not a prerequisite)\b/i.test(s)
  ) {
    return false;
  }

  const metaLinkage =
    /\b(Meta|market[- ]?linkage|ad[- ]?activity|market activity)\b/i.test(s);
  const stockAction =
    /\b(replenish|replenishment|restock|stock action|inventory action|stock commitment|purchase order|PO)\b/i.test(s);
  const prereq =
    /\b(required|prerequisite|must confirm|must prove|need to confirm|need to prove)\b.{0,100}\b(before|prior to)\b/i.test(s) ||
    /\b(before|prior to)\b.{0,100}\b(required|confirm|prove)\b/i.test(s);

  return metaLinkage && stockAction && prereq;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitTikTokSourceMissing_(packet) {
  const status = String(
    packet &&
    packet.scale &&
    packet.scale.channel_completeness &&
    packet.scale.channel_completeness.tiktok &&
    packet.scale.channel_completeness.tiktok.status || ''
  ).toUpperCase();

  return (
    status === 'MISSING_ACTIVE_CHANNEL_SPEND' ||
    status === 'MISSING' ||
    status === 'NOT_AVAILABLE' ||
    status === 'UNAVAILABLE'
  );
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitIsExternalApprovalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  if (fctP1IsGovernedExternalActionText_(s)) {
    return true;
  }

  // When TikTok spend is missing, verbs such as refresh/sync/pull/update
  // the TikTok feed imply restoring/acquiring a missing source, not a routine internal refresh.
  if (
    fctP1EmbeddedOrbitTikTokSourceMissing_(packet) &&
    /\bTikTok\b/i.test(s) &&
    /\b(refresh|sync|pull|update|reload|restore|fetch|obtain|get|acquire|integrate|connect|configure|enable|add|ingest|set up)\b/i.test(s) &&
    /\b(feed|spend|data|source|API|connector|active-channel)\b/i.test(s)
  ) {
    return true;
  }

  // Explicit human/business communication with an outside party.
  if (
    /\b(contact|email|message|call|whatsapp|send to)\b.{0,100}\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b.{0,100}\b(contact|email|message|call|whatsapp)\b/i.test(s)
  ) {
    return true;
  }

  // Documentary/evidence requests from external parties.
  if (
    /\b(request|ask|obtain|get)\b.{0,120}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote)\b.{0,140}\b(couriers?|suppliers?|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(request|ask|obtain|get)\b.{0,120}\b(TFM|OTO|C3X|Last Mile|couriers?|suppliers?)\b.{0,120}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  // Source-system / connector / active-channel data integration.
  // A HOLD that merely says "until TikTok is integrated" is not itself
  // an external action; this requires an action verb such as approve/connect.
  if (
    /\b(approve|authorize)\b.{0,100}\b(acquisition|integration|connection|setup)\b.{0,120}\b(TikTok|API|feed|source|system|connector|spend)\b/i.test(s) ||
    /\b(integrate|connect|configure|enable|add|acquire|ingest|set up)\b.{0,120}\b(TikTok|API|feed|source|system|connector|spend data|active-channel spend)\b/i.test(s)
  ) {
    return true;
  }

  // Inventory / PO / replenishment commitments or external sourcing.
  if (
    /\b(place|approve|authorize|commit|purchase|buy|replenish|source|initiate|arrange|transfer)\b.{0,120}\b(PO|purchase|order|stock|inventory|units?|SKU|PLG\d+|replenishment|sourcing)\b/i.test(s)
  ) {
    return true;
  }

  // Ads/campaign changes. Treat "SCALE" as an action only when it
  // directly targets ads/campaign/budget/spend, not when it is the name
  // of the SCALE agent/decision/gate.
  if (
    /\b(pause|stop|increase|decrease|change|edit|approve)\b.{0,80}\b(ads?|campaigns?|budgets?|ad spend|Meta spend|TikTok spend)\b/i.test(s) ||
    /\bscale\b\s+(?:the\s+)?(?:(?:Meta|TikTok)\s+)?(?:ads?|campaigns?|budgets?|ad spend)\b/i.test(s) ||
    /\b(ads?|campaigns?|budgets?|ad spend)\b.{0,80}\b(scale|pause|stop|increase|decrease|change|edit)\b/i.test(s)
  ) {
    return true;
  }

  // Courier/order/routing operational changes.
  if (
    /\b(reroute|reassign|switch|assign|pause|stop|change)\b.{0,100}\b(couriers?|routing|shipments?|orders?|drivers?)\b/i.test(s)
  ) {
    return true;
  }

  // Money movement / refunds / payments.
  return /\b(pay|refund|release|move|transfer)\b.{0,100}\b(payments?|money|refunds?|cash|funds?)\b/i.test(s);
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitIsInternalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const genericInternal = (
    /\b(refresh|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,120}\b(data|feed|API|courier view|records?|cohorts?|snapshot|mapping|allocation|reconciliation)\b/i.test(s) ||
    /\b(poll|repoll)\b.{0,100}\b(API|feed|courier view|data|snapshot|Last Mile|C3X|OTO|TFM)\b/i.test(s) ||
    /\b(request|trigger|run)\b.{0,120}\b(API|feed|data|courier view)\b.{0,60}\bpoll\b/i.test(s) ||
    /\b(request|trigger|run)\b.{0,120}\b(Last Mile|C3X|OTO|TFM)\b.{0,80}\bpoll\b/i.test(s) ||
    /\binternally\b.{0,120}\b(refresh|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s) ||
    /\b(refresh|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,120}\b(Last Mile|C3X|OTO|TFM|couriers?|cohorts?)\b/i.test(s) ||
    /\b(Last Mile|C3X|OTO|TFM|couriers?|cohorts?)\b.{0,120}\b(refresh|poll|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s)
  );

  if (!genericInternal) return false;

  const missingTikTokRefresh = (
    fctP1EmbeddedOrbitTikTokSourceMissing_(packet) &&
    /\bTikTok\b/i.test(s) &&
    /\b(refresh|sync|pull|update|reload|restore|fetch|obtain|get|acquire|integrate|connect|configure|enable|add|ingest|set up)\b/i.test(s) &&
    /\b(feed|spend|data|source|API|connector|active-channel)\b/i.test(s)
  );

  if (!missingTikTokRefresh) return true;

  // If the same sentence also contains a separate internal courier/reconciliation
  // action, preserve the internal signal so mixed-action validation can reject
  // the bundled recommendation instead of silently classifying everything external.
  const separateInternalSignal = (
    /\b(Last Mile|C3X|OTO|TFM|couriers?|cohorts?|reconciliation|mapping|allocation)\b/i.test(s) &&
    /\b(refresh|poll|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse|preserve)\b/i.test(s)
  );

  return separateInternalSignal;
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitIsPureInternalHold_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const target =
    /\b(conclusion|calculation|decision|go[- ]?no[- ]?go|Real Contribution|Operating Profit|profit|SCALE)\b/i.test(s);

  const holdSignal =
    /\b(hold|keep|maintain|preserve)\b/i.test(s) ||
    /\bHOLD\b/i.test(s);

  return (
    target &&
    holdSignal &&
    !fctP1EmbeddedOrbitIsExternalApprovalAction_(s, packet)
  );
}

// Embedded from AgentOrbitPhase1Runner_v6.gs
function fctP1EmbeddedOrbitEscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasEnforceGovernance_(result, packet) {
  if (!result || typeof result !== 'object') {
    throw new Error(
      'ATLAS governance enforcement failed: invalid result object.'
    );
  }

  const severity = String(result.severity || '').toUpperCase();
  const material =
    severity === 'WATCH' ||
    severity === 'ACT_NOW' ||
    severity === 'CRITICAL';

  if (material &&
      (!Array.isArray(result.findings) ||
       result.findings.length === 0)) {
    throw new Error(
      'ATLAS output contract failed: material severity with no findings.'
    );
  }

  if (Array.isArray(result.findings) &&
      result.findings.length > 4) {
    throw new Error(
      'ATLAS output contract failed: maximum 4 findings allowed.'
    );
  }

  if (Array.isArray(result.recommendations) &&
      result.recommendations.length > 3) {
    throw new Error(
      'ATLAS output contract failed: maximum 3 recommendations allowed.'
    );
  }

  if (Array.isArray(result.questions_for_abid) &&
      result.questions_for_abid.length > 3) {
    throw new Error(
      'ATLAS output contract failed: maximum 3 founder questions allowed.'
    );
  }

  fctP1EmbeddedAtlasAssertCriticalStockCoverage_(
    (packet && packet.critical_stock) || [],
    result
  );

  fctP1EmbeddedAtlasAssertCriticalCountClaims_(
    (packet && packet.critical_stock) || [],
    result
  );

  fctP1EmbeddedAtlasAssertWatchRowsNotPromoted_(
    (packet && packet.watch_stock) || [],
    result
  );

  const narrative = fctP1EmbeddedAtlasNarrativeParts_(result);

  narrative.forEach(function(s) {
    if (fctP1EmbeddedAtlasAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'ATLAS governance contract failed: locked TikTok blocker was weakened or bypassed.'
      );
    }

    if (fctP1EmbeddedAtlasStatesBlockedProfitAsNumeric_(s, packet)) {
      throw new Error(
        'ATLAS finance contract failed: blocked Real Contribution/Operating Profit was stated as a numeric final value.'
      );
    }

    if (fctP1EmbeddedAtlasMisstatesLastMileFreshness_(s, packet)) {
      throw new Error(
        'ATLAS data-quality contract failed: stale Last Mile data was presented as fresh/current.'
      );
    }

    if (fctP1EmbeddedAtlasAssertsUnconfirmedCourierShortage_(s)) {
      throw new Error(
        'ATLAS finance contract failed: TFM/OTO screening difference was presented as confirmed loss/shortage/debt.'
      );
    }

    if (fctP1EmbeddedAtlasMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'ATLAS stock contract failed: Kuwait Meta linkage was made a prerequisite for physical stock-risk action.'
      );
    }
  });

  const rawQuestions = Array.isArray(result.questions_for_abid)
    ? result.questions_for_abid
    : [];

  result.questions_for_abid = rawQuestions.filter(function(q) {
    const s = String(q || '');
    return !fctP1EmbeddedAtlasQuestionAsksTikTokBypass_(s) &&
      !fctP1EmbeddedAtlasMakesMarketMetaStockPrereq_(s);
  }).slice(0, 3);

  const recs = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  recs.forEach(function(rec) {
    const action = String((rec && rec.action) || '');
    const external = fctP1EmbeddedAtlasIsExternalApprovalAction_(action, packet);
    const internal = fctP1EmbeddedAtlasIsInternalAction_(action, packet);
    const pureHold = fctP1EmbeddedAtlasIsPureInternalHold_(action, packet);

    if (external && internal) {
      throw new Error(
        'ATLAS recommendation contract failed: internal and external actions must be split.'
      );
    }

    if (external) {
      rec.approval_required = true;
    } else if (internal || pureHold) {
      rec.approval_required = false;
    }
  });

  result.approval_required = recs.some(function(rec) {
    return !!(rec && rec.approval_required);
  });

  if (result.approval_required &&
      result.questions_for_abid.length === 0) {
    throw new Error(
      'ATLAS founder-decision contract failed: approval-required recommendations exist but no founder approval question was returned.'
    );
  }

  const orbit = (packet && packet.orbit_brief) || {};

  if (String(orbit.audit_status || '').toUpperCase() === 'FAIL') {
    result.audit_status = 'FAIL';
  }

  result.severity = fctP1EmbeddedAtlasMaxSeverity_(
    result.severity,
    orbit.severity
  );

  const orbitFreshness = String(
    orbit.source_freshness || ''
  ).toUpperCase();

  if (orbitFreshness && orbitFreshness !== 'FRESH') {
    result.source_freshness = orbitFreshness;
  }

  result.confidence = fctP1EmbeddedAtlasCapConfidence_(
    result.confidence,
    orbit.confidence
  );

  const inheritedProvisional = Array.isArray(
    orbit.provisional_fields
  ) ? orbit.provisional_fields : [];

  const ownProvisional = Array.isArray(
    result.provisional_fields
  ) ? result.provisional_fields : [];

  result.provisional_fields = ownProvisional
    .concat(inheritedProvisional)
    .filter(function(x, i, arr) {
      return arr.indexOf(x) === i;
    });

  return result;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasBuildFounderPulse_(packet) {
  const g = (packet && packet.group_pulse) || {};
  const date = String(g.as_of_date || '');
  const pnlDate = String(g.daily_pnl_latest_date || '');

  const realContribution =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_contribution_status || '')
    )
      ? 'BLOCKED (TikTok missing)'
      : fctP1EmbeddedAtlasMoneyOrUnavailable_(
          g.real_contribution_profit_aed
        );

  const operatingProfit =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_operating_profit_status || '')
    )
      ? 'BLOCKED (TikTok missing)'
      : fctP1EmbeddedAtlasMoneyOrUnavailable_(
          g.real_operating_profit_aed
        );

  return [
    'FOUNDER CONTROL TOWER — ' + date,
    'GROUP PULSE',
    'Orders ' + fctP1EmbeddedAtlasInteger_(g.orders_picked_mtd),
    'Final Delivery ' + fctP1EmbeddedAtlasPercent_(g.finalized_delivery_success),
    'Delivered Revenue AED ' + fctP1EmbeddedAtlasMoney_(g.delivered_revenue_aed),
    'Gross Contribution AED ' + fctP1EmbeddedAtlasMoney_(g.gross_contribution_aed),
    'Meta Spend AED ' + fctP1EmbeddedAtlasMoney_(g.meta_platform_spend_aed),
    'Real Contribution ' + realContribution,
    'Operating Profit ' + operatingProfit,
    'Courier Receivable AED ' + fctP1EmbeddedAtlasMoney_(g.courier_receivable_aed),
    (pnlDate || g.meta_latest_date)
      ? ('Data Cutoff P&L ' + (pnlDate || 'UNAVAILABLE') +
         ' / Meta ' + String(g.meta_latest_date || 'UNAVAILABLE') +
         '; receivable from current normalized orders')
      : ''
  ].filter(Boolean).join(' | ');
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasMoneyOrUnavailable_(value) {
  if (value === null || value === undefined || value === '') {
    return 'UNAVAILABLE';
  }

  const n = Number(value);
  return isFinite(n)
    ? ('AED ' + fctP1EmbeddedAtlasMoney_(n))
    : 'UNAVAILABLE';
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasMoney_(value) {
  if (value === null || value === undefined || value === '') {
    return 'UNAVAILABLE';
  }

  const n = Number(value);
  if (!isFinite(n)) return 'UNAVAILABLE';

  return n.toFixed(2).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ','
  );
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasInteger_(value) {
  if (value === null || value === undefined || value === '') {
    return 'UNAVAILABLE';
  }

  const n = Number(value);
  return isFinite(n)
    ? String(Math.round(n))
    : 'UNAVAILABLE';
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasPercent_(value) {
  const n = Number(value);
  return isFinite(n)
    ? (n * 100).toFixed(2) + '%'
    : 'UNAVAILABLE';
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasNarrativeParts_(result) {
  const out = [];
  out.push(String((result && result.summary) || ''));

  (Array.isArray(result.findings) ? result.findings : [])
    .forEach(function(x) {
      out.push(String((x && x.title) || ''));
      out.push(String((x && x.detail) || ''));
    });

  (Array.isArray(result.recommendations)
    ? result.recommendations
    : []).forEach(function(x) {
      out.push(String((x && x.action) || ''));
      out.push(String((x && x.why) || ''));
    });

  return out;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasStockClassification_(packet) {
  return {
    critical_keys: fctP1EmbeddedAtlasStockKeys_(
      (packet && packet.critical_stock) || []
    ),
    watch_keys: fctP1EmbeddedAtlasStockKeys_(
      (packet && packet.watch_stock) || []
    )
  };
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasStockKeys_(rows) {
  return (rows || []).map(function(x) {
    return String((x && x.country) || '').trim() + '|' +
      String((x && x.sku) || '').trim().toUpperCase();
  }).filter(function(x) {
    return x !== '|';
  }).sort();
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasAssertCriticalCountClaims_(criticalRows, result) {
  const actual = (criticalRows || []).length;
  const text = JSON.stringify(result || {});
  const words = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const re = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b\s+(?:deterministic\s+)?critical(?:[- ]stock)?\s+(?:rows?|risks?|exposures?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = String(m[1] || '').toLowerCase();
    const claimed = Object.prototype.hasOwnProperty.call(words, raw)
      ? words[raw]
      : Number(raw);
    if (isFinite(claimed) && claimed !== actual) {
      throw new Error(
        'ATLAS stock-severity contract failed: narrative claims ' +
        claimed + ' critical stock rows/risks but deterministic packet has ' +
        actual + '.'
      );
    }
  }
  return true;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasAssertWatchRowsNotPromoted_(watchRows, result) {
  const text = JSON.stringify(result || {});
  const upper = text.toUpperCase();

  (watchRows || []).forEach(function(x) {
    const sku = String((x && x.sku) || '').trim().toUpperCase();
    if (!sku) return;

    let pos = upper.indexOf(sku);
    while (pos >= 0) {
      const start = Math.max(0, pos - 110);
      const end = Math.min(upper.length, pos + sku.length + 110);
      const windowText = upper.slice(start, end);
      const skuLocal = pos - start;
      const labels = [];
      const patterns = [
        { type: 'CRITICAL', re: /\bCRITICAL\b|\bOUT OF STOCK\b|\bOOS\b|\bACT[_ ]NOW\b|≤\s*3|<=\s*3/g },
        { type: 'WATCH', re: /\bWATCH\b|\bREORDER\b|≤\s*7|<=\s*7/g }
      ];

      patterns.forEach(function(spec) {
        spec.re.lastIndex = 0;
        let m;
        while ((m = spec.re.exec(windowText)) !== null) {
          labels.push({ type: spec.type, distance: Math.abs(m.index - skuLocal) });
        }
      });

      if (labels.length) {
        labels.sort(function(a, b) { return a.distance - b.distance; });
        if (labels[0].type === 'CRITICAL') {
          throw new Error(
            'ATLAS stock-severity contract failed: WATCH row ' +
            sku + ' was described with a CRITICAL/OOS/ACT_NOW label.'
          );
        }
      }
      pos = upper.indexOf(sku, pos + sku.length);
    }
  });
  return true;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasAssertCriticalStockCoverage_(criticalRows, result) {
  const text = [
    String((result && result.summary) || ''),
    JSON.stringify((result && result.findings) || []),
    JSON.stringify((result && result.recommendations) || [])
  ].join(' ');

  const missing = [];

  (criticalRows || []).forEach(function(x) {
    const country = String((x && x.country) || '').trim();
    const sku = String((x && x.sku) || '').trim().toUpperCase();

    if (!country || !sku) return;

    if (!fctP1EmbeddedAtlasHasCountrySkuMention_(text, country, sku)) {
      missing.push(country + ' ' + sku);
    }
  });

  if (missing.length) {
    throw new Error(
      'ATLAS completeness contract failed: deterministic critical stock omitted from founder brief: ' +
      missing.join(', ')
    );
  }

  return true;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasHasCountrySkuMention_(text, country, sku) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const p = String(sku || '').toUpperCase();

  const aliases =
    c.indexOf('united arab emirates') >= 0
      ? ['UAE', 'United Arab Emirates']
      : (c.indexOf('kuwait') >= 0
          ? ['Kuwait', 'KWT']
          : [country]);

  return aliases.some(function(alias) {
    const a = fctP1EmbeddedAtlasEscapeRegex_(alias);
    const k = fctP1EmbeddedAtlasEscapeRegex_(p);

    return (
      new RegExp(
        '\\b' + a + '\\b.{0,160}\\b' + k + '\\b',
        'i'
      ).test(s) ||
      new RegExp(
        '\\b' + k + '\\b.{0,160}\\b' + a + '\\b',
        'i'
      ).test(s)
    );
  });
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasAdvocatesTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Explicit statements preserving the locked block are safe.
  if (
    /\b(do not|don't|must not|cannot|can't|should not|never)\b.{0,80}\b(override|bypass|relax|waive)\b.{0,80}\b(TikTok|hard block|blocker)\b/i.test(s) ||
    /\b(final\s+)?(scale|scaling|go[- ]?no[- ]?go|scale decision)\b.{0,120}\b(remain(?:s)?|stay(?:s)?|keep|is|are)?\s*(blocked|on hold|hold|must wait)\b.{0,120}\b(TikTok|live spend|spend feed|active-channel spend)\b/i.test(s) ||
    /\b(blocked|hold|on hold|must wait)\b.{0,120}\b(until|pending)\b.{0,80}\b(TikTok|live spend|spend feed|active-channel spend)\b/i.test(s)
  ) {
    return false;
  }

  // Acquiring/integrating the missing TikTok source in order to unblock
  // a later decision is compliant; it does not authorize scaling now.
  if (
    /\b(approve|authorize|acquire|integrate|connect|configure|enable|restore|set up)\b.{0,120}\b(TikTok|spend feed|spend source|active-channel spend)\b.{0,160}\b(unblock|enable|restore|support|permit)\b.{0,100}\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b/i.test(s) ||
    /\b(TikTok|spend feed|spend source|active-channel spend)\b.{0,120}\b(integrat|connect|available|live|valid)\w*\b.{0,140}\b(before|then|after|once)\b.{0,100}\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b/i.test(s) ||
    /\b(final\s+)?(scale|scaling|decision|go[- ]?no[- ]?go)\b.{0,120}\b(only after|after|once|when)\b.{0,100}\b(TikTok|live spend|spend feed|active-channel spend)\b.{0,80}\b(is|becomes)?\s*(available|live|integrated|connected|valid)\b/i.test(s)
  ) {
    return false;
  }

  // Direct attempts to waive/override the blocker are forbidden.
  if (
    /\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return true;
  }

  const scaleTerm =
    '(?:final\\s+)?(?:scale|scaling|scale decision|go[- ]?no[- ]?go)';

  // Explicit permission to scale while the TikTok evidence gate is still unmet.
  const patterns = [
    new RegExp(
      '\\b(?:allow|approve|authorize|greenlight|proceed|continue|go ahead)\\b.{0,90}\\b' +
      scaleTerm +
      '\\b.{0,120}\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b',
      'i'
    ),
    new RegExp(
      '\\b' + scaleTerm +
      '\\b.{0,90}\\b(?:proceed|continue|go ahead|greenlight|approved|allowed)\\b.{0,120}\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b',
      'i'
    ),
    new RegExp(
      '\\b(?:without|despite|before|while|even though|even if|regardless of)\\b.{0,80}\\bTikTok\\b.{0,120}\\b(?:allow|approve|authorize|greenlight|proceed|continue|go ahead)\\b.{0,90}\\b' +
      scaleTerm +
      '\\b',
      'i'
    ),
    new RegExp(
      '\\b' + scaleTerm +
      '\\b.{0,50}\\b(?:now|anyway|regardless)\\b.{0,140}\\bTikTok\\b.{0,80}\\b(?:missing|absent|unavailable|not available|not integrated)\\b',
      'i'
    )
  ];

  return patterns.some(function(re) {
    return re.test(s);
  });
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasQuestionAsksTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Questions about approving the missing TikTok integration/source are valid.
  if (
    /\b(approve|authorize)\b.{0,100}\b(acquisition|integration|connection|setup|source|feed|API)\b.{0,120}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,120}\b(only after|after|once|when)\b.{0,100}\bTikTok\b/i.test(s)
  ) {
    return false;
  }

  if (
    /\b(do not|don't|must not|should not|cannot|can't|never)\b.{0,80}\b(override|bypass|relax|waive)\b.{0,80}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  if (
    /\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return true;
  }

  return (
    /\b(can|should|may|could)\b.{0,80}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,140}\b(proceed|continue|go ahead|be approved|be allowed)\b.{0,140}\b(without|despite|before|while|even though|even if|regardless of)\b.{0,80}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(proceed|continue|go ahead)\b.{0,100}\b(with\s+)?(final\s+)?(scale|scaling|scale decision)\b.{0,140}\b(without|despite|before|while|even though|even if)\b.{0,80}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,80}\b(approve|allow|authorize|greenlight)\b.{0,100}\b(final\s+)?(scale|scaling|scale decision|go[- ]?no[- ]?go)\b.{0,140}\b(without|despite|before|while|even though|even if|regardless of)\b.{0,80}\bTikTok\b/i.test(s)
  );
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasStatesBlockedProfitAsNumeric_(text, packet) {
  const g = (packet && packet.group_pulse) || {};
  const s = String(text || '');

  const realBlocked =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_contribution_status || '')
    );

  const opBlocked =
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_operating_profit_status || '')
    );

  const numericReal =
    /\bReal Contribution(?: Profit)?\b\s*(?:(?:is|=|:)\s*)?(?:AED\s*)?-?\d[\d,]*(?:\.\d+)?\b/i.test(s);

  const numericOp =
    /\b(?:Real )?Operating Profit\b\s*(?:(?:is|=|:)\s*)?(?:AED\s*)?-?\d[\d,]*(?:\.\d+)?\b/i.test(s);

  return (realBlocked && numericReal) ||
    (opBlocked && numericOp);
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasMisstatesLastMileFreshness_(text, packet) {
  const lm = packet && packet.last_mile;
  if (!lm ||
      String(lm.freshness_status || '').toUpperCase() !== 'STALE_REVIEW') {
    return false;
  }

  const s = String(text || '');
  if (!/Last Mile/i.test(s)) return false;

  // Future refresh/poll requests are safe and do not assert current freshness.
  if (
    /\b(refresh|repoll|poll|request|trigger|obtain|get)\b.{0,100}\b(fresh|new|latest|updated)\b.{0,80}\b(Last Mile|poll|data|reading|API|feed)\b/i.test(s) ||
    /\b(fresh|new|latest|updated)\b.{0,50}\b(Last Mile )?(poll|API poll|data poll|reading|feed)\b/i.test(s)
  ) {
    return false;
  }

  // Explicit stale qualification is safe.
  if (
    /\b(stale|STALE_REVIEW|stale-qualified|not current|not fresh|old|aged)\b/i.test(s)
  ) {
    return false;
  }

  return (
    /\bLast Mile\b.{0,100}\b(is|remains|shows|currently|current)\b.{0,80}\b(fresh|current|live|latest|up[- ]?to[- ]?date)\b/i.test(s) ||
    /\b(fresh|current|live|latest|up[- ]?to[- ]?date)\b.{0,80}\bLast Mile\b/i.test(s)
  );
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasAssertsUnconfirmedCourierShortage_(text) {
  const s = String(text || '');
  if (!/\b(TFM|OTO)\b/i.test(s)) return false;

  if (
    /\b(unconfirmed|screening|review|not confirmed|cannot confirm|pending .*settlement|pending .*remittance|do not treat|not .*shortage|not .*loss)\b/i.test(s)
  ) {
    return false;
  }

  return /\b(shortage|loss|lost|missing cash|theft|stolen|debt|owed|cash missing)\b/i.test(s);
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasMakesMarketMetaStockPrereq_(text) {
  const s = String(text || '');
  if (!s) return false;

  if (
    /\b(not|isn't|is not|should not|must not|never)\b.{0,100}\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,120}\b(prerequisite|required|before)\b.{0,120}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,80}\b(is not|isn't|not)\b.{0,50}\b(required|a prerequisite|prerequisite)\b.{0,100}\b(before|for)\b.{0,100}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,100}\b(classification only|ad[- ]activity classification|not a prerequisite)\b/i.test(s)
  ) {
    return false;
  }

  const metaLinkage =
    /\b(Meta|market[- ]?linkage|ad[- ]?activity|market activity)\b/i.test(s);
  const stockAction =
    /\b(replenish|replenishment|restock|stock action|inventory action|stock commitment|purchase order|PO)\b/i.test(s);
  const prereq =
    /\b(required|prerequisite|must confirm|must prove|need to confirm|need to prove)\b.{0,100}\b(before|prior to)\b/i.test(s) ||
    /\b(before|prior to)\b.{0,100}\b(required|confirm|prove)\b/i.test(s);

  return metaLinkage && stockAction && prereq;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasIsExternalApprovalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  if (fctP1IsGovernedExternalActionText_(s)) {
    return true;
  }

  const tiktokMissing = fctP1EmbeddedAtlasTikTokSourceMissing_(packet);

  // Missing TikTok source acquisition/integration is governed external/system work.
  if (tiktokMissing && (
      /\b(approve|authorize)\b.{0,120}\b(acquisition|integration|connection|setup|restoration|enablement)\b.{0,120}\bTikTok\b/i.test(s) ||
      /\b(approve|authorize)\b.{0,120}\bTikTok\b.{0,120}\b(acquisition|integration|connection|setup|restoration|enablement)\b/i.test(s) ||
      /\b(refresh|sync|fetch|pull|obtain|acquire|integrate|connect|configure|enable|add|restore|set up|setup|ingest)\b.{0,130}\bTikTok\b.{0,100}\b(spend|feed|source|data|API|connector)?/i.test(s) ||
      /\bTikTok\b.{0,100}\b(spend|feed|source|data|API|connector)\b.{0,100}\b(refresh|sync|fetch|pull|obtain|acquire|integrate|connect|configure|enable|add|restore|set up|setup|ingest)\b/i.test(s)
    )) {
    return true;
  }

  if (
    /\b(contact|email|message|call|whatsapp|send to)\b.{0,110}\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(couriers?|suppliers?|drivers?|customers?|TFM|OTO|C3X|Last Mile)\b.{0,110}\b(contact|email|message|call|whatsapp)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(request|ask|obtain|get)\b.{0,140}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote|inbound|PO)\b.{0,160}\b(couriers?|suppliers?|TFM|OTO|C3X|Last Mile|procurement)\b/i.test(s) ||
    /\b(request|ask|obtain|get)\b.{0,140}\b(TFM|OTO|C3X|Last Mile|couriers?|suppliers?)\b.{0,140}\b(remittance|settlement|statement|invoice|proof|document|evidence|ETA|lead[- ]?time|MOQ|quote|inbound|PO)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(approve|authorize|request|ask|obtain|get)\b.{0,120}\b(supplier|courier)\b.{0,100}\b(evidence|statement|quote|ETA|lead[- ]?time|MOQ|PO|inbound)\b/i.test(s) ||
    /\b(supplier|courier)\b.{0,100}\b(evidence|statement|quote|ETA|lead[- ]?time|MOQ|PO|inbound)\b.{0,100}\b(request|ask|obtain|get)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(place|approve|authorize|commit|purchase|buy|replenish|source|initiate|arrange|transfer)\b.{0,130}\b(PO|purchase|order|stock|inventory|units?|SKU|PLG\d+|replenishment|sourcing)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(scale|pause|stop|increase|decrease|change|edit|approve)\b.{0,110}\b(ads?|campaigns?|budgets?|ad spend|Meta spend|TikTok spend)\b/i.test(s) ||
    /\b(ads?|campaigns?|budgets?)\b.{0,110}\b(scale|pause|stop|increase|decrease|change|edit)\b/i.test(s)
  ) {
    return true;
  }

  if (
    /\b(reroute|reassign|switch|assign|pause|stop|change)\b.{0,110}\b(couriers?|routing|shipments?|orders?|drivers?)\b/i.test(s)
  ) {
    return true;
  }

  return /\b(pay|refund|release|move|transfer)\b.{0,110}\b(payments?|money|refunds?|cash|funds?)\b/i.test(s);
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasIsInternalAction_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const tiktokMissing = fctP1EmbeddedAtlasTikTokSourceMissing_(packet);
  const mentionsTikTok = /TikTok/i.test(s);

  // Internal reconciliation/review is still internal even when the same
  // sentence also contains a governed TikTok source action. This allows
  // the mixed-action guard to force the model to split them.
  const reconciliationInternal =
    /\b(reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,140}\b(records?|cohorts?|snapshot|mapping|allocation|reconciliation|courier view)\b/i.test(s) ||
    /\binternally\b.{0,140}\b(reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b/i.test(s);

  const courierPollInternal =
    /\b(refresh|repoll|poll|request|trigger|run)\b.{0,140}\b(Last Mile|C3X|OTO|TFM)\b.{0,100}\b(API|feed|data|poll|snapshot|courier view)?/i.test(s) ||
    /\b(Last Mile|C3X|OTO|TFM)\b.{0,120}\b(refresh|repoll|poll|API poll|data poll)\b/i.test(s);

  if (reconciliationInternal || courierPollInternal) {
    return true;
  }

  // A missing TikTok source itself is not a routine internal refresh.
  if (tiktokMissing && mentionsTikTok) {
    return false;
  }

  return (
    /\b(refresh|repoll|reconcile|compare|review|audit|verify|check|inspect|analyze|analyse)\b.{0,130}\b(data|feed|API|courier view|records?|cohorts?|snapshot|mapping|allocation|reconciliation)\b/i.test(s) ||
    /\b(poll|repoll)\b.{0,110}\b(API|feed|courier view|data|snapshot)\b/i.test(s) ||
    /\b(request|trigger|run)\b.{0,130}\b(API|feed|data|courier view)\b.{0,70}\bpoll\b/i.test(s)
  );
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasIsPureInternalHold_(text, packet) {
  const s = String(text || '');
  if (!s) return false;

  const target =
    /\b(conclusion|calculation|decision|go[- ]?no[- ]?go|Real Contribution|Operating Profit|profit|SCALE)\b/i.test(s);

  const hold =
    /\b(hold|keep|maintain|preserve|remain)\b/i.test(s);

  return target && hold &&
    !fctP1EmbeddedAtlasIsExternalApprovalAction_(s, packet);
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasTikTokSourceMissing_(packet) {
  const g = (packet && packet.group_pulse) || {};
  const scale = (packet && packet.scale_signals) || {};

  return (
    /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
      String(g.real_contribution_status || '')
    ) ||
    /MISSING_ACTIVE_CHANNEL_SPEND/i.test(
      String(scale.tiktok_status || '')
    )
  );
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasMaxSeverity_(a, b) {
  const rank = {
    NORMAL: 0,
    WATCH: 1,
    ACT_NOW: 2,
    CRITICAL: 3
  };

  const aa = String(a || '').toUpperCase();
  const bb = String(b || '').toUpperCase();

  if (rank[aa] === undefined) return bb || aa;
  if (rank[bb] === undefined) return aa;
  return rank[aa] >= rank[bb] ? aa : bb;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasCapConfidence_(atlasConfidence, orbitConfidence) {
  const rank = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2
  };

  const a = String(atlasConfidence || '').toUpperCase();
  const o = String(orbitConfidence || '').toUpperCase();

  if (rank[o] === undefined) return a || o;
  if (rank[a] === undefined) return o;
  return rank[a] <= rank[o] ? a : o;
}

// Embedded from AgentAtlasPhase1Runner_v3.gs
function fctP1EmbeddedAtlasEscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}
