// src/services/rssFetcher.js
// Enhanced RSS feed fetching and website scraping with improved error handling and performance

const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const aiAnalyzer = require('./aiAnalyzer');
const dbService = require('./dbService');

class RSSFetcher {
    constructor() {
        this.parser = new Parser({
            timeout: 10000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.maxConcurrentProcessing = 3;
        this.processingStats = {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 0,
            startTime: null
        };
    }

    // Enhanced date parsing with more formats
    parseDate(dateString) {
        if (!dateString) return null;
        
        try {
            // Clean common date format issues
            const cleanDate = dateString
                .replace(/^[A-Za-z]+,\s*/, '') // Remove day name prefix
                .replace(/\s*-\s*\d{2}:\d{2}$/, '') // Remove timezone suffix
                .replace(/(\d+)(st|nd|rd|th)/, '$1') // Remove ordinal suffixes
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            
            // Try multiple date parsing approaches
            const dateFormats = [
                cleanDate,
                cleanDate.replace(/(\d{1,2})\s+(\w+)\s+(\d{4})/, '$2 $1, $3'), // Reorder day/month
                cleanDate.replace(/(\d{4})-(\d{2})-(\d{2})/, '$2/$3/$1'), // ISO to US format
            ];
            
            for (const format of dateFormats) {
                const parsedDate = new Date(format);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate;
                }
            }
            
            console.log(`📅 Unable to parse date: "${dateString}"`);
            return null;
            
        } catch (error) {
            console.log(`📅 Date parsing error for "${dateString}":`, error.message);
            return null;
        }
    }

    // Check if date is within recent threshold
    isRecent(date, daysThreshold = 7) {
        if (!date) return false;
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysThreshold);
        return date >= threshold;
    }

