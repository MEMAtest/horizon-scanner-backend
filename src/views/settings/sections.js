function renderSettingsHeader() {
  return `
    <div class="settings-header">
      <div class="settings-title">
        <svg class="settings-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
        </svg>
        <h1>Settings</h1>
      </div>
    </div>
  `
}

function renderTabNavigation(activeTab, unreadCount) {
  const tabs = [
    { id: 'notifications', label: 'Notifications', badge: unreadCount > 0 ? unreadCount : null },
    { id: 'preferences', label: 'Preferences', badge: null },
    { id: 'account', label: 'Account', badge: null }
  ]

  return `
    <div class="settings-tabs">
      ${tabs.map(tab => `
        <button
          class="settings-tab ${activeTab === tab.id ? 'active' : ''}"
          data-tab="${tab.id}"
        >
          ${tab.label}
          ${tab.badge ? `<span class="tab-badge">${tab.badge}</span>` : ''}
        </button>
      `).join('')}
    </div>
  `
}

function renderTabContent(activeTab, { notifications, unreadCount }) {
  return `
    <div class="settings-content">
      ${renderNotificationsPanel(activeTab, notifications, unreadCount)}
      ${renderPreferencesPanel(activeTab)}
      ${renderAccountPanel(activeTab)}
    </div>
  `
}

function renderNotificationsPanel(activeTab, notifications, unreadCount) {
  const isActive = activeTab === 'notifications'

  return `
    <div id="notifications-panel" class="tab-panel ${isActive ? 'active' : ''}">
      <div class="notifications-header">
        <div class="notifications-title">
          <h2>Notifications</h2>
          <span class="notifications-count">${notifications.length} total</span>
        </div>
        <div class="notifications-actions">
          <button id="refreshNotificationsBtn" class="notifications-action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
            Refresh
          </button>
          <button id="markAllReadBtn" class="notifications-action-btn primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Mark All Read
          </button>
          <button id="dismissAllBtn" class="notifications-action-btn danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
            Dismiss All
          </button>
        </div>
      </div>

      <div class="notifications-filters">
        <button class="filter-tab active" data-filter="all">All</button>
        <button class="filter-tab" data-filter="watch_list_match">Watch Lists</button>
        <button class="filter-tab" data-filter="enforcement">Enforcement</button>
        <button class="filter-tab" data-filter="system">System</button>
      </div>

      <div class="notifications-list">
        ${notifications.length === 0 ? renderEmptyNotifications() : notifications.map(renderNotificationCard).join('')}
      </div>
    </div>
  `
}

function renderNotificationCard(notification) {
  const id = notification.id || ''
  const title = escapeHtml(notification.title || 'Notification')
  const message = escapeHtml(notification.message || '')
  const type = notification.type || 'system'
  const time = formatTimeAgo(notification.created_at || notification.createdAt)
  const unread = notification.read === false || notification.read === 0
  const actionUrl = notification.action_url || notification.actionUrl || ''
  const actionLabel = notification.action_label || notification.actionLabel || 'View'

  return `
    <div class="notification-card ${unread ? 'unread' : ''}" data-id="${id}" data-type="${type}">
      <div class="notification-card-header">
        <h3 class="notification-card-title">${title}</h3>
        <span class="notification-card-time">${time}</span>
      </div>
      <p class="notification-card-message">${message}</p>
      <div class="notification-card-footer">
        <div class="notification-card-type">
          <span class="notification-type-badge ${type}">${formatNotificationType(type)}</span>
        </div>
        <div class="notification-card-actions">
          ${actionUrl ? `
            <button class="notification-card-btn primary" data-notification-action="view" data-notification-id="${id}" data-action-url="${escapeHtml(actionUrl)}">
              ${escapeHtml(actionLabel)}
            </button>
          ` : ''}
          ${unread ? `
            <button class="notification-card-btn" data-notification-action="read" data-notification-id="${id}">
              Mark Read
            </button>
          ` : ''}
          <button class="notification-card-btn danger" data-notification-action="dismiss" data-notification-id="${id}">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  `
}

function renderEmptyNotifications() {
  return `
    <div class="notifications-empty">
      <svg class="notifications-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
        <path d="M13.7 21a2 2 0 01-3.4 0"></path>
      </svg>
      <h3>No notifications</h3>
      <p>You're all caught up! New notifications will appear here.</p>
    </div>
  `
}

function renderPreferencesPanel(activeTab) {
  const isActive = activeTab === 'preferences'

  return `
    <div id="preferences-panel" class="tab-panel ${isActive ? 'active' : ''}">
      <div class="preferences-section">
        <h3 class="preferences-section-title">Notification Preferences</h3>
        <div class="preference-row">
          <div class="preference-label">
            Watch List Matches
            <small>Get notified when regulatory updates match your watch lists</small>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" checked disabled>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="preference-row">
          <div class="preference-label">
            FCA Enforcement Notices
            <small>Get notified about new FCA fines and enforcement actions</small>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" checked disabled>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="preference-row">
          <div class="preference-label">
            Email Digest
            <small>Receive a daily email summary of important updates</small>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" disabled>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="preferences-section">
        <h3 class="preferences-section-title">Display Preferences</h3>
        <div class="preference-row">
          <div class="preference-label">
            Default Dashboard View
            <small>Choose your preferred dashboard layout</small>
          </div>
          <select class="form-input" style="width: auto; padding: 8px 12px;" disabled>
            <option>Cards</option>
            <option>List</option>
            <option>Compact</option>
          </select>
        </div>
      </div>

      <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 1.5rem;">
        Preference settings coming soon. These options will be available in a future update.
      </p>
    </div>
  `
}

function renderAccountPanel(activeTab) {
  const isActive = activeTab === 'account'

  return `
    <div id="account-panel" class="tab-panel ${isActive ? 'active' : ''}">
      <div class="account-card">
        <div class="account-info">
          <div class="account-avatar">U</div>
          <div class="account-details">
            <h3>Default User</h3>
            <p>Using default profile</p>
          </div>
        </div>

        <div class="preferences-section" style="border: none; padding: 0; margin: 0;">
          <h3 class="preferences-section-title">Account Information</h3>
          <div class="preference-row">
            <div class="preference-label">User ID</div>
            <span style="color: #6b7280; font-family: monospace;">default</span>
          </div>
          <div class="preference-row">
            <div class="preference-label">Active Persona</div>
            <span style="color: #6b7280;">All Sectors</span>
          </div>
          <div class="preference-row">
            <div class="preference-label">Notification Bell</div>
            <span style="color: #16a34a;">Active (bottom-right)</span>
          </div>
        </div>
      </div>

      <p style="color: #9ca3af; font-size: 0.875rem; margin-top: 1.5rem;">
        Full account management coming soon. Sign in to access personalized settings.
      </p>
    </div>
  `
}

// Utility functions
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''

  const deltaMs = Date.now() - date.getTime()
  const mins = Math.floor(deltaMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd ago'
  return date.toLocaleDateString()
}

function formatNotificationType(type) {
  const types = {
    watch_list_match: 'Watch List',
    enforcement: 'Enforcement',
    system: 'System',
    fca_fine: 'FCA Fine'
  }
  return types[type] || type
}

module.exports = {
  renderSettingsHeader,
  renderTabNavigation,
  renderTabContent,
  renderNotificationsPanel,
  renderPreferencesPanel,
  renderAccountPanel
}
