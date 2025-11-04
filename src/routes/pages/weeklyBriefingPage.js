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

    const initialNarrativeHtml = buildInitialNarrativeHtml(latestBriefing)
    const initialStatsHtml = buildInitialStatsHtml(latestBriefing)
    const initialTimelineHtml = buildInitialTimelineHtml(latestBriefing)
    const initialUpdatesHtml = buildInitialUpdatesHtml(latestBriefing)
    const initialOnePagerHtml = buildInitialOnePagerHtml(latestBriefing)
    const initialTeamBriefingHtml = buildInitialTeamBriefingHtml(latestBriefing)
    const initialMetaHtml = buildInitialMetaHtml(latestBriefing)

    const highlightSeed = Array.isArray(latestBriefing?.dataset?.highlightUpdates) &&
      latestBriefing.dataset.highlightUpdates.length > 0
      ? latestBriefing.dataset.highlightUpdates
      : latestBriefing?.dataset?.currentUpdates || []

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
          totalUpdates: latestBriefing?.dataset?.currentUpdates?.length || 0,
          highImpact: latestBriefing?.dataset?.currentUpdates?.filter(u => u.impact === 'high' || u.impact === 'significant')?.length || 0,
          moderate: latestBriefing?.dataset?.currentUpdates?.filter(u => u.impact === 'moderate')?.length || 0,
          informational: latestBriefing?.dataset?.currentUpdates?.filter(u => u.impact === 'low' || u.impact === 'informational')?.length || 0
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
        briefing: serialize(latestBriefing),
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
