const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database');

// Updated to use Groq instead of Hugging Face
const AI_PROVIDER_CONFIG = {
    apiKey: process.env.GROQ_API_KEY, 
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant" // Fast Llama model on Groq
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
    // Check if article already exists (now async)
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
    
    const prompt = `Analyze the following financial regulatory text and provide a summary in a structured JSON format.
Based *only* on the text provided, you MUST determine a value for every key: 'headline', 'impact', 'area', 'authority', 'impactLevel', 'urgency', 'sector', and 'keyDates'. Do not omit any keys.

- headline: A concise, clear headline for the update.
- impact: A 2-3 sentence summary of the direct business impact on financial firms.
- area: A specific focus area, like "Card Acquiring / Scheme Fees" or "Prudential Regulation".
- authority: The regulatory body that published this (e.g., FCA, PRA, BoE).
- impactLevel: Classify the impact as 'Significant', 'Moderate', or 'Informational'.
- urgency: Classify the urgency as 'High', 'Medium', or 'Low'.
- sector: Classify the primary financial sector this applies to from this list: Payments, Investments, ConsumerCredit, CorporateFinance, Banking, PensionsRetirementIncome, Cryptoassets, AMLFinancialCrime.
- keyDates: Extract any explicit dates mentioned, such as consultation deadlines or implementation dates. If no dates are found, you must return "N/A".

Article Text: "${articleText}"

Return ONLY the raw JSON object, without any surrounding text or markdown.`;

    try {
        const payload = {
            model: AI_PROVIDER_CONFIG.model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1024,
            temperature: 0.1
        };

        const response = await axios.post(AI_PROVIDER_CONFIG.apiUrl, payload, {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${AI_PROVIDER_CONFIG.apiKey}` 
            }
        });

        if (response.status !== 200) {
            throw new Error(`Groq API call failed with status: ${response.status}`);
        }

        const result = response.data;
        if (result && result.choices && result.choices[0] && result.choices[0].message) {
            const textResponse = result.choices[0].message.content;
            console.log('🤖 Groq response received, parsing JSON...');
            
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const rawJsonText = jsonMatch[0];
                const analyzedData = JSON.parse(rawJsonText);
                
                // Strict validation of the AI's response
                const requiredKeys = ['headline', 'impact', 'area', 'authority', 'impactLevel', 'urgency', 'sector', 'keyDates'];
                const missingKeys = requiredKeys.filter(key => !(key in analyzedData));

                if (missingKeys.length > 0) {
                    console.error(`❌ AI response was missing required keys: ${missingKeys.join(', ')}`);
                    return null;
                }

                analyzedData.url = articleUrl;
                analyzedData.fetchedDate = new Date().toISOString();
                
                // Save to database (now async)
                await db.get('updates').push(analyzedData).write();
                console.log(`  ✅ Groq AI Analysis complete and saved for: ${analyzedData.headline}`);
                return analyzedData;
            } else {
                console.error('❌ Groq response did not contain a valid JSON block.', textResponse);
                return null;
            }
        } else {
            console.error('❌ Groq analysis returned unexpected response format.', result);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error during Groq AI analysis for ${articleUrl}:`, error.message);
        
        // Check for specific rate limit errors
        if (error.response && error.response.status === 429) {
            console.error('🔴 Groq rate limit hit. Consider upgrading or waiting.');
        }
        
        return null;
    }
};

module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI
};