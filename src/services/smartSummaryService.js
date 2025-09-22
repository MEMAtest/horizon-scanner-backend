// src/services/smartSummaryService.js
// Smart Summary Service - Generates executive briefings, technical analysis, weekly roundups
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events');
const dbService = require('./dbService');
const AIPromptTemplates = require('../ai/promptTemplates');

class SmartSummaryService extends EventEmitter {
    constructor(aiIntelligenceService) {
        super();
        this.aiService = aiIntelligenceService;
        this.promptTemplates = new AIPromptTemplates();
        
        // Summary service configuration
        this.config = {
            summaryTypes: ['executive', 'technical', 'weekly', 'monthly', 'authority', 'sector'],
            audiences: ['executive', 'technical', 'operational', 'board'],
            maxUpdatesPerSummary: 50,
            summaryRetention: 90, // days
            autoSummaryInterval: 86400000, // 24 hours
            urgentSummaryThreshold: 3 // urgent updates trigger immediate summary
        };
        
        // Summary templates and formats
        this.templates = this.initializeSummaryTemplates();
        
        // Generated summaries cache
        this.summaryCache = new Map();
        
        // Auto-summary scheduling
        this.scheduledSummaries = new Map();
        
        console.log('📋 Smart Summary Service initialized');
    }

    // MAIN SUMMARY GENERATION ORCHESTRATOR
    async generateSmartSummary(summaryType, options = {}) {
        console.log(`📝 Generating ${summaryType} summary...`);
        
        try {
            // Get updates for summary
            const updates = await this.getUpdatesForSummary(summaryType, options);
            
            if (updates.length === 0) {
                return this.createNoUpdatesMessage(summaryType, options);
            }
            
            // Get additional context
            const context = await this.getAdditionalContext(summaryType, options);
            
            // Generate AI-powered summary
            const aiSummary = await this.generateAISummary(summaryType, updates, context, options);
            
            // Enhance with structured analysis
            const enhancedSummary = await this.enhanceSummaryWithAnalysis(aiSummary, updates, context);
            
            // Apply formatting and styling
            const formattedSummary = this.formatSummary(enhancedSummary, summaryType, options);
            
            // Add metadata and insights
            const completeSummary = this.addSummaryMetadata(formattedSummary, updates, context);
            
            // Store summary
            await this.storeSummary(completeSummary, summaryType, options);
            
            // Emit summary events
            this.emitSummaryEvents(completeSummary, summaryType);
            
            console.log(`✅ ${summaryType} summary generated successfully`);
            return completeSummary;
            
        } catch (error) {
            console.error(`❌ Failed to generate ${summaryType} summary:`, error.message);
            return this.createFallbackSummary(summaryType, options, error.message);
        }
    }

    // EXECUTIVE SUMMARY GENERATION
    async generateExecutiveSummary(options = {}) {
        const timeframe = options.timeframe || 7; // days
        const audience = options.audience || 'executive';
        
        const updates = await this.getRecentHighImpactUpdates(timeframe);
        const trends = await this.getRecentTrends();
        const patterns = await this.getEmergingPatterns();
        
        const context = {
            trends,
            patterns,
            timeframe,
            focus: 'strategic'
        };
        
        return await this.generateAISummary('executive', updates, context, {
            audience,
            format: 'briefing',
            maxLength: 800,
            includeActions: true
        });
    }

    // TECHNICAL SUMMARY GENERATION
    async generateTechnicalSummary(options = {}) {
        const timeframe = options.timeframe || 14; // days
        const area = options.area || null;
        
        const updates = await this.getTechnicalUpdates(timeframe, area);
        const implementations = await this.getImplementationDetails(updates);
        
        const context = {
            implementations,
            timeframe,
            area,
            focus: 'implementation'
        };
        
        return await this.generateAISummary('technical', updates, context, {
            audience: 'technical',
            format: 'detailed',
            includeDeadlines: true,
            includeActions: true
        });
    }

