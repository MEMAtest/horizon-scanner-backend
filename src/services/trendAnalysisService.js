// src/services/trendAnalysisService.js
// Trend Analysis Service - Identifies emerging regulatory directions and momentum
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events');
const dbService = require('./dbService');

class TrendAnalysisService extends EventEmitter {
    constructor(aiIntelligenceService) {
        super();
        this.aiService = aiIntelligenceService;
        
        // Trend analysis configuration
        this.config = {
            trendWindow: 180, // days for trend analysis
            shortTermWindow: 30, // days for short-term trends
            minimumDataPoints: 5,
            trendConfidenceThreshold: 65,
            momentumThreshold: 0.15, // 15% change for momentum detection
            updateInterval: 43200000 // 12 hours
        };
        
        // Trend tracking data structures
        this.trends = new Map();
        this.momentum = new Map();
        this.emergingDirections = new Map();
        
        // Authority trend weights
        this.authorityWeights = {
            'FCA': 1.0,
            'PRA': 1.0,
            'Bank of England': 0.9,
            'HM Treasury': 0.8,
            'FRC': 0.7,
            'PSR': 0.6
        };
        
        // Start trend monitoring
        this.initializeTrendMonitoring();
        
        console.log('📈 Trend Analysis Service initialized');
    }

    // MAIN TREND ANALYSIS ORCHESTRATOR
    async analyzeTrends(options = {}) {
        console.log('🔍 Running comprehensive trend analysis...');
        
        try {
            // Get historical data for trend analysis
            const historicalData = await this.getHistoricalDataForTrends();
            
            // Authority-specific trend analysis
            const authorityTrends = await this.analyzeAuthorityTrends(historicalData);
            
            // Sector trend analysis
            const sectorTrends = await this.analyzeSectorTrends(historicalData);
            
            // Regulatory area trend analysis
            const areaTrends = await this.analyzeRegulatoryAreaTrends(historicalData);
            
            // Impact level trends
            const impactTrends = await this.analyzeImpactLevelTrends(historicalData);
            
            // Temporal pattern analysis
            const temporalTrends = await this.analyzeTemporalTrends(historicalData);
            
            // Momentum calculation
            const momentumAnalysis = await this.calculateRegulatoryMomentum(historicalData);
            
            // Emerging direction detection
            const emergingDirections = await this.detectEmergingDirections(historicalData);
            
            // Cross-authority coordination analysis
            const coordinationTrends = await this.analyzeCoordinationTrends(historicalData);
            
            // Predictive trend modeling
            const predictiveTrends = await this.generatePredictiveTrends(historicalData);
            
            // Combine all trend analyses
            const comprehensiveTrends = this.combineTrendAnalyses({
                authority: authorityTrends,
                sector: sectorTrends,
                area: areaTrends,
                impact: impactTrends,
                temporal: temporalTrends,
                momentum: momentumAnalysis,
                emerging: emergingDirections,
                coordination: coordinationTrends,
                predictive: predictiveTrends
            });
            
            // Store trend analysis
            await this.storeTrendAnalysis(comprehensiveTrends);
            
            // Emit trend events
            this.emitTrendEvents(comprehensiveTrends);
            
            console.log('✅ Comprehensive trend analysis completed');
            return comprehensiveTrends;
            
        } catch (error) {
            console.error('❌ Trend analysis failed:', error.message);
            return this.createFallbackTrendAnalysis();
        }
    }

    // AUTHORITY TREND ANALYSIS
    async analyzeAuthorityTrends(historicalData) {
        const authorityTrends = {};
        
        for (const authority of Object.keys(this.authorityWeights)) {
            const authorityData = historicalData.filter(item => item.authority === authority);
            
            if (authorityData.length >= this.config.minimumDataPoints) {
                authorityTrends[authority] = {
                    activityTrend: this.calculateActivityTrend(authorityData),
                    focusAreas: this.identifyAuthorityFocusAreaTrends(authorityData),
                    urgencyTrend: this.calculateUrgencyTrend(authorityData),
                    impactTrend: this.calculateImpactTrend(authorityData),
                    documentTypeTrends: this.analyzeDocumentTypeTrends(authorityData),
                    seasonalPatterns: this.detectSeasonalPatterns(authorityData),
                    momentum: this.calculateAuthorityMomentum(authorityData),
                    predictedActivity: this.predictFutureActivity(authorityData)
                };
            }
        }
        
        return authorityTrends;
    }

