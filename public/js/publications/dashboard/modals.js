export function applyModalsMixin(klass) {
  Object.assign(klass.prototype, {
    showDetail(publicationId) {
      const notice = this.notices.find(n => n.publication_id === publicationId)
      if (!notice) return
  
      const modal = document.getElementById('detail-modal')
      const title = document.getElementById('modal-entity-name')
      const body = document.getElementById('modal-body')
  
      title.textContent = notice.entity_name || 'Unknown Entity'
  
      body.innerHTML = `
        <div class="detail-grid">
          <div class="detail-section">
            <div class="detail-label">FRN</div>
            <div class="detail-value">${notice.frn || 'N/A'}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Entity Type</div>
            <div class="detail-value">${notice.entity_type || 'N/A'}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Outcome Type</div>
            <div class="detail-value"><span class="outcome-badge outcome-${notice.outcome_type || 'other'}">${notice.outcome_type || 'other'}</span></div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Fine Amount</div>
            <div class="detail-value">${notice.fine_amount ? '£' + Number(notice.fine_amount).toLocaleString() : 'No fine'}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Primary Breach</div>
            <div class="detail-value">${notice.primary_breach_type || 'N/A'}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Risk Score</div>
            <div class="detail-value"><span class="risk-badge ${notice.risk_score >= 70 ? 'risk-high' : notice.risk_score >= 40 ? 'risk-medium' : 'risk-low'}">${notice.risk_score || 0}/100</span></div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Consumer Impact</div>
            <div class="detail-value">${notice.consumer_impact_level || 'Unknown'}</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Notice Date</div>
            <div class="detail-value">${notice.notice_date ? new Date(notice.notice_date).toLocaleDateString('en-GB') : 'N/A'}</div>
          </div>
        </div>
  
        <div class="detail-section" style="margin-top: 20px;">
          <div class="detail-label">AI Summary</div>
          <div class="detail-value">${notice.ai_summary || 'No summary available'}</div>
        </div>
  
        ${notice.handbook_references ? `
        <div class="detail-section">
          <div class="detail-label">Handbook References</div>
          <div class="detail-tags">
            ${this.parseJson(notice.handbook_references).map(ref => `<span class="detail-tag">${ref}</span>`).join('')}
          </div>
        </div>
        ` : ''}
  
        ${notice.key_findings ? `
        <div class="detail-section">
          <div class="detail-label">Key Findings</div>
          <ul style="margin: 0; padding-left: 20px;">
            ${this.parseJson(notice.key_findings).map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
  
        ${notice.pdf_url ? `
        <div class="detail-section" style="margin-top: 20px;">
          <a href="${notice.pdf_url}" target="_blank" class="btn btn-primary">View Original PDF</a>
        </div>
        ` : ''}
      `
  
      modal.style.display = 'flex'
    },
    closeModal() {
      const modal = document.getElementById('detail-modal')
      if (modal) modal.style.display = 'none'
    }
  })
}
