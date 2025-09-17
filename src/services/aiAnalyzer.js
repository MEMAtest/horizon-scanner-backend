// Enhanced AI Analyzer Service - Phase 1
// File: src/services/aiAnalyzer.js

const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// UPDATED: Using currently available Groq models (Sept 2025)
const PRIMARY_MODEL = 'llama-3.3-70b-versatile'; // Current 70B model
const FALLBACK_MODELS = [
    'llama-3.1-8b-instant',       // Fast 8B model
    'openai/gpt-oss-120b',        // OpenAI's 120B model
    'qwen/qwen3-32b',             // Qwen 32B model
    'gemma2-9b-it'                // Gemma 9B as final fallback
];

const INDUSTRY_SECTORS = [
    'Banking', 'Investment Management', 'Insurance', 'Payment Services', 
    'Fintech', 'Credit Unions', 'Pension Funds', 'Real Estate Finance',
    'Consumer Credit', 'Capital Markets', 'Private Equity', 'Hedge Funds',
    'Cryptocurrency', 'RegTech', 'Wealth Management', 'Corporate Finance'
];

const AUTHORITY_WEIGHTS = {
    'FCA': 5, 'PRA': 5, 'Bank of England': 4, 'HM Treasury': 4,
    'Competition and Markets Authority': 3, 'ICO': 2, 'FRC': 2,
    'HMRC': 3, 'TPR': 3, 'European Banking Authority': 3
};

class EnhancedAIAnalyzer {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.maxRetries = 3;
        this.retryDelay = 5000;
        this.requestTimeout = 30000;
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000;
        this.cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours
        
        // Model management
        this.currentModel = PRIMARY_MODEL;
        this.modelFallbackChain = [PRIMARY_MODEL, ...FALLBACK_MODELS];
        this.modelFailureCount = new Map();
        
        // Initialize caches for performance
        this.weeklyRoundupCache = new Map();
        this.authoritySpotlightCache = new Map();
        this.sectorAnalysisCache = new Map();
        
