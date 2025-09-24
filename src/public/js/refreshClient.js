// ====================================================================
// PHASE 6: REFRESH CLIENT
// Client-side refresh UI, notifications, and performance optimization
// ====================================================================

class RefreshClient {
  constructor() {
    this.isRefreshing = false
    this.refreshInterval = null
    this.statusInterval = null
    this.notificationPermission = 'default'
    this.lastNotificationCheck = null
    this.performanceCache = new Map()
    this.refreshHistory = []

    this.init()
  }

  // ====== INITIALIZATION ======

  init() {
    console.log('🔄 Initializing Refresh Client...')

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI())
    } else {
      this.setupUI()
    }

    // Request notification permission
    this.requestNotificationPermission()

    // Start status monitoring
    this.startStatusMonitoring()

    // Setup performance optimization
    this.setupPerformanceOptimization()

    console.log('✅ Refresh Client initialized')
  }

  // ====== UI SETUP ======

  setupUI() {
    this.createRefreshButton()
    this.createRefreshStatus()
    this.createNotificationCenter()
    this.enhanceExistingCounters()
    this.setupKeyboardShortcuts()
  }

  createRefreshButton() {
    // Add refresh button to existing UI
    const existingHeader = document.querySelector('.dashboard-header') ||
                             document.querySelector('header') ||
                             document.querySelector('.top-bar')

    if (!existingHeader) {
      console.warn('No header found, creating floating refresh button')
      return this.createFloatingRefreshButton()
    }

    const refreshContainer = document.createElement('div')
    refreshContainer.className = 'refresh-container'
    refreshContainer.innerHTML = `
            <button id="manual-refresh-btn" class="refresh-btn" title="Refresh regulatory updates (Ctrl+R)">
                <span class="refresh-icon">🔄</span>
                <span class="refresh-text">Refresh</span>
                <span class="refresh-spinner" style="display: none;">⏳</span>
            </button>
            <div class="refresh-dropdown">
                <button class="refresh-options-btn" title="Refresh options">▼</button>
                <div class="refresh-options-menu" style="display: none;">
                    <button data-option="quick">Quick Refresh</button>
                    <button data-option="full">Full Refresh</button>
                    <button data-option="ai-only">AI Analysis Only</button>
                </div>
            </div>
        `

    existingHeader.appendChild(refreshContainer)

    // Add event listeners
    document.getElementById('manual-refresh-btn').addEventListener('click', () => this.triggerRefresh())

    document.querySelector('.refresh-options-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleRefreshOptions()
    })

    document.querySelectorAll('[data-option]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const option = e.target.dataset.option
        this.triggerRefresh({ type: option })
        this.hideRefreshOptions()
      })
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', () => this.hideRefreshOptions())
  }

  createFloatingRefreshButton() {
    const floatingBtn = document.createElement('div')
    floatingBtn.className = 'floating-refresh-btn'
    floatingBtn.innerHTML = `
            <button id="manual-refresh-btn" title="Refresh regulatory updates">
                <span class="refresh-icon">🔄</span>
            </button>
        `

    document.body.appendChild(floatingBtn)
    document.getElementById('manual-refresh-btn').addEventListener('click', () => this.triggerRefresh())
  }

  createRefreshStatus() {
    // Add status indicator to existing UI
    const statusContainer = document.createElement('div')
    statusContainer.id = 'refresh-status'
    statusContainer.className = 'refresh-status'
    statusContainer.innerHTML = `
            <div class="status-indicator">
                <span class="status-dot"></span>
                <span class="status-text">Ready</span>
                <span class="last-refresh"></span>
            </div>
            <div class="refresh-progress" style="display: none;">
                <div class="progress-bar"></div>
                <span class="progress-text"></span>
            </div>
        `

    // Try to add to existing status area or header
    const targetContainer = document.querySelector('.status-bar') ||
                               document.querySelector('.dashboard-header') ||
                               document.querySelector('header') ||
                               document.body

    targetContainer.appendChild(statusContainer)
  }

  createNotificationCenter() {
    // Create notification overlay
    const notificationCenter = document.createElement('div')
    notificationCenter.id = 'notification-center'
    notificationCenter.className = 'notification-center'
    notificationCenter.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="close-notifications">×</button>
            </div>
            <div class="notification-list"></div>
            <div class="notification-footer">
                <button class="clear-all-notifications">Clear All</button>
            </div>
        `

    document.body.appendChild(notificationCenter)

    // Add notification bell to UI
    const bellContainer = document.createElement('div')
    bellContainer.className = 'notification-bell-container'
    bellContainer.innerHTML = `
            <button class="notification-bell" title="View notifications">
                🔔
                <span class="notification-badge" style="display: none;">0</span>
            </button>
        `

    const header = document.querySelector('.dashboard-header') || document.querySelector('header')
    if (header) {
      header.appendChild(bellContainer)
    }

    // Event listeners for notifications
    document.querySelector('.notification-bell').addEventListener('click', () => this.toggleNotifications())
    document.querySelector('.close-notifications').addEventListener('click', () => this.hideNotifications())
    document.querySelector('.clear-all-notifications').addEventListener('click', () => this.clearAllNotifications())
  }

  enhanceExistingCounters() {
    // Find existing counter elements and enhance them
    const counters = document.querySelectorAll('[data-count-type]')
    counters.forEach(counter => {
      counter.classList.add('enhanced-counter')

      // Add refresh animation capability
      counter.setAttribute('data-original-content', counter.textContent)
    })
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+R for refresh (prevent default browser refresh)
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault()
        this.triggerRefresh()
      }

      // Ctrl+Shift+R for full refresh
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        this.triggerRefresh({ type: 'full' })
      }
    })
  }

  // ====== REFRESH FUNCTIONALITY ======

  async triggerRefresh(options = {}) {
    if (this.isRefreshing) {
      this.showMessage('Refresh already in progress...', 'warning')
      return
    }

    console.log('🔄 Triggering manual refresh...', options)

    this.setRefreshState(true)
    this.showRefreshProgress(0, 'Starting refresh...')

    try {
      const response = await fetch('/api/manual-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      const result = await response.json()

      if (result.success) {
        await this.handleRefreshSuccess(result)
      } else {
        await this.handleRefreshError(result.error || 'Refresh failed')
      }
    } catch (error) {
      console.error('Refresh request failed:', error)
      await this.handleRefreshError(error.message)
    } finally {
      this.setRefreshState(false)
      this.hideRefreshProgress()
    }
  }

  async handleRefreshSuccess(result) {
    console.log('✅ Refresh completed successfully:', result)

    this.showMessage(`Refresh completed! ${result.results.newUpdates} new updates found`, 'success')

    // Update counters with animation
    await this.updateCountersAnimated()

    // Check for new notifications
    await this.checkNotifications()

    // Update last refresh time
    this.updateLastRefreshTime(result.lastRefresh)

    // Add to refresh history
    this.refreshHistory.unshift({
      timestamp: new Date(),
      success: true,
      newUpdates: result.results.newUpdates,
      duration: result.duration
    })

    // If there were new updates, optionally reload the page content
    if (result.results.newUpdates > 0) {
      await this.refreshPageContent()
    }
  }

  async handleRefreshError(error) {
    console.error('❌ Refresh failed:', error)
    this.showMessage(`Refresh failed: ${error}`, 'error')

    this.refreshHistory.unshift({
      timestamp: new Date(),
      success: false,
      error
    })
  }

  // ====== STATUS MONITORING ======

  startStatusMonitoring() {
    // Check status every 30 seconds
    this.statusInterval = setInterval(() => {
      this.updateSystemStatus()
    }, 30000)

    // Initial status check
    this.updateSystemStatus()
  }

  async updateSystemStatus() {
    try {
      const response = await fetch('/api/refresh-status')
      const status = await response.json()

      this.updateStatusDisplay(status)

      // If refresh is in progress, show progress
      if (status.isRefreshing && !this.isRefreshing) {
        this.setRefreshState(true)
        this.showRefreshProgress(50, 'Refresh in progress...')
      }
    } catch (error) {
      console.error('Failed to get system status:', error)
      this.updateStatusDisplay({ status: 'error', message: 'Connection error' })
    }
  }

  updateStatusDisplay(status) {
    const statusDot = document.querySelector('.status-dot')
    const statusText = document.querySelector('.status-text')
    const lastRefreshSpan = document.querySelector('.last-refresh')

    if (statusDot && statusText) {
      if (status.isRefreshing) {
        statusDot.className = 'status-dot refreshing'
        statusText.textContent = 'Refreshing...'
      } else if (status.status === 'error') {
        statusDot.className = 'status-dot error'
        statusText.textContent = 'Error'
      } else {
        statusDot.className = 'status-dot ready'
        statusText.textContent = 'Ready'
      }
    }

    if (lastRefreshSpan && status.lastRefresh) {
      const lastRefresh = new Date(status.lastRefresh)
      lastRefreshSpan.textContent = `Last: ${this.formatTimeAgo(lastRefresh)}`
    }
  }

  // ====== COUNTER UPDATES ======

  async updateCountersAnimated() {
    try {
      // Fetch latest counts
      const response = await fetch('/api/refresh-status')
      const status = await response.json()
      const counts = status.counts || {}

      // Animate counter updates
      const counters = document.querySelectorAll('[data-count-type]')

      for (const counter of counters) {
        const countType = counter.dataset.countType
        const newValue = counts[countType]

        if (newValue !== undefined) {
          await this.animateCounterUpdate(counter, newValue)
        }
      }

      // Update any existing counter displays
      this.updateExistingCounters(counts)
    } catch (error) {
      console.error('Failed to update counters:', error)
    }
  }

  async animateCounterUpdate(counter, newValue) {
    const currentValue = parseInt(counter.textContent) || 0

    if (currentValue === newValue) return

    // Add update animation class
    counter.classList.add('counter-updating')

    // Animate the number change
    const duration = 800 // 800ms animation
    const steps = 20
    const stepTime = duration / steps
    const stepValue = (newValue - currentValue) / steps

    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const value = Math.round(currentValue + (stepValue * i))
        counter.textContent = value

        if (i === steps) {
          counter.classList.remove('counter-updating')
          counter.classList.add('counter-updated')
          setTimeout(() => counter.classList.remove('counter-updated'), 1000)
        }
      }, stepTime * i)
    }
  }

  updateExistingCounters(counts) {
    // Update any hardcoded counter elements that exist in the UI
    const totalCountElement = document.querySelector('#total-count, .total-count')
    if (totalCountElement && counts.total !== undefined) {
      totalCountElement.textContent = counts.total
    }

    // Update authority counters if they exist
    if (counts.byAuthority) {
      Object.entries(counts.byAuthority).forEach(([authority, count]) => {
        const element = document.querySelector(`[data-authority="${authority}"] .count`)
        if (element) element.textContent = count
      })
    }
  }

  // ====== NOTIFICATION SYSTEM ======

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      this.notificationPermission = permission
      console.log(`Notification permission: ${permission}`)
    }
  }

  async checkNotifications() {
    try {
      const since = this.lastNotificationCheck || new Date(Date.now() - 24 * 60 * 60 * 1000)
      const response = await fetch(`/api/notifications?since=${since.toISOString()}`)
      const data = await response.json()

      if (data.notifications && data.notifications.length > 0) {
        this.handleNewNotifications(data.notifications)
      }

      this.lastNotificationCheck = new Date()
      this.updateNotificationBadge(data.unread || 0)
    } catch (error) {
      console.error('Failed to check notifications:', error)
    }
  }

  handleNewNotifications(notifications) {
    notifications.forEach(notification => {
      // Show browser notification for critical alerts
      if (notification.priority === 'critical' && this.notificationPermission === 'granted') {
        this.showBrowserNotification(notification)
      }

      // Add to notification center
      this.addToNotificationCenter(notification)
    })
  }

  showBrowserNotification(notification) {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'critical'
    })

    browserNotification.onclick = () => {
      window.focus()
      this.handleNotificationAction(notification, 'view')
      browserNotification.close()
    }
  }

  addToNotificationCenter(notification) {
    const notificationList = document.querySelector('.notification-list')
    if (!notificationList) return

    const notificationElement = document.createElement('div')
    notificationElement.className = `notification notification-${notification.priority}`
    notificationElement.dataset.notificationId = notification.id

    notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.formatTimeAgo(new Date(notification.timestamp))}</div>
            </div>
            <div class="notification-actions">
                ${notification.actions.map(action =>
                    `<button class="notification-action" data-action="${action.action}" data-update-id="${action.updateId || ''}">${action.label}</button>`
                ).join('')}
            </div>
        `

    // Add event listeners for actions
    notificationElement.querySelectorAll('.notification-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action
        const updateId = e.target.dataset.updateId
        this.handleNotificationAction(notification, action, updateId)
      })
    })

    notificationList.insertBefore(notificationElement, notificationList.firstChild)
  }

  handleNotificationAction(notification, action, updateId = null) {
    switch (action) {
      case 'view':
        if (updateId) {
          // Scroll to update or open details
          this.viewUpdate(updateId)
        }
        break
      case 'dismiss':
        this.dismissNotification(notification.id)
        break
    }
  }

  // ====== PAGE CONTENT REFRESH ======

  async refreshPageContent() {
    // Refresh the main content area without full page reload
    try {
      const response = await fetch('/api/updates?latest=true')
      const data = await response.json()

      // Update the main content area
      await this.updateMainContent(data)

      // Show subtle indication that content was refreshed
      this.showContentRefreshIndicator()
    } catch (error) {
      console.error('Failed to refresh page content:', error)
    }
  }

  async updateMainContent(data) {
    const mainContent = document.querySelector('#main-content, .main-content, .updates-container')
    if (!mainContent) return

    // Add refresh animation
    mainContent.classList.add('content-refreshing')

    // If the existing page has update logic, trigger it
    if (window.updateDisplayedUpdates) {
      window.updateDisplayedUpdates(data)
    } else {
      // Otherwise, trigger a soft page reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    setTimeout(() => {
      mainContent.classList.remove('content-refreshing')
    }, 800)
  }

  showContentRefreshIndicator() {
    const indicator = document.createElement('div')
    indicator.className = 'content-refresh-indicator'
    indicator.textContent = 'Content updated'

    document.body.appendChild(indicator)

    setTimeout(() => {
      indicator.classList.add('show')
    }, 100)

    setTimeout(() => {
      indicator.classList.remove('show')
      setTimeout(() => document.body.removeChild(indicator), 300)
    }, 2000)
  }

  // ====== PERFORMANCE OPTIMIZATION ======

  setupPerformanceOptimization() {
    // Lazy loading for images and heavy content
    this.setupLazyLoading()

    // Debounce rapid refresh requests
    this.debouncedRefresh = this.debounce(this.triggerRefresh.bind(this), 2000)

    // Cache frequently accessed data
    this.setupDataCaching()

    // Optimize scroll performance
    this.setupScrollOptimization()
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            img.src = img.dataset.src
            img.classList.remove('lazy')
            imageObserver.unobserve(img)
          }
        })
      })

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }

  setupDataCaching() {
    // Cache API responses for a short time to avoid redundant requests
    const originalFetch = window.fetch
    const cache = new Map()

    window.fetch = async (url, options = {}) => {
      if (options.method && options.method !== 'GET') {
        return originalFetch(url, options)
      }

      const cacheKey = url
      const cached = cache.get(cacheKey)

      if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
        return Promise.resolve(cached.response.clone())
      }

      const response = await originalFetch(url, options)

      if (response.ok) {
        cache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now()
        })
      }

      return response
    }
  }

  setupScrollOptimization() {
    // Throttle scroll events for better performance
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Handle scroll-based optimizations here
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
  }

  // ====== UI HELPER METHODS ======

  setRefreshState(isRefreshing) {
    this.isRefreshing = isRefreshing

    const refreshBtn = document.getElementById('manual-refresh-btn')
    const refreshIcon = document.querySelector('.refresh-icon')
    const refreshSpinner = document.querySelector('.refresh-spinner')

    if (refreshBtn) {
      refreshBtn.disabled = isRefreshing
      refreshBtn.classList.toggle('refreshing', isRefreshing)
    }

    if (refreshIcon && refreshSpinner) {
      refreshIcon.style.display = isRefreshing ? 'none' : 'inline'
      refreshSpinner.style.display = isRefreshing ? 'inline' : 'none'
    }
  }

  showRefreshProgress(percentage, message) {
    const progressContainer = document.querySelector('.refresh-progress')
    const progressBar = document.querySelector('.progress-bar')
    const progressText = document.querySelector('.progress-text')

    if (progressContainer) {
      progressContainer.style.display = 'block'
    }

    if (progressBar) {
      progressBar.style.width = `${percentage}%`
    }

    if (progressText) {
      progressText.textContent = message
    }
  }

  hideRefreshProgress() {
    const progressContainer = document.querySelector('.refresh-progress')
    if (progressContainer) {
      progressContainer.style.display = 'none'
    }
  }

  toggleRefreshOptions() {
    const menu = document.querySelector('.refresh-options-menu')
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none'
    }
  }

  hideRefreshOptions() {
    const menu = document.querySelector('.refresh-options-menu')
    if (menu) {
      menu.style.display = 'none'
    }
  }

  toggleNotifications() {
    const center = document.getElementById('notification-center')
    if (center) {
      center.classList.toggle('show')
    }
  }

  hideNotifications() {
    const center = document.getElementById('notification-center')
    if (center) {
      center.classList.remove('show')
    }
  }

  updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge')
    if (badge) {
      badge.textContent = count
      badge.style.display = count > 0 ? 'block' : 'none'
    }
  }

  showMessage(message, type = 'info') {
    const messageElement = document.createElement('div')
    messageElement.className = `refresh-message message-${type}`
    messageElement.textContent = message

    document.body.appendChild(messageElement)

    setTimeout(() => messageElement.classList.add('show'), 100)
    setTimeout(() => {
      messageElement.classList.remove('show')
      setTimeout(() => document.body.removeChild(messageElement), 300)
    }, 3000)
  }

  // ====== UTILITY METHODS ======

  formatTimeAgo(date) {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
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

  viewUpdate(updateId) {
    // Try to find and scroll to the update
    const updateElement = document.querySelector(`[data-update-id="${updateId}"]`)
    if (updateElement) {
      updateElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      updateElement.classList.add('highlighted')
      setTimeout(() => updateElement.classList.remove('highlighted'), 3000)
    }
  }

  dismissNotification(notificationId) {
    const element = document.querySelector(`[data-notification-id="${notificationId}"]`)
    if (element) {
      element.remove()
    }
  }

  clearAllNotifications() {
    const list = document.querySelector('.notification-list')
    if (list) {
      list.innerHTML = ''
    }
    this.updateNotificationBadge(0)
  }

  updateLastRefreshTime(lastRefresh) {
    const element = document.querySelector('.last-refresh')
    if (element && lastRefresh) {
      element.textContent = `Last: ${this.formatTimeAgo(new Date(lastRefresh))}`
    }
  }
}

// Initialize when page loads
const refreshClient = new RefreshClient()
