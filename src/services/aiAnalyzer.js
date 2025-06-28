// src/services/aiAnalyzer.js
// AI analysis service for regulatory content

const axios = require('axios');
const cheerio = require('cheerio');

// Lazy load database services
function loadDbService() {
    try {
        return require('./dbService');
    } catch (error) {
        return null;
    }
}

function loadFileDbService() {
    try {
        return require('./fileDbService');
    } catch (error) {
        return null;
    }
}

// Get primary database service
async function getDbService() {
    const dbService = loadDbService();
    const fileDbService = loadFileDbService();
    
    if (dbService && process.env.DATABASE_URL) {
        const initialized = await dbService.initialize();
        if (initialized) {
            return dbService;
        }
    }
    
    if (fileDbService) {
        await fileDbService.initialize();
        return fileDbService;
    }
    
    return null;
}

// AI Provider Configuration
const AI_PROVIDER_CONFIG = {
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        apiUrl: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.1-8b-instant"
    },
    huggingFace: {
        apiKey: process.env.HUGGING_FACE_API_KEY,
        apiUrl: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
    }
};

// Scrape article content from URL
async function scrapeArticleContent(url) {
    try {
        console.log(`📄 Scraping content from: ${url}`);
        
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        
        // Remove unwanted elements
        $('script, style, nav, header, footer, .navigation, .sidebar, .menu, .ads').remove();
        
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
            '.page-content',
            '.entry-content'
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
        
        // Clean and normalize text
        articleText = articleText
            .replace(/\s\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
            .trim();
        
        const finalContent = articleText.substring(0, 4000); // Limit content length
        console.log(`✅ Content scraped: ${finalContent.length} characters`);
        return finalContent;
        
    } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
        return null;
    }
}

// Extract JSON from AI response (handles various formats)
function extractJSONFromResponse(textResponse) {
    if (!textResponse) return null;
    
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
    
    // Method 3: Find any JSON object in response
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
    
    // Method 4: Try to fix common JSON issues
    try {
        let fixedJson = textResponse
            .replace(/```json\s*/, '')
            .replace(/```\s*$/, '')
            .replace(/^\s*/, '')
            .replace(/\s*$/, '');
            
        const parsed = JSON.parse(fixedJson);
        console.log('✅ JSON extracted with cleanup');
        return parsed;
    } catch (e) {
        // Final fallback
    }
    
    console.error('❌ All JSON extraction methods failed');
    console.error('Response preview:', textResponse.substring(0, 200));
    return null;
}

// Analyze content with AI (Groq primary, Hugging Face fallback)
async function analyzeContentWithAI(articleText, articleUrl) {
    console.log(`\n🤖 === AI ANALYSIS START ===`);
    console.log(`🔗 URL: ${articleUrl}`);
    
    // Check if already processed
    try {
        const dbService = await getDbService();
        if (dbService) {
            const existingEntry = await dbService.findUpdateByUrl(articleUrl);
            if (existingEntry) {
                console.log(`⏭️ Skipping: Already processed`);
                return null;
            }
        }
    } catch (error) {
        console.error('Error checking existing entry:', error);
    }
    
    if (!articleText || articleText.length < 50) {
        console.error('❌ Insufficient content for analysis');
        return null;
    }
    
    // Try Groq first
    if (AI_PROVIDER_CONFIG.groq.apiKey) {
        try {
            const result = await analyzeWithGroq(articleText, articleUrl);
            if (result) {
                await saveAnalysisResult(result);
                return result;
            }
        } catch (error) {
            console.error('Groq analysis failed:', error.message);
        }
    }
    
    // Fallback to Hugging Face
    if (AI_PROVIDER_CONFIG.huggingFace.apiKey) {
        try {
            const result = await analyzeWithHuggingFace(articleText, articleUrl);
            if (result) {
                await saveAnalysisResult(result);
                return result;
            }
        } catch (error) {
            console.error('Hugging Face analysis failed:', error.message);
        }
    }
    
    console.error('❌ All AI analysis methods failed');
    return null;
}

