function generateFallbackSidebar(currentPage) {
  return `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header-clean">
                <h2>Regulatory Horizon Scanner</h2>
                <div class="sidebar-status">
                    <span class="status-indicator offline" title="Loading..."></span>
                    <span class="last-update">Loading...</span>
                </div>
            </div>
            
            <div class="loading-placeholder" style="padding: 2rem; text-align: center; color: #6b7280;">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        </div>`
}

module.exports = { generateFallbackSidebar }
