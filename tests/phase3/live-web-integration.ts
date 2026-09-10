import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createFounderBearerAuthorizer } from '../../packages/api/src/bearer-auth.ts';
import {
  GOOGLE_OAUTH_TOKEN_URL,
  GOOGLE_SHEETS_READ_SCOPE,
  createGoogleServiceAccountTokenProvider
} from '../../packages/data/src/google-service-account-token.ts';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
let exchangeCalls = 0;
let assertion = '';

const tokenProvider = createGoogleServiceAccountTokenProvider({
  clientEmail: 'fct-reader@example.iam.gserviceaccount.com',
  privateKey: pem,
  now: () => new Date('2026-09-10T20:30:00.000Z'),
  fetchImpl: async (input, init) => {
    exchangeCalls++;
    assert.equal(input, GOOGLE_OAUTH_TOKEN_URL);
    assert.equal(init?.method, 'POST');
    const params = new URLSearchParams(String(init?.body || ''));
    assert.equal(params.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    assertion = String(params.get('assertion') || '');
    return Response.json({ access_token: 'offline-access-token', expires_in: 3600 });
  }
});

assert.equal(await tokenProvider(), 'offline-access-token');
assert.equal(await tokenProvider(), 'offline-access-token');
assert.equal(exchangeCalls, 1, 'Access token should be cached before expiry.');

const jwtParts = assertion.split('.');
assert.equal(jwtParts.length, 3);
const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString('utf8'));
assert.equal(payload.scope, GOOGLE_SHEETS_READ_SCOPE);
assert.equal(payload.aud, GOOGLE_OAUTH_TOKEN_URL);
assert.equal(payload.iss, 'fct-reader@example.iam.gserviceaccount.com');
assert.equal(payload.exp - payload.iat, 3600);

const founderToken = 'founder-access-token-0123456789abcdef';
const authorize = createFounderBearerAuthorizer(founderToken);
assert.equal(authorize({ method: 'GET', headers: { authorization: 'Bearer ' + founderToken } }), true);
assert.equal(authorize({ method: 'GET', headers: { authorization: 'Bearer wrong-token-0123456789abcdef' } }), false);
assert.equal(authorize({ method: 'GET', headers: {} }), false);
assert.throws(() => createFounderBearerAuthorizer('too-short'));

const index = await readFile(new URL('../../apps/web/index.html', import.meta.url), 'utf8');
const liveBootstrap = await readFile(new URL('../../apps/web/live-dashboard.js', import.meta.url), 'utf8');
const buildScript = await readFile(new URL('../../scripts/build-web.mjs', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));

assert.match(index, /live-dashboard\.js/);
assert.doesNotMatch(index, /mock-founder-data\.js/);
assert.match(liveBootstrap, /method:\s*'GET'/);
assert.match(liveBootstrap, /cache:\s*'no-store'/);
assert.match(liveBootstrap, /Authorization:\s*'Bearer '/);
assert.doesNotMatch(liveBootstrap, /FCT_GOOGLE_SERVICE_ACCOUNT/);
assert.doesNotMatch(liveBootstrap, /PRIVATE KEY/);
assert.match(buildScript, /index\.html/);
assert.doesNotMatch(buildScript, /mock-founder-data\.js/);
assert.equal(vercelConfig.outputDirectory, 'dist');
assert.equal(vercelConfig.functions['api/founder.ts'].maxDuration, 20);

const csp = vercelConfig.headers[0].headers.find((item: { key: string; value: string }) => item.key === 'Content-Security-Policy');
assert.ok(csp);
assert.match(csp.value, /connect-src 'self'/);
assert.match(csp.value, /frame-ancestors 'none'/);

console.log('PHASE3_LIVE_WEB_INTEGRATION_PASS');
