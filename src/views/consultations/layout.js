const { getConsultationsIcon, wrapIconInContainer, getCanaryAnimationStyles } = require('../icons')

function renderConsultationsHeader() {
  const pageIcon = wrapIconInContainer(getConsultationsIcon())
  return `
    <header class="page-header">
      <div class="header-title">
        ${pageIcon}
        <div>
          <h1>Regulatory Consultations</h1>
          <p class="page-subtitle">
            Track open consultation papers and respond before deadlines close
          </p>
        </div>
      </div>
      <div class="header-meta">
        <div class="meta-item status">
          <span class="meta-label">Status</span>
          <span class="meta-value">
            <span class="status-dot"></span>
            <span>Active</span>
          </span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Open</span>
          <span class="meta-value" id="header-open-count">-</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Coverage</span>
          <span class="meta-value">UK Regulators</span>
        </div>
      </div>
    </header>
  `
}

function getConsultationsStyles() {
  const canaryStyles = getCanaryAnimationStyles()
  return `
    <style>
      ${canaryStyles}

      .consultations-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
      }

      /* Page Header - Enforcement Style */
      .page-header {
        background: #ffffff;
        color: #0f172a;
        padding: 28px;
        border-radius: 16px;
        margin-bottom: 28px;
        position: relative;
        border: 1px solid #e2e8f0;
        box-shadow: 0 16px 40px -32px rgba(15, 23, 42, 0.6);
      }

      .page-header h1 {
        margin: 0 0 8px 0;
        font-size: 1.85rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #0f172a;
      }

      .page-subtitle {
        font-size: 1rem;
        color: #475569;
        margin: 0;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }

      .header-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 10px;
      }

      .meta-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 10px 14px;
        min-width: 100px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .meta-item.status .meta-value {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .meta-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
        font-weight: 600;
      }

      .meta-value {
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
      }

      /* Canary Icon Container */
      .canary-icon-container {
        width: 48px;
        height: 48px;
        background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%);
        border: 2px solid rgba(251, 191, 36, 0.4);
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(218, 165, 32, 0.25), inset 0 1px 0 rgba(255,255,255,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .canary-icon-container svg {
        width: 36px;
        height: 40px;
      }

      /* Stats Cards */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #e2e8f0;
        transition: all 0.2s;
      }

      .stat-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transform: translateY(-2px);
      }

      .stat-card.open {
        border-left: 4px solid #10b981;
      }

      .stat-card.closing-soon {
        border-left: 4px solid #f59e0b;
      }

      .stat-card.closed {
        border-left: 4px solid #94a3b8;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1e293b;
        line-height: 1;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      /* Filters */
      .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        align-items: center;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .filter-label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .filter-select {
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #1e293b;
        background: white;
        cursor: pointer;
        min-width: 150px;
      }

      .filter-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* Consultations Grid */
      .consultations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .consultation-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        transition: all 0.2s;
        cursor: pointer;
      }

      .consultation-card:hover {
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        transform: translateY(-4px);
      }

      .consultation-card.open {
        border-top: 4px solid #10b981;
      }

      .consultation-card.closing-soon {
        border-top: 4px solid #f59e0b;
      }

      .consultation-card.closed {
        border-top: 4px solid #94a3b8;
      }

      .card-header {
        padding: 1.25rem 1.25rem 0.75rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .authority-badge {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: #e0e7ff;
        color: #4338ca;
        white-space: nowrap;
      }

      .authority-badge.fca { background: #dbeafe; color: #1d4ed8; }
      .authority-badge.pra { background: #f3e8ff; color: #7c3aed; }
      .authority-badge.boe { background: #fef3c7; color: #b45309; }
      .authority-badge.psr { background: #d1fae5; color: #059669; }

      .status-badge {
        font-size: 0.7rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .status-badge.open {
        background: #dcfce7;
        color: #166534;
      }

      .status-badge.closing-soon {
        background: #fef3c7;
        color: #b45309;
        animation: pulse-warning 2s infinite;
      }

      .status-badge.closed {
        background: #f1f5f9;
        color: #64748b;
      }

      @keyframes pulse-warning {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .card-body {
        padding: 0 1.25rem 1rem;
      }

      .card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-summary {
        font-size: 0.875rem;
        color: #64748b;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .card-footer {
        padding: 1rem 1.25rem;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .deadline-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .deadline-label {
        font-size: 0.7rem;
        color: #94a3b8;
        text-transform: uppercase;
      }

      .deadline-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1e293b;
      }

      .deadline-value.urgent {
        color: #dc2626;
      }

      .deadline-value.estimated {
        color: #64748b;
        font-style: italic;
      }

      .days-remaining {
        font-size: 1.5rem;
        font-weight: 700;
        text-align: right;
      }

      .days-remaining.open { color: #10b981; }
      .days-remaining.closing-soon { color: #f59e0b; }
      .days-remaining.closed { color: #94a3b8; }

      .days-label {
        font-size: 0.7rem;
        color: #64748b;
      }

      /* Applies To Tags */
      .applies-to {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: 0.5rem;
      }

      .firm-tag {
        font-size: 0.65rem;
        padding: 0.2rem 0.5rem;
        background: #f1f5f9;
        color: #475569;
        border-radius: 4px;
        white-space: nowrap;
      }

      /* Policy Status Indicator */
      .policy-status {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        margin-top: 0.5rem;
        font-size: 0.75rem;
      }

      .policy-status.has-policy {
        color: #059669;
      }

      .policy-status.pending {
        color: #d97706;
      }

      .policy-link {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
      }

      .policy-link:hover {
        text-decoration: underline;
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
      }

      .modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .modal-content {
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 700px;
        max-height: 85vh;
        overflow-y: auto;
        transform: translateY(20px);
        transition: transform 0.3s;
      }

      .modal-overlay.active .modal-content {
        transform: translateY(0);
      }

      .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        position: sticky;
        top: 0;
        background: white;
        z-index: 1;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 0.25rem;
        line-height: 1;
      }

      .modal-close:hover {
        color: #1e293b;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .analysis-section {
        margin-bottom: 1.5rem;
      }

      .analysis-section-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
      }

      .analysis-content {
        font-size: 0.9375rem;
        color: #334155;
        line-height: 1.6;
      }

      .analysis-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .analysis-list li {
        padding: 0.5rem 0;
        padding-left: 1.5rem;
        position: relative;
        border-bottom: 1px solid #f1f5f9;
      }

      .analysis-list li:last-child {
        border-bottom: none;
      }

      .analysis-list li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.875rem;
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border-radius: 50%;
      }

      .urgency-box {
        padding: 1rem;
        border-radius: 8px;
        margin-top: 0.5rem;
      }

      .urgency-box.high {
        background: #fef2f2;
        border: 1px solid #fecaca;
      }

      .urgency-box.medium {
        background: #fffbeb;
        border: 1px solid #fde68a;
      }

      .urgency-box.none {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
      }

      .urgency-title {
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .urgency-box.high .urgency-title { color: #dc2626; }
      .urgency-box.medium .urgency-title { color: #d97706; }
      .urgency-box.none .urgency-title { color: #64748b; }

      .view-source-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        margin-top: 1rem;
        transition: all 0.2s;
      }

      .view-source-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }

      /* Loading State */
      .loading-overlay {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4rem;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e2e8f0;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #64748b;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .consultations-container {
          padding: 1rem;
        }

        .consultations-grid {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .filters-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-select {
          width: 100%;
        }
      }
    </style>
  `
}

