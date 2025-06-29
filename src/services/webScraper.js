// src/services/webScraper.js
// Enhanced web scraping service for comprehensive regulatory authority coverage

const axios = require('axios');
const cheerio = require('cheerio');

// Enhanced date parsing with multiple format support
const parseDate = (dateStr) => {
    try {
        if (!dateStr) return null;
        
        // Clean and normalize date string
        const cleanDate = dateStr.trim()
            .replace(/(\d+)(st|nd|rd|th)/, '$1') // Remove ordinal suffixes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/^(Published|Date|Updated):\s*/i, '') // Remove prefixes
            .replace(/,?\s*\d{2}:\d{2}.*$/, '') // Remove time portions
            .replace(/GMT|BST|UTC/gi, '') // Remove timezone abbreviations
            .trim();
        
        // Try direct parsing first
        let date = new Date(cleanDate);
        if (!isNaN(date.getTime())) return date;
        
        // Try various UK date formats
        const ukFormats = [
            /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
            /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
            /(\d{4})-(\d{1,2})-(\d{1,2})/
        ];
        
        for (const format of ukFormats) {
            const match = cleanDate.match(format);
            if (match) {
                date = new Date(cleanDate);
                if (!isNaN(date.getTime())) return date;
            }
        }
        
        return null;
    } catch (error) {
        console.log('Date parsing error:', error.message);
        return null;
    }
};

const isRecent = (date, daysThreshold = 14) => {
    if (!date) return false;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - daysThreshold);
    return date >= threshold;
};

