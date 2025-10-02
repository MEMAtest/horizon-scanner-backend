// src/services/deadlineIntelligenceService.js
// Deadline Intelligence Service - Predicts upcoming regulatory activity and deadlines
// Phase 3: AI Intelligence Engine

const EventEmitter = require('events')
const dbService = require('./dbService')
const AIPromptTemplates = require('../ai/promptTemplates')

class DeadlineIntelligenceService extends EventEmitter {
  constructor(aiIntelligenceService) {
    super()
    this.aiService = aiIntelligenceService
    this.promptTemplates = new AIPromptTemplates()

    // Deadline intelligence configuration
    this.config = {
      predictionWindow: 365, // days ahead
      consultationPeriods: {
        standard: 90, // days
        shortened: 30,
        extended: 180
      },
      deadlineTypes: [
        'consultation_response', 'implementation', 'compliance',
        'reporting', 'transition', 'review', 'publication'
      ],
      urgencyThresholds: {
        critical: 7, // days
        urgent: 14,
        important: 30,
        standard: 90
      },
      monitoringInterval: 3600000, // 1 hour
      predictionConfidenceThreshold: 60
    }

    // Deadline tracking data structures
    this.trackedDeadlines = new Map()
    this.predictedEvents = new Map()
    this.consultationPatterns = new Map()

    // Authority deadline patterns
    this.authorityPatterns = this.initializeAuthorityPatterns()

    // Initialize deadline monitoring
    this.initializeDeadlineMonitoring()

    console.log('⏰ Deadline Intelligence Service initialized')
  }

  // MAIN DEADLINE EXTRACTION ORCHESTRATOR
  async extractDeadlines(updateData, contentAnalysis) {
    console.log(`📅 Extracting deadline intelligence for update: ${updateData.id}`)

    try {
      // Extract explicit deadlines from content
      const explicitDeadlines = await this.extractExplicitDeadlines(updateData, contentAnalysis)

      // Predict implicit deadlines using AI
      const predictedDeadlines = await this.predictImplicitDeadlines(updateData, contentAnalysis)

      // Identify consultation periods
      const consultationPeriods = await this.identifyConsultationPeriods(updateData, contentAnalysis)

      // Predict follow-up regulatory activity
      const followUpActivity = await this.predictFollowUpActivity(updateData, contentAnalysis)

      // Calculate implementation phases
      const implementationPhases = await this.calculateImplementationPhases(contentAnalysis)

      // Assess deadline criticality
      const criticalityAssessment = this.assessDeadlineCriticality(
        explicitDeadlines,
        predictedDeadlines,
        contentAnalysis
      )

      // Generate deadline recommendations
      const recommendations = this.generateDeadlineRecommendations(
        explicitDeadlines,
        predictedDeadlines,
        consultationPeriods,
        contentAnalysis
      )

      // Combine all deadline intelligence
      const deadlineIntelligence = {
        timestamp: new Date().toISOString(),
        updateId: updateData.id,
        explicitDeadlines,
        predictedDeadlines,
        consultationPeriods,
        followUpActivity,
        implementationPhases,
        criticalityAssessment,
        recommendations,
        confidence: this.calculateDeadlineConfidence(explicitDeadlines, predictedDeadlines),
        nextReview: this.calculateNextReviewDate(explicitDeadlines, predictedDeadlines)
      }

      // Store deadline intelligence
      await this.storeDeadlineIntelligence(updateData.id, deadlineIntelligence)

      // Update deadline tracking
      await this.updateDeadlineTracking(deadlineIntelligence)

      // Emit deadline events
      this.emitDeadlineEvents(updateData, deadlineIntelligence)

      console.log(`✅ Deadline intelligence extraction completed for update: ${updateData.id}`)
      return deadlineIntelligence
    } catch (error) {
      console.error(`❌ Deadline intelligence extraction failed for update ${updateData.id}:`, error.message)
      return this.createFallbackDeadlineIntelligence(updateData, contentAnalysis)
    }
  }

