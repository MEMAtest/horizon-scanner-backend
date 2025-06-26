// ====================================================================
// COMPREHENSIVE DEBUG TOOL FOR FCA DATA PROCESSING ISSUES
// ====================================================================
// 
// This tool will diagnose and fix the following issues:
// 1. FCA RSS feed parsing problems
// 2. Groq JSON response handling
// 3. Web scraping selector issues
// 4. Date parsing problems
// 5. AI analysis failures
//
// Add this as a new debug endpoint in your index.js:
// app.get('/debug/comprehensive-fix', async (req, res) => { ... });

const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const comprehensiveDebug = async () => {
    const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        fixes: [],
        summary: {}
    };

    // ============================================
    // TEST 1: Environment Variables
    // ============================================
    console.log('\n🔧 TEST 1: Environment Variables');
    const envTest = {
        name: 'Environment Variables',
        status: 'unknown',
        details: {}
    };

    envTest.details = {
        GROQ_API_KEY: !!process.env.GROQ_API_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
        HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY
    };

    if (envTest.details.GROQ_API_KEY && envTest.details.DATABASE_URL) {
        envTest.status = 'pass';
        console.log('✅ All required environment variables present');
    } else {
        envTest.status = 'fail';
        console.log('❌ Missing required environment variables');
    }

    results.tests.push(envTest);

    // ============================================
    // TEST 2: FCA RSS Feed Structure
    // ============================================
    console.log('\n🔧 TEST 2: FCA RSS Feed Analysis');
    const fcaRssTest = {
        name: 'FCA RSS Feed',
        status: 'unknown',
        details: {}
    };

    try {
        const parser = new Parser();
        const feed = await parser.parseURL('https://www.fca.org.uk/news/rss.xml');
        
        fcaRssTest.details.totalItems = feed.items.length;
        fcaRssTest.details.feedTitle = feed.title;
        fcaRssTest.details.recentItems = [];

        // Analyze first 3 items
        for (let i = 0; i < Math.min(3, feed.items.length); i++) {
            const item = feed.items[i];
            
            // Test date parsing
            const parsedDate = parseFCADate(item.pubDate);
            const isRecent = parsedDate ? (parsedDate >= getRecentDateThreshold()) : false;

            fcaRssTest.details.recentItems.push({
                title: item.title,
                rawDate: item.pubDate,
                parsedDate: parsedDate ? parsedDate.toISOString() : null,
                isRecent: isRecent,
                url: item.link
            });
        }

        fcaRssTest.status = 'pass';
        console.log(`✅ FCA RSS feed accessible: ${feed.items.length} items`);
        
    } catch (error) {
        fcaRssTest.status = 'fail';
        fcaRssTest.details.error = error.message;
        console.log(`❌ FCA RSS feed error: ${error.message}`);
    }

    results.tests.push(fcaRssTest);

    // ============================================
    // TEST 3: Groq API Connectivity & JSON Parsing
    // ============================================
    console.log('\n🔧 TEST 3: Groq API & JSON Parsing');
    const groqTest = {
        name: 'Groq API',
        status: 'unknown',
        details: {}
    };

    if (process.env.GROQ_API_KEY) {
        try {
            const testPayload = {
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a financial regulatory analyst. Respond only with valid JSON."
                    },
                    {
                        role: "user",
                        content: `Analyze this test content and respond with JSON: "FCA announces new mortgage rules"
                        
                        Format:
                        {
                          "headline": "Test headline",
                          "impact": "Test impact",
                          "area": "Conduct Regulation",
                          "authority": "FCA",
                          "impactLevel": "Informational",
                          "urgency": "Low",
                          "sector": "Banking",
                          "keyDates": "None specified"
                        }`
                    }
                ],
                max_tokens: 400,
                temperature: 0.1
            };

            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                testPayload,
                {
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
                    },
                    timeout: 15000
                }
            );

            const rawResponse = response.data.choices[0].message.content;
            groqTest.details.rawResponse = rawResponse;

            // Test JSON extraction
            const extractedJSON = extractJSONFromResponse(rawResponse);
            groqTest.details.extractedJSON = extractedJSON;
            groqTest.details.extractionSuccess = !!extractedJSON;

            if (extractedJSON) {
                groqTest.status = 'pass';
                console.log('✅ Groq API working and JSON extraction successful');
            } else {
                groqTest.status = 'partial';
                console.log('⚠️ Groq API working but JSON extraction failed');
            }

        } catch (error) {
            groqTest.status = 'fail';
            groqTest.details.error = error.message;
            console.log(`❌ Groq API error: ${error.message}`);
        }
    } else {
        groqTest.status = 'fail';
        groqTest.details.error = 'GROQ_API_KEY not set';
        console.log('❌ GROQ_API_KEY not set');
    }

    results.tests.push(groqTest);

    // ============================================
    // TEST 4: Web Scraping Test
    // ============================================
    console.log('\n🔧 TEST 4: Web Scraping Test');
    const scrapingTest = {
        name: 'Web Scraping',
        status: 'unknown',
        details: {
            sites: []
        }
    };

    const testSites = [
        {
            name: 'FCA News Direct',
            url: 'https://www.fca.org.uk/news',
            selectors: ['.news-item', 'article', '.content-item']
        },
        {
            name: 'Pension Regulator',
            url: 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases',
            selectors: ['.press-release-item', '.news-item', 'article']
        }
    ];

    for (const site of testSites) {
        const siteResult = {
            name: site.name,
            url: site.url,
            accessible: false,
            foundItems: 0,
            workingSelector: null
        };

        try {
            const { data } = await axios.get(site.url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            siteResult.accessible = true;
            const $ = cheerio.load(data);

            // Test each selector
            for (const selector of site.selectors) {
                const items = $(selector);
                if (items.length > 0) {
                    siteResult.foundItems = items.length;
                    siteResult.workingSelector = selector;
                    break;
                }
            }

            console.log(`✅ ${site.name}: Accessible, found ${siteResult.foundItems} items`);

        } catch (error) {
            siteResult.error = error.message;
            console.log(`❌ ${site.name}: ${error.message}`);
        }

        scrapingTest.details.sites.push(siteResult);
    }

    scrapingTest.status = scrapingTest.details.sites.some(s => s.foundItems > 0) ? 'pass' : 'fail';
    results.tests.push(scrapingTest);

    // ============================================
    // TEST 5: End-to-End FCA Article Processing
    // ============================================
    console.log('\n🔧 TEST 5: End-to-End FCA Article Processing');
    const e2eTest = {
        name: 'End-to-End Processing',
        status: 'unknown',
        details: {}
    };

    if (groqTest.status === 'pass' || groqTest.status === 'partial') {
        try {
            // Get a real FCA article URL from RSS
            const parser = new Parser();
            const feed = await parser.parseURL('https://www.fca.org.uk/news/rss.xml');
            
            if (feed.items.length > 0) {
                const testArticle = feed.items[0];
                e2eTest.details.testArticleUrl = testArticle.link;
                e2eTest.details.testArticleTitle = testArticle.title;

                // Try to scrape content
                const content = await testScrapeContent(testArticle.link);
                e2eTest.details.contentLength = content ? content.length : 0;
                e2eTest.details.contentScraped = !!content;

                if (content && content.length > 100) {
                    // Try AI analysis
                    const analysis = await testAIAnalysis(content, testArticle.link);
                    e2eTest.details.aiAnalysisSuccess = !!analysis;
                    e2eTest.details.analysis = analysis;

                    if (analysis) {
                        e2eTest.status = 'pass';
                        console.log('✅ End-to-end processing successful');
                    } else {
                        e2eTest.status = 'partial';
                        console.log('⚠️ Content scraped but AI analysis failed');
                    }
                } else {
                    e2eTest.status = 'partial';
                    console.log('⚠️ Content scraping failed or insufficient content');
                }
            } else {
                e2eTest.status = 'fail';
                e2eTest.details.error = 'No articles in RSS feed';
            }

        } catch (error) {
            e2eTest.status = 'fail';
            e2eTest.details.error = error.message;
            console.log(`❌ End-to-end test error: ${error.message}`);
        }
    } else {
        e2eTest.status = 'skip';
        e2eTest.details.reason = 'Groq API not working';
        console.log('⏭️ Skipping end-to-end test (Groq API not working)');
    }

    results.tests.push(e2eTest);

    // ============================================
    // GENERATE SUMMARY AND FIXES
    // ============================================
    console.log('\n📊 GENERATING SUMMARY');
    
    results.summary = {
        totalTests: results.tests.length,
        passed: results.tests.filter(t => t.status === 'pass').length,
        failed: results.tests.filter(t => t.status === 'fail').length,
        partial: results.tests.filter(t => t.status === 'partial').length,
        mainIssues: [],
        recommendedFixes: []
    };

    // Identify main issues and fixes
    if (envTest.status === 'fail') {
        results.summary.mainIssues.push('Missing environment variables');
        results.summary.recommendedFixes.push('Set GROQ_API_KEY and DATABASE_URL in Vercel');
    }

    if (fcaRssTest.status === 'fail') {
        results.summary.mainIssues.push('FCA RSS feed not accessible');
        results.summary.recommendedFixes.push('Use direct web scraping as backup');
    }

    if (groqTest.status === 'fail') {
        results.summary.mainIssues.push('Groq API not working');
        results.summary.recommendedFixes.push('Check GROQ_API_KEY and generate new key if needed');
    }

    if (groqTest.status === 'partial') {
        results.summary.mainIssues.push('JSON extraction from Groq responses failing');
        results.summary.recommendedFixes.push('Update AI analyzer with improved JSON parsing');
    }

    if (scrapingTest.status === 'fail') {
        results.summary.mainIssues.push('Web scraping selectors not working');
        results.summary.recommendedFixes.push('Update selectors in web scraper module');
    }

    console.log('\n📋 DIAGNOSTIC SUMMARY:');
    console.log(`✅ Passed: ${results.summary.passed}/${results.summary.totalTests}`);
    console.log(`❌ Failed: ${results.summary.failed}/${results.summary.totalTests}`);
    console.log(`⚠️ Partial: ${results.summary.partial}/${results.summary.totalTests}`);
    
    if (results.summary.mainIssues.length > 0) {
        console.log('\n🔧 MAIN ISSUES IDENTIFIED:');
        results.summary.mainIssues.forEach((issue, i) => {
            console.log(`${i + 1}. ${issue}`);
        });
        
        console.log('\n💡 RECOMMENDED FIXES:');
        results.summary.recommendedFixes.forEach((fix, i) => {
            console.log(`${i + 1}. ${fix}`);
        });
    }

    return results;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const parseFCADate = (dateString) => {
    try {
        if (!dateString) return null;
        const cleanDate = dateString.replace(/^[A-Za-z]+,\s*/, '').replace(/\s*-\s*\d{2}:\d{2}$/, '');
        const parsedDate = new Date(cleanDate);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
    } catch (error) {
        return null;
    }
};

const getRecentDateThreshold = () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return threeDaysAgo;
};

