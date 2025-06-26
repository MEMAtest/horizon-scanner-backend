// =======================================================================
// --- UPDATED FILE 2 of 3: The Data Aggregator Module ---
// --- Update this file at:  src/modules/rss-fetcher.js
// =======================================================================
const Parser = require('rss-parser');
const parser = new Parser();
const aiAnalyzer = require('./ai-analyzer');
const db = require('../database');
const webScraper = require('./web-scraper');

const RSS_FEEDS = [
    { name: 'FCA News', url: 'https://www.fca.org.uk/news/rss.xml' },
    { name: 'BoE/PRA Publications', url: 'https://www.bankofengland.co.uk/rss/publications' },
    { name: 'BoE/PRA News', url: 'https://www.bankofengland.co.uk/rss/news' }
];

// This function processes the RSS feeds
const fetchAndAnalyzeFeeds = async () => {
    console.log(`\n--- Fetching RSS Feeds ---`);
    for (const feedInfo of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedInfo.url);
            console.log(`\nProcessing RSS feed: ${feedInfo.name}`);
            
            // *** CHANGE: No longer slicing the array. We process all items. ***
            for (const item of feed.items) {
                await processItem(item);
            }
        } catch (error) {
            console.error(`❌ Error processing RSS feed ${feedInfo.name}:`, error.message);
        }
    }
};

// This function processes the scraped websites
const scrapeAndAnalyzeWebsites = async () => {
    console.log(`\n--- Scraping Websites ---`);
    
    const pensionRegulatorArticles = await webScraper.scrapePensionRegulator();
    const sfoArticles = await webScraper.scrapeSFO();
    const fatfArticles = await webScraper.scrapeFATF();

    const allScrapedArticles = [
        ...pensionRegulatorArticles,
        ...sfoArticles,
        ...fatfArticles,
    ];
    
    for (const item of allScrapedArticles) {
        await processItem(item);
    }
};

// A generic function to process any article item
const processItem = async (item) => {
    const articleUrl = item.link;

    // *** NEW: Check if the article is within the last 3 days ***
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const articleDate = new Date(item.pubDate);

    if (articleDate < threeDaysAgo) {
        // console.log(`- Skipping old article: ${item.title}`); // Optional: uncomment for verbose logging
        return; 
    }
    
    const existing = db.get('updates').find({ url: articleUrl }).value();
    if (existing) {
        console.log(`- Skipping already processed article: ${item.title}`);
        return;
    }

    const content = await aiAnalyzer.scrapeArticleContent(articleUrl);
    if (content) {
        await aiAnalyzer.analyzeContentWithAI(content, articleUrl);
    }
};

module.exports = {
    fetchAndAnalyzeFeeds,
    scrapeAndAnalyzeWebsites
};
