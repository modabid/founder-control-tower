const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const deployWorkflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'apps-script-read-bridge-deploy.yml'), 'utf8');
const diagnosticWorkflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'apps-script-read-bridge-safe-diagnose.yml'), 'utf8');
const verifier = fs.readFileSync(path.join(root, 'scripts', 'verify-apps-script-bridge.cjs'), 'utf8');

assert.match(deployWorkflow, /node scripts\/verify-apps-script-bridge\.cjs/);
assert.doesNotMatch(deployWorkflow, /curl[\s\S]*RESPONSE_FILE/);
assert.doesNotMatch(deployWorkflow, /jq -e '[\s\S]*\.ok == true/);

assert.match(diagnosticWorkflow, /branches:\s*\n\s*- diagnose\/apps-script-web/);
assert.match(diagnosticWorkflow, /Safely diagnose existing deployed endpoint/);
assert.match(diagnosticWorkflow, /Inspect safe deployment access metadata/);
assert.match(diagnosticWorkflow, /inspect-apps-script-deployment\.cjs/);
assert.match(diagnosticWorkflow, /continue-on-error: true/);
assert.match(diagnosticWorkflow, /git diff --exit-code/);
assert.doesNotMatch(diagnosticWorkflow, /clasp[^\n]* push/);
assert.doesNotMatch(diagnosticWorkflow, /create-deployment/);
assert.doesNotMatch(diagnosticWorkflow, /deploy\/apps-script-web/);

assert.match(verifier, /status=/);
assert.match(verifier, /content_type=/);
assert.match(verifier, /redirect_host=/);
assert.match(verifier, /fingerprint=/);
assert.doesNotMatch(verifier, /console\.(?:log|error)\([^\n]*responseText/);
assert.doesNotMatch(verifier, /console\.(?:log|error)\([^\n]*token/);

console.log('PHASE3_APPS_SCRIPT_BRIDGE_DIAGNOSTIC_WORKFLOW_PASS');
