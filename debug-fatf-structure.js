// Debug FATF page structure to find the right selectors
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function debugFATFStructure() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Debug News Page
    console.log('🔍 Debugging FATF News Page Structure\n');
    await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 8000));

    const newsStructure = await page.evaluate(() => {
      // Find all potential article containers
      const containers = [];

      // Check for various container patterns
      const containerSelectors = [
        '.cmp-contentfragmentlist',
        '.cmp-teaser',
        '.cmp-list',
        '.content-list',
        '.news-list',
        '[data-cmp-is]',
        '.aem-Grid',
        '.container'
      ];

      containerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          containers.push({
            selector,
            count: elements.length,
            sample: elements[0].outerHTML.slice(0, 500)
          });
        }
      });

      // Look for all links with FATF content
      const newsLinks = [];
      document.querySelectorAll('a').forEach(link => {
        const href = link.href;
        const text = link.textContent?.trim();

        if (href && text && text.length > 30 &&
            (href.includes('/news/') || href.includes('/the-fatf/') || href.includes('/fatf-')) &&
            !href.includes('.pdf')) {
          newsLinks.push({
            text: text.slice(0, 100),
            href: href,
            parent: link.parentElement?.className || 'no-class'
          });
        }
      });

      return {
        containers,
        newsLinks: newsLinks.slice(0, 10),
        totalLinks: document.querySelectorAll('a').length
      };
    });

    console.log('News Page Containers:', JSON.stringify(newsStructure.containers, null, 2));
    console.log('\nNews Links Found:', newsStructure.newsLinks.length);
    newsStructure.newsLinks.forEach(link => {
      console.log(`\n- ${link.text}`);
      console.log(`  URL: ${link.href}`);
      console.log(`  Parent: ${link.parent}`);
    });

    // Debug Publications Page
    console.log('\n\n🔍 Debugging FATF Publications Page Structure\n');
    await page.goto('https://www.fatf-gafi.org/en/publications.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 8000));

    const pubStructure = await page.evaluate(() => {
      const pubLinks = [];

      // Look for publication links
      document.querySelectorAll('a').forEach(link => {
        const href = link.href;
        const text = link.textContent?.trim();

        if (href && text && text.length > 20 &&
            href.includes('/publications/') &&
            !href.includes('.pdf') &&
            !text.includes('Read more')) {
          // Get more context from parent
          const parent = link.closest('div, article, section, li');
          let date = '';
          let description = '';

          if (parent) {
            // Look for date
            const dateEl = parent.querySelector('time, .date, [class*="date"], span[class*="date"]');
            date = dateEl?.textContent?.trim() || '';

            // Look for description
            const descEl = parent.querySelector('p, .description, [class*="description"]');
            description = descEl?.textContent?.trim()?.slice(0, 100) || '';
          }

          pubLinks.push({
            text: text.slice(0, 100),
            href: href,
            date: date,
            description: description,
            parentTag: parent?.tagName || 'no-parent',
            parentClass: parent?.className || 'no-class'
          });
        }
      });

      // Check for specific FATF components
      const components = {
        teasers: document.querySelectorAll('.cmp-teaser').length,
        contentFragments: document.querySelectorAll('.cmp-contentfragmentlist__item').length,
        lists: document.querySelectorAll('.cmp-list__item').length,
        searchResults: document.querySelectorAll('.search-result').length
      };

      return {
        pubLinks: pubLinks.slice(0, 10),
        components
      };
    });

    console.log('Publications Components:', pubStructure.components);
    console.log('\nPublication Links Found:');
    pubStructure.pubLinks.forEach(link => {
      console.log(`\n- ${link.text}`);
      console.log(`  URL: ${link.href}`);
      console.log(`  Date: ${link.date}`);
      console.log(`  Desc: ${link.description}`);
      console.log(`  Parent: ${link.parentTag}.${link.parentClass}`);
    });

  } finally {
    await browser.close();
  }
}

debugFATFStructure().catch(console.error);