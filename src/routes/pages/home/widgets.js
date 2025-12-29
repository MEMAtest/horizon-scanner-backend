function generateInsightCards(recentUpdates, systemStats, calendarEvents = []) {
  const highlights = buildHomepageHighlights(recentUpdates, systemStats, calendarEvents)
  return highlights.map(item => `
        <article class="insight-card">
            <span class="insight-label">${escapeHtml(item.label)}</span>
            <h3 class="insight-headline">${escapeHtml(item.headline)}</h3>
            <p class="insight-body">${escapeHtml(item.body)}</p>
            ${item.meta ? `<div class="insight-meta">${escapeHtml(item.meta)}</div>` : ''}
        </article>
    `).join('')
}

function buildHomepageHighlights(recentUpdates = [], systemStats = {}, calendarEvents = []) {
  const highlights = []

  if (recentUpdates.length > 0) {
    const authorityCounts = {}
    recentUpdates.forEach(update => {
      const authority = update.authority || 'Unknown'
      authorityCounts[authority] = (authorityCounts[authority] || 0) + 1
    })

    const sortedAuthorities = Object.entries(authorityCounts).sort((a, b) => b[1] - a[1])
    if (sortedAuthorities.length > 0) {
      const [authority, count] = sortedAuthorities[0]
      highlights.push({
        label: 'Authority focus',
        headline: `${authority} leading recent activity`,
        body: `${count} update${count === 1 ? '' : 's'} captured across the latest feed.`,
        meta: 'Monitoring window: last refresh'
      })
    }
  }

  // Use calendar events for deadline count (more accurate)
  const now = Date.now()
  const upcomingDeadlines = calendarEvents.filter(event => {
    if (!event.eventDate) return false
    const due = new Date(event.eventDate).getTime()
    return !Number.isNaN(due) && due >= now && due - now <= 14 * 24 * 60 * 60 * 1000
  }).length

  const consultationCount = calendarEvents.filter(e =>
    e.eventType === 'consultation' || e.sourceType === 'consultation'
  ).length

  highlights.push({
    label: 'Upcoming deadlines',
    headline: `${upcomingDeadlines} deadline${upcomingDeadlines === 1 ? '' : 's'} in next 14 days`,
    body: consultationCount
      ? `${consultationCount} consultation${consultationCount === 1 ? '' : 's'} currently open for response.`
      : 'Review the calendar for all upcoming regulatory events.',
    meta: 'From regulatory calendar'
  })

  if (highlights.length < 2) {
    highlights.push({
      label: 'Platform coverage',
      headline: `${formatNumber(systemStats.totalUpdates || 0)} updates tracked`,
      body: 'Monitoring engine remains active across all regulatory sources.',
      meta: 'Live coverage'
    })
  }

  return highlights.slice(0, 2)
}

function generateQuickNav() {
  const iconSet = {
    intelligence: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5" fill="none"></circle><path d="M12 6.5v11M6.5 12h11" stroke-linecap="round"></path><circle cx="12" cy="12" r="8.3" fill="none"></circle></svg>',
    authority: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 4.5 8v12h15V8L12 4z" fill="none" stroke-linejoin="round"></path><path d="M7.5 11v7M12 11v7M16.5 11v7" stroke-linecap="round"></path><path d="M5 19h14" stroke-linecap="round"></path></svg>',
    sector: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17h16" stroke-linecap="round"></path><rect x="5.5" y="10.5" width="3.5" height="6.5" rx="1"></rect><rect x="10.25" y="8" width="3.5" height="9" rx="1"></rect><rect x="15" y="5.5" width="3.5" height="11.5" rx="1"></rect></svg>',
    brief: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h8.5L19 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" fill="none" stroke-linejoin="round"></path><path d="M15.5 4.5V8H19" fill="none" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.5 12h5M9.5 15h3.5" stroke-linecap="round"></path></svg>',
    planner: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 6h4v4h-4zM14.5 6h4v4h-4zM10.5 14h3" stroke-linecap="round"></path><path d="M5.5 18h13" stroke-linecap="round"></path><path d="M11 10v2a2 2 0 0 0 2 2h1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
  }

  const iconWithStroke = (svg) => svg.replace(/<svg /, '<svg stroke="currentColor" ')

  const links = [
    { icon: iconWithStroke(iconSet.intelligence), label: 'Intelligence Center', meta: 'Triage & prioritise', href: '/ai-intelligence' },
    { icon: iconWithStroke(iconSet.authority), label: 'Authority Spotlight', meta: 'Momentum & enforcement', href: '/authority-spotlight/FCA' },
    { icon: iconWithStroke(iconSet.sector), label: 'Sector Pressure', meta: 'Sector-specific trends', href: '/sector-intelligence/Banking' },
    { icon: iconWithStroke(iconSet.brief), label: 'Weekly Brief', meta: 'Executive summary', href: '/weekly-roundup' },
    { icon: iconWithStroke(iconSet.planner), label: 'Implementation Planner', meta: 'Plan next steps', href: '/dashboard' }
  ]

  return links.map(link => `
    <a class="quick-chip" href="${link.href}">
        <span class="quick-chip-icon" aria-hidden="true">${link.icon}</span>
        <span>
            <span class="chip-label">${escapeHtml(link.label)}</span>
            <span class="chip-meta">${escapeHtml(link.meta)}</span>
        </span>
    </a>
  `).join('')
}

