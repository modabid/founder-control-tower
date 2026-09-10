#!/usr/bin/env node
'use strict';

const fs = require('fs');

function stripCodeFence(value) {
  const s = String(value || '').trim();
  const m = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1].trim() : s;
}

function candidateStrings(input) {
  const raw = stripCodeFence(String(input || '').replace(/^\uFEFF/, '').trim());
  const out = [];
  const add = (v) => {
    if (typeof v !== 'string') return;
    const t = v.replace(/^\uFEFF/, '').trim();
    if (t && !out.includes(t)) out.push(t);
  };

  add(raw);

  // A JSON string containing JSON, e.g. "{\"tokens\":...}".
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') add(parsed);
  } catch (_) {}

  // Common copied/escaped form without an outer JSON string wrapper.
  if (raw.includes('\\"')) add(raw.replace(/\\"/g, '"'));

  // Base64-encoded JSON is accepted as a safe fallback transport format.
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(raw) && raw.length >= 16) {
    try {
      add(Buffer.from(raw.replace(/\s+/g, ''), 'base64').toString('utf8'));
    } catch (_) {}
  }

  return out;
}

function isCredentialObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;

  // clasp v3 named-credential format.
  if (obj.tokens && typeof obj.tokens === 'object') return true;

  // clasp v1 local format.
  if (obj.token && typeof obj.token === 'object' && obj.oauth2ClientSettings) return true;

  // clasp v1 global/legacy format.
  if (obj.refresh_token || obj.access_token) return true;

  return false;
}

function normalizeClaspAuth(input) {
  const candidates = candidateStrings(input);
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isCredentialObject(parsed)) {
        return JSON.stringify(parsed, null, 2) + '\n';
      }
    } catch (_) {}
  }

  throw new Error(
    'FCT_CLASP_AUTH_JSON is present but is not a recognized clasp credential JSON. ' +
    'Re-copy the complete contents of ~/.clasprc.json; do not paste the command itself.'
  );
}

if (require.main === module) {
  const outputPath = process.argv[2];
  if (!outputPath) {
    console.error('Usage: normalize-clasp-auth.cjs <output-path>');
    process.exit(2);
  }

  try {
    const normalized = normalizeClaspAuth(process.env.CLASP_AUTH_JSON || '');
    fs.writeFileSync(outputPath, normalized, { mode: 0o600 });
    console.log('clasp credential normalized successfully.');
  } catch (err) {
    console.error(String(err && err.message ? err.message : err));
    process.exit(1);
  }
}

module.exports = { normalizeClaspAuth, candidateStrings, isCredentialObject };