// Enhanced FCA scraping with multiple content types
const scrapeFCAContent = async () => {
    const sources = [
        {
            name: 'FCA Publications',
            url: 'https://www.fca.org.uk/publications',
            selectors: ['.publication-item', '.document-item', '.content-item', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.title a', '.headline a'],
            dateSelectors: ['.date', '.published', '.publication-date', 'time']
        },
        {
            name: 'FCA Speeches',
            url: 'https://www.fca.org.uk/news/speeches',
            selectors: ['.speech-item', '.news-item', '.content-item', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.title a', '.headline a'],
            dateSelectors: ['.date', '.published', '.speech-date', 'time']
        },
        {
            name: 'FCA Consultations',
            url: 'https://www.fca.org.uk/news/open-consultations',
            selectors: ['.consultation-item', '.news-item', '.content-item', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.title a', '.headline a'],
            dateSelectors: ['.date', '.deadline', '.consultation-date', 'time']
        }
    ];
    
    const allArticles = [];
    
    for (const source of sources) {
        try {
            console.log(`🔍 Scraping: ${source.name}`);
            const articles = await scrapeGeneric({
                name: source.name,
                authority: 'FCA',
                url: source.url,
                selectors: source.selectors,
                linkSelectors: source.linkSelectors,
                dateSelectors: source.dateSelectors
            });
            allArticles.push(...articles);
        } catch (error) {
            console.error(`❌ Error scraping ${source.name}:`, error.message);
        }
    }
    
    return allArticles;
};

// Enhanced PSR scraping
const scrapePSR = async () => {
    const sources = [
        {
            name: 'PSR News',
            url: 'https://www.psr.org.uk/news-and-updates/latest-news/',
            selectors: ['.news-item', '.article-item', '.content-item', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.title a', '.news-item__title a'],
            dateSelectors: ['.news-item__date', '.date', '.published', 'time']
        },
        {
            name: 'PSR Consultations',
            url: 'https://www.psr.org.uk/publications/consultations/',
            selectors: ['.consultation-item', '.publication-item', '.content-item', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.title a'],
            dateSelectors: ['.date', '.deadline', '.published', 'time']
        }
    ];
    
    const allArticles = [];
    
    for (const source of sources) {
        try {
            console.log(`🔍 Scraping: ${source.name}`);
            const articles = await scrapeGeneric({
                name: source.name,
                authority: 'PSR',
                url: source.url,
                selectors: source.selectors,
                linkSelectors: source.linkSelectors,
                dateSelectors: source.dateSelectors
            });
            allArticles.push(...articles);
        } catch (error) {
            console.error(`❌ Error scraping ${source.name}:`, error.message);
        }
    }
    
    return allArticles;
};

// Enhanced government sources scraping
const scrapeGovernmentSources = async () => {
    const sources = [
        {
            name: 'HM Treasury',
            authority: 'HMT',
            url: 'https://www.gov.uk/government/organisations/hm-treasury',
            selectors: ['.gem-c-document-list__item', '.publication', '.news-story', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.gem-c-document-list__item-title a'],
            dateSelectors: ['.gem-c-metadata__text', '.gem-c-document-list__item-metadata', '.date', 'time']
        },
        {
            name: 'OFSI',
            authority: 'OFSI',
            url: 'https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation',
            selectors: ['.gem-c-document-list__item', '.publication', '.guidance', 'article'],
            linkSelectors: ['h3 a', 'h2 a', '.gem-c-document-list__item-title a'],
            dateSelectors: ['.gem-c-metadata__text', '.gem-c-document-list__item-metadata', '.date']
        }
    ];
    
    const allArticles = [];
    
    for (const source of sources) {
        try {
            console.log(`🔍 Scraping: ${source.name}`);
            const articles = await scrapeGeneric(source);
            allArticles.push(...articles);
        } catch (error) {
            console.error(`❌ Error scraping ${source.name}:`, error.message);
        }
    }
    
    return allArticles;
};

// Enhanced FATF scraping with better content detection
const scrapeFATF = async () => {
    const url = 'https://www.fatf-gafi.org/en/the-fatf/news.html';
    console.log(`🔍 Scraping: Financial Action Task Force (FATF)`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        // Enhanced selectors for FATF website
        const selectors = [
            '.news-item',
            '.article-item',
            '.content-item',
            '.publication-item',
            '.press-release',
            'article',
            '.fatf-news-item'
        ];
        
        let foundArticles = false;
        
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                foundArticles = true;
                
                items.each((i, el) => {
                    if (i >= 10) return; // Limit to first 10 items
                    
                    // Enhanced link extraction
                    let titleElement = $(el).find('h3 a, h2 a, h4 a, .title a, a.title').first();
                    if (!titleElement.length) {
                        titleElement = $(el).find('a').first();
                    }
                    
                    const title = titleElement.text().trim();
                    let relativeUrl = titleElement.attr('href');
                    
                    // Enhanced date extraction with multiple patterns
                    let dateStr = '';
                    const dateSelectors = [
                        '.date', '.published', '.publication-date', '.news-date',
                        'time', '.fatf-date', '.article-date'
                    ];
                    
                    for (const dateSelector of dateSelectors) {
                        dateStr = $(el).find(dateSelector).text().trim();
                        if (dateStr) break;
                    }
                    
                    // Fallback: look for date patterns in text
                    if (!dateStr) {
                        const text = $(el).text();
                        const dateMatches = [
                            /(\d{1,2}\s+\w+\s+\d{4})/,
                            /(\w+\s+\d{1,2},?\s+\d{4})/,
                            /(\d{1,2}\/\d{1,2}\/\d{4})/,
                            /(\d{4}-\d{1,2}-\d{1,2})/
                        ];
                        
                        for (const pattern of dateMatches) {
                            const match = text.match(pattern);
                            if (match) {
                                dateStr = match[1];
                                break;
                            }
                        }
                    }
                    
                    const date = parseDate(dateStr);
                    
                    if (relativeUrl && title && date && isRecent(date, 14)) {
                        // Ensure absolute URL
                        if (!relativeUrl.startsWith('http')) {
                            relativeUrl = new URL(relativeUrl, 'https://www.fatf-gafi.org/').href;
                        }
                        
                        articles.push({ 
                            title, 
                            link: relativeUrl, 
                            pubDate: date.toISOString(),
                            authority: 'FATF'
                        });
                    }
                });
                break; // Stop trying selectors once we found working one
            }
        }
        
        if (!foundArticles) {
            console.log('⚠️ No articles found with any selector for FATF');
        }
        
        console.log(`📊 FATF: Found ${articles.length} recent articles`);
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping FATF:`, error.message);
        return [];
    }
};

// Enhanced TPR scraping with better content detection
const scrapePensionRegulator = async () => {
    const url = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases';
    console.log(`🔍 Scraping: The Pension Regulator (TPR)`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        // Enhanced selectors for TPR website
        const selectors = [
            '.press-release-item',
            '.news-item',
            '.article-item',
            '.content-item',
            'article',
            '.media-item'
        ];
        
        let foundArticles = false;
        
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                foundArticles = true;
                
                items.each((i, el) => {
                    if (i >= 10) return; // Limit to first 10 items
                    
                    let titleElement = $(el).find('h3 a, h2 a, h4 a, a.title, .title a').first();
                    if (!titleElement.length) {
                        titleElement = $(el).find('a').first();
                    }
                    
                    const title = titleElement.text().trim();
                    let relativeUrl = titleElement.attr('href');
                    
                    // Enhanced date extraction
                    let dateStr = $(el).find('time, .date, .published, .article-date, .press-date').text().trim();
                    if (!dateStr) {
                        const text = $(el).text();
                        const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
                        if (dateMatch) dateStr = dateMatch[1];
                    }
                    
                    const date = parseDate(dateStr);
                    
                    if (relativeUrl && title && date && isRecent(date, 14)) {
                        const absoluteUrl = relativeUrl.startsWith('http') ? 
                            relativeUrl : new URL(relativeUrl, url).href;
                        
                        articles.push({ 
                            title, 
                            link: absoluteUrl, 
                            pubDate: date.toISOString(),
                            authority: 'TPR'
                        });
                    }
                });
                break;
            }
        }
        
        if (!foundArticles) {
            console.log('⚠️ No articles found with any selector for TPR');
        }
        
        console.log(`📊 TPR: Found ${articles.length} recent articles`);
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping TPR:`, error.message);
        return [];
    }
};

// Enhanced SFO scraping
const scrapeSFO = async () => {
    const url = 'https://www.sfo.gov.uk/news-and-publications/news-releases/';
    console.log(`🔍 Scraping: Serious Fraud Office (SFO)`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        const selectors = [
            '.news-item',
            '.article-item', 
            'article',
            '.content-item',
            '.press-release',
            '.news-listing-item'
        ];
        
        let foundArticles = false;
        
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                foundArticles = true;
                
                items.each((i, el) => {
                    if (i >= 8) return; // Limit to first 8 items
                    
                    let titleElement = $(el).find('.news-item__title a, h3 a, h2 a, .title a, a.title').first();
                    if (!titleElement.length) {
                        titleElement = $(el).find('a').first();
                    }
                    
                    const title = titleElement.text().trim();
                    let relativeUrl = titleElement.attr('href');
                    
                    let dateStr = $(el).find('.news-item__date, .date, time, .published').text().trim();
                    if (!dateStr) {
                        const text = $(el).text();
                        const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
                        if (dateMatch) dateStr = dateMatch[1];
                    }
                    
                    const date = parseDate(dateStr);
                    
                    if (relativeUrl && title && date && isRecent(date, 14)) {
                        const absoluteUrl = relativeUrl.startsWith('http') ? 
                            relativeUrl : new URL(relativeUrl, url).href;
                        
                        articles.push({ 
                            title, 
                            link: absoluteUrl, 
                            pubDate: date.toISOString(),
                            authority: 'SFO'
                        });
                    }
                });
                break;
            }
        }
        
        if (!foundArticles) {
            console.log('⚠️ No articles found with any selector for SFO');
        }
        
        console.log(`📊 SFO: Found ${articles.length} recent articles`);
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping SFO:`, error.message);
        return [];
    }
};

// Enhanced generic scraper with better error handling and retry logic
const scrapeGeneric = async (config) => {
    const { name, authority, url, selectors, linkSelectors, dateSelectors } = config;
    console.log(`🔍 Scraping: ${name}`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            },
            timeout: 15000,
            maxRedirects: 5
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        let foundArticles = false;
        
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                foundArticles = true;
                
                items.each((i, el) => {
                    if (i >= 12) return; // Limit to prevent overwhelming
                    
                    // Enhanced link extraction with multiple fallback options
                    let titleElement = null;
                    for (const linkSelector of linkSelectors) {
                        titleElement = $(el).find(linkSelector).first();
                        if (titleElement.length) break;
                    }
                    
                    if (!titleElement || !titleElement.length) {
                        titleElement = $(el).find('a').first();
                    }
                    
                    const title = titleElement.text().trim();
                    let relativeUrl = titleElement.attr('href');
                    
                    if (!title || !relativeUrl) return;
                    
                    // Enhanced date extraction with multiple patterns
                    let dateStr = '';
                    for (const dateSelector of dateSelectors) {
                        dateStr = $(el).find(dateSelector).text().trim();
                        if (dateStr) break;
                    }
                    
                    // Fallback date extraction methods
                    if (!dateStr) {
                        const text = $(el).text();
                        const datePatterns = [
                            /(\d{1,2}\s+\w+\s+\d{4})/,
                            /(\w+\s+\d{1,2},?\s+\d{4})/,
                            /(\d{1,2}\/\d{1,2}\/\d{4})/,
                            /(\d{4}-\d{1,2}-\d{1,2})/
                        ];
                        
                        for (const pattern of datePatterns) {
                            const match = text.match(pattern);
                            if (match) {
                                dateStr = match[1];
                                break;
                            }
                        }
                    }
                    
                    const date = parseDate(dateStr);
                    
                    if (date && isRecent(date, 14)) {
                        const absoluteUrl = relativeUrl.startsWith('http') ? 
                            relativeUrl : new URL(relativeUrl, url).href;
                        
                        articles.push({ 
                            title, 
                            link: absoluteUrl, 
                            pubDate: date.toISOString(),
                            authority: authority || 'Unknown'
                        });
                    }
                });
                break;
            }
        }
        
        if (!foundArticles) {
            console.log(`⚠️ No articles found with any selector for ${name}`);
        }
        
        console.log(`📊 ${name}: Found ${articles.length} recent articles`);
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping ${name}:`, error.message);
        return [];
    }
};

