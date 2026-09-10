/**
 * Founder Control Tower — Phase 2 Action Queue / Founder Approval Core V1
 *
 * Purpose:
 *   Convert already-audited ATLAS recommendations into a deterministic action
 *   queue, preserve founder approval as a separate gate, and maintain an
 *   auditable decision trail without executing any business action.
 *
 * Safety:
 *   - ACTION_QUEUE writes are internal control-plane writes only.
 *   - Approve/Reject/Modify only change queue state.
 *   - No ads, payments, orders, courier statuses, inventory, messages,
 *     purchases, bookings, deployments, or other external actions are executed.
 */

const FCT_ACTION_QUEUE_VERSION_ = '2026-09-10-AQ-V1';

const FCT_ACTION_HEADERS_ = Object.freeze([
  'Action_ID',
  'Created_At',
  'Agent',
  'Area',
  'Priority',
  'Recommendation',
  'Reason',
  'Confidence',
  'Evidence',
  'Expected_Impact',
  'Risk',
  'Owner',
  'Approval_Status',
  'Approved_By',
  'Approved_At',
  'Email_Status',
  'Email_Sent_At',
  'Execution_Status',
  'Due_Date',
  'Completed_At',
  'Result',
  'Source',
  'Last_Updated',
  'Notes'
]);

const FCT_ACTION_APPROVAL_ = Object.freeze({
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING_FOUNDER: 'PENDING_FOUNDER',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUPERSEDED: 'SUPERSEDED',
  PENDING_EXTERNAL_APPROVAL: 'PENDING_EXTERNAL_APPROVAL'
});

const FCT_ACTION_EXECUTION_ = Object.freeze({
  BLOCKED_APPROVAL: 'BLOCKED_APPROVAL',
  BLOCKED_EXTERNAL: 'BLOCKED_EXTERNAL',
  READY_INTERNAL: 'READY_INTERNAL',
  READY: 'READY',
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
});

function fctActionNormalizeText_(value) {
  return String(value == null ? '' : value)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function fctActionNormalizeRecommendation_(rec) {
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
    throw new Error('Action recommendation must be an object.');
  }

  const action = String(rec.action || '').trim();
  const why = String(rec.why || '').trim();
  const owner = String(rec.owner || 'Abid').trim() || 'Abid';

  if (!action) {
    throw new Error('Action recommendation is missing action text.');
  }

  if (typeof rec.approval_required !== 'boolean') {
    throw new Error('Action recommendation approval_required must be boolean.');
  }

  return {
    action: action,
    why: why,
    owner: owner,
    approval_required: rec.approval_required
  };
}

function fctActionPriorityFromSeverity_(severity) {
  const s = String(severity || '').toUpperCase();
  if (s === 'CRITICAL' || s === 'ACT_NOW' || s === 'ERROR') {
    return '🔴 ACT NOW';
  }
  if (s === 'WATCH') return '🟡 WATCH';
  if (s === 'OPPORTUNITY') return '🟢 OPPORTUNITY';
  return '⚪ NORMAL';
}

function fctActionInitialState_(approvalRequired) {
  return approvalRequired
    ? {
        approval_status: FCT_ACTION_APPROVAL_.PENDING_FOUNDER,
        execution_status: FCT_ACTION_EXECUTION_.BLOCKED_APPROVAL
      }
    : {
        approval_status: FCT_ACTION_APPROVAL_.NOT_REQUIRED,
        execution_status: FCT_ACTION_EXECUTION_.READY_INTERNAL
      };
}

function fctActionAppendNote_(existing, message, nowIso) {
  const prior = String(existing || '').trim();
  const msg = String(message || '').trim();
  if (!msg) return prior;
  const line = '[' + String(nowIso || '') + '] ' + msg;
  return prior ? prior + '\n' + line : line;
}

