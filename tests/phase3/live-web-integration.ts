import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createFounderBearerAuthorizer } from '../../packages/api/src/bearer-auth.ts';
import {
  APPS_SCRIPT_BRIDGE_ACTION,
  AppsScriptBridgeReader
} from '../../packages/data/src/apps-script-read-bridge.ts';

const bridgeToken = 'bridge-token-0123456789abcdef0123456789';
const bridgeUrl = 'https://script.google.com/macros/s/AKfycbOfflineBridgeDeployment123456789/exec';
let bridgeCalls = 0;
let capturedBody: Record<string, unknown> | null = null;

const bridgeReader = new AppsScriptBridgeReader({
  endpointUrl: bridgeUrl,
  token: bridgeToken,
  fetchImpl: async (input, init) => {
    bridgeCalls++;
    assert.equal(input, bridgeUrl);
    assert.equal(init?.method, 'POST');
    assert.equal(init?.cache, 'no-store');
    assert.equal(init?.redirect, 'follow');
    capturedBody = JSON.parse(String(init?.body || '{}'));
    return Response.json({
      ok: true,
      contractVersion: '1.0',
      ranges: {
        'DAILY_PNL!A:R': [['Date', 'Orders_Picked'], ['2026-09-09', 10]],
        'ACTION_QUEUE!A:X': [['Action_ID'], ['ACT-1']]
      }
    });
  }
});

assert.deepEqual(await bridgeReader.readRange('DAILY_PNL!A:R'), [['Date', 'Orders_Picked'], ['2026-09-09', 10]]);
assert.deepEqual(await bridgeReader.readRange('ACTION_QUEUE!A:X'), [['Action_ID'], ['ACT-1']]);
assert.equal(bridgeCalls, 1, 'One bridge request must serve all allow-listed range reads for a founder request.');
assert.deepEqual(capturedBody, { action: APPS_SCRIPT_BRIDGE_ACTION, token: bridgeToken });
assert.throws(() => new AppsScriptBridgeReader({ endpointUrl: 'https://example.com/not-trusted', token: bridgeToken }));
assert.throws(() => new AppsScriptBridgeReader({ endpointUrl: bridgeUrl, token: 'too-short' }));

const founderToken = 'founder-access-token-0123456789abcdef';
const authorize = createFounderBearerAuthorizer(founderToken);
assert.equal(authorize({ method: 'GET', headers: { authorization: 'Bearer ' + founderToken } }), true);
assert.equal(authorize({ method: 'GET', headers: { authorization: 'Bearer wrong-token-0123456789abcdef' } }), false);
assert.equal(authorize({ method: 'GET', headers: {} }), false);
assert.throws(() => createFounderBearerAuthorizer('too-short'));

const index = await readFile(new URL('../../apps/web/index.html', import.meta.url), 'utf8');
const liveBootstrap = await readFile(new URL('../../apps/web/live-dashboard.js', import.meta.url), 'utf8');
const apiRoute = await readFile(new URL('../../api/founder.ts', import.meta.url), 'utf8');
const buildScript = await readFile(new URL('../../scripts/build-web.mjs', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));

assert.match(index, /live-dashboard\.js/);
assert.doesNotMatch(index, /mock-founder-data\.js/);
assert.match(liveBootstrap, /method:\s*'GET'/);
assert.match(liveBootstrap, /cache:\s*'no-store'/);
assert.match(liveBootstrap, /Authorization:\s*'Bearer '/);
assert.doesNotMatch(liveBootstrap, /FCT_APPS_SCRIPT_READ_TOKEN/);
assert.doesNotMatch(liveBootstrap, /FCT_GOOGLE_SERVICE_ACCOUNT/);
assert.doesNotMatch(liveBootstrap, /PRIVATE KEY/);
assert.match(apiRoute, /AppsScriptBridgeReader/);
assert.match(apiRoute, /FCT_APPS_SCRIPT_READ_URL/);
assert.match(apiRoute, /FCT_APPS_SCRIPT_READ_TOKEN/);
assert.doesNotMatch(apiRoute, /GoogleServiceAccount/);
assert.doesNotMatch(apiRoute, /FCT_CLASP_AUTH_JSON/);
assert.match(buildScript, /index\.html/);
assert.doesNotMatch(buildScript, /mock-founder-data\.js/);
assert.equal(vercelConfig.outputDirectory, 'dist');
assert.equal(vercelConfig.functions['api/founder.ts'].maxDuration, 20);

const csp = vercelConfig.headers[0].headers.find((item: { key: string; value: string }) => item.key === 'Content-Security-Policy');
assert.ok(csp);
assert.match(csp.value, /connect-src 'self'/);
assert.match(csp.value, /frame-ancestors 'none'/);

console.log('PHASE3_LIVE_WEB_INTEGRATION_PASS');
