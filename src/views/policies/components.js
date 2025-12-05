function renderStatsCards(stats) {
  const totalPolicies = stats.totalPolicies || 0
  const activePolicies = stats.activePolicies || 0
  const draftPolicies = stats.draftPolicies || 0
  const reviewDue = stats.reviewDueSoon || 0
  const pendingApproval = stats.pendingApproval || 0

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
        </div>
        <div class="stat-value">${totalPolicies}</div>
        <div class="stat-label">Total Policies</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-value">${activePolicies}</div>
        <div class="stat-label">Active Policies</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </div>
        <div class="stat-value">${draftPolicies}</div>
        <div class="stat-label">In Draft</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-value">${pendingApproval}</div>
        <div class="stat-label">Pending Approval</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon red">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="stat-value">${reviewDue}</div>
        <div class="stat-label">Review Due</div>
      </div>
    </div>
  `
}

function renderFilterBar() {
  return `
    <div class="filter-bar">
      <input type="text" id="search-input" placeholder="Search policies..." onkeyup="PolicyPage.handleSearch(event)">
      <select id="status-filter" onchange="PolicyPage.handleFilter()">
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="under_review">Under Review</option>
        <option value="archived">Archived</option>
      </select>
      <select id="category-filter" onchange="PolicyPage.handleFilter()">
        <option value="">All Categories</option>
        <option value="AML">AML</option>
        <option value="Sanctions">Sanctions</option>
        <option value="Consumer Protection">Consumer Protection</option>
        <option value="Data Privacy">Data Privacy</option>
        <option value="Conduct">Conduct</option>
        <option value="Operational">Operational</option>
      </select>
      <select id="sort-filter" onchange="PolicyPage.handleFilter()">
        <option value="updated">Recently Updated</option>
        <option value="review">Review Date</option>
        <option value="name">Alphabetical</option>
      </select>
    </div>
  `
}

function renderConnectionBadge(counts) {
  if (!counts || counts.total === 0) return ''

  const parts = []
  if (counts.watchLists > 0) parts.push(`${counts.watchLists} watch list${counts.watchLists > 1 ? 's' : ''}`)
  if (counts.dossiers > 0) parts.push(`${counts.dossiers} dossier${counts.dossiers > 1 ? 's' : ''}`)
  if (counts.kanban > 0) parts.push(`${counts.kanban} kanban`)

  return `
    <div class="connection-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <span class="connection-count">${counts.total} connection${counts.total > 1 ? 's' : ''}</span>
      <span class="connection-breakdown">${parts.join(' | ')}</span>
    </div>
  `
}

function renderPoliciesList(policies, connectionCounts = {}) {
  if (!policies || policies.length === 0) {
    return `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
        <h3>No Policies Yet</h3>
        <p>Create your first policy to start managing your regulatory compliance documentation.</p>
        <button class="btn btn-primary" onclick="PolicyPage.openCreateModal()">
          Create Your First Policy
        </button>
      </div>
    `
  }

  const policyCards = policies.map(policy => {
    const counts = connectionCounts[policy.id] || { watchLists: 0, dossiers: 0, kanban: 0, total: 0 }
    const statusClass = policy.status || 'draft'
    const statusLabel = formatStatus(policy.status)
    const version = policy.current_version || '1.0'
    const effectiveDate = policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'Not set'
    const nextReview = policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString() : 'Not scheduled'
    const citationCount = policy.citation_count || 0

    // Check if review is due soon
    const reviewDueSoon = isReviewDueSoon(policy.next_review_date)
    const reviewMetaClass = reviewDueSoon ? (isReviewOverdue(policy.next_review_date) ? 'danger' : 'warning') : ''

    return `
      <div class="policy-card" data-id="${policy.id}">
        <div class="policy-card-main">
          <div class="policy-info">
            <div class="policy-title-row">
              <h3 class="policy-title">${escapeHtml(policy.title)}</h3>
              <span class="policy-status ${statusClass}">${statusLabel}</span>
            </div>
            ${policy.category ? `<span class="policy-category">${escapeHtml(policy.category)}</span>` : ''}
            ${policy.description ? `<p class="policy-description">${escapeHtml(policy.description)}</p>` : ''}
            <div class="policy-meta">
              <span class="policy-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Effective: ${effectiveDate}
              </span>
              <span class="policy-meta-item ${reviewMetaClass}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Review: ${nextReview}
              </span>
              ${citationCount > 0 ? `
                <span class="policy-meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  ${citationCount} citations
                </span>
              ` : ''}
            </div>
            ${renderConnectionBadge(counts)}
          </div>
          <div class="policy-actions">
            <span class="policy-version-badge">v${version}</span>
            <div class="policy-actions-row">
              <button class="btn btn-secondary btn-sm" onclick="PolicyPage.viewPolicy('${policy.id}')">
                View
              </button>
              <button class="btn btn-secondary btn-sm" onclick="PolicyPage.editPolicy('${policy.id}')">
                Edit
              </button>
              ${policy.status === 'draft' ? `
                <button class="btn btn-success btn-sm" onclick="PolicyPage.submitForApproval('${policy.id}')">
                  Submit
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `<div class="policies-list" id="policies-list">${policyCards}</div>`
}

function renderCreateModal() {
  return `
    <div class="modal-overlay" id="create-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-title">Create New Policy</h2>
          <button class="modal-close" onclick="PolicyPage.closeModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="policy-form" onsubmit="PolicyPage.handleSubmit(event)">
          <div class="modal-body">
            <input type="hidden" id="policy-id" name="id">

            <div class="form-group">
              <label for="title">Policy Title *</label>
              <input type="text" id="title" name="title" required placeholder="e.g., Syria Sanctions Policy">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="category">Category</label>
                <select id="category" name="category">
                  <option value="">Select category...</option>
                  <option value="AML">AML</option>
                  <option value="Sanctions">Sanctions</option>
                  <option value="Consumer Protection">Consumer Protection</option>
                  <option value="Data Privacy">Data Privacy</option>
                  <option value="Conduct">Conduct</option>
                  <option value="Operational">Operational</option>
                </select>
              </div>
              <div class="form-group">
                <label for="owner">Policy Owner</label>
                <input type="text" id="owner" name="owner" placeholder="e.g., Compliance Team">
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" placeholder="Brief description of the policy scope and purpose..." style="min-height: 80px;"></textarea>
            </div>

            <div class="form-group">
              <label for="content">Policy Content (Markdown)</label>
              <textarea id="content" name="content" placeholder="# Policy Overview&#10;&#10;## Scope&#10;&#10;## Requirements&#10;&#10;## Procedures"></textarea>
              <span class="hint">Use Markdown formatting for headers, lists, and emphasis</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="effective-date">Effective Date</label>
                <input type="date" id="effective-date" name="effectiveDate">
              </div>
              <div class="form-group">
                <label for="review-date">Next Review Date</label>
                <input type="date" id="review-date" name="nextReviewDate">
              </div>
            </div>

            <div class="form-group">
              <label for="version-notes">Version Notes</label>
              <input type="text" id="version-notes" name="versionNotes" placeholder="e.g., Initial draft, Updated for 2024 regulations">
              <span class="hint">Brief description of changes for this version</span>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="PolicyPage.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="submit-btn">Create Policy</button>
          </div>
        </form>
      </div>
    </div>
  `
}

function renderViewModal() {
  return `
    <div class="modal-overlay" id="view-modal">
      <div class="modal" style="max-width: 900px;">
        <div class="modal-header">
          <h2 id="view-modal-title">Policy Details</h2>
          <button class="modal-close" onclick="PolicyPage.closeViewModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div id="view-content">
            Loading policy...
          </div>

          <!-- Connected Items Section -->
          <div id="policy-linked-items-section" style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: none;">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Connected Items
            </h3>
            <div id="policy-linked-items-content">
              <div style="text-align: center; padding: 20px; color: #6b7280;">
                Loading connections...
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="PolicyPage.closeViewModal()">Close</button>
          <button type="button" class="btn btn-secondary" onclick="PolicyPage.exportPolicy()">Export PDF</button>
          <button type="button" class="btn btn-primary" id="approve-btn" style="display:none" onclick="PolicyPage.approveVersion()">Approve Version</button>
        </div>
      </div>
    </div>
  `
}

function formatStatus(status) {
  const labels = {
    draft: 'Draft',
    active: 'Active',
    under_review: 'Under Review',
    archived: 'Archived'
  }
  return labels[status] || 'Unknown'
}

function isReviewDueSoon(dateStr) {
  if (!dateStr) return false
  const reviewDate = new Date(dateStr)
  const now = new Date()
  const diffDays = (reviewDate - now) / (1000 * 60 * 60 * 24)
  return diffDays <= 30
}

function isReviewOverdue(dateStr) {
  if (!dateStr) return false
  const reviewDate = new Date(dateStr)
  return reviewDate < new Date()
}

function renderLinkSelectorModal() {
  return `
    <div class="modal-overlay" id="link-selector-modal">
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 id="link-modal-title">Link to...</h2>
          <button class="modal-close" onclick="PolicyPage.closeLinkModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
          <div id="link-selector-content">
            <div style="text-align: center; padding: 40px; color: #6b7280;">
              Loading...
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="PolicyPage.closeLinkModal()">Cancel</button>
        </div>
      </div>
    </div>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/[&<>"']/g, char => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return entities[char]
  })
}

module.exports = {
  renderStatsCards,
  renderFilterBar,
  renderPoliciesList,
  renderCreateModal,
  renderViewModal,
  renderLinkSelectorModal
}
