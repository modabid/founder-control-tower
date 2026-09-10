/**
 * Founder Control Tower — Step 6I
 * AG012 SENTINEL — Phase-1 deterministic cross-domain audit.
 *
 * Purpose:
 *   Audit LEDGER + SCALE + ROUTE + STOCK deterministic source truth
 *   before supervisor/founder synthesis.
 *
 * ADDITIVE FILE ONLY.
 * No sheet writes.
 * No operational execution.
 * No external actions.
 */

function runFctSentinelPhase1AuditAI() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    throw new Error(
      'Another Founder Control Tower AI run is already in progress.'
    );
  }

  const runId = fctRunId_();

  try {
    const packet = fctBuildSentinelPhase1AuditPacket_();

    const task = [
      'Act as AG012 SENTINEL, the Phase-1 Data Quality and Audit Agent.',
      'Audit the supplied deterministic cross-domain packet before ORBIT or ATLAS may rely on it.',
      'Deterministic source values and explicit reconciliation statuses are authoritative.',
      'Your job is to challenge unsupported conclusions, identify contradictions, preserve blockers, and distinguish a real business risk from a data-quality limitation.',
      'Do not repair source truth by guessing and do not average conflicting cohorts to make them agree.',
      'A deterministic FAIL caused by missing/bad evidence means HOLD/ASK for the affected conclusion; do not vote around it.',
      'Locked business rules are not founder-preference questions. Do not ask whether a locked hard block can be bypassed, relaxed, tolerated, or converted into a provisional go/no-go.',
      'TikTok spend is an active-channel blocker. Final Real Contribution, Operating Profit, and final SCALE decisions must remain blocked while TikTok spend is missing. This is a locked rule and must not be presented as optional or subject to founder override in questions_for_abid.',
      'Meta platform spend should reconcile between LEDGER, SCALE, and STOCK attribution summaries. If deterministic cross-check says MATCH, preserve that result.',
      'LEDGER courier receivable should reconcile to the sum of normalized current-month ROUTE delivered-unpaid receivables. If the deterministic cross-check says MATCH, do not invent a cash mismatch.',
      'Do not confuse ROUTE live operational cohorts, ORDERS_MASTER normalized cohorts, COURIER_PERF financial view, or historical settlement evidence.',
      'Last Mile below 70% is a real operational risk, but if the poll age is over the freshness threshold you MUST call the feed STALE/REVIEW, never fresh/current. The stale qualifier does not erase the risk; it limits confidence in the exact current counts.',
      'C3X June cash settlement is matched. TFM/OTO screening differences are not confirmed shortages without settlement evidence.',
      'SCALE group Meta-to-PRODUCT_PNL gap and LEDGER Meta-to-DAILY_PNL gap are different reconciliation scopes. Do not equate them.',
      'Kuwait OTE and UAE OTO are distinct couriers.',
      'STOCK physical available units and max(7d,14d) velocity are authoritative for stock risk. RRTO is not available until physically received.',
      'Every row in stock.critical_stock is a deterministic material risk and must appear in the audit findings with its country and SKU. You may combine multiple critical rows into one finding, but no critical country+SKU may be omitted.',
      'Stock severity is packet-driven. Treat only rows in stock.critical_stock as CRITICAL/OUT_OF_STOCK and rows in stock.watch_stock as WATCH. Never promote a WATCH row to CRITICAL because of an older brief or prior run.',
      'Market-specific ad activity is proven only when that exact country+SKU row has known_market_meta_spend_aed > 0. SKU-total or GROUP product economics must never be used to infer market-specific ad activity.',
      'Missing market-specific Meta linkage affects ad-activity classification only; it is not a prerequisite to acknowledging or acting on deterministic physical stock risk.',
      'No inbound PO/ETA/lead-time/MOQ pipeline is available; do not invent replenishment quantities.',
      'When recommending stock evidence/replenishment review, use the current deterministic stock_gate and priority for each market+SKU. Do not carry forward stale SKU severity labels from earlier runs.',
      'Primary-SKU attribution and country-pending Meta allocation are provisional review items, not universal hard blockers unless the deterministic packet makes them SKU/market-specific.',
      'Maximum 4 findings and maximum 3 recommendations.',
      'Keep output compact for structured reliability: summary maximum 80 words; finding detail maximum 45 words; recommendation why maximum 35 words; maximum 2 evidence_refs per finding; maximum 2 questions_for_abid; maximum 6 provisional_fields. Do not repeat the same evidence across summary, findings and recommendations.',
      'Any recommendation involving an external contact, source-system change, ad/courier/order/stock/payment action, or business commitment requires approval_required=true.',
      'Internal reconciliation, evidence comparison, or source refresh checks may use approval_required=false.',
      'Never bundle an internal no-approval action and an external approval-required action into one recommendation. Split them into separate recommendations so approval_required is unambiguous.',
      'A fresh internal courier API/data poll may be approval_required=false. Requesting remittance/settlement statements from a courier is external contact and must be approval_required=true.',
      'A recommendation that only says to HOLD an internal conclusion/decision is approval_required=false unless it also asks to change a system, obtain external data, or take an external action.',
      'Do not execute or imply execution.',
      'questions_for_abid may request missing evidence or approval for an external action only. Never use questions_for_abid to renegotiate or bypass a locked rule. If no valid founder question exists, return an empty array.',
      'Return a concise audit verdict suitable for ORBIT.'
    ].join(' ');

    const context =
      fctSentinelBuildAIContext_(packet, false);

    const aiRun =
      fctSentinelRunAIWithRecovery_(
        task,
        context,
        packet,
        runId
      );

    if (!aiRun || !aiRun.result) {
      throw new Error(
        'SENTINEL AI runtime returned no structured result.'
      );
    }

    if (aiRun.result.agent_id !== 'AG012') {
      throw new Error(
        'SENTINEL identity contract failed: ' +
        String(aiRun.result.agent_id || '')
      );
    }

    const severity =
      String(aiRun.result.severity || '').toUpperCase();

    if (
      (severity === 'WATCH' ||
       severity === 'ACT_NOW' ||
       severity === 'CRITICAL') &&
      (!Array.isArray(aiRun.result.findings) ||
       aiRun.result.findings.length === 0)
    ) {
      throw new Error(
        'SENTINEL output contract failed: material severity with no findings.'
      );
    }

    fctSentinelAssertCriticalStockCoverage_(
      packet.stock.critical_stock || [],
      aiRun.result.findings || []
    );

    fctSentinelAssertCriticalCountClaims_(
      packet.stock.critical_stock || [],
      aiRun.result
    );

    fctSentinelAssertWatchRowsNotPromoted_(
      packet.stock.watch_stock || [],
      aiRun.result
    );

    const lastMile = (packet.route.live_courier_view || []).find(function(x) {
      return String(x.courier || '').toLowerCase() === 'last mile';
    });

    if (lastMile &&
        String(lastMile.freshness_status || '').toUpperCase() === 'STALE_REVIEW') {
      const auditText = JSON.stringify(aiRun.result);
      if (/fresh data|fresh live data|fresh operational/i.test(auditText)) {
        throw new Error(
          'SENTINEL semantic contract failed: Last Mile is STALE_REVIEW but AI described it as fresh.'
        );
      }
    }

    aiRun.result = fctSentinelEnforceLockedGovernance_(aiRun.result);

    const output = {
      run_id: runId,
      status: 'SUCCESS',
      agent_id: 'AG012',
      packet_status: packet.overall_source_status,
      runtime: aiRun.runtime,
      recovery_retry:
        !!aiRun.sentinel_recovery_retry,
      ai_context_chars:
        aiRun.sentinel_ai_context_chars || null,
      deterministic_cross_checks:
        packet.deterministic_cross_checks,
      stock_classification:
        fctSentinelStockClassification_(packet.stock),
      result: aiRun.result
    };

    Logger.log(JSON.stringify(output, null, 2));
    return output;

  } finally {
    lock.releaseLock();
  }
}