        console.log(`🤖 Enhanced AI Analyzer initialized with model: ${PRIMARY_MODEL}`);
    }

    // CORE ENHANCED ANALYSIS METHOD
    async analyzeRegulatoryContent(content, url, metadata = {}) {
        console.log(`🔍 Starting enhanced AI analysis for: ${url?.substring(0, 100)}...`);
        
        if (!content || content.trim().length < 50) {
            console.warn('⚠️ Content too short for meaningful analysis');
            return this.createEnhancedFallbackAnalysis(content, url);
        }

        try {
            const enhancedPrompt = this.createEnhancedAnalysisPrompt(content, url, metadata);
            
            const response = await this.makeGroqRequest(enhancedPrompt);
            
            if (!response || !response.choices || !response.choices[0]) {
                throw new Error('Invalid response format from Groq API');
            }
            
            const aiResponse = response.choices[0].message.content;
            const parsedAnalysis = this.parseAndValidateAIResponse(aiResponse, content, url);
            
            if (!parsedAnalysis) {
                throw new Error('Failed to parse AI response');
            }

            // Add enhanced intelligence fields
            const enhancedAnalysis = await this.addIntelligenceEnhancements(parsedAnalysis, content, url);
            
            console.log(`✅ Enhanced AI analysis completed successfully with model: ${this.currentModel}`);
            return enhancedAnalysis;
            
        } catch (error) {
            console.error(`❌ Enhanced AI analysis failed:`, error.message);
            
            // Enhanced fallback analysis
            console.log('🔄 Using enhanced fallback analysis with sector intelligence');
            return this.createEnhancedFallbackAnalysis(content, url, metadata);
        }
    }

    // ENHANCED ANALYSIS PROMPT
    createEnhancedAnalysisPrompt(content, url, metadata = {}) {
        const authorityContext = metadata.authority ? `Authority: ${metadata.authority}\n` : '';
        const dateContext = metadata.publishedDate ? `Published: ${metadata.publishedDate}\n` : '';
        
        return `You are an expert regulatory intelligence analyst specializing in UK and international financial services regulation. 

Analyze this regulatory content and provide a comprehensive structured response:

${authorityContext}${dateContext}
CONTENT TO ANALYZE:
${content.substring(0, 4000)}

URL SOURCE: ${url}

ANALYSIS REQUIREMENTS:
1. Create a clear, professional headline (max 120 characters)
2. Provide a concise business impact summary (max 300 words) focusing on practical implications
3. Identify the specific regulatory area/topic
4. Determine impact level: Significant, Moderate, or Informational
5. Assess urgency: High, Medium, or Low
6. Identify ALL relevant industry sectors from this list: ${INDUSTRY_SECTORS.join(', ')}
7. Provide sector-specific relevance scores (0-100) for each identified sector
8. Extract any key dates, deadlines, or implementation timeframes
9. Identify specific compliance requirements or actions needed
10. Assess potential business risks and opportunities
11. Determine affected firm sizes: small, medium, large, all

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "headline": "Clear, professional headline under 120 chars",
  "impact": "Concise business impact summary focusing on practical implications",
  "area": "Specific regulatory area or topic",
  "impactLevel": "Significant|Moderate|Informational",
  "urgency": "High|Medium|Low", 
  "sector": "Primary sector most affected",
  "primarySectors": ["Array", "of", "affected", "sectors"],
  "sectorRelevanceScores": {
    "Banking": 85,
    "Investment Management": 70
  },
  "keyDates": "Any important dates or deadlines mentioned",
  "complianceActions": "Required actions or next steps",
  "riskLevel": "High|Medium|Low",
  "affectedFirmSizes": ["small", "medium", "large"],
  "businessOpportunities": "Potential business opportunities or competitive advantages",
  "implementationComplexity": "Low|Medium|High",
  "crossReferences": ["Related regulatory topics or requirements"]
}

Ensure accuracy, professionalism, and focus on actionable business intelligence.`;
    }

    // ADD INTELLIGENCE ENHANCEMENTS
    async addIntelligenceEnhancements(analysis, content, url) {
        try {
            // Calculate business impact score (1-10)
            const businessImpactScore = this.calculateBusinessImpactScore(analysis, content);
            
            // Generate implementation phases
            const implementationPhases = this.generateImplementationPhases(analysis);
            
            // Calculate required resources
            const requiredResources = this.calculateRequiredResources(analysis, businessImpactScore);
            
            // Generate AI tags for search and filtering
            const aiTags = this.generateAITags(analysis, content);
            
            // Calculate AI confidence score
            const aiConfidenceScore = this.calculateConfidenceScore(analysis, content);
            
            return {
                ...analysis,
                businessImpactScore,
                aiConfidenceScore,
                aiTags,
                implementationPhases,
                requiredResources,
                firmTypesAffected: analysis.primarySectors || [],
                complianceDeadline: this.extractComplianceDeadline(analysis.keyDates),
                sectorRelevanceScores: analysis.sectorRelevanceScores || {},
                enhancedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error adding intelligence enhancements:', error);
            return analysis; // Return basic analysis if enhancement fails
        }
    }

    // BUSINESS IMPACT SCORING
    calculateBusinessImpactScore(analysis, content) {
        let score = 5; // Base score
        
        // Impact level factor
        const impactMultipliers = { 'Significant': 1.5, 'Moderate': 1.0, 'Informational': 0.6 };
        score *= impactMultipliers[analysis.impactLevel] || 1.0;
        
        // Urgency factor
        const urgencyBonus = { 'High': 3, 'Medium': 1, 'Low': 0 };
        score += urgencyBonus[analysis.urgency] || 0;
        
        // Content type impact
        const text = content.toLowerCase();
        if (text.includes('final rule') || text.includes('regulation')) score += 2;
        if (text.includes('enforcement') || text.includes('fine') || text.includes('penalty')) score += 2;
        if (text.includes('guidance') || text.includes('consultation')) score += 1;
        if (text.includes('deadline') || text.includes('implementation date')) score += 1;
        
        // Sector breadth impact
        const sectorCount = analysis.primarySectors?.length || 1;
        if (sectorCount > 3) score += 1;
        
        return Math.min(Math.max(Math.round(score), 1), 10);
    }

    // IMPLEMENTATION PHASES GENERATION
    generateImplementationPhases(analysis) {
        const phases = [];
        const isHighImpact = analysis.impactLevel === 'Significant';
        const hasDeadline = analysis.keyDates && analysis.keyDates.includes('deadline');
        
        // Analysis phase (always needed)
        phases.push({
            phase: 'Initial Analysis',
            duration: isHighImpact ? '1-2 weeks' : '3-5 days',
            description: 'Review requirements and assess current compliance state',
            priority: 'High',
            effort: 'Medium'
        });
        
        // Policy development for regulations
        if (analysis.area?.toLowerCase().includes('rule') || analysis.complianceActions) {
            phases.push({
                phase: 'Policy Development',
                duration: isHighImpact ? '4-6 weeks' : '2-3 weeks',
                description: 'Develop or update policies and procedures',
                priority: 'High',
                effort: isHighImpact ? 'High' : 'Medium'
            });
        }
        
        // System implementation if needed
        if (analysis.area?.toLowerCase().includes('report') || 
            analysis.area?.toLowerCase().includes('data') ||
            analysis.area?.toLowerCase().includes('system')) {
            phases.push({
                phase: 'System Implementation',
                duration: isHighImpact ? '8-12 weeks' : '4-6 weeks',
                description: 'Update systems, processes, and reporting mechanisms',
                priority: 'Medium',
                effort: 'High'
            });
        }
        
        // Training phase
        phases.push({
            phase: 'Training & Implementation',
            duration: '2-4 weeks',
            description: 'Staff training and go-live activities',
            priority: 'Medium',
            effort: 'Medium'
        });
        
        // Monitoring phase
        phases.push({
            phase: 'Monitoring & Review',
            duration: 'Ongoing',
            description: 'Monitor compliance and effectiveness',
            priority: 'Low',
            effort: 'Low'
        });
        
        return phases;
    }

    // REQUIRED RESOURCES CALCULATION
    calculateRequiredResources(analysis, businessImpactScore) {
        const baseEffort = businessImpactScore * 8; // Base effort days
        
        const roles = [
            {
                role: 'Compliance Officer',
                effort: `${Math.round(baseEffort * 0.5)} days`,
                skills: ['Regulatory analysis', 'Policy development', 'Risk assessment']
            }
        ];
        
        // Add additional roles based on impact
        if (businessImpactScore >= 6) {
            roles.push({
                role: 'Legal Counsel',
                effort: `${Math.round(baseEffort * 0.3)} days`,
                skills: ['Regulatory law', 'Legal interpretation', 'Risk assessment']
            });
        }
        
        if (businessImpactScore >= 7) {
            roles.push({
                role: 'Business Analyst',
                effort: `${Math.round(baseEffort * 0.4)} days`,
                skills: ['Process analysis', 'Requirements gathering', 'Implementation planning']
            });
        }
        
        if (businessImpactScore >= 8) {
            roles.push({
                role: 'Project Manager',
                effort: `${Math.round(baseEffort * 0.3)} days`,
                skills: ['Project coordination', 'Stakeholder management', 'Implementation oversight']
            });
        }
        
        const estimatedCost = this.calculateCostEstimate(roles, businessImpactScore);
        
        return {
            totalEffortDays: Math.round(baseEffort),
            estimatedCost,
            roleBreakdown: roles,
            externalConsulting: businessImpactScore >= 8,
            trainingRequired: true,
            systemChanges: analysis.area?.toLowerCase().includes('system') || 
                           analysis.area?.toLowerCase().includes('report')
        };
    }

    // COST ESTIMATION
    calculateCostEstimate(roles, businessImpactScore) {
        const dailyRates = {
            'Compliance Officer': 800,
            'Legal Counsel': 1200,
            'Business Analyst': 700,
            'Project Manager': 900
        };
        
        let totalCost = 0;
        roles.forEach(role => {
            const days = parseInt(role.effort.split(' ')[0]) || 0;
            const rate = dailyRates[role.role] || 600;
            totalCost += days * rate;
        });
        
        // Add external consulting if needed
        if (businessImpactScore >= 8) {
            totalCost += 10000; // External consulting buffer
        }
        
        return {
            internal: `£${totalCost.toLocaleString()}`,
            external: businessImpactScore >= 8 ? '£5,000 - £15,000' : 'Not required',
            total: `£${(totalCost + (businessImpactScore >= 8 ? 10000 : 0)).toLocaleString()}`
        };
    }

    // AI TAGS GENERATION
    generateAITags(analysis, content) {
        const tags = [];
        
        // Add impact and urgency tags
        tags.push(`impact:${analysis.impactLevel?.toLowerCase()}`);
        tags.push(`urgency:${analysis.urgency?.toLowerCase()}`);
        
        // Add sector tags
        if (analysis.primarySectors) {
            analysis.primarySectors.forEach(sector => {
                tags.push(`sector:${sector.toLowerCase().replace(/\s+/g, '-')}`);
            });
        }
        
        // Add content type tags
        const text = content.toLowerCase();
        if (text.includes('consultation')) tags.push('type:consultation');
        if (text.includes('final rule')) tags.push('type:final-rule');
        if (text.includes('guidance')) tags.push('type:guidance');
        if (text.includes('enforcement')) tags.push('type:enforcement');
        if (text.includes('deadline')) tags.push('has:deadline');
        if (text.includes('fine') || text.includes('penalty')) tags.push('has:penalty');
        
        // Add area-specific tags
        if (analysis.area) {
            const areaTag = analysis.area.toLowerCase().replace(/\s+/g, '-');
            tags.push(`area:${areaTag}`);
        }
        
        return tags.filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
    }

    // CONFIDENCE SCORE CALCULATION
    calculateConfidenceScore(analysis, content) {
        let confidence = 0.7; // Base confidence
        
        // Content quality factors
        if (content.length > 1000) confidence += 0.1;
        if (content.length > 3000) confidence += 0.1;
        
        // Analysis completeness factors
        if (analysis.primarySectors && analysis.primarySectors.length > 0) confidence += 0.05;
        if (analysis.keyDates && analysis.keyDates.length > 10) confidence += 0.05;
        if (analysis.complianceActions && analysis.complianceActions.length > 20) confidence += 0.05;
        if (analysis.sectorRelevanceScores && Object.keys(analysis.sectorRelevanceScores).length > 0) confidence += 0.05;
        
        return Math.min(confidence, 1.0);
    }

    // COMPLIANCE DEADLINE EXTRACTION
    extractComplianceDeadline(keyDates) {
        if (!keyDates) return null;
        
        const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
        const matches = keyDates.match(dateRegex);
        
        if (matches && matches.length > 0) {
            try {
                const date = new Date(matches[0]);
                if (date > new Date()) { // Only future dates
                    return date.toISOString().split('T')[0];
                }
            } catch (error) {
                console.warn('Could not parse compliance deadline:', matches[0]);
            }
        }
        
        return null;
    }

    // ENHANCED FALLBACK ANALYSIS
    createEnhancedFallbackAnalysis(content, url, metadata = {}) {
        console.log('🔄 Creating enhanced fallback analysis');
        
        const text = content.toLowerCase();
        const authority = metadata.authority || 'Unknown';
        
        // Smart impact level detection
        let impactLevel = 'Informational';
        let urgency = 'Low';
        let businessImpactScore = 3;
        
        if (text.includes('final rule') || text.includes('regulation') || text.includes('mandatory')) {
            impactLevel = 'Significant';
            urgency = 'High';
            businessImpactScore = 7;
        } else if (text.includes('guidance') || text.includes('update') || text.includes('requirements')) {
            impactLevel = 'Moderate';
            urgency = 'Medium';
            businessImpactScore = 5;
        }
        
        // Enhanced deadline detection
        if (text.includes('deadline') || text.includes('implementation date') || text.includes('effective date')) {
            urgency = urgency === 'Low' ? 'Medium' : 'High';
            businessImpactScore += 1;
        }
        
        // Smart sector detection
        const detectedSectors = [];
        INDUSTRY_SECTORS.forEach(sector => {
            if (text.includes(sector.toLowerCase()) || 
                text.includes(sector.toLowerCase().replace(/\s+/g, ''))) {
                detectedSectors.push(sector);
            }
        });
        
        if (detectedSectors.length === 0) {
            detectedSectors.push('Banking'); // Default fallback
        }
        
        // Generate sector relevance scores
        const sectorRelevanceScores = {};
        detectedSectors.forEach(sector => {
            sectorRelevanceScores[sector] = 75; // Default relevance
        });
        
        const fallbackAnalysis = {
            headline: this.generateFallbackHeadline(content, authority),
            impact: this.generateFallbackImpact(content, impactLevel),
            area: this.detectRegulatoryArea(content),
            impactLevel,
            urgency,
            sector: detectedSectors[0],
            primarySectors: detectedSectors,
            sectorRelevanceScores,
            keyDates: this.extractFallbackDates(content),
            complianceActions: this.generateFallbackActions(content),
            riskLevel: businessImpactScore >= 7 ? 'High' : businessImpactScore >= 5 ? 'Medium' : 'Low',
            businessImpactScore,
            aiConfidenceScore: 0.6, // Lower confidence for fallback
            aiTags: this.generateAITags({ impactLevel, urgency, primarySectors: detectedSectors }, content),
            implementationPhases: this.generateImplementationPhases({ impactLevel, area: this.detectRegulatoryArea(content) }),
            requiredResources: this.calculateRequiredResources({ impactLevel }, businessImpactScore),
            firmTypesAffected: detectedSectors,
            fallbackAnalysis: true,
            enhancedAt: new Date().toISOString()
        };
        
        return fallbackAnalysis;
    }

    // FALLBACK HELPER METHODS
    generateFallbackHeadline(content, authority) {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const firstLine = lines[0] || 'Regulatory Update';
        
        let headline = firstLine.substring(0, 100).trim();
        if (headline.length < 20 && lines.length > 1) {
            headline = lines[1].substring(0, 100).trim();
        }
        
        // Add authority if not present
        if (!headline.toLowerCase().includes(authority.toLowerCase()) && authority !== 'Unknown') {
            headline = `${authority}: ${headline}`;
        }
        
        return headline.substring(0, 120);
    }

    generateFallbackImpact(content, impactLevel) {
        const text = content.substring(0, 500);
        
        if (impactLevel === 'Significant') {
            return `This appears to be a significant regulatory development that may require immediate attention and compliance action. ${text.substring(0, 200)}...`;
        } else if (impactLevel === 'Moderate') {
            return `This regulatory update may impact business operations and should be reviewed for compliance implications. ${text.substring(0, 200)}...`;
        } else {
            return `This is an informational regulatory update for awareness. ${text.substring(0, 250)}...`;
        }
    }

    detectRegulatoryArea(content) {
        const text = content.toLowerCase();
        
        const areas = [
            { keywords: ['capital', 'capital requirements', 'basel'], area: 'Capital Requirements' },
            { keywords: ['conduct', 'treating customers fairly', 'consumer'], area: 'Conduct of Business' },
            { keywords: ['anti-money laundering', 'aml', 'financial crime'], area: 'Financial Crime' },
            { keywords: ['data protection', 'gdpr', 'privacy'], area: 'Data Protection' },
            { keywords: ['market abuse', 'insider dealing', 'market integrity'], area: 'Market Abuse' },
            { keywords: ['prudential', 'prudential regulation', 'safety and soundness'], area: 'Prudential Regulation' },
            { keywords: ['operational resilience', 'business continuity'], area: 'Operational Resilience' },
            { keywords: ['remuneration', 'bonus', 'variable pay'], area: 'Remuneration' },
            { keywords: ['governance', 'senior managers regime', 'smr'], area: 'Governance' },
            { keywords: ['reporting', 'regulatory reporting', 'returns'], area: 'Regulatory Reporting' }
        ];
        
        for (const areaData of areas) {
            if (areaData.keywords.some(keyword => text.includes(keyword))) {
                return areaData.area;
            }
        }
        
        return 'General Regulation';
    }

    extractFallbackDates(content) {
        const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
        const matches = content.match(dateRegex) || [];
        
        if (matches.length > 0) {
            return `Key dates mentioned: ${matches.slice(0, 3).join(', ')}`;
        }
        
        return 'No specific dates identified';
    }

    generateFallbackActions(content) {
        const text = content.toLowerCase();
        const actions = [];
        
        if (text.includes('consultation')) {
            actions.push('Review consultation and consider response');
        }
        if (text.includes('deadline') || text.includes('implementation')) {
            actions.push('Note deadline and plan implementation');
        }
        if (text.includes('guidance')) {
            actions.push('Review guidance and assess compliance implications');
        }
        if (text.includes('rule') || text.includes('regulation')) {
            actions.push('Conduct gap analysis and update policies');
        }
        
        if (actions.length === 0) {
            actions.push('Review for potential business impact');
        }
        
        return actions.join('; ');
    }

    // UPDATED GROQ API REQUEST METHOD WITH MODEL FALLBACK
    async makeGroqRequest(prompt, retryCount = 0, modelIndex = 0) {
        if (!this.apiKey) {
            throw new Error('GROQ_API_KEY not configured');
        }

        // Add rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();    
        
        // Select model from fallback chain
        const modelToUse = this.modelFallbackChain[modelIndex] || this.modelFallbackChain[0];
        
        try {
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model: modelToUse,
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
                    max_tokens: 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.requestTimeout
                }
            );

            // Update current model on success
            this.currentModel = modelToUse;
            
            // Reset failure count for successful model
            this.modelFailureCount.set(modelToUse, 0);
            
            return response.data;

        } catch (error) {
            console.error(`❌ Error with model ${modelToUse}:`, error.response?.data?.error || error.message);
            
            // Track model failures
            const failCount = (this.modelFailureCount.get(modelToUse) || 0) + 1;
            this.modelFailureCount.set(modelToUse, failCount);
            
            // Handle specific error types
            if (error.response?.status === 429) {
                const waitTime = Math.pow(2, retryCount) * 10000; // Exponential backoff: 10s, 20s, 40s
                console.warn(`⚠️ Rate limited, waiting ${waitTime/1000}s before retry ${retryCount + 1}/${this.maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else if (error.response?.data?.error) {
                // Check if model is decommissioned or unavailable
                const errorMessage = typeof error.response.data.error === 'string' 
                    ? error.response.data.error 
                    : error.response.data.error.message || JSON.stringify(error.response.data.error);
                    
                if (errorMessage.includes('model') || errorMessage.includes('decommissioned')) {
                    // Model error - try next model in chain
                    if (modelIndex < this.modelFallbackChain.length - 1) {
                        console.log(`🔄 Model ${modelToUse} failed, trying fallback model ${this.modelFallbackChain[modelIndex + 1]}`);
                        return this.makeGroqRequest(prompt, 0, modelIndex + 1); // Reset retry count, increment model index
                    }
                }
            }
            
            // Standard retry logic
            if (retryCount < this.maxRetries) {
                console.warn(`⚠️ AI request failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error.message);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
                return this.makeGroqRequest(prompt, retryCount + 1, modelIndex);
            }
            
            throw error;
        }
    }

    // PARSE AND VALIDATE AI RESPONSE
    parseAndValidateAIResponse(response, content, url) {
        try {
            // Clean the response to extract JSON
            let cleanedResponse = response.trim();
            
            // Remove markdown code blocks if present
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Find JSON object boundaries
            const jsonStart = cleanedResponse.indexOf('{');
            const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error('No JSON object found in response');
            }
            
            const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
            const parsed = JSON.parse(jsonString);
            
            // Validate required fields
            const requiredFields = ['headline', 'impact', 'area', 'impactLevel', 'urgency'];
            for (const field of requiredFields) {
                if (!parsed[field]) {
                    console.warn(`⚠️ Missing required field: ${field}`);
                }
            }
            
            // Validate enum values
            const validImpactLevels = ['Significant', 'Moderate', 'Informational'];
            const validUrgencyLevels = ['High', 'Medium', 'Low'];
            
            if (!validImpactLevels.includes(parsed.impactLevel)) {
                parsed.impactLevel = 'Moderate'; // Default fallback
            }
            
            if (!validUrgencyLevels.includes(parsed.urgency)) {
                parsed.urgency = 'Medium'; // Default fallback
            }
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Failed to parse AI response:', error.message);
            console.error('Raw response:', response.substring(0, 500));
            return null;
        }
    }

    // WEEKLY ROUNDUP GENERATION
    async generateWeeklyRoundup(updates) {
        console.log('📊 Generating AI-powered weekly roundup...');
        
        try {
            const cacheKey = this.getWeekCacheKey();
            
            // Check cache first
            if (this.weeklyRoundupCache.has(cacheKey)) {
                const cached = this.weeklyRoundupCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheExpiry) {
                    console.log('📋 Returning cached weekly roundup');
                    return cached.data;
                }
            }
            
            const roundup = await this.createWeeklyRoundup(updates);
            
            // Cache the result
            this.weeklyRoundupCache.set(cacheKey, {
                data: roundup,
                timestamp: Date.now()
            });
            
            return roundup;
            
        } catch (error) {
            console.error('❌ Weekly roundup generation failed:', error);
            return this.createBasicWeeklyRoundup(updates);
        }
    }

    async createWeeklyRoundup(updates) {
        const prompt = this.buildWeeklyRoundupPrompt(updates);
        const response = await this.makeGroqRequest(prompt);
        
        if (response?.choices?.[0]?.message?.content) {
            try {
                const aiRoundup = JSON.parse(response.choices[0].message.content);
                return this.enhanceWeeklyRoundup(aiRoundup, updates);
            } catch (error) {
                console.warn('Failed to parse weekly roundup, using fallback');
                return this.createBasicWeeklyRoundup(updates);
            }
        }
        
        return this.createBasicWeeklyRoundup(updates);
    }

    buildWeeklyRoundupPrompt(updates) {
        const updateSummaries = updates.slice(0, 20).map(u => 
            `${u.authority}: ${u.headline} (Impact: ${u.impactLevel || 'Unknown'})`
        ).join('\n');

        return `Analyze this week's regulatory activity and create an executive summary:

This week's updates (${updates.length} total):
${updateSummaries}

Create a JSON response with this structure:
{
    "weekSummary": "2-3 sentence executive summary of the week",
    "keyThemes": ["Theme 1", "Theme 2", "Theme 3"],
    "topAuthorities": [
        {"authority": "FCA", "updateCount": 5, "focusArea": "Consumer protection"},
        {"authority": "PRA", "updateCount": 3, "focusArea": "Capital requirements"}
    ],
    "highImpactUpdates": [
        {"headline": "Update headline", "authority": "FCA", "impact": "Why this matters"}
    ],
    "sectorInsights": {
        "Banking": "Key developments affecting banks",
        "Investment Management": "Key developments affecting investment firms"
    },
    "upcomingDeadlines": ["Deadline 1", "Deadline 2"],
    "weeklyPriorities": ["Priority 1", "Priority 2", "Priority 3"]
}

Focus on practical business intelligence and actionable insights.`;
    }

    enhanceWeeklyRoundup(aiRoundup, updates) {
        // Add statistical analysis
        const stats = this.calculateWeeklyStats(updates);
        
        return {
            ...aiRoundup,
            statistics: stats,
            totalUpdates: updates.length,
            weekStart: this.getWeekStart(),
            generatedAt: new Date().toISOString(),
            dataQuality: {
                aiGenerated: true,
                confidence: 0.85,
                sourceCount: updates.length
            }
        };
    }

    calculateWeeklyStats(updates) {
        const authorities = {};
        const sectors = {};
        const impactLevels = { Significant: 0, Moderate: 0, Informational: 0 };
        
        updates.forEach(update => {
            // Count by authority
            authorities[update.authority] = (authorities[update.authority] || 0) + 1;
            
            // Count by impact level
            if (update.impactLevel) {
                impactLevels[update.impactLevel]++;
            }
            
            // Count by sector
            if (update.primarySectors) {
                update.primarySectors.forEach(sector => {
                    sectors[sector] = (sectors[sector] || 0) + 1;
                });
            }
        });
        
        return {
            authorityBreakdown: authorities,
            sectorBreakdown: sectors,
            impactBreakdown: impactLevels,
            avgImpactScore: this.calculateAverageImpactScore(updates)
        };
    }

    calculateAverageImpactScore(updates) {
        const scoresWithValues = updates
            .filter(u => u.businessImpactScore && u.businessImpactScore > 0)
            .map(u => u.businessImpactScore);
            
        if (scoresWithValues.length === 0) return 0;
        
        return Math.round(scoresWithValues.reduce((a, b) => a + b, 0) / scoresWithValues.length * 10) / 10;
    }

    createBasicWeeklyRoundup(updates) {
        const authorities = {};
        updates.forEach(update => {
            authorities[update.authority] = (authorities[update.authority] || 0) + 1;
        });
        
        const topAuthorities = Object.entries(authorities)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([authority, count]) => ({ authority, updateCount: count, focusArea: 'Multiple areas' }));
        
        return {
            weekSummary: `${updates.length} regulatory updates published this week across ${Object.keys(authorities).length} authorities.`,
            keyThemes: ['Regulatory Updates', 'Policy Changes', 'Industry Guidance'],
            topAuthorities,
            highImpactUpdates: updates.filter(u => u.impactLevel === 'Significant').slice(0, 3)
                .map(u => ({ headline: u.headline, authority: u.authority, impact: u.impact || 'High impact regulatory change' })),
            sectorInsights: {
                'All Sectors': 'Multiple regulatory developments affecting various sectors'
            },
            upcomingDeadlines: [],
            weeklyPriorities: ['Review new updates', 'Assess compliance implications', 'Update internal policies'],
            statistics: this.calculateWeeklyStats(updates),
            totalUpdates: updates.length,
            weekStart: this.getWeekStart(),
            generatedAt: new Date().toISOString(),
            dataQuality: {
                aiGenerated: false,
                confidence: 0.6,
                sourceCount: updates.length
            }
        };
    }

    // UTILITY METHODS
    getWeekCacheKey() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return `week-${weekStart.toISOString().split('T')[0]}`;
    }

    getWeekStart() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        return weekStart.toISOString().split('T')[0];
    }

    // HEALTH CHECK METHOD
    async healthCheck() {
        try {
            if (!this.apiKey) {
                return { status: 'unhealthy', reason: 'API key not configured' };
            }
            
            const testPrompt = 'Respond with JSON: {"status": "healthy", "service": "ai_analyzer"}';
            const response = await this.makeGroqRequest(testPrompt);
            
            if (response?.choices?.[0]?.message?.content) {
                return { 
                    status: 'healthy', 
                    service: 'ai_analyzer', 
                    currentModel: this.currentModel,
                    modelChain: this.modelFallbackChain,
                    timestamp: new Date().toISOString() 
                };
            } else {
                return { status: 'unhealthy', reason: 'Invalid API response' };
            }
            
        } catch (error) {
            return { status: 'unhealthy', reason: error.message };
        }
    }
}

module.exports = new EnhancedAIAnalyzer();