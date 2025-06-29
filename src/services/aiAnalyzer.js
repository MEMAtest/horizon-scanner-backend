// src/services/aiAnalyzer.js
// AI-powered content analysis for regulatory updates with enhanced error handling and efficiency

const axios = require('axios');
const cheerio = require('cheerio');
const dbService = require('./dbService.js');

const AI_PROVIDER_CONFIG = {
    apiKey: process.env.GROQ_API_KEY, 
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant",
    maxRetries: 3,
    retryDelay: 2000
};

const scrapeArticleContent = async (url) => {
    console.log(`🔍 Scraping content from: ${url}`);
    
    try {
        const { data } = await axios.get(url, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }, 
            timeout: 15000,
            maxRedirects: 5
        });
        
        const $ = cheerio.load(data);
        
        // Remove unwanted elements
        $('script, style, nav, header, footer, .advertisement, .social-media, .cookie-banner').remove();
        
        // Try multiple content selectors in order of preference
        const contentSelectors = [
            'main article .content',
            'main article',
            '.article-content',
            '.post-content',
            '.content-body',
            'main',
            'article',
            '.main-content'
        ];
        
        let articleText = '';
        
        for (const selector of contentSelectors) {
            const content = $(selector);
            if (content.length > 0) {
                articleText = content.text();
                if (articleText.length > 200) {
                    console.log(`✅ Content extracted using selector: ${selector}`);
                    break;
                }
            }
        }
        
        // Fallback to body if no good content found
        if (!articleText || articleText.length < 200) {
            articleText = $('body').text();
            console.log('⚠️ Using fallback body text extraction');
        }
        
        // Clean and process text
        const cleanedText = articleText
            .replace(/\s\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .replace(/[^\w\s\.,;:!?\-()]/g, '')
            .trim();
        
        if (cleanedText.length < 100) {
            throw new Error('Insufficient content extracted');
        }
        
        // Limit content size for AI processing
        const maxLength = 4000;
        const finalText = cleanedText.length > maxLength ? 
            cleanedText.substring(0, maxLength) + '...' : cleanedText;
        
        console.log(`✅ Extracted ${finalText.length} characters of content`);
        return finalText;
        
    } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
        return null;
    }
};

const extractJSONFromResponse = (textResponse) => {
    if (!textResponse) return null;
    
    // Try direct JSON parse first
    try { 
        return JSON.parse(textResponse); 
    } catch (e) { 
        // Continue to other methods
    }
    
    // Try extracting from markdown code blocks
    const markdownMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) {
        try { 
            return JSON.parse(markdownMatch[1]); 
        } catch(e) { 
            console.log('Failed to parse markdown JSON');
        }
    }
    
    // Try finding JSON object in text
    const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
        try { 
            return JSON.parse(jsonMatch[0]); 
        } catch(e) { 
            console.log('Failed to parse extracted JSON');
        }
    }
    
    console.error('❌ Failed to extract valid JSON from AI response');
    return null;
};

const buildAnalysisPrompt = (articleText, articleUrl) => {
    return `Analyze this UK regulatory article and respond with ONLY a valid JSON object.

ARTICLE CONTENT:
${articleText}

SOURCE URL: ${articleUrl}

Analyze the regulatory impact and respond with this exact JSON structure:

{
  "headline": "Clear, professional headline summarizing the key regulatory change",
  "impact": "2-3 sentence summary of what this means for financial services firms",
  "area": "Specific regulatory area (e.g., Consumer Duty, Capital Requirements, AML, etc.)",
  "authority": "Exact authority name: FCA, BoE, PRA, TPR, SFO, or FATF",
  "impactLevel": "Significant, Moderate, or Informational",
  "urgency": "High, Medium, or Low",
  "sector": "Most affected sector: Banking, Investment Management, Insurance, Pensions, Payments, Consumer Credit, or General",
  "keyDates": "Important dates mentioned (deadlines, implementation dates) or 'None specified'",
  "primary_sectors": ["Array of affected sectors from: Banking, Investment Management, Insurance, Pensions, Payments, Consumer Credit"],
  "sector_relevance_scores": {
    "Banking": 0-100,
    "Investment Management": 0-100,
    "Insurance": 0-100,
    "Pensions": 0-100,
    "Payments": 0-100,
    "Consumer Credit": 0-100
  }
}

IMPORTANT GUIDELINES:
- Keep headline under 100 characters
- Impact must be business-focused and actionable
- Authority must be exact match from the list
- Sector relevance scores should total impact across sectors (0-100 each)
- Primary sectors should include top 2-3 most affected sectors
- Be precise with impactLevel and urgency based on regulatory significance

Respond with ONLY the JSON object, no additional text.`;
};

