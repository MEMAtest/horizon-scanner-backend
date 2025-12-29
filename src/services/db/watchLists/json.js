const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')
const { normalizeWatchListMatch } = require('./mappers')

async function loadWatchListsJSON(service) {
  try {
    const raw = await fs.readFile(service.watchListsFile, 'utf8')
    return JSON.parse(raw) || []
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureWatchListsJSONFiles(service)
      return []
    }
    throw error
  }
}

async function saveWatchListsJSON(service, data) {
  await fs.writeFile(service.watchListsFile, JSON.stringify(data, null, 2))
}

async function loadWatchListMatchesJSON(service) {
  try {
    const raw = await fs.readFile(service.watchListMatchesFile, 'utf8')
    return JSON.parse(raw) || []
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureWatchListsJSONFiles(service)
      return []
    }
    throw error
  }
}

async function saveWatchListMatchesJSON(service, data) {
  await fs.writeFile(service.watchListMatchesFile, JSON.stringify(data, null, 2))
}

async function ensureWatchListsJSONFiles(service) {
  const dir = path.dirname(service.watchListsFile)
  await fs.mkdir(dir, { recursive: true })

  for (const file of [service.watchListsFile, service.watchListMatchesFile]) {
    try {
      await fs.access(file)
    } catch {
      await fs.writeFile(file, JSON.stringify([], null, 2))
    }
  }
}

async function getWatchListsJSON(service, userId) {
  const lists = await loadWatchListsJSON(service)
  const matches = await loadWatchListMatchesJSON(service)

  return lists
    .filter(l => l.userId === userId && l.isActive !== false)
    .map(l => ({
      ...l,
      matchCount: matches.filter(m =>
        String(m.watchListId) === String(l.id) && !m.dismissed
      ).length,
      unreviewedCount: matches.filter(m =>
        String(m.watchListId) === String(l.id) && !m.dismissed && !m.reviewed
      ).length,
      unreviewed_count: matches.filter(m =>
        String(m.watchListId) === String(l.id) && !m.dismissed && !m.reviewed
      ).length
    }))
}

async function getWatchListByIdJSON(service, watchListId, userId) {
  const lists = await loadWatchListsJSON(service)
  const matches = await loadWatchListMatchesJSON(service)

  const list = lists.find(l =>
    String(l.id) === String(watchListId) && l.userId === userId
  )

  if (!list) return null

  return {
    ...list,
    matchCount: matches.filter(m =>
      String(m.watchListId) === String(list.id) && !m.dismissed
    ).length,
    unreviewedCount: matches.filter(m =>
      String(m.watchListId) === String(list.id) && !m.dismissed && !m.reviewed
    ).length,
    unreviewed_count: matches.filter(m =>
      String(m.watchListId) === String(list.id) && !m.dismissed && !m.reviewed
    ).length
  }
}

async function createWatchListJSON(service, userId, data) {
  const lists = await loadWatchListsJSON(service)
  const now = new Date().toISOString()
  const rawThreshold = data.alertThreshold !== undefined
    ? data.alertThreshold
    : data.alert_threshold !== undefined
      ? data.alert_threshold
      : 0.5
  const parsedThreshold = Number.parseFloat(rawThreshold)
  const alertThreshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 0.5
  const alertOnMatch = data.alertOnMatch !== undefined
    ? data.alertOnMatch !== false
    : data.alert_on_match !== undefined
      ? data.alert_on_match !== false
      : true

  const newList = {
    id: crypto.randomUUID ? crypto.randomUUID() : `wl-${Date.now()}`,
    userId,
    name: data.name || 'New Watch List',
    description: data.description || null,
    keywords: data.keywords || [],
    authorities: data.authorities || [],
    sectors: data.sectors || [],
    alertOnMatch,
    alert_on_match: alertOnMatch,
    alertThreshold,
    alert_threshold: alertThreshold,
    autoAddToDossier: data.autoAddToDossier === true || data.auto_add_to_dossier === true,
    auto_add_to_dossier: data.autoAddToDossier === true || data.auto_add_to_dossier === true,
    targetDossierId: data.targetDossierId || data.target_dossier_id || null,
    target_dossier_id: data.targetDossierId || data.target_dossier_id || null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  }

  lists.push(newList)
  await saveWatchListsJSON(service, lists)
  return { ...newList, matchCount: 0, unreviewedCount: 0, unreviewed_count: 0 }
}

