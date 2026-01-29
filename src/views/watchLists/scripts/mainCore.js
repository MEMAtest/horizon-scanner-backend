function getWatchListMainCoreScript() {
  return `
    <script>
      (function() {
        const state = window.watchListState;

        const WatchListPage = {
          init: function() {
            console.log('[FineDirectory] Initialized with', state.watchLists.length, 'fine monitors');

            try {
              const params = new URLSearchParams(window.location.search || '');
              const openMatches = params.get('openMatches');
              if (openMatches) {
                this.viewMatches(openMatches);
              }
            } catch (error) {
              // ignore URL parsing errors
            }
          },

          // Modal Management
          openCreateModal: function() {
            this.resetForm();
            this.initializeDropdowns([], []);
            this.toggleAutoAddToDossier(false);
            this.ensureDossiersLoaded();
            document.getElementById('modal-title').textContent = 'Create Fine Monitor';
            document.getElementById('submit-btn').textContent = 'Create Fine Monitor';
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
            const autoAddToggle = document.getElementById('auto-add-to-dossier');
            if (autoAddToggle) autoAddToggle.checked = false;
            const targetSelect = document.getElementById('target-dossier-id');
            if (targetSelect) targetSelect.value = '';
            this.toggleAutoAddToDossier(false);
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

            const autoAddToDossier = !!document.getElementById('auto-add-to-dossier')?.checked;
            const targetDossierId = document.getElementById('target-dossier-id')?.value || null;
            if (autoAddToDossier && !targetDossierId) {
              this.showToast('Select a target dossier for auto-add', 'error');
              return;
            }

            const data = {
              name: form.name.value,
              description: form.description.value,
              keywords: state.tags.keywords,
              authorities: this.getSelectedDropdownValues('authorities'),
              sectors: this.getSelectedDropdownValues('sectors'),
              alertThreshold: parseFloat(form.alertThreshold.value),
              alertOnMatch: form.alertOnMatch.checked,
              autoAddToDossier,
              targetDossierId: autoAddToDossier ? targetDossierId : null
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
                this.showToast(isEdit ? 'Fine monitor updated' : 'Fine monitor created', 'success');
                this.closeModal();
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[FineDirectory] Submit error:', error);
              this.showToast('Failed to save watch list', 'error');
            }
          },

          // Edit Watch List
          editWatchList: async function(id) {
            const watchList = state.watchLists.find(wl => String(wl.id) === String(id));
            if (!watchList) return;

            document.getElementById('watch-list-id').value = id;
            document.getElementById('name').value = watchList.name || '';
            document.getElementById('description').value = watchList.description || '';
            document.getElementById('alert-threshold').value = watchList.alert_threshold || 0.5;
            document.getElementById('alert-on-match').checked = watchList.alert_on_match !== false;

            const autoAddToDossier = watchList.auto_add_to_dossier === true || watchList.autoAddToDossier === true;
            const targetDossierId = watchList.target_dossier_id || watchList.targetDossierId || '';
            const autoAddToggle = document.getElementById('auto-add-to-dossier');
            if (autoAddToggle) autoAddToggle.checked = autoAddToDossier;
            this.toggleAutoAddToDossier(autoAddToDossier);
            await this.ensureDossiersLoaded(targetDossierId);
            const targetSelect = document.getElementById('target-dossier-id');
            if (targetSelect) targetSelect.value = String(targetDossierId || '');

            state.tags.keywords = watchList.keywords || [];
            this.renderTags('keywords');

            // Initialize dropdowns with existing values
            this.initializeDropdowns(
              watchList.authorities || [],
              watchList.sectors || []
            );

            document.getElementById('modal-title').textContent = 'Edit Fine Monitor';
            document.getElementById('submit-btn').textContent = 'Save Changes';
            document.getElementById('create-modal').classList.add('active');
          },

          toggleAutoAddToDossier: function(enabled) {
            const group = document.getElementById('target-dossier-group');
            const select = document.getElementById('target-dossier-id');
            if (group) group.style.display = enabled ? '' : 'none';
            if (select) {
              select.disabled = !enabled;
              if (!enabled) select.value = '';
            }
            if (enabled) this.ensureDossiersLoaded(select ? select.value : null);
          },

          ensureDossiersLoaded: async function(selectedDossierId) {
            if (state.dossiersLoaded) {
              this.populateDossierSelect(state.dossiers, selectedDossierId);
              return state.dossiers;
            }

            try {
              const response = await fetch('/api/dossiers', { headers: { 'x-user-id': 'default' } });
              const result = await response.json();
              state.dossiers = result.success ? (result.data || []) : [];
              state.dossiersLoaded = true;
              this.populateDossierSelect(state.dossiers, selectedDossierId);
              return state.dossiers;
            } catch (error) {
              console.error('[FineDirectory] Failed to load dossiers:', error);
              state.dossiers = [];
              state.dossiersLoaded = true;
              this.populateDossierSelect([], selectedDossierId, true);
              return [];
            }
          },

          populateDossierSelect: function(dossiers, selectedDossierId, loadFailed) {
            const select = document.getElementById('target-dossier-id');
            if (!select) return;

            const selectedValue = selectedDossierId != null ? String(selectedDossierId) : '';

            let options = '<option value="">Select a dossier...</option>';
            if (loadFailed) {
              options = '<option value="">Unable to load dossiers</option>';
            } else if (!dossiers || dossiers.length === 0) {
              options = '<option value="">No dossiers found (create one first)</option>';
            } else {
              options += dossiers
                .map(d => {
                  const id = d.id != null ? String(d.id) : '';
                  const name = this.escapeHtml(d.name || d.title || 'Untitled');
                  const selected = id && id === selectedValue ? ' selected' : '';
                  return '<option value=\"' + this.escapeHtml(id) + '\"' + selected + '>' + name + '</option>';
                })
                .join('');
            }

            select.innerHTML = options;
          },

          // Delete Fine Monitor
          deleteWatchList: async function(id) {
            if (!confirm('Are you sure you want to delete this fine monitor?')) return;

            try {
              const response = await fetch('/api/watch-lists/' + id, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Fine monitor deleted', 'success');
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[FineDirectory] Delete error:', error);
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
              console.error('[FineDirectory] Toggle error:', error);
              this.showToast('Failed to update alerts', 'error');
            }
          },

          `
}

module.exports = { getWatchListMainCoreScript }
