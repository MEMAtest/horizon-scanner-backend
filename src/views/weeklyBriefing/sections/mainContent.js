const { fileTextIcon, bookmarkIcon, layersIcon } = require('../icons')

function renderOnePagerSection(contentHtml) {
  return `
    <div class="tab-pane active" id="summary-tab" data-tab="summary">
      <section class="report-section executive-summary" id="onePagerCard">
        <div class="section-header">
          <h2 class="section-title">Executive Summary</h2>
          <p class="section-subtitle">Key insights and highlights from this week's regulatory landscape</p>
        </div>
        <div class="executive-content" id="onePagerContent">
          ${contentHtml}
        </div>
      </section>
    </div>
  `
}

function renderNarrativeSection(narrativeHtml) {
  return `
    <div class="tab-pane" id="narrative-tab" data-tab="narrative">
      <section class="report-section narrative-section" id="narrativeCard">
        <div class="section-header">
          <h2 class="section-title">Week's Narrative</h2>
          <p class="section-subtitle">In-depth analysis of regulatory developments and their implications</p>
        </div>
        <div class="narrative-content" id="narrativeContent">
          ${narrativeHtml}
        </div>
      </section>
    </div>
  `
}

function renderUpdatesSection(updatesHtml) {
  return `
    <div class="tab-pane" id="updates-tab" data-tab="updates">
      <section class="report-section updates-section">
        <div class="section-header">
          <h2 class="section-title">Key Updates</h2>
          <p class="section-subtitle">Important regulatory announcements requiring attention</p>
        </div>
        <div class="updates-grid" id="updates-container">
          ${updatesHtml}
        </div>
      </section>
    </div>
  `
}

function renderTabNavigation() {
  return `
    <div class="tab-navigation" role="tablist">
      <button class="tab active" data-tab="summary" role="tab" aria-selected="true" aria-controls="summary-tab">
        <span class="tab-icon">${fileTextIcon({ size: 16, strokeWidth: 1.5 })}</span>
        <span class="tab-label">Executive Summary</span>
      </button>
      <button class="tab" data-tab="narrative" role="tab" aria-selected="false" aria-controls="narrative-tab">
        <span class="tab-icon">${bookmarkIcon({ size: 16, strokeWidth: 1.5 })}</span>
        <span class="tab-label">Week's Narrative</span>
      </button>
      <button class="tab" data-tab="updates" role="tab" aria-selected="false" aria-controls="updates-tab">
        <span class="tab-icon">${layersIcon({ size: 16, strokeWidth: 1.5 })}</span>
        <span class="tab-label">Key Updates</span>
      </button>
    </div>
  `
}

function renderMainContent({
  onePagerHtml,
  narrativeHtml,
  updatesHtml
}) {
  return `
    <div class="briefing-tabs-container">
      ${renderTabNavigation()}
      <div class="tab-content">
        ${renderOnePagerSection(onePagerHtml)}
        ${renderNarrativeSection(narrativeHtml)}
        ${renderUpdatesSection(updatesHtml)}
      </div>
    </div>
  `
}

module.exports = {
  renderMainContent
}
