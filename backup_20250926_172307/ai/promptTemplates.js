// src/ai/promptTemplates.js
// Advanced AI Prompt Engineering for Regulatory Intelligence
// Phase 3: AI Intelligence Engine

class AIPromptTemplates {
  constructor() {
    this.industrySeekutors = [
      'Banking', 'Investment Management', 'Insurance', 'Fintech',
      'Payment Services', 'Digital Assets', 'Lending', 'Pensions',
      'Capital Markets', 'Wealth Management', 'Compliance Tech', 'RegTech'
    ]

    this.regulatoryAuthorities = [
      'FCA', 'PRA', 'Bank of England', 'HM Treasury', 'FRC', 'PSR',
      'FATF', 'European Banking Authority', 'Basel Committee', 'IOSCO'
    ]

    this.impactLevels = ['Critical', 'Significant', 'Moderate', 'Informational']
    this.urgencyLevels = ['Urgent', 'High', 'Medium', 'Low']
    this.riskLevels = ['High', 'Medium', 'Low']
  }

  // ENHANCED CONTENT ANALYSIS PROMPT
  createContentAnalysisPrompt(content, url, authority = null) {
    return `You are an expert regulatory intelligence analyst with 15+ years experience in UK and international financial services regulation.

CONTENT TO ANALYZE:
${content.substring(0, 4000)}

SOURCE: ${url}
${authority ? `AUTHORITY: ${authority}` : ''}

ANALYSIS REQUIREMENTS:
Provide comprehensive regulatory intelligence analysis with the following structure:

1. HEADLINE: Create a clear, professional headline (max 120 characters)
2. BUSINESS IMPACT: Concise summary of business implications (max 300 words)
3. REGULATORY AREA: Identify specific regulatory domain/topic
4. IMPACT ASSESSMENT: Rate impact level and urgency
5. SECTOR ANALYSIS: Identify affected sectors with relevance scores
6. TEMPORAL INTELLIGENCE: Extract key dates, deadlines, implementation phases
7. COMPLIANCE REQUIREMENTS: Identify specific actions or requirements
8. RISK ASSESSMENT: Evaluate regulatory and business risks

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "headline": "Clear, actionable headline describing the regulatory development",
  "impact": "Detailed business impact summary focusing on practical implications",
  "area": "Specific regulatory area (e.g., Capital Requirements, Consumer Duty, etc.)",
  "impactLevel": "${this.impactLevels.join('|')}",
  "urgency": "${this.urgencyLevels.join('|')}",
  "sector": "Primary sector most affected",
  "primarySectors": ["Array of affected sectors from: ${this.industrySeekutors.join(', ')}"],
  "sectorRelevanceScores": {
    "Banking": 85,
    "Investment Management": 70
  },
  "keyDates": "Important dates, deadlines, implementation timeframes",
  "complianceActions": "Specific actions firms need to take",
  "riskLevel": "${this.riskLevels.join('|')}",
  "authority": "Primary regulatory authority",
  "documentType": "Type of document (Consultation, Policy Statement, etc.)",
  "consultationDeadline": "If applicable, consultation response deadline",
  "implementationDate": "If applicable, when changes take effect"
}

Focus on actionable intelligence and business relevance.`
  }

  // PATTERN RECOGNITION PROMPT
  createPatternRecognitionPrompt(recentUpdates, historicalData) {
    return `You are a regulatory pattern recognition expert. Analyze the following data to identify emerging patterns, themes, and trends.

RECENT REGULATORY UPDATES:
${JSON.stringify(recentUpdates, null, 2)}

HISTORICAL CONTEXT:
${JSON.stringify(historicalData, null, 2)}

PATTERN ANALYSIS REQUIREMENTS:
1. Identify recurring themes across authorities
2. Detect regulatory momentum and intensity changes
3. Recognize cross-sector patterns
4. Identify authority behavior patterns
5. Detect emerging regulatory priorities

Respond with ONLY valid JSON:
{
  "emergingThemes": [
    {
      "theme": "Theme name",
      "confidence": 85,
      "authorities": ["FCA", "PRA"],
      "sectors": ["Banking", "Fintech"],
      "momentum": "Increasing|Stable|Decreasing",
      "description": "Detailed theme description"
    }
  ],
  "authorityPatterns": [
    {
      "authority": "FCA",
      "pattern": "Pattern description",
      "frequency": "High|Medium|Low",
      "predictedNext": "Likely next regulatory action"
    }
  ],
  "crossSectorTrends": [
    {
      "trend": "Trend name",
      "sectors": ["Banking", "Insurance"],
      "strength": 75,
      "trajectory": "Accelerating|Stable|Declining"
    }
  ],
  "regulatoryMomentum": {
    "overall": "High|Medium|Low",
    "byAuthority": {
      "FCA": "High",
      "PRA": "Medium"
    },
    "bySector": {
      "Banking": "High",
      "Fintech": "Medium"
    }
  }
}`
  }

