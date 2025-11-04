const {
  DEFAULT_DAYS
} = require('./constants')

const {
  buildList,
  escapeHtml,
  truncateText
} = require('./helpers')

function applyFallbackMethods(ServiceClass) {
  ServiceClass.prototype.buildFallbackNarrative = function(dataset) {
    const highlights = Array.isArray(dataset.highlightUpdates) && dataset.highlightUpdates.length > 0
      ? dataset.highlightUpdates
      : dataset.currentUpdates

    const storyItems = highlights.slice(0, 3).map(item => {
      const summary = truncateText(item.summary || item.title || '', 180)
      return `<li><strong>${escapeHtml(item.authority || 'Unknown')}</strong> — ${escapeHtml(summary)}</li>`
    })

    const coverage = `We monitored ${dataset.stats.totalUpdates} updates across ${dataset.stats.byAuthority.length} authorities in the last ${dataset.samplingWindowDays || DEFAULT_DAYS} days.`
    const headline = dataset.stats.byImpact.Significant || 0
    const authorityLeaders = dataset.stats.byAuthority
      .slice(0, 3)
      .map(entry => `<span class="metric-chip">${escapeHtml(entry.authority)}: ${entry.count}</span>`)
      .join(' ')

    return [
      '<section class="briefing-section">',
      '<h4>Week&rsquo;s Story</h4>',
      buildList(storyItems),
      '</section>',
      '<section class="briefing-section">',
      '<h4>Regulatory Pulse</h4>',
      `<p>${escapeHtml(coverage)} There were <strong>${escapeHtml(String(headline))}</strong> high-impact notices requiring rapid triage.</p>`,
      authorityLeaders ? `<p class="chip-row">${authorityLeaders}</p>` : '',
      '</section>',
      '<section class="briefing-section">',
      '<h4>Outlook</h4>',
      '<p>Expect follow-up guidance on resilience, consumer outcomes, and enforcement transparency as authorities continue to coordinate cross-market actions.</p>',
      '</section>'
    ].join('')
  }

  ServiceClass.prototype.buildFallbackChangeDetection = function() {
    return {
      new_themes: [],
      accelerating: [],
      resolving: [],
      shifting_focus: [],
      correlations: []
    }
  }

  ServiceClass.prototype.buildFallbackOnePager = function(dataset) {
    const total = dataset.stats.totalUpdates
    const significant = dataset.stats.byImpact.Significant || 0
    const highlights = Array.isArray(dataset.highlightUpdates) ? dataset.highlightUpdates.slice(0, 3) : []

    const developmentItems = highlights.map(item => `<li><strong>${escapeHtml(item.authority || 'Unknown')}</strong>: ${escapeHtml(truncateText(item.summary || item.title || '', 160))}</li>`)

    return [
      '<section class="one-pager">',
      '<h4>Executive Summary</h4>',
      `<p>Monitored ${escapeHtml(String(total))} updates this cycle, including <strong>${escapeHtml(String(significant))}</strong> high-impact notices requiring immediate review.</p>`,
      '<h4>Critical Actions</h4>',
      '<ul>',
      '<li>Validate readiness against the latest resilience and operational risk expectations.</li>',
      '<li>Brief senior stakeholders on emerging enforcement patterns in capital markets and payments.</li>',
      '<li>Confirm ownership for open consultations and upcoming submission deadlines.</li>',
      '</ul>',
      '<h4>Key Regulatory Developments</h4>',
      buildList(developmentItems.length ? developmentItems : ['<li>Authorities maintained routine cadence with no single driver dominating the agenda.</li>']),
      '<h4>Business Implications</h4>',
      '<p>Stress-test incident response playbooks, review customer communications for clarity, and align programme funding with heightened supervisory expectations.</p>',
      '<h4>Recommended Next Steps</h4>',
      '<ul>',
      '<li>Prioritise executive briefings covering high-impact enforcement themes.</li>',
      '<li>Track outstanding consultations and allocate drafting support.</li>',
      '<li>Calibrate monitoring for additional sanctions and consumer protection triggers.</li>',
      '</ul>',
      '</section>'
    ].join('')
  }

  ServiceClass.prototype.buildFallbackTeamBriefing = function(dataset) {
    const flagged = dataset.annotationInsights?.totals?.flagged || 0
    const assignments = dataset.annotationInsights?.totals?.assignments || 0
    const tasks = dataset.annotationInsights?.totals?.tasks || 0

    return [
      '<section class="team-briefing">',
      '<h4>Discussion Points</h4>',
      '<ul>',
      `<li>Review the ${escapeHtml(String(dataset.stats.byImpact.Significant || 0))} significant updates and confirm owners.</li>`,
      `${flagged ? `<li>Prioritise the ${escapeHtml(String(flagged))} flagged items surfaced in the Intelligence Center.</li>` : '<li>Review flagged items surfaced in the Intelligence Center and confirm their positioning.</li>'}`,
      '<li>Assess overlap between enforcement activity and open consultations.</li>',
      '</ul>',
      '<h4>Questions to Investigate</h4>',
      '<ul>',
      '<li>Which controls address the resilience themes highlighted by supervisors?</li>',
      '<li>Do consumer protection updates require near-term policy adjustments?</li>',
      '</ul>',
      '<h4>Resource Requirements</h4>',
      '<ul>',
      `${assignments ? `<li>Confirm owners for ${escapeHtml(String(assignments))} newly assigned actions.</li>` : '<li>Confirm owners for any newly assigned actions.</li>'}`,
      `${tasks ? `<li>Validate due dates for ${escapeHtml(String(tasks))} open follow-up tasks.</li>` : '<li>Validate due dates for open follow-up tasks.</li>'}`,
      '<li>Coordinate between compliance monitoring, legal, and operational risk teams.</li>',
      '</ul>',
      '<h4>Response Timeline</h4>',
      '<ul>',
      '<li>Complete impact triage within two working days.</li>',
      '<li>Prepare leadership briefing materials ahead of the next governance forum.</li>',
      '</ul>',
      '</section>'
    ].join('')
  }

  ServiceClass.prototype.createFallbackArtifacts = function(dataset) {
    return {
      narrative: this.buildFallbackNarrative(dataset),
      changeDetection: this.buildFallbackChangeDetection(dataset),
      onePager: this.buildFallbackOnePager(dataset),
      teamBriefing: this.buildFallbackTeamBriefing(dataset)
    }
  }
}

module.exports = applyFallbackMethods