function fctActionBuildRecord_(rec, meta) {
  const r = fctActionNormalizeRecommendation_(rec);
  const m = meta || {};
  const nowIso = String(m.now_iso || '');
  const state = fctActionInitialState_(r.approval_required);

  if (!String(m.action_id || '').trim()) {
    throw new Error('Action record requires action_id.');
  }

  return {
    Action_ID: String(m.action_id),
    Created_At: m.created_at || nowIso,
    Agent: String(m.agent || 'ATLAS'),
    Area: String(m.area || 'Founder Decision'),
    Priority: fctActionPriorityFromSeverity_(m.severity),
    Recommendation: r.action,
    Reason: r.why,
    Confidence: String(m.confidence || ''),
    Evidence: Array.isArray(m.evidence_refs)
      ? m.evidence_refs.slice(0, 6).join(' | ')
      : String(m.evidence || ''),
    Expected_Impact: String(m.expected_impact || ''),
    Risk: r.approval_required
      ? 'Governed action. No external execution before founder approval.'
      : 'Internal/no-external-commitment action only.',
    Owner: r.owner,
    Approval_Status: state.approval_status,
    Approved_By: '',
    Approved_At: '',
    Email_Status: '',
    Email_Sent_At: '',
    Execution_Status: state.execution_status,
    Due_Date: String(m.due_date || ''),
    Completed_At: '',
    Result: '',
    Source: String(m.source || ''),
    Last_Updated: m.last_updated || nowIso,
    Notes: fctActionAppendNote_(
      String(m.notes || ''),
      'Created by ' + FCT_ACTION_QUEUE_VERSION_ +
        '; approval_required=' + String(r.approval_required),
      nowIso
    )
  };
}

function fctActionIsTerminal_(record) {
  const r = record || {};
  const approval = String(r.Approval_Status || '').toUpperCase();
  const execution = String(r.Execution_Status || '').toUpperCase();

  return (
    approval === FCT_ACTION_APPROVAL_.REJECTED ||
    approval === FCT_ACTION_APPROVAL_.SUPERSEDED ||
    execution === FCT_ACTION_EXECUTION_.COMPLETED ||
    execution === FCT_ACTION_EXECUTION_.CANCELLED
  );
}

function fctActionIsDuplicateOpen_(existing, candidate) {
  if (!existing || !candidate || fctActionIsTerminal_(existing)) return false;

  return (
    fctActionNormalizeText_(existing.Recommendation) ===
      fctActionNormalizeText_(candidate.Recommendation) &&
    fctActionNormalizeText_(existing.Owner) ===
      fctActionNormalizeText_(candidate.Owner)
  );
}

function fctActionApplyDecision_(record, decision, actor, nowIso, note) {
  const out = Object.assign({}, record || {});
  const d = String(decision || '').toUpperCase();
  const who = String(actor || '').trim();
  const now = String(nowIso || '').trim();

  if (!out.Action_ID) throw new Error('Action decision requires Action_ID.');
  if (!who) throw new Error('Action decision requires actor.');
  if (!now) throw new Error('Action decision requires timestamp.');

  if (String(out.Approval_Status || '').toUpperCase() !==
      FCT_ACTION_APPROVAL_.PENDING_FOUNDER) {
    throw new Error(
      'Action ' + out.Action_ID +
      ' is not awaiting founder approval. Current status: ' +
      String(out.Approval_Status || '')
    );
  }

  if (d === 'APPROVE') {
    out.Approval_Status = FCT_ACTION_APPROVAL_.APPROVED;
    out.Approved_By = who;
    out.Approved_At = now;
    out.Execution_Status = FCT_ACTION_EXECUTION_.READY;
    out.Last_Updated = now;
    out.Notes = fctActionAppendNote_(
      out.Notes,
      'APPROVED by ' + who + '. Queue state changed only; nothing executed.',
      now
    );
    if (note) out.Notes = fctActionAppendNote_(out.Notes, note, now);
    return out;
  }

  if (d === 'REJECT') {
    out.Approval_Status = FCT_ACTION_APPROVAL_.REJECTED;
    out.Approved_By = '';
    out.Approved_At = '';
    out.Execution_Status = FCT_ACTION_EXECUTION_.CANCELLED;
    out.Completed_At = now;
    out.Result = 'Rejected by ' + who + '; no execution.';
    out.Last_Updated = now;
    out.Notes = fctActionAppendNote_(
      out.Notes,
      'REJECTED by ' + who + '. No execution.',
      now
    );
    if (note) out.Notes = fctActionAppendNote_(out.Notes, note, now);
    return out;
  }

  throw new Error('Unsupported founder decision: ' + d);
}

