import { getBreachIcon } from '../../modules/breachIcons.js'

export function renderCaseStudySpotlight() {
  const container = document.getElementById('case-study-spotlight')
  const dotsContainer = document.getElementById('case-dots')
  if (!container) return

  if (!this.caseStudies || this.caseStudies.length === 0) {
    container.innerHTML = '<div class="empty-deep">No case studies available</div>'
    return
  }

  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = this.caseStudies.map((_, i) =>
      `<span class="case-dot ${i === this.currentCaseIndex ? 'active' : ''}" data-index="${i}"></span>`
    ).join('')
  }

  // Render current case
  this.renderCurrentCase()
}

export function renderCurrentCase() {
  const container = document.getElementById('case-study-spotlight')
  if (!container || !this.caseStudies.length) return

  const caseData = this.caseStudies[this.currentCaseIndex]
  const keyFindings = this.parseJson(caseData.key_findings).slice(0, 4)
  const handbookRefs = this.parseJson(caseData.handbook_references).slice(0, 5)
  const aggFactors = this.parseJson(caseData.aggravating_factors).slice(0, 3)
  const mitFactors = this.parseJson(caseData.mitigating_factors).slice(0, 3)

  const noticeDate = caseData.notice_date
    ? new Date(caseData.notice_date).getFullYear()
    : 'N/A'

  // Get breach theme label
  const breachThemeLabels = {
    PRINCIPLES: 'Principles',
    AML: 'Anti-Money Laundering',
    SYSTEMS_CONTROLS: 'Systems & Controls',
    MARKET_ABUSE: 'Market Abuse',
    MIS_SELLING: 'Mis-selling',
    CLIENT_MONEY: 'Client Money',
    CONDUCT: 'Conduct',
    PRUDENTIAL: 'Prudential',
    FINANCIAL_CRIME: 'Financial Crime',
    REPORTING: 'Reporting',
    GOVERNANCE: 'Governance',
    COMPLAINTS: 'Complaints',
    FINANCIAL_PROMOTIONS: 'Financial Promotions',
    APPROVED_PERSONS: 'Approved Persons'
  }

  const breachTheme = caseData.primary_breach_type
    ? breachThemeLabels[caseData.primary_breach_type] || caseData.primary_breach_type
    : null

  const breachIcon = caseData.primary_breach_type ? getBreachIcon(caseData.primary_breach_type) : ''

  container.innerHTML = `
        <div class="case-spotlight-card">
          <div class="case-spotlight-header">
            <div class="case-spotlight-badge">CASE STUDY ${this.currentCaseIndex + 1}/${this.caseStudies.length}</div>
            <div class="case-spotlight-fine">${this.formatCurrency(caseData.fine_amount)}</div>
          </div>

          ${breachTheme ? `
            <div class="case-breach-theme" data-theme="${caseData.primary_breach_type || ''}">
              <span class="breach-theme-icon">${breachIcon}</span>
              <span class="breach-theme-label">${breachTheme}</span>
            </div>
          ` : ''}

          <h3 class="case-spotlight-entity">${this.escapeHtml(caseData.entity_name)}</h3>
          <div class="case-spotlight-meta">
            ${caseData.frn ? `FRN: ${caseData.frn}` : ''} |
            ${caseData.outcome_type || 'Fine'} |
            ${noticeDate}
          </div>

          <div class="case-spotlight-summary">
            ${this.escapeHtml(caseData.ai_summary || 'No summary available')}
          </div>

          ${keyFindings.length > 0 ? `
            <div class="case-section">
              <h4>Key Findings</h4>
              <ul class="case-findings-list">
                ${keyFindings.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${handbookRefs.length > 0 ? `
            <div class="case-section">
              <h4>Handbook Breaches</h4>
              <div class="case-tags">
                ${handbookRefs.map(ref => `<span class="case-tag">${this.escapeHtml(ref)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <div class="case-factors-grid">
            ${aggFactors.length > 0 ? `
              <div class="case-factors agg">
                <h4><span class="factor-icon red">+</span> Aggravating</h4>
                <ul>
                  ${aggFactors.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            ${mitFactors.length > 0 ? `
              <div class="case-factors mit">
                <h4><span class="factor-icon green">-</span> Mitigating</h4>
                <ul>
                  ${mitFactors.map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>

          <!-- Similar Cases Section (loaded async) -->
          <div class="case-similar-section" id="case-similar-section">
            <div class="case-similar-loading">
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
              <span class="loading-dot"></span>
            </div>
          </div>

          ${caseData.pdf_url ? `
            <a href="${caseData.pdf_url}" target="_blank" class="case-view-link">
              View Full Notice
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          ` : ''}
        </div>
      `

  // Fetch and display similar cases
  if (caseData.publication_id) {
    this.loadSimilarCases(caseData.publication_id)
  }

  // Update dots
  document.querySelectorAll('.case-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === this.currentCaseIndex)
  })

  // Update nav buttons
  const prevBtn = document.getElementById('prev-case')
  const nextBtn = document.getElementById('next-case')
  if (prevBtn) prevBtn.disabled = this.currentCaseIndex === 0
  if (nextBtn) nextBtn.disabled = this.currentCaseIndex === this.caseStudies.length - 1
}

export async function loadSimilarCases(publicationId) {
  const section = document.getElementById('case-similar-section')
  if (!section) return

  try {
    const res = await fetch(`/api/publications/insights/case-studies/${encodeURIComponent(publicationId)}/similar`)
    const result = await res.json()

    if (!result.success || !result.data) {
      section.style.display = 'none'
      return
    }

    const { similarCases, industryImpact } = result.data

    if (!similarCases.length && !industryImpact.totalCases) {
      section.style.display = 'none'
      return
    }

    section.innerHTML = `
          ${similarCases.length > 0 ? `
            <div class="similar-cases-block">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
                Similar Cases
              </h4>
              <div class="similar-cases-grid">
                ${similarCases.map(sc => `
                  <div class="similar-case-card">
                    <div class="similar-case-header">
                      <span class="similar-case-entity">${this.escapeHtml(sc.entityName)}</span>
                      <span class="similar-case-fine">${this.formatCurrency(sc.fineAmount)}</span>
                    </div>
                    <div class="similar-case-meta">
                      <span class="similar-case-year">${sc.year || 'N/A'}</span>
                      <span class="similar-case-outcome">${(sc.outcomeType || '').replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${industryImpact.totalCases > 0 ? `
            <div class="industry-impact-block">
              <h4>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20V10M6 20V4M18 20v-6"/>
                </svg>
                Industry Impact
              </h4>
              <div class="impact-stats-grid">
                <div class="impact-stat">
                  <span class="impact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </span>
                  <span class="impact-value">${industryImpact.totalCases}</span>
                  <span class="impact-label">Similar Cases</span>
                </div>
                <div class="impact-stat">
                  <span class="impact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </span>
                  <span class="impact-value">${this.formatCurrency(industryImpact.totalFines)}</span>
                  <span class="impact-label">Total Fines</span>
                </div>
                <div class="impact-stat">
                  <span class="impact-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <line x1="8" y1="6" x2="16" y2="6"/>
                      <line x1="8" y1="10" x2="16" y2="10"/>
                      <line x1="8" y1="14" x2="12" y2="14"/>
                    </svg>
                  </span>
                  <span class="impact-value">${this.formatCurrency(industryImpact.avgFine)}</span>
                  <span class="impact-label">Avg Fine</span>
                </div>
                ${industryImpact.yearRange ? `
                  <div class="impact-stat">
                    <span class="impact-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </span>
                    <span class="impact-value">${industryImpact.yearRange}</span>
                    <span class="impact-label">Period</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        `
  } catch (err) {
    console.error('Failed to load similar cases:', err)
    section.style.display = 'none'
  }
}
