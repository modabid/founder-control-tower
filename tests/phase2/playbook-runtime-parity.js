'use strict';

const fs = require('fs');
const path = require('path');
const runtime = require('../../apps-script/live/AgentPlaybookRegistry.js');

const registry = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '..', 'config', 'agent-playbooks.json'),
  'utf8'
));

if (runtime.FCT_AGENT_PLAYBOOK_REGISTRY_VERSION_ !== registry.registry_version) {
  throw new Error('Playbook runtime parity failed: version mismatch.');
}

const expected = registry.rules.map((rule) => ({
  rule_id: rule.rule_id,
  agent_id: rule.agent_id,
  domain: rule.domain,
  instruction: rule.instruction,
  source: rule.source,
  effective_date: rule.effective_date,
  status: rule.status,
  may_override_locked_rule: rule.may_override_locked_rule
}));

const actual = runtime.FCT_AGENT_PLAYBOOK_RULES_.map((rule) => ({
  rule_id: rule.rule_id,
  agent_id: rule.agent_id,
  domain: rule.domain,
  instruction: rule.instruction,
  source: rule.source,
  effective_date: rule.effective_date,
  status: rule.status,
  may_override_locked_rule: rule.may_override_locked_rule
}));

if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  throw new Error('Playbook runtime parity failed: config/runtime rules differ.');
}

runtime.fctAssertAgentPlaybookSafe_();

const atlas = runtime.fctAgentPlaybookContext_('AG001');
if (atlas.locked_rule_override_allowed !== false) {
  throw new Error('Playbook runtime parity failed: override guard missing.');
}
if (!atlas.rules.some((rule) => rule.rule_id === 'PB-ATLAS-001')) {
  throw new Error('Playbook runtime parity failed: ATLAS rule missing.');
}
if (!atlas.rules.some((rule) => rule.rule_id === 'PB-GOV-003')) {
  throw new Error('Playbook runtime parity failed: global governance rule missing.');
}

console.log('PHASE2_PLAYBOOK_RUNTIME_PARITY_PASS');
