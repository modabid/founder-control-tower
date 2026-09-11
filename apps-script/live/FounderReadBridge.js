var FCT_READ_BRIDGE_VERSION_ = '2026-09-11-RB-V1';
var FCT_READ_BRIDGE_SPREADSHEET_ID_ = '1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU';
var FCT_READ_BRIDGE_TOKEN_PROPERTY_ = 'FCT_READ_BRIDGE_TOKEN';
var FCT_READ_BRIDGE_ACTION_ = 'READ_FOUNDER_SOURCE_V1';
var FCT_READ_BRIDGE_RANGES_ = [
  'DAILY_PNL!A:R',
  'ORDERS_MASTER!H:AL',
  'RAW_KWT!C:X',
  'META_SPEND_LIVE!A:R',
  'PAYROLL_LEDGER!A:P',
  'OPEX_CONTROL!A:P',
  'SUBSCRIPTIONS_CONTROL!A:O',
  'ACTION_QUEUE!A:X',
  'STOCK_INTELLIGENCE!A:M'
];

/**
 * Read-only web-app bridge for the Founder Control Tower web runtime.
 *
 * Security boundary:
 * - anonymous web-app transport is allowed only because every request must
 *   present a separate high-entropy Script Property token;
 * - the token is never committed to source;
 * - this endpoint exposes only the fixed allow-listed read ranges below;
 * - no workbook writes, queue mutations, AI calls or business executors exist
 *   in this request path.
 */
function doPost(e) {
  try {
    var request = fctReadBridgeParseRequest_(e);
    if (!request || request.action !== FCT_READ_BRIDGE_ACTION_) {
      return fctReadBridgeJson_({ ok: false, error: 'BAD_REQUEST' });
    }
    if (!fctReadBridgeAuthorize_(request.token)) {
      return fctReadBridgeJson_({ ok: false, error: 'UNAUTHORIZED' });
    }

    var spreadsheet = SpreadsheetApp.openById(FCT_READ_BRIDGE_SPREADSHEET_ID_);
    var ranges = {};
    FCT_READ_BRIDGE_RANGES_.forEach(function (rangeA1) {
      ranges[rangeA1] = fctReadBridgeReadUsedRange_(spreadsheet, rangeA1);
    });

    return fctReadBridgeJson_({
      ok: true,
      contractVersion: '1.0',
      bridgeVersion: FCT_READ_BRIDGE_VERSION_,
      ranges: ranges,
      provenance: {
        source: 'APPS_SCRIPT_READ_BRIDGE',
        spreadsheetId: FCT_READ_BRIDGE_SPREADSHEET_ID_,
        writesMade: 0,
        externalActionsExecuted: 0,
        aiCallsMade: 0
      }
    });
  } catch (error) {
    console.error('FounderReadBridge failed: ' + String(error && error.message ? error.message : error));
    return fctReadBridgeJson_({ ok: false, error: 'SOURCE_UNAVAILABLE' });
  }
}

function fctReadBridgeParseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try {
    return JSON.parse(String(e.postData.contents));
  } catch (_error) {
    return null;
  }
}

function fctReadBridgeAuthorize_(suppliedToken) {
  var expected = String(PropertiesService.getScriptProperties().getProperty(FCT_READ_BRIDGE_TOKEN_PROPERTY_) || '').trim();
  var supplied = String(suppliedToken || '').trim();
  if (expected.length < 32 || supplied.length < 32) return false;
  return fctReadBridgeConstantTimeEqual_(expected, supplied);
}

function fctReadBridgeConstantTimeEqual_(left, right) {
  var a = String(left || '');
  var b = String(right || '');
  var max = Math.max(a.length, b.length);
  var diff = a.length ^ b.length;
  for (var i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function fctReadBridgeReadUsedRange_(spreadsheet, rangeA1) {
  var match = /^([^!]+)!([A-Z]+):([A-Z]+)$/.exec(String(rangeA1 || '').trim());
  if (!match) throw new Error('Unsupported bridge range contract.');

  var sheetName = match[1];
  var startColumn = fctReadBridgeColumnNumber_(match[2]);
  var endColumn = fctReadBridgeColumnNumber_(match[3]);
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error('Required bridge sheet is unavailable.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  var values = sheet.getRange(1, startColumn, lastRow, endColumn - startColumn + 1).getValues();
  return values.map(function (row) {
    return row.map(fctReadBridgeJsonValue_);
  });
}

function fctReadBridgeColumnNumber_(letters) {
  var text = String(letters || '').toUpperCase();
  var value = 0;
  for (var i = 0; i < text.length; i++) {
    var code = text.charCodeAt(i);
    if (code < 65 || code > 90) throw new Error('Invalid bridge column contract.');
    value = (value * 26) + (code - 64);
  }
  if (value < 1) throw new Error('Invalid bridge column contract.');
  return value;
}

function fctReadBridgeJsonValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return value.toISOString();
  }
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || value === null) {
    return value;
  }
  if (value === undefined) return '';
  return String(value);
}

function fctReadBridgeJson_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
