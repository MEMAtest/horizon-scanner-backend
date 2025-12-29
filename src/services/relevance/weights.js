const BEHAVIOUR_WEIGHT_TYPES = ['authority', 'theme', 'persona', 'workflow_template']

function createBehaviourWeightMap() {
  return {
    authority: new Map(),
    theme: new Map(),
    persona: new Map(),
    workflow_template: new Map()
  }
}

function normalizeBehaviourWeights(input) {
  const weights = createBehaviourWeightMap()
  if (!input) return weights

  if (Array.isArray(input)) {
    input.forEach(entry => {
      if (!entry) return
      const entityType = String(entry.entityType || entry.entity_type || '').trim().toLowerCase()
      const entityId = String(entry.entityId || entry.entity_id || '').trim().toLowerCase()
      if (!entityId || !BEHAVIOUR_WEIGHT_TYPES.includes(entityType)) return
      const weight = Number(entry.weight || 0)
      if (!Number.isFinite(weight)) return
      weights[entityType].set(entityId, weight)
    })
    return weights
  }

  BEHAVIOUR_WEIGHT_TYPES.forEach(type => {
    const source = input[type]
    if (!source) return
    if (source instanceof Map) {
      source.forEach((value, key) => {
        if (key) weights[type].set(String(key).toLowerCase(), Number(value || 0))
      })
    } else if (typeof source === 'object') {
      Object.entries(source).forEach(([key, value]) => {
        if (!key) return
        weights[type].set(String(key).toLowerCase(), Number(value || 0))
      })
    }
  })

  return weights
}

function getBehaviourWeight(weights, type, key) {
  if (!key || !weights || !weights[type]) return 0
  const normalizedKey = String(key).trim().toLowerCase()
  return weights[type].get(normalizedKey) || 0
}

function convertWeightToBoost(weight) {
  if (!weight) return 0
  const scaled = Math.tanh(weight / 6)
  return scaled * 12
}

function extractUpdateThemes(update) {
  const themes = new Set()
  const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
  tags.forEach(tag => {
    if (!tag || typeof tag !== 'string') return
    const trimmed = tag.trim()
    if (!trimmed) return
    if (trimmed.startsWith('persona:')) return
    const theme = trimmed.includes(':') ? trimmed.split(':').pop() : trimmed
    if (theme) themes.add(theme.toLowerCase())
  })
  const explicitThemes = Array.isArray(update.themes) ? update.themes : []
  explicitThemes.forEach(theme => {
    if (!theme) return
    themes.add(String(theme).trim().toLowerCase())
  })
  if (update.theme) themes.add(String(update.theme).trim().toLowerCase())
  if (update.area) themes.add(String(update.area).trim().toLowerCase())
  if (update.sector) themes.add(String(update.sector).trim().toLowerCase())
  return Array.from(themes).filter(Boolean)
}

function extractUpdatePersonas(update) {
  if (Array.isArray(update.personas) && update.personas.length) {
    return update.personas.map(persona => String(persona).trim().toLowerCase()).filter(Boolean)
  }
  const tags = Array.isArray(update.ai_tags) ? update.ai_tags : []
  return tags
    .filter(tag => typeof tag === 'string' && tag.startsWith('persona:'))
    .map(tag => tag.split(':')[1])
    .filter(Boolean)
    .map(value => value.trim().toLowerCase())
}

function calculateBehaviourBoost(update, behaviourWeights) {
  if (!behaviourWeights) return 0
  let boost = 0

  const authority = update.authority || update.update_authority
  if (authority) {
    const weight = getBehaviourWeight(behaviourWeights, 'authority', authority)
    boost += convertWeightToBoost(weight)
  }

  extractUpdateThemes(update).forEach(theme => {
    const weight = getBehaviourWeight(behaviourWeights, 'theme', theme)
    boost += convertWeightToBoost(weight)
  })

  extractUpdatePersonas(update).forEach(persona => {
    const weight = getBehaviourWeight(behaviourWeights, 'persona', persona)
    boost += convertWeightToBoost(weight)
  })

  if (update.workflowTemplateId) {
    const weight = getBehaviourWeight(behaviourWeights, 'workflow_template', update.workflowTemplateId)
    boost += convertWeightToBoost(weight)
  }

  return Math.max(-15, Math.min(15, boost))
}

module.exports = {
  BEHAVIOUR_WEIGHT_TYPES,
  calculateBehaviourBoost,
  convertWeightToBoost,
  createBehaviourWeightMap,
  extractUpdatePersonas,
  extractUpdateThemes,
  getBehaviourWeight,
  normalizeBehaviourWeights
}
