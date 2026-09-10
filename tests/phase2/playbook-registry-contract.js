'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'config', 'agent-playbooks.json');
const registry = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!registry || registry.status !== 'ACTIVE' || !Array.isArray(registry.rules)) {
  throw new Error('Playbook registry contract failed: registry is not active.');
}

const ids = new Set();
const requiredAgents = new Set(['ALL', 'AG001', 'AG002', 'AG003', 'AG004', 'AG005', 'AG006', 'AG012']);
const seenAgents = new Set();

for (const rule of registry.rules) {
  if (!rule.rule_id || ids.has(rule.rule_id)) {
    throw new Error('Playbook registry contract failed: duplicate/missing rule_id.');
  }
  ids.add(rule.rule_id);
  seenAgents.add(rule.agent_id);

  if (!rule.instruction || !rule.source || !rule.effective_date) {
    throw new Error('Playbook registry contract failed: incomplete rule ' + rule.rule_id);
  }
  if (rule.status !== 'ACTIVE') {
    throw new Error('Playbook registry contract failed: seed rule is not ACTIVE: ' + rule.rule_id);
  }
  if (rule.may_override_locked_rule !== false) {
    throw new Error('Playbook registry contract failed: locked-rule override is forbidden: ' + rule.rule_id);
  }
}

for (const agentId of requiredAgents) {
  if (!seenAgents.has(agentId)) {
    throw new Error('Playbook registry contract failed: missing scope ' + agentId);
  }
}

const allText = registry.rules.map((r) => r.instruction).join('\n').toLowerCase();
if (!allText.includes('ask/hold') || !allText.includes('founder approval')) {
  throw new Error('Playbook registry contract failed: governance controls missing.');
}
if (!allText.includes('tiktok') || !allText.includes('courier receivable')) {
  throw new Error('Playbook registry contract failed: locked finance/growth rules missing.');
}

console.log('PHASE2_PLAYBOOK_REGISTRY_CONTRACT_PASS');
