function renderUserSection({ user, persona, personaPresets }) {
  return user ? `
            <div class="sidebar-user-section">
                <div class="user-info">
                    <div class="user-avatar">${user.email ? user.email.charAt(0).toUpperCase() : 'U'}</div>
                    <div class="user-details">
                        <span class="user-email">${user.email || 'User'}</span>
                        ${persona ? `<span class="user-persona" style="color: ${persona.color}">${persona.name}</span>` : ''}
                    </div>
                </div>
                <div class="persona-selector">
                    <label class="persona-label">Firm Type</label>
                    <select id="personaSelect" onchange="updatePersona(this.value)" class="persona-dropdown">
                        <option value="">-- Select Firm Type --</option>
                        ${personaPresets.map(p => `
                            <option value="${p.id}" ${persona && persona.id === p.id ? 'selected' : ''}>${p.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            ` : `
            <div class="sidebar-login-prompt">
                <a href="/login" class="login-prompt-btn">
                    <span class="login-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                    </span>
                    <span>Log in for personalized intelligence</span>
                </a>
            </div>
            `
}

function renderNavigation({ currentPage, icons, recentCounts }) {
  // Helper to render a collapsible section
  const renderSection = (id, title, items, defaultExpanded = true) => {
    const hasActiveItem = items.some(item => item.active)
    const expanded = hasActiveItem || defaultExpanded

    return `
      <div class="sidebar-section" data-section-id="${id}">
        <button class="section-header" onclick="toggleSidebarSection('${id}')"
                aria-expanded="${expanded}" aria-controls="${id}-content">
          <span class="section-title">${title}</span>
          <span class="section-chevron">${expanded ? '▼' : '▶'}</span>
        </button>
        <div class="section-content ${expanded ? 'expanded' : 'collapsed'}" id="${id}-content">
          <ul class="nav-list">
            ${items.map(item => `
              <li class="nav-item ${item.active ? 'active' : ''}">
                <a href="${item.href}" class="nav-link">
                  <span class="nav-icon">${item.icon}</span>
                  <span class="nav-text">${item.text}</span>
                  ${item.badge ? `<span class="nav-badge ${item.badgeClass || ''}">${item.badge}</span>` : ''}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `
  }

  // Navigation items
  const navigationItems = [
    { href: '/', icon: icons.home, text: 'Home', active: currentPage === '' || currentPage === 'home' },
    { href: '/dashboard', icon: icons.dashboard, text: 'Dashboard', active: currentPage === 'dashboard', badge: recentCounts.unread > 0 ? recentCounts.unread : null },
    { href: '/international', icon: icons.international, text: 'International', active: currentPage === 'international' },
    { href: '/bank-news', icon: icons.bankNews, text: 'Bank News', active: currentPage === 'bank-news' },
    { href: '/handbook', icon: icons.handbook, text: 'FCA Handbook', active: currentPage === 'handbook' },
    { href: '/profile-hub', icon: icons.profileHub, text: 'Profile Hub', active: currentPage === 'profile-hub' },
    { href: '/analytics', icon: icons.analytics, text: 'Analytics', active: currentPage === 'analytics' },
    { href: '/ai-intelligence', icon: icons.intelligence, text: 'Intelligence', active: currentPage === 'ai-intelligence' },
    { href: '/weekly-roundup', icon: icons.roundup, text: 'Weekly Roundup', active: currentPage === 'weekly-roundup' },
    { href: '/regulatory-calendar', icon: icons.calendar, text: 'Calendar', active: currentPage === 'calendar' },
    { href: '/kanban', icon: icons.kanban, text: 'Change Management', active: currentPage === 'kanban' }
  ]

  // Analysis items
  const analysisItems = [
    { href: '/dear-ceo', icon: icons.dearCeo || icons.enforcement, text: 'Dear CEO Letters', active: currentPage === 'dear-ceo' },
    { href: '/consultations', icon: icons.consultation || icons.roundup, text: 'Consultations', active: currentPage === 'consultations' },
    { href: '/regulatory-analytics', icon: icons.regAnalytics, text: 'Reg Analytics', active: currentPage === 'regulatory-analytics' },
    { href: '/enforcement', icon: icons.enforcement, text: 'Enforcement', active: currentPage === 'enforcement' },
    { href: '/publications', icon: icons.policy, text: 'Publications', active: currentPage === 'publications' },
    { href: '/authority-spotlight/FCA', icon: icons.authority, text: 'Authority Spotlight', active: currentPage === 'authority-spotlight' },
    { href: '/sector-intelligence/Banking', icon: icons.sector, text: 'Sector Intelligence', active: currentPage === 'sector-intelligence' }
  ]

  // Research & Policy items
  const researchItems = [
    { href: '/watch-lists', icon: icons.watchList, text: 'Watch Lists', active: currentPage === 'watch-lists' },
    { href: '/dossiers', icon: icons.dossier, text: 'Research Dossiers', active: currentPage === 'dossiers' },
    { href: '/policies', icon: icons.policy, text: 'Policy Library', active: currentPage === 'policies' }
  ]

  // Account items
  const accountItems = [
    { href: '/settings', icon: icons.settings, text: 'Settings', active: currentPage === 'settings' }
  ]

  return `<nav class="sidebar-nav-clean">
    ${renderSection('navigation', 'NAVIGATION', navigationItems, true)}
    ${renderSection('analysis', 'ANALYSIS', analysisItems, true)}
    ${renderSection('research', 'RESEARCH & POLICY', researchItems, false)}
    ${renderSection('account', 'ACCOUNT', accountItems, false)}
  </nav>`
}

function renderFooterLinks({ user }) {
  return `<div class="footer-links">
                    <a href="#" onclick="showFilterPanel()" class="footer-link">Filters</a>
                    <span class="separator">- </span>
                    <a href="#" onclick="showHelp()" class="footer-link">Help</a>
                    ${user ? `
                    <span class="separator">- </span>
                    <a href="#" onclick="logout()" class="footer-link">Logout</a>
                    ` : ''}
                </div>
  `
}

module.exports = {
  renderUserSection,
  renderNavigation,
  renderFooterLinks
}
