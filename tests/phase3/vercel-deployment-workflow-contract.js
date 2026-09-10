const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'vercel-controlled-deploy.yml'), 'utf8');
const api = fs.readFileSync(path.join(root, 'api', 'founder.ts'), 'utf8');

assert.match(workflow, /branches:\s*\n\s*- deploy\/vercel/);
assert.doesNotMatch(workflow, /- main\b/);
assert.match(workflow, /FCT_VERCEL_TOKEN/);
assert.match(workflow, /FCT_GOOGLE_SERVICE_ACCOUNT_JSON/);
assert.match(workflow, /FCT_WEB_ACCESS_TOKEN/);
assert.match(workflow, /VERCEL_PROJECT: founder-control-tower/);
assert.match(workflow, /VERCEL_SCOPE: mohammed-abids-projects-ac04f63d/);
assert.match(workflow, /vercel@\$VERCEL_CLI_VERSION/);
assert.match(workflow, /--prod/);
assert.match(workflow, /FCT_GOOGLE_SERVICE_ACCOUNT_JSON_B64=/);
assert.match(workflow, /UNAUTH_CODE/);
assert.match(workflow, /METHOD_NOT_ALLOWED/);
assert.match(workflow, /GOOGLE_SHEETS_READ_ONLY/);
assert.match(workflow, /writesMade == 0/);
assert.match(workflow, /externalActionsExecuted == 0/);
assert.match(workflow, /aiCallsMade == 0/);

const testsIndex = workflow.indexOf('Run deterministic regression suite');
const deploymentIndex = workflow.indexOf('Deploy founder-approved commit to production');
assert.ok(testsIndex >= 0 && deploymentIndex > testsIndex, 'Tests must run before production deployment.');

assert.match(api, /readGoogleServiceAccountRuntimeCredentials\(process\.env\)/);
assert.doesNotMatch(api, /FCT_CLASP_AUTH_JSON/);
assert.doesNotMatch(workflow, /FCT_CLASP_AUTH_JSON/);
assert.doesNotMatch(workflow, /BEGIN PRIVATE KEY-----[A-Za-z0-9]/);

console.log('PHASE3_VERCEL_DEPLOYMENT_WORKFLOW_CONTRACT_PASS');
