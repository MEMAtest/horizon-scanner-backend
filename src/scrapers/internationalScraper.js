// src/scrapers/internationalScraper.js
// International Regulatory Sources Scraper
// Phase 2: FATF, EU Regulators, International Standards

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const { INTERNATIONAL_SOURCES } = require('../sources/enhancedSources');
const contentProcessor = require('../services/contentProcessor');
const dataQualityService = require('../services/dataQualityService');

class InternationalScraper {
    constructor() {
        this.sources = INTERNATIONAL_SOURCES;
        this.stats = {
            totalSources: Object.keys(INTERNATIONAL_SOURCES).length,
            processedSources: 0,
            totalItems: 0,
            successfulItems: 0,
            failedItems: 0,
            processingTime: 0,
            bySource: {}
        };
        
        // Configure HTTP client for international requests
        this.httpClient = axios.create({
            timeout: 45000, // Longer timeout for international sites
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0; International)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
                'DNT': '1'
            },
            maxRedirects: 10
        });
        
        // Rate limiting map for different domains
        this.rateLimiters = new Map();
        
        // Source-specific configurations
        this.sourceConfigs = {
            FATF: {
                rateLimit: 4000,
                retries: 2,
                contentSelectors: [
                    '.content-main',
                    '.main-content',
                    '.publication-content',
                    '.news-content',
                    'main'
                ],
                dateFormats: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']
            },
            ECB: {
                rateLimit: 3000,
                retries: 3,
                contentSelectors: [
                    '.ecb-content',
                    '.main-content',
                    '.publication-body',
                    'main'
                ],
                dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD']
            },
            EBA: {
                rateLimit: 3000,
                retries: 3,
                contentSelectors: [
                    '.eba-content',
                    '.main-content',
                    '.content-wrapper',
                    'main'
                ],
                dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD']
            },
            ESMA: {
                rateLimit: 3000,
                retries: 2,
                contentSelectors: [
                    '.esma-content',
                    '.main-content',
                    'main'
                ],
                dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD']
            },
            BCBS: {
                rateLimit: 4000,
                retries: 2,
                contentSelectors: [
                    '.bis-content',
                    '.main-content',
                    '.publication-content',
                    'main'
                ],
                dateFormats: ['DD MMM YYYY', 'YYYY-MM-DD']
            }
        };
    }

    // MAIN INTERNATIONAL SCRAPING ORCHESTRATOR
    async scrapeAllInternational() {
        console.log('🌍 Starting international regulatory sources scraping...');
        console.log(`📊 Processing ${this.stats.totalSources} international sources`);
        
        const startTime = Date.now();
        this.resetStats();
        
        const allResults = [];
        
        try {
            // Process sources in order of priority
            const sourceEntries = Object.entries(this.sources);
            
            for (const [sourceKey, sourceConfig] of sourceEntries) {
                console.log(`\n🌍 Processing ${sourceConfig.name} (${sourceConfig.country})`);
                
                try {
                    this.stats.bySource[sourceKey] = { items: 0, errors: 0 };
                    
                    // Process RSS feeds first
                    const rssResults = await this.processRSSFeeds(sourceKey, sourceConfig);
                    allResults.push(...rssResults);
                    
                    // Process deep scraping
                    const scrapingResults = await this.processDeepScraping(sourceKey, sourceConfig);
                    allResults.push(...scrapingResults);
                    
                    const totalSourceItems = rssResults.length + scrapingResults.length;
                    this.stats.bySource[sourceKey].items = totalSourceItems;
                    this.stats.totalItems += totalSourceItems;
                    this.stats.processedSources++;
                    
                    console.log(`✅ ${sourceConfig.name}: ${totalSourceItems} items collected`);
                    
                    // International rate limiting - longer delays
                    await this.wait(sourceConfig.scrapingConfig?.rateLimit || 4000);
                    
                } catch (error) {
                    console.error(`❌ Failed to process ${sourceConfig.name}: ${error.message}`);
                    this.stats.bySource[sourceKey] = { items: 0, errors: 1 };
                    this.stats.failedItems++;
                }
            }
            
            // Process collected data for quality
            console.log(`\n🔍 Processing ${allResults.length} international items for quality...`);
            const qualityResults = await dataQualityService.processDataQuality(allResults);
            
            // Enhanced content processing for international content
            console.log(`🔄 Enhanced international content processing...`);
            const processedResults = await this.processInternationalContent(qualityResults);
            
            this.stats.processingTime = Date.now() - startTime;
            this.stats.successfulItems = processedResults.length;
            
            this.logInternationalStats();
            console.log(`🎉 International scraping complete: ${processedResults.length} items processed`);
            
            return processedResults;
            
        } catch (error) {
            console.error('❌ International scraping failed:', error);
            this.logInternationalStats();
            throw error;
        }
    }

    // PROCESS RSS FEEDS FOR INTERNATIONAL SOURCES
    async processRSSFeeds(sourceKey, sourceConfig) {
        const results = [];
        
        if (!sourceConfig.rssFeeds || sourceConfig.rssFeeds.length === 0) {
            console.log(`📡 No RSS feeds configured for ${sourceConfig.name}`);
            return results;
        }
        
        console.log(`📡 Processing RSS feeds for ${sourceConfig.name}`);
        
        for (const feedConfig of sourceConfig.rssFeeds) {
            try {
                console.log(`📡 Fetching RSS: ${feedConfig.url}`);
                
                await this.respectRateLimit(sourceConfig.baseUrl);
                const response = await this.makeInternationalRequest(feedConfig.url, sourceKey);
                
                const Parser = require('rss-parser');
                const parser = new Parser({
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; RegulatoryScanner/2.0; International)'
                    }
                });
                
                const feed = await parser.parseString(response.data);
                
                for (const item of feed.items) {
                    try {
                        const itemData = await this.createInternationalRSSItem(
                            item, 
                            sourceConfig, 
                            sourceKey, 
                            feedConfig
                        );
                        
                        if (itemData) {
                            results.push(itemData);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Failed to process RSS item: ${error.message}`);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Failed to process RSS feed ${feedConfig.url}: ${error.message}`);
            }
        }
        
        console.log(`📡 RSS processing complete for ${sourceConfig.name}: ${results.length} items`);
        return results;
    }

    // PROCESS DEEP SCRAPING FOR INTERNATIONAL SOURCES
    async processDeepScraping(sourceKey, sourceConfig) {
        const results = [];
        
        if (!sourceConfig.deepScraping) {
            console.log(`🕷️ No deep scraping configured for ${sourceConfig.name}`);
            return results;
        }
        
        console.log(`🕷️ Starting deep scraping for ${sourceConfig.name}`);
        
        for (const [scrapingType, config] of Object.entries(sourceConfig.deepScraping)) {
            try {
                console.log(`📋 Scraping ${scrapingType} from ${sourceConfig.name}`);
                
                await this.respectRateLimit(sourceConfig.baseUrl);
                const response = await this.makeInternationalRequest(config.url, sourceKey);
                const $ = cheerio.load(response.data);
                
                // Extract items using configured selectors
                const items = $(config.selectors.items);
                console.log(`📋 Found ${items.length} items in ${scrapingType}`);
                
                for (let i = 0; i < items.length; i++) {
                    try {
                        const item = items.eq(i);
                        const extractedData = await this.extractInternationalItem(
                            item,
                            config.selectors,
                            sourceConfig,
                            sourceKey,
                            scrapingType,
                            $
                        );
                        
                        if (extractedData) {
                            results.push(extractedData);
                        }
                        
                    } catch (error) {
                        console.error(`❌ Failed to extract item ${i + 1}: ${error.message}`);
                    }
                }
                
                // Rate limiting between scraping types
                await this.wait(2000);
                
            } catch (error) {
                console.error(`❌ Failed to scrape ${scrapingType} from ${sourceConfig.name}: ${error.message}`);
            }
        }
        
        console.log(`🕷️ Deep scraping complete for ${sourceConfig.name}: ${results.length} items`);
        return results;
    }

    // CREATE INTERNATIONAL RSS ITEM
    async createInternationalRSSItem(rssItem, sourceConfig, sourceKey, feedConfig) {
        try {
            // Validate essential fields
            if (!rssItem.title || !rssItem.link) {
                return null;
            }
            
            const itemData = {
                headline: rssItem.title.trim(),
                url: this.normalizeInternationalUrl(rssItem.link, sourceConfig.baseUrl),
                authority: sourceConfig.authority,
                area: feedConfig.type,
                source_category: 'international_rss',
                source_description: `${sourceConfig.name} - ${feedConfig.description}`,
                fetched_date: new Date().toISOString(),
                
                raw_data: {
                    sourceType: 'rss',
                    sourceKey: sourceKey,
                    country: sourceConfig.country,
                    priority: sourceConfig.priority,
                    originalDate: rssItem.pubDate,
                    summary: rssItem.contentSnippet?.trim(),
                    content: rssItem.content?.trim(),
                    international: {
                        isInternational: true,
                        sourceAuthority: sourceConfig.authority,
                        sourceCountry: sourceConfig.country,
                        feedType: feedConfig.type
                    }
                }
            };
            
            // International content validation
            const validation = this.validateInternationalContent(itemData);
            if (!validation.isValid) {
                console.log(`⚠️ International RSS validation failed: ${validation.issues.join(', ')}`);
                return null;
            }
            
            return itemData;
            
        } catch (error) {
            console.error(`❌ Failed to create international RSS item: ${error.message}`);
            return null;
        }
    }

    // EXTRACT INTERNATIONAL SCRAPED ITEM
    async extractInternationalItem(item, selectors, sourceConfig, sourceKey, scrapingType, $) {
        try {
            // Extract basic fields with international-aware methods
            const title = this.extractText(item, selectors.title, $);
            const url = this.extractInternationalUrl(item, selectors.url, sourceConfig.baseUrl, $);
            const date = this.extractInternationalDate(item, selectors.date, sourceKey, $);
            const summary = this.extractText(item, selectors.summary, $);
            
            // Extract optional international-specific fields
            const deadline = selectors.deadline ? this.extractInternationalDate(item, selectors.deadline, sourceKey, $) : null;
            const documentType = selectors.type ? this.extractText(item, selectors.type, $) : null;
            const status = selectors.status ? this.extractText(item, selectors.status, $) : null;
            
            // Validate essential fields
            if (!title || !url) {
                return null;
            }
            
            const itemData = {
                headline: title.trim(),
                url: this.normalizeInternationalUrl(url, sourceConfig.baseUrl),
                authority: sourceConfig.authority,
                area: scrapingType,
                source_category: 'international_scraping',
                source_description: `${sourceConfig.name} - ${scrapingType}`,
                fetched_date: new Date().toISOString(),
                
                raw_data: {
                    sourceType: 'scraping',
                    sourceKey: sourceKey,
                    scrapingType: scrapingType,
                    country: sourceConfig.country,
                    priority: sourceConfig.priority,
                    originalDate: date,
                    summary: summary?.trim(),
                    deadline: deadline,
                    documentType: documentType?.trim(),
                    status: status?.trim(),
                    international: {
                        isInternational: true,
                        sourceAuthority: sourceConfig.authority,
                        sourceCountry: sourceConfig.country,
                        scrapingTarget: scrapingType,
                        requiresTranslation: this.detectNonEnglish(title, summary)
                    }
                }
            };
            
            // International content validation
            const validation = this.validateInternationalContent(itemData);
            if (!validation.isValid) {
                console.log(`⚠️ International scraping validation failed: ${validation.issues.join(', ')}`);
                return null;
            }
            
            return itemData;
            
        } catch (error) {
            console.error(`❌ Failed to extract international item: ${error.message}`);
            return null;
        }
    }

    // INTERNATIONAL-SPECIFIC PROCESSING
    async processInternationalContent(items) {
        console.log(`🌍 Processing ${items.length} international items with enhanced analysis...`);
        
        const processedItems = [];
        
        for (const item of items) {
            try {
                // Enhanced international content processing
                const enhancedItem = await this.enhanceInternationalItem(item);
                
                // Standard content processing
                const processedItem = await contentProcessor.processContent(enhancedItem);
                
                processedItems.push(processedItem);
                
            } catch (error) {
                console.error(`❌ Failed to process international content: ${error.message}`);
                // Include original item if processing fails
                processedItems.push(item);
            }
        }
        
        return processedItems;
    }

    // ENHANCE INTERNATIONAL ITEM
    async enhanceInternationalItem(item) {
        const enhanced = { ...item };
        
        // Add international-specific enrichments
        if (!enhanced.enrichment) {
            enhanced.enrichment = {};
        }
        
        enhanced.enrichment.international = {
            // Geographic classification
            region: this.classifyRegion(item.raw_data.country),
            isEUSource: this.isEUSource(item.authority),
            isGlobalStandard: this.isGlobalStandard(item.authority),
            
            // Content analysis
            crossBorderRelevance: this.assessCrossBorderRelevance(item),
            implementationComplexity: this.assessImplementationComplexity(item),
            
            // Translation needs
            requiresTranslation: item.raw_data.international?.requiresTranslation || false,
            confidenceScore: this.calculateInternationalConfidence(item)
        };
        
        return enhanced;
    }

    // INTERNATIONAL UTILITY FUNCTIONS

    extractText(item, selector, $) {
        if (!selector) return null;
        
        try {
            const element = item.find ? item.find(selector) : $(selector, item);
            const text = element.first().text()?.trim();
            
            // Clean up international text (remove extra whitespace, special chars)
            return text ? this.cleanInternationalText(text) : null;
        } catch (error) {
            return null;
        }
    }

    extractInternationalUrl(item, selector, baseUrl, $) {
        if (!selector) return null;
        
        try {
            const element = item.find ? item.find(selector) : $(selector, item);
            let href = element.first().attr('href');
            
            if (!href) return null;
            
            // Handle international URL patterns
            if (href.startsWith('/')) {
                href = baseUrl + href;
            } else if (!href.startsWith('http') && !href.includes('://')) {
                // Handle relative URLs for international sites
                href = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + href;
            }
            
            return href;
        } catch (error) {
            return null;
        }
    }

    extractInternationalDate(item, selector, sourceKey, $) {
        if (!selector) return null;
        
        try {
            const element = item.find ? item.find(selector) : $(selector, item);
            const dateText = element.first().text()?.trim();
            
            if (!dateText) return null;
            
            // Use source-specific date parsing
            const date = this.parseInternationalDate(dateText, sourceKey);
            return date ? date.toISOString() : null;
        } catch (error) {
            return null;
        }
    }

    parseInternationalDate(dateText, sourceKey) {
        try {
            const config = this.sourceConfigs[sourceKey];
            const cleanDate = dateText
                .replace(/published:?\s*/i, '')
                .replace(/date:?\s*/i, '')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Try standard JavaScript date parsing first
            let date = new Date(cleanDate);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            // Try source-specific date formats
            if (config?.dateFormats) {
                for (const format of config.dateFormats) {
                    date = this.parseSpecificDateFormat(cleanDate, format);
                    if (date) return date;
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    parseSpecificDateFormat(dateText, format) {
        // Basic date format parsing for international sources
        try {
            // Handle DD/MM/YYYY format
            if (format === 'DD/MM/YYYY') {
                const match = dateText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (match) {
                    return new Date(match[3], match[2] - 1, match[1]);
                }
            }
            
            // Handle DD MMM YYYY format (e.g., "15 Jan 2024")
            if (format === 'DD MMM YYYY') {
                const match = dateText.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
                if (match) {
                    const monthMap = {
                        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                    };
                    const month = monthMap[match[2]];
                    if (month !== undefined) {
                        return new Date(match[3], month, match[1]);
                    }
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    normalizeInternationalUrl(url, baseUrl) {
        try {
            // Handle international URL normalization
            let normalizedUrl = url;
            
            // Ensure proper protocol
            if (normalizedUrl.startsWith('//')) {
                normalizedUrl = 'https:' + normalizedUrl;
            }
            
            const urlObj = new URL(normalizedUrl);
            
            // Remove tracking parameters common in international sites
            const paramsToRemove = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
                'fbclid', 'gclid', 'ref', 'source', 'lang'
            ];
            
            paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
            
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }

    cleanInternationalText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/[\r\n\t]/g, ' ')
            .replace(/[""'']/g, '"')
            .trim();
    }

    detectNonEnglish(title, summary) {
        const text = (title + ' ' + (summary || '')).toLowerCase();
        
        // Simple detection for common non-English indicators
        const nonEnglishIndicators = [
            // German
            'die', 'der', 'das', 'und', 'für', 'von', 'mit', 'auf',
            // French
            'le', 'la', 'les', 'et', 'de', 'du', 'pour', 'avec',
            // Spanish
            'el', 'la', 'los', 'las', 'y', 'de', 'para', 'con',
            // Italian
            'il', 'la', 'gli', 'le', 'e', 'di', 'per', 'con'
        ];
        
        const words = text.split(/\s+/);
        const nonEnglishCount = words.filter(word => 
            nonEnglishIndicators.includes(word)
        ).length;
        
        return nonEnglishCount > 2;
    }

    classifyRegion(country) {
        const regionMap = {
            'EU': 'Europe',
            'UK': 'Europe',
            'International': 'Global'
        };
        
        return regionMap[country] || 'Other';
    }

    isEUSource(authority) {
        return ['ECB', 'EBA', 'ESMA', 'EIOPA'].includes(authority);
    }

    isGlobalStandard(authority) {
        return ['FATF', 'BCBS', 'IOSCO', 'IAIS'].includes(authority);
    }

    assessCrossBorderRelevance(item) {
        const text = (item.headline + ' ' + (item.raw_data?.summary || '')).toLowerCase();
        
        const crossBorderKeywords = [
            'international', 'cross-border', 'global', 'worldwide',
            'multilateral', 'cooperation', 'coordination', 'harmonisation',
            'equivalence', 'mutual recognition', 'passport'
        ];
        
        const matches = crossBorderKeywords.filter(keyword => text.includes(keyword));
        return matches.length > 0 ? 'HIGH' : 'MEDIUM';
    }

    assessImplementationComplexity(item) {
        const text = (item.headline + ' ' + (item.raw_data?.summary || '')).toLowerCase();
        
        const complexityIndicators = {
            HIGH: ['framework', 'directive', 'regulation', 'standard', 'requirement'],
            MEDIUM: ['guidance', 'recommendation', 'best practice', 'principle'],
            LOW: ['update', 'clarification', 'statement', 'speech', 'news']
        };
        
        for (const [level, keywords] of Object.entries(complexityIndicators)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return level;
            }
        }
        
        return 'MEDIUM';
    }

    calculateInternationalConfidence(item) {
        let score = 50; // Base score
        
        // Source reliability
        if (item.authority && ['FATF', 'ECB', 'BCBS'].includes(item.authority)) {
            score += 30;
        }
        
        // Content richness
        const contentLength = (item.headline + ' ' + (item.raw_data?.summary || '')).length;
        if (contentLength > 200) score += 10;
        if (contentLength > 500) score += 10;
        
        // Date availability
        if (item.raw_data?.originalDate) score += 10;
        
        return Math.min(100, score);
    }

    validateInternationalContent(item) {
        const validation = { isValid: true, issues: [] };
        
        // International-specific validation
        if (!item.headline || item.headline.length < 10) {
            validation.issues.push('Headline too short');
        }
        
        if (!item.url || !item.url.includes('http')) {
            validation.issues.push('Invalid URL');
        }
        
        if (!item.authority) {
            validation.issues.push('Missing authority');
        }
        
        // Check for content relevance
        const text = (item.headline + ' ' + (item.raw_data?.summary || '')).toLowerCase();
        const regulatoryTerms = [
            'regulation', 'regulatory', 'guidance', 'standard', 'requirement',
            'directive', 'framework', 'policy', 'compliance', 'supervision'
        ];
        
        const hasRegulatoryContent = regulatoryTerms.some(term => text.includes(term));
        if (!hasRegulatoryContent && text.length > 50) {
            validation.issues.push('Low regulatory relevance');
        }
        
        validation.isValid = validation.issues.length === 0;
        return validation;
    }

    async respectRateLimit(baseUrl) {
        const domain = new URL(baseUrl).hostname;
        const now = Date.now();
        const lastRequest = this.rateLimiters.get(domain) || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        // Longer rate limits for international sources
        let rateLimit = 4000; // Default 4 seconds
        
        if (timeSinceLastRequest < rateLimit) {
            const waitTime = rateLimit - timeSinceLastRequest;
            console.log(`⏳ International rate limiting ${domain}: waiting ${waitTime}ms`);
            await this.wait(waitTime);
        }
        
        this.rateLimiters.set(domain, Date.now());
    }

    async makeInternationalRequest(url, sourceKey) {
        const config = this.sourceConfigs[sourceKey] || {};
        const maxRetries = config.retries || 2;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🌐 International request attempt ${attempt}/${maxRetries}: ${url}`);
                
                const response = await this.httpClient.get(url, {
                    timeout: config.timeout || 45000
                });
                
                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
                
            } catch (error) {
                console.log(`❌ International request failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
                
                if (attempt === maxRetries) {
                    throw new Error(`International request failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Exponential backoff with longer delays for international
                const delay = 2000 * Math.pow(2, attempt - 1);
                await this.wait(delay);
            }
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // STATISTICS AND MONITORING

    resetStats() {
        this.stats = {
            totalSources: Object.keys(INTERNATIONAL_SOURCES).length,
            processedSources: 0,
            totalItems: 0,
            successfulItems: 0,
            failedItems: 0,
            processingTime: 0,
            bySource: {}
        };
    }

    logInternationalStats() {
        const elapsed = this.stats.processingTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        console.log('\n' + '='.repeat(60));
        console.log('🌍 INTERNATIONAL SCRAPING STATISTICS');
        console.log('='.repeat(60));
        console.log(`🌐 Total Sources: ${this.stats.totalSources}`);
        console.log(`✅ Processed Sources: ${this.stats.processedSources}`);
        console.log(`📊 Total Items: ${this.stats.totalItems}`);
        console.log(`✅ Successful Items: ${this.stats.successfulItems}`);
        console.log(`❌ Failed Items: ${this.stats.failedItems}`);
        console.log(`⏱️ Processing Time: ${minutes}m ${seconds}s`);
        console.log(`📈 Success Rate: ${this.stats.totalItems > 0 ? ((this.stats.successfulItems / this.stats.totalItems) * 100).toFixed(1) : 0}%`);
        console.log('\n📊 By Source:');
        Object.entries(this.stats.bySource).forEach(([source, stats]) => {
            console.log(`   ${source}: ${stats.items} items, ${stats.errors} errors`);
        });
        console.log('='.repeat(60) + '\n');
    }

    // HEALTH CHECK
    async healthCheck() {
        const healthChecks = {};
        
        for (const [sourceKey, sourceConfig] of Object.entries(this.sources)) {
            try {
                const testUrl = sourceConfig.baseUrl;
                const response = await this.makeInternationalRequest(testUrl, sourceKey);
                
                healthChecks[sourceKey] = {
                    status: 'healthy',
                    responseTime: response.headers['x-response-time'] || 'unknown',
                    connectivity: true
                };
            } catch (error) {
                healthChecks[sourceKey] = {
                    status: 'unhealthy',
                    error: error.message,
                    connectivity: false
                };
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            overallStatus: Object.values(healthChecks).every(check => check.status === 'healthy') ? 'healthy' : 'degraded',
            sources: healthChecks,
            stats: this.stats
        };
    }
}

// Export singleton instance
module.exports = new InternationalScraper();