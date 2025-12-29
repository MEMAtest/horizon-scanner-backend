function render() {
  const container = document.getElementById(this.containerId)
  if (!container) return

  container.innerHTML = `
            <div class="search-interface">
                ${this.renderSearchHeader()}
                ${this.renderSearchInput()}
                ${this.renderSearchSuggestions()}
                ${this.renderAdvancedSearch()}
                ${this.renderSavedSearches()}
                ${this.renderRecentSearches()}
            </div>
        `

  this.attachEventListeners()
}

function renderSearchHeader() {
  return `
            <div class="search-header">
                <div class="search-title-section">
                    <h2 class="search-title">
                        <span class="search-icon">🔍</span>
                        Search Intelligence
                    </h2>
                    <div class="search-mode-toggle">
                        <button 
                            class="mode-toggle-btn ${!this.isAdvancedMode ? 'mode-toggle-btn--active' : ''}"
                            onclick="searchInterface.setSearchMode(false)"
                        >
                            Simple
                        </button>
                        <button 
                            class="mode-toggle-btn ${this.isAdvancedMode ? 'mode-toggle-btn--active' : ''}"
                            onclick="searchInterface.setSearchMode(true)"
                        >
                            Advanced
                        </button>
                    </div>
                </div>
                
                <div class="search-stats">
                    <span class="search-stat">
                        <span class="stat-number" id="search-total-results">0</span>
                        <span class="stat-label">results</span>
                    </span>
                    <span class="search-stat">
                        <span class="stat-number">${this.savedSearches.length}</span>
                        <span class="stat-label">saved searches</span>
                    </span>
                </div>
            </div>
        `
}

function renderSearchInput() {
  return `
            <div class="search-input-section">
                <div class="search-input-wrapper">
                    <div class="search-input-container">
                        <span class="search-input-icon">🔍</span>
                        <input 
                            type="text" 
                            class="search-input"
                            placeholder="Search regulatory updates, authorities, topics..."
                            value="${this.currentQuery}"
                            autocomplete="off"
                            spellcheck="false"
                            aria-label="Search regulatory updates"
                            aria-describedby="search-help-text"
                        >
                        <button 
                            class="search-clear-btn" 
                            onclick="searchInterface.clearSearch()"
                            style="display: ${this.currentQuery ? 'flex' : 'none'}"
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div class="search-actions">
                        <button 
                            class="search-btn search-btn--primary"
                            onclick="searchInterface.performSearch()"
                        >
                            Search
                        </button>
                        
                        <div class="search-options-dropdown">
                            <button 
                                class="search-options-btn"
                                onclick="searchInterface.toggleSearchOptions()"
                                aria-label="Search options"
                            >
                                ⚙️
                            </button>
                            <div class="search-options-menu" data-search-options-menu style="display: none;">
                                <button onclick="searchInterface.saveCurrentSearch()">Save Search</button>
                                <button onclick="searchInterface.exportResults()">Export Results</button>
                                <button onclick="searchInterface.setSearchMode(true)">Advanced Mode</button>
                                <button onclick="searchInterface.clearSearchHistory()">Clear History</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="search-help-text" id="search-help-text">
                    Search tips: Use quotes for exact phrases, OR for alternatives, - to exclude terms
                </div>
            </div>
        `
}

function renderSearchSuggestions() {
  return `
            <div class="search-suggestions" data-search-suggestions style="display: none;">
                <div class="suggestions-header">
                    <span class="suggestions-title">Suggestions</span>
                    <button 
                        class="suggestions-close" 
                        onclick="searchInterface.hideSuggestions()"
                        aria-label="Close suggestions"
                    >
                        ✕
                    </button>
                </div>
                <div class="suggestions-list" data-suggestions-list>
                    <!-- Dynamic suggestions will be inserted here -->
                </div>
            </div>
        `
}

function renderSavedSearches() {
  if (this.savedSearches.length === 0) return ''

  return `
            <div class="saved-searches">
                <div class="saved-searches-header">
                    <h3 class="saved-searches-title">💾 Saved Searches</h3>
                    <button 
                        class="manage-saves-btn"
                        onclick="searchInterface.manageSavedSearches()"
                    >
                        Manage
                    </button>
                </div>
                
                <div class="saved-searches-list">
                    ${this.savedSearches.map((search, index) => `
                        <div class="saved-search-item">
                            <div class="saved-search-content">
                                <div class="saved-search-name">${search.name}</div>
                                <div class="saved-search-query">${search.query}</div>
                                <div class="saved-search-meta">
                                    <span class="saved-search-date">${this.formatDate(search.saved)}</span>
                                    <span class="saved-search-results">${search.lastResultCount || 0} results</span>
                                </div>
                            </div>
                            
                            <div class="saved-search-actions">
                                <button 
                                    class="saved-search-btn"
                                    onclick="searchInterface.runSavedSearch(${index})"
                                    aria-label="Run saved search"
                                >
                                    ▶️
                                </button>
                                <button 
                                    class="saved-search-btn"
                                    onclick="searchInterface.editSavedSearch(${index})"
                                    aria-label="Edit saved search"
                                >
                                    ✏️
                                </button>
                                <button 
                                    class="saved-search-btn saved-search-btn--danger"
                                    onclick="searchInterface.deleteSavedSearch(${index})"
                                    aria-label="Delete saved search"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
}

function renderRecentSearches() {
  if (this.recentSearches.length === 0) return ''

  return `
            <div class="recent-searches">
                <div class="recent-searches-header">
                    <h3 class="recent-searches-title">🕐 Recent Searches</h3>
                    <button 
                        class="clear-recent-btn"
                        onclick="searchInterface.clearRecentSearches()"
                    >
                        Clear
                    </button>
                </div>
                
                <div class="recent-searches-list">
                    ${this.recentSearches.slice(0, 5).map((search, index) => `
                        <div class="recent-search-item">
                            <button 
                                class="recent-search-btn"
                                onclick="searchInterface.runRecentSearch('${search.query.replace(/'/g, "\\'")}')"
                            >
                                <span class="recent-search-icon">🔍</span>
                                <span class="recent-search-text">${search.query}</span>
                                <span class="recent-search-time">${this.formatRelativeTime(search.timestamp)}</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
}

module.exports = {
  render,
  renderSearchHeader,
  renderSearchInput,
  renderSearchSuggestions,
  renderSavedSearches,
  renderRecentSearches
}