    // Enhanced item processing with better error handling
    async processItem(item, source, index = 0) {
        try {
            // Input validation
            if (!item.link || !item.title) {
                console.log(`⚠️ Skipping item ${index}: Missing link or title`);
                this.processingStats.skipped++;
                return null;
            }

            // Skip if already processed
            const exists = await dbService.updateExists(item.link);
            if (exists) {
                console.log(`⏭️ Skipping ${item.title.substring(0, 50)}... (already processed)`);
                this.processingStats.skipped++;
                return null;
            }

            console.log(`🔄 Processing [${source}] ${index + 1}: ${item.title.substring(0, 60)}...`);

            // Scrape article content with retry logic
            let content = null;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (!content && retryCount < maxRetries) {
                try {
                    content = await aiAnalyzer.scrapeArticleContent(item.link);
                    if (content && content.length >= 100) {
                        break;
                    }
                } catch (scrapeError) {
                    retryCount++;
                    console.log(`⚠️ Scrape attempt ${retryCount} failed: ${scrapeError.message}`);
                    if (retryCount < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            if (!content || content.length < 100) {
                console.log(`⚠️ Insufficient content for: ${item.title} (${content ? content.length : 0} chars)`);
                this.processingStats.errors++;
                return null;
            }

            // Analyze with AI
            const analysis = await aiAnalyzer.analyzeContentWithAI(content, item.link);
            if (!analysis) {
                console.log(`❌ AI analysis failed for: ${item.title}`);
                this.processingStats.errors++;
                return null;
            }

            // Add source metadata
            analysis.sourceType = 'rss';
            analysis.sourceName = source;
            analysis.originalTitle = item.title;
            analysis.originalPubDate = item.pubDate;

            console.log(`✅ Successfully processed [${source}]: ${analysis.headline}`);
            this.processingStats.processed++;
            return analysis;

        } catch (error) {
            console.error(`❌ Error processing item ${index} from ${source}:`, error.message);
            this.processingStats.errors++;
            return null;
        }
    }

    // Enhanced RSS feed fetching with better error handling
    async fetchAndAnalyzeFeeds() {
        console.log('📡 Starting enhanced RSS feed analysis...');
        this.resetStats();

        const feeds = [
            {
                name: 'FCA',
                url: 'https://www.fca.org.uk/news/rss.xml',
                description: 'Financial Conduct Authority',
                priority: 'high'
            },
            {
                name: 'BoE',
                url: 'https://www.bankofengland.co.uk/rss/news',
                description: 'Bank of England',
                priority: 'high'
            },
            {
                name: 'PRA',
                url: 'https://www.bankofengland.co.uk/rss/prudential-regulation-publications',
                description: 'Prudential Regulation Authority',
                priority: 'medium'
            }
        ];

        let totalProcessed = 0;
        const feedResults = [];

        for (const feedConfig of feeds) {
            try {
                console.log(`\n📡 Processing ${feedConfig.description} RSS feed...`);
                console.log(`🔗 URL: ${feedConfig.url}`);

                const feedStartTime = Date.now();
                
                // Fetch RSS feed with timeout
                const feed = await Promise.race([
                    this.parser.parseURL(feedConfig.url),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Feed fetch timeout')), 15000)
                    )
                ]);

                console.log(`📊 Found ${feed.items.length} items in ${feedConfig.name} feed`);

                // Filter recent items
                const recentItems = feed.items
                    .filter(item => {
                        const itemDate = this.parseDate(item.pubDate);
                        return itemDate && this.isRecent(itemDate, 7);
                    })
                    .slice(0, 10); // Limit to prevent overwhelming

                console.log(`📅 ${recentItems.length} recent items found`);

                if (recentItems.length === 0) {
                    console.log(`⏭️ No recent items in ${feedConfig.name} feed`);
                    continue;
                }

                // Process items in controlled batches
                const processedItems = await this.processBatch(
                    recentItems, 
                    feedConfig.name, 
                    this.maxConcurrentProcessing
                );

                const feedTime = Date.now() - feedStartTime;
                const successCount = processedItems.filter(item => item !== null).length;
                
                feedResults.push({
                    feed: feedConfig.name,
                    total: recentItems.length,
                    processed: successCount,
                    timeMs: feedTime
                });

                console.log(`✅ ${feedConfig.name}: ${successCount}/${recentItems.length} items processed in ${Math.round(feedTime/1000)}s`);
                totalProcessed += successCount;

            } catch (error) {
                console.error(`❌ Error processing ${feedConfig.name} feed:`, error.message);
                feedResults.push({
                    feed: feedConfig.name,
                    error: error.message
                });
            }
        }

        this.logStats('RSS Feeds');
        return { totalProcessed, feedResults, stats: this.processingStats };
    }

    // Enhanced website scraping with improved selectors
    async scrapeAndAnalyzeWebsites() {
        console.log('🕷️ Starting enhanced website scraping...');
        this.resetStats();

        const websites = [
            {
                name: 'TPR',
                url: 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases',
                description: 'The Pensions Regulator',
                selectors: [
                    '.press-release-item',
                    '.news-item',
                    '.article-item',
                    'article',
                    '.content-item',
                    '.media-item'
                ],
                linkSelectors: ['h3 a', 'h2 a', 'h4 a', 'a.title', '.title a', 'a'],
                dateSelectors: ['time', '.date', '.published', '.article-date', '.press-release-date']
            },
            {
                name: 'SFO',
                url: 'https://www.sfo.gov.uk/news-and-publications/news-releases/',
                description: 'Serious Fraud Office',
                selectors: [
                    '.news-item',
                    '.article-item',
                    'article',
                    '.content-item',
                    '.press-release',
                    '.news-listing-item'
                ],
                linkSelectors: ['.news-item__title a', 'h3 a', 'h2 a', '.title a', 'a.title', 'a'],
                dateSelectors: ['.news-item__date', '.date', 'time', '.published']
            },
            {
                name: 'FATF',
                url: 'https://www.fatf-gafi.org/en/the-fatf/news.html',
                description: 'Financial Action Task Force',
                selectors: [
                    '.publication-item',
                    '.news-item',
                    'article',
                    '.content-item',
                    '.document-item'
                ],
                linkSelectors: ['h3 a', 'h2 a', 'h4 a', '.title a', 'a.title', 'a'],
                dateSelectors: ['.publication-item-date', '.date', 'time', '.published']
            },
{
                name: 'EBA Consultations',
                authority: 'EBA',
                category: 'International',
                url: 'https://www.eba.europa.eu/publications-and-media/consultations',
                description: 'European Banking Authority Consultations',
                sectors: ['Banking', 'Payments', 'AML', 'Prudential'],
                selectors: ['.views-row', '.consultation-item', '.content-item', 'article'],
                linkSelectors: ['h3 a', 'h2 a', '.title a', '.field-content a'],
                dateSelectors: ['.date-display-single', '.date', '.published', 'time']
            },
            {
                name: 'JMLSG Latest News',
                authority: 'JMLSG',
                category: 'AML Guidance',
                url: 'https://www.jmlsg.org.uk/latest-news/',
                description: 'Joint Money Laundering Steering Group Latest News',
                sectors: ['AML', 'Financial Crime', 'Guidance'],
                selectors: ['.news-item', '.post', '.content-item', 'article'],
                linkSelectors: ['h2 a', 'h3 a', '.title a', '.post-title a'],
                dateSelectors: ['.post-date', '.date', '.published', 'time']
            },
            {
                name: 'NCA News',
                authority: 'NCA',
                category: 'Government Agency',
                url: 'https://www.nationalcrimeagency.gov.uk/news',
                description: 'National Crime Agency News',
                sectors: ['Financial Crime', 'AML', 'Serious Crime'],
                selectors: ['.views-row', '.news-item', '.content-item', 'article'],
                linkSelectors: ['h3 a', 'h2 a', '.field-content a', '.title a'],
                dateSelectors: ['.date-display-single', '.date', '.published', 'time']
            },
            {
                name: 'OFSI Publications',
                authority: 'OFSI',
                category: 'Government Agency',
                url: 'https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation',
                description: 'Office of Financial Sanctions Implementation',
                sectors: ['Sanctions', 'Financial Crime'],
                selectors: ['.gem-c-document-list__item', '.publication', '.news-story', 'article'],
                linkSelectors: ['.gem-c-document-list__item-title a', 'h3 a', 'h2 a'],
                dateSelectors: ['.gem-c-document-list__attribute', '.gem-c-metadata__text', '.date']
            }     
        ];

        let totalProcessed = 0;
        const scrapeResults = [];

        for (const site of websites) {
            try {
                console.log(`\n🕷️ Scraping ${site.description}...`);
                console.log(`🔗 URL: ${site.url}`);

                const scrapeStartTime = Date.now();
                const scrapedItems = await this.scrapeSite(site);
                
                if (scrapedItems.length === 0) {
                    console.log(`⚠️ No recent items found for ${site.name}`);
                    continue;
                }

                // Process scraped items
                const processedItems = await this.processBatch(
                    scrapedItems, 
                    site.name, 
                    this.maxConcurrentProcessing
                );

                const scrapeTime = Date.now() - scrapeStartTime;
                const successCount = processedItems.filter(item => item !== null).length;
                
                scrapeResults.push({
                    site: site.name,
                    total: scrapedItems.length,
                    processed: successCount,
                    timeMs: scrapeTime
                });

                console.log(`✅ ${site.name}: ${successCount}/${scrapedItems.length} items processed in ${Math.round(scrapeTime/1000)}s`);
                totalProcessed += successCount;

            } catch (error) {
                console.error(`❌ Error scraping ${site.name}:`, error.message);
                scrapeResults.push({
                    site: site.name,
                    error: error.message
                });
            }
        }

        this.logStats('Website Scraping');
        return { totalProcessed, scrapeResults, stats: this.processingStats };
    }

    // Enhanced site scraping method
    async scrapeSite(siteConfig) {
        try {
            const { data } = await axios.get(siteConfig.url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 15000,
                maxRedirects: 5
            });

            const $ = cheerio.load(data);
            const items = [];
            let foundItems = false;

            // Try different selectors until we find content
            for (const selector of siteConfig.selectors) {
                const elements = $(selector);
                if (elements.length > 0) {
                    console.log(`✅ Found ${elements.length} items using selector: ${selector}`);
                    foundItems = true;

                    const extractedItems = [];
                    
                    elements.each((index, element) => {
                        if (index >= 8) return false; // Limit to prevent overwhelming

                        try {
                            const item = this.extractItemFromElement($, element, siteConfig);
                            if (item && this.validateItem(item)) {
                                extractedItems.push(item);
                            }
                        } catch (itemError) {
                            console.log(`⚠️ Error extracting item ${index}:`, itemError.message);
                        }
                    });

                    // Filter for recent items only
                    const recentItems = extractedItems.filter(item => {
                        const date = this.parseDate(item.pubDate);
                        return date && this.isRecent(date, 7);
                    });

                    console.log(`📅 ${recentItems.length} recent items from ${extractedItems.length} total`);
                    items.push(...recentItems);
                    break;
                }
            }

            if (!foundItems) {
                console.log(`⚠️ No items found for ${siteConfig.name} with any selector`);
            }

            return items;

        } catch (error) {
            console.error(`❌ Error scraping ${siteConfig.name}:`, error.message);
            return [];
        }
    }

    // Extract item data from DOM element
    extractItemFromElement($, element, siteConfig) {
        // Extract title and URL
        let titleElement = null;
        for (const linkSelector of siteConfig.linkSelectors) {
            titleElement = $(element).find(linkSelector).first();
            if (titleElement.length > 0) break;
        }

        if (!titleElement || titleElement.length === 0) {
            return null;
        }

        const title = titleElement.text().trim();
        let relativeUrl = titleElement.attr('href');

        if (!title || !relativeUrl) {
            return null;
        }

        // Make URL absolute
        const absoluteUrl = relativeUrl.startsWith('http') ? 
            relativeUrl : new URL(relativeUrl, siteConfig.url).href;

        // Extract date
        let dateStr = '';
        for (const dateSelector of siteConfig.dateSelectors) {
            dateStr = $(element).find(dateSelector).text().trim();
            if (dateStr) break;
        }

        // Fallback to regex search in element text
        if (!dateStr) {
            const text = $(element).text();
            const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
            if (dateMatch) dateStr = dateMatch[1];
        }

        const date = this.parseDate(dateStr);

        return {
            title: title,
            link: absoluteUrl,
            pubDate: date ? date.toISOString() : new Date().toISOString()
        };
    }

    // Validate item has required fields
    validateItem(item) {
        return item && 
               item.title && 
               item.title.length > 10 && 
               item.link && 
               item.link.startsWith('http');
    }

    // Process items in controlled batches
    async processBatch(items, sourceName, maxConcurrent = 3) {
        const results = [];
        
        for (let i = 0; i < items.length; i += maxConcurrent) {
            const batch = items.slice(i, i + maxConcurrent);
            
            console.log(`🔄 Processing batch ${Math.floor(i/maxConcurrent) + 1}/${Math.ceil(items.length/maxConcurrent)} for ${sourceName}`);
            
            const batchPromises = batch.map((item, batchIndex) => 
                this.processItem(item, sourceName, i + batchIndex)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`❌ Batch processing error:`, result.reason);
                    this.processingStats.errors++;
                }
            });
            
