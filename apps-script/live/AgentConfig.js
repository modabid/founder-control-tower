function fctReadConfigTable_(a1Range) {
  const sheet = fctGetSpreadsheet_().getSheetByName(FCT_AI_CONFIG.CONFIG_SHEET);
  if (!sheet) throw new Error('CONFIG sheet not found.');

  const values = sheet.getRange(a1Range).getDisplayValues();
  if (!values.length) throw new Error('CONFIG table is empty: ' + a1Range);

  const headers = values[0];
  return values.slice(1)
    .filter(function(row) { return row.some(function(v) { return String(v).trim() !== ''; }); })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) {
        if (h) obj[h] = row[i];
      });
      return obj;
    });
}

function fctAgentPlaybook_(agentId) {
  const rows = fctReadConfigTable_('A259:Q266');
  const row = rows.find(function(r) { return r.Agent_ID === agentId; });
  if (!row) throw new Error('Playbook not found for ' + agentId);
  return row;
}

function fctAgentRoute_(agentId) {
  const rows = fctReadConfigTable_('A269:M284');
  const row = rows.find(function(r) { return r.Agent_ID === agentId; });
  if (!row) throw new Error('Runtime route not found for ' + agentId);
  return row;
}

function fctRoutePlan_(agentId, mode) {
  const route = fctAgentRoute_(agentId);
  const m = String(mode || 'STANDARD').toUpperCase();
  const deep = ['DEEP', 'EXCEPTION', 'CRITICAL'].indexOf(m) >= 0;

  const model = deep ? route.Escalation_Model : route.Primary_Model;
  const effort = fctNormalizeEffort_(deep ? route.Escalation_Effort : route.Routine_Effort);
  const maxTokens = fctParseTokenCap_(route.Output_Cap, 1200);

  return {
    agentId: agentId,
    mode: m,
    model: model,
    provider: fctProviderForModel_(model),
    effort: effort,
    maxTokens: maxTokens,
    challengerModel: route.Challenger_Model,
    challengerProvider: fctProviderForModel_(route.Challenger_Model)
  };
}

function testFctRuntimeConfig() {
  const ids = ['AG001', 'AG002', 'AG003', 'AG004', 'AG005', 'AG006', 'AG012'];
  const result = ids.map(function(id) {
    return {
      id: id,
      playbook: fctAgentPlaybook_(id).Codename,
      standard: fctRoutePlan_(id, 'STANDARD'),
      deep: fctRoutePlan_(id, 'DEEP')
    };
  });
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
