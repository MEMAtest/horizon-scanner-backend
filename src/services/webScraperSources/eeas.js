const { axios, cheerio, USER_AGENT, cleanText } = require('./utils')

const parseEeasDate = (dateText) => {
  if (!dateText) return null
  const normalized = dateText.replace(/\s+/g, ' ').trim()
  const parts = normalized.split('.').map(part => part.trim()).filter(Boolean)
  if (parts.length === 3) {
    const [day, month, year] = parts
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const parsed = new Date(`${iso}T00:00:00Z`)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(normalized)
  return isNaN(parsed.getTime()) ? null : parsed
}

/* ───────── EEAS Press Material ───────── */
async function scrapeEEAS() {
  const results = []
  const baseUrl = 'https://www.eeas.europa.eu'
  const url = `${baseUrl}/eeas/press-material_en?f%5B0%5D=pm_category%3AStatement/Declaration`

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 20000
    })

    const $ = cheerio.load(response.data)
    const seen = new Set()

    $('.view-content .related-grid .card').each((_, el) => {
      const $card = $(el)
      const linkEl = $card.find('h3.card-title a[href]').first()
      const title = cleanText(linkEl.text())
      let link = linkEl.attr('href') || ''

      if (!title || !link) return
      if (!link.startsWith('http')) {
        link = new URL(link, baseUrl).href
      }
      if (seen.has(link)) return
      seen.add(link)

      const category = cleanText($card.find('.card-subtitle').first().text())
      const dateText = cleanText($card.find('.card-footer').first().text())
      const parsedDate = parseEeasDate(dateText)

      results.push({
        title,
        link,
        pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
        authority: 'EEAS',
        summary: category ? `EEAS ${category}: ${title}` : `EEAS: ${title}`,
        country: 'EU',
        region: 'Europe',
        sectors: ['International Policy', 'Sanctions', 'Regulatory Statements']
      })
    })

    console.log(`✅ EEAS: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('EEAS scraper error:', error.message)
    return []
  }
}

module.exports = { scrapeEEAS }
