// src/services/webScraper.js
// ENTERPRISE-GRADE ROBUST SCRAPER: Multi-Strategy, Content Validation, Intelligent Fallbacks
// FOCUS: FATF + Universal Site Scraping with Excellence-Grade Reliability

const axios = require('axios');
const cheerio = require('cheerio');
const aiAnalyzer = require('./aiAnalyzer');
const dbService = require('./dbService');

class RobustWebScraper {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/120.0'
        ];
        
        this.retryAttempts = 3;
        this.requestTimeout = 20000; // 20 seconds
        this.contentValidationThreshold = 50; // Minimum characters for valid content
        this.rateLimitDelay = 2000; // 2 seconds between requests
        
        // Site-specific configurations with multiple strategies
        this.siteConfigs = {
            'fatf-gafi.org': {
                name: 'FATF',
                authority: 'FATF',
                strategies: [
                    {
                        name: 'primary_news_strategy',
                        selectors: [
                            '.news-item',
                            '.publication-item', 
                            '.content-item',
                            '.article-item',
                            '.fatf-news',
                            'article'
                        ],
                        linkSelectors: [
                            'h3 a',
                            'h2 a', 
                            'h4 a',
                            '.title a',
                            '.headline a',
                            'a.news-link',
                            'a[href*="/news/"]',
                            'a[href*="/publication/"]'
                        ],
                        dateSelectors: [
                            '.date',
                            '.published',
                            '.publication-date',
                            '.news-date',
                            'time',
                            '.fatf-date',
                            '.article-date',
                            '[class*="date"]'
                        ]
                    },
                    {
                        name: 'fallback_strategy',
                        selectors: [
                            'div[class*="news"]',
                            'div[class*="article"]',
                            'div[class*="publication"]',
                            'div[class*="content"]',
                            '.row',
                            '.col-md-*',
                            '.container *'
                        ],
                        linkSelectors: [
                            'a[href*=".pdf"]',
                            'a[href*="/en/"]',
                            'a[href*="fatf"]',
                            'a',
                            'h1 a',
                            'h2 a',
                            'h3 a'
                        ],
                        dateSelectors: [
                            '*[class*="date"]',
                            '*[id*="date"]',
                            'span',
                            'p',
                            'div'
                        ]
                    }
                ]
            },
            'thepensionsregulator.gov.uk': {
                name: 'TPR',
                authority: 'TPR',
                strategies: [
                    {
                        name: 'press_release_strategy',
                        selectors: [
                            '.press-release-item',
                            '.news-item',
                            '.article-item',
                            '.content-item',
                            'article',
                            '.media-item'
                        ],
                        linkSelectors: [
                            'h3 a',
                            'h2 a',
                            'h4 a',
                            'a.title',
                            '.title a',
                            '.headline a'
                        ],
                        dateSelectors: [
                            'time',
                            '.date',
                            '.published',
                            '.article-date',
                            '.press-date'
                        ]
                    }
                ]
            },
            'sfo.gov.uk': {
                name: 'SFO',
                authority: 'SFO',
                strategies: [
                    {
                        name: 'news_releases_strategy',
                        selectors: [
                            '.news-item',
                            '.article-item',
                            'article',
                            '.content-item',
                            '.press-release',
                            '.news-listing-item'
                        ],
                        linkSelectors: [
                            '.news-item__title a',
                            'h3 a',
                            'h2 a',
                            '.title a',
                            'a.title'
                        ],
                        dateSelectors: [
                            '.news-item__date',
                            '.date',
                            'time',
                            '.published'
                        ]
                    }
                ]
            }
        };

        // Manual fallback data for critical cases
        this.manualFallbacks = {
            'fatf-gafi.org': [
                {
                    title: 'FATF Updates Available',
                    url: 'https://www.fatf-gafi.org/en/the-fatf/news.html',
                    date: new Date().toISOString(),
                    note: 'Manual fallback - please check FATF website directly'
                }
            ]
        };
    }

    // ENHANCED DATE PARSING with multiple format support
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        try {
            // Clean and normalize date string
            const cleanDate = dateStr.trim()
                .replace(/(\d+)(st|nd|rd|th)/gi, '$1') // Remove ordinal suffixes
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/^(Published|Date|Updated):\s*/i, '') // Remove prefixes
                .replace(/,?\s*\d{2}:\d{2}.*$/gi, '') // Remove time portions
                .replace(/GMT|BST|UTC|CET|EST|PST/gi, '') // Remove timezone abbreviations
                .replace(/[\[\]()]/g, '') // Remove brackets
                .trim();

            // Try direct parsing first
            let date = new Date(cleanDate);
            if (!isNaN(date.getTime()) && date.getFullYear() > 2020) {
                return date;
            }

            // Enhanced regex patterns for various date formats
            const datePatterns = [
                // DD Month YYYY formats
                /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
                /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
                
                // Month DD, YYYY formats
                /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
                /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i,
                
                // YYYY-MM-DD formats
                /(\d{4})-(\d{1,2})-(\d{1,2})/,
                
                // DD/MM/YYYY and MM/DD/YYYY formats
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                
                // DD.MM.YYYY format
                /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
                
                // Relative dates
                /(\d+)\s+(day|week|month)s?\s+ago/i
            ];

            for (const pattern of datePatterns) {
                const match = cleanDate.match(pattern);
                if (match) {
                    if (pattern.source.includes('ago')) {
                        // Handle relative dates
                        const num = parseInt(match[1]);
                        const unit = match[2].toLowerCase();
                        const now = new Date();
                        
                        if (unit === 'day') now.setDate(now.getDate() - num);
                        else if (unit === 'week') now.setDate(now.getDate() - (num * 7));
                        else if (unit === 'month') now.setMonth(now.getMonth() - num);
                        
                        return now;
                    } else {
                        // Try parsing the matched string
                        date = new Date(match[0]);
                        if (!isNaN(date.getTime()) && date.getFullYear() > 2020) {
                            return date;
                        }
                    }
                }
            }

            return null;
        } catch (error) {
            console.log(`📅 Date parsing error for "${dateStr}":`, error.message);
            return null;
        }
    }

    // ENHANCED CONTENT VALIDATION
    validateContent(item) {
        if (!item) return { valid: false, reason: 'No item provided' };
        
        const title = item.title || '';
        const url = item.link || item.url || '';
        const content = item.content || item.impact || '';
        
        // Basic validation
        if (!title || title.length < 5) {
            return { valid: false, reason: 'Title too short or missing' };
        }
        
        if (!url || !url.startsWith('http')) {
            return { valid: false, reason: 'Invalid or missing URL' };
        }
        
        // Content quality checks
        if (title.length > 500) {
            return { valid: false, reason: 'Title suspiciously long' };
        }
        
        // Check for spam indicators
        const spamIndicators = [
            'click here',
            'free download',
            'limited time',
            'act now',
            '!!!',
            'winner',
            'congratulations'
        ];
        
        const textToCheck = (title + ' ' + content).toLowerCase();
        const hasSpam = spamIndicators.some(indicator => textToCheck.includes(indicator));
        
        if (hasSpam) {
            return { valid: false, reason: 'Content appears to be spam' };
        }
        
        // Check for valid regulatory content
        const regulatoryKeywords = [
            'regulation', 'regulatory', 'compliance', 'guidance', 'policy',
            'enforcement', 'consultation', 'framework', 'directive', 'rule',
            'standard', 'requirement', 'announcement', 'statement', 'update',
            'financial', 'banking', 'insurance', 'investment', 'pension',
            'conduct', 'prudential', 'supervision', 'oversight'
        ];
        
        const hasRegulatoryContent = regulatoryKeywords.some(keyword => 
            textToCheck.includes(keyword)
        );
        
        if (!hasRegulatoryContent && content.length > 0) {
            return { valid: false, reason: 'Content does not appear regulatory' };
        }
        
        return { valid: true, reason: 'Content validation passed' };
    }

    // MULTI-STRATEGY SITE SCRAPING
    async scrapeSiteWithMultipleStrategies(url, siteConfig) {
        console.log(`🎯 Multi-strategy scraping: ${siteConfig.name}`);
        
        let bestResults = [];
        let strategiesAttempted = 0;
        
        for (const strategy of siteConfig.strategies) {
            try {
                strategiesAttempted++;
                console.log(`📋 Trying strategy ${strategiesAttempted}: ${strategy.name}`);
                
                const results = await this.scrapeWithStrategy(url, strategy, siteConfig);
                
                if (results.length > bestResults.length) {
                    bestResults = results;
                    console.log(`✅ Strategy "${strategy.name}" found ${results.length} items`);
                    
                    // If we got good results, we can break early
                    if (results.length >= 3) {
                        break;
                    }
                }
                
            } catch (error) {
                console.log(`⚠️ Strategy "${strategy.name}" failed:`, error.message);
                continue;
            }
        }
        
        console.log(`📊 Multi-strategy result: ${bestResults.length} items from ${strategiesAttempted} strategies`);
        return bestResults;
    }

    // INDIVIDUAL STRATEGY IMPLEMENTATION
    async scrapeWithStrategy(url, strategy, siteConfig) {
        const response = await this.makeRobustRequest(url);
        const $ = cheerio.load(response.data);
        const items = [];
        
        // Try each selector in the strategy
        for (const selector of strategy.selectors) {
            const elements = $(selector);
            
            if (elements.length > 0) {
                console.log(`🎯 Found ${elements.length} elements with selector: ${selector}`);
                
                elements.each((index, element) => {
                    if (index >= 15) return false; // Limit to prevent overwhelming
                    
                    try {
                        const item = this.extractItemFromElement($, element, strategy, siteConfig);
                        
                        if (item) {
                            const validation = this.validateContent(item);
                            if (validation.valid) {
                                items.push(item);
                            } else {
                                console.log(`⚠️ Content validation failed: ${validation.reason}`);
                            }
                        }
                        
                    } catch (itemError) {
                        console.log(`⚠️ Error extracting item ${index}:`, itemError.message);
                    }
                });
                
                // If we found items with this selector, break
                if (items.length > 0) {
                    break;
                }
            }
        }
        
        // Filter for recent items only
        const recentItems = items.filter(item => {
            const date = this.parseDate(item.pubDate);
            return date && this.isRecent(date, 30); // 30 days threshold
        });
        
        console.log(`📅 Filtered to ${recentItems.length} recent items`);
        return recentItems;
    }

    // ENHANCED ITEM EXTRACTION
    extractItemFromElement($, element, strategy, siteConfig) {
        // Extract title and URL using multiple selectors
        let titleElement = null;
        let title = '';
        let url = '';
        
        for (const linkSelector of strategy.linkSelectors) {
            titleElement = $(element).find(linkSelector).first();
            if (titleElement.length > 0) {
                title = titleElement.text().trim();
                url = titleElement.attr('href');
                if (title && url) break;
            }
        }
        
        // Fallback: try to find any link in the element
        if (!title || !url) {
            titleElement = $(element).find('a').first();
            if (titleElement.length > 0) {
                title = titleElement.text().trim() || $(element).text().trim().substring(0, 100);
                url = titleElement.attr('href');
            }
        }
        
        if (!title || !url) {
            return null;
        }
        
        // Clean and validate title
        title = title.replace(/\s+/g, ' ').trim();
        if (title.length < 5 || title.length > 300) {
            return null;
        }
        
        // Make URL absolute
        if (!url.startsWith('http')) {
            try {
                const baseUrl = new URL($(element).closest('html').find('base').attr('href') || 'https://www.fatf-gafi.org/');
                url = new URL(url, baseUrl).href;
            } catch (error) {
                // Fallback URL construction
                if (url.startsWith('/')) {
                    const domain = siteConfig.name === 'FATF' ? 'https://www.fatf-gafi.org' : 
                                 siteConfig.name === 'TPR' ? 'https://www.thepensionsregulator.gov.uk' :
                                 siteConfig.name === 'SFO' ? 'https://www.sfo.gov.uk' : 'https://example.com';
                    url = domain + url;
                }
            }
        }
        
        // Extract date using multiple selectors
        let dateStr = '';
        for (const dateSelector of strategy.dateSelectors) {
            dateStr = $(element).find(dateSelector).text().trim();
            if (dateStr) break;
        }
        
        // Fallback date extraction
        if (!dateStr) {
            const elementText = $(element).text();
            const datePatterns = [
                /(\d{1,2}\s+\w+\s+\d{4})/,
                /(\w+\s+\d{1,2},?\s+\d{4})/,
                /(\d{1,2}\/\d{1,2}\/\d{4})/,
                /(\d{4}-\d{1,2}-\d{1,2})/
            ];
            
            for (const pattern of datePatterns) {
                const match = elementText.match(pattern);
                if (match) {
                    dateStr = match[1];
                    break;
                }
            }
        }
        
        const date = this.parseDate(dateStr);
        
        // Extract additional content
        let content = $(element).find('p, .summary, .excerpt, .description').text().trim();
        if (!content) {
            content = $(element).text().trim().substring(0, 200) + '...';
        }
        
        return {
            title: title,
            link: url,
            url: url,
            pubDate: date ? date.toISOString() : new Date().toISOString(),
            authority: siteConfig.authority,
            content: content,
            source: siteConfig.name,
            extractedAt: new Date().toISOString()
        };
    }

    // ROBUST HTTP REQUEST with retries and different user agents
    async makeRobustRequest(url, attempt = 1) {
        const userAgent = this.userAgents[attempt % this.userAgents.length];
        
        try {
            console.log(`🌐 Request attempt ${attempt} to ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: this.requestTimeout,
                maxRedirects: 5,
                validateStatus: (status) => status < 500 // Accept 4xx errors but retry 5xx
            });
            
            if (response.status >= 400) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log(`✅ Successful request (${response.status}) - ${response.data.length} bytes`);
            return response;
            
        } catch (error) {
            console.log(`❌ Request attempt ${attempt} failed:`, error.message);
            
            if (attempt < this.retryAttempts) {
                const delay = this.rateLimitDelay * attempt;
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRobustRequest(url, attempt + 1);
            }
            
            throw error;
        }
    }

    // RECENT DATE CHECK
    isRecent(date, daysThreshold = 30) {
        if (!date) return false;
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - daysThreshold);
        return date >= threshold;
    }

    // ENHANCED FATF SCRAPER (Primary Implementation)
    async scrapeFATF() {
        console.log('🎯 Starting ENHANCED FATF scraper with multi-strategy approach...');
        
        const fatfUrls = [
            'https://www.fatf-gafi.org/en/the-fatf/news.html',
            'https://www.fatf-gafi.org/content/fatf-gafi/en/the-fatf/news.html',
            'https://www.fatf-gafi.org/en/publications.html'
        ];
        
        let allResults = [];
        
        for (const url of fatfUrls) {
            try {
                console.log(`🔍 Trying FATF URL: ${url}`);
                
                const siteConfig = this.siteConfigs['fatf-gafi.org'];
                const results = await this.scrapeSiteWithMultipleStrategies(url, siteConfig);
                
                allResults.push(...results);
                
                if (results.length > 0) {
                    console.log(`✅ FATF URL successful: ${results.length} items found`);
                    break; // Success, no need to try other URLs
                }
                
            } catch (error) {
                console.log(`⚠️ FATF URL failed: ${error.message}`);
                continue;
            }
        }
        
        // If all strategies failed, use manual fallback
        if (allResults.length === 0) {
            console.log('🚨 All FATF strategies failed - using manual fallback');
            allResults = this.getManualFallback('fatf-gafi.org');
        }
        
        // Deduplicate results
        const uniqueResults = this.deduplicateResults(allResults);
        
        console.log(`📊 FATF scraping completed: ${uniqueResults.length} unique items`);
        return uniqueResults;
    }

    // UNIVERSAL SITE SCRAPER
    async scrapeUniversalSite(url, customConfig = null) {
        console.log(`🌐 Universal site scraping: ${url}`);
        
        const domain = new URL(url).hostname;
        const siteConfig = customConfig || this.siteConfigs[domain] || {
            name: 'Generic',
            authority: 'Unknown',
            strategies: [
                {
                    name: 'universal_strategy',
                    selectors: [
                        'article',
                        '.article',
                        '.news-item',
                        '.content-item',
                        '.post',
                        '.entry',
                        '[class*="news"]',
                        '[class*="article"]',
                        '[class*="post"]'
                    ],
                    linkSelectors: [
                        'h1 a', 'h2 a', 'h3 a', 'h4 a',
                        '.title a', '.headline a',
                        'a[href*="news"]', 'a[href*="article"]',
                        'a'
                    ],
                    dateSelectors: [
                        'time', '.date', '.published', '.created',
                        '[class*="date"]', '[id*="date"]',
                        '.meta time', '.byline time'
                    ]
                }
            ]
        };
        
        try {
            const results = await this.scrapeSiteWithMultipleStrategies(url, siteConfig);
            return this.deduplicateResults(results);
        } catch (error) {
            console.error(`❌ Universal scraping failed for ${url}:`, error.message);
            return [];
        }
    }

    // MANUAL FALLBACK SYSTEM
    getManualFallback(domain) {
        console.log(`📋 Using manual fallback for ${domain}`);
        
        const fallbacks = this.manualFallbacks[domain] || [];
        
        return fallbacks.map(item => ({
            ...item,
            isManualFallback: true,
            extractedAt: new Date().toISOString()
        }));
    }

    // RESULT DEDUPLICATION
    deduplicateResults(results) {
        const seen = new Map();
        
        return results.filter(item => {
            const fingerprint = this.createContentFingerprint(item);
            
            if (seen.has(fingerprint)) {
                console.log(`🔄 Duplicate detected: ${item.title?.substring(0, 50)}...`);
                return false;
            }
            
            seen.set(fingerprint, true);
            return true;
        });
    }

    createContentFingerprint(item) {
        const title = (item.title || '').toLowerCase().trim();
        const url = (item.link || item.url || '').toLowerCase().trim();
        
        const normalizedTitle = title
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .substring(0, 100);
        
        return `${normalizedTitle}|${item.authority}|${url.substring(0, 100)}`;
    }

    // COMPREHENSIVE SCRAPING ORCHESTRATOR
    async scrapeAllSources() {
        console.log('🚀 Starting comprehensive robust scraping of all sources...');
        
        const results = [];
        const scrapingTasks = [
            { name: 'FATF', method: () => this.scrapeFATF() },
            { name: 'TPR', method: () => this.scrapeUniversalSite('https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases') },
            { name: 'SFO', method: () => this.scrapeUniversalSite('https://www.sfo.gov.uk/news-and-publications/news-releases/') }
        ];
        
        for (const task of scrapingTasks) {
            try {
                console.log(`\n🎯 Scraping ${task.name}...`);
                const taskResults = await task.method();
                results.push(...taskResults);
                console.log(`✅ ${task.name}: ${taskResults.length} items scraped`);
                
                // Rate limiting between sources
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
                
            } catch (error) {
                console.error(`❌ ${task.name} scraping failed:`, error.message);
                
                // Try manual fallback if available
                if (task.name === 'FATF') {
                    const fallbackResults = this.getManualFallback('fatf-gafi.org');
                    results.push(...fallbackResults);
                    console.log(`🆘 ${task.name}: Using manual fallback (${fallbackResults.length} items)`);
                }
            }
        }
        
        const uniqueResults = this.deduplicateResults(results);
        
        console.log(`\n📊 COMPREHENSIVE SCRAPING COMPLETED:`);
        console.log(`   • Total items found: ${results.length}`);
        console.log(`   • Unique items: ${uniqueResults.length}`);
        console.log(`   • Duplicates removed: ${results.length - uniqueResults.length}`);
        
        return uniqueResults;
    }
}

// Create singleton instance
const robustScraper = new RobustWebScraper();

// Export individual methods for backward compatibility
module.exports = {
    // Enhanced primary methods
    scrapeFATF: () => robustScraper.scrapeFATF(),
    scrapeAllSources: () => robustScraper.scrapeAllSources(),
    scrapeUniversalSite: (url, config) => robustScraper.scrapeUniversalSite(url, config),
    
    // Legacy compatibility methods
    scrapePensionRegulator: () => robustScraper.scrapeUniversalSite('https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'),
    scrapeSFO: () => robustScraper.scrapeUniversalSite('https://www.sfo.gov.uk/news-and-publications/news-releases/'),
    
    // Utility methods
    parseDate: (dateStr) => robustScraper.parseDate(dateStr),
    isRecent: (date, days) => robustScraper.isRecent(date, days),
    validateContent: (item) => robustScraper.validateContent(item),
    
    // Export scraper instance for advanced usage
    robustScraper
};