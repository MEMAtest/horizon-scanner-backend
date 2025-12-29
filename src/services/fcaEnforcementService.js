// FCA Enforcement Service - Main Integration Module
// Enhanced Horizon Scanner - Unified Enforcement Data Service

const FCAFinesScraper = require('./fcaFinesScraper')
const FCAFinesAI = require('./fcaFinesAI')
const { Pool } = require('pg')

const controlPlaybook = require('./enforcement/controlPlaybook')
const scraping = require('./enforcement/scraping')
const filters = require('./enforcement/filters')
const stats = require('./enforcement/stats')
const fines = require('./enforcement/fines')
const trends = require('./enforcement/trends')
const firms = require('./enforcement/firms')
const insights = require('./enforcement/insights')
const benchmarks = require('./enforcement/benchmarks')
const sectors = require('./enforcement/sectors')
const yearSummary = require('./enforcement/yearSummary')

class FCAEnforcementService {
  constructor(dbConfig, aiAnalyzer) {
    this.db = new Pool(dbConfig)
    this.scraper = new FCAFinesScraper(dbConfig)
    this.aiService = new FCAFinesAI(dbConfig, aiAnalyzer)
    this.isInitialized = false
    this.controlPlaybook = controlPlaybook
  }
}

Object.assign(
  FCAEnforcementService.prototype,
  scraping,
  filters,
  stats,
  fines,
  trends,
  firms,
  insights,
  benchmarks,
  sectors,
  yearSummary
)

module.exports = FCAEnforcementService
