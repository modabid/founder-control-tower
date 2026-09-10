/**
 * Founder Control Tower — Runtime Interface Probe
 *
 * READ-ONLY / NO API CALLS / NO SHEET WRITES.
 * Logs only FCT function names and declared argument counts.
 * It never reads or logs Script Properties, API keys, sheet data, or customer data.
 */

function inspectFctRuntimeInterface() {
  var g = (typeof globalThis !== 'undefined') ? globalThis : this;

  var knownCandidates = [
    'fctAgentResultSchema_',
    'fctRunAgent_',
    'fctRunAgent',
    'runFctAgent',
    'fctExecuteAgent_',
    'fctExecuteAgent',
    'fctRunPhase1Agent_',
    'fctBuildAgentSnapshot_',
    'fctGetAgentSnapshot_',
    'fctBuildFounderSnapshot_',
    'fctBuildAgentPrompt_',
    'fctGetAgentConfig_',
    'fctCallOpenAI_',
    'fctCallAnthropic_',
    'fctWriteAgentReport_',
    'fctAppendReportHistory_',
    'runFctPhase1SmokeTest',
    'testFctPhase1NoApi',
    'testFctOpenAIConnection'
  ];

  var discovered = [];
  try {
    discovered = Object.getOwnPropertyNames(g)
      .filter(function (name) {
        return /^(fct|runFct|testFct)/.test(name) &&
          typeof g[name] === 'function';
      });
  } catch (e) {
    discovered = [];
  }

  var names = knownCandidates.concat(discovered)
    .filter(function (name, index, arr) {
      return arr.indexOf(name) === index;
    })
    .sort();

  var functions = names.map(function (name) {
    var fn = g[name];
    return {
      name: name,
      exists: typeof fn === 'function',
      arity: typeof fn === 'function' ? fn.length : null
    };
  }).filter(function (x) {
    return x.exists;
  });

  var output = {
    probe: 'FCT_RUNTIME_INTERFACE',
    safe: true,
    api_calls: false,
    sheet_writes: false,
    function_count: functions.length,
    functions: functions
  };

  Logger.log(JSON.stringify(output, null, 2));
  return output;
}
