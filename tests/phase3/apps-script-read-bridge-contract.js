const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', '..');
const source = fs.readFileSync(path.join(root, 'apps-script', 'live', 'FounderReadBridge.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'apps-script', 'live', 'appsscript.json'), 'utf8'));

const expectedToken = 'bridge-secret-0123456789abcdef0123456789';
let spreadsheetOpenCount = 0;
let writeCallCount = 0;

const sheetMatrices = {
  DAILY_PNL: [['Date', 'Orders_Picked'], [new Date('2026-09-09T00:00:00.000Z'), 10]],
  ORDERS_MASTER: [['Pickup_Date'], ['2026-09-09']],
  RAW_KWT: [['Pickup Date'], ['2026-09-09']],
  META_SPEND_LIVE: [['Date'], ['2026-09-09']],
  PAYROLL_LEDGER: [['Month'], ['2026-09']],
  OPEX_CONTROL: [['Currency'], ['AED']],
  SUBSCRIPTIONS_CONTROL: [['Service'], ['Vercel']],
  ACTION_QUEUE: [['Action_ID'], ['ACT-1']],
  STOCK_INTELLIGENCE: [['Country'], ['UAE']]
};

function sheetFor(name) {
  const matrix = sheetMatrices[name];
  if (!matrix) return null;
  return {
    getLastRow() {
      return matrix.length;
    },
    getRange(row, column, rows, columns) {
      assert.equal(row, 1);
      assert.equal(rows, matrix.length);
      assert.ok(column >= 1);
      assert.ok(columns >= 1);
      return {
        getValues() {
          return matrix.map((r) => Array.from({ length: columns }, (_, index) => r[index] ?? ''));
        },
        setValue() {
          writeCallCount++;
          throw new Error('Bridge must never write.');
        },
        setValues() {
          writeCallCount++;
          throw new Error('Bridge must never write.');
        }
      };
    }
  };
}

const context = {
  console: { error() {} },
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(name) {
          assert.equal(name, 'FCT_READ_BRIDGE_TOKEN');
          return expectedToken;
        }
      };
    }
  },
  SpreadsheetApp: {
    openById(id) {
      spreadsheetOpenCount++;
      assert.equal(id, '1H0NnKfTBP-772JLzTV0oU1CCfWYPIIfUa33tpuWDcjU');
      return { getSheetByName: sheetFor };
    }
  },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput(text) {
      return {
        text,
        mimeType: null,
        setMimeType(value) {
          this.mimeType = value;
          return this;
        }
      };
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context, { filename: 'FounderReadBridge.js' });

function event(body) {
  return { postData: { contents: JSON.stringify(body) } };
}

const bad = context.doPost(event({ action: 'READ_FOUNDER_SOURCE_V1', token: 'wrong-token-0123456789abcdef0123456789' }));
assert.deepEqual(JSON.parse(bad.text), { ok: false, error: 'UNAUTHORIZED' });
assert.equal(spreadsheetOpenCount, 0, 'Unauthorized requests must fail before workbook access.');

const result = context.doPost(event({ action: 'READ_FOUNDER_SOURCE_V1', token: expectedToken }));
assert.equal(result.mimeType, 'application/json');
const body = JSON.parse(result.text);
assert.equal(body.ok, true);
assert.equal(body.contractVersion, '1.0');
assert.equal(body.bridgeVersion, '2026-09-11-RB-V1');
assert.equal(body.provenance.source, 'APPS_SCRIPT_READ_BRIDGE');
assert.equal(body.provenance.writesMade, 0);
assert.equal(body.provenance.externalActionsExecuted, 0);
assert.equal(body.provenance.aiCallsMade, 0);
assert.equal(Object.keys(body.ranges).length, 9);
assert.deepEqual(Object.keys(body.ranges), [
  'DAILY_PNL!A:R',
  'ORDERS_MASTER!H:AL',
  'RAW_KWT!C:X',
  'META_SPEND_LIVE!A:R',
  'PAYROLL_LEDGER!A:P',
  'OPEX_CONTROL!A:P',
  'SUBSCRIPTIONS_CONTROL!A:O',
  'ACTION_QUEUE!A:X',
  'STOCK_INTELLIGENCE!A:M'
]);
assert.equal(body.ranges['DAILY_PNL!A:R'][1][0], '2026-09-09T00:00:00.000Z');
assert.equal(spreadsheetOpenCount, 1);
assert.equal(writeCallCount, 0);

assert.equal(manifest.webapp.executeAs, 'USER_DEPLOYING');
assert.equal(manifest.webapp.access, 'ANYONE_ANONYMOUS');
assert.doesNotMatch(source, /setValue\s*\(/);
assert.doesNotMatch(source, /setValues\s*\(/);
assert.doesNotMatch(source, /appendRow\s*\(/);
assert.doesNotMatch(source, /deleteRow\s*\(/);
assert.doesNotMatch(source, /insertRow/);
assert.doesNotMatch(source, /UrlFetchApp/);
assert.doesNotMatch(source, /OpenAI|Anthropic|AIClient/);

console.log('PHASE3_APPS_SCRIPT_READ_BRIDGE_CONTRACT_PASS');
