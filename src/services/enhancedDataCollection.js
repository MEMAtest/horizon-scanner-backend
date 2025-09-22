// src/services/enhancedDataCollection.js
// Phase 2: Enhanced Data Collection Orchestrator
// Main coordinator for comprehensive regulatory data collection

const webScraperService = require('./webScraperService');
const contentProcessor = require('./contentProcessor');
const dataQualityService = require('./dataQualityService');
const fcaAdvancedScraper = require('../scrapers/fcaAdvancedScraper');
const internationalScraper = require('../scrapers/internationalScraper');
const scrapingUtils = require('../utils/scrapingUtils');
const dbService = require('./dbService');
const aiAnalyzer = require('./aiAnalyzer');

class EnhancedDataCollection {
    constructor() {
        this.isRunning = false;
        this.currentOperation = null;
        
        this.stats = {
            totalRuns: 0,
            lastRun: null,
            lastSuccess: null,
            consecutiveFailures: 0,
            
            // Collection statistics
            itemsCollected: 0,
            itemsProcessed: 0,
            itemsStored: 0,
            duplicatesRemoved: 0,
            errorsEncountered: 0,
            
            // Performance metrics
            averageRunTime: 0,
            lastRunTime: 0,
            throughputPerHour: 0,
            
            // Source statistics
            ukSources: { attempted: 0, successful: 0 },
            internationalSources: { attempted: 0, successful: 0 },
            
            // Quality metrics
            qualityScore: 0,
            validationSuccessRate: 0,
            contentEnrichmentRate: 0
        };
        
        // Configuration
        this.config = {
            maxConcurrentSources: 3,
            enableInternationalSources: true,
            enableFullContentExtraction: true,
            enableAIAnalysis: true,
            qualityThreshold: 60,
            retryFailedSources: true,
            maxConsecutiveFailures: 3
        };
        
        // Error recovery
        this.errorRecovery = {
            failedSources: new Map(),
            retryDelays: [5000, 15000, 30000, 60000], // Progressive delays
            maxRetryAttempts: 3
        };
        
        console.log('🚀 Enhanced Data Collection system initialized');
    }

