// Smart Briefing Service
// Provides manual, cache-aware generation of the weekly "Smart Briefing" bundle.

require('dotenv').config()

const axios = require('axios')
const crypto = require('crypto')
const fs = require('fs').promises
const path = require('path')

const dbService = require('./dbService')
const annotationService = require('./annotationService')

// Use /tmp for Vercel serverless compatibility
const isVercel = process.env.VERCEL || process.env.NOW_REGION
const metricsFile = isVercel
  ? path.join('/tmp', 'weekly_briefing_metrics.json')
  : path.join(process.cwd(), 'data', 'weekly_briefing_metrics.json')

const DEFAULT_DAYS = 7
const HISTORY_WINDOW_DAYS = 28
const MAX_FLAGGED_ITEMS = 10

function impactPriority(value) {
  const normalized = (value || '').toString().toLowerCase()
  if (normalized.includes('significant') || normalized.includes('high')) return 3
  if (normalized.includes('moderate') || normalized.includes('medium')) return 2
  return 1
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseDate(value) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncateText(value, limit = 220) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit - 1).trim()}…`
}

function buildList(items) {
  if (!Array.isArray(items) || items.length === 0) return '<ul><li>No items available.</li></ul>'
  return `<ul>${items.join('')}</ul>`
}

class SmartBriefingService {
  constructor() {
    this.endpoint = process.env.OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1/chat/completions'
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-opus'
    this.apiKey = process.env.OPENROUTER_API_KEY

    // Use /tmp for Vercel serverless compatibility (read-only file system otherwise)
    const isVercel = process.env.VERCEL || process.env.NOW_REGION
    this.storageDir = isVercel
      ? path.join('/tmp', 'weekly_briefings')
      : path.join(process.cwd(), 'data', 'weekly_briefings')
    this.statusStore = new Map()
    this.initialized = false
  }

  async ensureStorage() {
    if (this.initialized) return
    try {
      await fs.mkdir(this.storageDir, { recursive: true })
      this.initialized = true
    } catch (error) {
      console.warn('Failed to create storage directory:', error.message)
      // Still set initialized to true to prevent retries
      this.initialized = true
    }
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

  async listBriefings(limit = 10) {
    await this.ensureStorage()

    console.log('[SmartBriefing] Listing briefings from:', this.storageDir)
    const files = await fs.readdir(this.storageDir)
    console.log('[SmartBriefing] Found files:', files.length)
    const briefings = []

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const filePath = path.join(this.storageDir, file)

      try {
        const content = await fs.readFile(filePath, 'utf8')
        const data = JSON.parse(content)
        briefings.push({
          id: data.id,
          generatedAt: data.generatedAt,
          dateRange: data.dateRange,
          metadata: data.metadata || {}
        })
      } catch (error) {
        console.warn('[SmartBriefing] Failed to read briefing snapshot:', file, error.message)
      }
    }

    briefings.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
    return briefings.slice(0, limit)
  }

  async getBriefing(briefingId) {
    await this.ensureStorage()
    const filePath = path.join(this.storageDir, `${briefingId}.json`)

    try {
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      return null
    }
  }

  async getLatestBriefing() {
    const list = await this.listBriefings(1)
    if (list.length === 0) return null
    return this.getBriefing(list[0].id)
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

    // Cache lookup
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

  async buildDataset(options = {}) {
    const now = new Date()
    const end = this.normalizeDate(options.date_range?.end) || now
    const initialStart = this.normalizeDate(options.date_range?.start) || new Date(end.getTime() - DEFAULT_DAYS * 24 * 60 * 60 * 1000)

    if (initialStart > end) {
      throw new Error('date_range.start must be before date_range.end')
    }

    const windowEnd = new Date(end)

    const windowCandidates = [
      DEFAULT_DAYS,
      14,
      21,
      30,
      45,
      60
    ]

    let chosenWindowDays = DEFAULT_DAYS
    let windowStart = new Date(initialStart)
    let currentUpdates = await this.fetchUpdates(windowStart, windowEnd)

    for (const days of windowCandidates) {
      if (currentUpdates.length >= 12) break
      chosenWindowDays = days
      windowStart = new Date(windowEnd.getTime() - days * 24 * 60 * 60 * 1000)
      if (windowStart < initialStart) windowStart = new Date(initialStart)
      currentUpdates = await this.fetchUpdates(windowStart, windowEnd)
    }

    if (currentUpdates.length === 0 && options.fallback_to_history !== false) {
      // As a last resort, pull from wider history window
      chosenWindowDays = HISTORY_WINDOW_DAYS
      windowStart = new Date(windowEnd.getTime() - chosenWindowDays * 24 * 60 * 60 * 1000)
      currentUpdates = await this.fetchUpdates(windowStart, windowEnd)
    }

    const filteredCurrent = this.filterByIds(currentUpdates, options.update_ids)

    const previousEnd = new Date(windowStart.getTime() - 1)
    const previousStart = new Date(previousEnd.getTime() - chosenWindowDays * 24 * 60 * 60 * 1000)
    const previousUpdates = await this.fetchUpdates(previousStart, previousEnd)

    const historyStart = new Date(windowEnd.getTime() - Math.max(HISTORY_WINDOW_DAYS, chosenWindowDays * 2) * 24 * 60 * 60 * 1000)
    const historyUpdates = await this.fetchUpdates(historyStart, windowEnd)

    const promptVersion = options.prompt_version || 'smart-briefing-v1'
    const firmContext = options.firm_context || {}

    const normalizedCurrent = filteredCurrent.map(update => this.normalizeUpdate(update))
    const normalizedPrevious = previousUpdates.map(update => this.normalizeUpdate(update))
    const normalizedHistory = historyUpdates.map(update => this.normalizeUpdate(update))

    const updateIndex = new Map(
      normalizedCurrent
        .filter(update => update.id !== undefined && update.id !== null)
        .map(update => [String(update.id), update])
    )

    const stats = this.buildStats(normalizedCurrent)
    const historyTimeline = this.buildHistoryTimeline(normalizedHistory)
    const highlightUpdates = this.selectHighlightUpdates(normalizedCurrent)

    let normalizedAnnotations = []
    let annotationInsights = this.buildAnnotationInsights([])
    if (options.include_annotations) {
      const visibilityFilter = Array.isArray(options.annotation_visibility)
        ? options.annotation_visibility
        : null

      const updateIds = filteredCurrent.map(update => update.id).filter(Boolean)
      const rawAnnotations = await annotationService.listAnnotations({
        updateIds,
        visibility: visibilityFilter && visibilityFilter.length > 0 ? visibilityFilter : null
      })

      normalizedAnnotations = this.normalizeAnnotations(rawAnnotations, updateIndex)
      annotationInsights = this.buildAnnotationInsights(normalizedAnnotations)
    }

    return {
      dateRange: {
        start: windowStart.toISOString(),
        end: windowEnd.toISOString()
      },
      currentUpdates: normalizedCurrent,
      previousUpdates: normalizedPrevious,
      historyUpdates: normalizedHistory,
      historyTimeline,
      stats,
      highlightUpdates,
      annotations: normalizedAnnotations,
      annotationInsights,
      includeAnnotations: Boolean(options.include_annotations),
      annotationVisibility: options.annotation_visibility || [],
      firmContext,
      promptVersion,
      samplingWindowDays: chosenWindowDays
    }
  }

  filterByIds(updates, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return updates
    }

    const idSet = new Set(ids.map(String))
    return updates.filter(update => idSet.has(String(update.id)))
  }

  async fetchUpdates(start, end) {
    const filters = {
      startDate: start,
      endDate: end,
      limit: 1000,
      sort: 'newest'
    }

    const updates = await dbService.getEnhancedUpdates(filters)
    return updates || []
  }

  normalizeUpdate(update) {
    return {
      id: update.id,
      title: update.headline || update.title || 'Untitled update',
      summary: update.summary || update.ai_summary || update.impact || '',
      authority: update.authority || 'Unknown',
      impact_level: update.impact_level || update.impactLevel || 'Informational',
      urgency: update.urgency || 'Low',
      business_impact_score: update.business_impact_score || update.businessImpactScore || null,
      sectors: this.collectSectors(update),
      tags: Array.isArray(update.ai_tags) ? update.ai_tags : [],
      published_date: this.normalizeDate(update.publishedDate || update.published_date || update.createdAt || update.fetchedDate)?.toISOString() || null,
      url: update.url || null,
      jurisdiction: update.jurisdiction || update.region || null,
      source: update.source || update.source_name || null,
      data_source: update.data_source || null,
      compliance_deadline: update.compliance_deadline || update.complianceDeadline || null
    }
  }

  collectSectors(update) {
    const sectors = new Set()

    if (Array.isArray(update.firm_types_affected)) {
      update.firm_types_affected.forEach(value => sectors.add(value))
    }

    if (Array.isArray(update.primarySectors)) {
      update.primarySectors.forEach(value => sectors.add(value))
    }

    if (Array.isArray(update.primary_sectors)) {
      update.primary_sectors.forEach(value => sectors.add(value))
    }

    if (update.sector) {
      sectors.add(update.sector)
    }

    if (update.sector_relevance_scores) {
      Object.entries(update.sector_relevance_scores).forEach(([sector, score]) => {
        if (typeof score === 'number' && score >= 50) {
          sectors.add(sector)
        }
      })
    }

    return Array.from(sectors)
  }

  normalizeAnnotations(annotations, updateIndex) {
    if (!Array.isArray(annotations) || annotations.length === 0) {
      return []
    }

    const toIsoString = value => {
      if (!value) return null
      const parsed = new Date(value)
      return isNaN(parsed) ? null : parsed.toISOString()
    }

    return annotations.map(annotation => {
      const update = updateIndex.get(String(annotation.update_id))
      const context = annotation.context && typeof annotation.context === 'object'
        ? annotation.context
        : (annotation.context || null)

      return {
        id: annotation.note_id,
        updateId: annotation.update_id,
        author: annotation.author || 'unknown',
        visibility: annotation.visibility || 'team',
        status: annotation.status || 'pending',
        content: annotation.content || '',
        tags: Array.isArray(annotation.tags) ? annotation.tags : [],
        assignedTo: Array.isArray(annotation.assigned_to) ? annotation.assigned_to : [],
        linkedResources: Array.isArray(annotation.linked_resources) ? annotation.linked_resources : [],
        persona: annotation.persona || null,
        originPage: annotation.origin_page || null,
        actionType: annotation.action_type || null,
        priority: annotation.priority || null,
        reportIncluded: Boolean(annotation.report_included),
        context,
        createdAt: toIsoString(annotation.created_at || annotation.createdAt),
        updatedAt: toIsoString(annotation.updated_at || annotation.updatedAt),
        update: update
          ? {
              id: update.id,
              title: update.title,
              authority: update.authority,
              impact_level: update.impact_level,
              urgency: update.urgency,
              published_date: update.published_date,
              url: update.url
            }
          : null
      }
    }).sort((a, b) => {
      const aDate = a.updatedAt || a.createdAt || ''
      const bDate = b.updatedAt || b.createdAt || ''
      return bDate.localeCompare(aDate)
    })
  }

  buildAnnotationInsights(annotations) {
    const totals = {
      all: annotations.length,
      flagged: 0,
      assignments: 0,
      tasks: 0,
      notes: 0
    }

    const byPersona = {}
    const byOrigin = {}
    const flagged = []
    const assignments = []
    const tasks = []
    const notes = []
    const reportCandidates = []

    const addPersonaCount = persona => {
      const key = persona || 'unspecified'
      byPersona[key] = (byPersona[key] || 0) + 1
    }

    const addOriginCount = origin => {
      const key = origin || 'unknown'
      byOrigin[key] = (byOrigin[key] || 0) + 1
    }

    const baseSummary = annotation => ({
      updateId: annotation.updateId,
      title: annotation.update?.title || null,
      authority: annotation.update?.authority || null,
      persona: annotation.persona || null,
      originPage: annotation.originPage || null,
      status: annotation.status || null,
      priority: annotation.priority || null,
      content: annotation.content,
      author: annotation.author,
      reportIncluded: annotation.reportIncluded,
      updatedAt: annotation.updatedAt,
      createdAt: annotation.createdAt
    })

    annotations.forEach(annotation => {
      addPersonaCount(annotation.persona)
      addOriginCount(annotation.originPage)

      const actionType = (annotation.actionType || '').toLowerCase()

      if (annotation.reportIncluded) {
        reportCandidates.push({
          ...baseSummary(annotation),
          actionType
        })
      }

      if (actionType === 'flag') {
        totals.flagged += 1
        flagged.push({
          ...baseSummary(annotation)
        })
        return
      }

      if (actionType === 'assign') {
        totals.assignments += 1
        assignments.push({
          ...baseSummary(annotation),
          assignedTo: annotation.assignedTo
        })
        return
      }

      if (actionType === 'task') {
        totals.tasks += 1
        const context = annotation.context && typeof annotation.context === 'object'
          ? annotation.context
          : {}
        tasks.push({
          ...baseSummary(annotation),
          assignedTo: annotation.assignedTo,
          dueDate: context.due_date || null
        })
        return
      }

      totals.notes += 1
      notes.push({
        ...baseSummary(annotation)
      })
    })

    const latestNotes = notes
      .slice()
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
      .slice(0, 5)

    return {
      totals,
      byPersona,
      byOrigin,
      flagged,
      assignments,
      tasks,
      latestNotes,
      reportCandidates
    }
  }

  buildStats(updates) {
    const byAuthority = {}
    const byImpact = { Significant: 0, Moderate: 0, Informational: 0 }
    const bySector = {}

    updates.forEach(update => {
      const authority = update.authority || 'Unknown'
      byAuthority[authority] = (byAuthority[authority] || 0) + 1

      const impact = this.normalizeImpact(update.impact_level)
      byImpact[impact] = (byImpact[impact] || 0) + 1

      if (Array.isArray(update.sectors)) {
        update.sectors.forEach(sector => {
          if (!sector) return
          bySector[sector] = (bySector[sector] || 0) + 1
        })
      }
    })

    return {
      totalUpdates: updates.length,
      byAuthority: Object.entries(byAuthority)
        .map(([authority, count]) => ({ authority, count }))
        .sort((a, b) => b.count - a.count),
      byImpact,
      bySector: Object.entries(bySector)
        .map(([sector, count]) => ({ sector, count }))
        .sort((a, b) => b.count - a.count)
    }
  }

  buildHistoryTimeline(historyUpdates) {
    const grouped = {}

    historyUpdates.forEach(update => {
      const rawDate = update.published_date || update.publishedDate || update.createdAt || update.fetchedDate
      if (!rawDate) return
      const parsed = this.normalizeDate(rawDate)
      if (!parsed) return
      const date = parsed.toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + 1
    })

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  selectHighlightUpdates(updates = []) {
    if (!Array.isArray(updates) || updates.length === 0) return []

    const scored = updates.map(update => {
      const priority = impactPriority(update.impact_level)
      const score = toNumber(update.business_impact_score, 0)
      const published = parseDate(update.published_date)
      const timestamp = published ? published.getTime() : 0
      return { update, priority, score, timestamp }
    })

    scored.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      if (b.score !== a.score) return b.score - a.score
      return b.timestamp - a.timestamp
    })

    const seen = new Set()
    const highlights = []

    const pushIfNew = (entry) => {
      const source = entry.update
      const key = source.id !== undefined && source.id !== null
        ? `id:${source.id}`
        : source.url
          ? `url:${source.url}`
          : `hash:${JSON.stringify([source.title, source.published_date])}`
      if (!seen.has(key)) {
        seen.add(key)
        highlights.push(source)
      }
    }

    scored.forEach(entry => {
      if (entry.priority === 3 && highlights.length < MAX_FLAGGED_ITEMS) {
        pushIfNew(entry)
      }
    })

    if (highlights.length === 0) {
      scored.slice(0, Math.min(MAX_FLAGGED_ITEMS, scored.length)).forEach(pushIfNew)
    }

    return highlights.slice(0, MAX_FLAGGED_ITEMS)
  }

  normalizeImpact(value) {
    const normalized = (value || '').toString().toLowerCase()
    if (normalized.includes('significant') || normalized.includes('high')) return 'Significant'
    if (normalized.includes('moderate') || normalized.includes('medium')) return 'Moderate'
    return 'Informational'
  }

  normalizeDate(value) {
    if (!value) return null
    if (value instanceof Date) {
      return isNaN(value) ? null : value
    }
    const parsed = new Date(value)
    return isNaN(parsed) ? null : parsed
  }

  computeHash(payload) {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(payload))
    return hash.digest('hex')
  }

  async findCachedBriefing(datasetHash) {
    const briefings = await this.listBriefings(50)
    for (const item of briefings) {
      if (item.metadata?.datasetHash === datasetHash) {
        const briefing = await this.getBriefing(item.id)
        if (briefing) {
          return briefing
        }
      }
    }
    return null
  }

  async generateArtifacts(dataset) {
    if (!this.apiKey) {
      console.warn('OPENROUTER_API_KEY not configured. Falling back to template artifacts.')
      return {
        artifacts: this.createFallbackArtifacts(dataset),
        usageMetrics: {
          totalTokens: 0,
          requests: []
        }
      }
    }

    const payload = this.buildPromptPayload(dataset)

    const results = await Promise.all([
      this.callOpenRouter({
        system: this.buildNarrativeSystemPrompt(dataset),
        user: this.buildNarrativeUserPrompt(payload),
        temperature: 0.7
      }).catch(error => {
        console.error('Narrative generation failed:', error.message)
        return {
          content: this.buildFallbackNarrative(dataset),
          usage: null,
          model: 'fallback'
        }
      }),
      this.callOpenRouter({
        system: this.buildChangeDetectionSystemPrompt(),
        user: this.buildChangeDetectionUserPrompt(payload),
        temperature: 0.3,
        expectJson: true
      }).catch(error => {
        console.error('Change detection failed:', error.message)
        return {
          content: this.buildFallbackChangeDetection(dataset),
          usage: null,
          model: 'fallback'
        }
      }),
      this.callOpenRouter({
        system: this.buildOnePagerSystemPrompt(dataset),
        user: this.buildOnePagerUserPrompt(payload),
        temperature: 0.4
      }).catch(error => {
        console.error('One-pager generation failed:', error.message)
        return {
          content: this.buildFallbackOnePager(dataset),
          usage: null,
          model: 'fallback'
        }
      }),
      this.callOpenRouter({
        system: this.buildTeamBriefingSystemPrompt(dataset),
        user: this.buildTeamBriefingUserPrompt(payload),
        temperature: 0.5
      }).catch(error => {
        console.error('Team briefing generation failed:', error.message)
        return {
          content: this.buildFallbackTeamBriefing(dataset),
          usage: null,
          model: 'fallback'
        }
      })
    ])

    const usageRecords = results
      .map(result => ({ model: result.model, usage: result.usage }))
      .filter(entry => entry.usage)

    const totalTokens = usageRecords.reduce((sum, entry) => sum + (entry.usage.total_tokens || 0), 0)

    return {
      artifacts: {
        narrative: results[0].content,
        changeDetection: results[1].content,
        onePager: results[2].content,
        teamBriefing: results[3].content
      },
      usageMetrics: {
        totalTokens,
        requests: usageRecords
      }
    }
  }

  buildPromptPayload(dataset) {
    return {
      currentWeek: dataset.currentUpdates,
      previousWeek: dataset.previousUpdates,
      history: dataset.historyUpdates,
      historyTimeline: dataset.historyTimeline,
      stats: dataset.stats,
      annotations: dataset.annotations,
      annotationInsights: dataset.annotationInsights,
      firmContext: dataset.firmContext || {}
    }
  }

  buildNarrativeSystemPrompt(dataset) {
    const firmContext = dataset.firmContext || {}
    const contextParts = []
    if (firmContext.sectors) contextParts.push(`Sectors: ${firmContext.sectors.join(', ')}`)
    if (firmContext.jurisdictions) contextParts.push(`Jurisdictions: ${firmContext.jurisdictions.join(', ')}`)
    if (firmContext.strategic_priorities) contextParts.push(`Priorities: ${firmContext.strategic_priorities.join(', ')}`)

    return [
      'You are the Smart Briefing narrator for Horizon Scanner.',
      'Audience: senior compliance executives. Tone: conversational, analytical, confident.',
      contextParts.length ? `Firm context: ${contextParts.join('; ')}` : 'Firm context: global financial services.',
      'Deliver a flowing narrative, not bullet points. Follow the requested structure exactly.'
    ].join(' ')
  }

  buildNarrativeUserPrompt(payload) {
    return [
      'Analyze the supplied regulatory updates and craft the executive briefing.',
      'Structure the response with clear section headings:',
      '1. Why This Week Matters (2–3 sentences).',
      '2. The Big Picture (connect disparate updates).',
      '3. What Changed Since Last Week (highlight deltas).',
      '4. Key Storylines (3–4 narrative paragraphs linking related updates).',
      '5. Looking Ahead (forward-looking insight).',
      'Write in paragraphs. Reference authorities and sectors inline.',
      'Do not include bullet lists or numbered lists in the output.',
      'Data for analysis follows as JSON.',
      JSON.stringify({
        currentWeek: payload.currentWeek,
        previousWeek: payload.previousWeek,
        history: payload.history,
        firmContext: payload.firmContext,
        stats: payload.stats
      })
    ].join('\n')
  }

  buildChangeDetectionSystemPrompt() {
    return 'You analyze week-over-week regulatory changes. Reply with strict JSON only. Format your response as valid JSON without any markdown code blocks or additional text.'
  }

  buildChangeDetectionUserPrompt(payload) {
    return JSON.stringify({
      instruction: 'Compare current week and previous week updates. Populate arrays for new_themes, accelerating, resolving, shifting_focus, correlations. Each item requires topic, evidence (array of update ids), summary, confidence (0-1), and optional notes.',
      currentWeek: payload.currentWeek,
      previousWeek: payload.previousWeek,
      historyTimeline: payload.historyTimeline,
      stats: payload.stats
    })
  }

  buildOnePagerSystemPrompt(dataset) {
    const firm = dataset.firmContext || {}
    return [
      'You draft executive one-pagers for compliance leadership.',
      'Keep content concise, professional, and insight-led.',
      firm.sectors ? `Focus on sectors: ${firm.sectors.join(', ')}.` : '',
      firm.jurisdictions ? `Consider jurisdictions: ${firm.jurisdictions.join(', ')}.` : ''
    ].filter(Boolean).join(' ')
  }

  buildOnePagerUserPrompt(payload) {
    return [
      'Create a one-page executive brief with the following sections:',
      'Executive Summary (max 2 sentences).',
      'Critical Actions Required (max 3 bullet points).',
      'Key Regulatory Developments (group by impact).',
      'Business Implications (tailored to firm context).',
      'Recommended Next Steps (prioritized list).',
      'Use concise sentences, bold key phrases, and keep tone decisive.',
      'Source material:',
      JSON.stringify(payload)
    ].join('\n')
  }

  buildTeamBriefingSystemPrompt(dataset) {
    return [
      'You create detailed team briefings for compliance analysts.',
      'Capture discussion points, questions, resource needs, and timelines.',
      dataset.firmContext?.departments ? `Prioritize departments: ${dataset.firmContext.departments.join(', ')}.` : ''
    ].filter(Boolean).join(' ')
  }

  buildTeamBriefingUserPrompt(payload) {
    return [
      'Generate a team briefing incorporating updates, annotations, and statuses.',
      'Surface the latest flagged items, assignments, and open tasks from annotationInsights with clear owners and next steps.',
      'Include sections: Discussion Points, Questions to Investigate, Resource Requirements, Response Timeline.',
      'Reference update IDs where relevant. Maintain clear subheadings and bullet lists for readability.',
      'Source material:',
      JSON.stringify(payload)
    ].join('\n')
  }

  async callOpenRouter({ system, user, temperature = 0.7, expectJson = false, retries = 3 }) {
    const payload = {
      model: this.model,
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      max_tokens: 2000 // Add max_tokens to control costs and prevent timeouts
    }

    // Note: Not all models support response_format, so we'll skip it for free models
    // and handle JSON parsing in the response instead
    // if (expectJson) {
    //   payload.response_format = { type: 'json_object' }
    // }

    let lastError
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(this.endpoint, payload, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Horizon Scanner Smart Briefing'
          },
          timeout: 60000
        })

        const outputModel = response.data?.model || this.model
        const usage = response.data?.usage || null
        const message = response.data?.choices?.[0]?.message?.content
        if (!message) {
          throw new Error('No content returned from OpenRouter')
        }

        if (expectJson) {
          try {
            // Try to extract JSON from the message, handling potential markdown code blocks
            let jsonStr = message.trim()
            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
            const parsed = JSON.parse(jsonStr)
            return {
              content: parsed,
              usage,
              model: outputModel
            }
          } catch (error) {
            console.warn('Failed to parse JSON response from OpenRouter, returning fallback')
            throw new Error('Failed to parse JSON response from OpenRouter')
          }
        }

        return {
          content: message.trim(),
          usage,
          model: outputModel
        }
      } catch (error) {
        lastError = error
        console.error(`OpenRouter attempt ${attempt}/${retries} failed:`)
        console.error('Status:', error.response?.status)
        console.error('Error:', error.response?.data || error.message)
        console.error('Model:', this.model)

        // If rate limited, wait before retrying
        if (error.response?.status === 429 && attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
          console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else if (attempt < retries) {
          // Short delay between retries for other errors
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    throw lastError
  }

  buildFallbackNarrative(dataset) {
    const highlights = Array.isArray(dataset.highlightUpdates) && dataset.highlightUpdates.length > 0
      ? dataset.highlightUpdates
      : dataset.currentUpdates

    const storyItems = highlights.slice(0, 3).map(item => {
      const summary = truncateText(item.summary || item.title || '', 180)
      return `<li><strong>${escapeHtml(item.authority || 'Unknown')}</strong> — ${escapeHtml(summary)}</li>`
    })

    const coverage = `We monitored ${dataset.stats.totalUpdates} updates across ${dataset.stats.byAuthority.length} authorities in the last ${dataset.samplingWindowDays || DEFAULT_DAYS} days.`
    const headline = dataset.stats.byImpact.Significant || 0
    const authorityLeaders = dataset.stats.byAuthority.slice(0, 3).map(entry => `<span class="metric-chip">${escapeHtml(entry.authority)}: ${entry.count}</span>`).join(' ')

    return [
      '<section class="briefing-section">',
      '<h4>Week&rsquo;s Story</h4>',
      buildList(storyItems),
      '</section>',
      '<section class="briefing-section">',
      '<h4>Regulatory Pulse</h4>',
      `<p>${escapeHtml(coverage)} There were <strong>${escapeHtml(String(headline))}</strong> high-impact notices requiring rapid triage.</p>`,
      authorityLeaders ? `<p class="chip-row">${authorityLeaders}</p>` : '',
      '</section>',
      '<section class="briefing-section">',
      '<h4>Outlook</h4>',
      '<p>Expect follow-up guidance on resilience, consumer outcomes, and enforcement transparency as authorities continue to coordinate cross-market actions.</p>',
      '</section>'
    ].join('')
  }

  buildFallbackChangeDetection(dataset) {
    return {
      new_themes: [],
      accelerating: [],
      resolving: [],
      shifting_focus: [],
      correlations: []
    }
  }

  buildFallbackOnePager(dataset) {
    const total = dataset.stats.totalUpdates
    const significant = dataset.stats.byImpact.Significant || 0
    const highlights = Array.isArray(dataset.highlightUpdates) ? dataset.highlightUpdates.slice(0, 3) : []

    const developmentItems = highlights.map(item => `<li><strong>${escapeHtml(item.authority || 'Unknown')}</strong>: ${escapeHtml(truncateText(item.summary || item.title || '', 160))}</li>`)

    return [
      '<section class="one-pager">',
      '<h4>Executive Summary</h4>',
      `<p>Monitored ${escapeHtml(String(total))} updates this cycle, including <strong>${escapeHtml(String(significant))}</strong> high-impact notices requiring immediate review.</p>`,
      '<h4>Critical Actions</h4>',
      '<ul>',
      '<li>Validate readiness against the latest resilience and operational risk expectations.</li>',
      '<li>Brief senior stakeholders on emerging enforcement patterns in capital markets and payments.</li>',
      '<li>Confirm ownership for open consultations and upcoming submission deadlines.</li>',
      '</ul>',
      '<h4>Key Regulatory Developments</h4>',
      buildList(developmentItems.length ? developmentItems : ['<li>Authorities maintained routine cadence with no single driver dominating the agenda.</li>']),
      '<h4>Business Implications</h4>',
      '<p>Stress-test incident response playbooks, review customer communications for clarity, and align programme funding with heightened supervisory expectations.</p>',
      '<h4>Recommended Next Steps</h4>',
      '<ul>',
      '<li>Prioritise executive briefings covering high-impact enforcement themes.</li>',
      '<li>Track outstanding consultations and allocate drafting support.</li>',
      '<li>Calibrate monitoring for additional sanctions and consumer protection triggers.</li>',
      '</ul>',
      '</section>'
    ].join('')
  }

  buildFallbackTeamBriefing(dataset) {
    const flagged = dataset.annotationInsights?.totals?.flagged || 0
    const assignments = dataset.annotationInsights?.totals?.assignments || 0
    const tasks = dataset.annotationInsights?.totals?.tasks || 0

    return [
      '<section class="team-briefing">',
      '<h4>Discussion Points</h4>',
      '<ul>',
      `<li>Review the ${escapeHtml(String(dataset.stats.byImpact.Significant || 0))} significant updates and confirm owners.</li>`,
      `<li>${flagged ? `Prioritise the ${escapeHtml(String(flagged))} flagged items surfaced in the Intelligence Center.` : 'Review flagged items surfaced in the Intelligence Center and confirm their positioning.'}</li>`,
      '<li>Assess overlap between enforcement activity and open consultations.</li>',
      '</ul>',
      '<h4>Questions to Investigate</h4>',
      '<ul>',
      '<li>Which controls address the resilience themes highlighted by supervisors?</li>',
      '<li>Do consumer protection updates require near-term policy adjustments?</li>',
      '</ul>',
      '<h4>Resource Requirements</h4>',
      '<ul>',
      `<li>${assignments ? `Confirm owners for ${escapeHtml(String(assignments))} newly assigned actions.` : 'Confirm owners for any newly assigned actions.'}</li>`,
      `<li>${tasks ? `Validate due dates for ${escapeHtml(String(tasks))} open follow-up tasks.` : 'Validate due dates for open follow-up tasks.'}</li>`,
      '<li>Coordinate between compliance monitoring, legal, and operational risk teams.</li>',
      '</ul>',
      '<h4>Response Timeline</h4>',
      '<ul>',
      '<li>Complete impact triage within two working days.</li>',
      '<li>Prepare leadership briefing materials ahead of the next governance forum.</li>',
      '</ul>',
      '</section>'
    ].join('')
  }

  createFallbackArtifacts(dataset) {
    return {
      narrative: this.buildFallbackNarrative(dataset),
      changeDetection: this.buildFallbackChangeDetection(dataset),
      onePager: this.buildFallbackOnePager(dataset),
      teamBriefing: this.buildFallbackTeamBriefing(dataset)
    }
  }

  async saveBriefing(briefing) {
    await this.ensureStorage()
    const filePath = path.join(this.storageDir, `${briefing.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(briefing, null, 2), 'utf8')
  }

  async recordMetrics(entry) {
    try {
      const metrics = await this.loadMetrics()
      const record = {
        runId: entry.runId,
        briefingId: entry.briefingId,
        datasetHash: entry.datasetHash,
        cacheHit: Boolean(entry.cacheHit),
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        durationMs: entry.durationMs || (entry.startedAt && entry.completedAt
          ? Date.parse(entry.completedAt) - Date.parse(entry.startedAt)
          : null),
        usage: entry.usage || null,
        totals: {
          currentUpdates: entry.dataset?.currentUpdates?.length || 0,
          annotations: entry.dataset?.annotations?.length || 0
        }
      }

      metrics.history.unshift(record)
      metrics.history = metrics.history.slice(0, 50)

      metrics.lastRun = record
      metrics.totals.runs += 1
      if (record.cacheHit) {
        metrics.totals.cacheHits += 1
      }
      if (record.usage?.totalTokens) {
        metrics.totals.totalTokens += record.usage.totalTokens
      }

      await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2), 'utf8')
    } catch (error) {
      console.warn('Failed to record smart briefing metrics:', error.message)
    }
  }

  async loadMetrics() {
    try {
      await fs.access(metricsFile)
    } catch (_) {
      await fs.mkdir(path.dirname(metricsFile), { recursive: true })
      await fs.writeFile(metricsFile, JSON.stringify({
        totals: {
          runs: 0,
          cacheHits: 0,
          totalTokens: 0
        },
        lastRun: null,
        history: []
      }, null, 2), 'utf8')
    }

    try {
      const content = await fs.readFile(metricsFile, 'utf8')
      const metrics = JSON.parse(content)
      if (metrics && typeof metrics === 'object') {
        return {
          totals: metrics.totals || { runs: 0, cacheHits: 0, totalTokens: 0 },
          lastRun: metrics.lastRun || null,
          history: Array.isArray(metrics.history) ? metrics.history : []
        }
      }
    } catch (error) {
      console.warn('Failed to parse smart briefing metrics file:', error.message)
    }

    return {
      totals: {
        runs: 0,
        cacheHits: 0,
        totalTokens: 0
      },
      lastRun: null,
      history: []
    }
  }

  async getMetricsSummary() {
    return this.loadMetrics()
  }
}

module.exports = new SmartBriefingService()
