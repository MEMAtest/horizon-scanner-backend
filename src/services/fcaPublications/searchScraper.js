/**
 * FCA Publications Search Scraper
 *
 * Scrapes the FCA publications search results page
 * Handles pagination through ~18k+ results
 * Uses Puppeteer with stealth to bypass Cloudflare protection
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const crypto = require('crypto');
const {
  FCA_BASE_URL,
  SEARCH_CONFIG,
  RATE_LIMITS,
  HTTP_CONFIG,
  DOCUMENT_TYPES
} = require('./constants');

// Enable stealth mode
puppeteer.use(StealthPlugin());

class SearchScraper {
  constructor(database, progressTracker) {
    this.db = database;
    this.progressTracker = progressTracker;
    this.totalResults = 0;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.browser = null;
  }

  /**
   * Initialize browser
   */
  async initBrowser() {
    if (this.browser) return this.browser;

    console.log('[SearchScraper] Launching Puppeteer browser with stealth mode...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920x1080'
      ]
    });

    this.browser.on('disconnected', () => {
      this.browser = null;
      console.warn('[SearchScraper] Browser disconnected');
    });

    console.log('[SearchScraper] Browser launched successfully');
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('[SearchScraper] Browser closed');
    }
  }

  /**
   * Delay between requests for rate limiting
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Rate-limited request using Puppeteer
   */
  async rateLimitedRequest(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMITS.searchPageDelay) {
      await this.delay(RATE_LIMITS.searchPageDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;

    // Initialize browser if needed
    await this.initBrowser();

    const page = await this.browser.newPage();
    try {
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for content to load
      await page.waitForSelector('ol.search-list, .search-results', { timeout: 30000 }).catch(() => {
        // Content might not exist, continue anyway
      });

      // Get page content
      const html = await page.content();

      return { data: html };
    } catch (error) {
      console.error(`[SearchScraper] Error fetching ${url}:`, error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Build search URL with parameters
   */
  buildSearchUrl(startIndex, options = {}) {
    const params = new URLSearchParams();

    // Category filter
    const category = options.category || SEARCH_CONFIG.defaultCategory;
    params.set('np_category', category);

    // Pagination
    params.set('start', startIndex.toString());

    // Year filter if specified
    if (options.year) {
      params.set('year', options.year.toString());
    }

    // Document type filter
    if (options.documentType) {
      params.set('document_type', options.documentType);
    }

    return `${SEARCH_CONFIG.baseUrl}?${params.toString()}`;
  }

  /**
   * Parse search results page
   */
  parseSearchResults(html, pageUrl) {
    const $ = cheerio.load(html);
    const publications = [];

    // Extract total results count - FCA uses: "Showing 1 to 10 of 18139 search results."
    const resultsText = $('.search-results__count').text();
    const totalMatch = resultsText.match(/of\s+(\d[\d,]*)\s+search\s+results/i);
    if (totalMatch) {
      this.totalResults = parseInt(totalMatch[1].replace(/,/g, ''), 10);
    }

    // Parse each search result - FCA structure: ol.search-list > li.search-item
    $('ol.search-list li.search-item').each((index, element) => {
      try {
        const $item = $(element);

        // Extract title and link - FCA uses: h3.search-item__title > a.search-item__clickthrough
        const $titleLink = $item.find('h3.search-item__title a.search-item__clickthrough');
        const rawTitle = $titleLink.text().trim();
        const url = $titleLink.attr('href');

        if (!rawTitle || !url) return;

        // Extract file type from title (e.g., "[pdf]", "[csv]")
        const fileTypeMatch = rawTitle.match(/\[(pdf|csv|doc|docx|xls|xlsx)\]/i);
        const fileType = fileTypeMatch ? fileTypeMatch[1].toLowerCase() : null;
        const title = rawTitle.replace(/\s*\[[^\]]+\]\s*$/, '').trim();

        // Extract date - FCA uses: p.meta-item.published-date with "Published: DD/MM/YYYY"
        const dateText = $item.find('p.meta-item.published-date').text().replace('Published:', '').trim();
        const publicationDate = this.parseDate(dateText);

        // Extract document type - FCA uses: p.meta-item.type
        const typeText = $item.find('p.meta-item.type').text().trim().toLowerCase();
        const documentType = this.normalizeDocumentType(typeText, title);

        // Extract description - FCA uses: div.search-item__body
        const description = $item.find('div.search-item__body').text().trim();

        // Determine PDF URL
        const isPdf = fileType === 'pdf' || url.endsWith('.pdf');
        const pdfUrl = isPdf ? url : null;

        // Generate unique publication ID
        const publicationId = this.generatePublicationId(url, title, publicationDate);

        publications.push({
          publicationId,
          title: this.cleanTitle(title),
          documentType,
          publicationDate,
          url,
          pdfUrl,
          description: description.substring(0, 1000),
          sourcePageUrl: pageUrl,
          fileType
        });
      } catch (error) {
        console.error('[SearchScraper] Error parsing result:', error.message);
      }
    });

    return publications;
  }

  /**
   * Extract PDF URL from search result
   */
  extractPdfUrl($item, pageUrl) {
    // Look for PDF link in the item
    const pdfLink = $item.find('a[href$=".pdf"]').attr('href');
    if (pdfLink) {
      return pdfLink.startsWith('http')
        ? pdfLink
        : `${FCA_BASE_URL}${pdfLink.startsWith('/') ? '' : '/'}${pdfLink}`;
    }

    // Check if main URL leads to PDF
    if (pageUrl.includes('/publication/')) {
      // Construct likely PDF URL from page URL
      const pdfPath = pageUrl
        .replace('/publications/', '/publication/')
        .replace(/\/$/, '') + '.pdf';
      return pdfPath;
    }

    return null;
  }

  /**
   * Parse date from various formats
   */
  parseDate(dateText) {
    if (!dateText) return null;

    // Common formats: "22/12/2025", "22 December 2025", "Published: 22/12/2025"
    const cleaned = dateText.replace(/Published:?\s*/i, '').trim();

    // Try DD/MM/YYYY
    let match = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      return new Date(Date.UTC(
        parseInt(match[3]),
        parseInt(match[2]) - 1,
        parseInt(match[1])
      ));
    }

    // Try DD Month YYYY
    const months = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    match = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (match) {
      const monthNum = months[match[2].toLowerCase()];
      if (monthNum !== undefined) {
        return new Date(Date.UTC(
          parseInt(match[3]),
          monthNum,
          parseInt(match[1])
        ));
      }
    }

    // Try native Date parsing as fallback
    const parsed = new Date(cleaned);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Normalize document type to standard format
   */
  normalizeDocumentType(typeText, title) {
    const combined = `${typeText} ${title}`.toLowerCase();

    for (const [key, value] of Object.entries(DOCUMENT_TYPES)) {
      if (combined.includes(key)) {
        return value;
      }
    }

    return DOCUMENT_TYPES.default;
  }

  /**
   * Clean title text
   */
  cleanTitle(title) {
    return title
      .replace(/\[PDF\]/gi, '')
      .replace(/\[CSV\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate unique publication ID
   */
  generatePublicationId(url, title, date) {
    const dateStr = date ? date.toISOString().slice(0, 10) : 'nodate';
    const hash = crypto
      .createHash('sha256')
      .update(`${url}|${title}`)
      .digest('hex')
      .substring(0, 12);
    return `FCA-${dateStr}-${hash}`;
  }

  /**
   * Scrape a single page of results
   */
  async scrapePage(startIndex, options = {}) {
    const url = this.buildSearchUrl(startIndex, options);
    console.log(`[SearchScraper] Fetching page at start=${startIndex}...`);

    try {
      const response = await this.rateLimitedRequest(url);
      const publications = this.parseSearchResults(response.data, url);

      console.log(`[SearchScraper] Found ${publications.length} publications on page`);
      return {
        publications,
        totalResults: this.totalResults,
        hasMore: publications.length === SEARCH_CONFIG.resultsPerPage
      };
    } catch (error) {
      console.error(`[SearchScraper] Error scraping page ${startIndex}:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape all pages (full backfill)
   */
  async scrapeAllPages(options = {}) {
    const {
      startPage = 1,
      maxPages = null,
      onPageComplete = null,
      jobId = null
    } = options;

    let currentStart = startPage;
    let totalScraped = 0;
    let totalInserted = 0;
    let hasMore = true;

    console.log(`[SearchScraper] Starting full scrape from page ${Math.ceil(startPage / 10)}`);

    while (hasMore) {
      try {
        const result = await this.scrapePage(currentStart, options);

        if (result.publications.length > 0) {
          // Save to database
          const { inserted, updated } = await this.db.insertPublicationsBatch(result.publications);
          totalInserted += inserted;

          console.log(`[SearchScraper] Page at start=${currentStart}: ${inserted} new, ${updated} updated`);
        }

        totalScraped += result.publications.length;
        hasMore = result.hasMore;

        // Update progress
        if (this.progressTracker && jobId) {
          await this.progressTracker.updateProgress(jobId, {
            processedItems: totalScraped,
            lastStartParam: currentStart,
            lastPageScraped: Math.ceil(currentStart / 10)
          });
        }

        // Callback for progress reporting
        if (onPageComplete) {
          await onPageComplete({
            currentStart,
            pageNumber: Math.ceil(currentStart / 10),
            publicationsOnPage: result.publications.length,
            totalScraped,
            totalInserted,
            totalResults: result.totalResults,
            estimatedPagesRemaining: Math.ceil((result.totalResults - currentStart) / 10)
          });
        }

        // Check max pages limit
        if (maxPages && Math.ceil(currentStart / 10) >= maxPages) {
          console.log(`[SearchScraper] Reached max pages limit (${maxPages})`);
          break;
        }

        // Move to next page
        currentStart += SEARCH_CONFIG.resultsPerPage;

        // Rate limit delay
        await this.delay(RATE_LIMITS.searchPageDelay);

      } catch (error) {
        console.error(`[SearchScraper] Error at start=${currentStart}:`, error.message);

        // Retry logic
        if (error.response?.status >= 500) {
          console.log('[SearchScraper] Server error, waiting 30 seconds...');
          await this.delay(30000);
          continue; // Retry same page
        }

        throw error;
      }
    }

    console.log(`[SearchScraper] Scrape complete: ${totalScraped} publications found, ${totalInserted} new records`);

    return {
      totalScraped,
      totalInserted,
      totalPages: Math.ceil(currentStart / 10),
      totalResults: this.totalResults
    };
  }

  /**
   * Scrape recent publications (incremental update)
   */
  async scrapeRecent(options = {}) {
    const {
      maxPages = 10,
      sinceDate = null
    } = options;

    let currentStart = 1;
    let totalNew = 0;
    let reachedExisting = false;

    console.log('[SearchScraper] Checking for new publications...');

    while (!reachedExisting && currentStart <= maxPages * 10) {
      const result = await this.scrapePage(currentStart, options);

      for (const pub of result.publications) {
        // Check if we've already seen this publication
        const exists = await this.db.publicationExists(pub.publicationId);

        if (exists) {
          reachedExisting = true;
          console.log(`[SearchScraper] Reached existing publication at start=${currentStart}`);
          break;
        }

        // Check date threshold
        if (sinceDate && pub.publicationDate && pub.publicationDate < sinceDate) {
          reachedExisting = true;
          break;
        }

        // Insert new publication
        await this.db.insertPublication(pub);
        totalNew++;
      }

      if (!reachedExisting) {
        currentStart += SEARCH_CONFIG.resultsPerPage;
        await this.delay(RATE_LIMITS.searchPageDelay);
      }
    }

    console.log(`[SearchScraper] Incremental scrape complete: ${totalNew} new publications`);
    return { totalNew };
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      totalResultsFound: this.totalResults
    };
  }
}

module.exports = SearchScraper;