    // WEEKLY ROUNDUP GENERATION
    async generateWeeklyRoundup(options = {}) {
        const startDate = options.startDate || this.getStartOfWeek();
        const endDate = options.endDate || new Date();
        
        const updates = await this.getUpdatesByDateRange(startDate, endDate);
        const weeklyStats = await this.calculateWeeklyStats(updates);
        const highlights = this.identifyWeeklyHighlights(updates);
        
        const context = {
            weeklyStats,
            highlights,
            startDate,
            endDate,
            focus: 'comprehensive'
        };
        
        return await this.generateAISummary('weekly', updates, context, {
            audience: 'operational',
            format: 'roundup',
            includeStats: true,
            includeOutlook: true
        });
    }

    // MONTHLY SUMMARY GENERATION
    async generateMonthlySummary(options = {}) {
        const month = options.month || new Date().getMonth();
        const year = options.year || new Date().getFullYear();
        
        const updates = await this.getMonthlyUpdates(month, year);
        const monthlyTrends = await this.getMonthlyTrends(month, year);
        const comparisons = await this.getMonthlyComparisons(month, year);
        
        const context = {
            monthlyTrends,
            comparisons,
            month,
            year,
            focus: 'analytical'
        };
        
        return await this.generateAISummary('monthly', updates, context, {
            audience: 'executive',
            format: 'report',
            includeCharts: true,
            includeForecasts: true
        });
    }

    // AUTHORITY-SPECIFIC SUMMARY
    async generateAuthoritySummary(authority, options = {}) {
        const timeframe = options.timeframe || 30; // days
        
        const updates = await this.getAuthorityUpdates(authority, timeframe);
        const authorityTrends = await this.getAuthorityTrends(authority);
        const behaviorPattern = await this.getAuthorityBehaviorPattern(authority);
        
        const context = {
            authority,
            authorityTrends,
            behaviorPattern,
            timeframe,
            focus: 'authority-specific'
        };
        
        return await this.generateAISummary('authority', updates, context, {
            audience: 'technical',
            format: 'focused',
            includePatterns: true,
            includePredictions: true
        });
    }

    // SECTOR-SPECIFIC SUMMARY
    async generateSectorSummary(sector, options = {}) {
        const timeframe = options.timeframe || 30; // days
        
        const updates = await this.getSectorUpdates(sector, timeframe);
        const sectorTrends = await this.getSectorTrends(sector);
        const impactAnalysis = await this.getSectorImpactAnalysis(sector);
        
        const context = {
            sector,
            sectorTrends,
            impactAnalysis,
            timeframe,
            focus: 'sector-specific'
        };
        
        return await this.generateAISummary('sector', updates, context, {
            audience: 'operational',
            format: 'sector-focused',
            includeImpacts: true,
            includeRecommendations: true
        });
    }

    // AI SUMMARY GENERATION
    async generateAISummary(summaryType, updates, context, options) {
        try {
            const prompt = this.promptTemplates.createSmartSummaryPrompt(
                updates,
                summaryType,
                options.audience || 'executive'
            );
            
            const response = await this.aiService.makeGroqRequest(prompt);
            const summary = this.aiService.parseAIResponse(response);
            
            return this.validateAISummary(summary, summaryType);
            
        } catch (error) {
            console.error('AI summary generation failed:', error.message);
            return this.createStructuredFallbackSummary(summaryType, updates, context);
        }
    }

    // SUMMARY ENHANCEMENT WITH ANALYSIS
    async enhanceSummaryWithAnalysis(aiSummary, updates, context) {
        try {
            const enhancements = {
                quantitativeInsights: this.addQuantitativeInsights(updates),
                trendAnalysis: this.addTrendAnalysisToSummary(context),
                impactAssessment: this.addImpactAssessment(updates),
                actionItems: this.extractActionItems(updates),
                deadlines: this.extractUpcomingDeadlines(updates),
                riskFactors: this.identifyRiskFactors(updates),
                opportunities: this.identifyOpportunities(updates)
            };
            
            return {
                ...aiSummary.summary,
                enhancements,
                metadata: {
                    ...aiSummary.metadata,
                    enhanced: true,
                    enhancementTypes: Object.keys(enhancements)
                }
            };
            
        } catch (error) {
            console.error('Summary enhancement failed:', error.message);
            return aiSummary;
        }
    }

