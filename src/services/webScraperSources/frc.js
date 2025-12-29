const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Financial Reporting Council (FRC) ───────── */
async function scrapeFRC() {
  const listingUrl = 'https://www.frc.org.uk/news-and-events/news/'
  const base = 'https://www.frc.org.uk'

  try {
    const $ = await fetchHtml(listingUrl)
    const out = []

    $('.search__results-item').each((_, el) => {
      const $el = $(el)
      const anchor = $el.find('.search__results-item-title').first()
      const title = cleanText(anchor.text())
      if (!title) return

      let href = anchor.attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const summary = cleanText($el.find('.search__results-item-description').text()) || `FRC: ${title}`
      const dateText = cleanText($el.find('.search__results-item-metadata').text())
      const date = parseDate(dateText)

      if (!isRecent(date)) return

      out.push({
        title,
        link: href,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('FRC'),
        summary
      })
    })

    return out
  } catch (error) {
    console.error('FRC error:', error.message)
    return []
  }
}

module.exports = { scrapeFRC }
