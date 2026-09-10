function fctOpenAIRequest_(opts) {
  const apiKey = fctGetScriptProperty_(FCT_AI_CONFIG.OPENAI_API_KEY_PROP, true);

  const payload = {
    model: opts.model,
    input: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt }
    ],
    reasoning: {
      effort: opts.effort || 'medium'
    },
    max_output_tokens: opts.maxTokens || 1200,
    store: false,
    text: {
      format: {
        type: 'json_schema',
        name: 'fct_agent_result',
        strict: true,
        schema: fctAgentResultSchema_(opts.agentId)
      }
    }
  };

  const json = fctHttpJson_(
    FCT_AI_CONFIG.OPENAI_RESPONSES_URL,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload)
    },
    'OpenAI'
  );

  if (json.status === 'incomplete') {
  const reason =
    json.incomplete_details &&
    json.incomplete_details.reason;

  // Token-limit incomplete output is a structured-output completion issue,
  // so AgentRuntime should retry the SAME provider with a larger token cap.
  if (reason === 'max_output_tokens') {
    throw fctSchemaError_(
      'OpenAI output reached max_output_tokens before completing structured JSON.',
      JSON.stringify(json)
    );
  }

  throw fctApiError_(
    'OpenAI response incomplete: ' +
      JSON.stringify(json.incomplete_details || {}),
    200,
    JSON.stringify(json)
  );
}

  let outputText = '';
  let refusal = '';

  (json.output || []).forEach(function(item) {
    (item.content || []).forEach(function(content) {
      if (content.type === 'output_text' && content.text) {
        outputText += content.text;
      }
      if (content.type === 'refusal') {
        refusal += content.refusal || content.text || 'refusal';
      }
    });
  });

  if (refusal) {
    throw new Error('OpenAI refused agent request: ' + refusal);
  }

  if (!outputText) {
    throw fctSchemaError_('OpenAI returned no output_text.', JSON.stringify(json));
  }

  try {
    return {
      parsed: JSON.parse(outputText),
      raw: outputText,
      model: json.model || opts.model,
      usage: json.usage || {}
    };
  } catch (e) {
    throw fctSchemaError_('OpenAI output was not valid JSON.', outputText);
  }
}