function testFctSentinelPhase1AuditAI() {
  return runFctSentinelPhase1AuditAI();
}


function testFctSentinelPhase1PacketNoApi() {
  const p = fctBuildSentinelPhase1AuditPacket_();

  if (!p || p.packet_for !== 'AG012') {
    throw new Error(
      'SENTINEL packet contract failed.'
    );
  }

  const checks = p.deterministic_cross_checks || {};

  if (
    checks.meta_platform_spend_ledger_vs_scale &&
    checks.meta_platform_spend_ledger_vs_scale.status !== 'MATCH'
  ) {
    throw new Error(
      'SENTINEL cross-check failed: LEDGER vs SCALE Meta platform spend.'
    );
  }

  if (
    checks.courier_receivable_ledger_vs_route &&
    checks.courier_receivable_ledger_vs_route.status !== 'MATCH'
  ) {
    throw new Error(
      'SENTINEL cross-check failed: LEDGER vs ROUTE courier receivable.'
    );
  }

  Logger.log(JSON.stringify(p, null, 2));
  return p;
}





function fctSentinelRunAIWithRecovery_(
  task,
  context,
  packet,
  runId
) {
  try {
    const first = fctRunAgent_(
      'AG012',
      task,
      context,
      'STANDARD',
      runId
    );

    if (first) {
      first.sentinel_recovery_retry = false;
      first.sentinel_ai_context_chars =
        JSON.stringify(context).length;
    }

    return first;

  } catch (err) {
    if (!fctSentinelIsOutputCompletionError_(err)) {
      throw err;
    }

    const recoveryContext =
      fctSentinelBuildAIContext_(packet, true);

    const recoveryTask = [
      task,
      'RECOVERY MODE: Return the smallest valid structured audit.',
      'Use no more than 3 findings and 3 recommendations.',
      'Summary maximum 60 words.',
      'Each finding detail maximum 30 words.',
      'Each recommendation why maximum 25 words.',
      'Use maximum 1 evidence_ref per finding.',
      'Use maximum 1 question_for_abid.',
      'Use maximum 4 provisional_fields.',
      'Do not restate methodology, source precedence, or matched checks except where needed for the verdict.'
    ].join(' ');

    const recovered = fctRunAgent_(
      'AG012',
      recoveryTask,
      recoveryContext,
      'STANDARD',
      runId
    );

    if (recovered) {
      recovered.sentinel_recovery_retry = true;
      recovered.sentinel_ai_context_chars =
        JSON.stringify(recoveryContext).length;
    }

    return recovered;
  }
}


function fctSentinelIsOutputCompletionError_(err) {
  const s = String(
    (err && err.message) || err || ''
  );

  return (
    /max_output_tokens/i.test(s) ||
    /max_tokens/i.test(s) ||
    /before completing structured JSON/i.test(s) ||
    /structured output.*incomplete/i.test(s) ||
    /schema\/output completion/i.test(s)
  );
}


