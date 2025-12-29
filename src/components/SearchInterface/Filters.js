function renderAdvancedSearch() {
  if (!this.isAdvancedMode) return ''

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
        `
}

function setSearchMode(isAdvanced) {
  this.isAdvancedMode = isAdvanced
  this.render()
}

function getAdvancedSearchFields() {
  const fields = {}
  const inputs = document.querySelectorAll('.advanced-input, .advanced-select')

  inputs.forEach(input => {
    const field = input.dataset.field
    fields[field] = input.value.trim()
  })

  return fields
}

function buildAdvancedQuery(fields) {
  const parts = []

  if (fields.exactPhrase) {
    parts.push(`"${fields.exactPhrase}"`)
  }

  if (fields.anyWords) {
    const words = fields.anyWords.split(/\s+/).filter(w => w)
    if (words.length > 0) {
      parts.push(`(${words.join(' OR ')})`)
    }
  }

  if (fields.excludeWords) {
    const words = fields.excludeWords.split(/\s+/).filter(w => w)
    words.forEach(word => parts.push(`-${word}`))
  }

  if (fields.titleOnly) {
    parts.push(`title:${fields.titleOnly}`)
  }

  if (fields.authority) {
    parts.push(`authority:${fields.authority}`)
  }

  if (fields.contentType) {
    parts.push(`type:${fields.contentType}`)
  }

  return parts.join(' ')
}

function clearAdvancedFields() {
  const inputs = document.querySelectorAll('.advanced-input, .advanced-select')
  inputs.forEach(input => {
    input.value = ''
  })
}

function toggleAdvancedCollapse() {
  const content = document.querySelector('[data-advanced-content]')
  const button = document.querySelector('.advanced-collapse-btn')

  if (content && button) {
    const isCollapsed = content.style.display === 'none'
    content.style.display = isCollapsed ? 'block' : 'none'
    button.textContent = isCollapsed ? '▲' : '▼'
  }
}

module.exports = {
  renderAdvancedSearch,
  setSearchMode,
  getAdvancedSearchFields,
  buildAdvancedQuery,
  clearAdvancedFields,
  toggleAdvancedCollapse
}
