const { escapeHtml } = require('./helpers')
const { getAiIntelligenceStyles } = require('./styles')
const { getAiIntelligenceScripts } = require('./scripts')
const { getProfileOnboardingScripts } = require('./onboarding')
const { formatDateDisplay } = require('../../utils/dateHelpers')

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '0'
  return Number(value).toLocaleString('en-GB')
}

function renderRiskPulse(snapshot = {}) {
  const { score = 0, label = 'Stable', delta = 0, components = [] } = snapshot.riskPulse || {}
  const deltaLabel = delta === 0 ? 'No change' : delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
  const trendClass = delta > 0 ? 'pulse-up' : delta < 0 ? 'pulse-down' : 'pulse-flat'
  const componentList = Array.isArray(components) && components.length
    ? `<div class="pulse-breakdown">
        <span class="pulse-breakdown-title">Why ${score.toFixed(1)}?</span>
        ${components
            .map(component => `
              <span class="pulse-breakdown-item">
                <strong>${escapeHtml(component.label)}</strong>
                <span>${Number(component.score || 0).toFixed(1)} • weight ${(component.weight * 100).toFixed(0)}%</span>
              </span>
            `)
            .join('')}
      </div>`
    : ''

  return `
    <section class="risk-pulse">
      <div class="pulse-gauge" role="img" aria-label="Risk pulse score ${score}">
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle class="pulse-track" cx="60" cy="60" r="50" />
          <circle class="pulse-meter" cx="60" cy="60" r="50" stroke-dasharray="${Math.min(
            314,
            (score / 10) * 314
          )} 314" />
          <text x="60" y="68" class="pulse-score">${score.toFixed(1)}</text>
        </svg>
      </div>
      <div class="pulse-details">
        <span class="pulse-label">${escapeHtml(label)}</span>
        <span class="pulse-delta ${trendClass}">
          <span class="pulse-delta-icon"></span>
          ${escapeHtml(deltaLabel)}
        </span>
        <p class="pulse-focus">${escapeHtml(snapshot.focusHeadline || snapshot.heroInsight?.summary || 'Monitoring in progress.')}</p>
        ${componentList}
      </div>
    </section>
  `
}

function renderQuickStats(stats = {}) {
  const entries = [
    { label: 'Total updates', value: formatNumber(stats.totalUpdates || 0) },
    { label: 'High impact', value: formatNumber(stats.highImpact || 0) },
    { label: 'Active authorities', value: formatNumber(stats.activeAuthorities || 0) },
    { label: 'Imminent deadlines', value: formatNumber(stats.deadlinesSoon || 0) },
    { label: 'Urgent updates', value: formatNumber(stats.urgentUpdates || 0) }
  ]

  return `
    <section class="quick-stats" aria-label="Daily intelligence statistics">
      ${entries
        .map(
          entry => `
            <div class="quick-stat-card">
              <span class="quick-stat-value">${entry.value}</span>
              <span class="quick-stat-label">${escapeHtml(entry.label)}</span>
            </div>
          `
        )
        .join('')}
    </section>
  `
}

function renderExecutiveSummary(summaryText) {
  if (!summaryText) return ''
  return `
    <section class="executive-summary">
      <header>
        <h2>Executive Summary</h2>
        <button type="button" class="summary-refresh" onclick="window.RegCanaryIntelligence?.regenerateSummary()">
          Regenerate
        </button>
      </header>
      <p>${escapeHtml(summaryText)}</p>
    </section>
  `
}

