const { serializeForScript } = require('../dashboard/helpers')

function getKanbanScripts({ workflowTemplates, selectedTemplateId, selectedTemplate, itemsByStage, statistics }) {
  const serializedTemplates = serializeForScript(workflowTemplates || [])
  const serializedSelectedTemplate = serializeForScript(selectedTemplate || null)
  const serializedItemsByStage = serializeForScript(itemsByStage || {})
  const serializedStatistics = serializeForScript(statistics || {})

  return `
    <script>
      // Initialize global state
      window.kanbanState = {
        templates: ${serializedTemplates},
        selectedTemplateId: ${JSON.stringify(selectedTemplateId || null)},
        selectedTemplate: ${serializedSelectedTemplate},
        itemsByStage: ${serializedItemsByStage},
        statistics: ${serializedStatistics},
        draggedItemId: null
      };
    </script>
    <script>
      (function() {
        const state = window.kanbanState;

        const KanbanPage = {
          init: function() {
            console.log('[Kanban] Initialized with', Object.keys(state.itemsByStage).length, 'stages');
            // Check localStorage for guidance panel state
            const guidanceCollapsed = localStorage.getItem('kanban-guidance-collapsed') === 'true';
            if (guidanceCollapsed) {
              const guidance = document.getElementById('kanban-guidance');
              if (guidance) guidance.classList.add('collapsed');
            }
          },

          // Guidance Panel Toggle
          toggleGuidance: function() {
            const guidance = document.getElementById('kanban-guidance');
            if (guidance) {
              guidance.classList.toggle('collapsed');
              const isCollapsed = guidance.classList.contains('collapsed');
              localStorage.setItem('kanban-guidance-collapsed', isCollapsed);
            }
          },

          // Workflow Selection
          changeWorkflow: function(templateId) {
            const currentUrl = new URL(window.location.href);
            if (templateId) {
              currentUrl.searchParams.set('templateId', templateId);
            } else {
              currentUrl.searchParams.delete('templateId');
            }
            window.location.href = currentUrl.toString();
          },

          // Drag and Drop
          handleDragStart: function(event, itemId) {
            state.draggedItemId = itemId;
            event.target.classList.add('dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', itemId);
          },

          handleDragEnd: function(event) {
            event.target.classList.remove('dragging');
            state.draggedItemId = null;
            // Remove all drag-over states
            document.querySelectorAll('.kanban-column.drag-over').forEach(col => {
              col.classList.remove('drag-over');
            });
          },

          handleDragOver: function(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const column = event.target.closest('.kanban-column');
            if (column && !column.classList.contains('drag-over')) {
              document.querySelectorAll('.kanban-column.drag-over').forEach(col => {
                col.classList.remove('drag-over');
              });
              column.classList.add('drag-over');
            }
          },

          handleDragLeave: function(event) {
            const column = event.target.closest('.kanban-column');
            if (column && !column.contains(event.relatedTarget)) {
              column.classList.remove('drag-over');
            }
          },

          handleDrop: async function(event, newStage) {
            event.preventDefault();
            const column = event.target.closest('.kanban-column');
            if (column) {
              column.classList.remove('drag-over');
            }

            const itemId = event.dataTransfer.getData('text/plain');
            if (!itemId || !newStage) return;

            try {
              const response = await fetch('/api/regulatory-changes/' + itemId + '/advance', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ stage: newStage })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Item moved to ' + newStage, 'success');
                // Reload the page to get fresh data
                window.location.reload();
              } else {
                this.showToast('Failed to move item: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Kanban] Drop error:', error);
              this.showToast('Failed to move item', 'error');
            }
          },

          // Add Item Modal
          openAddItemModal: function() {
            document.getElementById('add-item-modal').classList.add('active');
          },

          closeAddItemModal: function() {
            document.getElementById('add-item-modal').classList.remove('active');
            document.getElementById('add-item-form').reset();
          },

          submitAddItem: async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);

            const data = {
              title: formData.get('title'),
              description: formData.get('description'),
              workflow_template_id: formData.get('workflow_template_id') || undefined,
              priority: formData.get('priority'),
              impact_level: formData.get('impact_level'),
              due_date: formData.get('due_date') || undefined,
              authority: formData.get('authority') || undefined,
              sector: formData.get('sector') || undefined,
              source_url: formData.get('source_url') || undefined
            };

            // Remove undefined values
            Object.keys(data).forEach(key => {
              if (data[key] === undefined || data[key] === '') {
                delete data[key];
              }
            });

            try {
              const response = await fetch('/api/regulatory-changes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify(data)
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Item created successfully', 'success');
                this.closeAddItemModal();
                window.location.reload();
              } else {
                this.showToast('Failed to create item: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Kanban] Create error:', error);
              this.showToast('Failed to create item', 'error');
            }
          },

          // Item Detail Modal
          openItemDetail: async function(itemId) {
            try {
              const response = await fetch('/api/regulatory-changes/' + itemId, {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json();

              if (!result.success || !result.data) {
                this.showToast('Failed to load item details', 'error');
                return;
              }

              const item = result.data;
              this.renderItemDetail(item);
              document.getElementById('item-detail-modal').classList.add('active');
            } catch (error) {
              console.error('[Kanban] Load detail error:', error);
              this.showToast('Failed to load item details', 'error');
            }
          },

          renderItemDetail: function(item) {
            const titleEl = document.getElementById('detail-modal-title');
            const bodyEl = document.getElementById('detail-modal-body');
            const footerEl = document.getElementById('detail-modal-footer');

            titleEl.textContent = item.title || 'Change Details';

            const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

            bodyEl.innerHTML = \`
              <div class="detail-section">
                <h3 class="detail-section-title">Description</h3>
                <p class="detail-description">\${item.description || 'No description provided.'}</p>
              </div>

              <div class="detail-section">
                <h3 class="detail-section-title">Details</h3>
                <div class="detail-meta-grid">
                  <div class="detail-meta-item">
                    <div class="detail-meta-label">Current Stage</div>
                    <div class="detail-meta-value">\${item.current_stage || 'Not assigned'}</div>
                  </div>
                  <div class="detail-meta-item">
                    <div class="detail-meta-label">Priority</div>
                    <div class="detail-meta-value">\${this.capitalize(item.priority || 'Medium')}</div>
                  </div>
                  <div class="detail-meta-item">
                    <div class="detail-meta-label">Impact Level</div>
                    <div class="detail-meta-value">\${this.capitalize(item.impact_level || 'Medium')}</div>
                  </div>
                  <div class="detail-meta-item">
                    <div class="detail-meta-label">Due Date</div>
                    <div class="detail-meta-value">\${formatDate(item.due_date)}</div>
                  </div>
                  <div class="detail-meta-item">
                    <div class="detail-meta-label">Authority</div>
                    <div class="detail-meta-value">\${item.authority || 'Not specified'}</div>
                  </div>
                  <div class="detail-meta-item">
                    <div class="detail-meta-label">Sector</div>
                    <div class="detail-meta-value">\${item.sector || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              \${item.source_url ? \`
                <div class="detail-section">
                  <h3 class="detail-section-title">Source</h3>
                  <a href="\${item.source_url}" target="_blank" class="btn btn-secondary btn-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    View Source
                  </a>
                </div>
              \` : ''}

              \${item.stage_history && item.stage_history.length > 0 ? \`
                <div class="detail-section">
                  <h3 class="detail-section-title">Stage History</h3>
                  <div class="stage-history">
                    \${item.stage_history.map(h => \`
                      <div class="history-item">
                        <div class="history-stage">\${h.stage}</div>
                        <div class="history-date">\${formatDate(h.transitioned_at)}</div>
                        \${h.notes ? \`<div class="history-notes">"\${h.notes}"</div>\` : ''}
                      </div>
                    \`).join('')}
                  </div>
                </div>
              \` : ''}
            \`;

            // Build stage advance buttons if template is selected
            let stageButtons = '';
            if (state.selectedTemplate && state.selectedTemplate.stages) {
              const sortedStages = [...state.selectedTemplate.stages].sort((a, b) => a.order - b.order);
              const currentIndex = sortedStages.findIndex(s => s.name === item.current_stage);
              const availableStages = sortedStages.filter((s, i) => i !== currentIndex);

              if (availableStages.length > 0) {
                stageButtons = \`
                  <div class="stage-advance-dropdown">
                    <button class="btn btn-primary" onclick="KanbanPage.toggleStageDropdown()">
                      Move to Stage
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    <div class="stage-dropdown-menu" id="stage-dropdown">
                      \${availableStages.map(s => \`
                        <div class="stage-dropdown-item" onclick="KanbanPage.advanceToStage('\${item.id}', '\${s.name}')">
                          <div class="column-color-dot" style="background: \${s.color || '#6B7280'}"></div>
                          \${s.name}
                        </div>
                      \`).join('')}
                    </div>
                  </div>
                \`;
              }
            }

            footerEl.innerHTML = \`
              <button class="btn btn-secondary" onclick="KanbanPage.closeItemDetail()">Close</button>
              \${stageButtons}
            \`;
          },

          closeItemDetail: function() {
            document.getElementById('item-detail-modal').classList.remove('active');
            const dropdown = document.getElementById('stage-dropdown');
            if (dropdown) dropdown.classList.remove('active');
          },

          toggleStageDropdown: function() {
            const dropdown = document.getElementById('stage-dropdown');
            if (dropdown) {
              dropdown.classList.toggle('active');
            }
          },

          advanceToStage: async function(itemId, newStage) {
            const notes = prompt('Add notes for this stage transition (optional):');

            try {
              const response = await fetch('/api/regulatory-changes/' + itemId + '/advance', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ stage: newStage, notes: notes || '' })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Item moved to ' + newStage, 'success');
                this.closeItemDetail();
                window.location.reload();
              } else {
                this.showToast('Failed to move item: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Kanban] Advance error:', error);
              this.showToast('Failed to move item', 'error');
            }
          },

          // Template Creation
          openCreateTemplateModal: async function() {
            const presetName = prompt('Enter preset name to create (Standard Regulatory Change, Quick Assessment, or Compliance Tracking):');
            if (!presetName) return;

            try {
              const response = await fetch('/api/workflow-templates/from-preset', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ presetName })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Template created successfully', 'success');
                window.location.reload();
              } else {
                this.showToast('Failed to create template: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Kanban] Create template error:', error);
              this.showToast('Failed to create template', 'error');
            }
          },

          // Utilities
          capitalize: function(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
          },

          showToast: function(message, type = 'info') {
            let container = document.querySelector('.toast-container');
            if (!container) {
              container = document.createElement('div');
              container.className = 'toast-container';
              document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.className = 'toast ' + type;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
              toast.remove();
            }, 3000);
          }
        };

        window.KanbanPage = KanbanPage;
        KanbanPage.init();

        // Close modals on escape key
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            KanbanPage.closeAddItemModal();
            KanbanPage.closeItemDetail();
          }
        });

        // Close modal on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              KanbanPage.closeAddItemModal();
              KanbanPage.closeItemDetail();
            }
          });
        });
      })();
    </script>
  `
}

module.exports = { getKanbanScripts }
