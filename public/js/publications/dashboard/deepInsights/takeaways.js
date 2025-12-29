export function renderDeepTakeaways() {
  const container = document.getElementById('takeaways-deep-grid')
  if (!container) return

  // Generate takeaways based on enforcement patterns
  const takeaways = []

  // From outcome analysis - primary focus
  if (this.outcomeAnalysis?.outcomes?.length > 0) {
    const topOutcome = this.outcomeAnalysis.outcomes[0]
    const secondOutcome = this.outcomeAnalysis.outcomes[1]

    takeaways.push({
      icon: '1',
      title: `${topOutcome.percentage}% Result in ${topOutcome.label}`,
      content: topOutcome.type === 'cancellation'
        ? 'Most FCA enforcement leads to licence revocation - often before fines are even considered. Maintain your authorisation requirements.'
        : `${topOutcome.label} is the dominant enforcement action. Understand what triggers this outcome and focus controls accordingly.`,
      color: '#ef4444'
    })

    if (secondOutcome) {
      takeaways.push({
        icon: '2',
        title: `${secondOutcome.label}: ${secondOutcome.percentage}% of Actions`,
        content: secondOutcome.description || `The second most common outcome. Combined with ${topOutcome.label}, these two cover the majority of enforcement actions.`,
        color: '#f97316'
      })
    }
  }

  // From breach summary - what triggers enforcement
  if (this.breachSummary.length > 0) {
    const topBreach = this.breachSummary[0]
    takeaways.push({
      icon: '3',
      title: `${this.formatBreachLabel(topBreach.breachType)} Triggers Most Actions`,
      content: `${topBreach.caseCount} enforcement cases stem from this breach type. Prioritise controls and training in this area to reduce regulatory risk.`,
      color: '#f59e0b'
    })
  }

  // From handbook stats - which rules matter most
  if (this.handbookStats.length >= 2) {
    const top1 = this.handbookStats[0]
    const top2 = this.handbookStats[1]
    takeaways.push({
      icon: '4',
      title: `Focus on ${top1.reference} & ${top2.reference}`,
      content: `These handbook sections are most frequently cited in enforcement. Build your compliance framework around these foundational requirements.`,
      color: '#3b82f6'
    })
  }

  // From common findings - practical learnings
  if (this.commonFindings.length > 0) {
    const topFinding = this.commonFindings[0]
    takeaways.push({
      icon: '5',
      title: 'Basic Control Failures Dominate',
      content: `"${topFinding.finding}" appears in ${topFinding.frequency} cases. Most enforcement stems from fundamental control gaps, not complex regulatory failures.`,
      color: '#8b5cf6'
    })
  }

  // Practical advice
  takeaways.push({
    icon: '6',
    title: 'Early Action Reduces Severity',
    content: 'Self-reporting and prompt remediation significantly reduce enforcement outcomes. Build a rapid response capability for compliance issues.',
    color: '#10b981'
  })

  container.innerHTML = takeaways.map(t => `
        <div class="takeaway-deep-card">
          <div class="takeaway-deep-number" style="background: ${t.color}">${t.icon}</div>
          <div class="takeaway-deep-content">
            <h4>${t.title}</h4>
            <p>${t.content}</p>
          </div>
        </div>
      `).join('')
}
