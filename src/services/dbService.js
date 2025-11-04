const path = require('path')

const applyBaseMethods = require('./db/base')
const applyUpdatesMethods = require('./db/updates')
const applyDigestMethods = require('./db/digest')
const applyInsightsMethods = require('./db/insights')
const applyAnalyticsMethods = require('./db/analytics')
const applyWorkspaceMethods = require('./db/workspace')
const applyHealthMethods = require('./db/health')

class EnhancedDBService {
  constructor() {
    this.pool = null
    this.fallbackMode = false
    this.usePostgres = false

    this.jsonDataPath = path.join(__dirname, '../../data')
    this.updatesFile = path.join(this.jsonDataPath, 'updates.json')
    this.insightsFile = path.join(this.jsonDataPath, 'ai_insights.json')
    this.profilesFile = path.join(this.jsonDataPath, 'firm_profiles.json')
    this.workspaceFile = path.join(this.jsonDataPath, 'workspace.json')
    this.digestHistoryFile = path.join(this.jsonDataPath, 'digest_history.json')

    this.initializeDatabase()
  }
}

applyBaseMethods(EnhancedDBService)
applyUpdatesMethods(EnhancedDBService)
applyDigestMethods(EnhancedDBService)
applyInsightsMethods(EnhancedDBService)
applyAnalyticsMethods(EnhancedDBService)
applyWorkspaceMethods(EnhancedDBService)
applyHealthMethods(EnhancedDBService)

module.exports = new EnhancedDBService()