  // IMPACT PREDICTION PROMPT
  createImpactPredictionPrompt(update, firmProfiles, historicalImpacts) {
    return `You are a regulatory impact prediction specialist. Analyze this update and predict business impact for different firm types.

REGULATORY UPDATE:
${JSON.stringify(update, null, 2)}

FIRM PROFILES:
${JSON.stringify(firmProfiles, null, 2)}

HISTORICAL IMPACT DATA:
${JSON.stringify(historicalImpacts, null, 2)}

IMPACT PREDICTION REQUIREMENTS:
1. Predict implementation effort (hours/cost)
2. Assess compliance complexity
3. Identify affected business functions
4. Estimate timeline to compliance
5. Predict secondary impacts
6. Assess competitive implications

Respond with ONLY valid JSON:
{
  "overallImpact": {
    "level": "Critical|Significant|Moderate|Low",
    "confidence": 85,
    "reasoning": "Detailed impact reasoning"
  },
  "firmImpacts": [
    {
      "firmType": "Large Bank",
      "impactScore": 85,
      "implementationEffort": "6-12 months",
      "estimatedCost": "£500k-£2m",
      "complexityLevel": "High",
      "affectedFunctions": ["Risk", "Compliance", "Operations"],
      "keyActions": ["System updates", "Policy changes", "Training"],
      "timeline": "Detailed implementation timeline"
    }
  ],
  "industryImpact": {
    "Banking": {
      "score": 90,
      "rationale": "High impact reasoning"
    },
    "Fintech": {
      "score": 65,
      "rationale": "Medium impact reasoning"
    }
  },
  "competitiveImplications": "How this change affects competitive landscape",
  "secondaryEffects": "Indirect impacts and ripple effects"
}`
  }

  // SMART SUMMARY PROMPT
  createSmartSummaryPrompt(updates, summaryType, audience) {
    const audienceContext = {
      executive: 'senior leadership focused on strategic implications',
      technical: 'compliance professionals needing implementation details',
      weekly: 'regular monitoring and trend awareness'
    }

    return `You are a regulatory communications expert creating ${summaryType} summaries for ${audienceContext[audience] || audience}.

UPDATES TO SUMMARIZE:
${JSON.stringify(updates, null, 2)}

SUMMARY REQUIREMENTS:
- ${summaryType} format optimized for ${audience} audience
- Focus on actionable intelligence
- Highlight priority items and key trends
- Include specific next steps where applicable

${summaryType === 'executive'
? `
EXECUTIVE SUMMARY FORMAT:
- Strategic overview (2-3 sentences)
- Priority regulatory developments (top 3-5)
- Business impact assessment
- Recommended leadership actions
`
: ''}

${summaryType === 'technical'
? `
TECHNICAL SUMMARY FORMAT:
- Detailed regulatory changes
- Implementation requirements
- Compliance deadlines and actions
- Technical impact analysis
`
: ''}

${summaryType === 'weekly'
? `
WEEKLY ROUNDUP FORMAT:
- Week's regulatory highlights
- Authority activity summary
- Emerging trends and patterns
- Upcoming deadlines and consultations
`
: ''}

Respond with ONLY valid JSON:
{
  "summary": {
    "type": "${summaryType}",
    "audience": "${audience}",
    "generatedAt": "${new Date().toISOString()}",
    "headline": "Summary headline",
    "overview": "Executive overview paragraph",
    "keyDevelopments": [
      {
        "title": "Development title",
        "impact": "High|Medium|Low",
        "summary": "Development summary",
        "actions": "Required actions"
      }
    ],
    "trends": "Key trends identified",
    "upcomingDeadlines": "Important upcoming dates",
    "recommendations": "Specific recommendations for audience"
  },
  "metadata": {
    "updateCount": 15,
    "authoritiesActive": ["FCA", "PRA"],
    "sectorsAffected": ["Banking", "Fintech"],
    "urgentItems": 3
  }
}`
  }

