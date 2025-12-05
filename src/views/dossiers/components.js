function renderStatsCards(stats) {
  const totalDossiers = stats.totalDossiers || 0
  const activeDossiers = stats.activeDossiers || 0
  const totalItems = stats.totalItems || 0
  const recentItems = stats.recentItems || 0

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div class="stat-value">${totalDossiers}</div>
        <div class="stat-label">Total Dossiers</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-value">${activeDossiers}</div>
        <div class="stat-label">Active Research</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="stat-value">${totalItems}</div>
        <div class="stat-label">Evidence Items</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amber">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-value">${recentItems}</div>
        <div class="stat-label">Added This Week</div>
      </div>
    </div>
  `
}

function renderFilterBar() {
  return `
    <div class="filter-bar">
      <input type="text" id="search-input" placeholder="Search dossiers..." onkeyup="DossierPage.handleSearch(event)">
      <select id="status-filter" onchange="DossierPage.handleFilter()">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
      <select id="sort-filter" onchange="DossierPage.handleFilter()">
        <option value="updated">Recently Updated</option>
        <option value="created">Newest First</option>
        <option value="items">Most Items</option>
        <option value="name">Alphabetical</option>
      </select>
    </div>
  `
}

function renderConnectionBadge(counts) {
  if (!counts || counts.total === 0) return ''

  const parts = []
  if (counts.watchLists > 0) parts.push(`${counts.watchLists} watch list${counts.watchLists > 1 ? 's' : ''}`)
  if (counts.policies > 0) parts.push(`${counts.policies} polic${counts.policies > 1 ? 'ies' : 'y'}`)
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

function renderDossiersGrid(dossiers, connectionCounts = {}) {
  if (!dossiers || dossiers.length === 0) {
    return `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          <line x1="12" y1="10" x2="12" y2="14"></line>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
        <h3>No Research Dossiers Yet</h3>
        <p>Create your first dossier to start collecting evidence and tracking regulatory developments.</p>
        <button class="btn btn-primary" onclick="DossierPage.openCreateModal()">
          Create Your First Dossier
        </button>
      </div>
    `
  }

  const dossierCards = dossiers.map(dossier => {
    const itemCount = dossier.item_count || 0
    const statusClass = dossier.status === 'archived' ? 'archived' : 'active'
    const statusLabel = dossier.status === 'archived' ? 'Archived' : 'Active'
    const tags = dossier.tags || []
    const createdDate = dossier.created_at ? new Date(dossier.created_at).toLocaleDateString() : 'Unknown'
    const updatedDate = dossier.updated_at ? new Date(dossier.updated_at).toLocaleDateString() : createdDate
    const counts = connectionCounts[dossier.id] || { watchLists: 0, policies: 0, kanban: 0, total: 0 }

    return `
      <div class="dossier-card" data-id="${dossier.id}">
        <div class="dossier-card-header">
          <div>
            <h3 class="dossier-title">${escapeHtml(dossier.name)}</h3>
            ${dossier.topic ? `<span class="dossier-topic">${escapeHtml(dossier.topic)}</span>` : ''}
          </div>
          <span class="dossier-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="dossier-card-body">
          ${dossier.description ? `<p class="dossier-description">${escapeHtml(dossier.description)}</p>` : ''}
          <div class="dossier-meta">
            <span class="dossier-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              ${itemCount} items
            </span>
            <span class="dossier-meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Updated ${updatedDate}
            </span>
          </div>
          ${renderConnectionBadge(counts)}
        </div>
        <div class="dossier-card-footer">
          <div class="dossier-tags">
            ${tags.slice(0, 3).map(tag => `<span class="dossier-tag">${escapeHtml(tag)}</span>`).join('')}
            ${tags.length > 3 ? `<span class="dossier-tag">+${tags.length - 3}</span>` : ''}
          </div>
          <div class="dossier-actions">
            <button class="btn btn-secondary btn-sm" onclick="DossierPage.viewTimeline('${dossier.id}')">
              Timeline
            </button>
            <button class="btn btn-secondary btn-sm" onclick="DossierPage.editDossier('${dossier.id}')">
              Edit
            </button>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `<div class="dossiers-grid" id="dossiers-grid">${dossierCards}</div>`
}

function renderCreateModal() {
  return `
    <div class="modal-overlay" id="create-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-title">Create Research Dossier</h2>
          <button class="modal-close" onclick="DossierPage.closeModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="dossier-form" onsubmit="DossierPage.handleSubmit(event)">
          <div class="modal-body">
            <input type="hidden" id="dossier-id" name="id">

            <div class="form-group">
              <label for="name">Dossier Name *</label>
              <input type="text" id="name" name="name" required placeholder="e.g., Syria Sanctions Policy Update">
            </div>

            <div class="form-group">
              <label for="topic">Research Topic</label>
              <input type="text" id="topic" name="topic" placeholder="e.g., Sanctions, AML, Consumer Protection">
              <span class="hint">The main regulatory topic this dossier covers</span>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" placeholder="Describe the purpose and scope of this research dossier..."></textarea>
            </div>

            <div class="form-group">
              <label>Tags</label>
              <div class="tag-input-container" id="tags-container">
                <input type="text" id="tags-input" placeholder="Type and press Enter to add tags" onkeydown="DossierPage.handleTagInput(event)">
              </div>
              <input type="hidden" id="tags" name="tags">
              <span class="hint">Add keywords to help organize and find this dossier</span>
            </div>

            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" name="status">
                <option value="active">Active Research</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="DossierPage.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="submit-btn">Create Dossier</button>
          </div>
        </form>
      </div>
    </div>
  `
}

function renderTimelineModal() {
  return `
    <div class="modal-overlay timeline-modal" id="timeline-modal">
      <div class="modal" style="max-width: 900px;">
        <div class="modal-header">
          <h2 id="timeline-modal-title">Dossier Timeline</h2>
          <button class="modal-close" onclick="DossierPage.closeTimelineModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div id="timeline-content">
            <div class="timeline-empty">Loading timeline...</div>
          </div>

          <!-- Connected Items Section -->
          <div id="dossier-linked-items-section" style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: none;">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Connected Items
            </h3>
            <div id="dossier-linked-items-content">
              <div style="text-align: center; padding: 20px; color: #6b7280;">
                Loading connections...
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="DossierPage.closeTimelineModal()">Close</button>
          <button type="button" class="btn btn-primary" onclick="DossierPage.exportTimeline()">Export Timeline</button>
        </div>
      </div>
    </div>
  `
}

function renderLinkSelectorModal() {
  return `
    <div class="modal-overlay" id="link-selector-modal">
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 id="link-modal-title">Link to...</h2>
          <button class="modal-close" onclick="DossierPage.closeLinkModal()">
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
          <button class="btn btn-secondary" onclick="DossierPage.closeLinkModal()">Cancel</button>
        </div>
      </div>
    </div>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  const div = { innerHTML: '' }
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
  renderDossiersGrid,
  renderCreateModal,
  renderTimelineModal,
  renderLinkSelectorModal
}
