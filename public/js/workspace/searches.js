(function() {
  const registry = window.__WorkspaceModuleRegistry = window.__WorkspaceModuleRegistry || [];

  registry.push(function applyWorkspaceSearches(context) {
    const state = context.state;

    async function showSavedSearches() {
      console.log('🔍 Opening saved searches');

      const modal = context.createModal('Saved Searches');

      if (state.savedSearches.length === 0) {
        modal.content.innerHTML = '<p>No saved searches yet. Apply filters and save them for quick access.</p>';
      } else {
        const searchList = document.createElement('div');
        searchList.className = 'saved-searches-list';

        state.savedSearches.forEach(search => {
          const searchItem = document.createElement('div');
          searchItem.className = 'saved-search-item';
          const searchId = JSON.stringify(search.id);
          searchItem.innerHTML = `
                        <div class="search-name">${search.searchName || search.search_name}</div>
                        <div class="search-actions">
                            <button onclick="WorkspaceModule.loadSearch(${searchId})" class="btn-small">Load</button>
                            <button onclick="WorkspaceModule.deleteSearch(${searchId})" class="btn-small btn-danger">Delete</button>
                        </div>
                    `;
          searchList.appendChild(searchItem);
        });

        modal.content.appendChild(searchList);
      }

      document.body.appendChild(modal.overlay);
    }

    async function saveCurrentSearch() {
      const nameInput = prompt('Enter a name for this search:');
      if (!nameInput || !nameInput.trim()) return;

      try {
        // Get current filters from FilterModule if available
        const filters = window.FilterModule ? window.FilterModule.getCurrentFilters() : {};

        const response = await fetch('/api/workspace/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            searchName: nameInput.trim(),
            filterParams: filters
          })
        });

        if (response.ok) {
          const data = await response.json();
          state.savedSearches.push(data.search);
          context.updateWorkspaceCounts();
          context.showMessage('Search saved successfully', 'success');
        } else {
          throw new Error('Failed to save search');
        }
      } catch (error) {
        console.error('Error saving search:', error);
        context.showMessage('Failed to save search', 'error');
      }
    }

    async function loadSearch(searchId) {
      try {
        const response = await fetch(`/api/workspace/search/${searchId}`);
        if (response.ok) {
          const data = await response.json();
          const search = data.search;

          // Apply the saved filters
          if (window.FilterModule && search.filterParams) {
            window.FilterModule.applyFilters(search.filterParams);
          }

          // Close modal
          context.closeModal();
          context.showMessage(`Loaded search: ${search.searchName || search.search_name}`, 'success');
        }
      } catch (error) {
        console.error('Error loading search:', error);
        context.showMessage('Failed to load search', 'error');
      }
    }

    async function deleteSearch(searchId) {
      if (!confirm('Delete this saved search?')) return;

      try {
        const response = await fetch(`/api/workspace/search/${searchId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          state.savedSearches = state.savedSearches.filter(s => s.id != searchId);
          showSavedSearches(); // Refresh modal
          context.updateWorkspaceCounts();
          context.showMessage('Search deleted', 'success');
        }
      } catch (error) {
        console.error('Error deleting search:', error);
        context.showMessage('Failed to delete search', 'error');
      }
    }

    context.expose('showSavedSearches', showSavedSearches);
    context.expose('saveCurrentSearch', saveCurrentSearch);
    context.expose('loadSearch', loadSearch);
    context.expose('deleteSearch', deleteSearch);
  });
})();
