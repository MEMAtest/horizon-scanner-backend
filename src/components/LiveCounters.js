// ==========================================
// 📊 Live Counters Component
// src/components/LiveCounters.js
// ==========================================

class LiveCounters {
    constructor(options = {}) {
        this.containerId = options.containerId || 'live-counters';
        this.updateInterval = options.updateInterval || 30000; // 30 seconds
        this.animationDuration = options.animationDuration || 1000;
        this.onCounterClick = options.onCounterClick || (() => {});
        
        this.counters = {
            total: { current: 0, previous: 0, trend: 'stable' },
            authorities: {},
            urgency: { high: 0, medium: 0, low: 0 },
            sectors: {},
            today: 0,
            thisWeek: 0,
            unread: 0
        };
        
        this.isVisible = true;
        this.updateTimer = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAutoUpdate();
        this.render();
        this.fetchInitialData();
    }

    setupEventListeners() {
        // Visibility API to pause updates when tab is not visible
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            if (this.isVisible) {
                this.fetchCounterData();
            }
        });

        // Window focus/blur events
        window.addEventListener('focus', () => {
            this.isVisible = true;
            this.fetchCounterData();
        });

        window.addEventListener('blur', () => {
            this.isVisible = false;
        });
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="live-counters">
                ${this.renderMainCounters()}
                ${this.renderAuthorityCounters()}
                ${this.renderUrgencyCounters()}
                ${this.renderTrendingCounters()}
                ${this.renderLastUpdated()}
            </div>
        `;

        this.attachCounterEvents();
    }

    renderMainCounters() {
        const total = this.counters.total;
        const trendIcon = this.getTrendIcon(total.trend);
        const trendClass = `trend--${total.trend}`;
        
        return `
            <div class="counter-section counter-section--main">
                <div class="counter-header">
                    <h3 class="counter-title">📊 Live Statistics</h3>
                    <div class="counter-refresh">
                        <button 
                            class="refresh-btn" 
                            onclick="liveCounters.refreshCounters()"
                            aria-label="Refresh counters"
                        >
                            <span class="refresh-icon">🔄</span>
                        </button>
                    </div>
                </div>
                
                <div class="main-counters-grid">
                    <div class="counter-card counter-card--primary" data-counter="total">
                        <div class="counter-value">
                            <span class="counter-number" data-counter-value="total">${total.current.toLocaleString()}</span>
                            <div class="counter-trend ${trendClass}">
                                <span class="trend-icon">${trendIcon}</span>
                                <span class="trend-text">${this.getTrendText(total)}</span>
                            </div>
                        </div>
                        <div class="counter-label">Total Updates</div>
                    </div>
                    
                    <div class="counter-card counter-card--success" data-counter="today">
                        <div class="counter-value">
                            <span class="counter-number" data-counter-value="today">${this.counters.today.toLocaleString()}</span>
                        </div>
                        <div class="counter-label">Today</div>
                    </div>
                    
                    <div class="counter-card counter-card--info" data-counter="thisWeek">
                        <div class="counter-value">
                            <span class="counter-number" data-counter-value="thisWeek">${this.counters.thisWeek.toLocaleString()}</span>
                        </div>
                        <div class="counter-label">This Week</div>
                    </div>
                    
                    <div class="counter-card counter-card--warning" data-counter="unread">
                        <div class="counter-value">
                            <span class="counter-number" data-counter-value="unread">${this.counters.unread.toLocaleString()}</span>
                        </div>
                        <div class="counter-label">Unread</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAuthorityCounters() {
        const authorities = [
            { key: 'FCA', label: 'FCA', color: '#00205b', icon: '🏛️' },
            { key: 'BOE', label: 'BoE', color: '#8b1538', icon: '🏦' },
            { key: 'PRA', label: 'PRA', color: '#003d82', icon: '🛡️' },
            { key: 'TPR', label: 'TPR', color: '#0085ca', icon: '💼' },
            { key: 'SFO', label: 'SFO', color: '#1d4ed8', icon: '⚖️' },
            { key: 'FATF', label: 'FATF', color: '#059669', icon: '🌍' }
        ];

        return `
            <div class="counter-section counter-section--authorities">
                <div class="counter-header">
                    <h3 class="counter-title">🏛️ By Authority</h3>
                    <button class="view-all-btn" onclick="liveCounters.viewAllAuthorities()">
                        View All
                    </button>
                </div>
                
                <div class="authority-counters">
                    ${authorities.map(auth => {
                        const count = this.counters.authorities[auth.key] || 0;
                        return `
                            <div 
                                class="authority-counter" 
                                data-counter="authority-${auth.key}"
                                style="--authority-color: ${auth.color}"
                            >
                                <div class="authority-icon">${auth.icon}</div>
                                <div class="authority-info">
                                    <div class="authority-count" data-counter-value="authority-${auth.key}">
                                        ${count.toLocaleString()}
                                    </div>
                                    <div class="authority-label">${auth.label}</div>
                                </div>
                                <div class="authority-progress">
                                    <div 
                                        class="authority-progress-bar" 
                                        style="width: ${this.calculateAuthorityPercentage(count)}%"
                                    ></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderUrgencyCounters() {
        const urgencyLevels = [
            { key: 'high', label: 'High Priority', color: '#dc2626', icon: '🚨' },
            { key: 'medium', label: 'Medium Priority', color: '#f59e0b', icon: '⚡' },
            { key: 'low', label: 'Low Priority', color: '#059669', icon: '📋' }
        ];

        return `
            <div class="counter-section counter-section--urgency">
                <div class="counter-header">
                    <h3 class="counter-title">⚡ Priority Levels</h3>
                </div>
                
                <div class="urgency-counters">
                    ${urgencyLevels.map(level => {
                        const count = this.counters.urgency[level.key] || 0;
                        return `
                            <div 
                                class="urgency-counter urgency-counter--${level.key}" 
                                data-counter="urgency-${level.key}"
                            >
                                <div class="urgency-icon" style="color: ${level.color}">
                                    ${level.icon}
                                </div>
                                <div class="urgency-content">
                                    <div class="urgency-count" data-counter-value="urgency-${level.key}">
                                        ${count.toLocaleString()}
                                    </div>
                                    <div class="urgency-label">${level.label}</div>
                                </div>
                                <div class="urgency-indicator" style="background-color: ${level.color}"></div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderTrendingCounters() {
        const trendingItems = this.getTrendingItems();
        
        return `
            <div class="counter-section counter-section--trending">
                <div class="counter-header">
                    <h3 class="counter-title">📈 Trending Topics</h3>
                    <div class="trending-period">Last 24h</div>
                </div>
                
                <div class="trending-list">
                    ${trendingItems.map((item, index) => `
                        <div class="trending-item" data-counter="trending-${index}">
                            <div class="trending-rank">#${index + 1}</div>
                            <div class="trending-content">
                                <div class="trending-topic">${item.topic}</div>
                                <div class="trending-count">
                                    ${item.count} updates
                                    <span class="trending-change trending-change--${item.change > 0 ? 'up' : 'down'}">
                                        ${item.change > 0 ? '↗' : '↘'} ${Math.abs(item.change)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderLastUpdated() {
        const lastUpdate = new Date().toLocaleTimeString();
        
        return `
            <div class="counter-footer">
                <div class="last-updated">
                    <span class="update-indicator">●</span>
                    Last updated: <span class="update-time">${lastUpdate}</span>
                </div>
                <div class="update-status">
                    <span class="status-indicator status-indicator--active"></span>
                    Live monitoring active
                </div>
            </div>
        `;
    }

    // Event Handling
    attachCounterEvents() {
        const container = document.getElementById(this.containerId);
        
        container.addEventListener('click', (e) => {
            const counterCard = e.target.closest('[data-counter]');
            if (counterCard) {
                const counterId = counterCard.dataset.counter;
                this.handleCounterClick(counterId);
            }
        });

        // Add hover effects
        container.addEventListener('mouseenter', (e) => {
            if (e.target.matches('.counter-card, .authority-counter, .urgency-counter')) {
                e.target.classList.add('counter--hover');
            }
        }, true);

        container.addEventListener('mouseleave', (e) => {
            if (e.target.matches('.counter-card, .authority-counter, .urgency-counter')) {
                e.target.classList.remove('counter--hover');
            }
        }, true);
    }

    handleCounterClick(counterId) {
        // Add click animation
        const element = document.querySelector(`[data-counter="${counterId}"]`);
        if (element) {
            element.classList.add('counter--clicked');
            setTimeout(() => element.classList.remove('counter--clicked'), 200);
        }

        // Trigger callback with filter information
        this.onCounterClick(this.getFilterFromCounterId(counterId));
    }

    getFilterFromCounterId(counterId) {
        if (counterId.startsWith('authority-')) {
            return { type: 'authority', value: counterId.replace('authority-', '') };
        } else if (counterId.startsWith('urgency-')) {
            return { type: 'urgency', value: counterId.replace('urgency-', '') };
        } else if (counterId === 'today') {
            return { type: 'date', value: 'today' };
        } else if (counterId === 'thisWeek') {
            return { type: 'date', value: 'week' };
        } else if (counterId === 'unread') {
            return { type: 'status', value: 'unread' };
        }
        return { type: 'all', value: null };
    }

    // Data Management
    async fetchInitialData() {
        try {
            const data = await this.fetchCounterData();
            this.updateCounters(data);
        } catch (error) {
            console.warn('Could not fetch initial counter data:', error);
            this.showOfflineIndicator();
        }
    }

    async fetchCounterData() {
        try {
            const response = await fetch('/api/counters', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching counter data:', error);
            // Return mock data for development
            return this.getMockData();
        }
    }

    getMockData() {
        return {
            total: { current: 1247, previous: 1203, trend: 'up' },
            authorities: {
                FCA: 456,
                BOE: 234,
                PRA: 187,
                TPR: 123,
                SFO: 89,
                FATF: 67
            },
            urgency: { high: 23, medium: 156, low: 1068 },
            sectors: {
                banking: 345,
                insurance: 267,
                investment: 189,
                fintech: 156
            },
            today: 47,
            thisWeek: 234,
            unread: 89
        };
    }

    updateCounters(newData) {
        // Store previous values for animation
        const previousCounters = JSON.parse(JSON.stringify(this.counters));
        
        // Update counter values
        Object.assign(this.counters, newData);
        
        // Animate counter changes
        this.animateCounterChanges(previousCounters);
        
        // Update last updated time
        this.updateLastUpdatedTime();
    }

    animateCounterChanges(previousCounters) {
        // Animate total counter
        this.animateCounterValue('total', previousCounters.total.current, this.counters.total.current);
        
        // Animate authority counters
        Object.keys(this.counters.authorities).forEach(authority => {
            const previous = previousCounters.authorities[authority] || 0;
            const current = this.counters.authorities[authority];
            this.animateCounterValue(`authority-${authority}`, previous, current);
        });
        
        // Animate urgency counters
        Object.keys(this.counters.urgency).forEach(level => {
            const previous = previousCounters.urgency[level] || 0;
            const current = this.counters.urgency[level];
            this.animateCounterValue(`urgency-${level}`, previous, current);
        });
        
        // Animate other counters
        ['today', 'thisWeek', 'unread'].forEach(key => {
            this.animateCounterValue(key, previousCounters[key] || 0, this.counters[key]);
        });
    }

    animateCounterValue(counterId, startValue, endValue) {
        const element = document.querySelector(`[data-counter-value="${counterId}"]`);
        if (!element || startValue === endValue) return;
        
        const duration = this.animationDuration;
        const startTime = performance.now();
        const difference = endValue - startValue;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (difference * easeOutCubic));
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Add pulse effect for significant changes
                if (Math.abs(difference) > 5) {
                    element.classList.add('counter-pulse');
                    setTimeout(() => element.classList.remove('counter-pulse'), 600);
                }
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Utility Methods
    getTrendIcon(trend) {
        const icons = {
            up: '📈',
            down: '📉',
            stable: '➡️'
        };
        return icons[trend] || '➡️';
    }

    getTrendText(counter) {
        const difference = counter.current - counter.previous;
        if (difference === 0) return 'No change';
        
        const percentage = Math.abs(Math.round((difference / counter.previous) * 100));
        const direction = difference > 0 ? 'up' : 'down';
        
        return `${percentage}% ${direction}`;
    }

    calculateAuthorityPercentage(count) {
        const maxCount = Math.max(...Object.values(this.counters.authorities));
        return maxCount > 0 ? (count / maxCount) * 100 : 0;
    }

    getTrendingItems() {
        // This would typically come from your backend
        return [
            { topic: 'Financial Crime', count: 23, change: 15 },
            { topic: 'Crypto Regulation', count: 18, change: 8 },
            { topic: 'ESG Requirements', count: 14, change: -3 },
            { topic: 'Consumer Duty', count: 12, change: 22 }
        ];
    }

    updateLastUpdatedTime() {
        const timeElement = document.querySelector('.update-time');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString();
        }
    }

    showOfflineIndicator() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.update-status');
        
        if (statusIndicator && statusText) {
            statusIndicator.className = 'status-indicator status-indicator--offline';
            statusText.innerHTML = '<span class="status-indicator status-indicator--offline"></span>Offline mode';
        }
    }

    // Auto-update Management
    startAutoUpdate() {
        this.updateTimer = setInterval(() => {
            if (this.isVisible) {
                this.fetchCounterData().then(data => {
                    this.updateCounters(data);
                }).catch(error => {
                    console.warn('Auto-update failed:', error);
                });
            }
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    setUpdateInterval(interval) {
        this.updateInterval = interval;
        this.stopAutoUpdate();
        this.startAutoUpdate();
    }

    // Public API
    refreshCounters() {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.add('refresh-spinning');
        }
        
        this.fetchCounterData().then(data => {
            this.updateCounters(data);
            
            if (refreshBtn) {
                setTimeout(() => {
                    refreshBtn.classList.remove('refresh-spinning');
                }, 1000);
            }
        }).catch(error => {
            console.error('Manual refresh failed:', error);
            if (refreshBtn) {
                refreshBtn.classList.remove('refresh-spinning');
            }
        });
    }

    viewAllAuthorities() {
        this.onCounterClick({ type: 'authorities', value: 'all' });
    }

    // Cleanup
    destroy() {
        this.stopAutoUpdate();
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }

    // Manual counter updates (for external use)
    updateCounter(counterId, newValue) {
        const parts = counterId.split('-');
        
        if (parts[0] === 'authority' && parts[1]) {
            this.counters.authorities[parts[1]] = newValue;
        } else if (parts[0] === 'urgency' && parts[1]) {
            this.counters.urgency[parts[1]] = newValue;
        } else if (this.counters.hasOwnProperty(counterId)) {
            this.counters[counterId] = newValue;
        }
        
        const element = document.querySelector(`[data-counter-value="${counterId}"]`);
        if (element) {
            element.textContent = newValue.toLocaleString();
        }
    }

    incrementCounter(counterId, amount = 1) {
        const current = this.getCounterValue(counterId);
        this.updateCounter(counterId, current + amount);
    }

    getCounterValue(counterId) {
        const parts = counterId.split('-');
        
        if (parts[0] === 'authority' && parts[1]) {
            return this.counters.authorities[parts[1]] || 0;
        } else if (parts[0] === 'urgency' && parts[1]) {
            return this.counters.urgency[parts[1]] || 0;
        } else if (this.counters.hasOwnProperty(counterId)) {
            return this.counters[counterId] || 0;
        }
        
        return 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveCounters;
} else {
    window.LiveCounters = LiveCounters;
}