function fctSentinelBuildAIContext_(
  packet,
  ultraCompact
) {
  const p = packet || {};
  const ledger = p.ledger || {};
  const scale = p.scale || {};
  const route = p.route || {};
  const stock = p.stock || {};

  const compactPacket = {
    overall_source_status:
      p.overall_source_status,
    source_statuses:
      p.source_statuses,
    deterministic_cross_checks:
      p.deterministic_cross_checks,

    ledger: {
      period: ledger.period,
      economics:
        fctSentinelPick_(
          ledger.economics,
          [
            'orders_picked_mtd',
            'delivered_unpaid_mtd',
            'paid_mtd',
            'rrto_mtd',
            'finalized_delivery_success',
            'delivered_revenue_aed',
            'gross_contribution_aed',
            'meta_platform_spend_aed',
            'meta_not_represented_in_daily_pnl_aed',
            'contribution_after_all_meta_aed',
            'tiktok_spend_aed',
            'real_contribution_profit_aed',
            'real_contribution_status',
            'real_operating_profit_aed',
            'real_operating_profit_status',
            'courier_receivable_aed'
          ]
        ),
      cash_reconciliation:
        ledger.cash_reconciliation,
      data_quality:
        fctSentinelCompactDQ_(
          ledger.data_quality,
          ultraCompact ? 5 : 8
        )
    },

    scale: {
      channel_completeness:
        scale.channel_completeness,
      meta: scale.meta,
      courier_scale_gates:
        scale.courier_scale_gates,
      data_quality:
        fctSentinelCompactDQ_(
          scale.data_quality,
          ultraCompact ? 5 : 8
        )
    },

    route: {
      live_courier_view:
        route.live_courier_view,
      settlement_reconciliation:
        route.settlement_reconciliation,
      normalized_order_view:
        ultraCompact
          ? []
          : route.normalized_order_view,
      data_quality:
        fctSentinelCompactDQ_(
          route.data_quality,
          ultraCompact ? 6 : 10
        )
    },

    stock: {
      inventory_summary:
        stock.inventory_summary,
      critical_stock:
        (stock.critical_stock || [])
          .slice(0, 10),
      watch_stock:
        (stock.watch_stock || [])
          .slice(0, ultraCompact ? 5 : 8),
      inbound_visibility:
        stock.inbound_visibility,
      meta_market_attribution:
        stock.meta_market_attribution,
      reconciliation_exceptions:
        ultraCompact
          ? []
          : (stock.reconciliation_exceptions || [])
              .slice(0, 8),
      data_quality:
        fctSentinelCompactDQ_(
          stock.data_quality,
          ultraCompact ? 6 : 10
        )
    },

    locked_interpretation_rules:
      p.locked_interpretation_rules
  };

  return {
    phase1_audit_packet: compactPacket,
    governance: {
      mode: 'AUDIT_ONLY',
      may_execute: false,
      final_authority: 'Abid',
      reporting_chain:
        'Domain Agents -> SENTINEL -> ORBIT -> ATLAS -> Abid',
      source_precedence: [
        'DETERMINISTIC_SOURCE_AND_CONTROL_DATA',
        'DETERMINISTIC_CROSS_CHECKS',
        'CURRENT_ALERTS_AND_RECONCILIATION_STATUS',
        'AI_AUDIT'
      ]
    },
    phase_note:
      ultraCompact
        ? 'Structured-output recovery context. Source truth is unchanged; only nonessential detail was removed.'
        : 'Compact Step 6I SENTINEL context. Full deterministic packet remains available to runtime guards outside the AI prompt.'
  };
}


function fctSentinelCompactDQ_(dq, limit) {
  const x = dq || {};
  const flags = Array.isArray(x.flags)
    ? x.flags
    : [];

  const ranked = flags.slice().sort(function(a, b) {
    const rank = {
      FAIL: 0,
      CRITICAL: 0,
      ACT_NOW: 1,
      REVIEW: 2,
      WATCH: 2,
      NORMAL: 3
    };

    const aa = String(
      (a && a.severity) || ''
    ).toUpperCase();

    const bb = String(
      (b && b.severity) || ''
    ).toUpperCase();

    return (
      (rank[aa] === undefined ? 9 : rank[aa]) -
      (rank[bb] === undefined ? 9 : rank[bb])
    );
  });

  return {
    status: x.status,
    flags: ranked
      .slice(0, limit || 8)
      .map(function(f) {
        return {
          severity: f && f.severity,
          code: f && f.code,
          detail:
            fctSentinelTrimText_(
              f && f.detail,
              220
            )
        };
      })
  };
}


function fctSentinelPick_(obj, keys) {
  const src = obj || {};
  const out = {};

  (keys || []).forEach(function(k) {
    if (Object.prototype.hasOwnProperty.call(
          src,
          k
        )) {
      out[k] = src[k];
    }
  });

  return out;
}


function fctSentinelTrimText_(value, maxLen) {
  const s = String(
    value === undefined ||
    value === null
      ? ''
      : value
  );

  const n = Number(maxLen || 220);

  return s.length <= n
    ? s
    : s.slice(0, n - 1) + '…';
}


function testFctSentinelCompactRecoveryNoApi() {
  const mockPacket = {
    overall_source_status: 'FAIL',
    source_statuses: {
      ledger: 'FAIL',
      scale: 'FAIL',
      route: 'FAIL',
      stock: 'FAIL'
    },
    deterministic_cross_checks: {
      tiktok_blocker_consistency: {
        status: 'MATCH'
      }
    },
    ledger: {
      period: { month: '2026-09' },
      economics: {
        finalized_delivery_success: 0.84,
        meta_platform_spend_aed: 6701.85,
        real_contribution_status:
          'BLOCKED_MISSING_TIKTOK_SPEND',
        courier_receivable_aed: 24204.73
      },
      cash_reconciliation: {
        items: [
          { courier: 'C3X', status: 'MATCHED' },
          { courier: 'TFM', status: 'REVIEW' },
          { courier: 'OTO', status: 'REVIEW' }
        ]
      },
      data_quality: {
        status: 'FAIL',
        flags: new Array(20).fill(null)
          .map(function(_, i) {
            return {
              severity:
                i < 2 ? 'FAIL' : 'REVIEW',
              code: 'LEDGER_' + i,
              detail:
                'Long deterministic ledger detail ' +
                i + ' ' + new Array(30).join('x')
            };
          })
      }
    },
    scale: {
      channel_completeness: {
        tiktok: {
          status:
            'MISSING_ACTIVE_CHANNEL_SPEND'
        }
      },
      meta: {
        platform_spend_aed: 6701.85
      },
      courier_scale_gates: [
        {
          courier: 'Last Mile',
          gate_status: 'FAIL'
        }
      ],
      data_quality: {
        status: 'FAIL',
        flags: []
      }
    },
    route: {
      live_courier_view: [
        {
          courier: 'Last Mile',
          finalized_success: 0.641,
          freshness_status: 'STALE_REVIEW'
        }
      ],
      settlement_reconciliation: [
        { courier: 'C3X', status: 'MATCHED' },
        { courier: 'TFM', status: 'REVIEW' },
        { courier: 'OTO', status: 'REVIEW' }
      ],
      normalized_order_view: new Array(20)
        .fill(null)
        .map(function(_, i) {
          return {
            courier: 'C' + i,
            delivered_unpaid: i,
            rrto: 1
          };
        }),
      data_quality: {
        status: 'FAIL',
        flags: []
      }
    },
    stock: {
      inventory_summary: {
        critical_le_3d_rows: 1,
        out_of_stock_rows: 2
      },
      critical_stock: [
        {
          country:
            'United Arab Emirates',
          sku: 'PLG597',
          available_stock_days: 2.09
        },
        {
          country:
            'United Arab Emirates',
          sku: 'PLG609',
          available_stock_days: 0
        },
        {
          country: 'Kuwait',
          sku: 'PLG597',
          available_stock_days: 0
        }
      ],
      watch_stock: [
        {
          country: 'Kuwait',
          sku: 'PLG617',
          available_stock_days: 3.5
        }
      ],
      inbound_visibility: {
        has_reliable_open_inbound_pipeline:
          false
      },
      meta_market_attribution: {
        platform_spend_aed: 6701.85
      },
      reconciliation_exceptions:
        new Array(20).fill(null)
          .map(function(_, i) {
            return {
              sku: 'X' + i,
              detail: 'recon'
            };
          }),
      data_quality: {
        status: 'FAIL',
        flags: []
      }
    },
    locked_interpretation_rules: {
      scale:
        'Final SCALE blocked while TikTok missing.'
    }
  };

  const normal =
    fctSentinelBuildAIContext_(
      mockPacket,
      false
    );

  const recovery =
    fctSentinelBuildAIContext_(
      mockPacket,
      true
    );

  if (
    JSON.stringify(recovery).length >=
    JSON.stringify(normal).length
  ) {
    throw new Error(
      'SENTINEL recovery context is not smaller than normal compact context.'
    );
  }

  if (
    recovery.phase1_audit_packet
      .stock.critical_stock.length !== 3
  ) {
    throw new Error(
      'SENTINEL recovery context dropped critical stock truth.'
    );
  }

  if (
    recovery.phase1_audit_packet
      .stock.watch_stock[0].sku !==
      'PLG617'
  ) {
    throw new Error(
      'SENTINEL recovery context dropped current WATCH classification.'
    );
  }

  if (
    !fctSentinelIsOutputCompletionError_(
      new Error(
        'OpenAI output reached max_output_tokens before completing structured JSON.'
      )
    )
  ) {
    throw new Error(
      'SENTINEL output-completion detector missed the exact production error.'
    );
  }

  Logger.log(
    'SENTINEL compact recovery guards PASS'
  );
  return true;
}


