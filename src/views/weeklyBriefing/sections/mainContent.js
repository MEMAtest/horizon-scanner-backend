function renderOnePagerSection(contentHtml) {
  return `
    <div class="tab-pane active" id="summary-tab" data-tab="summary">
      <section class="report-section executive-summary" id="onePagerCard">
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
        <svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="tab-label">Executive Summary</span>
      </button>
      <button class="tab" data-tab="narrative" role="tab" aria-selected="false" aria-controls="narrative-tab">
        <svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="tab-label">Week's Narrative</span>
      </button>
      <button class="tab" data-tab="updates" role="tab" aria-selected="false" aria-controls="updates-tab">
        <svg class="tab-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
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
