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
const applyBusinessLineProfileMethods = require('./db/businessLineProfiles')
const applyRegulatoryChangesMethods = require('./db/regulatoryChanges')
const applyWatchListsMethods = require('./db/watchLists')
const applyDossiersMethods = require('./db/dossiers')
const applyPoliciesMethods = require('./db/policies')
const applyNotificationsMethods = require('./db/notifications')
const applyAuthMethods = require('./db/auth')
const applyFirmPersonasMethods = require('./db/firmPersonas')
const applyCalendarMethods = require('./db/calendar')
const applyHandbookMethods = require('./db/handbook')
const applyScrapeMonitoringMethods = require('./db/scrapeMonitoring')

class EnhancedDBService {
  constructor() {
    this.pool = null
    this.fallbackMode = false
    this.usePostgres = false
    this.isInitialized = false
    this.initializationPromise = null

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
    this.scrapeMonitorRunsFile = path.join(this.jsonDataPath, 'scrape_monitor_runs.json')
    this.scrapeMonitorChecksFile = path.join(this.jsonDataPath, 'scrape_monitor_checks.json')

    this.initializationPromise = this.initializeDatabase()
  }

  async waitForInitialization() {
    if (this.isInitialized) return
    await this.initializationPromise
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
applyBusinessLineProfileMethods(EnhancedDBService)
applyRegulatoryChangesMethods(EnhancedDBService)
applyWatchListsMethods(EnhancedDBService)
applyDossiersMethods(EnhancedDBService)
applyPoliciesMethods(EnhancedDBService)
applyNotificationsMethods(EnhancedDBService)
applyAuthMethods(EnhancedDBService)
applyFirmPersonasMethods(EnhancedDBService)
applyCalendarMethods(EnhancedDBService)
applyHandbookMethods(EnhancedDBService)
applyScrapeMonitoringMethods(EnhancedDBService)

module.exports = new EnhancedDBService()
