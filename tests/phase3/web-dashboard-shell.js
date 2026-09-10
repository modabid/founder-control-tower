'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dashboard = require('../../apps/web/dashboard.js');

const htmlPath = path.join(__dirname, '..', '..', 'apps', 'web', 'index.html');
const cssPath = path.join(__dirname, '..', '..', 'apps', 'web', 'styles.css');
const fixturePath = path.join(__dirname, '..', '..', 'apps', 'web', 'mock-founder-data.js');
const htmlSource = fs.readFileSync(htmlPath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');
const fixtureSource = fs.readFileSync(fixturePath, 'utf8');

const model = {
  status: 'SUCCESS',
  asOf: '2026-09-10T08:15:00+04:00',
  period: { month: '2026-09', dailyPnlLatestDate: '2026-09-09', metaLatestDate: '2026-09-08' },
  economics: {
    ordersPickedMtd: 100,
    finalizedDeliverySuccess: 0.8,
    deliveredRevenueAed: 10000,
    grossContributionAed: 5000,
    courierReceivableAed: 1200,
    realContributionAed: null,
    realContributionStatus: 'BLOCKED_MISSING_TIKTOK_SPEND',
    operatingProfitAed: null,
    operatingProfitStatus: 'BLOCKED_MISSING_TIKTOK_SPEND'
  },
  controls: {
    dataQualityStatus: 'FAIL',
    flags: [{ severity: 'FAIL', code: 'TIKTOK_SPEND_MISSING', detail: '<script>alert(1)</script>' }],
    metaMappingStatusCounts: {}
  },
  approvals: {
    pendingCount: 1,
    pending: [{
      actionId: 'ACT-1',
      priority: 'ACT NOW',
      recommendation: '<img src=x onerror=alert(1)>',
      reason: 'Founder review',
      owner: 'Abid',
      source: 'ATLAS:TEST'
    }]
  },
  stock: {
    critical: [{ country: 'UAE', productSku: 'SKU-1', availableStock: 2, demandVelocity: 1, availableStockDays: 2, gate: 'CRITICAL_LE_3_DAYS', dataQuality: 'OK' }],
    watch: [],
    velocityMismatchCount: 0
  },
  provenance: { source: 'TEST', writesMade: 0, externalActionsExecuted: 0, aiCallsMade: 0 }
};

const vm = dashboard.buildDashboardViewModel(model);
assert.equal(vm.status, 'SUCCESS');
assert.equal(vm.kpis.find((item) => item.label === 'Final Delivery').value, '80.0%');
assert.equal(vm.kpis.find((item) => item.label === 'Real Contribution').value, 'BLOCKED_MISSING_TIKTOK_SPEND');
assert.equal(vm.pendingApprovals.length, 1);

const rendered = dashboard.renderDashboard(model, { mock: true });
assert.match(rendered, /Offline preview/);
assert.match(rendered, /BLOCKED_MISSING_TIKTOK_SPEND/);
assert.match(rendered, /Approval and execution controls are intentionally disabled/);
assert.match(rendered, /Writes: 0/);
assert.match(rendered, /External actions: 0/);
assert.doesNotMatch(rendered, /<script>alert\(1\)<\/script>/);
assert.doesNotMatch(rendered, /<img src=x onerror=alert\(1\)>/);
assert.match(rendered, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(rendered, /&lt;img src=x onerror=alert\(1\)&gt;/);

const unavailable = dashboard.renderDashboard(null);
assert.match(unavailable, /No business conclusion should be inferred/);

assert.match(htmlSource, /mock-founder-data\.js/);
assert.match(htmlSource, /dashboard\.js/);
assert.doesNotMatch(htmlSource, /https?:\/\//);
assert.doesNotMatch(htmlSource, /<form\b/i);
assert.doesNotMatch(htmlSource, /<button\b/i);
assert.match(cssSource, /@media \(max-width: 650px\)/);
assert.match(fixtureSource, /__FCT_MOCK__ = true/);
assert.match(fixtureSource, /OFFLINE_MOCK/);

console.log('PHASE3_WEB_DASHBOARD_SHELL_PASS');
