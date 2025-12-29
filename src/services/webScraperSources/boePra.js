const { axios, cheerio, rss, USER_AGENT, parseDate, isRecent, fetchHtml, cleanText, stripListPrefixes, fetchBoeListing, extractBoeSummary, extractPraSummary, normalizeAuthority } = require('./utils')

/* ───────── Bank of England / PRA (Replacement for dead RSS) ───────── */
async function scrapeBoE(targetAuthority = 'BoE') {
  const base = 'https://www.bankofengland.co.uk'
  const normalized = normalizeAuthority(targetAuthority)
  const PRA_TYPE = '65d34b0d42784c6bb1dd302c1ed63653'
  const GENERAL_TYPES = [
    'd10a561861b94c2ea06d82cfeda25c57',
    'e170e31a926f48d1a863ad8161ea771c',
    'f995a39ef2b8400d8ae5454926879e22',
    '09f8960ebc384e3589da5349744916ae',
    'ce90163e489841e0b66d06243d35d5cb',
    'f949c64a4c88448b9e269d10080b0987',
    '571948d14c6943f7b5b7748ad80bef29'
  ]

  const newsTypes = normalized === 'PRA' ? [PRA_TYPE] : GENERAL_TYPES

  try {
    const html = await fetchBoeListing({ newsTypes })
    const $ = cheerio.load(html)
    const out = []

    $('.col3 > a.release').each((_, el) => {
      const $el = $(el)
      const title = cleanText($el.find('h3.list').text())
      if (!title) return

      let href = $el.attr('href') || ''
      if (href && !href.startsWith('http')) {
        href = `${base}${href}`
      }

      const authority = href.includes('/prudential-regulation/') ? 'PRA' : 'BoE'
      if (normalized === 'PRA' && authority !== 'PRA') return
      if (normalized === 'BoE' && authority !== 'BoE') return

      const date = parseDate($el.find('time').attr('datetime'))

      out.push({
        title,
        link: href,
        date,
        authority: normalizeAuthority(authority)
      })
    })

    const enriched = []
    for (const item of out.slice(0, 25)) {
      const summaryFetcher = item.authority === 'PRA' ? extractPraSummary : extractBoeSummary
      let summary = await summaryFetcher(item.link)
      if (!summary) summary = `${item.authority}: ${item.title}`

      enriched.push({
        ...item,
        summary
      })
    }

    const build = (windowDays) => enriched
      .filter(entry => isRecent(entry.date, windowDays))
      .map(entry => ({
        title: entry.title,
        link: entry.link,
        pubDate: entry.date.toISOString(),
        authority: entry.authority,
        summary: entry.summary
      }))

    let results = build(31)
    if (results.length < 3) {
      results = build(90)
    }

    return results.slice(0, normalized === 'PRA' ? 10 : 20)
  } catch (error) {
    console.error('BoE error:', error.message)
    return []
  }
}

async function scrapePRA() {
  return scrapeBoE('PRA')
}

module.exports = { scrapeBoE, scrapePRA }
