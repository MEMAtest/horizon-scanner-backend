const { Pool } = require('pg')

const applyBaseMethods = require('./fcaFines/base')
const applyUtilityMethods = require('./fcaFines/utils')
const applyStructuredMethods = require('./fcaFines/structured')
const applyNewsMethods = require('./fcaFines/news')
const applyDatabaseMethods = require('./fcaFines/database')
const applyOrchestratorMethods = require('./fcaFines/orchestrator')

const {
  BASE_URL,
  DEFAULT_USER_AGENT,
  DEFAULT_REQUEST_DELAY,
  BREACH_TYPE_ENTRIES
} = require('./fcaFines/constants')

class FCAFinesScraper {
  constructor(dbConfig) {
    this.db = new Pool(dbConfig)
    this.baseUrl = BASE_URL
    this.userAgent = DEFAULT_USER_AGENT
    this.requestDelay = DEFAULT_REQUEST_DELAY
    this.maxRetries = 3
    this.breachTypeMap = new Map(BREACH_TYPE_ENTRIES)
  }
}

applyBaseMethods(FCAFinesScraper)
applyUtilityMethods(FCAFinesScraper)
applyStructuredMethods(FCAFinesScraper)
applyNewsMethods(FCAFinesScraper)
applyDatabaseMethods(FCAFinesScraper)
applyOrchestratorMethods(FCAFinesScraper)

module.exports = FCAFinesScraper
