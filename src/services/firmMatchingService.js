// src/services/firmMatchingService.js
// Firm Matching Service - Matches updates to firm profiles for personalized relevance
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events');
const dbService = require('./dbService');
const AIPromptTemplates = require('../ai/promptTemplates');

class FirmMatchingService extends EventEmitter {
    constructor(aiIntelligenceService) {
        super();
        this.aiService = aiIntelligenceService;
        this.promptTemplates = new AIPromptTemplates();
        
        // Firm matching configuration
        this.config = {
            relevanceThresholds: {
                high: 75,
                medium: 50,
                low: 25
            },
            matchingFactors: {
                sectorRelevance: 0.35,
                firmSize: 0.20,
                businessModel: 0.15,
                riskProfile: 0.15,
                geographicScope: 0.10,
                customerBase: 0.05
            },
            maxRecommendations: 10,
            cacheTimeout: 3600000 // 1 hour
        };
        
        // Firm profile cache
        this.firmProfileCache = new Map();
        this.relevanceCache = new Map();
        
        // Sector-specific business models
        this.businessModels = this.initializeBusinessModels();
        
        console.log('🏢 Firm Matching Service initialized');
    }

    // MAIN RELEVANCE ANALYSIS ORCHESTRATOR
    async analyzeRelevance(updateData, contentAnalysis) {
        console.log(`🔍 Analyzing firm relevance for update: ${updateData.id}`);
        
        try {
            // Get all firm profiles
            const firmProfiles = await this.getFirmProfiles();
            
            if (firmProfiles.length === 0) {
                return this.createDefaultRelevanceAnalysis(updateData, contentAnalysis);
            }
            
            // Analyze relevance for each firm
            const firmRelevanceAnalyses = await Promise.all(
                firmProfiles.map(firm => this.analyzeFirmSpecificRelevance(updateData, contentAnalysis, firm))
            );
            
            // Generate aggregated insights
            const aggregatedInsights = this.generateAggregatedInsights(firmRelevanceAnalyses);
            
            // Create personalized recommendations
            const personalizedRecommendations = this.generatePersonalizedRecommendations(
                firmRelevanceAnalyses, 
                updateData, 
                contentAnalysis
            );
            
            // Calculate industry-wide impact
            const industryImpact = this.calculateIndustryWideImpact(firmRelevanceAnalyses);
            
            // Generate competitive analysis
            const competitiveAnalysis = this.generateCompetitiveAnalysis(firmRelevanceAnalyses);
            
            // Combine all relevance analyses
            const combinedRelevanceAnalysis = {
                timestamp: new Date().toISOString(),
                updateId: updateData.id,
                firmAnalyses: firmRelevanceAnalyses,
                aggregatedInsights,
                personalizedRecommendations,
                industryImpact,
                competitiveAnalysis,
                overallRelevance: this.calculateOverallRelevance(firmRelevanceAnalyses),
                confidence: this.calculateRelevanceConfidence(firmRelevanceAnalyses)
            };
            
            // Store relevance analysis
            await this.storeRelevanceAnalysis(updateData.id, combinedRelevanceAnalysis);
            
            // Emit relevance events
            this.emitRelevanceEvents(updateData, combinedRelevanceAnalysis);
            
            console.log(`✅ Firm relevance analysis completed for update: ${updateData.id}`);
            return combinedRelevanceAnalysis;
            
        } catch (error) {
            console.error(`❌ Firm relevance analysis failed for update ${updateData.id}:`, error.message);
            return this.createFallbackRelevanceAnalysis(updateData, contentAnalysis);
        }
    }

