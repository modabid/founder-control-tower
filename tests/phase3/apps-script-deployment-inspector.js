const assert = require('node:assert/strict');

const {
  accessTokenFor,
  credentialFromStore,
  printInspection,
  safeEntryPoints
} = require('../../scripts/inspect-apps-script-deployment.cjs');

(async () => {
  const current = credentialFromStore({
    tokens: {
      default: {
        access_token: 'PRIVATE_ACCESS_TOKEN',
        refresh_token: 'PRIVATE_REFRESH_TOKEN',
        client_id: 'PRIVATE_CLIENT_ID',
        client_secret: 'PRIVATE_CLIENT_SECRET',
        expiry_date: Date.now() + 120000
      }
    }
  });
  assert.equal(await accessTokenFor(current, async () => { throw new Error('must not refresh'); }), 'PRIVATE_ACCESS_TOKEN');

  const entries = safeEntryPoints({
    entryPoints: [{
      entryPointType: 'WEB_APP',
      webApp: {
        url: 'https://script.google.com/macros/s/PRIVATE_DEPLOYMENT/exec?private=query',
        entryPointConfig: { access: 'ANYONE_ANONYMOUS', executeAs: 'USER_DEPLOYING' }
      }
    }]
  });
  assert.deepEqual(entries, [{
    type: 'WEB_APP',
    access: 'ANYONE_ANONYMOUS',
    executeAs: 'USER_DEPLOYING',
    urlHost: 'script.google.com'
  }]);

  const lines = [];
  printInspection({ versionNumber: 7, manifestFileName: 'appsscript', entryPoints: entries }, (line) => lines.push(line));
  const output = lines.join('\n');
  assert.match(output, /type=WEB_APP access=ANYONE_ANONYMOUS execute_as=USER_DEPLOYING/);
  assert.doesNotMatch(output, /PRIVATE_(?:ACCESS|REFRESH|CLIENT|DEPLOYMENT)/);
  assert.doesNotMatch(output, /private=query/);

  let refreshBody = '';
  const refreshed = await accessTokenFor({
    refresh_token: 'PRIVATE_REFRESH_TOKEN',
    client_id: 'PRIVATE_CLIENT_ID',
    client_secret: 'PRIVATE_CLIENT_SECRET'
  }, async (_url, options) => {
    refreshBody = String(options.body);
    return { ok: true, async text() { return JSON.stringify({ access_token: 'NEW_PRIVATE_ACCESS_TOKEN' }); } };
  });
  assert.equal(refreshed, 'NEW_PRIVATE_ACCESS_TOKEN');
  assert.match(refreshBody, /refresh_token=PRIVATE_REFRESH_TOKEN/);

  console.log('PHASE3_APPS_SCRIPT_DEPLOYMENT_INSPECTOR_PASS');
})().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
