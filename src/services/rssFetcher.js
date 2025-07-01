// src/services/rssFetcher.js
// ENTERPRISE RSS & WEB FETCHER: Integrates Robust Scraper + Enhanced Analytics + Content Processing
// ENHANCED: Multi-source data pipeline with intelligent content validation and AI analysis

const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const aiAnalyzer = require('./aiAnalyzer');
const dbService = require('./dbService');
const { robustScraper } = require('./webScraper');

class EnhancedRSSFetcher {
    constructor() {
        this.parser = new Parser({
            timeout: 15000,
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
            startTime: null,
            rssSuccess: 0,
            webScrapingSuccess: 0,
            aiAnalysisSuccess: 0
        };

        // Enhanced RSS feed configurations
        this.rssFeedConfigs = [
            {
                name: 'FCA',
                url: 'https://www.fca.org.uk/news/rss.xml',
                description: 'Financial Conduct Authority',
                priority: 'high',
                authority: 'FCA',
                sectors: ['Banking', 'Investment Management', 'Consumer Credit', 'Insurance']
            },
            {
                name: 'BoE',
                url: 'https://www.bankofengland.co.uk/rss/news',
                description: 'Bank of England',
                priority: 'high',
                authority: 'BoE',
                sectors: ['Banking', 'Monetary Policy', 'Financial Stability']
            },
            {
                name: 'PRA',
                url: 'https://www.bankofengland.co.uk/rss/prudential-regulation-publications',
                description: 'Prudential Regulation Authority',
                priority: 'high',
                authority: 'PRA',
                sectors: ['Banking', 'Insurance', 'Prudential Regulation']
            },
            {
                name: 'ESMA',
                url: 'https://www.esma.europa.eu/news-and-events/news?field_esma_news_type_value=All&field_esma_news_date_value=All&title=&feed=rss',
                description: 'European Securities and Markets Authority',
                priority: 'medium',
                authority: 'ESMA',
                sectors: ['Capital Markets', 'Investment Management', 'Securities']
            }
        ];

        // Enhanced web scraping configurations
        this.webScrapingConfigs = [
            {
                name: 'FATF',
                authority: 'FATF',
                category: 'International',
                description: 'Financial Action Task Force',
                sectors: ['AML', 'Financial Crime', 'International Standards'],
                method: 'robust_scraper' // Use our enhanced scraper
            },
            {
                name: 'TPR',
                authority: 'TPR',
                category: 'Pensions',
                url: 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases',
                description: 'The Pensions Regulator',
                sectors: ['Pensions', 'Retirement', 'Trusteeship'],
                method: 'universal_scraper'
            },
            {
                name: 'SFO',
                authority: 'SFO',
                category: 'Enforcement',
                url: 'https://www.sfo.gov.uk/news-and-publications/news-releases/',
                description: 'Serious Fraud Office',
                sectors: ['Financial Crime', 'Enforcement', 'Fraud'],
                method: 'universal_scraper'
            },
            {
                name: 'JMLSG',
                authority: 'JMLSG',
                category: 'AML Guidance',
                url: 'https://www.jmlsg.org.uk/latest-news/',
                description: 'Joint Money Laundering Steering Group',
                sectors: ['AML', 'Financial Crime', 'Guidance'],
                method: 'universal_scraper'
            },
            {
                name: 'FRC',
                authority: 'FRC',
                category: 'Audit & Reporting',
                url: 'https://www.frc.org.uk/news-and-events/news',
                description: 'Financial Reporting Council',
                sectors: ['Audit', 'Corporate Reporting', 'Professional Standards'],
                method: 'universal_scraper'
            }
        ];
    }

    // ENHANCED DATE PARSING (Delegate to robust scraper)
    parseDate(dateString) {
        return robustScraper.parseDate(dateString);
    }

    // RECENT DATE CHECK
    isRecent(date, daysThreshold = 7) {
        return robustScraper.isRecent(date, daysThreshold);
    }

    // ENHANCED CONTENT VALIDATION
    validateContent(item) {
        return robustScraper.validateContent(item);
    }

    // ENHANCED ITEM PROCESSING with AI and Analytics
    async processItem(item, source, index = 0) {
        try {
            // Input validation
            if (!item.link || !item.title) {
                console.log(`⚠️ Skipping item ${index}: Missing link or title`);
                this.processingStats.skipped++;
                return null;
            }

            // Check if already processed (avoid duplicates)
            const exists = await dbService.updateExists(item.link);
            if (exists) {
                console.log(`⏭️ Skipping ${item.title.substring(0, 50)}... (already processed)`);
                this.processingStats.skipped++;
                return null;
            }

            console.log(`🔄 Processing [${source}] ${index + 1}: ${item.title.substring(0, 60)}...`);

            // Enhanced content validation
            const validation = this.validateContent(item);
            if (!validation.valid) {
                console.log(`⚠️ Content validation failed: ${validation.reason}`);
                this.processingStats.skipped++;
                return null;
            }

            // Scrape article content with enhanced robust method
            let content = null;
            let retryCount = 0;
            const maxRetries = 3;
            
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
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    }
                }
            }

