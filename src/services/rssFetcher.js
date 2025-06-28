// src/services/rssFetcher.js
// RSS feed fetching and content processing service

const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

// Lazy load services
function loadAiAnalyzer() {
    try {
        return require('./aiAnalyzer');
    } catch (error) {
        console.error('Failed to load aiAnalyzer:', error);
        return null;
    }
}

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

// RSS feed configurations
const RSS_FEEDS = [
    { 
        name: 'FCA News', 
        url: 'https://www.fca.org.uk/news/rss.xml',
        authority: 'FCA'
    },
    { 
        name: 'Bank of England Publications', 
        url: 'https://www.bankofengland.co.uk/rss/publications',
        authority: 'BoE'
    },
    { 
        name: 'Bank of England News', 
        url: 'https://www.bankofengland.co.uk/rss/news',
        authority: 'BoE'
    }
];

// Web scraping configurations
const WEB_SCRAPING_SOURCES = [
    {
        name: 'The Pensions Regulator',
        url: 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases',
        authority: 'TPR',
        selectors: [
            'div.press-release-item',
            '.news-item',
            '.article-item',
            'article',
            '.content-item'
        ]
    },
    {
        name: 'Serious Fraud Office',
        url: 'https://www.sfo.gov.uk/news-and-publications/news-releases/',
        authority: 'SFO',
        selectors: [
            '.news-item',
            '.article-item', 
            'article',
            '.content-item',
            '.press-release',
            '.news-listing-item'
        ]
    },
    {
        name: 'Financial Action Task Force',
        url: 'https://www.fatf-gafi.org/en/publications.html',
        authority: 'FATF',
        selectors: [
            '.publication-item',
            '.news-item',
            'article',
            '.content-item',
            '.document-item'
        ]
    }
];

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

// Parse FCA date format specifically
function parseFCADate(dateString) {
    try {
        if (!dateString) return null;
        
        // Handle FCA format: "Thursday, June 26, 2025 - 13:08"
        const cleanDate = dateString
            .replace(/^[A-Za-z]+,\s*/, '') // Remove day of week
            .replace(/\s*-\s*\d{2}:\d{2}$/, ''); // Remove time portion
        
        const parsedDate = new Date(cleanDate);
        
        if (isNaN(parsedDate.getTime())) {
            console.log(`❌ Failed to parse date: ${dateString}`);
            return null;
        }
        
        return parsedDate;
    } catch (error) {
        console.log(`❌ Date parsing error for: ${dateString}`, error.message);
        return null;
    }
}

// Generic date parser for web scraped content
function parseWebDate(dateStr) {
    try {
        if (!dateStr) return null;
        
        // Clean up common date string formats
        const cleanDate = dateStr.trim()
            .replace(/(\d+)(st|nd|rd|th)/, '$1') // Remove ordinal suffixes
            .replace(/\s+/g, ' '); // Normalize whitespace
        
        const date = new Date(cleanDate);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.log('Date parsing error:', error.message);
        return null;
    }
}

// Check if date is recent (within specified days)
function isRecent(date, days = 7) {
    if (!date) return false;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    return date >= threshold;
}

// Fetch and analyze RSS feeds
async function fetchAndAnalyzeFeeds() {
    console.log('\n🔍 === RSS FEED PROCESSING START ===');
    
    const parser = new Parser();
    const aiAnalyzer = loadAiAnalyzer();
    
    if (!aiAnalyzer) {
        console.error('❌ AI Analyzer service not available');
        return;
    }
    
    let totalProcessed = 0;
    let totalSkipped = 0;
    
    for (const feedInfo of RSS_FEEDS) {
        try {
            console.log(`\n📡 Processing RSS feed: ${feedInfo.name}`);
            console.log(`📡 URL: ${feedInfo.url}`);
            
            const feed = await parser.parseURL(feedInfo.url);
            console.log(`✅ RSS feed fetched successfully`);
            console.log(`📊 Total items in feed: ${feed.items.length}`);
            
            if (feed.items.length === 0) {
                console.log('⚠️ No items found in this feed');
                continue;
            }
            
            // Process recent items only
            let processedCount = 0;
            let skippedCount = 0;
            
            for (const item of feed.items) {
                try {
                    const result = await processRSSItem(item, feedInfo, aiAnalyzer);
                    if (result === 'processed') {
                        processedCount++;
                        totalProcessed++;
                    } else if (result === 'skipped') {
                        skippedCount++;
                        totalSkipped++;
                    }
                } catch (error) {
                    console.error(`❌ Error processing item: ${error.message}`);
                    skippedCount++;
                    totalSkipped++;
                }
            }
            
            console.log(`📊 Feed processing summary for ${feedInfo.name}:`);
            console.log(`  - Processed: ${processedCount}`);
            console.log(`  - Skipped: ${skippedCount}`);
            console.log(`  - Total: ${feed.items.length}`);
            
        } catch (error) {
            console.error(`❌ Error processing RSS feed ${feedInfo.name}:`, error.message);
        }
    }
    
    console.log(`\n📊 RSS PROCESSING SUMMARY:`);
    console.log(`  - Total Processed: ${totalProcessed}`);
    console.log(`  - Total Skipped: ${totalSkipped}`);
    console.log('🔍 === RSS FEED PROCESSING END ===\n');
}