  // EXPLICIT DEADLINE EXTRACTION
  async extractExplicitDeadlines(updateData, contentAnalysis) {
    const explicitDeadlines = []
    const content = `${updateData.title} ${updateData.description || ''} ${updateData.content || ''}`

    try {
      // AI-powered deadline extraction
      const aiDeadlines = await this.extractDeadlinesWithAI(content, updateData.authority)

      // Pattern-based deadline extraction
      const patternDeadlines = this.extractDeadlinesWithPatterns(content)

      // Combine and deduplicate
      const combinedDeadlines = this.combineAndDeduplicateDeadlines(aiDeadlines, patternDeadlines)

      // Validate and enrich deadlines
      for (const deadline of combinedDeadlines) {
        const enrichedDeadline = await this.enrichDeadline(deadline, updateData, contentAnalysis)
        if (this.validateDeadline(enrichedDeadline)) {
          explicitDeadlines.push(enrichedDeadline)
        }
      }

      return explicitDeadlines
    } catch (error) {
      console.error('Explicit deadline extraction failed:', error.message)
      return []
    }
  }

  // AI-POWERED DEADLINE EXTRACTION
  async extractDeadlinesWithAI(content, authority) {
    try {
      const existingDeadlines = await this.getExistingDeadlines()
      const prompt = this.promptTemplates.createDeadlineIntelligencePrompt(content, existingDeadlines)

      const response = await this.aiService.makeGroqRequest(prompt)
      const deadlineAnalysis = this.aiService.parseAIResponse(response)

      return deadlineAnalysis.explicitDeadlines || []
    } catch (error) {
      console.error('AI deadline extraction failed:', error.message)
      return []
    }
  }

  // PATTERN-BASED DEADLINE EXTRACTION
  extractDeadlinesWithPatterns(content) {
    const deadlines = []
    const patterns = this.getDeadlinePatterns()

    for (const pattern of patterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        for (const match of matches) {
          const deadline = this.parseDeadlineFromMatch(match, pattern)
          if (deadline) {
            deadlines.push(deadline)
          }
        }
      }
    }

