const {
  CONFIDENCE_BUCKETS,
  HISTORICAL_ACCURACY_BENCHMARKS,
  BUCKET_TIMELINES,
  RECENT_WINDOW_DAYS
} = require('./constants')

function applyPredictionMethods(ServiceClass) {
  ServiceClass.prototype.buildPredictions = function({ topicStats, authorityStats, sectorStats, updates, now, firmProfile }) {
    const imminent = []
    const nearTerm = []
    const strategic = []

    topicStats.forEach((stats, keyword) => {
      const metrics = this.calculateTopicMetrics(stats, now)
      if (!metrics) return

      const sectors = this.pickTopEntries(stats.sectors, 3)
      const authorities = this.pickTopAuthorities(stats)
      const topUpdate = this.pickTopUpdate(stats)
      const focus = this.extractFocus({ keyword, topUpdate })
      const stage = topUpdate ? (topUpdate.stage || null) : null
      const whyItMatters = this.buildWhyItMatters({ focus, authorities, sectors, metrics, stage })
      const context = this.buildPredictionContext({ keyword, stats, metrics, authorities, sectors, whyItMatters, focus, topUpdate })
      const recommendedActions = this.buildRecommendedActions({ keyword, stats, metrics, authorities, sectors })

      const prediction = {
        id: `${keyword}-${stats.lastSeen.getTime()}`,
        prediction_title: this.buildPredictionTitle({ focus, authority: authorities[0], authorities, sectors, stage, metrics }),
        timeframe: metrics.timeframe,
        confidence: metrics.confidence,
        urgency: metrics.urgency,
        confidence_bucket: this.classifyConfidence(metrics.confidence),
        lane_bucket: metrics.bucket,
        priority_lane: this.getPriorityLaneFromBucket(metrics.bucket),
        priority_score: this.calculatePriorityScore(metrics),
        focus,
        stage,
        evidence: context.evidence,
        affected_sectors: sectors.length ? sectors : ['General'],
        why_this_matters: whyItMatters,
        recommended_actions: recommendedActions,
        supporting_topics: [keyword],
        confidence_factors: metrics.confidenceFactors,
        context
      }

      if (metrics.bucket === 'imminent') {
        imminent.push(prediction)
      } else if (metrics.bucket === 'near') {
        nearTerm.push(prediction)
      } else {
        strategic.push(prediction)
      }
    })

    authorityStats.forEach(stats => {
      const coordinationAlert = this.buildAuthorityPrediction(stats, topicStats, now, updates)
      if (coordinationAlert) {
        const targetList = coordinationAlert.bucket === 'imminent' ? imminent : nearTerm
        targetList.unshift(coordinationAlert.prediction)
      }
    })

    if (!strategic.length) {
      const theme = this.buildEmergingThemePrediction(topicStats, now)
      if (theme) strategic.push(theme)
    }

    const sortByPriority = list => list
      .sort((a, b) => (b.priority_score || b.confidence || 0) - (a.priority_score || a.confidence || 0))
      .slice(0, 5)

    return {
      imminent: sortByPriority(imminent),
      nearTerm: sortByPriority(nearTerm),
      strategic: sortByPriority(strategic)
    }
  }

  ServiceClass.prototype.calculateTopicMetrics = function(stats, now) {
    const windowCounts = [0, 0, 0, 0]
    const windowSize = Math.max(1, RECENT_WINDOW_DAYS)

    const parseLocalDay = dayKey => {
      if (!dayKey) return null
      const [year, month, day] = String(dayKey).split('-').map(Number)
      if (!year || !month || !day) return null
      const parsed = new Date(year, month - 1, day)
      return Number.isNaN(parsed.getTime()) ? null : parsed
    }

    const dayEntries = stats.days instanceof Map ? Array.from(stats.days.entries()) : []
    dayEntries.forEach(([dayKey, count]) => {
      const day = parseLocalDay(dayKey)
      if (!day) return
      const diff = this.daysBetween(now, day)
      if (diff < 0) return
      const bucket = Math.floor(diff / windowSize)
      if (bucket >= 0 && bucket < windowCounts.length) {
        windowCounts[bucket] += count
      }
    })

    const hasWindowCounts = windowCounts.some(count => count > 0)
    if (!hasWindowCounts) {
      const weeks = Array.from(stats.weeks.entries())
        .map(([weekKey, count]) => ({ week: parseLocalDay(weekKey) || new Date(weekKey), count }))
        .filter(entry => entry.week && !Number.isNaN(entry.week.getTime()))
        .sort((a, b) => b.week - a.week)

      if (!weeks.length) return null

      weeks.forEach(({ week, count }) => {
        const diff = Math.floor((now - week) / (7 * 24 * 60 * 60 * 1000))
        if (diff >= 0 && diff < windowCounts.length) {
          windowCounts[diff] += count
        }
      })
    }

    const recent = windowCounts[0]
    const lastWeek = windowCounts[1]
    const previousMean = (windowCounts[1] + windowCounts[2] + windowCounts[3]) / 3 || 0.1
    const monthWindow = windowCounts[0] + windowCounts[1] + windowCounts[2]

    const stdDev = Math.sqrt([
      Math.pow(windowCounts[1] - previousMean, 2),
      Math.pow(windowCounts[2] - previousMean, 2),
      Math.pow(windowCounts[3] - previousMean, 2)
    ].reduce((sum, val) => sum + val, 0) / 3)

    const acceleration = previousMean > 0 ? recent / previousMean : recent
    const surgeThreshold = previousMean + 2 * stdDev
    const surgeDetected = recent > surgeThreshold

    const isEmerging = this.daysBetween(now, stats.firstSeen) <= 30
    const coordinationAuthorities = Array.from(stats.authorities.entries())
      .filter(([, counts]) => counts.recent > 0)
      .map(([authority]) => authority)

    const coordinationDetected = coordinationAuthorities.length >= 2
    const deadlinesSoon = stats.deadlines.some(deadline => this.daysBetween(deadline, now) <= 14)

    let bucket = 'strategic'
    let timeframe = '30-90 days'
    let urgency = 'WATCHING'

    if ((recent >= 3 && acceleration >= 2 && surgeDetected) || deadlinesSoon) {
      bucket = 'imminent'
      timeframe = '7-14 days'
      urgency = 'CRITICAL'
    } else if (acceleration >= 1.5 || coordinationDetected) {
      bucket = 'near'
      timeframe = '15-30 days'
      urgency = 'HIGH'
    } else if (isEmerging || monthWindow >= 4) {
      bucket = 'strategic'
      timeframe = '30-90 days'
      urgency = 'MEDIUM'
    }

    const confidenceFactors = []
    let confidence = 45

    if (acceleration >= 2) {
      confidence += Math.min(20, (acceleration - 1) * 12)
      confidenceFactors.push(`Topic velocity ${acceleration.toFixed(1)}× baseline`)
    }
    if (surgeDetected) {
      confidence += 10
      confidenceFactors.push('Surge exceeds 2× standard deviation')
    }
    if (coordinationDetected) {
      confidence += 8
      confidenceFactors.push('Cross-authority coordination observed')
    }
    if (deadlinesSoon) {
      confidence += 6
      confidenceFactors.push('Upcoming compliance deadline within 14 days')
    }
    if (recent >= 4) confidence += 5
    if (monthWindow >= 6) confidence += 5
    if (isEmerging) confidence += 4

    const normalizedConfidence = Math.max(40, Math.min(96, confidence))

    return {
      bucket,
      timeframe,
      urgency,
      confidence: normalizedConfidence,
      confidenceFactors,
      recent,
      lastWeek,
      previousMean,
      acceleration,
      surgeDetected,
      isEmerging,
      coordinationDetected,
      coordinationAuthorities,
      deadlinesSoon
    }
  }

  ServiceClass.prototype.getPriorityLaneFromBucket = function(bucket) {
    if (bucket === 'imminent') return 'act_now'
    if (bucket === 'near') return 'prepare_next'
    return 'monitor'
  }

  ServiceClass.prototype.buildPredictionTitle = function({ focus, authority, authorities, sectors, stage, metrics }) {
    const primaryAuthority = authority || (authorities && authorities.length ? authorities[0] : 'Regulators')
    const sectorText = this.formatSectorSummary(sectors)
    const focusText = focus || 'priority theme'
    const normalisedStage = stage ? String(stage).toLowerCase() : null

    if (normalisedStage === 'consultation') {
      return `${primaryAuthority} opens consultation on ${focusText}` + (sectorText ? ` for ${sectorText}` : '')
    }
    if (normalisedStage === 'enforcement') {
      return `${primaryAuthority} steps up enforcement on ${focusText}` + (sectorText ? ` across ${sectorText}` : '')
    }
    if (normalisedStage === 'final') {
      return `${primaryAuthority} finalises ${focusText} requirements` + (sectorText ? ` for ${sectorText}` : '')
    }
    if (normalisedStage === 'coordination') {
      return `${primaryAuthority} signals coordinated push on ${focusText}` + (sectorText ? ` across ${sectorText}` : '')
    }
    if (metrics.urgency === 'CRITICAL') {
      return `${primaryAuthority} escalates ${focusText} oversight` + (sectorText ? ` for ${sectorText}` : '')
    }
    if (metrics.urgency === 'HIGH') {
      return `${primaryAuthority} fast-tracks ${focusText} action` + (sectorText ? ` for ${sectorText}` : '')
    }
    const authorityGroup = this.formatAuthorityGroup(authorities)
    return `${focusText} emerges across ${authorityGroup}`
  }

  ServiceClass.prototype.buildEvidenceDetails = function({ keyword, stats, metrics, authorities }) {
    const evidence = []

    evidence.push({
      type: 'velocity',
      severity: metrics.acceleration >= 2 ? 'critical' : metrics.acceleration >= 1.5 ? 'high' : 'medium',
      statement: `Velocity spike: "${keyword}" appeared ${metrics.recent} time(s) in the past 7 days versus ${metrics.previousMean.toFixed(1)} weekly baseline.`,
      template: 'Velocity spike: "{keyword}" appeared {recent} time(s) in 7 days vs {baseline} weekly baseline.',
      values: {
        keyword,
        recent: metrics.recent,
        baseline: metrics.previousMean.toFixed(1)
      }
    })

    if (metrics.coordinationDetected) {
      evidence.push({
        type: 'coordination',
        severity: metrics.urgency === 'CRITICAL' ? 'critical' : 'high',
        statement: `Coordination alert: ${authorities.join(' & ')} referenced the theme within the last 10 days.`,
        template: 'Coordination alert: {authorities} referenced the theme within the last 10 days.',
        values: {
          authorities: authorities.join(' & ')
        }
      })
    }

    if (metrics.deadlinesSoon) {
      evidence.push({
        type: 'deadline',
        severity: 'high',
        statement: 'Deadline pressure: Linked publications include compliance dates landing inside the next 14 days.',
        template: 'Deadline pressure: Linked publications include compliance dates inside the next 14 days.',
        values: {}
      })
    }

    if (stats.stages.consultation.length && stats.stages.final.length) {
      const lag = this.calculateStageLag(stats.stages.consultation, stats.stages.final)
      if (lag) {
        evidence.push({
          type: 'historical-pattern',
          severity: 'medium',
          statement: `Historical pattern: Consultation-to-final transitions average ${lag} days for this theme.`,
          template: 'Historical pattern: Consultation-to-final transitions average {lag} days for this theme.',
          values: { lag }
        })
      }
    }

    if (metrics.isEmerging && metrics.bucket === 'strategic') {
      evidence.push({
        type: 'emergence',
        severity: 'medium',
        statement: 'Emerging signal: Terminology first appeared in regulator output within the past 30 days.',
        template: 'Emerging signal: Terminology first appeared in regulator output within the past 30 days.',
        values: {}
      })
    }

    return evidence
  }

  ServiceClass.prototype.buildRecommendedActions = function({ keyword, metrics, authorities, sectors }) {
    const actions = []
    const lead = authorities.length ? authorities[0] : 'lead authority'

    if (metrics.urgency === 'CRITICAL') {
      actions.push(`Immediate: Review current controls related to ${keyword} and capture any open remediation items.`)
      actions.push(`This week: Brief senior compliance stakeholders on ${lead}'s acceleration and potential enforcement.`)
      actions.push(`Within 2 weeks: Prepare impact analysis and response plan covering ${sectors.slice(0, 2).join(', ') || 'affected areas'}.`)
    } else if (metrics.urgency === 'HIGH') {
      actions.push(`This week: Assign an owner to monitor ${keyword} updates across ${lead} and peers.`)
      actions.push('Next 2 weeks: Conduct gap analysis against expected regulatory expectations.')
      actions.push('Within 30 days: Draft preparatory communications for impacted business units.')
    } else {
      actions.push(`Monitor: Track ${keyword} mentions weekly and log coordination signals across authorities.`)
      actions.push('Plan: Add the theme to the 60-day compliance roadmap and align with strategic planning cycles.')
      actions.push('Engage: Schedule tabletop discussion with risk owners to pre-empt likely consultation topics.')
    }

    return actions
  }

  ServiceClass.prototype.buildWhyItMatters = function({ focus, authorities, sectors, metrics, stage }) {
    const authorityText = authorities && authorities.length ? authorities.join(', ') : 'key authorities'
    const sectorText = sectors && sectors.length ? sectors.join(', ') : 'multiple sectors'
    const focusText = focus || 'this theme'
    const normalisedStage = stage ? String(stage).toLowerCase() : null

    if (normalisedStage === 'consultation') {
      return `${authorityText} have opened consultation on ${focusText}, signalling draft requirements will soon shape obligations for ${sectorText}. Engaging early helps influence the final position.`
    }
    if (normalisedStage === 'enforcement') {
      return `${authorityText} are taking enforcement steps linked to ${focusText}, creating immediate compliance risk for ${sectorText}. Rapid alignment is required to avoid sanctions.`
    }
    if (normalisedStage === 'final') {
      return `${authorityText} have finalised measures on ${focusText}, meaning ${sectorText} must move quickly to implement required changes.`
    }
    if (normalisedStage === 'coordination') {
      return `${authorityText} are coordinating signals on ${focusText}, pointing to upcoming joint action that will affect ${sectorText}. Early preparation averts last-minute surprises.`
    }
    if (metrics.urgency === 'CRITICAL') {
      return `${authorityText} are rapidly escalating focus on ${focusText}, signalling likely near-term supervisory action for ${sectorText}. Firms need immediate alignment to stay ahead.`
    }
    if (metrics.urgency === 'HIGH') {
      return `Momentum around ${focusText} suggests rules or guidance could formalise within weeks, giving ${sectorText} limited time to prepare.`
    }
    return `${focusText} is emerging as a strategic theme. Early preparation positions ${sectorText} to influence consultation responses and adapt ahead of peers.`
  }

  ServiceClass.prototype.classifyConfidence = function(confidence) {
    const bucket = CONFIDENCE_BUCKETS.find(({ min }) => confidence >= min)
    return bucket ? bucket.label : 'WATCHING'
  }

  ServiceClass.prototype.buildHistoricalAccuracy = function(bucket, metrics) {
    const benchmark = HISTORICAL_ACCURACY_BENCHMARKS[bucket] || HISTORICAL_ACCURACY_BENCHMARKS.WATCHING
    const baseRate = Math.round(benchmark.rate * 100)
    const accelerationBonus = Math.max(-6, Math.min(6, Math.round((metrics.acceleration - 1) * 6)))
    const adjustedRate = Math.max(55, Math.min(95, baseRate + accelerationBonus))

    return {
      bucket,
      hitRate: adjustedRate,
      sampleSize: benchmark.sample,
      window: benchmark.window,
      statement: `Model hit rate ${adjustedRate}% across ${benchmark.sample} ${bucket.toLowerCase()} calls (${benchmark.window}).`,
      expectedTimeline: BUCKET_TIMELINES[bucket] || '90-180 days'
    }
  }

  ServiceClass.prototype.buildTriggeringUpdates = function(stats) {
    return stats.mentions
      .sort((a, b) => b.date - a.date)
      .slice(0, 4)
      .map(mention => ({
        headline: mention.headline,
        authority: mention.authority,
        date: mention.date ? mention.date.toISOString() : null,
        url: mention.url,
        stage: mention.stage,
        urgency: mention.urgency,
        confidence: mention.confidence,
        summary: mention.summary
      }))
  }

  ServiceClass.prototype.buildPredictionContext = function({ keyword, stats, metrics, authorities, sectors, whyItMatters, focus, topUpdate }) {
    const confidenceBucket = this.classifyConfidence(metrics.confidence)

    return {
      why: whyItMatters,
      focus: focus || keyword,
      primaryUpdate: topUpdate || null,
      historicalAccuracy: this.buildHistoricalAccuracy(confidenceBucket, metrics),
      evidence: this.buildEvidenceDetails({ keyword, stats, metrics, authorities }),
      triggeringUpdates: this.buildTriggeringUpdates(stats),
      confidenceDrivers: metrics.confidenceFactors,
      sectors,
      authorities
    }
  }

  ServiceClass.prototype.extractFocus = function({ keyword, topUpdate }) {
    const fallback = keyword ? keyword.replace(/[-_]/g, ' ') : 'priority theme'
    if (!topUpdate) {
      return this.toTitleCase(fallback)
    }
    const base = topUpdate.summary || topUpdate.headline || fallback
    const cleaned = base.replace(/\([^)]*\)/g, '')
      .replace(/\b(?:issued|launch(?:ed|es)|publishe(?:d|s)|announced|releases?)\s+/ig, match => match.toLowerCase())
    const patterns = [
      /consultations? (?:on|regarding)\s+([^.;]+)/i,
      /enforcements? (?:on|against)\s+([^.;]+)/i,
      /guidance (?:on|for)\s+([^.;]+)/i,
      /updates? (?:to|on)\s+([^.;]+)/i,
      /rules? (?:on|for)\s+([^.;]+)/i
    ]
    for (const pattern of patterns) {
      const match = cleaned.match(pattern)
      if (match && match[1]) {
        const phrase = this.cleanFocusPhrase(this.limitWords(match[1]))
        return this.toTitleCase(phrase || fallback)
      }
    }
    const sentence = cleaned.split(/[.!?]/)[0]
      .replace(/^\s*(The|the)\s+[A-Z][^\s]+(?:\s+[A-Z][^\s]+)*\s+(has|have|is|are|will)\s+/, '')
      .trim()
    if (sentence) {
      const trimmed = sentence.replace(/\bby\b.*$/i, '').trim()
      const phrase = this.cleanFocusPhrase(this.limitWords(trimmed))
      return this.toTitleCase(phrase || fallback)
    }
    const fallbackClean = this.cleanFocusPhrase(fallback.replace(/\bby\b.*$/i, '').trim())
    return this.toTitleCase(fallbackClean || 'priority theme')
  }

  ServiceClass.prototype.cleanFocusPhrase = function(text) {
    return text
      .replace(/\b(its|their|the)\b\s*/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[,:;]+$/g, '')
      .replace(/\b(and|or|with|to)\s*$/i, '')
      .replace(/^(updates?|revisions?|changes|enhancements)\s+to\s+/i, '')
      .replace(/^(consultations?)\s+on\s+/i, '')
      .replace(/^(its|their|the)\s+/i, '')
      .replace(/\bto$/i, '')
      .trim()
  }

  ServiceClass.prototype.calculatePriorityScore = function(metrics) {
    let score = metrics.confidence
    if (metrics.urgency === 'CRITICAL') score += 20
    else if (metrics.urgency === 'HIGH') score += 10
    if (metrics.deadlinesSoon) score += 6
    if (metrics.coordinationDetected) score += 4
    score += Math.min(10, Math.max(0, (metrics.acceleration - 1) * 6))
    return Math.round(score)
  }

  ServiceClass.prototype.classifyChangeSeverity = function(changePercent) {
    if (changePercent >= 120) return 'critical'
    if (changePercent >= 60) return 'high'
    if (changePercent >= 25) return 'medium'
    return 'low'
  }

  ServiceClass.prototype.classifyAccelerationSeverity = function(acceleration) {
    if (acceleration >= 2.5) return 'critical'
    if (acceleration >= 1.8) return 'high'
    if (acceleration >= 1.3) return 'medium'
    return 'low'
  }

  ServiceClass.prototype.buildAuthorityPrediction = function(stats, topicStats, now, updates) {
    if (stats.recent < 3) return null

    const changePercent = stats.previous > 0 ? ((stats.recent - stats.previous) / stats.previous) * 100 : stats.recent * 100
    if (changePercent < 90) return null

    const topTopic = Array.from(topicStats.values())
      .map(topic => ({
        keyword: topic.keyword,
        stats: topic,
        metrics: this.calculateTopicMetrics(topic, now)
      }))
      .filter(entry => entry.metrics)
      .sort((a, b) => b.metrics.confidence - a.metrics.confidence)[0]

    if (!topTopic) return null

    const focus = this.extractFocus({ keyword: topTopic.keyword, topUpdate: this.pickTopUpdate(topTopic.stats) })
    const sectors = this.pickTopEntries(topTopic.stats.sectors, 3)
    const stage = this.pickTopUpdate(topTopic.stats)?.stage || null
    const baseMetrics = topTopic.metrics
    const adjustedMetrics = {
      ...baseMetrics,
      bucket: 'near',
      timeframe: baseMetrics.timeframe === '7-14 days' ? '15-30 days' : baseMetrics.timeframe,
      urgency: baseMetrics.urgency === 'CRITICAL' ? 'HIGH' : baseMetrics.urgency
    }
    const context = this.buildPredictionContext({
      keyword: topTopic.keyword,
      stats: topTopic.stats,
      metrics: adjustedMetrics,
      authorities: [stats.authority],
      sectors,
      whyItMatters: this.buildWhyItMatters({
        focus,
        authorities: [stats.authority],
        sectors,
        metrics: adjustedMetrics,
        stage
      }),
      focus,
      topUpdate: this.pickTopUpdate(topTopic.stats)
    })

    const authorityEvidence = {
      type: 'authority-velocity',
      severity: this.classifyChangeSeverity(Math.round(changePercent)),
      statement: `${stats.authority} publishing rate is ${Math.round(changePercent)}% above normal.`,
      template: '{authority} publishing rate is {change}% above normal.',
      values: {
        authority: stats.authority,
        change: Math.round(changePercent)
      }
    }

    context.evidence = [authorityEvidence, ...context.evidence]

    return {
      bucket: 'near',
      prediction: {
        id: `${stats.authority}-coordination-${now.getTime()}`,
        prediction_title: this.buildPredictionTitle({ focus, authority: stats.authority, authorities: [stats.authority], sectors, stage, metrics: adjustedMetrics }),
        timeframe: adjustedMetrics.timeframe,
        confidence: adjustedMetrics.confidence,
        urgency: adjustedMetrics.urgency,
        confidence_bucket: this.classifyConfidence(adjustedMetrics.confidence),
        lane_bucket: 'near',
        priority_lane: this.getPriorityLaneFromBucket('near'),
        priority_score: this.calculatePriorityScore(adjustedMetrics),
        focus,
        stage,
        evidence: context.evidence,
        affected_sectors: sectors,
        why_this_matters: context.why,
        recommended_actions: this.buildRecommendedActions({ keyword: topTopic.keyword, stats: topTopic.stats, metrics: adjustedMetrics, authorities: [stats.authority], sectors }),
        supporting_topics: [topTopic.keyword],
        confidence_factors: adjustedMetrics.confidenceFactors,
        context
      }
    }
  }

  ServiceClass.prototype.buildEmergingThemePrediction = function(topicStats, now) {
    const emergingTopics = []

    topicStats.forEach((stats, keyword) => {
      const metrics = this.calculateTopicMetrics(stats, now)
      if (!metrics) return
      if (metrics.bucket === 'strategic' && metrics.isEmerging && metrics.acceleration >= 1.2) {
        emergingTopics.push({ keyword, stats, metrics })
      }
    })

    if (!emergingTopics.length) return null

    const top = emergingTopics
      .sort((a, b) => (b.metrics.confidence + b.metrics.acceleration) - (a.metrics.confidence + a.metrics.acceleration))[0]

    const sectors = this.pickTopEntries(top.stats.sectors, 3)
    const authorities = this.pickTopAuthorities(top.stats)
    const focus = this.extractFocus({ keyword: top.keyword, topUpdate: this.pickTopUpdate(top.stats) })
    const stage = this.pickTopUpdate(top.stats)?.stage || null
    const priorityMetrics = {
      ...top.metrics,
      bucket: 'strategic',
      timeframe: '30-90 days',
      urgency: 'MEDIUM'
    }

    const context = this.buildPredictionContext({
      keyword: top.keyword,
      stats: top.stats,
      metrics: priorityMetrics,
      authorities,
      sectors,
      whyItMatters: this.buildWhyItMatters({ focus, authorities, sectors, metrics: priorityMetrics, stage }),
      focus,
      topUpdate: this.pickTopUpdate(top.stats)
    })

    const adjustedConfidence = Math.min(80, Math.max(55, priorityMetrics.confidence - 5))

    return {
      id: `${top.keyword}-theme-${now.getTime()}`,
      prediction_title: this.buildPredictionTitle({ focus, authority: authorities[0], authorities, sectors, stage, metrics: priorityMetrics }),
      timeframe: '30-90 days',
      confidence: adjustedConfidence,
      urgency: 'MEDIUM',
      confidence_bucket: this.classifyConfidence(adjustedConfidence),
      lane_bucket: 'strategic',
      priority_lane: this.getPriorityLaneFromBucket('strategic'),
      priority_score: this.calculatePriorityScore(priorityMetrics),
      focus,
      stage,
      evidence: context.evidence,
      affected_sectors: sectors,
      why_this_matters: context.why,
      recommended_actions: this.buildRecommendedActions({ keyword: top.keyword, stats: top.stats, metrics: top.metrics, authorities, sectors }),
      supporting_topics: [top.keyword],
      confidence_factors: top.metrics.confidenceFactors,
      context
    }
  }
}

module.exports = applyPredictionMethods
