function fctSnapshotValue_(snapshot, label) {
  const rows = (((snapshot || {}).deterministic_truth || {}).founder_snapshot || []);
  const hit = rows.find(function(x) {
    return String(x.label || '').toLowerCase() === String(label || '').toLowerCase();
  });
  return hit ? hit.value : '';
}

function fctFormatPercentIfDecimal_(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value || '';
  if (n >= 0 && n <= 1) return (n * 100).toFixed(1) + '%';
  return String(value);
}

function fctRenderFounderBrief_(snapshot, atlas, sentinel, challenger) {
  const lines = [];
  lines.push('FOUNDER CONTROL TOWER — ' + (snapshot.as_of || 'CURRENT'));
  lines.push('');
  lines.push('GROUP PULSE');
  lines.push('Orders: ' + fctSnapshotValue_(snapshot, 'Orders picked'));
  lines.push('Finalized delivery: ' + fctFormatPercentIfDecimal_(fctSnapshotValue_(snapshot, 'Finalized delivery success')));
  lines.push('Delivered revenue: AED ' + fctSnapshotValue_(snapshot, 'Delivered revenue'));
  lines.push('Gross contribution: AED ' + fctSnapshotValue_(snapshot, 'Gross contribution'));
  lines.push('Meta spend: AED ' + fctSnapshotValue_(snapshot, 'Meta spend'));
  lines.push('Real Operating Profit: ' + fctSnapshotValue_(snapshot, 'Real Operating Profit'));
  lines.push('Audit: ' + sentinel.audit_status + ' | Confidence: ' + atlas.confidence);

  const groups = [
    { title: '🔴 ACT NOW', severities: ['CRITICAL', 'ACT_NOW'] },
    { title: '🟡 WATCH', severities: ['WATCH'] },
    { title: '🟢 OPPORTUNITIES', severities: ['OPPORTUNITY'] }
  ];

  groups.forEach(function(group) {
    const items = (atlas.findings || []).filter(function(f) {
      return group.severities.indexOf(f.severity) >= 0;
    });
    if (!items.length) return;

    lines.push('');
    lines.push(group.title);
    items.slice(0, 5).forEach(function(item, i) {
      lines.push((i + 1) + '. ' + item.title + ' — ' + item.detail);
    });
  });

  if ((atlas.recommendations || []).length) {
    lines.push('');
    lines.push('CEO PRIORITIES TODAY');
    atlas.recommendations.slice(0, 3).forEach(function(rec, i) {
      lines.push((i + 1) + '. ' + rec.action + ' — ' + rec.why);
    });
  }

  const questions = atlas.questions_for_abid || [];
  if (questions.length) {
    lines.push('');
    lines.push('APPROVAL / DECISION NEEDED');
    questions.slice(0, 4).forEach(function(q, i) {
      lines.push((i + 1) + '. ' + q);
    });
  }

  if (challenger) {
    lines.push('');
    lines.push('INDEPENDENT CHALLENGE');
    lines.push(challenger.summary);
  }

  return lines.join('\n');
}

function fctEnsureAiHistoryHeaders_() {
  const sheet = fctGetSpreadsheet_().getSheetByName(FCT_AI_CONFIG.REPORT_HISTORY_SHEET);
  const expected = [
    'AI_Run_ID',
    'AI_Status',
    'Sentinel_JSON',
    'Orbit_JSON',
    'Atlas_JSON',
    'Models_Used',
    'Audit_Status',
    'Data_As_Of',
    'AI_Error'
  ];

  const current = sheet.getRange('L1:T1').getDisplayValues()[0];
  const anyExisting = current.some(function(v) { return String(v).trim() !== ''; });

  if (anyExisting) {
    const mismatch = expected.some(function(v, i) { return current[i] !== v; });
    if (mismatch) {
      throw new Error('REPORT_HISTORY L:T is not empty or has unexpected headers. Refusing to overwrite.');
    }
    return;
  }

  sheet.getRange('L1:T1').setValues([expected]);
}

function fctAppendAiHistory_(run) {
  fctEnsureAiHistoryHeaders_();

  const sheet = fctGetSpreadsheet_().getSheetByName(FCT_AI_CONFIG.REPORT_HISTORY_SHEET);
  const row = Math.max(sheet.getLastRow() + 1, 2);

  sheet.getRange(row, 1, 1, 2).setValues([[
    new Date(),
    new Date()
  ]]);

  sheet.getRange(row, 11).setValue(run.brief || '');

  sheet.getRange(row, 12, 1, 9).setValues([[
    run.run_id,
    run.status,
    JSON.stringify(run.sentinel || {}),
    JSON.stringify(run.orbit || {}),
    JSON.stringify(run.atlas || {}),
    JSON.stringify(run.models_used || []),
    run.audit_status || '',
    run.as_of || '',
    run.error || ''
  ]]);
}

function fctWriteFounderBrief_(run) {
  const sheet = fctGetSpreadsheet_().getSheetByName(FCT_AI_CONFIG.FOUNDER_REPORT_SHEET);
  const target = sheet.getRange('E65:G91');
  target.clearContent();

  sheet.getRange('E65').setValue('AI FOUNDER BRIEF');
  sheet.getRange('E66').setValue('Generated: ' + fctIsoNow_());
  sheet.getRange('E67').setValue('Run: ' + run.run_id + ' | Audit: ' + run.audit_status);

  const lines = String(run.brief || '').split('\n').slice(0, 22);
  if (lines.length) {
    sheet.getRange(69, 5, lines.length, 1).setValues(lines.map(function(x) { return [x]; }));
  }
}
