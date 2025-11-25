const path = require('path')

const applyBaseMethods = require('./db/base')
const applyUpdatesMethods = require('./db/updates')
const applyDigestMethods = require('./db/digest')
const applyInsightsMethods = require('./db/insights')
const applyAnalyticsMethods = require('./db/analytics')
const applyWorkspaceMethods = require('./db/workspace')
const applyProfileMethods = require('./db/profiles')
const applyTelemetryMethods = require('./db/telemetry')
const applyFeedbackMethods = require('./db/feedback')
const applyWorkflowMethods = require('./db/workflows')
const applyHealthMethods = require('./db/health')
const applyWeeklyBriefingsMethods = require('./db/weeklyBriefings')

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
    this.telemetryFile = path.join(this.jsonDataPath, 'intelligence_events.json')
    this.profileFeedbackFile = path.join(this.jsonDataPath, 'profile_feedback_scores.json')
    this.userProfilesFile = path.join(this.jsonDataPath, 'user_profiles.json')
    this.profileWorkflowsFile = path.join(this.jsonDataPath, 'profile_workflows.json')
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
applyProfileMethods(EnhancedDBService)
applyTelemetryMethods(EnhancedDBService)
applyFeedbackMethods(EnhancedDBService)
applyWorkflowMethods(EnhancedDBService)
applyWeeklyBriefingsMethods(EnhancedDBService)

module.exports = new EnhancedDBService()
