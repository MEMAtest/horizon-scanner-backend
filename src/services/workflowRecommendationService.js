const normalizeString = value => String(value || '').trim().toLowerCase()

const WORKFLOW_LIBRARY = [
  {
    id: 'payments-incident-response',
    title: 'Payments incident escalation',
    description: 'Coordinate cross-functional response when a payment service experiences operational disruption or regulator scrutiny.',
    actions: [
      'Notify operations and customer teams with agreed timeline.',
      'Engage regulatory liaison to prepare PSR/FCA updates.',
      'Review resilience playbook and confirm remediation owners.'
    ],
    serviceTypes: ['payments', 'fintech'],
    personas: ['operations', 'executive'],
    authorities: ['psr', 'fca'],
    themes: ['payments', 'operational_resilience', 'service_outage']
  },
  {
    id: 'consumer-duty-gap-analysis',
    title: 'Consumer duty gap analysis',
    description: 'Assess current policies against evolving consumer duty requirements and capture remediation tasks.',
    actions: [
      'Run quick policy audit against latest FCA duty guidance.',
      'Log remediation tasks in compliance workspace.',
      'Schedule follow-up briefing for executive sponsor.'
    ],
    serviceTypes: ['retail_banking', 'wealth_management', 'payments'],
    personas: ['compliance', 'executive', 'analyst'],
    authorities: ['fca'],
    themes: ['consumer_duty', 'fair_value', 'customer_outcomes']
  },
  {
    id: 'enforcement-readiness-check',
    title: 'Enforcement readiness checklist',
    description: 'Ensure response plans are ready when an authority escalates enforcement notices or penalties.',
    actions: [
      'Review enforcement playbook owners and contact tree.',
      'Prepare communications pack for stakeholders.',
      'Confirm legal counsel availability and evidence collection steps.'
    ],
    serviceTypes: ['general_financial_services', 'fintech', 'insurance'],
    personas: ['executive', 'operations', 'legal'],
    authorities: ['fca', 'pra', 'hmrc', 'psr'],
    themes: ['enforcement', 'penalties', 'supervision']
  },
  {
    id: 'cross-border-reg-change',
    title: 'Cross-border regulatory change tracker',
    description: 'Capture new obligations when operating across multiple jurisdictions and create localisation tasks.',
    actions: [
      'Identify affected regions and map to local leads.',
      'Compile deadlines and documentation requirements.',
      'Schedule alignment call with local compliance teams.'
    ],
    serviceTypes: ['payments', 'fintech', 'retail_banking'],
    personas: ['analyst', 'operations'],
    authorities: ['eba', 'esma', 'european_commission'],
    themes: ['cross_border', 'regulatory_change', 'licensing']
  },
  {
    id: 'general-monitoring-digest',
    title: 'General monitoring digest',
    description: 'Build a weekly digest capturing priority updates and highlight next steps for cross-team awareness.',
    actions: [
      'Select top high-relevance updates tagged to executive personas.',
      'Draft summary and recommended actions for each audience.',
      'Distribute to mailing list and capture feedback.'
    ],
    serviceTypes: ['general_financial_services'],
    personas: ['executive', 'analyst', 'operations'],
    authorities: [],
    themes: []
  }
]

function normaliseProfile(profile) {
  if (!profile) return null
  return {
    serviceType: normalizeString(profile.serviceType || profile.firmType || 'general_financial_services'),
    secondaryServiceTypes: Array.isArray(profile.secondaryServiceTypes)
      ? profile.secondaryServiceTypes.map(normalizeString)
      : [],
    personas: Array.isArray(profile.personas)
      ? profile.personas.map(persona => normalizeString(persona))
      : [],
    regions: Array.isArray(profile.regions)
      ? profile.regions.map(normalizeString)
      : [],
    goals: Array.isArray(profile.goals)
      ? profile.goals.map(normalizeString)
      : []
  }
}

function buildAuthorityRanking(behaviourScores = [], streams = {}) {
  const ranking = new Map()

  behaviourScores
    .filter(score => normalizeString(score.entityType || score.entity_type) === 'authority')
    .forEach(score => {
      const key = normalizeString(score.entityId || score.entity_id)
      if (!key) return
      const weight = Number(score.weight || 0)
      ranking.set(key, (ranking.get(key) || 0) + weight)
    })

  const highStream = Array.isArray(streams?.high) ? streams.high : []
  highStream.forEach(update => {
    const authority = normalizeString(update.authority)
    if (!authority) return
    ranking.set(authority, (ranking.get(authority) || 0) + 2)
  })

  return ranking
}

function buildThemeRanking(behaviourScores = [], streams = {}) {
  const ranking = new Map()

  behaviourScores
    .filter(score => normalizeString(score.entityType || score.entity_type) === 'theme')
    .forEach(score => {
      const key = normalizeString(score.entityId || score.entity_id)
      if (!key) return
      const weight = Number(score.weight || 0)
      ranking.set(key, (ranking.get(key) || 0) + weight)
    })

  const gatherThemes = update => {
    const out = []
    if (Array.isArray(update.ai_tags)) {
      update.ai_tags.forEach(tag => {
        if (!tag || typeof tag !== 'string') return
        const cleaned = normalizeString(tag.startsWith('persona:') ? tag.split(':')[1] : tag)
        if (cleaned) out.push(cleaned)
      })
    }
    if (update.primarySector) out.push(normalizeString(update.primarySector))
    if (update.area) out.push(normalizeString(update.area))
    return out.filter(Boolean)
  }

  ;['high', 'medium'].forEach(bucket => {
    const list = Array.isArray(streams?.[bucket]) ? streams[bucket] : []
    list.forEach(update => {
      gatherThemes(update).forEach(theme => {
        ranking.set(theme, (ranking.get(theme) || 0) + (bucket === 'high' ? 2 : 1))
      })
    })
  })

  return ranking
}