            if (!content || content.length < 100) {
                console.log(`⚠️ Insufficient content for: ${item.title} (${content ? content.length : 0} chars)`);
                
                // Try to extract content from the item itself as fallback
                content = item.contentSnippet || item.content || item.summary || item.description || 'No content available';
                
                if (content.length < 50) {
                    this.processingStats.errors++;
                    return null;
                }
            }

            // Enhanced AI analysis with error handling
            let analysis = null;
            try {
                analysis = await aiAnalyzer.analyzeContentWithAI(content, item.link);
                if (analysis) {
                    this.processingStats.aiAnalysisSuccess++;
                }
            } catch (aiError) {
                console.log(`⚠️ AI analysis failed: ${aiError.message}`);
                
                // Create fallback analysis
                analysis = this.createFallbackAnalysis(item, content, source);
            }

            if (!analysis) {
                console.log(`❌ Both AI and fallback analysis failed for: ${item.title}`);
                this.processingStats.errors++;
                return null;
            }

            // Enhanced metadata enrichment
            analysis.sourceType = 'rss';
            analysis.sourceName = source;
            analysis.originalTitle = item.title;
            analysis.originalPubDate = item.pubDate;
            analysis.extractedAt = new Date().toISOString();
            analysis.contentLength = content.length;
            analysis.processingMethod = 'enhanced_rss_fetcher';

            // Add relevance scoring if we have sector information
            if (analysis.primarySectors && analysis.primarySectors.length > 0) {
                analysis.hasRelevanceData = true;
            }

