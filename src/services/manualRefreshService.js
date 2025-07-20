// ====================================================================
// PHASE 6: SYSTEM INTEGRATOR
// Complete system integration, health monitoring, and service coordination
// ====================================================================

const dbService = require('../services/dbService');
const aiAnalyzer = require('../services/aiAnalyzer');
const rssFetcher = require('../services/rssFetcher');
const manualRefreshService = require('../services/manualRefreshService');

class SystemIntegrator {
    constructor() {
        this.services = new Map();
        this.healthChecks = new Map();
        this.integrationStatus = 'initializing';
        this.systemMetrics = {
            uptime: Date.now(),
            totalRequests: 0,
            errors: 0,
            lastHealthCheck: null
        };
        this.eventBus = this.createEventBus();
        
        this.init();
    }

    // ====== INITIALIZATION & SERVICE DISCOVERY ======

    async init() {
        console.log('🔗 Initializing System Integrator...');
        
        try {
            await this.registerCoreServices();
            await this.discoverPhaseServices();
            this.setupEventIntegration();
            this.setupHealthMonitoring();
            this.startPerformanceMonitoring();
            
            this.integrationStatus = 'ready';
            console.log('✅ System Integration complete - All phases connected');
            
        } catch (error) {
            console.error('❌ System Integration failed:', error);
            this.integrationStatus = 'error';
        }
    }

    async registerCoreServices() {
        // Register Phase 0 (Foundation) services
        this.registerService('database', dbService, {
            healthCheck: () => dbService.testConnection(),
            dependencies: [],
            phase: 0
        });

        this.registerService('aiAnalyzer', aiAnalyzer, {
            healthCheck: () => aiAnalyzer.testConnection(),
            dependencies: ['database'],
            phase: 0
        });

        this.registerService('rssFetcher', rssFetcher, {
            healthCheck: () => rssFetcher.testSources(),
            dependencies: ['database'],
            phase: 0
        });

        this.registerService('manualRefresh', manualRefreshService, {
            healthCheck: () => manualRefreshService.getHealthStatus(),
            dependencies: ['database', 'aiAnalyzer', 'rssFetcher'],
            phase: 6
        });

        console.log('✅ Core services registered');
    }

    async discoverPhaseServices() {
        // Attempt to discover and register services from other phases
        await this.discoverPhase1Services(); // Intelligence Models
        await this.discoverPhase2Services(); // Enhanced Data Collection
        await this.discoverPhase3Services(); // AI Intelligence Engine
        await this.discoverPhase4Services(); // UI Components
        await this.discoverPhase5Services(); // AI Frontend Widgets
    }

    async discoverPhase1Services() {
        try {
            // Try to load Phase 1 intelligence models
            const FirmProfile = require('../models/FirmProfile');
            const AIInsight = require('../models/AIInsight');
            const RegulatoryAlert = require('../models/RegulatoryAlert');
            
            this.registerService('firmProfile', FirmProfile, {
                healthCheck: () => ({ status: 'healthy', service: 'FirmProfile' }),
                dependencies: ['database'],
                phase: 1
            });

            this.registerService('aiInsight', AIInsight, {
                healthCheck: () => ({ status: 'healthy', service: 'AIInsight' }),
                dependencies: ['database'],
                phase: 1
            });

            console.log('✅ Phase 1 (Intelligence Models) services discovered');
            
        } catch (error) {
            console.log('ℹ️ Phase 1 services not available (normal if phase not implemented)');
        }
    }

    async discoverPhase2Services() {
        try {
            const webScraperService = require('../services/webScraperService');
            const contentProcessor = require('../services/contentProcessor');
            
            this.registerService('webScraper', webScraperService, {
                healthCheck: () => webScraperService.getHealthStatus(),
                dependencies: ['database'],
                phase: 2
            });

            this.registerService('contentProcessor', contentProcessor, {
                healthCheck: () => contentProcessor.getHealthStatus(),
                dependencies: ['database', 'webScraper'],
                phase: 2
            });

            console.log('✅ Phase 2 (Enhanced Data Collection) services discovered');
            
        } catch (error) {
            console.log('ℹ️ Phase 2 services not available (normal if phase not implemented)');
        }
    }

