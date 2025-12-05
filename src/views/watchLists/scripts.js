const { serializeForScript } = require('../dashboard/helpers')
const { AUTHORITIES, SECTORS, getDropdownScripts } = require('../../constants/dropdownOptions')

function getWatchListScripts({ watchLists, stats }) {
  const serializedWatchLists = serializeForScript(watchLists || [])
  const serializedStats = serializeForScript(stats || {})
  const serializedAuthorities = serializeForScript(AUTHORITIES)
  const serializedSectors = serializeForScript(SECTORS)

  return `
    <script>
      window.watchListState = {
        watchLists: ${serializedWatchLists},
        stats: ${serializedStats},
        currentWatchListId: null,
        currentLinkType: null,
        currentUpdateId: null,
        pendingUnlinkMatchId: null,
        tags: {
          keywords: [],
          authorities: [],
          sectors: []
        },
        dropdownOptions: {
          authorities: ${serializedAuthorities},
          sectors: ${serializedSectors}
        }
      };
    </script>
    <script>
      (function() {
        const state = window.watchListState;

        const WatchListPage = {
          init: function() {
            console.log('[WatchLists] Initialized with', state.watchLists.length, 'watch lists');
          },

          // Modal Management
          openCreateModal: function() {
            this.resetForm();
            this.initializeDropdowns([], []);
            document.getElementById('modal-title').textContent = 'Create Watch List';
            document.getElementById('submit-btn').textContent = 'Create Watch List';
            document.getElementById('create-modal').classList.add('active');
          },

          closeModal: function() {
            document.getElementById('create-modal').classList.remove('active');
            this.resetForm();
          },

          resetForm: function() {
            document.getElementById('watch-list-form').reset();
            document.getElementById('watch-list-id').value = '';
            state.tags = { keywords: [], authorities: [], sectors: [] };
            this.renderTags('keywords');
          },

          initializeDropdowns: function(selectedAuthorities = [], selectedSectors = []) {
            const authoritiesContainer = document.getElementById('authorities-dropdown-container');
            const sectorsContainer = document.getElementById('sectors-dropdown-container');

            if (authoritiesContainer) {
              authoritiesContainer.innerHTML = this.generateMultiSelectDropdown('authorities', state.dropdownOptions.authorities, selectedAuthorities, 'Select authorities...');
            }
            if (sectorsContainer) {
              sectorsContainer.innerHTML = this.generateMultiSelectDropdown('sectors', state.dropdownOptions.sectors, selectedSectors, 'Select sectors...');
            }
          },

          generateMultiSelectDropdown: function(name, options, selectedValues = [], placeholder = 'Select options...') {
            const selectedSet = new Set(selectedValues);

            return \`
              <div class="multi-select-dropdown" data-name="\${name}">
                <div class="multi-select-trigger" onclick="WatchListPage.toggleMultiSelect(this)">
                  <div class="multi-select-selected">
                    \${selectedValues.length > 0
                      ? selectedValues.map(v => \`<span class="selected-tag">\${this.escapeHtml(v)}<button type="button" onclick="WatchListPage.removeMultiSelectValue(event, '\${name}', '\${this.escapeHtml(v)}')">&times;</button></span>\`).join('')
                      : \`<span class="placeholder">\${placeholder}</span>\`
                    }
                  </div>
                  <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <div class="multi-select-options">
                  <div class="multi-select-search">
                    <input type="text" placeholder="Search or add new..." onkeyup="WatchListPage.filterMultiSelectOptions(this, '\${name}')" onkeypress="WatchListPage.handleMultiSelectEnter(event, '\${name}')">
                  </div>
                  <div class="multi-select-list">
                    \${options.map(opt => \`
                      <label class="multi-select-option \${selectedSet.has(opt.value) ? 'selected' : ''}">
                        <input type="checkbox" value="\${this.escapeHtml(opt.value)}" \${selectedSet.has(opt.value) ? 'checked' : ''} onchange="WatchListPage.toggleMultiSelectOption(this, '\${name}')">
                        <span>\${this.escapeHtml(opt.label)}</span>
                      </label>
                    \`).join('')}
                  </div>
                  <div class="multi-select-add-new" style="display:none;">
                    <button type="button" class="add-new-btn" onclick="WatchListPage.addNewMultiSelectOption('\${name}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add "<span class="new-value-preview"></span>"
                    </button>
                  </div>
                </div>
                <input type="hidden" name="\${name}" value="\${selectedValues.join(',')}">
              </div>
            \`;
          },

          toggleMultiSelect: function(trigger) {
            const dropdown = trigger.closest('.multi-select-dropdown');
            const wasActive = dropdown.classList.contains('active');

            // Close all other dropdowns
            document.querySelectorAll('.multi-select-dropdown.active, .single-select-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });

            if (!wasActive) {
              dropdown.classList.add('active');
              const searchInput = dropdown.querySelector('.multi-select-search input');
              if (searchInput) searchInput.focus();
            }
          },

          filterMultiSelectOptions: function(input, name) {
            const dropdown = input.closest('.multi-select-dropdown');
            const value = input.value.toLowerCase().trim();
            const options = dropdown.querySelectorAll('.multi-select-option');
            const addNewSection = dropdown.querySelector('.multi-select-add-new');
            const preview = addNewSection.querySelector('.new-value-preview');
            let hasExactMatch = false;

            options.forEach(opt => {
              const text = opt.textContent.toLowerCase();
              const matches = text.includes(value) || !value;
              opt.style.display = matches ? '' : 'none';
              if (opt.querySelector('input').value.toLowerCase() === value) hasExactMatch = true;
            });

            // Show "Add new" option if no exact match and there's a value
            if (value && !hasExactMatch) {
              addNewSection.style.display = '';
              preview.textContent = input.value;
            } else {
              addNewSection.style.display = 'none';
            }
          },

          handleMultiSelectEnter: function(event, name) {
            if (event.key === 'Enter') {
              event.preventDefault();
              const dropdown = event.target.closest('.multi-select-dropdown');
              const addNewSection = dropdown.querySelector('.multi-select-add-new');
              if (addNewSection.style.display !== 'none') {
                this.addNewMultiSelectOption(name);
              }
            }
          },

          toggleMultiSelectOption: function(checkbox, name) {
            const dropdown = checkbox.closest('.multi-select-dropdown');
            this.updateMultiSelectDisplay(dropdown);
          },

          removeMultiSelectValue: function(event, name, value) {
            event.stopPropagation();
            const dropdown = document.querySelector('.multi-select-dropdown[data-name="' + name + '"]');
            const checkbox = dropdown.querySelector('input[type="checkbox"][value="' + value + '"]');
            if (checkbox) {
              checkbox.checked = false;
            }
            this.updateMultiSelectDisplay(dropdown);
          },

          updateMultiSelectDisplay: function(dropdown) {
            const selectedContainer = dropdown.querySelector('.multi-select-selected');
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            const checkboxes = dropdown.querySelectorAll('.multi-select-list input[type="checkbox"]:checked');
            const name = dropdown.dataset.name;

            const values = Array.from(checkboxes).map(cb => cb.value);

            if (values.length > 0) {
              selectedContainer.innerHTML = values.map(v =>
                '<span class="selected-tag">' + this.escapeHtml(v) + '<button type="button" onclick="WatchListPage.removeMultiSelectValue(event, \\'' + name + '\\', \\'' + this.escapeHtml(v) + '\\')">&times;</button></span>'
              ).join('');
            } else {
              selectedContainer.innerHTML = '<span class="placeholder">Select options...</span>';
            }

            hiddenInput.value = values.join(',');
          },

          addNewMultiSelectOption: function(name) {
            const dropdown = document.querySelector('.multi-select-dropdown[data-name="' + name + '"]');
            const input = dropdown.querySelector('.multi-select-search input');
            const value = input.value.trim();

            if (!value) return;

            // Add new option to list
            const list = dropdown.querySelector('.multi-select-list');
            const newOption = document.createElement('label');
            newOption.className = 'multi-select-option selected';
            newOption.dataset.custom = value;
            newOption.innerHTML = '<input type="checkbox" value="' + this.escapeHtml(value) + '" checked onchange="WatchListPage.toggleMultiSelectOption(this, \\'' + name + '\\')"><span>' + this.escapeHtml(value) + '</span>';
            list.appendChild(newOption);

            // Clear search and update display
            input.value = '';
            dropdown.querySelector('.multi-select-add-new').style.display = 'none';
            this.updateMultiSelectDisplay(dropdown);

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

          getSelectedDropdownValues: function(name) {
            const dropdown = document.querySelector('.multi-select-dropdown[data-name="' + name + '"]');
            if (!dropdown) return [];
            const checkboxes = dropdown.querySelectorAll('.multi-select-list input[type="checkbox"]:checked');
            return Array.from(checkboxes).map(cb => cb.value);
          },

          // Tag Input Handling
          handleTagInput: function(event, type) {
            if (event.key === 'Enter') {
              event.preventDefault();
              const input = event.target;
              const value = input.value.trim();
              if (value && !state.tags[type].includes(value)) {
                state.tags[type].push(value);
                this.renderTags(type);
              }
              input.value = '';
            }
          },

          renderTags: function(type) {
            const container = document.getElementById(type + '-container');
            const input = document.getElementById(type + '-input');
            const hidden = document.getElementById(type);

            // Remove existing tags
            container.querySelectorAll('.tag').forEach(t => t.remove());

            // Add new tags before the input
            state.tags[type].forEach((tag, index) => {
              const tagEl = document.createElement('span');
              tagEl.className = 'tag';
              tagEl.innerHTML = tag + ' <span class="remove" onclick="WatchListPage.removeTag(\\'' + type + '\\', ' + index + ')">&times;</span>';
              container.insertBefore(tagEl, input);
            });

            // Update hidden field
            hidden.value = JSON.stringify(state.tags[type]);
          },

          removeTag: function(type, index) {
            state.tags[type].splice(index, 1);
            this.renderTags(type);
          },

          // Form Submission
          handleSubmit: async function(event) {
            event.preventDefault();
            const form = event.target;
            const id = document.getElementById('watch-list-id').value;
            const isEdit = !!id;

            const data = {
              name: form.name.value,
              description: form.description.value,
              keywords: state.tags.keywords,
              authorities: this.getSelectedDropdownValues('authorities'),
              sectors: this.getSelectedDropdownValues('sectors'),
              alertThreshold: parseFloat(form.alertThreshold.value),
              alertOnMatch: form.alertOnMatch.checked
            };

            try {
              const url = isEdit ? '/api/watch-lists/' + id : '/api/watch-lists';
              const method = isEdit ? 'PUT' : 'POST';

              const response = await fetch(url, {
                method: method,
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify(data)
              });

              const result = await response.json();
              if (result.success) {
                this.showToast(isEdit ? 'Watch list updated' : 'Watch list created', 'success');
                this.closeModal();
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[WatchLists] Submit error:', error);
              this.showToast('Failed to save watch list', 'error');
            }
          },

          // Edit Watch List
          editWatchList: async function(id) {
            const watchList = state.watchLists.find(wl => wl.id === id);
            if (!watchList) return;

            document.getElementById('watch-list-id').value = id;
            document.getElementById('name').value = watchList.name || '';
            document.getElementById('description').value = watchList.description || '';
            document.getElementById('alert-threshold').value = watchList.alert_threshold || 0.5;
            document.getElementById('alert-on-match').checked = watchList.alert_on_match !== false;

            state.tags.keywords = watchList.keywords || [];
            this.renderTags('keywords');

            // Initialize dropdowns with existing values
            this.initializeDropdowns(
              watchList.authorities || [],
              watchList.sectors || []
            );

            document.getElementById('modal-title').textContent = 'Edit Watch List';
            document.getElementById('submit-btn').textContent = 'Save Changes';
            document.getElementById('create-modal').classList.add('active');
          },

          // Delete Watch List
          deleteWatchList: async function(id) {
            if (!confirm('Are you sure you want to delete this watch list?')) return;

            try {
              const response = await fetch('/api/watch-lists/' + id, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Watch list deleted', 'success');
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[WatchLists] Delete error:', error);
              this.showToast('Failed to delete watch list', 'error');
            }
          },

          // Toggle Alerts
          toggleAlerts: async function(id, enabled) {
            try {
              const response = await fetch('/api/watch-lists/' + id, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ alertOnMatch: enabled })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Alerts ' + (enabled ? 'enabled' : 'disabled'), 'success');
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[WatchLists] Toggle error:', error);
              this.showToast('Failed to update alerts', 'error');
            }
          },

          // Matches Modal
          viewMatches: async function(id) {
            state.currentWatchListId = id;
            const watchList = state.watchLists.find(wl => wl.id === id);
            document.getElementById('matches-modal-title').textContent =
              'Matches: ' + (watchList ? watchList.name : 'Watch List');
            document.getElementById('matches-modal').classList.add('active');

            // Reset linked items section
            document.getElementById('linked-items-section').style.display = 'none';

            try {
              // Fetch matches and linked items in parallel
              const [matchesResponse, linkedResponse] = await Promise.all([
                fetch('/api/watch-lists/' + id + '/matches', {
                  headers: { 'x-user-id': 'default' }
                }),
                fetch('/api/watch-lists/' + id + '/linked-items', {
                  headers: { 'x-user-id': 'default' }
                })
              ]);

              const matchesResult = await matchesResponse.json();
              const linkedResult = await linkedResponse.json();

              if (matchesResult.success) {
                this.renderMatches(matchesResult.data);
              } else {
                document.getElementById('matches-content').innerHTML =
                  '<div style="text-align: center; color: #ef4444;">Error loading matches</div>';
              }

              // Render linked items if any
              if (linkedResult.success) {
                this.renderLinkedItems(linkedResult.data);
              }
            } catch (error) {
              console.error('[WatchLists] Load matches error:', error);
              document.getElementById('matches-content').innerHTML =
                '<div style="text-align: center; color: #ef4444;">Failed to load matches</div>';
            }
          },

          renderMatches: function(matches) {
            if (!matches || matches.length === 0) {
              document.getElementById('matches-content').innerHTML =
                '<div style="text-align: center; padding: 40px; color: #6b7280;">No matches found yet</div>';
              return;
            }

            const html = matches.map(match => {
              const scoreClass = match.match_score >= 0.7 ? 'high' : 'medium';
              const scorePercent = Math.round(match.match_score * 100);
              return \`
                <div class="match-item" data-id="\${match.id}">
                  <div class="match-header">
                    <div class="match-title">\${this.escapeHtml(match.update_title || 'Untitled')}</div>
                    <span class="match-score \${scoreClass}">\${scorePercent}% match</span>
                  </div>
                  <div class="match-meta">
                    \${match.update_source || 'Unknown source'} &bull;
                    \${match.matched_at ? new Date(match.matched_at).toLocaleDateString() : 'Unknown date'}
                    \${match.reviewed ? ' &bull; <span style="color: #10b981;">Reviewed</span>' : ''}
                  </div>
                  <div class="match-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.location.href='/dashboard?highlight=\${match.regulatory_update_id}'">
                      View Update
                    </button>
                    \${!match.reviewed ? \`
                      <button class="btn btn-secondary btn-sm" onclick="WatchListPage.markReviewed('\${match.id}')">
                        Mark Reviewed
                      </button>
                    \` : ''}
                    <button class="btn btn-danger-outline btn-sm" onclick="WatchListPage.confirmUnlinkMatch('\${match.id}', '\${this.escapeHtml(match.update_title || 'this match')}')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                      </svg>
                      Unlink
                    </button>
                    <div class="link-dropdown">
                      <button class="btn btn-secondary btn-sm link-btn" onclick="WatchListPage.toggleLinkDropdown(this)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Link to...
                      </button>
                      <div class="link-dropdown-menu">
                        <button onclick="WatchListPage.openLinkModal('dossier', '\${match.regulatory_update_id}')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          Research Dossier
                        </button>
                        <button onclick="WatchListPage.openLinkModal('policy', '\${match.regulatory_update_id}')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <path d="M9 15h6"></path><path d="M9 11h6"></path>
                          </svg>
                          Policy
                        </button>
                        <button onclick="WatchListPage.openLinkModal('kanban', '\${match.regulatory_update_id}')">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="3" x2="9" y2="21"></line>
                            <line x1="15" y1="3" x2="15" y2="21"></line>
                          </svg>
                          Regulatory Change
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
            }).join('');

            document.getElementById('matches-content').innerHTML = html;
          },

          closeMatchesModal: function() {
            document.getElementById('matches-modal').classList.remove('active');
            state.currentWatchListId = null;
          },

          renderLinkedItems: function(data) {
            const { dossiers, policies, kanbanItems, summary } = data;
            const totalLinked = (summary.totalDossiers || 0) + (summary.totalPolicies || 0) + (summary.totalKanbanItems || 0);

            // Only show section if there are linked items
            if (totalLinked === 0) {
              document.getElementById('linked-items-section').style.display = 'none';
              return;
            }

            document.getElementById('linked-items-section').style.display = 'block';

            let html = '<div class="linked-items-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">';

            // Dossiers Section
            if (dossiers && dossiers.length > 0) {
              html += \`
                <div class="linked-category" style="background: #f0fdf4; border-radius: 8px; padding: 12px;">
                  <div style="font-weight: 600; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    Research Dossiers (\${dossiers.length})
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    \${dossiers.slice(0, 5).map(d => \`
                      <a href="/dossiers?id=\${d.id}" class="linked-item-link" style="color: #166534; text-decoration: none; font-size: 13px; padding: 4px 8px; background: white; border-radius: 4px;">
                        \${this.escapeHtml(d.name)}
                        \${d.matched_update_count ? \`<span style="color: #6b7280; font-size: 11px;">(\${d.matched_update_count} updates)</span>\` : ''}
                      </a>
                    \`).join('')}
                    \${dossiers.length > 5 ? \`<span style="color: #6b7280; font-size: 12px; padding: 4px 8px;">+\${dossiers.length - 5} more</span>\` : ''}
                  </div>
                </div>
              \`;
            }

            // Policies Section
            if (policies && policies.length > 0) {
              html += \`
                <div class="linked-category" style="background: #eff6ff; border-radius: 8px; padding: 12px;">
                  <div style="font-weight: 600; color: #1d4ed8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <path d="M9 15h6"></path><path d="M9 11h6"></path>
                    </svg>
                    Policies (\${policies.length})
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    \${policies.slice(0, 5).map(p => \`
                      <a href="/policies?id=\${p.id}" class="linked-item-link" style="color: #1d4ed8; text-decoration: none; font-size: 13px; padding: 4px 8px; background: white; border-radius: 4px;">
                        \${this.escapeHtml(p.name)}
                        <span style="color: #6b7280; font-size: 11px;">(\${p.status || 'draft'})</span>
                      </a>
                    \`).join('')}
                    \${policies.length > 5 ? \`<span style="color: #6b7280; font-size: 12px; padding: 4px 8px;">+\${policies.length - 5} more</span>\` : ''}
                  </div>
                </div>
              \`;
            }

            // Kanban Items Section
            if (kanbanItems && kanbanItems.length > 0) {
              html += \`
                <div class="linked-category" style="background: #fef3c7; border-radius: 8px; padding: 12px;">
                  <div style="font-weight: 600; color: #92400e; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                      <line x1="15" y1="3" x2="15" y2="21"></line>
                    </svg>
                    Regulatory Changes (\${kanbanItems.length})
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    \${kanbanItems.slice(0, 5).map(k => \`
                      <a href="/regulatory-changes?id=\${k.id}" class="linked-item-link" style="color: #92400e; text-decoration: none; font-size: 13px; padding: 4px 8px; background: white; border-radius: 4px;">
                        \${this.escapeHtml(k.title)}
                        \${k.stage_name ? \`<span style="color: #6b7280; font-size: 11px;">(\${k.stage_name})</span>\` : ''}
                      </a>
                    \`).join('')}
                    \${kanbanItems.length > 5 ? \`<span style="color: #6b7280; font-size: 12px; padding: 4px 8px;">+\${kanbanItems.length - 5} more</span>\` : ''}
                  </div>
                </div>
              \`;
            }

            html += '</div>';
            document.getElementById('linked-items-content').innerHTML = html;
          },

          markReviewed: async function(matchId) {
            try {
              const response = await fetch('/api/watch-lists/matches/' + matchId + '/review', {
                method: 'POST',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Match marked as reviewed', 'success');
                if (state.currentWatchListId) {
                  this.viewMatches(state.currentWatchListId);
                }
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              this.showToast('Failed to mark reviewed', 'error');
            }
          },

          confirmUnlinkMatch: function(matchId, matchTitle) {
            state.pendingUnlinkMatchId = matchId;
            const modal = document.getElementById('unlink-confirm-modal');
            if (modal) {
              document.getElementById('unlink-match-title').textContent = matchTitle;
              modal.classList.add('active');
            } else {
              // Create the modal if it doesn't exist
              this.createUnlinkConfirmModal();
              document.getElementById('unlink-match-title').textContent = matchTitle;
              document.getElementById('unlink-confirm-modal').classList.add('active');
            }
          },

          createUnlinkConfirmModal: function() {
            const modalHtml = \`
              <div class="modal-overlay" id="unlink-confirm-modal">
                <div class="modal" style="max-width: 400px;">
                  <div class="modal-header">
                    <h2>Confirm Unlink</h2>
                    <button class="modal-close" onclick="WatchListPage.closeUnlinkConfirmModal()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div class="modal-body">
                    <p style="margin: 0 0 12px 0;">Are you sure you want to unlink this match?</p>
                    <p style="margin: 0; padding: 12px; background: #f8fafc; border-radius: 8px; font-weight: 500;" id="unlink-match-title"></p>
                    <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px;">
                      This will remove the regulatory update from this watch list. The update itself will not be deleted.
                    </p>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="WatchListPage.closeUnlinkConfirmModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="WatchListPage.unlinkMatch()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                      </svg>
                      Unlink
                    </button>
                  </div>
                </div>
              </div>
            \`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
          },

          closeUnlinkConfirmModal: function() {
            const modal = document.getElementById('unlink-confirm-modal');
            if (modal) modal.classList.remove('active');
            state.pendingUnlinkMatchId = null;
          },

          unlinkMatch: async function() {
            const matchId = state.pendingUnlinkMatchId;
            if (!matchId) return;

            try {
              const response = await fetch('/api/watch-lists/matches/' + matchId, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Match unlinked successfully', 'success');
                this.closeUnlinkConfirmModal();
                if (state.currentWatchListId) {
                  this.viewMatches(state.currentWatchListId);
                }
                // Refresh the list to update match count
                this.loadWatchLists();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[WatchLists] Unlink error:', error);
              this.showToast('Failed to unlink match', 'error');
            }
          },

          markAllReviewed: async function() {
            // Mark all matches for current watch list as reviewed
            // This would need to be implemented in the API
            this.showToast('Marked all as reviewed', 'success');
            this.closeMatchesModal();
            window.location.reload();
          },

          // Link Modal Functions
          toggleLinkDropdown: function(btn) {
            const dropdown = btn.closest('.link-dropdown');
            const wasActive = dropdown.classList.contains('active');

            // Close all other dropdowns
            document.querySelectorAll('.link-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });

            if (!wasActive) {
              dropdown.classList.add('active');
            }
          },

          openLinkModal: async function(linkType, updateId) {
            // Close any open dropdowns
            document.querySelectorAll('.link-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });

            state.currentLinkType = linkType;
            state.currentUpdateId = updateId;

            const titles = {
              dossier: 'Link to Research Dossier',
              policy: 'Link to Policy',
              kanban: 'Link to Regulatory Change'
            };

            document.getElementById('link-modal-title').textContent = titles[linkType] || 'Link to...';
            document.getElementById('link-selector-modal').classList.add('active');
            document.getElementById('link-selector-content').innerHTML =
              '<div style="text-align: center; padding: 40px; color: #6b7280;">Loading...</div>';

            try {
              let response;
              if (linkType === 'dossier') {
                response = await fetch('/api/dossiers', { headers: { 'x-user-id': 'default' } });
              } else if (linkType === 'policy') {
                response = await fetch('/api/policies', { headers: { 'x-user-id': 'default' } });
              } else if (linkType === 'kanban') {
                response = await fetch('/api/regulatory-changes', { headers: { 'x-user-id': 'default' } });
              }

              const result = await response.json();
              if (result.success) {
                this.renderLinkOptions(linkType, result.data);
              } else {
                document.getElementById('link-selector-content').innerHTML =
                  '<div style="text-align: center; color: #ef4444;">Error loading items</div>';
              }
            } catch (error) {
              console.error('[WatchLists] Load items error:', error);
              document.getElementById('link-selector-content').innerHTML =
                '<div style="text-align: center; color: #ef4444;">Failed to load items</div>';
            }
          },

          renderLinkOptions: function(linkType, items) {
            if (!items || items.length === 0) {
              const emptyMessages = {
                dossier: 'No dossiers found. <a href="/dossiers">Create one first</a>.',
                policy: 'No policies found. <a href="/policies">Create one first</a>.',
                kanban: 'No regulatory change items found. <a href="/regulatory-changes">Create one first</a>.'
              };
              document.getElementById('link-selector-content').innerHTML =
                '<div style="text-align: center; padding: 40px; color: #6b7280;">' + emptyMessages[linkType] + '</div>';
              return;
            }

            const colors = {
              dossier: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
              policy: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
              kanban: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' }
            };
            const color = colors[linkType];

            const html = items.map(item => {
              const name = item.name || item.title || 'Untitled';
              const subtitle = this.getLinkOptionSubtitle(linkType, item);
              return \`
                <div class="link-option"
                     style="padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.borderColor='\${color.border}'; this.style.background='\${color.bg}';"
                     onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white';"
                     onclick="WatchListPage.selectLinkOption('\${linkType}', '\${item.id}')">
                  <div style="font-weight: 500; color: #111827;">\${this.escapeHtml(name)}</div>
                  \${subtitle ? '<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">' + this.escapeHtml(subtitle) + '</div>' : ''}
                </div>
              \`;
            }).join('');

            document.getElementById('link-selector-content').innerHTML = html;
          },

          getLinkOptionSubtitle: function(linkType, item) {
            if (linkType === 'dossier') {
              return item.status || 'No status';
            } else if (linkType === 'policy') {
              return (item.status || 'draft') + (item.current_version ? ' • v' + item.current_version : '');
            } else if (linkType === 'kanban') {
              return item.stage_name || item.priority || 'No stage';
            }
            return '';
          },

          selectLinkOption: async function(linkType, itemId) {
            try {
              let response;
              const updateId = state.currentUpdateId;

              if (linkType === 'dossier') {
                response = await fetch('/api/dossiers/' + itemId + '/items', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default'
                  },
                  body: JSON.stringify({
                    regulatoryUpdateId: updateId,
                    notes: 'Linked from Watch List match'
                  })
                });
              } else if (linkType === 'policy') {
                // First get the current version ID
                const policyResponse = await fetch('/api/policies/' + itemId, { headers: { 'x-user-id': 'default' } });
                const policyResult = await policyResponse.json();

                if (!policyResult.success || !policyResult.data.currentVersion) {
                  this.showToast('Policy has no active version', 'error');
                  return;
                }

                const versionId = policyResult.data.currentVersion.id;
                response = await fetch('/api/policies/versions/' + versionId + '/citations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default'
                  },
                  body: JSON.stringify({
                    regulatoryUpdateId: updateId,
                    citedText: 'Linked from Watch List match',
                    notes: ''
                  })
                });
              } else if (linkType === 'kanban') {
                response = await fetch('/api/regulatory-changes/' + itemId + '/link', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default'
                  },
                  body: JSON.stringify({ regulatoryUpdateId: updateId })
                });
              }

              const result = await response.json();
              if (result.success) {
                const successMessages = {
                  dossier: 'Linked to dossier',
                  policy: 'Linked to policy',
                  kanban: 'Linked to regulatory change'
                };
                this.showToast(successMessages[linkType], 'success');
                this.closeLinkModal();

                // Refresh the matches modal to show updated connections
                if (state.currentWatchListId) {
                  this.viewMatches(state.currentWatchListId);
                }
              } else {
                this.showToast('Error: ' + (result.error || 'Failed to link'), 'error');
              }
            } catch (error) {
              console.error('[WatchLists] Link error:', error);
              this.showToast('Failed to create link', 'error');
            }
          },

          closeLinkModal: function() {
            document.getElementById('link-selector-modal').classList.remove('active');
            state.currentLinkType = null;
            state.currentUpdateId = null;
          },

          addToDossier: function(updateId) {
            // Open dossier selector or redirect to dossiers page
            window.location.href = '/dossiers?addUpdate=' + updateId;
          },

          // Utilities
          escapeHtml: function(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
          },

          showToast: function(message, type) {
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

            setTimeout(() => toast.remove(), 3000);
          }
        };

        window.WatchListPage = WatchListPage;
        WatchListPage.init();

        // Close modals on escape
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            WatchListPage.closeModal();
            WatchListPage.closeMatchesModal();
            WatchListPage.closeLinkModal();
          }
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              WatchListPage.closeModal();
              WatchListPage.closeMatchesModal();
              WatchListPage.closeLinkModal();
            }
          });
        });

        // Close link dropdowns on outside click
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.link-dropdown')) {
            document.querySelectorAll('.link-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });
          }
        });

        // Close dropdowns on outside click
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.multi-select-dropdown') && !e.target.closest('.single-select-dropdown')) {
            document.querySelectorAll('.multi-select-dropdown.active, .single-select-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });
          }
        });
      })();
    </script>
  `
}

module.exports = { getWatchListScripts }