    // FIRM-SPECIFIC RELEVANCE ANALYSIS
    async analyzeFirmSpecificRelevance(updateData, contentAnalysis, firmProfile) {
        try {
            // AI-powered relevance scoring
            const aiRelevanceScore = await this.getAIRelevanceScore(updateData, firmProfile);
            
            // Quantitative relevance calculations
            const quantitativeScore = this.calculateQuantitativeRelevance(contentAnalysis, firmProfile);
            
            // Business model alignment
            const businessModelAlignment = this.assessBusinessModelAlignment(contentAnalysis, firmProfile);
            
            // Risk profile assessment
            const riskProfileAssessment = this.assessRiskProfileAlignment(contentAnalysis, firmProfile);
            
            // Implementation complexity assessment
            const implementationComplexity = this.assessImplementationComplexity(contentAnalysis, firmProfile);
            
            // Timeline and priority assessment
            const timelineAssessment = this.assessImplementationTimeline(contentAnalysis, firmProfile);
            
            // Resource requirement estimation
            const resourceRequirements = this.estimateResourceRequirements(contentAnalysis, firmProfile);
            
            // Competitive impact assessment
            const competitiveImpact = this.assessCompetitiveImpact(contentAnalysis, firmProfile);
            
            // Combine all assessments
            const combinedRelevance = this.combineRelevanceAssessments({
                ai: aiRelevanceScore,
                quantitative: quantitativeScore,
                businessModel: businessModelAlignment,
                riskProfile: riskProfileAssessment,
                implementation: implementationComplexity,
                timeline: timelineAssessment,
                resources: resourceRequirements,
                competitive: competitiveImpact
            });
            
            return {
                firmId: firmProfile.id,
                firmProfile,
                relevanceScore: combinedRelevance.score,
                relevanceLevel: this.classifyRelevanceLevel(combinedRelevance.score),
                assessmentBreakdown: combinedRelevance.breakdown,
                specificImpacts: this.identifySpecificImpacts(contentAnalysis, firmProfile),
                actionItems: this.generateFirmActionItems(contentAnalysis, firmProfile, combinedRelevance),
                recommendations: this.generateFirmRecommendations(contentAnalysis, firmProfile, combinedRelevance),
                riskFactors: this.identifyRiskFactors(contentAnalysis, firmProfile),
                opportunities: this.identifyOpportunities(contentAnalysis, firmProfile),
                confidence: combinedRelevance.confidence
            };
            
        } catch (error) {
            console.error(`Failed to analyze relevance for firm ${firmProfile.id}:`, error.message);
            return this.createFallbackFirmRelevance(firmProfile);
        }
    }

    // AI-POWERED RELEVANCE SCORING
    async getAIRelevanceScore(updateData, firmProfile) {
        try {
            const prompt = this.promptTemplates.createFirmMatchingPrompt(updateData, firmProfile);
            const response = await this.aiService.makeGroqRequest(prompt);
            const relevanceAnalysis = this.aiService.parseAIResponse(response);
            
            return {
                score: relevanceAnalysis.relevanceScore || 50,
                reasoning: relevanceAnalysis.reasoning || 'AI analysis completed',
                specificImpacts: relevanceAnalysis.specificImpacts || [],
                recommendations: relevanceAnalysis.recommendedActions || [],
                confidence: 80
            };
            
        } catch (error) {
            console.error('AI relevance scoring failed:', error.message);
            return {
                score: 50,
                reasoning: 'AI analysis unavailable, using quantitative methods',
                specificImpacts: [],
                recommendations: [],
                confidence: 40
            };
        }
    }

    // QUANTITATIVE RELEVANCE CALCULATION
    calculateQuantitativeRelevance(contentAnalysis, firmProfile) {
        let score = 0;
        let breakdown = {};
        
        // Sector relevance (35%)
        const sectorScore = this.calculateSectorRelevance(contentAnalysis, firmProfile);
        score += sectorScore * this.config.matchingFactors.sectorRelevance;
        breakdown.sectorRelevance = sectorScore;
        
        // Firm size relevance (20%)
        const sizeScore = this.calculateSizeRelevance(contentAnalysis, firmProfile);
        score += sizeScore * this.config.matchingFactors.firmSize;
        breakdown.firmSize = sizeScore;
        
        // Business model relevance (15%)
        const businessModelScore = this.calculateBusinessModelRelevance(contentAnalysis, firmProfile);
        score += businessModelScore * this.config.matchingFactors.businessModel;
        breakdown.businessModel = businessModelScore;
        
        // Risk profile relevance (15%)
        const riskScore = this.calculateRiskRelevance(contentAnalysis, firmProfile);
        score += riskScore * this.config.matchingFactors.riskProfile;
        breakdown.riskProfile = riskScore;
        
        // Geographic scope relevance (10%)
        const geoScore = this.calculateGeographicRelevance(contentAnalysis, firmProfile);
        score += geoScore * this.config.matchingFactors.geographicScope;
        breakdown.geographicScope = geoScore;
        
        // Customer base relevance (5%)
        const customerScore = this.calculateCustomerBaseRelevance(contentAnalysis, firmProfile);
        score += customerScore * this.config.matchingFactors.customerBase;
        breakdown.customerBase = customerScore;
        
        return {
            score: Math.round(score),
            breakdown,
            confidence: 75
        };
    }

