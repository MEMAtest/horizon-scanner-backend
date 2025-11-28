// Enforcement Modal System - Rich cards for drill-down data

function applyModalsMixin(klass) {
  Object.assign(klass.prototype, {
    initModals() {
      this.createModalContainer();
      this.bindModalEvents();
    },

    createModalContainer() {
      if (document.getElementById('enforcement-modal-overlay')) return;

      const modalHTML = `
        <div class="enforcement-modal-overlay" id="enforcement-modal-overlay">
          <div class="enforcement-modal">
            <div class="enforcement-modal-header">
              <h2 class="enforcement-modal-title" id="modal-title">Modal Title</h2>
              <button class="enforcement-modal-close" onclick="window.enforcementDashboard.closeModal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="enforcement-modal-body" id="modal-body">
              <!-- Dynamic content -->
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    bindModalEvents() {
      const overlay = document.getElementById('enforcement-modal-overlay');
      if (!overlay) return;

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          this.closeModal();
        }
      });
    },

    openModal(title, content) {
      const overlay = document.getElementById('enforcement-modal-overlay');
      const titleEl = document.getElementById('modal-title');
      const bodyEl = document.getElementById('modal-body');

      if (!overlay || !titleEl || !bodyEl) return;

      titleEl.innerHTML = title;
      bodyEl.innerHTML = content;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    closeModal() {
      const overlay = document.getElementById('enforcement-modal-overlay');
      if (!overlay) return;

      overlay.classList.remove('active');
      document.body.style.overflow = '';
    },

    async showRepeatOffenders() {
      this.openModal(
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Repeat Offenders',
        '<div class="loading-state"><div class="loading-spinner"></div><p>Loading repeat offenders...</p></div>'
      );

      try {
        const response = await fetch('/api/enforcement/repeat-offenders');
        const data = await response.json();

        if (!data.success || !data.offenders || data.offenders.length === 0) {
          this.updateModalContent('<div class="modal-empty-state"><p>No repeat offenders found in the dataset.</p></div>');
          return;
        }

        const cards = data.offenders.map(firm => this.renderFirmCard(firm)).join('');
        this.updateModalContent(`<div class="firm-cards-grid">${cards}</div>`);
      } catch (error) {
        console.error('Failed to load repeat offenders:', error);
        this.updateModalContent('<div class="modal-empty-state"><p>Failed to load repeat offenders. Please try again.</p></div>');
      }
    },

    renderFirmCard(firm) {
      const fineCount = firm.fine_count || firm.fines?.length || 0;
      const totalAmount = this.formatCurrency(firm.total_amount || 0);
      const avgRisk = Math.round(firm.average_risk || 0);

      let timelineHTML = '';
      if (firm.fines && firm.fines.length > 0) {
        const entries = firm.fines.slice(0, 5).map(fine => {
          const date = fine.date_issued ? new Date(fine.date_issued).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
          const amount = this.formatCurrency(fine.amount || 0);
          const breach = fine.breach_categories?.[0] || fine.breach_type || 'Not specified';
          return `
            <div class="timeline-entry">
              <span class="timeline-date">${this.escapeHtml(date)}</span>
              <span class="timeline-breach">${this.escapeHtml(breach)}</span>
              <span class="timeline-fine-amount">${amount}</span>
            </div>
          `;
        }).join('');

        timelineHTML = `
          <div class="firm-timeline">
            <div class="firm-timeline-title">Fine History</div>
            ${entries}
          </div>
        `;
      }

      const latestFine = firm.fines?.[0];
      const noticeLink = latestFine?.final_notice_url
        ? `<a href="${this.escapeHtml(latestFine.final_notice_url)}" target="_blank" class="view-notice-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View Latest FCA Notice
          </a>`
        : '';

      return `
        <div class="firm-card">
          <div class="firm-header">
            <h4 class="firm-name">${this.escapeHtml(firm.firm_name || 'Unknown Firm')}</h4>
            <span class="repeat-badge">${fineCount} Actions</span>
          </div>
          <div class="firm-stats">
            <div class="firm-stat">
              <div class="firm-stat-label">Total Fines</div>
              <div class="firm-stat-value amount">${totalAmount}</div>
            </div>
            <div class="firm-stat">
              <div class="firm-stat-label">Actions</div>
              <div class="firm-stat-value">${fineCount}</div>
            </div>
            <div class="firm-stat">
              <div class="firm-stat-label">Avg Risk</div>
              <div class="firm-stat-value">${avgRisk}/100</div>
            </div>
          </div>
          ${timelineHTML}
          ${noticeLink}
        </div>
      `;
    },

    async showFinesByPeriod(period, label) {
      this.openModal(
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${label}`,
        '<div class="loading-state"><div class="loading-spinner"></div><p>Loading fines...</p></div>'
      );

      try {
        const response = await fetch(`/api/enforcement/fines-by-period?period=${period}`);
        const data = await response.json();

        if (!data.success || !data.fines || data.fines.length === 0) {
          this.updateModalContent(`<div class="modal-empty-state"><p>No fines issued in the ${label.toLowerCase()}.</p></div>`);
          return;
        }

        const summary = `
          <div class="modal-summary" style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 10px; display: flex; gap: 24px;">
            <div>
              <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Total Fines</div>
              <div style="font-size: 1.25rem; font-weight: 700; color: #1e293b;">${data.fines.length}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Total Amount</div>
              <div style="font-size: 1.25rem; font-weight: 700; color: #059669;">${this.formatCurrency(data.totalAmount || 0)}</div>
            </div>
          </div>
        `;

        const finesList = data.fines.map(fine => {
          const date = fine.date_issued ? new Date(fine.date_issued).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
          return `
            <div class="fine-item">
              <span class="fine-item-date">${this.escapeHtml(date)}</span>
              <span class="fine-item-firm">${this.escapeHtml(fine.firm_individual || 'Unknown')}</span>
              <span class="fine-item-amount">${this.formatCurrency(fine.amount || 0)}</span>
            </div>
          `;
        }).join('');

        this.updateModalContent(`${summary}<div class="fines-list">${finesList}</div>`);
      } catch (error) {
        console.error('Failed to load fines by period:', error);
        this.updateModalContent('<div class="modal-empty-state"><p>Failed to load fines. Please try again.</p></div>');
      }
    },

    async showDistinctFirms() {
      this.openModal(
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 12h.01"/><path d="M9 15h.01"/><path d="M9 18h.01"/></svg> Distinct Firms Fined',
        '<div class="loading-state"><div class="loading-spinner"></div><p>Loading firms...</p></div>'
      );

      try {
        const response = await fetch('/api/enforcement/distinct-firms');
        const data = await response.json();

        if (!data.success || !data.firms || data.firms.length === 0) {
          this.updateModalContent('<div class="modal-empty-state"><p>No firms found in the dataset.</p></div>');
          return;
        }

        const firmsList = data.firms.slice(0, 50).map(firm => {
          const isRepeat = firm.fine_count > 1;
          return `
            <div class="fine-item" style="cursor: pointer;" onclick="window.enforcementDashboard.showFirmDetails('${this.escapeHtml(firm.firm_name)}')">
              <span class="fine-item-firm">${this.escapeHtml(firm.firm_name)}</span>
              <span style="font-size: 0.85rem; color: #64748b;">${firm.fine_count} fine${firm.fine_count !== 1 ? 's' : ''}</span>
              <span class="fine-item-amount">${this.formatCurrency(firm.total_amount || 0)}</span>
              ${isRepeat ? '<span class="repeat-badge" style="margin-left: 8px;">Repeat</span>' : ''}
            </div>
          `;
        }).join('');

        const summary = `
          <div class="modal-summary" style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 10px;">
            <div style="font-size: 0.85rem; color: #64748b;">Showing top 50 firms by total fines amount. Click a firm to view details.</div>
          </div>
        `;

        this.updateModalContent(`${summary}<div class="fines-list">${firmsList}</div>`);
      } catch (error) {
        console.error('Failed to load distinct firms:', error);
        this.updateModalContent('<div class="modal-empty-state"><p>Failed to load firms. Please try again.</p></div>');
      }
    },

    async showFirmDetails(firmName) {
      this.openModal(
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg> ${this.escapeHtml(firmName)}`,
        '<div class="loading-state"><div class="loading-spinner"></div><p>Loading firm details...</p></div>'
      );

      try {
        const response = await fetch(`/api/enforcement/firm-details?firm=${encodeURIComponent(firmName)}`);
        const data = await response.json();

        if (!data.success || !data.firm) {
          this.updateModalContent('<div class="modal-empty-state"><p>Firm details not found.</p></div>');
          return;
        }

        const card = this.renderFirmCard(data.firm);
        this.updateModalContent(`<div class="firm-cards-grid">${card}</div>`);
      } catch (error) {
        console.error('Failed to load firm details:', error);
        this.updateModalContent('<div class="modal-empty-state"><p>Failed to load firm details. Please try again.</p></div>');
      }
    },

    updateModalContent(html) {
      const bodyEl = document.getElementById('modal-body');
      if (bodyEl) {
        bodyEl.innerHTML = html;
      }
    }
  });
}

export { applyModalsMixin };
