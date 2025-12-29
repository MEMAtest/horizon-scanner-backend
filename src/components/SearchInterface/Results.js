async function performSearch() {
  if (!this.currentQuery.trim()) return

  this.addToRecentSearches(this.currentQuery)
  this.addToSearchHistory(this.currentQuery)
  this.hideSuggestions()

  // Show loading state
  this.showSearchLoading(true)

  try {
    const results = await this.executeSearch(this.currentQuery)
    this.handleSearchResults(results)
    this.onSearch({ query: this.currentQuery, results })
  } catch (error) {
    console.error('Search failed:', error)
    this.showSearchError(error.message)
  } finally {
    this.showSearchLoading(false)
  }
}

async function performAdvancedSearch() {
  const fields = this.getAdvancedSearchFields()
  const query = this.buildAdvancedQuery(fields)

  if (!query.trim()) {
    this.showSearchError('Please enter at least one search term')
    return
  }

  this.currentQuery = query
  this.updateSearchInput()
  this.performSearch()
}

async function executeSearch(query) {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Search API error:', error)
    // Return mock results for development
    return this.getMockSearchResults(query)
  }
}

function getMockSearchResults(query) {
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
  ]

  return mockResults.filter(result =>
    result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.content.toLowerCase().includes(query.toLowerCase())
  )
}

function showSearchLoading(show) {
  const searchBtn = document.querySelector('.search-btn--primary')
  if (searchBtn) {
    if (show) {
      searchBtn.textContent = 'Searching...'
      searchBtn.disabled = true
    } else {
      searchBtn.textContent = 'Search'
      searchBtn.disabled = false
    }
  }
}

function showSearchError(message) {
  // Create or update error message
  let errorElement = document.querySelector('.search-error')
  if (!errorElement) {
    errorElement = document.createElement('div')
    errorElement.className = 'search-error'
    const inputSection = document.querySelector('.search-input-section')
    if (inputSection) {
      inputSection.appendChild(errorElement)
    }
  }

  errorElement.textContent = `Error: ${message}`
  errorElement.style.display = 'block'

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (errorElement) {
      errorElement.style.display = 'none'
    }
  }, 5000)
}

function handleSearchResults(results) {
  this.updateResultCount(results.length)

  // Update last result count for current search
  const recentIndex = this.recentSearches.findIndex(s => s.query === this.currentQuery)
  if (recentIndex !== -1) {
    this.recentSearches[recentIndex].resultCount = results.length
  }

  this.saveData()
}

function updateResultCount(count) {
  const countElement = document.getElementById('search-total-results')
  if (countElement) {
    countElement.textContent = count.toLocaleString()
  }
}

function exportResults() {
  // This would implement result export functionality
  alert('Export results - implement as needed')
}

module.exports = {
  performSearch,
  performAdvancedSearch,
  executeSearch,
  getMockSearchResults,
  showSearchLoading,
  showSearchError,
  handleSearchResults,
  updateResultCount,
  exportResults
}