  // FIRM MATCHING PROMPT
  createFirmMatchingPrompt(update, firmProfile) {
    return `You are a regulatory relevance scoring expert. Analyze how this regulatory update affects the specific firm profile.

REGULATORY UPDATE:
${JSON.stringify(update, null, 2)}

FIRM PROFILE:
${JSON.stringify(firmProfile, null, 2)}

RELEVANCE ANALYSIS REQUIREMENTS:
1. Calculate relevance score (0-100)
2. Identify specific impact areas
3. Assess implementation priority
4. Estimate resource requirements
5. Identify compliance gaps
6. Recommend specific actions

Respond with ONLY valid JSON:
{
  "relevanceScore": 85,
  "relevanceLevel": "High|Medium|Low",
  "reasoning": "Detailed explanation of relevance",
  "specificImpacts": [
    {
      "area": "Capital Requirements",
      "severity": "High",
      "description": "Specific impact description",
      "actionRequired": "Specific action needed"
    }
  ],
  "implementationPriority": "Urgent|High|Medium|Low",
  "resourceRequirements": {
    "effort": "Person-weeks estimate",
    "cost": "Cost estimate",
    "expertise": "Required skills/expertise"
  },
  "complianceGaps": [
    {
      "gap": "Gap description",
      "severity": "High|Medium|Low",
      "remediation": "How to address"
    }
  ],
  "recommendedActions": [
    {
      "action": "Specific action",
      "timeline": "When to complete",
      "owner": "Who should do it",
      "priority": "High|Medium|Low"
    }
  ],
  "riskAssessment": "Risk if not addressed"
}`
  }

  // DEADLINE INTELLIGENCE PROMPT
  createDeadlineIntelligencePrompt(content, existingDeadlines) {
    return `You are a regulatory deadline extraction and prediction expert. Analyze content to identify deadlines and predict upcoming regulatory activity.

CONTENT TO ANALYZE:
${content}

EXISTING DEADLINES:
${JSON.stringify(existingDeadlines, null, 2)}

DEADLINE INTELLIGENCE REQUIREMENTS:
1. Extract explicit deadlines (consultation responses, implementation dates)
2. Predict implicit deadlines (likely timeframes for regulatory action)
3. Identify consultation periods and response requirements
4. Predict follow-up regulatory activity
5. Assess deadline criticality

Respond with ONLY valid JSON:
{
  "explicitDeadlines": [
    {
      "type": "Consultation Response",
      "date": "2024-03-15",
      "description": "Deadline description",
      "authority": "FCA",
      "criticality": "High|Medium|Low",
      "requirements": "What needs to be done"
    }
  ],
  "predictedDeadlines": [
    {
      "type": "Policy Statement",
      "estimatedDate": "2024-06-30",
      "confidence": 75,
      "reasoning": "Why this deadline is predicted",
      "preparationTime": "3 months"
    }
  ],
  "consultationPeriods": [
    {
      "title": "Consultation title",
      "startDate": "2024-01-15",
      "endDate": "2024-03-15",
      "responseRequired": true,
      "keyQuestions": ["Question 1", "Question 2"]
    }
  ],
  "upcomingActivity": [
    {
      "activity": "Expected regulatory action",
      "timeframe": "Q2 2024",
      "probability": 80,
      "impact": "Expected impact"
    }
  ]
}`
  }

  // CONFIDENCE SCORING CONTEXT
  getConfidenceFactors() {
    return {
      highConfidenceIndicators: [
        'Official regulatory publication',
        'Specific dates mentioned',
        'Clear authority attribution',
        'Detailed implementation guidance',
        'Historical pattern match'
      ],
      lowConfidenceIndicators: [
        'Speculative language',
        'Unofficial sources',
        'Vague timeframes',
        'Conflicting information',
        'Novel regulatory area'
      ],
      confidenceModifiers: {
        authoritySource: +20,
        officialDocument: +15,
        specificDates: +10,
        historicalPattern: +10,
        multipleConfirmation: +15,
        speculativeLanguage: -15,
        unofficialSource: -10,
        contradictoryInfo: -20
      }
    }
  }
}

module.exports = AIPromptTemplates
