const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'vercel-production-preflight.yml'), 'utf8');

assert.match(workflow, /branches:\s*\n\s*- verify\/vercel-production-readiness/);
assert.match(workflow, /Run deterministic regression suite/);
assert.match(workflow, /FCT_VERCEL_TOKEN/);
assert.match(workflow, /FCT_APPS_SCRIPT_READ_TOKEN/);
assert.match(workflow, /FCT_WEB_ACCESS_TOKEN/);
assert.match(workflow, /config\/apps-script-read-bridge\.json/);
assert.match(workflow, /No Vercel deployment or production promotion was performed/);
assert.doesNotMatch(workflow, /npx[^\n]*vercel[^\n]*(?:deploy|promote|link)/i);
assert.doesNotMatch(workflow, /curl\b/);
assert.doesNotMatch(workflow, /echo[^\n]*\$(?:VERCEL_TOKEN|FCT_APPS_SCRIPT_READ_TOKEN|FCT_WEB_ACCESS_TOKEN)/);

console.log('PHASE3_VERCEL_PRODUCTION_PREFLIGHT_WORKFLOW_PASS');
