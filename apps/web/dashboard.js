(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FCTDashboard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function money(value) {
    const number = finiteNumber(value);
    if (number === null) return '—';
    return 'AED ' + number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function integer(value) {
    const number = finiteNumber(value);
    return number === null ? '—' : Math.round(number).toLocaleString('en-US');
  }

  function percent(value) {
    const number = finiteNumber(value);
    if (number === null) return '—';
    return (number * 100).toFixed(1) + '%';
  }

  function shortDate(value) {
    const text = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return text || '—';
    return text.slice(0, 10);
  }

  function normalizedStatus(value) {
    return String(value || 'UNKNOWN').trim().toUpperCase();
  }

  function statusTone(value) {
    const status = normalizedStatus(value);
    if (/PASS|READY|SUCCESS|GO/.test(status) && !/FAIL|BLOCK|HOLD/.test(status)) return 'positive';
    if (/FAIL|BLOCK|CRITICAL|ACT_NOW|OUT_OF_STOCK|HOLD/.test(status)) return 'negative';
    if (/REVIEW|WATCH|PENDING|UNKNOWN|PROVISIONAL/.test(status)) return 'warning';
    return 'neutral';
  }

  function profitDisplay(value, status) {
    return finiteNumber(value) === null ? normalizedStatus(status) : money(value);
  }

  function buildDashboardViewModel(data) {
    if (!data || data.status !== 'SUCCESS') {
      return {
        status: 'UNAVAILABLE',
        title: 'Founder Control Tower',
        message: 'Founder data is unavailable. No business conclusion should be inferred.'
      };
    }

    const economics = data.economics || {};
    const controls = data.controls || {};
    const approvals = data.approvals || {};
    const stock = data.stock || {};
    const period = data.period || {};

    const kpis = [
      { label: 'Orders MTD', value: integer(economics.ordersPickedMtd), tone: 'neutral' },
      { label: 'Final Delivery', value: percent(economics.finalizedDeliverySuccess), tone: finiteNumber(economics.finalizedDeliverySuccess) !== null && economics.finalizedDeliverySuccess >= 0.70 ? 'positive' : 'warning' },
      { label: 'Delivered Revenue', value: money(economics.deliveredRevenueAed), tone: 'neutral' },
      { label: 'Gross Contribution', value: money(economics.grossContributionAed), tone: 'neutral' },
      { label: 'Real Contribution', value: profitDisplay(economics.realContributionAed, economics.realContributionStatus), tone: statusTone(economics.realContributionStatus) },
      { label: 'Operating Profit', value: profitDisplay(economics.operatingProfitAed, economics.operatingProfitStatus), tone: statusTone(economics.operatingProfitStatus) },
      { label: 'Courier Receivable', value: money(economics.courierReceivableAed), tone: finiteNumber(economics.courierReceivableAed) > 0 ? 'warning' : 'positive' },
      { label: 'Pending Approvals', value: integer(approvals.pendingCount), tone: finiteNumber(approvals.pendingCount) > 0 ? 'warning' : 'positive' }
    ];

    const flags = Array.isArray(controls.flags) ? controls.flags.map(function (flag) {
      return {
        severity: normalizedStatus(flag.severity),
        code: String(flag.code || ''),
        detail: String(flag.detail || ''),
        tone: statusTone(flag.severity)
      };
    }) : [];

    const pending = Array.isArray(approvals.pending) ? approvals.pending.map(function (item) {
      return {
        actionId: String(item.actionId || ''),
        priority: String(item.priority || 'PENDING'),
        recommendation: String(item.recommendation || ''),
        reason: String(item.reason || ''),
        owner: String(item.owner || ''),
        source: String(item.source || ''),
        createdAt: item.createdAt
      };
    }) : [];

    function mapStock(rows) {
      return (Array.isArray(rows) ? rows : []).map(function (item) {
        return {
          country: String(item.country || ''),
          productSku: String(item.productSku || ''),
          availableStock: finiteNumber(item.availableStock),
          demandVelocity: finiteNumber(item.demandVelocity),
          availableStockDays: finiteNumber(item.availableStockDays),
          gate: normalizedStatus(item.gate),
          dataQuality: String(item.dataQuality || '')
        };
      });
    }

    return {
      status: 'SUCCESS',
      title: 'Founder Control Tower',
      asOf: String(data.asOf || ''),
      period: String(period.month || ''),
      pnlLatestDate: shortDate(period.dailyPnlLatestDate),
      metaLatestDate: shortDate(period.metaLatestDate),
      qualityStatus: normalizedStatus(controls.dataQualityStatus),
      qualityTone: statusTone(controls.dataQualityStatus),
      kpis: kpis,
      flags: flags,
      pendingApprovals: pending,
      stockCritical: mapStock(stock.critical),
      stockWatch: mapStock(stock.watch),
      velocityMismatchCount: finiteNumber(stock.velocityMismatchCount) || 0,
      metaMappingStatusCounts: controls.metaMappingStatusCounts || {},
      provenance: data.provenance || {}
    };
  }

  function badge(text, tone) {
    return '<span class="badge badge--' + escapeHtml(tone || 'neutral') + '">' + escapeHtml(text) + '</span>';
  }

  function renderKpis(kpis) {
    return '<div class="kpi-grid">' + kpis.map(function (item) {
      return '<article class="kpi-card kpi-card--' + escapeHtml(item.tone) + '">' +
        '<div class="kpi-label">' + escapeHtml(item.label) + '</div>' +
        '<div class="kpi-value">' + escapeHtml(item.value) + '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function renderFlags(flags) {
    if (!flags.length) {
      return '<div class="empty-state">No deterministic data-quality flags.</div>';
    }
    return '<div class="issue-list">' + flags.map(function (flag) {
      return '<article class="issue issue--' + escapeHtml(flag.tone) + '">' +
        '<div class="issue-head">' + badge(flag.severity, flag.tone) + '<code>' + escapeHtml(flag.code) + '</code></div>' +
        '<p>' + escapeHtml(flag.detail) + '</p>' +
      '</article>';
    }).join('') + '</div>';
  }

  function renderApprovals(rows) {
    if (!rows.length) {
      return '<div class="empty-state">No actions currently waiting for founder approval.</div>';
    }
    return '<div class="approval-list">' + rows.map(function (item) {
      return '<article class="approval-card">' +
        '<div class="approval-top"><strong>' + escapeHtml(item.actionId) + '</strong>' + badge(item.priority, statusTone(item.priority)) + '</div>' +
        '<h3>' + escapeHtml(item.recommendation) + '</h3>' +
        '<p>' + escapeHtml(item.reason) + '</p>' +
        '<div class="meta-row"><span>Owner: ' + escapeHtml(item.owner || '—') + '</span><span>Source: ' + escapeHtml(item.source || '—') + '</span></div>' +
        '<div class="readonly-note">Review only in this shell. Approval and execution controls are intentionally disabled.</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  function renderStockTable(title, rows, tone) {
    if (!rows.length) return '';
    return '<section class="stock-block">' +
      '<div class="section-title-row"><h3>' + escapeHtml(title) + '</h3>' + badge(String(rows.length), tone) + '</div>' +
      '<div class="table-wrap"><table><thead><tr><th>Market</th><th>SKU</th><th>Available</th><th>Velocity/day</th><th>Stock days</th><th>Gate</th></tr></thead><tbody>' +
      rows.map(function (row) {
        return '<tr><td>' + escapeHtml(row.country) + '</td><td>' + escapeHtml(row.productSku) + '</td><td>' + escapeHtml(integer(row.availableStock)) + '</td><td>' + escapeHtml(row.demandVelocity === null ? '—' : row.demandVelocity.toFixed(2)) + '</td><td>' + escapeHtml(row.availableStockDays === null ? '—' : row.availableStockDays.toFixed(1)) + '</td><td>' + badge(row.gate, statusTone(row.gate)) + '</td></tr>';
      }).join('') +
      '</tbody></table></div></section>';
  }

  function renderDashboard(data, options) {
    const vm = buildDashboardViewModel(data);
    const opts = options || {};
    if (vm.status !== 'SUCCESS') {
      return '<main class="shell"><section class="unavailable"><h1>' + escapeHtml(vm.title) + '</h1><p>' + escapeHtml(vm.message) + '</p></section></main>';
    }

    const mockBanner = opts.mock === true
      ? '<div class="demo-banner"><strong>Offline preview.</strong> This screen is using mock data; no live business decision should be made from it.</div>'
      : '';

    return '<main class="shell">' + mockBanner +
      '<header class="topbar">' +
        '<div><div class="eyebrow">CEO OPERATING SYSTEM</div><h1>' + escapeHtml(vm.title) + '</h1><p class="subtitle">One view for economics, approvals, risk and stock.</p></div>' +
        '<div class="topbar-status"><span class="asof">As of ' + escapeHtml(vm.asOf || '—') + '</span>' + badge('Data ' + vm.qualityStatus, vm.qualityTone) + '</div>' +
      '</header>' +
      '<section aria-labelledby="pulse-title"><div class="section-heading"><div><div class="eyebrow">GROUP PULSE</div><h2 id="pulse-title">Today at a glance</h2></div><div class="cutoff">P&L ' + escapeHtml(vm.pnlLatestDate) + ' · Meta ' + escapeHtml(vm.metaLatestDate) + '</div></div>' +
        renderKpis(vm.kpis) +
      '</section>' +
      '<div class="two-col">' +
        '<section class="panel" aria-labelledby="quality-title"><div class="section-title-row"><div><div class="eyebrow">SENTINEL</div><h2 id="quality-title">Data quality & blockers</h2></div>' + badge(vm.qualityStatus, vm.qualityTone) + '</div>' + renderFlags(vm.flags) + '</section>' +
        '<section class="panel" aria-labelledby="approvals-title"><div class="section-title-row"><div><div class="eyebrow">FOUNDER GATE</div><h2 id="approvals-title">Pending approvals</h2></div>' + badge(String(vm.pendingApprovals.length), vm.pendingApprovals.length ? 'warning' : 'positive') + '</div>' + renderApprovals(vm.pendingApprovals) + '</section>' +
      '</div>' +
      '<section class="panel" aria-labelledby="stock-title"><div class="section-title-row"><div><div class="eyebrow">STOCK</div><h2 id="stock-title">Inventory risk</h2></div>' + (vm.velocityMismatchCount ? badge(vm.velocityMismatchCount + ' velocity mismatch', 'negative') : badge('Velocity reconciled', 'positive')) + '</div>' +
        (renderStockTable('Act now', vm.stockCritical, 'negative') || '<div class="empty-state">No critical stock risk in this data set.</div>') +
        renderStockTable('Watch', vm.stockWatch, 'warning') +
      '</section>' +
      '<footer class="footer"><span>Read-only founder surface</span><span>Writes: ' + escapeHtml(String(vm.provenance.writesMade == null ? '—' : vm.provenance.writesMade)) + ' · External actions: ' + escapeHtml(String(vm.provenance.externalActionsExecuted == null ? '—' : vm.provenance.externalActionsExecuted)) + ' · AI calls: ' + escapeHtml(String(vm.provenance.aiCallsMade == null ? '—' : vm.provenance.aiCallsMade)) + '</span></footer>' +
    '</main>';
  }

  function mount(rootElement, data, options) {
    if (!rootElement || typeof rootElement.innerHTML !== 'string') {
      throw new Error('A valid dashboard root element is required.');
    }
    rootElement.innerHTML = renderDashboard(data, options);
  }

  return {
    escapeHtml: escapeHtml,
    money: money,
    percent: percent,
    statusTone: statusTone,
    buildDashboardViewModel: buildDashboardViewModel,
    renderDashboard: renderDashboard,
    mount: mount
  };
});
