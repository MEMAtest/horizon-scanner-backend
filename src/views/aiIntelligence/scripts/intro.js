function getAiIntelligenceIntroScript(snapshotJson) {
  return `
      // Global persona switcher for inline onclick handlers
      window.setActivePersona = function(persona) {
        document.querySelectorAll('.persona-tab').forEach(function(tab) {
          tab.classList.toggle('active', tab.dataset.persona === persona);
        });
        document.querySelectorAll('.persona-panel').forEach(function(panel) {
          panel.classList.toggle('active', panel.dataset.personaPanel === persona);
        });
      };
      (function() {
        let snapshot = window.intelligenceSnapshot || ${snapshotJson};
        const state = {
          activePersona: 'executive'
        };

        const quickStatOrder = [
          { key: 'totalUpdates', label: 'Total updates' },
          { key: 'highImpact', label: 'High impact' },
          { key: 'activeAuthorities', label: 'Active authorities' },
          { key: 'deadlinesSoon', label: 'Imminent deadlines' },
          { key: 'urgentUpdates', label: 'Urgent updates' }
        ];

        const streamDefinitions = [
          { key: 'high', title: 'High relevance to your firm' },
          { key: 'medium', title: 'Medium relevance' },
          { key: 'low', title: 'Background intelligence' }
        ];

        const workspaceCardActions = {
          pinned: 'WorkspaceModule && WorkspaceModule.showPinnedItems && WorkspaceModule.showPinnedItems()',
          searches: 'WorkspaceModule && WorkspaceModule.showSavedSearches && WorkspaceModule.showSavedSearches()',
          alerts: 'WorkspaceModule && WorkspaceModule.showCustomAlerts && WorkspaceModule.showCustomAlerts()',
          tasks: 'WorkspaceModule && WorkspaceModule.showAnnotations && WorkspaceModule.showAnnotations()'
        };

        function streamTimestamp(value) {
          if (!value) return 0;
          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? 0 : date.getTime();
        }

`
}

module.exports = { getAiIntelligenceIntroScript }
