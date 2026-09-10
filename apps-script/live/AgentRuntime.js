function fctCallProvider_(plan, prompts) {
  const opts = {
    agentId: plan.agentId,
    model: plan.model,
    effort: plan.effort,
    maxTokens: plan.maxTokens,
    systemPrompt: prompts.system,
    userPrompt: prompts.user
  };

  if (plan.provider === 'anthropic') {
    return fctAnthropicRequest_(opts);
  }
  return fctOpenAIRequest_(opts);
}

function fctFallbackPlan_(primaryPlan) {
  const route = fctAgentRoute_(primaryPlan.agentId);
  const fallbackModel = route.Challenger_Model;
  if (!fallbackModel) return null;

  return {
    agentId: primaryPlan.agentId,
    mode: 'FAILOVER',
    model: fallbackModel,
    provider: fctProviderForModel_(fallbackModel),
    effort: 'high',
    maxTokens: primaryPlan.maxTokens,
    challengerModel: '',
    challengerProvider: ''
  };
}

function fctRunAgent_(agentId, task, context, mode, runId) {
  const actualRunId = runId || fctRunId_();
  const prompts = fctBuildAgentPrompts_(agentId, task, context, actualRunId);
  const plan = fctRoutePlan_(agentId, mode || 'STANDARD');

  let response;
  let usedPlan = plan;
  let failedOver = false;

  try {
    response = fctCallProvider_(plan, prompts);

  } catch (e) {

    // Structured output/schema failure
    if (e.fctSchemaFailure) {

      const repairTask = [
        task,
        '',
        'REPAIR INSTRUCTION:',
        'The previous structured output was incomplete or invalid.',
        'Return a COMPLETE but VERY COMPACT structured object.',
        'Maximum 4 findings and 3 recommendations.',
        'Summary maximum 100 words.',
        'Finding detail maximum 60 words.',
        'Do not repeat evidence or explain methodology.',
        'Return only the required structured output.'
      ].join('\n');

      const repairPrompts = fctBuildAgentPrompts_(
        agentId,
        repairTask,
        context,
        actualRunId
      );

      const repairPlan = Object.assign({}, plan, {
        maxTokens: Math.max((plan.maxTokens || 1200) * 3, 4500)
      });

      try {
        response = fctCallProvider_(repairPlan, repairPrompts);
        usedPlan = repairPlan;

      } catch (repairError) {

        // Schema/API failure on repair -> cross-provider failover
        if (repairError.fctSchemaFailure || repairError.fctApiFailure) {

          const fallback = fctFallbackPlan_(plan);

          if (!fallback || fallback.provider === plan.provider) {
            throw repairError;
          }

          fallback.maxTokens = Math.max(
            fallback.maxTokens || 1200,
            4000
          );

          response = fctCallProvider_(fallback, repairPrompts);
          usedPlan = fallback;
          failedOver = true;

        } else {
          throw repairError;
        }
      }

    // Normal API/provider failure
    } else if (e.fctApiFailure) {

      const fallback = fctFallbackPlan_(plan);

      if (!fallback || fallback.provider === plan.provider) {
        throw e;
      }

      fallback.maxTokens = Math.max(
  fallback.maxTokens || 1200,
  4000
);

usedPlan = fallback;
failedOver = true;
response = fctCallProvider_(fallback, prompts);

    } else {
      throw e;
    }
  }

  const parsed = fctValidateAgentResult_(response.parsed, agentId);
  parsed.run_id = actualRunId;

  return {
    result: parsed,
    runtime: {
      provider: usedPlan.provider,
      model: response.model || usedPlan.model,
      effort: usedPlan.effort,
      failed_over: failedOver,
      usage: response.usage || {}
    }
  };
}

function fctRunChallenger_(agentId, primaryResult, originalContext, runId) {
  const route = fctAgentRoute_(agentId);
  if (!route.Challenger_Model) return null;

  const model = route.Challenger_Model;
  const plan = {
    agentId: agentId,
    mode: 'CHALLENGER',
    model: model,
    provider: fctProviderForModel_(model),
    effort: 'high',
    maxTokens: fctParseTokenCap_(route.Output_Cap, 1200)
  };

  const task = [
    'Act as an independent challenger.',
    'Review the primary agent result against the same evidence and locked business rules.',
    'Do not agree automatically.',
    'If the evidence is insufficient, say so and ask Abid rather than choosing a side.',
    'Primary result is included in context.primary_result.'
  ].join(' ');

  const context = {
    original_context: originalContext,
    primary_result: primaryResult
  };

  const prompts = fctBuildAgentPrompts_(agentId, task, context, runId);
  const response = fctCallProvider_(plan, prompts);

  return {
    result: fctValidateAgentResult_(response.parsed, agentId),
    runtime: {
      provider: plan.provider,
      model: response.model || plan.model,
      effort: plan.effort,
      failed_over: false,
      usage: response.usage || {}
    }
  };
}

function fctShouldChallengeAtlas_(sentinel, orbit, atlas) {
  if (!sentinel || !orbit || !atlas) return false;
  if (sentinel.audit_status === 'FAIL') return false;

  return (
    atlas.severity === 'CRITICAL' ||
    orbit.severity === 'CRITICAL' ||
    sentinel.audit_status === 'PASS_WITH_WARNING' && atlas.approval_required
  );
}
