const { renderUserSection, renderNavigation, renderFooterLinks } = require('./sections')
const { getSidebarStyles } = require('./styles')
const { getSidebarScripts } = require('./scripts')

function renderSidebarTemplate({
  currentPage,
  user,
  persona,
  personaPresets,
  recentCounts,
  icons,
  lastSync,
  weeklyBriefingModal
}) {
  return `
        <div class="sidebar" id="sidebar">
            <!-- Clean Header with Light Background -->
            <div class="sidebar-header-clean">
                <a href="/" style="display: block; margin-bottom: 0.75rem; transition: opacity 0.2s ease;">
                    <img src="/images/regcanary-sidebar-full.png" alt="RegCanary" class="sidebar-logo" style="width: 100%; height: auto;" />
                </a>
                <div class="sidebar-status">
                    <span class="status-indicator online" title="System Online"></span>
                    <span class="last-update">Last sync: ${lastSync}</span>
                </div>
            </div>

            <!-- User/Persona Section -->
            ${renderUserSection({ user, persona, personaPresets })}

            <!-- Navigation Section -->
            ${renderNavigation({ currentPage, icons, recentCounts })}

            <!-- Manual Refresh Section -->
            <div class="refresh-section">
                <button onclick="triggerManualRefresh()" class="manual-refresh-btn" id="manualRefreshBtn">
                    <span class="refresh-icon">${icons.refresh}</span>
                    <span class="refresh-text">Refresh Data</span>
                </button>
            </div>

            <!-- Premium Simplified Sidebar -->
            <div class="sidebar-footer-section">
                <div class="footer-status">
                    <span class="status-indicator online" title="System Online"></span>
                    <span class="status-text">System Active</span>
                </div>
            </div>
            
            <!-- Minimal Footer -->
            <div class="sidebar-footer-clean">
                ${renderFooterLinks({ user })}
            </div>
        </div>

${getSidebarStyles()}

${getSidebarScripts()}

        ${weeklyBriefingModal}`
}

module.exports = { renderSidebarTemplate }