    // SUMMARY FORMATTING
    formatSummary(summary, summaryType, options) {
        const formatter = this.getFormatterForType(summaryType);
        
        return {
            ...summary,
            formatted: {
                html: formatter.toHTML(summary, options),
                markdown: formatter.toMarkdown(summary, options),
                text: formatter.toText(summary, options),
                json: formatter.toJSON(summary, options)
            },
            style: this.getStyleForAudience(options.audience),
            layout: this.getLayoutForType(summaryType)
        };
    }

    // SUMMARY METADATA ADDITION
    addSummaryMetadata(summary, updates, context) {
        return {
            ...summary,
            metadata: {
                ...summary.metadata,
                generatedAt: new Date().toISOString(),
                updateCount: updates.length,
                timeSpan: this.calculateTimeSpan(updates),
                authorities: this.getUniqueAuthorities(updates),
                sectors: this.getUniqueSectors(updates),
                impactDistribution: this.calculateImpactDistribution(updates),
                urgencyLevels: this.calculateUrgencyDistribution(updates),
                confidence: this.calculateSummaryConfidence(summary, updates),
                version: '1.0',
                summaryId: this.generateSummaryId()
            }
        };
    }

    // SUMMARY STORAGE
    async storeSummary(summary, summaryType, options) {
        try {
            const summaryData = {
                summary_id: summary.metadata.summaryId,
                summary_type: summaryType,
                audience: options.audience || 'general',
                content: summary,
                generated_at: summary.metadata.generatedAt,
                update_count: summary.metadata.updateCount,
                confidence_score: summary.metadata.confidence,
                timeframe_start: options.startDate || null,
                timeframe_end: options.endDate || null,
                authorities: summary.metadata.authorities,
                sectors: summary.metadata.sectors
            };
            
            await dbService.storeSummary(summaryData);
            
            // Update cache
            this.summaryCache.set(summary.metadata.summaryId, summary);
            
            // Clean old cache entries
            this.cleanSummaryCache();
            
        } catch (error) {
            console.error('Failed to store summary:', error.message);
        }
    }

    // EVENT EMISSION
    emitSummaryEvents(summary, summaryType) {
        // Emit for high-impact summaries
        if (summary.metadata.impactDistribution?.Critical > 0) {
            this.emit('criticalSummaryGenerated', {
                summary,
                summaryType,
                criticalCount: summary.metadata.impactDistribution.Critical
            });
        }
        
        // Emit for urgent updates in summary
        if (summary.metadata.urgencyLevels?.Urgent > 0) {
            this.emit('urgentSummaryGenerated', {
                summary,
                summaryType,
                urgentCount: summary.metadata.urgencyLevels.Urgent
            });
        }
        
        // General summary completion event
        this.emit('summaryGenerated', {
            summary,
            summaryType,
            timestamp: summary.metadata.generatedAt
        });
    }

    // AUTOMATED SUMMARY GENERATION
    async scheduleAutomaticSummaries() {
        // Daily executive summary
        this.scheduleDaily('executive', { audience: 'executive', timeframe: 1 });
        
        // Weekly comprehensive roundup
        this.scheduleWeekly('weekly', { audience: 'operational' });
        
        // Monthly strategic summary
        this.scheduleMonthly('monthly', { audience: 'board' });
    }

