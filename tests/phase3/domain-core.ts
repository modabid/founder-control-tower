import assert from 'node:assert/strict';
import {
  contributionAfterActiveAds,
  demandVelocity,
  finalDeliverySuccess,
  isCourierReceivableStatus,
  isPaidStatus,
  lastMileScaleGate,
  operatingProfit,
  physicalStockDays,
  scaleDecision,
  stockGate
} from '../../packages/domain/src/core.ts';

assert.equal(finalDeliverySuccess({ delivered: 70, paid: 10, rrto: 20 }), 0.8);
assert.equal(finalDeliverySuccess({ delivered: 0, paid: 0, rrto: 0 }), null);
assert.equal(finalDeliverySuccess({ delivered: 5, paid: 5, rrto: 0 }), 1);

assert.equal(isCourierReceivableStatus('Delivered'), true);
assert.equal(isCourierReceivableStatus('Paid'), false);
assert.equal(isPaidStatus('Paid'), true);
assert.equal(isPaidStatus('Delivered'), false);

const blocked = contributionAfterActiveAds({
  grossContributionAed: 15000,
  activeChannels: ['META', 'TIKTOK'],
  spendByChannelAed: { META: 6000, TIKTOK: null }
});
assert.equal(blocked.status, 'BLOCKED_MISSING_TIKTOK_SPEND');
assert.equal(blocked.valueAed, null);
assert.deepEqual(blocked.missingChannels, ['TIKTOK']);

const real = contributionAfterActiveAds({
  grossContributionAed: 15000,
  activeChannels: ['META', 'TIKTOK'],
  spendByChannelAed: { META: 6000, TIKTOK: 1000 },
  directVariableCostsAed: 500
});
assert.equal(real.status, 'READY');
assert.equal(real.valueAed, 7500);
assert.equal(operatingProfit(real, 2500).valueAed, 5000);
assert.equal(operatingProfit(blocked, 2500).valueAed, null);

assert.equal(demandVelocity(4, 6), 6);
assert.equal(demandVelocity(8, 6), 8);
assert.equal(physicalStockDays(12, 6), 2);
assert.equal(physicalStockDays(12, 0), null);
assert.equal(stockGate(0, 0), 'OUT_OF_STOCK');
assert.equal(stockGate(12, 2), 'CRITICAL_LE_3_DAYS');
assert.equal(stockGate(30, 5), 'WATCH_LE_7_DAYS');
assert.equal(stockGate(80, 10), 'PASS');
assert.equal(stockGate(10, null), 'UNKNOWN_VELOCITY');

assert.equal(lastMileScaleGate(0.699).pass, false);
assert.equal(lastMileScaleGate(0.70).pass, true);
assert.equal(scaleDecision([
  { key: 'DELIVERY', pass: true },
  { key: 'STOCK', pass: false, reason: 'LOW_STOCK' }
]).decision, 'HOLD');
assert.equal(scaleDecision([
  { key: 'DELIVERY', pass: true },
  { key: 'STOCK', pass: true }
]).decision, 'GO');

console.log('PHASE3_DOMAIN_CORE_PASS');
