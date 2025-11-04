const puppeteer = require('puppeteer');

async function scrapePayUK() {
  console.log('🌐 Scraping Pay.UK Latest Updates...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.wearepay.uk/news-and-insight/latest-updates/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const articles = await page.evaluate(() => {
      const results = [];

      // Get all elements and look for article cards
      const allElements = Array.from(document.querySelectorAll('div, article, section'));

      // Look for containers that have both a date and a heading/link
      for (const el of allElements) {
        const text = el.textContent || '';
        const hasDate = /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/.test(text);

        if (hasDate) {
          const links = el.querySelectorAll('a[href]');
          const headings = el.querySelectorAll('h1, h2, h3, h4, h5');

          if (links.length > 0 && headings.length > 0) {
            const dateMatch = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/);
            const title = headings[0].textContent.trim();

            // Find the main article link (not category pages)
            const link = Array.from(links).find(a => {
              const href = a.href;
              // Look for links that are NOT category pages and contain the article slug
              return (
                !href.includes('/category/') &&
                (href.includes('/latest-updates/') ||
                 href.includes('/insight/') ||
                 href.includes('/media-centre/')) &&
                href !== 'https://www.wearepay.uk/news-and-insight/latest-updates/' &&
                href !== 'https://www.wearepay.uk/news-and-insight/insight/' &&
                href !== 'https://www.wearepay.uk/news-and-insight/media-centre/'
              );
            });

            const isDuplicate = results.find(r => r.title === title);

            if (link && title.length > 10 && !isDuplicate) {
              // Extract category tags if present
              const categoryLinks = Array.from(el.querySelectorAll('a[href*="/category/"]'));
              const categories = categoryLinks
                .map(a => a.textContent.trim())
                .filter(c => c && c.length > 0 && c !== 'Latest Updates');

              results.push({
                title: title,
                url: link.href,
                date: dateMatch ? dateMatch[0] : null,
                categories: categories.length > 0 ? categories : [],
                summary: text.substring(title.length, title.length + 200).trim()
              });
            }
          }
        }
      }

      return results;
    });

    console.log('✅ Found', articles.length, 'articles\n');
    articles.slice(0, 5).forEach((article, i) => {
      console.log(`${i+1}. ${article.title}`);
      console.log(`   Date: ${article.date}`);
      console.log(`   Categories: ${article.categories.join(', ') || 'None'}`);
      console.log(`   URL: ${article.url}`);
      console.log();
    });

    return articles;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

scrapePayUK().then(articles => {
  console.log(`\n📊 Total articles scraped: ${articles.length}`);
});