    // SECTOR RELEVANCE CALCULATION
    calculateSectorRelevance(contentAnalysis, firmProfile) {
        const firmSectors = this.getFirmSectors(firmProfile);
        const updateSectorScores = contentAnalysis.sectorRelevanceScores || {};
        
        let maxRelevance = 0;
        
        for (const sector of firmSectors) {
            const sectorScore = updateSectorScores[sector] || 0;
            maxRelevance = Math.max(maxRelevance, sectorScore);
        }
        
        // Boost for primary sector match
        if (firmProfile.primarySector && updateSectorScores[firmProfile.primarySector]) {
            maxRelevance = Math.min(100, maxRelevance * 1.2);
        }
        
        return maxRelevance;
    }

    // SIZE RELEVANCE CALCULATION
    calculateSizeRelevance(contentAnalysis, firmProfile) {
        const firmSize = firmProfile.size || 'Unknown';
        const impactLevel = contentAnalysis.impactLevel || 'Moderate';
        
        // Size-impact correlation matrix
        const sizeImpactMatrix = {
            'Large': { 'Critical': 95, 'Significant': 85, 'Moderate': 70, 'Informational': 60 },
            'Medium': { 'Critical': 90, 'Significant': 95, 'Moderate': 85, 'Informational': 70 },
            'Small': { 'Critical': 85, 'Significant': 90, 'Moderate': 95, 'Informational': 80 },
            'Micro': { 'Critical': 70, 'Significant': 80, 'Moderate': 90, 'Informational': 95 }
        };
        
        return sizeImpactMatrix[firmSize]?.[impactLevel] || 60;
    }

    // BUSINESS MODEL RELEVANCE
    calculateBusinessModelRelevance(contentAnalysis, firmProfile) {
        const firmBusinessModel = firmProfile.businessModel || 'Traditional';
        const regulatoryArea = contentAnalysis.area || '';
        
        // Business model relevance mapping
        const relevanceMapping = this.getBusinessModelRelevanceMapping();
        
        let relevance = 50; // Base relevance
        
        if (relevanceMapping[firmBusinessModel]) {
            for (const keyword of relevanceMapping[firmBusinessModel]) {
                if (regulatoryArea.toLowerCase().includes(keyword.toLowerCase())) {
                    relevance += 20;
                    break;
                }
            }
        }
        
        return Math.min(100, relevance);
    }

    // RISK PROFILE ASSESSMENT
    calculateRiskRelevance(contentAnalysis, firmProfile) {
        const firmRiskProfile = firmProfile.riskProfile || 'Medium';
        const updateRiskLevel = contentAnalysis.riskLevel || 'Medium';
        const updateUrgency = contentAnalysis.urgency || 'Medium';
        
        // Risk matching scores
        const riskMatrix = {
            'High': { 'High': 95, 'Medium': 80, 'Low': 65 },
            'Medium': { 'High': 85, 'Medium': 95, 'Low': 75 },
            'Low': { 'High': 70, 'Medium': 80, 'Low': 95 }
        };
        
        let score = riskMatrix[firmRiskProfile]?.[updateRiskLevel] || 70;
        
        // Adjust for urgency
        if (updateUrgency === 'Urgent' && firmRiskProfile === 'High') {
            score = Math.min(100, score * 1.1);
        }
        
        return score;
    }

    // BUSINESS MODEL ALIGNMENT ASSESSMENT
    assessBusinessModelAlignment(contentAnalysis, firmProfile) {
        const alignment = {
            score: this.calculateBusinessModelRelevance(contentAnalysis, firmProfile),
            specificAlignments: this.identifySpecificAlignments(contentAnalysis, firmProfile),
            misalignments: this.identifyMisalignments(contentAnalysis, firmProfile),
            adaptationRequired: this.assessAdaptationRequired(contentAnalysis, firmProfile),
            competitiveAdvantage: this.assessCompetitiveAdvantage(contentAnalysis, firmProfile)
        };
        
        return alignment;
    }