// Process individual RSS item
async function processRSSItem(item, feedInfo, aiAnalyzer) {
    const articleUrl = item.link;
    console.log(`\n🔍 Processing RSS item: ${item.title || 'No title'}`);
    console.log(`🔗 URL: ${articleUrl}`);
    
    // Parse the date
    const articleDate = parseFCADate(item.pubDate);
    if (!articleDate) {
        console.log('❌ Skipping: Could not parse article date');
        return 'failed';
    }
    
    // Check if article is recent (last 3 days for RSS feeds)
    console.log(`📅 Article date: ${articleDate.toISOString()}`);
    if (!isRecent(articleDate, 3)) {
        console.log('⏭️ Skipping: Article is older than 3 days');
        return 'skipped';
    }
    
    // Check if already exists in database
    try {
        const dbService = await getDbService();
        if (dbService) {
            const existingEntry = await dbService.findUpdateByUrl(articleUrl);
            if (existingEntry) {
                console.log('⏭️ Skipping: Already processed');
                return 'skipped';
            }
        }
    } catch (error) {
        console.error('Error checking existing entry:', error);
    }
    
    // Scrape and analyze content
    console.log('📰 Scraping article content...');
    const content = await aiAnalyzer.scrapeArticleContent(articleUrl);
    
    if (!content) {
        console.log('❌ Failed to scrape article content');
        return 'failed';
    }
    
    console.log(`✅ Content scraped, length: ${content.length}`);
    console.log('🤖 Starting AI analysis...');
    
    const aiResult = await aiAnalyzer.analyzeContentWithAI(content, articleUrl);
    
    if (aiResult) {
        console.log(`✅ AI analysis successful: ${aiResult.headline}`);
        return 'processed';
    } else {
        console.log('❌ AI analysis failed');
        return 'failed';
    }
}

// Scrape and analyze websites
async function scrapeAndAnalyzeWebsites() {
    console.log('\n🕷️ === WEBSITE SCRAPING START ===');
    
    const aiAnalyzer = loadAiAnalyzer();
    
    if (!aiAnalyzer) {
        console.error('❌ AI Analyzer service not available');
        return;
    }
    
    let totalProcessed = 0;
    let totalSkipped = 0;
    
    for (const source of WEB_SCRAPING_SOURCES) {
        try {
            console.log(`\n🕷️ Scraping website: ${source.name}`);
            console.log(`🔗 URL: ${source.url}`);
            
            const articles = await scrapeWebsiteArticles(source);
            console.log(`📊 Found ${articles.length} recent articles`);
            
            if (articles.length === 0) {
                console.log('⚠️ No recent articles found on this website');
                continue;
            }
            
            let processedCount = 0;
            let skippedCount = 0;
            
            for (const article of articles) {
                try {
                    const result = await processWebArticle(article, source, aiAnalyzer);
                    if (result === 'processed') {
                        processedCount++;
                        totalProcessed++;
                    } else if (result === 'skipped') {
                        skippedCount++;
                        totalSkipped++;
                    }
                } catch (error) {
                    console.error(`❌ Error processing article: ${error.message}`);
                    skippedCount++;
                    totalSkipped++;
                }
            }
            
            console.log(`📊 Website scraping summary for ${source.name}:`);
            console.log(`  - Processed: ${processedCount}`);
            console.log(`  - Skipped: ${skippedCount}`);
            console.log(`  - Found: ${articles.length}`);
            
        } catch (error) {
            console.error(`❌ Error scraping website ${source.name}:`, error.message);
        }
    }
    
    console.log(`\n📊 WEBSITE SCRAPING SUMMARY:`);
    console.log(`  - Total Processed: ${totalProcessed}`);
    console.log(`  - Total Skipped: ${totalSkipped}`);
    console.log('🕷️ === WEBSITE SCRAPING END ===\n');
}

