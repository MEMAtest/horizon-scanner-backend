const axios = require('axios')
const cheerio = require('cheerio')
const Parser = require('rss-parser')
const rss = new Parser()
const { normalizeAuthorityName } = require('../../utils/authorityRegistry')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/* ───────── Helper Functions ───────── */
const parseDate = (s) => {
  const d = new Date(s)
  return isNaN(d) ? null : d
}

const isRecent = (d, days = 30) => {
  return d && d >= new Date(Date.now() - days * 864e5)
}

const fetchHtml = async (url) => {
  return axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000
  }).then(r => cheerio.load(r.data))
}

const cleanText = (text = '') => text.replace(/\s+/g, ' ').trim()

const stripListPrefixes = (text = '') => text.replace(/^(\d+\.\d+|\d+|[•\-*])\s+/, '').trim()

async function fetchBoeListing({ newsTypes, pageSize = 20 }) {
  const endpoint = 'https://www.bankofengland.co.uk/_api/News/RefreshPagedNewsList'
  const payload = {
    SearchTerm: '',
    Id: '{CE377CC8-BFBC-418B-B4D9-DBC1C64774A8}',
    PageSize: pageSize,
    NewsTypes: newsTypes,
    NewsTypesAvailable: newsTypes,
    Taxonomies: [],
    TaxonomiesAvailable: [],
    Page: 1,
    Direction: 1,
    DateFrom: null,
    DateTo: null,
    Grid: false,
    InfiniteScrolling: false
  }

  const { data } = await axios.post(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT
    },
    timeout: 10000
  })

  return data?.Results || ''
}

const extractBoeSummary = async (url) => {
  try {
    const $ = await fetchHtml(url)
    let summary = ''

    $('.page-section .page-content p').each((_, el) => {
      if (summary) return
      const text = stripListPrefixes(cleanText($(el).text()))
      if (!text || /privacy statement/i.test(text) || text.length < 60) return
      summary = text
    })

    return summary
  } catch (error) {
    console.warn('BoE summary fetch failed:', error.message)
    return ''
  }
}

const extractPraSummary = async (url) => {
  try {
    const $ = await fetchHtml(url)
    let summary = ''

    $('section[data-section]').each((_, section) => {
      if (summary) return false
      const heading = cleanText($(section).find('h2').first().text())
      if (/privacy/i.test(heading)) return

      $(section).find('p').each((__, el) => {
        const text = stripListPrefixes(cleanText($(el).text()))
        if (text.length < 60) return
        summary = text
        return false
      })

      if (summary) return false
    })

    return summary || await extractBoeSummary(url)
  } catch (error) {
    console.warn('PRA summary fetch failed:', error.message)
    return ''
  }
}

/* ───────── Authority Normalization ───────── */
const LEGACY_AUTHORITY_MAPPING = {
  'Bank of England': 'BoE',
  'Bank of England (BoE)': 'BoE',
  'Prudential Regulation Authority (PRA)': 'PRA',
  'Prudential Regulation Authority': 'PRA',
  'European Banking Authority (EBA)': 'EBA',
  'European Banking Authority': 'EBA',
  'EBA (European Banking Authority)': 'EBA',
  'The Pensions Regulator': 'TPR',
  'Serious Fraud Office': 'SFO',
  "Information Commissioner's Office": 'ICO',
  'Information Commissioner Office': 'ICO',
  'Financial Reporting Council': 'FRC',
  'Financial Ombudsman Service': 'FOS',
  'Financial Action Task Force': 'FATF',
  'HM Treasury, Office of Financial Sanctions Implementation': 'HM Treasury'
}

const normalizeAuthority = (authority) => {
  if (!authority) return authority
  const registryNormalized = normalizeAuthorityName(authority)
  if (registryNormalized && registryNormalized !== authority) {
    return registryNormalized
  }
  return LEGACY_AUTHORITY_MAPPING[authority] || authority
}

module.exports = {
  axios,
  cheerio,
  rss,
  USER_AGENT,
  parseDate,
  isRecent,
  fetchHtml,
  cleanText,
  stripListPrefixes,
  fetchBoeListing,
  extractBoeSummary,
  extractPraSummary,
  normalizeAuthority
}
