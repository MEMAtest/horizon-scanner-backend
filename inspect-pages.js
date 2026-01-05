const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function inspectPages() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Test FSCA
  console.log('\n=== INSPECTING FSCA ===');
  try {
    await page.goto('https://www.fsca.co.za/Latest-News/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot
    await page.screenshot({ path: '/tmp/fsca-page.png', fullPage: true });
    console.log('Screenshot saved: /tmp/fsca-page.png');

    // Get page structure
    const structure = await page.evaluate(() => {
      const result = {
        title: document.title,
        url: window.location.href,
        allLinks: [],
        allArticles: []
      };

      // Get all links with text length > 20
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        const text = link.textContent?.trim();
        if (text && text.length > 20) {
          result.allLinks.push({
            text: text.substring(0, 100),
            href: link.href,
            className: link.className
          });
        }
      });

      // Get all article/news-like elements
      const articles = document.querySelectorAll('article, .news, .media, .press, [class*="news"], [class*="media"], [class*="press"]');
      result.allArticles.push(`Found ${articles.length} article-like elements`);

      return result;
    });

    console.log('Page Title:', structure.title);
    console.log('Number of potential links:', structure.allLinks.length);
    console.log('First 5 links:');
    structure.allLinks.slice(0, 5).forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.text}`);
      console.log(`     ${link.href}`);
    });
    console.log('Article structures:', structure.allArticles);

  } catch (error) {
    console.error('FSCA Error:', error.message);
  }

  // Test CNBV
  console.log('\n\n=== INSPECTING CNBV ===');
  try {
    await page.goto('https://www.gob.mx/cnbv/prensa', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Take screenshot
    await page.screenshot({ path: '/tmp/cnbv-page.png', fullPage: true });
    console.log('Screenshot saved: /tmp/cnbv-page.png');

    // Get page structure
    const structure = await page.evaluate(() => {
      const result = {
        title: document.title,
        url: window.location.href,
        allLinks: [],
        allArticles: []
      };

      // Get all links with text length > 20
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        const text = link.textContent?.trim();
        if (text && text.length > 20) {
          result.allLinks.push({
            text: text.substring(0, 100),
            href: link.href,
            className: link.className
          });
        }
      });

      // Get all article/news-like elements
      const articles = document.querySelectorAll('article, .article, .news, .prensa, [class*="article"], [class*="news"], [class*="prensa"]');
      result.allArticles.push(`Found ${articles.length} article-like elements`);

      return result;
    });

    console.log('Page Title:', structure.title);
    console.log('Number of potential links:', structure.allLinks.length);
    console.log('First 5 links:');
    structure.allLinks.slice(0, 5).forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.text}`);
      console.log(`     ${link.href}`);
    });
    console.log('Article structures:', structure.allArticles);

  } catch (error) {
    console.error('CNBV Error:', error.message);
  }

  await browser.close();
  console.log('\n\nInspection complete. Check screenshots at /tmp/');
}

inspectPages().catch(console.error);
