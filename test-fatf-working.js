// Working FATF scraper - bypasses Cloudflare with proper configuration
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrapeFATF() {
  console.log('🌍 FATF: Starting comprehensive scraping with Cloudflare bypass...\n');

  const browser = await puppeteer.launch({
    headless: 'new', // Use new headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=site-per-process',
      '--enable-features=NetworkService',
      '--window-size=1920,1080'
    ],
    defaultViewport: null
  });

  const results = [];

  try {
    const page = await browser.newPage();

    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Enable request interception to avoid loading unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Scrape News Page
    console.log('📰 Scraping FATF News...');
    const newsUrl = 'https://www.fatf-gafi.org/en/the-fatf/news.html';

    await page.goto(newsUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract news items with multiple selector attempts
    const newsItems = await page.evaluate(() => {
      const items = [];

      // Try various selectors that FATF might use
      const selectors = [
        '.cmp-contentfragmentlist__item',
        '.cmp-teaser',
        'article',
        '[class*="news-item"]',
        '[class*="content-item"]',
        '.result-item',
        '.search-result',
        'div[data-cmp-is="teaser"]'
      ];

      let elements = [];
      for (const selector of selectors) {
        elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
          break;
        }
      }

      // If no specific elements found, try to find links with news patterns
      if (elements.length === 0) {
        const allLinks = document.querySelectorAll('a[href*="/news/"], a[href*="/the-fatf/"], a[href*="/publications/"]');
        const uniqueLinks = new Map();

        allLinks.forEach(link => {
          const href = link.href;
          const title = link.textContent?.trim();

          // Filter out navigation links
          if (title && title.length > 20 && !title.includes('Read more') && !uniqueLinks.has(href)) {
            uniqueLinks.set(href, { title, href });
          }
        });

        uniqueLinks.forEach(item => items.push(item));
      } else {
        elements.forEach(element => {
          try {
            // Try to extract title
            let title = element.querySelector('h2, h3, .cmp-teaser__title, [class*="title"]')?.textContent?.trim();

            // Try to extract link
            let url = element.querySelector('a')?.href;

            // Try to extract date
            let date = element.querySelector('time, .date, [class*="date"]')?.textContent?.trim();

            // Try to extract description
            let description = element.querySelector('p, .cmp-teaser__description, [class*="description"]')?.textContent?.trim();

            if (title && url) {
              items.push({
                title,
                url,
                date: date || new Date().toISOString().split('T')[0],
                description: description || title
              });
            }
          } catch (error) {
            console.error('Error extracting item:', error);
          }
        });
      }

      return items;
    });

    console.log(`✅ Found ${newsItems.length} news items`);

    // Add to results
    newsItems.slice(0, 10).forEach(item => {
      results.push({
        headline: item.title,
        url: item.url,
        authority: 'FATF',
        area: 'News',
        source_category: 'international_scraping',
        source_description: 'FATF News',
        fetched_date: new Date().toISOString(),
        raw_data: {
          sourceType: 'puppeteer',
          sourceKey: 'FATF',
          country: 'International',
          priority: 'HIGH',
          originalDate: item.date,
          summary: item.description,
          fullContent: `FATF News: ${item.title}\n\n${item.description}`,
          international: {
            isInternational: true,
            sourceAuthority: 'FATF',
            sourceCountry: 'International',
            scrapingTarget: 'news'
          }
        }
      });
    });

    // Scrape Publications Page
    console.log('\n📚 Scraping FATF Publications...');
    const pubUrl = 'https://www.fatf-gafi.org/en/publications.html';

    await page.goto(pubUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll for publications
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract publications
    const pubItems = await page.evaluate(() => {
      const items = [];

      // Similar extraction logic for publications
      const allLinks = document.querySelectorAll('a[href*="/publications/"]');
      const uniqueLinks = new Map();

      allLinks.forEach(link => {
        const href = link.href;
        const title = link.textContent?.trim();

        // Filter out navigation links and duplicates
        if (title && title.length > 20 && !title.includes('Read more') && !uniqueLinks.has(href)) {
          // Get parent element for more context
          const parent = link.closest('div, article, section, li');
          const date = parent?.querySelector('time, .date, [class*="date"]')?.textContent?.trim();
          const description = parent?.querySelector('p, [class*="description"]')?.textContent?.trim();

          uniqueLinks.set(href, {
            title,
            href,
            date: date || new Date().toISOString().split('T')[0],
            description: description || title
          });
        }
      });

      uniqueLinks.forEach(item => items.push(item));
      return items;
    });

    console.log(`✅ Found ${pubItems.length} publication items`);

    // Add publications to results
    pubItems.slice(0, 10).forEach(item => {
      results.push({
        headline: item.title,
        url: item.url,
        authority: 'FATF',
        area: 'Publications',
        source_category: 'international_scraping',
        source_description: 'FATF Publications',
        fetched_date: new Date().toISOString(),
        raw_data: {
          sourceType: 'puppeteer',
          sourceKey: 'FATF',
          country: 'International',
          priority: 'HIGH',
          originalDate: item.date,
          summary: item.description,
          fullContent: `FATF Publication: ${item.title}\n\n${item.description}`,
          international: {
            isInternational: true,
            sourceAuthority: 'FATF',
            sourceCountry: 'International',
            scrapingTarget: 'publications'
          }
        }
      });
    });

  } catch (error) {
    console.error('❌ FATF scraping failed:', error.message);
  } finally {
    await browser.close();
  }

  console.log(`\n🎉 FATF Total items collected: ${results.length}`);

  if (results.length > 0) {
    console.log('\n📄 Sample FATF items:');
    results.slice(0, 3).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.headline}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   Area: ${item.area}`);
    });
  }

  return results;
}

// Test the scraper
scrapeFATF().then(results => {
  console.log(`\n✅ Test complete! Found ${results.length} FATF items.`);
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});