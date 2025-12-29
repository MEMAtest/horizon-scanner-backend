function getApiSection() {
  return `          // Template Creation
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
          }`
}

module.exports = { getApiSection }