function scoreWorkflow(template, context) {
  const reasons = []
  let score = 0

  const primaryMatch = normalizeString(context.profile?.serviceType)
  if (primaryMatch && template.serviceTypes.includes(primaryMatch)) {
    score += 40
    reasons.push(`Aligned with ${primaryMatch.replace(/_/g, ' ')} focus`)
  }

  const secondaryMatches = Array.isArray(context.profile?.secondaryServiceTypes)
    ? context.profile.secondaryServiceTypes
        .map(normalizeString)
        .filter(tag => template.serviceTypes.includes(tag))
    : []

  if (secondaryMatches.length) {
    score += 15
    reasons.push(`Covers secondary service areas (${secondaryMatches.join(', ')})`)
  }

  if (Array.isArray(context.profile?.personas)) {
    const personaMatches = context.profile.personas
      .map(normalizeString)
      .filter(persona => template.personas.includes(persona))
    if (personaMatches.length) {
      score += personaMatches.length * 10
      reasons.push(`Targets persona: ${personaMatches.join(', ')}`)
    }
  }

  const authorityRanking = context.authorityRanking
  template.authorities.forEach(authority => {
    const weight = authorityRanking.get(normalizeString(authority)) || 0
    if (!weight) return
    score += Math.min(15, Math.abs(weight) * 1.5)
    reasons.push(`Matches focus authority (${authority.toUpperCase()})`)
  })

  const themeRanking = context.themeRanking
  template.themes.forEach(theme => {
    const weight = themeRanking.get(normalizeString(theme)) || 0
    if (!weight) return
    score += Math.min(12, Math.abs(weight) * 1.2)
    reasons.push(`Relevant to active theme (${theme.replace(/_/g, ' ')})`)
  })

  if (context.profile?.goals?.includes('prepare_workflows')) {
    score += 10
    reasons.push('Supports stated goal: prepare workflows')
  }

  if (!reasons.length) {
    reasons.push('General workflow recommendation')
  }

  return { score, reasons }
}

function buildRecommendations({ profile, behaviourScores, streams }) {
  const normalizedProfile = normaliseProfile(profile)
  const authorityRanking = buildAuthorityRanking(behaviourScores, streams)
  const themeRanking = buildThemeRanking(behaviourScores, streams)

  const sparseProfile =
    (!normalizedProfile || normalizedProfile.serviceType === 'general_financial_services') &&
    (!normalizedProfile || !normalizedProfile.personas || !normalizedProfile.personas.length) &&
    (!normalizedProfile || !normalizedProfile.secondaryServiceTypes || !normalizedProfile.secondaryServiceTypes.length) &&
    (!behaviourScores || behaviourScores.length === 0) &&
    (!streams || (!Array.isArray(streams.high) || !streams.high.length))

  if (sparseProfile) {
    const generalTemplate = WORKFLOW_LIBRARY.find(template => template.id === 'general-monitoring-digest')
    if (generalTemplate) {
      return [{
        id: generalTemplate.id,
        title: generalTemplate.title,
        description: generalTemplate.description,
        actions: generalTemplate.actions,
        reasons: ['General workflow recommendation'],
        score: 10
      }]
    }
  }

  const context = {
    profile: normalizedProfile,
    authorityRanking,
    themeRanking
  }

  const scored = WORKFLOW_LIBRARY.map(template => {
    const { score, reasons } = scoreWorkflow(template, context)
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      actions: template.actions,
      reasons,
      score
    }
  })
    .filter(entry => entry.score > 10)
    .sort((a, b) => b.score - a.score)

  if (!scored.length) {
    const fallback = WORKFLOW_LIBRARY
      .filter(template => template.serviceTypes.includes('general_financial_services'))
      .slice(0, 1)
      .map(template => ({
        id: template.id,
        title: template.title,
        description: template.description,
        actions: template.actions,
        reasons: ['General workflow recommendation'],
        score: 10
      }))
    return fallback
  }

  const recommendations = scored.slice(0, 3)

  if (recommendations.length < 3) {
    const hasGeneral = recommendations.some(item => item.id === 'general-monitoring-digest')
    if (!hasGeneral) {
      const generalTemplate = WORKFLOW_LIBRARY.find(template => template.id === 'general-monitoring-digest')
      if (generalTemplate) {
        recommendations.push({
          id: generalTemplate.id,
          title: generalTemplate.title,
          description: generalTemplate.description,
          actions: generalTemplate.actions,
          reasons: ['General workflow recommendation'],
          score: 10
        })
      }
    }
  }

  return recommendations.slice(0, 3)
}

module.exports = {
  buildRecommendations
}