const extractJSONFromResponse = (textResponse) => {
    // Method 1: Direct parse
    try {
        return JSON.parse(textResponse);
    } catch (e) {}
    
    // Method 2: Extract from markdown
    const markdownMatch = textResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (markdownMatch) {
        try {
            return JSON.parse(markdownMatch[1]);
        } catch (e) {}
    }
    
    // Method 3: Find JSON object
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {}
    }
    
    return null;
};

const testScrapeContent = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        $('script, style, nav, header, footer').remove();
        
        const content = $('main, article, .content, body').first().text()
            .replace(/\s\s+/g, ' ')
            .trim();
        
        return content.substring(0, 2000);
    } catch (error) {
        return null;
    }
};

const testAIAnalysis = async (content, url) => {
    if (!process.env.GROQ_API_KEY) return null;
    
    try {
        const payload = {
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You are a financial regulatory analyst. Respond only with valid JSON."
                },
                {
                    role: "user",
                    content: `Analyze this article and respond with JSON only:
                    
                    ${content.substring(0, 1000)}
                    
                    {
                      "headline": "Article headline",
                      "impact": "Business impact",
                      "authority": "FCA",
                      "sector": "Banking"
                    }`
                }
            ],
            max_tokens: 300,
            temperature: 0.1
        };

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            payload,
            {
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
                },
                timeout: 15000
            }
        );

        const rawResponse = response.data.choices[0].message.content;
        return extractJSONFromResponse(rawResponse);
        
    } catch (error) {
        return null;
    }
};

module.exports = {
    comprehensiveDebug
};