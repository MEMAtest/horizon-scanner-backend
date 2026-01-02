const { axios, cheerio, USER_AGENT, isRecent, cleanText } = require('./utils')

const parseSpanishDateTime = (dateText, timeText) => {
  if (!dateText) return null
  const [day, month, year] = dateText.split('/').map(part => part.trim())
  if (!day || !month || !year) return null
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const time = timeText ? timeText.trim() : '00:00'
  const parsed = new Date(`${isoDate}T${time}:00Z`)
  return isNaN(parsed.getTime()) ? null : parsed
}

/* ───────── CNMV Public Communications ───────── */
async function scrapeCNMVCommunications() {
  const results = []
  const baseUrl = 'https://www.cnmv.es'
  const url = `${baseUrl}/portal/AlDia/Comunicaciones-Publicas`

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 20000
    })

    const $ = cheerio.load(response.data)
    const seen = new Set()

    $('li.blocks-single').each((_, el) => {
      const $el = $(el)
      const dateText = cleanText($el.find('.fecha-con-hora').first().text())
      const timeText = cleanText($el.find('.time').first().text())
      const linkEl = $el.find('li.resumen a').first()
      const title = cleanText(linkEl.text())
      const href = linkEl.attr('href')

      if (!title || !href) return
      const link = href.startsWith('http') ? href : new URL(href, baseUrl).href
      if (seen.has(link)) return
      seen.add(link)

      const parsedDate = parseSpanishDateTime(dateText, timeText)

      if (isRecent(parsedDate, 120) || !parsedDate) {
        results.push({
          title,
          link,
          pubDate: parsedDate ? parsedDate.toISOString() : new Date().toISOString(),
          authority: 'CNMV',
          summary: `CNMV: ${title}`,
          country: 'Spain',
          region: 'Europe',
          sectors: ['Capital Markets', 'Market Oversight', 'Transparency']
        })
      }
    })

    console.log(`✅ CNMV Communications: scraped ${results.length} items`)
    return results.slice(0, 20)
  } catch (error) {
    console.error('CNMV Communications scraper error:', error.message)
    return []
  }
}

module.exports = { scrapeCNMVCommunications }
