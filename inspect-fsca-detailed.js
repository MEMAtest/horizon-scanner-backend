const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function inspectFSCA() {
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

  console.log('\n=== ANALYZING PAGE STRUCTURE ===\n');

  // Check for collapsible sections
  const structure = await page.evaluate(() => {
    const result = {
      yearButtons: [],
      expandableContent: [],
      mediaReleases: []
    };

    // Look for year buttons or headers
    const buttons = document.querySelectorAll('button, .year, .accordion, [role="button"]');
    buttons.forEach(btn => {
      const text = btn.textContent?.trim();
      if (text && (text.match(/20\d{2}/) || text.includes('Media Release'))) {
        result.yearButtons.push({
          text: text.substring(0, 50),
          className: btn.className,
          tagName: btn.tagName
        });
      }
    });

    // Look for any hidden/collapsed content
    const collapsibles = document.querySelectorAll('[class*="collapse"], [class*="hidden"], [class*="accordion"]');
    result.expandableContent.push(`Found ${collapsibles.length} collapsible elements`);

    // Look for actual media release links
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
      const href = link.href;
      const text = link.textContent?.trim();

      if (href && text && text.length > 30 && !href.includes('#') &&
          (href.includes('Press-Release') || href.includes('Media-Release') || href.includes('/News/'))) {
        result.mediaReleases.push({
          text: text.substring(0, 100),
          href: href,
          parent: link.closest('div, article, section, li')?.className || 'unknown'
        });
      }
    });

    return result;
  });

  console.log('Year/Section Buttons found:', structure.yearButtons.length);
  if (structure.yearButtons.length > 0) {
    console.log('Examples:');
    structure.yearButtons.slice(0, 5).forEach((btn, idx) => {
      console.log(`  ${idx + 1}. ${btn.text} (${btn.tagName}, class: ${btn.className})`);
    });
  }

  console.log('\n' + structure.expandableContent[0]);

  console.log('\nMedia Release links found:', structure.mediaReleases.length);
  if (structure.mediaReleases.length > 0) {
    console.log('First 5 examples:');
    structure.mediaReleases.slice(0, 5).forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.text}`);
      console.log(`     URL: ${link.href}`);
      console.log(`     Parent: ${link.parent}`);
    });
  }

  // Try clicking year sections to expand
  console.log('\n\n=== TRYING TO EXPAND SECTIONS ===\n');

  try {
    // Look for 2025 button/section
    const expanded = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, .year, [role="button"], .accordion-header'));
      const year2025 = buttons.find(btn => btn.textContent?.includes('2025'));

      if (year2025) {
        year2025.click();
        return true;
      }
      return false;
    });

    if (expanded) {
      console.log('Clicked 2025 section, waiting for content...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Re-check for media releases
      const afterExpand = await page.evaluate(() => {
        const releases = [];
        const allLinks = document.querySelectorAll('a');

        allLinks.forEach(link => {
          const href = link.href;
          const text = link.textContent?.trim();

          if (href && text && text.length > 30 && !href.includes('#') &&
              (href.includes('Press-Release') || href.includes('Media-Release') || href.includes('/News/'))) {
            releases.push({
              text: text.substring(0, 100),
              href: href
            });
          }
        });

        return releases;
      });

      console.log('Media releases after expanding:', afterExpand.length);
      if (afterExpand.length > 0) {
        console.log('First 5:');
        afterExpand.slice(0, 5).forEach((link, idx) => {
          console.log(`  ${idx + 1}. ${link.text}`);
          console.log(`     ${link.href}`);
        });
      }
    } else {
      console.log('Could not find 2025 section button');
    }
  } catch (error) {
    console.error('Error expanding sections:', error.message);
  }

  await browser.close();
  console.log('\nInspection complete.');
}

inspectFSCA().catch(console.error);
