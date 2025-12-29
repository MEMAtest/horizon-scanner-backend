const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Information Commissioner's Office (ICO) ───────── */
async function scrapeICO() {
  const endpoint = 'https://ico.org.uk/api/search'
  const base = 'https://ico.org.uk'

  const extractSummary = async (url) => {
    try {
      const $ = await fetchHtml(url)
      let summary = ''

      $('.rich-text p').each((_, el) => {
        if (summary) return
        const text = cleanText($(el).text())
        if (text.length < 40) return
        summary = text
      })

      return summary
    } catch (error) {
      console.warn('ICO summary fetch failed:', error.message)
      return ''
    }
  }

  try {
    const payload = {
      filters: [
        { key: 'entype', values: ['news', 'blog', 'speech', 'statement'] }
      ],
      pageNumber: 1,
      order: 'newest',
      rootPageId: 2816
    }

    const { data } = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT
      },
      timeout: 10000
    })

    const items = data?.results || []
    const fresh = []
    const older = []

    for (const item of items) {
      const title = cleanText(item.title)
      if (!title) continue

      const link = item.url.startsWith('http') ? item.url : `${base}${item.url}`
      const metaDate = cleanText((item.filterItemMetaData || '').split(',')[0])
      const date = parseDate(metaDate || item.createdDateTime)

      let summary = cleanText(item.description || '')
      if (!summary) {
        summary = await extractSummary(link)
      }
      if (!summary) summary = `ICO update: ${title}`

      const record = {
        title,
        link,
        pubDate: date ? date.toISOString() : new Date().toISOString(),
        authority: normalizeAuthority('ICO'),
        summary,
        __date: date
      }

      if (isRecent(date)) {
        fresh.push(record)
      } else {
        older.push(record)
      }
    }

    while (fresh.length < 3 && older.length) {
      fresh.push(older.shift())
    }

    return fresh.slice(0, 15).map(({ __date, ...rest }) => rest)
  } catch (error) {
    console.error('ICO error:', error.message)
    return []
  }
}

module.exports = { scrapeICO }
