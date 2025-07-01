// src/services/aiAnalyzer.js
// ENHANCED AI ANALYZER: Robust Content Processing + Advanced Sector Analysis + Error Handling
// INTEGRATED: Works seamlessly with enhanced scraper and RSS fetcher for excellence-grade analysis

const axios = require('axios');
const cheerio = require('cheerio');

// Enhanced industry sector definitions with more granular categorization
const INDUSTRY_SECTORS = [
    'Banking',
    'Investment Management', 
    'Consumer Credit',
    'Insurance',
    'Payments',
    'Pensions',
    'Mortgages',
    'Capital Markets',
    'Cryptocurrency',
    'Fintech',
    'AML & Financial Crime',
    'Audit & Accounting',
    'Professional Services',
    'General'
];

// Enhanced authority-specific sector mappings
const AUTHORITY_SECTOR_MAPPINGS = {
    'FCA': ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance', 'Payments', 'Capital Markets', 'Cryptocurrency', 'Fintech'],
    'PRA': ['Banking', 'Insurance', 'Capital Markets'],
    'BoE': ['Banking', 'Capital Markets', 'Payments', 'Fintech'],
    'TPR': ['Pensions'],
    'SFO': ['AML & Financial Crime', 'Banking', 'Investment Management'],
    'FATF': ['AML & Financial Crime', 'Banking', 'Payments', 'Cryptocurrency'],
    'FRC': ['Audit & Accounting', 'Professional Services'],
    'JMLSG': ['AML & Financial Crime', 'Banking'],
    'ESMA': ['Capital Markets', 'Investment Management', 'Cryptocurrency']
};

class EnhancedAIAnalyzer {
    constructor() {
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.1-8b-instant';
        
        this.requestTimeout = 30000; // 30 seconds
        this.maxRetries = 3;
        this.rateLimitDelay = 1000; // 1 second between requests
        
        // Enhanced content extraction selectors
        this.contentSelectors = [
            'article',
            '.article-content',
            '.content',
            '.post-content',
            '.entry-content',
            '.news-content',
            '.press-release-content',
            'main',
            '.main-content',
            '#content',
            '#main',
            '.publication-content',
            '.document-content'
        ];
        
        // Enhanced cleaning patterns
        this.cleaningPatterns = [
            /<!--[\s\S]*?-->/g, // HTML comments
            /<script[\s\S]*?<\/script>/gi, // Script tags
            /<style[\s\S]*?<\/style>/gi, // Style tags
            /<noscript[\s\S]*?<\/noscript>/gi, // Noscript tags
            /\[if[\s\S]*?\[endif\]/gi, // IE conditional comments
            /window\.__[\s\S]*?};/g, // JavaScript objects
            /\s{3,}/g, // Multiple whitespace
            /\n{3,}/g // Multiple newlines
        ];
    }

    // ENHANCED ARTICLE CONTENT SCRAPING with multiple strategies
    async scrapeArticleContent(url) {
        console.log(`🔍 Enhanced content scraping for: ${url}`);
        
        try {
            // Enhanced request with multiple user agents and retry logic
            const response = await this.makeRobustRequest(url);
            const $ = cheerio.load(response.data);
            
            // Strategy 1: Try specific content selectors
            let content = this.extractContentWithSelectors($);
            
            // Strategy 2: Try semantic content extraction
            if (!content || content.length < 100) {
                content = this.extractSemanticContent($);
            }
            
            // Strategy 3: Try paragraph-based extraction
            if (!content || content.length < 100) {
                content = this.extractParagraphContent($);
            }
            
            // Strategy 4: Fallback to body content with smart filtering
            if (!content || content.length < 100) {
                content = this.extractBodyContent($);
            }
            
            if (!content || content.length < 50) {
                throw new Error('Insufficient content extracted');
            }
            
            // Enhanced content cleaning and validation
            const cleanedContent = this.enhancedContentCleaning(content);
            const validatedContent = this.validateExtractedContent(cleanedContent);
            
            if (!validatedContent.isValid) {
                throw new Error(`Content validation failed: ${validatedContent.reason}`);
            }
            
            console.log(`✅ Successfully extracted ${cleanedContent.length} characters of content`);
            return cleanedContent;
            
        } catch (error) {
            console.error(`❌ Content scraping failed for ${url}:`, error.message);
            throw error;
        }
    }

