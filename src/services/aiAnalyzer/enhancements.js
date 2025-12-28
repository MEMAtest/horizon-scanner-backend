function applyEnhancementMethods(ServiceClass) {
  ServiceClass.prototype.addIntelligenceEnhancements = async function(analysis, content, url) {
    try {
      const businessImpactScore = this.calculateBusinessImpactScore(analysis, content || '')
      const implementationPhases = this.generateImplementationPhases(analysis)
      const requiredResources = this.calculateRequiredResources(analysis, businessImpactScore)
      const aiTags = this.generateAITags(analysis, content || '')
      const aiConfidenceScore = this.calculateConfidenceScore(analysis, content || '')

      // Extract all calendar-relevant dates
      const calendarDates = this.extractAllCalendarDates(content || '', analysis.keyDates || '')

      return {
        ...analysis,
        businessImpactScore,
        aiConfidenceScore,
        aiTags,
        implementationPhases,
        requiredResources,
        firmTypesAffected: analysis.primarySectors || [],
        // Primary deadline (backwards compatible)
        complianceDeadline: calendarDates.complianceDeadline || this.extractComplianceDeadline(analysis.keyDates),
        // Additional date fields for calendar
        consultationEndDate: calendarDates.consultationEndDate,
        implementationDate: calendarDates.implementationDate,
        effectiveDate: calendarDates.effectiveDate,
        reviewDate: calendarDates.reviewDate,
        allCalendarDates: calendarDates.allDates,
        sectorRelevanceScores: analysis.sectorRelevanceScores || {},
        enhancedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Error adding intelligence enhancements:', error)
      return analysis
    }
  }

  ServiceClass.prototype.calculateBusinessImpactScore = function(analysis, content = '') {
    let score = 5

    const impactMultipliers = { Significant: 1.5, Moderate: 1.0, Informational: 0.6 }
    score *= impactMultipliers[analysis.impactLevel] || 1.0

    const urgencyBonus = { High: 3, Medium: 1, Low: 0 }
    score += urgencyBonus[analysis.urgency] || 0

    const text = content.toLowerCase()
    if (text.includes('final rule') || text.includes('regulation')) score += 2
    if (text.includes('enforcement') || text.includes('fine') || text.includes('penalty')) score += 2
    if (text.includes('guidance') || text.includes('consultation')) score += 1
    if (text.includes('deadline') || text.includes('implementation date')) score += 1

    const sectorCount = analysis.primarySectors?.length || 1
    if (sectorCount > 3) score += 1

    return Math.min(Math.max(Math.round(score), 1), 10)
  }

  ServiceClass.prototype.generateImplementationPhases = function(analysis) {
    const phases = []
    const isHighImpact = analysis.impactLevel === 'Significant'
    const hasDeadline = analysis.keyDates && analysis.keyDates.includes('deadline')

    phases.push({
      phase: 'Initial Analysis',
      duration: isHighImpact ? '1-2 weeks' : '3-5 days',
      description: 'Review requirements and assess current compliance state',
      priority: 'High',
      effort: 'Medium'
    })

    if (analysis.area?.toLowerCase().includes('rule') || analysis.complianceActions) {
      phases.push({
        phase: 'Policy Development',
        duration: isHighImpact ? '4-6 weeks' : '2-3 weeks',
        description: 'Develop or update policies and procedures',
        priority: 'High',
        effort: isHighImpact ? 'High' : 'Medium'
      })
    }

    if (analysis.area?.toLowerCase().includes('report') ||
        analysis.area?.toLowerCase().includes('data') ||
        analysis.area?.toLowerCase().includes('system')) {
      phases.push({
        phase: 'System Implementation',
        duration: isHighImpact ? '8-12 weeks' : '4-6 weeks',
        description: 'Update systems, processes, and reporting mechanisms',
        priority: 'Medium',
        effort: 'High'
      })
    }

    phases.push({
      phase: 'Training & Implementation',
      duration: '2-4 weeks',
      description: 'Staff training and go-live activities',
      priority: 'Medium',
      effort: 'Medium'
    })

    if (hasDeadline) {
      phases.push({
        phase: 'Deadline Preparation',
        duration: isHighImpact ? '2-3 weeks' : '1-2 weeks',
        description: 'Coordinate tasks to meet regulatory deadlines and submission dates',
        priority: 'High',
        effort: isHighImpact ? 'High' : 'Medium'
      })
    }

    phases.push({
      phase: 'Monitoring & Review',
      duration: 'Ongoing',
      description: 'Monitor compliance and effectiveness',
      priority: 'Low',
      effort: 'Low'
    })

    return phases
  }

  ServiceClass.prototype.calculateRequiredResources = function(analysis, businessImpactScore) {
    const baseEffort = businessImpactScore * 8

    const roles = [
      {
        role: 'Compliance Officer',
        effort: `${Math.round(baseEffort * 0.5)} days`,
        skills: ['Regulatory analysis', 'Policy development', 'Risk assessment']
      }
    ]

    if (businessImpactScore >= 6) {
      roles.push({
        role: 'Legal Counsel',
        effort: `${Math.round(baseEffort * 0.3)} days`,
        skills: ['Regulatory law', 'Legal interpretation', 'Risk assessment']
      })
    }

    if (businessImpactScore >= 7) {
      roles.push({
        role: 'Business Analyst',
        effort: `${Math.round(baseEffort * 0.4)} days`,
        skills: ['Process analysis', 'Requirements gathering', 'Implementation planning']
      })
    }

    if (businessImpactScore >= 8) {
      roles.push({
        role: 'Project Manager',
        effort: `${Math.round(baseEffort * 0.3)} days`,
        skills: ['Project coordination', 'Stakeholder management', 'Implementation oversight']
      })
    }

    const estimatedCost = this.calculateCostEstimate(roles, businessImpactScore)

    return {
      totalEffortDays: Math.round(baseEffort),
      estimatedCost,
      roleBreakdown: roles,
      externalConsulting: businessImpactScore >= 8,
      trainingRequired: true,
      systemChanges: analysis.area?.toLowerCase().includes('system') ||
        analysis.area?.toLowerCase().includes('report')
    }
  }

  ServiceClass.prototype.calculateCostEstimate = function(roles, businessImpactScore) {
    const dailyRates = {
      'Compliance Officer': 800,
      'Legal Counsel': 1200,
      'Business Analyst': 700,
      'Project Manager': 900
    }

    let totalCost = 0
    roles.forEach(role => {
      const days = parseInt(role.effort.split(' ')[0], 10) || 0
      const rate = dailyRates[role.role] || 600
      totalCost += days * rate
    })

    if (businessImpactScore >= 8) {
      totalCost += 10000
    }

    return {
      internal: `£${totalCost.toLocaleString()}`,
      external: businessImpactScore >= 8 ? '£5,000 - £15,000' : 'Not required',
      total: `£${(totalCost + (businessImpactScore >= 8 ? 10000 : 0)).toLocaleString()}`
    }
  }

  ServiceClass.prototype.generateAITags = function(analysis, content) {
    const tags = []

    tags.push(`impact:${(analysis.impactLevel || 'moderate').toLowerCase()}`)
    tags.push(`urgency:${(analysis.urgency || 'medium').toLowerCase()}`)

    if (analysis.primarySectors) {
      analysis.primarySectors.forEach(sector => {
        tags.push(`sector:${sector.toLowerCase().replace(/\s+/g, '-')}`)
      })
    }

    const text = content.toLowerCase()
    if (text.includes('consultation')) tags.push('type:consultation')
    if (text.includes('final rule')) tags.push('type:final-rule')
    if (text.includes('guidance')) tags.push('type:guidance')
    if (text.includes('enforcement')) tags.push('type:enforcement')
    if (text.includes('deadline')) tags.push('has:deadline')
    if (text.includes('fine') || text.includes('penalty')) tags.push('has:penalty')

    if (analysis.area) {
      const areaTag = analysis.area.toLowerCase().replace(/\s+/g, '-')
      tags.push(`area:${areaTag}`)
    }

    return tags.filter((tag, index, self) => self.indexOf(tag) === index)
  }

  ServiceClass.prototype.calculateConfidenceScore = function(analysis, content) {
    let confidence = 0.7

    if (content.length > 1000) confidence += 0.1
    if (content.length > 3000) confidence += 0.1

    if (analysis.primarySectors && analysis.primarySectors.length > 0) confidence += 0.05
    if (analysis.keyDates && analysis.keyDates.length > 10) confidence += 0.05
    if (analysis.complianceActions && analysis.complianceActions.length > 20) confidence += 0.05
    if (analysis.sectorRelevanceScores && Object.keys(analysis.sectorRelevanceScores).length > 0) confidence += 0.05

    return Math.min(confidence, 1.0)
  }

  ServiceClass.prototype.extractComplianceDeadline = function(keyDates) {
    if (!keyDates) return null

    const dateRegex = /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}[/.-]\d{1,2}[/.-]\d{1,2}|\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi
    const matches = keyDates.match(dateRegex)

    if (matches && matches.length > 0) {
      try {
        const date = new Date(matches[0])
        if (date > new Date()) {
          return date.toISOString().split('T')[0]
        }
      } catch (error) {
        console.warn('Could not parse compliance deadline:', matches[0])
      }
    }

    return null
  }

  /**
   * Extract all calendar-relevant dates from content
   * Returns structured date information for calendar events
   */
  ServiceClass.prototype.extractAllCalendarDates = function(content, keyDates = '') {
    const results = {
      complianceDeadline: null,
      consultationEndDate: null,
      implementationDate: null,
      effectiveDate: null,
      reviewDate: null,
      allDates: []
    }

    if (!content && !keyDates) return results

    const text = `${content || ''} ${keyDates || ''}`.toLowerCase()
    const now = new Date()

    // Date patterns
    const datePatterns = [
      // "9 December 2025", "1 January 2026"
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      // "December 2025", "March 2026"
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/gi,
      // "2025-12-31", "2026-01-15"
      /(\d{4})-(\d{2})-(\d{2})/g,
      // "31/12/2025", "15/01/2026"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
      // "Q1 2026", "Q4 2025"
      /Q([1-4])\s*(\d{4})/gi,
      // "H1 2026", "H2 2025"
      /H([1-2])\s*(\d{4})/gi,
      // "early 2026", "late 2025"
      /(early|late|summer|winter|autumn|spring)\s+(\d{4})/gi
    ]

    // Context patterns to identify date types
    const contextPatterns = {
      consultation: [
        /consultation\s+(closes?|ends?|deadline|response\s+due|by)\s*[:.]?\s*/i,
        /respond\s+(by|before)\s*/i,
        /closing\s+date\s*[:.]?\s*/i,
        /responses?\s+(due|by|before)\s*/i
      ],
      implementation: [
        /implement(ation|ed)?\s+(date|by|from)\s*[:.]?\s*/i,
        /comes?\s+into\s+(force|effect)\s*[:.]?\s*/i,
        /effective\s+(from|date)\s*[:.]?\s*/i,
        /enters?\s+into\s+force\s*[:.]?\s*/i,
        /apply\s+(from|by)\s*[:.]?\s*/i
      ],
      deadline: [
        /deadline\s*[:.]?\s*/i,
        /due\s+(by|date)\s*[:.]?\s*/i,
        /must\s+(be\s+)?complete[d]?\s+by\s*/i,
        /submit\s+(by|before)\s*/i
      ],
      review: [
        /review\s+(date|period|by)\s*[:.]?\s*/i,
        /under\s+review\s+(until|by)\s*/i
      ]
    }

    // Parse dates with context
    const parseDate = (dateStr) => {
      if (!dateStr) return null

      // Q1-Q4 format
      const quarterMatch = dateStr.match(/Q([1-4])\s*(\d{4})/i)
      if (quarterMatch) {
        const quarter = parseInt(quarterMatch[1])
        const year = parseInt(quarterMatch[2])
        const month = (quarter - 1) * 3 + 1 // Q1=Feb, Q2=May, Q3=Aug, Q4=Nov (mid-quarter)
        return new Date(year, month, 15)
      }

      // H1-H2 format
      const halfMatch = dateStr.match(/H([1-2])\s*(\d{4})/i)
      if (halfMatch) {
        const half = parseInt(halfMatch[1])
        const year = parseInt(halfMatch[2])
        return half === 1 ? new Date(year, 2, 31) : new Date(year, 8, 30)
      }

      // Seasonal format
      const seasonMatch = dateStr.match(/(early|late|summer|winter|autumn|spring)\s+(\d{4})/i)
      if (seasonMatch) {
        const season = seasonMatch[1].toLowerCase()
        const year = parseInt(seasonMatch[2])
        const monthMap = { early: 2, spring: 4, summer: 7, autumn: 10, winter: 0, late: 11 }
        return new Date(year, monthMap[season], 15)
      }

      // Try standard date parsing
      const parsed = new Date(dateStr)
      return isNaN(parsed.getTime()) ? null : parsed
    }

    // Find all dates in text with surrounding context
    const fullText = `${content || ''} ${keyDates || ''}`
    const sentences = fullText.split(/[.!?\n]+/)

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()

      // Find dates in this sentence
      for (const pattern of datePatterns) {
        pattern.lastIndex = 0
        let match
        while ((match = pattern.exec(sentence)) !== null) {
          const dateStr = match[0]
          const parsedDate = parseDate(dateStr)

          if (parsedDate && parsedDate > now) {
            // Determine date type from context
            let dateType = 'deadline' // default
            let context = sentence.trim().substring(0, 200)

            for (const [type, patterns] of Object.entries(contextPatterns)) {
              for (const ctxPattern of patterns) {
                if (ctxPattern.test(lowerSentence)) {
                  dateType = type
                  break
                }
              }
            }

            const dateEntry = {
              date: parsedDate.toISOString().split('T')[0],
              type: dateType,
              context: context,
              original: dateStr
            }

            // Avoid duplicates
            const exists = results.allDates.some(d => d.date === dateEntry.date && d.type === dateEntry.type)
            if (!exists) {
              results.allDates.push(dateEntry)

              // Populate specific fields
              if (dateType === 'consultation' && !results.consultationEndDate) {
                results.consultationEndDate = dateEntry.date
              } else if (dateType === 'implementation' && !results.implementationDate) {
                results.implementationDate = dateEntry.date
              } else if (dateType === 'deadline' && !results.complianceDeadline) {
                results.complianceDeadline = dateEntry.date
              } else if (dateType === 'review' && !results.reviewDate) {
                results.reviewDate = dateEntry.date
              }
            }
          }
        }
      }
    }

    // Set effective date if implementation found
    if (results.implementationDate) {
      results.effectiveDate = results.implementationDate
    }

    // Sort allDates by date
    results.allDates.sort((a, b) => new Date(a.date) - new Date(b.date))

    return results
  }
}

module.exports = applyEnhancementMethods
