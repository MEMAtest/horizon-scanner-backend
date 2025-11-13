const dbService = require('./dbService')
const intelligenceConfig = require('../config/intelligenceConfig')

function coerceArray(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(entry => String(entry || '').trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

function toProfileShape(record = {}, source = 'persisted') {
  return {
    id: record.id || null,
    userId: record.userId || 'default',
    serviceType: record.serviceType || 'general_financial_services',
    secondaryServiceTypes: coerceArray(record.secondaryServiceTypes),
    companySize: record.companySize || null,
    regions: coerceArray(record.regions),
    regulatoryPosture: record.regulatoryPosture || null,
    personas: coerceArray(record.personas),
    goals: coerceArray(record.goals),
    preferences: record.preferences && typeof record.preferences === 'object' ? record.preferences : {},
    isActive: record.isActive !== false,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
    source
  }
}

function slugify(value, fallback) {
  if (!value || typeof value !== 'string') return fallback
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback
}

class ProfileService {
  async getActiveProfile(userId = 'default') {
    const userKey = String(userId || 'default')

    const existing = await dbService.getUserProfile(userKey)
    if (existing) {
      return toProfileShape(existing)
    }

    const legacyProfile = await dbService.getFirmProfile().catch(() => null)
    if (legacyProfile) {
      const converted = this.convertLegacyProfile(legacyProfile)
      const saved = await dbService.saveUserProfile(userKey, converted)
      return toProfileShape(saved, 'legacy-migrated')
    }

    const defaults = await this.buildDefaultProfile()
    const savedDefault = await dbService.saveUserProfile(userKey, defaults)
    return toProfileShape(savedDefault, 'generated-default')
  }

  async saveProfile(userId = 'default', payload = {}) {
    const userKey = String(userId || 'default')
    const sanitized = toProfileShape(payload)
    const persisted = await dbService.saveUserProfile(userKey, sanitized)
    return toProfileShape(persisted)
  }

  async listProfiles(userId = null) {
    const profiles = await dbService.listUserProfiles(userId)
    return Array.isArray(profiles) ? profiles.map(profile => toProfileShape(profile)) : []
  }

  async clearProfiles(userId = 'default') {
    await dbService.clearUserProfiles(userId)
  }

  convertLegacyProfile(legacy = {}) {
    const primarySector = Array.isArray(legacy.primarySectors) && legacy.primarySectors.length
      ? slugify(legacy.primarySectors[0], 'general_financial_services')
      : 'general_financial_services'

    const preferences = {}
    if (legacy.firmName) preferences.firmName = legacy.firmName
    if (legacy.firmSize) preferences.legacyFirmSize = legacy.firmSize

    return {
      serviceType: primarySector,
      secondaryServiceTypes: Array.isArray(legacy.primarySectors) ? legacy.primarySectors.slice(1).map(sector => slugify(sector, null)).filter(Boolean) : [],
      companySize: legacy.firmSize || null,
      regions: coerceArray(legacy.regions),
      regulatoryPosture: legacy.regulatoryPosture || null,
      personas: coerceArray(legacy.personas),
      goals: [],
      preferences
    }
  }

  async buildDefaultProfile() {
    let defaults = {}
    try {
      defaults = await intelligenceConfig.getFirmProfileDefaults()
    } catch (error) {
      console.warn('⚠️ Using bare default profile configuration:', error.message)
    }

    const preferences = {
      riskAppetite: defaults.riskAppetite || 'medium',
      complianceMaturity: defaults.complianceMaturity || 50,
      relevanceThreshold: defaults.relevanceThreshold || 0.3,
      analysisDepth: defaults.analysisDepth || 'standard'
    }

    return {
      serviceType: 'general_financial_services',
      secondaryServiceTypes: [],
      companySize: null,
      regions: [],
      regulatoryPosture: null,
      personas: [],
      goals: [],
      preferences
    }
  }
}

module.exports = new ProfileService()
