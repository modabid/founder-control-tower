const fs = require('fs');
const code = fs.readFileSync('apps-script/orchestrator/Phase1FinalOrchestrator_v5.gs','utf8');

// Apps Script service mocks.
global.Logger = { log: function(){} };
global.LockService = {
  getScriptLock: function(){
    return { tryLock: function(){return true;}, releaseLock: function(){} };
  }
};

const propStore = {};
global.PropertiesService = {
  getScriptProperties: function(){
    return {
      getProperty: k => Object.prototype.hasOwnProperty.call(propStore,k) ? propStore[k] : null,
      setProperty: (k,v) => { propStore[k] = String(v); },
      deleteProperty: k => { delete propStore[k]; }
    };
  }
};

let idCounter=0;
global.fctRunId_ = function(){ return 'TEST-'+(++idCounter); };

// Current deterministic state.
let stockVersion = 1;
let routeAge = 29.1;
let driftOnAgent = null;
let failSentinelOnce = false;

function dq(status='FAIL'){ return {status,flags:[{severity:'REVIEW',code:'X',detail:'poll age '+routeAge+'h'}]}; }

function ledgerSnap(){
  return {
    agent_id:'AG003', period:{month:'2026-09',today:'2026-09-10',daily_pnl_latest_date:'2026-09-09',meta_latest_date:'2026-09-08'},
    economics:{orders_picked_mtd:757,delivered_unpaid_mtd:329,paid_mtd:0,rrto_mtd:62,finalized_delivery_success:0.8414,delivered_revenue_aed:24204.73,gross_contribution_aed:14854.7,courier_receivable_aed:24204.73,meta_platform_spend_aed:6701.85,contribution_after_all_meta_aed:8152.85,tiktok_spend_aed:null,real_contribution_profit_aed:null,real_contribution_status:'BLOCKED_MISSING_TIKTOK_SPEND',real_operating_profit_aed:null,real_operating_profit_status:'BLOCKED_MISSING_TIKTOK_SPEND'},
    fixed_costs:{payroll:{gross_payroll_aed:13968},opex:{monthly_opex_aed:7227.33},subscriptions:{core_active_saas_aed:1469.36}},
    cash_reconciliation:{items:[{courier:'C3X',status_note:'MATCHED'},{courier:'TFM',status_note:'REVIEW'}]}, data_quality:dq(), current_finance_actions:[]
  };
}
function scaleSnap(){
  return {
    agent_id:'AG004', period:{month:'2026-09',today:'2026-09-10'},
    channel_completeness:{meta:{platform_spend_aed:6701.85,country_pending_spend_aed:34.3},tiktok:{status:'MISSING_ACTIVE_CHANNEL_SPEND',spend_aed:null}},
    meta:{platform_spend_aed:6701.85,performance_metrics_status:'UNAVAILABLE_IN_META_SPEND_LIVE',product_pnl_meta_spend_aed:6475.35,meta_not_represented_in_product_pnl_aed:226.5,product_spend:[]},
    provisional_product_rankings:{positive_after_meta:[],negative_after_meta:[]}, courier_scale_gates:[], data_quality:dq()
  };
}
function routeSnap(){
  return {
    agent_id:'AG005', period:{month:'2026-09',today:'2026-09-10'},
    normalized_order_view:[{courier:'C3X',delivered_unpaid:256,paid:0,rrto:29,courier_receivable_aed:18574.78},{courier:'Last Mile',delivered_unpaid:65,paid:0,rrto:33,courier_receivable_aed:4685.35},{courier:'OTE',delivered_unpaid:5,paid:0,rrto:0,courier_receivable_aed:752.62},{courier:'OTO',delivered_unpaid:3,paid:0,rrto:0,courier_receivable_aed:191.98}],
    live_courier_view:[{courier:'Last Mile',finalized_success:0.641,freshness_status:'STALE_REVIEW',poll_age_hours:routeAge,scale_gate_status:'FAIL'}],
    sheet_financial_courier_view:[], settlement_reconciliation:[{courier:'C3X',status_note:'MATCHED'},{courier:'TFM',status_note:'REVIEW'},{courier:'OTO',status_note:'REVIEW'}], data_quality:dq(), current_logistics_actions:[]
  };
}
function stockSnap(){
  const watchDays = stockVersion===1 ? 3.5 : 4.25;
  return {
    agent_id:'AG006', period:{today:'2026-09-10'}, inventory_summary:{version:stockVersion},
    critical_stock:[
      {country:'United Arab Emirates',sku:'PLG597',available_stock_days:2.09,stock_gate:'CRITICAL_LE_3_DAYS',known_market_meta_spend_aed:317.96},
      {country:'United Arab Emirates',sku:'PLG609',available_stock_days:0,stock_gate:'OUT_OF_STOCK',known_market_meta_spend_aed:0},
      {country:'Kuwait',sku:'PLG597',available_stock_days:0,stock_gate:'OUT_OF_STOCK',known_market_meta_spend_aed:0}
    ],
    watch_stock:[{country:'Kuwait',sku:'PLG617',available_stock_days:watchDays,stock_gate:'WATCH_LE_7_DAYS',known_market_meta_spend_aed:0}],
    reconciliation_exceptions:[], inbound_visibility:{has_reliable_open_inbound_pipeline:false}, meta_market_attribution:{platform_spend_aed:6701.85,country_pending_spend_aed:34.3}, data_quality:dq()
  };
}