function generateModuleGrid(systemStats = {}, aiInsights = []) {
  const modules = [
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
      title: 'Intelligence Center',
      metric: formatNumber(systemStats.totalUpdates || 0),
      statLabel: 'updates tracked',
      description: 'Dashboard for triage, prioritisation, and follow-up capture.',
      link: '/ai-intelligence',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M6.5 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M12 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M17.5 10.5v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M5 9l7-5 7 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>',
      title: 'Authority Spotlight',
      metric: formatNumber(systemStats.activeAuthorities || 0),
      statLabel: 'active authorities',
      description: 'Momentum analysis and coordination signals across regulators.',
      link: '/authority-spotlight/FCA',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><rect x="6" y="11" width="3" height="6" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="10.5" y="9" width="3" height="8" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect><rect x="15" y="7" width="3" height="10" rx="0.8" fill="none" stroke="currentColor" stroke-width="1.6"></rect></svg>',
      title: 'Sector Pressure',
      metric: formatNumber(systemStats.highImpact || 0),
      statLabel: 'high-impact items',
      description: 'Sector dashboards covering pressure scores, deadlines, and owners.',
      link: '/sector-intelligence/Banking',
      linkText: 'Open dashboard'
    },
    {
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5h9l3 3v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M15 4.5V9h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 12h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><path d="M9 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>',
      title: 'Weekly Brief',
      metric: formatNumber(aiInsights.length || 0),
      statLabel: 'insights queued',
      description: 'Download or trigger the latest executive-ready weekly summary.',
      link: '/weekly-roundup',
      linkText: 'Open dashboard'
    }
  ]

  return modules.map(module => `
        <article class="module-card">
            <div class="module-icon">${module.icon}</div>
            <div class="module-label">Dashboard View</div>
            <h3 class="module-title">${escapeHtml(module.title)}</h3>
            <div class="module-metric">${escapeHtml(module.metric)}</div>
            <div class="module-stat-label">${escapeHtml(module.statLabel)}</div>
            <p class="module-description">${escapeHtml(module.description)}</p>
            <a class="module-link" href="${module.link}">${escapeHtml(module.linkText)} →</a>
        </article>
    `).join('')
}

function generateRecentUpdatesPreview(updates) {
  if (!updates || updates.length === 0) {
    return `
            <li class="update-item">
                <span class="update-badge">—</span>
                <div class="update-copy">
                    <div class="update-headline">No updates captured yet</div>
                    <div class="update-meta">The monitoring engine will surface new items as soon as they arrive.</div>
                </div>
            </li>
        `
  }

  // Limit to 10 most recent updates for home page
  const limitedUpdates = updates.slice(0, 10)

  return limitedUpdates.map(update => {
    const dateMeta = formatRelativeDate(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)
    const impact = update.impactLevel || update.impact_level || 'Informational'
    const deadlineRaw = update.compliance_deadline || update.complianceDeadline
    const deadline = deadlineRaw ? formatShortDate(deadlineRaw) : null
    const headline = escapeHtml(update.headline || 'Untitled update')
    const linkOpen = update.url ? `<a href="${escapeAttribute(update.url)}" target="_blank" rel="noopener">${headline}</a>` : headline

    return `
        <li class="update-item">
            <span class="update-badge">${escapeHtml(update.authority || 'Unknown')}</span>
            <div class="update-copy">
                <div class="update-headline">${linkOpen}</div>
                <div class="update-meta">
                    <span>${escapeHtml(dateMeta)}</span>
                    <span>${escapeHtml(impact)}</span>
                    ${deadline ? `<span>Deadline: ${escapeHtml(deadline)}</span>` : ''}
                </div>
            </div>
        </li>
    `
  }).join('')
}

