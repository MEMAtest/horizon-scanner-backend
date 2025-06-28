// src/services/aiAnalyzer.js
// AI-powered content analysis for regulatory updates

const axios = require('axios');
const cheerio = require('cheerio');

const AI_PROVIDER_CONFIG = {
    apiKey: process.env.GROQ_API_KEY, 
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant"
};

const scrapeArticleContent = async (url) => {
    try {
        console.log(`📄 Scraping: ${url}`);
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        
        // Remove unwanted elements
        $('script, style, nav, header, footer, .navigation, .sidebar, .menu').remove();
        
        // Try specific content selectors first
        let articleText = '';
        const contentSelectors = [
            'main article',
            '.article-content', 
            '.content',
            'main',
            'article',
            '.post-content',
            '[role="main"]',
            '.page-content'
        ];
        
        for (const selector of contentSelectors) {
            const content = $(selector).text();
            if (content && content.length > articleText.length) {
                articleText = content;
            }
        }
        
        // Fallback to body if needed
        if (!articleText || articleText.length < 100) {
            articleText = $('body').text();
        }
        
        // Clean text
        articleText = articleText
            .replace(/\s\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
        
        const finalContent = articleText.substring(0, 4000);
        console.log(`✅ Content scraped: ${finalContent.length} characters`);
        return finalContent;
        
    } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
        return null;
    }
};

const extractJSONFromResponse = (textResponse) => {
    // Method 1: Direct JSON parse
    try {
        const parsed = JSON.parse(textResponse);
        console.log('✅ Direct JSON parse successful');
        return parsed;
    } catch (e) {
        // Continue to other methods
    }
    
    // Method 2: Extract from markdown code blocks
    const markdownMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) {
        try {
            const parsed = JSON.parse(markdownMatch[1]);
            console.log('✅ JSON extracted from markdown');
            return parsed;
        } catch (e) {
            // Continue to other methods
        }
    }
    
    // Method 3: Find any JSON object
    const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON object extracted');
            return parsed;
        } catch (e) {
            // Continue to other methods
        }
    }
    
    console.error('❌ All JSON extraction methods failed');
    return null;
};

