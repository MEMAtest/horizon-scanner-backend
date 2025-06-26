const axios = require('axios');
const cheerio = require('cheerio');

const parseDate = (dateStr) => {
    try {
        if (!dateStr) return null;
        
        const cleanDate = dateStr.trim()
            .replace(/(\d+)(st|nd|rd|th)/, '$1')
            .replace(/\s+/g, ' ');
        
        const date = new Date(cleanDate);
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        console.log('Date parsing error:', error.message);
        return null;
    }
};

const isRecent = (date) => {
    if (!date) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return date >= sevenDaysAgo;
};

const scrapePensionRegulator = async () => {
    const url = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases';
    console.log(`🔍 Scraping: The Pension Regulator`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        const selectors = [
            'div.press-release-item',
            '.news-item',
            '.article-item',
            'article',
            '.content-item'
        ];
        
        let foundArticles = false;
        
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                foundArticles = true;
                
                items.each((i, el) => {
                    let titleElement = $(el).find('h3 a, h2 a, h4 a, a.title, .title a').first();
                    if (!titleElement.length) {
                        titleElement = $(el).find('a').first();
                    }
                    
                    const title = titleElement.text().trim();
                    let relativeUrl = titleElement.attr('href');
                    
                    let dateStr = $(el).find('time, .date, .published, .article-date').text().trim();
                    if (!dateStr) {
                        const text = $(el).text();
                        const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
                        if (dateMatch) dateStr = dateMatch[1];
                    }
                    
                    const date = parseDate(dateStr);
                    
                    if (relativeUrl && title && date && isRecent(date)) {
                        const absoluteUrl = relativeUrl.startsWith('http') ? 
                            relativeUrl : new URL(relativeUrl, url).href;
                        
                        articles.push({ 
                            title, 
                            link: absoluteUrl, 
                            pubDate: date.toISOString() 
                        });
                    }
                });
                break;
            }
        }
        
        if (!foundArticles) {
            console.log('⚠️ No articles found with any selector');
        }
        
        console.log(`📊 TPR: Found ${articles.length} recent articles`);
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping TPR:`, error.message);
        return [];
    }
};

const scrapeSFO = async () => {
    const url = 'https://www.sfo.gov.uk/news-and-publications/news-releases/';
    console.log(`🔍 Scraping: Serious Fraud Office (SFO)`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
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
                    
                    if (relativeUrl && title && date && isRecent(date)) {
                        const absoluteUrl = relativeUrl.startsWith('http') ? 
                            relativeUrl : new URL(relativeUrl, url).href;
                        
                        articles.push({ 
                            title, 
                            link: absoluteUrl, 
                            pubDate: date.toISOString() 
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

const scrapeFATF = async () => {
    const url = 'https://www.fatf-gafi.org/en/publications.html';
    console.log(`🔍 Scraping: Financial Action Task Force (FATF)`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        const selectors = [
            '.publication-item',
            '.news-item',
            'article',
            '.content-item',
            '.document-item'
        ];
        
        let foundArticles = false;
        
        for (const selector of selectors) {
            const items = $(selector);
            if (items.length > 0) {
                console.log(`✅ Found ${items.length} items using selector: ${selector}`);
                foundArticles = true;
                
                items.each((i, el) => {
                    let titleElement = $(el).find('h3 a, h2 a, h4 a, .title a, a.title').first();
                    if (!titleElement.length) {
                        titleElement = $(el).find('a').first();
                    }
                    
                    const title = titleElement.text().trim();
                    let relativeUrl = titleElement.attr('href');
                    
                    let dateStr = $(el).find('.publication-item-date, .date, time, .published').text().trim();
                    if (!dateStr) {
                        const text = $(el).text();
                        const dateMatch = text.match(/(\d{1,2}\s+\w+\s+\d{4})/);
                        if (dateMatch) dateStr = dateMatch[1];
                    }
                    
                    const date = parseDate(dateStr);
                    
                    if (relativeUrl && title && date && isRecent(date)) {
                        if (!relativeUrl.startsWith('http')) {
                            relativeUrl = new URL(relativeUrl, 'https://www.fatf-gafi.org/').href;
                        }
                        
                        articles.push({ 
                            title, 
                            link: relativeUrl, 
                            pubDate: date.toISOString() 
                        });
                    }
                });
                break;
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

const scrapeFCADirect = async () => {
    const url = 'https://www.fca.org.uk/news';
    console.log(`🔍 Scraping: FCA News (Direct)`);
    
    try {
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(data);
        const articles = [];
        
        $('.news-item, .article-item, article').each((i, el) => {
            const titleElement = $(el).find('h3 a, h2 a, .title a').first();
            const title = titleElement.text().trim();
            let relativeUrl = titleElement.attr('href');
            
            const dateStr = $(el).find('.date, time, .published').text().trim();
            const date = parseDate(dateStr);
            
            if (relativeUrl && title && date && isRecent(date)) {
                const absoluteUrl = relativeUrl.startsWith('http') ? 
                    relativeUrl : new URL(relativeUrl, 'https://www.fca.org.uk').href;
                
                articles.push({ 
                    title, 
                    link: absoluteUrl, 
                    pubDate: date.toISOString() 
                });
            }
        });
        
        console.log(`📊 FCA Direct: Found ${articles.length} recent articles`);
        return articles;
        
    } catch (error) {
        console.error(`❌ Error scraping FCA directly:`, error.message);
        return [];
    }
};

module.exports = {
    scrapePensionRegulator,
    scrapeSFO,
    scrapeFATF,
    scrapeFCADirect
};