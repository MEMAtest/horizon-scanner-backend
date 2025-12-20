const { serializeForScript } = require('../dashboard/helpers')
const { AUTHORITIES, SECTORS } = require('../../constants/dropdownOptions')

function getKanbanScripts({ workflowTemplates, selectedTemplateId, selectedTemplate, itemsByStage, statistics }) {
  const serializedTemplates = serializeForScript(workflowTemplates || [])
  const serializedSelectedTemplate = serializeForScript(selectedTemplate || null)
  const serializedItemsByStage = serializeForScript(itemsByStage || {})
  const serializedStatistics = serializeForScript(statistics || {})
  const serializedAuthorities = serializeForScript(AUTHORITIES)
  const serializedSectors = serializeForScript(SECTORS)

  return `
    <script>
      // Initialize global state
      window.kanbanState = {
        templates: ${serializedTemplates},
        selectedTemplateId: ${JSON.stringify(selectedTemplateId || null)},
        selectedTemplate: ${serializedSelectedTemplate},
        itemsByStage: ${serializedItemsByStage},
        statistics: ${serializedStatistics},
        draggedItemId: null,
        pendingUnlinkItemId: null,
        dropdownOptions: {
          authorities: ${serializedAuthorities},
          sectors: ${serializedSectors}
        }
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

            // Remember last selected workflow for cross-page actions
            try {
              if (state.selectedTemplateId) {
                localStorage.setItem('kanbanLastTemplateId', String(state.selectedTemplateId));
              }
            } catch (error) {
              // ignore storage errors
            }

            this.openItemFromQuery();
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

          openItemFromQuery: async function() {
            const params = new URLSearchParams(window.location.search);
            const openItemId = params.get('openItemId');
            if (!openItemId) return;

            const removeQueryParam = () => {
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('openItemId');
                window.history.replaceState({}, '', url.toString());
              } catch (error) {
                // ignore URL errors
              }
            };

            const highlightCard = (card) => {
              if (!card) return;
              card.classList.add('kanban-card-highlight');
              try {
                card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              } catch (error) {
                card.scrollIntoView();
              }
              setTimeout(() => card.classList.remove('kanban-card-highlight'), 4500);
            };

            const findCard = () => {
              try {
                const escaped = window.CSS && window.CSS.escape ? window.CSS.escape(openItemId) : openItemId.replace(/"/g, '\\"');
                return document.querySelector('.kanban-card[data-item-id="' + escaped + '"]');
              } catch (error) {
                return document.querySelector('.kanban-card[data-item-id="' + openItemId + '"]');
              }
            };

            const card = findCard();
            if (card) {
              highlightCard(card);
              removeQueryParam();
              await this.openItemDetail(openItemId);
              return;
            }

            try {
              const response = await fetch('/api/regulatory-changes/' + encodeURIComponent(openItemId), {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json().catch(() => ({}));
              const item = result && result.success && result.data ? result.data : null;
              const workflowTemplateId = item && (item.workflow_template_id || item.workflowTemplateId);
              if (workflowTemplateId && String(workflowTemplateId) !== String(state.selectedTemplateId || '')) {
                const url = new URL(window.location.href);
                url.searchParams.set('templateId', workflowTemplateId);
                url.searchParams.set('openItemId', openItemId);
                window.location.href = url.toString();
                return;
              }
            } catch (error) {
              console.warn('[Kanban] Failed to validate openItemId template:', error);
            }

            removeQueryParam();
            await this.openItemDetail(openItemId);
            highlightCard(findCard());
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
            this.initializeAddDropdowns('', '');
            document.getElementById('add-item-modal').classList.add('active');
          },

          closeAddItemModal: function() {
            document.getElementById('add-item-modal').classList.remove('active');
            document.getElementById('add-item-form').reset();
          },

          // Single-select dropdown functions for Add Item modal
          initializeAddDropdowns: function(selectedAuthority, selectedSector) {
            const authContainer = document.getElementById('add-authority-dropdown-container');
            const sectorContainer = document.getElementById('add-sector-dropdown-container');

            if (authContainer) {
              authContainer.innerHTML = this.generateSingleSelectDropdown('authority', state.dropdownOptions.authorities, selectedAuthority, 'Select authority...');
            }
            if (sectorContainer) {
              sectorContainer.innerHTML = this.generateSingleSelectDropdown('sector', state.dropdownOptions.sectors, selectedSector, 'Select sector...');
            }
          },

          generateSingleSelectDropdown: function(name, options, selectedValue = '', placeholder = 'Select...') {
            return \`
              <div class="single-select-dropdown" data-name="\${name}">
                <div class="single-select-trigger" onclick="KanbanPage.toggleSingleSelect(this)">
                  <span class="single-select-value">\${selectedValue ? this.escapeHtml(selectedValue) : '<span class="placeholder">' + placeholder + '</span>'}</span>
                  <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div class="single-select-options">
                  <div class="single-select-search">
                    <input type="text" placeholder="Search or add new..." onkeyup="KanbanPage.filterSingleSelectOptions(this, '\${name}')" onkeypress="KanbanPage.handleSingleSelectEnter(event, '\${name}')">
                  </div>
                  <div class="single-select-list">
                    <div class="single-select-option \${!selectedValue ? 'selected' : ''}" data-value="" onclick="KanbanPage.selectSingleOption(this, '\${name}')">
                      <span class="placeholder">None</span>
                    </div>
                    \${options.map(opt => \`
                      <div class="single-select-option \${selectedValue === opt.value ? 'selected' : ''}" data-value="\${this.escapeHtml(opt.value)}" onclick="KanbanPage.selectSingleOption(this, '\${name}')">
                        \${this.escapeHtml(opt.label)}
                      </div>
                    \`).join('')}
                  </div>
                  <div class="single-select-add-new" style="display:none;">
                    <button type="button" class="add-new-btn" onclick="KanbanPage.addNewSingleOption('\${name}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add "<span class="new-value-preview"></span>"
                    </button>
                  </div>
                </div>
                <input type="hidden" name="\${name}" value="\${selectedValue}">
              </div>
            \`;
          },

          toggleSingleSelect: function(trigger) {
            const dropdown = trigger.closest('.single-select-dropdown');
            const wasActive = dropdown.classList.contains('active');

            // Close all other dropdowns
            document.querySelectorAll('.single-select-dropdown.active, .multi-select-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });

            if (!wasActive) {
              dropdown.classList.add('active');
              const searchInput = dropdown.querySelector('.single-select-search input');
              if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
              }
              // Show all options
              dropdown.querySelectorAll('.single-select-option').forEach(opt => {
                opt.style.display = '';
              });
            }
          },

          filterSingleSelectOptions: function(input, name) {
            const dropdown = input.closest('.single-select-dropdown');
            const value = input.value.toLowerCase().trim();
            const options = dropdown.querySelectorAll('.single-select-option');
            const addNewSection = dropdown.querySelector('.single-select-add-new');
            const preview = addNewSection.querySelector('.new-value-preview');
            let hasExactMatch = false;

            options.forEach(opt => {
              const optValue = opt.dataset.value || '';
              const text = opt.textContent.toLowerCase();
              const matches = text.includes(value) || !value;
              opt.style.display = matches ? '' : 'none';
              if (optValue.toLowerCase() === value) hasExactMatch = true;
            });

            // Show "Add new" option if no exact match and there's a value
            if (value && !hasExactMatch) {
              addNewSection.style.display = '';
              preview.textContent = input.value;
            } else {
              addNewSection.style.display = 'none';
            }
          },

          handleSingleSelectEnter: function(event, name) {
            if (event.key === 'Enter') {
              event.preventDefault();
              const dropdown = event.target.closest('.single-select-dropdown');
              const addNewSection = dropdown.querySelector('.single-select-add-new');
              if (addNewSection.style.display !== 'none') {
                this.addNewSingleOption(name);
              }
            }
          },

          selectSingleOption: function(option, name) {
            const dropdown = option.closest('.single-select-dropdown');
            const value = option.dataset.value || '';
            const displayText = value || '<span class="placeholder">Select...</span>';

            // Update hidden input
            dropdown.querySelector('input[type="hidden"]').value = value;

            // Update display
            dropdown.querySelector('.single-select-value').innerHTML = displayText ? this.escapeHtml(value) : '<span class="placeholder">Select...</span>';

            // Mark selected
            dropdown.querySelectorAll('.single-select-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Close dropdown
            dropdown.classList.remove('active');
          },

          addNewSingleOption: function(name) {
            const dropdown = document.querySelector('.single-select-dropdown[data-name="' + name + '"]');
            const input = dropdown.querySelector('.single-select-search input');
            const value = input.value.trim();

            if (!value) return;

            // Add new option to list
            const list = dropdown.querySelector('.single-select-list');
            const newOption = document.createElement('div');
            newOption.className = 'single-select-option selected';
            newOption.dataset.value = value;
            newOption.textContent = value;
            newOption.onclick = function() { KanbanPage.selectSingleOption(this, name); };
            list.appendChild(newOption);

            // Update hidden input and display
            dropdown.querySelector('input[type="hidden"]').value = value;
            dropdown.querySelector('.single-select-value').textContent = value;

            // Mark as selected, unmark others
            dropdown.querySelectorAll('.single-select-option').forEach(opt => opt.classList.remove('selected'));
            newOption.classList.add('selected');

            // Clear search and close
            input.value = '';
            dropdown.querySelector('.single-select-add-new').style.display = 'none';
            dropdown.classList.remove('active');

            // Save to localStorage for persistence
            this.saveCustomOption(name, value);
          },

          saveCustomOption: function(fieldName, value) {
            const key = 'customOptions_' + fieldName;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            if (!existing.includes(value)) {
              existing.push(value);
              localStorage.setItem(key, JSON.stringify(existing));
            }
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
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a href="\${item.source_url}" target="_blank" class="btn btn-secondary btn-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      View Source
                    </a>
                    <button type="button"
                            class="btn btn-secondary btn-sm kanban-bookmark-btn"
                            data-bookmark-url="\${this.escapeHtml(item.source_url)}"
                            data-bookmark-title="\${this.escapeHtml(item.title || '')}"
                            data-bookmark-authority="\${this.escapeHtml(item.authority || '')}"
                            data-bookmark-update-id="\${this.escapeHtml(item.regulatory_update_id || '')}"
                            aria-pressed="false"
                            title="Bookmark">
                      ☆ Bookmark
                    </button>
                  </div>
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

              <div class="detail-section" style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
                <h3 class="detail-section-title" style="display: flex; align-items: center; gap: 8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Connected Items
                </h3>
                <div id="kanban-linked-items-container" style="margin-bottom: 12px;">
                  <div style="text-align: center; padding: 20px; color: #6b7280;">Loading connections...</div>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  \${item.regulatory_update_id ? \`
                  <button class="btn btn-danger-outline btn-sm" onclick="KanbanPage.confirmUnlinkSource('\${item.id}', '\${this.escapeHtml(item.title).replace(/'/g, "\\\\'")}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                    Unlink Source
                  </button>
                  \` : ''}
                  <button class="btn btn-secondary btn-sm" onclick="KanbanPage.openLinkDossierModal('\${item.id}', \${item.regulatory_update_id || 'null'})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    Link to Dossier
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="KanbanPage.openLinkPolicyModal('\${item.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    Link to Policy
                  </button>
                </div>
              </div>
            \`;

            this.bindBookmarkButton(item);

            // Load all linked items
            this.loadAllLinkedItems(item.id);

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

          getPinnedUrlSet: function() {
            try {
              if (window.WorkspaceModule && typeof WorkspaceModule.getPinnedUrls === 'function') {
                return new Set(WorkspaceModule.getPinnedUrls().map(String));
              }
            } catch (error) {
              // Ignore
            }
            if (Array.isArray(window.__workspacePinnedUrls)) {
              return new Set(window.__workspacePinnedUrls.map(String));
            }
            return new Set();
          },

          getPinnedUpdateIdSet: function() {
            try {
              if (window.WorkspaceModule && typeof WorkspaceModule.getPinnedUpdateIds === 'function') {
                return new Set(WorkspaceModule.getPinnedUpdateIds().map(String));
              }
            } catch (error) {
              // Ignore
            }
            if (Array.isArray(window.__workspacePinnedUpdateIds)) {
              return new Set(window.__workspacePinnedUpdateIds.map(String));
            }
            return new Set();
          },

          setBookmarkButtonState: function(button, bookmarked) {
            if (!button) return;
            button.classList.toggle('is-bookmarked', bookmarked);
            button.setAttribute('aria-pressed', bookmarked ? 'true' : 'false');
            button.textContent = bookmarked ? '★ Bookmarked' : '☆ Bookmark';
            button.title = bookmarked ? 'Remove bookmark' : 'Bookmark';
          },

          syncBookmarkButton: function(button) {
            if (!button) return;
            const url = String(button.dataset.bookmarkUrl || '').trim();
            const pinned = this.getPinnedUrlSet();
            const updateId = String(button.dataset.bookmarkUpdateId || '').trim();
            const pinnedIds = this.getPinnedUpdateIdSet();
            this.setBookmarkButtonState(button, (!!url && pinned.has(url)) || (!!updateId && pinnedIds.has(updateId)));
          },

          bindBookmarkButton: function(item) {
            const button = document.querySelector('#detail-modal-body .kanban-bookmark-btn');
            if (!button) return;

            if (button.dataset.bound === 'true') {
              this.syncBookmarkButton(button);
              return;
            }

            button.dataset.bound = 'true';
            this.syncBookmarkButton(button);

            button.addEventListener('click', async (event) => {
              event.preventDefault();
              event.stopPropagation();

              const url = String(button.dataset.bookmarkUrl || '').trim();
              if (!url) {
                this.showToast('Source URL missing', 'error');
                return;
              }

              if (!window.WorkspaceModule || typeof WorkspaceModule.togglePin !== 'function') {
                this.showToast('Bookmarks not ready yet', 'error');
                return;
              }

              button.disabled = true;
              try {
                const title = button.dataset.bookmarkTitle || (item && item.title) || 'Regulatory Change';
                const authority = button.dataset.bookmarkAuthority || (item && item.authority) || 'Unknown';
                const updateId = button.dataset.bookmarkUpdateId
                  || (item && (item.regulatory_update_id || item.regulatoryUpdateId))
                  || null;

                await WorkspaceModule.togglePin(url, title, authority, { updateId, authority });
              } catch (error) {
                console.error('[Kanban] Bookmark toggle error:', error);
                this.showToast('Failed to update bookmark', 'error');
              } finally {
                button.disabled = false;
                this.syncBookmarkButton(button);
              }
            });
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

          // Policy Linking
          currentItemForPolicy: null,

          loadAllLinkedItems: async function(itemId) {
            const container = document.getElementById('kanban-linked-items-container');
            if (!container) return;

            try {
              const response = await fetch('/api/regulatory-changes/' + itemId + '/linked-items', {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json();

              if (!result.success) {
                container.innerHTML = '<p style="color: #ef4444;">Failed to load connections</p>';
                return;
              }

              const { watchLists, dossiers, policies, summary } = result.data;
              const totalLinked = (summary.totalWatchLists || 0) + (summary.totalDossiers || 0) + (summary.totalPolicies || 0);

              if (totalLinked === 0) {
                container.innerHTML = '<p style="color: #6b7280; font-size: 13px;">No connections yet. Link this item to policies to establish relationships.</p>';
                return;
              }

              let html = '<div class="linked-items-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">';

              // Watch Lists Section (purple theme)
              if (watchLists && watchLists.length > 0) {
                html += '<div class="linked-category" style="background: #faf5ff; border-radius: 8px; padding: 10px;">' +
                  '<div style="font-weight: 600; color: #7c3aed; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                      '<path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>' +
                      '<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>' +
                    '</svg>' +
                    'Watch Lists (' + watchLists.length + ')' +
                  '</div>' +
                  '<div style="display: flex; flex-direction: column; gap: 4px;">';

                watchLists.slice(0, 3).forEach(function(wl) {
                  html += '<a href="/watch-lists" style="display: block; padding: 4px 6px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 12px;">' +
                    this.escapeHtml(wl.name) +
                  '</a>';
                }.bind(this));

                if (watchLists.length > 3) {
                  html += '<div style="font-size: 11px; color: #6b7280; padding: 2px 6px;">+' + (watchLists.length - 3) + ' more</div>';
                }
                html += '</div></div>';
              }

              // Dossiers Section (green theme)
              if (dossiers && dossiers.length > 0) {
                html += '<div class="linked-category" style="background: #f0fdf4; border-radius: 8px; padding: 10px;">' +
                  '<div style="font-weight: 600; color: #166534; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>' +
                      '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>' +
                    '</svg>' +
                    'Dossiers (' + dossiers.length + ')' +
                  '</div>' +
                  '<div style="display: flex; flex-direction: column; gap: 4px;">';

                dossiers.slice(0, 3).forEach(function(dossier) {
                  html += '<a href="/dossiers" style="display: block; padding: 4px 6px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 12px;">' +
                    this.escapeHtml(dossier.name) +
                  '</a>';
                }.bind(this));

                if (dossiers.length > 3) {
                  html += '<div style="font-size: 11px; color: #6b7280; padding: 2px 6px;">+' + (dossiers.length - 3) + ' more</div>';
                }
                html += '</div></div>';
              }

              // Policies Section (blue theme)
              if (policies && policies.length > 0) {
                html += '<div class="linked-category" style="background: #eff6ff; border-radius: 8px; padding: 10px;">' +
                  '<div style="font-weight: 600; color: #2563eb; margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px;">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
                      '<polyline points="14 2 14 8 20 8"></polyline>' +
                      '<line x1="16" y1="13" x2="8" y2="13"></line>' +
                      '<line x1="16" y1="17" x2="8" y2="17"></line>' +
                    '</svg>' +
                    'Policies (' + policies.length + ')' +
                  '</div>' +
                  '<div style="display: flex; flex-direction: column; gap: 4px;">';

                policies.slice(0, 3).forEach(function(policy) {
                  html += '<a href="/policies" style="display: block; padding: 4px 6px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 12px;">' +
                    this.escapeHtml(policy.name) +
                    '<span style="color: #9ca3af; margin-left: 4px; text-transform: capitalize;">(' + (policy.status || 'draft') + ')</span>' +
                  '</a>';
                }.bind(this));

                if (policies.length > 3) {
                  html += '<div style="font-size: 11px; color: #6b7280; padding: 2px 6px;">+' + (policies.length - 3) + ' more</div>';
                }
                html += '</div></div>';
              }

              html += '</div>';
              container.innerHTML = html;
            } catch (error) {
              console.error('[Kanban] Load linked items error:', error);
              container.innerHTML = '<p style="color: #ef4444;">Error loading connections</p>';
            }
          },

          loadLinkedPolicies: async function(itemId) {
            const container = document.getElementById('linked-policies-container');
            if (!container) return;

            try {
              // Fetch citations that reference this regulatory change
              const response = await fetch('/api/policies?has_citations=true', {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json();

              if (!result.success) {
                container.innerHTML = '<p class="no-policies">Failed to load policies</p>';
                return;
              }

              // Filter policies that have citations referencing this item
              const linkedPolicies = [];
              for (const policy of (result.data || [])) {
                if (policy.citations && policy.citations.length > 0) {
                  const matching = policy.citations.filter(c => c.regulatory_change_id === itemId);
                  if (matching.length > 0) {
                    linkedPolicies.push({ policy, citations: matching });
                  }
                }
              }

              if (linkedPolicies.length === 0) {
                container.innerHTML = '<p class="no-policies">No policies linked yet</p>';
                return;
              }

              container.innerHTML = linkedPolicies.map(({ policy, citations }) => \`
                <div class="linked-policy-item">
                  <div class="linked-policy-info">
                    <span class="linked-policy-name">\${this.escapeHtml(policy.name)}</span>
                    <span class="linked-policy-version">v\${policy.current_version || '1.0.0'}</span>
                  </div>
                  <div class="linked-policy-meta">
                    \${citations.length} citation\${citations.length !== 1 ? 's' : ''}
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('[Kanban] Load linked policies error:', error);
              container.innerHTML = '<p class="no-policies">Error loading policies</p>';
            }
          },

          openLinkPolicyModal: function(itemId) {
            this.currentItemForPolicy = itemId;
            this.createPolicyModal();
            this.loadPoliciesForSelection();
            document.getElementById('kanban-policy-modal').classList.add('active');
          },

          closeLinkPolicyModal: function() {
            const modal = document.getElementById('kanban-policy-modal');
            if (modal) modal.classList.remove('active');
            this.currentItemForPolicy = null;
          },

          createPolicyModal: function() {
            if (document.getElementById('kanban-policy-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'kanban-policy-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = \`
              <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                  <h2 class="modal-title">Link to Policy</h2>
                  <button class="modal-close" onclick="KanbanPage.closeLinkPolicyModal()">&times;</button>
                </div>
                <div class="modal-body">
                  <div id="policy-list-container" class="policy-selector-list">
                    <div class="loading-spinner">Loading policies...</div>
                  </div>
                  <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">Citation Notes (optional)</label>
                    <textarea id="policy-citation-notes" class="form-input" rows="2" placeholder="Add context for why this is relevant..."></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onclick="KanbanPage.closeLinkPolicyModal()">Cancel</button>
                </div>
              </div>
            \`;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
              if (e.target === modal) this.closeLinkPolicyModal();
            });
          },

          loadPoliciesForSelection: async function() {
            const container = document.getElementById('policy-list-container');
            if (!container) return;

            try {
              const response = await fetch('/api/policies', {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json();

              if (!result.success || !result.data || result.data.length === 0) {
                container.innerHTML = \`
                  <div class="empty-state">
                    <p>No policies available</p>
                    <a href="/policies" class="btn btn-primary btn-sm" style="margin-top: 12px;">Create Policy</a>
                  </div>
                \`;
                return;
              }

              container.innerHTML = result.data.map(policy => \`
                <div class="policy-selector-item" onclick="KanbanPage.selectPolicyForLink('\${policy.id}')">
                  <div class="policy-selector-info">
                    <span class="policy-selector-name">\${this.escapeHtml(policy.name)}</span>
                    <span class="policy-selector-category">\${this.escapeHtml(policy.category || 'General')}</span>
                  </div>
                  <div class="policy-selector-meta">
                    <span class="policy-version-badge">v\${policy.current_version || '1.0.0'}</span>
                    <span class="policy-status-badge \${policy.status || 'draft'}">\${this.capitalize(policy.status || 'Draft')}</span>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('[Kanban] Load policies error:', error);
              container.innerHTML = '<p class="error-text">Failed to load policies</p>';
            }
          },

          selectPolicyForLink: async function(policyId) {
            if (!this.currentItemForPolicy || !policyId) return;

            const notes = document.getElementById('policy-citation-notes')?.value || '';

            try {
              const response = await fetch('/api/policies/' + policyId + '/citations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({
                  regulatory_change_id: this.currentItemForPolicy,
                  citation_text: notes || 'Linked from Kanban board',
                  section_reference: ''
                })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Policy linked successfully', 'success');
                this.closeLinkPolicyModal();
                // Refresh the linked policies list
                this.loadLinkedPolicies(this.currentItemForPolicy);
              } else {
                this.showToast('Failed to link policy: ' + (result.error || 'Unknown error'), 'error');
              }
            } catch (error) {
              console.error('[Kanban] Link policy error:', error);
              this.showToast('Failed to link policy', 'error');
            }
          },

          // Dossier Linking
          currentItemForDossier: null,
          currentUpdateIdForDossier: null,

          openLinkDossierModal: function(itemId, updateId) {
            this.currentItemForDossier = itemId;
            this.currentUpdateIdForDossier = updateId;
            this.createDossierModal();
            this.loadDossiersForSelection();
            document.getElementById('kanban-dossier-modal').classList.add('active');
          },

          closeLinkDossierModal: function() {
            const modal = document.getElementById('kanban-dossier-modal');
            if (modal) modal.classList.remove('active');
            this.currentItemForDossier = null;
            this.currentUpdateIdForDossier = null;
          },

          createDossierModal: function() {
            if (document.getElementById('kanban-dossier-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'kanban-dossier-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = \`
              <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                  <h2 class="modal-title">Link to Research Dossier</h2>
                  <button class="modal-close" onclick="KanbanPage.closeLinkDossierModal()">&times;</button>
                </div>
                <div class="modal-body">
                  <div id="dossier-list-container" class="dossier-selector-list">
                    <div class="loading-spinner">Loading dossiers...</div>
                  </div>
                  <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">Notes (optional)</label>
                    <textarea id="dossier-link-notes" class="form-input" rows="2" placeholder="Add context for why this is relevant..."></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onclick="KanbanPage.closeLinkDossierModal()">Cancel</button>
                </div>
              </div>
            \`;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
              if (e.target === modal) this.closeLinkDossierModal();
            });
          },

          loadDossiersForSelection: async function() {
            const container = document.getElementById('dossier-list-container');
            if (!container) return;

            try {
              const response = await fetch('/api/dossiers', {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json();

              if (!result.success || !result.data || result.data.length === 0) {
                container.innerHTML = \`
                  <div class="empty-state">
                    <p>No dossiers available</p>
                    <a href="/dossiers" class="btn btn-primary btn-sm" style="margin-top: 12px;">Create Dossier</a>
                  </div>
                \`;
                return;
              }

              container.innerHTML = result.data.map(dossier => \`
                <div class="dossier-selector-item" onclick="KanbanPage.selectDossierForLink('\${dossier.id}')">
                  <div class="dossier-selector-info">
                    <span class="dossier-selector-name">\${this.escapeHtml(dossier.name)}</span>
                    <span class="dossier-selector-topic">\${this.escapeHtml(dossier.topic || 'No topic')}</span>
                  </div>
                  <div class="dossier-selector-meta">
                    <span class="dossier-item-count">\${dossier.item_count || 0} items</span>
                    <span class="dossier-status-badge \${dossier.status || 'active'}">\${this.capitalize(dossier.status || 'Active')}</span>
                  </div>
                </div>
              \`).join('');
            } catch (error) {
              console.error('[Kanban] Load dossiers error:', error);
              container.innerHTML = '<p class="error-text">Failed to load dossiers</p>';
            }
          },

          selectDossierForLink: async function(dossierId) {
            if (!dossierId) return;

            const notes = document.getElementById('dossier-link-notes')?.value || '';

            try {
              // If we have a regulatory_update_id, use that to link
              // Otherwise, we need to create a link with just item reference
              const body = {
                notes: notes || 'Linked from Kanban board'
              };

              if (this.currentUpdateIdForDossier && this.currentUpdateIdForDossier !== 'null') {
                body.regulatory_update_id = this.currentUpdateIdForDossier;
              } else {
                // If no regulatory_update_id, we can still add the item with a reference
                body.title = 'Regulatory Change Item';
                body.source = 'Kanban Board';
              }

              const response = await fetch('/api/dossiers/' + dossierId + '/items', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify(body)
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Dossier linked successfully', 'success');
                this.closeLinkDossierModal();
                // Refresh the linked items
                if (this.currentItemForDossier) {
                  this.loadAllLinkedItems(this.currentItemForDossier);
                }
              } else {
                this.showToast('Failed to link dossier: ' + (result.error || 'Unknown error'), 'error');
              }
            } catch (error) {
              console.error('[Kanban] Link dossier error:', error);
              this.showToast('Failed to link dossier', 'error');
            }
          },

          escapeHtml: function(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
          },

          // Unlink Confirmation
          confirmUnlinkSource: function(itemId, itemTitle) {
            state.pendingUnlinkItemId = itemId;
            this.createUnlinkConfirmModal(itemTitle);
          },

          createUnlinkConfirmModal: function(itemTitle) {
            let modal = document.getElementById('unlink-confirm-modal');
            if (!modal) {
              modal = document.createElement('div');
              modal.id = 'unlink-confirm-modal';
              modal.className = 'modal-overlay';
              modal.innerHTML =
                '<div class="modal" style="max-width: 400px;">' +
                  '<div class="modal-header">' +
                    '<h3 style="color: #dc2626; margin: 0;">Confirm Unlink</h3>' +
                    '<button class="close-btn" onclick="KanbanPage.closeUnlinkConfirmModal()">&times;</button>' +
                  '</div>' +
                  '<div class="modal-content">' +
                    '<p id="unlink-confirm-message" style="margin: 0 0 20px 0; color: #374151;"></p>' +
                    '<div style="display: flex; gap: 12px; justify-content: flex-end;">' +
                      '<button class="btn btn-secondary" onclick="KanbanPage.closeUnlinkConfirmModal()">Cancel</button>' +
                      '<button class="btn btn-danger" onclick="KanbanPage.unlinkSource()">Unlink</button>' +
                    '</div>' +
                  '</div>' +
                '</div>';
              document.body.appendChild(modal);
            }
            document.getElementById('unlink-confirm-message').textContent =
              'Are you sure you want to unlink the source regulatory update from "' + itemTitle + '"? This will break the connection to the original update but keep the regulatory change item.';
            modal.classList.add('active');
          },

          closeUnlinkConfirmModal: function() {
            const modal = document.getElementById('unlink-confirm-modal');
            if (modal) modal.classList.remove('active');
            state.pendingUnlinkItemId = null;
          },

          unlinkSource: async function() {
            const itemId = state.pendingUnlinkItemId;
            if (!itemId) return;

            try {
              const response = await fetch('/api/regulatory-changes/' + itemId + '/link', {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Source unlinked successfully', 'success');
                this.closeUnlinkConfirmModal();
                // Close the detail modal and refresh the page
                this.closeItemDetail();
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Kanban] Unlink error:', error);
              this.showToast('Failed to unlink source', 'error');
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
            KanbanPage.closeLinkPolicyModal();
            KanbanPage.closeLinkDossierModal();
            KanbanPage.closeUnlinkConfirmModal();
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

        // Close unlink confirm modal on overlay click (dynamic modal)
        document.addEventListener('click', function(e) {
          if (e.target.id === 'unlink-confirm-modal') {
            KanbanPage.closeUnlinkConfirmModal();
          }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.single-select-dropdown') && !e.target.closest('.multi-select-dropdown')) {
            document.querySelectorAll('.single-select-dropdown.active, .multi-select-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });
          }
        });
      })();
    </script>
  `
}

module.exports = { getKanbanScripts }
