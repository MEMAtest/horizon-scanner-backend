async function fetchSuggestions(query) {
  try {
    const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
    if (response.ok) {
      const data = await response.json()
      this.suggestions = data.suggestions || []
    } else {
      this.suggestions = this.getMockSuggestions(query)
    }
  } catch (error) {
    this.suggestions = this.getMockSuggestions(query)
  }

  this.updateSuggestionsDisplay()
}

function getMockSuggestions(query) {
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
  ]

  return allSuggestions
    .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
    .slice(0, this.maxSuggestions)
}

// UI Updates
function updateSuggestionsDisplay() {
  const suggestionsList = document.querySelector('[data-suggestions-list]')
  if (!suggestionsList) return

  if (this.suggestions.length === 0) {
    suggestionsList.innerHTML = '<div class="no-suggestions">No suggestions found</div>'
    return
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
        `).join('')
}

function highlightQueryInSuggestion(suggestion) {
  if (!this.currentQuery) return suggestion

  const regex = new RegExp(`(${this.escapeRegex(this.currentQuery)})`, 'gi')
  return suggestion.replace(regex, '<mark>$1</mark>')
}

function showSuggestions() {
  const suggestionsContainer = document.querySelector('[data-search-suggestions]')
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'block'
  }
}

function hideSuggestions() {
  const suggestionsContainer = document.querySelector('[data-search-suggestions]')
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none'
  }
}

function navigateSuggestions(direction) {
  const suggestions = document.querySelectorAll('.suggestion-item')
  const current = document.querySelector('.suggestion-item--active')
  let newIndex = 0

  if (current) {
    const currentIndex = parseInt(current.dataset.suggestionIndex)
    current.classList.remove('suggestion-item--active')

    if (direction === 'down') {
      newIndex = (currentIndex + 1) % suggestions.length
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1
    }
  }

  if (suggestions[newIndex]) {
    suggestions[newIndex].classList.add('suggestion-item--active')
  }
}

function selectSuggestion(suggestion) {
  this.currentQuery = suggestion
  this.updateSearchInput()
  this.hideSuggestions()
  this.performSearch()
  this.onSuggestionSelect(suggestion)
}

module.exports = {
  fetchSuggestions,
  getMockSuggestions,
  updateSuggestionsDisplay,
  highlightQueryInSuggestion,
  showSuggestions,
  hideSuggestions,
  navigateSuggestions,
  selectSuggestion
}
