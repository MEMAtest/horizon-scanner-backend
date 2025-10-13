// Debug script to identify scraper selector issues
// Run with: node debug-scrapers.js

const puppeteer = require('puppeteer')

async function debugFATF() {
  console.log('\n🔍 DEBUGGING FATF...\n')

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('https://www.fatf-gafi.org/en/the-fatf/news.html', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 5000))

    // Check what elements exist
    const debug = await page.evaluate(() => {
      return {
        articles: document.querySelectorAll('article').length,
        newsItems: document.querySelectorAll('.news-item').length,
        contentList: document.querySelectorAll('.content-list').length,
        newsCards: document.querySelectorAll('.news-card').length,
        allLinks: document.querySelectorAll('a').length,
        h2Elements: document.querySelectorAll('h2').length,
        h3Elements: document.querySelectorAll('h3').length,
        bodyClasses: document.body.className,
        sampleHTML: document.body.innerHTML.slice(0, 1000)
      }
    })

    console.log('FATF Page Structure:')
    console.log(JSON.stringify(debug, null, 2))
  } catch (error) {
    console.error('FATF debug failed:', error.message)
  } finally {
    await browser.close()
  }
}

async function debugAquis() {
  console.log('\n🔍 DEBUGGING AQUIS...\n')

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    const url = 'https://www.aquis.eu/stock-exchange/announcements?year=2025&month=10'
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 3000))

    const debug = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr')
      const firstRow = rows[0]

      const results = {
        totalRows: rows.length,
        firstRowCells: firstRow ? firstRow.querySelectorAll('td').length : 0,
        sampleRowHTML: firstRow ? firstRow.innerHTML.slice(0, 500) : 'No rows found',
        viewLinks: document.querySelectorAll('a[href*="view"]').length,
        tables: document.querySelectorAll('table').length
      }

      // Get first link
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td')
        results.firstRowData = {
          cell0: cells[0]?.textContent?.trim(),
          cell1: cells[1]?.textContent?.trim(),
          cell2: cells[2]?.textContent?.trim(),
          viewLink: firstRow.querySelector('a[href*="view"]')?.href || 'No view link'
        }
      }

      return results
    })

    console.log('Aquis Page Structure:')
    console.log(JSON.stringify(debug, null, 2))

    // Try to navigate to first detail page
    const firstLink = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr')
      return firstRow?.querySelector('a[href*="view"]')?.href
    })

    if (firstLink) {
      console.log('\n📄 Testing detail page navigation to:', firstLink)
      await page.goto(firstLink, { waitUntil: 'networkidle2', timeout: 30000 })

      const detailDebug = await page.evaluate(() => {
        return {
          contentSelectors: {
            '.announcement-content': document.querySelector('.announcement-content') ? 'FOUND' : 'NOT FOUND',
            '.content': document.querySelector('.content') ? 'FOUND' : 'NOT FOUND',
            'main': document.querySelector('main') ? 'FOUND' : 'NOT FOUND',
            'body text length': document.body.textContent.length
          },
          sampleContent: document.body.textContent.slice(0, 500)
        }
      })

      console.log('Aquis Detail Page:')
      console.log(JSON.stringify(detailDebug, null, 2))
    }

  } catch (error) {
    console.error('Aquis debug failed:', error.message)
  } finally {
    await browser.close()
  }
}

async function debugLSE() {
  console.log('\n🔍 DEBUGGING LSE...\n')

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    await page.goto('https://www.londonstockexchange.com/discover/news-and-insights?tab=latest', {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await new Promise(resolve => setTimeout(resolve, 5000))

    const debug = await page.evaluate(() => {
      return {
        articles: document.querySelectorAll('article').length,
        newsItems: document.querySelectorAll('.news-item').length,
        newsCards: document.querySelectorAll('.news-card').length,
        contentItems: document.querySelectorAll('.content-item').length,
        allLinks: document.querySelectorAll('a').length,
        h2Links: document.querySelectorAll('h2 a').length,
        h3Links: document.querySelectorAll('h3 a').length,
        bodyClasses: document.body.className,
        sampleHTML: document.body.innerHTML.slice(0, 1000)
      }
    })

    console.log('LSE Page Structure:')
    console.log(JSON.stringify(debug, null, 2))
  } catch (error) {
    console.error('LSE debug failed:', error.message)
  } finally {
    await browser.close()
  }
}

async function runAllDebug() {
  await debugFATF()
  await debugAquis()
  await debugLSE()

  console.log('\n✅ Debug complete!')
}

runAllDebug().catch(console.error)
