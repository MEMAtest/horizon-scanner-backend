// ==========================================
// 🧭 Navigation System Component
// src/components/NavigationSystem.js
// ==========================================

class NavigationSystem {
    constructor() {
        this.currentPage = window.location.pathname;
        this.breadcrumbs = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBreadcrumbs();
        this.highlightActiveNav();
    }

    setupEventListeners() {
        // Mobile menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-mobile-menu-toggle]')) {
                this.toggleMobileMenu();
            }
            
            if (e.target.matches('[data-nav-dropdown-toggle]')) {
                this.toggleDropdown(e.target);
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Handle navigation state changes
        window.addEventListener('popstate', () => {
            this.updateBreadcrumbs();
            this.highlightActiveNav();
        });
    }

    render() {
        return `
            <nav class="main-navigation" role="navigation" aria-label="Main Navigation">
                ${this.renderHeader()}
                ${this.renderMainNav()}
                ${this.renderBreadcrumbs()}
            </nav>
        `;
    }

    renderHeader() {
        return `
            <div class="nav-header">
                <div class="nav-brand">
                    <a href="/" class="brand-link" aria-label="Regulatory Intelligence Platform Home">
                        <div class="brand-icon">📊</div>
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
        `;
    }

    renderMainNav() {
        const navItems = [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: '📊',
                href: '/dashboard',
                description: 'Real-time regulatory updates overview'
            },
            {
                id: 'updates',
                label: 'Updates',
                icon: '📰',
                href: '/updates',
                description: 'All regulatory news and announcements',
                badge: this.getUpdateCount()
            },
            {
                id: 'authorities',
                label: 'Authorities',
                icon: '🏛️',
                href: '/authorities',
                description: 'Browse by regulatory authority',
                dropdown: this.getAuthoritiesDropdown()
            },
            {
                id: 'analytics',
                label: 'Analytics',
                icon: '📈',
                href: '/analytics',
                description: 'Trends and intelligence insights'
            },
            {
                id: 'alerts',
                label: 'Alerts',
                icon: '🚨',
                href: '/alerts',
                description: 'Your personalized alert settings',
                badge: this.getActiveAlertsCount()
            },
            {
                id: 'search',
                label: 'Search',
                icon: '🔍',
                href: '/search',
                description: 'Advanced search and filtering'
            }
        ];

        return `
            <div class="nav-main">
                <ul class="nav-list" role="menubar">
                    ${navItems.map(item => this.renderNavItem(item)).join('')}
                </ul>
            </div>
        `;
    }

    renderNavItem(item) {
        const isActive = this.isActiveNavItem(item.href);
        const hasDropdown = item.dropdown && item.dropdown.length > 0;
        
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
                    ${hasDropdown ? '<span class="nav-arrow" aria-hidden="true">▼</span>' : ''}
                </a>
                
                <div class="nav-description sr-only" id="${item.id}-description">
                    ${item.description}
                </div>
                
                ${hasDropdown ? this.renderDropdown(item.dropdown) : ''}
            </li>
        `;
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
                            <span class="dropdown-icon">${item.icon}</span>
                            <div class="dropdown-text">
                                <span class="dropdown-label">${item.label}</span>
                                <span class="dropdown-count">${item.count || 0}</span>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderBreadcrumbs() {
        if (this.breadcrumbs.length <= 1) return '';
        
        return `
            <div class="breadcrumbs" role="navigation" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    ${this.breadcrumbs.map((crumb, index) => {
                        const isLast = index === this.breadcrumbs.length - 1;
                        return `
                            <li class="breadcrumb-item ${isLast ? 'breadcrumb-item--current' : ''}">
                                ${isLast ? 
                                    `<span aria-current="page">${crumb.label}</span>` :
                                    `<a href="${crumb.href}">${crumb.label}</a>`
                                }
                                ${!isLast ? '<span class="breadcrumb-separator" aria-hidden="true">→</span>' : ''}
                            </li>
                        `;
                    }).join('')}
                </ol>
            </div>
        `;
    }

    // Helper Methods
    isActiveNavItem(href) {
        return this.currentPage === href || this.currentPage.startsWith(href + '/');
    }

    getUpdateCount() {
        // This would integrate with your real data
        return window.updateCounts?.total || 0;
    }

    getActiveAlertsCount() {
        // This would integrate with your real data
        return window.alertCounts?.active || 0;
    }

    getAuthoritiesDropdown() {
        const authorities = [
            { label: 'FCA', href: '/authorities/fca', icon: '🏛️', count: 45 },
            { label: 'Bank of England', href: '/authorities/boe', icon: '🏦', count: 23 },
            { label: 'PRA', href: '/authorities/pra', icon: '🛡️', count: 18 },
            { label: 'TPR', href: '/authorities/tpr', icon: '💼', count: 12 },
            { label: 'SFO', href: '/authorities/sfo', icon: '⚖️', count: 8 },
            { label: 'FATF', href: '/authorities/fatf', icon: '🌍', count: 6 }
        ];
        
        return authorities;
    }

    updateBreadcrumbs() {
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter(segment => segment);
        
        this.breadcrumbs = [
            { label: 'Home', href: '/' }
        ];

        // Build breadcrumbs based on current path
        let currentPath = '';
        pathSegments.forEach(segment => {
            currentPath += `/${segment}`;
            this.breadcrumbs.push({
                label: this.formatBreadcrumbLabel(segment),
                href: currentPath
            });
        });
    }

    formatBreadcrumbLabel(segment) {
        const labelMap = {
            'dashboard': 'Dashboard',
            'updates': 'Updates',
            'authorities': 'Authorities',
            'analytics': 'Analytics',
            'alerts': 'Alerts',
            'search': 'Search',
            'fca': 'FCA',
            'boe': 'Bank of England',
            'pra': 'PRA',
            'tpr': 'TPR',
            'sfo': 'SFO',
            'fatf': 'FATF'
        };
        
        return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    highlightActiveNav() {
        // Remove existing active states
        document.querySelectorAll('.nav-item--active').forEach(item => {
            item.classList.remove('nav-item--active');
        });

        // Add active state to current nav item
        const currentNavItem = document.querySelector(`[href="${this.currentPage}"]`)?.closest('.nav-item');
        if (currentNavItem) {
            currentNavItem.classList.add('nav-item--active');
        }
    }

    toggleMobileMenu() {
        const nav = document.querySelector('.main-navigation');
        const toggle = document.querySelector('[data-mobile-menu-toggle]');
        const isOpen = nav.classList.contains('nav--mobile-open');
        
        nav.classList.toggle('nav--mobile-open');
        toggle.setAttribute('aria-expanded', !isOpen);
    }

    toggleDropdown(trigger) {
        const dropdown = trigger.parentElement.querySelector('.nav-dropdown');
        const isOpen = dropdown.getAttribute('aria-hidden') === 'false';
        
        // Close all other dropdowns
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.setAttribute('aria-hidden', 'false');
            trigger.setAttribute('aria-expanded', 'true');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
            dropdown.setAttribute('aria-hidden', 'true');
        });
        
        document.querySelectorAll('[data-nav-dropdown-toggle]').forEach(toggle => {
            toggle.setAttribute('aria-expanded', 'false');
        });
    }

    // Public API
    updateNavBadge(itemId, count) {
        const navItem = document.querySelector(`[href*="${itemId}"] .nav-badge`);
        if (navItem) {
            navItem.textContent = count;
            navItem.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }

    setActivePage(pathname) {
        this.currentPage = pathname;
        this.updateBreadcrumbs();
        this.highlightActiveNav();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationSystem;
} else {
    window.NavigationSystem = NavigationSystem;
}