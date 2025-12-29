const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Gambling Commission ───────── */
async function scrapeGamblingCommission() {
  const listingUrl = 'https://www.gamblingcommission.gov.uk/news/latest'
  const base = 'https://www.gamblingcommission.gov.uk'

  try {
    const $ = await fetchHtml(listingUrl)
    const out = []

    // Try multiple selectors for news items
    const selectors = [
      '.gc-news-listing__item',
      '.news-item',
      'article',
      '.card',
      'li[class*="news"]',
      '.gc-listing__item'
    ]

    let foundSelector = null
    for (const sel of selectors) {
      if ($(sel).length > 0) {
        foundSelector = sel
        break
      }
    }

    if (!foundSelector) {
      // Fallback: try to find any links with news patterns
      $('a[href*="/news/article/"]').each((i, el) => {
        if (i >= 20) return false
        const $el = $(el)
        const title = cleanText($el.text())
        if (!title || title.length < 15) return

        let href = $el.attr('href') || ''
        if (href && !href.startsWith('http')) {
          href = `${base}${href}`
        }

        // Try to find date in parent
        const parent = $el.closest('div, article, section, li')
        let dateText = ''
        if (parent.length) {
          dateText = cleanText(parent.find('time, .date, [class*="date"]').text())
          if (!dateText) {
            // Try to extract date from text
            const textMatch = parent.text().match(/(\d{1,2}\s+\w+\s+\d{4})/i)
            if (textMatch) dateText = textMatch[1]
          }
        }

        const date = parseDate(dateText)

        out.push({
          title,
          link: href,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: 'GAMBLING_COMMISSION',
          summary: `Gambling Commission: ${title}`
        })
      })
    } else {
      $(foundSelector).each((i, el) => {
        if (i >= 20) return false
        const $el = $(el)

        // Find title and link
        const anchor = $el.find('a').first()
        const title = cleanText(anchor.text()) || cleanText($el.find('h2, h3, h4, .title').text())
        if (!title || title.length < 15) return

        let href = anchor.attr('href') || ''
        if (href && !href.startsWith('http')) {
          href = `${base}${href}`
        }

        // Find date
        let dateText = cleanText($el.find('time, .date, [class*="date"]').text())
        if (!dateText) {
          const textMatch = $el.text().match(/(\d{1,2}\s+\w+\s+\d{4})/i)
          if (textMatch) dateText = textMatch[1]
        }
        const date = parseDate(dateText)

        // Find summary
        const summary = cleanText($el.find('p, .summary, .description').text()) || `Gambling Commission: ${title}`

        if (href) {
          out.push({
            title,
            link: href,
            pubDate: date ? date.toISOString() : new Date().toISOString(),
            authority: 'GAMBLING_COMMISSION',
            summary
          })
        }
      })
    }

    // Filter by recency
    const recent = out.filter(item => {
      const date = parseDate(item.pubDate)
      return isRecent(date, 60)
    })

    console.log(`✅ Gambling Commission: Found ${recent.length} items`)
    return recent.slice(0, 15)
  } catch (error) {
    console.error('Gambling Commission error:', error.message)
    return []
  }
}

module.exports = { scrapeGamblingCommission }
