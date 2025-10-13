// ==========================================
// 🧭 Navigation System Component
// src/components/NavigationSystem.js
// ==========================================

class NavigationSystem {
  constructor() {
    this.currentPage = window.location.pathname
    this.breadcrumbs = []
    this.icons = this.buildIconLibrary()
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.updateBreadcrumbs()
    this.highlightActiveNav()
  }

  setupEventListeners() {
    // Mobile menu toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-mobile-menu-toggle]')) {
        this.toggleMobileMenu()
      }

      if (e.target.matches('[data-nav-dropdown-toggle]')) {
        this.toggleDropdown(e.target)
      }
    })

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        this.closeAllDropdowns()
      }
    })

    // Handle navigation state changes
    window.addEventListener('popstate', () => {
      this.updateBreadcrumbs()
      this.highlightActiveNav()
    })
  }

  render() {
    return `
            <nav class="main-navigation" role="navigation" aria-label="Main Navigation">
                ${this.renderHeader()}
                ${this.renderMainNav()}
                ${this.renderBreadcrumbs()}
            </nav>
        `
  }

  renderHeader() {
    return `
            <div class="nav-header">
                <div class="nav-brand">
                    <a href="/" class="brand-link" aria-label="Regulatory Intelligence Platform Home">
                        <div class="brand-icon" aria-hidden="true">${this.getIcon('brand')}</div>
                        <div class="brand-text">
                            <span class="brand-title">Regulatory Intelligence</span>
                            <span class="brand-subtitle">Live Monitoring Platform</span>
                        </div>
                    </a>
                </div>
                
                <div class="nav-actions">
                    <button 
                        class="mobile-menu-toggle" 
                        data-mobile-menu-toggle
                        aria-label="Toggle mobile menu"
                        aria-expanded="false"
                    >
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </div>
        `
  }

  renderMainNav() {
    const navItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: this.getIcon('dashboard'),
        href: '/dashboard',
        description: 'Real-time regulatory updates overview'
      },
      {
        id: 'updates',
        label: 'Updates',
        icon: this.getIcon('updates'),
        href: '/updates',
        description: 'All regulatory news and announcements',
        badge: this.getUpdateCount()
      },
      {
        id: 'authorities',
        label: 'Authorities',
        icon: this.getIcon('authorities'),
        href: '/authorities',
        description: 'Browse by regulatory authority',
        dropdown: this.getAuthoritiesDropdown()
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: this.getIcon('analytics'),
        href: '/analytics',
        description: 'Trends and intelligence insights'
      },
      {
        id: 'alerts',
        label: 'Alerts',
        icon: this.getIcon('alerts'),
        href: '/alerts',
        description: 'Your personalized alert settings',
        badge: this.getActiveAlertsCount()
      },
      {
        id: 'search',
        label: 'Search',
        icon: this.getIcon('search'),
        href: '/search',
        description: 'Advanced search and filtering'
      }
    ]

    return `
            <div class="nav-main">
                <ul class="nav-list" role="menubar">
                    ${navItems.map(item => this.renderNavItem(item)).join('')}
                </ul>
            </div>
        `
  }

  renderNavItem(item) {
    const isActive = this.isActiveNavItem(item.href)
    const hasDropdown = item.dropdown && item.dropdown.length > 0

    return `
            <li class="nav-item ${isActive ? 'nav-item--active' : ''}" role="none">
                <a 
                    href="${item.href}" 
                    class="nav-link ${hasDropdown ? 'nav-link--dropdown' : ''}"
                    role="menuitem"
                    aria-describedby="${item.id}-description"
                    ${hasDropdown ? 'data-nav-dropdown-toggle aria-haspopup="true" aria-expanded="false"' : ''}
                >
                    <span class="nav-icon" aria-hidden="true">${item.icon}</span>
                    <span class="nav-text">
                        <span class="nav-label">${item.label}</span>
                        ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
                    </span>
                    ${hasDropdown ? `<span class="nav-arrow" aria-hidden="true">${this.getIcon('caret')}</span>` : ''}
                </a>
                
                <div class="nav-description sr-only" id="${item.id}-description">
                    ${item.description}
                </div>
                
                ${hasDropdown ? this.renderDropdown(item.dropdown) : ''}
            </li>
        `
  }

  renderDropdown(items) {
    return `
            <div class="nav-dropdown" role="menu" aria-hidden="true">
                <div class="nav-dropdown-content">
                    ${items.map(item => `
                        <a 
                            href="${item.href}" 
                            class="nav-dropdown-item"
                            role="menuitem"
                        >
                            <span class="dropdown-icon" aria-hidden="true">${item.icon}</span>
                            <div class="dropdown-text">
                                <span class="dropdown-label">${item.label}</span>
                                <span class="dropdown-count">${item.count || 0}</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `
  }

  renderBreadcrumbs() {
    if (this.breadcrumbs.length <= 1) return ''

    return `
            <div class="breadcrumbs" role="navigation" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    ${this.breadcrumbs.map((crumb, index) => {
                        const isLast = index === this.breadcrumbs.length - 1
                        return `
                            <li class="breadcrumb-item ${isLast ? 'breadcrumb-item--current' : ''}">
                                ${isLast
                                    ? `<span aria-current="page">${crumb.label}</span>`
                                    : `<a href="${crumb.href}">${crumb.label}</a>`
                                }
                                ${!isLast ? '<span class="breadcrumb-separator" aria-hidden="true">→</span>' : ''}
                            </li>
                        `
                    }).join('')}
                </ol>
            </div>
        `
  }

  // Helper Methods
  isActiveNavItem(href) {
    return this.currentPage === href || this.currentPage.startsWith(href + '/')
  }

  getUpdateCount() {
    // This would integrate with your real data
    return window.updateCounts?.total || 0
  }

  getActiveAlertsCount() {
    // This would integrate with your real data
    return window.alertCounts?.active || 0
  }

  getAuthoritiesDropdown() {
    const authorities = [
      { label: 'FCA', href: '/authorities/fca', icon: this.getIcon('authority'), count: 45 },
      { label: 'Bank of England', href: '/authorities/boe', icon: this.getIcon('bank'), count: 23 },
      { label: 'PRA', href: '/authorities/pra', icon: this.getIcon('shield'), count: 18 },
      { label: 'TPR', href: '/authorities/tpr', icon: this.getIcon('briefcase'), count: 12 },
      { label: 'SFO', href: '/authorities/sfo', icon: this.getIcon('scales'), count: 8 },
      { label: 'FATF', href: '/authorities/fatf', icon: this.getIcon('globe'), count: 6 }
    ]

    return authorities
  }

  updateBreadcrumbs() {
    const path = window.location.pathname
    const pathSegments = path.split('/').filter(segment => segment)

    this.breadcrumbs = [
      { label: 'Home', href: '/' }
    ]

    // Build breadcrumbs based on current path
    let currentPath = ''
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`
      this.breadcrumbs.push({
        label: this.formatBreadcrumbLabel(segment),
        href: currentPath
      })
    })
  }

  formatBreadcrumbLabel(segment) {
    const labelMap = {
      dashboard: 'Dashboard',
      updates: 'Updates',
      authorities: 'Authorities',
      analytics: 'Analytics',
      alerts: 'Alerts',
      search: 'Search',
      fca: 'FCA',
      boe: 'Bank of England',
      pra: 'PRA',
      tpr: 'TPR',
      sfo: 'SFO',
      fatf: 'FATF'
    }

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  highlightActiveNav() {
    // Remove existing active states
    document.querySelectorAll('.nav-item--active').forEach(item => {
      item.classList.remove('nav-item--active')
    })

    // Add active state to current nav item
    const currentNavItem = document.querySelector(`[href="${this.currentPage}"]`)?.closest('.nav-item')
    if (currentNavItem) {
      currentNavItem.classList.add('nav-item--active')
    }
  }

  toggleMobileMenu() {
    const nav = document.querySelector('.main-navigation')
    const toggle = document.querySelector('[data-mobile-menu-toggle]')
    const isOpen = nav.classList.contains('nav--mobile-open')

    nav.classList.toggle('nav--mobile-open')
    toggle.setAttribute('aria-expanded', !isOpen)
  }

  toggleDropdown(trigger) {
    const dropdown = trigger.parentElement.querySelector('.nav-dropdown')
    const isOpen = dropdown.getAttribute('aria-hidden') === 'false'

    // Close all other dropdowns
    this.closeAllDropdowns()

    if (!isOpen) {
      dropdown.setAttribute('aria-hidden', 'false')
      trigger.setAttribute('aria-expanded', 'true')
    }
  }

  closeAllDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      dropdown.setAttribute('aria-hidden', 'true')
    })

    document.querySelectorAll('[data-nav-dropdown-toggle]').forEach(toggle => {
      toggle.setAttribute('aria-expanded', 'false')
    })
  }

  buildIconLibrary() {
    return {
      brand: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16"></path><rect x="5" y="10" width="3" height="8" rx="0.8"></rect><rect x="10.5" y="7" width="3" height="11" rx="0.8"></rect><rect x="16" y="4" width="3" height="14" rx="0.8"></rect></svg>',
      dashboard: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.4"></rect><rect x="13" y="4" width="7" height="5" rx="1.4"></rect><rect x="13" y="11" width="7" height="9" rx="1.4"></rect><rect x="4" y="13" width="7" height="7" rx="1.4"></rect></svg>',
      updates: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.5h8.5L19 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z"></path><path d="M15.5 4.5V8H19"></path><path d="M9.5 12h5"></path><path d="M9.5 15h4"></path></svg>',
      authorities: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 4.5 8v12h15V8L12 4z"></path><path d="M7.5 11v7"></path><path d="M12 11v7"></path><path d="M16.5 11v7"></path><path d="M5 19h14"></path></svg>',
      analytics: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16"></path><path d="M5 14.5 9.5 10l3.2 3.5 6.3-7"></path><circle cx="9.5" cy="10" r="1"></circle><circle cx="18" cy="6.5" r="1"></circle></svg>',
      alerts: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16v-5a6 6 0 0 0-12 0v5"></path><path d="M5 16h14"></path><path d="M9 19a3 3 0 0 0 6 0"></path></svg>',
      search: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"></circle><path d="M15.5 15.5 20 20"></path></svg>',
      caret: '<svg viewBox="0 0 16 16" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 6.5 3.5 3 3.5-3"></path></svg>',
      authority: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 5 8v12h14V8l-7-4z"></path><path d="M7.5 11v7"></path><path d="M12 11v7"></path><path d="M16.5 11v7"></path><path d="M5 19h14"></path></svg>',
      bank: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16"></path><path d="M6 9V7l6-4 6 4v2"></path><path d="M6 9v10"></path><path d="M18 9v10"></path><path d="M9 13v6"></path><path d="M15 13v6"></path><path d="M4 19h16"></path></svg>',
      shield: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v6c0 4 2.9 7.4 7 9 4.1-1.6 7-5 7-9V6l-7-3z"></path><path d="M12 11v6"></path><path d="M9.5 12.5 12 11l2.5 1.5"></path></svg>',
      briefcase: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14a1 1 0 0 1 1 1v9H4V9a1 1 0 0 1 1-1z"></path><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path><path d="M9 13h6"></path><path d="M12 12v2"></path></svg>',
      scales: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v15"></path><path d="M5 7h14"></path><path d="m7.5 7 3.5 7h-7l3.5-7z"></path><path d="m16.5 7 3.5 7h-7l3.5-7z"></path><path d="M8 20h8"></path></svg>',
      globe: '<svg viewBox="0 0 24 24" focusable="false" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><path d="M2.5 12h19"></path><path d="M12 4c2.5 3 2.5 13 0 16"></path><path d="M8 4c-1.5 3-1.5 13 0 16"></path><path d="M16 4c1.5 3 1.5 13 0 16"></path></svg>'
    }
  }

  getIcon(name) {
    return this.icons?.[name] || this.icons?.brand || ''
  }

  // Public API
  updateNavBadge(itemId, count) {
    const navItem = document.querySelector(`[href*="${itemId}"] .nav-badge`)
    if (navItem) {
      navItem.textContent = count
      navItem.style.display = count > 0 ? 'inline-flex' : 'none'
    }
  }

  setActivePage(pathname) {
    this.currentPage = pathname
    this.updateBreadcrumbs()
    this.highlightActiveNav()
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationSystem
} else {
  window.NavigationSystem = NavigationSystem
}