const analyzeContentWithAI = async (articleText, articleUrl) => {
    console.log(`\n🤖 === AI ANALYSIS START for ${articleUrl} ===`);
    
    if (!AI_PROVIDER_CONFIG.apiKey) {
        console.error('❌ GROQ_API_KEY not set. Cannot perform AI analysis.');
        return null;
    }
    
    const prompt = buildAnalysisPrompt(articleText, articleUrl);
    
    let retryCount = 0;
    
    while (retryCount < AI_PROVIDER_CONFIG.maxRetries) {
        try {
            const payload = {
                model: AI_PROVIDER_CONFIG.model,
                messages: [
                    { 
                        role: "system", 
                        content: "You are a UK financial regulatory expert. Analyze regulatory content and provide structured insights in JSON format. Be precise, professional, and focus on business impact." 
                    },
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1,
                top_p: 0.9
            };

            console.log(`🤖 Sending request to AI (attempt ${retryCount + 1}/${AI_PROVIDER_CONFIG.maxRetries})`);
            
            const response = await axios.post(AI_PROVIDER_CONFIG.apiUrl, payload, {
                headers: { 
                    'Authorization': `Bearer ${AI_PROVIDER_CONFIG.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const textResponse = response.data?.choices?.[0]?.message?.content?.trim();
            
            if (!textResponse) {
                throw new Error('Invalid response structure from AI API');
            }

            console.log(`🤖 Received AI response (${textResponse.length} characters)`);
            
            const analyzedData = extractJSONFromResponse(textResponse);
            
            if (!analyzedData) {
                throw new Error('Failed to extract JSON from AI response');
            }
            
            // Validate required fields
            const requiredFields = ['headline', 'impact', 'area', 'authority', 'impactLevel', 'urgency', 'sector'];
            const missingFields = requiredFields.filter(field => !analyzedData[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }
            
            // Add metadata
            analyzedData.url = articleUrl;
            analyzedData.fetchedDate = new Date().toISOString();
            analyzedData.analysisVersion = '2.0';
            analyzedData.processingTime = Date.now();
            
            // Ensure sector relevance scores exist
            if (!analyzedData.sector_relevance_scores) {
                analyzedData.sector_relevance_scores = {
                    "Banking": 0,
                    "Investment Management": 0,
                    "Insurance": 0,
                    "Pensions": 0,
                    "Payments": 0,
                    "Consumer Credit": 0
                };
            }
            
            // Ensure primary sectors exist
            if (!analyzedData.primary_sectors) {
                analyzedData.primary_sectors = [analyzedData.sector];
            }
            
            // Save to database
            try {
                await dbService.saveUpdate(analyzedData);
                console.log(`✅ Successfully analyzed and saved: ${analyzedData.headline.substring(0, 60)}...`);
            } catch (dbError) {
                console.error(`❌ Database save failed: ${dbError.message}`);
                // Still return the analysis even if DB save fails
            }
            
            return analyzedData;
            
        } catch (error) {
            retryCount++;
            console.error(`❌ AI analysis attempt ${retryCount} failed:`, error.message);
            
            if (retryCount < AI_PROVIDER_CONFIG.maxRetries) {
                console.log(`⏳ Retrying in ${AI_PROVIDER_CONFIG.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, AI_PROVIDER_CONFIG.retryDelay));
            } else {
                console.error(`❌ AI analysis failed after ${AI_PROVIDER_CONFIG.maxRetries} attempts`);
                return null;
            }
        }
    }
    
    console.log(`🤖 === AI ANALYSIS END ===\n`);
    return null;
};

// Batch processing with rate limiting
const analyzeMultipleContents = async (contentItems, maxConcurrent = 3) => {
    console.log(`🤖 Starting batch analysis of ${contentItems.length} items`);
    
    const results = [];
    const errors = [];
    
    // Process in batches to avoid rate limiting
    for (let i = 0; i < contentItems.length; i += maxConcurrent) {
        const batch = contentItems.slice(i, i + maxConcurrent);
        console.log(`🤖 Processing batch ${Math.floor(i/maxConcurrent) + 1}/${Math.ceil(contentItems.length/maxConcurrent)}`);
        
        const batchPromises = batch.map(async (item) => {
            try {
                const content = await scrapeArticleContent(item.url);
                if (!content) return null;
                
                const analysis = await analyzeContentWithAI(content, item.url);
                return analysis;
            } catch (error) {
                errors.push({ url: item.url, error: error.message });
                return null;
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(result => result !== null));
        
        // Rate limiting delay between batches
        if (i + maxConcurrent < contentItems.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log(`🤖 Batch analysis complete: ${results.length} successful, ${errors.length} errors`);
    
    return { results, errors };
};

module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI,
    analyzeMultipleContents,
    extractJSONFromResponse,
    buildAnalysisPrompt,
    INDUSTRY_SECTORS: [
        'Banking', 'Investment Management', 'Consumer Credit',
        'Insurance', 'Payments', 'Pensions', 'Mortgages',
        'Capital Markets', 'Cryptocurrency', 'Fintech', 'General'
    ]
};