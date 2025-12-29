function getAiIntelligenceRenderersScript() {
  return `        function renderHeroHTML(hero, risk) {
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

        function safeParse(value) {
          if (!value) return null;
          try {
            return JSON.parse(value);
          } catch (error) {
            return null;
          }
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
          const profileRelevance = update.profileRelevance || 'general';
          const profileLabels = {
            core: 'Core profile focus',
            related: 'Related to profile',
            broader: 'Outside profile focus'
          };
          const profileBadge = profileRelevance !== 'general'
            ? '<span class="profile-tag profile-tag-' + escapeHtml(profileRelevance) + '">' + escapeHtml(profileLabels[profileRelevance] || 'Profile context') + '</span>'
            : '';
          const relevanceBadge = typeof update.relevanceScore === 'number'
            ? '<span class="profile-tag profile-tag-score">' + escapeHtml(String(Math.round(update.relevanceScore))) + ' pts</span>'
            : '';

          return [
            '<article class="stream-card" data-update-id="' + escapeHtml(update.updateId || '') + '" data-url="' + escapeHtml(update.url || '') + '" data-pinned="' + isPinned + '">',
            '  <header>',
            '    <span class="card-authority">' + escapeHtml(update.authority || 'Unknown') + '</span>',
            '    <span class="card-urgency urgency-' + urgency + '">' + escapeHtml(update.urgency || 'Low') + '</span>',
            '    <span class="card-meta-tags">' + profileBadge + relevanceBadge + '</span>',
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

        function renderStreamsHTML(streams, workspace, timeline, themes, workflows) {
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
          if (Array.isArray(workflows) && workflows.length) {
            sidebarBlocks.push(renderWorkflowSpotlightHTML(workflows));
          }
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

        function renderWorkflowSpotlightHTML(workflows) {
          if (!Array.isArray(workflows) || !workflows.length) return '';
          return [
            '<section class="workflow-spotlight">',
            '  <header class="stream-header">',
            '    <h3>Suggested workflows</h3>',
            '    <span class="stream-count">' + workflows.length + '</span>',
            '  </header>',
            '  <div class="workflow-list">',
            workflows.map(workflow => {
              const reasons = Array.isArray(workflow.reasons) && workflow.reasons.length
                ? '<ul class="workflow-reasons">' + workflow.reasons.map(reason => '<li>' + escapeHtml(reason) + '</li>').join('') + '</ul>'
                : '';
              const actions = Array.isArray(workflow.actions) && workflow.actions.length
                ? '<ol class="workflow-actions">' + workflow.actions.map(action => '<li>' + escapeHtml(action) + '</li>').join('') + '</ol>'
                : '';
              return [
                '<article class="workflow-card" data-workflow-id="' + escapeHtml(workflow.id || '') + '">',
                '  <h4>' + escapeHtml(workflow.title || 'Recommended workflow') + '</h4>',
                '  <p class="workflow-summary">' + escapeHtml(workflow.description || '') + '</p>',
                reasons,
                actions,
                '  <footer class="workflow-footer">',
                '    <button type="button" class="workflow-btn workflow-btn-start" data-action="start-workflow" data-workflow-id="' + escapeHtml(workflow.id || '') + '">Launch workflow</button>',
                '    <button type="button" class="workflow-btn" data-action="complete-workflow" data-workflow-id="' + escapeHtml(workflow.id || '') + '">Mark complete</button>',
                '  </footer>',
                '</article>'
              ].join('');
            }).join(''),
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

`
}

module.exports = { getAiIntelligenceRenderersScript }