global.fctBuildLedgerSnapshot_ = ledgerSnap;
global.fctBuildScaleSnapshot_ = scaleSnap;
global.fctBuildRouteSnapshot_ = routeSnap;
global.fctBuildStockSnapshot_ = stockSnap;

function baseSentinelPacket(){
  const l=ledgerSnap(), s=scaleSnap(), r=routeSnap(), st=stockSnap();
  return {
    overall_source_status:'FAIL', source_statuses:{ledger:'FAIL',scale:'FAIL',route:'FAIL',stock:'FAIL'},
    deterministic_cross_checks:{
      meta_platform_spend_ledger_vs_scale:{ledger_aed:6701.85,scale_aed:6701.85,status:'MATCH'},
      meta_platform_spend_ledger_vs_stock:{ledger_aed:6701.85,stock_attribution_aed:6701.85,status:'MATCH'},
      meta_country_pending_scale_vs_stock:{scale_aed:34.3,stock_aed:34.3,status:'MATCH'},
      courier_receivable_ledger_vs_route:{ledger_aed:24204.73,route_normalized_sum_aed:24204.73,status:'MATCH'},
      finalized_delivery_success_ledger_vs_route:{ledger:0.8414,route_normalized:0.841432,status:'MATCH'},
      tiktok_blocker_consistency:{status:'MATCH'}
    },
    ledger:{period:l.period,economics:l.economics,cash_reconciliation:l.cash_reconciliation,data_quality:l.data_quality},
    scale:{channel_completeness:s.channel_completeness,meta:s.meta,courier_scale_gates:s.courier_scale_gates,data_quality:s.data_quality},
    route:{normalized_order_view:r.normalized_order_view,live_courier_view:r.live_courier_view,settlement_reconciliation:r.settlement_reconciliation,data_quality:r.data_quality},
    stock:{inventory_summary:st.inventory_summary,critical_stock:st.critical_stock,watch_stock:st.watch_stock,inbound_visibility:st.inbound_visibility,meta_market_attribution:st.meta_market_attribution,reconciliation_exceptions:[],data_quality:st.data_quality},
    locked_interpretation_rules:{tiktok:'blocked'}
  };
}
global.fctSentinelBuildAIContext_ = function(p,ultra){ return {phase1_audit_packet:p,ultra:!!ultra}; };
global.fctSentinelIsOutputCompletionError_ = function(e){ return /max_output_tokens|before completing structured JSON/i.test(String(e&&e.message||e)); };
global.fctSentinelEnforceLockedGovernance_ = r => r;
global.fctSentinelAssertCriticalStockCoverage_ = function(rows,findings){
  const t=JSON.stringify(findings); for(const x of rows){ if(!t.includes(x.sku)) throw new Error('missing critical '+x.sku); } return true;
};
global.fctSentinelAssertCriticalCountClaims_ = function(){ return true; };
global.fctSentinelAssertWatchRowsNotPromoted_ = function(){ return true; };
global.fctSentinelStockClassification_ = function(stock){ return {critical:stock.critical_stock.map(x=>x.country+'|'+x.sku),watch:stock.watch_stock.map(x=>x.country+'|'+x.sku)}; };