            console.log(`✅ Successfully processed [${source}]: ${analysis.headline}`);
            this.processingStats.processed++;
            return analysis;

        } catch (error) {
            console.error(`❌ Error processing item ${index} from ${source}:`, error.message);
            this.processingStats.errors++;
            return null;
        }
    }

    // FALLBACK ANALYSIS CREATION
    createFallbackAnalysis(item, content, source) {
        console.log(`🔄 Creating fallback analysis for: ${item.title}`);
        
        // Extract basic information from title and content
        const title = item.title || 'Untitled Update';
        const impact = content.substring(0, 300) + (content.length > 300 ? '...' : '');
        
        // Determine authority from source
        const authorityMap = {
            'FCA': 'FCA',
            'BoE': 'BoE',
            'Bank of England': 'BoE',
            'PRA': 'PRA',
            'ESMA': 'ESMA',
            'FATF': 'FATF',
            'TPR': 'TPR',
            'SFO': 'SFO',
            'JMLSG': 'JMLSG',
            'FRC': 'FRC'
        };
        
        const authority = authorityMap[source] || 'Unknown';
        
        // Basic impact level determination
        let impactLevel = 'Informational';
        let urgency = 'Low';
        
        const highImpactKeywords = ['significant', 'major', 'critical', 'important', 'new regulation', 'enforcement', 'penalty'];
        const mediumImpactKeywords = ['guidance', 'consultation', 'update', 'change', 'requirement'];
        const urgentKeywords = ['immediate', 'urgent', 'deadline', 'by', 'must'];
        
        const textToAnalyze = (title + ' ' + impact).toLowerCase();
        
        if (highImpactKeywords.some(keyword => textToAnalyze.includes(keyword))) {
            impactLevel = 'Significant';
            urgency = 'Medium';
        } else if (mediumImpactKeywords.some(keyword => textToAnalyze.includes(keyword))) {
            impactLevel = 'Moderate';
        }
        
        if (urgentKeywords.some(keyword => textToAnalyze.includes(keyword))) {
            urgency = 'High';
        }
        
        // Basic sector determination
        let primarySectors = ['General'];
        const sectorKeywords = {
            'Banking': ['bank', 'banking', 'deposit', 'lending', 'credit'],
            'Investment Management': ['investment', 'fund', 'asset management', 'portfolio'],
            'Insurance': ['insurance', 'insurer', 'policy', 'claim'],
            'Consumer Credit': ['consumer', 'retail', 'mortgage', 'loan'],
            'Capital Markets': ['market', 'trading', 'securities', 'exchange'],
            'AML': ['money laundering', 'aml', 'suspicious activity', 'financial crime'],
            'Pensions': ['pension', 'retirement', 'scheme', 'trustee']
        };
        
        for (const [sector, keywords] of Object.entries(sectorKeywords)) {
            if (keywords.some(keyword => textToAnalyze.includes(keyword))) {
                primarySectors = [sector];
                break;
            }
        }

        return {
            headline: title,
            impact: impact,
            area: 'Regulatory Update',
            authority: authority,
            impactLevel: impactLevel,
            urgency: urgency,
            sector: primarySectors[0],
            primarySectors: primarySectors,
            keyDates: this.extractKeyDates(content),
            url: item.link,
            fetchedDate: new Date().toISOString(),
            isFallbackAnalysis: true,
            analysisMethod: 'fallback_extraction'
        };
    }

    // EXTRACT KEY DATES from content
    extractKeyDates(content) {
        const datePatterns = [
            /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
            /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
            /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g
        ];
        
        const dates = [];
        for (const pattern of datePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                dates.push(...matches.slice(0, 3)); // Limit to first 3 dates found
            }
        }
        
        return dates.join(', ') || 'No specific dates mentioned';
    }

    // ENHANCED RSS FEED PROCESSING
    async fetchAndAnalyzeFeeds() {
        console.log('📡 Starting enhanced RSS feed analysis with robust processing...');
        this.resetStats();

        let totalProcessed = 0;
        const feedResults = [];

        for (const feedConfig of this.rssFeedConfigs) {
            try {
                console.log(`\n📡 Processing ${feedConfig.description} RSS feed...`);
                console.log(`🔗 URL: ${feedConfig.url}`);

                const feedStartTime = Date.now();
                
                // Fetch RSS feed with enhanced timeout and retry
                const feed = await Promise.race([
                    this.parser.parseURL(feedConfig.url),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Feed fetch timeout')), 20000)
                    )
                ]);

                console.log(`📊 Found ${feed.items.length} items in ${feedConfig.name} feed`);

                // Filter recent items with enhanced date parsing
                const recentItems = feed.items
                    .filter(item => {
                        const itemDate = this.parseDate(item.pubDate);
                        return itemDate && this.isRecent(itemDate, 14); // 14 days for RSS
                    })
                    .slice(0, 15); // Increased limit for RSS feeds

                console.log(`📅 ${recentItems.length} recent items found`);

                if (recentItems.length === 0) {
                    console.log(`⏭️ No recent items in ${feedConfig.name} feed`);
                    feedResults.push({
                        feed: feedConfig.name,
                        total: feed.items.length,
                        processed: 0,
                        timeMs: Date.now() - feedStartTime,
                        status: 'no_recent_items'
                    });
                    continue;
                }

                // Process items in controlled batches with enhanced concurrency
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
                    timeMs: feedTime,
                    status: 'success'
                });

                console.log(`✅ ${feedConfig.name}: ${successCount}/${recentItems.length} items processed in ${Math.round(feedTime/1000)}s`);
                totalProcessed += successCount;
                this.processingStats.rssSuccess += successCount;

            } catch (error) {
                console.error(`❌ Error processing ${feedConfig.name} feed:`, error.message);
                feedResults.push({
                    feed: feedConfig.name,
                    error: error.message,
                    status: 'error'
                });
            }
        }

        this.logStats('Enhanced RSS Feeds');
        return { totalProcessed, feedResults, stats: this.processingStats };
    }

    // ENHANCED WEB SCRAPING with Robust Scraper Integration
    async scrapeAndAnalyzeWebsites() {
        console.log('🕷️ Starting enhanced website scraping with robust multi-strategy approach...');
        this.resetStats();

        let totalProcessed = 0;
        const scrapeResults = [];

        for (const siteConfig of this.webScrapingConfigs) {
            try {
                console.log(`\n🕷️ Scraping ${siteConfig.description}...`);

                const scrapeStartTime = Date.now();
                let scrapedItems = [];

                // Use appropriate scraping method
                if (siteConfig.method === 'robust_scraper' && siteConfig.name === 'FATF') {
                    // Use our enhanced FATF scraper
                    scrapedItems = await robustScraper.scrapeFATF();
                } else if (siteConfig.method === 'universal_scraper' && siteConfig.url) {
                    // Use universal scraper for other sites
                    scrapedItems = await robustScraper.scrapeUniversalSite(siteConfig.url);
                } else {
                    console.log(`⚠️ No scraping method configured for ${siteConfig.name}`);
                    continue;
                }
                
                if (scrapedItems.length === 0) {
                    console.log(`⚠️ No recent items found for ${siteConfig.name}`);
                    scrapeResults.push({
                        site: siteConfig.name,
                        total: 0,
                        processed: 0,
                        timeMs: Date.now() - scrapeStartTime,
                        status: 'no_items'
                    });
                    continue;
                }

                // Process scraped items with AI analysis
                const processedItems = await this.processBatch(
                    scrapedItems, 
                    siteConfig.name, 
                    this.maxConcurrentProcessing
                );

                const scrapeTime = Date.now() - scrapeStartTime;
                const successCount = processedItems.filter(item => item !== null).length;
                
                scrapeResults.push({
                    site: siteConfig.name,
                    total: scrapedItems.length,
                    processed: successCount,
                    timeMs: scrapeTime,
                    status: 'success'
                });

                console.log(`✅ ${siteConfig.name}: ${successCount}/${scrapedItems.length} items processed in ${Math.round(scrapeTime/1000)}s`);
                totalProcessed += successCount;
                this.processingStats.webScrapingSuccess += successCount;

            } catch (error) {
                console.error(`❌ Error scraping ${siteConfig.name}:`, error.message);
                scrapeResults.push({
                    site: siteConfig.name,
                    error: error.message,
                    status: 'error'
                });
            }
        }

        this.logStats('Enhanced Website Scraping');
        return { totalProcessed, scrapeResults, stats: this.processingStats };
    }

    // ENHANCED BATCH PROCESSING with better error handling
    async processBatch(items, sourceName, maxConcurrent = 3) {
        const results = [];
        const batchSize = Math.min(maxConcurrent, items.length);
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            
            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)} for ${sourceName}`);
            
            const batchPromises = batch.map((item, batchIndex) => 
                this.processItem(item, sourceName, i + batchIndex)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`❌ Batch processing error for item ${i + index}:`, result.reason);
                    this.processingStats.errors++;
                    results.push(null);
                }
            });
            
            // Enhanced rate limiting with source-specific delays
            if (i + batchSize < items.length) {
                const delay = sourceName === 'FATF' ? 3000 : 2000; // Longer delay for FATF
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return results;
    }

    // STATISTICS MANAGEMENT
    resetStats() {
        this.processingStats = {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 0,
            startTime: Date.now(),
            rssSuccess: 0,
            webScrapingSuccess: 0,
            aiAnalysisSuccess: 0
        };
    }

    logStats(operation) {
        const elapsed = Date.now() - this.processingStats.startTime;
        console.log('\n=====================================');
        console.log(`📊 ${operation} ENHANCED STATISTICS`);
        console.log(`✅ Processed: ${this.processingStats.processed}`);
        console.log(`📡 RSS Success: ${this.processingStats.rssSuccess}`);
        console.log(`🕷️ Web Scraping Success: ${this.processingStats.webScrapingSuccess}`);
        console.log(`🤖 AI Analysis Success: ${this.processingStats.aiAnalysisSuccess}`);
        console.log(`⏭️ Skipped: ${this.processingStats.skipped}`);
        console.log(`❌ Errors: ${this.processingStats.errors}`);
        console.log(`⏱️ Time: ${Math.round(elapsed / 1000)}s`);
        console.log(`📈 Success Rate: ${Math.round((this.processingStats.processed / (this.processingStats.processed + this.processingStats.errors)) * 100)}%`);
        console.log('=====================================\n');
    }

    // MAIN COMPREHENSIVE FETCHING ORCHESTRATOR
    async fetchAll() {
        console.log('🚀 Starting ENHANCED comprehensive regulatory data fetch with robust multi-strategy approach...');
        
        const overallStartTime = Date.now();
        
        try {
            // Initialize database with enhanced error handling
            await dbService.initialize();
            console.log('✅ Database initialized successfully');
            
            // Phase 1: Enhanced RSS Feeds (Higher priority)
            console.log('\n📡 Phase 1: Enhanced RSS Feed Processing');
            const rssResult = await this.fetchAndAnalyzeFeeds();
            
            // Cooling period with status update
            console.log('\n⏸️ Cooling down between phases (enhanced rate limiting)...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Longer delay for stability
            
            // Phase 2: Enhanced Website Scraping with Robust Methods
            console.log('\n🕷️ Phase 2: Enhanced Website Scraping with Multi-Strategy Approach');
            const scrapeResult = await this.scrapeAndAnalyzeWebsites();
            
            const totalTime = Date.now() - overallStartTime;
            const totalProcessed = rssResult.totalProcessed + scrapeResult.totalProcessed;
            
            // Enhanced cleanup with statistics
            console.log('\n🧹 Running enhanced database cleanup...');
            const cleanedCount = await dbService.cleanup();
            
            // Comprehensive results summary
            console.log('\n=========================================');
            console.log('🎉 ENHANCED COMPREHENSIVE FETCH COMPLETE');
            console.log(`📊 Total items processed: ${totalProcessed}`);
            console.log(`📡 RSS feeds: ${rssResult.totalProcessed}`);
            console.log(`🕷️ Web scraping: ${scrapeResult.totalProcessed}`);
            console.log(`🤖 AI analysis success: ${this.processingStats.aiAnalysisSuccess}`);
            console.log(`🧹 Cleaned entries: ${cleanedCount}`);
            console.log(`⏱️ Total time: ${Math.round(totalTime / 1000)}s`);
            console.log(`📈 Overall success rate: ${Math.round((totalProcessed / (totalProcessed + this.processingStats.errors)) * 100)}%`);
            console.log('=========================================');
            
            return {
                success: true,
                totalProcessed,
                rssCount: rssResult.totalProcessed,
                scrapeCount: scrapeResult.totalProcessed,
                aiAnalysisCount: this.processingStats.aiAnalysisSuccess,
                cleanedCount,
                timeElapsed: totalTime,
                feedResults: rssResult.feedResults,
                scrapeResults: scrapeResult.scrapeResults,
                enhancedStats: {
                    successRate: Math.round((totalProcessed / (totalProcessed + this.processingStats.errors)) * 100),
                    errorRate: Math.round((this.processingStats.errors / (totalProcessed + this.processingStats.errors)) * 100),
                    averageProcessingTime: Math.round(totalTime / Math.max(totalProcessed, 1))
                }
            };
            
        } catch (error) {
            console.error('❌ Error in enhanced comprehensive fetch:', error);
            return {
                success: false,
                error: error.message,
                timeElapsed: Date.now() - overallStartTime,
                partialResults: {
                    processed: this.processingStats.processed,
                    errors: this.processingStats.errors
                }
            };
        }
    }
}

// Create singleton instance
const enhancedRSSFetcher = new EnhancedRSSFetcher();

// Export methods for backward compatibility and new functionality
module.exports = {
    // Primary enhanced methods
    fetchAndAnalyzeFeeds: () => enhancedRSSFetcher.fetchAndAnalyzeFeeds(),
    scrapeAndAnalyzeWebsites: () => enhancedRSSFetcher.scrapeAndAnalyzeWebsites(),
    fetchAll: () => enhancedRSSFetcher.fetchAll(),
    
    // Utility methods
    parseDate: (dateStr) => enhancedRSSFetcher.parseDate(dateStr),
    isRecent: (date, days) => enhancedRSSFetcher.isRecent(date, days),
    validateContent: (item) => enhancedRSSFetcher.validateContent(item),
    
    // Export fetcher instance for advanced usage
    enhancedRSSFetcher
};