const { serializeForScript } = require('../dashboard/helpers')
const { AUTHORITIES, SECTORS, generateMultiSelectDropdown, getDropdownStyles, getDropdownScripts } = require('../../constants/dropdownOptions')

function renderStatsCards(stats) {
  return `
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Active Watch Lists</div>
        <div class="stat-value">${stats.totalWatchLists || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Matches</div>
        <div class="stat-value success">${stats.totalMatches || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unreviewed</div>
        <div class="stat-value highlight">${stats.unreviewedMatches || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Top List</div>
        <div class="stat-value" style="font-size: 16px;">${stats.topMatchingList || 'N/A'}</div>
      </div>
    </div>
  `
}

function renderConnectionBadge(counts) {
  if (!counts || counts.total === 0) return ''

  const parts = []
  if (counts.dossiers > 0) parts.push(`${counts.dossiers} dossier${counts.dossiers > 1 ? 's' : ''}`)
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

function renderWatchListCard(watchList, connectionCounts) {
  const keywords = watchList.keywords || []
  const authorities = watchList.authorities || []
  const sectors = watchList.sectors || []
  const counts = connectionCounts || { dossiers: 0, policies: 0, kanban: 0, total: 0 }

  return `
    <div class="watch-list-card" data-id="${watchList.id}">
      <div class="watch-list-header">
        <h3>${escapeHtml(watchList.name)}</h3>
        <p>${escapeHtml(watchList.description || 'No description')}</p>
      </div>
      <div class="watch-list-body">
        ${keywords.length > 0 ? `
          <div class="watch-list-criteria">
            <div class="criteria-label">Keywords</div>
            <div class="criteria-tags">
              ${keywords.slice(0, 5).map(k => `<span class="criteria-tag keyword">${escapeHtml(k)}</span>`).join('')}
              ${keywords.length > 5 ? `<span class="criteria-tag">+${keywords.length - 5} more</span>` : ''}
            </div>
          </div>
        ` : ''}
        ${authorities.length > 0 ? `
          <div class="watch-list-criteria">
            <div class="criteria-label">Authorities</div>
            <div class="criteria-tags">
              ${authorities.slice(0, 4).map(a => `<span class="criteria-tag authority">${escapeHtml(a)}</span>`).join('')}
              ${authorities.length > 4 ? `<span class="criteria-tag">+${authorities.length - 4} more</span>` : ''}
            </div>
          </div>
        ` : ''}
        ${sectors.length > 0 ? `
          <div class="watch-list-criteria">
            <div class="criteria-label">Sectors</div>
            <div class="criteria-tags">
              ${sectors.slice(0, 4).map(s => `<span class="criteria-tag sector">${escapeHtml(s)}</span>`).join('')}
              ${sectors.length > 4 ? `<span class="criteria-tag">+${sectors.length - 4} more</span>` : ''}
            </div>
          </div>
        ` : ''}
        ${renderConnectionBadge(counts)}
        <div class="watch-list-stats">
          <div class="watch-list-stat">
            <div class="value">${watchList.matchCount || 0}</div>
            <div class="label">Matches</div>
          </div>
          <div class="watch-list-stat">
            <div class="value unreviewed">${watchList.unreviewedCount || 0}</div>
            <div class="label">Unreviewed</div>
          </div>
          <div class="watch-list-stat">
            <div class="value">${Math.round((watchList.alert_threshold || 0.5) * 100)}%</div>
            <div class="label">Threshold</div>
          </div>
        </div>
      </div>
      <div class="watch-list-footer">
        <div class="toggle-group">
          <label class="toggle-switch">
            <input type="checkbox" ${watchList.alert_on_match ? 'checked' : ''}
                   onchange="WatchListPage.toggleAlerts('${watchList.id}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
          <span style="font-size: 13px; color: #6b7280;">Alerts</span>
        </div>
        <div class="actions">
          <button class="btn btn-secondary btn-sm" onclick="WatchListPage.viewMatches('${watchList.id}')">
            View Matches
          </button>
          <button class="btn btn-secondary btn-sm" onclick="WatchListPage.editWatchList('${watchList.id}')">
            Edit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="WatchListPage.deleteWatchList('${watchList.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
}

function renderWatchListsGrid(watchLists, connectionCounts = {}) {
  if (!watchLists || watchLists.length === 0) {
    return `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>
        </svg>
        <h3>No Watch Lists Yet</h3>
        <p>Create a watch list to automatically track regulatory updates matching your criteria</p>
        <button class="btn btn-primary" onclick="WatchListPage.openCreateModal()">
          Create Your First Watch List
        </button>
      </div>
    `
  }

  return `
    <div class="watch-lists-grid">
      ${watchLists.map(wl => renderWatchListCard(wl, connectionCounts[wl.id])).join('')}
    </div>
  `
}

function renderCreateModal() {
  return `
    <div class="modal-overlay" id="create-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-title">Create Watch List</h2>
          <button class="btn btn-ghost" onclick="WatchListPage.closeModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <form id="watch-list-form" onsubmit="WatchListPage.handleSubmit(event)">
          <div class="modal-body">
            <input type="hidden" id="watch-list-id" name="id">

            <div class="form-group">
              <label for="name">Name *</label>
              <input type="text" id="name" name="name" required placeholder="e.g., Sanctions Updates">
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" placeholder="What are you tracking with this watch list?"></textarea>
            </div>

            <div class="form-group">
              <label>Keywords</label>
              <div class="tag-input-container" id="keywords-container" onclick="document.getElementById('keywords-input').focus()">
                <input type="text" id="keywords-input" placeholder="Type and press Enter to add"
                       onkeydown="WatchListPage.handleTagInput(event, 'keywords')">
              </div>
              <input type="hidden" id="keywords" name="keywords">
              <p class="help-text">Keywords to match in titles and summaries</p>
            </div>

            <div class="form-group">
              <label>Authorities</label>
              <div id="authorities-dropdown-container"></div>
              <p class="help-text">Regulatory bodies to monitor (select multiple or add custom)</p>
            </div>

            <div class="form-group">
              <label>Sectors</label>
              <div id="sectors-dropdown-container"></div>
              <p class="help-text">Industry sectors to focus on (select multiple or add custom)</p>
            </div>

            <div class="form-group">
              <label for="alert-threshold">Match Threshold</label>
              <select id="alert-threshold" name="alertThreshold">
                <option value="0.3">Low (30% match)</option>
                <option value="0.5" selected>Medium (50% match)</option>
                <option value="0.7">High (70% match)</option>
                <option value="0.9">Very High (90% match)</option>
              </select>
              <p class="help-text">Minimum match score to trigger alerts</p>
            </div>

            <div class="form-group">
              <div class="toggle-group">
                <label class="toggle-switch">
                  <input type="checkbox" id="alert-on-match" name="alertOnMatch" checked>
                  <span class="toggle-slider"></span>
                </label>
                <span>Enable alerts for new matches</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="WatchListPage.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="submit-btn">Create Watch List</button>
          </div>
        </form>
      </div>
    </div>
  `
}

function renderMatchesModal() {
  return `
    <div class="modal-overlay" id="matches-modal">
      <div class="modal" style="max-width: 900px;">
        <div class="modal-header">
          <h2 id="matches-modal-title">Watch List Matches</h2>
          <button class="btn btn-ghost" onclick="WatchListPage.closeMatchesModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div id="matches-content">
            <div style="text-align: center; padding: 40px; color: #6b7280;">
              Loading matches...
            </div>
          </div>

          <!-- Connected Items Section -->
          <div id="linked-items-section" style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 20px; display: none;">
            <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              Connected Items
            </h3>
            <div id="linked-items-content">
              <div style="text-align: center; padding: 20px; color: #6b7280;">
                Loading connections...
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="WatchListPage.closeMatchesModal()">Close</button>
          <button class="btn btn-primary" onclick="WatchListPage.markAllReviewed()">Mark All Reviewed</button>
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
          <button class="btn btn-ghost" onclick="WatchListPage.closeLinkModal()">
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
          <button class="btn btn-secondary" onclick="WatchListPage.closeLinkModal()">Cancel</button>
        </div>
      </div>
    </div>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getWatchListDropdownOptions() {
  return {
    authorities: AUTHORITIES,
    sectors: SECTORS
  }
}

module.exports = {
  renderStatsCards,
  renderWatchListCard,
  renderWatchListsGrid,
  renderCreateModal,
  renderMatchesModal,
  renderLinkSelectorModal,
  getWatchListDropdownOptions,
  getDropdownStyles,
  getDropdownScripts
}
