const axios = require('axios')
const cheerio = require('cheerio')

function applyNewsMethods(ServiceClass) {
  ServiceClass.prototype.scrapeNewsFeeds = async function(year) {
    const fines = []

    try {
      const rssUrl = `${this.baseUrl}/news/rss`
      const response = await axios.get(rssUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      })

      const $ = cheerio.load(response.data, { xmlMode: true })

      $('item').each((i, item) => {
        const $item = $(item)
        const title = $item.find('title').text()
        const pubDate = new Date($item.find('pubDate').text())
        const link = $item.find('link').text()
        const description = $item.find('description').text()

        if (pubDate.getFullYear() === year && this.isFineRelated(title, description)) {
          fines.push({
            title,
            url: link,
            date: pubDate,
            description,
            source: 'rss'
          })
        }
      })
    } catch (error) {
      console.log(`   ⚠️ RSS feed scraping failed for ${year}: ${error.message}`)
    }

    return { fines }
  }

  ServiceClass.prototype.extractFinesFromPage = async function(page, year) {
    const fines = []

    try {
      await page.waitForSelector('.search-results, .news-list, .content', { timeout: 10000 })

      const articles = await page.evaluate((targetYear) => {
        const results = []

        function isFineRelated(title, description = '') {
          const text = (title + ' ' + description).toLowerCase()
          const fineKeywords = [
            'fine', 'fined', 'penalty', 'penalised', 'penalized',
            'enforcement', 'breach', 'violation', 'sanctions',
            'disciplinary', 'misconduct', 'censure', 'action against'
          ]
          return fineKeywords.some(keyword => text.includes(keyword))
        }

        const selectors = [
          '.search-result',
          '.news-item',
          '.article-item',
          '.content-item',
          'article'
        ]

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector)

          elements.forEach(element => {
            const titleEl = element.querySelector('h2, h3, h4, .title, .headline')
            const linkEl = element.querySelector('a')
            const dateEl = element.querySelector('.date, .published, time')
            const summaryEl = element.querySelector('.summary, .excerpt, p')

            if (titleEl && linkEl) {
              const title = titleEl.textContent.trim()
              const url = linkEl.href
              const dateText = dateEl ? dateEl.textContent.trim() : ''
              const summary = summaryEl ? summaryEl.textContent.trim() : ''

              if (isFineRelated(title, summary)) {
                results.push({
                  title,
                  url,
                  dateText,
                  summary
                })
              }
            }
          })

          if (results.length > 0) break
        }

        return results
      }, year)

      for (const article of articles) {
        try {
          const fine = await this.extractFineDetails(page, article, year)
          if (fine) {
            fines.push(fine)
          }
        } catch (error) {
          console.error('   ⚠️ Error extracting fine details:', error.message)
        }
      }
    } catch (error) {
      console.error('   ⚠️ Error extracting fines from page:', error.message)
    }

    return fines
  }

  ServiceClass.prototype.extractFineDetails = async function(page, article, year) {
    try {
      await page.goto(article.url, { waitUntil: 'networkidle0' })
      await this.delay(1000)

      const details = await page.evaluate(() => {
        const content = document.querySelector('.content, .article-content, main, .news-content')
        if (!content) return null

        const text = content.textContent || ''

        const amountRegex = /(?:fine|penalty|paid?)\s*(?:of)?\s*£([\d,]+(?:\.\d{2})?)\s*(?:million|m)?/gi
        const amounts = []
        let match

        while ((match = amountRegex.exec(text)) !== null) {
          amounts.push(match[1])
        }

        const firmRegex = /(?:firm|company|individual|person)\s+([A-Z][A-Za-z\s&.,-]+?)(?:\s+(?:has|was|is|will|must))/gi
        const firmMatch = firmRegex.exec(text)
        const firmName = firmMatch ? firmMatch[1].trim() : null

        const dateRegex = /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
        const dateMatch = dateRegex.exec(text)

        return {
          fullText: text,
          amounts,
          firmName,
          dateText: dateMatch ? dateMatch[1] : null
        }
      })

      if (!details || details.amounts.length === 0) {
        return null
      }

      const amount = this.parseAmount(details.amounts[0])
      const date = this.parseDate(details.dateText, year)
      const breachType = this.extractBreachType(details.fullText)
      const firmCategory = this.categorizeFirm(details.firmName, details.fullText)

      return {
        fine_reference: this.generateFineReference(details.firmName, date, amount),
        date_issued: date,
        firm_individual: details.firmName || 'Unknown',
        amount,
        amount_text: details.amounts[0],
        summary: this.extractSummary(details.fullText),
        breach_type: breachType,
        firm_category: firmCategory,
        final_notice_url: article.url,
        press_release_url: article.url,
        year_issued: date.getFullYear(),
        month_issued: date.getMonth() + 1,
        quarter_issued: Math.ceil((date.getMonth() + 1) / 3),
        scraped_content: details.fullText,
        source_url: article.url,
        processing_status: 'pending'
      }
    } catch (error) {
      console.error(`Error extracting fine details from ${article.url}:`, error.message)
      return null
    }
  }
}

module.exports = applyNewsMethods