function fctSentinelStockClassification_(stock) {
  return {
    critical_keys: fctSentinelStockKeys_(
      (stock && stock.critical_stock) || []
    ),
    watch_keys: fctSentinelStockKeys_(
      (stock && stock.watch_stock) || []
    )
  };
}


function fctSentinelStockKeys_(rows) {
  return (rows || []).map(function(x) {
    return String((x && x.country) || '').trim() + '|' +
      String((x && x.sku) || '').trim().toUpperCase();
  }).filter(function(x) {
    return x !== '|';
  }).sort();
}


function fctSentinelAssertCriticalCountClaims_(criticalRows, result) {
  const actual = (criticalRows || []).length;
  const text = JSON.stringify(result || {});
  const words = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };
  const re = /\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b\s+(?:deterministic\s+)?critical(?:[- ]stock)?\s+(?:rows?|risks?|exposures?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = String(m[1] || '').toLowerCase();
    const claimed = Object.prototype.hasOwnProperty.call(words, raw)
      ? words[raw]
      : Number(raw);
    if (isFinite(claimed) && claimed !== actual) {
      throw new Error(
        'SENTINEL stock-severity contract failed: narrative claims ' +
        claimed + ' critical stock rows/risks but deterministic packet has ' +
        actual + '.'
      );
    }
  }
  return true;
}


function fctSentinelAssertWatchRowsNotPromoted_(watchRows, result) {
  const text = JSON.stringify(result || {});
  const upper = text.toUpperCase();

  (watchRows || []).forEach(function(x) {
    const sku = String((x && x.sku) || '').trim().toUpperCase();
    if (!sku) return;

    let pos = upper.indexOf(sku);
    while (pos >= 0) {
      const start = Math.max(0, pos - 110);
      const end = Math.min(upper.length, pos + sku.length + 110);
      const windowText = upper.slice(start, end);
      const skuLocal = pos - start;
      const labels = [];
      const patterns = [
        { type: 'CRITICAL', re: /\bCRITICAL\b|\bOUT OF STOCK\b|\bOOS\b|\bACT[_ ]NOW\b|≤\s*3|<=\s*3/g },
        { type: 'WATCH', re: /\bWATCH\b|\bREORDER\b|≤\s*7|<=\s*7/g }
      ];

      patterns.forEach(function(spec) {
        spec.re.lastIndex = 0;
        let m;
        while ((m = spec.re.exec(windowText)) !== null) {
          labels.push({ type: spec.type, distance: Math.abs(m.index - skuLocal) });
        }
      });

      if (labels.length) {
        labels.sort(function(a, b) { return a.distance - b.distance; });
        if (labels[0].type === 'CRITICAL') {
          throw new Error(
            'SENTINEL stock-severity contract failed: WATCH row ' +
            sku + ' was described with a CRITICAL/OOS/ACT_NOW label.'
          );
        }
      }
      pos = upper.indexOf(sku, pos + sku.length);
    }
  });
  return true;
}


function fctSentinelAssertCriticalStockCoverage_(
  criticalRows,
  findings
) {
  const findingText = (findings || []).map(function(f) {
    return [
      String((f && f.title) || ''),
      String((f && f.detail) || '')
    ].join(' ');
  }).join(' ');

  const missing = [];

  (criticalRows || []).forEach(function(x) {
    const country = String((x && x.country) || '').trim();
    const sku = String((x && x.sku) || '').trim().toUpperCase();

    if (!country || !sku) return;

    if (!fctSentinelHasCountrySkuMention_(
          findingText,
          country,
          sku
        )) {
      missing.push(country + ' ' + sku);
    }
  });

  if (missing.length) {
    throw new Error(
      'SENTINEL completeness contract failed: deterministic critical stock omitted from findings: ' +
      missing.join(', ')
    );
  }

  return true;
}


function fctSentinelHasCountrySkuMention_(
  text,
  country,
  sku
) {
  const s = String(text || '');
  const c = String(country || '').toLowerCase();
  const p = String(sku || '').toUpperCase();

  const aliases =
    c.indexOf('united arab emirates') >= 0
      ? ['UAE', 'United Arab Emirates']
      : (c.indexOf('kuwait') >= 0
          ? ['Kuwait', 'KWT']
          : [country]);

  return aliases.some(function(alias) {
    const a = fctSentinelEscapeRegex_(alias);
    const k = fctSentinelEscapeRegex_(p);

    return (
      new RegExp(
        '\\b' + a + '\\b.{0,140}\\b' + k + '\\b',
        'i'
      ).test(s) ||
      new RegExp(
        '\\b' + k + '\\b.{0,140}\\b' + a + '\\b',
        'i'
      ).test(s)
    );
  });
}