function fctActionModifyAndApprove_(record, replacement, actor, nowIso, newActionId, note) {
  const existing = Object.assign({}, record || {});
  const who = String(actor || '').trim();
  const now = String(nowIso || '').trim();
  const newId = String(newActionId || '').trim();
  const replacementText = String(replacement || '').trim();

  if (!existing.Action_ID) throw new Error('Action modification requires Action_ID.');
  if (!who) throw new Error('Action modification requires actor.');
  if (!now) throw new Error('Action modification requires timestamp.');
  if (!newId) throw new Error('Action modification requires replacement Action_ID.');
  if (!replacementText) throw new Error('Action modification requires replacement text.');

  if (String(existing.Approval_Status || '').toUpperCase() !==
      FCT_ACTION_APPROVAL_.PENDING_FOUNDER) {
    throw new Error(
      'Action ' + existing.Action_ID +
      ' is not awaiting founder approval and cannot be modified through this flow.'
    );
  }

  const superseded = Object.assign({}, existing, {
    Approval_Status: FCT_ACTION_APPROVAL_.SUPERSEDED,
    Execution_Status: FCT_ACTION_EXECUTION_.CANCELLED,
    Completed_At: now,
    Result: 'Superseded by founder modification: ' + newId,
    Last_Updated: now
  });
  superseded.Notes = fctActionAppendNote_(
    superseded.Notes,
    'SUPERSEDED by founder modification from ' + who + '; replacement=' + newId + '.',
    now
  );

  const modified = Object.assign({}, existing, {
    Action_ID: newId,
    Created_At: now,
    Recommendation: replacementText,
    Approval_Status: FCT_ACTION_APPROVAL_.APPROVED,
    Approved_By: who,
    Approved_At: now,
    Email_Status: '',
    Email_Sent_At: '',
    Execution_Status: FCT_ACTION_EXECUTION_.READY,
    Completed_At: '',
    Result: '',
    Last_Updated: now,
    Notes: ''
  });
  modified.Notes = fctActionAppendNote_(
    '',
    'Created as approved founder modification of ' + existing.Action_ID +
      '. Queue state changed only; nothing executed.',
    now
  );
  if (note) modified.Notes = fctActionAppendNote_(modified.Notes, note, now);

  return {
    superseded: superseded,
    replacement: modified
  };
}

function fctActionRecordToRow_(record) {
  const r = record || {};
  return FCT_ACTION_HEADERS_.map(function(header) {
    return Object.prototype.hasOwnProperty.call(r, header) ? r[header] : '';
  });
}

function fctActionRowToRecord_(row) {
  const values = Array.isArray(row) ? row : [];
  const out = {};
  FCT_ACTION_HEADERS_.forEach(function(header, i) {
    out[header] = values[i] == null ? '' : values[i];
  });
  return out;
}

function fctActionHeadersMatch_(headers) {
  if (!Array.isArray(headers) || headers.length !== FCT_ACTION_HEADERS_.length) {
    return false;
  }
  return FCT_ACTION_HEADERS_.every(function(expected, i) {
    return String(headers[i] || '').trim() === expected;
  });
}

function fctActionQueueSheet_() {
  const sheet = fctGetSpreadsheet_().getSheetByName(FCT_AI_CONFIG.ACTION_QUEUE_SHEET);
  if (!sheet) throw new Error('ACTION_QUEUE sheet not found.');
  return sheet;
}

function fctActionAssertSheetContract_(sheet) {
  if (!sheet) throw new Error('ACTION_QUEUE sheet is required.');
  if (sheet.getMaxColumns() < FCT_ACTION_HEADERS_.length) {
    throw new Error('ACTION_QUEUE has fewer than 24 columns. Refusing to write.');
  }

  const headers = sheet
    .getRange(1, 1, 1, FCT_ACTION_HEADERS_.length)
    .getDisplayValues()[0];

  if (!fctActionHeadersMatch_(headers)) {
    throw new Error('ACTION_QUEUE headers do not match the locked Phase-2 V1 contract. Refusing to write.');
  }
}

