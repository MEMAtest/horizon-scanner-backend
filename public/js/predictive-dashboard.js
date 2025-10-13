(() => {
  const payload = window.predictiveDashboard;
  if (!payload) {
    return;
  }

  const filterForm = document.getElementById('insightFilters');
  const cards = Array.from(document.querySelectorAll('.insight-card'));
  const lanes = Array.from(document.querySelectorAll('.lane-column'));
  const drawer = document.getElementById('insightDrawer');
  const drawerBody = document.getElementById('drawerBody');
  const drawerTitle = document.getElementById('drawerTitle');

  const acknowledgedKey = 'predictive_acknowledged_v1';
  const delegatedKey = 'predictive_delegated_v1';
  const delegationNotesKey = 'predictive_delegation_notes_v1';

  const loadSet = key => {
    try {
      const raw = localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (error) {
      console.warn('Predictive dashboard: failed to parse set for', key, error);
      return new Set();
    }
  };

  const saveSet = (key, set) => {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  };

  const loadMap = key => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Map();
      const parsed = JSON.parse(raw);
      return new Map(Object.entries(parsed));
    } catch (error) {
      console.warn('Predictive dashboard: failed to parse map for', key, error);
      return new Map();
    }
  };

  const saveMap = (key, map) => {
    const obj = {};
    map.forEach((value, mapKey) => {
      obj[mapKey] = value;
    });
    localStorage.setItem(key, JSON.stringify(obj));
  };

  const escapeHTML = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const filters = {
    authority: '',
    sector: '',
    confidence: ''
  };

  const acknowledged = loadSet(acknowledgedKey);
  const delegated = loadSet(delegatedKey);
  const delegationNotes = loadMap(delegationNotesKey);

  const predictionIndex = new Map();
  Object.values(payload.lanes || {}).forEach(list => {
    (list || []).forEach(prediction => {
      predictionIndex.set(prediction.id, prediction);
    });
  });

  const updateCardFlags = card => {
    const id = card.dataset.prediction;
    const container = card.querySelector('[data-flag-container]');
    if (!container) return;
    container.innerHTML = '';

    if (acknowledged.has(id)) {
      const badge = document.createElement('span');
      badge.className = 'flag-pill flag-acknowledged';
      badge.textContent = 'Acknowledged';
      container.appendChild(badge);
    }

    if (delegated.has(id)) {
      const badge = document.createElement('span');
      badge.className = 'flag-pill flag-delegated';
      const note = delegationNotes.get(id) || 'Delegated';
      badge.textContent = `Delegated • ${note}`;
      container.appendChild(badge);
    }
  };

  const applyCardState = card => {
    const id = card.dataset.prediction;
    card.classList.toggle('is-acknowledged', acknowledged.has(id));
    card.classList.toggle('is-delegated', delegated.has(id));

    const ackButton = card.querySelector('[data-action="acknowledge"]');
    if (ackButton) {
      if (acknowledged.has(id)) {
        ackButton.textContent = 'Acknowledged';
        ackButton.setAttribute('aria-pressed', 'true');
      } else {
        ackButton.textContent = 'Acknowledge';
        ackButton.setAttribute('aria-pressed', 'false');
      }
    }

    updateCardFlags(card);
  };

  cards.forEach(applyCardState);

  const matchesFilters = card => {
    const authorities = (card.dataset.authorities || '').split('|').filter(Boolean);
    const sectors = (card.dataset.sectors || '').split('|').filter(Boolean);
    const confidence = card.dataset.confidence || '';

    if (filters.authority && !authorities.includes(filters.authority)) return false;
    if (filters.sector && !sectors.includes(filters.sector)) return false;
    if (filters.confidence && confidence !== filters.confidence) return false;
    return true;
  };

  const ensureLanePlaceholders = () => {
    lanes.forEach(lane => {
      const visibleCards = lane.querySelectorAll('.insight-card:not(.is-hidden)');
      let placeholder = lane.querySelector('.empty-placeholder');
      if (!visibleCards.length) {
        if (!placeholder) {
          placeholder = document.createElement('div');
          placeholder.className = 'empty-state empty-placeholder';
          placeholder.innerHTML = '<h4>No insights match the filters</h4><p>Adjust filters to rediscover saved intelligence.</p>';
          const container = lane.querySelector('.lane-cards');
          if (container) container.appendChild(placeholder);
        }
        placeholder.style.display = 'block';
      } else if (placeholder) {
        placeholder.style.display = 'none';
      }
    });
  };

  const applyFilters = () => {
    if (filterForm) {
      const formData = new FormData(filterForm);
      filters.authority = formData.get('authority') || '';
      filters.sector = formData.get('sector') || '';
      filters.confidence = formData.get('confidence') || '';
    }

    cards.forEach(card => {
      const visible = matchesFilters(card);
      card.classList.toggle('is-hidden', !visible);
    });
    ensureLanePlaceholders();
  };

  if (filterForm) {
    filterForm.addEventListener('change', applyFilters);
    filterForm.addEventListener('reset', () => {
      window.setTimeout(() => {
        filters.authority = '';
        filters.sector = '';
        filters.confidence = '';
        applyFilters();
      }, 0);
    });
  }

  applyFilters();

  const severityClass = severity => `severity-${(severity || 'medium').toLowerCase()}`;

  const listRenderer = (items, emptyText, builder) => {
    if (!items || !items.length) {
      return `<p class="drawer-empty">${escapeHTML(emptyText)}</p>`;
    }
    return `<ul>${items.map(builder).join('')}</ul>`;
  };

  const renderDrawer = prediction => {
    const context = prediction.context || {};
    const accuracy = context.historicalAccuracy || {};
    const actions = prediction.recommended_actions || [];
    const evidence = context.evidence || [];
    const updates = context.triggeringUpdates || [];
    const drivers = context.confidenceDrivers || prediction.confidence_factors || [];

    return [
      `<section class="drawer-section"><h3>Why this matters</h3><p>${escapeHTML(context.why || prediction.why_this_matters || 'Supporting intelligence unavailable.')}</p></section>`,
      `<section class="drawer-section"><h3>Recommended actions</h3>${listRenderer(actions, 'No recommended actions captured.', item => `<li>${escapeHTML(item)}</li>`)}</section>`,
      `<section class="drawer-section"><h3>Evidence trail</h3>${listRenderer(evidence, 'No evidence captured yet.', item => `<li class="evidence-item"><span class="drawer-badge ${severityClass(item.severity)}">${escapeHTML((item.severity || 'info').toUpperCase())}</span><div>${escapeHTML(item.statement || 'Statement unavailable.')}</div></li>` )}</section>`,
      `<section class="drawer-section"><h3>Triggering updates</h3>${listRenderer(updates, 'No triggering updates recorded.', item => { const date = item.date ? new Date(item.date).toLocaleDateString() : 'Date tbc'; return `<li><strong>${escapeHTML(item.headline || 'Update')}</strong><br><span class="drawer-subtext">${escapeHTML(item.authority || 'Unknown authority')} • ${escapeHTML(date)}</span></li>`; })}</section>`,
      `<section class="drawer-section"><h3>Historical accuracy</h3>${accuracy.bucket ? `<p>${escapeHTML(accuracy.statement || '')}</p><span class="drawer-subtext">Window: ${escapeHTML(accuracy.window || 'n/a')}</span>` : '<p class="drawer-empty">No accuracy benchmarks recorded.</p>'}</section>`,
      `<section class="drawer-section"><h3>Confidence drivers</h3>${listRenderer(drivers, 'Model drivers not recorded.', item => `<li>${escapeHTML(item)}</li>`)}</section>`
    ].join('');
  };

  const openDrawer = prediction => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-visible');
    if (drawerTitle) drawerTitle.textContent = prediction.prediction_title;
    if (drawerBody) drawerBody.innerHTML = renderDrawer(prediction);
  };

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.classList.remove('is-visible');
  };

  document.addEventListener('click', event => {
    const target = event.target;

    if (target.matches('[data-action="view-details"]')) {
      const card = target.closest('.insight-card');
      if (!card) return;
      const prediction = predictionIndex.get(card.dataset.prediction);
      if (prediction) openDrawer(prediction);
      return;
    }

    if (target.matches('[data-drawer-close="true"]')) {
      closeDrawer();
      return;
    }

    if (target.matches('[data-action="acknowledge"]')) {
      const card = target.closest('.insight-card');
      if (!card) return;
      const id = card.dataset.prediction;
      if (acknowledged.has(id)) {
        acknowledged.delete(id);
      } else {
        acknowledged.add(id);
      }
      saveSet(acknowledgedKey, acknowledged);
      applyCardState(card);
      return;
    }

    if (target.matches('[data-action="delegate"]')) {
      const card = target.closest('.insight-card');
      if (!card) return;
      const id = card.dataset.prediction;
      const current = delegationNotes.get(id) || '';
      const response = window.prompt('Who should follow up on this insight?', current);
      if (response === null) return;
      const trimmed = response.trim();
      if (trimmed) {
        delegated.add(id);
        delegationNotes.set(id, trimmed);
      } else {
        delegated.delete(id);
        delegationNotes.delete(id);
      }
      saveSet(delegatedKey, delegated);
      saveMap(delegationNotesKey, delegationNotes);
      applyCardState(card);
      return;
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeDrawer();
    }
  });
})();
