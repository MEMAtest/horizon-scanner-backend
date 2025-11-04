function renderControlPlaybookSection() {
  return `
    <div class="dashboard-section" id="control-playbook-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="section-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4 5 7v6c0 4.5 3.4 8.3 7 9 3.6-.7 7-4.5 7-9V7l-7-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>
              <path d="m9.5 12 1.8 1.8 3.2-3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          Control Playbook
        </h2>
        <div class="section-context" id="control-context">
          Linking recurring enforcement themes to practical remediation steps.
        </div>
      </div>
      <div id="control-playbook" class="playbook-grid">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Building control recommendations...</p>
        </div>
      </div>
    </div>
  `
}

module.exports = {
  renderControlPlaybookSection
}
