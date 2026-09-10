function fctAgentResultSchema_(expectedAgentId) {
  const severityEnum = ['CRITICAL', 'ACT_NOW', 'WATCH', 'OPPORTUNITY', 'NORMAL', 'ERROR'];
  const auditEnum = ['PASS', 'PASS_WITH_WARNING', 'FAIL', 'NOT_APPLICABLE'];
  const freshnessEnum = ['FRESH', 'STALE', 'MIXED', 'UNKNOWN'];
  const confidenceEnum = ['HIGH', 'MEDIUM', 'LOW'];

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      run_id: { type: 'string' },
      agent_id: expectedAgentId
  ? { type: 'string', enum: [expectedAgentId] }
  : { type: 'string' },
      as_of: { type: 'string' },
      source_freshness: { type: 'string', enum: freshnessEnum },
      audit_status: { type: 'string', enum: auditEnum },
      severity: { type: 'string', enum: severityEnum },
      summary: { type: 'string' },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            detail: { type: 'string' },
            severity: { type: 'string', enum: severityEnum },
            evidence_refs: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['title', 'detail', 'severity', 'evidence_refs']
        }
      },
      evidence_refs: {
        type: 'array',
        items: { type: 'string' }
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            action: { type: 'string' },
            why: { type: 'string' },
            approval_required: { type: 'boolean' },
            owner: { type: 'string' }
          },
          required: ['action', 'why', 'approval_required', 'owner']
        }
      },
      approval_required: { type: 'boolean' },
      questions_for_abid: {
        type: 'array',
        items: { type: 'string' }
      },
      confidence: { type: 'string', enum: confidenceEnum },
      provisional_fields: {
        type: 'array',
        items: { type: 'string' }
      },
      next_check: { type: 'string' }
    },
    required: [
      'run_id',
      'agent_id',
      'as_of',
      'source_freshness',
      'audit_status',
      'severity',
      'summary',
      'findings',
      'evidence_refs',
      'recommendations',
      'approval_required',
      'questions_for_abid',
      'confidence',
      'provisional_fields',
      'next_check'
    ]
  };
}

function fctValidateAgentResult_(obj, expectedAgentId) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw fctSchemaError_('Agent result is not an object.', fctSafeJsonStringify_(obj));
  }

  const required = fctAgentResultSchema_().required;
  const missing = required.filter(function(k) {
    return !Object.prototype.hasOwnProperty.call(obj, k);
  });

  if (missing.length) {
    throw fctSchemaError_('Missing agent fields: ' + missing.join(', '), fctSafeJsonStringify_(obj));
  }

  if (expectedAgentId && obj.agent_id !== expectedAgentId) {
    throw fctSchemaError_(
      'Agent ID mismatch. Expected ' + expectedAgentId + ', got ' + obj.agent_id,
      fctSafeJsonStringify_(obj)
    );
  }

  const allowedSeverity = ['CRITICAL', 'ACT_NOW', 'WATCH', 'OPPORTUNITY', 'NORMAL', 'ERROR'];
  const allowedAudit = ['PASS', 'PASS_WITH_WARNING', 'FAIL', 'NOT_APPLICABLE'];
  const allowedFreshness = ['FRESH', 'STALE', 'MIXED', 'UNKNOWN'];
  const allowedConfidence = ['HIGH', 'MEDIUM', 'LOW'];

  if (allowedSeverity.indexOf(obj.severity) < 0) {
    throw fctSchemaError_('Invalid severity.', fctSafeJsonStringify_(obj));
  }
  if (allowedAudit.indexOf(obj.audit_status) < 0) {
    throw fctSchemaError_('Invalid audit_status.', fctSafeJsonStringify_(obj));
  }
  if (allowedFreshness.indexOf(obj.source_freshness) < 0) {
    throw fctSchemaError_('Invalid source_freshness.', fctSafeJsonStringify_(obj));
  }
  if (allowedConfidence.indexOf(obj.confidence) < 0) {
    throw fctSchemaError_('Invalid confidence.', fctSafeJsonStringify_(obj));
  }

  ['findings', 'evidence_refs', 'recommendations', 'questions_for_abid', 'provisional_fields'].forEach(function(k) {
    if (!Array.isArray(obj[k])) {
      throw fctSchemaError_(k + ' must be an array.', fctSafeJsonStringify_(obj));
    }
  });

  if (typeof obj.approval_required !== 'boolean') {
    throw fctSchemaError_('approval_required must be boolean.', fctSafeJsonStringify_(obj));
  }

  return obj;
}