function fctSentinelEscapeRegex_(value) {
  return String(value || '').replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
}


function testFctSentinelDynamicStockSeverityNoApi() {
  const critical = [
    { country: 'United Arab Emirates', sku: 'PLG597' },
    { country: 'United Arab Emirates', sku: 'PLG609' },
    { country: 'Kuwait', sku: 'PLG597' }
  ];

  fctSentinelAssertCriticalCountClaims_(critical, {
    summary: 'Three critical stock rows remain open; Kuwait PLG617 is WATCH at 3.5 days.'
  });

  fctSentinelAssertWatchRowsNotPromoted_(
    [{ country: 'Kuwait', sku: 'PLG617' }],
    { summary: 'Kuwait PLG617 is WATCH at 3.5 days.' }
  );

  let watchCaught = false;
  try {
    fctSentinelAssertWatchRowsNotPromoted_(
      [{ country: 'Kuwait', sku: 'PLG617' }],
      { summary: 'Kuwait PLG617 is CRITICAL at 3.5 days.' }
    );
  } catch (e) {
    watchCaught = /WATCH row PLG617/i.test(String((e && e.message) || e));
  }
  if (!watchCaught) {
    throw new Error('SENTINEL watch-severity guard failed.');
  }

  let caught = false;
  try {
    fctSentinelAssertCriticalCountClaims_(critical, {
      recommendations: [{
        action: 'Request evidence for all four critical stock rows.'
      }]
    });
  } catch (e) {
    caught = /packet has 3/i.test(String((e && e.message) || e));
  }

  if (!caught) {
    throw new Error(
      'SENTINEL dynamic-stock guard failed to reject stale four-critical claim.'
    );
  }

  Logger.log('SENTINEL dynamic stock severity guards PASS');
  return true;
}


function testFctSentinelCriticalStockCoverageNoApi() {
  const critical = [
    { country: 'United Arab Emirates', sku: 'PLG597' },
    { country: 'United Arab Emirates', sku: 'PLG609' },
    { country: 'Kuwait', sku: 'PLG597' },
    { country: 'Kuwait', sku: 'PLG617' }
  ];

  const complete = [{
    title: 'Critical stock',
    detail:
      'UAE PLG597 is at 1.88d; UAE PLG609 is out of stock; Kuwait PLG597 is out of stock; Kuwait PLG617 is at 1.75d.'
  }];

  fctSentinelAssertCriticalStockCoverage_(
    critical,
    complete
  );

  let caught = false;

  try {
    fctSentinelAssertCriticalStockCoverage_(
      critical,
      [{
        title: 'Critical stock',
        detail:
          'UAE PLG597, Kuwait PLG597 and Kuwait PLG617 are critical.'
      }]
    );
  } catch (e) {
    caught = /PLG609/i.test(
      String((e && e.message) || e)
    );
  }

  if (!caught) {
    throw new Error(
      'SENTINEL critical-stock completeness guard failed to catch omitted UAE PLG609.'
    );
  }

  Logger.log(
    'SENTINEL critical stock coverage guards PASS'
  );
  return true;
}


function fctSentinelEnforceLockedGovernance_(result) {
  if (!result || typeof result !== 'object') {
    throw new Error(
      'SENTINEL governance enforcement failed: invalid result object.'
    );
  }

  // 1) Questions are allowed to request missing evidence or explicit approval.
  // They are NOT allowed to renegotiate locked business rules.
  const rawQuestions = Array.isArray(result.questions_for_abid)
    ? result.questions_for_abid
    : [];

  result.questions_for_abid = rawQuestions.filter(function(q) {
    const s = String(q || '');

    return !fctSentinelQuestionAsksTikTokBypass_(s) &&
      !fctSentinelMakesMarketMetaStockPrereq_(s);
  });

  // 2) Recommendation approval semantics are deterministic.
  const recs = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  recs.forEach(function(rec) {
    const action = String((rec && rec.action) || '');
    const externalAction =
      fctSentinelIsExternalApprovalAction_(action);
    const internalRefresh =
      fctSentinelIsInternalRefreshAction_(action);
    const pureInternalHold =
      fctSentinelIsPureInternalHold_(action);

    if (externalAction && internalRefresh) {
      throw new Error(
        'SENTINEL recommendation contract failed: mixed internal and external actions must be split.'
      );
    }

    if (externalAction) {
      rec.approval_required = true;
    } else if (pureInternalHold || internalRefresh) {
      rec.approval_required = false;
    }
  });

  if (recs.length > 3) {
    throw new Error(
      'SENTINEL output contract failed: maximum 3 recommendations allowed.'
    );
  }

  if (Array.isArray(result.findings) &&
      result.findings.length > 4) {
    throw new Error(
      'SENTINEL output contract failed: maximum 4 findings allowed.'
    );
  }

  result.approval_required = recs.some(function(rec) {
    return !!(rec && rec.approval_required);
  });

  // 2) Narrative/recommendation content is stricter.
  // If the model actually recommends bypassing a locked rule,
  // fail the run rather than silently editing the decision logic.
  const narrativeParts = [];

  narrativeParts.push(String(result.summary || ''));

  (Array.isArray(result.findings) ? result.findings : [])
    .forEach(function(x) {
      narrativeParts.push(String((x && x.title) || ''));
      narrativeParts.push(String((x && x.detail) || ''));
    });

  (Array.isArray(result.recommendations) ? result.recommendations : [])
    .forEach(function(x) {
      narrativeParts.push(String((x && x.action) || ''));
      narrativeParts.push(String((x && x.why) || ''));
    });

  narrativeParts.forEach(function(s) {
    if (fctSentinelAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'SENTINEL governance contract failed: narrative attempted to bypass the locked TikTok blocker.'
      );
    }

    if (fctSentinelMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'SENTINEL governance contract failed: narrative made Kuwait Meta linkage a replenishment prerequisite.'
      );
    }
  });

  return result;
}