function formatNumber(value) {
  try {
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value || 0)
  } catch (error) {
    return String(value || 0)
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\s/g, '%20')
}

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatRelativeDate(dateString) {
  if (!dateString) return 'Unknown'

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`

  return date.toLocaleDateString('en-UK', {
    day: 'numeric',
    month: 'short'
  })
}

function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

function selectPriorityUpdate(updates = []) {
  if (!Array.isArray(updates) || updates.length === 0) return null
  const today = updates.filter(update => isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt))
  const candidates = today.length ? today : updates
  const scored = candidates.map(update => {
    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    const urgency = (update.urgency || '').toLowerCase()
    let score = 0
    if (impact === 'significant' || impact === 'critical') score += 5
    else if (impact === 'moderate') score += 3
    if (urgency === 'high') score += 4
    else if (urgency === 'medium') score += 2
    if (isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt)) score += 3
    return { update, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.update || null
}

function formatHeatMeta(updates = []) {
  const todayUpdates = updates.filter(update => isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt))
  const highImpact = todayUpdates.filter(update => {
    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    return impact === 'significant' || impact === 'critical'
  })
  const level = highImpact.length >= 3 || todayUpdates.length >= 8
    ? 'high'
    : highImpact.length >= 1 || todayUpdates.length >= 3
      ? 'moderate'
      : 'low'
  return {
    level,
    todayCount: todayUpdates.length,
    highImpactCount: highImpact.length
  }
}

function renderPriorityStrip(updates = []) {
  const priority = selectPriorityUpdate(updates)
  const heat = formatHeatMeta(updates)
  if (!priority) return ''

  const impact = (priority.impactLevel || priority.impact_level || 'Informational')
  const urgency = priority.urgency || '—'
  const summary = priority.summary || priority.ai_summary || 'Most recent high-impact update for today.'
  const heatLabel = heat.level === 'high' ? 'High' : heat.level === 'moderate' ? 'Moderate' : 'Low'

  return `
        <section class="priority-panel">
            <div class="priority-primary">
                <span class="priority-lead">Top Impact Today</span>
                <h3>${escapeHtml(priority.headline || 'Priority update')}</h3>
                <p class="priority-summary">${escapeHtml(summary.substring(0, 200))}</p>
                <div class="priority-meta">
                    <span class="pill impact-${impact.toLowerCase()}">${escapeHtml(impact)}</span>
                    <span class="pill urgency-${String(urgency).toLowerCase()}">Urgency: ${escapeHtml(urgency)}</span>
                    <span class="pill">${escapeHtml(priority.authority || 'Unknown')}</span>
                </div>
                <div class="priority-actions">
                    <a class="primary-chip" href="/dashboard?range=today&impact=Significant,Moderate&sort=newest">Open Today</a>
                    <a class="ghost-chip" href="/dashboard?sort=newest">Go to Dashboard</a>
                    <a class="ghost-chip" href="/ai-intelligence">Open Intelligence Center</a>
                </div>
            </div>
            <div class="priority-side">
                <div class="heat-label">Today heat</div>
                <div class="heat-pill ${heat.level}">${heatLabel}</div>
                <div class="heat-meta">New today: ${heat.todayCount} • High impact: ${heat.highImpactCount}</div>
                <a class="ghost-chip" href="/dashboard?range=today&sort=newest">View all today →</a>
            </div>
        </section>
    `
}

function renderForYouStrip(updates = []) {
  const today = updates.filter(update => isToday(update.publishedDate || update.published_date || update.fetchedDate || update.createdAt))
  const shortlist = (today.length ? today : updates).slice(0, 4)
  if (!shortlist.length) return ''

  const cards = shortlist.map(update => {
    const impact = (update.impactLevel || update.impact_level || 'Informational')
    const urgency = update.urgency || '—'
    return `
            <article class="for-you-card">
                <div class="for-you-title">${escapeHtml(update.headline || 'Untitled update')}</div>
                <div class="for-you-meta">
                    <span class="pill impact-${impact.toLowerCase()}">${escapeHtml(impact)}</span>
                    <span class="pill">${escapeHtml(update.authority || 'Unknown')}</span>
                    <span class="pill urgency-${String(urgency).toLowerCase()}">${escapeHtml(urgency)}</span>
                </div>
                <div class="for-you-actions">
                    <a class="module-link" href="${update.url ? escapeAttribute(update.url) : '/update/' + escapeAttribute(update.id || '')}" target="_blank" rel="noopener">View →</a>
                    <a class="module-link" href="/dashboard?range=today&impact=${escapeAttribute(impact)}&sort=newest">Open in dashboard →</a>
                </div>
            </article>
        `
  }).join('')

  return `
        <section class="for-you-panel">
            <div class="panel-header">
                <h2 class="panel-title">For you today</h2>
                <a class="panel-link" href="/dashboard?range=today&sort=newest">Open today view →</a>
            </div>
            <div class="for-you-grid">
                ${cards}
            </div>
        </section>
    `
}

// =========================================================================
// Top Fines Widget Functions
// =========================================================================

function renderTopFinesWidget(fines = []) {
  const currentYear = new Date().getFullYear()

  if (!fines || fines.length === 0) {
    return `
      <section class="fines-widget">
        <div class="fines-widget-header">
          <h2 class="fines-widget-title">
            <span class="icon">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
            Top 5 FCA Fines ${currentYear}
          </h2>
          <a class="panel-link" href="/enforcement">View all enforcement →</a>
        </div>
        <div class="fines-empty">
          <p>No fines data available for ${currentYear} yet.</p>
        </div>
      </section>
    `
  }

  const totalAmount = fines.reduce((sum, f) => sum + (f.amount || 0), 0)

  const rows = fines.map((fine, index) => {
    const rank = index + 1
    const firm = escapeHtml(fine.firm_individual || 'Unknown Firm')
    const amount = formatCurrency(fine.amount)
    const breach = fine.breach_categories && Array.isArray(fine.breach_categories)
      ? fine.breach_categories[0]
      : (fine.breach_type || 'Unknown')
    const date = fine.date_issued
      ? new Date(fine.date_issued).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      : 'N/A'

    return `
      <tr>
        <td class="fine-rank ${rank <= 3 ? 'top-3' : ''}">#${rank}</td>
        <td class="fine-firm" title="${firm}">${firm}</td>
        <td class="fine-amount">${amount}</td>
        <td><span class="fine-breach">${escapeHtml(breach)}</span></td>
        <td class="fine-date">${date}</td>
      </tr>
    `
  }).join('')

  return `
    <section class="fines-widget">
      <div class="fines-widget-header">
        <h2 class="fines-widget-title">
          <span class="icon">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </span>
          Top 5 FCA Fines ${currentYear}
        </h2>
        <a class="panel-link" href="/enforcement">View all enforcement →</a>
      </div>
      <table class="fines-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Firm / Individual</th>
            <th>Amount</th>
            <th>Breach Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.85rem; color: #64748b;">Total top 5 fines:</span>
        <span style="font-size: 1.1rem; font-weight: 700; color: #dc2626;">${formatCurrency(totalAmount)}</span>
      </div>
    </section>
  `
}

function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return '£0'

  if (amount >= 1000000) {
    return '£' + (amount / 1000000).toFixed(1) + 'M'
  } else if (amount >= 1000) {
    return '£' + (amount / 1000).toFixed(0) + 'K'
  }
  return '£' + amount.toLocaleString('en-GB')
}

// =========================================================================
// Authority Heatmap Functions
// =========================================================================

function calculateAuthorityActivity(updates = []) {
  const authorityCounts = {}

  updates.forEach(update => {
    const authority = update.authority || 'Unknown'
    if (!authorityCounts[authority]) {
      authorityCounts[authority] = { total: 0, highImpact: 0 }
    }
    authorityCounts[authority].total++

    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    if (impact === 'significant' || impact === 'critical' || impact === 'high') {
      authorityCounts[authority].highImpact++
    }
  })

  // Convert to sorted array
  return Object.entries(authorityCounts)
    .map(([name, data]) => ({
      name,
      total: data.total,
      highImpact: data.highImpact,
      level: data.total >= 8 ? 'high' : data.total >= 4 ? 'medium' : 'low'
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
}

function renderAuthorityHeatmap(updates = []) {
  const authorities = calculateAuthorityActivity(updates)

  if (authorities.length === 0) {
    return `
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3 class="chart-card-title">Authority Activity</h3>
            <p class="chart-card-subtitle">No activity data available</p>
          </div>
        </div>
      </div>
    `
  }

  const badges = authorities.map(auth => `
    <a href="/authority-spotlight/${encodeURIComponent(auth.name)}" class="heat-badge heat-${auth.level}" title="${auth.total} updates, ${auth.highImpact} high-impact">
      <span>${escapeHtml(auth.name)}</span>
      <span class="count">${auth.total}</span>
    </a>
  `).join('')

  return `
    <div class="chart-card">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-card-title">Authority Activity</h3>
          <p class="chart-card-subtitle">Updates by regulator this period</p>
        </div>
        <a class="panel-link" href="/authority-spotlight/FCA">View all →</a>
      </div>
      <div class="authority-heatmap">
        ${badges}
      </div>
    </div>
  `
}

// =========================================================================
// Sector Pressure Chart Functions
// =========================================================================

function calculateSectorPressure(updates = []) {
  const sectorData = {}

  updates.forEach(update => {
    const sector = update.sector || 'General'
    if (!sectorData[sector]) {
      sectorData[sector] = { total: 0, highImpact: 0 }
    }
    sectorData[sector].total++

    const impact = (update.impactLevel || update.impact_level || '').toLowerCase()
    if (impact === 'significant' || impact === 'critical' || impact === 'high') {
      sectorData[sector].highImpact++
    }
  })

  // Calculate pressure score and convert to array
  const sectors = Object.entries(sectorData)
    .map(([name, data]) => {
      // Pressure score: weighted combination of total and high-impact
      const pressure = Math.round(((data.highImpact * 2) + data.total) * 10 / 3)
      return {
        name,
        total: data.total,
        highImpact: data.highImpact,
        pressure: Math.min(pressure, 100), // Cap at 100%
        level: pressure >= 70 ? 'high' : pressure >= 40 ? 'medium' : 'low'
      }
    })
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, 6)

  // Normalize to max pressure
  const maxPressure = Math.max(...sectors.map(s => s.pressure), 1)
  sectors.forEach(s => {
    s.normalizedPressure = Math.round((s.pressure / maxPressure) * 100)
  })

  return sectors
}

function renderSectorPressureChart(updates = []) {
  const sectors = calculateSectorPressure(updates)

  if (sectors.length === 0) {
    return `
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <h3 class="chart-card-title">Sector Risk Pressure</h3>
            <p class="chart-card-subtitle">No sector data available</p>
          </div>
        </div>
      </div>
    `
  }

  const bars = sectors.map(sector => `
    <div class="pressure-row">
      <span class="pressure-label" title="${sector.name}">${escapeHtml(sector.name)}</span>
      <div class="pressure-bar-container">
        <div class="pressure-bar ${sector.level}" style="width: ${sector.normalizedPressure}%">
          ${sector.normalizedPressure >= 20 ? `<span class="pressure-value">${sector.pressure}%</span>` : ''}
        </div>
      </div>
    </div>
  `).join('')

  return `
    <div class="chart-card">
      <div class="chart-card-header">
        <div>
          <h3 class="chart-card-title">Sector Risk Pressure</h3>
          <p class="chart-card-subtitle">Regulatory activity by sector</p>
        </div>
        <a class="panel-link" href="/sector-intelligence/Banking">View all →</a>
      </div>
      <div class="pressure-chart">
        ${bars}
      </div>
    </div>
  `
}

// =========================================================================
// Quick Actions Widget
// =========================================================================

function renderQuickActionsWidget(updates = []) {
  // Get high-impact items
  const highImpact = updates.filter(u => {
    const impact = (u.impactLevel || u.impact_level || '').toLowerCase()
    return impact === 'significant' || impact === 'critical' || impact === 'high'
  }).slice(0, 4)

  const actionItems = highImpact.map(item => {
    const impact = (item.impactLevel || item.impact_level || 'Moderate')
    return `
      <div class="action-item" title="${escapeHtml(item.headline || 'Update')}">
        <div class="action-indicator ${impact.toLowerCase()}"></div>
        <div class="action-content">
          <div class="action-title">${escapeHtml((item.headline || 'Untitled').substring(0, 50))}${(item.headline || '').length > 50 ? '...' : ''}</div>
          <div class="action-meta">
            <span class="action-authority">${escapeHtml(item.authority || 'Unknown')}</span>
            <span class="action-impact">${escapeHtml(impact)}</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="quick-actions-widget">
      <div class="quick-actions-header">
        <div class="quick-actions-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Priority Actions
        </div>
        <a href="/ai-intelligence" class="quick-actions-link">View All →</a>
      </div>
      <div class="quick-actions-body">
        ${actionItems || '<div class="action-empty">No high-priority items</div>'}
      </div>
      <div class="quick-actions-footer">
        <a href="/dashboard?impact=Significant" class="action-btn">Review High Impact</a>
        <a href="/ai-intelligence" class="action-btn secondary">Intelligence Center</a>
      </div>
    </div>
  `
}

module.exports = {
  formatNumber,
  generateInsightCards,
  generateQuickNav,
  generateModuleGrid,
  generateRecentUpdatesPreview,
  renderPriorityStrip,
  renderForYouStrip,
  renderTopFinesWidget,
  renderAuthorityHeatmap,
  renderSectorPressureChart,
  renderQuickActionsWidget
}