function fctActionReadRecords_(sheet) {
  fctActionAssertSheetContract_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet
    .getRange(2, 1, lastRow - 1, FCT_ACTION_HEADERS_.length)
    .getValues()
    .map(fctActionRowToRecord_)
    .filter(function(record) {
      return String(record.Action_ID || '').trim() !== '';
    });
}

function fctActionNewId_(sheet, now) {
  const date = now instanceof Date ? now : new Date(now || Date.now());
  const tz = sheet.getParent().getSpreadsheetTimeZone() || 'GMT';
  const day = Utilities.formatDate(date, tz, 'yyyyMMdd');
  const prefix = 'ACT-' + day + '-';
  let maxSeq = 0;

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues().forEach(function(row) {
      const id = String(row[0] || '').trim();
      if (id.indexOf(prefix) !== 0) return;
      const seq = Number(id.slice(prefix.length));
      if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
    });
  }

  const next = maxSeq + 1;
  return prefix + String(next).padStart(3, '0');
}

function fctActionFindRowById_(sheet, actionId) {
  const id = String(actionId || '').trim();
  if (!id) throw new Error('Action_ID is required.');
  fctActionAssertSheetContract_(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Action not found: ' + id);

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0] || '').trim() === id) return i + 2;
  }

  throw new Error('Action not found: ' + id);
}

function fctActionWriteRecordAtRow_(sheet, rowNumber, record) {
  sheet
    .getRange(rowNumber, 1, 1, FCT_ACTION_HEADERS_.length)
    .setValues([fctActionRecordToRow_(record)]);
}

function fctActionSourceRunId_(run, atlasResult) {
  return String(
    (run && run.run_id) ||
    (atlasResult && atlasResult.run_id) ||
    ''
  );
}

function fctActionAtlasResult_(run) {
  if (!run || typeof run !== 'object') {
    throw new Error('Phase-1 run object is required.');
  }

  const candidates = [
    run.atlas && run.atlas.result,
    run.founder_brief,
    run.result && run.result.agent_id === 'AG001' ? run.result : null
  ];

  const atlas = candidates.find(function(x) {
    return x && x.agent_id === 'AG001' && Array.isArray(x.recommendations);
  });

  if (!atlas) {
    throw new Error('Phase-1 run does not contain a valid AG001 ATLAS result.');
  }

  return atlas;
}

function previewFctPhase2ActionsFromLastValidationNoWrite() {
  if (typeof replayFctPhase1LastValidationCacheNoApi !== 'function') {
    throw new Error('Cached Phase-1 replay function is unavailable.');
  }

  const run = replayFctPhase1LastValidationCacheNoApi();
  const atlas = fctActionAtlasResult_(run);
  const nowIso = fctIsoNow_();

  return atlas.recommendations.map(function(rec, i) {
    return fctActionBuildRecord_(rec, {
      action_id: 'PREVIEW-' + String(i + 1),
      now_iso: nowIso,
      agent: 'ATLAS',
      area: 'Founder Decision',
      severity: atlas.severity,
      confidence: atlas.confidence,
      evidence_refs: atlas.evidence_refs,
      source: 'ATLAS:' + fctActionSourceRunId_(run, atlas)
    });
  });
}

function queueFctPhase2ActionsFromLastValidationNoApi() {
  if (typeof replayFctPhase1LastValidationCacheNoApi !== 'function') {
    throw new Error('Cached Phase-1 replay function is unavailable.');
  }

  const run = replayFctPhase1LastValidationCacheNoApi();
  return fctQueuePhase2ActionsFromRun_(run);
}

