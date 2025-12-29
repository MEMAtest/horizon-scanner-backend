const {
  render,
  renderSearchHeader,
  renderSearchInput,
  renderSearchSuggestions,
  renderSavedSearches,
  renderRecentSearches
} = require('./Header')
const {
  renderAdvancedSearch,
  setSearchMode,
  getAdvancedSearchFields,
  buildAdvancedQuery,
  clearAdvancedFields,
  toggleAdvancedCollapse
} = require('./Filters')
const {
  performSearch,
  performAdvancedSearch,
  executeSearch,
  getMockSearchResults,
  showSearchLoading,
  showSearchError,
  handleSearchResults,
  updateResultCount,
  exportResults
} = require('./Results')
const {
  fetchSuggestions,
  getMockSuggestions,
  updateSuggestionsDisplay,
  highlightQueryInSuggestion,
  showSuggestions,
  hideSuggestions,
  navigateSuggestions,
  selectSuggestion
} = require('./Pagination')
const {
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
} = require('./hooks/useSearchState')

class SearchInterface {
  constructor(options = {}) {
    this.containerId = options.containerId || 'search-interface'
    this.onSearch = options.onSearch || (() => {})
    this.onSuggestionSelect = options.onSuggestionSelect || (() => {})
    this.debounceDelay = options.debounceDelay || 300
    this.maxSuggestions = options.maxSuggestions || 8
    this.maxRecentSearches = options.maxRecentSearches || 10

    this.currentQuery = ''
    this.suggestions = []
    this.recentSearches = []
    this.savedSearches = []
    this.isAdvancedMode = false
    this.searchHistory = []

    this.init()
  }
}

Object.assign(SearchInterface.prototype, {
  init,
  loadSavedData,
  saveData,
  setupEventListeners,
  render,
  renderSearchHeader,
  renderSearchInput,
  renderSearchSuggestions,
  renderAdvancedSearch,
  renderSavedSearches,
  renderRecentSearches,
  attachEventListeners,
  handleSearchInput,
  handleSearchKeydown,
  performSearch,
  performAdvancedSearch,
  executeSearch,
  getMockSearchResults,
  fetchSuggestions,
  getMockSuggestions,
  updateSuggestionsDisplay,
  highlightQueryInSuggestion,
  showSuggestions,
  hideSuggestions,
  navigateSuggestions,
  selectSuggestion,
  updateSearchInput,
  updateClearButton,
  showSearchLoading,
  showSearchError,
  handleSearchResults,
  updateResultCount,
  setSearchMode,
  getAdvancedSearchFields,
  buildAdvancedQuery,
  clearAdvancedFields,
  toggleAdvancedCollapse,
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
  clearSearch,
  clearActiveSearch,
  toggleSearchOptions,
  exportResults,
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
})

module.exports = SearchInterface
