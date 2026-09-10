/**
 * Founder Control Tower — Agent Playbook Registry V1
 *
 * This is the Apps Script runtime mirror of config/agent-playbooks.json.
 * It is intentionally read-only. It does not silently modify locked Phase-1
 * prompts; Phase-2+ runners may consume the compact context explicitly.
 */

const FCT_AGENT_PLAYBOOK_REGISTRY_VERSION_ = '2026-09-10-PB-V1';

const FCT_AGENT_PLAYBOOK_RULES_ = Object.freeze([
  Object.freeze({ rule_id: 'PB-GOV-001', agent_id: 'ALL', domain: 'GOVERNANCE', instruction: 'Deterministic normalized/source/control data outranks deterministic alerts/reconciliation, which outranks founder snapshot, which outranks AI interpretation.', source: 'docs/GOVERNANCE.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-GOV-002', agent_id: 'ALL', domain: 'GOVERNANCE', instruction: 'When a material fact is ambiguous or missing, ASK/HOLD and do not guess.', source: 'docs/GOVERNANCE.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-GOV-003', agent_id: 'ALL', domain: 'GOVERNANCE', instruction: 'External actions, commitments and deployments require founder approval; internal analysis/reconciliation may proceed without external commitment.', source: 'docs/GOVERNANCE.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-LEDGER-001', agent_id: 'AG003', domain: 'FINANCE_CASH', instruction: 'Delivered does not imply Paid. Delivered-but-unpaid COD is courier receivable; cash and profit remain separate.', source: 'docs/BUSINESS_RULES.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-SCALE-001', agent_id: 'AG004', domain: 'ADS_GROWTH', instruction: 'Never scale from ROAS alone; require delivery-adjusted economics, all active ad channels, delivery success, physical stock days, cash control and freshness.', source: 'docs/BUSINESS_RULES.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-SCALE-002', agent_id: 'AG004', domain: 'ADS_GROWTH', instruction: 'If TikTok is active and TikTok spend is missing, final Real Contribution, Operating Profit and final SCALE go/no-go stay blocked.', source: 'docs/BUSINESS_RULES.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-ROUTE-001', agent_id: 'AG005', domain: 'LOGISTICS_COURIER', instruction: 'Last Mile finalized delivery success must be at least 70% for the scale gate; retain freshness/staleness qualifiers and do not infer product-to-courier exposure when absent.', source: 'docs/BUSINESS_RULES.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-STOCK-001', agent_id: 'AG006', domain: 'INVENTORY', instruction: 'Velocity is max(7-day average pickup, 14-day average pickup); physical available stock is authoritative and RRTO is not available until physically received.', source: 'docs/BUSINESS_RULES.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-STOCK-002', agent_id: 'AG006', domain: 'INVENTORY', instruction: 'Do not invent inbound PO, ETA, MOQ, supplier lead time or reorder quantity; stock severity must be dynamic from the current deterministic packet.', source: 'docs/BUSINESS_RULES.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-SENTINEL-001', agent_id: 'AG012', domain: 'AUDIT_DATA_QUALITY', instruction: 'An empty DATA_QUALITY table does not prove clean data; challenge unsupported conclusions against deterministic source truth.', source: 'docs/GOVERNANCE.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-ORBIT-001', agent_id: 'AG002', domain: 'SUPERVISION', instruction: 'Deduplicate and rank material issues, preserve SENTINEL blocks and do not turn unresolved evidence gaps into confident decisions.', source: 'docs/AGENT_REGISTRY.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false }),
  Object.freeze({ rule_id: 'PB-ATLAS-001', agent_id: 'AG001', domain: 'FOUNDER_DECISION', instruction: 'Present the founder with prioritized decisions and approval needs; do not execute governed actions.', source: 'docs/AGENT_REGISTRY.md', effective_date: '2026-09-10', status: 'ACTIVE', may_override_locked_rule: false })
]);

function fctAgentPlaybookRules_(agentId) {
  const id = String(agentId || '').trim().toUpperCase();
  if (!id) throw new Error('Agent ID is required for playbook context.');

  return FCT_AGENT_PLAYBOOK_RULES_.filter(function(rule) {
    return rule.status === 'ACTIVE' &&
      (rule.agent_id === 'ALL' || rule.agent_id === id);
  }).map(function(rule) {
    return {
      rule_id: rule.rule_id,
      agent_id: rule.agent_id,
      domain: rule.domain,
      instruction: rule.instruction,
      source: rule.source,
      effective_date: rule.effective_date
    };
  });
}

function fctAgentPlaybookContext_(agentId) {
  const rules = fctAgentPlaybookRules_(agentId);
  return {
    registry_version: FCT_AGENT_PLAYBOOK_REGISTRY_VERSION_,
    agent_id: String(agentId || '').trim().toUpperCase(),
    rules: rules,
    locked_rule_override_allowed: false
  };
}

function fctAssertAgentPlaybookSafe_() {
  const seen = {};

  FCT_AGENT_PLAYBOOK_RULES_.forEach(function(rule) {
    if (!rule.rule_id || seen[rule.rule_id]) {
      throw new Error('Duplicate or missing playbook rule_id: ' + String(rule.rule_id || ''));
    }
    seen[rule.rule_id] = true;

    if (rule.status !== 'ACTIVE') {
      throw new Error('Seed playbook rule must be ACTIVE: ' + rule.rule_id);
    }
    if (rule.may_override_locked_rule !== false) {
      throw new Error('Playbook rule may not override locked governance: ' + rule.rule_id);
    }
    if (!rule.instruction || !rule.source || !rule.effective_date) {
      throw new Error('Incomplete playbook rule: ' + rule.rule_id);
    }
  });

  return true;
}

function inspectFctAgentPlaybookNoWrite(agentId) {
  fctAssertAgentPlaybookSafe_();
  const context = fctAgentPlaybookContext_(agentId || 'AG001');
  const out = {
    status: 'PASS',
    registry_version: FCT_AGENT_PLAYBOOK_REGISTRY_VERSION_,
    agent_id: context.agent_id,
    rule_count: context.rules.length,
    rules: context.rules,
    writes_made: 0,
    external_actions_executed: 0
  };
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FCT_AGENT_PLAYBOOK_REGISTRY_VERSION_,
    FCT_AGENT_PLAYBOOK_RULES_,
    fctAgentPlaybookRules_,
    fctAgentPlaybookContext_,
    fctAssertAgentPlaybookSafe_
  };
}
