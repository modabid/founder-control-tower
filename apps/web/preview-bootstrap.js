(function () {
  'use strict';
  var root = document.getElementById('app');
  if (!root || !window.FCTDashboard) return;
  try {
    window.FCTDashboard.mount(root, window.__FCT_FOUNDER_DATA__, {
      mock: window.__FCT_MOCK__ === true
    });
  } catch (_error) {
    root.innerHTML = '<main class="shell"><section class="unavailable"><h1>Founder Control Tower</h1><p>Dashboard rendering failed safely. No business conclusion should be inferred.</p></section></main>';
  }
})();
