window.__FCT_MOCK__ = true;
window.__FCT_FOUNDER_DATA__ = {
  status: 'SUCCESS',
  contractVersion: '1.0',
  asOf: '2026-09-10T08:15:00+04:00',
  period: {
    month: '2026-09',
    dailyPnlLatestDate: '2026-09-09',
    metaLatestDate: '2026-09-08'
  },
  economics: {
    ordersPickedMtd: 760,
    deliveredPaidMtd: 510,
    pendingMtd: 90,
    rrtoMtd: 95,
    finalizedDeliverySuccess: 0.843,
    deliveredRevenueAed: 24800,
    grossContributionAed: 15450,
    courierReceivableAed: 6200,
    deliveredUnpaidCount: 118,
    paidCount: 392,
    paidOrderCodAed: 18600,
    metaPlatformSpendAed: 6750,
    metaSpendInDailyPnlAed: 6610,
    metaAllocationGapAed: 140,
    tiktokSpendAed: null,
    realContributionAed: null,
    realContributionStatus: 'BLOCKED_MISSING_TIKTOK_SPEND',
    monthlyFixedCostBaselineAed: 12850,
    fixedCostAccrualThroughPnlDateAed: 3855,
    operatingProfitAed: null,
    operatingProfitStatus: 'BLOCKED_MISSING_TIKTOK_SPEND'
  },
  controls: {
    dataQualityStatus: 'FAIL',
    flags: [
      {
        severity: 'FAIL',
        code: 'TIKTOK_SPEND_MISSING',
        detail: 'Real Contribution and Operating Profit remain blocked until live TikTok spend is available.'
      },
      {
        severity: 'REVIEW',
        code: 'META_PNL_CUTOFF_MISMATCH',
        detail: 'META_SPEND_LIVE and DAILY_PNL latest dates differ.'
      },
      {
        severity: 'REVIEW',
        code: 'PAYROLL_PAYMENT_EVIDENCE_PENDING',
        detail: 'Two payroll rows are accrued but payment evidence is pending.'
      }
    ],
    metaMappingStatusCounts: { VALIDATED: 42, PENDING: 3 },
    payrollPaymentEvidencePendingCount: 2,
    activeSubscriptionMissingCostCount: 1
  },
  approvals: {
    pendingCount: 2,
    pending: [
      {
        actionId: 'ACT-DEMO-001',
        priority: 'ACT NOW',
        recommendation: 'Investigate outstanding courier cash and terminal return exceptions.',
        reason: 'Cash collection and delivery exceptions require founder visibility.',
        owner: 'Abid',
        source: 'ATLAS:DEMO',
        createdAt: '2026-09-10T08:15:00+04:00'
      },
      {
        actionId: 'ACT-DEMO-002',
        priority: 'WATCH',
        recommendation: 'Review critical stock replenishment options before committing cash.',
        reason: 'Physical stock days are below the operating threshold.',
        owner: 'Abid',
        source: 'ATLAS:DEMO',
        createdAt: '2026-09-10T08:15:00+04:00'
      }
    ]
  },
  stock: {
    critical: [
      {
        country: 'United Arab Emirates',
        productSku: 'Demo Product A (SKU-A)',
        availableStock: 5,
        demandVelocity: 3.2,
        availableStockDays: 1.56,
        gate: 'CRITICAL_LE_3_DAYS',
        dataQuality: 'OK'
      }
    ],
    watch: [
      {
        country: 'Kuwait',
        productSku: 'Demo Product B (SKU-B)',
        availableStock: 18,
        demandVelocity: 3.4,
        availableStockDays: 5.29,
        gate: 'WATCH_LE_7_DAYS',
        dataQuality: 'OK'
      }
    ],
    velocityMismatchCount: 0
  },
  provenance: {
    source: 'OFFLINE_MOCK',
    writesMade: 0,
    externalActionsExecuted: 0,
    aiCallsMade: 0
  }
};