    // IMPLEMENTATION COMPLEXITY ASSESSMENT
    assessImplementationComplexity(contentAnalysis, firmProfile) {
        let complexity = 50; // Base complexity
        
        // Firm size factor
        const sizeFactor = {
            'Large': 1.3,    // More complex due to scale
            'Medium': 1.0,   // Baseline
            'Small': 0.8,    // Less complex but fewer resources
            'Micro': 0.6     // Least complex
        };
        
        complexity *= sizeFactor[firmProfile.size] || 1.0;
        
        // Impact level factor
        const impactFactor = {
            'Critical': 1.5,
            'Significant': 1.2,
            'Moderate': 1.0,
            'Informational': 0.7
        };
        
        complexity *= impactFactor[contentAnalysis.impactLevel] || 1.0;
        
        // Technology requirements
        if (contentAnalysis.area?.includes('Digital') || contentAnalysis.area?.includes('Technology')) {
            complexity *= (firmProfile.technologyMaturity || 0.5) + 0.5;
        }
        
        return {
            score: Math.min(100, Math.max(10, Math.round(complexity))),
            factors: this.getComplexityFactors(contentAnalysis, firmProfile),
            mitigationStrategies: this.suggestMitigationStrategies(contentAnalysis, firmProfile)
        };
    }

    // RESOURCE REQUIREMENT ESTIMATION
    estimateResourceRequirements(contentAnalysis, firmProfile) {
        const baseRequirements = this.getBaseResourceRequirements(firmProfile.size);
        
        // Adjust based on impact level
        const impactMultipliers = {
            'Critical': 2.0,
            'Significant': 1.5,
            'Moderate': 1.0,
            'Informational': 0.5
        };
        
        const multiplier = impactMultipliers[contentAnalysis.impactLevel] || 1.0;
        
        return {
            humanResources: Math.round(baseRequirements.humanResources * multiplier),
            financialInvestment: Math.round(baseRequirements.financialInvestment * multiplier),
            timeRequirement: Math.round(baseRequirements.timeRequirement * multiplier),
            externalExpertise: this.assessExternalExpertiseNeeds(contentAnalysis, firmProfile),
            technologyInvestment: this.assessTechnologyInvestmentNeeds(contentAnalysis, firmProfile)
        };
    }

    // RELEVANCE ASSESSMENT COMBINATION
    combineRelevanceAssessments(assessments) {
        // Weighted combination of different assessment types
        const weights = {
            ai: 0.4,
            quantitative: 0.3,
            businessModel: 0.15,
            riskProfile: 0.15
        };
        
        let combinedScore = 0;
        let combinedConfidence = 0;
        let totalWeight = 0;
        
        Object.entries(weights).forEach(([type, weight]) => {
            if (assessments[type] && assessments[type].score !== undefined) {
                combinedScore += assessments[type].score * weight;
                combinedConfidence += (assessments[type].confidence || 70) * weight;
                totalWeight += weight;
            }
        });
        
        return {
            score: totalWeight > 0 ? Math.round(combinedScore / totalWeight) : 50,
            confidence: totalWeight > 0 ? Math.round(combinedConfidence / totalWeight) : 50,
            breakdown: assessments
        };
    }

    // AGGREGATED INSIGHTS GENERATION
    generateAggregatedInsights(firmRelevanceAnalyses) {
        const insights = {
            industryOverview: this.generateIndustryOverview(firmRelevanceAnalyses),
            relevanceDistribution: this.calculateRelevanceDistribution(firmRelevanceAnalyses),
            commonImpacts: this.identifyCommonImpacts(firmRelevanceAnalyses),
            differentialImpacts: this.identifyDifferentialImpacts(firmRelevanceAnalyses),
            riskFactors: this.aggregateRiskFactors(firmRelevanceAnalyses),
            opportunities: this.aggregateOpportunities(firmRelevanceAnalyses)
        };
        
        return insights;
    }

    // PERSONALIZED RECOMMENDATIONS
    generatePersonalizedRecommendations(firmRelevanceAnalyses, updateData, contentAnalysis) {
        const recommendations = [];
        
        // High relevance firms - immediate action
        const highRelevanceFirms = firmRelevanceAnalyses.filter(
            analysis => analysis.relevanceLevel === 'High'
        );
        
        if (highRelevanceFirms.length > 0) {
            recommendations.push({
                type: 'immediate_action',
                priority: 'High',
                description: 'Immediate assessment and action planning required',
                affectedFirms: highRelevanceFirms.length,
                actionItems: this.extractImmediateActions(highRelevanceFirms)
            });
        }
        
        // Medium relevance firms - monitoring and preparation
        const mediumRelevanceFirms = firmRelevanceAnalyses.filter(
            analysis => analysis.relevanceLevel === 'Medium'
        );
        
        if (mediumRelevanceFirms.length > 0) {
            recommendations.push({
                type: 'monitoring_preparation',
                priority: 'Medium',
                description: 'Enhanced monitoring and preparation recommended',
                affectedFirms: mediumRelevanceFirms.length,
                actionItems: this.extractMonitoringActions(mediumRelevanceFirms)
            });
        }
        
        // Sector-specific recommendations
        const sectorRecommendations = this.generateSectorSpecificRecommendations(
            firmRelevanceAnalyses, contentAnalysis
        );
        
        recommendations.push(...sectorRecommendations);
        
        return recommendations;
    }

