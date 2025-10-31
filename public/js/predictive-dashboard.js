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

  const summaryTiles = Array.isArray(payload.summary) ? payload.summary : [];
  const laneLabels = {
    act_now: 'Act Now (≤14 days)',
    prepare_next: 'Prepare Next (15-45 days)',
    plan_horizon: 'Plan Horizon (45-90 days)'
  };

  const parseTimestamp = value => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDisplayDate = date => date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatFileDate = date => {
    const safeDate = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
    return safeDate.toISOString().split('T')[0];
  };

  const buildSummaryCards = () => summaryTiles.map(tile => `
        <div class="summary-card">
          <div class="summary-value">${escapeHTML(tile.value || '0')}</div>
          <div class="summary-label">${escapeHTML(tile.label || '')}</div>
          ${tile.helper ? `<p class="summary-helper">${escapeHTML(tile.helper)}</p>` : ''}
        </div>
      `).join('');

  const buildLaneSection = (laneKey, list) => {
    const label = laneLabels[laneKey] || laneKey;
    const entries = Array.isArray(list) ? list.slice(0, 3) : [];
    if (!entries.length) {
      return `
        <section class="lane">
          <h2>${escapeHTML(label)}</h2>
          <p class="muted">No live insights in this lane.</p>
        </section>
      `;
    }

    const items = entries.map(prediction => {
      const metaParts = [];
      if (prediction.timeframe) metaParts.push(prediction.timeframe);
      const authorities = Array.isArray(prediction.context?.authorities) && prediction.context.authorities.length
        ? prediction.context.authorities
        : Array.isArray(prediction.authorities) ? prediction.authorities : [];
      if (authorities.length) metaParts.push(authorities.join(', '));
      if (typeof prediction.confidence === 'number' && !Number.isNaN(prediction.confidence)) {
        metaParts.push(`${Math.round(prediction.confidence)}% confidence`);
      } else if (prediction.confidence_bucket) {
        metaParts.push(`${prediction.confidence_bucket} confidence`);
      }
      const metaLine = metaParts.length
        ? `<div class="lane-meta">${escapeHTML(metaParts.join(' • '))}</div>`
        : '';
      const summary = prediction.why_this_matters || prediction.context?.why || '';
      const action = Array.isArray(prediction.recommended_actions) && prediction.recommended_actions.length
        ? `<div class="lane-action">Next: ${escapeHTML(prediction.recommended_actions[0])}</div>`
        : '';
      return `<li>
          <strong>${escapeHTML(prediction.prediction_title || 'Insight')}</strong>
          ${metaLine}
          <p>${escapeHTML(summary || 'Summary pending additional detail.')}</p>
          ${action}
        </li>`;
    }).join('');

    return `
      <section class="lane">
        <h2>${escapeHTML(label)}</h2>
        <ul>
          ${items}
        </ul>
      </section>
    `;
  };

  const buildHotspotsSection = () => {
    const hotspots = Array.isArray(payload.momentum?.sectors) ? payload.momentum.sectors.slice(0, 5) : [];
    if (!hotspots.length) {
      return '<p class="muted">No sector hotspots flagged this cycle.</p>';
    }
    const items = hotspots.map(item => {
      const signals = [];
      if (typeof item.changePercent === 'number' && !Number.isNaN(item.changePercent)) {
        signals.push(`${item.changePercent}% change`);
      }
      if (typeof item.recent === 'number' && !Number.isNaN(item.recent)) {
        signals.push(`${item.recent} recent updates`);
      }
      const suffix = signals.length ? ` – ${escapeHTML(signals.join(' • '))}` : '';
      return `<li><strong>${escapeHTML(item.sector || item.name || 'Sector')}</strong>${suffix}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
  };

  const buildAlertsSection = () => {
    const items = Array.isArray(payload.alerts) ? payload.alerts.slice(0, 5) : [];
    if (!items.length) {
      return '<p class="muted">No pattern alerts triggered.</p>';
    }
    const list = items.map(alert => {
      const severity = alert.severity ? alert.severity.toUpperCase() : 'INFO';
      return `<li><strong>${escapeHTML(severity)}</strong> – ${escapeHTML(alert.message || 'Alert message unavailable.')}</li>`;
    }).join('');
    return `<ul>${list}</ul>`;
  };

  const buildOnePagerHtml = () => {
    const generatedDate = parseTimestamp(payload.generatedAt);
    const generatedLabel = formatDisplayDate(generatedDate);
    const summaryMarkup = summaryTiles.length
      ? `<div class="summary-grid">
          ${buildSummaryCards()}
        </div>`
      : '<p class="muted">No snapshot metrics available.</p>';
    const laneSections = ['act_now', 'prepare_next', 'plan_horizon']
      .map(key => buildLaneSection(key, payload.lanes?.[key] || []))
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Horizon Scanner One-Pager</title>
<style>
  body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 32px; color: #0f172a; background: #ffffff; line-height: 1.5; }
  header, section { margin-bottom: 24px; }
  h1 { font-size: 1.9rem; margin: 0 0 4px; }
  h2 { font-size: 1.2rem; margin: 0 0 12px; color: #1d4ed8; }
  .generated { color: #475569; margin: 0; font-size: 0.95rem; }
  .summary-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
  .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; }
  .summary-value { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
  .summary-label { margin-top: 4px; font-size: 0.9rem; color: #475569; }
  .summary-helper { margin-top: 6px; font-size: 0.8rem; color: #64748b; }
  .lane-wrapper { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .lane { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff; box-shadow: 0 8px 24px -22px rgba(15, 23, 42, 0.45); }
  .lane ul { margin: 0; padding-left: 18px; }
  .lane li { margin-bottom: 12px; }
  .lane-meta { font-size: 0.8rem; color: #64748b; margin: 4px 0; }
  .lane-action { font-size: 0.85rem; color: #1d4ed8; margin-top: 6px; }
  .muted { color: #64748b; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 8px; }
  footer { margin-top: 28px; font-size: 0.85rem; color: #94a3b8; }
  @media print {
    body { margin: 0; }
    .lane { box-shadow: none; }
  }
</style>
</head>
<body>
<header>
  <h1>Predictive Intelligence One-Pager</h1>
  <p class="generated">Issued ${escapeHTML(generatedLabel)}</p>
</header>
<section>
  <h2>Snapshot</h2>
  ${summaryMarkup}
</section>
<section class="lane-wrapper">
  ${laneSections}
</section>
<section>
  <h2>Sectors Heating Up</h2>
  ${buildHotspotsSection()}
</section>
<section>
  <h2>Alerts to Brief</h2>
  ${buildAlertsSection()}
</section>
<footer>
  Prepared with Horizon Scanner predictive analytics.
</footer>
</body>
</html>`;
  };

  const triggerOnePagerDownload = () => {
    const html = buildOnePagerHtml();
    const fileDate = formatFileDate(parseTimestamp(payload.generatedAt));
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `horizon-one-pager-${fileDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const downloadButton = document.getElementById('downloadOnePager');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      try {
        triggerOnePagerDownload();
      } catch (error) {
        console.error('Predictive dashboard: one-pager export failed', error);
        window.alert('Unable to export the one-pager right now. Please try again.');
      }
    });
  }

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
