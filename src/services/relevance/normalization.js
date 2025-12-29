const { normalizeSectorName } = require('../../utils/sectorTaxonomy')
const {
  createBehaviourWeightMap,
  normalizeBehaviourWeights
} = require('./weights')

function coerceArray(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

function normalizeProfileInput(profileInput) {
  if (!profileInput || typeof profileInput !== 'object') {
    return null
  }

  if (Array.isArray(profileInput.primarySectors)) {
    return {
      ...profileInput,
      primarySectors: profileInput.primarySectors
        .map(normalizeSectorName)
        .filter(Boolean),
      regions: coerceArray(profileInput.regions),
      personas: coerceArray(profileInput.personas).map(value => String(value).toLowerCase()),
      goals: coerceArray(profileInput.goals),
      serviceType: profileInput.serviceType || profileInput.firmType || null
    }
  }

  const serviceType = profileInput.serviceType || profileInput.firmType || 'general_financial_services'
  const sectors = [
    serviceType,
    ...coerceArray(profileInput.secondaryServiceTypes)
  ]
    .map(normalizeSectorName)
    .filter(Boolean)

  return {
    primarySectors: sectors,
    companySize: profileInput.companySize || profileInput.firmSize || null,
    regions: coerceArray(profileInput.regions),
    personas: coerceArray(profileInput.personas).map(value => String(value).toLowerCase()),
    goals: coerceArray(profileInput.goals),
    serviceType,
    relevanceOverrides: profileInput.relevanceOverrides || {}
  }
}

function normalizeRelevanceContext(context) {
  if (!context || typeof context !== 'object') {
    return {
      profile: normalizeProfileInput(context),
      behaviourWeights: createBehaviourWeightMap()
    }
  }

  const profileCandidate = context.profile !== undefined ? context.profile : context
  const profile = normalizeProfileInput(profileCandidate)
  const behaviourSource = context.behaviourWeights || context.behaviour || profileCandidate?.behaviourWeights || null
  const behaviourWeights = normalizeBehaviourWeights(behaviourSource)

  return { profile, behaviourWeights }
}

module.exports = {
  coerceArray,
  normalizeProfileInput,
  normalizeRelevanceContext
}