// Enhanced JMLSG scraping
const scrapeJMLSG = async () => {
    return await scrapeGeneric({
        name: 'JMLSG',
        authority: 'JMLSG',
        url: 'https://www.jmlsg.org.uk/news-events/',
        selectors: ['.news-item', '.event-item', 'article', '.content-item'],
        linkSelectors: ['h3 a', 'h2 a', '.title a'],
        dateSelectors: ['.date', '.published', 'time']
    });
};

// Enhanced Pay.UK scraping
const scrapePayUK = async () => {
    return await scrapeGeneric({
        name: 'Pay.UK',
        authority: 'Pay.UK',
        url: 'https://www.wearepay.uk/news/',
        selectors: ['.news-item', '.article-item', 'article', '.content-item'],
        linkSelectors: ['h3 a', 'h2 a', '.title a'],
        dateSelectors: ['.date', '.published', 'time', '.news-date']
    });
};

// Test selectors on a page for debugging
const testSelectors = async (url, selectors) => {
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const results = {};
        
        selectors.forEach(selector => {
            const items = $(selector);
            results[selector] = {
                count: items.length,
                sample: items.length > 0 ? $(items[0]).text().trim().substring(0, 100) + '...' : null
            };
        });
        
        return results;
    } catch (error) {
        console.error(`❌ Error testing selectors:`, error.message);
        return {};
    }
};

