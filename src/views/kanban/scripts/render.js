function getRenderSection() {
  return `          // Add Item Modal
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

`
}

module.exports = { getRenderSection }
