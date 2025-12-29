const dbService = require('../dbService')
const profileService = require('../profileService')
const { normalizeProfileInput } = require('./normalization')
const scoring = require('./scoring')
const deadlines = require('./deadlines')

class RelevanceService {
  constructor() {
    this.firmProfile = null
    this.lastProfileCheck = null
  }

  // ====== PROFILE MANAGEMENT (MAINTAINED) ======

  async getFirmProfile() {
    const now = Date.now()

    if (this.firmProfile && this.lastProfileCheck && (now - this.lastProfileCheck) < 300000) {
      return this.firmProfile
    }

    try {
      const activeProfile = await profileService.getActiveProfile('default')
      this.firmProfile = normalizeProfileInput(activeProfile)
      this.lastProfileCheck = now
      return this.firmProfile
    } catch (error) {
      console.error('❌ Error fetching firm profile:', error)
      try {
        const legacyProfile = await dbService.getFirmProfile()
        this.firmProfile = normalizeProfileInput(legacyProfile)
        this.lastProfileCheck = now
        return this.firmProfile
      } catch (legacyError) {
        console.error('❌ Legacy firm profile fallback failed:', legacyError)
      }
      return null
    }
  }

  invalidateProfileCache() {
    this.firmProfile = null
    this.lastProfileCheck = null
  }
}

Object.assign(RelevanceService.prototype, scoring, deadlines)

module.exports = new RelevanceService()
