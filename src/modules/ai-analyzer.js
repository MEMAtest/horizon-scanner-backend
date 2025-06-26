const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../database');

const AI_PROVIDER_CONFIG = {
    apiKey: process.env.HUGGING_FACE_API_KEY, 
    apiUrl: "https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct",
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
        console.error('🔴 HUGGING_FACE_API_KEY environment variable not set. Skipping AI analysis.');
        return null;
    }

    console.log(`- Analyzing new article with Hugging Face: ${articleUrl}`);
    const prompt = `
        <|begin_of_text|><|start_header_id|>user<|end_header_id|>
        Analyze the following financial regulatory text and provide a summary in a structured JSON format.
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

        Return ONLY the raw JSON object, without any surrounding text or markdown.
        <|eot_id|><|start_header_id|>assistant<|end_header_id|>
    `;

    try {
        const payload = {
            inputs: prompt,
            parameters: { max_new_tokens: 1024, return_full_text: false }
        };
        const response = await fetch(AI_PROVIDER_CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${AI_PROVIDER_CONFIG.apiKey}` },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API call failed with status: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        const result = await response.json();
        if (result && result.length > 0 && result[0].generated_text) {
            const textResponse = result[0].generated_text;
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
                console.log(`  ✅ AI Analysis complete and saved for: ${analyzedData.headline}`);
                return analyzedData;
            } else {
                console.error('❌ AI response did not contain a valid JSON block.', textResponse);
                return null;
            }
        } else {
            console.error('❌ AI analysis returned no valid generated_text.', result);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error during AI analysis for ${articleUrl}:`, error.message);
        return null;
    }
};

module.exports = {
    scrapeArticleContent,
    analyzeContentWithAI
};