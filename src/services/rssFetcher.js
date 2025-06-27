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

// Helper function to parse FCA date format
const parseFCADate = (dateString) => {
    try {
        // Format: "Thursday, June 26, 2025 - 13:08"
        if (!dateString) return null;
        
        // Remove day of week and time, keep just "June 26, 2025"
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

// This function processes the RSS feeds
const fetchAndAnalyzeFeeds = async () => {
    console.log('\n--- 🔍 DEBUG: Fetching RSS Feeds ---');
    
    for (const feedInfo of RSS_FEEDS) {
        try {
            console.log('\n📡 Fetching RSS feed:', feedInfo.name);
            console.log('📡 URL:', feedInfo.url);
            
            const feed = await parser.parseURL(feedInfo.url);
            console.log('✅ RSS feed fetched successfully');
            console.log('📊 Total items in feed:', feed.items.length);
            
            if (feed.items.length === 0) {
                console.log('⚠️ No items found in this feed');
                continue;
            }
            
            // Show first few items for debugging
            console.log('\n🔍 First few items from feed:');
            feed.items.slice(0, 3).forEach((item, index) => {
                const parsedDate = parseFCADate(item.pubDate);
                console.log('Item ' + (index + 1) + ':');
                console.log('  Title:', item.title);
                console.log('  Raw Date:', item.pubDate);
                console.log('  Parsed Date:', parsedDate ? parsedDate.toISOString() : 'FAILED');
                console.log('  Link:', item.link);
            });
            
            // Process all items
            console.log('\n🔄 Processing items...');
            let processedCount = 0;
            let skippedCount = 0;
            
            for (const item of feed.items) {
                const result = await processItemDebug(item);
                if (result === 'processed') {
                    processedCount++;
                } else if (result === 'skipped') {
                    skippedCount++;
                }
            }
            
            console.log('📊 Feed processing summary for', feedInfo.name + ':');
            console.log('  - Processed:', processedCount);
            console.log('  - Skipped:', skippedCount);
            console.log('  - Total:', feed.items.length);
            
        } catch (error) {
            console.error('❌ Error processing RSS feed', feedInfo.name + ':', error.message);
        }
    }
};

// This function processes the scraped websites
const scrapeAndAnalyzeWebsites = async () => {
    console.log('\n--- 🔍 DEBUG: Scraping Websites ---');
    
    try {
        const pensionRegulatorArticles = await webScraper.scrapePensionRegulator();
        console.log('📊 Pension Regulator articles found:', pensionRegulatorArticles.length);
        
        const sfoArticles = await webScraper.scrapeSFO();
        console.log('📊 SFO articles found:', sfoArticles.length);
        
        const fatfArticles = await webScraper.scrapeFATF();
        console.log('📊 FATF articles found:', fatfArticles.length);
        
        const allScrapedArticles = [
            ...pensionRegulatorArticles,
            ...sfoArticles,
            ...fatfArticles,
        ];
        
        console.log('📊 Total scraped articles:', allScrapedArticles.length);
        
        if (allScrapedArticles.length > 0) {
            console.log('\n🔍 Sample scraped articles:');
            allScrapedArticles.slice(0, 2).forEach((item, index) => {
                console.log('Scraped Item ' + (index + 1) + ':');
                console.log('  Title:', item.title);
                console.log('  Date:', item.pubDate);
                console.log('  Link:', item.link);
            });
        }
        
        let processedCount = 0;
        let skippedCount = 0;
        
        for (const item of allScrapedArticles) {
            const result = await processItemDebug(item);
            if (result === 'processed') {
                processedCount++;
            } else if (result === 'skipped') {
                skippedCount++;
            }
        }
        
        console.log('📊 Scraped content processing summary:');
        console.log('  - Processed:', processedCount);
        console.log('  - Skipped:', skippedCount);
        console.log('  - Total:', allScrapedArticles.length);
        
    } catch (error) {
        console.error('❌ Error in website scraping:', error.message);
    }
};

// A generic function to process any article item with detailed debugging
const processItemDebug = async (item) => {
    const articleUrl = item.link;
    console.log('\n🔍 Processing item:', item.title || 'No title');
    console.log('🔗 URL:', articleUrl);
    
    // Parse the date properly
    const articleDate = parseFCADate(item.pubDate);
    if (!articleDate) {
        console.log('❌ Skipping: Could not parse article date');
        return 'failed';
    }
    
    // Check date filtering
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    console.log('📅 Article date:', articleDate.toISOString());
    console.log('📅 Three days ago:', threeDaysAgo.toISOString());
    console.log('📅 Is recent?', articleDate >= threeDaysAgo);
    
    if (articleDate < threeDaysAgo) {
        console.log('⏭️ Skipping: Article is older than 3 days');
        return 'skipped';
    }
    
    // Check if already exists
    const existing = await db.get('updates').find({ url: articleUrl }).value();
    if (existing) {
        console.log('⏭️ Skipping: Already processed');
        return 'skipped';
    }
    
    console.log('📰 Scraping article content...');
    const content = await aiAnalyzer.scrapeArticleContent(articleUrl);
    
    if (!content) {
        console.log('❌ Failed to scrape article content');
        return 'failed';
    }
    
    console.log('✅ Content scraped, length:', content.length);
    console.log('🤖 Starting AI analysis...');
    
    const aiResult = await aiAnalyzer.analyzeContentWithAI(content, articleUrl);
    
    if (aiResult) {
        console.log('✅ AI analysis successful:', aiResult.headline);
        return 'processed';
    } else {
        console.log('❌ AI analysis failed');
        return 'failed';
    }
};

module.exports = {
    fetchAndAnalyzeFeeds,
    scrapeAndAnalyzeWebsites
};