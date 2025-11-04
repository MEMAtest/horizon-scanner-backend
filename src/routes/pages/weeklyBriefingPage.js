const smartBriefingService = require('../../services/smartBriefingService')
const { getSidebar } = require('../templates/sidebar')
const { getCommonStyles } = require('../templates/commonStyles')
const { getClientScripts } = require('../templates/clientScripts')
const {
  MAX_HIGHLIGHT_UPDATES,
  MAX_UPDATES_PER_GROUP,
  buildInitialMetaHtml,
  buildInitialNarrativeHtml,
  buildInitialOnePagerHtml,
  buildInitialStatsHtml,
  buildInitialTeamBriefingHtml,
  buildInitialTimelineHtml,
  buildInitialUpdatesHtml,
  serialize
} = require('../../views/weeklyBriefing/builders')
const {
  renderWeeklyBriefingPage,
  buildConfigSeed
} = require('../../views/weeklyBriefing/layout')

function summariseStats(briefing) {
  if (!briefing) {
    return {
      totalUpdates: 0,
      byImpact: { Significant: 0, Moderate: 0, Informational: 0 }
    }
  }

  const stats = briefing?.dataset?.stats
  if (stats && typeof stats.totalUpdates === 'number') {
    const impact = stats.byImpact || {}
    return {
      totalUpdates: stats.totalUpdates,
      byImpact: {
        Significant: impact.Significant || 0,
        Moderate: impact.Moderate || 0,
        Informational: impact.Informational || 0
      }
    }
  }

  const updates = Array.isArray(briefing?.dataset?.currentUpdates) ? briefing.dataset.currentUpdates : []
  const derivedImpact = updates.reduce((acc, update) => {
    const impact = (update?.impact_level || update?.impact || 'informational').toString().toLowerCase()
    if (impact.includes('significant') || impact.includes('high')) {
      acc.Significant += 1
    } else if (impact.includes('moderate')) {
      acc.Moderate += 1
    } else {
      acc.Informational += 1
    }
    return acc
  }, { Significant: 0, Moderate: 0, Informational: 0 })

  return {
    totalUpdates: updates.length,
    byImpact: derivedImpact
  }
}

async function pickActiveBriefing({ latest, recentBriefings, service }) {
  const latestStats = summariseStats(latest)
  if (latestStats.totalUpdates > 0) {
    return latest
  }

  if (!Array.isArray(recentBriefings)) {
    return latest
  }

  for (const entry of recentBriefings) {
    if (!entry?.id) continue
    if (latest && entry.id === latest.id) continue
    try {
      const candidate = await service.getBriefing(entry.id)
      if (summariseStats(candidate).totalUpdates > 0) {
        return candidate
      }
    } catch (error) {
      console.warn('[weekly-briefing] Failed to load fallback briefing', entry.id, error.message)
    }
  }

  return latest
}

async function renderWeeklyBriefing(req, res) {
  try {
    const sidebar = await getSidebar('weekly-roundup')

    let latestBriefing = null
    try {
      latestBriefing = await smartBriefingService.getLatestBriefing()
      if (latestBriefing) {
        console.log(
          '[weekly-briefing] Loaded latest briefing',
          latestBriefing.id,
          'with',
          latestBriefing?.dataset?.currentUpdates?.length || 0,
          'updates'
        )
      } else {
        console.log('[weekly-briefing] No stored briefing found')
      }
    } catch (error) {
      console.warn('[weekly-briefing] Failed to load latest briefing:', error.message)
      latestBriefing = null
    }

    const recentBriefings = await smartBriefingService.listBriefings(5).catch(() => [])

    const activeBriefing = await pickActiveBriefing({
      latest: latestBriefing,
      recentBriefings,
      service: smartBriefingService
    })
    const statsSummary = summariseStats(activeBriefing)

    const initialNarrativeHtml = buildInitialNarrativeHtml(activeBriefing)
    const initialStatsHtml = buildInitialStatsHtml(activeBriefing)
    const initialTimelineHtml = buildInitialTimelineHtml(activeBriefing)
    const initialUpdatesHtml = buildInitialUpdatesHtml(activeBriefing)
    const initialOnePagerHtml = buildInitialOnePagerHtml(activeBriefing)
    const initialTeamBriefingHtml = buildInitialTeamBriefingHtml(activeBriefing)
    const initialMetaHtml = buildInitialMetaHtml(activeBriefing)

    const highlightSeed = Array.isArray(activeBriefing?.dataset?.highlightUpdates) &&
      activeBriefing.dataset.highlightUpdates.length > 0
      ? activeBriefing.dataset.highlightUpdates
      : activeBriefing?.dataset?.currentUpdates || []

    const html = renderWeeklyBriefingPage({
      sidebar,
      commonStyles: getCommonStyles(),
      clientScripts: getClientScripts(),
      sections: {
        metaHtml: initialMetaHtml,
        narrativeHtml: initialNarrativeHtml,
        updatesHtml: initialUpdatesHtml,
        onePagerHtml: initialOnePagerHtml
      },
      sidebarData: {
        stats: {
          totalUpdates: statsSummary.totalUpdates,
          highImpact: statsSummary.byImpact.Significant,
          moderate: statsSummary.byImpact.Moderate,
          informational: statsSummary.byImpact.Informational
        },
        recentBriefings: recentBriefings.map(b => ({
          id: b.id,
          date: b.generatedAt ? new Date(b.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown',
          title: `Week ${b.week || 'N/A'}`
        })),
        metrics: {
          coverage: '100%',
          velocity: 'Normal',
          alerts: 0
        },
        annotations: {
          total: 0,
          flagged: 0,
          actionRequired: 0
        }
      },
      serialized: {
        briefing: serialize(activeBriefing),
        recent: serialize(recentBriefings),
        initialUpdates: serialize(highlightSeed),
        configSeed: buildConfigSeed({
          maxHighlightUpdates: MAX_HIGHLIGHT_UPDATES,
          maxUpdatesPerGroup: MAX_UPDATES_PER_GROUP
        })
      }
    })

    res.send(html)
  } catch (error) {
    console.error('Error rendering weekly smart briefing page:', error)
    res.status(500).send(`
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1>Error - Weekly Smart Briefing</h1>
        <p style="color: #6b7280; margin: 1rem 0;">${error.message}</p>
        <a href="/dashboard" style="color: #3b82f6; text-decoration: none;">&larr; Back to Dashboard</a>
      </div>
    `)
  }
}

module.exports = renderWeeklyBriefing
