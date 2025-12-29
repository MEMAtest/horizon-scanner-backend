const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── European Banking Authority (EBA) ───────── */
async function scrapeEBA() {
  const FEED = 'https://www.eba.europa.eu/news-press/news/rss.xml'

  try {
    const feed = await rss.parseURL(FEED)
    const out = []

    for (const item of feed.items || []) {
      const title = cleanText(item.title)
      if (!title) continue

      const link = item.link
      const date = parseDate(item.isoDate || item.pubDate)
      if (!isRecent(date)) continue

      const summary = cleanText(item.contentSnippet || item.content || `EBA: ${title}`)

      out.push({
        title,
        link,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('EBA'),
        summary
      })

      if (out.length >= 20) break
    }

    return out
  } catch (error) {
    console.error('EBA error:', error.message)
    return []
  }
}

module.exports = { scrapeEBA }
