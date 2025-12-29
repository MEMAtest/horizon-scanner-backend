const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── SRA Press Releases ───────── */
async function scrapeSRA() {
  const results = []
  const base = 'https://www.sra.org.uk'

  try {
    // SRA main news page
    const url = 'https://www.sra.org.uk/sra/news'
    console.log(`   SRA: Fetching news page...`)

    const $ = await fetchHtml(url)

    // Look for news items in various possible structures
    // SRA typically uses list items or article-like containers
    const selectors = [
      '.news-item',
      '.news-listing li',
      'article',
      '.content-item',
      'ul li',
      '.list-item'
    ]

    let newsElements = []

    // First try specific selectors
    for (const sel of selectors) {
      const elements = $(sel).filter((i, el) => {
        const $el = $(el)
        return $el.find('a[href*="/news/"]').length > 0 ||
               $el.find('a[href*="/sra/news/"]').length > 0
      })
      if (elements.length > 0) {
        newsElements = elements.toArray()
        break
      }
    }

    // Fallback: find all links to news articles
    if (newsElements.length === 0) {
      $('a[href]').each((i, el) => {
        const href = $(el).attr('href') || ''
        if ((href.includes('/news/') || href.includes('/sra/news/')) &&
            !href.endsWith('/news') && !href.endsWith('/news/')) {
          newsElements.push(el)
        }
      })
    }

    // Process found elements
    const seen = new Set()

    newsElements.forEach((el, i) => {
      const $el = $(el)

      // Find the anchor element
      const anchor = $el.is('a') ? $el : $el.find('a').first()
      if (!anchor.length) return

      let href = anchor.attr('href') || ''
      if (!href) return
      if (!href.startsWith('http')) {
        href = `${base}${href}`
      }

      // Skip duplicates
      if (seen.has(href)) return
      seen.add(href)

      // Get title
      let title = cleanText(anchor.text())
      if (!title) {
        title = cleanText($el.find('h2, h3, h4').first().text())
      }
      if (!title || title.length < 15) return

      // Find date in surrounding text or parent
      let dateText = ''
      const fullText = $el.text() + ' ' + $el.parent().text()
      const dateMatch = fullText.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i)
      if (dateMatch) {
        dateText = dateMatch[1]
      }

      const date = parseDate(dateText)

      // Find summary/description
      let summary = ''
      const descEl = $el.next('p, .description, .summary')
      if (descEl.length) {
        summary = cleanText(descEl.text())
      }
      if (!summary) {
        summary = `SRA: ${title}`
      }

      if (isRecent(date, 90) || !date) {
        results.push({
          title,
          link: href,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: 'SRA',
          summary
        })
      }
    })

    console.log(`✅ SRA: Found ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('SRA error:', error.message)
    return []
  }
}

module.exports = { scrapeSRA }
