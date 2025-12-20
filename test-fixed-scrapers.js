/**
 * Quick test for fixed scrapers - TPR and ICO
 */
const axios = require('axios')
const cheerio = require('cheerio')

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'

async function testTPR() {
  console.log('\n' + '='.repeat(60))
  console.log('Testing TPR (The Pensions Regulator)')
  console.log('='.repeat(60))

  try {
    const url = 'https://www.thepensionsregulator.gov.uk/en/media-hub/press-releases'
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000
    })

    const $ = cheerio.load(data)
    const items = []

    // Using new selector: .tpr-mediahub-item
    $('.tpr-mediahub-item').each((_, el) => {
      const $el = $(el)
      const anchor = $el.find('dt a.govuk-link').first()
      const title = anchor.text().trim()
      const href = anchor.attr('href')
      const dateText = $el.find('.item-date-time span').text().trim()

      if (title && href) {
        items.push({ title: title.substring(0, 70), date: dateText })
      }
    })

    console.log(`\nFound ${items.length} items:`)
    items.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}...`)
      console.log(`   Date: ${item.date}`)
    })

    console.log(`\n✅ TPR: ${items.length > 0 ? 'WORKING' : 'BROKEN'} (${items.length} items)`)
    return items.length > 0
  } catch (error) {
    console.log(`❌ TPR: ERROR - ${error.message}`)
    return false
  }
}

async function testICO() {
  console.log('\n' + '='.repeat(60))
  console.log('Testing ICO (Information Commissioner\'s Office)')
  console.log('='.repeat(60))

  try {
    const endpoint = 'https://ico.org.uk/api/search'
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
    console.log(`\nFound ${items.length} items:`)

    items.slice(0, 5).forEach((item, i) => {
      console.log(`${i + 1}. ${item.title?.substring(0, 60)}...`)
      console.log(`   Date: ${item.filterItemMetaData}`)
    })

    console.log(`\n✅ ICO: ${items.length > 0 ? 'WORKING' : 'BROKEN'} (${items.length} items)`)
    return items.length > 0
  } catch (error) {
    console.log(`❌ ICO: ERROR - ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🧪 Testing Fixed Scrapers\n')

  const tprOk = await testTPR()
  const icoOk = await testICO()

  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`TPR: ${tprOk ? '✅ WORKING' : '❌ BROKEN'}`)
  console.log(`ICO: ${icoOk ? '✅ WORKING' : '❌ BROKEN'}`)
}

main().catch(console.error)
