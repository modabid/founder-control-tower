const assert = require('node:assert/strict');

const {
  BridgeVerificationError,
  fingerprintBody,
  printSafeDiagnostics,
  verifyBridge
} = require('../../scripts/verify-apps-script-bridge.cjs');

const bridgeUrl = 'https://script.google.com/macros/s/AKfycbz5bDORUEqama0PiN2o9JpLewgE_RjmBGYs3tXz0-4Jvtgn7DxCI2bbqxo1MLlxY-0/exec';
const token = 'test-token-0123456789abcdef0123456789abcdef';
const privateRedirect = 'https://script.googleusercontent.com/macros/echo?user_content_key=PRIVATE_RESPONSE_KEY';

function response(status, contentType, body, location = '') {
  return {
    status,
    headers: {
      get(name) {
        if (String(name).toLowerCase() === 'content-type') return contentType;
        if (String(name).toLowerCase() === 'location') return location;
        return null;
      }
    },
    async text() {
      return body;
    }
  };
}

function validPayload() {
  return JSON.stringify({
    ok: true,
    contractVersion: '1.0',
    ranges: {
      'DAILY_PNL!A:R': [['private workbook value']],
      'ACTION_QUEUE!A:X': []
    },
    provenance: {
      source: 'APPS_SCRIPT_READ_BRIDGE',
      writesMade: 0,
      externalActionsExecuted: 0,
      aiCallsMade: 0
    }
  });
}

(async () => {
  const calls = [];
  const success = await verifyBridge({
    bridgeUrl,
    token,
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      if (calls.length === 1) return response(302, 'text/html; charset=UTF-8', '', privateRedirect);
      return response(200, 'application/json; charset=utf-8', validPayload());
    }
  });

  assert.equal(success.ok, true);
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[1].options.method, 'GET');
  assert.equal(success.diagnostics[0].redirectHost, 'script.googleusercontent.com');
  assert.equal(success.diagnostics[1].fingerprint, 'VERIFIED_JSON_CONTRACT');

  const lines = [];
  printSafeDiagnostics(success.diagnostics, (line) => lines.push(line));
  const safeOutput = lines.join('\n');
  assert.doesNotMatch(safeOutput, /PRIVATE_RESPONSE_KEY/);
  assert.doesNotMatch(safeOutput, /private workbook value/);
  assert.doesNotMatch(safeOutput, new RegExp(token));
  assert.match(safeOutput, /status=302/);
  assert.match(safeOutput, /redirect_host=script\.googleusercontent\.com/);

  let htmlFailure;
  try {
    await verifyBridge({
      bridgeUrl,
      token,
      fetchImpl: async () => response(
        200,
        'text/html; charset=utf-8',
        '<!DOCTYPE html><html>Sign in with Google PRIVATE_PAGE_CONTENT</html>'
      )
    });
  } catch (error) {
    htmlFailure = error;
  }
  assert.ok(htmlFailure instanceof BridgeVerificationError);
  assert.equal(htmlFailure.code, 'GOOGLE_SIGN_IN_REQUIRED');
  const failureLines = [];
  printSafeDiagnostics(htmlFailure.diagnostics, (line) => failureLines.push(line));
  assert.match(failureLines.join('\n'), /fingerprint=GOOGLE_SIGN_IN_REQUIRED/);
  assert.doesNotMatch(failureLines.join('\n'), /PRIVATE_PAGE_CONTENT/);

  let loginRedirectFailure;
  try {
    await verifyBridge({
      bridgeUrl,
      token,
      fetchImpl: async () => response(302, 'text/html', '', 'https://accounts.google.com/ServiceLogin?secret=PRIVATE')
    });
  } catch (error) {
    loginRedirectFailure = error;
  }
  assert.equal(loginRedirectFailure.code, 'GOOGLE_SIGN_IN_REQUIRED');
  assert.equal(loginRedirectFailure.diagnostics[0].redirectHost, 'accounts.google.com');
  const redirectLines = [];
  printSafeDiagnostics(loginRedirectFailure.diagnostics, (line) => redirectLines.push(line));
  assert.doesNotMatch(redirectLines.join('\n'), /secret=PRIVATE/);

  assert.equal(fingerprintBody('<!doctype html><html>unknown</html>'), 'GOOGLE_HTML_RESPONSE');
  assert.equal(fingerprintBody('Authorization is required to perform that action.'), 'GOOGLE_AUTHORIZATION_REQUIRED');
  assert.equal(fingerprintBody('You need access. Request access.'), 'GOOGLE_ACCESS_DENIED');
  assert.equal(fingerprintBody('Script function not found: doPost'), 'APPS_SCRIPT_FUNCTION_MISSING');

  console.log('PHASE3_APPS_SCRIPT_BRIDGE_VERIFIER_PASS');
})().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
