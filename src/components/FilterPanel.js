// 🎛️ src/components/FilterPanel.js - Filter Component
// ==========================================

function render() {
  const authorities = ['FCA', 'BoE', 'PRA', 'TPR', 'SFO', 'FATF']
  const impactLevels = ['Significant', 'Moderate', 'Informational']
  const urgencyLevels = ['High', 'Medium', 'Low']

  return `
        <div class="filter-panel">
            <div class="filter-header">
                <h2 class="filter-title">🎛️ Multi-Select Filters</h2>
                <div class="filter-actions">
                    <button onclick="applyFilters()" class="button button-primary">Apply Filters</button>
                    <button onclick="resetAllFilters()" class="button button-secondary">Reset All</button>
                </div>
            </div>
            
            <div class="filter-grid">
                <div class="filter-section">
                    <div class="filter-label">🏛️ Authorities</div>
                    <div class="checkbox-group" id="authorityFilters">
                        ${authorities.map(auth => `
                            <label class="checkbox-item">
                                <input type="checkbox" value="${auth}" class="authority-checkbox">
                                <span>${auth}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="filter-section-actions">
                        <button onclick="selectAllAuthorities()" class="button-small">Select All</button>
                        <button onclick="clearAllAuthorities()" class="button-small">Clear</button>
                    </div>
                </div>
                
                <div class="filter-section">
                    <div class="filter-label">⚡ Impact Levels</div>
                    <div class="checkbox-group" id="impactFilters">
                        ${impactLevels.map(impact => `
                            <label class="checkbox-item">
                                <input type="checkbox" value="${impact}" class="impact-checkbox">
                                <span>${impact}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="filter-section-actions">
                        <button onclick="selectAllImpacts()" class="button-small">Select All</button>
                        <button onclick="clearAllImpacts()" class="button-small">Clear</button>
                    </div>
                </div>
                
                <div class="filter-section">
                    <div class="filter-label">🚨 Urgency Levels</div>
                    <div class="checkbox-group" id="urgencyFilters">
                        ${urgencyLevels.map(urgency => `
                            <label class="checkbox-item">
                                <input type="checkbox" value="${urgency}" class="urgency-checkbox">
                                <span>${urgency}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="filter-section-actions">
                        <button onclick="selectAllUrgencies()" class="button-small">Select All</button>
                        <button onclick="clearAllUrgencies()" class="button-small">Clear</button>
                    </div>
                </div>
                
                <div class="filter-section">
                    <div class="filter-label">🔍 Search & Export</div>
                    <div class="search-controls">
                        <input type="text" id="searchBox" placeholder="Search updates..." class="search-input">
                        <button onclick="performSearch()" class="button button-secondary">Search</button>
                    </div>
                    <div class="export-controls">
                        <button onclick="exportToCSV()" class="button button-secondary">📄 Export CSV</button>
                        <button onclick="exportToJSON()" class="button button-secondary">📊 Export JSON</button>
                    </div>
                </div>
            </div>
            
            <div class="filter-status" id="filterStatus">
                <span class="status-text">No filters applied - showing all updates</span>
            </div>
        </div>
    `
}

module.exports = { render }
