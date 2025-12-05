const { serializeForScript } = require('../dashboard/helpers')
const { AUTHORITIES, SECTORS, generateSingleSelectDropdown, getDropdownStyles } = require('../../constants/dropdownOptions')

function renderGuidancePanel() {
  return `
    <div class="kanban-guidance" id="kanban-guidance">
      <div class="guidance-header" onclick="KanbanPage.toggleGuidance()">
        <div class="guidance-header-left">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>How to Use Regulatory Change Management</span>
        </div>
        <svg class="guidance-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="guidance-content" id="guidance-content">
        <div class="guidance-steps">
          <div class="guidance-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Select or Create a Workflow</h4>
              <p>Use the dropdown to select an existing workflow template, or create a new one that matches your compliance process (e.g., "FCA Compliance Review").</p>
            </div>
          </div>
          <div class="guidance-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Add Regulatory Changes</h4>
              <p>Click <strong>"Add Item"</strong> to create a new change item. You can link it to a publication from your regulatory updates, set priority, due dates, and assign it to a workflow.</p>
            </div>
          </div>
          <div class="guidance-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Track Progress with Stages</h4>
              <p>Each workflow has stages like "Identified", "Gap Analysis", "Implementation", "Completed". Drag cards between columns to track progress as you work through each regulatory change.</p>
            </div>
          </div>
          <div class="guidance-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>Monitor Deadlines</h4>
              <p>Cards show due dates and priority. Items marked <span class="text-danger">overdue</span> or <span class="text-warning">due soon</span> appear in the stats above. Click any card to view full details and update status.</p>
            </div>
          </div>
        </div>
        <div class="guidance-tips">
          <strong>Pro Tips:</strong>
          <ul>
            <li>Create workflow templates matching your team's compliance process</li>
            <li>Use priorities (High/Medium/Low) to focus on critical changes first</li>
            <li>Link items to source publications to maintain audit trail</li>
            <li>Review overdue items weekly in your compliance meetings</li>
          </ul>
        </div>
      </div>
    </div>
  `
}

