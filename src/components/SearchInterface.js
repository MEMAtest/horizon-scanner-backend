const SearchInterface = require('./SearchInterface/index')

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchInterface
} else {
  window.SearchInterface = SearchInterface
}
