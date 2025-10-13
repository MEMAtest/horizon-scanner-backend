// Test different approaches to access FATF content
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function testFATFAlternatives() {
  console.log('🔍 Testing FATF Alternative Access Methods\n');

  const browser = await puppeteer.launch({
    headless: false, // Try with visible browser
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=site-per-process'
    ]
  });

  try {
    const page = await browser.newPage();

    // Set more realistic viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Try different FATF URLs
    const urlsToTest = [
      'https://www.fatf-gafi.org/en/the-fatf/news.html',
      'https://www.fatf-gafi.org/content/fatf-gafi/en/the-fatf/news.html',
      'https://www.fatf-gafi.org/api/news', // Try API endpoint
      'https://www.fatf-gafi.org/feed', // Try RSS
      'https://www.fatf-gafi.org/rss',
      'https://www.fatf-gafi.org/en/publications.html'
    ];

    for (const url of urlsToTest) {
      console.log(`\n📡 Testing: ${url}`);
      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });

        const status = response.status();
        console.log(`   Status: ${status}`);

        // Wait longer for Cloudflare
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check page content
        const pageContent = await page.evaluate(() => {
          const isCloudflare = document.body.textContent.includes('Verify you are human') ||
                               document.body.textContent.includes('checking your browser');

          const hasNews = document.querySelectorAll('article, .news-item, .content-item, [class*="news"]').length;
          const hasLinks = document.querySelectorAll('a[href*="/news"], a[href*="/publications"]').length;

          // Try to find any structured data
          const jsonLd = document.querySelector('script[type="application/ld+json"]');

          return {
            isCloudflare,
            hasNews,
            hasLinks,
            title: document.title,
            hasJsonLd: !!jsonLd,
            jsonLdContent: jsonLd ? jsonLd.textContent.slice(0, 500) : null,
            bodyText: document.body.textContent.slice(0, 500)
          };
        });

        console.log('   Results:', JSON.stringify(pageContent, null, 2));

        if (!pageContent.isCloudflare && (pageContent.hasNews > 0 || pageContent.hasLinks > 0)) {
          console.log('   ✅ Potential working URL found!');

          // Try to extract actual content
          const articles = await page.evaluate(() => {
            const items = [];
            const selectors = [
              'article',
              '.news-item',
              '.content-list li',
              '[class*="news"] a',
              '.publication-item',
              'ul.list li'
            ];

            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                elements.forEach(el => {
                  const link = el.querySelector('a') || el;
                  const title = link.textContent?.trim();
                  const href = link.href || link.querySelector('a')?.href;
                  if (title && href) {
                    items.push({ title, href });
                  }
                });
                break;
              }
            }
            return items;
          });

          if (articles.length > 0) {
            console.log(`   📰 Found ${articles.length} articles!`);
            console.log('   Sample:', articles.slice(0, 3));
          }
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

  } finally {
    await browser.close();
  }
}

// Also test with curl to check if API/RSS exists
async function testWithCurl() {
  console.log('\n\n🔧 Testing with curl for API/RSS endpoints...\n');

  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  const endpoints = [
    'https://www.fatf-gafi.org/feed.xml',
    'https://www.fatf-gafi.org/rss.xml',
    'https://www.fatf-gafi.org/en/feed',
    'https://www.fatf-gafi.org/api/news.json'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const { stdout } = await execPromise(`curl -s -I "${endpoint}" | head -5`);
      console.log(stdout);
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
  }
}

async function runAllTests() {
  await testFATFAlternatives();
  await testWithCurl();
}

runAllTests().catch(console.error);