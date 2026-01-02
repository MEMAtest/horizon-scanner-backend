const { axios, cheerio, USER_AGENT, isRecent, cleanText } = require('./utils')

const ITALIAN_MONTHS = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11
}

const parseItalianDate = (dateText) => {
  if (!dateText) return null
  const parts = dateText.replace(/\s+/g, ' ').trim().split(' ')
  if (parts.length < 3) return null
  const day = parseInt(parts[0].replace(/\D/g, ''), 10)
  const monthKey = parts[1].toLowerCase()
  const year = parseInt(parts[2], 10)
  const monthIndex = ITALIAN_MONTHS[monthKey]
  if (!day || year < 1900 || monthIndex === undefined) return null
  return new Date(Date.UTC(year, monthIndex, day))
}

/* ───────── Bank of Italy News ───────── */
async function scrapeBankOfItaly() {
  const results = []
  const baseUrl = 'https://www.bancaditalia.it'
  const url = `${baseUrl}/media/notizie/index.html?page=1`

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    })

    const $ = cheerio.load(response.data)
    const seen = new Set()

    $('ol.bdi-last-news li').each((_, el) => {
      const $el = $(el)
      const linkEl = $el.find('a').first()
      const title = cleanText(linkEl.text())
      let link = linkEl.attr('href') || ''

      if (!title || !link) return
      if (!link.startsWith('http')) {
        link = new URL(link, baseUrl).href
      }
      if (seen.has(link)) return
      seen.add(link)

      const dateText = cleanText($el.find('.bdi-last-news-date span').first().text())
      const parsedDate = parseItalianDate(dateText)

      if (isRecent(parsedDate, 120) || !parsedDate) {
        results.push({
          title,
          link,
          pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          authority: 'Bank of Italy',
          summary: `Banca d'Italia: ${title}`,
          country: 'Italy',
          region: 'Europe',
          sectors: ['Banking', 'Monetary Policy', 'Financial Stability']
        })
      }
    })

    console.log(`✅ Bank of Italy: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('Bank of Italy scraper error:', error.message)
    return []
  }
}

module.exports = { scrapeBankOfItaly }
