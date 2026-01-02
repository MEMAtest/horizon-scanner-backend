const { axios, USER_AGENT, parseDate, isRecent, cleanText } = require('./utils')

/* ───────── ASIC Media Releases ───────── */
async function scrapeASIC() {
  const results = []
  const baseUrl = 'https://www.asic.gov.au'
  const apiUrl = 'https://www.asic.gov.au/_data/mr2023/'

  try {
    const response = await axios.get(apiUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      timeout: 15000
    })

    const payload = response.data
    const items = Array.isArray(payload)
      ? payload
      : (payload?.items || payload?.results || [])

    items.forEach((item) => {
      const title = cleanText(item.name || item.title || '')
      let link = item.url || item.link || ''
      if (!title || !link) return

      if (!link.startsWith('http')) {
        link = new URL(link, baseUrl).href
      }

      const dateText = item.publishedDate || item.dateCreated || item.createDate || item.updateDate
      const parsedDate = parseDate(dateText)
      const summary = cleanText(item.metaDescription || item.summary || '') || `ASIC: ${title}`

      if (isRecent(parsedDate, 120) || !parsedDate) {
        results.push({
          title,
          link,
          pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          authority: 'ASIC',
          summary,
          country: 'Australia',
          region: 'Asia-Pacific',
          sectors: ['Capital Markets', 'Consumer Protection', 'Investment Management']
        })
      }
    })

    console.log(`✅ ASIC: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('ASIC scraper error:', error.message)
    return []
  }
}

module.exports = { scrapeASIC }
