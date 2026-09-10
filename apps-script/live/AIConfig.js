const FCT_AI_CONFIG = Object.freeze({
  OPENAI_API_KEY_PROP: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY_PROP: 'ANTHROPIC_API_KEY',
  SPREADSHEET_ID_PROP: 'FCT_SPREADSHEET_ID',
  CONFIG_SHEET: 'CONFIG',
  FOUNDER_REPORT_SHEET: 'FOUNDER_REPORT',
  REPORT_HISTORY_SHEET: 'REPORT_HISTORY',
  ACTION_QUEUE_SHEET: 'ACTION_QUEUE',
  ALERTS_SHEET: 'ALERTS',
  DATA_QUALITY_SHEET: 'DATA_QUALITY',
  OPENAI_RESPONSES_URL: 'https://api.openai.com/v1/responses',
  ANTHROPIC_MESSAGES_URL: 'https://api.anthropic.com/v1/messages',
  ANTHROPIC_VERSION: '2023-06-01',
  HTTP_ATTEMPTS: 3
});

function fctGetSpreadsheet_() {
  const id = fctGetScriptProperty_(FCT_AI_CONFIG.SPREADSHEET_ID_PROP, true);
  return SpreadsheetApp.openById(id);
}

function fctGetScriptProperty_(key, required) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (required && !value) {
    throw new Error('Missing Script Property: ' + key);
  }
  return value || '';
}

function fctIsoNow_() {
  return new Date().toISOString();
}

function fctRunId_() {
  const stamp = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd-HHmmss');
  return 'FCT-' + stamp + '-' + Utilities.getUuid().slice(0, 8);
}

function fctProviderForModel_(model) {
  return String(model || '').indexOf('claude-') === 0 ? 'anthropic' : 'openai';
}

function fctNormalizeEffort_(value) {
  const s = String(value || '').toLowerCase();
  if (s.indexOf('xhigh') >= 0) return 'xhigh';
  if (s.indexOf('max') >= 0) return 'max';
  if (s.indexOf('high') >= 0) return 'high';
  if (s.indexOf('medium') >= 0) return 'medium';
  if (s.indexOf('low') >= 0) return 'low';
  return 'medium';
}

function fctParseTokenCap_(value, fallback) {
  const matches = String(value || '').match(/\d[\d,]*/g);
  if (!matches || !matches.length) return fallback;
  const n = Number(matches[matches.length - 1].replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function fctApiError_(message, statusCode, body) {
  const err = new Error(message);
  err.fctApiFailure = true;
  err.statusCode = statusCode || 0;
  err.responseBody = body || '';
  return err;
}

function fctSchemaError_(message, rawOutput) {
  const err = new Error(message);
  err.fctSchemaFailure = true;
  err.rawOutput = rawOutput || '';
  return err;
}

function fctHttpJson_(url, fetchOptions, label) {
  let lastError = null;

  for (let attempt = 0; attempt < FCT_AI_CONFIG.HTTP_ATTEMPTS; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, Object.assign({}, fetchOptions, {
        muteHttpExceptions: true
      }));

      const code = response.getResponseCode();
      const body = response.getContentText();

      if (code >= 200 && code < 300) {
        try {
          return JSON.parse(body);
        } catch (e) {
          throw fctApiError_(label + ' returned non-JSON response.', code, body);
        }
      }

      const retryable = code === 429 || code >= 500;
      lastError = fctApiError_(label + ' API error ' + code + ': ' + body, code, body);

      if (!retryable || attempt === FCT_AI_CONFIG.HTTP_ATTEMPTS - 1) {
        throw lastError;
      }
    } catch (e) {
      lastError = e;
      const retryable = e.fctApiFailure && (e.statusCode === 429 || e.statusCode >= 500);
      if (!retryable || attempt === FCT_AI_CONFIG.HTTP_ATTEMPTS - 1) {
        throw e;
      }
    }

    Utilities.sleep(attempt === 0 ? 500 : 1500);
  }

  throw lastError || new Error(label + ' request failed.');
}

function fctSafeJsonStringify_(value) {
  return JSON.stringify(value, null, 2);
}

function fctRedactForModel_(value) {
  if (Array.isArray(value)) {
    return value.map(fctRedactForModel_);
  }

  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(function(key) {
      const lower = String(key).toLowerCase();
      if (/(password|secret|token|api[_-]?key|access[_-]?key)/.test(lower)) {
        out[key] = '[REDACTED_SECRET]';
      } else if (/(customer.*name|customer.*mobile|customer.*phone|customer.*address|mobile|phone|street_address)/.test(lower)) {
        out[key] = '[REDACTED_PII]';
      } else {
        out[key] = fctRedactForModel_(value[key]);
      }
    });
    return out;
  }

  if (typeof value === 'string') {
    return value
      .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED_SECRET]')
      .replace(/\bsk-ant-[A-Za-z0-9_-]{12,}\b/g, '[REDACTED_SECRET]');
  }

  return value;
}

function checkFctAiSetup() {
  const props = PropertiesService.getScriptProperties();
  return {
    spreadsheet_id_set: !!props.getProperty(FCT_AI_CONFIG.SPREADSHEET_ID_PROP),
    openai_key_set: !!props.getProperty(FCT_AI_CONFIG.OPENAI_API_KEY_PROP),
    anthropic_key_set: !!props.getProperty(FCT_AI_CONFIG.ANTHROPIC_API_KEY_PROP)
  };
}
