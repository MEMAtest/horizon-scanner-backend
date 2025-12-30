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
  return `<nav class="sidebar-nav-clean">
                <div class="nav-section-title">NAVIGATION</div>
                <ul class="nav-list">
                    <li class="nav-item ${currentPage === '' || currentPage === 'home' ? 'active' : ''}">
                        <a href="/" class="nav-link">
                            <span class="nav-icon">${icons.home}</span>
                            <span class="nav-text">Home</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
                        <a href="/dashboard" class="nav-link">
                            <span class="nav-icon">${icons.dashboard}</span>
                            <span class="nav-text">Dashboard</span>
                            ${recentCounts.unread > 0 ? `<span class="nav-badge">${recentCounts.unread}</span>` : ''}
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'profile-hub' ? 'active' : ''}">
                        <a href="/profile-hub" class="nav-link">
                            <span class="nav-icon">${icons.profileHub}</span>
                            <span class="nav-text">Profile Hub</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'analytics' ? 'active' : ''}">
                        <a href="/analytics" class="nav-link">
                            <span class="nav-icon">${icons.analytics}</span>
                            <span class="nav-text">Analytics</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'ai-intelligence' ? 'active' : ''}">
                        <a href="/ai-intelligence" class="nav-link">
                            <span class="nav-icon">${icons.intelligence}</span>
                            <span class="nav-text">Intelligence</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'weekly-roundup' ? 'active' : ''}">
                        <a href="/weekly-roundup" class="nav-link">
                            <span class="nav-icon">${icons.roundup}</span>
                            <span class="nav-text">Weekly Roundup</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'calendar' ? 'active' : ''}">
                        <a href="/regulatory-calendar" class="nav-link">
                            <span class="nav-icon">${icons.calendar}</span>
                            <span class="nav-text">Calendar</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'kanban' ? 'active' : ''}">
                        <a href="/kanban" class="nav-link">
                            <span class="nav-icon">${icons.kanban}</span>
                            <span class="nav-text">Change Management</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                </ul>

                <div class="nav-section-title">ANALYSIS</div>
                <ul class="nav-list">
                    <li class="nav-item ${currentPage === 'regulatory-analytics' ? 'active' : ''}">
                        <a href="/regulatory-analytics" class="nav-link">
                            <span class="nav-icon">${icons.regAnalytics}</span>
                            <span class="nav-text">Reg Analytics</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'enforcement' ? 'active' : ''}">
                        <a href="/enforcement" class="nav-link">
                            <span class="nav-icon">${icons.enforcement}</span>
                            <span class="nav-text">Enforcement</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'publications' ? 'active' : ''}">
                        <a href="/publications" class="nav-link">
                            <span class="nav-icon">${icons.policy}</span>
                            <span class="nav-text">Publications</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'handbook' ? 'active' : ''}">
                        <a href="/handbook" class="nav-link">
                            <span class="nav-icon">${icons.handbook}</span>
                            <span class="nav-text">FCA Handbook</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'authority-spotlight' ? 'active' : ''}">
                        <a href="/authority-spotlight/FCA" class="nav-link">
                            <span class="nav-icon">${icons.authority}</span>
                            <span class="nav-text">Authority Spotlight</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'sector-intelligence' ? 'active' : ''}">
                        <a href="/sector-intelligence/Banking" class="nav-link">
                            <span class="nav-icon">${icons.sector}</span>
                            <span class="nav-text">Sector Intelligence</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'international' ? 'active' : ''}">
                        <a href="/international" class="nav-link">
                            <span class="nav-icon">${icons.international}</span>
                            <span class="nav-text">International</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                </ul>

                <div class="nav-section-title">RESEARCH & POLICY</div>
                <ul class="nav-list">
                    <li class="nav-item ${currentPage === 'watch-lists' ? 'active' : ''}">
                        <a href="/watch-lists" class="nav-link">
                            <span class="nav-icon">${icons.watchList}</span>
                            <span class="nav-text">Watch Lists</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'dossiers' ? 'active' : ''}">
                        <a href="/dossiers" class="nav-link">
                            <span class="nav-icon">${icons.dossier}</span>
                            <span class="nav-text">Research Dossiers</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                    <li class="nav-item ${currentPage === 'policies' ? 'active' : ''}">
                        <a href="/policies" class="nav-link">
                            <span class="nav-icon">${icons.policy}</span>
                            <span class="nav-text">Policy Library</span>
                            <span class="nav-badge new">NEW</span>
                        </a>
                    </li>
                </ul>

                <div class="nav-section-title">ACCOUNT</div>
                <ul class="nav-list">
                    <li class="nav-item ${currentPage === 'settings' ? 'active' : ''}">
                        <a href="/settings" class="nav-link">
                            <span class="nav-icon">${icons.settings}</span>
                            <span class="nav-text">Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
  `
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
