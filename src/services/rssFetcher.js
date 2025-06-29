// FINAL DEPLOYMENT FIX: This comment is added to force a new file hash.

const Parser = require('rss-parser');
const parser = new Parser();
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
            return null;
        }
        return parsedDate;
    } catch (error) {
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

    try {
        const existing = await dbService.findUpdate(articleUrl);
        if (existing) {
            console.log('⏭️ Skipping: Already in database.');
            return;
        }
    } catch (error) {
        console.log('⚠️ Could not check for existing update:', error.message);
    }
    
    const content = await aiAnalyzer.scrapeArticleContent(articleUrl);
    
    if (!content || content.length < 100) {
        console.log('❌ Failed to scrape sufficient content for URL:', articleUrl);
        return;
    }
    
    await aiAnalyzer.analyzeContentWithAI(content, articleUrl);
};


const fetchAndAnalyzeFeeds = async () => {
    console.log('\n--- Fetching RSS Feeds ---');
    for (const feedInfo of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedInfo.url);
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
        const pensionArticles = await webScraper.scrapePensionRegulator();
        const sfoArticles = await webScraper.scrapeSFO();
        const fatfArticles = await webScraper.scrapeFATF();
        const allScraped = [...pensionArticles, ...sfoArticles, ...fatfArticles];
        
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
