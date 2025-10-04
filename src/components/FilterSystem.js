// ==========================================
// 🎛️ Advanced Filter System Component
// src/components/FilterSystem.js
// ==========================================

class FilterSystem {
  constructor(options = {}) {
    this.containerId = options.containerId || 'filter-system'
    this.onFilterChange = options.onFilterChange || (() => {})
    this.initialFilters = options.initialFilters || {}

    this.filters = {
      authorities: [],
      contentTypes: [],
      dateRange: { start: '', end: '' },
      sectors: [],
      urgency: [],
      impact: [],
      keywords: ''
    }

    this.filterDefinitions = this.getFilterDefinitions()
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.loadSavedFilters()
    this.render()
  }

  getFilterDefinitions() {
    return {
      authorities: {
        label: 'Regulatory Authorities',
        icon: '🏛️',
        type: 'checkbox',
        options: [
          { value: 'FCA', label: 'Financial Conduct Authority', color: '#00205b' },
          { value: 'BOE', label: 'Bank of England', color: '#8b1538' },
          { value: 'PRA', label: 'Prudential Regulation Authority', color: '#003d82' },
          { value: 'TPR', label: 'The Pensions Regulator', color: '#0085ca' },
          { value: 'SFO', label: 'Serious Fraud Office', color: '#1d4ed8' },
          { value: 'FATF', label: 'Financial Action Task Force', color: '#059669' },
          { value: 'ESMA', label: 'European Securities and Markets Authority', color: '#7c3aed' },
          { value: 'EBA', label: 'European Banking Authority', color: '#dc2626' }
        ]
      },
      contentTypes: {
        label: 'Content Types',
        icon: '📄',
        type: 'checkbox',
        options: [
          { value: 'consultation', label: 'Consultations' },
          { value: 'guidance', label: 'Guidance' },
          { value: 'policy', label: 'Policy Statements' },
          { value: 'regulation', label: 'Regulations' },
          { value: 'speech', label: 'Speeches' },
          { value: 'report', label: 'Reports' },
          { value: 'news', label: 'News Updates' },
          { value: 'enforcement', label: 'Enforcement Actions' }
        ]
      },
      sectors: {
        label: 'Industry Sectors',
        icon: '🏭',
        type: 'checkbox',
        options: [
          { value: 'banking', label: 'Banking' },
          { value: 'insurance', label: 'Insurance' },
          { value: 'investment', label: 'Investment Management' },
          { value: 'fintech', label: 'Fintech' },
          { value: 'crypto', label: 'Cryptocurrency' },
          { value: 'payments', label: 'Payments' },
          { value: 'pensions', label: 'Pensions' },
          { value: 'markets', label: 'Capital Markets' }
        ]
      },
      urgency: {
        label: 'Urgency Level',
        icon: '⚡',
        type: 'radio',
        options: [
          { value: 'high', label: 'High Priority', color: '#dc2626' },
          { value: 'medium', label: 'Medium Priority', color: '#f59e0b' },
          { value: 'low', label: 'Low Priority', color: '#059669' },
          { value: 'all', label: 'All Levels', color: '#6b7280' }
        ]
      },
      impact: {
        label: 'Business Impact',
        icon: '📊',
        type: 'checkbox',
        options: [
          { value: 'significant', label: 'Significant Impact' },
          { value: 'moderate', label: 'Moderate Impact' },
          { value: 'minimal', label: 'Minimal Impact' },
          { value: 'informational', label: 'Informational Only' }
        ]
      }
    }
  }

  render() {
    const container = document.getElementById(this.containerId)
    if (!container) return

    container.innerHTML = `
            <div class="filter-system">
                ${this.renderFilterHeader()}
                ${this.renderFilterContent()}
                ${this.renderFilterFooter()}
            </div>
        `

    this.attachEventListeners()
  }

  renderFilterHeader() {
    const activeCount = this.getActiveFilterCount()

    return `
            <div class="filter-header">
                <div class="filter-title-section">
                    <h2 class="filter-title">
                        <span class="filter-icon">🎛️</span>
                        Advanced Filters
                    </h2>
                    ${activeCount > 0
? `
                        <span class="active-filter-count">${activeCount} active</span>
                    `
: ''}
                </div>
                
                <div class="filter-header-actions">
                    <button 
                        class="filter-btn filter-btn--ghost" 
                        onclick="filterSystem.toggleCollapse()"
                        aria-label="Toggle filter panel"
                    >
                        <span class="filter-collapse-icon">▼</span>
                    </button>
                    
                    <button 
                        class="filter-btn filter-btn--ghost" 
                        onclick="filterSystem.clearAllFilters()"
                        ${activeCount === 0 ? 'disabled' : ''}
                    >
                        Clear All
                    </button>
                    
                    <button 
                        class="filter-btn filter-btn--primary" 
                        onclick="filterSystem.saveCurrentFilters()"
                    >
                        Save Filters
                    </button>
                </div>
            </div>
        `
  }

