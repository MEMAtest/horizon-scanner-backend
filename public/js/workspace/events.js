(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceEvents(context) {
    const state = context.state;

    function broadcastWorkspacePins() {
      const urls = Array.from(state.pinnedUrls);
      const updateIds = Array.from(state.pinnedUpdateIds);
      const detail = {
        urls,
        updateIds,
        items: state.pinnedItems.slice()
      };
      window.__workspacePinnedUrls = urls;
      window.__workspacePinnedUpdateIds = updateIds;
      window.__workspacePinnedItems = detail.items;
      try {
        window.dispatchEvent(new CustomEvent('workspace:pins', { detail }));
      } catch (error) {
        console.warn('WorkspaceModule pin event failed:', error);
      }
    }

    function broadcastWorkspaceStats(stats) {
      const detail = Object.assign({
        pinnedItems: state.pinnedUrls.size,
        savedSearches: state.savedSearches.length,
        activeAlerts: state.customAlerts.filter(alert => alert.isActive).length
      }, stats || {});
      window.__workspaceStats = detail;
      try {
        window.dispatchEvent(new CustomEvent('workspace:stats', { detail }));
      } catch (error) {
        console.warn('WorkspaceModule stats event failed:', error);
      }
    }

    function applyWorkspaceStats(stats) {
      const counts = {
        pinnedItems: typeof stats?.pinnedItems === 'number'
          ? stats.pinnedItems
          : Math.max(state.pinnedItems.length, state.pinnedUrls.size),
        savedSearches: typeof stats?.savedSearches === 'number'
          ? stats.savedSearches
          : state.savedSearches.length,
        activeAlerts: typeof stats?.activeAlerts === 'number'
          ? stats.activeAlerts
          : state.customAlerts.filter(alert => alert.isActive).length
      };

      const pinnedEl = document.getElementById('pinnedCount');
      if (pinnedEl) pinnedEl.textContent = counts.pinnedItems;

      const savedEl = document.getElementById('savedSearchesCount');
      if (savedEl) savedEl.textContent = counts.savedSearches;

      const alertsEl = document.getElementById('customAlertsCount');
      if (alertsEl) alertsEl.textContent = counts.activeAlerts;

      broadcastWorkspaceStats(counts);
    }

    async function updateWorkspaceCounts(options = {}) {
      applyWorkspaceStats();
      try {
        if (options.skipFetch) {
          if (typeof context.updateAnnotationBadge === 'function') {
            context.updateAnnotationBadge();
          }
          return;
        }
        const response = await fetch('/api/workspace/stats');
        if (response.ok) {
          const data = await response.json();
          applyWorkspaceStats(data.stats || {});
        }
      } catch (error) {
        console.error('Error updating workspace counts:', error);
      }
      if (typeof context.updateAnnotationBadge === 'function') {
        context.updateAnnotationBadge();
      }
    }

    context.define('broadcastWorkspacePins', broadcastWorkspacePins);
    context.define('broadcastWorkspaceStats', broadcastWorkspaceStats);
    context.define('applyWorkspaceStats', applyWorkspaceStats);
    context.expose('updateWorkspaceCounts', updateWorkspaceCounts);
  });
})();