function fctQueuePhase2ActionsFromRun_(run) {
  const atlas = fctActionAtlasResult_(run);
  const sheet = fctActionQueueSheet_();
  fctActionAssertSheetContract_(sheet);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    throw new Error('Another Founder Control Tower queue update is in progress.');
  }

  try {
    const existing = fctActionReadRecords_(sheet);
    const now = new Date();
    const nowIso = now.toISOString();
    const source = 'ATLAS:' + fctActionSourceRunId_(run, atlas);
    const queued = [];
    const deduped = [];

    atlas.recommendations.forEach(function(rec) {
      const actionId = fctActionNewId_(sheet, now);
      const candidate = fctActionBuildRecord_(rec, {
        action_id: actionId,
        created_at: now,
        last_updated: now,
        now_iso: nowIso,
        agent: 'ATLAS',
        area: 'Founder Decision',
        severity: atlas.severity,
        confidence: atlas.confidence,
        evidence_refs: atlas.evidence_refs,
        source: source
      });

      const duplicate = existing.concat(queued).find(function(item) {
        return fctActionIsDuplicateOpen_(item, candidate);
      });

      if (duplicate) {
        deduped.push(duplicate.Action_ID);
        return;
      }

      const row = Math.max(sheet.getLastRow() + 1, 2);
      fctActionWriteRecordAtRow_(sheet, row, candidate);
      queued.push(candidate);
    });

    return {
      status: 'SUCCESS',
      queue_version: FCT_ACTION_QUEUE_VERSION_,
      source_run_id: fctActionSourceRunId_(run, atlas),
      queued_action_ids: queued.map(function(x) { return x.Action_ID; }),
      deduped_action_ids: deduped,
      external_actions_executed: 0
    };
  } finally {
    lock.releaseLock();
  }
}

function listFctPendingFounderActions() {
  return fctActionReadRecords_(fctActionQueueSheet_()).filter(function(record) {
    return String(record.Approval_Status || '').toUpperCase() ===
      FCT_ACTION_APPROVAL_.PENDING_FOUNDER;
  });
}

function approveFctAction(actionId, approvedBy, note) {
  const sheet = fctActionQueueSheet_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('Another action decision is in progress.');

  try {
    const rowNumber = fctActionFindRowById_(sheet, actionId);
    const record = fctActionRowToRecord_(
      sheet.getRange(rowNumber, 1, 1, FCT_ACTION_HEADERS_.length).getValues()[0]
    );
    const updated = fctActionApplyDecision_(
      record,
      'APPROVE',
      approvedBy || 'Abid',
      fctIsoNow_(),
      note || ''
    );
    fctActionWriteRecordAtRow_(sheet, rowNumber, updated);
    return updated;
  } finally {
    lock.releaseLock();
  }
}

function rejectFctAction(actionId, rejectedBy, note) {
  const sheet = fctActionQueueSheet_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('Another action decision is in progress.');

  try {
    const rowNumber = fctActionFindRowById_(sheet, actionId);
    const record = fctActionRowToRecord_(
      sheet.getRange(rowNumber, 1, 1, FCT_ACTION_HEADERS_.length).getValues()[0]
    );
    const updated = fctActionApplyDecision_(
      record,
      'REJECT',
      rejectedBy || 'Abid',
      fctIsoNow_(),
      note || ''
    );
    fctActionWriteRecordAtRow_(sheet, rowNumber, updated);
    return updated;
  } finally {
    lock.releaseLock();
  }
}

function modifyAndApproveFctAction(actionId, replacementRecommendation, modifiedBy, note) {
  const sheet = fctActionQueueSheet_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('Another action decision is in progress.');

  try {
    const rowNumber = fctActionFindRowById_(sheet, actionId);
    const record = fctActionRowToRecord_(
      sheet.getRange(rowNumber, 1, 1, FCT_ACTION_HEADERS_.length).getValues()[0]
    );
    const now = new Date();
    const nowIso = now.toISOString();
    const newId = fctActionNewId_(sheet, now);
    const change = fctActionModifyAndApprove_(
      record,
      replacementRecommendation,
      modifiedBy || 'Abid',
      nowIso,
      newId,
      note || ''
    );

    fctActionWriteRecordAtRow_(sheet, rowNumber, change.superseded);
    fctActionWriteRecordAtRow_(
      sheet,
      Math.max(sheet.getLastRow() + 1, 2),
      change.replacement
    );

    return change;
  } finally {
    lock.releaseLock();
  }
}