function renderStatsCards(statistics) {
  const stats = statistics || {
    total: 0,
    overdue: 0,
    dueSoon: 0,
    completedThisMonth: 0
  }

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Total Items</span>
          <div class="stat-card-icon" style="background: #eff6ff;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h6M9 13h6M9 17h4"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value">${stats.total}</div>
        <div class="stat-card-change neutral">Active change items</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Overdue</span>
          <div class="stat-card-icon" style="background: #fef2f2;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value">${stats.overdue}</div>
        <div class="stat-card-change ${stats.overdue > 0 ? 'negative' : 'positive'}">
          ${stats.overdue > 0 ? 'Needs attention' : 'All on track'}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Due Soon</span>
          <div class="stat-card-icon" style="background: #fffbeb;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value">${stats.dueSoon}</div>
        <div class="stat-card-change neutral">Due within 7 days</div>
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-card-label">Completed</span>
          <div class="stat-card-icon" style="background: #f0fdf4;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
        </div>
        <div class="stat-card-value">${stats.completedThisMonth}</div>
        <div class="stat-card-change positive">This month</div>
      </div>
    </div>
  `
}

function renderWorkflowSelector(templates, selectedId) {
  const templateOptions = (templates || []).map(t =>
    `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${t.name}</option>`
  ).join('')

  return `
    <div class="workflow-selector">
      <label for="workflow-select">Workflow:</label>
      <select id="workflow-select" onchange="KanbanPage.changeWorkflow(this.value)">
        <option value="">All Workflows</option>
        ${templateOptions}
      </select>
    </div>
  `
}

function renderKanbanBoard(template, itemsByStage, connectionCounts = {}) {
  if (!template || !template.stages || template.stages.length === 0) {
    return renderNoTemplateState()
  }

  const sortedStages = [...template.stages].sort((a, b) => a.order - b.order)

  const columns = sortedStages.map(stage => {
    const stageItems = itemsByStage[stage.name] || []
    return renderKanbanColumn(stage, stageItems, connectionCounts)
  }).join('')

  return `
    <div class="kanban-board" data-template-id="${template.id}">
      ${columns}
    </div>
  `
}

function renderNoTemplateState() {
  return `
    <div class="no-template-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="9"/>
        <rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/>
        <rect x="3" y="16" width="7" height="5"/>
      </svg>
      <h3>No Workflow Selected</h3>
      <p>Select a workflow template to view your Kanban board, or create a new one.</p>
      <button class="btn btn-primary" onclick="KanbanPage.openCreateTemplateModal()">
        Create Workflow Template
      </button>
    </div>
  `
}

function renderKanbanColumn(stage, items, connectionCounts = {}) {
  const itemCards = items.length > 0
    ? items.map(item => renderKanbanCard(item, connectionCounts[item.id])).join('')
    : renderEmptyColumn()

  return `
    <div class="kanban-column" data-stage="${stage.name}">
      <div class="column-header">
        <div class="column-header-left">
          <div class="column-color-dot" style="background: ${stage.color || '#6B7280'}"></div>
          <span class="column-title">${stage.name}</span>
        </div>
        <span class="column-count">${items.length}</span>
      </div>
      <div class="column-body"
           ondragover="KanbanPage.handleDragOver(event)"
           ondrop="KanbanPage.handleDrop(event, '${stage.name}')"
           ondragleave="KanbanPage.handleDragLeave(event)">
        ${itemCards}
      </div>
    </div>
  `
}

function renderEmptyColumn() {
  return `
    <div class="column-empty">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
      <p>No items in this stage</p>
    </div>
  `
}

function renderConnectionBadge(counts) {
  if (!counts || counts.total === 0) return ''

  const parts = []
  if (counts.watchLists > 0) parts.push(`${counts.watchLists} WL`)
  if (counts.dossiers > 0) parts.push(`${counts.dossiers} D`)
  if (counts.policies > 0) parts.push(`${counts.policies} P`)

  return `
    <div class="connection-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
      <span class="connection-count">${counts.total}</span>
      <span class="connection-breakdown">${parts.join(' | ')}</span>
    </div>
  `
}

function renderKanbanCard(item, connectionCounts) {
  const priorityClass = item.priority ? `priority-${item.priority.toLowerCase()}` : 'priority-medium'
  const isOverdue = item.due_date && new Date(item.due_date) < new Date()
  const counts = connectionCounts || { watchLists: 0, dossiers: 0, policies: 0, total: 0 }

  const dueDateHtml = item.due_date ? `
    <div class="card-due-date ${isOverdue ? 'overdue' : ''}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      ${formatDate(item.due_date)}
    </div>
  ` : ''

  return `
    <div class="kanban-card"
         draggable="true"
         data-item-id="${item.id}"
         ondragstart="KanbanPage.handleDragStart(event, '${item.id}')"
         ondragend="KanbanPage.handleDragEnd(event)"
         onclick="KanbanPage.openItemDetail('${item.id}')">
      <div class="kanban-card-title">${escapeHtml(item.title || 'Untitled')}</div>
      <div class="kanban-card-meta">
        <span class="card-badge ${priorityClass}">${capitalize(item.priority || 'medium')}</span>
        ${item.authority ? `<span class="card-badge authority">${escapeHtml(item.authority)}</span>` : ''}
        ${item.sector ? `<span class="card-badge sector">${escapeHtml(item.sector)}</span>` : ''}
      </div>
      ${renderConnectionBadge(counts)}
      <div class="kanban-card-footer">
        ${dueDateHtml}
        <div class="card-actions">
          <button class="card-action-btn" onclick="event.stopPropagation(); KanbanPage.openItemDetail('${item.id}')" title="View details">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `
}

function renderAddItemModal(templates) {
  const templateOptions = (templates || []).map(t =>
    `<option value="${t.id}">${t.name}</option>`
  ).join('')

  return `
    <div class="modal-overlay" id="add-item-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Add Regulatory Change</h2>
          <button class="modal-close" onclick="KanbanPage.closeAddItemModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <form id="add-item-form" onsubmit="KanbanPage.submitAddItem(event)">
            <div class="form-group">
              <label class="form-label required">Title</label>
              <input type="text" class="form-input" name="title" required placeholder="Enter change title...">
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description" placeholder="Describe the regulatory change..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Workflow</label>
                <select class="form-select" name="workflow_template_id">
                  <option value="">Select workflow...</option>
                  ${templateOptions}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Priority</label>
                <select class="form-select" name="priority">
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Impact Level</label>
                <select class="form-select" name="impact_level">
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Due Date</label>
                <input type="date" class="form-input" name="due_date">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Authority</label>
                <div id="add-authority-dropdown-container"></div>
              </div>

              <div class="form-group">
                <label class="form-label">Sector</label>
                <div id="add-sector-dropdown-container"></div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Source URL</label>
              <input type="url" class="form-input" name="source_url" placeholder="https://...">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="KanbanPage.closeAddItemModal()">Cancel</button>
          <button type="submit" form="add-item-form" class="btn btn-primary">Create Item</button>
        </div>
      </div>
    </div>
  `
}

function renderItemDetailModal() {
  return `
    <div class="modal-overlay" id="item-detail-modal">
      <div class="modal detail-modal" style="max-width: 900px;">
        <div class="modal-header">
          <h2 class="modal-title" id="detail-modal-title">Change Details</h2>
          <button class="modal-close" onclick="KanbanPage.closeItemDetail()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" id="detail-modal-body" style="max-height: 70vh; overflow-y: auto;">
          <!-- Content populated dynamically -->
        </div>
        <div class="modal-footer" id="detail-modal-footer">
          <!-- Actions populated dynamically -->
        </div>
      </div>
    </div>
  `
}

// Helper functions
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getKanbanDropdownOptions() {
  return {
    authorities: AUTHORITIES,
    sectors: SECTORS
  }
}

module.exports = {
  renderGuidancePanel,
  renderStatsCards,
  renderWorkflowSelector,
  renderKanbanBoard,
  renderKanbanColumn,
  renderKanbanCard,
  renderAddItemModal,
  renderItemDetailModal,
  getKanbanDropdownOptions,
  getDropdownStyles
}