global.fctOrbitEnforceGovernance_ = (r,p)=>r;
global.fctOrbitStockClassification_ = stock => ({critical:stock.critical_stock.map(x=>x.country+'|'+x.sku),watch:stock.watch_stock.map(x=>x.country+'|'+x.sku)});

global.fctAtlasEnforceGovernance_ = (r,p)=>r;
global.fctAtlasBuildFounderPulse_ = p=>'FOUNDER PULSE';
global.fctAtlasStockClassification_ = p=>({critical:p.critical_stock.map(x=>x.country+'|'+x.sku),watch:p.watch_stock.map(x=>x.country+'|'+x.sku)});

let providerCalls=[];
global.fctRunAgent_ = function(agentId,task,context,mode,runId){
  providerCalls.push(agentId);
  if (driftOnAgent && agentId===driftOnAgent) stockVersion++;
  if (failSentinelOnce && agentId==='AG012') {
    failSentinelOnce=false;
    throw new Error('OpenAI output reached max_output_tokens before completing structured JSON.');
  }
  let summary='ok';
  let detail='ok';
  if(agentId==='AG006'){
    summary='UAE PLG597 critical; UAE PLG609 critical; Kuwait PLG597 critical. Kuwait PLG617 WATCH.';
    detail=summary;
  } else if(agentId==='AG012' || agentId==='AG002' || agentId==='AG001') {
    summary='UAE PLG597, UAE PLG609 and Kuwait PLG597 are critical. Kuwait PLG617 is WATCH. TikTok remains blocked; Last Mile is stale.';
    detail=summary;
  }
  return {runtime:{provider:'mock',model:'mock',effort:'test',failed_over:false,usage:{input_tokens:1,output_tokens:1}},result:{run_id:runId,agent_id:agentId,as_of:'2026-09-10',source_freshness:'MIXED',audit_status:'FAIL',severity:'ACT_NOW',summary,findings:[{title:'Finding',detail,severity:'ACT_NOW',evidence_refs:['mock']}],evidence_refs:['mock'],recommendations:[],approval_required:false,questions_for_abid:[],confidence:'MEDIUM',provisional_fields:[],next_check:'later'}};
};

// Evaluate orchestrator code after globals are ready.
eval(code);

function assert(cond,msg){ if(!cond) throw new Error(msg); }
function clearProps(){ for(const k of Object.keys(propStore)) delete propStore[k]; }

// Fingerprint volatility normalization.
const fpA=fctP1Fingerprint_('X',{freshness_status:'STALE_REVIEW',poll_age_hours:29.1,detail:'poll age 29.1h'});
const fpB=fctP1Fingerprint_('X',{freshness_status:'STALE_REVIEW',poll_age_hours:29.9,detail:'poll age 29.9h'});
const fpC=fctP1Fingerprint_('X',{freshness_status:'LIVE',poll_age_hours:1.1,detail:'poll age 1.1h'});
const fpD=fctP1Fingerprint_('X',{freshness_status:'STALE_REVIEW',poll_age_hours:50.1,detail:'poll age 50.1h'});
assert(fpA===fpB,'same age bucket changed fingerprint');
assert(fpA!==fpC,'freshness status change did not change fingerprint');
assert(fpA!==fpD,'material stale-age bucket change did not change fingerprint');