// Analyze with Groq API
async function analyzeWithGroq(articleText, articleUrl) {
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
            model: AI_PROVIDER_CONFIG.groq.model,
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

        console.log('📤 Sending to Groq API...');
        const startTime = Date.now();
        
        const response = await axios.post(AI_PROVIDER_CONFIG.groq.apiUrl, payload, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${AI_PROVIDER_CONFIG.groq.apiKey}` 
            },
            timeout: 30000
        });

        const responseTime = Date.now() - startTime;
        console.log(`📥 Groq response received in ${responseTime}ms`);

        if (response.status !== 200) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const result = response.data;
        if (!result?.choices?.[0]?.message?.content) {
            throw new Error('Invalid Groq response structure');
        }

        const textResponse = result.choices[0].message.content.trim();
        console.log('🔍 Groq response preview:', textResponse.substring(0, 100) + '...');
        
        const analyzedData = extractJSONFromResponse(textResponse);
        
        if (!analyzedData) {
            throw new Error('Failed to extract JSON from Groq response');
        }
        
        return validateAndEnhanceAnalysis(analyzedData, articleUrl);
        
    } catch (error) {
        console.error(`❌ Groq analysis failed:`, error.message);
        throw error;
    }
}

// Analyze with Hugging Face (simplified fallback)
async function analyzeWithHuggingFace(articleText, articleUrl) {
    console.log('🤗 Attempting Hugging Face analysis...');
    
    // For now, return a basic analysis structure
    // This could be enhanced with actual Hugging Face API calls
    const basicAnalysis = {
        headline: extractHeadlineFromText(articleText),
        impact: "Regulatory update requiring review and potential compliance actions.",
        area: "Regulatory Update",
        authority: detectAuthority(articleText),
        impactLevel: "Informational",
        urgency: "Medium",
        sector: detectSector(articleText),
        keyDates: "Review article for specific dates"
    };
    
    return validateAndEnhanceAnalysis(basicAnalysis, articleUrl);
}

// Validate and enhance analysis results
function validateAndEnhanceAnalysis(analyzedData, articleUrl) {
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
        analyzedData.sector = detectSector(analyzedData.headline + ' ' + analyzedData.impact);
    }

    // Add metadata
    analyzedData.url = articleUrl;
    analyzedData.fetchedDate = new Date().toISOString();
    
    console.log(`✅ Analysis validated: ${analyzedData.headline}`);
    console.log(`📊 ${analyzedData.impactLevel} | ${analyzedData.sector} | ${analyzedData.authority}`);
    
    return analyzedData;
}

// Save analysis result to database
async function saveAnalysisResult(analyzedData) {
    try {
        const dbService = await getDbService();
        if (dbService) {
            await dbService.addUpdate(analyzedData);
            console.log(`💾 Saved to database: ${analyzedData.headline}`);
        } else {
            console.warn('⚠️ No database service available for saving');
        }
    } catch (error) {
        console.error('❌ Error saving analysis result:', error);
    }
}

// Helper functions for basic text analysis
function extractHeadlineFromText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const firstLine = lines[0] || '';
    return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
}

function detectAuthority(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('financial conduct authority') || lowerText.includes('fca')) return 'FCA';
    if (lowerText.includes('bank of england') || lowerText.includes('boe')) return 'BoE';
    if (lowerText.includes('prudential regulation authority') || lowerText.includes('pra')) return 'PRA';
    if (lowerText.includes('pensions regulator') || lowerText.includes('tpr')) return 'TPR';
    if (lowerText.includes('serious fraud office') || lowerText.includes('sfo')) return 'SFO';
    if (lowerText.includes('financial action task force') || lowerText.includes('fatf')) return 'FATF';
    return 'FCA'; // Default
}

function detectSector(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('bank') || lowerText.includes('lending')) return 'Banking';
    if (lowerText.includes('investment') || lowerText.includes('fund') || lowerText.includes('asset management')) return 'Investments';
    if (lowerText.includes('payment') || lowerText.includes('fintech')) return 'Payments';
    if (lowerText.includes('consumer credit') || lowerText.includes('mortgage')) return 'ConsumerCredit';
    if (lowerText.includes('corporate finance') || lowerText.includes('capital markets')) return 'CorporateFinance';
    if (lowerText.includes('pension') || lowerText.includes('retirement')) return 'PensionsRetirementIncome';
    if (lowerText.includes('crypto') || lowerText.includes('digital asset')) return 'Cryptoassets';
    if (lowerText.includes('money laundering') || lowerText.includes('aml') || lowerText.includes('financial crime')) return 'AMLFinancialCrime';
    return 'Banking'; // Default
}

module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI,
    extractJSONFromResponse,
    detectAuthority,
    detectSector
};