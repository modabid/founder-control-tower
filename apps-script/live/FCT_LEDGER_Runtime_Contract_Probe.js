/**
 * Founder Control Tower — LEDGER Runtime Contract Probe
 *
 * READ-ONLY.
 * No API calls.
 * No sheet reads/writes.
 * No Script Properties.
 *
 * Prints only source code for the existing runtime orchestration functions
 * needed to wire AG003 LEDGER safely into Step 6.
 */

function inspectFctLedgerRuntimeContract() {
  const targets = [
    'fctRunAgent_',
    'runFctPhase1SmokeTest',
    'fctBuildAgentPrompts_',
    'fctAgentRoute_',
    'fctAgentPlaybook_'
  ];

  const g = (typeof globalThis !== 'undefined') ? globalThis : this;
  const out = {};

  targets.forEach(function(name) {
    const fn = g[name];
    if (typeof fn !== 'function') {
      out[name] = { exists: false };
      return;
    }

    const src = Function.prototype.toString.call(fn);

    out[name] = {
      exists: true,
      arity: fn.length,
      source: src
    };
  });

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}
