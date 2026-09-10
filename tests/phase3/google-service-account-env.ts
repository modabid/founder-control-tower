import assert from 'node:assert/strict';
import { readGoogleServiceAccountRuntimeCredentials } from '../../packages/data/src/google-service-account-env.ts';

const json = JSON.stringify({
  type: 'service_account',
  client_email: 'fct-read@example.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n'
});
const encoded = Buffer.from(json, 'utf8').toString('base64');

const fromEncoded = readGoogleServiceAccountRuntimeCredentials({
  FCT_GOOGLE_SERVICE_ACCOUNT_JSON_B64: encoded
});
assert.equal(fromEncoded.clientEmail, 'fct-read@example.iam.gserviceaccount.com');
assert.match(fromEncoded.privateKey, /BEGIN PRIVATE KEY/);

const fromLegacy = readGoogleServiceAccountRuntimeCredentials({
  FCT_GOOGLE_SERVICE_ACCOUNT_EMAIL: 'legacy@example.iam.gserviceaccount.com',
  FCT_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nLEGACY\\n-----END PRIVATE KEY-----'
});
assert.equal(fromLegacy.clientEmail, 'legacy@example.iam.gserviceaccount.com');
assert.ok(fromLegacy.privateKey.includes('\nLEGACY\n'));

assert.throws(() => readGoogleServiceAccountRuntimeCredentials({
  FCT_GOOGLE_SERVICE_ACCOUNT_JSON_B64: 'not-base64-json'
}));
assert.throws(() => readGoogleServiceAccountRuntimeCredentials({}));

console.log('PHASE3_GOOGLE_SERVICE_ACCOUNT_ENV_PASS');