    // MAIN ORCHESTRATION METHOD
    async runEnhancedCollection() {
        if (this.isRunning) {
            throw new Error('Enhanced data collection is already running');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('🚀 STARTING PHASE 2: ENHANCED DATA COLLECTION');
        console.log('='.repeat(80));
        
        const startTime = Date.now();
        this.isRunning = true;
        this.currentOperation = 'initialization';
        
        try {
            // Initialize systems
            await this.initializeSystems();
            
            // Run collection phases
            const results = await this.executeCollectionPhases();
            
            // Post-processing and analysis
            await this.performPostProcessing(results);
            
            // Update statistics and finalize
            await this.finalizeCollection(results, startTime);
            
            console.log('🎉 Enhanced data collection completed successfully');
            return results;
            
        } catch (error) {
            await this.handleCollectionError(error, startTime);
            throw error;
        } finally {
            this.isRunning = false;
            this.currentOperation = null;
        }
    }

    // INITIALIZE ALL SYSTEMS
    async initializeSystems() {
        console.log('🔧 Initializing enhanced data collection systems...');
        this.currentOperation = 'initialization';
        
        try {
            // Database initialization
            console.log('📊 Initializing database...');
            await dbService.initialize();
            
            // Reset component statistics
            console.log('📈 Resetting component statistics...');
            webScraperService.resetStats();
            contentProcessor.resetStats();
            dataQualityService.resetMetrics();
            scrapingUtils.reset();
            
            // Health checks
            console.log('🏥 Performing system health checks...');
            await this.performHealthChecks();
            
            console.log('✅ System initialization complete');
            
        } catch (error) {
            console.error('❌ System initialization failed:', error.message);
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    // EXECUTE COLLECTION PHASES
    async executeCollectionPhases() {
        console.log('\n📊 Executing data collection phases...');
        
        const allResults = [];
        const phaseResults = {
            ukSources: [],
            internationalSources: [],
            rssFeeds: [],
            deepScraping: []
        };
        
        try {
            // Phase 1: UK Regulatory Sources (High Priority)
            console.log('\n🇬🇧 Phase 1: UK Regulatory Sources');
            this.currentOperation = 'uk_sources';
            
            const ukResults = await this.collectUKSources();
            phaseResults.ukSources = ukResults;
            allResults.push(...ukResults);
            
            console.log(`✅ UK sources: ${ukResults.length} items collected`);
            
            // Phase 2: International Sources (if enabled)
            if (this.config.enableInternationalSources) {
                console.log('\n🌍 Phase 2: International Regulatory Sources');
                this.currentOperation = 'international_sources';
                
                const internationalResults = await this.collectInternationalSources();
                phaseResults.internationalSources = internationalResults;
                allResults.push(...internationalResults);
                
                console.log(`✅ International sources: ${internationalResults.length} items collected`);
            }
            
            // Phase 3: Data Quality Processing
            console.log('\n🔍 Phase 3: Data Quality Processing');
            this.currentOperation = 'quality_processing';
            
            const qualityResults = await this.processDataQuality(allResults);
            
            // Phase 4: Content Enhancement
            console.log('\n⚡ Phase 4: Content Enhancement');
            this.currentOperation = 'content_enhancement';
            
            const enhancedResults = await this.enhanceContent(qualityResults);
            
            // Phase 5: AI Analysis (if available and enabled)
            if (this.config.enableAIAnalysis && aiAnalyzer) {
                console.log('\n🤖 Phase 5: AI Analysis');
                this.currentOperation = 'ai_analysis';
                
                const aiResults = await this.performAIAnalysis(enhancedResults);
                return aiResults;
            }
            
            return enhancedResults;
            
        } catch (error) {
            console.error(`❌ Collection phase failed during ${this.currentOperation}:`, error.message);
            
            // Attempt error recovery
            if (this.config.retryFailedSources) {
                console.log('🔄 Attempting error recovery...');
                return await this.attemptErrorRecovery(allResults);
            }
            
            throw error;
        }
    }

    // COLLECT UK SOURCES
    async collectUKSources() {
        console.log('🏛️ Collecting UK regulatory sources...');
        
        const ukResults = [];
        
        try {
            // FCA Advanced Scraping
            console.log('📋 FCA Advanced Collection...');
            const fcaResults = await fcaAdvancedScraper.scrapeAll();
            ukResults.push(...fcaResults);
            
            this.stats.ukSources.attempted++;
            this.stats.ukSources.successful++;
            
            console.log(`✅ FCA: ${fcaResults.length} items collected`);
            
            // Rate limiting between major sources
            await scrapingUtils.wait(3000);
            
            // Additional UK sources can be added here
            // const boeResults = await boeAdvancedScraper.scrapeAll();
            // const praResults = await praAdvancedScraper.scrapeAll();
            
        } catch (error) {
            console.error('❌ UK sources collection failed:', error.message);
            this.stats.ukSources.attempted++;
            this.recordSourceFailure('UK', error);
        }
        
        return ukResults;
    }

    // COLLECT INTERNATIONAL SOURCES
    async collectInternationalSources() {
        console.log('🌍 Collecting international regulatory sources...');
        
        try {
            const internationalResults = await internationalScraper.scrapeAllInternational();
            
            this.stats.internationalSources.attempted++;
            this.stats.internationalSources.successful++;
            
            return internationalResults;
            
        } catch (error) {
            console.error('❌ International sources collection failed:', error.message);
            this.stats.internationalSources.attempted++;
            this.recordSourceFailure('International', error);
            return [];
        }
    }

    // PROCESS DATA QUALITY
    async processDataQuality(items) {
        console.log(`🔍 Processing data quality for ${items.length} items...`);
        
        try {
            const qualityResults = await dataQualityService.processDataQuality(items);
            
            // Update statistics
            const qualityMetrics = dataQualityService.getQualityMetrics();
            this.stats.duplicatesRemoved = qualityMetrics.duplicatesRemoved;
            this.stats.qualityScore = qualityMetrics.qualityScore;
            this.stats.validationSuccessRate = (qualityMetrics.validItems / qualityMetrics.totalItems) * 100;
            
            console.log(`✅ Quality processing: ${qualityResults.length} items passed quality checks`);
            return qualityResults;
            
        } catch (error) {
            console.error('❌ Data quality processing failed:', error.message);
            this.stats.errorsEncountered++;
            
            // Return original items if quality processing fails
            console.log('⚠️ Using original items without quality processing');
            return items;
        }
    }

    // ENHANCE CONTENT
    async enhanceContent(items) {
        console.log(`⚡ Enhancing content for ${items.length} items...`);
        
        try {
            const enhancedResults = await contentProcessor.processBatch(items, 15);
            
            // Update statistics
            const processingStats = contentProcessor.getProcessingStats();
            this.stats.contentEnrichmentRate = (processingStats.metadataEnriched / processingStats.totalProcessed) * 100;
            
            console.log(`✅ Content enhancement: ${enhancedResults.length} items enhanced`);
            return enhancedResults;
            
        } catch (error) {
            console.error('❌ Content enhancement failed:', error.message);
            this.stats.errorsEncountered++;
            
            // Return original items if enhancement fails
            console.log('⚠️ Using original items without content enhancement');
            return items;
        }
    }

    // PERFORM AI ANALYSIS
    async performAIAnalysis(items) {
        console.log(`🤖 Performing AI analysis for ${items.length} items...`);
        
        const aiResults = [];
        let aiSuccessCount = 0;
        
        for (const item of items) {
            try {
                // AI analysis for each item
                const aiAnalysis = await aiAnalyzer.analyzeUpdate(item);
                const aiData = aiAnalysis?.data || aiAnalysis;

                const aiEnhancedItem = {
                    ...item,
                    impact: aiData.impact,
                    impactLevel: aiData.impactLevel,
                    impact_level: aiData.impactLevel,
                    urgency: aiData.urgency,
                    sector: aiData.sector,
                    primarySectors: aiData.primarySectors,
                    primary_sectors: aiData.primary_sectors,
                    key_dates: aiData.key_dates,
                    keyDates: aiData.key_dates,
                    area: aiData.area,
                    ai_summary: aiData.ai_summary,
                    ai_tags: aiData.ai_tags,
                    ai_confidence_score: aiData.ai_confidence_score,
                    businessImpactScore: aiData.businessImpactScore,
                    business_impact_score: aiData.businessImpactScore,
                    sectorRelevanceScores: aiData.sectorRelevanceScores,
                    sector_relevance_scores: aiData.sector_relevance_scores,
                    implementationPhases: aiData.implementationPhases,
                    implementation_phases: aiData.implementation_phases,
                    requiredResources: aiData.requiredResources,
                    required_resources: aiData.required_resources,
                    complianceDeadline: aiData.complianceDeadline,
                    compliance_deadline: aiData.compliance_deadline,
                    firmTypesAffected: aiData.firmTypesAffected,
                    firm_types_affected: aiData.firm_types_affected,
                    aiModelUsed: aiData.aiModelUsed,
                    enhancedAt: aiData.enhancedAt,

                    // Store AI analysis in enrichment data
                    enrichment: {
                        ...item.enrichment,
                        aiAnalysis: {
                            confidence: aiAnalysis.confidence || aiData.ai_confidence_score || 'medium',
                            analysisDate: new Date().toISOString(),
                            version: '2.0',
                            fallback: aiAnalysis.fallback || aiData.fallbackAnalysis || false
                        }
                    }
                };

                aiResults.push(aiEnhancedItem);
                aiSuccessCount++;

            } catch (error) {
                console.error(`⚠️ AI analysis failed for item: ${error.message}`);
                // Include item without AI analysis
                aiResults.push(item);
            }
        }
        
        console.log(`✅ AI analysis: ${aiSuccessCount}/${items.length} items analyzed`);
        return aiResults;
    }

    // POST-PROCESSING AND STORAGE
    async performPostProcessing(results) {
        console.log('\n📝 Performing post-processing...');
        this.currentOperation = 'post_processing';
        
        try {
            // Store results in database
            console.log(`💾 Storing ${results.length} items in database...`);
            let storedCount = 0;
            
            for (const item of results) {
                try {
                    // Enhance item with AI analysis if available
                    if (aiAnalyzer && aiAnalyzer.analyzeUpdate) {
                        try {
                            const analysisResult = await aiAnalyzer.analyzeUpdate(item);
                            if (analysisResult && analysisResult.success && analysisResult.data) {
                                const analysis = analysisResult.data;

                                // Map AI analysis data to item fields - complete payload
                                item.impact = analysis.impact;
                                item.impactLevel = analysis.impactLevel;
                                item.impact_level = analysis.impactLevel; // Both formats
                                item.businessImpactScore = analysis.businessImpactScore;
                                item.business_impact_score = analysis.businessImpactScore; // Both formats
                                item.urgency = analysis.urgency;
                                item.sector = analysis.sector;
                                item.primarySectors = analysis.primarySectors;
                                item.ai_summary = analysis.ai_summary;
                                item.content_type = analysis.content_type || analysis.contentType;
                                item.area = analysis.area;
                                item.ai_tags = analysis.ai_tags;
                                item.aiTags = analysis.aiTags || analysis.ai_tags; // Both formats
                                item.ai_confidence_score = analysis.confidence;
                                item.complianceActions = analysis.complianceActions;
                                item.riskLevel = analysis.riskLevel;
                                item.affectedFirmSizes = analysis.affectedFirmSizes;
                                item.category = analysis.category;
                                item.key_dates = analysis.key_dates;
                                item.keyDates = analysis.key_dates; // Both formats
                                item.sectorRelevanceScores = analysis.sectorRelevanceScores;

                                // Additional AI analysis fields from full payload
                                item.businessOpportunities = analysis.businessOpportunities;
                                item.implementationComplexity = analysis.implementationComplexity;
                                item.enhancedAt = analysis.enhancedAt;
                                item.aiModelUsed = analysis.aiModelUsed;
                                item.fallbackAnalysis = analysis.fallbackAnalysis;

                                // Map compliance-related fields
                                item.compliance_deadline = analysis.compliance_deadline;
                                item.complianceDeadline = analysis.compliance_deadline; // Both formats
                                item.firm_types_affected = analysis.firm_types_affected || [];
                                item.firmTypesAffected = analysis.firm_types_affected || []; // Both formats
                                item.implementation_phases = analysis.implementation_phases || [];
                                item.implementationPhases = analysis.implementation_phases || []; // Both formats
                                item.required_resources = analysis.required_resources || {};
                                item.requiredResources = analysis.required_resources || {}; // Both formats

                                console.log(`✅ AI analysis applied to item: ${item.url}`);
                            }
                        } catch (aiError) {
                            console.warn(`⚠️ AI analysis failed for item:`, aiError.message);
                        }
                    }

                    await dbService.saveUpdate(item);
                    storedCount++;
                } catch (error) {
                    console.error(`⚠️ Failed to store item: ${error.message}`);
                    this.stats.errorsEncountered++;
                }
            }
            
            this.stats.itemsStored = storedCount;
            console.log(`✅ Database storage: ${storedCount}/${results.length} items stored`);
            
            // Generate summary statistics
            await this.generateSummaryStatistics(results);
            
        } catch (error) {
            console.error('❌ Post-processing failed:', error.message);
            throw error;
        }
    }

    // FINALIZE COLLECTION
    async finalizeCollection(results, startTime) {
        const endTime = Date.now();
        const runTime = endTime - startTime;
        
        // Update run statistics
        this.stats.totalRuns++;
        this.stats.lastRun = new Date().toISOString();
        this.stats.lastSuccess = new Date().toISOString();
        this.stats.consecutiveFailures = 0;
        this.stats.lastRunTime = runTime;
        this.stats.itemsCollected = results.length;
        this.stats.itemsProcessed = results.length;
        
        // Calculate averages
        if (this.stats.totalRuns > 1) {
            this.stats.averageRunTime = (this.stats.averageRunTime * (this.stats.totalRuns - 1) + runTime) / this.stats.totalRuns;
        } else {
            this.stats.averageRunTime = runTime;
        }
        
        this.stats.throughputPerHour = Math.round((results.length / (runTime / 1000)) * 3600);
        
        // Log final statistics
        this.logFinalStatistics(runTime);
    }

    // ERROR HANDLING AND RECOVERY
    async handleCollectionError(error, startTime) {
        const endTime = Date.now();
        const runTime = endTime - startTime;
        
        console.error('❌ Enhanced data collection failed:', error.message);
        
        // Update error statistics
        this.stats.totalRuns++;
        this.stats.lastRun = new Date().toISOString();
        this.stats.consecutiveFailures++;
        this.stats.lastRunTime = runTime;
        this.stats.errorsEncountered++;
        
        // Log error details
        console.log('\n' + '='.repeat(60));
        console.log('❌ ENHANCED DATA COLLECTION ERROR REPORT');
        console.log('='.repeat(60));
        console.log(`Error: ${error.message}`);
        console.log(`Operation: ${this.currentOperation}`);
        console.log(`Runtime: ${Math.round(runTime / 1000)}s`);
        console.log(`Consecutive Failures: ${this.stats.consecutiveFailures}`);
        console.log('='.repeat(60));
    }

    recordSourceFailure(sourceName, error) {
        if (!this.errorRecovery.failedSources.has(sourceName)) {
            this.errorRecovery.failedSources.set(sourceName, []);
        }
        
        this.errorRecovery.failedSources.get(sourceName).push({
            timestamp: new Date().toISOString(),
            error: error.message,
            operation: this.currentOperation
        });
    }

    async attemptErrorRecovery(partialResults) {
        console.log('🔄 Attempting error recovery for failed sources...');
        
        // This is a simplified error recovery - could be enhanced
        // For now, return partial results
        console.log(`⚠️ Returning ${partialResults.length} partially collected items`);
        return partialResults;
    }

    // HEALTH CHECKS
    async performHealthChecks() {
        const healthChecks = {
            database: false,
            webScraper: false,
            contentProcessor: false,
            dataQuality: false,
            aiAnalyzer: false
        };
        
        try {
            // Database health
            await dbService.initialize();
            healthChecks.database = true;
        } catch (error) {
            console.warn('⚠️ Database health check failed:', error.message);
        }
        
        try {
            // Web scraper health
            const webScraperHealth = await webScraperService.healthCheck();
            healthChecks.webScraper = webScraperHealth.status === 'healthy';
        } catch (error) {
            console.warn('⚠️ Web scraper health check failed:', error.message);
        }
        
        try {
            // AI analyzer health (if available)
            if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
                healthChecks.aiAnalyzer = true;
            }
        } catch (error) {
            console.warn('⚠️ AI analyzer health check failed:', error.message);
        }
        
        // Set other components as healthy by default
        healthChecks.contentProcessor = true;
        healthChecks.dataQuality = true;
        
        const healthyComponents = Object.values(healthChecks).filter(h => h).length;
        const totalComponents = Object.keys(healthChecks).length;
        
        console.log(`🏥 Health check: ${healthyComponents}/${totalComponents} components healthy`);
        
        if (healthyComponents < totalComponents) {
            console.warn('⚠️ Some components failed health checks - system may operate with reduced functionality');
        }
        
        return healthChecks;
    }

    // STATISTICS AND REPORTING
    async generateSummaryStatistics(results) {
        console.log('📊 Generating summary statistics...');
        
        const summary = {
            totalItems: results.length,
            byAuthority: {},
            bySourceCategory: {},
            byCountry: {},
            contentTypes: {},
            timeRange: {
                oldest: null,
                newest: null
            },
            qualityMetrics: {
                withDeadlines: 0,
                withAIAnalysis: 0,
                withEnrichment: 0,
                international: 0
            }
        };
        
        // Analyze results
        for (const item of results) {
            // By authority
            summary.byAuthority[item.authority] = (summary.byAuthority[item.authority] || 0) + 1;
            
            // By source category
            summary.bySourceCategory[item.source_category] = (summary.bySourceCategory[item.source_category] || 0) + 1;
            
            // By country
            const country = item.raw_data?.country || 'UK';
            summary.byCountry[country] = (summary.byCountry[country] || 0) + 1;
            
            // Quality metrics
            if (item.raw_data?.deadline) summary.qualityMetrics.withDeadlines++;
            if (item.impact || item.urgency) summary.qualityMetrics.withAIAnalysis++;
            if (item.enrichment) summary.qualityMetrics.withEnrichment++;
            if (item.raw_data?.international?.isInternational) summary.qualityMetrics.international++;
            
            // Time range
            if (item.fetched_date) {
                const date = new Date(item.fetched_date);
                if (!summary.timeRange.oldest || date < new Date(summary.timeRange.oldest)) {
                    summary.timeRange.oldest = item.fetched_date;
                }
                if (!summary.timeRange.newest || date > new Date(summary.timeRange.newest)) {
                    summary.timeRange.newest = item.fetched_date;
                }
            }
        }
        
        // Log summary
        console.log('\n📈 COLLECTION SUMMARY:');
        console.log(`   Total Items: ${summary.totalItems}`);
        console.log(`   UK Sources: ${summary.byCountry['UK'] || 0}`);
        console.log(`   International: ${summary.qualityMetrics.international}`);
        console.log(`   With AI Analysis: ${summary.qualityMetrics.withAIAnalysis}`);
        console.log(`   With Deadlines: ${summary.qualityMetrics.withDeadlines}`);
        console.log(`   Enhanced Content: ${summary.qualityMetrics.withEnrichment}`);
        
        return summary;
    }

    logFinalStatistics(runTime) {
        const minutes = Math.floor(runTime / 60000);
        const seconds = Math.floor((runTime % 60000) / 1000);
        
        console.log('\n' + '='.repeat(80));
        console.log('🎉 ENHANCED DATA COLLECTION COMPLETE');
        console.log('='.repeat(80));
        console.log(`📊 Items Collected: ${this.stats.itemsCollected}`);
        console.log(`📝 Items Processed: ${this.stats.itemsProcessed}`);
        console.log(`💾 Items Stored: ${this.stats.itemsStored}`);
        console.log(`🔄 Duplicates Removed: ${this.stats.duplicatesRemoved}`);
        console.log(`🔍 Quality Score: ${this.stats.qualityScore}/100`);
        console.log(`⚡ Content Enhancement Rate: ${this.stats.contentEnrichmentRate.toFixed(1)}%`);
        console.log(`⏱️ Runtime: ${minutes}m ${seconds}s`);
        console.log(`📈 Throughput: ${this.stats.throughputPerHour} items/hour`);
        console.log(`🇬🇧 UK Sources: ${this.stats.ukSources.successful}/${this.stats.ukSources.attempted}`);
        console.log(`🌍 International: ${this.stats.internationalSources.successful}/${this.stats.internationalSources.attempted}`);
        console.log(`✅ Success Rate: ${((this.stats.itemsStored / Math.max(this.stats.itemsCollected, 1)) * 100).toFixed(1)}%`);
        console.log('='.repeat(80));
    }

    // PUBLIC INTERFACE METHODS

    getStats() {
        return { ...this.stats };
    }

    getConfig() {
        return { ...this.config };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Configuration updated');
    }

    isCollectionRunning() {
        return this.isRunning;
    }

    getCurrentOperation() {
        return this.currentOperation;
    }

    async getHealthStatus() {
        return {
            isRunning: this.isRunning,
            currentOperation: this.currentOperation,
            stats: this.stats,
            config: this.config,
            consecutiveFailures: this.stats.consecutiveFailures,
            lastRun: this.stats.lastRun,
            systemHealth: await this.performHealthChecks()
        };
    }

    // MANUAL OPERATIONS

    async collectUKOnly() {
        console.log('🇬🇧 Manual UK-only collection...');
        const originalConfig = this.config.enableInternationalSources;
        this.config.enableInternationalSources = false;
        
        try {
            const results = await this.runEnhancedCollection();
            return results;
        } finally {
            this.config.enableInternationalSources = originalConfig;
        }
    }

    async collectInternationalOnly() {
        console.log('🌍 Manual international-only collection...');
        if (!this.config.enableInternationalSources) {
            throw new Error('International sources are disabled');
        }
        
        return await this.collectInternationalSources();
    }

    async quickHealthCheck() {
        console.log('🏥 Quick health check...');
        return await this.performHealthChecks();
    }
}

// Export singleton instance
module.exports = new EnhancedDataCollection();
