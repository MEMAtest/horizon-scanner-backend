/**
 * Workspace Module - Modular entrypoint
 * Loads workspace modules registered on window.__WorkspaceModuleRegistry.
 */

const WorkspaceModule = (function() {
  const state = {
    pinnedUrls: new Set(),
    pinnedUpdateIds: new Set(),
    pinnedItems: [],
    savedSearches: [],
    customAlerts: [],
    bookmarkCollections: [],
    selectedBookmarkCollectionId: 'personal',
    firmProfile: null,
    availableSectors: Array.isArray(window.availableSectors)
      ? Array.from(new Set(window.availableSectors))
      : [],
    annotations: [],
    annotationGroups: {
      flagged: [],
      action_required: [],
      assigned: [],
      note: [],
      triage: [],
      resolved: [],
      others: []
    },
    annotationModalContent: null,
    initPromise: null,
    initialized: false
  };

  const constants = {
    DEFAULT_SECTORS: [
      'Banking',
      'Investment Management',
      'Pension Funds',
      'Insurance',
      'Payments',
      'Consumer Credit',
      'Mortgages',
      'Capital Markets',
      'Cryptocurrency',
      'Fintech',
      'Wealth Management'
    ],
    DEFAULT_TOPIC_AREAS: [
      'Consumer Duty',
      'Operational Resilience',
      'Financial Crime / AML',
      'Sanctions',
      'Capital & Liquidity',
      'Conduct & Market Abuse',
      'Payments',
      'Data Protection',
      'ESG / Sustainability'
    ]
  };

  const context = {
    state,
    constants,
    publicApi: {},
    define(name, value) {
      this[name] = value;
    },
    expose(name, value) {
      this[name] = value;
      this.publicApi[name] = value;
    }
  };

  const registry = Array.isArray(window.__WorkspaceModuleRegistry)
    ? window.__WorkspaceModuleRegistry
    : [];

  registry.forEach(applyModule => {
    if (typeof applyModule === 'function') {
      applyModule(context);
    }
  });

  const publicApi = Object.assign({}, context.publicApi, {
    refresh: function() {
      return typeof context.loadWorkspaceData === 'function'
        ? context.loadWorkspaceData()
        : Promise.resolve();
    },
    getPinnedUrls: function() {
      return Array.from(state.pinnedUrls);
    },
    getPinnedUpdateIds: function() {
      return Array.from(state.pinnedUpdateIds);
    },
    getPinnedItems: function() {
      return state.pinnedItems.slice();
    },
    isInitialized: function() {
      return state.initialized;
    },
    ready: function() {
      if (state.initPromise) return state.initPromise;
      return typeof context.init === 'function' ? context.init() : Promise.resolve();
    }
  });

  return publicApi;
})();

window.WorkspaceModule = WorkspaceModule;