function formatProfileType(value) {
  if (!value) return 'General financial services'
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function renderProfileBanner(profile) {
  if (!profile) {
    return `
      <section class="profile-banner profile-banner--empty">
        <div class="profile-banner__copy">
          <h2>Personalise your intelligence feed</h2>
          <p>Choose your regulatory focus so the feed highlights what matters most to your organisation.</p>
        </div>
        <div class="profile-banner__actions">
          <button type="button" class="profile-banner-btn" data-action="open-profile">Start setup</button>
        </div>
      </section>
    `
  }

  const personas = Array.isArray(profile.personas) && profile.personas.length
    ? profile.personas.map(value => value.charAt(0).toUpperCase() + value.slice(1)).join(', ')
    : 'No personas selected yet'
  const regions = Array.isArray(profile.regions) && profile.regions.length
    ? profile.regions.join(', ')
    : 'All regions'
  const needsAttention = !profile.personas || profile.personas.length === 0 || profile.source === 'generated-default'
  const bannerClass = needsAttention ? ' profile-banner--needs-action' : ''
  const attentionCopy = needsAttention
    ? '<span class="profile-banner__status">Complete your profile to unlock better recommendations.</span>'
    : ''

  return `
    <section class="profile-banner${bannerClass}">
      <div class="profile-banner__copy">
        <h2>${escapeHtml(formatProfileType(profile.serviceType || 'general_financial_services'))}</h2>
        <p>
          <strong>Personas:</strong> ${escapeHtml(personas)} ·
          <strong>Regions:</strong> ${escapeHtml(regions)}
        </p>
        ${attentionCopy}
      </div>
      <div class="profile-banner__actions">
        <button type="button" class="profile-banner-btn" data-action="open-profile">
          ${needsAttention ? 'Complete profile' : 'Adjust profile'}
        </button>
      </div>
    </section>
  `
}

function renderProfileOnboarding(profile) {
  const encodedProfile = escapeHtml(JSON.stringify(profile || {}))
  return `
    <div class="profile-onboarding" data-onboarding-root data-default-profile="${encodedProfile}">
      <div class="profile-onboarding__overlay" data-onboarding-close></div>
      <div class="profile-onboarding__panel">
        <header class="profile-onboarding__header">
          <div>
            <h2>Tailor your intelligence</h2>
            <p>Select what matters to your organisation so we surface the right regulators, themes, and workflows.</p>
          </div>
          <button type="button" class="profile-onboarding__close" data-onboarding-close>&times;</button>
        </header>
        <div class="profile-onboarding__steps">
          <div class="onboarding-step" data-step-index="0">
            <h3>What best describes your organisation?</h3>
            <div class="onboarding-option-grid" data-option-group="serviceType">
              <button type="button" class="onboarding-option" data-option-value="payments">Payments</button>
              <button type="button" class="onboarding-option" data-option-value="retail_banking">Retail Banking</button>
              <button type="button" class="onboarding-option" data-option-value="wealth_management">Wealth Management</button>
              <button type="button" class="onboarding-option" data-option-value="insurance">Insurance</button>
              <button type="button" class="onboarding-option" data-option-value="fintech">Fintech</button>
              <button type="button" class="onboarding-option" data-option-value="other">Other / Multi-vertical</button>
            </div>
          </div>
          <div class="onboarding-step" data-step-index="1">
            <h3>Tell us about your footprint</h3>
            <div class="onboarding-subsection">
              <span class="onboarding-subsection__label">Company size</span>
              <div class="onboarding-option-grid" data-option-group="companySize">
                <button type="button" class="onboarding-option" data-option-value="micro">0–50 employees</button>
                <button type="button" class="onboarding-option" data-option-value="mid">51–500 employees</button>
                <button type="button" class="onboarding-option" data-option-value="enterprise">500+ employees</button>
              </div>
            </div>
            <div class="onboarding-subsection">
              <span class="onboarding-subsection__label">Regions you monitor</span>
              <div class="onboarding-option-grid onboarding-option-grid--wrap" data-option-group="regions" data-option-mode="toggle">
                <button type="button" class="onboarding-option" data-option-value="UK">UK</button>
                <button type="button" class="onboarding-option" data-option-value="EU">EU</button>
                <button type="button" class="onboarding-option" data-option-value="US">US</button>
                <button type="button" class="onboarding-option" data-option-value="APAC">APAC</button>
                <button type="button" class="onboarding-option" data-option-value="Global">Global</button>
              </div>
            </div>
          </div>
          <div class="onboarding-step" data-step-index="2">
            <h3>Who needs to act on these insights?</h3>
            <div class="onboarding-subsection">
              <span class="onboarding-subsection__label">Personas</span>
              <div class="onboarding-option-grid onboarding-option-grid--wrap" data-option-group="personas" data-option-mode="toggle">
                <button type="button" class="onboarding-option" data-option-value="executive">Executive</button>
                <button type="button" class="onboarding-option" data-option-value="analyst">Analyst</button>
                <button type="button" class="onboarding-option" data-option-value="operations">Operations</button>
                <button type="button" class="onboarding-option" data-option-value="product">Product</button>
                <button type="button" class="onboarding-option" data-option-value="legal">Legal</button>
              </div>
            </div>
            <div class="onboarding-subsection">
              <span class="onboarding-subsection__label">Priority goals</span>
              <div class="onboarding-option-grid onboarding-option-grid--wrap" data-option-group="goals" data-option-mode="toggle">
                <button type="button" class="onboarding-option" data-option-value="stay_ahead_of_mandates">Stay ahead of mandates</button>
                <button type="button" class="onboarding-option" data-option-value="monitor_enforcement">Monitor enforcement</button>
                <button type="button" class="onboarding-option" data-option-value="prepare_workflows">Prepare playbooks</button>
                <button type="button" class="onboarding-option" data-option-value="brief_executives">Brief executives</button>
                <button type="button" class="onboarding-option" data-option-value="track_deadlines">Track deadlines</button>
              </div>
            </div>
          </div>
        </div>
        <div class="profile-onboarding__summary" data-onboarding-summary>
          <strong>Summary:</strong> Configure your profile to see tailored insights.
        </div>
        <div class="profile-onboarding__error" data-onboarding-error></div>
        <footer class="profile-onboarding__footer">
          <button type="button" class="profile-onboarding__nav-btn" data-onboarding-prev>Back</button>
          <button type="button" class="profile-onboarding__nav-btn profile-onboarding__nav-btn--primary" data-onboarding-next>Next</button>
          <button type="button" class="profile-onboarding__nav-btn profile-onboarding__nav-btn--primary" data-onboarding-complete>Save profile</button>
        </footer>
      </div>
    </div>
  `
}

function renderHeroInsight(hero = {}, riskPulse = {}) {
  if (!hero) return ''

  const related = Array.isArray(hero.relatedSignals) && hero.relatedSignals.length
    ? `<ul class="hero-related">${hero.relatedSignals.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : ''

  const components = Array.isArray(riskPulse.components) ? riskPulse.components : []
  const confidence = components.find(component => component.label.toLowerCase().includes('impact'))
  const confidenceLabel = confidence ? `${confidence.score.toFixed(1)}/10` : 'N/A'

  return `
    <section class="hero-insight">
      <div class="hero-copy">
        <h1>${escapeHtml(hero.headline || 'Hero insight unavailable')}</h1>
        <p class="hero-summary">${escapeHtml(hero.summary || 'No narrative available.')}</p>
        <div class="hero-recommendation">
          <strong>Recommended action:</strong>
          <span>${escapeHtml(hero.recommendation || 'Monitor developments and await further signals.')}</span>
        </div>
        ${related}
      </div>
      <div class="hero-meta">
        <div class="hero-score">
          <span class="hero-score-label">Signal score</span>
          <span class="hero-score-value">${escapeHtml((riskPulse.score || 0).toFixed ? riskPulse.score.toFixed(1) : String(riskPulse.score || 0))}</span>
          <span class="hero-score-confidence">Confidence ${escapeHtml(confidenceLabel)}</span>
        </div>
        <button type="button" class="hero-transparency" onclick="window.RegCanaryIntelligence?.showRiskExplain()">Why this score?</button>
      </div>
    </section>
  `
}

function renderStreamCard(update) {
  const personas = Array.isArray(update.personas) ? update.personas : []
  const personaChips = personas
    .map(persona => `<span class="persona-chip persona-${escapeHtml(persona)}">${escapeHtml(persona)}</span>`)
    .join('')

  const published = update.publishedAt ? formatDateDisplay(update.publishedAt) : 'Unknown'
  const isPinned = update.isPinned ? 'true' : 'false'
  const pinActiveClass = update.isPinned ? ' is-pinned' : ''
  const pinSymbol = update.isPinned ? '★' : '☆'
  const cardUrlAttr = update.url ? ` data-url="${escapeHtml(update.url)}"` : ''
  const profileRelevance = update.profileRelevance || 'general'
  const profileLabels = {
    core: 'Core profile focus',
    related: 'Related to profile',
    broader: 'Outside profile focus'
  }
  const profileBadge = profileRelevance !== 'general'
    ? `<span class="profile-tag profile-tag-${escapeHtml(profileRelevance)}">${escapeHtml(profileLabels[profileRelevance] || 'Profile context')}</span>`
    : ''
  const relevanceBadge = typeof update.relevanceScore === 'number'
    ? `<span class="profile-tag profile-tag-score">${escapeHtml(String(Math.round(update.relevanceScore)))} pts</span>`
    : ''

  return `
    <article class="stream-card" data-update-id="${escapeHtml(update.updateId || '')}"${cardUrlAttr} data-pinned="${isPinned}">
      <header>
        <span class="card-authority">${escapeHtml(update.authority || 'Unknown')}</span>
        <span class="card-urgency urgency-${escapeHtml((update.urgency || 'Low').toLowerCase())}">
          ${escapeHtml(update.urgency || 'Low')}
        </span>
        <span class="card-meta-tags">
          ${profileBadge}
          ${relevanceBadge}
        </span>
      </header>
      <h3>
        <a href="${escapeHtml(update.url || '#')}" target="_blank" rel="noopener">
          ${escapeHtml(update.headline || 'Untitled update')}
        </a>
      </h3>
      <p class="card-summary">${escapeHtml(update.summary || 'Summary not available.')}</p>
      <footer>
        <div class="card-metadata">
          <span class="card-published">Published ${escapeHtml(published)}</span>
          ${personaChips}
          ${update.primarySector ? `<span class="sector-tag">${escapeHtml(update.primarySector)}</span>` : ''}
        </div>
        <div class="card-actions">
          <span class="card-next-step">${escapeHtml(update.nextStep || 'Monitor developments')}</span>
          <div class="card-buttons">
            <button type="button" class="icon-btn pin-toggle${pinActiveClass}" data-action="pin" data-update-id="${escapeHtml(
              update.updateId || ''
            )}" data-pinned="${isPinned}" aria-pressed="${isPinned}" title="${
              update.isPinned ? 'Unpin update' : 'Pin update'
            }">${pinSymbol}</button>
            <button type="button" class="icon-btn" data-action="annotate" data-update-id="${escapeHtml(
              update.updateId || ''
            )}">✎</button>
            <button type="button" class="icon-btn" data-action="share" data-update-id="${escapeHtml(
              update.updateId || ''
            )}">⇪</button>
          </div>
        </div>
      </footer>
    </article>
  `
}

function renderStreamColumn(title, stream = [], key = '') {
  if (!stream.length) return ''
  const classes = ['stream-column']
  if (key === 'medium') {
    classes.push('medium-relevance')
  } else if (key === 'low') {
    classes.push('background-relevance')
  }
  return `
    <section class="${classes.join(' ')}" data-stream-key="${escapeHtml(key)}">
      <header class="stream-header">
        <h3>${escapeHtml(title)}</h3>
        <span class="stream-count">${stream.length} updates</span>
      </header>
      <div class="stream-list">
        ${stream.map(renderStreamCard).join('')}
      </div>
    </section>
  `
}

function renderStreams(streams = {}, workspace = {}, timeline = [], themes = [], workflows = []) {
  const priorityFeed = [...(streams.high || [])]
    .concat((streams.medium || []).map(update => ({ ...update, bucketOverride: 'medium' })))
    .concat((streams.low || []).map(update => ({ ...update, bucketOverride: 'low' })))
    .sort((a, b) => {
      const rank = value => (value.bucketOverride === 'medium' ? 1 : value.bucketOverride === 'low' ? 2 : 0)
      const bucketDiff = rank(a) - rank(b)
      if (bucketDiff !== 0) return bucketDiff
      return streamTimestamp(b.publishedAt) - streamTimestamp(a.publishedAt)
    })

  const sidebar = []
  if (Array.isArray(workflows) && workflows.length) {
    sidebar.push(renderWorkflowSpotlight(workflows))
  }
  sidebar.push(renderStreamColumn('Medium relevance', streams.medium, 'medium'))
  sidebar.push(renderStreamColumn('Background intelligence', streams.low, 'low'))
  sidebar.push(renderWorkspacePulse(workspace))
  sidebar.push(renderTimeline(timeline))
  if (themes && themes.length) {
    sidebar.push(renderThemes(themes))
  }

  return `
    <section class="streams-split" aria-label="Daily intelligence">
      <div class="priority-feed">
        <header class="section-header"><h2>Priority feed</h2></header>
        <div class="priority-list">
          ${priorityFeed.map(renderStreamCard).join('') || '<p class="empty">No priority updates available.</p>'}
        </div>
      </div>
      <aside class="action-sidebar">
        ${sidebar.join('')}
      </aside>
    </section>
  `
}

function streamTimestamp(value) {
  if (!value) return 0
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function renderPersonaTabs(personas = {}) {
  const personaOrder = ['executive', 'analyst', 'operations']
  const tabs = personaOrder
    .filter(persona => personas[persona])
    .map(
      persona => `
        <button type="button" class="persona-tab" data-persona="${persona}">
          <span class="persona-tab-label">${persona.charAt(0).toUpperCase() + persona.slice(1)}</span>
          <span class="persona-tab-count">${formatNumber(personas[persona].count)}</span>
        </button>
      `
    )
    .join('')

  const panels = personaOrder
    .filter(persona => personas[persona])
    .map(persona => {
      const data = personas[persona]
      const briefing = data.briefing || {}
      const actions = Array.isArray(briefing.nextSteps) && briefing.nextSteps.length
        ? `<ol class="persona-brief-list">${briefing.nextSteps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`
        : '<div class="persona-empty">No spotlight updates for this persona right now. Pin or annotate items to surface them here.</div>'
      return `
        <div class="persona-panel" data-persona-panel="${persona}">
          <div class="persona-metrics">
            <div><span class="metric-label">Updates</span><span class="metric-value">${formatNumber(
              data.count
            )}</span></div>
            <div><span class="metric-label">Pinned</span><span class="metric-value">${formatNumber(
              data.pins || 0
            )}</span></div>
            <div><span class="metric-label">Open tasks</span><span class="metric-value">${formatNumber(
              data.openTasks || 0
            )}</span></div>
          </div>
          <div class="persona-briefing">
            <p>${escapeHtml(briefing.summary || 'No priority actions detected.')}</p>
            ${actions}
          </div>
        </div>
      `
    })
    .join('')

  return `
    <section class="persona-intelligence">
      <header>
        <h2>Persona Intelligence</h2>
        <div class="persona-tabs">${tabs}</div>
      </header>
      <div class="persona-panels">
        ${panels}
      </div>
    </section>
  `
}

function renderWorkflowShelf(workflows = []) {
  if (!Array.isArray(workflows) || !workflows.length) return ''
  return `
    <section class="workflow-shelf">
      <header class="workflow-shelf__header">
        <div>
          <h2>Active workflows</h2>
          <p>Track how regulatory signals convert into actions.</p>
        </div>
        <button type="button" class="workflow-btn workflow-btn-primary" data-action="open-workflow-builder">New workflow</button>
      </header>
      <div class="workflow-shelf__grid">
        ${workflows.map(workflow => `
          <article class="saved-workflow-card" data-saved-workflow-id="${escapeHtml(String(workflow.id))}">
            <header>
              <div>
                <h3>${escapeHtml(workflow.title)}</h3>
                <span class="workflow-status workflow-status-${escapeHtml(workflow.status || 'open')}">${escapeHtml((workflow.status || 'open').toUpperCase())}</span>
              </div>
              <div class="saved-workflow-rating" aria-label="${escapeHtml(String(workflow.rating || 0))} star rating">
                ${renderStarRating(workflow.rating)}
              </div>
            </header>
            <p>${escapeHtml(workflow.summary || 'No summary provided.')}</p>
            ${renderWorkflowMeta(workflow)}
            <footer>
              <button type="button" class="workflow-btn" data-action="complete-saved-workflow" data-workflow-id="${escapeHtml(String(workflow.id))}" ${workflow.status === 'closed' ? 'disabled' : ''}>Mark complete</button>
            </footer>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

function renderStarRating(value) {
  const rating = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0
  let stars = ''
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star ${i <= rating ? 'is-active' : ''}">★</span>`
  }
  return stars
}

function renderWorkflowMeta(workflow) {
  const personas = Array.isArray(workflow.personas) && workflow.personas.length
    ? `<div class="workflow-meta-line"><strong>Personas:</strong> ${workflow.personas.map(formatProfileType).join(', ')}</div>`
    : ''
  const sources = Array.isArray(workflow.sources) && workflow.sources.length
    ? `<ul class="workflow-source-list">${workflow.sources.map(source => `<li>${source.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a>` : escapeHtml(source.label)}</li>`).join('')}</ul>`
    : ''
  const policy = workflow.alignsPolicy
    ? `<div class="workflow-meta-line"><strong>Policy alignment:</strong> Linked${workflow.policyReference ? ` • <a href="${escapeHtml(workflow.policyReference)}" target="_blank" rel="noopener">Reference</a>` : ''}</div>`
    : ''

  return `
    <div class="workflow-meta">
      ${personas}
      ${workflow.needsReview ? '<div class="workflow-meta-line workflow-flag">Needs review</div>' : ''}
      ${policy}
      ${sources}
    </div>
  `
}

function renderWorkflowSpotlight(workflows = []) {
  if (!Array.isArray(workflows) || !workflows.length) return ''
  return `
    <section class="workflow-spotlight">
      <header class="stream-header">
        <h3>Suggested workflows</h3>
        <span class="stream-count">${workflows.length}</span>
      </header>
      <div class="workflow-list">
        ${workflows
          .map(workflow => {
            const reasons = Array.isArray(workflow.reasons) && workflow.reasons.length
              ? `<ul class="workflow-reasons">${workflow.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>`
              : ''
            const actions = Array.isArray(workflow.actions) && workflow.actions.length
              ? `<ol class="workflow-actions">${workflow.actions.map(action => `<li>${escapeHtml(action)}</li>`).join('')}</ol>`
              : ''
            return `
                <article class="workflow-card" data-workflow-id="${escapeHtml(workflow.id || '')}">
                  <h4>${escapeHtml(workflow.title || 'Recommended workflow')}</h4>
                  <p class="workflow-summary">${escapeHtml(workflow.description || '')}</p>
                  ${reasons}
                  ${actions}
                  <footer class="workflow-footer">
                  <button type="button" class="workflow-btn workflow-btn-start" data-action="open-workflow-builder" data-workflow-prefill='${escapeHtml(JSON.stringify(workflow))}'>Build workflow</button>
                    <button type="button" class="workflow-btn" data-action="complete-workflow" data-workflow-id="${escapeHtml(workflow.id || '')}">Mark complete</button>
                  </footer>
                </article>
            `
          })
          .join('')}
      </div>
    </section>
  `
}

function renderWorkflowBuilder(profile, snapshotStreams) {
  const encodedProfile = escapeHtml(JSON.stringify(profile || {}))
  const encodedStreams = escapeHtml(JSON.stringify(snapshotStreams || {}))
  return `
    <div class="workflow-builder" data-workflow-builder data-profile="${encodedProfile}" data-streams="${encodedStreams}">
      <div class="workflow-builder__overlay" data-workflow-builder-close></div>
      <div class="workflow-builder__panel">
        <header class="workflow-builder__header">
          <div>
            <h2>Create workflow</h2>
            <p>Capture source, rating, personas, and policy alignment.</p>
          </div>
          <button type="button" class="workflow-builder__close" data-workflow-builder-close>&times;</button>
        </header>
        <form class="workflow-builder__form" data-workflow-form>
          <label>
            <span>Title</span>
            <input type="text" name="title" required placeholder="Name this workflow" />
          </label>
          <label>
            <span>Summary</span>
            <textarea name="summary" rows="3" placeholder="Brief description"></textarea>
          </label>
          <section>
            <header>
              <span>Sources</span>
              <small>Select key updates or add custom references.</small>
            </header>
            <div class="workflow-source-options" data-workflow-source-list></div>
            <textarea name="extraSources" rows="2" placeholder="Additional sources (one per line)"></textarea>
          </section>
          <label>
            <span>Rating: <strong data-workflow-rating-value>3</strong> / 5</span>
            <input type="range" name="rating" min="1" max="5" step="1" value="3" />
          </label>
          <section>
            <span>Personas</span>
            <div class="workflow-persona-options" data-workflow-personas>
              ${['executive', 'analyst', 'operations', 'product', 'legal'].map(persona => `
                <label>
                  <input type="checkbox" value="${persona}" />
                  <span>${persona.charAt(0).toUpperCase() + persona.slice(1)}</span>
                </label>
              `).join('')}
            </div>
          </section>
          <label class="workflow-toggle">
            <input type="checkbox" name="needsReview" />
            <span>Requires follow-up review</span>
          </label>
          <label class="workflow-toggle">
            <input type="checkbox" name="alignsPolicy" data-policy-toggle />
            <span>Aligns to policy roadmap</span>
          </label>
          <label data-policy-reference-field>
            <span>Policy reference (URL)</span>
            <input type="url" name="policyReference" placeholder="https://example.com/policy" />
          </label>
          <footer class="workflow-builder__footer">
            <button type="button" class="workflow-btn" data-workflow-builder-close>Cancel</button>
            <button type="submit" class="workflow-btn workflow-btn-primary">Save workflow</button>
          </footer>
        </form>
      </div>
    </div>
  `
}

function renderWorkspacePulse(workspace = {}) {
  const cards = [
    {
      key: 'pinned',
      label: 'Pinned updates',
      value: formatNumber((workspace.pinnedItems || []).length),
      meta: 'Saved for follow-up',
      action: "WorkspaceModule && WorkspaceModule.showPinnedItems && WorkspaceModule.showPinnedItems()"
    },
    {
      key: 'searches',
      label: 'Saved searches',
      value: formatNumber((workspace.savedSearches || []).length),
      meta: 'Reusable filters',
      action: "WorkspaceModule && WorkspaceModule.showSavedSearches && WorkspaceModule.showSavedSearches()"
    },
    {
      key: 'alerts',
      label: 'Active alerts',
      value: formatNumber((workspace.customAlerts || []).filter(alert => alert.isActive).length),
      meta: 'Monitoring thresholds',
      action: "WorkspaceModule && WorkspaceModule.showCustomAlerts && WorkspaceModule.showCustomAlerts()"
    },
    {
      key: 'tasks',
      label: 'Open actions',
      value: formatNumber(workspace.tasks || 0),
      meta: 'Annotations requiring action',
      action: "WorkspaceModule && WorkspaceModule.showAnnotations && WorkspaceModule.showAnnotations()"
    }
  ]

  return `
    <section class="workspace-pulse">
      <header>
        <h2>Workspace Pulse</h2>
        <p>Snapshot of team activity and outstanding actions</p>
      </header>
      <div class="workspace-grid">
        ${cards
          .map(
            card => `
          <button type="button" class="workspace-card" data-workspace-card="${escapeHtml(card.key)}" onclick="${card.action}">
            <span class="workspace-value">${card.value}</span>
            <span class="workspace-label">${escapeHtml(card.label)}</span>
            <span class="workspace-meta">${escapeHtml(card.meta)}</span>
          </button>
        `
          )
          .join('')}
      </div>
    </section>
  `
}

function renderTimeline(timeline = []) {
  if (!timeline.length) {
    return `
      <section class="intelligence-timeline">
        <header><h2>Compliance Timeline</h2></header>
        <p class="timeline-empty">No upcoming deadlines detected within the next 30 days.</p>
      </section>
    `
  }

  const items = timeline
    .map(event => {
      const dateLabel = formatDateDisplay(event.date)
      return `
        <li class="timeline-item timeline-${escapeHtml((event.urgency || 'low').toLowerCase())}">
          <span class="timeline-date">${escapeHtml(dateLabel)}</span>
          <div>
            <strong>${escapeHtml(event.title || 'Compliance deadline')}</strong>
            <span>${escapeHtml(event.authority || 'Regulator')}</span>
          </div>
        </li>
      `
    })
    .join('')

  return `
    <section class="intelligence-timeline">
      <header><h2>Compliance Timeline</h2></header>
      <ul class="timeline-list">
        ${items}
      </ul>
    </section>
  `
}

function renderThemes(themes = []) {
  if (!themes.length) return ''
  return `
    <section class="emerging-themes">
      <header><h2>Emerging Themes</h2></header>
      <div class="theme-cloud">
        ${themes
          .map(
            theme => `
              <span class="theme-chip">
                ${escapeHtml(theme.label)}
                <span class="theme-support">${formatNumber(theme.support)}</span>
              </span>
            `
          )
          .join('')}
      </div>
    </section>
  `
}

function buildAiIntelligencePage({
  sidebar,
  snapshot,
  workspaceBootstrapScripts,
  clientScripts,
  commonStyles
}) {
  const data = snapshot || {}
  const themes = data.layoutConfig?.showThemes === false ? [] : (data.themes || [])
  const styles = getAiIntelligenceStyles()
  const scripts = getAiIntelligenceScripts(data)
  const onboardingScripts = getProfileOnboardingScripts({
    profile: data.profile,
    behaviour: data.profileBehaviour
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Intelligence - Regulatory Intelligence Platform</title>
      ${commonStyles}
      ${workspaceBootstrapScripts}
      ${styles}
    </head>
    <body>
      <div class="app-container">
        ${sidebar}

        <main class="main-content">
          <header class="hero-panel">
            <div class="hero-headline">
              <span class="hero-title">AI Intelligence Brief</span>
          <span class="hero-date">${formatDateDisplay(data.snapshotDate || new Date())}</span>
            </div>
            <div class="hero-actions">
              <button type="button" class="export-btn" onclick="window.RegCanaryIntelligence?.exportOnePager()">Export one-pager</button>
            </div>
          </header>

          ${renderProfileBanner(data.profile || null)}
          ${renderHeroInsight(data.heroInsight || {}, data.riskPulse || {})}
          ${renderRiskPulse(data)}
          ${renderQuickStats(data.quickStats)}
          ${renderStreams(
            data.streams || {},
            data.workspace || {},
            data.timeline || [],
            themes,
            data.recommendedWorkflows || []
          )}
          ${renderPersonaTabs(data.personas || {})}
          ${renderWorkflowShelf(data.savedWorkflows || [])}
        </main>
        ${renderProfileOnboarding(data.profile || null)}
        ${renderWorkflowBuilder(data.profile || null, data.streams || {})}
      </div>
      <script>
        window.intelligenceSnapshot = ${JSON.stringify(data).replace(/</g, '\\u003c')};
        window.intelligenceProfile = ${JSON.stringify({
          profile: data.profile || null,
          behaviour: data.profileBehaviour || []
        }).replace(/</g, '\\u003c')};
      </script>
      ${clientScripts}
      ${scripts}
      ${onboardingScripts}
    </body>
    </html>
  `
}

module.exports = { buildAiIntelligencePage }