function fctSentinelIsExternalApprovalAction_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Direct human/business communication.
  if (
    /\b(contact|email|message|call|whatsapp|send to)\b.{0,90}\b(courier|supplier|driver|customer|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(courier|supplier|driver|customer|TFM|OTO|C3X|Last Mile)\b.{0,90}\b(contact|email|message|call|whatsapp)\b/i.test(s)
  ) {
    return true;
  }

  // Request/obtain documentary evidence FROM an external party.
  if (
    /\b(request|ask|obtain|get)\b.{0,90}\b(remittance|settlement|statement|invoice|proof|document|evidence)\b.{0,90}\b(from|of)\b.{0,60}\b(courier|supplier|driver|customer|TFM|OTO|C3X|Last Mile)\b/i.test(s) ||
    /\b(request|ask|obtain|get)\b.{0,90}\b(TFM|OTO|C3X|Last Mile)\b.{0,90}\b(remittance|settlement|statement|invoice|proof|document|evidence)\b/i.test(s) ||
    /\b(remittance|settlement) statements?\b/i.test(s)
  ) {
    return true;
  }

  // Operational/business changes always need approval.
  return /\b(place|approve|commit|pay|transfer|pause|stop|scale|change|reroute|reassign|refund|release)\b.{0,90}\b(PO|purchase|order|stock|ads?|routing|courier|payment|campaign|money|refund)\b/i.test(s);
}


function fctSentinelIsInternalRefreshAction_(text) {
  const s = String(text || '');
  if (!s) return false;

  return (
    /\b(refresh|repoll|reconcile|compare|review|audit)\b.{0,90}\b(data|feed|API|courier view|records|cohort|snapshot)\b/i.test(s) ||
    /\b(poll|repoll)\b.{0,90}\b(API|feed|courier view|data|snapshot|Last Mile|C3X|OTO|TFM)\b/i.test(s) ||
    /\bfresh\b.{0,40}\b(poll|API poll|data poll)\b/i.test(s)
  );
}


function fctSentinelIsPureInternalHold_(text) {
  const s = String(text || '');
  if (!s) return false;

  return (
    /\b(hold|keep)\b.{0,120}\b(conclusion|calculation|decision|go[- ]?no[- ]?go|Real Contribution|Operating Profit|SCALE)\b/i.test(s) &&
    !fctSentinelIsExternalApprovalAction_(s)
  );
}


function fctSentinelQuestionAsksTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Explicit prohibitions preserve the locked rule.
  if (
    /\b(do not|don't|must not|should not|cannot|can't|never)\b.{0,70}\b(override|bypass|relax|waive)\b.{0,70}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  // Questions that explicitly preserve the blocker are safe.
  if (
    /\b(can|should|may|could)\b.{0,60}\b(scale|scaling|final scale decision)\b.{0,80}\b(only after|once|after)\b.{0,60}\bTikTok\b/i.test(s) ||
    /\bTikTok\b.{0,60}\b(required|must be available|must be integrated)\b.{0,80}\b(before)\b.{0,60}\b(scale|scaling)\b/i.test(s)
  ) {
    return false;
  }

  return (
    /\b(can|should|may|could)\b.{0,50}\b(scale|scaling|final scale decision)\b.{0,80}\b(proceed|continue|go ahead)\b.{0,80}\b(without|despite|before|pending|missing|absent)\b.{0,40}\bTikTok\b/i.test(s) ||
    /\b(can|should|may|could)\b.{0,50}\b(proceed|continue|go ahead)\b.{0,80}\b(with|on)\b.{0,40}\b(scale|scaling)\b.{0,80}\b(without|despite|missing)\b.{0,40}\bTikTok\b/i.test(s) ||
    /\b(override|bypass|relax|waive)\b.{0,50}\b(TikTok|hard block|blocker)\b/i.test(s)
  );
}


function testFctSentinelApprovalGuardsNoApi() {
  const external = [
    'Request TFM remittance statement from the courier.',
    'Contact OTO for settlement evidence.',
    'Email Last Mile courier for driver cash confirmation.',
    'Pause the ad campaign.',
    'Place a purchase order for PLG597.'
  ];

  const internal = [
    'Refresh the Last Mile courier API feed.',
    'Request a fresh Last Mile courier API poll.',
    'Poll the Last Mile data feed again.',
    'Reconcile C3X cohort records internally.',
    'Review the courier view data.'
  ];

  const pureHolds = [
    'Hold final SCALE decisions until TikTok spend is available.',
    'Keep Operating Profit conclusion on HOLD pending TikTok spend.'
  ];

  external.forEach(function(s) {
    if (!fctSentinelIsExternalApprovalAction_(s)) {
      throw new Error(
        'SENTINEL approval guard false-negative: ' + s
      );
    }
  });

  internal.forEach(function(s) {
    if (fctSentinelIsExternalApprovalAction_(s)) {
      throw new Error(
        'SENTINEL approval guard false-positive external: ' + s
      );
    }
    if (!fctSentinelIsInternalRefreshAction_(s)) {
      throw new Error(
        'SENTINEL internal-refresh guard false-negative: ' + s
      );
    }
  });

  pureHolds.forEach(function(s) {
    if (!fctSentinelIsPureInternalHold_(s)) {
      throw new Error(
        'SENTINEL internal-hold guard false-negative: ' + s
      );
    }
  });

  const mixed =
    'Poll the Last Mile API and request TFM remittance statement from the courier.';

  if (!fctSentinelIsInternalRefreshAction_(mixed) ||
      !fctSentinelIsExternalApprovalAction_(mixed)) {
    throw new Error(
      'SENTINEL mixed-action classifier failed.'
    );
  }

  Logger.log('SENTINEL approval guards PASS');
  return true;
}


