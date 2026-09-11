#!/usr/bin/env node
'use strict';

const ALLOWED_INITIAL_HOST = 'script.google.com';
const ALLOWED_RESPONSE_HOSTS = new Set([
  'script.google.com',
  'script.googleusercontent.com'
]);

class BridgeVerificationError extends Error {
  constructor(code, diagnostics) {
    super(code);
    this.name = 'BridgeVerificationError';
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

function normalizeContentType(value) {
  return String(value || '').split(';', 1)[0].trim().toLowerCase() || 'missing';
}

function fingerprintBody(body) {
  const text = String(body || '').slice(0, 65536).toLowerCase();
  if (/accounts\.google\.com|servicelogin|sign in with google/.test(text)) return 'GOOGLE_SIGN_IN_REQUIRED';
  if (/authorization is required/.test(text)) return 'GOOGLE_AUTHORIZATION_REQUIRED';
  if (/you need access|request access|access denied/.test(text)) return 'GOOGLE_ACCESS_DENIED';
  if (/sorry, unable to open the file|unable to open this file/.test(text)) return 'GOOGLE_RESOURCE_UNAVAILABLE';
  if (/script function not found/.test(text)) return 'APPS_SCRIPT_FUNCTION_MISSING';
  if (/page not found|error 404/.test(text)) return 'GOOGLE_NOT_FOUND';
  if (/<!doctype html|<html/.test(text)) return 'GOOGLE_HTML_RESPONSE';
  if (/moved temporarily/.test(text)) return 'GOOGLE_REDIRECT_BODY';
  return 'NON_JSON_RESPONSE';
}

function publicHop(response, redirectHost = '') {
  return {
    status: Number(response.status),
    contentType: normalizeContentType(response.headers.get('content-type')),
    redirectHost
  };
}

function assertInitialUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== ALLOWED_INITIAL_HOST ||
    !/^\/macros\/s\/AK[A-Za-z0-9_-]{20,}\/exec$/.test(parsed.pathname) ||
    parsed.search ||
    parsed.hash
  ) {
    throw new BridgeVerificationError('UNEXPECTED_BRIDGE_URL', []);
  }
  return parsed;
}

function validateContract(payload) {
  return Boolean(
    payload &&
    payload.ok === true &&
    payload.contractVersion === '1.0' &&
    payload.provenance &&
    payload.provenance.source === 'APPS_SCRIPT_READ_BRIDGE' &&
    payload.provenance.writesMade === 0 &&
    payload.provenance.externalActionsExecuted === 0 &&
    payload.provenance.aiCallsMade === 0 &&
    payload.ranges &&
    Array.isArray(payload.ranges['DAILY_PNL!A:R']) &&
    Array.isArray(payload.ranges['ACTION_QUEUE!A:X'])
  );
}

async function verifyBridge({ bridgeUrl, token, fetchImpl = globalThis.fetch, maxRedirects = 5 }) {
  if (typeof fetchImpl !== 'function') throw new BridgeVerificationError('FETCH_UNAVAILABLE', []);
  if (String(token || '').length < 32) throw new BridgeVerificationError('TOKEN_NOT_CONFIGURED', []);

  let url = assertInitialUrl(bridgeUrl);
  let method = 'POST';
  let body = JSON.stringify({ action: 'READ_FOUNDER_SOURCE_V1', token });
  const diagnostics = [];

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    let response;
    try {
      response = await fetchImpl(url, {
        method,
        redirect: 'manual',
        headers: method === 'POST'
          ? { Accept: 'application/json', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          : { Accept: 'application/json', 'Cache-Control': 'no-store' },
        body: method === 'POST' ? body : undefined
      });
    } catch (_error) {
      throw new BridgeVerificationError('NETWORK_REQUEST_FAILED', diagnostics);
    }

    const location = response.headers.get('location');
    const isRedirect = [301, 302, 303, 307, 308].includes(Number(response.status)) && Boolean(location);
    if (isRedirect) {
      let target;
      try {
        target = new URL(location, url);
      } catch (_error) {
        diagnostics.push(publicHop(response));
        throw new BridgeVerificationError('INVALID_REDIRECT', diagnostics);
      }

      diagnostics.push(publicHop(response, target.hostname));
      if (target.protocol !== 'https:') {
        throw new BridgeVerificationError('UNSAFE_REDIRECT_PROTOCOL', diagnostics);
      }
      if (target.hostname === 'accounts.google.com') {
        throw new BridgeVerificationError('GOOGLE_SIGN_IN_REQUIRED', diagnostics);
      }
      if (!ALLOWED_RESPONSE_HOSTS.has(target.hostname)) {
        throw new BridgeVerificationError('UNEXPECTED_REDIRECT_HOST', diagnostics);
      }
      if (redirectCount === maxRedirects) {
        throw new BridgeVerificationError('TOO_MANY_REDIRECTS', diagnostics);
      }

      if ([301, 302, 303].includes(Number(response.status))) {
        method = 'GET';
        body = undefined;
      }
      url = target;
      continue;
    }

    const hop = publicHop(response);
    diagnostics.push(hop);
    let responseText;
    try {
      responseText = await response.text();
    } catch (_error) {
      throw new BridgeVerificationError('RESPONSE_READ_FAILED', diagnostics);
    }

    if (hop.contentType !== 'application/json') {
      hop.fingerprint = fingerprintBody(responseText);
      throw new BridgeVerificationError(hop.fingerprint, diagnostics);
    }

    let payload;
    try {
      payload = JSON.parse(responseText);
    } catch (_error) {
      hop.fingerprint = 'MALFORMED_JSON';
      throw new BridgeVerificationError('MALFORMED_JSON', diagnostics);
    }

    if (!validateContract(payload)) {
      hop.fingerprint = 'JSON_CONTRACT_MISMATCH';
      throw new BridgeVerificationError('JSON_CONTRACT_MISMATCH', diagnostics);
    }

    hop.fingerprint = 'VERIFIED_JSON_CONTRACT';
    return { ok: true, diagnostics };
  }

  throw new BridgeVerificationError('TOO_MANY_REDIRECTS', diagnostics);
}

function printSafeDiagnostics(diagnostics, logger = console.log) {
  diagnostics.forEach((hop, index) => {
    const fields = [
      `hop=${index + 1}`,
      `status=${hop.status}`,
      `content_type=${hop.contentType}`,
      `redirect_host=${hop.redirectHost || 'none'}`,
      `fingerprint=${hop.fingerprint || 'none'}`
    ];
    logger(`BRIDGE_HTTP ${fields.join(' ')}`);
  });
}

async function main() {
  try {
    const result = await verifyBridge({
      bridgeUrl: process.env.BRIDGE_URL || '',
      token: process.env.FCT_APPS_SCRIPT_READ_TOKEN || ''
    });
    printSafeDiagnostics(result.diagnostics);
    console.log('APPS_SCRIPT_READ_BRIDGE_LIVE_VERIFY_PASS');
  } catch (error) {
    const safeError = error instanceof BridgeVerificationError
      ? error
      : new BridgeVerificationError('UNEXPECTED_VERIFIER_FAILURE', []);
    printSafeDiagnostics(safeError.diagnostics);
    console.error(`APPS_SCRIPT_READ_BRIDGE_LIVE_VERIFY_FAIL code=${safeError.code}`);
    process.exitCode = 1;
  }
}

module.exports = {
  BridgeVerificationError,
  fingerprintBody,
  normalizeContentType,
  printSafeDiagnostics,
  validateContract,
  verifyBridge
};

if (require.main === module) main();