    // SECTOR TREND ANALYSIS
    async analyzeSectorTrends(historicalData) {
        const sectorTrends = {};
        const sectors = this.extractUniqueSectors(historicalData);
        
        for (const sector of sectors) {
            const sectorData = this.getSectorSpecificData(historicalData, sector);
            
            if (sectorData.length >= this.config.minimumDataPoints) {
                sectorTrends[sector] = {
                    attentionTrend: this.calculateSectorAttentionTrend(sectorData),
                    impactEvolution: this.analyzeSectorImpactEvolution(sectorData),
                    regulatoryPressure: this.calculateRegulatoryPressure(sectorData),
                    complianceBurden: this.assessComplianceBurdenTrend(sectorData),
                    innovationDrivers: this.identifyInnovationDrivers(sectorData),
                    competitiveFactors: this.analyzeCompetitiveFactors(sectorData),
                    futureOutlook: this.generateSectorOutlook(sectorData)
                };
            }
        }
        
        return sectorTrends;
    }

    // REGULATORY AREA TREND ANALYSIS
    async analyzeRegulatoryAreaTrends(historicalData) {
        const areaTrends = {};
        const areas = this.extractUniqueAreas(historicalData);
        
        for (const area of areas) {
            const areaData = historicalData.filter(item => item.ai_area === area);
            
            if (areaData.length >= this.config.minimumDataPoints) {
                areaTrends[area] = {
                    evolutionTrend: this.calculateAreaEvolutionTrend(areaData),
                    complexityTrend: this.calculateComplexityTrend(areaData),
                    crossSectorSpread: this.analyzeCrossSectorSpread(areaData),
                    regulatoryIntensity: this.calculateRegulatoryIntensity(areaData),
                    implementationChallenges: this.identifyImplementationChallenges(areaData),
                    technologicalInfluence: this.assessTechnologicalInfluence(areaData),
                    internationalAlignment: this.analyzeInternationalAlignment(areaData)
                };
            }
        }
        
        return areaTrends;
    }

    // IMPACT LEVEL TREND ANALYSIS
    async analyzeImpactLevelTrends(historicalData) {
        const impactData = this.groupByImpactLevel(historicalData);
        
        return {
            distributionTrend: this.calculateImpactDistributionTrend(impactData),
            escalationPattern: this.detectEscalationPattern(impactData),
            severityEvolution: this.analyzeSeverityEvolution(impactData),
            urgencyCorrelation: this.analyzeUrgencyCorrelation(impactData),
            riskProfile: this.calculateRiskProfileTrend(impactData),
            businessImpactTrend: this.analyzeBusinessImpactTrend(impactData)
        };
    }

    // TEMPORAL TREND ANALYSIS
    async analyzeTemporalTrends(historicalData) {
        return {
            weeklyPatterns: this.analyzeWeeklyPatterns(historicalData),
            monthlyPatterns: this.analyzeMonthlyPatterns(historicalData),
            quarterlyTrends: this.analyzeQuarterlyTrends(historicalData),
            yearlyEvolution: this.analyzeYearlyEvolution(historicalData),
            cyclicalBehavior: this.detectCyclicalBehavior(historicalData),
            anomalyDetection: this.detectTemporalAnomalies(historicalData)
        };
    }

    // REGULATORY MOMENTUM CALCULATION
    async calculateRegulatoryMomentum(historicalData) {
        const recentData = this.getRecentData(historicalData, this.config.shortTermWindow);
        const olderData = this.getOlderData(historicalData, this.config.shortTermWindow, this.config.trendWindow);
        
        return {
            overall: this.calculateOverallMomentum(recentData, olderData),
            byAuthority: this.calculateMomentumByAuthority(recentData, olderData),
            bySector: this.calculateMomentumBySector(recentData, olderData),
            byArea: this.calculateMomentumByArea(recentData, olderData),
            byImpact: this.calculateMomentumByImpact(recentData, olderData),
            accelerationFactors: this.identifyAccelerationFactors(recentData, olderData),
            decelerationFactors: this.identifyDecelerationFactors(recentData, olderData)
        };
    }

    // EMERGING DIRECTION DETECTION
    async detectEmergingDirections(historicalData) {
        const recentData = this.getRecentData(historicalData, this.config.shortTermWindow);
        
        return {
            newRegulatoryAreas: this.identifyNewRegulatoryAreas(recentData, historicalData),
            shiftingPriorities: this.detectShiftingPriorities(recentData, historicalData),
            convergingThemes: this.identifyConvergingThemes(recentData),
            divergingApproaches: this.identifyDivergingApproaches(recentData),
            internationalInfluences: this.detectInternationalInfluences(recentData),
            technologyDrivers: this.identifyTechnologyDrivers(recentData),
            marketResponsePatterns: this.analyzeMarketResponsePatterns(recentData)
        };
    }

    // COORDINATION TREND ANALYSIS
    async analyzeCoordinationTrends(historicalData) {
        return {
            crossAuthorityAlignment: this.analyzeCrossAuthorityAlignment(historicalData),
            internationalCoordination: this.analyzeInternationalCoordination(historicalData),
            policyCoherence: this.assessPolicyCoherence(historicalData),
            timingCoordination: this.analyzeTimingCoordination(historicalData),
            jurisdictionalTrends: this.analyzeJurisdictionalTrends(historicalData)
        };
    }