function fctSentinelAdvocatesTikTokBypass_(text) {
  const s = String(text || '');
  if (!s) return false;

  // Safe/required language must never be treated as a bypass.
  if (
    /\b(do not|don't|must not|cannot|can't|should not|never|hold|blocked|remain blocked|keep .* hold)\b.{0,100}\b(scale|scaling|go[- ]?no[- ]?go|override|bypass|relax|waive)\b/i.test(s) ||
    /\b(scale|scaling|go[- ]?no[- ]?go)\b.{0,100}\b(blocked|hold|must wait|until .*TikTok|pending .*TikTok)\b/i.test(s) ||
    /\b(do not|don't|must not|never)\b.{0,60}\b(override|bypass|relax|waive)\b.{0,60}\b(TikTok|hard block|blocker)\b/i.test(s)
  ) {
    return false;
  }

  // Fail only on explicit positive permission to make a FINAL scale decision
  // despite absent TikTok spend.
  const positiveScale =
    /\b(allow|approve|authorize|proceed|continue|go ahead|greenlight|scale)\b.{0,80}\b(scale|scaling|go[- ]?no[- ]?go|final scale decision)\b/i.test(s) ||
    /\b(scale|scaling|final scale decision)\b.{0,80}\b(proceed|continue|go ahead|greenlight|approved|allowed)\b/i.test(s);

  const missingTikTok =
    /\b(without|despite|before|pending|missing|absent|unavailable)\b.{0,50}\bTikTok\b/i.test(s) ||
    /\bTikTok\b.{0,50}\b(missing|absent|unavailable|not available|not integrated)\b/i.test(s);

  const directOverride =
    /\b(override|bypass|relax|waive)\b.{0,50}\b(TikTok|hard block|blocker)\b/i.test(s);

  return directOverride || (positiveScale && missingTikTok);
}


function fctSentinelMakesMarketMetaStockPrereq_(text) {
  const s = String(text || '');
  if (!s) return false;

  if (
    /\b(not|isn't|is not|should not|must not|never)\b.{0,100}\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,120}\b(prerequisite|required|before)\b.{0,120}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,80}\b(is not|isn't|not)\b.{0,50}\b(required|a prerequisite|prerequisite)\b.{0,100}\b(before|for)\b.{0,100}\b(replenish|replenishment|stock|inventory)\b/i.test(s) ||
    /\b(Meta|market[- ]?linkage|ad[- ]?activity)\b.{0,100}\b(classification only|ad[- ]activity classification|not a prerequisite)\b/i.test(s)
  ) {
    return false;
  }

  const metaLinkage =
    /\b(Meta|market[- ]?linkage|ad[- ]?activity|market activity)\b/i.test(s);
  const stockAction =
    /\b(replenish|replenishment|restock|stock action|inventory action|stock commitment|purchase order|PO)\b/i.test(s);
  const prereq =
    /\b(required|prerequisite|must confirm|must prove|need to confirm|need to prove)\b.{0,100}\b(before|prior to)\b/i.test(s) ||
    /\b(before|prior to)\b.{0,100}\b(required|confirm|prove)\b/i.test(s);

  return metaLinkage && stockAction && prereq;
}



function testFctSentinelGovernanceGuardsNoApi() {
  const safe = [
    'Do not allow final scale decisions without TikTok spend.',
    'Keep final SCALE decisions HOLD until TikTok spend is available.',
    'Final scale remains blocked because TikTok spend is missing.',
    'Do not override the TikTok hard block.',
    'Never bypass the TikTok blocker.',
    'Can final scaling proceed only after TikTok spend is integrated?',
    'Kuwait Meta linkage is not required before replenishment.',
    'Kuwait Meta linkage is not required before replenishment; it affects ad-activity classification only.'
  ];

  const unsafe = [
    'Allow final scale decisions without TikTok spend.',
    'Proceed with scaling despite missing TikTok spend.',
    'Override the TikTok hard block for now.',
    'For Kuwait PLG597, Meta linkage is required before replenishment.'
  ];

  safe.forEach(function(s) {
    if (fctSentinelAdvocatesTikTokBypass_(s) ||
        fctSentinelQuestionAsksTikTokBypass_(s) ||
        fctSentinelMakesMarketMetaStockPrereq_(s)) {
      throw new Error(
        'SENTINEL governance guard false-positive on SAFE text: ' + s
      );
    }
  });

  unsafe.slice(0, 3).forEach(function(s) {
    if (!fctSentinelAdvocatesTikTokBypass_(s)) {
      throw new Error(
        'SENTINEL TikTok guard false-negative on UNSAFE text: ' + s
      );
    }
  });

  if (!fctSentinelMakesMarketMetaStockPrereq_(unsafe[3])) {
    throw new Error(
      'SENTINEL Kuwait Meta guard false-negative.'
    );
  }

  Logger.log('SENTINEL governance guards PASS');
  return true;
}


function fctBuildSentinelPhase1AuditPacket_() {
  const ledger = fctBuildLedgerSnapshot_();
  const scale = fctBuildScaleSnapshot_();
  const route = fctBuildRouteSnapshot_();
  const stock = fctBuildStockSnapshot_();

  const routeReceivable = (route.normalized_order_view || [])
    .reduce(function(sum, x) {
      return sum +
        fctSentinelNumber_(x.courier_receivable_aed);
    }, 0);

  const routeDelivered = (route.normalized_order_view || [])
    .reduce(function(sum, x) {
      return sum +
        fctSentinelNumber_(x.delivered_unpaid) +
        fctSentinelNumber_(x.paid);
    }, 0);

  const routeRrto = (route.normalized_order_view || [])
    .reduce(function(sum, x) {
      return sum + fctSentinelNumber_(x.rrto);
    }, 0);

  const routeFinalSuccess =
    (routeDelivered + routeRrto) > 0
      ? routeDelivered / (routeDelivered + routeRrto)
      : null;

  const ledgerMeta =
    fctSentinelNumber_(
      ledger.economics.meta_platform_spend_aed
    );

  const scaleMeta =
    fctSentinelNumber_(
      scale.meta.platform_spend_aed
    );

  const stockMeta =
    fctSentinelNumber_(
      stock.meta_market_attribution.platform_spend_aed
    );

  const scaleCountryPending =
    fctSentinelNumber_(
      scale.channel_completeness.meta.country_pending_spend_aed
    );

  const stockCountryPending =
    fctSentinelNumber_(
      stock.meta_market_attribution.country_pending_spend_aed
    );

  const ledgerReceivable =
    fctSentinelNumber_(
      ledger.economics.courier_receivable_aed
    );

  const ledgerDeliverySuccess =
    fctSentinelNumber_(
      ledger.economics.finalized_delivery_success
    );

  const metaLedgerScaleDiff =
    fctSentinelRound_(ledgerMeta - scaleMeta, 2);

  const metaLedgerStockDiff =
    fctSentinelRound_(ledgerMeta - stockMeta, 2);

  const receivableDiff =
    fctSentinelRound_(
      ledgerReceivable - routeReceivable,
      2
    );

  const deliverySuccessDiff =
    routeFinalSuccess === null
      ? null
      : fctSentinelRound_(
          ledgerDeliverySuccess - routeFinalSuccess,
          6
        );

  const countryPendingDiff =
    fctSentinelRound_(
      scaleCountryPending - stockCountryPending,
      2
    );

  const crossChecks = {
    meta_platform_spend_ledger_vs_scale: {
      ledger_aed: ledgerMeta,
      scale_aed: scaleMeta,
      difference_aed: metaLedgerScaleDiff,
      status:
        Math.abs(metaLedgerScaleDiff) <= 0.01
          ? 'MATCH'
          : 'MISMATCH'
    },

    meta_platform_spend_ledger_vs_stock: {
      ledger_aed: ledgerMeta,
      stock_attribution_aed: stockMeta,
      difference_aed: metaLedgerStockDiff,
      status:
        Math.abs(metaLedgerStockDiff) <= 0.01
          ? 'MATCH'
          : 'MISMATCH'
    },

    meta_country_pending_scale_vs_stock: {
      scale_aed: scaleCountryPending,
      stock_aed: stockCountryPending,
      difference_aed: countryPendingDiff,
      status:
        Math.abs(countryPendingDiff) <= 0.01
          ? 'MATCH'
          : 'MISMATCH'
    },

    courier_receivable_ledger_vs_route: {
      ledger_aed: fctSentinelRound_(
        ledgerReceivable,
        2
      ),
      route_normalized_sum_aed:
        fctSentinelRound_(routeReceivable, 2),
      difference_aed: receivableDiff,
      status:
        Math.abs(receivableDiff) <= 0.01
          ? 'MATCH'
          : 'MISMATCH'
    },

    finalized_delivery_success_ledger_vs_route: {
      ledger: fctSentinelRound_(
        ledgerDeliverySuccess,
        6
      ),
      route_normalized: routeFinalSuccess === null
        ? null
        : fctSentinelRound_(routeFinalSuccess, 6),
      difference: deliverySuccessDiff,
      status:
        deliverySuccessDiff !== null &&
        Math.abs(deliverySuccessDiff) <= 0.0001
          ? 'MATCH'
          : 'MISMATCH'
    },

    tiktok_blocker_consistency: {
      ledger_real_contribution_status:
        ledger.economics.real_contribution_status,
      scale_tiktok_status:
        scale.channel_completeness.tiktok.status,
      status:
        /BLOCKED_MISSING_TIKTOK_SPEND/i.test(
          String(
            ledger.economics.real_contribution_status || ''
          )
        ) &&
        /MISSING_ACTIVE_CHANNEL_SPEND/i.test(
          String(
            scale.channel_completeness.tiktok.status || ''
          )
        )
          ? 'MATCH'
          : 'MISMATCH'
    }
  };

  const sourceStatuses = {
    ledger: ledger.data_quality.status,
    scale: scale.data_quality.status,
    route: route.data_quality.status,
    stock: stock.data_quality.status
  };

  const anyFail = Object.keys(sourceStatuses)
    .some(function(k) {
      return sourceStatuses[k] === 'FAIL';
    });

  const anyReview = Object.keys(sourceStatuses)
    .some(function(k) {
      return sourceStatuses[k] === 'REVIEW';
    });

  return {
    contract_version: '1.0',
    packet_for: 'AG012',
    generated_at: new Date().toISOString(),

    overall_source_status:
      anyFail ? 'FAIL' : (anyReview ? 'REVIEW' : 'PASS'),

    source_statuses: sourceStatuses,

    deterministic_cross_checks: crossChecks,

    ledger: {
      period: ledger.period,
      economics: ledger.economics,
      cash_reconciliation:
        ledger.cash_reconciliation,
      data_quality: ledger.data_quality
    },

    scale: {
      period: scale.period,
      channel_completeness:
        scale.channel_completeness,
      meta: {
        platform_spend_aed:
          scale.meta.platform_spend_aed,
        product_pnl_meta_spend_aed:
          scale.meta.product_pnl_meta_spend_aed,
        meta_not_represented_in_product_pnl_aed:
          scale.meta.meta_not_represented_in_product_pnl_aed,
        performance_metrics_status:
          scale.meta.performance_metrics_status
      },
      provisional_product_rankings: {
        positive_after_meta:
          (scale.provisional_product_rankings
            .positive_after_meta || []).slice(0, 8),
        negative_after_meta:
          (scale.provisional_product_rankings
            .negative_after_meta || []).slice(0, 6)
      },
      courier_scale_gates:
        scale.courier_scale_gates,
      data_quality: scale.data_quality
    },

    route: {
      normalized_order_view:
        route.normalized_order_view,
      live_courier_view:
        route.live_courier_view,
      settlement_reconciliation:
        route.settlement_reconciliation,
      data_quality: route.data_quality
    },

    stock: {
      inventory_summary:
        stock.inventory_summary,
      critical_stock:
        (stock.critical_stock || []).slice(0, 10),
      watch_stock:
        (stock.watch_stock || []).slice(0, 10),
      reconciliation_exceptions:
        (stock.reconciliation_exceptions || [])
          .slice(0, 15),
      inbound_visibility:
        stock.inbound_visibility,
      meta_market_attribution:
        stock.meta_market_attribution,
      data_quality: stock.data_quality
    },

    locked_interpretation_rules: {
      paid:
        'PAID = COD remittance received; Delivered does not imply Paid.',
      delivery_success:
        '(Delivered + Paid)/(Delivered + Paid + RRTO), terminal outcomes only.',
      inventory_velocity:
        'max(7-day average pickup,14-day average pickup).',
      rrto:
        'RRTO is unavailable until physically received.',
      scale:
        'Never scale from ROAS alone; require all active-channel spend, delivery, stock, cash, freshness and mapping readiness.',
      data_quality:
        'Missing/bad data blocks affected conclusions; do not vote around deterministic FAIL.'
    }
  };
}


function fctSentinelNumber_(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 0;
  }

  const n = Number(value);
  return isNaN(n) ? 0 : n;
}


function fctSentinelRound_(value, decimals) {
  if (
    value === null ||
    value === undefined ||
    isNaN(Number(value))
  ) {
    return value;
  }

  const p = Math.pow(10, decimals || 0);
  return Math.round(Number(value) * p) / p;
}
