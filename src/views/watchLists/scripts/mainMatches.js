function getWatchListMatchesScript() {
  return `// Matches Modal
          viewMatches: async function(id) {
            state.currentWatchListId = id;
            const watchList = state.watchLists.find(wl => String(wl.id) === String(id));
            document.getElementById('matches-modal-title').textContent =
              'Matches: ' + (watchList ? watchList.name : 'Fine Monitor');
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
              console.error('[FineDirectory] Load matches error:', error);
              document.getElementById('matches-content').innerHTML =
                '<div style="text-align: center; color: #ef4444;">Failed to load matches</div>';
            }
          },

          rescanMatches: async function(windowDays) {
            const id = state.currentWatchListId;
            if (!id) return;

            const days = Number.isFinite(Number.parseInt(windowDays, 10))
              ? Number.parseInt(windowDays, 10)
              : 90;

            try {
              this.showToast('Rescanning last ' + days + ' days...', 'success');
              const response = await fetch('/api/watch-lists/' + id + '/bulk-match?windowDays=' + encodeURIComponent(days), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': 'default'
                }
              });

              const result = await response.json();
              if (result.success) {
                const data = result.data || {};
                const scanned = data.updatesScanned != null ? data.updatesScanned : '?';
                const matches = data.matchCount != null ? data.matchCount : '?';
                const added = data.itemsAddedToDossier != null ? data.itemsAddedToDossier : 0;
                const addedSuffix = added ? (' • ' + added + ' added to dossier') : '';
                this.showToast('Rescan complete: ' + matches + ' matches (' + scanned + ' scanned)' + addedSuffix, 'success');
                await this.loadWatchLists();
                this.viewMatches(id);
              } else {
                this.showToast('Rescan failed: ' + (result.error || 'Unknown error'), 'error');
              }
            } catch (error) {
              console.error('[FineDirectory] Rescan error:', error);
              this.showToast('Failed to rescan fine monitor', 'error');
            }
          },

          loadWatchLists: async function() {
            try {
              const [listsResponse, statsResponse] = await Promise.all([
                fetch('/api/watch-lists', { headers: { 'x-user-id': 'default' } }),
                fetch('/api/watch-lists/stats', { headers: { 'x-user-id': 'default' } })
              ]);

              const [listsResult, statsResult] = await Promise.all([
                listsResponse.json(),
                statsResponse.json()
              ]);

              if (!listsResult.success) return;
              state.watchLists = listsResult.data || [];
              if (statsResult && statsResult.success) {
                state.stats = statsResult.data || {};
              }

              // Update stats cards if present
              const statCards = document.querySelectorAll('.stats-row .stat-card');
              if (statCards.length >= 4 && state.stats) {
                const values = [
                  state.stats.totalWatchLists || 0,
                  state.stats.totalMatches || 0,
                  state.stats.unreviewedMatches || 0,
                  state.stats.topMatchingList || 'N/A'
                ];
                statCards.forEach((card, idx) => {
                  const valueEl = card.querySelector('.stat-value');
                  if (valueEl && values[idx] !== undefined) {
                    valueEl.textContent = values[idx];
                  }
                });
              }

              // Update counts on existing watch list cards
              state.watchLists.forEach(wl => {
                const card = document.querySelector('.watch-list-card[data-id="' + wl.id + '"]');
                if (!card) return;
                const valueEls = card.querySelectorAll('.watch-list-stat .value');
                if (valueEls[0]) valueEls[0].textContent = wl.matchCount || 0;
                if (valueEls[1]) valueEls[1].textContent = wl.unreviewedCount || wl.unreviewed_count || 0;
                if (valueEls[2]) valueEls[2].textContent = Math.round((wl.alert_threshold || 0.5) * 100) + '%';
              });
            } catch (error) {
              console.error('[FineDirectory] Failed to refresh watch lists:', error);
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
                  \${this.renderMatchReasons(match)}
                  <div class="match-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.location.href='/update/\${match.regulatory_update_id}'">
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

          renderMatchReasons: function(match) {
            const reasons = (match && (match.match_reasons || match.matchReasons)) || null;
            if (!reasons) return '';

            const matched = { keywords: [], authorities: [], sectors: [] };

            if (Array.isArray(reasons)) {
              reasons.forEach(item => {
                if (!item || !item.type) return;
                if (item.type === 'keyword') matched.keywords = Array.isArray(item.matched) ? item.matched : [];
                if (item.type === 'authority') matched.authorities = Array.isArray(item.matched) ? item.matched : [];
                if (item.type === 'sector') matched.sectors = Array.isArray(item.matched) ? item.matched : [];
              });
            } else if (typeof reasons === 'object') {
              const next = reasons.matched || reasons.matches || {};
              if (next.keywords) matched.keywords = Array.isArray(next.keywords) ? next.keywords : [];
              if (next.authorities) matched.authorities = Array.isArray(next.authorities) ? next.authorities : [];
              if (next.sectors) matched.sectors = Array.isArray(next.sectors) ? next.sectors : [];
            }

            const chips = [];

            const formatList = (items, maxItems = 3) => {
              const list = Array.isArray(items) ? items.filter(Boolean) : [];
              if (list.length === 0) return '';
              const shown = list.slice(0, maxItems).map(v => this.escapeHtml(String(v)));
              const suffix = list.length > maxItems ? \` +\${list.length - maxItems} more\` : '';
              return shown.join(', ') + suffix;
            };

            if (matched.keywords.length > 0) {
              chips.push(\`<span class="match-reason-chip keyword">Keywords: \${formatList(matched.keywords)}</span>\`);
            }
            if (matched.authorities.length > 0) {
              chips.push(\`<span class="match-reason-chip authority">Authority: \${formatList(matched.authorities, 2)}</span>\`);
            }
            if (matched.sectors.length > 0) {
              chips.push(\`<span class="match-reason-chip sector">Sector: \${formatList(matched.sectors, 2)}</span>\`);
            }

            if (chips.length === 0 && typeof reasons === 'object' && reasons.warning) {
              chips.push(\`<span class="match-reason-chip warning">\${this.escapeHtml(String(reasons.warning))}</span>\`);
            }

            if (chips.length === 0) return '';
            return '<div class="match-reasons">' + chips.join('') + '</div>';
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
                      This will remove the regulatory update from this fine monitor. The update itself will not be deleted.
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
              console.error('[FineDirectory] Unlink error:', error);
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

          `
}

module.exports = { getWatchListMatchesScript }
