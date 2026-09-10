'use strict';

const fs = require('fs');
const path = require('path');

const workflowPath = path.join(
  __dirname,
  '..',
  '..',
  '.github',
  'workflows',
  'apps-script-controlled-deploy.yml'
);

const text = fs.readFileSync(workflowPath, 'utf8');

function requireMatch(pattern, label) {
  if (!pattern.test(text)) {
    throw new Error('Apps Script deploy workflow contract failed: ' + label);
  }
}

requireMatch(/branches:\s*[\s\S]*deploy\/apps-script/, 'deploy branch gate missing');
requireMatch(/npm test/, 'deterministic regression suite missing');
requireMatch(/FCT_CLASP_AUTH_JSON/, 'private clasp secret missing');
requireMatch(/@google\/clasp@3\.4\.1/, 'clasp version is not pinned');
requireMatch(/\bpush\b/, 'clasp push step missing');
requireMatch(/\bpull\b/, 'clasp pull-back verification missing');
requireMatch(/git diff --exit-code/, 'post-pull drift check missing');
requireMatch(/cancel-in-progress:\s*false/, 'deployment concurrency must not cancel an active deploy');

if (/clasp[^\n]*push[^\n]*--force|clasp[^\n]*--force[^\n]*push/.test(text)) {
  throw new Error('Apps Script deploy workflow contract failed: --force is forbidden');
}

if (/OPENAI_API_KEY|ANTHROPIC_API_KEY|Ayaan_Meta_Access_Token/.test(text)) {
  throw new Error('Apps Script deploy workflow contract failed: business secrets must not be embedded');
}

console.log('PHASE2_APPS_SCRIPT_DEPLOY_WORKFLOW_CONTRACT_PASS');
