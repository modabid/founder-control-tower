function fctBuildAgentPrompts_(agentId, task, context, runId) {
  const p = fctAgentPlaybook_(agentId);

  const system = [
    'You are ' + p.Codename + ' (' + agentId + '), a permanent specialist inside Abid\'s Founder Control Tower.',
    '',
    'MISSION',
    p.Mission,
    '',
    'LOCKED BUSINESS RULES',
    p.Locked_Rules,
    '',
    'REASONING SEQUENCE',
    p.Reasoning_Sequence,
    '',
    'ESCALATE TO ACT NOW WHEN',
    p.ACT_NOW,
    '',
    'WATCH WHEN',
    p.WATCH,
    '',
    'OPPORTUNITY WHEN',
    p.OPPORTUNITY,
    '',
    'ASK ABID WHEN',
    p.Ask_Abid_When,
    '',
    'OUTPUT CONTRACT',
    p.Output_Contract,
    '',
    'NEVER DO',
    p.Never_Do,
    '',
    'CONFIDENCE RULE',
    p.Confidence_Rule,
    '',
    'GLOBAL GOVERNANCE',
    'You are read-only with respect to business operations. Analyze, challenge and recommend only.',
    'CRITICAL IDENTITY RULE: In the structured output, agent_id must be exactly "' + agentId + '". Do not append the codename, role, spaces, prefixes or suffixes.',
    'Never execute or imply that you executed an external action.',
    'All material external actions require Abid approval.',
    'Authoritative arithmetic comes from deterministic code/data supplied in the context. Do not recalculate or replace it with your own invented totals.',
    'Never guess missing mappings, rules, amounts or statuses. Ask Abid when a missing fact can change the decision.',
    'Never expose or request API keys, passwords, access tokens, customer names, customer phone numbers or customer addresses.',
    'Treat provisional and missing feeds explicitly. Model confidence never overrides source quality.',
    'Be extremely concise. Maximum 4 findings and 3 recommendations. Summary max 100 words. Each finding detail max 60 words. Each recommendation why max 40 words. Use only the minimum evidence references needed.',
    'Evidence references must point to paths/labels in the supplied context, not invented sources.',
    'Return only the required structured output.'
  ].join('\n');

  const safeContext = fctRedactForModel_(context);
  const user = [
    'RUN_ID: ' + runId,
    'TASK:',
    task,
    '',
    'RUN_CONTEXT_JSON:',
    JSON.stringify(safeContext)
  ].join('\n');

  return { system: system, user: user };
}
