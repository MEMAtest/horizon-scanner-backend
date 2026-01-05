const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function inspectFIC() {
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

  console.log('Navigating to FIC newsroom page...');
  await page.goto('https://www.fic.gov.za/newsroom/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  const analysis = await page.evaluate((baseUrl) => {
    const items = [];
    const seen = new Set();

    // FIC uses WordPress-style structure
    const articles = document.querySelectorAll('article, .post, .news-item, .entry, .card');

    articles.forEach(article => {
      const linkEl = article.querySelector('a[href*="fic.gov.za"], h2 a, h3 a, .entry-title a, .card-title a');
      if (!linkEl) return;

      let href = linkEl.href || linkEl.getAttribute('href');
      if (!href || seen.has(href)) return;

      if (href.startsWith('/')) {
        href = baseUrl + href;
      }

      if (href.includes('#') || href.includes('javascript:')) return;

      const title = linkEl.textContent?.trim();
      if (!title || title.length < 10) return;

      seen.add(href);
      items.push({
        title: title.replace(/\s+/g, ' ').trim(),
        url: href,
        isHashLink: href.includes('#'),
        parentClass: article.className
      });
    });

    // Also check what types of articles exist
    const articleInfo = {
      totalArticles: articles.length,
      articleClasses: Array.from(articles).slice(0, 5).map(a => a.className)
    };

    return { items, articleInfo };
  }, 'https://www.fic.gov.za');

  console.log('\n=== FIC NEWSROOM ANALYSIS ===\n');
  console.log('Total articles found:', analysis.articleInfo.totalArticles);
  console.log('Article classes:', analysis.articleInfo.articleClasses);
  console.log('\nExtracted items:', analysis.items.length);
  console.log('\nFirst 10 items:');
  analysis.items.slice(0, 10).forEach((item, idx) => {
    console.log(`\n${idx + 1}. ${item.title}`);
    console.log(`   URL: ${item.url}`);
    console.log(`   Has #: ${item.isHashLink}`);
    console.log(`   Parent: ${item.parentClass}`);
  });

  await browser.close();
}

inspectFIC().catch(console.error);
