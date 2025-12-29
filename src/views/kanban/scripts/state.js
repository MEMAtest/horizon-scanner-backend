function getStateScript({
  serializedTemplates,
  selectedTemplateId,
  serializedSelectedTemplate,
  serializedItemsByStage,
  serializedStatistics,
  serializedAuthorities,
  serializedSectors
}) {
  return `
    <script>
      // Initialize global state
      window.kanbanState = {
        templates: ${serializedTemplates},
        selectedTemplateId: ${JSON.stringify(selectedTemplateId || null)},
        selectedTemplate: ${serializedSelectedTemplate},
        itemsByStage: ${serializedItemsByStage},
        statistics: ${serializedStatistics},
        draggedItemId: null,
        pendingUnlinkItemId: null,
        dropdownOptions: {
          authorities: ${serializedAuthorities},
          sectors: ${serializedSectors}
        }
      };
    </script>`
}

function getStateSection() {
  return `
          init: function() {
            console.log('[Kanban] Initialized with', Object.keys(state.itemsByStage).length, 'stages');
            // Check localStorage for guidance panel state
            const guidanceCollapsed = localStorage.getItem('kanban-guidance-collapsed') === 'true';
            if (guidanceCollapsed) {
              const guidance = document.getElementById('kanban-guidance');
              if (guidance) guidance.classList.add('collapsed');
            }

            // Remember last selected workflow for cross-page actions
            try {
              if (state.selectedTemplateId) {
                localStorage.setItem('kanbanLastTemplateId', String(state.selectedTemplateId));
              }
            } catch (error) {
              // ignore storage errors
            }

            this.openItemFromQuery();
          },

          // Guidance Panel Toggle
          toggleGuidance: function() {
            const guidance = document.getElementById('kanban-guidance');
            if (guidance) {
              guidance.classList.toggle('collapsed');
              const isCollapsed = guidance.classList.contains('collapsed');
              localStorage.setItem('kanban-guidance-collapsed', isCollapsed);
            }
          },

          // Workflow Selection
          changeWorkflow: function(templateId) {
            const currentUrl = new URL(window.location.href);
            if (templateId) {
              currentUrl.searchParams.set('templateId', templateId);
            } else {
              currentUrl.searchParams.delete('templateId');
            }
            window.location.href = currentUrl.toString();
          },

          openItemFromQuery: async function() {
            const params = new URLSearchParams(window.location.search);
            const openItemId = params.get('openItemId');
            if (!openItemId) return;

            const removeQueryParam = () => {
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('openItemId');
                window.history.replaceState({}, '', url.toString());
              } catch (error) {
                // ignore URL errors
              }
            };

            const highlightCard = (card) => {
              if (!card) return;
              card.classList.add('kanban-card-highlight');
              try {
                card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              } catch (error) {
                card.scrollIntoView();
              }
              setTimeout(() => card.classList.remove('kanban-card-highlight'), 4500);
            };

            const findCard = () => {
              try {
                const escaped = window.CSS && window.CSS.escape ? window.CSS.escape(openItemId) : openItemId.replace(/"/g, '\\"');
                return document.querySelector('.kanban-card[data-item-id="' + escaped + '"]');
              } catch (error) {
                return document.querySelector('.kanban-card[data-item-id="' + openItemId + '"]');
              }
            };

            const card = findCard();
            if (card) {
              highlightCard(card);
              removeQueryParam();
              await this.openItemDetail(openItemId);
              return;
            }

            try {
              const response = await fetch('/api/regulatory-changes/' + encodeURIComponent(openItemId), {
                headers: { 'x-user-id': 'default' }
              });
              const result = await response.json().catch(() => ({}));
              const item = result && result.success && result.data ? result.data : null;
              const workflowTemplateId = item && (item.workflow_template_id || item.workflowTemplateId);
              if (workflowTemplateId && String(workflowTemplateId) !== String(state.selectedTemplateId || '')) {
                const url = new URL(window.location.href);
                url.searchParams.set('templateId', workflowTemplateId);
                url.searchParams.set('openItemId', openItemId);
                window.location.href = url.toString();
                return;
              }
            } catch (error) {
              console.warn('[Kanban] Failed to validate openItemId template:', error);
            }

            removeQueryParam();
            await this.openItemDetail(openItemId);
            highlightCard(findCard());
          },

`
}

module.exports = { getStateScript, getStateSection }