// Rate limiting utility
const rateLimitedRequest = async (requestFn, delay = 2000) => {
    try {
        const result = await requestFn();
        await new Promise(resolve => setTimeout(resolve, delay));
        return result;
    } catch (error) {
        console.error('Rate limited request failed:', error.message);
        throw error;
    }
};

// Comprehensive scraping function that handles all sources
const scrapeAllSources = async () => {
    console.log('🚀 Starting comprehensive web scraping...');
    
    const allSources = [
        () => scrapeFCAContent(),
        () => scrapePSR(),
        () => scrapeGovernmentSources(),
        () => scrapeFATF(),
        () => scrapePensionRegulator(),
        () => scrapeSFO(),
        () => scrapeJMLSG(),
        () => scrapePayUK()
    ];
    
    const allArticles = [];
    let totalProcessed = 0;
    
    for (const sourceFn of allSources) {
        try {
            const articles = await rateLimitedRequest(sourceFn, 3000);
            allArticles.push(...articles);
            totalProcessed += articles.length;
            console.log(`✅ Source completed, total articles so far: ${totalProcessed}`);
        } catch (error) {
            console.error(`❌ Source failed:`, error.message);
        }
    }
    
    console.log(`📊 Web scraping complete: ${totalProcessed} total articles from all sources`);
    return allArticles;
};

module.exports = {
    scrapePensionRegulator,
    scrapeSFO,
    scrapeFATF,
    scrapeFCAContent,
    scrapePSR,
    scrapeGovernmentSources,
    scrapeJMLSG,
    scrapePayUK,
    scrapeGeneric,
    scrapeAllSources,
    testSelectors,
    parseDate,
    isRecent,
    rateLimitedRequest
};