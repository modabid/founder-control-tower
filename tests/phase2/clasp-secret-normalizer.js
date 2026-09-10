'use strict';

const assert = require('assert');
const {
  normalizeClaspAuth,
  candidateStrings,
  isCredentialObject
} = require('../../scripts/normalize-clasp-auth.cjs');

const v3 = {
  tokens: {
    default: {
      type: 'authorized_user',
      access_token: 'ACCESS',
      refresh_token: 'REFRESH',
      client_id: 'CLIENT'
    }
  }
};

const raw = JSON.stringify(v3);
const normalizedRaw = JSON.parse(normalizeClaspAuth(raw));
assert.deepStrictEqual(normalizedRaw, v3);

const fenced = '```json\n' + raw + '\n```';
assert.deepStrictEqual(JSON.parse(normalizeClaspAuth(fenced)), v3);

const doubleEncoded = JSON.stringify(raw);
assert.deepStrictEqual(JSON.parse(normalizeClaspAuth(doubleEncoded)), v3);

const escapedOnly = raw.replace(/"/g, '\\"');
assert.deepStrictEqual(JSON.parse(normalizeClaspAuth(escapedOnly)), v3);

const b64 = Buffer.from(raw, 'utf8').toString('base64');
assert.deepStrictEqual(JSON.parse(normalizeClaspAuth(b64)), v3);

assert.strictEqual(isCredentialObject(v3), true);
assert.strictEqual(isCredentialObject({ foo: 'bar' }), false);
assert.ok(candidateStrings(raw).length >= 1);
assert.throws(() => normalizeClaspAuth('not-json-or-credentials'));

console.log('PHASE2_CLASP_SECRET_NORMALIZER_PASS');
