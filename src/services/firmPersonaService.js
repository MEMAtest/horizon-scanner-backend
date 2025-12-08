/**
 * Firm Persona Service
 *
 * Handles persona selection, filtering, and relevance scoring.
 */

const dbService = require('./dbService')
const { getPersonaById, getAllPersonas, getPersonaSummaries, getMergedPersona } = require('../config/firmPersonas')

/**
 * Get all available persona presets
 */
function getPresets() {
  return getPersonaSummaries()
}

/**
 * Get a specific persona preset by ID
 */
function getPreset(personaId) {
  return getPersonaById(personaId)
}

/**
 * Get the active persona for a user
 * Returns the merged preset + custom config
 */
async function getUserPersona(userId) {
  if (!userId) return null

  try {
    const record = await dbService.getUserFirmPersona(userId)
    if (!record) return null

    const basePersona = getPersonaById(record.personaId)
    if (!basePersona) return null

    return getMergedPersona(basePersona, record.customConfig)
  } catch (error) {
    console.error('Error getting user persona:', error.message)
    return null
  }
}

/**
 * Set the active persona for a user
 */
async function setUserPersona(userId, personaId, customConfig = {}) {
  if (!userId || !personaId) {
    throw new Error('User ID and Persona ID are required')
  }

  const basePersona = getPersonaById(personaId)
  if (!basePersona) {
    throw new Error(`Invalid persona: ${personaId}`)
  }

  try {
    const record = await dbService.saveUserFirmPersona(
      userId,
      personaId,
      basePersona.name,
      customConfig
    )

    return getMergedPersona(basePersona, record.customConfig)
  } catch (error) {
    console.error('Error setting user persona:', error.message)
    throw error
  }
}

/**
 * Clear the user's persona selection
 */
async function clearUserPersona(userId) {
  if (!userId) return false

  try {
    return await dbService.clearUserFirmPersona(userId)
  } catch (error) {
    console.error('Error clearing user persona:', error.message)
    return false
  }
}

/**
 * Calculate relevance score for an update based on persona
 */
function calculateRelevanceScore(update, persona) {
  if (!update || !persona) return 0.5

  let score = 0.5 // Base score
  const boosts = persona.relevanceBoost || {}

  // Sector match (35% weight)
  const updateSector = (update.sector || update.sectors || '').toString().toLowerCase()
  for (const sector of (persona.sectors || [])) {
    if (updateSector.includes(sector.toLowerCase())) {
      const boost = boosts[sector] || 1.3
      score += 0.35 * (boost - 1)
      break
    }
  }

  // Regulator match (30% weight)
  const updateAuthority = (update.authority || update.source || '').toString().toLowerCase()
  for (const regulator of (persona.regulators || [])) {
    if (updateAuthority.includes(regulator.toLowerCase())) {
      const boost = boosts[regulator] || 1.25
      score += 0.30 * (boost - 1)
      break
    }
  }

  // Keyword match (20% weight)
  const updateText = `${update.headline || ''} ${update.title || ''} ${update.ai_summary || ''} ${update.summary || ''}`.toLowerCase()
  let keywordMatches = 0
  for (const keyword of (persona.keywords || [])) {
    if (updateText.includes(keyword.toLowerCase())) {
      keywordMatches++
    }
  }
  if (keywordMatches > 0) {
    score += Math.min(keywordMatches * 0.05, 0.20) // Cap at 20% boost
  }

  // Exclusion penalty
  for (const exclude of (persona.excludeKeywords || [])) {
    if (updateText.includes(exclude.toLowerCase())) {
      score *= 0.3 // Heavy penalty
      break
    }
  }

  // Impact boost for high-impact items (15% weight)
  const impactLevel = (update.impactLevel || update.impact_level || '').toLowerCase()
  if (['critical', 'significant', 'high'].includes(impactLevel)) {
    score += 0.15
  }

  return Math.min(Math.max(score, 0), 1.5) // Clamp between 0 and 1.5
}

/**
 * Apply persona filtering to a list of updates
 * Returns updates sorted by relevance score
 */
function applyPersonaFilter(updates, persona) {
  if (!updates || !Array.isArray(updates) || !persona) {
    return updates
  }

  // Score each update
  const scored = updates.map(update => ({
    ...update,
    personaRelevance: calculateRelevanceScore(update, persona)
  }))

  // Sort by relevance (high to low), then by date
  scored.sort((a, b) => {
    const relevanceDiff = b.personaRelevance - a.personaRelevance
    if (Math.abs(relevanceDiff) > 0.1) {
      return relevanceDiff
    }
    // Fall back to date sort
    const dateA = new Date(a.published_date || a.publishedDate || a.date || 0)
    const dateB = new Date(b.published_date || b.publishedDate || b.date || 0)
    return dateB - dateA
  })

  return scored
}

/**
 * Build filter criteria from a persona
 * Can be used to pre-filter database queries
 */
function buildFilterCriteria(persona) {
  if (!persona) return {}

  return {
    sectors: persona.sectors || [],
    authorities: persona.regulators || [],
    keywords: persona.keywords || [],
    excludeKeywords: persona.excludeKeywords || []
  }
}

/**
 * Get persona stats for a user
 */
async function getPersonaStats(userId, updates = []) {
  const persona = await getUserPersona(userId)
  if (!persona) return null

  const filteredUpdates = applyPersonaFilter(updates, persona)

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const highRelevance = filteredUpdates.filter(u => u.personaRelevance >= 0.7)
  const todayUpdates = filteredUpdates.filter(u => {
    const date = new Date(u.published_date || u.publishedDate || u.date)
    return date >= today
  })
  const weekUpdates = filteredUpdates.filter(u => {
    const date = new Date(u.published_date || u.publishedDate || u.date)
    return date >= weekAgo
  })

  return {
    persona: {
      id: persona.id,
      name: persona.name,
      color: persona.color,
      icon: persona.icon
    },
    stats: {
      totalRelevant: highRelevance.length,
      todayCount: todayUpdates.length,
      weekCount: weekUpdates.length
    }
  }
}

module.exports = {
  getPresets,
  getPreset,
  getUserPersona,
  setUserPersona,
  clearUserPersona,
  calculateRelevanceScore,
  applyPersonaFilter,
  buildFilterCriteria,
  getPersonaStats
}