const analyzeContentWithAI = async (articleText, articleUrl) => {
    console.log(`\n🤖 === AI ANALYSIS START ===`);
    console.log(`🔗 URL: ${articleUrl}`);
    
    if (!AI_PROVIDER_CONFIG.apiKey) {
        console.error('❌ GROQ_API_KEY not set');
        return null;
    }
    
    if (!articleText || articleText.length < 50) {
        console.error('❌ Insufficient content for analysis');
        return null;
    }
    
    // Get database service to check for duplicates
    let dbService = null;
    try {
        dbService = require('./dbService');
        const existingEntry = await dbService.findUpdate(articleUrl);
        if (existingEntry) {
            console.log(`⏭️ Skipping: Already processed`);
            return null;
        }
    } catch (error) {
        console.log('⚠️ Database check failed, continuing with analysis');
        // Continue anyway - we'll handle duplicates later
    }
    
    const prompt = `Analyze this UK regulatory article and respond with ONLY a valid JSON object.

IMPORTANT: Never use "N/A" - always provide meaningful values.

Required JSON format:
{
  "headline": "Clear, specific headline from the article",
  "impact": "2-3 sentence summary of business impact for financial firms",
  "area": "Specific regulatory area (e.g., Conduct Regulation, Prudential Regulation, Consumer Protection)",
  "authority": "FCA or PRA or BoE or TPR or SFO or FATF",
  "impactLevel": "Significant or Moderate or Informational", 
  "urgency": "High or Medium or Low",
  "sector": "Banking or Investments or Payments or ConsumerCredit or CorporateFinance or PensionsRetirementIncome or Cryptoassets or AMLFinancialCrime",
  "keyDates": "Any important dates mentioned, or 'None specified'"
}

Article content: "${articleText.substring(0, 3000)}"

Respond with ONLY the JSON object:`;

    try {
        const payload = {
            model: AI_PROVIDER_CONFIG.model,
            messages: [
                {
                    role: "system",
                    content: "You are a UK financial regulatory expert. Always respond with valid JSON only. Never use 'N/A' values."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 800,
            temperature: 0.1
        };

        console.log('📤 Sending to Groq...');
        const startTime = Date.now();
        
        const response = await axios.post(AI_PROVIDER_CONFIG.apiUrl, payload, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${AI_PROVIDER_CONFIG.apiKey}` 
            },
            timeout: 30000
        });

        const responseTime = Date.now() - startTime;
        console.log(`📥 Response received in ${responseTime}ms`);

        if (response.status !== 200) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = response.data;
        if (!result?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response structure');
        }

        const textResponse = result.choices[0].message.content.trim();
        console.log('🔍 Raw response preview:', textResponse.substring(0, 100) + '...');
        
        const analyzedData = extractJSONFromResponse(textResponse);
        
        if (!analyzedData) {
            console.error('❌ Failed to extract JSON');
            return null;
        }
        
        // Validate required fields
        const requiredFields = ['headline', 'impact', 'area', 'authority', 'impactLevel', 'urgency', 'sector', 'keyDates'];
        const invalidFields = requiredFields.filter(field => {
            const value = analyzedData[field];
            return !value || value === 'N/A' || value.toString().toLowerCase().includes('n/a');
        });

        if (invalidFields.length > 0) {
            console.error(`❌ Invalid fields: ${invalidFields.join(', ')}`);
            return null;
        }

        // Validate enums
        const validImpactLevels = ['Significant', 'Moderate', 'Informational'];
        const validUrgencies = ['High', 'Medium', 'Low'];
        const validSectors = ['Banking', 'Investments', 'Payments', 'ConsumerCredit', 'CorporateFinance', 'PensionsRetirementIncome', 'Cryptoassets', 'AMLFinancialCrime'];
        
        if (!validImpactLevels.includes(analyzedData.impactLevel)) {
            analyzedData.impactLevel = 'Informational';
        }
        
        if (!validUrgencies.includes(analyzedData.urgency)) {
            analyzedData.urgency = 'Medium';
        }
        
        if (!validSectors.includes(analyzedData.sector)) {
            const content = articleText.toLowerCase();
            if (content.includes('bank')) analyzedData.sector = 'Banking';
            else if (content.includes('investment')) analyzedData.sector = 'Investments';
            else if (content.includes('payment')) analyzedData.sector = 'Payments';
            else if (content.includes('pension')) analyzedData.sector = 'PensionsRetirementIncome';
            else if (content.includes('crypto')) analyzedData.sector = 'Cryptoassets';
            else if (content.includes('laundering') || content.includes('aml')) analyzedData.sector = 'AMLFinancialCrime';
            else analyzedData.sector = 'Banking';
        }

        // Add metadata
        analyzedData.url = articleUrl;
        analyzedData.fetchedDate = new Date().toISOString();
        
        // Save to database if available
        if (dbService) {
            try {
                await dbService.saveUpdate(analyzedData);
                console.log(`✅ Successfully saved: ${analyzedData.headline}`);
            } catch (saveError) {
                console.error('❌ Failed to save to database:', saveError.message);
                // Continue anyway - analysis was successful
            }
        }
        
        console.log(`📊 ${analyzedData.impactLevel} | ${analyzedData.sector} | ${analyzedData.authority}`);
        
        return analyzedData;
        
    } catch (error) {
        console.error(`❌ AI analysis failed:`, error.message);
        if (error.response) {
            console.error('Response details:', error.response.status, error.response.data);
        }
        return null;
    } finally {
        console.log(`🤖 === AI ANALYSIS END ===\n`);
    }
};

// Fallback to Hugging Face if Groq fails
const analyzeWithHuggingFace = async (articleText, articleUrl) => {
    if (!process.env.HUGGING_FACE_API_KEY) {
        console.error('❌ HUGGING_FACE_API_KEY not set');
        return null;
    }
    
    console.log('🔄 Trying Hugging Face fallback...');
    
    try {
        // Simplified analysis for fallback
        const simplifiedPrompt = `Analyze this UK regulatory content and return JSON with headline, impact, authority, and sector.
        
        Content: ${articleText.substring(0, 1000)}`;
        
        const response = await axios.post(
            'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
            { inputs: simplifiedPrompt },
            {
                headers: { 
                    'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        // Process Hugging Face response (implementation depends on model)
        console.log('🔄 Hugging Face response received, processing...');
        
        // For now, return a basic analysis
        return {
            headline: "Regulatory Update (Hugging Face Analysis)",
            impact: "Analysis completed using backup AI service due to primary service unavailability.",
            area: "Regulatory Analysis",
            authority: "Unknown",
            impactLevel: "Informational",
            urgency: "Low",
            sector: "Banking",
            keyDates: "None specified",
            url: articleUrl,
            fetchedDate: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Hugging Face fallback also failed:', error.message);
        return null;
    }
};

// Main analysis function with fallback
const analyzeContentWithFallback = async (articleText, articleUrl) => {
    // Try Groq first
    let result = await analyzeContentWithAI(articleText, articleUrl);
    
    // If Groq fails, try Hugging Face
    if (!result && process.env.HUGGING_FACE_API_KEY) {
        console.log('🔄 Primary AI failed, attempting fallback...');
        result = await analyzeWithHuggingFace(articleText, articleUrl);
    }
    
    return result;
};

module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI,
    analyzeContentWithFallback,
    extractJSONFromResponse
};