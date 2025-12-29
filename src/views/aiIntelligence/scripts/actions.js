function getAiIntelligenceActionsScript() {
  return `        function refreshAfterPinToggle() {
          fetch('/api/intelligence/daily', { headers: { Accept: 'application/json' } })
            .then(response => {
              if (!response.ok) throw new Error('Failed to refresh snapshot');
              return response.json();
            })
            .then(payload => {
              if (payload && payload.success && payload.snapshot) {
                applySnapshotModel(payload.snapshot);
              } else {
                showToast('Unable to refresh intelligence view', 'error');
              }
            })
            .catch(error => {
              console.warn('Unable to refresh intelligence snapshot after pin update:', error);
              showToast('Unable to refresh intelligence view', 'error');
            });
        }

        function attachCardActions() {
          document.querySelectorAll('.stream-card .icon-btn').forEach(button => {
            button.addEventListener('click', event => {
              const updateId = button.dataset.updateId;
              const action = button.dataset.action;
              const update = snapshot && snapshot.streams
                ? findUpdateById(updateId, snapshot.streams)
                : null;

              switch (action) {
                case 'pin':
                  const card = button.closest('.stream-card');
                  const targetUrl = update?.url || card?.dataset.url;
                  if (!update || !targetUrl) {
                    showToast('Missing update link to pin', 'error');
                    return;
                  }
                  if (!window.WorkspaceModule || typeof WorkspaceModule.togglePin !== 'function') {
                    showToast('Workspace module not available', 'error');
                    return;
                  }

                  const wasPinned = button.dataset.pinned === 'true';
                  const context = {
                    summary: update.summary,
                    personas: Array.isArray(update.personas) ? update.personas : [],
                    sectors: update.primarySector ? [update.primarySector] : [],
                    published: update.publishedAt,
                    updateId: update.updateId || update.id,
                    authority: update.authority,
                    url: targetUrl
                  };

                  button.disabled = true;
                  Promise.resolve(
                    WorkspaceModule.togglePin(targetUrl, update.headline, update.authority, context)
                  )
                    .then(success => {
                      if (!success) return;
                      const nextPinned = !wasPinned;
                      updatePinButtonState(button, nextPinned);
                      if (card) {
                        card.dataset.pinned = nextPinned ? 'true' : 'false';
                      }
                      if (update) {
                        update.isPinned = nextPinned;
                      }
                      adjustPersonaPinnedCounts(context.personas, nextPinned ? 1 : -1);
                      syncPersonaPinnedBadges(update.updateId || update.id, nextPinned);
                      if (snapshot.workspace && Array.isArray(snapshot.workspace.pinnedItems)) {
                        const compare = item => (item.update_url || item.url) === update.url;
                        if (nextPinned) {
                          if (!snapshot.workspace.pinnedItems.some(compare)) {
                            snapshot.workspace.pinnedItems.push({ update_url: update.url });
                          }
                        } else {
                          snapshot.workspace.pinnedItems = snapshot.workspace.pinnedItems.filter(item => !compare(item));
                        }
                      }
                      updateWorkspaceMetric('pinned', nextPinned ? 1 : -1);
                      refreshAfterPinToggle();
                    })
                    .catch(() => {
                      showToast('Unable to update pin status', 'error');
                    })
                    .finally(() => {
                      button.disabled = false;
                    });
                  break;
                case 'annotate':
                  if (update && window.RegCanaryIntelligence && typeof window.RegCanaryIntelligence.createAnnotation === 'function') {
                    window.RegCanaryIntelligence.createAnnotation(update);
                  } else {
                    window.open('/annotations', '_blank');
                  }
                  break;
                case 'share':
                  navigator.clipboard.writeText(update?.url || window.location.href)
                    .then(() => showToast('Link copied to clipboard', 'success'))
                    .catch(() => showToast('Unable to copy link', 'error'));
                  break;
              }
            });
          });
        }

        function findUpdateById(id, streams) {
          if (!streams) return null;
          const { high = [], medium = [], low = [] } = streams;
          return [...high, ...medium, ...low].find(update => update.updateId === id) || null;
        }

        function showToast(message, type) {
          const el = document.createElement('div');
          el.className = 'intelligence-toast intelligence-toast-' + (type || 'info');
          el.textContent = message;
          document.body.appendChild(el);
          setTimeout(() => el.classList.add('visible'), 10);
          setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 200);
          }, 3200);
        }

`
}

module.exports = { getAiIntelligenceActionsScript }