async function updateWatchListJSON(service, watchListId, userId, updates) {
  const lists = await loadWatchListsJSON(service)
  let updated = null

  const nextLists = lists.map(l => {
    if (String(l.id) === String(watchListId) && l.userId === userId) {
      updated = { ...l, ...updates, updatedAt: new Date().toISOString() }
      if (updates.alertOnMatch !== undefined) {
        updated.alertOnMatch = updates.alertOnMatch !== false
        updated.alert_on_match = updated.alertOnMatch
      } else if (updates.alert_on_match !== undefined) {
        updated.alert_on_match = updates.alert_on_match !== false
        updated.alertOnMatch = updated.alert_on_match
      }
      if (updates.alertThreshold !== undefined) {
        const parsed = Number.parseFloat(updates.alertThreshold)
        updated.alertThreshold = Number.isFinite(parsed) ? parsed : (updated.alertThreshold || 0.5)
        updated.alert_threshold = updated.alertThreshold
      } else if (updates.alert_threshold !== undefined) {
        const parsed = Number.parseFloat(updates.alert_threshold)
        updated.alert_threshold = Number.isFinite(parsed) ? parsed : (updated.alert_threshold || 0.5)
        updated.alertThreshold = updated.alert_threshold
      }
      if (updates.autoAddToDossier !== undefined) {
        updated.autoAddToDossier = updates.autoAddToDossier === true
        updated.auto_add_to_dossier = updated.autoAddToDossier
      } else if (updates.auto_add_to_dossier !== undefined) {
        updated.auto_add_to_dossier = updates.auto_add_to_dossier === true
        updated.autoAddToDossier = updated.auto_add_to_dossier
      }
      if (updates.targetDossierId !== undefined) {
        updated.targetDossierId = updates.targetDossierId || null
        updated.target_dossier_id = updated.targetDossierId
      } else if (updates.target_dossier_id !== undefined) {
        updated.target_dossier_id = updates.target_dossier_id || null
        updated.targetDossierId = updated.target_dossier_id
      }
      return updated
    }
    return l
  })

  if (updated) await saveWatchListsJSON(service, nextLists)
  return updated
}

async function deleteWatchListJSON(service, watchListId, userId) {
  const lists = await loadWatchListsJSON(service)
  let deleted = false

  const nextLists = lists.map(l => {
    if (String(l.id) === String(watchListId) && l.userId === userId) {
      deleted = true
      return { ...l, isActive: false, updatedAt: new Date().toISOString() }
    }
    return l
  })

  if (deleted) await saveWatchListsJSON(service, nextLists)
  return deleted
}

async function getWatchListMatchesJSON(service, watchListId, options = {}) {
  const { includeDismissed = false, limit = 50, offset = 0 } = options
  const matches = await loadWatchListMatchesJSON(service)

  const updates = await service.loadJSONData(service.updatesFile)
  const updateMap = new Map((Array.isArray(updates) ? updates : []).map(update => [String(update.id), update]))

  let filtered = matches.filter(m => {
    const matchWatchListId = m.watchListId || m.watch_list_id
    return String(matchWatchListId) === String(watchListId) &&
      (includeDismissed || !m.dismissed)
  })

  // Sort by created date descending
  filtered.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))

  return filtered.slice(offset, offset + limit).map(match => {
    const updateId = match.regulatoryUpdateId || match.regulatory_update_id
    const update = updateMap.get(String(updateId))
    return normalizeWatchListMatch({
      ...match,
      watch_list_id: match.watchListId,
      regulatory_update_id: updateId,
      match_score: match.matchScore,
      match_reasons: match.matchReasons,
      reviewed_at: match.reviewedAt,
      created_at: match.createdAt,
      headline: update?.headline,
      summary: update?.summary,
      ai_summary: update?.ai_summary,
      authority: update?.authority,
      sector: update?.sector,
      impact_level: update?.impactLevel || update?.impact_level,
      published_date: update?.publishedDate || update?.published_date || update?.fetchedDate || update?.createdAt,
      url: update?.url
    })
  })
}

