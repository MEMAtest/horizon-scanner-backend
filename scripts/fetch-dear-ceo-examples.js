#!/usr/bin/env node
// Quick script to fetch Dear CEO letter examples

const axios = require('axios')
const cheerio = require('cheerio')

async function getDearCEOExamples() {
  console.log('📋 Fetching Dear CEO Letter Examples...\n')

  try {
    const url = 'https://www.fca.org.uk/publications/search-results?category=policy%20and%20guidance-dear%20ceo%20letters&sort_by=dmetaZ'

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9'
      },
      timeout: 30000
    })

    const $ = cheerio.load(response.data)

    // Try multiple selector patterns
    const items = $('.search-result, .publication-item, .views-row, article')

    console.log(`Found ${items.length} potential items\n`)

    const examples = []

    items.each((i, item) => {
      if (i >= 10) return false // Limit to 10

      const $item = $(item)

      // Try multiple title selectors
      const title = $item.find('h2 a, h3 a, .title a, .search-result__title a').first().text().trim()
      const url = $item.find('h2 a, h3 a, .title a, .search-result__title a').first().attr('href')
      const date = $item.find('.date, time, .search-result__date, .publication-date').first().text().trim()
      const summary = $item.find('.summary, .description, .search-result__summary').first().text().trim()

      if (title) {
        examples.push({
          title,
          url: url ? (url.startsWith('http') ? url : `https://www.fca.org.uk${url}`) : null,
          date,
          summary: summary ? summary.substring(0, 200) + '...' : null
        })
      }
    })

    if (examples.length === 0) {
      console.log('⚠️  No items found with standard selectors. Page structure may have changed.\n')
      console.log('HTML structure preview:')
      console.log($('body').html().substring(0, 2000))
    } else {
      console.log(`✅ Found ${examples.length} Dear CEO Letters:\n`)
      console.log('=' .repeat(80))

      examples.forEach((ex, idx) => {
        console.log(`\n${idx + 1}. ${ex.title}`)
        if (ex.date) console.log(`   Date: ${ex.date}`)
        if (ex.url) console.log(`   URL: ${ex.url}`)
        if (ex.summary) console.log(`   Summary: ${ex.summary}`)
        console.log('   ' + '-'.repeat(76))
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)

    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Headers:`, error.response.headers)
    }
  }
}

getDearCEOExamples()