    // ENHANCED ROBUST HTTP REQUEST
    async makeRobustRequest(url, attempt = 1) {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        
        const userAgent = userAgents[attempt % userAgents.length];
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: this.requestTimeout,
                maxRedirects: 5,
                validateStatus: (status) => status < 500
            });
            
            if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            if (attempt < this.maxRetries) {
                console.log(`⚠️ Request attempt ${attempt} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * attempt));
                return this.makeRobustRequest(url, attempt + 1);
            }
            throw error;
        }
    }

    // CONTENT EXTRACTION STRATEGIES
    extractContentWithSelectors($) {
        for (const selector of this.contentSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const content = element.text().trim();
                if (content.length > 200) {
                    console.log(`✅ Content found with selector: ${selector}`);
                    return content;
                }
            }
        }
        return null;
    }

    extractSemanticContent($) {
        // Look for semantic HTML5 elements
        const semanticSelectors = [
            'main article',
            'main section',
            '[role="main"] article',
            '[role="main"]',
            '.content-wrapper',
            '.page-content',
            '.article-wrapper'
        ];
        
        for (const selector of semanticSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                const content = element.text().trim();
                if (content.length > 200) {
                    console.log(`✅ Semantic content found with: ${selector}`);
                    return content;
                }
            }
        }
        return null;
    }

    extractParagraphContent($) {
        // Extract content from paragraphs, filtering out navigation and footer content
        const paragraphs = $('p').filter((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            
            // Filter out short paragraphs and navigation elements
            if (text.length < 30) return false;
            
            // Filter out common navigation/footer content
            const parent = $el.closest('nav, footer, aside, .nav, .footer, .sidebar, .menu');
            if (parent.length > 0) return false;
            
            return true;
        });
        
        if (paragraphs.length > 0) {
            const content = paragraphs.map((i, el) => $(el).text().trim()).get().join('\n\n');
            if (content.length > 200) {
                console.log(`✅ Paragraph-based content extracted: ${paragraphs.length} paragraphs`);
                return content;
            }
        }
        
        return null;
    }

    extractBodyContent($) {
        // Fallback: extract from body but filter out navigation, footer, etc.
        const $body = $('body').clone();
        
        // Remove unwanted elements
        $body.find('nav, footer, aside, script, style, noscript, .nav, .footer, .sidebar, .menu, .advertisement, .ads').remove();
        
        const content = $body.text().trim();
        if (content.length > 200) {
            console.log(`✅ Body content extracted as fallback`);
            return content;
        }
        
        return null;
    }

    // ENHANCED CONTENT CLEANING
    enhancedContentCleaning(content) {
        if (!content) return '';
        
        let cleaned = content;
        
        // Apply cleaning patterns
        for (const pattern of this.cleaningPatterns) {
            cleaned = cleaned.replace(pattern, ' ');
        }
        
        // Enhanced text cleaning
        cleaned = cleaned
            .replace(/\s*\n\s*/g, '\n') // Normalize line breaks
            .replace(/\t+/g, ' ') // Replace tabs with spaces
            .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
            .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
            .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-ASCII characters except newlines
            .trim();
        
        // Remove common website boilerplate
        const boilerplatePatterns = [
            /cookies?\s+policy/gi,
            /privacy\s+policy/gi,
            /terms\s+(of\s+)?(use|service)/gi,
            /all\s+rights\s+reserved/gi,
            /copyright\s+\d{4}/gi,
            /subscribe\s+to\s+newsletter/gi,
            /follow\s+us\s+on/gi,
            /share\s+this\s+article/gi
        ];
        
        for (const pattern of boilerplatePatterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        return cleaned.trim();
    }

    // CONTENT VALIDATION
    validateExtractedContent(content) {
        if (!content || typeof content !== 'string') {
            return { isValid: false, reason: 'No content provided' };
        }
        
        if (content.length < 50) {
            return { isValid: false, reason: 'Content too short' };
        }
        
        if (content.length > 50000) {
            return { isValid: false, reason: 'Content suspiciously long' };
        }
        
        // Check for minimum word count
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 20) {
            return { isValid: false, reason: 'Insufficient word count' };
        }
        
        // Check for repetitive content
        const uniqueWords = new Set(content.toLowerCase().split(/\s+/));
        const uniquenessRatio = uniqueWords.size / wordCount;
        if (uniquenessRatio < 0.3) {
            return { isValid: false, reason: 'Content appears repetitive' };
        }
        
        // Check for regulatory relevance indicators
        const regulatoryKeywords = [
            'regulation', 'regulatory', 'compliance', 'guidance', 'policy',
            'directive', 'framework', 'standard', 'requirement', 'rule',
            'conduct', 'supervision', 'oversight', 'enforcement', 'consultation',
            'financial', 'banking', 'investment', 'insurance', 'pension'
        ];
        
        const hasRegulatoryContent = regulatoryKeywords.some(keyword => 
            content.toLowerCase().includes(keyword)
        );
        
        if (!hasRegulatoryContent) {
            return { isValid: false, reason: 'Content does not appear regulatory in nature' };
        }
        
        return { isValid: true, reason: 'Content validation passed' };
    }

    // ENHANCED AI ANALYSIS with robust error handling and fallbacks
    async analyzeContentWithAI(content, url) {
        if (!this.groqApiKey) {
            console.log('⚠️ No Groq API key available, using enhanced fallback analysis');
            return this.createEnhancedFallbackAnalysis(content, url);
        }

        try {
            console.log(`🤖 Starting enhanced AI analysis for content (${content.length} chars)`);
            
            const enhancedPrompt = this.createEnhancedAnalysisPrompt(content, url);
            
            const response = await this.makeGroqRequest(enhancedPrompt);
            
            if (!response || !response.choices || !response.choices[0]) {
                throw new Error('Invalid response format from Groq API');
            }
            
            const aiResponse = response.choices[0].message.content;
            const parsedAnalysis = this.parseAndValidateAIResponse(aiResponse, content, url);
            
            if (!parsedAnalysis) {
                throw new Error('Failed to parse AI response');
            }
            
            console.log(`✅ Enhanced AI analysis completed successfully`);
            return parsedAnalysis;
            
        } catch (error) {
            console.error(`❌ Enhanced AI analysis failed:`, error.message);
            
            // Enhanced fallback analysis
            console.log('🔄 Using enhanced fallback analysis with sector intelligence');
            return this.createEnhancedFallbackAnalysis(content, url);
        }
    }

    // ENHANCED ANALYSIS PROMPT
    createEnhancedAnalysisPrompt(content, url) {
        return `You are an expert regulatory intelligence analyst specializing in UK and international financial services regulation. 

Analyze this regulatory content and provide a comprehensive structured response:

CONTENT TO ANALYZE:
${content.substring(0, 4000)}

URL SOURCE: ${url}

ANALYSIS REQUIREMENTS:
1. Create a clear, professional headline (max 120 characters)
2. Provide a concise business impact summary (max 300 words)
3. Identify the regulatory area/topic
4. Determine impact level: Significant, Moderate, or Informational
5. Assess urgency: High, Medium, or Low
6. Identify ALL relevant industry sectors from this list: ${INDUSTRY_SECTORS.join(', ')}
7. Provide sector-specific relevance scores (0-100) for each identified sector
8. Extract any key dates, deadlines, or implementation timeframes
9. Identify any compliance requirements or actions needed

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "headline": "Clear, professional headline",
  "impact": "Concise business impact summary",
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
  "riskLevel": "High|Medium|Low"
}

Ensure accuracy and professionalism. Focus on business impact and actionable insights.`;
    }

    // ENHANCED GROQ API REQUEST
    async makeGroqRequest(prompt, attempt = 1) {
        try {
            const response = await axios.post(this.groqApiUrl, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a regulatory intelligence expert. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 1500,
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

    // ENHANCED AI RESPONSE PARSING
    parseAndValidateAIResponse(aiResponse, content, url) {
        try {
            // Clean the response to extract JSON
            let cleanedResponse = aiResponse.trim();
            
            // Remove any markdown formatting
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Find JSON object boundaries
            const jsonStart = cleanedResponse.indexOf('{');
            const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error('No valid JSON found in AI response');
            }
            
            const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
            const parsed = JSON.parse(jsonString);
            
            // Enhanced validation and enrichment
            const validated = this.validateAndEnrichAnalysis(parsed, content, url);
            
            return validated;
            
        } catch (error) {
            console.error('❌ Failed to parse AI response:', error.message);
            console.log('Raw AI response:', aiResponse.substring(0, 500));
            return null;
        }
    }

    // VALIDATE AND ENRICH ANALYSIS
    validateAndEnrichAnalysis(analysis, content, url) {
        // Ensure required fields exist
        const enriched = {
            headline: analysis.headline || 'Regulatory Update',
            impact: analysis.impact || 'Impact assessment unavailable',
            area: analysis.area || 'General Regulatory',
            impactLevel: this.validateImpactLevel(analysis.impactLevel),
            urgency: this.validateUrgency(analysis.urgency),
            sector: analysis.sector || 'General',
            primarySectors: this.validateSectors(analysis.primarySectors),
            sectorRelevanceScores: this.validateRelevanceScores(analysis.sectorRelevanceScores),
            keyDates: analysis.keyDates || 'No specific dates mentioned',
            complianceActions: analysis.complianceActions || 'No specific actions required',
            riskLevel: this.validateRiskLevel(analysis.riskLevel),
            url: url,
            fetchedDate: new Date().toISOString(),
            analysisMethod: 'enhanced_ai_analysis'
        };
        
        // Add authority detection from URL
        enriched.authority = this.detectAuthorityFromUrl(url);
        
        // Enhance sector relevance if missing
        if (!enriched.sectorRelevanceScores || Object.keys(enriched.sectorRelevanceScores).length === 0) {
            enriched.sectorRelevanceScores = this.generateSectorRelevanceScores(enriched.primarySectors, enriched.authority);
        }
        
        return enriched;
    }

    // VALIDATION HELPERS
    validateImpactLevel(level) {
        const validLevels = ['Significant', 'Moderate', 'Informational'];
        return validLevels.includes(level) ? level : 'Informational';
    }

    validateUrgency(urgency) {
        const validUrgencies = ['High', 'Medium', 'Low'];
        return validUrgencies.includes(urgency) ? urgency : 'Low';
    }

    validateRiskLevel(risk) {
        const validRisks = ['High', 'Medium', 'Low'];
        return validRisks.includes(risk) ? risk : 'Low';
    }

    validateSectors(sectors) {
        if (!Array.isArray(sectors)) return ['General'];
        return sectors.filter(sector => INDUSTRY_SECTORS.includes(sector));
    }

    validateRelevanceScores(scores) {
        if (!scores || typeof scores !== 'object') return {};
        
        const validated = {};
        for (const [sector, score] of Object.entries(scores)) {
            if (INDUSTRY_SECTORS.includes(sector) && typeof score === 'number' && score >= 0 && score <= 100) {
                validated[sector] = Math.round(score);
            }
        }
        return validated;
    }

    // AUTHORITY DETECTION FROM URL
    detectAuthorityFromUrl(url) {
        if (!url) return 'Unknown';
        
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('fca.org.uk')) return 'FCA';
        if (urlLower.includes('bankofengland.co.uk')) return urlLower.includes('prudential') ? 'PRA' : 'BoE';
        if (urlLower.includes('thepensionsregulator.gov.uk')) return 'TPR';
        if (urlLower.includes('sfo.gov.uk')) return 'SFO';
        if (urlLower.includes('fatf-gafi.org')) return 'FATF';
        if (urlLower.includes('frc.org.uk')) return 'FRC';
        if (urlLower.includes('jmlsg.org.uk')) return 'JMLSG';
        if (urlLower.includes('esma.europa.eu')) return 'ESMA';
        
        return 'Unknown';
    }

    // GENERATE SECTOR RELEVANCE SCORES
    generateSectorRelevanceScores(primarySectors, authority) {
        const scores = {};
        
        // Get authority-specific sectors
        const authoritySectors = AUTHORITY_SECTOR_MAPPINGS[authority] || [];
        
        // Assign high scores to primary sectors
        primarySectors.forEach(sector => {
            scores[sector] = 90;
        });
        
        // Assign medium scores to authority-relevant sectors
        authoritySectors.forEach(sector => {
            if (!scores[sector]) {
                scores[sector] = 60;
            }
        });
        
        // Assign low scores to other major sectors
        ['Banking', 'Investment Management', 'Insurance'].forEach(sector => {
            if (!scores[sector]) {
                scores[sector] = 20;
            }
        });
        
        return scores;
    }

    // ENHANCED FALLBACK ANALYSIS
    createEnhancedFallbackAnalysis(content, url) {
        console.log('🔄 Creating enhanced fallback analysis with sector intelligence');
        
        const authority = this.detectAuthorityFromUrl(url);
        const analysis = this.performTextAnalysis(content);
        const sectors = this.detectSectorsFromContent(content, authority);
        
        return {
            headline: this.extractHeadlineFromContent(content),
            impact: this.extractImpactFromContent(content),
            area: analysis.area,
            authority: authority,
            impactLevel: analysis.impactLevel,
            urgency: analysis.urgency,
            sector: sectors.primary,
            primarySectors: sectors.all,
            sectorRelevanceScores: this.generateSectorRelevanceScores(sectors.all, authority),
            keyDates: this.extractDatesFromContent(content),
            complianceActions: 'Review content for specific compliance requirements',
            riskLevel: analysis.riskLevel,
            url: url,
            fetchedDate: new Date().toISOString(),
            analysisMethod: 'enhanced_fallback_analysis',
            isFallbackAnalysis: true
        };
    }

    // ENHANCED TEXT ANALYSIS
    performTextAnalysis(content) {
        const textLower = content.toLowerCase();
        
        // Impact level detection
        let impactLevel = 'Informational';
        if (textLower.includes('significant') || textLower.includes('major') || textLower.includes('critical')) {
            impactLevel = 'Significant';
        } else if (textLower.includes('important') || textLower.includes('moderate') || textLower.includes('guidance')) {
            impactLevel = 'Moderate';
        }
        
        // Urgency detection
        let urgency = 'Low';
        if (textLower.includes('urgent') || textLower.includes('immediate') || textLower.includes('deadline')) {
            urgency = 'High';
        } else if (textLower.includes('soon') || textLower.includes('required') || textLower.includes('must')) {
            urgency = 'Medium';
        }
        
        // Risk level detection
        let riskLevel = 'Low';
        if (textLower.includes('risk') || textLower.includes('concern') || textLower.includes('warning')) {
            riskLevel = 'Medium';
            if (textLower.includes('high risk') || textLower.includes('serious') || textLower.includes('enforcement')) {
                riskLevel = 'High';
            }
        }
        
        // Area detection
        let area = 'General Regulatory';
        const areaKeywords = {
            'Prudential Regulation': ['capital', 'prudential', 'solvency', 'liquidity'],
            'Conduct Regulation': ['conduct', 'consumer', 'protection', 'treating customers fairly'],
            'Market Regulation': ['market', 'trading', 'securities', 'exchange'],
            'Anti-Money Laundering': ['money laundering', 'aml', 'suspicious activity', 'financial crime'],
            'Data Protection': ['data protection', 'gdpr', 'privacy', 'personal data'],
            'Governance': ['governance', 'board', 'directors', 'management']
        };
        
        for (const [areaName, keywords] of Object.entries(areaKeywords)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                area = areaName;
                break;
            }
        }
        
        return { impactLevel, urgency, riskLevel, area };
    }

    // SECTOR DETECTION FROM CONTENT
    detectSectorsFromContent(content, authority) {
        const textLower = content.toLowerCase();
        const detectedSectors = [];
        
        const sectorKeywords = {
            'Banking': ['bank', 'banking', 'deposit', 'lending', 'credit institution'],
            'Investment Management': ['investment', 'fund management', 'asset management', 'portfolio', 'fund'],
            'Insurance': ['insurance', 'insurer', 'policy', 'claim', 'underwriting'],
            'Consumer Credit': ['consumer credit', 'retail banking', 'mortgage', 'personal loan'],
            'Capital Markets': ['capital market', 'securities', 'trading', 'exchange', 'listing'],
            'Payments': ['payment', 'payment services', 'electronic money', 'psp'],
            'Pensions': ['pension', 'retirement', 'pension scheme', 'trustee'],
            'Cryptocurrency': ['crypto', 'cryptocurrency', 'digital asset', 'virtual currency'],
            'AML & Financial Crime': ['money laundering', 'financial crime', 'suspicious activity'],
            'Fintech': ['fintech', 'financial technology', 'innovation']
        };
        
        for (const [sector, keywords] of Object.entries(sectorKeywords)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                detectedSectors.push(sector);
            }
        }
        
        // Add authority-specific sectors if none detected
        if (detectedSectors.length === 0) {
            const authoritySectors = AUTHORITY_SECTOR_MAPPINGS[authority];
            if (authoritySectors && authoritySectors.length > 0) {
                detectedSectors.push(authoritySectors[0]);
            }
        }
        
        // Fallback to General if still no sectors
        if (detectedSectors.length === 0) {
            detectedSectors.push('General');
        }
        
        return {
            all: detectedSectors,
            primary: detectedSectors[0]
        };
    }

    // CONTENT EXTRACTION HELPERS
    extractHeadlineFromContent(content) {
        // Try to extract a meaningful headline from the first few sentences
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length > 0) {
            let headline = sentences[0].trim();
            
            // Clean up the headline
            headline = headline.replace(/^(The\s+)?/i, '');
            headline = headline.substring(0, 120);
            
            if (headline.length > 10) {
                return headline;
            }
        }
        
        return 'Regulatory Update';
    }

    extractImpactFromContent(content) {
        // Extract the first meaningful paragraph as impact summary
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        if (paragraphs.length > 0) {
            let impact = paragraphs[0].trim();
            if (impact.length > 300) {
                impact = impact.substring(0, 297) + '...';
            }
            return impact;
        }
        
        return content.substring(0, 300) + (content.length > 300 ? '...' : '');
    }

    extractDatesFromContent(content) {
        const datePatterns = [
            /\b(\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi,
            /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
            /\b(\d{4}-\d{1,2}-\d{1,2})\b/g
        ];
        
        const dates = [];
        for (const pattern of datePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                dates.push(...matches.slice(0, 3));
            }
        }
        
        return dates.length > 0 ? dates.join(', ') : 'No specific dates mentioned';
    }
}

// Create and export singleton instance
const enhancedAIAnalyzer = new EnhancedAIAnalyzer();

module.exports = {
    // Primary methods
    scrapeArticleContent: (url) => enhancedAIAnalyzer.scrapeArticleContent(url),
    analyzeContentWithAI: (content, url) => enhancedAIAnalyzer.analyzeContentWithAI(content, url),
    
    // Utility methods
    validateExtractedContent: (content) => enhancedAIAnalyzer.validateExtractedContent(content),
    detectAuthorityFromUrl: (url) => enhancedAIAnalyzer.detectAuthorityFromUrl(url),
    
    // Constants
    INDUSTRY_SECTORS,
    AUTHORITY_SECTOR_MAPPINGS,
    
    // Export analyzer instance
    enhancedAIAnalyzer
};