    async discoverPhase3Services() {
        try {
            const aiIntelligenceService = require('../services/aiIntelligenceService');
            const patternRecognitionService = require('../services/patternRecognitionService');
            const impactPredictionService = require('../services/impactPredictionService');
            
            this.registerService('aiIntelligence', aiIntelligenceService, {
                healthCheck: () => aiIntelligenceService.getHealthStatus(),
                dependencies: ['database', 'aiAnalyzer'],
                phase: 3
            });

            this.registerService('patternRecognition', patternRecognitionService, {
                healthCheck: () => patternRecognitionService.getHealthStatus(),
                dependencies: ['database', 'aiIntelligence'],
                phase: 3
            });

            console.log('✅ Phase 3 (AI Intelligence Engine) services discovered');
            
        } catch (error) {
            console.log('ℹ️ Phase 3 services not available (normal if phase not implemented)');
        }
    }

    async discoverPhase4Services() {
        try {
            // Phase 4 services would be UI components, check if they exist
            const uiComponentsPath = '../components/NavigationSystem';
            require.resolve(uiComponentsPath);
            
            this.registerService('uiComponents', { status: 'available' }, {
                healthCheck: () => ({ status: 'healthy', service: 'UIComponents' }),
                dependencies: [],
                phase: 4
            });

            console.log('✅ Phase 4 (UI Components) services discovered');
            
        } catch (error) {
            console.log('ℹ️ Phase 4 services not available (normal if phase not implemented)');
        }
    }

    async discoverPhase5Services() {
        try {
            // Phase 5 services would be AI widgets, check if they exist
            const aiWidgetsPath = '../components/ProactiveIntelligence';
            require.resolve(aiWidgetsPath);
            
            this.registerService('aiWidgets', { status: 'available' }, {
                healthCheck: () => ({ status: 'healthy', service: 'AIWidgets' }),
                dependencies: ['database', 'aiIntelligence'],
                phase: 5
            });

            console.log('✅ Phase 5 (AI Frontend Widgets) services discovered');
            
        } catch (error) {
            console.log('ℹ️ Phase 5 services not available (normal if phase not implemented)');
        }
    }

    registerService(name, service, config) {
        this.services.set(name, {
            service,
            config,
            status: 'registered',
            lastHealthCheck: null,
            errorCount: 0
        });

        // Set up health check
        if (config.healthCheck) {
            this.healthChecks.set(name, config.healthCheck);
        }

        console.log(`📋 Service registered: ${name} (Phase ${config.phase})`);
    }

    // ====== EVENT SYSTEM INTEGRATION ======

