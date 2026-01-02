const { axios, cheerio, USER_AGENT, parseDate, isRecent, cleanText } = require('./utils')

/* ───────── ACPR News (France) ───────── */
async function scrapeACPR() {
  const results = []
  const baseUrl = 'https://acpr.banque-france.fr'
  const url = `${baseUrl}/en/news`

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000
    })

    const $ = cheerio.load(response.data)
    const cards = $('.view-content .card.card-vertical')
    const seen = new Set()

    cards.each((_, el) => {
      const $card = $(el)
      const linkEl = $card.find('a[href*="/en/news/"]').first()
      const href = linkEl.attr('href')
      const title = cleanText(linkEl.text())

      if (!title || !href) return
      let link = href.startsWith('http') ? href : new URL(href, baseUrl).href
      if (seen.has(link)) return
      seen.add(link)

      const rawDate = cleanText($card.find('small').last().text())
      const normalizedDate = rawDate
        .replace(/(\d+)(st|nd|rd|th)/gi, '$1')
        .replace(/\bof\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      const parsedDate = parseDate(normalizedDate)

      if (isRecent(parsedDate, 120) || !parsedDate) {
        results.push({
          title,
          link,
          pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          authority: 'ACPR',
          summary: `ACPR: ${title}`,
          country: 'France',
          region: 'Europe',
          sectors: ['Banking', 'Insurance', 'Prudential Regulation', 'AML & Financial Crime']
        })
      }
    })

    console.log(`✅ ACPR: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('ACPR scraper error:', error.message)
    return []
  }
}

module.exports = { scrapeACPR }
