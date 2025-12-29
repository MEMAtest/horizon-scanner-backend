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
                <div class="sidebar-header-top">
                    <a href="/" style="display: block; transition: opacity 0.2s ease;">
                        <img src="/images/regcanary-sidebar-full.png" alt="RegCanary" class="sidebar-logo" style="width: 100%; height: auto;" />
                    </a>
                    <!-- Notification Bell -->
                    <div class="notification-bell" id="notificationBell" onclick="toggleNotificationDropdown()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                    </div>
                </div>
                <div class="sidebar-status">
                    <span class="status-indicator online" title="System Online"></span>
                    <span class="last-update">Last sync: ${lastSync}</span>
                </div>
            </div>

            <!-- Notification Dropdown -->
            <div class="notification-dropdown" id="notificationDropdown" style="display: none;">
                <div class="notification-header">
                    <span class="notification-title">Notifications</span>
                    <button class="mark-all-read" onclick="markAllNotificationsRead()">Mark all read</button>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-empty">No notifications</div>
                </div>
                <div class="notification-footer">
                    <a href="/notifications" class="view-all-link">View All</a>
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