    return deadlines
  }

  // IMPLICIT DEADLINE PREDICTION
  async predictImplicitDeadlines(updateData, contentAnalysis) {
    const predictedDeadlines = []

    try {
      // Authority-based predictions
      const authorityPredictions = await this.predictAuthorityBasedDeadlines(updateData, contentAnalysis)
      predictedDeadlines.push(...authorityPredictions)

      // Document type-based predictions
      const documentTypePredictions = this.predictDocumentTypeBasedDeadlines(updateData, contentAnalysis)
      predictedDeadlines.push(...documentTypePredictions)

      // Historical pattern-based predictions
      const historicalPredictions = await this.predictHistoricalPatternBasedDeadlines(updateData, contentAnalysis)
      predictedDeadlines.push(...historicalPredictions)

      // Regulatory cycle-based predictions
      const cyclePredictions = this.predictRegulatoryyCycleBasedDeadlines(updateData, contentAnalysis)
      predictedDeadlines.push(...cyclePredictions)

      return predictedDeadlines
    } catch (error) {
      console.error('Implicit deadline prediction failed:', error.message)
      return []
    }
  }

  // CONSULTATION PERIOD IDENTIFICATION
  async identifyConsultationPeriods(updateData, contentAnalysis) {
    const consultationPeriods = []

    try {
      // Check if this is a consultation
      if (this.isConsultationDocument(updateData, contentAnalysis)) {
        const consultation = await this.analyzeConsultationPeriod(updateData, contentAnalysis)
        consultationPeriods.push(consultation)
      }

      // Predict future consultations
      const futureConsultations = await this.predictFutureConsultations(updateData, contentAnalysis)
      consultationPeriods.push(...futureConsultations)

      return consultationPeriods
    } catch (error) {
      console.error('Consultation period identification failed:', error.message)
      return []
    }
  }

  // FOLLOW-UP ACTIVITY PREDICTION
  async predictFollowUpActivity(updateData, contentAnalysis) {
    const followUpActivities = []

    try {
      const documentType = this.detectDocumentType(updateData)
      const authority = updateData.authority

      // Get authority follow-up patterns
      const authorityPattern = this.authorityPatterns[authority]

      if (authorityPattern && authorityPattern.followUpPatterns[documentType]) {
        const patterns = authorityPattern.followUpPatterns[documentType]

        for (const pattern of patterns) {
          const predictedActivity = {
            type: pattern.nextActivityType,
            estimatedDate: this.calculateEstimatedDate(updateData.pubDate, pattern.averageDelay),
            confidence: pattern.confidence,
            description: pattern.description,
            probability: pattern.probability
          }

          followUpActivities.push(predictedActivity)
        }
      }

      // AI-based follow-up prediction
      const aiFollowUps = await this.predictFollowUpWithAI(updateData, contentAnalysis)
      followUpActivities.push(...aiFollowUps)

      return followUpActivities
    } catch (error) {
      console.error('Follow-up activity prediction failed:', error.message)
      return []
    }
  }

  // IMPLEMENTATION PHASE CALCULATION
  async calculateImplementationPhases(contentAnalysis) {
    const phases = []

    try {
      const impactLevel = contentAnalysis.impactLevel || 'Moderate'
      const area = contentAnalysis.area || 'General'

      // Standard implementation phases
      const phaseTemplates = this.getImplementationPhaseTemplates(impactLevel, area)

      let currentDate = new Date()

      for (const template of phaseTemplates) {
        const phase = {
          name: template.name,
          description: template.description,
          estimatedStartDate: new Date(currentDate),
          estimatedDuration: template.duration,
          estimatedEndDate: new Date(currentDate.getTime() + (template.duration * 24 * 60 * 60 * 1000)),
          dependencies: template.dependencies,
          deliverables: template.deliverables,
          riskFactors: template.riskFactors
        }

        phases.push(phase)
        currentDate = phase.estimatedEndDate
      }

      return phases
    } catch (error) {
      console.error('Implementation phase calculation failed:', error.message)
      return []
    }
  }

  // DEADLINE CRITICALITY ASSESSMENT
  assessDeadlineCriticality(explicitDeadlines, predictedDeadlines, contentAnalysis) {
    const assessment = {
      overallCriticality: 'Medium',
      criticalDeadlines: [],
      urgentDeadlines: [],
      importantDeadlines: [],
      standardDeadlines: []
    }

    const allDeadlines = [...explicitDeadlines, ...predictedDeadlines]

    for (const deadline of allDeadlines) {
      const daysUntilDeadline = this.calculateDaysUntilDeadline(deadline.date)
      const criticality = this.calculateDeadlineCriticality(deadline, daysUntilDeadline, contentAnalysis)

      deadline.criticality = criticality
      deadline.daysUntil = daysUntilDeadline

      if (daysUntilDeadline <= this.config.urgencyThresholds.critical) {
        assessment.criticalDeadlines.push(deadline)
      } else if (daysUntilDeadline <= this.config.urgencyThresholds.urgent) {
        assessment.urgentDeadlines.push(deadline)
      } else if (daysUntilDeadline <= this.config.urgencyThresholds.important) {
        assessment.importantDeadlines.push(deadline)
      } else {
        assessment.standardDeadlines.push(deadline)
      }
    }

    // Determine overall criticality
    if (assessment.criticalDeadlines.length > 0) {
      assessment.overallCriticality = 'Critical'
    } else if (assessment.urgentDeadlines.length > 0) {
      assessment.overallCriticality = 'Urgent'
    } else if (assessment.importantDeadlines.length > 0) {
      assessment.overallCriticality = 'Important'
    }

    return assessment
  }

  // DEADLINE RECOMMENDATIONS
  generateDeadlineRecommendations(explicitDeadlines, predictedDeadlines, consultationPeriods, contentAnalysis) {
    const recommendations = []

    // Immediate action recommendations
    const urgentDeadlines = [...explicitDeadlines, ...predictedDeadlines].filter(
      deadline => this.calculateDaysUntilDeadline(deadline.date) <= this.config.urgencyThresholds.urgent
    )

    if (urgentDeadlines.length > 0) {
      recommendations.push({
        type: 'immediate_action',
        priority: 'High',
        description: 'Urgent deadlines require immediate attention',
        deadlines: urgentDeadlines,
        suggestedActions: this.generateUrgentActions(urgentDeadlines)
      })
    }

    // Consultation response recommendations
    for (const consultation of consultationPeriods) {
      if (consultation.responseRequired) {
        recommendations.push({
          type: 'consultation_response',
          priority: 'Medium',
          description: 'Consultation response preparation recommended',
          consultation,
          suggestedActions: this.generateConsultationActions(consultation)
        })
      }
    }

    // Preparation recommendations
    const upcomingDeadlines = [...explicitDeadlines, ...predictedDeadlines].filter(
      deadline => {
        const days = this.calculateDaysUntilDeadline(deadline.date)
        return days > this.config.urgencyThresholds.urgent && days <= this.config.urgencyThresholds.standard
      }
    )

    if (upcomingDeadlines.length > 0) {
      recommendations.push({
        type: 'preparation',
        priority: 'Medium',
        description: 'Preparation for upcoming deadlines',
        deadlines: upcomingDeadlines,
        suggestedActions: this.generatePreparationActions(upcomingDeadlines)
      })
    }

    return recommendations
  }

  // DEADLINE MONITORING AND ALERTS
  async monitorDeadlines() {
    console.log('🔍 Monitoring deadline intelligence...')

    try {
      // Get all tracked deadlines
      const trackedDeadlines = await this.getTrackedDeadlines()

      // Check for approaching deadlines
      const approachingDeadlines = this.identifyApproachingDeadlines(trackedDeadlines)

      // Check for missed deadlines
      const missedDeadlines = this.identifyMissedDeadlines(trackedDeadlines)

      // Update deadline status
      await this.updateDeadlineStatuses(trackedDeadlines)

      // Emit alerts
      this.emitDeadlineAlerts(approachingDeadlines, missedDeadlines)
    } catch (error) {
      console.error('Deadline monitoring error:', error.message)
    }
  }

  async scheduleDeadlineAlerts() {
    const upcomingDeadlines = await this.getUpcomingDeadlines(30) // 30 days ahead

    for (const deadline of upcomingDeadlines) {
      const alertDates = this.calculateAlertDates(deadline)

      for (const alertDate of alertDates) {
        await this.scheduleAlert(deadline, alertDate)
      }
    }
  }

  // STORAGE AND EVENTS
  async storeDeadlineIntelligence(updateId, deadlineIntelligence) {
    try {
      const deadlineData = {
        update_id: updateId,
        analysis_type: 'deadline_intelligence',
        explicit_deadlines: deadlineIntelligence.explicitDeadlines,
        predicted_deadlines: deadlineIntelligence.predictedDeadlines,
        consultation_periods: deadlineIntelligence.consultationPeriods,
        follow_up_activity: deadlineIntelligence.followUpActivity,
        implementation_phases: deadlineIntelligence.implementationPhases,
        criticality_assessment: deadlineIntelligence.criticalityAssessment,
        recommendations: deadlineIntelligence.recommendations,
        confidence_score: deadlineIntelligence.confidence,
        next_review: deadlineIntelligence.nextReview,
        analyzed_at: deadlineIntelligence.timestamp
      }

      await dbService.storeDeadlineIntelligence(deadlineData)
    } catch (error) {
      console.error('Failed to store deadline intelligence:', error.message)
    }
  }

  async updateDeadlineTracking(deadlineIntelligence) {
    // Add new deadlines to tracking
    for (const deadline of deadlineIntelligence.explicitDeadlines) {
      this.trackedDeadlines.set(deadline.id, {
        ...deadline,
        status: 'active',
        lastUpdated: new Date().toISOString()
      })
    }

    for (const deadline of deadlineIntelligence.predictedDeadlines) {
      this.predictedEvents.set(deadline.id, {
        ...deadline,
        status: 'predicted',
        lastUpdated: new Date().toISOString()
      })
    }
  }

  emitDeadlineEvents(updateData, deadlineIntelligence) {
    // Emit for critical deadlines
    if (deadlineIntelligence.criticalityAssessment.criticalDeadlines.length > 0) {
      this.emit('criticalDeadlinesDetected', {
        update: updateData,
        deadlines: deadlineIntelligence.criticalityAssessment.criticalDeadlines
      })
    }

    // Emit for urgent deadlines
    if (deadlineIntelligence.criticalityAssessment.urgentDeadlines.length > 0) {
      this.emit('urgentDeadlinesDetected', {
        update: updateData,
        deadlines: deadlineIntelligence.criticalityAssessment.urgentDeadlines
      })
    }

    // Emit for consultation periods
    if (deadlineIntelligence.consultationPeriods.length > 0) {
      this.emit('consultationPeriodsDetected', {
        update: updateData,
        consultations: deadlineIntelligence.consultationPeriods
      })
    }
  }

  // PUBLIC API METHODS
  async getUpcomingDeadlines(days = 30, authority = null) {
    try {
      let query = `
                SELECT * FROM deadline_intelligence 
                WHERE analyzed_at > NOW() - INTERVAL '90 days'
            `

      if (authority) {
        query += ` AND update_id IN (
                    SELECT id FROM regulatory_updates WHERE authority = '${authority}'
                )`
      }

      const results = await dbService.query(query)

      const upcomingDeadlines = []
      const cutoffDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000))

      for (const result of results) {
        const deadlines = [
          ...(result.explicit_deadlines || []),
          ...(result.predicted_deadlines || [])
        ]

        for (const deadline of deadlines) {
          const deadlineDate = new Date(deadline.date)
          if (deadlineDate <= cutoffDate && deadlineDate > new Date()) {
            upcomingDeadlines.push({
              ...deadline,
              updateId: result.update_id,
              daysUntil: this.calculateDaysUntilDeadline(deadline.date)
            })
          }
        }
      }

      return upcomingDeadlines.sort((a, b) => a.daysUntil - b.daysUntil)
    } catch (error) {
      console.error('Error getting upcoming deadlines:', error.message)
      return []
    }
  }

  async getConsultationCalendar(months = 6) {
    try {
      const consultations = await dbService.query(`
                SELECT consultation_periods, analyzed_at FROM deadline_intelligence 
                WHERE analyzed_at > NOW() - INTERVAL '30 days'
                AND consultation_periods IS NOT NULL
                AND consultation_periods != '[]'
            `)

      const calendar = []
      const calendarCutoff = new Date(Date.now() + (months * 30 * 24 * 60 * 60 * 1000))

      for (const result of consultations) {
        for (const consultation of result.consultation_periods) {
          if (!consultation.endDate) continue

          const consultationEndDate = new Date(consultation.endDate)
          if (consultationEndDate > new Date() && consultationEndDate <= calendarCutoff) {
            calendar.push(consultation)
          }
        }
      }

      return calendar.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    } catch (error) {
      console.error('Error getting consultation calendar:', error.message)
      return []
    }
  }

  // HELPER METHODS
  getDeadlinePatterns() {
    return [
      {
        name: 'explicit_date',
        regex: /(?:by|before|until|deadline)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
        type: 'explicit'
      },
      {
        name: 'month_year',
        regex: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/gi,
        type: 'month_year'
      },
      {
        name: 'relative_time',
        regex: /(?:within|in)\s+(\d+)\s+(days?|weeks?|months?)/gi,
        type: 'relative'
      },
      {
        name: 'consultation_period',
        regex: /consultation\s+(?:period|closes?|ends?)\s+(?:on\s+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/gi,
        type: 'consultation'
      }
    ]
  }

  calculateDaysUntilDeadline(deadlineDate) {
    const now = new Date()
    const deadline = new Date(deadlineDate)
    const diffTime = deadline - now
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  calculateDeadlineCriticality(deadline, daysUntil, contentAnalysis) {
    let criticality = 'Standard'

    if (daysUntil <= this.config.urgencyThresholds.critical) {
      criticality = 'Critical'
    } else if (daysUntil <= this.config.urgencyThresholds.urgent) {
      criticality = 'Urgent'
    } else if (daysUntil <= this.config.urgencyThresholds.important) {
      criticality = 'Important'
    }

    // Adjust based on content analysis
    if (contentAnalysis.impactLevel === 'Critical') {
      criticality = this.escalateCriticality(criticality)
    }

    return criticality
  }

  escalateCriticality(currentLevel) {
    const escalation = {
      Standard: 'Important',
      Important: 'Urgent',
      Urgent: 'Critical',
      Critical: 'Critical'
    }

    return escalation[currentLevel] || currentLevel
  }

  isConsultationDocument(updateData, contentAnalysis) {
    const title = updateData.title.toLowerCase()
    const area = (contentAnalysis.area || '').toLowerCase()

    return title.includes('consultation') ||
               area.includes('consultation') ||
               updateData.documentType === 'Consultation Paper'
  }

  detectDocumentType(updateData) {
    const title = updateData.title.toLowerCase()

    if (title.includes('consultation')) return 'consultation'
    if (title.includes('policy statement')) return 'policy_statement'
    if (title.includes('guidance')) return 'guidance'
    if (title.includes('technical standard')) return 'technical_standard'
    if (title.includes('speech')) return 'speech'

    return 'other'
  }

  initializeAuthorityPatterns() {
    return {
      FCA: {
        followUpPatterns: {
          consultation: [
            {
              nextActivityType: 'Policy Statement',
              averageDelay: 120, // days
              confidence: 85,
              description: 'FCA typically publishes policy statements 3-4 months after consultation',
              probability: 0.9
            }
          ],
          policy_statement: [
            {
              nextActivityType: 'Implementation Guidance',
              averageDelay: 60,
              confidence: 70,
              description: 'Implementation guidance often follows policy statements',
              probability: 0.7
            }
          ]
        }
      },
      PRA: {
        followUpPatterns: {
          consultation: [
            {
              nextActivityType: 'Policy Statement',
              averageDelay: 150,
              confidence: 80,
              description: 'PRA policy statements typically follow 4-5 months after consultation',
              probability: 0.85
            }
          ]
        }
      }
    }
  }

  initializeDeadlineMonitoring() {
    // Start periodic deadline monitoring
    setInterval(() => {
      this.monitorDeadlines().catch(error =>
        console.error('Deadline monitoring error:', error.message)
      )
    }, this.config.monitoringInterval)
  }

  createFallbackDeadlineIntelligence(updateData, contentAnalysis) {
    return {
      timestamp: new Date().toISOString(),
      updateId: updateData.id,
      explicitDeadlines: [],
      predictedDeadlines: [],
      consultationPeriods: [],
      followUpActivity: [],
      implementationPhases: [],
      criticalityAssessment: { overallCriticality: 'Medium' },
      recommendations: ['Manual deadline assessment recommended'],
      confidence: 30,
      nextReview: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
      fallback: true
    }
  }

  calculateEstimatedDate(baseDate, delayDays) {
    const base = new Date(baseDate)
    return new Date(base.getTime() + (delayDays * 24 * 60 * 60 * 1000)).toISOString()
  }

  generateUrgentActions(urgentDeadlines) {
    return urgentDeadlines.map(deadline => ({
      action: `Immediate preparation for ${deadline.type} deadline`,
      deadline: deadline.date,
      priority: 'Critical'
    }))
  }

  generateConsultationActions(consultation) {
    return [
      {
        action: 'Review consultation document',
        timeline: '1 week',
        priority: 'High'
      },
      {
        action: 'Prepare response strategy',
        timeline: '2 weeks',
        priority: 'High'
      },
      {
        action: 'Submit consultation response',
        timeline: consultation.endDate,
        priority: 'Critical'
      }
    ]
  }

  calculateDeadlineConfidence(explicitDeadlines, predictedDeadlines) {
    const explicitCount = explicitDeadlines.length
    const predictedCount = predictedDeadlines.length

    if (explicitCount > 0) {
      return Math.min(90, 60 + (explicitCount * 10))
    } else if (predictedCount > 0) {
      return Math.min(70, 40 + (predictedCount * 5))
    }

    return 30
  }

  calculateNextReviewDate(explicitDeadlines, predictedDeadlines) {
    const allDeadlines = [...explicitDeadlines, ...predictedDeadlines]

    if (allDeadlines.length === 0) {
      return new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    }

    // Next review is 7 days before the earliest deadline or in 7 days, whichever is sooner
    const earliestDeadline = allDeadlines.reduce((earliest, deadline) => {
      const deadlineDate = new Date(deadline.date)
      return deadlineDate < earliest ? deadlineDate : earliest
    }, new Date(allDeadlines[0].date))

    const reviewDate = new Date(earliestDeadline.getTime() - (7 * 24 * 60 * 60 * 1000))
    const sevenDaysFromNow = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))

    return reviewDate < sevenDaysFromNow ? reviewDate.toISOString() : sevenDaysFromNow.toISOString()
  }
}

module.exports = DeadlineIntelligenceService
