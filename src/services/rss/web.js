const { scrapeBankCheerio, BANK_CONFIGS } = require('../../scrapers/cheerio/banks')
const {
  scrapeFCAConsultationPapers,
  scrapeFCADiscussionPapers,
  scrapeFCADearCeo,
  scrapePRASupervisory,
  scrapeFSCS: scrapeFSCSCheerio,
  scrapeOfcom: scrapeOfcomCheerio,
  scrapeCFTC,
  scrapeCNBV,
  scrapeAPRA,
  scrapeAUSTRAC,
  scrapeRBI,
  scrapeCIMA,
  scrapeCBE,
  scrapeFSCA,
  scrapeFICSA,
  scrapeWolfsberg,
  scrapeEgmont,
  scrapeNCA,
  scrapeLSE,
  scrapeAquis,
  scrapePayUK,
  scrapeOFAC,
  scrapeDFSA,
  scrapeCBUAE,
  scrapeSAMA
} = require('../../scrapers/cheerio/regulators')
const {
  scrapeFATFCheerio,
  scrapeJMLSGCheerio,
  scrapeEIOPACheerio,
  scrapeIOSCOCheerio,
  scrapeBCBSCheerio,
  scrapeEUCouncilCheerio
} = require('../../scrapers/cheerio/international')

// Derive bank authority sets from BANK_CONFIGS to avoid duplication
const BANK_AUTHORITIES = new Set(Object.keys(BANK_CONFIGS))
const BANK_AUTHORITY_MAP = {}
// Build reverse map: "Bank of America" -> "BofA", "Wells Fargo" -> "WellsFargo", etc.
for (const [key, config] of Object.entries(BANK_CONFIGS)) {
  BANK_AUTHORITIES.add(key)
  // Also add the display name as an alias
  if (config.name && config.name !== key) {
    BANK_AUTHORITIES.add(config.name)
    BANK_AUTHORITY_MAP[config.name] = key
  }
}

