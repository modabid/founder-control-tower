export type TerminalCounts = {
  delivered: number;
  paid: number;
  rrto: number;
};

export type SpendByChannel = Record<string, number | null | undefined>;

export type ContributionInput = {
  grossContributionAed: number;
  activeChannels: string[];
  spendByChannelAed: SpendByChannel;
  directVariableCostsAed?: number;
};

export type ContributionResult = {
  status: 'READY' | string;
  valueAed: number | null;
  missingChannels: string[];
};

export type ScaleGate = {
  key: string;
  pass: boolean;
  reason?: string;
};

function requireFinite(value: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(label + ' must be a finite number.');
  }
  return value;
}

function requireNonNegative(value: number, label: string): number {
  const n = requireFinite(value, label);
  if (n < 0) throw new Error(label + ' must not be negative.');
  return n;
}

function channelSpend(input: SpendByChannel, channel: string): number | null | undefined {
  if (Object.prototype.hasOwnProperty.call(input, channel)) return input[channel];
  const lower = channel.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(input, lower)) return input[lower];
  return undefined;
}

export function roundMoney(value: number): number {
  const n = requireFinite(value, 'money value');
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function finalDeliverySuccess(counts: TerminalCounts): number | null {
  const delivered = requireNonNegative(counts.delivered, 'delivered');
  const paid = requireNonNegative(counts.paid, 'paid');
  const rrto = requireNonNegative(counts.rrto, 'rrto');
  const terminal = delivered + paid + rrto;
  return terminal > 0 ? (delivered + paid) / terminal : null;
}

export function isCourierReceivableStatus(status: string): boolean {
  return String(status || '').trim().toUpperCase() === 'DELIVERED';
}

export function isPaidStatus(status: string): boolean {
  return String(status || '').trim().toUpperCase() === 'PAID';
}

export function contributionAfterActiveAds(input: ContributionInput): ContributionResult {
  const gross = requireFinite(input.grossContributionAed, 'grossContributionAed');
  const variable = requireNonNegative(input.directVariableCostsAed ?? 0, 'directVariableCostsAed');
  const active = [...new Set((input.activeChannels || [])
    .map((x) => String(x).trim().toUpperCase())
    .filter(Boolean))];

  const missing = active.filter((channel) => {
    const value = channelSpend(input.spendByChannelAed || {}, channel);
    return value === null || value === undefined;
  });

  if (missing.length) {
    const status = missing.includes('TIKTOK')
      ? 'BLOCKED_MISSING_TIKTOK_SPEND'
      : 'BLOCKED_MISSING_ACTIVE_CHANNEL_SPEND';
    return { status, valueAed: null, missingChannels: missing };
  }

  const adSpend = active.reduce((sum, channel) => {
    const raw = channelSpend(input.spendByChannelAed, channel);
    return sum + requireNonNegative(raw as number, channel + ' spend');
  }, 0);

  return {
    status: 'READY',
    valueAed: roundMoney(gross - adSpend - variable),
    missingChannels: []
  };
}

export function operatingProfit(
  realContribution: ContributionResult,
  fixedOpexAed: number
): ContributionResult {
  const fixed = requireNonNegative(fixedOpexAed, 'fixedOpexAed');
  if (realContribution.valueAed === null || realContribution.status !== 'READY') {
    return {
      status: realContribution.status,
      valueAed: null,
      missingChannels: [...realContribution.missingChannels]
    };
  }

  return {
    status: 'READY',
    valueAed: roundMoney(requireFinite(realContribution.valueAed, 'realContribution.valueAed') - fixed),
    missingChannels: []
  };
}

export function demandVelocity(avgPickup7d: number, avgPickup14d: number): number {
  return Math.max(
    requireNonNegative(avgPickup7d, 'avgPickup7d'),
    requireNonNegative(avgPickup14d, 'avgPickup14d')
  );
}

export function physicalStockDays(availableStock: number, velocityPerDay: number): number | null {
  const stock = requireNonNegative(availableStock, 'availableStock');
  const velocity = requireNonNegative(velocityPerDay, 'velocityPerDay');
  if (velocity <= 0) return null;
  return stock / velocity;
}

export function stockGate(availableStock: number, stockDays: number | null): string {
  const stock = requireNonNegative(availableStock, 'availableStock');
  // physicalStockDays() returns null only when recent pickup velocity is zero.
  // Match the locked STOCK_INTELLIGENCE / Apps Script meaning: zero recent
  // demand is monitor-only even when physical stock is zero. OUT_OF_STOCK is
  // actionable only when there is recent demand (stockDays is numeric).
  if (stockDays === null) return 'NO_RECENT_DEMAND';
  if (stock <= 0) return 'OUT_OF_STOCK';
  const days = requireNonNegative(stockDays, 'stockDays');
  if (days <= 3) return 'CRITICAL_LE_3_DAYS';
  if (days <= 7) return 'WATCH_LE_7_DAYS';
  return 'PASS';
}

export function lastMileScaleGate(finalizedDeliverySuccess: number | null): ScaleGate {
  if (finalizedDeliverySuccess === null) {
    return { key: 'LAST_MILE_DELIVERY_SUCCESS', pass: false, reason: 'MISSING_FINALIZED_DELIVERY_SUCCESS' };
  }
  const success = requireNonNegative(finalizedDeliverySuccess, 'finalizedDeliverySuccess');
  if (success > 1) throw new Error('finalizedDeliverySuccess must not exceed 1.');
  return {
    key: 'LAST_MILE_DELIVERY_SUCCESS',
    pass: success >= 0.70,
    reason: success >= 0.70 ? '' : 'BELOW_70_PERCENT'
  };
}

export function scaleDecision(gates: ScaleGate[]): {
  decision: 'GO' | 'HOLD';
  failed: ScaleGate[];
} {
  const failed = (gates || []).filter((gate) => !gate.pass);
  return {
    decision: failed.length ? 'HOLD' : 'GO',
    failed
  };
}