    // STORAGE AND EVENTS
    async storeRelevanceAnalysis(updateId, relevanceAnalysis) {
        try {
            const relevanceData = {
                update_id: updateId,
                analysis_type: 'firm_relevance',
                firm_analyses: relevanceAnalysis.firmAnalyses,
                aggregated_insights: relevanceAnalysis.aggregatedInsights,
                personalized_recommendations: relevanceAnalysis.personalizedRecommendations,
                industry_impact: relevanceAnalysis.industryImpact,
                competitive_analysis: relevanceAnalysis.competitiveAnalysis,
                overall_relevance: relevanceAnalysis.overallRelevance,
                confidence_score: relevanceAnalysis.confidence,
                analyzed_at: relevanceAnalysis.timestamp
            };
            
            await dbService.storeFirmRelevanceAnalysis(relevanceData);
            
        } catch (error) {
            console.error('Failed to store relevance analysis:', error.message);
        }
    }

    emitRelevanceEvents(updateData, relevanceAnalysis) {
        // Emit for high-relevance updates
        const highRelevanceFirms = relevanceAnalysis.firmAnalyses.filter(
            analysis => analysis.relevanceLevel === 'High'
        );
        
        if (highRelevanceFirms.length > 0) {
            this.emit('highRelevanceDetected', {
                update: updateData,
                affectedFirms: highRelevanceFirms.length,
                relevanceAnalysis
            });
        }
        
        // Emit for industry-wide impact
        if (relevanceAnalysis.industryImpact?.significantImpact) {
            this.emit('industryWideImpactDetected', {
                update: updateData,
                industryImpact: relevanceAnalysis.industryImpact
            });
        }
        
        // Emit for competitive implications
        if (relevanceAnalysis.competitiveAnalysis?.significantImplications) {
            this.emit('competitiveImplicationsDetected', {
                update: updateData,
                competitiveAnalysis: relevanceAnalysis.competitiveAnalysis
            });
        }
    }

    // PUBLIC API METHODS
    async getFirmRelevanceScore(updateId, firmId) {
        try {
            const result = await dbService.query(`
                SELECT firm_analyses FROM firm_relevance_analyses 
                WHERE update_id = $1
            `, [updateId]);
            
            if (result.length > 0) {
                const firmAnalyses = result[0].firm_analyses;
                const firmAnalysis = firmAnalyses.find(analysis => analysis.firmId === firmId);
                return firmAnalysis?.relevanceScore || 0;
            }
            
            return 0;
            
        } catch (error) {
            console.error('Error getting firm relevance score:', error.message);
            return 0;
        }
    }

    async getPersonalizedRecommendations(firmId, days = 30) {
        try {
            return await dbService.query(`
                SELECT fra.personalized_recommendations, ru.title, ru.ai_headline 
                FROM firm_relevance_analyses fra
                JOIN regulatory_updates ru ON fra.update_id = ru.id
                WHERE fra.firm_analyses @> '[{"firmId": "${firmId}"}]'
                AND fra.analyzed_at > NOW() - INTERVAL '${days} days'
                ORDER BY fra.analyzed_at DESC
                LIMIT 20
            `);
        } catch (error) {
            console.error('Error getting personalized recommendations:', error.message);
            return [];
        }
    }

    // HELPER METHODS
    async getFirmProfiles() {
        try {
            // Check cache first
            if (this.firmProfileCache.has('all') && 
                Date.now() - this.firmProfileCache.get('all').timestamp < this.config.cacheTimeout) {
                return this.firmProfileCache.get('all').data;
            }
            
            const profiles = await dbService.query('SELECT * FROM firm_profiles ORDER BY id');
            
            // Cache the results
            this.firmProfileCache.set('all', {
                data: profiles,
                timestamp: Date.now()
            });
            
            return profiles;
            
        } catch (error) {
            console.error('Error getting firm profiles:', error.message);
            return [];
        }
    }

