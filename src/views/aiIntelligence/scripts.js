function getAiIntelligenceScripts(snapshot) {
  const snapshotJson = JSON.stringify(snapshot || {}).replace(/</g, '\\u003c')

  return `
    <script>
      (function() {
        let snapshot = window.intelligenceSnapshot || ${snapshotJson};
        const state = {
          activePersona: 'executive'
        };

        const quickStatOrder = [
          { key: 'totalUpdates', label: 'Total updates' },
          { key: 'highImpact', label: 'High impact' },
          { key: 'activeAuthorities', label: 'Active authorities' },
          { key: 'deadlinesSoon', label: 'Imminent deadlines' },
          { key: 'urgentUpdates', label: 'Urgent updates' }
        ];

        const streamDefinitions = [
          { key: 'high', title: 'High relevance to your firm' },
          { key: 'medium', title: 'Medium relevance' },
          { key: 'low', title: 'Background intelligence' }
        ];

        const workspaceCardActions = {
          pinned: 'WorkspaceModule && WorkspaceModule.showPinnedItems && WorkspaceModule.showPinnedItems()',
          searches: 'WorkspaceModule && WorkspaceModule.showSavedSearches && WorkspaceModule.showSavedSearches()',
          alerts: 'WorkspaceModule && WorkspaceModule.showCustomAlerts && WorkspaceModule.showCustomAlerts()',
          tasks: 'WorkspaceModule && WorkspaceModule.showAnnotations && WorkspaceModule.showAnnotations()'
        };

        function streamTimestamp(value) {
          if (!value) return 0;
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? 0 : date.getTime();
        }

        function renderHeroHTML(hero, risk) {
          hero = hero || {};
          risk = risk || {};
          const title = escapeHtml(hero.headline || 'AI Intelligence Insight');
          const summary = escapeHtml(hero.summary || 'Monitoring in progress.');
          const recommendation = escapeHtml(hero.recommendation || 'Monitor developments and await further signals.');
          const related = Array.isArray(hero.relatedSignals) && hero.relatedSignals.length
            ? '<ul class="hero-related">' + hero.relatedSignals.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
            : '';

          const confidenceComponent = Array.isArray(risk.components)
            ? risk.components.find(component => (component.label || '').toLowerCase().includes('impact'))
            : null;
          const confidence = confidenceComponent ? Number(confidenceComponent.score || 0).toFixed(1) + '/10' : 'N/A';

          const scoreValue = typeof risk.score === 'number' ? risk.score.toFixed(1) : escapeHtml(String(risk.score || 0));

          return [
            '<section class="hero-insight">',
            '  <div class="hero-copy">',
            '    <h1>' + title + '</h1>',
            '    <p class="hero-summary">' + summary + '</p>',
            '    <div class="hero-recommendation">',
            '      <strong>Recommended action</strong>',
            '      <span>' + recommendation + '</span>',
            '    </div>',
            related,
            '  </div>',
            '  <div class="hero-meta">',
            '    <div class="hero-score">',
            '      <span class="hero-score-label">Signal score</span>',
            '      <span class="hero-score-value">' + scoreValue + '</span>',
            '      <span class="hero-score-confidence">Confidence ' + escapeHtml(confidence) + '</span>',
            '    </div>',
            '    <button type="button" class="hero-transparency" onclick="window.RegCanaryIntelligence?.showRiskExplain()">Why this score?</button>',
            '  </div>',
            '</section>'
          ].join('');
        }

        function escapeHtml(value) {
          if (value == null) return '';
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }

        function coerceNumber(value) {
          const num = Number(value);
          return Number.isFinite(num) ? num : 0;
        }

        function formatNumber(value) {
          const num = coerceNumber(value);
          return num.toLocaleString('en-GB');
        }

        function formatDateDisplay(value) {
          if (!value) return 'Unknown';
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return 'Unknown';
          return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        function renderRiskPulseHTML(data) {
          const score = coerceNumber(data.riskPulse?.score || 0);
          const scoreLabel = score.toFixed(1);
          const label = escapeHtml(data.riskPulse?.label || 'Stable');
          const deltaRaw = Number(data.riskPulse?.delta || 0);
          const deltaLabel = (deltaRaw > 0 ? '+' : '') + deltaRaw.toFixed(1);
          const trendClass = deltaRaw > 0 ? 'pulse-up' : (deltaRaw < 0 ? 'pulse-down' : 'pulse-flat');
          const dashArray = Math.min(314, Math.max(0, Math.min(10, score)) / 10 * 314);
          const focus = escapeHtml(data.focusHeadline || 'Monitoring in progress.');

          return [
            '<section class="risk-pulse">',
            '  <div class="pulse-gauge" role="img" aria-label="Risk pulse score ' + scoreLabel + '">',
            '    <svg viewBox="0 0 120 120">',
            '      <defs>',
            '        <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
            '          <stop offset="0%" stop-color="#38bdf8"></stop>',
            '          <stop offset="100%" stop-color="#0ea5e9"></stop>',
            '        </linearGradient>',
            '      </defs>',
            '      <circle class="pulse-track" cx="60" cy="60" r="50"></circle>',
            '      <circle class="pulse-meter" cx="60" cy="60" r="50" stroke-dasharray="' + dashArray + ' 314"></circle>',
            '      <text x="60" y="68" class="pulse-score">' + scoreLabel + '</text>',
            '    </svg>',
            '  </div>',
            '  <div class="pulse-details">',
            '    <span class="pulse-label">' + label + '</span>',
            '    <span class="pulse-delta ' + trendClass + '"><span class="pulse-delta-icon"></span>' + deltaLabel + '</span>',
            '    <p class="pulse-focus">' + focus + '</p>',
            '  </div>',
            '</section>'
          ].join('');
        }

        function buildQuickStatsHTML(stats) {
          return quickStatOrder
            .map(entry => {
              const value = formatNumber(stats?.[entry.key] || 0);
              return [
                '<div class="quick-stat-card">',
                '  <span class="quick-stat-value">' + value + '</span>',
                '  <span class="quick-stat-label">' + escapeHtml(entry.label) + '</span>',
                '</div>'
              ].join('');
            })
            .join('');
        }

        function buildStreamCardHTML(update) {
          const personas = Array.isArray(update.personas) ? update.personas : [];
          const personaChips = personas
            .map(persona => '<span class="persona-chip persona-' + escapeHtml(persona) + '">' + escapeHtml(persona) + '</span>')
            .join('');
          const published = formatDateDisplay(update.publishedAt);
          const urgency = escapeHtml((update.urgency || 'Low').toLowerCase());
          const isPinned = update.isPinned ? 'true' : 'false';
          const pinClass = update.isPinned ? ' is-pinned' : '';
          const pinSymbol = update.isPinned ? '★' : '☆';

          return [
            '<article class="stream-card" data-update-id="' + escapeHtml(update.updateId || '') + '" data-url="' + escapeHtml(update.url || '') + '" data-pinned="' + isPinned + '">',
            '  <header>',
            '    <span class="card-authority">' + escapeHtml(update.authority || 'Unknown') + '</span>',
            '    <span class="card-urgency urgency-' + urgency + '">' + escapeHtml(update.urgency || 'Low') + '</span>',
            '  </header>',
            '  <h3><a href="' + escapeHtml(update.url || '#') + '" target="_blank" rel="noopener">' + escapeHtml(update.headline || 'Untitled update') + '</a></h3>',
            '  <p class="card-summary">' + escapeHtml(update.summary || 'Summary not available.') + '</p>',
            '  <footer>',
            '    <div class="card-metadata">',
            '      <span class="card-published">Published ' + escapeHtml(published) + '</span>',
            personaChips,
            update.primarySector ? '<span class="sector-tag">' + escapeHtml(update.primarySector) + '</span>' : '',
            '    </div>',
            '    <div class="card-actions">',
            '      <span class="card-next-step">' + escapeHtml(update.nextStep || 'Monitor developments') + '</span>',
            '      <div class="card-buttons">',
            '        <button type="button" class="icon-btn pin-toggle' + pinClass + '" data-action="pin" data-update-id="' + escapeHtml(update.updateId || '') + '" data-pinned="' + isPinned + '" aria-pressed="' + isPinned + '" title="' + (update.isPinned ? 'Unpin update' : 'Pin update') + '">' + pinSymbol + '</button>',
            '        <button type="button" class="icon-btn" data-action="annotate" data-update-id="' + escapeHtml(update.updateId || '') + '">✎</button>',
            '        <button type="button" class="icon-btn" data-action="share" data-update-id="' + escapeHtml(update.updateId || '') + '">⇪</button>',
            '      </div>',
            '    </div>',
            '  </footer>',
            '</article>'
          ].join('');
        }

        function renderStreamsHTML(streams, workspace, timeline, themes) {
          const priorityFeed = [];
          (streams?.high || []).forEach(update => priorityFeed.push(update));
          (streams?.medium || []).forEach(update => priorityFeed.push({ ...update, bucketOverride: 'medium' }));
          (streams?.low || []).forEach(update => priorityFeed.push({ ...update, bucketOverride: 'low' }));

          priorityFeed.sort((a, b) => {
            const rank = value => (value.bucketOverride === 'medium' ? 1 : value.bucketOverride === 'low' ? 2 : 0);
            const diff = rank(a) - rank(b);
            if (diff !== 0) return diff;
            return streamTimestamp(b.publishedAt) - streamTimestamp(a.publishedAt);
          });

          const sidebarBlocks = [];
          if (Array.isArray(streams?.medium) && streams.medium.length) {
            sidebarBlocks.push(renderStreamCollection('Medium relevance', streams.medium, 'medium'));
          }
          if (Array.isArray(streams?.low) && streams.low.length) {
            sidebarBlocks.push(renderStreamCollection('Background intelligence', streams.low, 'low'));
          }
          sidebarBlocks.push(renderWorkspaceHTML(workspace));
          sidebarBlocks.push(renderTimelineHTML(timeline));
          if (Array.isArray(themes) && themes.length) {
            sidebarBlocks.push(renderThemesHTML(themes));
          }

          return [
            '<section class="streams-split" aria-label="Daily intelligence">',
            '  <div class="priority-feed">',
            '    <header class="section-header"><h2>Priority feed</h2></header>',
            '    <div class="priority-list">',
            priorityFeed.length ? priorityFeed.map(buildStreamCardHTML).join('') : '<p class="empty">No priority updates available.</p>',
            '    </div>',
            '  </div>',
            '  <aside class="action-sidebar">',
            sidebarBlocks.join(''),
            '  </aside>',
            '</section>'
          ].join('');
        }

        function renderStreamCollection(title, list, key = '') {
          if (!Array.isArray(list) || !list.length) return '';
          const classes = ['stream-column'];
          if (key === 'medium') {
            classes.push('medium-relevance');
          } else if (key === 'low') {
            classes.push('background-relevance');
          }
          return [
            '<section class="' + classes.join(' ') + '">',
            '  <header class="stream-header">',
            '    <h3>' + escapeHtml(title) + '</h3>',
            '    <span class="stream-count">' + list.length + ' updates</span>',
            '  </header>',
            '  <div class="stream-list">',
            list.map(buildStreamCardHTML).join(''),
            '  </div>',
            '</section>'
          ].join('');
        }

        function renderPersonaHTML(personas) {
          const order = ['executive', 'analyst', 'operations'];
          const tabs = order
            .filter(persona => personas && personas[persona])
            .map(persona => {
              const entry = personas[persona];
              return [
                '<button type="button" class="persona-tab" data-persona="' + persona + '">',
                '  <span class="persona-tab-label">' + persona.charAt(0).toUpperCase() + persona.slice(1) + '</span>',
                '  <span class="persona-tab-count">' + formatNumber(entry.count || 0) + '</span>',
                '</button>'
              ].join('');
            })
            .join('');

          const panels = order
            .filter(persona => personas && personas[persona])
            .map(persona => {
              const entry = personas[persona];
              const briefing = entry.briefing || {};
              const actions = Array.isArray(briefing.nextSteps) && briefing.nextSteps.length
                ? '<ol class="persona-brief-list">' + briefing.nextSteps.map(step => '<li>' + escapeHtml(step) + '</li>').join('') + '</ol>'
                : '<div class="persona-empty">No spotlight updates for this persona right now. Pin or annotate items to surface them here.</div>';

              return [
                '<div class="persona-panel" data-persona-panel="' + persona + '">',
                '  <div class="persona-metrics">',
                '    <div><span class="metric-label">Updates</span><span class="metric-value">' + formatNumber(entry.count || 0) + '</span></div>',
                '    <div><span class="metric-label">Pinned</span><span class="metric-value">' + formatNumber(entry.pins || 0) + '</span></div>',
                '    <div><span class="metric-label">Open tasks</span><span class="metric-value">' + formatNumber(entry.openTasks || 0) + '</span></div>',
                '  </div>',
                '<div class="persona-briefing">',
                '  <p>' + escapeHtml(briefing.summary || 'No priority actions detected.') + '</p>',
                actions,
                '</div>',
                '</div>'
              ].join('');
            })
            .join('');

          return [
            '<section class="persona-intelligence">',
            '  <header>',
            '    <h2>Persona Intelligence</h2>',
            '    <div class="persona-tabs">' + tabs + '</div>',
            '  </header>',
            '  <div class="persona-panels">' + panels + '</div>',
            '</section>'
          ].join('');
        }

        function renderWorkspaceHTML(workspace) {
          const cards = [
            { key: 'pinned', label: 'Pinned updates', meta: 'Saved for follow-up', value: formatNumber((workspace?.pinnedItems || []).length || 0), action: workspaceCardActions.pinned },
            { key: 'searches', label: 'Saved searches', meta: 'Reusable filters', value: formatNumber((workspace?.savedSearches || []).length || 0), action: workspaceCardActions.searches },
            { key: 'alerts', label: 'Active alerts', meta: 'Monitoring thresholds', value: formatNumber((workspace?.customAlerts || []).filter(alert => alert.isActive).length || 0), action: workspaceCardActions.alerts },
            { key: 'tasks', label: 'Open actions', meta: 'Annotations requiring action', value: formatNumber(workspace?.tasks || 0), action: workspaceCardActions.tasks }
          ];

          return [
            '<section class="workspace-pulse">',
            '  <header>',
            '    <h2>Workspace Pulse</h2>',
            '    <p>Snapshot of team activity and outstanding actions</p>',
            '  </header>',
            '  <div class="workspace-grid">',
            cards
              .map(card => [
                '<button type="button" class="workspace-card" data-workspace-card="' + card.key + '"' + (card.action ? ' onclick="' + card.action + '"' : '') + '>',
                '  <span class="workspace-value">' + card.value + '</span>',
                '  <span class="workspace-label">' + escapeHtml(card.label) + '</span>',
                '  <span class="workspace-meta">' + escapeHtml(card.meta) + '</span>',
                '</button>'
              ].join(''))
              .join(''),
            '  </div>',
            '</section>'
          ].join('');
        }

        function renderTimelineHTML(timeline) {
          if (!Array.isArray(timeline) || !timeline.length) {
            return [
              '<section class="intelligence-timeline">',
              '  <header><h2>Compliance Timeline</h2></header>',
              '  <p class="timeline-empty">No upcoming deadlines detected within the next 30 days.</p>',
              '</section>'
            ].join('');
          }

          return [
            '<section class="intelligence-timeline">',
            '  <header><h2>Compliance Timeline</h2></header>',
            '  <ul class="timeline-list">',
            timeline
              .slice(0, 10)
              .map(entry => [
                '<li class="timeline-item timeline-' + escapeHtml(String(entry.urgency || 'low').toLowerCase()) + '">',
                '  <span class="timeline-date">' + escapeHtml(formatDateDisplay(entry.date)) + '</span>',
                '  <div>',
                '    <strong>' + escapeHtml(entry.title || 'Compliance deadline') + '</strong>',
                '    <span>' + escapeHtml(entry.authority || '') + '</span>',
                '  </div>',
                '</li>'
              ].join(''))
              .join(''),
            '  </ul>',
            '</section>'
          ].join('');
        }

        function renderThemesHTML(themes) {
          if (!Array.isArray(themes) || !themes.length) {
            return '';
          }
          return [
            '<section class="emerging-themes">',
            '  <header><h2>Emerging Themes</h2></header>',
            '  <div class="theme-cloud">',
            themes
              .slice(0, 6)
              .map(theme => '<span class="theme-chip">' + escapeHtml(theme.label) + '<span class="theme-support">' + escapeHtml(String(theme.support)) + '</span></span>')
              .join(''),
            '  </div>',
            '</section>'
          ].join('');
        }

        function applySnapshotModel(newSnapshot) {
          if (!newSnapshot) return;
          snapshot = newSnapshot;
          window.intelligenceSnapshot = newSnapshot;

          const heroDate = document.querySelector('.hero-date');
          if (heroDate) {
            heroDate.textContent = formatDateDisplay(newSnapshot.snapshotDate);
          }

          const heroSection = document.querySelector('.hero-insight');
          if (heroSection) {
            heroSection.outerHTML = renderHeroHTML(newSnapshot.heroInsight || {}, newSnapshot.riskPulse || {});
          } else {
            const panel = document.querySelector('.hero-panel');
            if (panel) {
              panel.insertAdjacentHTML('afterend', renderHeroHTML(newSnapshot.heroInsight || {}, newSnapshot.riskPulse || {}));
            }
          }

          const riskPulseSection = document.querySelector('.risk-pulse');
          if (riskPulseSection) {
            riskPulseSection.outerHTML = renderRiskPulseHTML(newSnapshot);
          }

          const quickStatsSection = document.querySelector('.quick-stats');
          if (quickStatsSection) {
            quickStatsSection.innerHTML = buildQuickStatsHTML(newSnapshot.quickStats || {});
          }

          const streamsSection = document.querySelector('.streams-split');
          if (streamsSection) {
            streamsSection.outerHTML = renderStreamsHTML(
              newSnapshot.streams || {},
              newSnapshot.workspace || {},
              newSnapshot.timeline || [],
              newSnapshot.layoutConfig && newSnapshot.layoutConfig.showThemes === false ? [] : newSnapshot.themes || []
            );
          }

          const workspaceSection = document.querySelector('.workspace-pulse');
          if (workspaceSection && !streamsSection) {
            workspaceSection.outerHTML = renderWorkspaceHTML(newSnapshot.workspace || {});
          }

          const personaSection = document.querySelector('.persona-intelligence');
          if (personaSection) {
            personaSection.outerHTML = renderPersonaHTML(newSnapshot.personas || {});
          }

          const timelineSection = document.querySelector('.intelligence-timeline');
          if (timelineSection) {
            timelineSection.outerHTML = renderTimelineHTML(newSnapshot.timeline || []);
          }

          const themesSection = document.querySelector('.emerging-themes');
          if (themesSection) {
            const themesMarkup = renderThemesHTML(newSnapshot.themes || []);
            themesSection.outerHTML = themesMarkup || '';
          }

          initialisePinnedStates();
          initialisePersonaTabs(state.activePersona);
          attachCardActions();
        }

        function setActivePersona(persona) {
          const tabs = document.querySelectorAll('.persona-tab');
          const panels = document.querySelectorAll('.persona-panel');

          tabs.forEach(tab => {
            const isActive = tab.dataset.persona === persona;
            tab.classList.toggle('active', isActive);
          });

          panels.forEach(panel => {
            const isActive = panel.dataset.personaPanel === persona;
            panel.classList.toggle('active', isActive);
          });

          state.activePersona = persona;
        }

        function initialisePersonaTabs(defaultPersona) {
          const tabs = document.querySelectorAll('.persona-tab');
          if (!tabs.length) return;

          tabs.forEach(tab => {
            tab.addEventListener('click', () => {
              setActivePersona(tab.dataset.persona);
            });
          });

          let targetPersona = defaultPersona;
          if (!targetPersona || !Array.from(tabs).some(tab => tab.dataset.persona === targetPersona)) {
            targetPersona = tabs[0]?.dataset.persona || 'executive';
          }
          setActivePersona(targetPersona);
        }

        function updatePinButtonState(button, pinned) {
          if (!button) return;
          const nextState = pinned ? 'true' : 'false';
          button.dataset.pinned = nextState;
          button.classList.toggle('is-pinned', pinned);
          button.textContent = pinned ? '★' : '☆';
          button.setAttribute('aria-pressed', nextState);
          button.setAttribute('title', pinned ? 'Unpin update' : 'Pin update');
        }

        function adjustPersonaPinnedCounts(personaList, delta) {
          if (!Array.isArray(personaList)) return;
          personaList.forEach(persona => {
            if (!persona) return;
            const key = String(persona).trim().toLowerCase();
            if (!key) return;
            const panel = document.querySelector('.persona-panel[data-persona-panel="' + key + '"]');
            if (!panel) return;
            const metrics = panel.querySelectorAll('.persona-metrics .metric-value');
            if (metrics.length < 2) return;
            const current = parseInt(metrics[1].textContent.replace(/[^0-9]/g, ''), 10) || 0;
            const next = Math.max(0, current + delta);
            metrics[1].textContent = next.toLocaleString('en-GB');
          });
        }

        function syncPersonaPinnedBadges(updateId, pinned) {
          if (!updateId) return;
          const updateKey = String(updateId || '');
          if (!updateKey) return;
          document
            .querySelectorAll('.persona-update[data-update-id="' + updateKey + '"]')
            .forEach(item => {
              const container = item.querySelector('.persona-update-tags') || (function() {
                if (!pinned) return null;
                const wrap = document.createElement('div');
                wrap.className = 'persona-update-tags';
                const textHolder = item.querySelector('div');
                if (textHolder) {
                  textHolder.appendChild(wrap);
                  return wrap;
                }
                return null;
              })();

              if (!container) return;

              const pinnedBadge = container.querySelector('.badge-pinned');
              if (pinned) {
                if (!pinnedBadge) {
                  const badge = document.createElement('span');
                  badge.className = 'persona-update-badge badge-pinned';
                  badge.textContent = 'Pinned';
                  container.appendChild(badge);
                }
              } else if (pinnedBadge) {
                pinnedBadge.remove();
                if (!container.querySelector('.persona-update-badge')) {
                  container.remove();
                }
              }
            });
        }

        function updateWorkspaceMetric(key, delta) {
          const valueEl = document.querySelector(
            '.workspace-card[data-workspace-card="' + key + '"] .workspace-value'
          );
          if (!valueEl) return;
          const current = parseInt(valueEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
          const next = Math.max(0, current + delta);
          valueEl.textContent = next.toLocaleString('en-GB');
        }

        function initialisePinnedStates() {
          document.querySelectorAll('.stream-card .pin-toggle').forEach(button => {
            updatePinButtonState(button, button.dataset.pinned === 'true');
          });
        }

        function refreshAfterPinToggle() {
          fetch('/api/intelligence/daily', { headers: { Accept: 'application/json' } })
            .then(response => {
              if (!response.ok) throw new Error('Failed to refresh snapshot');
              return response.json();
            })
            .then(payload => {
              if (payload && payload.success && payload.snapshot) {
                applySnapshotModel(payload.snapshot);
              } else {
                showToast('Unable to refresh intelligence view', 'error');
              }
            })
            .catch(error => {
              console.warn('Unable to refresh intelligence snapshot after pin update:', error);
              showToast('Unable to refresh intelligence view', 'error');
            });
        }

        function attachCardActions() {
          document.querySelectorAll('.stream-card .icon-btn').forEach(button => {
            button.addEventListener('click', event => {
              const updateId = button.dataset.updateId;
              const action = button.dataset.action;
              const update = snapshot && snapshot.streams
                ? findUpdateById(updateId, snapshot.streams)
                : null;

              switch (action) {
                case 'pin':
                  const card = button.closest('.stream-card');
                  const targetUrl = update?.url || card?.dataset.url;
                  if (!update || !targetUrl) {
                    showToast('Missing update link to pin', 'error');
                    return;
                  }
                  if (!window.WorkspaceModule || typeof WorkspaceModule.togglePin !== 'function') {
                    showToast('Workspace module not available', 'error');
                    return;
                  }

                  const wasPinned = button.dataset.pinned === 'true';
                  const context = {
                    summary: update.summary,
                    personas: Array.isArray(update.personas) ? update.personas : [],
                    sectors: update.primarySector ? [update.primarySector] : [],
                    published: update.publishedAt,
                    updateId: update.updateId || update.id,
                    authority: update.authority,
                    url: targetUrl
                  };

                  button.disabled = true;
                  Promise.resolve(
                    WorkspaceModule.togglePin(targetUrl, update.headline, update.authority, context)
                  )
                    .then(success => {
                      if (!success) return;
                      const nextPinned = !wasPinned;
                      updatePinButtonState(button, nextPinned);
                      if (card) {
                        card.dataset.pinned = nextPinned ? 'true' : 'false';
                      }
                      if (update) {
                        update.isPinned = nextPinned;
                      }
                      adjustPersonaPinnedCounts(context.personas, nextPinned ? 1 : -1);
                      syncPersonaPinnedBadges(update.updateId || update.id, nextPinned);
                      if (snapshot.workspace && Array.isArray(snapshot.workspace.pinnedItems)) {
                        const compare = item => (item.update_url || item.url) === update.url;
                        if (nextPinned) {
                          if (!snapshot.workspace.pinnedItems.some(compare)) {
                            snapshot.workspace.pinnedItems.push({ update_url: update.url });
                          }
                        } else {
                          snapshot.workspace.pinnedItems = snapshot.workspace.pinnedItems.filter(item => !compare(item));
                        }
                      }
                      updateWorkspaceMetric('pinned', nextPinned ? 1 : -1);
                      refreshAfterPinToggle();
                    })
                    .catch(() => {
                      showToast('Unable to update pin status', 'error');
                    })
                    .finally(() => {
                      button.disabled = false;
                    });
                  break;
                case 'annotate':
                  if (update && window.RegCanaryIntelligence && typeof window.RegCanaryIntelligence.createAnnotation === 'function') {
                    window.RegCanaryIntelligence.createAnnotation(update);
                  } else {
                    window.open('/annotations', '_blank');
                  }
                  break;
                case 'share':
                  navigator.clipboard.writeText(update?.url || window.location.href)
                    .then(() => showToast('Link copied to clipboard', 'success'))
                    .catch(() => showToast('Unable to copy link', 'error'));
                  break;
              }
            });
          });
        }

        function findUpdateById(id, streams) {
          if (!streams) return null;
          const { high = [], medium = [], low = [] } = streams;
          return [...high, ...medium, ...low].find(update => update.updateId === id) || null;
        }

        function showToast(message, type) {
          const el = document.createElement('div');
          el.className = 'intelligence-toast intelligence-toast-' + (type || 'info');
          el.textContent = message;
          document.body.appendChild(el);
          setTimeout(() => el.classList.add('visible'), 10);
          setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 200);
          }, 3200);
        }

        window.RegCanaryIntelligence = {
          regenerateSummary() {
            showToast('Regeneration is coming soon – using latest summary for now.', 'info');
          },
          exportOnePager() {
            window.open('/ai-intelligence/export/one-pager.pdf', '_blank', 'noopener');
          },
          showRiskExplain() {
            const components = Array.isArray(snapshot?.riskPulse?.components)
              ? snapshot.riskPulse.components
              : [];
            if (!components.length) {
              showToast('Risk score breakdown is not available right now.', 'info');
              return;
            }
            const lines = components
              .map(component => component.label + ': ' + Number(component.score || 0).toFixed(1) + ' (' + Math.round((component.weight || 0) * 100) + '%)')
              .join('\n');
            alert('Signal score components:\n' + lines);
          },
          createAnnotation(update) {
            if (!update) return;
            fetch('/api/annotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                update_id: update.updateId || update.id,
                author: 'intelligence-center',
                visibility: 'team',
                status: 'triage',
                content: '',
                origin_page: 'intelligence_center',
                persona: update.personas ? update.personas[0] : null,
                context: {
                  url: update.url,
                  authority: update.authority,
                  headline: update.headline,
                  summary: update.summary,
                  published: update.publishedAt
                }
              })
            })
              .then(res => {
                if (!res.ok) throw new Error('Failed to create annotation');
                return res.json();
              })
              .then(() => showToast('Annotation created', 'success'))
              .catch(() => showToast('Unable to create annotation', 'error'));
          }
        };

        document.addEventListener('DOMContentLoaded', () => {
          initialisePersonaTabs(state.activePersona);
          initialisePinnedStates();
          attachCardActions();
        });
      })();
    </script>
  `
}

module.exports = { getAiIntelligenceScripts }