            // Rate limiting delay between batches
            if (i + maxConcurrent < items.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        return results;
    }

    // Reset processing statistics
    resetStats() {
        this.processingStats = {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    // Log processing statistics
    logStats(operation) {
        const elapsed = Date.now() - this.processingStats.startTime;
        console.log('\n=====================================');
        console.log(`📊 ${operation} STATISTICS`);
        console.log(`✅ Processed: ${this.processingStats.processed}`);
        console.log(`⏭️ Skipped: ${this.processingStats.skipped}`);
        console.log(`❌ Errors: ${this.processingStats.errors}`);
        console.log(`⏱️ Time: ${Math.round(elapsed / 1000)}s`);
        console.log('=====================================\n');
    }

    // Main entry point - enhanced with better coordination
    async fetchAll() {
        console.log('🚀 Starting enhanced comprehensive regulatory data fetch...');
        
        const overallStartTime = Date.now();
        
        try {
            // Initialize database
            await dbService.initialize();
            console.log('✅ Database initialized');
            
            // Fetch from RSS feeds first (higher priority)
            console.log('\n📡 Phase 1: RSS Feeds');
            const rssResult = await this.fetchAndAnalyzeFeeds();
            
            // Add delay between phases to prevent overwhelming
            console.log('\n⏸️ Cooling down between phases...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Scrape websites second
            console.log('\n🕷️ Phase 2: Website Scraping');
            const scrapeResult = await this.scrapeAndAnalyzeWebsites();
            
            const totalTime = Date.now() - overallStartTime;
            const totalProcessed = rssResult.totalProcessed + scrapeResult.totalProcessed;
            
            // Final cleanup
            console.log('\n🧹 Running database cleanup...');
            const cleanedCount = await dbService.cleanup();
            
            console.log('\n=========================================');
            console.log('🎉 COMPREHENSIVE FETCH COMPLETE');
            console.log(`📊 Total items processed: ${totalProcessed}`);
            console.log(`📡 RSS feeds: ${rssResult.totalProcessed}`);
            console.log(`🕷️ Web scraping: ${scrapeResult.totalProcessed}`);
            console.log(`🧹 Cleaned entries: ${cleanedCount}`);
            console.log(`⏱️ Total time: ${Math.round(totalTime / 1000)}s`);
            console.log('=========================================');
            
            return {
                success: true,
                totalProcessed,
                rssCount: rssResult.totalProcessed,
                scrapeCount: scrapeResult.totalProcessed,
                cleanedCount,
                timeElapsed: totalTime,
                feedResults: rssResult.feedResults,
                scrapeResults: scrapeResult.scrapeResults
            };
            
        } catch (error) {
            console.error('❌ Error in comprehensive fetch:', error);
            return {
                success: false,
                error: error.message,
                timeElapsed: Date.now() - overallStartTime
            };
        }
    }
}

// Export singleton instance
const rssFetcher = new RSSFetcher();

module.exports = {
    fetchAndAnalyzeFeeds: () => rssFetcher.fetchAndAnalyzeFeeds(),
    scrapeAndAnalyzeWebsites: () => rssFetcher.scrapeAndAnalyzeWebsites(),
    fetchAll: () => rssFetcher.fetchAll()
};