const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database');

// Updated to use Groq with better JSON parsing
const AI_PROVIDER_CONFIG = {
    apiKey: process.env.GROQ_API_KEY, 
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant"
};

const scrapeArticleContent = async (url) => {
    try {
        const { data } = await axios.get(url, {
             headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const articleText = $('body').text().replace(/\s\s+/g, ' ').trim();
        return articleText.substring(0, 10000);
    } catch (error) {
        console.error(`❌ Error scraping article at ${url}:`, error.message);
        return null;
    }
};

const analyzeContentWithAI = async (articleText, articleUrl) => {
    // Check if article already exists
    const existingEntry = await db.get('updates').find({ url: articleUrl }).value();
    if (existingEntry) {
        console.log(`- Skipping analysis for already processed article: ${articleUrl}`);
        return null;
    }
    
    if (!AI_PROVIDER_CONFIG.apiKey) {
        console.error('🔴 GROQ_API_KEY environment variable not set. Skipping AI analysis.');
        return null;
    }

    console.log(`- Analyzing new article with Groq: ${articleUrl}`);
    
    // More explicit prompt for better JSON response
    const prompt = `You are a financial regulatory analyst. Analyze this regulatory text and respond with ONLY a valid JSON object.

Required JSON format (fill ALL fields, no "N/A" allowed):
{
  "headline": "Clear article headline",
  "impact": "2-3 sentence business impact summary", 
  "area": "Specific regulatory area",
  "authority": "FCA or PRA or BoE",
  "impactLevel": "Significant or Moderate or Informational",
  "urgency": "High or Medium or Low", 
  "sector": "Banking or Investments or Payments or ConsumerCredit or CorporateFinance or PensionsRetirementIncome or Cryptoassets or AMLFinancialCrime",
  "keyDates": "Any dates mentioned or None if no dates"
}

Article text: "${articleText.substring(0, 3000)}"

Respond with ONLY the JSON object, no other text:`;

    try {
        const payload = {
            model: AI_PROVIDER_CONFIG.model,
            messages: [
                {
                    role: "system",
                    content: "You are a financial regulatory analyst. Always respond with valid JSON only."
                },
                {
                    role: "user", 
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.1
        };

        console.log('🤖 Sending request to Groq...');
        const response = await axios.post(AI_PROVIDER_CONFIG.apiUrl, payload, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${AI_PROVIDER_CONFIG.apiKey}` 
            },
            timeout: 30000
        });

        if (response.status !== 200) {
            throw new Error(`Groq API call failed with status: ${response.status}`);
        }

        const result = response.data;
        if (result && result.choices && result.choices[0] && result.choices[0].message) {
            const textResponse = result.choices[0].message.content.trim();
            console.log('🤖 Groq raw response:', textResponse);
            
            // Multiple JSON extraction methods
            let analyzedData = null;
            
            // Method 1: Try direct JSON parse
            try {
                analyzedData = JSON.parse(textResponse);
                console.log('✅ Direct JSON parse successful');
            } catch (e) {
                console.log('❌ Direct JSON parse failed, trying extraction...');
                
                // Method 2: Extract JSON from response
                const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        analyzedData = JSON.parse(jsonMatch[0]);
                        console.log('✅ JSON extraction successful');
                    } catch (e2) {
                        console.log('❌ JSON extraction failed');
                    }
                }
            }
            
            if (!analyzedData) {
                console.error('❌ Could not parse AI response as JSON:', textResponse);
                return null;
            }
            
            // Validate required fields
            const requiredKeys = ['headline', 'impact', 'area', 'authority', 'impactLevel', 'urgency', 'sector', 'keyDates'];
            const missingKeys = requiredKeys.filter(key => !analyzedData[key] || analyzedData[key] === 'N/A');

            if (missingKeys.length > 0) {
                console.error(`❌ AI response had invalid fields: ${missingKeys.join(', ')}`);
                console.log('Full response:', analyzedData);
                return null;
            }

            // Add metadata
            analyzedData.url = articleUrl;
            analyzedData.fetchedDate = new Date().toISOString();
            
            // Save to database
            await db.get('updates').push(analyzedData).write();
            console.log(`✅ Groq analysis complete: ${analyzedData.headline}`);
            return analyzedData;
            
        } else {
            console.error('❌ Groq returned unexpected response format');
            return null;
        }
    } catch (error) {
        console.error(`❌ Error during Groq AI analysis for ${articleUrl}:`, error.message);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        return null;
    }
};

module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI
};