const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Financial Ombudsman Service (FOS) ───────── */
async function scrapeFOS() {
  const listingUrl = 'https://www.financial-ombudsman.org.uk/news'
  const base = 'https://www.financial-ombudsman.org.uk'

  try {
    const $ = await fetchHtml(listingUrl)
    const enriched = []

    $('.card.card-grey').each((_, el) => {
      const $el = $(el)
      const title = cleanText($el.find('.card-title').first().text())
      if (!title) return

      let href = $el.find('a.lnk').attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const summary = cleanText($el.find('.card-desc > p').not('.card-date').first().text()) || `FOS update: ${title}`
      const dateText = cleanText($el.find('.card-date').text())
      const date = parseDate(dateText)

      const tags = $el.find('.card-tags .tag').map((_, tag) => cleanText($(tag).text())).get().filter(Boolean)
      enriched.push({ title, href, date, summary, tags })
    })

    const build = (windowDays) => enriched
      .filter(entry => isRecent(entry.date, windowDays))
      .map(entry => ({
        title: entry.title,
        link: entry.href,
        pubDate: entry.date ? entry.date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('FOS'),
        summary: entry.summary,
        tags: entry.tags?.length ? entry.tags : undefined
      }))

    let results = build(31)
    if (results.length < 3) {
      results = build(90)
    }

    return results.slice(0, 6)
  } catch (error) {
    console.error('FOS error:', error.message)
    return []
  }
}

module.exports = { scrapeFOS }
