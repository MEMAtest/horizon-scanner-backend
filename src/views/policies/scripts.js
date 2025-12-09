const { serializeForScript } = require('../dashboard/helpers')

function getPolicyScripts({ policies, stats }) {
  const serializedPolicies = serializeForScript(policies || [])
  const serializedStats = serializeForScript(stats || {})

  return `
    <script>
      window.policyState = {
        policies: ${serializedPolicies},
        stats: ${serializedStats},
        currentPolicyId: null,
        currentVersionId: null,
        currentLinkType: null,
        currentUpdateId: null,
        pendingUnlinkCitationId: null,
        pendingUnlinkPolicyId: null,
        searchQuery: '',
        filters: {
          status: '',
          category: '',
          sort: 'updated'
        }
      };
    </script>
    <script>
      (function() {
        const state = window.policyState;

        const PolicyPage = {
          init: function() {
            console.log('[Policies] Initialized with', state.policies.length, 'policies');
          },

          // Modal Management
          openCreateModal: function() {
            this.resetForm();
            document.getElementById('modal-title').textContent = 'Create New Policy';
            document.getElementById('submit-btn').textContent = 'Create Policy';
            document.getElementById('create-modal').classList.add('active');
          },

          closeModal: function() {
            document.getElementById('create-modal').classList.remove('active');
            this.resetForm();
          },

          resetForm: function() {
            document.getElementById('policy-form').reset();
            document.getElementById('policy-id').value = '';
          },

          // Form Submission
          handleSubmit: async function(event) {
            event.preventDefault();
            const form = event.target;
            const id = document.getElementById('policy-id').value;
            const isEdit = !!id;

            const data = {
              title: form.title.value,
              category: form.category.value,
              owner: form.owner.value,
              description: form.description.value,
              content: form.content.value,
              effectiveDate: form.effectiveDate.value || null,
              nextReviewDate: form.nextReviewDate.value || null,
              versionNotes: form.versionNotes.value
            };

            try {
              const url = isEdit ? '/api/policies/' + id : '/api/policies';
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
                this.showToast(isEdit ? 'Policy updated' : 'Policy created', 'success');
                this.closeModal();
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Policies] Submit error:', error);
              this.showToast('Failed to save policy', 'error');
            }
          },

          // Edit Policy
          editPolicy: function(id) {
            const policy = state.policies.find(p => p.id === id);
            if (!policy) return;

            document.getElementById('policy-id').value = id;
            document.getElementById('title').value = policy.title || '';
            document.getElementById('category').value = policy.category || '';
            document.getElementById('owner').value = policy.owner || '';
            document.getElementById('description').value = policy.description || '';
            document.getElementById('content').value = policy.content || '';

            if (policy.effective_date) {
              document.getElementById('effective-date').value = policy.effective_date.split('T')[0];
            }
            if (policy.next_review_date) {
              document.getElementById('review-date').value = policy.next_review_date.split('T')[0];
            }

            document.getElementById('modal-title').textContent = 'Edit Policy';
            document.getElementById('submit-btn').textContent = 'Save Changes';
            document.getElementById('create-modal').classList.add('active');
          },

          // View Policy
          viewPolicy: async function(id) {
            state.currentPolicyId = id;
            document.getElementById('view-modal').classList.add('active');
            document.getElementById('view-content').innerHTML = '<div style="text-align:center;padding:40px;">Loading policy...</div>';

            // Hide linked items section initially
            document.getElementById('policy-linked-items-section').style.display = 'none';

            try {
              // Fetch policy and linked items in parallel
              const [policyResponse, linkedResponse] = await Promise.all([
                fetch('/api/policies/' + id, {
                  headers: { 'x-user-id': 'default' }
                }),
                fetch('/api/policies/' + id + '/linked-items', {
                  headers: { 'x-user-id': 'default' }
                })
              ]);

              const policyResult = await policyResponse.json();
              const linkedResult = await linkedResponse.json();

              if (policyResult.success) {
                this.renderPolicyView(policyResult.data);
              } else {
                document.getElementById('view-content').innerHTML =
                  '<div style="text-align:center;color:#ef4444;">Error loading policy</div>';
              }

              if (linkedResult.success) {
                this.renderLinkedItems(linkedResult.data);
              }
            } catch (error) {
              console.error('[Policies] View error:', error);
              document.getElementById('view-content').innerHTML =
                '<div style="text-align:center;color:#ef4444;">Failed to load policy</div>';
            }
          },

          renderPolicyView: function(policy) {
            document.getElementById('view-modal-title').textContent = policy.title;

            const effectiveDate = policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'Not set';
            const reviewDate = policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString() : 'Not scheduled';
            const currentVersion = policy.current_version_id;
            const versions = policy.versions || [];

            // Check if there's a pending version to approve
            const pendingVersion = versions.find(v => v.status === 'pending_approval');
            if (pendingVersion) {
              state.currentVersionId = pendingVersion.id;
              document.getElementById('approve-btn').style.display = 'inline-flex';
            } else {
              document.getElementById('approve-btn').style.display = 'none';
            }

            let html = '<div class="policy-view">';
            html += '<div class="policy-meta" style="margin-bottom:20px;display:flex;gap:24px;flex-wrap:wrap;">';
            html += '<span><strong>Status:</strong> ' + this.formatStatus(policy.status) + '</span>';
            html += '<span><strong>Category:</strong> ' + (policy.category || 'Uncategorized') + '</span>';
            html += '<span><strong>Owner:</strong> ' + (policy.owner || 'Unassigned') + '</span>';
            html += '<span><strong>Version:</strong> ' + (policy.current_version || '1.0') + '</span>';
            html += '</div>';

            html += '<div class="policy-meta" style="margin-bottom:20px;display:flex;gap:24px;flex-wrap:wrap;">';
            html += '<span><strong>Effective:</strong> ' + effectiveDate + '</span>';
            html += '<span><strong>Next Review:</strong> ' + reviewDate + '</span>';
            html += '</div>';

            if (policy.description) {
              html += '<div style="margin-bottom:20px;padding:12px;background:#f9fafb;border-radius:8px;font-style:italic;">';
              html += this.escapeHtml(policy.description);
              html += '</div>';
            }

            if (policy.content) {
              html += '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;background:white;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:400px;overflow-y:auto;">';
              html += this.escapeHtml(policy.content);
              html += '</div>';
            }

            // Version History
            if (versions.length > 0) {
              html += '<div class="version-history">';
              html += '<h4>Version History</h4>';
              html += '<div class="version-list">';
              versions.forEach(v => {
                const isCurrent = v.id === currentVersion;
                const date = v.created_at ? new Date(v.created_at).toLocaleDateString() : '';
                html += '<div class="version-item' + (isCurrent ? ' current' : '') + '">';
                html += '<div><span class="version-number">v' + v.version_number + '</span>';
                html += '<span class="version-meta" style="margin-left:8px;">' + date;
                if (v.approved_by) html += ' by ' + this.escapeHtml(v.approved_by);
                html += '</span></div>';
                html += '<span class="version-status ' + (v.status || 'draft') + '">' + this.formatVersionStatus(v.status) + '</span>';
                html += '</div>';
              });
              html += '</div></div>';
            }

            // Citations
            const citations = policy.citations || [];
            if (citations.length > 0) {
              html += '<div class="citations-section">';
              html += '<h4>Regulatory Citations</h4>';
              citations.forEach(c => {
                const updateId = c.regulatory_update_id || c.update_id;
                html += '<div class="citation-item">';
                html += '<div class="citation-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div>';
                html += '<div class="citation-info">';
                html += '<div class="citation-title">' + this.escapeHtml(c.update_title || 'Regulatory Update') + '</div>';
                html += '<div class="citation-source">' + this.escapeHtml(c.update_source || '') + ' - ' + (c.citation_text || 'Cited in policy') + '</div>';
                html += '</div>';
                // Add unlink button and link dropdown for citations
                html += '<div class="citation-actions">';
                html += '<button class="btn btn-danger-outline btn-sm" onclick="PolicyPage.confirmUnlinkCitation(\'' + c.id + '\', \'' + this.escapeHtml(c.update_title || 'this citation').replace(/'/g, "\\\\'") + '\')">';
                html += '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">';
                html += '<path d="M18 6L6 18"></path>';
                html += '<path d="M6 6l12 12"></path>';
                html += '</svg>';
                html += 'Unlink';
                html += '</button>';
                // Add link dropdown for citations with regulatory_update_id
                if (updateId) {
                  html += '<div class="link-dropdown">';
                  html += '<button class="btn btn-secondary btn-sm link-btn" onclick="PolicyPage.toggleLinkDropdown(this)">';
                  html += '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
                  html += 'Link to...';
                  html += '</button>';
                  html += '<div class="link-dropdown-menu">';
                  html += '<button onclick="PolicyPage.openLinkModal(\'dossier\', ' + updateId + ')">Research Dossier</button>';
                  html += '<button onclick="PolicyPage.openLinkModal(\'kanban\', ' + updateId + ')">Regulatory Change</button>';
                  html += '</div>';
                  html += '</div>';
                }
                html += '</div>';
                html += '</div>';
              });
              html += '</div>';
            }

            html += '</div>';

            document.getElementById('view-content').innerHTML = html;
          },

          closeViewModal: function() {
            document.getElementById('view-modal').classList.remove('active');
            state.currentPolicyId = null;
            state.currentVersionId = null;
          },

          renderLinkedItems: function(data) {
            const { watchLists, dossiers, kanbanItems, summary } = data;
            const totalLinked = (summary.totalWatchLists || 0) + (summary.totalDossiers || 0) + (summary.totalKanbanItems || 0);

            if (totalLinked === 0) {
              document.getElementById('policy-linked-items-section').style.display = 'none';
              return;
            }

            document.getElementById('policy-linked-items-section').style.display = 'block';

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

            // Dossiers Section (green theme)
            if (dossiers && dossiers.length > 0) {
              html += '<div class="linked-category" style="background: #f0fdf4; border-radius: 8px; padding: 12px;">' +
                '<div style="font-weight: 600; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">' +
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>' +
                    '<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>' +
                  '</svg>' +
                  'Research Dossiers (' + dossiers.length + ')' +
                '</div>' +
                '<div style="display: flex; flex-direction: column; gap: 6px;">';

              dossiers.slice(0, 5).forEach(function(dossier) {
                html += '<a href="/dossiers" style="display: block; padding: 6px 8px; background: white; border-radius: 4px; text-decoration: none; color: #374151; font-size: 13px;">' +
                  this.escapeHtml(dossier.name) +
                  '<span style="color: #9ca3af; margin-left: 4px; text-transform: capitalize;">(' + (dossier.status || 'active') + ')</span>' +
                '</a>';
              }.bind(this));

              if (dossiers.length > 5) {
                html += '<div style="font-size: 12px; color: #6b7280; padding: 4px 8px;">+' + (dossiers.length - 5) + ' more</div>';
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
            document.getElementById('policy-linked-items-content').innerHTML = html;
          },

          // Submit for Approval
          submitForApproval: async function(id) {
            if (!confirm('Submit this policy for approval?')) return;

            try {
              const response = await fetch('/api/policies/' + id + '/versions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ status: 'pending_approval' })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Policy submitted for approval', 'success');
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              this.showToast('Failed to submit for approval', 'error');
            }
          },

          // Approve Version
          approveVersion: async function() {
            if (!state.currentVersionId) return;
            const approverName = prompt('Enter your name for the approval record:');
            if (!approverName) return;

            try {
              const response = await fetch('/api/policies/versions/' + state.currentVersionId + '/approve', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                },
                body: JSON.stringify({ approverName })
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Version approved successfully', 'success');
                this.closeViewModal();
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              this.showToast('Failed to approve version', 'error');
            }
          },

          exportPolicy: function() {
            if (!state.currentPolicyId) return;
            window.open('/api/policies/' + state.currentPolicyId + '/export?format=pdf', '_blank');
          },

          // Delete Policy
          deletePolicy: async function(id) {
            if (!confirm('Are you sure you want to delete this policy? This action cannot be undone.')) return;

            try {
              const response = await fetch('/api/policies/' + id, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Policy deleted', 'success');
                window.location.reload();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              this.showToast('Failed to delete policy', 'error');
            }
          },

          // Search and Filter
          handleSearch: function(event) {
            state.searchQuery = event.target.value.toLowerCase();
            this.applyFilters();
          },

          handleFilter: function() {
            state.filters.status = document.getElementById('status-filter').value;
            state.filters.category = document.getElementById('category-filter').value;
            state.filters.sort = document.getElementById('sort-filter').value;
            this.applyFilters();
          },

          applyFilters: function() {
            let filtered = [...state.policies];

            // Search
            if (state.searchQuery) {
              filtered = filtered.filter(p =>
                (p.title || '').toLowerCase().includes(state.searchQuery) ||
                (p.category || '').toLowerCase().includes(state.searchQuery) ||
                (p.description || '').toLowerCase().includes(state.searchQuery)
              );
            }

            // Status filter
            if (state.filters.status) {
              filtered = filtered.filter(p => p.status === state.filters.status);
            }

            // Category filter
            if (state.filters.category) {
              filtered = filtered.filter(p => p.category === state.filters.category);
            }

            // Sort
            switch (state.filters.sort) {
              case 'updated':
                filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                break;
              case 'review':
                filtered.sort((a, b) => {
                  if (!a.next_review_date) return 1;
                  if (!b.next_review_date) return -1;
                  return new Date(a.next_review_date) - new Date(b.next_review_date);
                });
                break;
              case 'name':
                filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            }

            this.renderList(filtered);
          },

          renderList: function(policies) {
            const list = document.getElementById('policies-list');
            if (!list) return;

            if (policies.length === 0) {
              list.innerHTML = '<div class="empty-state"><h3>No policies match your filters</h3><p>Try adjusting your search or filters</p></div>';
              return;
            }

            list.innerHTML = policies.map(policy => this.renderPolicyCard(policy)).join('');
          },

          renderPolicyCard: function(policy) {
            const statusClass = policy.status || 'draft';
            const statusLabel = this.formatStatus(policy.status);
            const version = policy.current_version || '1.0';
            const effectiveDate = policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'Not set';
            const nextReview = policy.next_review_date ? new Date(policy.next_review_date).toLocaleDateString() : 'Not scheduled';
            const citationCount = policy.citation_count || 0;

            const reviewDueSoon = this.isReviewDueSoon(policy.next_review_date);
            const reviewMetaClass = reviewDueSoon ? (this.isReviewOverdue(policy.next_review_date) ? 'danger' : 'warning') : '';

            return '<div class="policy-card" data-id="' + policy.id + '">' +
              '<div class="policy-card-main">' +
                '<div class="policy-info">' +
                  '<div class="policy-title-row">' +
                    '<h3 class="policy-title">' + this.escapeHtml(policy.title) + '</h3>' +
                    '<span class="policy-status ' + statusClass + '">' + statusLabel + '</span>' +
                  '</div>' +
                  (policy.category ? '<span class="policy-category">' + this.escapeHtml(policy.category) + '</span>' : '') +
                  (policy.description ? '<p class="policy-description">' + this.escapeHtml(policy.description) + '</p>' : '') +
                  '<div class="policy-meta">' +
                    '<span class="policy-meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Effective: ' + effectiveDate + '</span>' +
                    '<span class="policy-meta-item ' + reviewMetaClass + '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Review: ' + nextReview + '</span>' +
                    (citationCount > 0 ? '<span class="policy-meta-item"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' + citationCount + ' citations</span>' : '') +
                  '</div>' +
                '</div>' +
                '<div class="policy-actions">' +
                  '<span class="policy-version-badge">v' + version + '</span>' +
                  '<div class="policy-actions-row">' +
                    '<button class="btn btn-secondary btn-sm" onclick="PolicyPage.viewPolicy(\\'' + policy.id + '\\')">View</button>' +
                    '<button class="btn btn-secondary btn-sm" onclick="PolicyPage.editPolicy(\\'' + policy.id + '\\')">Edit</button>' +
                    (policy.status === 'draft' ? '<button class="btn btn-success btn-sm" onclick="PolicyPage.submitForApproval(\\'' + policy.id + '\\')">Submit</button>' : '') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
          },

          // Utilities
          formatStatus: function(status) {
            const labels = { draft: 'Draft', active: 'Active', under_review: 'Under Review', archived: 'Archived' };
            return labels[status] || 'Unknown';
          },

          formatVersionStatus: function(status) {
            const labels = { draft: 'Draft', pending_approval: 'Pending', approved: 'Approved' };
            return labels[status] || status;
          },

          isReviewDueSoon: function(dateStr) {
            if (!dateStr) return false;
            const reviewDate = new Date(dateStr);
            const now = new Date();
            const diffDays = (reviewDate - now) / (1000 * 60 * 60 * 24);
            return diffDays <= 30;
          },

          isReviewOverdue: function(dateStr) {
            if (!dateStr) return false;
            return new Date(dateStr) < new Date();
          },

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
          },

          // Link Dropdown Functions
          toggleLinkDropdown: function(btn) {
            const dropdown = btn.closest('.link-dropdown');
            const wasActive = dropdown.classList.contains('active');

            // Close all other dropdowns
            document.querySelectorAll('.link-dropdown.active').forEach(d => d.classList.remove('active'));

            if (!wasActive) {
              dropdown.classList.add('active');
            }
          },

          openLinkModal: async function(linkType, updateId) {
            state.currentLinkType = linkType;
            state.currentUpdateId = updateId;

            // Close dropdown
            document.querySelectorAll('.link-dropdown.active').forEach(d => d.classList.remove('active'));

            // Show modal
            const modal = document.getElementById('link-selector-modal');
            modal.classList.add('active');

            // Set title
            const titles = {
              dossier: 'Link to Research Dossier',
              kanban: 'Link to Regulatory Change'
            };
            document.getElementById('link-modal-title').textContent = titles[linkType] || 'Link to...';

            // Show loading
            document.getElementById('link-selector-content').innerHTML =
              '<div style="text-align: center; padding: 40px; color: #6b7280;">Loading options...</div>';

            try {
              let response;
              if (linkType === 'dossier') {
                response = await fetch('/api/dossiers', {
                  headers: { 'x-user-id': 'default' }
                });
              } else if (linkType === 'kanban') {
                response = await fetch('/api/regulatory-changes', {
                  headers: { 'x-user-id': 'default' }
                });
              }

              const result = await response.json();
              if (result.success) {
                this.renderLinkOptions(result.data);
              } else {
                document.getElementById('link-selector-content').innerHTML =
                  '<div style="text-align: center; padding: 40px; color: #ef4444;">Failed to load options</div>';
              }
            } catch (error) {
              console.error('[Policies] Error loading link options:', error);
              document.getElementById('link-selector-content').innerHTML =
                '<div style="text-align: center; padding: 40px; color: #ef4444;">Failed to load options</div>';
            }
          },

          renderLinkOptions: function(items) {
            if (!items || items.length === 0) {
              const noItemsMsg = state.currentLinkType === 'dossier' ?
                'No dossiers available. Create a dossier first.' :
                'No regulatory changes available. Create one first.';
              document.getElementById('link-selector-content').innerHTML =
                '<div style="text-align: center; padding: 40px; color: #6b7280;">' + noItemsMsg + '</div>';
              return;
            }

            let html = '<div class="link-options-list">';
            items.forEach(item => {
              const id = item.id;
              const title = item.name || item.title;
              const subtitle = this.getLinkOptionSubtitle(item);

              html += '<div class="link-option" onclick="PolicyPage.selectLinkOption(\\''+id+'\\')">';
              html += '<div class="link-option-title">' + this.escapeHtml(title) + '</div>';
              html += '<div class="link-option-subtitle">' + this.escapeHtml(subtitle) + '</div>';
              html += '</div>';
            });
            html += '</div>';

            document.getElementById('link-selector-content').innerHTML = html;
          },

          getLinkOptionSubtitle: function(item) {
            if (state.currentLinkType === 'dossier') {
              const count = item.item_count || 0;
              return (item.topic || 'No topic') + ' - ' + count + ' items';
            } else if (state.currentLinkType === 'kanban') {
              return (item.stage_name || 'Unknown stage') + ' - ' + (item.priority || 'normal') + ' priority';
            }
            return '';
          },

          selectLinkOption: async function(targetId) {
            if (!state.currentUpdateId || !targetId) return;

            try {
              let response;

              if (state.currentLinkType === 'dossier') {
                // Add item to dossier
                response = await fetch('/api/dossiers/' + targetId + '/items', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default'
                  },
                  body: JSON.stringify({
                    regulatory_update_id: state.currentUpdateId,
                    notes: 'Linked from policy citation'
                  })
                });
              } else if (state.currentLinkType === 'kanban') {
                // Link to kanban item
                response = await fetch('/api/regulatory-changes/' + targetId + '/link', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'default'
                  },
                  body: JSON.stringify({
                    regulatoryUpdateId: state.currentUpdateId
                  })
                });
              }

              const result = await response.json();
              if (result.success) {
                this.showToast('Successfully linked!', 'success');
                this.closeLinkModal();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Policies] Error creating link:', error);
              this.showToast('Failed to create link', 'error');
            }
          },

          closeLinkModal: function() {
            document.getElementById('link-selector-modal').classList.remove('active');
            state.currentLinkType = null;
            state.currentUpdateId = null;
          },

          // Unlink Confirmation
          confirmUnlinkCitation: function(citationId, citationTitle) {
            state.pendingUnlinkCitationId = citationId;
            state.pendingUnlinkPolicyId = state.currentPolicyId;
            this.createUnlinkConfirmModal(citationTitle);
          },

          createUnlinkConfirmModal: function(citationTitle) {
            let modal = document.getElementById('unlink-confirm-modal');
            if (!modal) {
              modal = document.createElement('div');
              modal.id = 'unlink-confirm-modal';
              modal.className = 'modal-overlay';
              modal.innerHTML =
                '<div class="modal" style="max-width: 400px;">' +
                  '<div class="modal-header">' +
                    '<h3 style="color: #dc2626; margin: 0;">Confirm Unlink</h3>' +
                    '<button class="close-btn" onclick="PolicyPage.closeUnlinkConfirmModal()">&times;</button>' +
                  '</div>' +
                  '<div class="modal-content">' +
                    '<p id="unlink-confirm-message" style="margin: 0 0 20px 0; color: #374151;"></p>' +
                    '<div style="display: flex; gap: 12px; justify-content: flex-end;">' +
                      '<button class="btn btn-secondary" onclick="PolicyPage.closeUnlinkConfirmModal()">Cancel</button>' +
                      '<button class="btn btn-danger" onclick="PolicyPage.unlinkCitation()">Unlink</button>' +
                    '</div>' +
                  '</div>' +
                '</div>';
              document.body.appendChild(modal);
            }
            document.getElementById('unlink-confirm-message').textContent =
              'Are you sure you want to unlink "' + citationTitle + '" from this policy? The regulatory update will not be deleted.';
            modal.classList.add('active');
          },

          closeUnlinkConfirmModal: function() {
            const modal = document.getElementById('unlink-confirm-modal');
            if (modal) modal.classList.remove('active');
            state.pendingUnlinkCitationId = null;
          },

          unlinkCitation: async function() {
            const citationId = state.pendingUnlinkCitationId;
            const policyId = state.pendingUnlinkPolicyId;
            if (!citationId) return;

            try {
              const response = await fetch('/api/policies/citations/' + citationId, {
                method: 'DELETE',
                headers: { 'x-user-id': 'default' }
              });

              const result = await response.json();
              if (result.success) {
                this.showToast('Citation unlinked from policy', 'success');
                this.closeUnlinkConfirmModal();
                // Refresh the policy view
                if (policyId) {
                  this.viewPolicy(policyId);
                }
                // Refresh the policies list to update citation counts
                this.loadPolicies();
              } else {
                this.showToast('Error: ' + result.error, 'error');
              }
            } catch (error) {
              console.error('[Policies] Unlink error:', error);
              this.showToast('Failed to unlink citation', 'error');
            }
          }
        };

        window.PolicyPage = PolicyPage;
        PolicyPage.init();

        // Event delegation for data-action buttons
        document.addEventListener('click', function(e) {
          const btn = e.target.closest('[data-action]');
          if (!btn) return;

          const action = btn.dataset.action;
          const id = btn.dataset.id;

          if (action === 'create') PolicyPage.openCreateModal();
          if (action === 'view' && id) PolicyPage.viewPolicy(id);
          if (action === 'edit' && id) PolicyPage.editPolicy(id);
          if (action === 'approve' && id) PolicyPage.submitForApproval(id);
        });

        // Close modals on escape
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            PolicyPage.closeModal();
            PolicyPage.closeViewModal();
            PolicyPage.closeLinkModal();
            PolicyPage.closeUnlinkConfirmModal();
          }
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              PolicyPage.closeModal();
              PolicyPage.closeViewModal();
              PolicyPage.closeLinkModal();
            }
          });
        });

        // Close unlink confirm modal on overlay click (dynamic modal)
        document.addEventListener('click', function(e) {
          if (e.target.id === 'unlink-confirm-modal') {
            PolicyPage.closeUnlinkConfirmModal();
          }
        });

        // Close link dropdowns when clicking outside
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.link-dropdown')) {
            document.querySelectorAll('.link-dropdown.active').forEach(d => d.classList.remove('active'));
          }
        });
      })();
    </script>
  `
}

module.exports = { getPolicyScripts }
