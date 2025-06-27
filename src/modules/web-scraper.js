// scrapers.js
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const parser = new Parser();

// --- Helpers

/**
 * Parse a date string like "15 July 2025" or "15th July, 2025" into a Date.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr
    .trim()
    // strip ordinal suffixes
    .replace(/(\d+)(st|nd|rd|th)/, '$1')
    // collapse whitespace
    .replace(/\s+/g, ' ');
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Check if a date is within the last N days.
 */
function isRecent(date, days = 7) {
  if (!date) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

/**
 * Fetch and parse an RSS or Atom feed.
 * Returns items with { title, link, pubDate }.
 */
async function fetchRSS(rssUrl) {
  const feed = await parser.parseURL(rssUrl);
  return feed.items
    .map(item => {
      if (!item.pubDate) return null;
      const date = new Date(item.pubDate);
      if (!isRecent(date)) return null;
      return {
        title: item.title.trim(),
        link: item.link,
        pubDate: date.toISOString()
      };
    })
    .filter(Boolean);
}

/**
 * Generic HTML scraper.
 * @param {string} url     — page to fetch
 * @param {object} cfg     — { listSelector, titleSel, linkSel, dateSel }
 */
async function fetchHTML(url, cfg) {
  const { listSelector, titleSel, linkSel, dateSel } = cfg;
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000
  });
  const $ = cheerio.load(data);

  return $(listSelector)
    .map((i, el) => {
      const titleEl = $(el).find(titleSel).first();
      const title = titleEl.text().trim();
      let href = titleEl.attr('href');
      if (href && !href.startsWith('http')) href = new URL(href, url).href;

      const dateText = $(el).find(dateSel).first().text().trim();
      const date = parseDate(dateText);

      if (title && href && date && isRecent(date)) {
        return { title, link: href, pubDate: date.toISOString() };
      }
      return null;
    })
    .get()
    .filter(Boolean);
}

// --- Site-specific scrapers

/**
 * 1) FATF Publications (HTML-only)
 *    URL: https://www.fatf-gafi.org/en/publications.html
 */
async function scrapeFATF() {
  const url = 'https://www.fatf-gafi.org/en/publications.html';
  console.log('🔍 scrapeFATF');

  // Try multiple selectors to catch all items
  const cfgs = [
    {
      listSelector: '.publication-item',
      titleSel: 'h3 a, a',
      linkSel: 'h3 a, a',
      dateSel: '.publication-item-date'
    },
    {
      listSelector: '.document-item',
      titleSel: 'h3 a, a',
      linkSel: 'h3 a, a',
      dateSel: 'time, .date'
    },
    {
      listSelector: '.teaser',
      titleSel: 'h3 a, a',
      linkSel: 'h3 a, a',
      dateSel: '.date'
    }
  ];

  for (const cfg of cfgs) {
    const items = await fetchHTML(url, cfg);
    if (items.length) {
      console.log(
        `📊 scrapeFATF: found ${items.length} items using ${cfg.listSelector}`
      );
      return items;
    }
  }

  // Fallback: scan headers + next text node
  console.log('ℹ️ scrapeFATF fallback: header scan');
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const results = [];
  $('h2, h3').each((i, hdr) => {
    const a = $(hdr).find('a').first();
    if (!a.length) return;
    const title = a.text().trim();
    let href = a.attr('href');
    if (href && !href.startsWith('http')) href = new URL(href, url).href;
    const date = parseDate($(hdr).next().text().trim());
    if (title && href && date && isRecent(date)) {
      results.push({ title, link: href, pubDate: date.toISOString() });
    }
  });
  console.log(`📊 scrapeFATF fallback: found ${results.length}`);
  return results;
}

/**
 * 2) FSB Press Releases (RSS primary, HTML fallback)
 *    RSS: https://www.fsb.org/feed/
 *    HTML: https://www.fsb.org/press/
 */
async function scrapeFSB() {
  console.log('🔍 scrapeFSB');
  // RSS first
  try {
    const rssItems = await fetchRSS('https://www.fsb.org/feed/');
    if (rssItems.length) {
      console.log(`📊 scrapeFSB: ${rssItems.length} items via RSS`);
      return rssItems;
    }
  } catch (e) {
    console.warn('❗ scrapeFSB RSS failed, falling back to HTML');
  }

  // HTML fallback
  const url = 'https://www.fsb.org/press/';
  const cfg = {
    listSelector: '.press-item, .item-list__item, article',
    titleSel: 'h2 a, .field-title a',
    linkSel: 'h2 a, .field-title a',
    dateSel: '.press-date, time'
  };
  const htmlItems = await fetchHTML(url, cfg);
  console.log(`📊 scrapeFSB HTML: found ${htmlItems.length}`);
  return htmlItems;
}

/**
 * 3) UK Finance News & Insight (HTML only)
 *    URL: https://www.ukfinance.org.uk/news-and-insight
 */
async function scrapeUKFinance() {
  console.log('🔍 scrapeUKFinance');
  const url = 'https://www.ukfinance.org.uk/news-and-insight';
  const cfg = {
    listSelector: '.news-and-insight__item, .views-row',
    titleSel: 'h3 a, .node-title a',
    linkSel: 'h3 a, .node-title a',
    dateSel: '.news-date, .date'
  };
  const items = await fetchHTML(url, cfg);
  console.log(`📊 scrapeUKFinance: found ${items.length}`);
  return items;
}

// --- Export

module.exports = {
  scrapeFATF,
  scrapeFSB,
  scrapeUKFinance,
  // Generic helpers in case you need them elsewhere:
  fetchRSS,
  fetchHTML,
  parseDate,
  isRecent
};