// Scrape articles from a specific website
async function scrapeWebsiteArticles(source) {
    try {
        const { data } = await axios.get(source.url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        // Try each selector until we find articles
        for (const selector of source.selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                
                items.each((i, el) => {
                    try {
                        // Extract title and URL
                        let titleElement = $(el).find('h3 a, h2 a, h4 a, a.title, .title a').first();
                        if (!titleElement.length) {
                            titleElement = $(el).find('a').first();
                        }
                        
                        const title = titleElement.text().trim();
                        let relativeUrl = titleElement.attr('href');
                        
                        // Extract date
                        let dateStr = $(el).find('time, .date, .published, .article-date').text().trim();
                        if (!dateStr) {
                            const text = $(el).text();
                            const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
                            if (dateMatch) dateStr = dateMatch[1];
                        }
                        
                        const date = parseWebDate(dateStr);
                        
                        if (relativeUrl && title && date && isRecent(date, 7)) {
                            // Convert to absolute URL if needed
                            const absoluteUrl = relativeUrl.startsWith('http') ? 
                                relativeUrl : new URL(relativeUrl, source.url).href;
                            
                            articles.push({ 
                                title, 
                                link: absoluteUrl, 
                                pubDate: date.toISOString(),
                                authority: source.authority
                            });
                        }
                    } catch (error) {
                        console.error('Error parsing article element:', error);
                    }
                });
                break; // Stop after finding working selector
            }
        }
        
        if (articles.length === 0) {
            console.log('⚠️ No articles found with any selector');
        }
        
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error.message);
        return [];
    }
}

// Process individual web-scraped article
async function processWebArticle(article, source, aiAnalyzer) {
    console.log(`\n🔍 Processing web article: ${article.title}`);
    console.log(`🔗 URL: ${article.link}`);
    
    // Check if already exists in database
    try {
        const dbService = await getDbService();
        if (dbService) {
            const existingEntry = await dbService.findUpdateByUrl(article.link);
            if (existingEntry) {
                console.log('⏭️ Skipping: Already processed');
                return 'skipped';
            }
        }
    } catch (error) {
        console.error('Error checking existing entry:', error);
    }
    
    // Scrape and analyze content
    console.log('📰 Scraping article content...');
    const content = await aiAnalyzer.scrapeArticleContent(article.link);
    
    if (!content) {
        console.log('❌ Failed to scrape article content');
        return 'failed';
    }
    
    console.log(`✅ Content scraped, length: ${content.length}`);
    console.log('🤖 Starting AI analysis...');
    
    const aiResult = await aiAnalyzer.analyzeContentWithAI(content, article.link);
    
    if (aiResult) {
        // Override authority from source if needed
        if (source.authority && aiResult.authority !== source.authority) {
            aiResult.authority = source.authority;
        }
        
        console.log(`✅ AI analysis successful: ${aiResult.headline}`);
        return 'processed';
    } else {
        console.log('❌ AI analysis failed');
        return 'failed';
    }
}

// Health check for RSS/scraping services
async function healthCheck() {
    const results = {
        rssFeeds: [],
        webSources: [],
        overallStatus: 'unknown'
    };
    
    // Test RSS feeds
    const parser = new Parser();
    for (const feed of RSS_FEEDS) {
        try {
            const feedData = await parser.parseURL(feed.url);
            results.rssFeeds.push({
                name: feed.name,
                status: 'working',
                itemCount: feedData.items.length
            });
        } catch (error) {
            results.rssFeeds.push({
                name: feed.name,
                status: 'error',
                error: error.message
            });
        }
    }
    
    // Test web sources (simplified check)
    for (const source of WEB_SCRAPING_SOURCES) {
        try {
            const response = await axios.head(source.url, { timeout: 5000 });
            results.webSources.push({
                name: source.name,
                status: response.status === 200 ? 'accessible' : 'error'
            });
        } catch (error) {
            results.webSources.push({
                name: source.name,
                status: 'error',
                error: error.message
            });
        }
    }
    
    // Calculate overall status
    const workingFeeds = results.rssFeeds.filter(f => f.status === 'working').length;
    const accessibleSources = results.webSources.filter(s => s.status === 'accessible').length;
    
    if (workingFeeds > 0 || accessibleSources > 0) {
        results.overallStatus = 'healthy';
    } else {
        results.overallStatus = 'unhealthy';
    }
    
    return results;
}

module.exports = {
    fetchAndAnalyzeFeeds,
    scrapeAndAnalyzeWebsites,
    parseFCADate,
    parseWebDate,
    isRecent,
    healthCheck,
    RSS_FEEDS,
    WEB_SCRAPING_SOURCES
};