function applyWebMethods(ServiceClass, {
  axios,
  cheerio,
  scrapeFATF,
  scrapeFCA,
  scrapeSFO,
  scrapePensionRegulator,
  scrapeICO,
  scrapeFRC,
  scrapeFOS,
  scrapeJMLSG,
  scrapeBoE,
  scrapePRA,
  scrapeEBA,
  // New regulators - December 2025
  scrapeGamblingCommission,
  scrapeHSE,
  scrapeOfcom,
  scrapeSRA,
  scrapeMAS,
  scrapeASIC,
  scrapeACPR,
  scrapeBankOfItaly,
  scrapeEEAS,
  scrapeQCB,
  scrapeCNMVCommunications,
  normalizeAuthority
}) {
  ServiceClass.prototype.fetchWebScraping = async function fetchWebScraping(source, options = {}) {
    try {
      console.log(`🌐 Web scraping for ${source.name} (${source.authority})...`)

      if (options.forceGeneric || source.useGeneric) {
        console.log(`ℹ️ Using generic HTML parsing for ${source.name}`)
        return await this.genericWebScraping(source, options)
      }

      let scraperResults = []

      switch (source.authority) {
        case 'FATF':
          scraperResults = await scrapeFATFCheerio()
          break
        case 'FCA':
          scraperResults = await scrapeFCA()
          break
        case 'SFO':
        case 'Serious Fraud Office':
          scraperResults = await scrapeSFO()
          break
        case 'TPR':
        case 'The Pensions Regulator':
          scraperResults = await scrapePensionRegulator()
          break
        case 'ICO':
        case 'Information Commissioner\'s Office':
          scraperResults = await scrapeICO()
          break
        case 'FRC':
        case 'Financial Reporting Council':
          scraperResults = await scrapeFRC()
          break
        case 'FOS':
        case 'Financial Ombudsman Service':
          scraperResults = await scrapeFOS()
          break
        case 'JMLSG':
        case 'Joint Money Laundering Steering Group':
          scraperResults = await scrapeJMLSGCheerio()
          break
        case 'BoE':
        case 'Bank of England':
          scraperResults = await scrapeBoE('BoE')
          break
        case 'PRA':
        case 'Prudential Regulation Authority':
          scraperResults = await scrapePRASupervisory()
          break
        case 'EBA':
        case 'European Banking Authority':
          scraperResults = await scrapeEBA()
          break
        // New regulators - December 2025
        case 'GAMBLING_COMMISSION':
        case 'Gambling Commission':
          scraperResults = await scrapeGamblingCommission()
          break
        case 'HSE':
        case 'Health and Safety Executive':
          scraperResults = await scrapeHSE()
          break
        case 'OFCOM':
        case 'Ofcom':
          scraperResults = await scrapeOfcomCheerio()
          break
        case 'SRA':
        case 'Solicitors Regulation Authority':
          scraperResults = await scrapeSRA()
          break
        case 'MAS':
        case 'Monetary Authority of Singapore':
          scraperResults = await scrapeMAS()
          break
        case 'ASIC':
        case 'Australian Securities and Investments Commission':
          scraperResults = await scrapeASIC()
          break
        case 'ACPR':
        case 'Autorite de Controle Prudentiel':
          scraperResults = await scrapeACPR()
          break
        case 'Bank of Italy':
        case 'Banca d\'Italia':
          scraperResults = await scrapeBankOfItaly()
          break
        case 'EEAS':
        case 'European External Action Service':
          scraperResults = await scrapeEEAS()
          break
        case 'QCB':
        case 'Qatar Central Bank':
          scraperResults = await scrapeQCB()
          break
        case 'CNMV':
        case 'Comision Nacional del Mercado de Valores':
          scraperResults = await scrapeCNMVCommunications()
          break
        // Converted from puppeteer — cheerio scrapers
        case 'FCA_CP':
          scraperResults = await scrapeFCAConsultationPapers()
          break
        case 'FCA_DP':
          scraperResults = await scrapeFCADiscussionPapers()
          break
        case 'FSCS':
          scraperResults = await scrapeFSCSCheerio()
          break
        case 'CFTC':
        case 'Commodity Futures Trading Commission':
          scraperResults = await scrapeCFTC()
          break
        case 'CNBV':
        case 'Comision Nacional Bancaria y de Valores':
          scraperResults = await scrapeCNBV()
          break
        case 'APRA':
        case 'Australian Prudential Regulation Authority':
          scraperResults = await scrapeAPRA()
          break
        case 'AUSTRAC':
        case 'Australian Transaction Reports and Analysis Centre':
          scraperResults = await scrapeAUSTRAC()
          break
        case 'RBI':
        case 'Reserve Bank of India':
          scraperResults = await scrapeRBI()
          break
        case 'CIMA':
        case 'Cayman Islands Monetary Authority':
          scraperResults = await scrapeCIMA()
          break
        case 'CBE':
        case 'Central Bank of Egypt':
          scraperResults = await scrapeCBE()
          break
        case 'FSCA':
        case 'Financial Sector Conduct Authority':
          scraperResults = await scrapeFSCA()
          break
        case 'FIC_SA':
        case 'Financial Intelligence Centre':
          scraperResults = await scrapeFICSA()
          break
        case 'WOLFSBERG':
        case 'Wolfsberg Group':
          scraperResults = await scrapeWolfsberg()
          break
        case 'EGMONT':
        case 'Egmont Group':
          scraperResults = await scrapeEgmont()
          break
        case 'NCA':
        case 'National Crime Agency':
          scraperResults = await scrapeNCA()
          break
        case 'LSE':
        case 'London Stock Exchange':
          scraperResults = await scrapeLSE()
          break
        case 'AQUIS':
        case 'Aquis Exchange':
          scraperResults = await scrapeAquis()
          break
        case 'Pay.UK':
          scraperResults = await scrapePayUK()
          break
        case 'OFAC':
          scraperResults = await scrapeOFAC()
          break
        case 'DFSA':
        case 'Dubai Financial Services Authority':
          scraperResults = await scrapeDFSA()
          break
        case 'CBUAE':
        case 'Central Bank of UAE':
          scraperResults = await scrapeCBUAE()
          break
        case 'SAMA':
        case 'Saudi Arabian Monetary Authority':
          scraperResults = await scrapeSAMA()
          break
        case 'BCBS':
        case 'Basel Committee on Banking Supervision':
          scraperResults = await scrapeBCBSCheerio()
          break
        case 'EIOPA':
          scraperResults = await scrapeEIOPACheerio()
          break
        case 'IOSCO':
          scraperResults = await scrapeIOSCOCheerio()
          break
        case 'EU_COUNCIL':
        case 'EU Council':
          scraperResults = await scrapeEUCouncilCheerio()
          break
        default:
          // Check if this is a bank authority - use cheerio bank scraper
          if (BANK_AUTHORITIES.has(source.authority)) {
            const bankKey = BANK_AUTHORITY_MAP[source.authority] || source.authority
            console.log(`🏦 Using cheerio bank scraper for ${source.authority} (key: ${bankKey})`)
            scraperResults = await scrapeBankCheerio(bankKey)
            break
          }
          console.log(`⚠️ No dedicated scraper for ${source.authority}, using generic HTML parsing`)
          return await this.genericWebScraping(source, options)
      }

      if (scraperResults && scraperResults.length > 0) {
        console.log(`✅ ${source.name}: ${scraperResults.length} items via dedicated scraper`)

        return scraperResults.map(item => ({
          headline: item.title || item.headline,
          summary: item.summary || `${source.authority} update: ${item.title}`,
          url: item.url || item.link,
          authority: normalizeAuthority(item.authority || source.authority),
          publishedDate: item.publishedDate || new Date(item.pubDate),
          source: source.name,
          feedType: 'web_scraping',
          sectors: source.sectors || []
        }))
      }

      console.log(`⚠️ No results from dedicated scraper for ${source.name}`)
      return []
    } catch (error) {
      console.error(`❌ Web scraping failed for ${source.name}:`, error.message)

      try {
        return await this.genericWebScraping(source, options)
      } catch (fallbackError) {
        console.error(`❌ Generic scraping also failed for ${source.name}:`, fallbackError.message)
        if (options.throwOnError) {
          throw fallbackError
        }
        return []
      }
    }
  }

  ServiceClass.prototype.genericWebScraping = async function genericWebScraping(source, options = {}) {
    try {
      const response = await axios.get(source.url, {
        timeout: options.timeoutMs || this.fetchTimeout || 15000,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...(options.disableKeepAlive ? { Connection: 'close' } : {})
        }
      })

      const $ = cheerio.load(response.data)
      return this.parseWebScrapingContent($, source)
    } catch (error) {
      console.error('❌ Generic web scraping failed:', error.message)
      if (options.throwOnError) {
        throw error
      }
      return []
    }
  }

  ServiceClass.prototype.parseWebScrapingContent = function parseWebScrapingContent($, source) {
    const updates = []

    $(source.selector).each((index, element) => {
      try {
        if (index >= 20) return false

        const $item = $(element)

        const title = $item.find(source.titleSelector).text().trim() ||
          $item.find(source.titleSelector).attr('title') || ''

        const link = $item.find(source.linkSelector).attr('href') || ''

        const summary = source.summarySelector
          ? $item.find(source.summarySelector).text().trim()
          : ''

        const date = source.dateSelector
          ? $item.find(source.dateSelector).text().trim()
          : ''

        if (title && link) {
          const parsedDate = this.parseDate(date)

          if (this.isRecent(parsedDate, source.recencyDays || 30)) {
            updates.push({
              headline: this.cleanText(title),
              summary: this.cleanText(summary),
              url: this.normalizeUrl(link, source.url),
              authority: source.authority,
              publishedDate: parsedDate,
              source: source.name,
              feedType: 'web_scraping',
              sectors: source.sectors || []
            })
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error parsing web scraping item from ${source.name}:`, error.message)
      }
    })

    return updates
  }
}

module.exports = applyWebMethods
