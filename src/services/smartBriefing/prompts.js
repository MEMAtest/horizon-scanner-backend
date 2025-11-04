const axios = require('axios')

function applyPromptMethods(ServiceClass) {
  ServiceClass.prototype.buildPromptPayload = function(dataset) {
    const trimForGroq = this.useGroq

    const trimUpdate = (update) => ({
      id: update.id,
      title: update.title,
      summary: trimForGroq ? update.summary?.substring(0, 200) : update.summary,
      authority: update.authority,
      impact_level: update.impact_level,
      urgency: update.urgency,
      sectors: update.sectors,
      published_date: update.published_date
    })

    return {
      currentWeek: dataset.currentUpdates.slice(0, trimForGroq ? 15 : 30).map(trimUpdate),
      previousWeek: dataset.previousUpdates.slice(0, trimForGroq ? 10 : 20).map(trimUpdate),
      history: trimForGroq ? [] : dataset.historyUpdates.slice(0, 20).map(trimUpdate),
      historyTimeline: dataset.historyTimeline,
      stats: dataset.stats,
      annotations: dataset.annotations.slice(0, trimForGroq ? 5 : 15).map(a => ({
        id: a.id,
        content: a.content?.substring(0, 150),
        priority: a.priority,
        status: a.status
      })),
      annotationInsights: {
        totals: dataset.annotationInsights.totals,
        flagged: dataset.annotationInsights.flagged.slice(0, 3),
        assignments: dataset.annotationInsights.assignments.slice(0, 3)
      },
      firmContext: dataset.firmContext || {}
    }
  }

  ServiceClass.prototype.buildNarrativeSystemPrompt = function(dataset) {
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

  ServiceClass.prototype.buildNarrativeUserPrompt = function(payload) {
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

  ServiceClass.prototype.buildChangeDetectionSystemPrompt = function() {
    return 'You analyze week-over-week regulatory changes. Reply with strict JSON only. Format your response as valid JSON without any markdown code blocks or additional text.'
  }

  ServiceClass.prototype.buildChangeDetectionUserPrompt = function(payload) {
    return JSON.stringify({
      instruction: 'Compare current week and previous week updates. Populate arrays for new_themes, accelerating, resolving, shifting_focus, correlations. Each item requires topic, evidence (array of update ids), summary, confidence (0-1), and optional notes.',
      currentWeek: payload.currentWeek,
      previousWeek: payload.previousWeek,
      historyTimeline: payload.historyTimeline,
      stats: payload.stats
    })
  }

  ServiceClass.prototype.buildOnePagerSystemPrompt = function(dataset) {
    const firm = dataset.firmContext || {}
    return [
      'You draft executive one-pagers for compliance leadership.',
      'Keep content concise, professional, and insight-led.',
      firm.sectors ? `Focus on sectors: ${firm.sectors.join(', ')}.` : '',
      firm.jurisdictions ? `Consider jurisdictions: ${firm.jurisdictions.join(', ')}.` : ''
    ].filter(Boolean).join(' ')
  }

  ServiceClass.prototype.buildOnePagerUserPrompt = function(payload) {
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

  ServiceClass.prototype.buildTeamBriefingSystemPrompt = function(dataset) {
    return [
      'You create detailed team briefings for compliance analysts.',
      'Capture discussion points, questions, resource needs, and timelines.',
      dataset.firmContext?.departments ? `Prioritize departments: ${dataset.firmContext.departments.join(', ')}.` : ''
    ].filter(Boolean).join(' ')
  }

  ServiceClass.prototype.buildTeamBriefingUserPrompt = function(payload) {
    return [
      'Generate a team briefing incorporating updates, annotations, and statuses.',
      'Surface the latest flagged items, assignments, and open tasks from annotationInsights with clear owners and next steps.',
      'Provide discussion prompts and resource requirements grouped by department/persona.',
      'Use structured sections with sub-headings and bullet lists where appropriate.',
      'Reference update IDs inline when summarising evidence.',
      JSON.stringify(payload)
    ].join('\n')
  }

  ServiceClass.prototype.callOpenRouter = async function({
    system,
    user,
    temperature = 0.7,
    expectJson = false,
    retries = 3
  }) {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('No AI endpoint configured')
    }

    const headers = this.useGroq
      ? {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      : {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://horizon-scanner.app',
          'X-Title': 'Horizon Scanner'
        }

    let lastError
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(this.endpoint, {
          model: this.model,
          temperature,
          max_tokens: expectJson ? 1500 : 1800,
          response_format: expectJson ? { type: 'json_object' } : undefined,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        }, {
          headers,
          timeout: this.useGroq ? 60000 : 90000
        })

        const choice = response.data?.choices?.[0]
        const content = choice?.message?.content
        if (!content) {
          throw new Error('No content returned from model')
        }

        let parsedContent = content
        if (expectJson) {
          try {
            parsedContent = JSON.parse(content)
          } catch (error) {
            throw new Error(`Invalid JSON response: ${error.message}`)
          }
        }

        return {
          content: parsedContent,
          usage: response.data?.usage || null,
          model: response.data?.model || this.model
        }
      } catch (error) {
        lastError = error
        const status = error.response?.status
        const retryableStatus = status && [429, 500, 502, 503, 504].includes(status)
        const shouldRetry = retryableStatus || error.code === 'ECONNABORTED'

        if (!shouldRetry || attempt === retries) {
          throw lastError
        }

        const backoff = 2000 * attempt + Math.random() * 500
        await new Promise(resolve => setTimeout(resolve, backoff))
      }
    }

    throw lastError || new Error('Failed to call OpenRouter')
  }
}

module.exports = applyPromptMethods
