const { normalizeAuthority } = require('./webScraperSources/utils')
const { scrapePensionRegulator } = require('./webScraperSources/tpr')
const { scrapeSFO } = require('./webScraperSources/sfo')
const { scrapeICO } = require('./webScraperSources/ico')
const { scrapeFRC } = require('./webScraperSources/frc')
const { scrapeFOS } = require('./webScraperSources/fos')
const { scrapeJMLSG } = require('./webScraperSources/jmlsg')
const { scrapeFCA } = require('./webScraperSources/fca')
const { scrapeFATF } = require('./webScraperSources/fatf')
const { scrapeBoE, scrapePRA } = require('./webScraperSources/boePra')
const { scrapeEBA } = require('./webScraperSources/eba')
const { scrapeGamblingCommission } = require('./webScraperSources/gambling')
const { scrapeHSE } = require('./webScraperSources/hse')
const { scrapeOfcom } = require('./webScraperSources/ofcom')
const { scrapeSRA } = require('./webScraperSources/sra')

module.exports = {
  // Core scrapers
  scrapePensionRegulator,
  scrapeSFO,
  scrapeFCA,
  scrapeFATF,
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

  // Utility function
  normalizeAuthority
}
