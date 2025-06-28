// src/services/aiAnalyzer.js
// AI-powered content analysis for regulatory updates.

const axios = require('axios');
const cheerio =require('cheerio');
// REFACTORED: Database service is now a top-level module dependency.
const dbService = require('./dbService.js');

const AI_PROVIDER_CONFIG = {
    apiKey: process.env.GROQ_API_KEY, 
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.1-8b-instant"
};

const scrapeArticleContent = async (url) => {
    // ... (Your scrapeArticleContent function is well-written and requires no changes)
    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(data);
        $('script, style, nav, header, footer').remove();
        let articleText = $('main article, .article-content, main, article').text();
        if (!articleText || articleText.length < 100) articleText = $('body').text();
        return articleText.replace(/\s\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim().substring(0, 4000);
    } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error.message);
        return null;
    }
};

const extractJSONFromResponse = (textResponse) => {
    // ... (Your extractJSONFromResponse function is fine and requires no changes)
    try { return JSON.parse(textResponse); } catch (e) { /* ignore */ }
    const markdownMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) try { return JSON.parse(markdownMatch[1]); } catch(e) { /* ignore */ }
    const jsonMatch = textResponse.match(/\{[\s\S]*?\}/);
    if (jsonMatch) try { return JSON.parse(jsonMatch[0]); } catch(e) { /* ignore */ }
    return null;
};

const analyzeContentWithAI = async (articleText, articleUrl) => {
    console.log(`\n🤖 === AI ANALYSIS START for ${articleUrl} ===`);
    
    if (!AI_PROVIDER_CONFIG.apiKey) {
        console.error('❌ GROQ_API_KEY not set. Cannot perform AI analysis.');
        return null;
    }
    
    // REFACTORED: No longer needs to require dbService here. It's already available.
    // The check for existing entries is now done in the `processItem` function in rssFetcher.js
    // before this function is even called, which is a more efficient pattern.
    
    const prompt = `Analyze this UK regulatory article and respond with ONLY a valid JSON object...`; // Your prompt is fine

    try {
        const payload = {
            model: AI_PROVIDER_CONFIG.model,
            messages: [{ role: "system", content: "You are a UK financial regulatory expert..." }, { role: "user", content: prompt }],
            max_tokens: 800,
            temperature: 0.1
        };

        const response = await axios.post(AI_PROVIDER_CONFIG.apiUrl, payload, {
            headers: { 'Authorization': `Bearer ${AI_PROVIDER_CONFIG.apiKey}` },
            timeout: 30000
        });

        const textResponse = response.data?.choices?.[0]?.message?.content.trim();
        if (!textResponse) throw new Error('Invalid response structure from AI API');

        const analyzedData = extractJSONFromResponse(textResponse);
        if (!analyzedData) throw new Error('Failed to extract JSON from AI response');
        
        // Add metadata
        analyzedData.url = articleUrl;
        analyzedData.fetchedDate = new Date().toISOString();
        
        // Save to database
        await dbService.saveUpdate(analyzedData);
        console.log(`✅ Successfully analyzed and saved: ${analyzedData.headline}`);
        
        return analyzedData;
        
    } catch (error) {
        console.error(`❌ AI analysis failed for ${articleUrl}:`, error.message);
        return null;
    } finally {
        console.log(`🤖 === AI ANALYSIS END ===\n`);
    }
};


module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI,
    extractJSONFromResponse
};