  renderFilterContent() {
    return `
            <div class="filter-content" data-filter-content>
                <div class="filter-grid">
                    ${this.renderKeywordSearch()}
                    ${this.renderDateRangeFilter()}
                    ${Object.entries(this.filterDefinitions).map(([key, definition]) =>
                        this.renderFilterSection(key, definition)
                    ).join('')}
                </div>
                
                ${this.renderActiveFiltersDisplay()}
            </div>
        `
  }

  renderKeywordSearch() {
    return `
            <div class="filter-section filter-section--full">
                <label class="filter-label">
                    <span class="filter-icon">🔍</span>
                    Keyword Search
                </label>
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        class="filter-input filter-input--search"
                        placeholder="Search in titles, content, summaries..."
                        value="${this.filters.keywords}"
                        data-filter="keywords"
                        maxlength="200"
                    >
                    <button class="search-clear-btn" onclick="filterSystem.clearKeywords()" style="display: ${this.filters.keywords ? 'block' : 'none'}">
                        ✕
                    </button>
                </div>
            </div>
        `
  }

  renderDateRangeFilter() {
    return `
            <div class="filter-section filter-section--half">
                <label class="filter-label">
                    <span class="filter-icon">📅</span>
                    Date Range
                </label>
                <div class="date-range-inputs">
                    <input 
                        type="date" 
                        class="filter-input filter-input--date"
                        placeholder="Start date"
                        value="${this.filters.dateRange.start}"
                        data-filter="dateStart"
                        max="${new Date().toISOString().split('T')[0]}"
                    >
                    <span class="date-separator">to</span>
                    <input 
                        type="date" 
                        class="filter-input filter-input--date"
                        placeholder="End date"
                        value="${this.filters.dateRange.end}"
                        data-filter="dateEnd"
                        max="${new Date().toISOString().split('T')[0]}"
                    >
                </div>
                <div class="date-presets">
                    <button class="date-preset-btn" onclick="filterSystem.setDatePreset('today')">Today</button>
                    <button class="date-preset-btn" onclick="filterSystem.setDatePreset('week')">This Week</button>
                    <button class="date-preset-btn" onclick="filterSystem.setDatePreset('month')">This Month</button>
                </div>
            </div>
        `
  }

  renderFilterSection(key, definition) {
    const sectionClass = definition.options.length > 6 ? 'filter-section--full' : 'filter-section--half'

    return `
            <div class="filter-section ${sectionClass}">
                <label class="filter-label">
                    <span class="filter-icon">${definition.icon}</span>
                    ${definition.label}
                </label>
                
                <div class="filter-options ${definition.type === 'checkbox' ? 'filter-options--checkbox' : 'filter-options--radio'}">
                    ${definition.options.map(option =>
                        this.renderFilterOption(key, option, definition.type)
                    ).join('')}
                </div>
                
                ${definition.options.length > 6 ? this.renderSelectAllControls(key) : ''}
            </div>
        `
  }

  renderFilterOption(filterKey, option, type) {
    const isChecked = type === 'radio'
      ? this.filters[filterKey] === option.value
      : this.filters[filterKey].includes(option.value)

    const inputId = `${filterKey}-${option.value}`

    return `
            <label class="filter-option" for="${inputId}">
                <input 
                    type="${type}" 
                    id="${inputId}"
                    name="${filterKey}"
                    value="${option.value}"
                    ${isChecked ? 'checked' : ''}
                    data-filter="${filterKey}"
                >
                <span class="filter-option-checkmark" ${option.color ? `style="--option-color: ${option.color}"` : ''}></span>
                <span class="filter-option-label">${option.label}</span>
            </label>
        `
  }

  renderSelectAllControls(filterKey) {
    const allSelected = this.filters[filterKey].length === this.filterDefinitions[filterKey].options.length

    return `
            <div class="filter-section-controls">
                <button 
                    class="filter-control-btn" 
                    onclick="filterSystem.selectAll('${filterKey.replace(/'/g, "\\'").replace(/"/g, '\\"')}')"
                    ${allSelected ? 'disabled' : ''}
                >
                    Select All
                </button>
                <button 
                    class="filter-control-btn" 
                    onclick="filterSystem.clearFilter('${filterKey.replace(/'/g, "\\'").replace(/"/g, '\\"')}')"
                    ${this.filters[filterKey].length === 0 ? 'disabled' : ''}
                >
                    Clear
                </button>
            </div>
        `
  }

