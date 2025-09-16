// src/services/webScraperService.js
// Advanced Web Scraping Service for Comprehensive Regulatory Data Collection
// Phase 2: Enhanced Data Collection with International Coverage

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const dbService = require('./dbService');
const aiAnalyzer = require('./aiAnalyzer');
const { 
    getAllSources, 
    getSourcesByPriority,
    CONTENT_VALIDATION_RULES,
    DATA_QUALITY_RULES 
} = require('../sources/enhancedSources');

class WebScraperService {
    constructor() {
        this.processingStats = {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 0,
            startTime: null,
            bySource: {},
            byType: {
                rss: 0,
                deepScraping: 0,
                international: 0
            }
        };
        
        this.rateLimiters = new Map();
        this.retryQueues = new Map();
        this.activeRequests = new Set();
        
        // Configure axios defaults
        this.httpClient = axios.create({
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0; +https://regulatory-scanner.com)'
            },
            maxRedirects: 5
        });
        
        this.setupAxiosInterceptors();
    }

    // AXIOS REQUEST/RESPONSE INTERCEPTORS
    setupAxiosInterceptors() {
        // Request interceptor for rate limiting
        this.httpClient.interceptors.request.use(async (config) => {
            const domain = new URL(config.url).hostname;
            await this.respectRateLimit(domain);
            this.activeRequests.add(config.url);
            return config;
        });

        // Response interceptor for cleanup and error handling
        this.httpClient.interceptors.response.use(
            (response) => {
                this.activeRequests.delete(response.config.url);
                return response;
            },
            (error) => {
                this.activeRequests.delete(error.config?.url);
                return Promise.reject(error);
            }
        );
    }

    // RATE LIMITING MANAGEMENT
    async respectRateLimit(domain) {
        const now = Date.now();
        const lastRequest = this.rateLimiters.get(domain) || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        // Default rate limit: 2 seconds between requests
        let rateLimit = 2000;
        
        // Adjust rate limits by domain
        if (domain.includes('fatf-gafi.org')) rateLimit = 4000;
        else if (domain.includes('europa.eu')) rateLimit = 3000;
        else if (domain.includes('bis.org')) rateLimit = 4000;
        
        if (timeSinceLastRequest < rateLimit) {
            const waitTime = rateLimit - timeSinceLastRequest;
            console.log(`⏳ Rate limiting ${domain}: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.rateLimiters.set(domain, Date.now());
    }

    // ROBUST HTTP REQUEST WITH RETRY LOGIC
    async makeRequest(url, options = {}) {
        const maxRetries = options.retries || 3;
        const baseDelay = options.baseDelay || 1000;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🌐 Request attempt ${attempt}/${maxRetries}: ${url}`);
                
                const response = await this.httpClient.get(url, {
                    timeout: options.timeout || 30000,
                    headers: {
                        ...options.headers,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                // Validate response
                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                if (!response.data || response.data.length < 100) {
                    throw new Error('Response too short or empty');
                }
                
                console.log(`✅ Successfully fetched: ${url} (${response.data.length} bytes)`);
                return response;
                
            } catch (error) {
                console.log(`❌ Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // CONTENT VALIDATION ENGINE
    validateContent(title, content, url) {
        const validation = { valid: true, issues: [] };
        
        // Check minimum length requirements
        if (title.length < CONTENT_VALIDATION_RULES.minimumLength.title) {
            validation.issues.push(`Title too short: ${title.length} chars`);
        }
        
        if (content.length < CONTENT_VALIDATION_RULES.minimumLength.content) {
            validation.issues.push(`Content too short: ${content.length} chars`);
        }
        
        // Check for spam indicators
        const textToCheck = (title + ' ' + content).toLowerCase();
        const hasSpam = CONTENT_VALIDATION_RULES.spamIndicators.some(indicator => 
            textToCheck.includes(indicator)
        );
        
        if (hasSpam) {
            validation.issues.push('Contains spam indicators');
        }
        
        // Check for required regulatory keywords
        const hasRegulatoryContent = CONTENT_VALIDATION_RULES.requiredKeywords.some(keyword => 
            textToCheck.includes(keyword)
        );
        
        if (!hasRegulatoryContent && content.length > 100) {
            validation.issues.push('No regulatory keywords found');
        }
        
        // Check exclude patterns
        const hasExcludePattern = CONTENT_VALIDATION_RULES.excludePatterns.some(pattern => 
            pattern.test(textToCheck)
        );
        
        if (hasExcludePattern) {
            validation.issues.push('Matches exclude pattern');
        }
        
        // Validate URL format
        try {
            new URL(url);
        } catch (error) {
            validation.issues.push('Invalid URL format');
        }
        
        validation.valid = validation.issues.length === 0;
        return validation;
    }

    // DEEP WEBSITE SCRAPING
    async performDeepScraping(sourceConfig) {
        const results = [];
        console.log(`🕷️ Starting deep scraping for ${sourceConfig.name}`);
        
        if (!sourceConfig.deepScraping) {
            console.log(`⏭️ No deep scraping configured for ${sourceConfig.name}`);
            return results;
        }
        
        for (const [scrapingType, config] of Object.entries(sourceConfig.deepScraping)) {
            try {
                console.log(`📋 Scraping ${scrapingType} from ${sourceConfig.name}`);
                
                const scrapingResults = await this.scrapeSection(
                    config, 
                    sourceConfig, 
                    scrapingType
                );
                
                results.push(...scrapingResults);
                
                // Respect rate limits between sections
                await new Promise(resolve => setTimeout(resolve, sourceConfig.scrapingConfig?.rateLimit || 2000));
                
            } catch (error) {
                console.error(`❌ Failed to scrape ${scrapingType} from ${sourceConfig.name}:`, error.message);
                this.processingStats.errors++;
            }
        }
        
        console.log(`✅ Deep scraping completed for ${sourceConfig.name}: ${results.length} items`);
        return results;
    }

    // SCRAPE INDIVIDUAL SECTION
    async scrapeSection(config, sourceConfig, scrapingType) {
        const results = [];
        let currentPage = 1;
        const maxPages = config.pagination?.maxPages || 1;
        
        while (currentPage <= maxPages) {
            try {
                let pageUrl = config.url;
                
                // Handle pagination
                if (currentPage > 1 && config.pagination) {
                    pageUrl = this.buildPaginationUrl(config.url, currentPage, config.pagination);
                }
                
                console.log(`📄 Scraping page ${currentPage}/${maxPages}: ${pageUrl}`);
                
                const response = await this.makeRequest(pageUrl, sourceConfig.scrapingConfig);
                const $ = cheerio.load(response.data);
                
                // Extract items using configured selectors
                const items = $(config.selectors.items);
                
                if (items.length === 0) {
                    console.log(`⚠️ No items found on page ${currentPage}`);
                    break;
                }
                
                console.log(`📋 Found ${items.length} items on page ${currentPage}`);
                
                for (let i = 0; i < items.length; i++) {
                    try {
                        const item = items.eq(i);
                        const extractedData = await this.extractItemData(
                            item, 
                            config.selectors, 
                            sourceConfig, 
                            scrapingType,
                            $
                        );
                        
                        if (extractedData) {
                            results.push(extractedData);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Failed to extract item ${i + 1}:`, error.message);
                    }
                }
                
                // Check for next page
                if (config.pagination && currentPage < maxPages) {
                    const nextPageExists = $(config.pagination.nextPage).length > 0;
                    if (!nextPageExists) {
                        console.log(`📄 No next page found, stopping pagination`);
                        break;
                    }
                }
                
                currentPage++;
                
                // Rate limiting between pages
                if (currentPage <= maxPages) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`❌ Failed to scrape page ${currentPage}:`, error.message);
                break;
            }
        }
        
        return results;
    }

    // EXTRACT DATA FROM INDIVIDUAL ITEM
    async extractItemData(item, selectors, sourceConfig, scrapingType, $) {
        try {
            // Extract basic fields
            const title = this.extractText(item, selectors.title, $);
            const url = this.extractUrl(item, selectors.url, sourceConfig.baseUrl, $);
            const date = this.extractDate(item, selectors.date, $);
            const summary = this.extractText(item, selectors.summary, $);
            
            // Extract optional fields
            const deadline = selectors.deadline ? this.extractDate(item, selectors.deadline, $) : null;
            const speaker = selectors.speaker ? this.extractText(item, selectors.speaker, $) : null;
            const status = selectors.status ? this.extractText(item, selectors.status, $) : null;
            const documentType = selectors.type ? this.extractText(item, selectors.type, $) : null;
            
            // Validate required fields
            if (!title || !url) {
                console.log(`⚠️ Skipping item: missing title or URL`);
                return null;
            }
            
            // Create rich data object
            const itemData = {
                headline: title.trim(),
                url: url,
                authority: sourceConfig.authority,
                area: scrapingType,
                source_category: 'deep_scraping',
                source_description: `${sourceConfig.name} - ${scrapingType}`,
                fetched_date: new Date().toISOString(),
                raw_data: {
                    scrapingType,
                    originalDate: date,
                    summary: summary?.trim(),
                    deadline: deadline,
                    speaker: speaker?.trim(),
                    status: status?.trim(),
                    documentType: documentType?.trim(),
                    sourceConfig: {
                        authority: sourceConfig.authority,
                        country: sourceConfig.country,
                        priority: sourceConfig.priority
                    }
                }
            };
            
            // Content validation
            const validation = this.validateContent(title, summary || '', url);
            if (!validation.valid) {
                console.log(`⚠️ Content validation failed: ${validation.issues.join(', ')}`);
                return null;
            }
            
            console.log(`✅ Extracted: ${title.substring(0, 80)}...`);
            return itemData;
            
        } catch (error) {
            console.error(`❌ Failed to extract item data:`, error.message);
            return null;
        }
    }

    // UTILITY FUNCTIONS FOR DATA EXTRACTION
    extractText(item, selector, $) {
        if (!selector) return null;
        
        try {
            const element = item.find ? item.find(selector) : $(selector, item);
            return element.first().text()?.trim() || null;
        } catch (error) {
            return null;
        }
    }

    extractUrl(item, selector, baseUrl, $) {
        if (!selector) return null;
        
        try {
            const element = item.find ? item.find(selector) : $(selector, item);
            let href = element.first().attr('href');
            
            if (!href) return null;
            
            // Convert relative URLs to absolute
            if (href.startsWith('/')) {
                href = baseUrl + href;
            } else if (!href.startsWith('http')) {
                href = baseUrl + '/' + href;
            }
            
            return href;
        } catch (error) {
            return null;
        }
    }

    extractDate(item, selector, $) {
        if (!selector) return null;
        
        try {
            const element = item.find ? item.find(selector) : $(selector, item);
            const dateText = element.first().text()?.trim();
            
            if (!dateText) return null;
            
            // Try to parse various date formats
            const date = new Date(dateText);
            return date.toISOString();
        } catch (error) {
            return null;
        }
    }

    buildPaginationUrl(baseUrl, pageNumber, paginationConfig) {
        // Simple pagination URL building
        // Can be enhanced based on specific site patterns
        if (baseUrl.includes('?')) {
            return `${baseUrl}&page=${pageNumber}`;
        } else {
            return `${baseUrl}?page=${pageNumber}`;
        }
    }

    // RSS FEED PROCESSING (Enhanced from Phase 0)
    async processRSSFeeds(sourceConfig) {
        const results = [];
        
        if (!sourceConfig.rssFeeds || sourceConfig.rssFeeds.length === 0) {
            return results;
        }
        
        console.log(`📡 Processing RSS feeds for ${sourceConfig.name}`);
        
        for (const feedConfig of sourceConfig.rssFeeds) {
            try {
                console.log(`📡 Fetching RSS: ${feedConfig.url}`);
                
                const response = await this.makeRequest(feedConfig.url, sourceConfig.scrapingConfig);
                const Parser = require('rss-parser');
                const parser = new Parser();
                const feed = await parser.parseString(response.data);
                
                for (const item of feed.items) {
                    try {
                        const itemData = {
                            headline: item.title?.trim(),
                            url: item.link,
                            authority: sourceConfig.authority,
                            area: feedConfig.type,
                            source_category: 'rss',
                            source_description: feedConfig.description,
                            fetched_date: new Date().toISOString(),
                            raw_data: {
                                rssType: feedConfig.type,
                                originalDate: item.pubDate,
                                summary: item.contentSnippet?.trim(),
                                content: item.content?.trim(),
                                sourceConfig: {
                                    authority: sourceConfig.authority,
                                    country: sourceConfig.country,
                                    priority: sourceConfig.priority
                                }
                            }
                        };
                        
                        // Validate content
                        const validation = this.validateContent(
                            item.title || '', 
                            item.contentSnippet || '', 
                            item.link
                        );
                        
                        if (validation.valid) {
                            results.push(itemData);
                            this.processingStats.byType.rss++;
                        }
                        
                    } catch (error) {
                        console.error(`❌ Failed to process RSS item:`, error.message);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Failed to process RSS feed ${feedConfig.url}:`, error.message);
                this.processingStats.errors++;
            }
        }
        
        console.log(`✅ RSS processing completed for ${sourceConfig.name}: ${results.length} items`);
        return results;
    }

    // MAIN COMPREHENSIVE SCRAPING ORCHESTRATOR
    async scrapeAllSources() {
        console.log('🚀 Starting comprehensive enhanced data collection...');
        
        this.resetStats();
        const allResults = [];
        const sources = getAllSources();
        
        try {
            // Initialize database
            await dbService.initialize();
            console.log('✅ Database initialized');
            
            // Process sources by priority (HIGH -> MEDIUM -> LOW)
            const priorities = ['HIGH', 'MEDIUM', 'LOW'];
            
            for (const priority of priorities) {
                console.log(`\n📊 Processing ${priority} priority sources...`);
                const prioritySources = getSourcesByPriority(priority);
                
                for (const [sourceKey, sourceConfig] of Object.entries(prioritySources)) {
                    try {
                        console.log(`\n🎯 Processing ${sourceConfig.name} (${sourceConfig.country})`);
                        this.processingStats.bySource[sourceKey] = { processed: 0, errors: 0 };
                        
                        // Process RSS feeds
                        const rssResults = await this.processRSSFeeds(sourceConfig);
                        allResults.push(...rssResults);
                        
                        // Process deep scraping
                        const scrapingResults = await this.performDeepScraping(sourceConfig);
                        allResults.push(...scrapingResults);
                        
                        this.processingStats.bySource[sourceKey].processed = rssResults.length + scrapingResults.length;
                        this.processingStats.processed += rssResults.length + scrapingResults.length;
                        
                        // Mark international sources
                        if (sourceConfig.country !== 'UK') {
                            this.processingStats.byType.international += rssResults.length + scrapingResults.length;
                        }
                        
                        this.processingStats.byType.deepScraping += scrapingResults.length;
                        
                        console.log(`✅ ${sourceConfig.name}: ${rssResults.length + scrapingResults.length} items collected`);
                        
                        // Rest between sources
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                    } catch (error) {
                        console.error(`❌ Failed to process ${sourceConfig.name}:`, error.message);
                        this.processingStats.errors++;
                        this.processingStats.bySource[sourceKey] = { processed: 0, errors: 1 };
                    }
                }
            }
            
            // Process all collected data
            console.log(`\n📝 Processing ${allResults.length} collected items...`);
            const finalResults = await this.processCollectedData(allResults);
            
            this.logComprehensiveStats();
            console.log(`🎉 Enhanced data collection complete: ${finalResults.length} items processed`);
            
            return finalResults;
            
        } catch (error) {
            console.error('❌ Critical error in enhanced data collection:', error);
            this.logComprehensiveStats();
            throw error;
        }
    }

    // PROCESS AND ENHANCE COLLECTED DATA
    async processCollectedData(rawResults) {
        const processedResults = [];
        
        console.log(`🔄 Post-processing ${rawResults.length} items...`);
        
        for (const item of rawResults) {
            try {
                // Check for duplicates
                const isDuplicate = await this.checkForDuplicate(item);
                if (isDuplicate) {
                    console.log(`⏭️ Skipping duplicate: ${item.headline?.substring(0, 50)}...`);
                    this.processingStats.skipped++;
                    continue;
                }
                
                // Enhance with AI analysis if available
                if (aiAnalyzer && typeof aiAnalyzer.analyzeUpdate === 'function') {
                    try {
                        const aiAnalysis = await aiAnalyzer.analyzeUpdate(item);
                        item.impact = aiAnalysis.impact;
                        item.urgency = aiAnalysis.urgency;
                        item.sector = aiAnalysis.sector;
                        item.key_dates = aiAnalysis.key_dates;
                        
                        // Store additional AI insights in raw_data
                        item.raw_data.aiAnalysis = aiAnalysis;
                        
                    } catch (aiError) {
                        console.log(`⚠️ AI analysis failed for item: ${aiError.message}`);
                    }
                }
                
                // Store in database
                await dbService.saveUpdate(item);
                processedResults.push(item);
                
            } catch (error) {
                console.error(`❌ Failed to process item: ${error.message}`);
                this.processingStats.errors++;
            }
        }
        
        return processedResults;
    }

    // CHECK FOR DUPLICATES
    async checkForDuplicate(item) {
        try {
            // Simple URL-based duplicate check
            const existing = await dbService.getUpdateByUrl(item.url);
            return !!existing;
        } catch (error) {
            console.error('Error checking for duplicate:', error.message);
            return false;
        }
    }

    // STATISTICS AND MONITORING
    resetStats() {
        this.processingStats = {
            total: 0,
            processed: 0,
            skipped: 0,
            errors: 0,
            startTime: Date.now(),
            bySource: {},
            byType: {
                rss: 0,
                deepScraping: 0,
                international: 0
            }
        };
    }

    logComprehensiveStats() {
        const elapsed = Date.now() - this.processingStats.startTime;
        const minutes = Math.round(elapsed / 60000);
        const seconds = Math.round((elapsed % 60000) / 1000);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 ENHANCED DATA COLLECTION STATISTICS');
        console.log('='.repeat(60));
        console.log(`✅ Processed: ${this.processingStats.processed}`);
        console.log(`⏭️ Skipped: ${this.processingStats.skipped}`);
        console.log(`❌ Errors: ${this.processingStats.errors}`);
        console.log(`⏱️ Duration: ${minutes}m ${seconds}s`);
        console.log('');
        console.log('📊 By Type:');
        console.log(`   📡 RSS Feeds: ${this.processingStats.byType.rss}`);
        console.log(`   🕷️ Deep Scraping: ${this.processingStats.byType.deepScraping}`);
        console.log(`   🌍 International: ${this.processingStats.byType.international}`);
        console.log('');
        console.log('📊 By Source:');
        Object.entries(this.processingStats.bySource).forEach(([source, stats]) => {
            console.log(`   ${source}: ${stats.processed} items, ${stats.errors} errors`);
        });
        console.log('='.repeat(60));
    }

    // HEALTH CHECK METHODS
    async healthCheck() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
                database: false,
                aiAnalyzer: false,
                networkConnectivity: false
            },
            stats: {
                activeRequests: this.activeRequests.size,
                rateLimiters: this.rateLimiters.size,
                retryQueues: this.retryQueues.size
            }
        };
        
        try {
            // Check database
            await dbService.initialize();
            health.checks.database = true;
        } catch (error) {
            health.checks.database = false;
        }
        
        try {
            // Check AI analyzer
            health.checks.aiAnalyzer = typeof aiAnalyzer?.analyzeUpdate === 'function';
        } catch (error) {
            health.checks.aiAnalyzer = false;
        }
        
        try {
            // Check network connectivity
            await this.makeRequest('https://www.google.com', { timeout: 5000 });
            health.checks.networkConnectivity = true;
        } catch (error) {
            health.checks.networkConnectivity = false;
        }
        
        // Determine overall health
        const allChecks = Object.values(health.checks);
        const healthyChecks = allChecks.filter(check => check === true);
        
        if (healthyChecks.length === allChecks.length) {
            health.status = 'healthy';
        } else if (healthyChecks.length > 0) {
            health.status = 'degraded';
        } else {
            health.status = 'unhealthy';
        }
        
        return health;
    }
}

// Export singleton instance
module.exports = new WebScraperService();