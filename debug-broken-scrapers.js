/**
 * Debug broken scrapers - find correct selectors
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

async function debugPage(name, url) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Debugging: ${name}`)
  console.log(`URL: ${url}`)
  console.log('='.repeat(60))

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 5000))

    // Scroll to load content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await new Promise(r => setTimeout(r, 2000))

    const debug = await page.evaluate(() => {
      const info = {
        title: document.title,
        links: [],
        potentialContainers: [],
        allH2H3: []
      }

      // Find all links with substantial text
      document.querySelectorAll('a').forEach(a => {
        const text = a.textContent?.trim()
        const href = a.href
        if (text && text.length > 30 && text.length < 200 && href && !href.includes('#')) {
          const parent = a.parentElement
          info.links.push({
            text: text.substring(0, 80),
            href: href.substring(0, 100),
            parentTag: parent?.tagName,
            parentClass: parent?.className?.substring(0, 50) || 'no-class'
          })
        }
      })

      // Find potential news containers
      const containerSelectors = [
        'article', '.news-item', '.press-release', '.media-item',
        '.card', '.list-item', '[class*="news"]', '[class*="press"]',
        '[class*="article"]', '[class*="item"]', 'li'
      ]

      for (const sel of containerSelectors) {
        const els = document.querySelectorAll(sel)
        if (els.length > 0 && els.length < 100) {
          info.potentialContainers.push({
            selector: sel,
            count: els.length,
            firstClass: els[0].className?.substring(0, 50) || 'no-class',
            hasLinks: els[0].querySelector('a') !== null
          })
        }
      }

      // Find all h2/h3 with links
      document.querySelectorAll('h2 a, h3 a, h4 a').forEach(a => {
        const text = a.textContent?.trim()
        if (text && text.length > 15) {
          info.allH2H3.push({
            text: text.substring(0, 80),
            href: a.href?.substring(0, 80)
          })
        }
      })

      return info
    })

    console.log('\nPage title:', debug.title)

    console.log(`\nLinks with substantial text (${debug.links.length}):`)
    debug.links.slice(0, 8).forEach(l => {
      console.log(`  - "${l.text}"`)
      console.log(`    Parent: <${l.parentTag}> class="${l.parentClass}"`)
    })

    console.log(`\nPotential containers:`)
    debug.potentialContainers.forEach(c => {
      console.log(`  - ${c.selector}: ${c.count} (hasLinks: ${c.hasLinks}, class: ${c.firstClass})`)
    })

    console.log(`\nH2/H3 links (${debug.allH2H3.length}):`)
    debug.allH2H3.slice(0, 5).forEach(h => {
      console.log(`  - "${h.text}"`)
    })

  } finally {
    await browser.close()
  }
}

async function main() {
  // Debug broken scrapers
  await debugPage('TPR', 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases')
  await debugPage('ICO', 'https://ico.org.uk/about-the-ico/news-and-events/news-and-blogs/')
  await debugPage('LSE', 'https://www.londonstockexchange.com/discover/news-and-insights')
  await debugPage('JMLSG', 'https://www.jmlsg.org.uk/')
}

main().catch(console.error)
