const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── FCA (with RSS and HTML fallback) ───────── */
async function scrapeFCA() {
  // Try RSS first
  const FEED = 'https://www.fca.org.uk/news/rss.xml'
  try {
    const feed = await rss.parseURL(FEED)
    const recent = feed.items.filter(i => isRecent(parseDate(i.pubDate)))

    if (recent.length) {
      return recent.map(i => ({
        title: i.title,
        link: i.link,
        pubDate: i.pubDate,
        authority: normalizeAuthority('FCA'),
        summary: i.contentSnippet || i.content || `FCA: ${i.title}`
      }))
    }
  } catch (_) {}

  // HTML fallback
  try {
    const base = 'https://www.fca.org.uk/news'
    const $ = await fetchHtml(base)
    const out = []

    $('.latest-news li, .news-item, article').each((_, el) => {
      const $el = $(el)
      const a = $el.find('a').first()
      const title = a.text().trim()
      let href = a.attr('href') || ''

      if (href && !href.startsWith('http')) {
        href = new URL(href, base).href
      }

      const summary = $el.find('.summary, .excerpt, p').first().text().trim() ||
                           `FCA: ${title}`
      const date = parseDate($el.find('time').attr('datetime') || $el.text())

      if (title && href && isRecent(date)) {
        out.push({
          title,
          link: href,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: normalizeAuthority('FCA'),
          summary
        })
      }
    })

    return out
  } catch (e) {
    console.error('FCA error:', e.message)
    return []
  }
}

module.exports = { scrapeFCA }