function getConsultationsScripts() {
  return `
    <script>
      let allConsultations = [];
      let currentFilters = { regulator: 'all', status: 'all' };

      // Initialize page
      document.addEventListener('DOMContentLoaded', async function() {
        await loadConsultations();
        await loadSummary();
      });

      // Load consultations from API
      async function loadConsultations() {
        try {
          showLoading();
          const response = await fetch('/api/consultations');
          const data = await response.json();

          if (data.success) {
            allConsultations = data.consultations;
            renderConsultations(allConsultations);
          }
        } catch (error) {
          console.error('Error loading consultations:', error);
          showError();
        }
      }

      // Load summary stats
      async function loadSummary() {
        try {
          const response = await fetch('/api/consultations/summary');
          const data = await response.json();

          if (data.success) {
            document.getElementById('totalCount').textContent = data.summary.total;
            document.getElementById('openCount').textContent = data.summary.open;
            document.getElementById('closingSoonCount').textContent = data.summary.closingSoon;
            document.getElementById('closedCount').textContent = data.summary.closed;
            document.getElementById('header-open-count').textContent = data.summary.open;
          }
        } catch (error) {
          console.error('Error loading summary:', error);
        }
      }

      // Render consultations to grid
      function renderConsultations(consultations) {
        const grid = document.getElementById('consultationsGrid');

        if (!consultations || consultations.length === 0) {
          grid.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128466;</div><p>No consultations found matching your filters.</p></div>';
          return;
        }

        grid.innerHTML = consultations.map(c => {
          const authorityClass = (c.authority || '').toLowerCase().replace(/[^a-z]/g, '');
          const deadline = c.deadline ? new Date(c.deadline).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
          }) : null;

          const deadlineLabel = c.isDeadlineEstimated ? 'Est. Deadline' : 'Response Deadline';
          const deadlineDisplay = deadline || 'Not specified';
          const deadlineClass = c.status === 'closing-soon' ? 'urgent' : (c.isDeadlineEstimated ? 'estimated' : '');

          const daysText = c.daysRemaining !== null
            ? (c.daysRemaining < 0 ? 'Closed' : c.daysRemaining + ' days')
            : '-';

          // Firm applicability tags
          const firmTags = (c.appliesTo || []).slice(0, 3).map(firm =>
            \`<span class="firm-tag">\${escapeHtml(firm)}</span>\`
          ).join('');

          return \`
            <div class="consultation-card \${c.status}" onclick="showAnalysis('\${c.id}')">
              <div class="card-header">
                <span class="authority-badge \${authorityClass}">\${c.authority || 'Unknown'}</span>
                <span class="status-badge \${c.status}">\${formatStatus(c.status)}</span>
              </div>
              <div class="card-body">
                <h3 class="card-title">\${escapeHtml(c.headline)}</h3>
                <p class="card-summary">\${escapeHtml(c.ai_summary || 'No summary available.')}</p>
                \${firmTags ? \`<div class="applies-to">\${firmTags}</div>\` : ''}
              </div>
              <div class="card-footer">
                <div class="deadline-info">
                  <span class="deadline-label">\${deadlineLabel}</span>
                  <span class="deadline-value \${deadlineClass}">\${deadlineDisplay}</span>
                </div>
                <div class="days-remaining \${c.status}">
                  \${c.status === 'closed' ? '&#10003;' : daysText}
                  \${c.status !== 'closed' && c.daysRemaining !== null ? '<div class="days-label">remaining</div>' : ''}
                </div>
              </div>
            </div>
          \`;
        }).join('');
      }

      // Format status for display
      function formatStatus(status) {
        const statusMap = {
          'open': 'Open',
          'closing-soon': 'Closing Soon',
          'closed': 'Closed',
          'unknown': 'Unknown'
        };
        return statusMap[status] || status;
      }

      // Filter consultations
      function filterConsultations() {
        currentFilters.regulator = document.getElementById('regulatorFilter').value;
        currentFilters.status = document.getElementById('statusFilter').value;

        let filtered = allConsultations;

        if (currentFilters.regulator !== 'all') {
          filtered = filtered.filter(c => c.authority === currentFilters.regulator);
        }

        if (currentFilters.status !== 'all') {
          filtered = filtered.filter(c => c.status === currentFilters.status);
        }

        renderConsultations(filtered);
      }

      // Show analysis modal
      async function showAnalysis(consultationId) {
        const modal = document.getElementById('analysisModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';
        modal.classList.add('active');

        try {
          const response = await fetch('/api/consultations/analysis/' + consultationId);
          const data = await response.json();

          if (data.success) {
            renderAnalysis(data.analysis);
          } else {
            modalBody.innerHTML = '<div class="empty-state"><p>Failed to load analysis.</p></div>';
          }
        } catch (error) {
          console.error('Error loading analysis:', error);
          modalBody.innerHTML = '<div class="empty-state"><p>Error loading analysis.</p></div>';
        }
      }

      // Render analysis in modal
      function renderAnalysis(analysis) {
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.innerHTML = \`
          <span class="authority-badge">\${analysis.authority}</span>
          \${escapeHtml(analysis.headline)}
        \`;

        const proposedChanges = analysis.proposedChanges && analysis.proposedChanges.length > 0
          ? \`<ul class="analysis-list">\${analysis.proposedChanges.map(c => \`<li>\${escapeHtml(c)}</li>\`).join('')}</ul>\`
          : '<p class="analysis-content">No specific changes identified.</p>';

        const affectedEntities = analysis.affectedEntities && analysis.affectedEntities.length > 0
          ? analysis.affectedEntities.map(e => \`<span class="authority-badge">\${escapeHtml(e)}</span>\`).join(' ')
          : '<p class="analysis-content">Not specified.</p>';

        const guidance = analysis.responseGuidance || {};
        const urgencyClass = guidance.urgency || 'none';

        modalBody.innerHTML = \`
          <div class="analysis-section">
            <h4 class="analysis-section-title">Summary</h4>
            <p class="analysis-content">\${escapeHtml(analysis.summary)}</p>
          </div>

          <div class="analysis-section">
            <h4 class="analysis-section-title">Proposed Changes</h4>
            \${proposedChanges}
          </div>

          <div class="analysis-section">
            <h4 class="analysis-section-title">Who This Affects</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              \${affectedEntities}
            </div>
          </div>

          <div class="analysis-section">
            <h4 class="analysis-section-title">Response Guidance</h4>
            <div class="urgency-box \${urgencyClass}">
              <div class="urgency-title">\${guidance.message || 'No guidance available.'}</div>
              \${guidance.actions ? \`
                <ul class="analysis-list">
                  \${guidance.actions.map(a => \`<li>\${escapeHtml(a)}</li>\`).join('')}
                </ul>
              \` : ''}
            </div>
          </div>

          \${analysis.url ? \`
            <a href="\${analysis.url}" target="_blank" class="view-source-btn">
              View Original Document
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          \` : ''}
        \`;
      }

      // Close modal
      function closeModal() {
        document.getElementById('analysisModal').classList.remove('active');
      }

      // Escape HTML
      function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // Show loading state
      function showLoading() {
        document.getElementById('consultationsGrid').innerHTML = \`
          <div class="loading-overlay" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
          </div>
        \`;
      }

      // Show error state
      function showError() {
        document.getElementById('consultationsGrid').innerHTML = \`
          <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-icon">&#9888;</div>
            <p>Failed to load consultations. Please try again.</p>
          </div>
        \`;
      }

      // Close modal on overlay click
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-overlay')) {
          closeModal();
        }
      });

      // Close modal on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeModal();
        }
      });
    </script>
  `
}

