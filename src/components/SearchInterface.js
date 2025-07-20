// ==========================================
// 🔍 Advanced Search Interface Component
// src/components/SearchInterface.js
// ==========================================

class SearchInterface {
    constructor(options = {}) {
        this.containerId = options.containerId || 'search-interface';
        this.onSearch = options.onSearch || (() => {});
        this.onSuggestionSelect = options.onSuggestionSelect || (() => {});
        this.debounceDelay = options.debounceDelay || 300;
        this.maxSuggestions = options.maxSuggestions || 8;
        this.maxRecentSearches = options.maxRecentSearches || 10;
        
        this.currentQuery = '';
        this.suggestions = [];
        this.recentSearches = [];
        this.savedSearches = [];
        this.isAdvancedMode = false;
        this.searchHistory = [];
        
        this.init();
    }

    init() {
        this.loadSavedData();
        this.setupEventListeners();
        this.render();
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('searchInterface');
            if (saved) {
                const data = JSON.parse(saved);
                this.recentSearches = data.recentSearches || [];
                this.savedSearches = data.savedSearches || [];
                this.searchHistory = data.searchHistory || [];
            }
        } catch (e) {
            console.warn('Could not load saved search data:', e);
        }
    }

    saveData() {
        try {
            const data = {
                recentSearches: this.recentSearches,
                savedSearches: this.savedSearches,
                searchHistory: this.searchHistory
            };
            localStorage.setItem('searchInterface', JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save search data:', e);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Close suggestions when clicking outside
            if (!e.target.closest('.search-interface')) {
                this.hideSuggestions();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSuggestions();
                this.clearActiveSearch();
            }
        });
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="search-interface">
                ${this.renderSearchHeader()}
                ${this.renderSearchInput()}
                ${this.renderSearchSuggestions()}
                ${this.renderAdvancedSearch()}
                ${this.renderSavedSearches()}
                ${this.renderRecentSearches()}
            </div>
        `;

        this.attachEventListeners();
    }

    renderSearchHeader() {
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
        `;
    }

    renderSearchInput() {
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
        `;
    }

    renderSearchSuggestions() {
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
        `;
    }

    renderAdvancedSearch() {
        if (!this.isAdvancedMode) return '';
        
        return `
            <div class="advanced-search" data-advanced-search>
                <div class="advanced-search-header">
                    <h3 class="advanced-search-title">🎯 Advanced Search Options</h3>
                    <button 
                        class="advanced-collapse-btn"
                        onclick="searchInterface.toggleAdvancedCollapse()"
                        aria-label="Toggle advanced search"
                    >
                        ▼
                    </button>
                </div>
                
                <div class="advanced-search-content" data-advanced-content>
                    <div class="advanced-search-grid">
                        <div class="advanced-field">
                            <label class="advanced-label">Exact Phrase</label>
                            <input 
                                type="text" 
                                class="advanced-input"
                                placeholder="exact phrase in quotes"
                                data-field="exactPhrase"
                            >
                        </div>
                        
                        <div class="advanced-field">
                            <label class="advanced-label">Any of These Words</label>
                            <input 
                                type="text" 
                                class="advanced-input"
                                placeholder="word1 OR word2 OR word3"
                                data-field="anyWords"
                            >
                        </div>
                        
                        <div class="advanced-field">
                            <label class="advanced-label">None of These Words</label>
                            <input 
                                type="text" 
                                class="advanced-input"
                                placeholder="exclude these terms"
                                data-field="excludeWords"
                            >
                        </div>
                        
                        <div class="advanced-field">
                            <label class="advanced-label">In Title Only</label>
                            <input 
                                type="text" 
                                class="advanced-input"
                                placeholder="search only in titles"
                                data-field="titleOnly"
                            >
                        </div>
                        
                        <div class="advanced-field">
                            <label class="advanced-label">Author/Source</label>
                            <select class="advanced-select" data-field="authority">
                                <option value="">Any Authority</option>
                                <option value="FCA">Financial Conduct Authority</option>
                                <option value="BOE">Bank of England</option>
                                <option value="PRA">Prudential Regulation Authority</option>
                                <option value="TPR">The Pensions Regulator</option>
                                <option value="SFO">Serious Fraud Office</option>
                                <option value="FATF">Financial Action Task Force</option>
                            </select>
                        </div>
                        
                        <div class="advanced-field">
                            <label class="advanced-label">Content Type</label>
                            <select class="advanced-select" data-field="contentType">
                                <option value="">Any Type</option>
                                <option value="consultation">Consultations</option>
                                <option value="guidance">Guidance</option>
                                <option value="policy">Policy Statements</option>
                                <option value="regulation">Regulations</option>
                                <option value="speech">Speeches</option>
                                <option value="report">Reports</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="advanced-actions">
                        <button 
                            class="advanced-btn advanced-btn--secondary"
                            onclick="searchInterface.clearAdvancedFields()"
                        >
                            Clear All Fields
                        </button>
                        <button 
                            class="advanced-btn advanced-btn--primary"
                            onclick="searchInterface.performAdvancedSearch()"
                        >
                            Advanced Search
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSavedSearches() {
        if (this.savedSearches.length === 0) return '';
        
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
        `;
    }

    renderRecentSearches() {
        if (this.recentSearches.length === 0) return '';
        
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
        `;
    }

    // Event Handling
    attachEventListeners() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
                this.updateClearButton();
                this.debounce(() => this.handleSearchInput(), this.debounceDelay)();
            });

            searchInput.addEventListener('keydown', (e) => {
                this.handleSearchKeydown(e);
            });

            searchInput.addEventListener('focus', () => {
                if (this.currentQuery.length > 0) {
                    this.showSuggestions();
                }
            });
        }

        // Advanced search field changes
        const advancedInputs = document.querySelectorAll('.advanced-input, .advanced-select');
        advancedInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateAdvancedSearch();
            });
        });
    }

    handleSearchInput() {
        if (this.currentQuery.length >= 2) {
            this.fetchSuggestions(this.currentQuery);
            this.showSuggestions();
        } else {
            this.hideSuggestions();
        }
    }

    handleSearchKeydown(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.performSearch();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.navigateSuggestions('down');
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.navigateSuggestions('up');
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    // Search Operations
    async performSearch() {
        if (!this.currentQuery.trim()) return;
        
        this.addToRecentSearches(this.currentQuery);
        this.addToSearchHistory(this.currentQuery);
        this.hideSuggestions();
        
        // Show loading state
        this.showSearchLoading(true);
        
        try {
            const results = await this.executeSearch(this.currentQuery);
            this.handleSearchResults(results);
            this.onSearch({ query: this.currentQuery, results });
        } catch (error) {
            console.error('Search failed:', error);
            this.showSearchError(error.message);
        } finally {
            this.showSearchLoading(false);
        }
    }

    async performAdvancedSearch() {
        const fields = this.getAdvancedSearchFields();
        const query = this.buildAdvancedQuery(fields);
        
        if (!query.trim()) {
            this.showSearchError('Please enter at least one search term');
            return;
        }
        
        this.currentQuery = query;
        this.updateSearchInput();
        this.performSearch();
    }

    async executeSearch(query) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Search API error:', error);
            // Return mock results for development
            return this.getMockSearchResults(query);
        }
    }

    getMockSearchResults(query) {
        const mockResults = [
            {
                id: 1,
                title: `FCA guidance on ${query}`,
                content: `Recent regulatory guidance related to ${query}...`,
                authority: 'FCA',
                date: new Date().toISOString(),
                relevance: 0.95
            },
            {
                id: 2,
                title: `Bank of England consultation regarding ${query}`,
                content: `Consultation paper discussing ${query} implications...`,
                authority: 'BOE',
                date: new Date(Date.now() - 86400000).toISOString(),
                relevance: 0.87
            }
        ];
        
        return mockResults.filter(result => 
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.content.toLowerCase().includes(query.toLowerCase())
        );
    }

    async fetchSuggestions(query) {
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                this.suggestions = data.suggestions || [];
            } else {
                this.suggestions = this.getMockSuggestions(query);
            }
        } catch (error) {
            this.suggestions = this.getMockSuggestions(query);
        }
        
        this.updateSuggestionsDisplay();
    }

    getMockSuggestions(query) {
        const allSuggestions = [
            'financial crime prevention',
            'consumer duty requirements',
            'ESG reporting standards',
            'cryptocurrency regulation',
            'operational resilience',
            'market abuse prevention',
            'conduct risk management',
            'prudential requirements',
            'senior managers regime',
            'sustainability disclosure'
        ];
        
        return allSuggestions
            .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
            .slice(0, this.maxSuggestions);
    }

    // UI Updates
    updateSuggestionsDisplay() {
        const suggestionsList = document.querySelector('[data-suggestions-list]');
        if (!suggestionsList) return;
        
        if (this.suggestions.length === 0) {
            suggestionsList.innerHTML = '<div class="no-suggestions">No suggestions found</div>';
            return;
        }
        
        suggestionsList.innerHTML = this.suggestions.map((suggestion, index) => `
            <button 
                class="suggestion-item" 
                data-suggestion-index="${index}"
                onclick="searchInterface.selectSuggestion('${suggestion.replace(/'/g, "\\'")}')"
            >
                <span class="suggestion-icon">🔍</span>
                <span class="suggestion-text">${this.highlightQueryInSuggestion(suggestion)}</span>
            </button>
        `).join('');
    }

    highlightQueryInSuggestion(suggestion) {
        if (!this.currentQuery) return suggestion;
        
        const regex = new RegExp(`(${this.escapeRegex(this.currentQuery)})`, 'gi');
        return suggestion.replace(regex, '<mark>$1</mark>');
    }

    showSuggestions() {
        const suggestionsContainer = document.querySelector('[data-search-suggestions]');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'block';
        }
    }

    hideSuggestions() {
        const suggestionsContainer = document.querySelector('[data-search-suggestions]');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    navigateSuggestions(direction) {
        const suggestions = document.querySelectorAll('.suggestion-item');
        const current = document.querySelector('.suggestion-item--active');
        let newIndex = 0;
        
        if (current) {
            const currentIndex = parseInt(current.dataset.suggestionIndex);
            current.classList.remove('suggestion-item--active');
            
            if (direction === 'down') {
                newIndex = (currentIndex + 1) % suggestions.length;
            } else {
                newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
            }
        }
        
        if (suggestions[newIndex]) {
            suggestions[newIndex].classList.add('suggestion-item--active');
        }
    }

    selectSuggestion(suggestion) {
        this.currentQuery = suggestion;
        this.updateSearchInput();
        this.hideSuggestions();
        this.performSearch();
        this.onSuggestionSelect(suggestion);
    }

    updateSearchInput() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = this.currentQuery;
            this.updateClearButton();
        }
    }

    updateClearButton() {
        const clearBtn = document.querySelector('.search-clear-btn');
        if (clearBtn) {
            clearBtn.style.display = this.currentQuery ? 'flex' : 'none';
        }
    }

    showSearchLoading(show) {
        const searchBtn = document.querySelector('.search-btn--primary');
        if (searchBtn) {
            if (show) {
                searchBtn.textContent = 'Searching...';
                searchBtn.disabled = true;
            } else {
                searchBtn.textContent = 'Search';
                searchBtn.disabled = false;
            }
        }
    }

    showSearchError(message) {
        // Create or update error message
        let errorElement = document.querySelector('.search-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'search-error';
            const inputSection = document.querySelector('.search-input-section');
            if (inputSection) {
                inputSection.appendChild(errorElement);
            }
        }
        
        errorElement.textContent = `Error: ${message}`;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }

    handleSearchResults(results) {
        this.updateResultCount(results.length);
        
        // Update last result count for current search
        const recentIndex = this.recentSearches.findIndex(s => s.query === this.currentQuery);
        if (recentIndex !== -1) {
            this.recentSearches[recentIndex].resultCount = results.length;
        }
        
        this.saveData();
    }

    updateResultCount(count) {
        const countElement = document.getElementById('search-total-results');
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
    }

    // Advanced Search Methods
    setSearchMode(isAdvanced) {
        this.isAdvancedMode = isAdvanced;
        this.render();
    }

    getAdvancedSearchFields() {
        const fields = {};
        const inputs = document.querySelectorAll('.advanced-input, .advanced-select');
        
        inputs.forEach(input => {
            const field = input.dataset.field;
            fields[field] = input.value.trim();
        });
        
        return fields;
    }

    buildAdvancedQuery(fields) {
        const parts = [];
        
        if (fields.exactPhrase) {
            parts.push(`"${fields.exactPhrase}"`);
        }
        
        if (fields.anyWords) {
            const words = fields.anyWords.split(/\s+/).filter(w => w);
            if (words.length > 0) {
                parts.push(`(${words.join(' OR ')})`);
            }
        }
        
        if (fields.excludeWords) {
            const words = fields.excludeWords.split(/\s+/).filter(w => w);
            words.forEach(word => parts.push(`-${word}`));
        }
        
        if (fields.titleOnly) {
            parts.push(`title:${fields.titleOnly}`);
        }
        
        if (fields.authority) {
            parts.push(`authority:${fields.authority}`);
        }
        
        if (fields.contentType) {
            parts.push(`type:${fields.contentType}`);
        }
        
        return parts.join(' ');
    }

    clearAdvancedFields() {
        const inputs = document.querySelectorAll('.advanced-input, .advanced-select');
        inputs.forEach(input => {
            input.value = '';
        });
    }

    toggleAdvancedCollapse() {
        const content = document.querySelector('[data-advanced-content]');
        const button = document.querySelector('.advanced-collapse-btn');
        
        if (content && button) {
            const isCollapsed = content.style.display === 'none';
            content.style.display = isCollapsed ? 'block' : 'none';
            button.textContent = isCollapsed ? '▲' : '▼';
        }
    }

    // Saved Searches Management
    saveCurrentSearch() {
        if (!this.currentQuery.trim()) {
            this.showSearchError('No search query to save');
            return;
        }
        
        const name = prompt('Enter a name for this saved search:', this.currentQuery);
        if (!name) return;
        
        const savedSearch = {
            name: name.trim(),
            query: this.currentQuery,
            saved: new Date().toISOString(),
            lastResultCount: 0
        };
        
        this.savedSearches.unshift(savedSearch);
        this.saveData();
        this.render();
    }

    runSavedSearch(index) {
        const search = this.savedSearches[index];
        if (search) {
            this.currentQuery = search.query;
            this.updateSearchInput();
            this.performSearch();
        }
    }

    editSavedSearch(index) {
        const search = this.savedSearches[index];
        if (!search) return;
        
        const newName = prompt('Edit search name:', search.name);
        if (newName && newName.trim()) {
            this.savedSearches[index].name = newName.trim();
            this.saveData();
            this.render();
        }
    }

    deleteSavedSearch(index) {
        if (confirm('Delete this saved search?')) {
            this.savedSearches.splice(index, 1);
            this.saveData();
            this.render();
        }
    }

    manageSavedSearches() {
        // This could open a modal or navigate to a management page
        alert('Saved searches management - implement as needed');
    }

    // Recent Searches Management
    addToRecentSearches(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;
        
        // Remove existing entry if it exists
        this.recentSearches = this.recentSearches.filter(s => s.query !== trimmedQuery);
        
        // Add to beginning
        this.recentSearches.unshift({
            query: trimmedQuery,
            timestamp: new Date().toISOString()
        });
        
        // Limit size
        this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches);
        this.saveData();
    }

    runRecentSearch(query) {
        this.currentQuery = query;
        this.updateSearchInput();
        this.performSearch();
    }

    clearRecentSearches() {
        if (confirm('Clear all recent searches?')) {
            this.recentSearches = [];
            this.saveData();
            this.render();
        }
    }

    addToSearchHistory(query) {
        this.searchHistory.unshift({
            query: query.trim(),
            timestamp: new Date().toISOString()
        });
        
        // Keep last 100 searches
        this.searchHistory = this.searchHistory.slice(0, 100);
        this.saveData();
    }

    clearSearchHistory() {
        if (confirm('Clear all search history?')) {
            this.searchHistory = [];
            this.saveData();
        }
    }

    // Utility Methods
    clearSearch() {
        this.currentQuery = '';
        this.updateSearchInput();
        this.hideSuggestions();
    }

    clearActiveSearch() {
        this.clearSearch();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.blur();
        }
    }

    toggleSearchOptions() {
        const menu = document.querySelector('[data-search-options-menu]');
        if (menu) {
            const isVisible = menu.style.display !== 'none';
            menu.style.display = isVisible ? 'none' : 'block';
        }
    }

    exportResults() {
        // This would implement result export functionality
        alert('Export results - implement as needed');
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public API
    setQuery(query) {
        this.currentQuery = query;
        this.updateSearchInput();
    }

    getQuery() {
        return this.currentQuery;
    }

    getSavedSearches() {
        return [...this.savedSearches];
    }

    getRecentSearches() {
        return [...this.recentSearches];
    }

    getSearchHistory() {
        return [...this.searchHistory];
    }

    // Cleanup
    destroy() {
        this.saveData();
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchInterface;
} else {
    window.SearchInterface = SearchInterface;
}