    // PREDICTIVE TREND MODELING
    async generatePredictiveTrends(historicalData) {
        return {
            shortTermPredictions: this.generateShortTermPredictions(historicalData),
            mediumTermTrends: this.generateMediumTermTrends(historicalData),
            longTermDirections: this.generateLongTermDirections(historicalData),
            scenarioModeling: this.generateScenarioModeling(historicalData),
            riskFactors: this.identifyTrendRiskFactors(historicalData),
            opportunityWindows: this.identifyOpportunityWindows(historicalData)
        };
    }

    // SPECIFIC CALCULATION METHODS
    calculateActivityTrend(data) {
        const timeSeriesData = this.createTimeSeries(data);
        const trend = this.calculateLinearTrend(timeSeriesData);
        
        return {
            direction: trend.slope > 0 ? 'increasing' : 'decreasing',
            magnitude: Math.abs(trend.slope),
            confidence: trend.correlation,
            recentChange: this.calculateRecentChange(timeSeriesData),
            volatility: this.calculateVolatility(timeSeriesData)
        };
    }

    calculateUrgencyTrend(data) {
        const urgencyScores = data.map(item => this.urgencyToScore(item.ai_urgency));
        const timeSeriesData = urgencyScores.map((score, index) => ({
            time: index,
            value: score
        }));
        
        const trend = this.calculateLinearTrend(timeSeriesData);
        
        return {
            direction: trend.slope > 0 ? 'increasing' : 'decreasing',
            averageUrgency: urgencyScores.reduce((a, b) => a + b, 0) / urgencyScores.length,
            trend: trend,
            recentEscalation: this.detectRecentEscalation(urgencyScores)
        };
    }

    calculateOverallMomentum(recentData, olderData) {
        const recentActivity = recentData.length;
        const historicalAverage = olderData.length / (this.config.trendWindow / this.config.shortTermWindow);
        
        const momentum = (recentActivity - historicalAverage) / historicalAverage;
        
        return {
            value: momentum,
            classification: this.classifyMomentum(momentum),
            confidence: this.calculateMomentumConfidence(recentData, olderData),
            trend: momentum > this.config.momentumThreshold ? 'accelerating' : 
                   momentum < -this.config.momentumThreshold ? 'decelerating' : 'stable'
        };
    }

