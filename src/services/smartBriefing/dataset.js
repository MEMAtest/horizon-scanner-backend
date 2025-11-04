const dbService = require('../dbService')
const annotationService = require('../annotationService')

const {
  DEFAULT_DAYS,
  HISTORY_WINDOW_DAYS,
  MAX_FLAGGED_ITEMS
} = require('./constants')

const {
  impactPriority,
  parseDate,
  toNumber
} = require('./helpers')

function applyDatasetMethods(ServiceClass) {
  ServiceClass.prototype.buildDataset = async function(options = {}) {
    const now = new Date()
    const end = this.normalizeDate(options.date_range?.end) || now
    const initialStart = this.normalizeDate(options.date_range?.start) || new Date(
      end.getTime() - DEFAULT_DAYS * 24 * 60 * 60 * 1000
    )

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
      chosenWindowDays = HISTORY_WINDOW_DAYS
      windowStart = new Date(windowEnd.getTime() - chosenWindowDays * 24 * 60 * 60 * 1000)
      currentUpdates = await this.fetchUpdates(windowStart, windowEnd)
    }

    const filteredCurrent = this.filterByIds(currentUpdates, options.update_ids)

    const previousEnd = new Date(windowStart.getTime() - 1)
    const previousStart = new Date(previousEnd.getTime() - chosenWindowDays * 24 * 60 * 60 * 1000)
    const previousUpdates = await this.fetchUpdates(previousStart, previousEnd)

    const historyStart = new Date(
      windowEnd.getTime() - Math.max(HISTORY_WINDOW_DAYS, chosenWindowDays * 2) * 24 * 60 * 60 * 1000
    )
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

  ServiceClass.prototype.filterByIds = function(updates, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return updates
    }

    const idSet = new Set(ids.map(String))
    return updates.filter(update => idSet.has(String(update.id)))
  }

  ServiceClass.prototype.fetchUpdates = async function(start, end) {
    const filters = {
      startDate: start,
      endDate: end,
      limit: 1000,
      sort: 'newest'
    }

    const updates = await dbService.getEnhancedUpdates(filters)
    return updates || []
  }

  ServiceClass.prototype.normalizeUpdate = function(update) {
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
      published_date: this.normalizeDate(
        update.publishedDate || update.published_date || update.createdAt || update.fetchedDate
      )?.toISOString() || null,
      url: update.url || null,
      jurisdiction: update.jurisdiction || update.region || null,
      source: update.source || update.source_name || null,
      data_source: update.data_source || null,
      compliance_deadline: update.compliance_deadline || update.complianceDeadline || null
    }
  }

  ServiceClass.prototype.collectSectors = function(update) {
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

  ServiceClass.prototype.normalizeAnnotations = function(annotations, updateIndex) {
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

  ServiceClass.prototype.buildAnnotationInsights = function(annotations) {
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

  ServiceClass.prototype.buildStats = function(updates) {
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

  ServiceClass.prototype.buildHistoryTimeline = function(historyUpdates) {
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

  ServiceClass.prototype.selectHighlightUpdates = function(updates = []) {
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

  ServiceClass.prototype.normalizeImpact = function(value) {
    const normalized = (value || '').toString().toLowerCase()
    if (normalized.includes('significant') || normalized.includes('high')) return 'Significant'
    if (normalized.includes('moderate') || normalized.includes('medium')) return 'Moderate'
    return 'Informational'
  }

  ServiceClass.prototype.normalizeDate = function(value) {
    if (!value) return null
    if (value instanceof Date) {
      return isNaN(value) ? null : value
    }
    const parsed = new Date(value)
    return isNaN(parsed) ? null : parsed
  }
}

module.exports = applyDatasetMethods