async function createWatchListMatchJSON(service, watchListId, updateId, matchData) {
  const matches = await loadWatchListMatchesJSON(service)
  const now = new Date().toISOString()

  // Check for existing match
  const existingIndex = matches.findIndex(m =>
    String(m.watchListId) === String(watchListId) &&
    String(m.regulatoryUpdateId) === String(updateId)
  )

  const newMatch = {
    id: crypto.randomUUID ? crypto.randomUUID() : `wlm-${Date.now()}`,
    watchListId,
    regulatoryUpdateId: updateId,
    matchScore: matchData.matchScore || 0,
    matchReasons: matchData.matchReasons || {},
    reviewed: false,
    reviewedAt: null,
    dismissed: false,
    createdAt: now
  }

  if (existingIndex >= 0) {
    matches[existingIndex] = { ...matches[existingIndex], ...newMatch, id: matches[existingIndex].id }
  } else {
    matches.push(newMatch)
  }

  await saveWatchListMatchesJSON(service, matches)
  return newMatch
}

async function markWatchListMatchReviewedJSON(service, matchId) {
  const matches = await loadWatchListMatchesJSON(service)
  let reviewed = null

  const nextMatches = matches.map(m => {
    if (String(m.id) === String(matchId)) {
      reviewed = { ...m, reviewed: true, reviewedAt: new Date().toISOString() }
      return reviewed
    }
    return m
  })

  if (reviewed) await saveWatchListMatchesJSON(service, nextMatches)
  return reviewed
}

async function dismissWatchListMatchJSON(service, matchId) {
  const matches = await loadWatchListMatchesJSON(service)
  let dismissed = false

  const nextMatches = matches.map(m => {
    if (String(m.id) === String(matchId)) {
      dismissed = true
      return { ...m, dismissed: true }
    }
    return m
  })

  if (dismissed) await saveWatchListMatchesJSON(service, nextMatches)
  return dismissed
}

async function deleteWatchListMatchJSON(service, matchId) {
  const matches = await loadWatchListMatchesJSON(service)
  let deleted = null

  const nextMatches = matches.filter(m => {
    if (String(m.id) === String(matchId)) {
      deleted = m
      return false
    }
    return true
  })

  if (deleted) await saveWatchListMatchesJSON(service, nextMatches)
  return deleted
}

async function getMatchCountForWatchListJSON(service, watchListId) {
  const matches = await loadWatchListMatchesJSON(service)
  return matches.filter(m =>
    String(m.watchListId) === String(watchListId) && !m.dismissed
  ).length
}

async function getAllActiveWatchListsJSON(service) {
  const lists = await loadWatchListsJSON(service)
  return lists.filter(l => l.isActive !== false)
}

module.exports = {
  createWatchListJSON,
  createWatchListMatchJSON,
  deleteWatchListJSON,
  deleteWatchListMatchJSON,
  dismissWatchListMatchJSON,
  ensureWatchListsJSONFiles,
  getAllActiveWatchListsJSON,
  getMatchCountForWatchListJSON,
  getWatchListByIdJSON,
  getWatchListMatchesJSON,
  getWatchListsJSON,
  loadWatchListMatchesJSON,
  loadWatchListsJSON,
  markWatchListMatchReviewedJSON,
  saveWatchListMatchesJSON,
  saveWatchListsJSON,
  updateWatchListJSON
}
