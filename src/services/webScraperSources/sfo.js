const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Serious Fraud Office (SFO) ───────── */
async function scrapeSFO() {
  // Try GOV.UK Atom feed first
  const FEED = 'https://www.gov.uk/government/organisations/serious-fraud-office.atom'
  try {
    const feed = await rss.parseURL(FEED)
    const recent = feed.items.filter(i => isRecent(parseDate(i.pubDate)))

    if (recent.length) {
      return recent.map(i => ({
        title: i.title,
        link: i.link,
        pubDate: i.pubDate,
        authority: normalizeAuthority('Serious Fraud Office'),
        summary: i.contentSnippet || i.content || `SFO: ${i.title}`
      }))
    }
  } catch (_) {
    /* fall through to HTML */
  }

  // HTML fallback - GOV.UK search results
  try {
    const base = 'https://www.gov.uk/search/all?organisations[]=serious-fraud-office&order=updated-newest'
    const $ = await fetchHtml(base)
    const out = []

    $('.gem-c-document-list__item').each((_, el) => {
      const $el = $(el)
      const a = $el.find('a').first()
      const title = cleanText(a.text())
      const href = a.attr('href')
      const summary = cleanText($el.find('.gem-c-document-list__item-description').text()) ||
                           `SFO: ${title}`
      const date = parseDate($el.find('time').attr('datetime'))

      if (title && href && isRecent(date)) {
        out.push({
          title,
          link: new URL(href, 'https://www.gov.uk').href,
          pubDate: date ? date.toISOString() : new Date().toISOString(),
          authority: normalizeAuthority('Serious Fraud Office'),
          summary
        })
      }
    })

    return out
  } catch (e) {
    console.error('SFO error:', e.message)
    return []
  }
}

module.exports = { scrapeSFO }
