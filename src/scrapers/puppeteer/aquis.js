function applyAquisMethods(ServiceClass) {
  ServiceClass.prototype.scrapeAquis = async function scrapeAquis() {
    console.log('\n📊 AQUIS: Starting scraping...')
    const results = []

    try {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })

      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      const monthsToScrape = [
        { year, month },
        { year: month === 1 ? year - 1 : year, month: month === 1 ? 12 : month - 1 }
      ]

      for (const { year: y, month: m } of monthsToScrape) {
        console.log(`📅 AQUIS: Scraping ${y}-${String(m).padStart(2, '0')}`)
        const monthItems = await this.scrapeAquisMonth(page, y, m)
        results.push(...monthItems)
        await this.wait(2000)
      }

      await page.close()

      console.log(`\n🎉 AQUIS: Total items collected: ${results.length}`)
      return results
    } catch (error) {
      console.error('❌ AQUIS scraping failed:', error.message)
      return results
    }
  }

  ServiceClass.prototype.scrapeAquisMonth = async function scrapeAquisMonth(page, year, month) {
    const items = []

    try {
      const url = `https://www.aquis.eu/stock-exchange/announcements?year=${year}&month=${month}`
      console.log(`🌐 AQUIS: Loading ${url}`)

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })

      await this.wait(3000)

      const announcements = await page.evaluate(() => {
        const items = []
        const rows = document.querySelectorAll('table tbody tr')

        rows.forEach((row) => {
          try {
            const cells = row.querySelectorAll('td')
            if (cells.length >= 2) {
              const dateTime = cells[0]?.textContent?.trim()
              const titleEl = cells[1]?.querySelector('a') || cells[1]
              const title = titleEl?.textContent?.trim()
              const link = cells[1]?.querySelector('a')?.href || row.querySelector('a')?.href

              if (title && dateTime && link) {
                items.push({ dateTime, title, viewLink: link })
              }
            }
          } catch (error) {
            console.log('Error extracting row:', error.message)
          }
        })

        return items
      })

      console.log(`📋 AQUIS: Found ${announcements.length} announcements`)

      for (const announcement of announcements.slice(0, 20)) {
        try {
          if (!announcement.viewLink) continue

          await page.goto(announcement.viewLink, {
            waitUntil: 'networkidle2',
            timeout: 30000
          })

          await this.wait(2000)

          const detailContent = await page.evaluate(() => {
            const content = document.querySelector('.announcement-content, .content, main')
            return content ? content.textContent.trim() : null
          })

          const companyMatch = announcement.title.match(/^([^-]+)\s*-\s*(.+)$/)
          const company = companyMatch ? companyMatch[1].trim() : 'Unknown'
          const announcementType = companyMatch ? companyMatch[2].trim() : announcement.title

          let summary = announcementType
          if (detailContent && detailContent.length > 50) {
            const cleanedContent = detailContent.replace(/\s+/g, ' ').trim()
            summary = cleanedContent.slice(0, 250)
            const lastPeriod = summary.lastIndexOf('.')
            const lastQuestion = summary.lastIndexOf('?')
            const lastExclamation = summary.lastIndexOf('!')
            const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
            if (lastSentenceEnd > 100) {
              summary = summary.slice(0, lastSentenceEnd + 1)
            } else {
              summary = summary + '...'
            }
          }

          items.push({
            headline: announcement.title,
            url: announcement.viewLink,
            authority: 'AQUIS',
            area: 'Market Announcements',
            source_category: 'market_news',
            source_description: `Aquis Exchange - ${company}`,
            fetched_date: new Date().toISOString(),
            raw_data: {
              sourceType: 'puppeteer',
              sourceKey: 'AQUIS',
              country: 'UK',
              priority: 'MEDIUM',
              originalDate: announcement.dateTime,
              company,
              announcementType,
              summary,
              fullContent: detailContent,
              market: {
                isMarketNews: true,
                exchange: 'Aquis',
                company
              }
            }
          })

          await this.wait(1500)
        } catch (error) {
          console.log(`⚠️ Failed to scrape announcement: ${announcement.title}`)
        }
      }
    } catch (error) {
      console.error(`❌ AQUIS month scraping failed for ${year}-${month}:`, error.message)
    }

    return items
  }
}

module.exports = applyAquisMethods