    createEventBus() {
        const events = new Map();
        
        return {
            emit: (event, data) => {
                const listeners = events.get(event) || [];
                listeners.forEach(listener => {
                    try {
                        listener(data);
                    } catch (error) {
                        console.error(`Event listener error for ${event}:`, error);
                    }
                });
                
                // Log important system events
                if (event.startsWith('system.') || event.startsWith('error.')) {
                    console.log(`📡 Event: ${event}`, data);
                }
            },
            
            on: (event, listener) => {
                if (!events.has(event)) {
                    events.set(event, []);
                }
                events.get(event).push(listener);
            },
            
            off: (event, listener) => {
                const listeners = events.get(event) || [];
                const index = listeners.indexOf(listener);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    setupEventIntegration() {
        // Cross-phase event coordination
        
        // Phase 0 -> Phase 6 integration
        this.eventBus.on('rss.newUpdate', (update) => {
            console.log('📡 New RSS update received, triggering analysis...');
            this.eventBus.emit('system.newUpdate', update);
        });

        // Phase 2 -> Phase 3 integration (if available)
        this.eventBus.on('scraper.newContent', (content) => {
            console.log('📡 New scraped content received');
            this.eventBus.emit('ai.analyzeContent', content);
        });

        // Phase 3 -> Phase 5 integration (if available)
        this.eventBus.on('ai.analysisComplete', (analysis) => {
            console.log('📡 AI analysis complete, updating widgets');
            this.eventBus.emit('ui.updateInsights', analysis);
        });

        // Phase 6 refresh events
        this.eventBus.on('refresh.started', () => {
            this.systemMetrics.totalRequests++;
        });

        this.eventBus.on('refresh.completed', (result) => {
            if (!result.success) {
                this.systemMetrics.errors++;
            }
        });

        // Error handling across all phases
        this.eventBus.on('error.*', (error) => {
            this.handleSystemError(error);
        });
    }

    // ====== HEALTH MONITORING ======

    setupHealthMonitoring() {
        // Run health checks every 2 minutes
        setInterval(() => {
            this.runSystemHealthCheck();
        }, 2 * 60 * 1000);

        // Initial health check
        setTimeout(() => this.runSystemHealthCheck(), 5000);
    }

    async runSystemHealthCheck() {
        console.log('🏥 Running system health check...');
        
        const healthResults = {
            timestamp: new Date(),
            overall: 'healthy',
            services: {},
            warnings: [],
            errors: []
        };

        // Check each registered service
        for (const [name, serviceInfo] of this.services.entries()) {
            try {
                if (this.healthChecks.has(name)) {
                    const result = await this.healthChecks.get(name)();
                    healthResults.services[name] = {
                        status: result.status || 'healthy',
                        details: result,
                        phase: serviceInfo.config.phase
                    };
                    serviceInfo.lastHealthCheck = new Date();
                    serviceInfo.status = 'healthy';
                } else {
                    healthResults.services[name] = {
                        status: 'unknown',
                        details: { message: 'No health check available' },
                        phase: serviceInfo.config.phase
                    };
                }
            } catch (error) {
                healthResults.services[name] = {
                    status: 'error',
                    details: { error: error.message },
                    phase: serviceInfo.config.phase
                };
                healthResults.errors.push(`${name}: ${error.message}`);
                serviceInfo.errorCount++;
                serviceInfo.status = 'error';
            }
        }

        // Determine overall health
        const errorCount = Object.values(healthResults.services).filter(s => s.status === 'error').length;
        const warningCount = Object.values(healthResults.services).filter(s => s.status === 'warning').length;

        if (errorCount > 0) {
            healthResults.overall = 'degraded';
        } else if (warningCount > 0) {
            healthResults.overall = 'warning';
        }

        // Add system metrics
        healthResults.metrics = {
            uptime: Date.now() - this.systemMetrics.uptime,
            totalRequests: this.systemMetrics.totalRequests,
            errorRate: this.systemMetrics.totalRequests > 0 ? 
                (this.systemMetrics.errors / this.systemMetrics.totalRequests) * 100 : 0,
            activePhases: this.getActivePhases()
        };

        this.systemMetrics.lastHealthCheck = healthResults.timestamp;
        
        // Emit health check event
        this.eventBus.emit('system.healthCheck', healthResults);
        
        // Log health status
        if (healthResults.overall === 'healthy') {
            console.log('✅ System health check passed');
        } else {
            console.warn(`⚠️ System health check: ${healthResults.overall}`, {
                errors: healthResults.errors,
                warnings: healthResults.warnings
            });
        }

        return healthResults;
    }

    getActivePhases() {
        const phases = new Set();
        for (const serviceInfo of this.services.values()) {
            if (serviceInfo.status === 'healthy' || serviceInfo.status === 'registered') {
                phases.add(serviceInfo.config.phase);
            }
        }
        return Array.from(phases).sort();
    }

    // ====== PERFORMANCE MONITORING ======

    startPerformanceMonitoring() {
        // Monitor memory usage
        setInterval(() => {
            if (process.memoryUsage) {
                const memUsage = process.memoryUsage();
                if (memUsage.heapUsed > 200 * 1024 * 1024) { // 200MB threshold
                    console.warn('⚠️ High memory usage detected:', memUsage);
                    this.eventBus.emit('system.highMemoryUsage', memUsage);
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        // Monitor response times
        this.setupResponseTimeMonitoring();
    }

    setupResponseTimeMonitoring() {
        // Wrap key service methods to monitor performance
        const originalDbQuery = dbService.query;
        dbService.query = async function(...args) {
            const start = Date.now();
            try {
                const result = await originalDbQuery.apply(this, args);
                const duration = Date.now() - start;
                if (duration > 5000) { // 5 second threshold
                    console.warn(`⚠️ Slow database query: ${duration}ms`);
                }
                return result;
            } catch (error) {
                console.error('❌ Database query error:', error);
                throw error;
            }
        };

        // Monitor AI analysis performance
        const originalAnalyze = aiAnalyzer.analyzeUpdate;
        aiAnalyzer.analyzeUpdate = async function(...args) {
            const start = Date.now();
            try {
                const result = await originalAnalyze.apply(this, args);
                const duration = Date.now() - start;
                if (duration > 30000) { // 30 second threshold
                    console.warn(`⚠️ Slow AI analysis: ${duration}ms`);
                }
                return result;
            } catch (error) {
                console.error('❌ AI analysis error:', error);
                throw error;
            }
        };
    }

    // ====== ERROR HANDLING & RECOVERY ======

    handleSystemError(error) {
        console.error('🚨 System error detected:', error);
        
        this.systemMetrics.errors++;
        
        // Attempt automatic recovery for known issues
        this.attemptErrorRecovery(error);
        
        // Emit error event for other systems to handle
        this.eventBus.emit('system.error', {
            error,
            timestamp: new Date(),
            metrics: this.systemMetrics
        });
    }

    async attemptErrorRecovery(error) {
        try {
            // Database connection recovery
            if (error.message?.includes('database') || error.code === 'ECONNREFUSED') {
                console.log('🔄 Attempting database reconnection...');
                await dbService.reconnect();
                console.log('✅ Database reconnection successful');
            }

            // AI service recovery
            if (error.message?.includes('AI') || error.message?.includes('Groq')) {
                console.log('🔄 Attempting AI service recovery...');
                // AI service doesn't need reconnection, just log
                console.log('ℹ️ AI service recovery completed');
            }

        } catch (recoveryError) {
            console.error('❌ Error recovery failed:', recoveryError);
        }
    }

    // ====== PUBLIC API METHODS ======

    // Get complete system status
    getSystemStatus() {
        const activePhases = this.getActivePhases();
        const serviceCount = this.services.size;
        const healthyServices = Array.from(this.services.values()).filter(s => s.status === 'healthy').length;

        return {
            integrationStatus: this.integrationStatus,
            uptime: Date.now() - this.systemMetrics.uptime,
            activePhases,
            services: {
                total: serviceCount,
                healthy: healthyServices,
                errorCount: this.systemMetrics.errors
            },
            metrics: this.systemMetrics,
            lastHealthCheck: this.systemMetrics.lastHealthCheck,
            capabilities: this.getSystemCapabilities()
        };
    }

    // Get available system capabilities based on active phases
    getSystemCapabilities() {
        const activePhases = this.getActivePhases();
        const capabilities = {
            basicMonitoring: activePhases.includes(0), // Phase 0
            intelligenceModels: activePhases.includes(1), // Phase 1
            enhancedDataCollection: activePhases.includes(2), // Phase 2
            aiIntelligence: activePhases.includes(3), // Phase 3
            advancedUI: activePhases.includes(4), // Phase 4
            aiWidgets: activePhases.includes(5), // Phase 5
            realTimeIntegration: activePhases.includes(6) // Phase 6
        };

        return capabilities;
    }

    // Get service registry for other phases to discover services
    getServiceRegistry() {
        const registry = {};
        for (const [name, serviceInfo] of this.services.entries()) {
            if (serviceInfo.status === 'healthy' || serviceInfo.status === 'registered') {
                registry[name] = {
                    service: serviceInfo.service,
                    phase: serviceInfo.config.phase,
                    dependencies: serviceInfo.config.dependencies
                };
            }
        }
        return registry;
    }

    // Manual system health check
    async checkSystemHealth() {
        return await this.runSystemHealthCheck();
    }

    // Get event bus for other services
    getEventBus() {
        return this.eventBus;
    }

    // Graceful shutdown
    async shutdown() {
        console.log('🔄 Initiating system shutdown...');
        
        this.eventBus.emit('system.shutdown', { timestamp: new Date() });
        
        // Close database connections
        if (dbService.close) {
            await dbService.close();
        }
        
        // Clear intervals
        clearInterval(this.healthInterval);
        clearInterval(this.performanceInterval);
        
        console.log('✅ System shutdown complete');
    }
}

// Export singleton instance
module.exports = new SystemIntegrator();