// src/services/aiIntelligenceService.js
// Main AI Intelligence Coordinator - Orchestrates all AI analysis
// Phase 3: AI Intelligence Engine

const axios = require('axios');
const EventEmitter = require('events');
const AIPromptTemplates = require('../ai/promptTemplates');
const ConfidenceScoring = require('../ai/confidenceScoring');
const dbService = require('./dbService');

class AIIntelligenceService extends EventEmitter {
    constructor() {
        super();
        this.promptTemplates = new AIPromptTemplates();
        this.confidenceScoring = new ConfidenceScoring();
        
        // AI Service Configuration
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.3-70b-versatile';
        this.maxRetries = 3;
        this.requestTimeout = 30000;
        this.rateLimitDelay = 2000;
        
        // Service Registry for other Phase 3 services
        this.serviceRegistry = {};
        
        console.log('🧠 AI Intelligence Service initialized');
    }

    // SERVICE REGISTRATION
    registerService(serviceName, serviceInstance) {
        this.serviceRegistry[serviceName] = serviceInstance;
        console.log(`✅ Service registered: ${serviceName}`);
    }

    getService(serviceName) {
        return this.serviceRegistry[serviceName];
    }

    // MAIN INTELLIGENCE ANALYSIS ORCHESTRATOR
    async analyzeUpdate(updateData, options = {}) {
        console.log(`🔍 Starting comprehensive AI analysis for update: ${updateData.id}`);
        
        try {
            const analysisResults = {};
            
            // 1. Enhanced Content Analysis
            console.log('📝 Running enhanced content analysis...');
            analysisResults.contentAnalysis = await this.enhancedContentAnalysis(updateData);
            
            // 2. Pattern Recognition (if service available)
            if (this.serviceRegistry.patternRecognition) {
                console.log('🎯 Running pattern recognition...');
                analysisResults.patterns = await this.serviceRegistry.patternRecognition
                    .analyzePatterns(updateData, analysisResults.contentAnalysis);
            }
            
            // 3. Impact Prediction (if service available)
            if (this.serviceRegistry.impactPrediction) {
                console.log('💥 Running impact prediction...');
                analysisResults.impactPrediction = await this.serviceRegistry.impactPrediction
                    .predictImpact(updateData, analysisResults.contentAnalysis);
            }
            
            // 4. Firm Matching (if service available)
            if (this.serviceRegistry.firmMatching) {
                console.log('🏢 Running firm matching analysis...');
                analysisResults.firmRelevance = await this.serviceRegistry.firmMatching
                    .analyzeRelevance(updateData, analysisResults.contentAnalysis);
            }
            
            // 5. Deadline Intelligence (if service available)
            if (this.serviceRegistry.deadlineIntelligence) {
                console.log('⏰ Running deadline intelligence...');
                analysisResults.deadlineIntelligence = await this.serviceRegistry.deadlineIntelligence
                    .extractDeadlines(updateData, analysisResults.contentAnalysis);
            }
            
            // 6. Cross-Authority Analysis (if service available)
            if (this.serviceRegistry.crossAuthority) {
                console.log('🔗 Running cross-authority analysis...');
                analysisResults.crossAuthorityInsights = await this.serviceRegistry.crossAuthority
                    .analyzeCrossAuthority(updateData, analysisResults.contentAnalysis);
            }
            
            // 7. Calculate Confidence Scores
            console.log('📊 Calculating confidence scores...');
            analysisResults.confidence = this.confidenceScoring.calculateConfidence(
                analysisResults.contentAnalysis,
                {
                    url: updateData.url,
                    authority: updateData.authority,
                    pubDate: updateData.pubDate,
                    documentType: this.detectDocumentType(updateData)
                }
            );
            
            // 8. Store Enhanced Analysis
            await this.storeEnhancedAnalysis(updateData.id, analysisResults);
            
            // 9. Emit Intelligence Events
            this.emitIntelligenceEvents(updateData, analysisResults);
            
            console.log(`✅ Comprehensive AI analysis completed for update: ${updateData.id}`);
            return analysisResults;
            
        } catch (error) {
            console.error(`❌ AI Intelligence analysis failed for update ${updateData.id}:`, error.message);
            
            // Fallback to basic analysis
            const fallbackAnalysis = await this.fallbackAnalysis(updateData);
            await this.storeEnhancedAnalysis(updateData.id, { contentAnalysis: fallbackAnalysis });
            
            return { contentAnalysis: fallbackAnalysis, error: error.message };
        }
    }

    // ENHANCED CONTENT ANALYSIS
    async enhancedContentAnalysis(updateData) {
        try {
            const prompt = this.promptTemplates.createContentAnalysisPrompt(
                updateData.content || updateData.title + ' ' + updateData.description,
                updateData.url,
                updateData.authority
            );
            
            const response = await this.makeGroqRequest(prompt);
            const analysis = this.parseAIResponse(response);
            
            // Enhance with metadata
            analysis.processedAt = new Date().toISOString();
            analysis.sourceUrl = updateData.url;
            analysis.originalAuthority = updateData.authority;
            
            return analysis;
            
        } catch (error) {
            console.error('Enhanced content analysis failed:', error.message);
            return this.createFallbackAnalysis(updateData);
        }
    }

