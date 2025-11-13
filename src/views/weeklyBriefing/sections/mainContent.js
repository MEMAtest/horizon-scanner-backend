function renderOnePagerSection(contentHtml) {
  return `
    <section class="report-section executive-summary" id="onePagerCard">
      <div class="executive-content" id="onePagerContent">
        ${contentHtml}
      </div>
    </section>
  `
}

function renderNarrativeSection(narrativeHtml) {
  return `
    <section class="report-section narrative-section" id="narrativeCard">
      <div class="section-header">
        <h2 class="section-title">Week's Narrative</h2>
      </div>
      <div class="narrative-content" id="narrativeContent">
        ${narrativeHtml}
      </div>
    </section>
  `
}

function renderUpdatesSection(updatesHtml) {
  return `
    <section class="report-section updates-section">
      <div class="section-header">
        <h2 class="section-title">Key Updates</h2>
      </div>
      <div class="updates-grid" id="updates-container">
        ${updatesHtml}
      </div>
    </section>
  `
}

// Old sidebar sections removed - now handled by sidebar.js component

function renderMainContent({
  onePagerHtml,
  narrativeHtml,
  updatesHtml
}) {
  return `
    ${renderOnePagerSection(onePagerHtml)}
    ${renderNarrativeSection(narrativeHtml)}
    ${renderUpdatesSection(updatesHtml)}
  `
}

module.exports = {
  renderMainContent
}
