function fctDisplayRange_(sheetName, a1Range) {
  const sheet = fctGetSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  return sheet.getRange(a1Range).getDisplayValues();
}

function fctRowsToObjects_(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];

  return rows.slice(1)
    .filter(function(row) {
      return row.some(function(v) { return String(v).trim() !== ''; });
    })
    .map(function(row) {
      const obj = {};
      headers.forEach(function(h, i) {
        if (h) obj[h] = row[i];
      });
      return obj;
    });
}

function fctAlertRank_(severity) {
  const s = String(severity || '').toUpperCase();
  if (s.indexOf('CRITICAL') >= 0) return 0;
  if (s.indexOf('ACT NOW') >= 0 || s.indexOf('🔴') >= 0) return 1;
  if (s.indexOf('WATCH') >= 0 || s.indexOf('🟡') >= 0) return 2;
  if (s.indexOf('OPPORTUNITY') >= 0 || s.indexOf('🟢') >= 0) return 3;
  return 4;
}

function fctBuildCoreSnapshot_(runId) {
  const founderRows = fctDisplayRange_(
    FCT_AI_CONFIG.FOUNDER_REPORT_SHEET,
    'A65:C91'
  );

  const founderSnapshot = founderRows.map(function(row, index) {
    return {
      row: 65 + index,
      label: row[0] || '',
      value: row[1] || '',
      note: row[2] || ''
    };
  }).filter(function(x) {
    return x.label || x.value || x.note;
  });

  const actionRows = fctDisplayRange_(FCT_AI_CONFIG.ACTION_QUEUE_SHEET, 'A1:X50');
  const actions = fctRowsToObjects_(actionRows)
    .filter(function(x) {
      const execution = String(x.Execution_Status || '').toUpperCase();
      return execution !== 'COMPLETED' && execution !== 'DONE';
    })
    .slice(0, 20);

  const alertRows = fctDisplayRange_(FCT_AI_CONFIG.ALERTS_SHEET, 'A1:L300');
  const alerts = fctRowsToObjects_(alertRows)
    .filter(function(x) {
      const status = String(x.Status || '').toUpperCase();
      return !status || status === 'OPEN' || status === 'ACTIVE';
    })
    .sort(function(a, b) {
      return fctAlertRank_(a.Severity) - fctAlertRank_(b.Severity);
    })
    .slice(0, 30);

  const dqRows = fctDisplayRange_(FCT_AI_CONFIG.DATA_QUALITY_SHEET, 'A1:I150');
  const dataQuality = fctRowsToObjects_(dqRows)
    .filter(function(x) {
      const resolved = String(x.Resolved || '').toUpperCase();
      return resolved !== 'TRUE' && resolved !== 'YES' && resolved !== 'RESOLVED';
    })
    .slice(0, 30);

  let asOf = '';
  if (founderSnapshot.length) {
    const m = String(founderSnapshot[0].label).match(/\d{2}\s+[A-Z]{3}\s+\d{4}/i);
    asOf = m ? m[0].toUpperCase() : '';
  }

  return fctRedactForModel_({
    run_id: runId,
    generated_at: fctIsoNow_(),
    as_of: asOf,
    deterministic_truth: {
      founder_snapshot: founderSnapshot,
      action_queue_open: actions,
      alerts_open_top: alerts,
      data_quality_open: dataQuality
    },
    source_policy: {
      arithmetic_authority: 'DETERMINISTIC_SHEETS_APPS_SCRIPT',
      ai_role: 'INTERPRET_PRIORITIZE_CHALLENGE_ONLY',
      external_execution: 'BLOCKED_WITHOUT_ABID_APPROVAL',
      pii_policy: 'REDACT_CUSTOMER_PII_AND_SECRETS'
    }
  });
}

function testFctSnapshot() {
  const snapshot = fctBuildCoreSnapshot_('TEST-SNAPSHOT');
  Logger.log(JSON.stringify(snapshot, null, 2));
  return snapshot;
}
