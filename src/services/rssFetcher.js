// src/services/rssFetcher.js
// This version corrects the case-sensitive path to aiAnalyzer.js

const Parser = require('rss-parser');
const parser = new Parser();

// --- CRITICAL FIX ---
// The require path now correctly uses camelCase 'aiAnalyzer.js' to match the actual filename.
// This resolves the "Cannot find module" error on Vercel's case-sensitive system.
const aiAnalyzer = require('./aiAnalyzer.js'); 

const webScraper = require('./webScraper.js');
const dbService = require('./dbService.js');

const RSS_FEEDS = [
    { name: 'FCA News', url: 'https://www.fca.org.uk/news/rss.xml' },
    { name: 'BoE/PRA Publications', url: 'https://www.bankofengland.co.uk/rss/publications' },
    { name: 'BoE/PRA News', url: 'https://www.bankofengland.co.uk/rss/news' }
];

const parseFCADate = (dateString) => {
    try {
        if (!dateString) return null;
        const cleanDate = dateString.replace(/^[A-Za-z]+,\s*/, '').replace(/\s*-\s*\d{2}:\d{2}$/, '');
        const parsedDate = new Date(cleanDate);
        if (isNaN(parsedDate.getTime())) {
            console.log('❌ Failed to parse date:', dateString);
            return null;
        }
        return parsedDate;
    } catch (error) {
        console.log('❌ Date parsing error for:', dateString, error.message);
        return null;
    }
};

const processItem = async (item) => {
    const articleUrl = item.link;
    if (!articleUrl) {
        console.log('⏭️ Skipping item with no link:', item.title);
        return;
    }
    
    console.log(`\n🔍 Processing item: ${item.title || 'No title'}`);
    console.log(`🔗 URL: ${articleUrl}`);

    try {
        const existing = await dbService.findUpdate(articleUrl);
        if (existing) {
            console.log('⏭️ Skipping: Already in database.');
            return;
        }
    } catch (error) {
        console.log('⚠️ Could not check for existing update:', error.message);
    }
    
    console.log('📰 Scraping article content...');
    const content = await aiAnalyzer.scrapeArticleContent(articleUrl);
    
    if (!content || content.length < 100) {
        console.log('❌ Failed to scrape sufficient content.');
        return;
    }
    
    console.log('🤖 Starting AI analysis...');
    await aiAnalyzer.analyzeContentWithAI(content, articleUrl);
};


const fetchAndAnalyzeFeeds = async () => {
    console.log('\n--- Fetching RSS Feeds ---');
    for (const feedInfo of RSS_FEEDS) {
        try {
            console.log(`\n📡 Fetching RSS feed: ${feedInfo.name}`);
            const feed = await parser.parseURL(feedInfo.url);
            console.log(`✅ Fetched successfully. Total items: ${feed.items.length}`);
            
            for (const item of feed.items) {
                await processItem(item);
            }
        } catch (error) {
            console.error(`❌ Error processing RSS feed ${feedInfo.name}:`, error.message);
        }
    }
};

const scrapeAndAnalyzeWebsites = async () => {
    console.log('\n--- Scraping Websites ---');
    try {
        if (!webScraper) {
            console.log('⚠️ webScraper module not available, skipping.');
            return;
        }

        const pensionArticles = await webScraper.scrapePensionRegulator();
        const sfoArticles = await webScraper.scrapeSFO();
        const fatfArticles = await webScraper.scrapeFATF();
        const allScraped = [...pensionArticles, ...sfoArticles, ...fatfArticles];
        
        console.log(`📊 Total scraped articles: ${allScraped.length}`);
        
        for (const item of allScraped) {
            await processItem(item);
        }
    } catch (error) {
        console.error('❌ Error in website scraping:', error.message);
    }
};


module.exports = {
    fetchAndAnalyzeFeeds,
    scrapeAndAnalyzeWebsites
};
