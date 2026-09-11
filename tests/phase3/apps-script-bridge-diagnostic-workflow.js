const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const deployWorkflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'apps-script-read-bridge-deploy.yml'), 'utf8');
const diagnosticWorkflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'apps-script-read-bridge-safe-diagnose.yml'), 'utf8');
const verifier = fs.readFileSync(path.join(root, 'scripts', 'verify-apps-script-bridge.cjs'), 'utf8');

assert.match(deployWorkflow, /node scripts\/verify-apps-script-bridge\.cjs/);
assert.match(deployWorkflow, /push --force/);
assert.match(deployWorkflow, /Verify remote anonymous-access manifest before deployment/);
assert.match(deployWorkflow, /\.webapp\.access == "ANYONE_ANONYMOUS"/);
assert.match(deployWorkflow, /Verify deployed anonymous-access metadata/);
assert.match(deployWorkflow, /access=ANYONE_ANONYMOUS execute_as=USER_DEPLOYING/);
assert.doesNotMatch(deployWorkflow, /curl[\s\S]*RESPONSE_FILE/);
assert.doesNotMatch(deployWorkflow, /jq -e '[\s\S]*\.ok == true/);

const manifestGateIndex = deployWorkflow.indexOf('Verify remote anonymous-access manifest before deployment');
const deploymentIndex = deployWorkflow.indexOf('Create or update versioned read bridge deployment');
const metadataIndex = deployWorkflow.indexOf('Verify deployed anonymous-access metadata');
const liveVerifyIndex = deployWorkflow.indexOf('Verify token-gated read-only bridge');
assert.ok(manifestGateIndex >= 0 && deploymentIndex > manifestGateIndex, 'Remote anonymous access must be verified before deployment.');
assert.ok(metadataIndex > deploymentIndex, 'Deployment metadata must be verified after deployment creation.');
assert.ok(liveVerifyIndex > metadataIndex, 'Live bridge verification must follow deployment metadata verification.');

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