    calculateLinearTrend(timeSeriesData) {
        if (timeSeriesData.length < 2) {
            return { slope: 0, intercept: 0, correlation: 0 };
        }
        
        const n = timeSeriesData.length;
        const sumX = timeSeriesData.reduce((sum, point) => sum + point.time, 0);
        const sumY = timeSeriesData.reduce((sum, point) => sum + point.value, 0);
        const sumXY = timeSeriesData.reduce((sum, point) => sum + (point.time * point.value), 0);
        const sumXX = timeSeriesData.reduce((sum, point) => sum + (point.time * point.time), 0);
        const sumYY = timeSeriesData.reduce((sum, point) => sum + (point.value * point.value), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate correlation coefficient
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        const correlation = denominator !== 0 ? Math.abs(numerator / denominator) : 0;
        
        return { slope, intercept, correlation };
    }

    // TREND COMBINATION AND STORAGE
    combineTrendAnalyses(analyses) {
        return {
            timestamp: new Date().toISOString(),
            analysisWindow: `${this.config.trendWindow} days`,
            confidence: this.calculateOverallTrendConfidence(analyses),
            
            // Core trend components
            authorityTrends: analyses.authority,
            sectorTrends: analyses.sector,
            areaTrends: analyses.area,
            impactTrends: analyses.impact,
            temporalTrends: analyses.temporal,
            momentum: analyses.momentum,
            emergingDirections: analyses.emerging,
            coordinationTrends: analyses.coordination,
            predictiveTrends: analyses.predictive,
            
            // Synthesis
            keyInsights: this.extractKeyInsights(analyses),
            strategicImplications: this.generateStrategicImplications(analyses),
            actionableIntelligence: this.generateActionableIntelligence(analyses),
            
            // Metadata
            dataQuality: this.assessDataQuality(analyses),
            updateRecommendations: this.generateUpdateRecommendations(analyses)
        };
    }

    async storeTrendAnalysis(trends) {
        try {
            const trendData = {
                analyzed_at: new Date().toISOString(),
                analysis_window: this.config.trendWindow,
                authority_trends: trends.authorityTrends,
                sector_trends: trends.sectorTrends,
                area_trends: trends.areaTrends,
                momentum_analysis: trends.momentum,
                emerging_directions: trends.emergingDirections,
                confidence_score: trends.confidence,
                key_insights: trends.keyInsights
            };
            
            await dbService.storeTrendAnalysis(trendData);
            
            // Update in-memory cache
            this.trends.set('latest', trends);
            
        } catch (error) {
            console.error('Failed to store trend analysis:', error.message);
        }
    }

    // EVENT EMISSION
    emitTrendEvents(trends) {
        // Emit for significant momentum changes
        if (trends.momentum?.overall?.classification === 'high') {
            this.emit('highMomentumDetected', {
                momentum: trends.momentum,
                timestamp: trends.timestamp
            });
        }
        
        // Emit for emerging directions
        if (trends.emergingDirections?.newRegulatoryAreas?.length > 0) {
            this.emit('emergingDirectionsDetected', {
                directions: trends.emergingDirections,
                timestamp: trends.timestamp
            });
        }
        
        // Emit for trend reversals
        const trendReversals = this.detectTrendReversals(trends);
        if (trendReversals.length > 0) {
            this.emit('trendReversalsDetected', {
                reversals: trendReversals,
                timestamp: trends.timestamp
            });
        }
    }

    // PUBLIC API METHODS
    async getCurrentTrends(options = {}) {
        return this.trends.get('latest') || await this.analyzeTrends(options);
    }

    async getTrendsByAuthority(authority, days = 90) {
        try {
            return await dbService.query(`
                SELECT authority_trends FROM trend_analyses 
                WHERE authority_trends->>'${authority}' IS NOT NULL
                AND analyzed_at > NOW() - INTERVAL '${days} days'
                ORDER BY analyzed_at DESC
                LIMIT 10
            `);
        } catch (error) {
            console.error('Error getting authority trends:', error.message);
            return [];
        }
    }

    async updateTrends() {
        console.log('🔄 Updating trend analysis...');
        
        try {
            const trends = await this.analyzeTrends();
            console.log('✅ Trend analysis updated successfully');
            return trends;
        } catch (error) {
            console.error('Error updating trends:', error.message);
            return this.createFallbackTrendAnalysis();
        }
    }

    // HELPER METHODS
    async getHistoricalDataForTrends() {
        try {
            return await dbService.query(`
                SELECT * FROM regulatory_updates 
                WHERE created_at > NOW() - INTERVAL '${this.config.trendWindow} days'
                ORDER BY created_at ASC
            `);
        } catch (error) {
            console.error('Error getting historical data for trends:', error.message);
            return [];
        }
    }

    urgencyToScore(urgency) {
        const scores = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return scores[urgency] || 2;
    }

    impactToScore(impact) {
        const scores = { 'Critical': 4, 'Significant': 3, 'Moderate': 2, 'Informational': 1 };
        return scores[impact] || 2;
    }

    classifyMomentum(momentum) {
        if (momentum > 0.3) return 'very high';
        if (momentum > 0.15) return 'high';
        if (momentum > -0.15) return 'stable';
        if (momentum > -0.3) return 'low';
        return 'very low';
    }

    createFallbackTrendAnalysis() {
        return {
            timestamp: new Date().toISOString(),
            confidence: 30,
            authorityTrends: {},
            sectorTrends: {},
            areaTrends: {},
            momentum: { overall: { classification: 'stable' } },
            emergingDirections: {},
            fallback: true,
            message: 'Insufficient data for comprehensive trend analysis'
        };
    }

    initializeTrendMonitoring() {
        // Start periodic trend updates
        setInterval(() => {
            this.updateTrends().catch(error => 
                console.error('Trend update error:', error.message)
            );
        }, this.config.updateInterval);
    }

    extractUniqueSectors(data) {
        const sectors = new Set();
        data.forEach(item => {
            if (item.sector_relevance_scores) {
                Object.keys(item.sector_relevance_scores).forEach(sector => sectors.add(sector));
            }
        });
        return Array.from(sectors);
    }

    extractUniqueAreas(data) {
        const areas = new Set();
        data.forEach(item => {
            if (item.ai_area) areas.add(item.ai_area);
        });
        return Array.from(areas);
    }

    createTimeSeries(data) {
        return data.map((item, index) => ({
            time: index,
            value: 1, // Count of regulatory updates
            date: new Date(item.created_at)
        }));
    }

    getRecentData(data, days) {
        const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        return data.filter(item => new Date(item.created_at) >= cutoffDate);
    }

    getOlderData(data, excludeDays, includeDays) {
        const excludeDate = new Date(Date.now() - (excludeDays * 24 * 60 * 60 * 1000));
        const includeDate = new Date(Date.now() - (includeDays * 24 * 60 * 60 * 1000));
        return data.filter(item => {
            const itemDate = new Date(item.created_at);
            return itemDate < excludeDate && itemDate >= includeDate;
        });
    }
}

module.exports = TrendAnalysisService;