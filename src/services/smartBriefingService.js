require('dotenv').config()

const crypto = require('crypto')

const { storageDir } = require('./smartBriefing/constants')
const applyStorageMethods = require('./smartBriefing/storage')
const applyDatasetMethods = require('./smartBriefing/dataset')
const applyFallbackMethods = require('./smartBriefing/fallbacks')
const applyPromptMethods = require('./smartBriefing/prompts')
const applyArtifactMethods = require('./smartBriefing/artifacts')
const applyMetricsMethods = require('./smartBriefing/metrics')

class SmartBriefingService {
  constructor() {
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY)
    const hasGroq = Boolean(process.env.GROQ_API_KEY)

    if (hasOpenRouter) {
      this.useGroq = false
      this.endpoint = process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions'
      this.model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
      this.apiKey = process.env.OPENROUTER_API_KEY
    } else if (hasGroq) {
      this.useGroq = true
      this.endpoint = 'https://api.groq.com/openai/v1/chat/completions'
      this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
      this.apiKey = process.env.GROQ_API_KEY
    } else {
      this.useGroq = false
      this.endpoint = null
      this.model = null
      this.apiKey = null
    }

    this.storageDir = storageDir
    this.statusStore = new Map()
    this.initialized = false
  }

  async startRun(options = {}) {
    await this.ensureStorage()

    const runId = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    this.statusStore.set(runId, {
      runId,
      state: 'queued',
      createdAt,
      updatedAt: createdAt,
      message: 'Run queued'
    })

    setImmediate(() => {
      this.processRun(runId, options).catch(error => {
        console.error('SmartBriefing run failed:', error)
        this.statusStore.set(runId, {
          runId,
          state: 'failed',
          createdAt,
          updatedAt: new Date().toISOString(),
          error: error.message || 'Unknown error'
        })
      })
    })

    return this.statusStore.get(runId)
  }

  getRunStatus(runId) {
    return this.statusStore.get(runId) || null
  }

  async processRun(runId, options) {
    const startedAt = new Date().toISOString()
    this.statusStore.set(runId, {
      runId,
      state: 'preparing',
      createdAt: this.statusStore.get(runId)?.createdAt || startedAt,
      updatedAt: startedAt,
      message: 'Preparing dataset'
    })

    const dataset = await this.buildDataset(options)
    const skipCache = Boolean(options.force_regenerate)

    const datasetHash = this.computeHash({
      currentUpdates: dataset.currentUpdates,
      previousUpdates: dataset.previousUpdates,
      historyUpdates: dataset.historyUpdates,
      annotations: dataset.annotations,
      annotationInsights: dataset.annotationInsights,
      firmContext: dataset.firmContext,
      promptVersion: dataset.promptVersion
    })

    const cached = skipCache ? null : await this.findCachedBriefing(datasetHash)
    if (cached) {
      const completedAt = new Date().toISOString()
      await this.recordMetrics({
        runId,
        datasetHash,
        startedAt,
        completedAt,
        cacheHit: true,
        briefingId: cached.id,
        dataset,
        usage: cached.metadata?.usage || null
      })

      this.statusStore.set(runId, {
        runId,
        state: 'completed',
        createdAt: this.statusStore.get(runId)?.createdAt || startedAt,
        updatedAt: completedAt,
        message: 'Served from cache',
        cacheHit: true,
        briefingId: cached.id
      })
      return
    }

    this.statusStore.set(runId, {
      runId,
      state: 'generating',
      createdAt: this.statusStore.get(runId)?.createdAt || startedAt,
      updatedAt: new Date().toISOString(),
      message: 'Generating AI narratives'
    })

    const generationStart = Date.now()
    const { artifacts, usageMetrics } = await this.generateArtifacts(dataset)
    const generationDurationMs = Date.now() - generationStart

    const briefing = {
      id: crypto.randomUUID(),
      runId,
      generatedAt: new Date().toISOString(),
      dateRange: dataset.dateRange,
      metadata: {
        datasetHash,
        cacheHit: false,
        promptVersion: dataset.promptVersion,
        firmContext: dataset.firmContext,
        includeAnnotations: dataset.includeAnnotations,
        annotationVisibility: dataset.annotationVisibility,
        totals: {
          currentUpdates: dataset.currentUpdates.length,
          previousUpdates: dataset.previousUpdates.length,
          annotations: dataset.annotations.length,
          flagged: dataset.annotationInsights?.totals?.flagged || 0,
          assignments: dataset.annotationInsights?.totals?.assignments || 0,
          tasks: dataset.annotationInsights?.totals?.tasks || 0
        },
        usage: usageMetrics,
        generationDurationMs
      },
      dataset: {
        stats: dataset.stats,
        currentUpdates: dataset.currentUpdates,
        previousUpdates: dataset.previousUpdates,
        historyTimeline: dataset.historyTimeline,
        highlightUpdates: dataset.highlightUpdates,
        annotations: dataset.annotations,
        annotationInsights: dataset.annotationInsights,
        samplingWindowDays: dataset.samplingWindowDays,
        historyUpdates: dataset.historyUpdates
      },
      artifacts
    }

    await this.saveBriefing(briefing)

    const completedAt = new Date().toISOString()
    await this.recordMetrics({
      runId,
      datasetHash,
      startedAt,
      completedAt,
      cacheHit: false,
      briefingId: briefing.id,
      dataset,
      usage: usageMetrics,
      durationMs: Date.parse(completedAt) - Date.parse(startedAt)
    })

    this.statusStore.set(runId, {
      runId,
      state: 'completed',
      createdAt: this.statusStore.get(runId)?.createdAt || startedAt,
      updatedAt: completedAt,
      message: 'Briefing ready',
      cacheHit: false,
      briefingId: briefing.id
    })
  }
}

applyStorageMethods(SmartBriefingService)
applyDatasetMethods(SmartBriefingService)
applyFallbackMethods(SmartBriefingService)
applyPromptMethods(SmartBriefingService)
applyArtifactMethods(SmartBriefingService)
applyMetricsMethods(SmartBriefingService)

module.exports = new SmartBriefingService()
