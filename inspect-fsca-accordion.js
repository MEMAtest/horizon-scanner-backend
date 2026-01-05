const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function inspectFSCAAccordion() {
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

  console.log('Navigating to FSCA Latest News page...');
  await page.goto('https://www.fsca.co.za/Latest-News/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Click 2025 accordion
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button.accordion-button'));
    const year2025 = buttons.find(btn => btn.textContent?.includes('2025'));
    if (year2025) {
      year2025.click();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get HTML of expanded section
  const expandedContent = await page.evaluate(() => {
    const accordion = document.querySelector('.accordion-collapse.show, .collapse.show');
    if (accordion) {
      return {
        html: accordion.innerHTML.substring(0, 5000),
        allLinks: Array.from(accordion.querySelectorAll('a')).map(a => ({
          text: a.textContent?.trim().substring(0, 100),
          href: a.href,
          className: a.className
        }))
      };
    }
    return { html: 'No expanded content found', allLinks: [] };
  });

  console.log('\n=== EXPANDED ACCORDION CONTENT ===\n');
  console.log('HTML Sample:');
  console.log(expandedContent.html);

  console.log('\n\n=== ALL LINKS IN EXPANDED SECTION ===\n');
  console.log(`Found ${expandedContent.allLinks.length} links`);

  if (expandedContent.allLinks.length > 0) {
    console.log('\nFirst 10 links:');
    expandedContent.allLinks.slice(0, 10).forEach((link, idx) => {
      console.log(`\n${idx + 1}. ${link.text}`);
      console.log(`   URL: ${link.href}`);
      console.log(`   Class: ${link.className}`);
    });
  }

  await browser.close();
}

inspectFSCAAccordion().catch(console.error);
