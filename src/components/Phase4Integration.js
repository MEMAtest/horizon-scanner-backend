// ==========================================
// 🚀 Phase 4 Integration & Initialization
// src/components/Phase4Integration.js
// ==========================================

/**
 * Phase 4 UI Components Integration System
 * Coordinates all Phase 4 components and provides unified initialization
 */

class Phase4Integration {
    constructor(options = {}) {
        this.options = {
            autoInit: true,
            enableDebug: false,
            enableAnalytics: false,
            ...options
        };
        
        this.components = {
            navigation: null,
            filterSystem: null,
            liveCounters: null,
            searchInterface: null
        };
        
        this.isInitialized = false;
        this.eventBus = componentHelpers.eventBus;
        
        if (this.options.autoInit) {
            this.waitForDOMReady(() => this.init());
        }
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    async init() {
        try {
            this.log('Initializing Phase 4 UI System...');
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Initialize core utilities
            this.initializeUtilities();
            
            // Setup theme and design system
            this.setupDesignSystem();
            
            // Initialize components in dependency order
            await this.initializeComponents();
            
            // Setup component communication
            this.setupComponentCommunication();
            
            // Setup global event listeners
            this.setupGlobalEvents();
            
            // Initialize responsive behavior
            this.setupResponsiveBehavior();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            this.log('Phase 4 UI System initialized successfully');
            
            // Emit initialization complete event
            this.emit('phase4:initialized', {
                components: Object.keys(this.components),
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Failed to initialize Phase 4 UI System:', error);
            this.handleInitializationError(error);
        }
    }

    waitForDOMReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    // ==========================================
    // COMPONENT INITIALIZATION
    // ==========================================

    async initializeComponents() {
        const initOrder = [
            'navigation',
            'liveCounters', 
            'filterSystem',
            'searchInterface'
        ];

        for (const componentName of initOrder) {
            try {
                await this.initializeComponent(componentName);
                this.log(`✓ ${componentName} initialized`);
            } catch (error) {
                console.warn(`Failed to initialize ${componentName}:`, error);
            }
        }
    }

    async initializeComponent(componentName) {
        const config = this.getComponentConfig(componentName);
        
        switch (componentName) {
            case 'navigation':
                if (this.hasElement('.main-navigation') || this.hasElement('#navigation-system')) {
                    this.components.navigation = new NavigationSystem(config.navigation);
                    componentHelpers.registerComponent('navigation', this.components.navigation);
                }
                break;
                
            case 'filterSystem':
                if (this.hasElement('#filter-system')) {
                    this.components.filterSystem = new FilterSystem({
                        containerId: 'filter-system',
                        onFilterChange: (filters) => this.handleFilterChange(filters),
                        ...config.filterSystem
                    });
                    componentHelpers.registerComponent('filterSystem', this.components.filterSystem);
                }
                break;
                
            case 'liveCounters':
                if (this.hasElement('#live-counters')) {
                    this.components.liveCounters = new LiveCounters({
                        containerId: 'live-counters',
                        onCounterClick: (filter) => this.handleCounterClick(filter),
                        ...config.liveCounters
                    });
                    componentHelpers.registerComponent('liveCounters', this.components.liveCounters);
                }
                break;
                
            case 'searchInterface':
                if (this.hasElement('#search-interface')) {
                    this.components.searchInterface = new SearchInterface({
                        containerId: 'search-interface',
                        onSearch: (searchData) => this.handleSearch(searchData),
                        onSuggestionSelect: (suggestion) => this.handleSuggestionSelect(suggestion),
                        ...config.searchInterface
                    });
                    componentHelpers.registerComponent('searchInterface', this.components.searchInterface);
                }
                break;
        }
    }

    getComponentConfig(componentName) {
        const configs = {
            navigation: {
                // Navigation-specific config
            },
            filterSystem: {
                debounceDelay: 300,
                maxFilters: 50
            },
            liveCounters: {
                updateInterval: 30000,
                animationDuration: 1000
            },
            searchInterface: {
                debounceDelay: 300,
                maxSuggestions: 8,
                maxRecentSearches: 10
            }
        };
        
        return configs;
    }

    hasElement(selector) {
        return document.querySelector(selector) !== null;
    }

    // ==========================================
    // COMPONENT EVENT HANDLERS
    // ==========================================

    handleFilterChange(filters) {
        this.log('Filters changed:', filters);
        
        // Update other components based on filter changes
        if (this.components.liveCounters) {
            // Update counters to reflect filtered data
            this.updateCountersWithFilters(filters);
        }
        
        if (this.components.searchInterface) {
            // Update search to include filter context
            this.updateSearchWithFilters(filters);
        }
        
        // Emit global filter change event
        this.emit('filters:changed', { filters, source: 'filterSystem' });
    }

    handleCounterClick(filter) {
        this.log('Counter clicked:', filter);
        
        // Apply the counter filter to the filter system
        if (this.components.filterSystem) {
            this.applyCounterFilter(filter);
        }
        
        // Emit global counter click event
        this.emit('counter:clicked', { filter, source: 'liveCounters' });
    }

    handleSearch(searchData) {
        this.log('Search performed:', searchData);
        
        // Update other components with search results
        if (this.components.filterSystem) {
            this.updateFiltersWithSearch(searchData);
        }
        
        if (this.components.liveCounters) {
            this.updateCountersWithSearch(searchData);
        }
        
        // Emit global search event
        this.emit('search:performed', { searchData, source: 'searchInterface' });
    }

    handleSuggestionSelect(suggestion) {
        this.log('Suggestion selected:', suggestion);
        
        // Emit suggestion selection event
        this.emit('search:suggestion-selected', { suggestion, source: 'searchInterface' });
    }

    // ==========================================
    // COMPONENT COORDINATION
    // ==========================================

    updateCountersWithFilters(filters) {
        // This would integrate with your data layer to get filtered counts
        // For now, we'll simulate the update
        if (this.components.liveCounters) {
            // Update result count in filter system
            if (this.components.filterSystem) {
                // Simulate filtered result count
                const simulatedCount = Math.floor(Math.random() * 1000);
                this.components.filterSystem.updateResultCount(simulatedCount);
            }
        }
    }

    updateSearchWithFilters(filters) {
        // Update search context based on active filters
        if (this.components.searchInterface) {
            // This could update search suggestions or modify search behavior
            this.log('Search updated with filter context');
        }
    }

    applyCounterFilter(filter) {
        if (!this.components.filterSystem) return;
        
        // Map counter filter to filter system format
        const filterMapping = {
            authority: 'authorities',
            urgency: 'urgency',
            date: 'dateRange',
            status: 'status'
        };
        
        const filterKey = filterMapping[filter.type];
        if (filterKey && filter.value) {
            // Apply the filter
            if (filterKey === 'authorities') {
                this.components.filterSystem.selectFilter('authorities', [filter.value]);
            } else if (filterKey === 'dateRange') {
                this.components.filterSystem.setDatePreset(filter.value);
            }
            // Add other filter mappings as needed
        }
    }

    updateFiltersWithSearch(searchData) {
        // Update filters based on search context
        if (this.components.filterSystem && searchData.query) {
            // Could extract filter hints from search query
            this.log('Filters updated with search context');
        }
    }

    updateCountersWithSearch(searchData) {
        // Update counters to reflect search results
        if (this.components.liveCounters && searchData.results) {
            this.components.liveCounters.updateResultCount?.(searchData.results.length);
        }
    }

    // ==========================================
    // DESIGN SYSTEM SETUP
    // ==========================================

    setupDesignSystem() {
        // Apply design system classes to body
        document.body.classList.add('regulatory-ui-system');
        
        // Setup CSS custom properties based on user preferences
        this.setupThemePreferences();
        
        // Setup dark mode toggle if available
        this.setupDarkModeToggle();
        
        // Apply accessibility enhancements
        this.setupAccessibilityEnhancements();
    }

    setupThemePreferences() {
        const savedTheme = uiUtils.getStorage('ui-theme', 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!uiUtils.getStorage('ui-theme-override')) {
                    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    setupDarkModeToggle() {
        const toggleButton = document.querySelector('[data-theme-toggle]');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const newTheme = current === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                uiUtils.setStorage('ui-theme', newTheme);
                uiUtils.setStorage('ui-theme-override', true);
                
                this.emit('theme:changed', { theme: newTheme });
            });
        }
    }

    setupAccessibilityEnhancements() {
        // Add skip links if they don't exist
        this.addSkipLinks();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup reduced motion preferences
        this.setupReducedMotionPreferences();
    }

    addSkipLinks() {
        if (document.querySelector('.skip-links')) return;
        
        const skipLinks = uiUtils.createElement('div', {
            className: 'skip-links'
        }, `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#search" class="skip-link">Skip to search</a>
        `);
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    setupFocusManagement() {
        // Ensure proper focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }

    setupReducedMotionPreferences() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches) {
            document.documentElement.setAttribute('data-reduce-motion', 'true');
        }
        
        prefersReducedMotion.addEventListener('change', (e) => {
            document.documentElement.setAttribute('data-reduce-motion', e.matches);
        });
    }

    // ==========================================
    // GLOBAL EVENT SETUP
    // ==========================================

    setupGlobalEvents() {
        // Handle browser navigation
        window.addEventListener('popstate', () => {
            this.handleNavigationChange();
        });
        
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    handleNavigationChange() {
        if (this.components.navigation) {
            this.components.navigation.setActivePage(window.location.pathname);
        }
        
        this.emit('navigation:changed', { 
            path: window.location.pathname,
            search: window.location.search
        });
    }

    handleVisibilityChange() {
        const isVisible = !document.hidden;
        
        // Pause/resume components based on visibility
        Object.values(this.components).forEach(component => {
            if (component && typeof component.setVisible === 'function') {
                component.setVisible(isVisible);
            }
        });
        
        this.emit('visibility:changed', { visible: isVisible });
    }

    handleOnlineStatus(isOnline) {
        // Update components based on online status
        Object.values(this.components).forEach(component => {
            if (component && typeof component.setOnlineStatus === 'function') {
                component.setOnlineStatus(isOnline);
            }
        });
        
        this.emit('connectivity:changed', { online: isOnline });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Escape to close overlays
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }
        });
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            this.emit('search:focused');
        }
    }

    closeAllOverlays() {
        // Close any open overlays, dropdowns, modals
        const overlays = document.querySelectorAll('[aria-expanded="true"]');
        overlays.forEach(overlay => {
            overlay.setAttribute('aria-expanded', 'false');
        });
        
        this.emit('overlays:closed');
    }

    // ==========================================
    // RESPONSIVE BEHAVIOR
    // ==========================================

    setupResponsiveBehavior() {
        // Setup responsive component behavior
        uiUtils.onBreakpointChange((breakpoint) => {
            this.handleBreakpointChange(breakpoint);
        });
        
        // Setup container queries if supported
        this.setupContainerQueries();
    }

    handleBreakpointChange(breakpoint) {
        this.log(`Breakpoint changed to: ${breakpoint}`);
        
        // Update components based on breakpoint
        Object.values(this.components).forEach(component => {
            if (component && typeof component.handleBreakpointChange === 'function') {
                component.handleBreakpointChange(breakpoint);
            }
        });
        
        this.emit('breakpoint:changed', { breakpoint });
    }

    setupContainerQueries() {
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    const { width } = entry.contentRect;
                    const element = entry.target;
                    
                    // Apply container-based classes
                    element.classList.toggle('container-sm', width >= 400);
                    element.classList.toggle('container-md', width >= 600);
                    element.classList.toggle('container-lg', width >= 800);
                    element.classList.toggle('container-xl', width >= 1000);
                });
            });
            
            // Observe main containers
            const containers = document.querySelectorAll('.filter-system, .search-interface, .live-counters');
            containers.forEach(container => resizeObserver.observe(container));
        }
    }

    // ==========================================
    // PERFORMANCE MONITORING
    // ==========================================

    setupPerformanceMonitoring() {
        if (!this.options.enableAnalytics) return;
        
        // Monitor component load times
        this.measureComponentPerformance();
        
        // Monitor user interactions
        this.setupInteractionTracking();
        
        // Monitor errors
        this.setupErrorTracking();
    }

    measureComponentPerformance() {
        const startTime = performance.now();
        
        this.on('phase4:initialized', () => {
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            this.log(`Phase 4 initialization took ${loadTime.toFixed(2)}ms`);
            
            if (this.options.enableAnalytics) {
                this.trackEvent('performance', 'phase4_init_time', loadTime);
            }
        });
    }

    setupInteractionTracking() {
        if (!this.options.enableAnalytics) return;
        
        // Track component interactions
        this.on('filters:changed', (e) => {
            this.trackEvent('interaction', 'filter_change', e.detail);
        });
        
        this.on('search:performed', (e) => {
            this.trackEvent('interaction', 'search_performed', e.detail);
        });
        
        this.on('counter:clicked', (e) => {
            this.trackEvent('interaction', 'counter_clicked', e.detail);
        });
    }

    setupErrorTracking() {
        // Component-specific error tracking
        this.on('component:error', (e) => {
            this.trackError('component_error', e.detail);
        });
    }

    // ==========================================
    // ERROR HANDLING
    // ==========================================

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e.error, 'javascript');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.handleGlobalError(e.reason, 'promise');
        });
    }

    handleGlobalError(error, type) {
        console.error(`Global ${type} error:`, error);
        
        if (this.options.enableAnalytics) {
            this.trackError(`global_${type}_error`, { 
                message: error.message,
                stack: error.stack 
            });
        }
        
        this.emit('system:error', { error, type });
    }

    handleInitializationError(error) {
        // Show user-friendly error message
        this.showErrorMessage('Failed to initialize UI system. Please refresh the page.');
        
        if (this.options.enableAnalytics) {
            this.trackError('initialization_error', { 
                message: error.message,
                stack: error.stack 
            });
        }
    }

    showErrorMessage(message) {
        // Create error notification
        const errorNotification = uiUtils.createElement('div', {
            className: 'system-error-notification',
            role: 'alert'
        }, `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `);
        
        document.body.appendChild(errorNotification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorNotification.parentNode) {
                errorNotification.remove();
            }
        }, 10000);
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    /**
     * Get component instance
     */
    getComponent(name) {
        return this.components[name] || componentHelpers.getComponent(name);
    }

    /**
     * Update component configuration
     */
    updateComponentConfig(name, config) {
        const component = this.getComponent(name);
        if (component && typeof component.updateConfig === 'function') {
            component.updateConfig(config);
        }
    }

    /**
     * Refresh all components
     */
    refreshComponents() {
        Object.values(this.components).forEach(component => {
            if (component && typeof component.refresh === 'function') {
                component.refresh();
            }
        });
    }

    /**
     * Destroy Phase 4 system
     */
    destroy() {
        // Destroy all components
        Object.entries(this.components).forEach(([name, component]) => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
            componentHelpers.unregisterComponent(name);
        });
        
        // Clear references
        this.components = {};
        this.isInitialized = false;
        
        this.emit('phase4:destroyed');
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    emit(event, detail = {}) {
        this.eventBus.dispatchEvent(new CustomEvent(event, { detail }));
    }

    on(event, callback) {
        this.eventBus.addEventListener(event, callback);
        return () => this.eventBus.removeEventListener(event, callback);
    }

    log(...args) {
        if (this.options.enableDebug) {
            console.log('[Phase4UI]', ...args);
        }
    }

    trackEvent(category, action, data = {}) {
        // Implement your analytics tracking here
        this.log('Track Event:', { category, action, data });
    }

    trackError(errorType, errorData) {
        // Implement your error tracking here
        this.log('Track Error:', { errorType, errorData });
    }
}

// Auto-initialize when script loads
let phase4System = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (!phase4System) {
        phase4System = new Phase4Integration({
            enableDebug: window.location.search.includes('debug=true'),
            enableAnalytics: window.location.hostname !== 'localhost'
        });
    }
});

// Export for manual initialization
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Phase4Integration;
} else {
    window.Phase4Integration = Phase4Integration;
    window.phase4System = phase4System;
}