function renderConsultationsPage({ sidebar, commonStyles, commonClientScripts }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Regulatory Consultations | RegCanary</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  ${commonStyles}
  ${getConsultationsStyles()}
</head>
<body>
  ${sidebar}

  <main class="main-content">
    <div class="consultations-container">
      ${renderConsultationsHeader()}

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" id="totalCount">-</div>
          <div class="stat-label">Total Consultations</div>
        </div>
        <div class="stat-card open">
          <div class="stat-value" id="openCount">-</div>
          <div class="stat-label">Open for Response</div>
        </div>
        <div class="stat-card closing-soon">
          <div class="stat-value" id="closingSoonCount">-</div>
          <div class="stat-label">Closing Soon (&lt;14 days)</div>
        </div>
        <div class="stat-card closed">
          <div class="stat-value" id="closedCount">-</div>
          <div class="stat-label">Recently Closed</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Regulator</label>
          <select id="regulatorFilter" class="filter-select" onchange="filterConsultations()">
            <option value="all">All Regulators</option>
            <option value="FCA">FCA</option>
            <option value="PRA">PRA</option>
            <option value="BoE">Bank of England</option>
            <option value="PSR">PSR</option>
            <option value="ICO">ICO</option>
            <option value="TPR">TPR</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select id="statusFilter" class="filter-select" onchange="filterConsultations()">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closing-soon">Closing Soon</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <!-- Consultations Grid -->
      <div class="consultations-grid" id="consultationsGrid">
        <div class="loading-overlay" style="grid-column: 1 / -1;">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  </main>

  <!-- Analysis Modal -->
  <div class="modal-overlay" id="analysisModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modalTitle" style="margin: 0; font-size: 1.25rem; line-height: 1.4;"></h2>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" id="modalBody">
        <div class="loading-overlay">
          <div class="spinner"></div>
        </div>
      </div>
    </div>
  </div>

  ${commonClientScripts}
  ${getConsultationsScripts()}
</body>
</html>`
}

module.exports = { renderConsultationsPage }