  renderActiveFiltersDisplay() {
    const activeFilters = this.getActiveFiltersForDisplay()

    if (activeFilters.length === 0) return ''

    return `
            <div class="active-filters">
                <div class="active-filters-header">
                    <span class="active-filters-label">Active Filters:</span>
                    <button class="active-filters-clear" onclick="filterSystem.clearAllFilters()">
                        Clear All
                    </button>
                </div>
                <div class="active-filters-list">
                    ${activeFilters.map(filter => `
                        <span class="active-filter-tag">
                            <span class="active-filter-text">${filter.label}</span>
                            <button 
                                class="active-filter-remove" 
                                onclick="filterSystem.removeActiveFilter('${filter.key.replace(/'/g, "\\'").replace(/"/g, '\\"')}', '${filter.value.replace(/'/g, "\\'").replace(/"/g, '\\"')}')"
                                aria-label="Remove ${filter.label} filter"
                            >
                                ✕
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `
  }

  renderFilterFooter() {
    return `
            <div class="filter-footer">
                <div class="filter-stats">
                    <span class="filter-result-count">
                        Showing <strong id="filter-result-count">0</strong> results
                    </span>
                </div>
                
                <div class="filter-actions">
                    <button 
                        class="filter-btn filter-btn--secondary" 
                        onclick="filterSystem.resetToDefaults()"
                    >
                        Reset to Defaults
                    </button>
                    
                    <button 
                        class="filter-btn filter-btn--primary" 
                        onclick="filterSystem.applyFilters()"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        `
  }

  // Event Handling
  attachEventListeners() {
    const container = document.getElementById(this.containerId)

    // Checkbox and radio changes
    container.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
        this.handleFilterChange(e.target)
      }
    })

    // Text input changes (debounced)
    container.addEventListener('input', (e) => {
      if (e.target.matches('input[type="text"], input[type="date"]')) {
        this.debounce(() => this.handleInputChange(e.target), 300)()
      }
    })
  }

  setupEventListeners() {
    // Global event listeners that persist
    document.addEventListener('DOMContentLoaded', () => {
      this.loadSavedFilters()
    })
  }

  handleFilterChange(input) {
    const filterKey = input.dataset.filter
    const value = input.value

    if (input.type === 'checkbox') {
      if (input.checked) {
        if (!this.filters[filterKey].includes(value)) {
          this.filters[filterKey].push(value)
        }
      } else {
        this.filters[filterKey] = this.filters[filterKey].filter(v => v !== value)
      }
    } else if (input.type === 'radio') {
      this.filters[filterKey] = value
    }

    this.updateActiveFiltersDisplay()
    this.onFilterChange(this.filters)
  }

  handleInputChange(input) {
    const filterKey = input.dataset.filter
    const value = input.value

    if (filterKey === 'keywords') {
      this.filters.keywords = value
      this.updateSearchClearButton()
    } else if (filterKey === 'dateStart') {
      this.filters.dateRange.start = value
    } else if (filterKey === 'dateEnd') {
      this.filters.dateRange.end = value
    }

    this.updateActiveFiltersDisplay()
    this.onFilterChange(this.filters)
  }

  // Public API Methods
  selectAll(filterKey) {
    const definition = this.filterDefinitions[filterKey]
    this.filters[filterKey] = definition.options.map(option => option.value)
    this.render()
    this.onFilterChange(this.filters)
  }

  clearFilter(filterKey) {
    if (filterKey === 'keywords') {
      this.filters.keywords = ''
    } else if (filterKey === 'dateRange') {
      this.filters.dateRange = { start: '', end: '' }
    } else {
      this.filters[filterKey] = []
    }
    this.render()
    this.onFilterChange(this.filters)
  }

  clearAllFilters() {
    this.filters = {
      authorities: [],
      contentTypes: [],
      dateRange: { start: '', end: '' },
      sectors: [],
      urgency: [],
      impact: [],
      keywords: ''
    }
    this.render()
    this.onFilterChange(this.filters)
  }

  clearKeywords() {
    this.filters.keywords = ''
    const input = document.querySelector('[data-filter="keywords"]')
    if (input) input.value = ''
    this.updateSearchClearButton()
    this.onFilterChange(this.filters)
  }

  setDatePreset(preset) {
    const today = new Date()
    const formatDate = (date) => date.toISOString().split('T')[0]

    switch (preset) {
      case 'today':
        this.filters.dateRange = {
          start: formatDate(today),
          end: formatDate(today)
        }
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        this.filters.dateRange = {
          start: formatDate(weekStart),
          end: formatDate(today)
        }
        break
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        this.filters.dateRange = {
          start: formatDate(monthStart),
          end: formatDate(today)
        }
        break
    }

    this.render()
    this.onFilterChange(this.filters)
  }

  toggleCollapse() {
    const content = document.querySelector('[data-filter-content]')
    const icon = document.querySelector('.filter-collapse-icon')

    content.classList.toggle('filter-content--collapsed')
    icon.textContent = content.classList.contains('filter-content--collapsed') ? '▶' : '▼'
  }

  applyFilters() {
    this.onFilterChange(this.filters)
    this.saveCurrentFilters()
  }

  resetToDefaults() {
    this.clearAllFilters()
  }

  saveCurrentFilters() {
    try {
      localStorage.setItem('regulatoryFilters', JSON.stringify(this.filters))
    } catch (e) {
      console.warn('Could not save filters to localStorage:', e)
    }
  }

  loadSavedFilters() {
    try {
      const saved = localStorage.getItem('regulatoryFilters')
      if (saved) {
        this.filters = { ...this.filters, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.warn('Could not load saved filters:', e)
    }
  }

  // Utility Methods
  getActiveFilterCount() {
    let count = 0

    Object.entries(this.filters).forEach(([key, value]) => {
      if (key === 'keywords' && value) count++
      else if (key === 'dateRange' && (value.start || value.end)) count++
      else if (Array.isArray(value) && value.length > 0) count++
      else if (!Array.isArray(value) && value && value !== 'all') count++
    })

    return count
  }

  getActiveFiltersForDisplay() {
    const active = []

    Object.entries(this.filters).forEach(([key, value]) => {
      if (key === 'keywords' && value) {
        active.push({ key, value: '', label: `Keywords: "${value}"` })
      } else if (key === 'dateRange' && (value.start || value.end)) {
        const label = value.start && value.end
          ? `${value.start} to ${value.end}`
          : value.start
            ? `From ${value.start}`
            : `Until ${value.end}`
        active.push({ key, value: '', label: `Date: ${label}` })
      } else if (Array.isArray(value) && value.length > 0) {
        value.forEach(v => {
          const option = this.filterDefinitions[key]?.options.find(opt => opt.value === v)
          if (option) {
            active.push({ key, value: v, label: option.label })
          }
        })
      } else if (!Array.isArray(value) && value && value !== 'all') {
        const option = this.filterDefinitions[key]?.options.find(opt => opt.value === value)
        if (option) {
          active.push({ key, value, label: option.label })
        }
      }
    })

    return active
  }

  removeActiveFilter(key, value) {
    if (key === 'keywords') {
      this.clearKeywords()
    } else if (key === 'dateRange') {
      this.filters.dateRange = { start: '', end: '' }
    } else if (Array.isArray(this.filters[key])) {
      this.filters[key] = this.filters[key].filter(v => v !== value)
    } else {
      this.filters[key] = ''
    }

    this.render()
    this.onFilterChange(this.filters)
  }

  updateActiveFiltersDisplay() {
    const activeFiltersContainer = document.querySelector('.active-filters')
    if (activeFiltersContainer) {
      const parent = activeFiltersContainer.parentNode
      activeFiltersContainer.remove()
      parent.insertAdjacentHTML('beforeend', this.renderActiveFiltersDisplay())
    }

    // Update header count
    const countElement = document.querySelector('.active-filter-count')
    const activeCount = this.getActiveFilterCount()
    if (countElement) {
      if (activeCount > 0) {
        countElement.textContent = `${activeCount} active`
        countElement.style.display = 'inline'
      } else {
        countElement.style.display = 'none'
      }
    }
  }

  updateSearchClearButton() {
    const clearBtn = document.querySelector('.search-clear-btn')
    if (clearBtn) {
      clearBtn.style.display = this.filters.keywords ? 'block' : 'none'
    }
  }

  updateResultCount(count) {
    const countElement = document.getElementById('filter-result-count')
    if (countElement) {
      countElement.textContent = count.toLocaleString()
    }
  }

  debounce(func, wait) {
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

  // Export current filters
  exportFilters() {
    return JSON.stringify(this.filters, null, 2)
  }

  // Import filters
  importFilters(filterString) {
    try {
      const imported = JSON.parse(filterString)
      this.filters = { ...this.filters, ...imported }
      this.render()
      this.onFilterChange(this.filters)
      return true
    } catch (e) {
      console.error('Could not import filters:', e)
      return false
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterSystem
} else {
  window.FilterSystem = FilterSystem
}
