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

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function finalDeliverySuccess(counts: TerminalCounts): number | null {
  const delivered = Math.max(0, Number(counts.delivered) || 0);
  const paid = Math.max(0, Number(counts.paid) || 0);
  const rrto = Math.max(0, Number(counts.rrto) || 0);
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
  const active = [...new Set((input.activeChannels || []).map((x) => String(x).trim().toUpperCase()).filter(Boolean))];
  const missing = active.filter((channel) => {
    const value = input.spendByChannelAed[channel] ?? input.spendByChannelAed[channel.toLowerCase()];
    return value === null || value === undefined || value === '' as unknown as number;
  });

  if (missing.length) {
    const status = missing.includes('TIKTOK')
      ? 'BLOCKED_MISSING_TIKTOK_SPEND'
      : 'BLOCKED_MISSING_ACTIVE_CHANNEL_SPEND';
    return { status, valueAed: null, missingChannels: missing };
  }

  const adSpend = active.reduce((sum, channel) => {
    const raw = input.spendByChannelAed[channel] ?? input.spendByChannelAed[channel.toLowerCase()] ?? 0;
    return sum + Number(raw || 0);
  }, 0);
  const variable = Number(input.directVariableCostsAed || 0);

  return {
    status: 'READY',
    valueAed: roundMoney(Number(input.grossContributionAed || 0) - adSpend - variable),
    missingChannels: []
  };
}

export function operatingProfit(
  realContribution: ContributionResult,
  fixedOpexAed: number
): ContributionResult {
  if (realContribution.valueAed === null || realContribution.status !== 'READY') {
    return {
      status: realContribution.status,
      valueAed: null,
      missingChannels: [...realContribution.missingChannels]
    };
  }

  return {
    status: 'READY',
    valueAed: roundMoney(realContribution.valueAed - Number(fixedOpexAed || 0)),
    missingChannels: []
  };
}

export function demandVelocity(avgPickup7d: number, avgPickup14d: number): number {
  return Math.max(0, Number(avgPickup7d) || 0, Number(avgPickup14d) || 0);
}

export function physicalStockDays(availableStock: number, velocityPerDay: number): number | null {
  const stock = Math.max(0, Number(availableStock) || 0);
  const velocity = Math.max(0, Number(velocityPerDay) || 0);
  if (velocity <= 0) return null;
  return stock / velocity;
}

export function stockGate(availableStock: number, stockDays: number | null): string {
  if ((Number(availableStock) || 0) <= 0) return 'OUT_OF_STOCK';
  if (stockDays === null || !Number.isFinite(stockDays)) return 'UNKNOWN_VELOCITY';
  if (stockDays <= 3) return 'CRITICAL_LE_3_DAYS';
  if (stockDays <= 7) return 'WATCH_LE_7_DAYS';
  return 'PASS';
}

export function lastMileScaleGate(finalizedDeliverySuccess: number | null): ScaleGate {
  if (finalizedDeliverySuccess === null || !Number.isFinite(finalizedDeliverySuccess)) {
    return { key: 'LAST_MILE_DELIVERY_SUCCESS', pass: false, reason: 'MISSING_FINALIZED_DELIVERY_SUCCESS' };
  }
  return {
    key: 'LAST_MILE_DELIVERY_SUCCESS',
    pass: finalizedDeliverySuccess >= 0.70,
    reason: finalizedDeliverySuccess >= 0.70 ? '' : 'BELOW_70_PERCENT'
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
