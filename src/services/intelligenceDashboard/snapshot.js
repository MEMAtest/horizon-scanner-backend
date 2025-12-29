function stripSensitiveFields(update) {
  if (!update) return update
  return { ...update }
}

function buildClientSnapshot(snapshot) {
  return {
    generatedAt: snapshot.generatedAt,
    snapshotDate: snapshot.snapshotDate,
    riskPulse: snapshot.riskPulse,
    focusHeadline: snapshot.focusHeadline,
    heroInsight: snapshot.heroInsight,
    quickStats: snapshot.quickStats,
    executiveSummary: snapshot.executiveSummary,
    streams: {
      high: (snapshot.streams.high || []).map(stripSensitiveFields),
      medium: (snapshot.streams.medium || []).map(stripSensitiveFields),
      low: (snapshot.streams.low || []).map(stripSensitiveFields)
    },
    personas: Object.fromEntries(
      Object.entries(snapshot.personas || {}).map(([persona, data]) => [
        persona,
        {
          ...data,
          briefing: snapshot.personaBriefings?.[persona] || { summary: 'No priority actions detected.', nextSteps: [] }
        }
      ])
    ),
    personaBriefings: snapshot.personaBriefings,
    recommendedWorkflows: snapshot.recommendedWorkflows,
    savedWorkflows: snapshot.savedWorkflows,
    workspace: {
      stats: snapshot.workspace.stats,
      tasks: snapshot.workspace.tasks,
      pinnedItems: (snapshot.workspace.pinnedItems || []).map(item => ({
        update_url: item.update_url,
        title: item.update_title || item.title || '',
        authority: item.update_authority || item.authority || '',
        pinned_date: item.pinned_date || null
      })),
      savedSearches: snapshot.workspace.savedSearches,
      customAlerts: snapshot.workspace.customAlerts,
      annotationSummary: snapshot.workspace.annotationSummary
    },
    timeline: snapshot.timeline,
    themes: snapshot.themes,
    profile: snapshot.profile,
    profileBehaviour: snapshot.profileBehaviour
  }
}

module.exports = {
  buildClientSnapshot,
  stripSensitiveFields
}
