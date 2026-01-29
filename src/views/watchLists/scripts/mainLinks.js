function getWatchListLinksScript() {
  return `// Link Modal Functions
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
              console.error('[FineDirectory] Load items error:', error);
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
                    updateId: updateId,
                    notes: 'Linked from Fine Monitor match'
                  })
                });
              } else if (linkType === 'policy') {
                // First get the current version ID
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
                    notes: 'Linked from Fine Monitor match',
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
              console.error('[FineDirectory] Link error:', error);
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
    </script>`
}

module.exports = { getWatchListLinksScript }
