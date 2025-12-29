(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceInit(context) {
    const state = context.state;

    async function runInitialization() {
      console.log('🔧 Initializing workspace module...');
      await loadWorkspaceData();
      await loadFirmProfile();
      if (typeof context.loadAnnotations === 'function') {
        await context.loadAnnotations();
      }
      context.updateWorkspaceCounts();
      if (typeof context.updateAnnotationBadge === 'function') {
        context.updateAnnotationBadge();
      }
      state.initialized = true;
    }

    function init(options = {}) {
      if (options && options.force === true) {
        state.initPromise = null;
        state.initialized = false;
      }

      if (state.initPromise) {
        return state.initPromise;
      }

      state.initPromise = runInitialization()
        .catch(error => {
          state.initialized = false;
          state.initPromise = null;
          throw error;
        });

      if (typeof window !== 'undefined') {
        window.WorkspaceModuleReady = state.initPromise.catch(() => {});
      }

      return state.initPromise;
    }

    async function loadWorkspaceData() {
      try {
        if (typeof context.loadBookmarkCollections === 'function') {
          await context.loadBookmarkCollections();
        }

        // Load pinned items
        const pinnedResponse = await fetch('/api/workspace/pinned');
        if (pinnedResponse.ok) {
          const data = await pinnedResponse.json();
          state.pinnedItems = Array.isArray(data.items)
            ? data.items
              .map(context.normalizePinnedItem)
              .filter(Boolean)
            : [];
          state.pinnedUrls = new Set(
            state.pinnedItems
              .map(item => item.update_url)
              .filter(Boolean)
          );
          state.pinnedUpdateIds = new Set(
            state.pinnedItems
              .map(context.getPinnedItemUpdateId)
              .filter(Boolean)
              .map(id => String(id))
          );
          context.broadcastWorkspacePins();
        } else {
          state.pinnedItems = [];
          state.pinnedUrls = new Set();
          state.pinnedUpdateIds = new Set();
          context.broadcastWorkspacePins();
        }

        // Load saved searches
        const searchesResponse = await fetch('/api/workspace/searches');
        if (searchesResponse.ok) {
          const data = await searchesResponse.json();
          state.savedSearches = data.searches;
        }

        // Load custom alerts
        const alertsResponse = await fetch('/api/workspace/alerts');
        if (alertsResponse.ok) {
          const data = await alertsResponse.json();
          state.customAlerts = data.alerts;
        }
      } catch (error) {
        console.error('Error loading workspace data:', error);
      }
      context.applyWorkspaceStats();
    }

    async function loadFirmProfile() {
      try {
        const response = await fetch('/api/firm-profile');
        if (response.ok) {
          const data = await response.json();
          context.setAliasMap(data.sectorAliasMap);
          if (Array.isArray(data.availableSectors)) {
            context.setAvailableSectors(data.availableSectors);
          }
          state.firmProfile = data.profile;
          if (state.firmProfile && Array.isArray(state.firmProfile.primarySectors)) {
            state.firmProfile.primarySectors = state.firmProfile.primarySectors.map(context.normalizeSector).filter(Boolean);
          }
          if (state.firmProfile) {
            context.displayFirmProfileBadge();
          } else {
            context.removeFirmProfileBadge();
          }
        }
      } catch (error) {
        console.error('Error loading firm profile:', error);
      }
    }

    function autoInit() {
      init().catch(error => {
        console.error('WorkspaceModule auto-init failed:', error);
      });
    }

    if (typeof context.setAliasMap === 'function') {
      context.setAliasMap(window.__sectorAliasMap || {});
    }
    if (typeof context.setAvailableSectors === 'function') {
      context.setAvailableSectors(state.availableSectors);
    }
    if (window.initialAnnotationSummary && typeof context.updateAnnotationBadge === 'function') {
      context.updateAnnotationBadge(window.initialAnnotationSummary);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit, { once: true });
    } else {
      autoInit();
    }

    context.define('runInitialization', runInitialization);
    context.expose('init', init);
    context.define('loadWorkspaceData', loadWorkspaceData);
    context.define('loadFirmProfile', loadFirmProfile);
    context.define('autoInit', autoInit);
  });
})();
