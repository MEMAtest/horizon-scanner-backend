// Debug LSE specifically
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

async function debugLSE() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    console.log('Loading LSE...')
    await page.goto('https://www.londonstockexchange.com/discover/news-and-insights?tab=latest', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    console.log('Waiting for content...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    console.log('Extracting all links...')
    const debug = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a'))

      return {
        totalLinks: allLinks.length,
        newsLinks: allLinks.filter(a => a.href.includes('/news')).map(a => ({
          text: a.textContent.trim().slice(0, 100),
          href: a.href
        })).slice(0, 20),
        insightsLinks: allLinks.filter(a => a.href.includes('/insights')).map(a => ({
          text: a.textContent.trim().slice(0, 100),
          href: a.href
        })).slice(0, 20),
        articleLinks: allLinks.filter(a => a.href.includes('/article')).map(a => ({
          text: a.textContent.trim().slice(0, 100),
          href: a.href
        })).slice(0, 20),
        // Check if there's a specific news container
        mainContent: document.querySelector('main')?.innerHTML.slice(0, 2000) || 'No main found',
        // Look for date elements
        dateElements: document.querySelectorAll('time, [class*="date"]').length,
        // Sample date element
        sampleDate: document.querySelector('time, [class*="date"]')?.outerHTML || 'No date element'
      }
    })

    console.log(JSON.stringify(debug, null, 2))

  } catch (error) {
    console.error('LSE debug failed:', error.message)
  } finally {
    await browser.close()
  }
}

debugLSE()
