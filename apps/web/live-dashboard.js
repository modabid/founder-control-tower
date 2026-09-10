(function () {
  'use strict';

  var SESSION_KEY = 'fct_founder_access_v1';

  function byId(id) {
    return document.getElementById(id);
  }

  function renderAccessGate(root, message) {
    root.innerHTML = '';
    var main = document.createElement('main');
    main.className = 'shell';

    var panel = document.createElement('section');
    panel.className = 'panel access-panel';

    var eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = 'FOUNDER ACCESS';

    var title = document.createElement('h1');
    title.textContent = 'Founder Control Tower';

    var copy = document.createElement('p');
    copy.className = 'subtitle';
    copy.textContent = message || 'Enter the founder access key to load the live read-only dashboard.';

    var form = document.createElement('form');
    form.className = 'access-form';
    form.autocomplete = 'off';

    var input = document.createElement('input');
    input.type = 'password';
    input.name = 'access_key';
    input.placeholder = 'Founder access key';
    input.autocomplete = 'current-password';
    input.required = true;
    input.minLength = 24;

    var button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Open live dashboard';

    form.appendChild(input);
    form.appendChild(button);
    panel.appendChild(eyebrow);
    panel.appendChild(title);
    panel.appendChild(copy);
    panel.appendChild(form);
    main.appendChild(panel);
    root.appendChild(main);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var token = input.value.trim();
      if (!token) return;
      sessionStorage.setItem(SESSION_KEY, token);
      loadLive(root, token);
    });

    input.focus();
  }

  function renderLoading(root) {
    root.innerHTML = '<main class="shell"><section class="unavailable"><div class="eyebrow">LIVE READ-ONLY</div><h1>Founder Control Tower</h1><p>Loading deterministic founder data…</p></section></main>';
  }

  function renderUnavailable(root) {
    root.innerHTML = '<main class="shell"><section class="unavailable"><h1>Founder Control Tower</h1><p>Live founder data is unavailable. No business conclusion should be inferred.</p></section></main>';
  }

  async function loadLive(root, token) {
    renderLoading(root);
    try {
      var response = await fetch('/api/founder', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token,
          Accept: 'application/json'
        },
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (response.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        renderAccessGate(root, 'Access key not accepted. Try again.');
        return;
      }

      if (!response.ok) {
        renderUnavailable(root);
        return;
      }

      var payload = await response.json();
      if (!payload || payload.ok !== true || !payload.data) {
        renderUnavailable(root);
        return;
      }

      window.FCTDashboard.mount(root, payload.data, { mock: false });
    } catch (_error) {
      renderUnavailable(root);
    }
  }

  function boot() {
    var root = byId('app');
    if (!root || !window.FCTDashboard) return;
    var existing = String(sessionStorage.getItem(SESSION_KEY) || '').trim();
    if (existing) loadLive(root, existing);
    else renderAccessGate(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
