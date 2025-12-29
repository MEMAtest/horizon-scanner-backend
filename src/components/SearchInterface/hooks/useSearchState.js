function init() {
  this.loadSavedData()
  this.setupEventListeners()
  this.render()
}

function loadSavedData() {
  try {
    const saved = localStorage.getItem('searchInterface')
    if (saved) {
      const data = JSON.parse(saved)
      this.recentSearches = data.recentSearches || []
      this.savedSearches = data.savedSearches || []
      this.searchHistory = data.searchHistory || []
    }
  } catch (e) {
    console.warn('Could not load saved search data:', e)
  }
}

function saveData() {
  try {
    const data = {
      recentSearches: this.recentSearches,
      savedSearches: this.savedSearches,
      searchHistory: this.searchHistory
    }
    localStorage.setItem('searchInterface', JSON.stringify(data))
  } catch (e) {
    console.warn('Could not save search data:', e)
  }
}

function setupEventListeners() {
  document.addEventListener('click', (e) => {
    // Close suggestions when clicking outside
    if (!e.target.closest('.search-interface')) {
      this.hideSuggestions()
    }
  })

  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      this.hideSuggestions()
      this.clearActiveSearch()
    }
  })
}

// Event Handling
function attachEventListeners() {
  const searchInput = document.querySelector('.search-input')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      this.currentQuery = e.target.value
      this.updateClearButton()
      this.debounce(() => this.handleSearchInput(), this.debounceDelay)()
    })

    searchInput.addEventListener('keydown', (e) => {
      this.handleSearchKeydown(e)
    })

    searchInput.addEventListener('focus', () => {
      if (this.currentQuery.length > 0) {
        this.showSuggestions()
      }
    })
  }

  // Advanced search field changes
  const advancedInputs = document.querySelectorAll('.advanced-input, .advanced-select')
  advancedInputs.forEach(input => {
    input.addEventListener('change', () => {
      this.updateAdvancedSearch()
    })
  })
}

function handleSearchInput() {
  if (this.currentQuery.length >= 2) {
    this.fetchSuggestions(this.currentQuery)
    this.showSuggestions()
  } else {
    this.hideSuggestions()
  }
}

function handleSearchKeydown(e) {
  switch (e.key) {
    case 'Enter':
      e.preventDefault()
      this.performSearch()
      break
    case 'ArrowDown':
      e.preventDefault()
      this.navigateSuggestions('down')
      break
    case 'ArrowUp':
      e.preventDefault()
      this.navigateSuggestions('up')
      break
    case 'Escape':
      this.hideSuggestions()
      break
  }
}

function updateSearchInput() {
  const searchInput = document.querySelector('.search-input')
  if (searchInput) {
    searchInput.value = this.currentQuery
    this.updateClearButton()
  }
}

function updateClearButton() {
  const clearBtn = document.querySelector('.search-clear-btn')
  if (clearBtn) {
    clearBtn.style.display = this.currentQuery ? 'flex' : 'none'
  }
}

function toggleSearchOptions() {
  const menu = document.querySelector('[data-search-options-menu]')
  if (menu) {
    const isVisible = menu.style.display !== 'none'
    menu.style.display = isVisible ? 'none' : 'block'
  }
}

// Utility Methods
function clearSearch() {
  this.currentQuery = ''
  this.updateSearchInput()
  this.hideSuggestions()
}

function clearActiveSearch() {
  this.clearSearch()
  const searchInput = document.querySelector('.search-input')
  if (searchInput) {
    searchInput.blur()
  }
}

// Saved Searches Management
function saveCurrentSearch() {
  if (!this.currentQuery.trim()) {
    this.showSearchError('No search query to save')
    return
  }

  const name = prompt('Enter a name for this saved search:', this.currentQuery)
  if (!name) return

  const savedSearch = {
    name: name.trim(),
    query: this.currentQuery,
    saved: new Date().toISOString(),
    lastResultCount: 0
  }

  this.savedSearches.unshift(savedSearch)
  this.saveData()
  this.render()
}

function runSavedSearch(index) {
  const search = this.savedSearches[index]
  if (search) {
    this.currentQuery = search.query
    this.updateSearchInput()
    this.performSearch()
  }
}

function editSavedSearch(index) {
  const search = this.savedSearches[index]
  if (!search) return

  const newName = prompt('Edit search name:', search.name)
  if (newName && newName.trim()) {
    this.savedSearches[index].name = newName.trim()
    this.saveData()
    this.render()
  }
}

function deleteSavedSearch(index) {
  if (confirm('Delete this saved search?')) {
    this.savedSearches.splice(index, 1)
    this.saveData()
    this.render()
  }
}

function manageSavedSearches() {
  // This could open a modal or navigate to a management page
  alert('Saved searches management - implement as needed')
}

// Recent Searches Management
function addToRecentSearches(query) {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return

  // Remove existing entry if it exists
  this.recentSearches = this.recentSearches.filter(s => s.query !== trimmedQuery)

  // Add to beginning
  this.recentSearches.unshift({
    query: trimmedQuery,
    timestamp: new Date().toISOString()
  })

  // Limit size
  this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches)
  this.saveData()
}

function runRecentSearch(query) {
  this.currentQuery = query
  this.updateSearchInput()
  this.performSearch()
}

function clearRecentSearches() {
  if (confirm('Clear all recent searches?')) {
    this.recentSearches = []
    this.saveData()
    this.render()
  }
}

function addToSearchHistory(query) {
  this.searchHistory.unshift({
    query: query.trim(),
    timestamp: new Date().toISOString()
  })

  // Keep last 100 searches
  this.searchHistory = this.searchHistory.slice(0, 100)
  this.saveData()
}

function clearSearchHistory() {
  if (confirm('Clear all search history?')) {
    this.searchHistory = []
    this.saveData()
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

function formatRelativeTime(timestamp) {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Public API
function setQuery(query) {
  this.currentQuery = query
  this.updateSearchInput()
}

function getQuery() {
  return this.currentQuery
}

function getSavedSearches() {
  return [...this.savedSearches]
}

function getRecentSearches() {
  return [...this.recentSearches]
}

function getSearchHistory() {
  return [...this.searchHistory]
}

// Cleanup
function destroy() {
  this.saveData()
  const container = document.getElementById(this.containerId)
  if (container) {
    container.innerHTML = ''
  }
}

module.exports = {
  init,
  loadSavedData,
  saveData,
  setupEventListeners,
  attachEventListeners,
  handleSearchInput,
  handleSearchKeydown,
  updateSearchInput,
  updateClearButton,
  toggleSearchOptions,
  clearSearch,
  clearActiveSearch,
  saveCurrentSearch,
  runSavedSearch,
  editSavedSearch,
  deleteSavedSearch,
  manageSavedSearches,
  addToRecentSearches,
  runRecentSearch,
  clearRecentSearches,
  addToSearchHistory,
  clearSearchHistory,
  formatDate,
  formatRelativeTime,
  escapeRegex,
  debounce,
  setQuery,
  getQuery,
  getSavedSearches,
  getRecentSearches,
  getSearchHistory,
  destroy
}
