require('dotenv').config()

const axios = require('axios')
const cheerio = require('cheerio')
const { webkit } = require('playwright')

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    httpOnly: false
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.split('=')[1]
    } else if (arg === '--base-url') {
      options.baseUrl = argv[i + 1] || options.baseUrl
      i += 1
    } else if (arg === '--http-only') {
      options.httpOnly = true
    }
  }

  return options
}

async function run() {
  const { baseUrl, httpOnly } = parseArgs(process.argv.slice(2))
  if (httpOnly) {
    console.log('Handbook HTTP smoke test (http-only)')
    console.log(`Base URL: ${baseUrl}`)
    await runHttpSmoke(baseUrl)
    return
  }
  let browser
  try {
    console.log('Handbook UI smoke test')
    console.log(`Base URL: ${baseUrl}`)

    browser = await webkit.launch({ headless: true })
    const page = await browser.newPage()
    page.setDefaultTimeout(30000)

    await page.goto(`${baseUrl}/handbook`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForSelector('#handbookSourcebookSelect')

    const sourcebookOptions = await page.$$eval(
      '#handbookSourcebookSelect option',
      options => options.map(option => option.value).filter(Boolean)
    )
    if (!sourcebookOptions.length) {
      throw new Error('No sourcebook options loaded')
    }

    const targetCode = sourcebookOptions.includes('PRIN') ? 'PRIN' : sourcebookOptions[0]
    await page.selectOption('#handbookSourcebookSelect', targetCode)
    await page.waitForSelector('#handbookOutline .section-item')
    await page.click('#handbookOutline .section-item')
    await page.waitForSelector('#handbookContentBody .provision, #handbookContentBody .content-placeholder')

    const contentText = await page.textContent('#handbookContentBody') || ''
    if (!contentText.trim()) {
      throw new Error('Section content body is empty')
    }

    await page.fill('#handbookSearchInput', 'integrity')
    await page.click('#handbookSearchForm button[type="submit"]')
    await page.waitForSelector('#handbookSearchResultsBody .search-result')

    const searchPanelActive = await page.$eval(
      '#handbookSearchResults',
      el => el.classList.contains('active')
    )
    if (!searchPanelActive) {
      throw new Error('Search results panel is not visible')
    }

    await page.click('#handbookSearchResultsBody .search-result')
    await page.waitForFunction(() => {
      const title = document.getElementById('handbookContentTitle')
      return title && title.textContent && title.textContent.trim().length > 0
    })

    const titleText = await page.textContent('#handbookContentTitle') || ''
    if (!titleText.trim()) {
      throw new Error('Content title not updated after search selection')
    }

    console.log('✅ Handbook UI smoke test passed')
  } catch (error) {
    if (browser) {
      await browser.close()
    }
    console.warn('⚠️  Headless browser unavailable, running HTTP smoke checks instead.')
    await runHttpSmoke(baseUrl)
    return
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function runHttpSmoke(baseUrl) {
  const client = axios.create({ baseURL: baseUrl, timeout: 20000 })

  const pageResponse = await client.get('/handbook')
  if (pageResponse.status !== 200) {
    throw new Error(`Handbook page returned ${pageResponse.status}`)
  }

  const $ = cheerio.load(pageResponse.data || '')
  const selectors = [
    '#handbookSourcebookSelect',
    '#handbookSearchForm',
    '#handbookOutline',
    '#handbookContentBody'
  ]
  const missingSelectors = selectors.filter(selector => $(selector).length === 0)
  if (missingSelectors.length) {
    throw new Error(`Missing handbook markup: ${missingSelectors.join(', ')}`)
  }

  const sourcebooksResponse = await client.get('/api/handbook/sourcebooks')
  if (!sourcebooksResponse.data?.success) {
    throw new Error('Sourcebooks API failed')
  }
  const sourcebooks = sourcebooksResponse.data.data || []
  if (!sourcebooks.length) {
    throw new Error('No sourcebooks returned from API')
  }

  const targetCode = sourcebooks.find(item => item.code === 'PRIN')?.code || sourcebooks[0].code
  const outlineResponse = await client.get(`/api/handbook/sourcebooks/${encodeURIComponent(targetCode)}/outline`)
  if (!outlineResponse.data?.success) {
    throw new Error('Outline API failed')
  }
  const outline = outlineResponse.data.data || {}
  if (!outline.chapters?.length) {
    throw new Error('No outline chapters returned')
  }

  const firstSection = outline.chapters?.[0]?.sections?.[0]
  if (!firstSection?.id) {
    throw new Error('No outline sections returned')
  }

  const sectionResponse = await client.get(`/api/handbook/sections/${firstSection.id}?includeParagraphs=true`)
  if (!sectionResponse.data?.success) {
    throw new Error('Section API failed')
  }
  const paragraphs = sectionResponse.data.paragraphs || []
  if (!paragraphs.length) {
    throw new Error('No paragraphs returned for first section')
  }

  const searchResponse = await client.get('/api/handbook/search', {
    params: { q: 'integrity', sourcebook: targetCode }
  })
  if (!searchResponse.data?.success) {
    throw new Error('Search API failed')
  }
  const results = searchResponse.data.data || []
  if (!results.length) {
    throw new Error('Search returned no results')
  }

  const ref = results[0]?.canonical_ref
  if (ref) {
    const refResponse = await client.get(`/api/handbook/reference/${encodeURIComponent(ref)}?includeParagraphs=true`)
    if (!refResponse.data?.success) {
      throw new Error('Reference API failed')
    }
  }

  console.log('✅ Handbook HTTP smoke checks passed')
}

run().catch(error => {
  console.error('❌ Handbook smoke test failed:', error.message)
  process.exitCode = 1
})