    // BATCH INTELLIGENCE PROCESSING
    async processBatchIntelligence(updates, options = {}) {
        console.log(`🔄 Processing batch intelligence for ${updates.length} updates`);
        
        const results = [];
        const batchSize = options.batchSize || 5;
        
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);
            
            const batchPromises = batch.map(update => 
                this.analyzeUpdate(update, options).catch(error => ({
                    id: update.id,
                    error: error.message
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Rate limiting between batches
            if (i + batchSize < updates.length) {
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
            }
        }
        
        // Generate batch insights
        const batchInsights = await this.generateBatchInsights(results);
        
        console.log(`✅ Batch intelligence processing completed. ${results.length} updates processed`);
        return {
            results,
            insights: batchInsights,
            summary: this.createBatchSummary(results)
        };
    }

    // REAL-TIME INTELLIGENCE MONITORING
    async monitorIntelligence(options = {}) {
        console.log('👁️ Starting real-time intelligence monitoring');
        
        const monitoringInterval = options.interval || 300000; // 5 minutes
        
        setInterval(async () => {
            try {
                // Get recent updates that need intelligence analysis
                const recentUpdates = await this.getUpdatesNeedingIntelligence();
                
                if (recentUpdates.length > 0) {
                    console.log(`🔍 Found ${recentUpdates.length} updates needing intelligence analysis`);
                    await this.processBatchIntelligence(recentUpdates);
                }
                
                // Run trend analysis
                if (this.serviceRegistry.trendAnalysis) {
                    await this.serviceRegistry.trendAnalysis.updateTrends();
                }
                
                // Update pattern recognition
                if (this.serviceRegistry.patternRecognition) {
                    await this.serviceRegistry.patternRecognition.updatePatterns();
                }
                
            } catch (error) {
                console.error('Intelligence monitoring error:', error.message);
            }
        }, monitoringInterval);
    }

    // GROQ API INTEGRATION
    async makeGroqRequest(prompt, attempt = 1) {
        if (!this.groqApiKey) {
            throw new Error('Groq API key not configured');
        }
        
        try {
            const response = await axios.post(this.groqApiUrl, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert regulatory intelligence analyst. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000,
                top_p: 0.9
            }, {
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.requestTimeout
            });

            return response.data;
            
        } catch (error) {
            if (attempt < this.maxRetries && (error.response?.status === 429 || error.code === 'ECONNRESET')) {
                console.log(`⚠️ Groq API attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * attempt));
                return this.makeGroqRequest(prompt, attempt + 1);
            }
            throw error;
        }
    }

    // AI RESPONSE PARSING
    parseAIResponse(response) {
        try {
            if (!response?.choices?.[0]?.message?.content) {
                throw new Error('Invalid AI response format');
            }
            
            let content = response.choices[0].message.content.trim();
            
            // Clean JSON response
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            const parsed = JSON.parse(content);
            
            // Validate required fields
            if (!parsed.headline || !parsed.impact || !parsed.impactLevel) {
                throw new Error('Missing required analysis fields');
            }
            
            return parsed;
            
        } catch (error) {
            console.error('Failed to parse AI response:', error.message);
            throw new Error('AI response parsing failed');
        }
    }

    // DATABASE OPERATIONS
    async storeEnhancedAnalysis(updateId, analysisResults) {
        try {
            // Store in ai_insights table (Phase 1 model)
            const insightData = {
                update_id: updateId,
                analysis_type: 'comprehensive',
                content_analysis: analysisResults.contentAnalysis,
                patterns: analysisResults.patterns || null,
                impact_prediction: analysisResults.impactPrediction || null,
                firm_relevance: analysisResults.firmRelevance || null,
                deadline_intelligence: analysisResults.deadlineIntelligence || null,
                cross_authority_insights: analysisResults.crossAuthorityInsights || null,
                confidence_score: analysisResults.confidence?.confidence || 50,
                confidence_factors: analysisResults.confidence?.factors || [],
                processed_at: new Date().toISOString()
            };
            
            await dbService.storeAIInsight(insightData);
            
            // Update main regulatory_updates table with enhanced data
            const updateEnhancements = {
                ai_headline: analysisResults.contentAnalysis?.headline,
                ai_impact: analysisResults.contentAnalysis?.impact,
                ai_area: analysisResults.contentAnalysis?.area,
                ai_impact_level: analysisResults.contentAnalysis?.impactLevel,
                ai_urgency: analysisResults.contentAnalysis?.urgency,
                ai_risk_level: analysisResults.contentAnalysis?.riskLevel,
                ai_confidence: analysisResults.confidence?.confidence,
                sector_relevance_scores: analysisResults.contentAnalysis?.sectorRelevanceScores,
                key_dates: analysisResults.contentAnalysis?.keyDates,
                compliance_actions: analysisResults.contentAnalysis?.complianceActions
            };
            
            await dbService.updateRegulatoryUpdate(updateId, updateEnhancements);
            
        } catch (error) {
            console.error('Failed to store enhanced analysis:', error.message);
            throw error;
        }
    }

    // INTELLIGENCE EVENTS
    emitIntelligenceEvents(updateData, analysisResults) {
        // Emit for high-impact updates
        if (analysisResults.contentAnalysis?.impactLevel === 'Critical') {
            this.emit('criticalIntelligence', {
                update: updateData,
                analysis: analysisResults
            });
        }
        
        // Emit for urgent updates
        if (analysisResults.contentAnalysis?.urgency === 'Urgent') {
            this.emit('urgentIntelligence', {
                update: updateData,
                analysis: analysisResults
            });
        }
        
        // Emit for deadline alerts
        if (analysisResults.deadlineIntelligence?.explicitDeadlines?.length > 0) {
            this.emit('deadlineAlert', {
                update: updateData,
                deadlines: analysisResults.deadlineIntelligence.explicitDeadlines
            });
        }
        
        // Emit for pattern detection
        if (analysisResults.patterns?.emergingThemes?.length > 0) {
            this.emit('patternDetected', {
                update: updateData,
                patterns: analysisResults.patterns
            });
        }
        
        // General intelligence event
        this.emit('intelligenceProcessed', {
            update: updateData,
            analysis: analysisResults
        });
    }

    // HELPER METHODS
    async getUpdatesNeedingIntelligence() {
        try {
            return await dbService.query(`
                SELECT ru.* FROM regulatory_updates ru
                LEFT JOIN ai_insights ai ON ru.id = ai.update_id
                WHERE ai.id IS NULL 
                AND ru.created_at > NOW() - INTERVAL '24 hours'
                ORDER BY ru.created_at DESC
                LIMIT 20
            `);
        } catch (error) {
            console.error('Error getting updates needing intelligence:', error.message);
            return [];
        }
    }

    detectDocumentType(updateData) {
        const title = (updateData.title || '').toLowerCase();
        const url = (updateData.url || '').toLowerCase();
        
        if (title.includes('consultation') || url.includes('consultation')) return 'Consultation Paper';
        if (title.includes('policy statement') || url.includes('policy')) return 'Policy Statement';
        if (title.includes('guidance') || url.includes('guidance')) return 'Guidance';
        if (title.includes('speech') || url.includes('speech')) return 'Speech';
        if (title.includes('technical') || url.includes('technical')) return 'Technical Standard';
        
        return 'Unknown';
    }

    createFallbackAnalysis(updateData) {
        return {
            headline: updateData.title || 'Regulatory Update',
            impact: 'Unable to perform detailed analysis. Manual review recommended.',
            area: 'General',
            impactLevel: 'Informational',
            urgency: 'Medium',
            sector: 'General',
            primarySectors: ['Banking'],
            riskLevel: 'Medium',
            fallback: true,
            processedAt: new Date().toISOString()
        };
    }

    async generateBatchInsights(results) {
        const successfulResults = results.filter(r => !r.error);
        
        return {
            totalProcessed: results.length,
            successfulAnalyses: successfulResults.length,
            failedAnalyses: results.length - successfulResults.length,
            averageConfidence: successfulResults.reduce((sum, r) => 
                sum + (r.confidence?.confidence || 50), 0) / successfulResults.length || 0,
            impactDistribution: this.calculateImpactDistribution(successfulResults),
            topAreas: this.getTopRegulatoryAreas(successfulResults),
            urgentUpdates: successfulResults.filter(r => 
                r.contentAnalysis?.urgency === 'Urgent').length
        };
    }

    calculateImpactDistribution(results) {
        const distribution = { Critical: 0, Significant: 0, Moderate: 0, Informational: 0 };
        results.forEach(r => {
            const level = r.contentAnalysis?.impactLevel || 'Informational';
            distribution[level] = (distribution[level] || 0) + 1;
        });
        return distribution;
    }

    getTopRegulatoryAreas(results) {
        const areaCounts = {};
        results.forEach(r => {
            const area = r.contentAnalysis?.area || 'General';
            areaCounts[area] = (areaCounts[area] || 0) + 1;
        });
        
        return Object.entries(areaCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([area, count]) => ({ area, count }));
    }

    createBatchSummary(results) {
        const summary = {
            processedAt: new Date().toISOString(),
            totalUpdates: results.length,
            successRate: ((results.length - results.filter(r => r.error).length) / results.length * 100).toFixed(1) + '%'
        };
        
        return summary;
    }
}

module.exports = AIIntelligenceService;