function testFctPhase2ActionCoreNoApi() {
  const now = '2026-09-10T17:00:00.000Z';
  const governed = fctActionBuildRecord_({
    action: 'Request supplier replenishment evidence.',
    why: 'Critical stock requires verified replenishment facts.',
    approval_required: true,
    owner: 'Abid'
  }, {
    action_id: 'ACT-TEST-001',
    now_iso: now,
    agent: 'ATLAS',
    severity: 'ACT_NOW',
    confidence: 'HIGH',
    source: 'ATLAS:TEST'
  });

  if (governed.Approval_Status !== FCT_ACTION_APPROVAL_.PENDING_FOUNDER ||
      governed.Execution_Status !== FCT_ACTION_EXECUTION_.BLOCKED_APPROVAL) {
    throw new Error('Phase-2 governed action gate contract failed.');
  }

  const internal = fctActionBuildRecord_({
    action: 'Refresh internal courier data.',
    why: 'Freshness check only.',
    approval_required: false,
    owner: 'ROUTE'
  }, {
    action_id: 'ACT-TEST-002',
    now_iso: now,
    agent: 'ATLAS',
    severity: 'WATCH',
    confidence: 'HIGH',
    source: 'ATLAS:TEST'
  });

  if (internal.Approval_Status !== FCT_ACTION_APPROVAL_.NOT_REQUIRED ||
      internal.Execution_Status !== FCT_ACTION_EXECUTION_.READY_INTERNAL) {
    throw new Error('Phase-2 internal action gate contract failed.');
  }

  const approved = fctActionApplyDecision_(
    governed,
    'APPROVE',
    'Abid',
    now,
    'Approved for later executor pickup.'
  );

  if (approved.Execution_Status !== FCT_ACTION_EXECUTION_.READY ||
      approved.Result !== '') {
    throw new Error('Phase-2 approval must not imply execution.');
  }

  const rejected = fctActionApplyDecision_(
    governed,
    'REJECT',
    'Abid',
    now,
    'Do not proceed.'
  );

  if (rejected.Execution_Status !== FCT_ACTION_EXECUTION_.CANCELLED ||
      rejected.Approval_Status !== FCT_ACTION_APPROVAL_.REJECTED) {
    throw new Error('Phase-2 rejection contract failed.');
  }

  const modified = fctActionModifyAndApprove_(
    governed,
    'Request supplier stock and ETA only; make no purchase commitment.',
    'Abid',
    now,
    'ACT-TEST-003',
    'Founder narrowed the scope.'
  );

  if (modified.superseded.Approval_Status !== FCT_ACTION_APPROVAL_.SUPERSEDED ||
      modified.replacement.Approval_Status !== FCT_ACTION_APPROVAL_.APPROVED ||
      modified.replacement.Execution_Status !== FCT_ACTION_EXECUTION_.READY) {
    throw new Error('Phase-2 modify-and-approve contract failed.');
  }

  if (!fctActionIsDuplicateOpen_(
        governed,
        Object.assign({}, governed, {
          Recommendation: '  REQUEST supplier replenishment evidence.  '
        })
      )) {
    throw new Error('Phase-2 duplicate suppression contract failed.');
  }

  if (!fctActionHeadersMatch_(FCT_ACTION_HEADERS_.slice())) {
    throw new Error('Phase-2 header contract failed.');
  }

  return {
    status: 'PASS',
    queue_version: FCT_ACTION_QUEUE_VERSION_,
    external_actions_executed: 0
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FCT_ACTION_QUEUE_VERSION_,
    FCT_ACTION_HEADERS_,
    FCT_ACTION_APPROVAL_,
    FCT_ACTION_EXECUTION_,
    fctActionNormalizeText_,
    fctActionNormalizeRecommendation_,
    fctActionPriorityFromSeverity_,
    fctActionInitialState_,
    fctActionBuildRecord_,
    fctActionIsTerminal_,
    fctActionIsDuplicateOpen_,
    fctActionApplyDecision_,
    fctActionModifyAndApprove_,
    fctActionRecordToRow_,
    fctActionRowToRecord_,
    fctActionHeadersMatch_,
    testFctPhase2ActionCoreNoApi
  };
}
