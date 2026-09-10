function fctAnthropicRequest_(opts) {
  const apiKey = fctGetScriptProperty_(FCT_AI_CONFIG.ANTHROPIC_API_KEY_PROP, true);

  const payload = {
    model: opts.model,
    max_tokens: opts.maxTokens || 1200,
    system: opts.systemPrompt,
    messages: [
      {
        role: 'user',
        content: opts.userPrompt
      }
    ],
    output_config: {
      effort: opts.effort || 'medium',
      format: {
        type: 'json_schema',
        schema: fctAgentResultSchema_(opts.agentId)
      }
    }
  };

  const json = fctHttpJson_(
    FCT_AI_CONFIG.ANTHROPIC_MESSAGES_URL,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': FCT_AI_CONFIG.ANTHROPIC_VERSION
      },
      payload: JSON.stringify(payload)
    },
    'Anthropic'
  );

  if (json.stop_reason === 'refusal') {
    throw new Error('Anthropic refused agent request.');
  }
if (json.stop_reason === 'max_tokens') {
  let truncatedText = '';
  (json.content || []).forEach(function(block) {
    if (block.type === 'text' && block.text) {
      truncatedText += block.text;
    }
  });

  throw fctSchemaError_(
    'Anthropic output reached max_tokens before completing structured JSON.',
    truncatedText
  );
}

  let outputText = '';
  (json.content || []).forEach(function(block) {
    if (block.type === 'text' && block.text) {
      outputText += block.text;
    }
  });

  if (!outputText) {
    throw fctSchemaError_('Anthropic returned no text block.', JSON.stringify(json));
  }

  try {
    return {
      parsed: JSON.parse(outputText),
      raw: outputText,
      model: json.model || opts.model,
      usage: json.usage || {}
    };
  } catch (e) {
    throw fctSchemaError_('Anthropic output was not valid JSON.', outputText);
  }
}
