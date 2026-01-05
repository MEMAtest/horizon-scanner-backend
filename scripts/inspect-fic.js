const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function inspect() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto('https://www.fic.gov.za/newsroom/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const structure = await page.evaluate(() => {
    const results = { links: [] };

    // Get all links with their context
    document.querySelectorAll('a').forEach(a => {
      const href = a.href;
      const text = a.textContent?.trim();
      if (href && text && text.length > 20 && href.includes('fic.gov.za')) {
        // Skip hash links and popups
        if (href.includes('#') || href.includes('elementor-action')) return;

        results.links.push({
          text: text.substring(0, 80),
          href: href,
          parent: a.parentElement?.className || 'unknown'
        });
      }
    });

    return results;
  });

  console.log('Links found:', structure.links.length);
  structure.links.slice(0, 15).forEach((l, i) => {
    console.log((i+1) + '.', l.text);
    console.log('   URL:', l.href.substring(0, 80));
  });

  await browser.close();
  process.exit(0);
}
inspect().catch(e => { console.error(e); process.exit(1); });
