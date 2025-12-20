const { serializeForScript } = require('../dashboard/helpers')

function getDossierScripts({ dossiers, stats }) {
  const serializedDossiers = serializeForScript(dossiers || [])
  const serializedStats = serializeForScript(stats || {})

  return `
    <script>
      window.dossierState = {
        dossiers: ${serializedDossiers},
        stats: ${serializedStats},
        currentDossierId: null,
        currentLinkType: null,
        currentUpdateId: null,
        pendingUnlinkItemId: null,
        pendingUnlinkDossierId: null,
        tags: [],
        searchQuery: '',
        filters: {
          status: '',
          sort: 'updated'
        }
      };
    </script>
    <script>
      (function() {
        const state = window.dossierState;

        const DossierPage = {
          init: function() {
            console.log('[Dossiers] Initialized with', state.dossiers.length, 'dossiers');
          },

          // Modal Management
          openCreateModal: function() {
            this.resetForm();
            document.getElementById('modal-title').textContent = 'Create Research Dossier';
            document.getElementById('submit-btn').textContent = 'Create Dossier';
            document.getElementById('create-modal').classList.add('active');
          },

          closeModal: function() {
            document.getElementById('create-modal').classList.remove('active');
            this.resetForm();
          },

          resetForm: function() {
            document.getElementById('dossier-form').reset();
            document.getElementById('dossier-id').value = '';
            state.tags = [];
            this.renderTags();
          },

          // Tag Input Handling
          handleTagInput: function(event) {
            if (event.key === 'Enter') {
              event.preventDefault();
              const input = event.target;
              const value = input.value.trim();
              if (value && !state.tags.includes(value)) {
                state.tags.push(value);
                this.renderTags();
              }
              input.value = '';
            }
          },

          renderTags: function() {
            const container = document.getElementById('tags-container');
            const input = document.getElementById('tags-input');
            const hidden = document.getElementById('tags');

            // Remove existing tags
            container.querySelectorAll('.tag').forEach(t => t.remove());

            // Add new tags before the input
            state.tags.forEach((tag, index) => {
              const tagEl = document.createElement('span');
              tagEl.className = 'tag';
              tagEl.innerHTML = this.escapeHtml(tag) + ' <span class="remove" onclick="DossierPage.removeTag(' + index + ')">&times;</span>';
              container.insertBefore(tagEl, input);
            });

            // Update hidden field
            hidden.value = JSON.stringify(state.tags);
          },

          removeTag: function(index) {
            state.tags.splice(index, 1);
            this.renderTags();
          },

          // Form Submission
          handleSubmit: async function(event) {
            event.preventDefault();
            const form = event.target;
            const id = document.getElementById('dossier-id').value;
            const isEdit = !!id;

            const data = {
              name: form.name.value,
              topic: form.topic.value,
              description: form.description.value,
              tags: state.tags,
              status: form.status.value
            };

            try {
              const url = isEdit ? '/api/dossiers/' + id : '/api/dossiers';
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
                this.showToast(isEdit ? 'Dossier updated' : 'Dossier created', 'success');
                this.closeModal();
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Dossiers] Submit error:', error);
              this.showToast('Failed to save dossier', 'error');
            }
          },

          // Edit Dossier
          editDossier: function(id) {
            const dossier = state.dossiers.find(d => d.id === id);
            if (!dossier) return;

            document.getElementById('dossier-id').value = id;
            document.getElementById('name').value = dossier.name || '';
            document.getElementById('topic').value = dossier.topic || '';
            document.getElementById('description').value = dossier.description || '';
            document.getElementById('status').value = dossier.status || 'active';

            state.tags = dossier.tags || [];
            this.renderTags();

            document.getElementById('modal-title').textContent = 'Edit Research Dossier';
            document.getElementById('submit-btn').textContent = 'Save Changes';
            document.getElementById('create-modal').classList.add('active');
          },

          // Delete Dossier
          deleteDossier: async function(id) {
            if (!confirm('Are you sure you want to delete this dossier? All evidence items will be removed.')) return;

            try {
              const response = await fetch('/api/dossiers/' + id, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Dossier deleted', 'success');
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Dossiers] Delete error:', error);
              this.showToast('Failed to delete dossier', 'error');
            }
          },

          // Timeline Modal
          viewTimeline: async function(id) {
            state.currentDossierId = id;
            const dossier = state.dossiers.find(d => d.id === id);
            document.getElementById('timeline-modal-title').textContent =
              'Timeline: ' + (dossier ? dossier.name : 'Dossier');
            document.getElementById('timeline-modal').classList.add('active');

            // Hide linked items section initially
            document.getElementById('dossier-linked-items-section').style.display = 'none';

            try {
              // Fetch timeline and linked items in parallel
              const [timelineResponse, linkedResponse] = await Promise.all([
                fetch('/api/dossiers/' + id + '/timeline', {
                  headers: { 'x-user-id': 'default' }
                }),
                fetch('/api/dossiers/' + id + '/linked-items', {
                  headers: { 'x-user-id': 'default' }
                })
              ]);

              const timelineResult = await timelineResponse.json();
              const linkedResult = await linkedResponse.json();

              if (timelineResult.success) {
                this.renderTimeline(timelineResult.data);
              } else {
                document.getElementById('timeline-content').innerHTML =
                  '<div class="timeline-empty" style="color: #ef4444;">Error loading timeline</div>';
              }

              if (linkedResult.success) {
                this.renderLinkedItems(linkedResult.data);
              }
            } catch (error) {
              console.error('[Dossiers] Load timeline error:', error);
              document.getElementById('timeline-content').innerHTML =
                '<div class="timeline-empty" style="color: #ef4444;">Failed to load timeline</div>';
            }
          },

          renderTimeline: function(items) {
            if (!items || items.length === 0) {
              document.getElementById('timeline-content').innerHTML =
                '<div class="timeline-empty">No evidence items in this dossier yet.<br><br>Add regulatory updates from the dashboard to build your research timeline.</div>';
              return;
            }

            const html = '<div class="timeline">' + items.map(item => {
              const date = item.published_date ? new Date(item.published_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Unknown date';

              return '<div class="timeline-item">' +
                '<div class="timeline-item-date">' + date + '</div>' +
                '<div class="timeline-item-title">' + this.escapeHtml(item.update_title || 'Untitled') + '</div>' +
                '<div class="timeline-item-source">' + this.escapeHtml(item.update_source || 'Unknown source') + '</div>' +
                (item.notes ? '<div class="timeline-item-notes">' + this.escapeHtml(item.notes) + '</div>' : '') +
                '<div class="timeline-item-actions">' +
                  '<button class="btn btn-danger-outline btn-sm" onclick="DossierPage.confirmUnlinkItem(\\\'' + item.id + '\\\', \\\'' + this.escapeHtml(item.update_title || 'this item').replace(/'/g, "\\\\'") + '\\\')">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                      '<path d="M18 6L6 18"></path>' +
                      '<path d="M6 6l12 12"></path>' +
                    '</svg>' +
                    'Unlink' +
                  '</button>' +
                  '<div class="link-dropdown">' +
                    '<button class="btn btn-secondary btn-sm link-btn" onclick="DossierPage.toggleLinkDropdown(this)">' +
                      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>' +
                        '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>' +
                      '</svg>' +
                      'Link to...' +
                    '</button>' +
                    '<div class="link-dropdown-menu">' +
                      '<button onclick="DossierPage.openLinkModal(\\\'policy\\\', \\\'' + item.regulatory_update_id + '\\\')">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                          '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
                          '<path d="M9 15h6"></path><path d="M9 11h6"></path>' +
                        '</svg>' +
                        'Policy' +
                      '</button>' +
                      '<button onclick="DossierPage.openLinkModal(\\\'kanban\\\', \\\'' + item.regulatory_update_id + '\\\')">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                          '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>' +
                          '<line x1="9" y1="3" x2="9" y2="21"></line>' +
                          '<line x1="15" y1="3" x2="15" y2="21"></line>' +
                        '</svg>' +
                        'Regulatory Change' +
                      '</button>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('') + '</div>';

            document.getElementById('timeline-content').innerHTML = html;
          },

          renderLinkedItems: function(data) {
            const { watchLists, policies, kanbanItems, summary } = data;
            const totalLinked = (summary.totalWatchLists || 0) + (summary.totalPolicies || 0) + (summary.totalKanbanItems || 0);

            if (totalLinked === 0) {
              document.getElementById('dossier-linked-items-section').style.display = 'none';
              return;
            }

            document.getElementById('dossier-linked-items-section').style.display = 'block';

            let html = '<div class="linked-items-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">';

            // Watch Lists Section (purple theme)
            if (watchLists && watchLists.length > 0) {
              html += '<div class="linked-category" style="background: #faf5ff; border-radius: 8px; padding: 12px;">' +
                '<div style="font-weight: 600; color: #7c3aed; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>' +
                    '<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/>' +
                  '</svg>' +
                  'Watch Lists (' + watchLists.length + ')' +
                '</div>' +
                '<div style="display: flex; flex-direction: column; gap: 6px;">';

              watchLists.slice(0, 5).forEach(function(wl) {
                html += '<a href="/watch-lists" style="display: block; padding: 6px 8px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 13px;">' +
                  this.escapeHtml(wl.name) +
                  '<span style="color: #9ca3af; margin-left: 4px;">(' + (wl.matchCount || 0) + ' matches)</span>' +
                '</a>';
              }.bind(this));

              if (watchLists.length > 5) {
                html += '<div style="font-size: 12px; color: #6b7280; padding: 4px 8px;">+' + (watchLists.length - 5) + ' more</div>';
              }

              html += '</div></div>';
            }

            // Policies Section (blue theme)
            if (policies && policies.length > 0) {
              html += '<div class="linked-category" style="background: #eff6ff; border-radius: 8px; padding: 12px;">' +
                '<div style="font-weight: 600; color: #2563eb; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
                    '<polyline points="14 2 14 8 20 8"></polyline>' +
                    '<line x1="16" y1="13" x2="8" y2="13"></line>' +
                    '<line x1="16" y1="17" x2="8" y2="17"></line>' +
                  '</svg>' +
                  'Policies (' + policies.length + ')' +
                '</div>' +
                '<div style="display: flex; flex-direction: column; gap: 6px;">';

              policies.slice(0, 5).forEach(function(policy) {
                html += '<a href="/policies" style="display: block; padding: 6px 8px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 13px;">' +
                  this.escapeHtml(policy.name) +
                  '<span style="color: #9ca3af; margin-left: 4px; text-transform: capitalize;">(' + (policy.status || 'draft') + ')</span>' +
                '</a>';
              }.bind(this));

              if (policies.length > 5) {
                html += '<div style="font-size: 12px; color: #6b7280; padding: 4px 8px;">+' + (policies.length - 5) + ' more</div>';
              }

              html += '</div></div>';
            }

            // Kanban Items Section (amber theme)
            if (kanbanItems && kanbanItems.length > 0) {
              html += '<div class="linked-category" style="background: #fffbeb; border-radius: 8px; padding: 12px;">' +
                '<div style="font-weight: 600; color: #d97706; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<rect x="3" y="3" width="7" height="9"></rect>' +
                    '<rect x="14" y="3" width="7" height="5"></rect>' +
                    '<rect x="14" y="12" width="7" height="9"></rect>' +
                    '<rect x="3" y="16" width="7" height="5"></rect>' +
                  '</svg>' +
                  'Regulatory Changes (' + kanbanItems.length + ')' +
                '</div>' +
                '<div style="display: flex; flex-direction: column; gap: 6px;">';

              kanbanItems.slice(0, 5).forEach(function(item) {
                html += '<a href="/regulatory-changes" style="display: block; padding: 6px 8px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 13px;">' +
                  this.escapeHtml(item.title) +
                  '<span style="color: #9ca3af; margin-left: 4px; text-transform: capitalize;">(' + (item.stage_name || 'Unknown') + ')</span>' +
                '</a>';
              }.bind(this));

              if (kanbanItems.length > 5) {
                html += '<div style="font-size: 12px; color: #6b7280; padding: 4px 8px;">+' + (kanbanItems.length - 5) + ' more</div>';
              }

              html += '</div></div>';
            }

            html += '</div>';
            document.getElementById('dossier-linked-items-content').innerHTML = html;
          },

          closeTimelineModal: function() {
            document.getElementById('timeline-modal').classList.remove('active');
            state.currentDossierId = null;
          },

          exportTimeline: function() {
            if (!state.currentDossierId) return;
            window.open('/api/dossiers/' + state.currentDossierId + '/export?format=pdf', '_blank');
          },

          // Search and Filter
          handleSearch: function(event) {
            state.searchQuery = event.target.value.toLowerCase();
            this.applyFilters();
          },

          handleFilter: function() {
            state.filters.status = document.getElementById('status-filter').value;
            state.filters.sort = document.getElementById('sort-filter').value;
            this.applyFilters();
          },

          applyFilters: function() {
            let filtered = [...state.dossiers];

            // Search
            if (state.searchQuery) {
              filtered = filtered.filter(d =>
                (d.name || '').toLowerCase().includes(state.searchQuery) ||
                (d.topic || '').toLowerCase().includes(state.searchQuery) ||
                (d.description || '').toLowerCase().includes(state.searchQuery)
              );
            }

            // Status filter
            if (state.filters.status) {
              filtered = filtered.filter(d => d.status === state.filters.status);
            }

            // Sort
            switch (state.filters.sort) {
              case 'updated':
                filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                break;
              case 'created':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
              case 'items':
                filtered.sort((a, b) => (b.item_count || 0) - (a.item_count || 0));
                break;
              case 'name':
                filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            }

            this.renderGrid(filtered);
          },

          renderGrid: function(dossiers) {
            const grid = document.getElementById('dossiers-grid');
            if (!grid) return;

            if (dossiers.length === 0) {
              grid.innerHTML = '<div class="empty-state"><h3>No dossiers match your filters</h3><p>Try adjusting your search or filters</p></div>';
              return;
            }

            grid.innerHTML = dossiers.map(dossier => {
              const itemCount = dossier.item_count || 0;
              const statusClass = dossier.status === 'archived' ? 'archived' : 'active';
              const statusLabel = dossier.status === 'archived' ? 'Archived' : 'Active';
              const tags = dossier.tags || [];
              const updatedDate = dossier.updated_at ? new Date(dossier.updated_at).toLocaleDateString() : 'Unknown';

              return '<div class="dossier-card" data-id="' + dossier.id + '">' +
                '<div class="dossier-card-header">' +
                  '<div>' +
                    '<h3 class="dossier-title">' + this.escapeHtml(dossier.name) + '</h3>' +
                    (dossier.topic ? '<span class="dossier-topic">' + this.escapeHtml(dossier.topic) + '</span>' : '') +
                  '</div>' +
                  '<span class="dossier-status ' + statusClass + '">' + statusLabel + '</span>' +
                '</div>' +
                '<div class="dossier-card-body">' +
                  (dossier.description ? '<p class="dossier-description">' + this.escapeHtml(dossier.description) + '</p>' : '') +
                  '<div class="dossier-meta">' +
                    '<span class="dossier-meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' + itemCount + ' items</span>' +
                    '<span class="dossier-meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Updated ' + updatedDate + '</span>' +
                  '</div>' +
                '</div>' +
                '<div class="dossier-card-footer">' +
                  '<div class="dossier-tags">' +
                    tags.slice(0, 3).map(tag => '<span class="dossier-tag">' + this.escapeHtml(tag) + '</span>').join('') +
                    (tags.length > 3 ? '<span class="dossier-tag">+' + (tags.length - 3) + '</span>' : '') +
                  '</div>' +
                  '<div class="dossier-actions">' +
                    '<button class="btn btn-secondary btn-sm" onclick="DossierPage.viewTimeline(\\'' + dossier.id + '\\')">Timeline</button>' +
                    '<button class="btn btn-secondary btn-sm" onclick="DossierPage.editDossier(\\'' + dossier.id + '\\')">Edit</button>' +
                  '</div>' +
                '</div>' +
              '</div>';
            }).join('');
          },

          // Link Modal Functions
          toggleLinkDropdown: function(btn) {
            const dropdown = btn.closest('.link-dropdown');
            const wasActive = dropdown.classList.contains('active');

            document.querySelectorAll('.link-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });

            if (!wasActive) {
              dropdown.classList.add('active');
            }
          },

          openLinkModal: async function(linkType, updateId) {
            document.querySelectorAll('.link-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });

            state.currentLinkType = linkType;
            state.currentUpdateId = updateId;

            const titles = {
              policy: 'Link to Policy',
              kanban: 'Link to Regulatory Change'
            };

            document.getElementById('link-modal-title').textContent = titles[linkType] || 'Link to...';
            document.getElementById('link-selector-modal').classList.add('active');
            document.getElementById('link-selector-content').innerHTML =
              '<div style="text-align: center; padding: 40px; color: #6b7280;">Loading...</div>';

            try {
              let response;
              if (linkType === 'policy') {
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
              console.error('[Dossiers] Load items error:', error);
              document.getElementById('link-selector-content').innerHTML =
                '<div style="text-align: center; color: #ef4444;">Failed to load items</div>';
            }
          },

          renderLinkOptions: function(linkType, items) {
            if (!items || items.length === 0) {
              const emptyMessages = {
                policy: 'No policies found. <a href="/policies">Create one first</a>.',
                kanban: 'No regulatory change items found. <a href="/regulatory-changes">Create one first</a>.'
              };
              document.getElementById('link-selector-content').innerHTML =
                '<div style="text-align: center; padding: 40px; color: #6b7280;">' + emptyMessages[linkType] + '</div>';
              return;
            }

            const colors = {
              policy: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
              kanban: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' }
            };
            const color = colors[linkType];

            const html = items.map(item => {
              const name = item.name || item.title || 'Untitled';
              const subtitle = this.getLinkOptionSubtitle(linkType, item);
              return '<div class="link-option" ' +
                     'style="padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;" ' +
                     'onmouseover="this.style.borderColor=\\'' + color.border + '\\'; this.style.background=\\'' + color.bg + '\\';" ' +
                     'onmouseout="this.style.borderColor=\\'#e5e7eb\\'; this.style.background=\\'white\\';" ' +
                     'onclick="DossierPage.selectLinkOption(\\'' + linkType + '\\', \\'' + item.id + '\\')">' +
                  '<div style="font-weight: 500; color: #111827;">' + this.escapeHtml(name) + '</div>' +
                  (subtitle ? '<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">' + this.escapeHtml(subtitle) + '</div>' : '') +
                '</div>';
            }).join('');

            document.getElementById('link-selector-content').innerHTML = html;
          },

          getLinkOptionSubtitle: function(linkType, item) {
            if (linkType === 'policy') {
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

              if (linkType === 'policy') {
                const policyResponse = await fetch('/api/policies/' + itemId, { headers: { 'x-user-id': 'default' } });
                const policyResult = await policyResponse.json();

                const currentVersion = policyResult?.data?.currentVersion || policyResult?.data?.current_version || null;
                const versionId = (currentVersion && currentVersion.id)
                  ? currentVersion.id
                  : (policyResult?.data?.current_version_id || policyResult?.data?.currentVersionId || null);

                if (!policyResult.success || !versionId) {
                  this.showToast('Policy has no active version', 'error');
                  return;
                }

                response = await fetch('/api/policies/versions/' + versionId + '/citations', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default'
                  },
                  body: JSON.stringify({
                    updateId: updateId,
                    citationType: 'reference',
                    notes: 'Linked from Research Dossier',
                    sectionReference: ''
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
                  policy: 'Linked to policy',
                  kanban: 'Linked to regulatory change'
                };
                this.showToast(successMessages[linkType], 'success');
                this.closeLinkModal();

                if (state.currentDossierId) {
                  this.viewTimeline(state.currentDossierId);
                }
              } else {
                this.showToast('Error: ' + (result.error || 'Failed to link'), 'error');
              }
            } catch (error) {
              console.error('[Dossiers] Link error:', error);
              this.showToast('Failed to create link', 'error');
            }
          },

          closeLinkModal: function() {
            document.getElementById('link-selector-modal').classList.remove('active');
            state.currentLinkType = null;
            state.currentUpdateId = null;
          },

          // Unlink Confirmation
          confirmUnlinkItem: function(itemId, itemTitle) {
            state.pendingUnlinkItemId = itemId;
            state.pendingUnlinkDossierId = state.currentDossierId;
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
                    '<button class="close-btn" onclick="DossierPage.closeUnlinkConfirmModal()">&times;</button>' +
                  '</div>' +
                  '<div class="modal-content">' +
                    '<p id="unlink-confirm-message" style="margin: 0 0 20px 0; color: #374151;"></p>' +
                    '<div style="display: flex; gap: 12px; justify-content: flex-end;">' +
                      '<button class="btn btn-secondary" onclick="DossierPage.closeUnlinkConfirmModal()">Cancel</button>' +
                      '<button class="btn btn-danger" onclick="DossierPage.unlinkItem()">Unlink</button>' +
                    '</div>' +
                  '</div>' +
                '</div>';
              document.body.appendChild(modal);
            }
            document.getElementById('unlink-confirm-message').textContent =
              'Are you sure you want to unlink "' + itemTitle + '" from this dossier? The regulatory update will not be deleted.';
            modal.classList.add('active');
          },

          closeUnlinkConfirmModal: function() {
            const modal = document.getElementById('unlink-confirm-modal');
            if (modal) modal.classList.remove('active');
            state.pendingUnlinkItemId = null;
          },

          unlinkItem: async function() {
            const itemId = state.pendingUnlinkItemId;
            const dossierId = state.pendingUnlinkDossierId;
            if (!itemId || !dossierId) return;

            try {
              const response = await fetch('/api/dossiers/' + dossierId + '/items/' + itemId, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Item unlinked from dossier', 'success');
                this.closeUnlinkConfirmModal();
                // Refresh the timeline
                this.viewTimeline(dossierId);
                // Refresh the dossiers list to update item counts
                this.loadDossiers();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Dossiers] Unlink error:', error);
              this.showToast('Failed to unlink item', 'error');
            }
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

        window.DossierPage = DossierPage;
        DossierPage.init();

        // Close modals on escape
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            DossierPage.closeModal();
            DossierPage.closeTimelineModal();
            DossierPage.closeLinkModal();
            DossierPage.closeUnlinkConfirmModal();
          }
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              DossierPage.closeModal();
              DossierPage.closeTimelineModal();
              DossierPage.closeLinkModal();
            }
          });
        });

        // Close unlink confirm modal on overlay click (dynamic modal)
        document.addEventListener('click', function(e) {
          if (e.target.id === 'unlink-confirm-modal') {
            DossierPage.closeUnlinkConfirmModal();
          }
        });

        // Close link dropdowns on outside click
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.link-dropdown')) {
            document.querySelectorAll('.link-dropdown.active').forEach(dd => {
              dd.classList.remove('active');
            });
          }
        });
      })();
    </script>
  `
}

module.exports = { getDossierScripts }
