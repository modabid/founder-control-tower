const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'vercel-controlled-deploy.yml'), 'utf8');
const bridgeWorkflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'apps-script-read-bridge-deploy.yml'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api', 'founder.ts'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(root, 'apps-script', 'live', 'FounderReadBridge.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'apps-script', 'live', 'appsscript.json'), 'utf8'));

assert.match(workflow, /branches:\s*\n\s*- deploy\/vercel/);
assert.doesNotMatch(workflow, /- main\b/);
assert.match(workflow, /FCT_VERCEL_TOKEN/);
assert.match(workflow, /FCT_APPS_SCRIPT_READ_TOKEN/);
assert.match(workflow, /FCT_WEB_ACCESS_TOKEN/);
assert.match(workflow, /expected vcp_ prefix/);
assert.match(workflow, /Do not use FCT_WEB_ACCESS_TOKEN or another randomly generated value here/);
assert.match(workflow, /FCT_VERCEL_TOKEN contains whitespace/);
assert.doesNotMatch(workflow, /FCT_GOOGLE_SERVICE_ACCOUNT_JSON/);
assert.match(workflow, /config\/apps-script-read-bridge\.json/);
assert.match(workflow, /VERCEL_PROJECT: founder-control-tower/);
assert.doesNotMatch(workflow, /--scope/);
assert.match(workflow, /LINKED_PROJECT/);
assert.match(workflow, /Vercel linked an unexpected project/);
assert.match(workflow, /Create isolated candidate deployment/);
assert.match(workflow, /Promote verified candidate to production/);
assert.match(workflow, /Refusing to send founder credentials to an unexpected host/);
assert.match(workflow, /UNAUTH_CODE/);
assert.match(workflow, /METHOD_NOT_ALLOWED/);
assert.match(workflow, /GOOGLE_SHEETS_READ_ONLY/);
assert.match(workflow, /writesMade == 0/);
assert.match(workflow, /externalActionsExecuted == 0/);
assert.match(workflow, /aiCallsMade == 0/);

const testsIndex = workflow.indexOf('Run deterministic regression suite');
const candidateIndex = workflow.indexOf('Create isolated candidate deployment');
const verificationIndex = workflow.indexOf('Verify candidate read-only contract');
const promotionIndex = workflow.indexOf('Promote verified candidate to production');
assert.ok(testsIndex >= 0 && candidateIndex > testsIndex, 'Tests must run before creating a candidate deployment.');
assert.ok(verificationIndex > candidateIndex, 'Candidate verification must run after candidate creation.');
assert.ok(promotionIndex > verificationIndex, 'Production promotion must happen only after candidate verification.');

assert.match(api, /AppsScriptBridgeReader/);
assert.match(api, /FCT_APPS_SCRIPT_READ_URL/);
assert.match(api, /FCT_APPS_SCRIPT_READ_TOKEN/);
assert.doesNotMatch(api, /FCT_GOOGLE_SERVICE_ACCOUNT/);
assert.doesNotMatch(api, /FCT_CLASP_AUTH_JSON/);

assert.match(bridgeWorkflow, /branches:\s*\n\s*- deploy\/apps-script-web/);
assert.match(bridgeWorkflow, /FCT_CLASP_AUTH_JSON/);
assert.match(bridgeWorkflow, /FCT_APPS_SCRIPT_READ_TOKEN/);
assert.match(bridgeWorkflow, /create-deployment/);
assert.match(bridgeWorkflow, /Verify token-gated read-only bridge/);
assert.match(bridgeWorkflow, /git diff --exit-code/);

assert.match(bridgeSource, /function doPost\(e\)/);
assert.match(bridgeSource, /PropertiesService\.getScriptProperties\(\)/);
assert.match(bridgeSource, /FCT_READ_BRIDGE_TOKEN/);
assert.match(bridgeSource, /DAILY_PNL!A:R/);
assert.match(bridgeSource, /ACTION_QUEUE!A:X/);
assert.doesNotMatch(bridgeSource, /setValue\s*\(/);
assert.doesNotMatch(bridgeSource, /setValues\s*\(/);
assert.doesNotMatch(bridgeSource, /appendRow\s*\(/);
assert.doesNotMatch(bridgeSource, /deleteRow\s*\(/);
assert.doesNotMatch(bridgeSource, /insertRow/);
assert.doesNotMatch(bridgeSource, /UrlFetchApp/);
assert.equal(manifest.webapp.executeAs, 'USER_DEPLOYING');
assert.equal(manifest.webapp.access, 'ANYONE_ANONYMOUS');

console.log('PHASE3_VERCEL_DEPLOYMENT_WORKFLOW_CONTRACT_PASS');
