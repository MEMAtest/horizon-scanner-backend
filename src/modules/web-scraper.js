const axios = require('axios');
const cheerio = require('cheerio');

// This function scrapes The Pension Regulator for press releases.
const scrapePensionRegulator = async () => {
    const url = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases';
    console.log(`- Scraping: The Pension Regulator`);
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const articles = [];

        $('div.press-release-item').each((i, el) => {
            const titleElement = $(el).find('h3 a');
            const relativeUrl = titleElement.attr('href');
            const title = titleElement.text().trim();
            const dateStr = $(el).find('time').text().trim();
            // Convert "26 June 2025" to a standard date object
            const date = new Date(dateStr);

            if (relativeUrl && title && !isNaN(date.getTime())) {
                const absoluteUrl = new URL(relativeUrl, url).href;
                articles.push({ title, link: absoluteUrl, pubDate: date.toISOString() });
            }
        });
        
        return articles;

    } catch (error) {
        console.error(`❌ Error scraping The Pension Regulator:`, error.message);
        return [];
    }
};

const scrapeSFO = async () => {
    const url = 'https://www.sfo.gov.uk/news-and-publications/news-releases/';
    console.log(`- Scraping: Serious Fraud Office (SFO)`);
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const articles = [];

        $('.news-item').each((i, el) => {
            const titleElement = $(el).find('.news-item__title a');
            const relativeUrl = titleElement.attr('href');
            const title = titleElement.text().trim();
            const dateStr = $(el).find('.news-item__date').text().trim();
            // Convert "26 June 2025" to a standard date object
            const date = new Date(dateStr);

            if (relativeUrl && title && !isNaN(date.getTime())) {
                const absoluteUrl = new URL(relativeUrl, url).href;
                articles.push({ title, link: absoluteUrl, pubDate: date.toISOString() });
            }
        });

        return articles;
    } catch (error) {
        console.error(`❌ Error scraping SFO:`, error.message);
        return [];
    }
};

const scrapeFATF = async () => {
    const url = 'https://www.fatf-gafi.org/en/publications.html';
    console.log(`- Scraping: Financial Action Task Force (FATF)`);
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        const articles = [];

        $('.publication-item').each((i, el) => {
            const titleElement = $(el).find('h3 a');
            let relativeUrl = titleElement.attr('href');
            const title = titleElement.text().trim();
            const dateStr = $(el).find('.publication-item-date').text().trim();
            // Convert "26 Jun 2025" to a standard date object
            const date = new Date(dateStr);

            if (relativeUrl && title && !isNaN(date.getTime())) {
                if (!relativeUrl.startsWith('http')) {
                   relativeUrl = new URL(relativeUrl, 'https://www.fatf-gafi.org/').href;
                }
                articles.push({ title, link: relativeUrl, pubDate: date.toISOString() });
            }
        });

        return articles;
    } catch (error) {
        console.error(`❌ Error scraping FATF:`, error.message);
        return [];
    }
};

module.exports = {
    scrapePensionRegulator,
    scrapeSFO,
    scrapeFATF,
};