// Frozen deterministic packet cross-checks use one source cut.
const frozenPacket=fctP1BuildFrozenSentinelPacket_({AG003:ledgerSnap(),AG004:scaleSnap(),AG005:routeSnap(),AG006:stockSnap()});
for(const [k,v] of Object.entries(frozenPacket.deterministic_cross_checks)){
  assert(v.status==='MATCH','frozen deterministic cross-check failed: '+k+' '+JSON.stringify(v));
}
assert(frozenPacket.stock.critical_stock.length===3,'frozen packet critical count mismatch');
assert(frozenPacket.stock.watch_stock.some(x=>x.sku==='PLG617'),'frozen packet lost PLG617 WATCH');

// First run = 7 logical AI calls.
clearProps(); providerCalls=[]; stockVersion=1; routeAge=29.1; driftOnAgent=null; failSentinelOnce=false;
const first=runFctPhase1FinalLive();
assert(first.logical_ai_calls_made===7,'first run should make 7 logical calls, got '+first.logical_ai_calls_made);
assert(first.executed_agents.length===7,'first run executed agent count mismatch');
assert(first.reused_agents.length===0,'first run should not reuse cache');

// Second identical run = 0 logical AI calls, all 7 reused.
providerCalls=[];
const second=runFctPhase1FinalLive();
assert(second.logical_ai_calls_made===0,'second identical run should make 0 logical calls');
assert(second.reused_agents.length===7,'second run should reuse 7 agents, got '+second.reused_agents.length);
assert(providerCalls.length===0,'provider called on unchanged cached run');

// Change only STOCK decision input -> AG006 + hierarchy rerun = 4 calls.
providerCalls=[]; stockVersion=2;
const third=runFctPhase1FinalLive();
assert(third.logical_ai_calls_made===4,'stock-only change should make 4 calls, got '+third.logical_ai_calls_made);
assert(third.executed_agents.join(',')==='AG006,AG012,AG002,AG001','stock-only executed agents wrong: '+third.executed_agents.join(','));

// Exact Sentinel output completion error -> one bounded recovery, total 8 on cold cache.
clearProps(); providerCalls=[]; stockVersion=1; failSentinelOnce=true;
const recovery=runFctPhase1FinalLive();
assert(recovery.logical_ai_calls_made===8,'recovery cold run should make 8 logical calls');
assert(recovery.sentinel.recovery_retry===true,'sentinel recovery flag missing');

// Frozen-source semantics: a live source mutation during AI calls does not alter the run's initial source cut.
clearProps(); providerCalls=[]; stockVersion=1; driftOnAgent='AG006'; failSentinelOnce=false;
const frozenRun=runFctPhase1FinalLive();
assert(frozenRun.source_snapshot_mode==='FROZEN_AT_RUN_START','frozen source mode missing');
assert(frozenRun.atlas.stock_classification.watch_keys.some(x=>String(x).includes('PLG617')),'frozen run lost initial PLG617 WATCH classification');
driftOnAgent=null;

// Cache service failures must never fail a completed AI result.
const originalPropsService=PropertiesService;
global.PropertiesService={getScriptProperties:function(){throw new Error('quota unavailable');}};
assert(fctP1CacheRead_('AG003','X')===null,'cache read failure should degrade to miss');
const cacheFailState={cache_write_skips:[]};
assert(fctP1TryCacheRun_('AG003','X',{run_id:'R',status:'SUCCESS',agent_id:'AG003',result:{agent_id:'AG003'}},cacheFailState)===false,'cache write failure should return false');
assert(cacheFailState.cache_write_skips.length===1,'cache write failure should be recorded');
global.PropertiesService=originalPropsService;

// Cache chunking/read contract with a larger compact result.
clearProps();
const fakeState={cache_write_skips:[]};
const fakeRun={run_id:'R',status:'SUCCESS',agent_id:'AG003',source_fingerprint:'FP',runtime:{provider:'x'},result:{agent_id:'AG003',summary:'x'.repeat(9000),findings:[],recommendations:[],questions_for_abid:[],provisional_fields:[]}};
// Compaction trims this to cache-safe size.
assert(fctP1TryCacheRun_('AG003','FP',fakeRun,fakeState)===true,'cache write unexpectedly failed');
assert(!!fctP1CacheRead_('AG003','FP'),'cache read failed');

console.log('PHASE1_ORCHESTRATOR_FULL_LOCAL_SUITE_PASS');