    scheduleDaily(summaryType, options) {
        const interval = setInterval(async () => {
            if (this.shouldGenerateDailySummary()) {
                await this.generateSmartSummary(summaryType, options);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
        
        this.scheduledSummaries.set(`daily_${summaryType}`, interval);
    }

    scheduleWeekly(summaryType, options) {
        const interval = setInterval(async () => {
            if (this.isStartOfWeek()) {
                await this.generateSmartSummary(summaryType, options);
            }
        }, 24 * 60 * 60 * 1000); // Check daily, generate weekly
        
        this.scheduledSummaries.set(`weekly_${summaryType}`, interval);
    }

    scheduleMonthly(summaryType, options) {
        const interval = setInterval(async () => {
            if (this.isStartOfMonth()) {
                await this.generateSmartSummary(summaryType, options);
            }
        }, 24 * 60 * 60 * 1000); // Check daily, generate monthly
        
        this.scheduledSummaries.set(`monthly_${summaryType}`, interval);
    }

    // PUBLIC API METHODS
    async getLatestSummary(summaryType, audience = null) {
        try {
            const query = `
                SELECT * FROM summaries 
                WHERE summary_type = $1 
                ${audience ? 'AND audience = $2' : ''}
                ORDER BY generated_at DESC 
                LIMIT 1
            `;
            
            const params = audience ? [summaryType, audience] : [summaryType];
            const result = await dbService.query(query, params);
            
            return result[0] || null;
            
        } catch (error) {
            console.error('Error getting latest summary:', error.message);
            return null;
        }
    }

    async getSummaryHistory(summaryType, days = 30) {
        try {
            return await dbService.query(`
                SELECT * FROM summaries 
                WHERE summary_type = $1 
                AND generated_at > NOW() - INTERVAL '${days} days'
                ORDER BY generated_at DESC
            `, [summaryType]);
        } catch (error) {
            console.error('Error getting summary history:', error.message);
            return [];
        }
    }

    async generateUrgentSummary(urgentUpdates) {
        if (urgentUpdates.length >= this.config.urgentSummaryThreshold) {
            return await this.generateSmartSummary('urgent', {
                updates: urgentUpdates,
                audience: 'executive',
                priority: 'urgent'
            });
        }
        return null;
    }

    // HELPER METHODS
    async getUpdatesForSummary(summaryType, options) {
        const timeframe = options.timeframe || this.getDefaultTimeframe(summaryType);
        
        try {
            let query = `
                SELECT * FROM regulatory_updates 
                WHERE created_at > NOW() - INTERVAL '${timeframe} days'
            `;
            
            if (options.authority) {
                query += ` AND authority = '${options.authority}'`;
            }
            
            if (options.sector) {
                query += ` AND sector_relevance_scores ? '${options.sector}'`;
            }
            
            if (options.impactLevel) {
                query += ` AND ai_impact_level = '${options.impactLevel}'`;
            }
            
            query += ` ORDER BY created_at DESC LIMIT ${this.config.maxUpdatesPerSummary}`;
            
            return await dbService.query(query);
            
        } catch (error) {
            console.error('Error getting updates for summary:', error.message);
            return [];
        }
    }

    getDefaultTimeframe(summaryType) {
        const timeframes = {
            executive: 7,
            technical: 14,
            weekly: 7,
            monthly: 30,
            authority: 30,
            sector: 30,
            urgent: 1
        };
        
        return timeframes[summaryType] || 7;
    }

    addQuantitativeInsights(updates) {
        return {
            totalUpdates: updates.length,
            averageImpactScore: this.calculateAverageImpactScore(updates),
            authorityDistribution: this.calculateAuthorityDistribution(updates),
            sectorCoverage: this.calculateSectorCoverage(updates),
            urgencyBreakdown: this.calculateUrgencyBreakdown(updates),
            timeDistribution: this.calculateTimeDistribution(updates)
        };
    }

    extractActionItems(updates) {
        const actionItems = [];
        
        updates.forEach(update => {
            if (update.compliance_actions) {
                const actions = update.compliance_actions.split(';').map(action => action.trim());
                actions.forEach(action => {
                    if (action.length > 10) { // Filter meaningful actions
                        actionItems.push({
                            action,
                            updateId: update.id,
                            authority: update.authority,
                            deadline: update.key_dates,
                            urgency: update.ai_urgency
                        });
                    }
                });
            }
        });
        
        return actionItems;
    }

    extractUpcomingDeadlines(updates) {
        const deadlines = [];
        
        updates.forEach(update => {
            if (update.key_dates && update.key_dates !== 'None identified') {
                deadlines.push({
                    description: update.key_dates,
                    updateId: update.id,
                    authority: update.authority,
                    title: update.ai_headline || update.title,
                    urgency: update.ai_urgency
                });
            }
        });
        
        return deadlines.sort((a, b) => a.urgency === 'Urgent' ? -1 : 1);
    }

    validateAISummary(summary, summaryType) {
        if (!summary || !summary.summary) {
            throw new Error('Invalid AI summary structure');
        }
        
        // Ensure required fields exist
        const requiredFields = ['headline', 'overview', 'keyDevelopments'];
        for (const field of requiredFields) {
            if (!summary.summary[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        return summary;
    }

    createFallbackSummary(summaryType, options, errorMessage) {
        return {
            summary: {
                headline: `${summaryType} Summary - Limited Analysis Available`,
                overview: `Summary generation encountered issues: ${errorMessage}. Manual review recommended.`,
                keyDevelopments: [],
                type: summaryType,
                audience: options.audience || 'general',
                generatedAt: new Date().toISOString(),
                fallback: true
            },
            metadata: {
                error: errorMessage,
                fallback: true,
                confidence: 20
            }
        };
    }

    createStructuredFallbackSummary(summaryType, updates, context) {
        const fallback = this.createFallbackSummary(summaryType, context || {}, 'AI analysis unavailable');
        return {
            headline: `${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} Summary`,
            overview: fallback.summary.overview,
            bulletPoints: [`${(updates || []).length} updates processed`],
            impactLevel: 'Moderate',
            keyDevelopments: fallback.summary.keyDevelopments,
            type: summaryType,
            generatedAt: new Date().toISOString(),
            fallback: true
        };
    }

    createNoUpdatesMessage(summaryType, options) {
        return {
            summary: {
                headline: `No Recent ${summaryType} Updates`,
                overview: `No regulatory updates found for the specified criteria and timeframe.`,
                keyDevelopments: [],
                type: summaryType,
                audience: options.audience || 'general',
                generatedAt: new Date().toISOString(),
                noData: true
            },
            metadata: {
                updateCount: 0,
                noData: true
            }
        };
    }

    initializeSummaryTemplates() {
        return {
            executive: {
                structure: ['headline', 'strategic_overview', 'priority_items', 'actions'],
                maxLength: 800,
                focusArea: 'strategic'
            },
            technical: {
                structure: ['headline', 'detailed_analysis', 'implementation_notes', 'deadlines'],
                maxLength: 1500,
                focusArea: 'implementation'
            },
            weekly: {
                structure: ['headline', 'week_overview', 'highlights', 'upcoming'],
                maxLength: 1200,
                focusArea: 'comprehensive'
            }
        };
    }

    generateSummaryId() {
        return `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    cleanSummaryCache() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const [id, summary] of this.summaryCache.entries()) {
            const summaryDate = new Date(summary.metadata.generatedAt).getTime();
            if (summaryDate < oneWeekAgo) {
                this.summaryCache.delete(id);
            }
        }
    }

    shouldGenerateDailySummary() {
        const hour = new Date().getHours();
        return hour === 8; // Generate at 8 AM
    }

    isStartOfWeek() {
        const day = new Date().getDay();
        const hour = new Date().getHours();
        return day === 1 && hour === 9; // Monday at 9 AM
    }

    isStartOfMonth() {
        const day = new Date().getDate();
        const hour = new Date().getHours();
        return day === 1 && hour === 10; // First day of month at 10 AM
    }

    getStartOfWeek() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        return new Date(now.setDate(diff));
    }
}

module.exports = SmartSummaryService;