    getFirmSectors(firmProfile) {
        const sectors = [firmProfile.primarySector];
        
        if (firmProfile.secondarySectors) {
            sectors.push(...firmProfile.secondarySectors);
        }
        
        return sectors.filter(sector => sector); // Remove null/undefined
    }

    classifyRelevanceLevel(score) {
        if (score >= this.config.relevanceThresholds.high) return 'High';
        if (score >= this.config.relevanceThresholds.medium) return 'Medium';
        if (score >= this.config.relevanceThresholds.low) return 'Low';
        return 'Minimal';
    }

    calculateOverallRelevance(firmRelevanceAnalyses) {
        if (firmRelevanceAnalyses.length === 0) return 0;
        
        const totalScore = firmRelevanceAnalyses.reduce((sum, analysis) => 
            sum + analysis.relevanceScore, 0);
        
        return Math.round(totalScore / firmRelevanceAnalyses.length);
    }

    calculateRelevanceConfidence(firmRelevanceAnalyses) {
        if (firmRelevanceAnalyses.length === 0) return 0;
        
        const totalConfidence = firmRelevanceAnalyses.reduce((sum, analysis) => 
            sum + analysis.confidence, 0);
        
        return Math.round(totalConfidence / firmRelevanceAnalyses.length);
    }

    initializeBusinessModels() {
        return {
            'Traditional Banking': ['credit', 'deposit', 'lending', 'capital'],
            'Digital Banking': ['digital', 'technology', 'fintech', 'innovation'],
            'Investment Banking': ['capital markets', 'securities', 'trading'],
            'Asset Management': ['investment', 'portfolio', 'fund'],
            'Insurance': ['risk', 'underwriting', 'claims', 'actuarial'],
            'Fintech': ['technology', 'digital', 'innovation', 'payments'],
            'Payment Services': ['payments', 'transaction', 'settlement'],
            'Wealth Management': ['wealth', 'advisory', 'private banking']
        };
    }

    getBusinessModelRelevanceMapping() {
        return this.businessModels;
    }

    createDefaultRelevanceAnalysis(updateData, contentAnalysis) {
        return {
            timestamp: new Date().toISOString(),
            updateId: updateData.id,
            firmAnalyses: [],
            aggregatedInsights: {
                message: 'No firm profiles available for analysis'
            },
            personalizedRecommendations: [],
            industryImpact: { level: 'Unknown' },
            competitiveAnalysis: { implications: 'Cannot assess without firm profiles' },
            overallRelevance: 50,
            confidence: 30,
            noProfiles: true
        };
    }

    createFallbackRelevanceAnalysis(updateData, contentAnalysis) {
        return {
            timestamp: new Date().toISOString(),
            updateId: updateData.id,
            firmAnalyses: [],
            aggregatedInsights: {
                message: 'Relevance analysis failed, manual review recommended'
            },
            personalizedRecommendations: [],
            industryImpact: { level: 'Moderate' },
            competitiveAnalysis: { implications: 'Standard regulatory impact expected' },
            overallRelevance: 50,
            confidence: 20,
            fallback: true
        };
    }

    createFallbackFirmRelevance(firmProfile) {
        return {
            firmId: firmProfile.id,
            firmProfile,
            relevanceScore: 50,
            relevanceLevel: 'Medium',
            assessmentBreakdown: {},
            specificImpacts: [],
            actionItems: ['Conduct internal assessment'],
            recommendations: ['Monitor for further developments'],
            riskFactors: ['Standard regulatory change risk'],
            opportunities: [],
            confidence: 30,
            fallback: true
        };
    }

    getBaseResourceRequirements(firmSize) {
        const requirements = {
            'Large': { humanResources: 20, financialInvestment: 500000, timeRequirement: 180 },
            'Medium': { humanResources: 8, financialInvestment: 150000, timeRequirement: 120 },
            'Small': { humanResources: 3, financialInvestment: 50000, timeRequirement: 90 },
            'Micro': { humanResources: 1, financialInvestment: 15000, timeRequirement: 60 }
        };
        
        return requirements[firmSize] || requirements['Small'];
    }
}

module.exports = FirmMatchingService;